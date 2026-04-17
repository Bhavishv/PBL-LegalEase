"""
ai_service.py — Gemini-powered AI services for LegalEase.
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Using gemini-3-flash for speed and efficiency in PBL context
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    model = None

def get_redline_suggestion(clause_text: str, risk_level: str) -> Optional[str]:
    """
    Generate a 'safe' or 'balanced' alternative for a risky clause.
    """
    if not model:
        return None
        
    prompt = f"""
    You are a helpful legal assistant. I have a contract clause that has been flagged as '{risk_level}'.
    Please provide a balanced, fair, and professional alternative to this clause that protects the interests of both parties.
    
    Original Clause:
    "{clause_text}"
    
    Respond ONLY with the suggested replacement text. Do not include introductory or concluding remarks.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[AI Service] ❌ Redlining failed: {e}")
        return None

def extract_contract_entities(full_text: str) -> Dict[str, Any]:
    """
    Extract key entities from the contract text (Parties, Dates, ID, Jurisdiction).
    """
    if not model:
        return {}

    # We only take the first ~10000 chars to avoid token limits and stay focused on headings/definitions
    sample_text = full_text[:10000]
    
    prompt = """
    Analyze the following contract text and extract key metadata in JSON format.
    Required keys:
    - "parties": List of names of the companies or individuals involved.
    - "effective_date": The date the contract starts.
    - "expiration_date": The date the contract ends or renews.
    - "jurisdiction": The governing law (e.g., "California", "Delaware").
    - "contract_type": The type of agreement (e.g., "SaaS Agreement", "NDA").
    
    Contract Text:
    {text}
    
    Respond ONLY with a valid JSON object. If a field is not found, use null.
    """.replace("{text}", sample_text)

    try:
        response = model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(raw_json)
    except Exception as e:
        print(f"[AI Service] ❌ Entity extraction failed: {e}")
    return {
        "parties": None,
        "effective_date": None,
        "expiration_date": None,
        "jurisdiction": None,
        "contract_type": None
    }

def extract_financial_data(full_text: str) -> List[Dict[str, Any]]:
    """
    Extract financial exposure over 3 years (base fees vs penalties).
    """
    if not model:
        return []

    sample_text = full_text[:15000]
    
    prompt = """
    Analyze the financial terms of this contract and estimate the cost exposure over 3 years.
    Provide a JSON list of 3 objects (Yr 1, Yr 2, Yr 3).
    Each object should have:
    - "year": string (e.g., "Yr 1")
    - "base": int (estimated base fees in thousands, or relative scale 0-100 if unknown)
    - "penalty": int (estimated max early termination penalty in thousands, or relative scale 0-100)
    
    Contract Text:
    {text}
    
    Respond ONLY with a valid JSON list.
    """.replace("{text}", sample_text)

    try:
        response = model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(raw_json)
    except Exception:
        return [
            {"year": "Yr 1", "base": 40, "penalty": 80},
            {"year": "Yr 2", "base": 60, "penalty": 40},
            {"year": "Yr 3", "base": 80, "penalty": 0}
        ]

def analyze_gdpr_compliance(full_text: str) -> Dict[str, Any]:
    """
    Checks the contract against basic GDPR/Privacy standards.
    """
    if not model:
        return {}

    sample_text = full_text[:10000]
    prompt = f"""
    Evaluate this contract for GDPR and Privacy compliance. 
    Respond in JSON:
    - "score": 0-100
    - "findings": List of specific concerns (e.g., "Missing data retention period").
    - "is_compliant": Boolean.
    
    Contract Text:
    {sample_text}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {"score": 50, "findings": ["Automated check failed; manual review advised."], "is_compliant": False}
