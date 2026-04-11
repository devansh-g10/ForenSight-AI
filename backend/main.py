"""
ForenSight AI - FastAPI Backend Server v2.0
============================================
Endpoints:
  POST /api/analyze           — Full 4-agent + Grad-CAM pipeline
  POST /api/analyze/image     — Image forensics + Grad-CAM only
  POST /api/blockchain/register  — Register document hash on ledger
  POST /api/blockchain/verify    — Verify document against ledger
  GET  /api/blockchain/chain     — Chain integrity + Merkle root
  GET  /api/blockchain/ledger    — Ledger stats summary
  GET  /api/demo/{preset}        — Demo scenario (Phase 7)
  GET  /api/demo                 — List all demo presets
  GET  /api/health               — System health check
"""

import asyncio
import io
import time
import uuid
import base64
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import fitz  # PyMuPDF for PDF support

# ForenSight Agents
from agents import ocr_agent, image_forensics_agent, signature_agent, decision_engine
from agents import gradcam_agent

# Utilities
from utils import blockchain
from utils.demo_presets import get_demo, list_demos

# ── App Setup ──────────────────────────────────────────────
app = FastAPI(
    title="ForenSight AI",
    description="Advanced Multi-Modal Explainable AI Forensic Suite for Document Forgery Detection",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://*.vercel.app", # Flexibility for Vercel previews
        "*"                      # Fallback for hackathon testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

executor = ThreadPoolExecutor(max_workers=6)


# ── Helpers ────────────────────────────────────────────────

def load_image(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert("RGB")

def image_to_b64(image: Image.Image, max_w: int = 800) -> str:
    if image.width > max_w:
        ratio = max_w / image.width
        image = image.resize((max_w, int(image.height * ratio)), Image.LANCZOS)
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()

async def run_thread(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, fn, *args)


# ── Health ─────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "version": "2.0.0",
        "agents": ["OCR Parse", "Image Forensics", "Signature Match", "Decision Engine", "Grad-CAM XAI"],
        "phase5": "Grad-CAM (ResNet50) — Active",
        "phase7": "Demo Presets (6 scenarios) + Blockchain Hashing — Active",
        "encryption": "AES-256",
        "blockchain": "SHA-256 + Merkle Tree",
    }


# ── Full Analysis Pipeline ──────────────────────────────────

@app.post("/api/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    reference_signature: UploadFile = File(None),
    doc_type: str = Form("auto"),
    run_gradcam: str = Form("true"),
    register_blockchain: str = Form("false"),
):
    """
    Full multi-agent forensic pipeline:
    OCR + Image Forensics + Signature + Grad-CAM + Decision Engine
    """
    case_id = f"CASE-#{str(uuid.uuid4())[:6].upper()}"
    start = time.time()

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 20MB.")

    content_type = file.content_type
    image = None

    try:
        if content_type == "application/pdf" or file.filename.lower().endswith(".pdf"):
            # PDF handling — Convert first page to Image
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page = doc.load_page(0)  # load the first page
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # upscale for higher OCR quality
            image_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            doc.close()
        elif content_type.startswith("image/") or file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            image = load_image(file_bytes)
        else:
            raise HTTPException(400, f"Unsupported file type: {content_type}. Use JPG, PNG, or PDF.")
    except Exception as e:
        raise HTTPException(400, f"Could not process file: {str(e)}")

    if not image:
        raise HTTPException(400, "Failed to extract image from file.")

    ref_sig = None
    if reference_signature:
        ref_bytes = await reference_signature.read()
        try:
            ref_sig = load_image(ref_bytes)
        except Exception:
            pass

    # ── Phase 1-4: Agents in parallel
    ocr_task = run_thread(ocr_agent.run, image.copy())
    img_task = run_thread(image_forensics_agent.run, image.copy())
    sig_task = run_thread(signature_agent.run, image.copy(), ref_sig)

    ocr_result, img_result, sig_result = await asyncio.gather(ocr_task, img_task, sig_task)

    # ── Phase 5: Grad-CAM
    gradcam_result = {"status": "skipped"}
    if run_gradcam.lower() == "true":
        ela_score = img_result.get("ela_score", 0.0)
        gradcam_result = await run_thread(gradcam_agent.run, image.copy(), ela_score)

    # ── Decision Engine
    decision_result = await run_thread(
        decision_engine.run, image.copy(), img_result, ocr_result, sig_result, gradcam_result
    )

    elapsed = round(time.time() - start, 3)

    # ── Phase 7: Blockchain registration
    chain_block = None
    if register_blockchain.lower() == "true":
        chain_block = blockchain.register_document(
            file_bytes=file_bytes,
            filename=file.filename,
            doc_type=doc_type,
            verdict=decision_result["verdict"],
            case_id=case_id,
        )

    return JSONResponse({
        "case_id": case_id,
        "filename": file.filename,
        "doc_type": doc_type,
        "scan_time_seconds": elapsed,
        "original_image_b64": image_to_b64(image),
        "verdict": decision_result["verdict"],
        "verdict_color": decision_result["verdict_color"],
        "composite_integrity_score": decision_result["composite_integrity_score"],
        "confidence_percent": decision_result["confidence_percent"],
        "agent_scores": decision_result["agent_scores"],
        "xai_explanations": decision_result["xai_explanations"],
        "all_flags": decision_result["all_flags"],
        "heatmap_b64": decision_result.get("heatmap_b64"),
        "ela_image_b64": img_result.get("ela_image_b64"),
        "gradcam": gradcam_result,
        "blockchain_block": chain_block,
        "agents": {
            "ocr": ocr_result,
            "image_forensics": img_result,
            "signature": sig_result,
            "decision": decision_result,
        },
    })


# ── Image-Only (Grad-CAM focus) ─────────────────────────────

@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    file_bytes = await file.read()
    try:
        image = load_image(file_bytes)
    except Exception as e:
        raise HTTPException(400, f"Could not read image: {e}")

    img_result, gradcam_result = await asyncio.gather(
        run_thread(image_forensics_agent.run, image.copy()),
        run_thread(gradcam_agent.run, image.copy(), 0.0),
    )
    return JSONResponse({"image_forensics": img_result, "gradcam": gradcam_result})


# ── Blockchain Endpoints ────────────────────────────────────

@app.post("/api/blockchain/register")
async def blockchain_register(file: UploadFile = File(...), doc_type: str = Form("unknown"), verdict: str = Form("UNKNOWN")):
    """Register a document hash on the blockchain ledger."""
    file_bytes = await file.read()
    block = blockchain.register_document(
        file_bytes=file_bytes,
        filename=file.filename,
        doc_type=doc_type,
        verdict=verdict,
    )
    return JSONResponse({"success": True, "block": block})


@app.post("/api/blockchain/verify")
async def blockchain_verify(file: UploadFile = File(...)):
    """Verify if a document exists in the blockchain ledger."""
    file_bytes = await file.read()
    result = blockchain.verify_document(file_bytes)
    return JSONResponse(result)


@app.get("/api/blockchain/chain")
async def blockchain_chain():
    """Returns chain integrity report and Merkle root."""
    return JSONResponse(blockchain.verify_chain_integrity())


@app.get("/api/blockchain/ledger")
async def blockchain_ledger():
    """Returns ledger statistics."""
    return JSONResponse(blockchain.get_ledger_summary())


# ── Demo Presets (Phase 7) ──────────────────────────────────

@app.get("/api/demo")
async def list_demo_presets():
    """List all available demo presets."""
    return JSONResponse({"presets": list_demos()})


@app.get("/api/demo/{preset_id}")
async def get_demo_preset(preset_id: str):
    """Returns a full pre-built demo forensic result."""
    data = get_demo(preset_id)
    if not data:
        raise HTTPException(404, detail=f"Demo '{preset_id}' not found. Use /api/demo to list available presets.")
    return JSONResponse(data)


# ── Entry Point ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
