"""
ForenSight AI - Demo Presets Module (Phase 7)
=============================================
Pre-built rich demo scenarios for live hackathon presentation.
Includes realistic forensic data, Grad-CAM simulation metadata,
and blockchain hash entries.

Presets:
  1. aadhaar_photo_swap    - Photo substitution in Aadhaar card
  2. degree_marks_tampered - Marks/grade alteration in certificate
  3. resume_exp_forged     - Forged work experience in resume
  4. cheque_sig_forged     - Signature forgery on bank cheque
  5. pan_authentic         - Clean authentic PAN card
  6. passport_cloned       - Cloned passport photo section
"""

DEMO_SCENARIOS = {
    "aadhaar_photo_swap": {
        "case_id": "CASE-#D001",
        "filename": "Aadhaar_Rajesh_Kumar.jpg",
        "doc_type": "Aadhaar Card",
        "scan_time_seconds": 1.34,
        "verdict": "FORGED",
        "verdict_color": "red",
        "composite_integrity_score": 21.8,
        "confidence_percent": 96.4,
        "agent_scores": {
            "image_forensics": 15.0,
            "ocr_text": 28.0,
            "signature": 22.5,
        },
        "gradcam_data": {
            "hotspot_regions": [
                {"x": 18, "y": 22, "w": 80, "h": 100, "importance": 0.92, "severity": "HIGH", "label": "Photo region — CNN detects boundary artifacts from cut-paste operation"},
                {"x": 120, "y": 180, "w": 160, "h": 25, "importance": 0.71, "severity": "HIGH", "label": "Date of Birth field — font weight inconsistency vs surrounding text"},
                {"x": 90, "y": 230, "w": 200, "h": 20, "importance": 0.54, "severity": "MEDIUM", "label": "Address block — minor spacing anomaly detected"},
            ],
            "xai_summary": "ResNet50 concentrates 78% of activation energy on the photograph region. Grad-CAM confirms CNN detects paste boundaries around the biometric photo. DOB field shows secondary activation spike consistent with digit substitution.",
            "gradcam_integrity_score": 18.0,
        },
        "xai_explanations": [
            "🔬 ELA score 22.4 (critical threshold: 8.0) — JPEG re-compression artifacts form a clean rectangle around the photo zone. This pattern is the forensic signature of a cut-paste photo replacement.",
            "🧠 Grad-CAM (ResNet50): 78% of CNN activation energy concentrated on the biometric photo boundary. The network's attention confirms structural discontinuity at the photo perimeter.",
            "📝 OCR detected font-weight inconsistency in DOB field ('1990' shows 2.3x higher pixel density than surrounding text) — consistent with digital number substitution.",
            "📐 Noise consistency score 41.2 — photo region exhibits ISO 800 noise profile while document background shows ISO 200 pattern. Different camera sources confirmed.",
        ],
        "all_flags": [
            "CRITICAL: ELA score 22.4 — well above forgery threshold of 8.0",
            "CRITICAL: Grad-CAM HIGH activation at photo boundary (0.92 importance)",
            "HIGH: Noise profile mismatch — photo ISO 800 vs document ISO 200",
            "MEDIUM: DOB font-weight 2.3x denser than baseline — possible digit edit",
            "MEDIUM: Canny edge detection found unnatural sharp boundary at photo perimeter",
        ],
        "blockchain": {
            "document_hash": "a3f9c821b4e67d092f1c5e83a9d4b7261f0e38c9d5a214b8e7f6031c9d2a5b84",
            "registered": False,
            "block_index": None,
            "message": "Document NOT found in blockchain ledger — unverified origin.",
        },
        "demo_mode": True,
    },

    "degree_marks_tampered": {
        "case_id": "CASE-#D002",
        "filename": "BTech_Degree_Certificate_VTU_2021.pdf",
        "doc_type": "Degree Certificate",
        "scan_time_seconds": 1.87,
        "verdict": "FORGED",
        "verdict_color": "red",
        "composite_integrity_score": 30.5,
        "confidence_percent": 93.2,
        "agent_scores": {
            "image_forensics": 38.0,
            "ocr_text": 22.0,
            "signature": 31.5,
        },
        "gradcam_data": {
            "hotspot_regions": [
                {"x": 280, "y": 310, "w": 120, "h": 30, "importance": 0.88, "severity": "HIGH", "label": "CGPA/Marks field — highest CNN activation; font embedding vector mismatch"},
                {"x": 180, "y": 420, "w": 200, "h": 28, "importance": 0.79, "severity": "HIGH", "label": "Registrar signature — ORB match 22% vs authentic baseline"},
                {"x": 10, "y": 10, "w": 100, "h": 60, "importance": 0.61, "severity": "MEDIUM", "label": "University seal — slight rotation inconsistency vs official template"},
            ],
            "xai_summary": "Grad-CAM identifies the CGPA field as the primary manipulation zone with 0.88 importance score. Secondary activation at registrar signature confirms multi-point tampering — both grades AND signature were altered.",
            "gradcam_integrity_score": 28.0,
        },
        "xai_explanations": [
            "🧠 Grad-CAM (ResNet50): Maximum activation (0.88) at CGPA/marks field. Network trained on authentic certificates identifies this region as structurally inconsistent with real VTU documents.",
            "📝 OCR Multi-Font Analysis: Marks field uses 'Helvetica Neue Bold' while adjacent text uses 'Times New Roman' — two distinct fonts within one printed document indicate digital text injection.",
            "✍️ Registrar signature ORB match: 22 of 147 keypoints matched reference database (15% match rate). Threshold for authentic: 70%. Verdict: FORGERY with 93.2% confidence.",
            "🔬 ELA analysis shows clean paper baseline (score: 3.1) but anomalous ELA spike at marks row — localized re-editing while keeping rest of document intact.",
        ],
        "all_flags": [
            "CRITICAL: Grad-CAM HIGH activation at CGPA field (importance: 0.88)",
            "CRITICAL: Registrar signature ORB match 15% — forgery threshold <30%",
            "HIGH: Font mismatch detected — CGPA uses different typeface than rest of certificate",
            "MEDIUM: University seal rotation 2.3° off-axis vs official template",
            "MEDIUM: OCR confidence variance 1124 — above normal range of 400",
        ],
        "blockchain": {
            "document_hash": "7d2f8a14c93e5b076f4d29a1e8c51b3497f2e60d8b3a175c9e4f028d7c6b1a93",
            "registered": False,
            "block_index": None,
            "message": "Certificate hash NOT in blockchain. University registry verification failed.",
        },
        "demo_mode": True,
    },

    "resume_exp_forged": {
        "case_id": "CASE-#D003",
        "filename": "Resume_Arjun_Sharma_SDE.pdf",
        "doc_type": "Resume / CV",
        "scan_time_seconds": 0.94,
        "verdict": "SUSPICIOUS",
        "verdict_color": "yellow",
        "composite_integrity_score": 52.3,
        "confidence_percent": 81.7,
        "agent_scores": {
            "image_forensics": 71.0,
            "ocr_text": 38.0,
            "signature": 48.0,
        },
        "gradcam_data": {
            "hotspot_regions": [
                {"x": 40, "y": 280, "w": 350, "h": 40, "importance": 0.76, "severity": "HIGH", "label": "Work experience dates — spacing inconsistency in date ranges"},
                {"x": 40, "y": 195, "w": 200, "h": 25, "importance": 0.59, "severity": "MEDIUM", "label": "Company name field — kerning deviation from surrounding text"},
            ],
            "xai_summary": "Grad-CAM focuses on the work experience section. Date inconsistency is primary flag — '2019–2023' in the same field shows two different font rendering engines (PDF vector vs rasterized text).",
            "gradcam_integrity_score": 55.0,
        },
        "xai_explanations": [
            "📝 NLP Analysis: Work experience section contains date formatting inconsistency. '2019' uses PDF vector font embedding; '2023' shows rasterization artifacts suggesting a different text source was merged.",
            "🧠 Grad-CAM (ResNet50): Work experience date range receives MEDIUM-HIGH activation (0.76). CNN detects rendering engine mismatch — two text layers with different anti-aliasing signatures.",
            "🔬 Image forensics clean (score: 71) — no pixel-level manipulation. The tampering is text-layer based, not image-level, suggesting PDF source editing rather than screenshot manipulation.",
        ],
        "all_flags": [
            "HIGH: Grad-CAM detects date range rendering engine mismatch in work experience",
            "HIGH: NLP detects font embedding inconsistency — two text sources in one document",
            "MEDIUM: Company name kerning 1.8px wider than surrounding text baseline",
        ],
        "blockchain": {
            "document_hash": "f4e2d9b17c835a06e9d3f84b2c17e50a93d6b28f4c1e73d9a50b82c64f193e20",
            "registered": False,
            "message": "Resume not in employer verification blockchain.",
        },
        "demo_mode": True,
    },

    "cheque_sig_forged": {
        "case_id": "CASE-#D004",
        "filename": "HDFC_Cheque_Seq_002847.jpg",
        "doc_type": "Bank Cheque",
        "scan_time_seconds": 1.12,
        "verdict": "FORGED",
        "verdict_color": "red",
        "composite_integrity_score": 24.1,
        "confidence_percent": 91.8,
        "agent_scores": {
            "image_forensics": 74.0,
            "ocr_text": 68.0,
            "signature": 8.0,
        },
        "gradcam_data": {
            "hotspot_regions": [
                {"x": 220, "y": 180, "w": 180, "h": 60, "importance": 0.95, "severity": "HIGH", "label": "Signature box — 95% activation; Siamese network finds near-zero similarity to reference"},
                {"x": 60, "y": 100, "w": 100, "h": 25, "importance": 0.42, "severity": "LOW", "label": "Amount field — minor OCR confidence dip, non-critical"},
            ],
            "xai_summary": "Maximum Grad-CAM activation (0.95) concentrated exclusively on the signature region. Image forensics and OCR show clean results — the only forgery is the hand signature. Siamese network match: 8%.",
            "gradcam_integrity_score": 12.0,
        },
        "xai_explanations": [
            "✍️ Siamese Network Signature Match: 8.3% similarity to reference cheque signature on file. ORB matches only 7 of 94 keypoints. Hausdorff distance: 38.2 (authentic threshold: <8). DEFINITIVE FORGERY.",
            "🧠 Grad-CAM shows 95% of network attention on signature box with near-zero attention on rest of cheque — network has isolated the forgery location with high precision.",
            "🔬 Cheque image forensics: ELA score 1.8 (clean) — the signature was written physically on the cheque, not digitally inserted. This is a skilled hand-forged signature, not a digital paste.",
        ],
        "all_flags": [
            "CRITICAL: Signature match 8.3% — below 30% forgery threshold",
            "CRITICAL: Grad-CAM peak activation (0.95) at signature field",
            "CRITICAL: Hausdorff distance 38.2 vs authentic threshold of 8.0",
            "CRITICAL: ORB keypoint match 7/94 (7.4% match rate)",
        ],
        "blockchain": {
            "document_hash": "2b9c4f73a18d650e7c3b92f4d18e5a730f8d29c4b52e71a390c68f4d2b83c912",
            "registered": True,
            "block_index": 3,
            "block_hash": "9a3f8c021d4e76b9f2c5a18d73e60b4219f5d083c7a2b945e8f1034c6d7b2941",
            "message": "⚠️ Document registered in blockchain with FORGED verdict. Law enforcement reported case #CR-2024-089241.",
        },
        "demo_mode": True,
    },

    "pan_authentic": {
        "case_id": "CASE-#D005",
        "filename": "PAN_Priya_Mehta_ABCDE1234F.jpg",
        "doc_type": "PAN Card",
        "scan_time_seconds": 1.09,
        "verdict": "AUTHENTIC",
        "verdict_color": "green",
        "composite_integrity_score": 93.7,
        "confidence_percent": 97.4,
        "agent_scores": {
            "image_forensics": 94.0,
            "ocr_text": 92.0,
            "signature": 95.1,
        },
        "gradcam_data": {
            "hotspot_regions": [
                {"x": 20, "y": 18, "w": 70, "h": 85, "importance": 0.32, "severity": "LOW", "label": "Photo region — LOW activation. No boundary artifacts. Authentic camera embedding confirmed."},
            ],
            "xai_summary": "Grad-CAM shows distributed, low-intensity activation across the document — no concentrated hotspots. This activation pattern is characteristic of authentic documents where no single region is anomalous.",
            "gradcam_integrity_score": 95.0,
        },
        "xai_explanations": [
            "✅ ELA score 1.9 (well below threshold of 8.0) — uniform JPEG compression throughout document. No re-editing artifacts detected.",
            "✅ OCR confidence 88.4% average with variance of 112 (below alert threshold of 400). All text fields use consistent Times New Roman government typeface.",
            "✅ Grad-CAM shows no concentrated anomaly region. Distributed low-intensity attention pattern is the forensic hallmark of unaltered documents.",
            "✅ Noise profile: ISO 200 uniform throughout — single-capture origin confirmed. No compositing or multi-source assembly detected.",
        ],
        "all_flags": [],
        "blockchain": {
            "document_hash": "e8f3a190d72b6c4e53a8b072f4c19d60e73a285b4c17f90d5e2b831c9f4d072a",
            "registered": True,
            "block_index": 12,
            "block_hash": "4f1d8c73b29a50e61c7f93d28b4e17a0c52d896f3b4820e7d93c15f08a6d4b27",
            "message": "✅ Document hash verified in ForenSight blockchain ledger. Block #12. Registered on 2024-11-14.",
        },
        "demo_mode": True,
    },

    "passport_cloned": {
        "case_id": "CASE-#D006",
        "filename": "Passport_Clone_P1234567.jpg",
        "doc_type": "Passport",
        "scan_time_seconds": 2.01,
        "verdict": "FORGED",
        "verdict_color": "red",
        "composite_integrity_score": 19.2,
        "confidence_percent": 97.9,
        "agent_scores": {
            "image_forensics": 12.0,
            "ocr_text": 31.0,
            "signature": 14.6,
        },
        "gradcam_data": {
            "hotspot_regions": [
                {"x": 22, "y": 20, "w": 90, "h": 115, "importance": 0.97, "severity": "HIGH", "label": "Biometric photo — highest possible CNN activation. Clone boundary detected with sub-pixel precision."},
                {"x": 130, "y": 275, "w": 260, "h": 18, "importance": 0.83, "severity": "HIGH", "label": "MRZ line 1 — Machine Readable Zone character spacing inconsistency"},
                {"x": 130, "y": 298, "w": 260, "h": 18, "importance": 0.79, "severity": "HIGH", "label": "MRZ line 2 — Checksum digit mismatch with OCR-extracted fields"},
            ],
            "xai_summary": "Grad-CAM reaches maximum theoretical activation (0.97) at the biometric photo with 3 HIGH-severity regions. MRZ checksum failure is independent mathematical proof of tampering — the forged fields do not match the MRZ computations.",
            "gradcam_integrity_score": 8.0,
        },
        "xai_explanations": [
            "🧠 Grad-CAM MAXIMUM ACTIVATION (0.97) at biometric photo — ResNet50 has detected sub-pixel boundary artifacts from a cloning operation. This is the highest severity score in our forensic database.",
            "🔬 ELA score 31.7 (record high) — severe JPEG re-compression at photo, MRZ, and name zones indicates three independent editing sessions on this document.",
            "📝 MRZ Checksum Failure: Mathematical verification of the Machine Readable Zone shows surname checksum = '4' but computed checksum from OCR-extracted name = '7'. Checksum mismatch is absolute proof of data alteration.",
            "✍️ Holder signature ORB match: 3.1% vs reference — near-zero similarity confirming identity theft scenario.",
        ],
        "all_flags": [
            "CRITICAL: ELA score 31.7 — highest severity in recent database",
            "CRITICAL: Grad-CAM activation 0.97 — maximum possible, biometric cloning confirmed",
            "CRITICAL: MRZ checksum FAILED — mathematical proof of data tampering",
            "CRITICAL: 3 independent HIGH-severity regions — multi-point forgery",
            "CRITICAL: Signature match 3.1% — identity theft scenario",
        ],
        "blockchain": {
            "document_hash": "c1d9f4720e83b561a4c2d07f93e18b40d5c7f293b41e800d6c59f27a3b18d460",
            "registered": True,
            "block_index": 7,
            "message": "⚠️ This passport hash is registered as a KNOWN FORGED DOCUMENT. Flagged by Interpol ID-Fraud database.",
        },
        "demo_mode": True,
    },
}


def get_demo(preset_id: str) -> dict | None:
    """Returns a demo scenario by ID."""
    return DEMO_SCENARIOS.get(preset_id)


def list_demos() -> list[dict]:
    """Returns metadata list of all available demos."""
    return [
        {
            "id": k,
            "filename": v["filename"],
            "doc_type": v["doc_type"],
            "verdict": v["verdict"],
            "confidence_percent": v["confidence_percent"],
        }
        for k, v in DEMO_SCENARIOS.items()
    ]
