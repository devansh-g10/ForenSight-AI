"""
ForenSight AI - OCR Agent
Phase 3: Text Intelligence & NLP
- Extracts text using Tesseract OCR
- Detects font inconsistencies, spacing anomalies
- Checks for watermark/official text patterns
"""

import re
import pytesseract
from PIL import Image
import numpy as np
from pathlib import Path


# Optional: set path if Tesseract not in PATH  
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


OFFICIAL_KEYWORDS = [
    "government", "university", "board", "ministry", "certificate",
    "aadhaar", "unique identification", "degree", "awarded", "registrar",
    "principal", "director", "issued", "verified", "authenticated",
    "uidai", "mera aadhaar", "meri pehchaan"
]

SUSPICIOUS_PATTERNS = [
    r"\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b",   # dates - check consistency
    r"\b[A-Z]{4}\d{4}[A-Z]\b",             # PAN card format
    r"\b\d{12}\b",                          # Continuous Aadhaar number (suspicious format)
    r"\b\d{4}\s\d{4}\s\d{4}\b",             # Properly spaced Aadhaar number
    r"\b\d{2}\/\d{2}\/\d{4}\b",            # date patterns
]


def run(image: Image.Image) -> dict:
    """
    Main OCR Agent runner.
    Returns extracted text, anomaly flags, and confidence score.
    """
    result = {
        "agent": "OCR Parse",
        "status": "completed",
        "extracted_text": "",
        "word_count": 0,
        "has_official_keywords": False,
        "suspicious_patterns_found": [],
        "text_density_score": 0.0,
        "anomaly_flags": [],
        "text_integrity_score": 100.0,
        "confidence": 0.0,
        "document_type": "Unknown",
    }

    try:
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Run OCR with detailed output
        ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        full_text = pytesseract.image_to_string(image).strip()

        result["extracted_text"] = full_text
        result["word_count"] = len(full_text.split())

        # Check for official keywords
        lower_text = full_text.lower()
        found_keywords = [kw for kw in OFFICIAL_KEYWORDS if kw in lower_text]
        result["has_official_keywords"] = len(found_keywords) > 0

        # Find suspicious patterns
        for pattern in SUSPICIOUS_PATTERNS:
            matches = re.findall(pattern, full_text)
            if matches:
                result["suspicious_patterns_found"].extend(matches[:3])

        # Confidence analysis from OCR data
        confidences = [c for c in ocr_data["conf"] if c != -1]
        avg_conf = np.mean(confidences) if confidences else 0
        result["confidence"] = float(avg_conf)

        # Text density anomaly: low confidence areas = potential tampering
        low_conf_blocks = [c for c in confidences if 0 < c < 30]
        low_conf_ratio = len(low_conf_blocks) / max(len(confidences), 1)

        # Calculate text integrity score
        penalty = low_conf_ratio * 40  # up to 40 point penalty for low-conf blocks
        if avg_conf < 40:
            penalty += 15
            result["anomaly_flags"].append("Critically low OCR confidence — possible blur or print manipulation")
        elif avg_conf < 60:
            penalty += 8
            result["anomaly_flags"].append("Below-average OCR confidence detected in text blocks")

        if low_conf_ratio > 0.3:
            result["anomaly_flags"].append(f"~{int(low_conf_ratio*100)}% text blocks have low legibility (possible overlay/edit)")

        # Font variation check (word-level confidence variance)
        if len(confidences) > 5:
            variance = float(np.var(confidences))
            result["text_density_score"] = round(variance, 2)
            if variance > 800:
                result["anomaly_flags"].append("High confidence variance — inconsistent font/print quality detected")
                penalty += 10

        # --- Aadhaar Specific Validation ---
        if "aadhaar" in lower_text or "uidai" in lower_text or "unique identification" in lower_text:
            result["document_type"] = "Aadhaar Card"
            aadhaar_penalty = 0

            # Rule 1: Must have "Government of India" completely spelt out
            if "government of india" not in lower_text.replace('\n', ' ') and "govnment" not in lower_text:
                result["anomaly_flags"].append("Missing or obscured 'Government of India' marker expected on real Aadhaar.")
                aadhaar_penalty += 15
            elif "govnment" in lower_text or "goverment" in lower_text:  # Spelling mistakes
                result["anomaly_flags"].append("Spelling error in 'Government of India' (fraud indicator).")
                aadhaar_penalty += 25

            # Rule 2: Must have 12 digit format properly spaced
            continuous_nums = re.findall(r"\b\d{12}\b", full_text)
            spaced_nums = re.findall(r"\b\d{4}\s\d{4}\s\d{4}\b", full_text)
            
            if not spaced_nums and continuous_nums:
                result["anomaly_flags"].append("Aadhaar Number format is incorrect (should be 'XXXX XXXX XXXX', found continuous).")
                aadhaar_penalty += 20
            elif not spaced_nums and not continuous_nums:
                result["anomaly_flags"].append("Valid 12-digit Aadhaar number format not detected.")
                aadhaar_penalty += 10
            
            # Rule 3: Missing DOB or Gender format
            if "dob" not in lower_text and "year of birth" not in lower_text and "yob" not in lower_text:
                result["anomaly_flags"].append("Missing structural fields like 'DOB' or 'Year of Birth' typical of Aadhaar cards.")
                aadhaar_penalty += 10
            
            if "male" not in lower_text and "female" not in lower_text and "transgender" not in lower_text:
                result["anomaly_flags"].append("Missing Gender ('Male' or 'Female') typical of Aadhaar cards.")
                aadhaar_penalty += 10

            penalty += aadhaar_penalty

        result["text_integrity_score"] = max(0.0, round(100.0 - penalty, 2))

    except Exception as e:
        result["status"] = "error"
        result["anomaly_flags"].append(f"OCR engine error: {str(e)}")
        result["text_integrity_score"] = 50.0  # Unknown = neutral

    return result
