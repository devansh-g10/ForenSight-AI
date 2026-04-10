"""
ForenSight AI - Decision Engine (XAI)
Phase 5 & 6: Explainable AI + Multi-Agent Orchestration
- Combines all agent scores into a final weighted verdict
- Generates Grad-CAM style heatmap overlay for visualization
- Provides natural language explanation of the forgery verdict
- Confidence calibration based on multi-agent agreement
"""

import io
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2
import base64


# Agent weights for final verdict calculation
AGENT_WEIGHTS = {
    "image_forensics": 0.40,   # Highest weight — pixel-level evidence
    "ocr_text": 0.30,          # Text anomalies are strong indicators
    "signature": 0.30,         # Signature analysis
}

VERDICT_THRESHOLDS = {
    "AUTHENTIC": 78,
    "SUSPICIOUS": 55,
    "FORGED": 0            # Below 55 = forged
}


def _generate_ela_heatmap(image: Image.Image, ela_score: float) -> str:
    """
    Generates a colored heatmap overlay on the original image
    to highlight suspicious regions (Grad-CAM style visualization).
    Returns base64 encoded image.
    """
    try:
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize for processing
        img_array = np.array(image.resize((600, int(600 * image.height / image.width))))
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

        # Compute ELA map inline
        pil_img = Image.fromarray(img_array)
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=75)
        buf.seek(0)
        recompressed = np.array(Image.open(buf).convert("RGB"))

        ela_map = np.abs(img_array.astype(np.float32) - recompressed.astype(np.float32))
        ela_gray = np.mean(ela_map, axis=2).astype(np.uint8)

        # Normalize and apply colormap (hot = red for suspicious regions)
        ela_normalized = cv2.normalize(ela_gray, None, 0, 255, cv2.NORM_MINMAX)
        heatmap = cv2.applyColorMap(ela_normalized.astype(np.uint8), cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

        # Blend original with heatmap
        alpha = min(0.7, ela_score / 20)  # Higher ELA = more visible heatmap
        blended = cv2.addWeighted(img_array, 1 - alpha, heatmap_rgb, alpha, 0)

        # Encode to base64
        pil_result = Image.fromarray(blended.astype(np.uint8))
        buf2 = io.BytesIO()
        pil_result.save(buf2, format="JPEG", quality=85)
        return base64.b64encode(buf2.getvalue()).decode("utf-8")

    except Exception:
        return None


def _generate_verdict_explanation(
    composite_score: float,
    image_integrity: float,
    text_integrity: float, 
    sig_integrity: float,
    anomaly_flags: list
) -> list:
    """
    Generates human-readable XAI explanations for the verdict.
    Returns list of explanation strings.
    """
    explanations = []

    if image_integrity < 60:
        explanations.append(
            f"🔬 Image forensics detected ELA anomalies (score: {100 - image_integrity:.0f}/100 severity). "
            "JPEG re-compression artifacts suggest portions of this image were digitally altered."
        )
    if text_integrity < 60:
        explanations.append(
            f"📝 OCR analysis found low-confidence text regions (integrity: {text_integrity:.0f}/100). "
            "This pattern is consistent with superimposed or digitally altered text fields."
        )
    if sig_integrity < 60:
        explanations.append(
            f"✍️ Signature verification failed (integrity: {sig_integrity:.0f}/100). "
            "The signature characteristics do not match expected patterns for this document type."
        )

    if not explanations:
        if composite_score > 90:
            explanations.append("✅ All forensic modules report high confidence. No anomalies detected across pixel, text, or signature layers.")
        else:
            explanations.append("⚠️ Minor inconsistencies detected but insufficient for definitive forgery classification. Manual review recommended.")

    return explanations


def run(
    image: Image.Image,
    image_forensics_result: dict,
    ocr_result: dict,
    signature_result: dict,
) -> dict:
    """
    Decision Engine: Combines all agent results into final verdict.
    """
    result = {
        "agent": "Decision Engine",
        "status": "completed",
        "composite_integrity_score": 0.0,
        "verdict": "ANALYZING",
        "confidence_percent": 0.0,
        "verdict_color": "yellow",
        "heatmap_b64": None,
        "xai_explanations": [],
        "all_flags": [],
        "agent_scores": {},
    }

    try:
        # Extract individual integrity scores
        image_integrity = image_forensics_result.get("image_integrity_score", 70.0)
        text_integrity = ocr_result.get("text_integrity_score", 70.0)
        sig_integrity = signature_result.get("signature_integrity_score", 70.0)

        result["agent_scores"] = {
            "image_forensics": round(image_integrity, 2),
            "ocr_text": round(text_integrity, 2),
            "signature": round(sig_integrity, 2),
        }

        # Weighted composite score
        composite = (
            image_integrity * AGENT_WEIGHTS["image_forensics"] +
            text_integrity * AGENT_WEIGHTS["ocr_text"] +
            sig_integrity * AGENT_WEIGHTS["signature"]
        )
        result["composite_integrity_score"] = round(composite, 2)

        # Verdict classification
        if composite >= VERDICT_THRESHOLDS["AUTHENTIC"]:
            result["verdict"] = "AUTHENTIC"
            result["verdict_color"] = "green"
            result["confidence_percent"] = round(min(99, composite), 1)
        elif composite >= VERDICT_THRESHOLDS["SUSPICIOUS"]:
            result["verdict"] = "SUSPICIOUS"
            result["verdict_color"] = "yellow"
            result["confidence_percent"] = round(min(99, (80 - composite) * 2), 1)
        else:
            result["verdict"] = "FORGED"
            result["verdict_color"] = "red"
            result["confidence_percent"] = round(min(99, 100 - composite), 1)

        # Collect all flags
        all_flags = (
            image_forensics_result.get("anomaly_flags", []) +
            ocr_result.get("anomaly_flags", []) +
            signature_result.get("anomaly_flags", [])
        )
        result["all_flags"] = all_flags

        # Generate Heatmap (XAI visualization)
        ela_score = image_forensics_result.get("ela_score", 5.0)
        result["heatmap_b64"] = _generate_ela_heatmap(image, ela_score)

        # Generate natural language explanations
        result["xai_explanations"] = _generate_verdict_explanation(
            composite, image_integrity, text_integrity, sig_integrity, all_flags
        )

    except Exception as e:
        result["status"] = "error"
        result["verdict"] = "ERROR"
        result["xai_explanations"] = [f"Decision engine error: {str(e)}"]

    return result
