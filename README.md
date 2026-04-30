# LegalEase – AI Contract Risk Analyzer

An AI-powered system that analyzes legal contracts, detects risky clauses, and explains them in simple language.

Legal contracts are often written in complex legal terminology (“legalese”), making them difficult for ordinary users to understand. Many people sign agreements such as rental contracts, loan documents, and online Terms of Service without fully understanding the risks involved.

**LegalEase** aims to solve this problem by using **Hybrid Machine Learning (ML)** and **Large Language Models (LLMs)** to automatically analyze contracts, detect risky clauses, and provide clear explanations.

---

# Problem Statement

Contracts such as rental agreements, subscription terms, and loan documents are often difficult for non-experts to interpret due to:

* Complex legal terminology
* Hidden conditions and penalties
* Long documents that users rarely read fully

Because of this, users unknowingly agree to clauses involving:

* Hidden fees
* Automatic renewals
* Strict cancellation policies
* Privacy waivers
* Unfair penalties

LegalEase addresses this gap by providing **intelligent clause-level analysis and risk detection** using a state-of-the-art AI pipeline.

---

# Objectives

### Automated Risk Detection
Identify risky or predatory clauses using **Natural Language Processing (NLP)** and **CUAD-trained ML models**.

### Plain English Interpretation
Translate complex legal language into **simple, user-friendly explanations** using LLMs.

### Contextual Intelligence
Extract entities, financial obligations, and jurisdictional details to provide a holistic view of the contract.

---

# Key Features

## 1. Multimodal Contract Support
Users can upload contracts in multiple formats:
* **PDF**: Robust extraction using `PyPDF2`.
* **Images/Scans**: High-accuracy OCR using **Gemini 1.5 Flash** or **Tesseract**.
* **Mobile Scanning**: Capture contracts directly via a device camera with real-time processing.

## 2. Hybrid AI Pipeline (Innovation)
The system uses a multi-tier classification strategy:
* **Tier 1 (ML)**: Statistical classification using **LinearSVC** trained on the **CUAD (Contract Understanding Analysis Dataset)**.
* **Tier 2 (Semantic)**: **Legal-BERT** embeddings for clause-level semantic similarity.
* **Tier 3 (LLM)**: Contextual verification and explanation using **Gemini 1.5 Flash** or **Mistral AI**.

## 3. Clause Trap Chain Detection
LegalEase detects **Trap Chains**—sequences of clauses that seem harmless alone but create a legal trap when combined (e.g., Automatic Renewal + Short Cancellation Window + Late Fees).

## 4. Deep Contextual Analysis
Beyond risk detection, the system extracts:
* **Parties & Entities**: Identify who is involved.
* **Financial Terms**: Extract payments, currencies, and late fees.
* **GDPR Compliance**: Check for data privacy risks.
* **Jurisdiction Analysis**: Evaluate if the governing law is favorable.
* **Negotiation Playbook**: Get AI-generated advice on how to negotiate specific risky clauses.

## 5. Contract Chat (RAG)
Users can ask specific questions about their contract (e.g., "Can I terminate this early?") and get evidence-based answers.

## 6. Digital E-Signature & Verification
LegalEase provides a built-in **Digital Signature Pad** using HTML5 Canvas.
*   **Signature Capture**: Draw signatures directly within the app.
*   **Contract Integrity**: Visual "Digitally Signed" stamps and audit logs.
*   **Multi-Party Signing**: Request signatures via secure email links (Simulation).

## 7. Educational Legal Glossary
Empowering users with knowledge of the laws that protect them:
*   **ICA Integration**: Key sections of the **Indian Contract Act, 1872** explained.
*   **IPC Safeguards**: Critical **Indian Penal Code** sections (e.g., Sec 420, 406) for fraud prevention.
*   **Plain English Meanings**: Simplifies legal jargon into actionable knowledge.

---

# Technology Stack

### Backend (Dual-Core Architecture)
* **Python (FastAPI)**: AI Orchestration, ML Models (Scikit-Learn), and NLP Processing.
* **Node.js (Express)**: User Authentication, Session Management, and MongoDB integration.

### AI / NLP
* **Models**: Gemini 1.5 Flash, Mistral Small, Legal-BERT.
* **ML**: LinearSVC (CUAD Dataset), TF-IDF Heuristics.
* **OCR**: Local Tesseract OCR / Google Cloud Vision.

### Frontend
* **Framework**: React.js (Vite).
* **Styling**: Vanilla CSS with Glassmorphism / Premium UI.

---

# Installation & Setup

### 1. Environment Configuration
Create a `.env` file in the `/frontend` directory:
```env
VITE_API_URL=http://localhost:8000
VITE_AUTH_API_URL=http://localhost:5000
```

Create a `.env` file in the `/backend` directory:
```env
MISTRAL_API_KEY=your_key
HUGGINGFACE_API_TOKEN=your_token
MONGO_URI=your_mongodb_url
```

### 2. Run the Servers
**Backend (FastAPI):**
```bash
uvicorn main:app --reload --port 8000
```
**Backend (Auth/Node):**
```bash
npm start
```
**Frontend:**
```bash
npm run dev
```

---

# Implementation Status

* [x] Core AI Pipeline (ML + LLM)
* [x] PDF & Image Processing
* [x] Trap Chain Detection logic
* [x] Functional E-Signature Canvas
* [x] Legal Glossary (ICA/IPC Sections)
* [x] Multi-Language Regional Translation
* [x] Google OAuth Integration
* [x] Deep Contextual Analysis (Financials/Jurisdiction)
* [ ] Blockchain-based Contract Verification (Future Scope)

---

# Expected Impact

LegalEase aims to:
* Improve **legal awareness for everyday users**.
* Reduce the risk of unknowingly signing unfair agreements.
* Provide **accessible contract analysis** for non-experts.
* Promote transparency in digital and physical agreements.

---

# Future Scope

* **Browser Extension**: Real-time Terms of Service (ToS) analysis.
* **Blockchain Registry**: Verification of contract authenticity.
* **Legal Professional Mode**: Advanced tools for law students and practitioners.

---

# Project Status

This project is developed as part of a **Project-Based Learning (PBL) initiative** for the 6th Semester CSE (Machine Learning course).

**Mentor**: Dr. Priya R Kamath

