# 🕵️‍♂️ ForenSight AI: Implementation Plan
**Project Name:** ForenSight AI (formerly IntrusionX AI)  
**Vision:** An Advanced Multi-Modal, Explainable AI Forensic Suite for Document Forgery Detection.

---

## 🚀 1. Product Vision & Strategy
To build a "Hackathon Winning" UI and system that goes beyond simple detection. ForenSight AI treats the document as a "Digital Patient," scanning for anomalies at the pixel (image), structural (text), and forensic (signature) levels.

### Core Pillars:
1.  **Multi-Modal Analysis**: Correlating Image, Text, and Signature data.
2.  **Explainability (XAI)**: Providing the "Why" behind the "Fake" verdict using heatmaps and technical logs.
3.  **AI Agent Workflow**: A multi-agent system that parallelizes forensic checks.
4.  **Premium Aesthetics**: A "Digital Pathologist" UI that feels like a zero-fail security workstation.

---

## 🎨 2. UI/UX Strategy: "The Digital Sentinel"
The interface must convey **Authority, Precision, and Depth**.

- **Theme**: Dark Tactical Mode (#0A0E14) with Cyan-Glow accents and high-fidelity glassmorphism (`backdrop-blur`).
- **Typography**: Space Grotesk (Headlines), Inter (Body), and Monospaced logs.
- **Key Modules**:
    - **Live Agent Monitor**: Grid showing [OCR], [Forensics], [Signature], and [Decision] agents "thinking."
    - **Interactive Heatmap**: A semi-transparent overlay highlighting tampered zones with XAI metadata pop-ups.
    - **Evidence Archive**: A high-density history explorer for audit trails.

---

## 🛠️ 3. Technical Stack
| Category | Technology |
| :--- | :--- |
| **Frontend** | React + Tailwind CSS (Cyberpunk/Forensic Design) |
| **Backend** | Flask / FastAPI (Python-based for high-speed AI inference) |
| **Image Forensics** | OpenCV, CNN (ResNet, EfficientNet), Canny Edge Detection |
| **Text/OCR** | Tesseract OCR, NLP models for formatting anomaly detection |
| **Signatures** | Siamese Networks (Few-shot learning), Feature Matching (ORB/SIFT) |
| **Explainability** | Grad-CAM (Image), SHAP/LIME (Logic) |
| **Demo Focus** | Aadhaar, Degree Certificates, and Forged Resumes |

---

## 🗺️ 4. Roadmap (The Winning Strategy)

### 🟢 Phase 1: MVP & Foundation
- Upload pipeline (React Frontend -> FastAPI Backend).
- Basic OCR extraction and Real/Fake classification.
- **Stitch Status: Dashboard Complete.**

### 🟡 Phase 2: Image Forensics & Visual Tampering
- Integrate CNNs for noise consistency and blur anomaly detection.
- **UI Goal:** Add "Bounding Box" overlays on detected regions.

### 🔵 Phase 3: Text Intelligence & NLP
- Implement font mismatch and spacing anomaly detection.
- **UI Goal:** Add "Text Integrity Score" card.

### 🟣 Phase 4: Signature Verification (Signature Suite)
- Build Siamese Network for one-shot signature matching.
- **UI Goal:** Side-by-side comparison with "match connection lines."

### 🔴 Phase 5: Explainable AI (The Judge Killer)
- Implement Grad-CAM heatmaps.
- **UI Goal:** Interactive heatmap tooltips explaining the "Why."

### 🟠 Phase 6: AI Agent Integration
- Orchestrate the multi-agent pipeline with a final "Decision Engine."
- **UI Goal:** Live "Agent Thinking" logs and status pulses.

### ⚫ Phase 7: Demo & Scale
- Aadhaar/Certificate/Resume presets for live testing.
- Blockchain hashing for certificate verification (Bonus).

---

## 📦 5. Data & Assets
- **Datasets**: Kaggle Forgery Datasets, Signature verification datasets.
- **Synthetic Data**: Manual creation of forged samples (Aadhaar/Certificates) to show localized training.

---

## 🏆 6. Winning Demo Scenarios
1.  **Aadhaar Scan**: Detection of photo-swaps or date alterations.
2.  **Certificate Check**: Highlighting font consistency mismatches in names/marks.
3.  **Signature Match**: Showing a 95% vs 40% match on a forged check.
