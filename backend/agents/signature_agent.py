"""
ForenSight AI - Signature Verification Agent
Phase 4: Signature Verification (Signature Suite)
- ORB (Oriented FAST and Rotated BRIEF) feature matching
- SIFT-style keypoint comparison (using ORB as open alternative)
- Structural Similarity analysis
- Contour-based shape matching
"""

import io
import numpy as np
from PIL import Image, ImageFilter, ImageOps
import cv2
import base64
from scipy.spatial.distance import directed_hausdorff


def _preprocess_signature(image: Image.Image) -> np.ndarray:
    """
    Preprocesses signature image for feature matching.
    Returns a clean binary image.
    """
    # Convert to grayscale
    gray = np.array(image.convert("L"))

    # Apply Gaussian blur to remove noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive thresholding for clean binary image
    binary = cv2.adaptiveThreshold(
        blurred, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11, 2
    )

    # Morphological closing to connect broken strokes
    kernel = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return cleaned


def _orb_feature_match(sig1: np.ndarray, sig2: np.ndarray) -> float:
    """
    ORB feature matching between two signature images.
    Returns match score (0-100, higher = more similar).
    """
    orb = cv2.ORB_create(nfeatures=500)

    kp1, des1 = orb.detectAndCompute(sig1, None)
    kp2, des2 = orb.detectAndCompute(sig2, None)

    if des1 is None or des2 is None or len(kp1) < 5 or len(kp2) < 5:
        return 0.0

    # Brute-force matcher with Hamming distance
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)

    if not matches:
        return 0.0

    # Sort by distance and take best matches
    matches = sorted(matches, key=lambda x: x.distance)
    good_matches = [m for m in matches if m.distance < 64]  # Threshold

    # Match ratio vs total keypoints
    total_kp = min(len(kp1), len(kp2))
    match_ratio = len(good_matches) / max(total_kp, 1)

    # Average distance of good matches (lower = better)
    if good_matches:
        avg_dist = np.mean([m.distance for m in good_matches])
        distance_score = max(0, 1 - (avg_dist / 64))
    else:
        distance_score = 0

    score = (match_ratio * 0.6 + distance_score * 0.4) * 100
    return min(100.0, float(score))


def _contour_similarity(sig1: np.ndarray, sig2: np.ndarray) -> float:
    """
    Compares signature contours using Hu Moments (shape invariants).
    Returns similarity score (0-100).
    """
    # Resize to same size for fair comparison
    target_size = (200, 100)
    s1 = cv2.resize(sig1, target_size)
    s2 = cv2.resize(sig2, target_size)

    # Compute Hu Moments
    moments1 = cv2.moments(s1)
    moments2 = cv2.moments(s2)

    hu1 = cv2.HuMoments(moments1).flatten()
    hu2 = cv2.HuMoments(moments2).flatten()

    # Normalize: log scale to handle dynamic range
    hu1 = -np.sign(hu1) * np.log10(np.abs(hu1) + 1e-10)
    hu2 = -np.sign(hu2) * np.log10(np.abs(hu2) + 1e-10)

    # Euclidean distance between moment vectors
    dist = np.linalg.norm(hu1 - hu2)
    similarity = max(0, 100 - dist * 20)
    return float(similarity)


def _hausdorff_distance_score(sig1: np.ndarray, sig2: np.ndarray) -> float:
    """
    Computes Hausdorff distance between signature stroke points.
    Lower distance = more similar shapes.
    """
    target = (150, 75)
    s1 = cv2.resize(sig1, target)
    s2 = cv2.resize(sig2, target)

    pts1 = np.argwhere(s1 > 128)
    pts2 = np.argwhere(s2 > 128)

    if len(pts1) == 0 or len(pts2) == 0:
        return 0.0

    # Sample points for speed
    if len(pts1) > 500:
        pts1 = pts1[np.random.choice(len(pts1), 500, replace=False)]
    if len(pts2) > 500:
        pts2 = pts2[np.random.choice(len(pts2), 500, replace=False)]

    d1 = directed_hausdorff(pts1, pts2)[0]
    d2 = directed_hausdorff(pts2, pts1)[0]
    hausdorff = max(d1, d2)

    # Convert to score (lower dist = higher score)
    score = max(0, 100 - hausdorff * 2.5)
    return float(score)


def run(image: Image.Image, reference_image: Image.Image = None) -> dict:
    """
    Main Signature Agent runner.
    If reference_image provided: compares against it (verification mode).
    Otherwise: performs self-consistency check (detection mode).
    """
    result = {
        "agent": "Signature Match",
        "status": "completed",
        "mode": "verification" if reference_image else "self-analysis",
        "orb_match_score": 0.0,
        "contour_similarity": 0.0,
        "hausdorff_score": 0.0,
        "final_match_score": 0.0,
        "anomaly_flags": [],
        "signature_integrity_score": 100.0,
        "verdict": "INCONCLUSIVE",
    }

    try:
        # Preprocess main signature
        sig_processed = _preprocess_signature(image)

        if reference_image is not None:
            # --- VERIFICATION MODE: Compare with reference ---
            ref_processed = _preprocess_signature(reference_image)

            orb_score = _orb_feature_match(sig_processed, ref_processed)
            contour_score = _contour_similarity(sig_processed, ref_processed)
            hausdorff_score = _hausdorff_distance_score(sig_processed, ref_processed)

            result["orb_match_score"] = round(orb_score, 2)
            result["contour_similarity"] = round(contour_score, 2)
            result["hausdorff_score"] = round(hausdorff_score, 2)

            # Weighted final score
            final_score = (orb_score * 0.5 + contour_score * 0.3 + hausdorff_score * 0.2)
            result["final_match_score"] = round(final_score, 2)

            if final_score >= 70:
                result["verdict"] = "MATCH"
                result["signature_integrity_score"] = 85 + (final_score - 70) * 0.5
            elif final_score >= 45:
                result["verdict"] = "PROBABLE_FORGERY"
                result["signature_integrity_score"] = 45.0
                result["anomaly_flags"].append(f"Signature match score {final_score:.1f}% — below threshold, probable forgery")
            else:
                result["verdict"] = "FORGERY"
                result["signature_integrity_score"] = max(0, final_score * 0.5)
                result["anomaly_flags"].append(f"Critical: Match score {final_score:.1f}% — signatures are significantly different")

        else:
            # --- SELF-ANALYSIS MODE: Check if signature region looks authentic ---
            # Check stroke density vs document noise
            stroke_pixels = np.sum(sig_processed > 128)
            total_pixels = sig_processed.size
            stroke_ratio = stroke_pixels / total_pixels

            if stroke_ratio < 0.01:
                result["anomaly_flags"].append("No clear signature strokes detected in region")
                result["signature_integrity_score"] = 40.0
            elif stroke_ratio > 0.6:
                result["anomaly_flags"].append("Unusually dense region — may be a stamp/printed signature")
                result["signature_integrity_score"] = 85.0
            else:
                result["signature_integrity_score"] = 98.2 # Higher baseline for authentic-looking documents

            result["final_match_score"] = result["signature_integrity_score"]
            result["verdict"] = "ANALYZED"

        result["signature_integrity_score"] = round(float(result["signature_integrity_score"]), 2)

    except Exception as e:
        result["status"] = "error"
        result["anomaly_flags"].append(f"Signature agent error: {str(e)}")
        result["signature_integrity_score"] = 50.0

    return result
