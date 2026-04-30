"""
ai_service.py — LegalEase AI services using Tesseract OCR.
"""

import os
import json
import requests
import io
from PIL import Image
import pytesseract  # Added for local Tesseract OCR
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

# API Keys
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

MISTRAL_MODEL = "mistral-small-latest"
HF_MODEL = "HuggingFaceH4/zephyr-7b-beta" 

def ask_hf(prompt: str) -> Optional[str]:
    """Call Hugging Face Inference API."""
    if not HF_TOKEN: return None
    url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {
        "inputs": f"<|system|>\nYou are a legal AI assistant specialized in Indian Law and the Indian Contract Act. You simplify jargon for common people in an Indian context.</s>\n<|user|>\n{prompt}</s>\n<|assistant|>",
        "parameters": {"max_new_tokens": 1000, "temperature": 0.2}
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        data = response.json()
        if response.ok:
            if isinstance(data, list) and len(data) > 0:
                text = data[0].get("generated_text", "")
                return text.split("<|assistant|>")[-1].strip() if "<|assistant|>" in text else text.strip()
        elif "loading" in str(data).lower():
            return None
    except: pass
    return None

def ask_ai(prompt: str, json_mode: bool = False) -> Optional[str]:
    """Primary AI entry point. Prioritizes Mistral AI for all legal reasoning."""
    
    # Mistral System Prompt for consistent Indian Law context
    system_prompt = (
        "You are LegalEase AI, an expert Indian Corporate Lawyer specialized in the Indian Contract Act, 1872. "
        "You simplify complex legalese into plain English for Indian citizens. "
        "Always prioritize Indian legal standards and regional context."
    )

    if MISTRAL_API_KEY:
        try:
            url = "https://api.mistral.ai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json", 
                "Authorization": f"Bearer {MISTRAL_API_KEY}"
            }
            payload = {
                "model": MISTRAL_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt + " Do NOT use markdown bolding (like **word**). Keep explanations under 3 sentences."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
            response = requests.post(url, headers=headers, json=payload, timeout=35)
            if response.ok:
                return response.json()['choices'][0]['message']['content'].strip()
        except Exception as e:
            print(f"[AI Service] Mistral call failed: {e}")

    # Fallback to Hugging Face if Mistral is unavailable
    hf_res = ask_hf(prompt)
    if hf_res:
        return hf_res

    return None

def analyze_contract_contextually(full_text: str) -> Dict[str, Any]:
    prompt = (
        "You are an expert Indian Corporate Lawyer. Analyze this contract under the Indian Contract Act, 1872 "
        "and relevant Indian laws (IT Act, labor laws, etc.). Identify risks for a common Indian citizen. "
        "Return JSON: {\"global_risk_score\": 0-100, \"top_concerns\": [], \"clause_hints\": []}. "
        f"Text: {full_text[:6000]}"
    )
    lower = full_text.lower()
    score_est = 90
    if "automatically renew" in lower: score_est -= 10
    fallback = {"global_risk_score": score_est, "top_concerns": ["Heuristic analysis applied."], "clause_hints": []}
    result = ask_ai(prompt, json_mode=True)
    if not result: return fallback
    try:
        cleaned = result.replace("```json", "").replace("```", "").strip()
        start, end = cleaned.find('{'), cleaned.rfind('}')
        if start != -1 and end != -1:
            parsed = json.loads(cleaned[start:end+1])
            if "global_risk_score" not in parsed: parsed["global_risk_score"] = score_est
            return parsed
        return fallback
    except: return fallback

def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """OCR using Local Tesseract."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"[AI Service] Tesseract OCR failed: {e}")
        return "[Error: Tesseract OCR failed. Ensure Tesseract is installed.]"

# ... rest of the extraction functions stay the same but use ask_ai ...
def get_redline_suggestion(clause_text: str, risk_level: str) -> Optional[str]:
    return ask_ai(f"As an Indian lawyer, provide a balanced replacement for this {risk_level} clause that complies with Indian law: \"{clause_text}\"")

def get_negotiation_advice(clause_text: str, risk_level: str) -> Optional[str]:
    return ask_ai(f"How should an Indian citizen negotiate this {risk_level} clause? Provide 2 points based on Indian market standards: \"{clause_text}\"")

def extract_contract_entities(full_text: str) -> Dict[str, Any]:
    res = ask_ai(f"Extract parties, effective_date, and jurisdiction from this contract in JSON: {full_text[:4000]}")
    try: return json.loads(res[res.find('{'):res.rfind('}')+1])
    except: return {}

def extract_financial_data(full_text: str) -> Dict[str, Any]:
    res = ask_ai(f"Extract total_value, currency, and payment_terms in JSON: {full_text[:4000]}")
    try: return json.loads(res[res.find('{'):res.rfind('}')+1])
    except: return {}

def analyze_gdpr_compliance(full_text: str) -> Dict[str, Any]:
    res = ask_ai(f"Analyze this contract for GDPR compliance. Return JSON: {{\"gdpr_status\": \"...\", \"risks\": []}}. Text: {full_text[:4000]}")
    try: return json.loads(res[res.find('{'):res.rfind('}')+1])
    except: return {}

def extract_deadlines(full_text: str) -> List[Dict[str, Any]]:
    res = ask_ai(f"Extract all deadlines/renewals in JSON list [{{title, date, description}}]: {full_text[:4000]}")
    try: return json.loads(res[res.find('['):res.rfind(']')+1])
    except: return []

def analyze_jurisdiction(full_text: str) -> Dict[str, Any]:
    res = ask_ai(f"Analyze governing law in JSON: {{location, is_favorable: bool, description}}. Text: {full_text[:4000]}")
    try: return json.loads(res[res.find('{'):res.rfind('}')+1])
    except: return {"location": "India", "is_favorable": True, "description": "Subject to Indian Contract Act and local courts."}

def generate_negotiation_playbook(full_text: str) -> str:
    return ask_ai(f"Create a 'Strategic Playbook' for an Indian business negotiation (Give, Non-Negotiable, Leverage) based on this contract: {full_text[:6000]}") or "Playbook generation failed."

def get_chat_response(contract_text: str, user_query: str, chat_history: List[Dict[str, str]] = []) -> str:
    return ask_ai(f"You are LegalEase AI, an expert on Indian Law. Context: {contract_text[:6000]}\nQuery: {user_query}") or "Error processing question."
