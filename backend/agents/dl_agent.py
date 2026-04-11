"""
ForenSight AI - Deep Learning Agent (Hugging Face)
Phase 6: Neural Forensic Integration
- Uses a pretrained transformer model from Hugging Face
- Specialized in Document Forgery & Text Substitution Detection
- Model: DocForg/Document_Forgery_Detection
"""

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification
import numpy as np

# Cache for the model and processor
_processor = None
_model = None
_device = "cuda" if torch.cuda.is_available() else "cpu"

def _load_model():
    global _processor, _model
    if _model is not None:
        return _processor, _model
    
    try:
        # Using a reliable HF model for document forgery detection
        # Since the user specifically liked DocForg, we use their pretrained repo
        model_name = "DocForg/Document_Forgery_Detection"
        _processor = AutoImageProcessor.from_pretrained(model_name)
        _model = AutoModelForImageClassification.from_pretrained(model_name)
        _model.to(_device)
        _model.eval()
    except Exception as e:
        print(f"Error loading Deep Learning model: {e}")
        return None, None
        
    return _processor, _model

def run(image: Image.Image) -> dict:
    """
    Main DL Agent runner.
    Classifies document as Authentic or Forged using Neural Transformer.
    """
    result = {
        "agent": "Deep Learning Node",
        "status": "completed",
        "dl_integrity_score": 100.0,
        "prediction": "Authentic",
        "confidence": 0.0,
        "anomaly_flags": [],
    }

    processor, model = _load_model()
    if model is None:
        result["status"] = "error"
        result["anomaly_flags"].append("Deep Learning model failed to initialize.")
        return result

    try:
        # Preprocess
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        inputs = processor(images=image, return_tensors="pt").to(_device)
        
        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)
            
        # Get results
        # Assuming binary classification: 0 = Authentic, 1 = Forged (standard pattern)
        # Note: We'll map based on model labels if available
        id2label = model.config.id2label
        pred_idx = logits.argmax(-1).item()
        label = id2label[pred_idx]
        confidence = float(probs[0, pred_idx].item())
        
        result["prediction"] = label
        result["confidence"] = round(confidence * 100, 2)
        
        # Calculate integrity score
        # If label is forged/tampered, score should be low
        if "forged" in label.lower() or "tamper" in label.lower() or "fake" in label.lower():
            result["dl_integrity_score"] = round((1 - confidence) * 100, 2)
            result["anomaly_flags"].append(f"Neural Node detected forensic mismatch: {label} ({result['confidence']}% confidence)")
        else:
            result["dl_integrity_score"] = round(confidence * 100, 2)
            if confidence < 0.7:
                result["anomaly_flags"].append(f"Deep learning confidence is low ({result['confidence']}%). Uncertain integrity.")

    except Exception as e:
        result["status"] = "error"
        result["anomaly_flags"].append(f"DL Agent error: {str(e)}")
        result["dl_integrity_score"] = 50.0

    return result
