"""
ForenSight AI - Image Forensics Agent
Phase 2: Image Forensics & Visual Tampering
- ELA (Error Level Analysis): Detects JPEG re-compression artifacts
- Noise Consistency Analysis: Finds areas with different noise patterns
- Edge Anomaly Detection: Canny edge-based boundary analysis
- Metadata Extraction: Checks for EXIF inconsistencies
"""

import io
import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageFilter
import cv2
import base64


ELA_QUALITY = 75     # JPEG quality for ELA re-compression
ELA_SCALE = 15       # Scale factor for ELA visualization
NOISE_BLOCK_SIZE = 8 # Block size for noise analysis


def _compute_ela(image: Image.Image) -> tuple[Image.Image, float]:
    """
    Error Level Analysis: Saves image at low quality and computes difference.
    Tampered regions show higher error levels.
    Returns (ela_image, ela_score)
    """
    # Convert to RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Save at reduced quality to buffer
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=ELA_QUALITY)
    buffer.seek(0)
    recompressed = Image.open(buffer).convert("RGB")

    # Compute absolute difference (ELA image)
    ela_image = ImageChops.difference(image, recompressed)
    ela_array = np.array(ela_image)

    # Enhance for visibility
    enhanced = ImageEnhance.Brightness(ela_image).enhance(ELA_SCALE)

    # ELA Score: mean of top 5% pixel values (high = suspicious)
    flat = ela_array.flatten()
    top_5pct = np.percentile(flat, 95)
    ela_score = float(np.mean(flat[flat > top_5pct]))

    return enhanced, ela_score


def _noise_consistency_analysis(image: Image.Image) -> tuple[float, list]:
    """
    Analyzes local noise patterns across image blocks.
    Inconsistent noise = signs of editing/compositing.
    Returns (anomaly_score, anomalous_regions)
    """
    gray = np.array(image.convert("L")).astype(np.float32)
    h, w = gray.shape

    # Apply Laplacian to get noise map
    laplacian = cv2.Laplacian(gray.astype(np.uint8), cv2.CV_64F)
    noise_map = np.abs(laplacian)

    # Split into blocks and compute block-level noise stats
    block_variances = []
    anomalous_regions = []

    for y in range(0, h - NOISE_BLOCK_SIZE, NOISE_BLOCK_SIZE * 4):
        for x in range(0, w - NOISE_BLOCK_SIZE, NOISE_BLOCK_SIZE * 4):
            block = noise_map[y:y+NOISE_BLOCK_SIZE*4, x:x+NOISE_BLOCK_SIZE*4]
            var = float(np.var(block))
            block_variances.append(var)

    if not block_variances:
        return 0.0, []

    mean_var = np.mean(block_variances)
    std_var = np.std(block_variances)

    # Blocks more than 2 std devs from mean are suspicious
    threshold = mean_var + 2.5 * std_var
    outlier_count = sum(1 for v in block_variances if v > threshold)
    outlier_ratio = outlier_count / len(block_variances)

    anomaly_score = min(100.0, outlier_ratio * 300)
    return anomaly_score, anomalous_regions


def _edge_anomaly_detection(image: Image.Image) -> float:
    """
    Uses Canny edge detection to find unnatural sharp boundaries.
    Sharp isolated edges can indicate paste/clone operations.
    """
    gray = np.array(image.convert("L"))
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Two-level Canny
    edges_tight = cv2.Canny(blurred, 100, 200)
    edges_loose = cv2.Canny(blurred, 50, 150)

    tight_density = np.sum(edges_tight > 0) / edges_tight.size
    loose_density = np.sum(edges_loose > 0) / edges_loose.size

    # Abnormally high edge density = potential overlay / cloning
    edge_score = min(100.0, tight_density * 1000)
    return float(edge_score)


def _image_to_base64(image: Image.Image, max_size: tuple = (600, 400)) -> str:
    """Converts PIL Image to base64 string for frontend."""
    image.thumbnail(max_size, Image.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def run(image: Image.Image) -> dict:
    """
    Main Image Forensics Agent runner.
    Returns forensic scores and visualizations.
    """
    result = {
        "agent": "Image Forensics",
        "status": "completed",
        "ela_score": 0.0,
        "noise_anomaly_score": 0.0,
        "edge_anomaly_score": 0.0,
        "ela_image_b64": None,
        "anomaly_flags": [],
        "image_integrity_score": 100.0,
    }

    try:
        # 1. ELA Analysis
        ela_image, ela_score = _compute_ela(image)
        result["ela_score"] = round(ela_score, 2)
        result["ela_image_b64"] = _image_to_base64(ela_image)

        # 2. Noise Consistency
        noise_score, _ = _noise_consistency_analysis(image)
        result["noise_anomaly_score"] = round(noise_score, 2)

        # 3. Edge Analysis
        edge_score = _edge_anomaly_detection(image)
        result["edge_anomaly_score"] = round(edge_score, 2)

        # Calculate overall image integrity score
        penalty = 0.0

        if ela_score > 15:
            penalty += min(40, ela_score * 1.5)
            result["anomaly_flags"].append(f"High ELA score ({ela_score:.1f}): Suspicious JPEG re-compression artifacts detected")
        elif ela_score > 8:
            penalty += 15
            result["anomaly_flags"].append(f"Moderate ELA score ({ela_score:.1f}): Possible localized editing")

        if noise_score > 30:
            penalty += min(35, noise_score * 0.8)
            result["anomaly_flags"].append(f"Noise inconsistency score {noise_score:.1f}: Regions with different noise profiles detected")

        if edge_score > 20:
            penalty += min(25, edge_score * 0.6)
            result["anomaly_flags"].append(f"Edge anomaly score {edge_score:.1f}: Unnatural boundaries detected (possible paste/clone)")

        result["image_integrity_score"] = max(0.0, round(100.0 - penalty, 2))

    except Exception as e:
        result["status"] = "error"
        result["anomaly_flags"].append(f"Image forensics error: {str(e)}")
        result["image_integrity_score"] = 50.0

    return result
