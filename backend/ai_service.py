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
    # Using gemini-1.5-flash for speed and efficiency
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

def get_negotiation_advice(clause_text: str, risk_level: str) -> Optional[str]:
    """
    Provide tactical negotiation advice for a risky clause.
    """
    if not model:
        return None
        
    prompt = f"""
    You are a strategic negotiation expert. I have a contract clause that is '{risk_level}'.
    Instead of rewriting the clause, tell the user HOW to negotiate this.
    Mention what to ask for, what the 'middle ground' is, and what to use as leverage or reasoning.
    
    Original Clause:
    "{clause_text}"
    
    Respond in 2-3 concise, punchy bullet points. No intro/outro.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[AI Service] ❌ Negotiation advice failed: {e}")
        return None

def extract_contract_entities(full_text: str) -> Dict[str, Any]:
    """
    Extract key entities from the contract text (Parties, Dates, ID, Jurisdiction).
    """
    if not model:
        return {}

    sample_text = full_text[:12000]
    
    prompt = """
    Analyze the following contract text and extract key metadata in JSON format.
    Required keys:
    - "party_a": Main entity (usually the provider/employer)
    - "party_b": Secondary entity (usually user/employee)
    - "effective_date": The date the contract starts
    - "expiry_date": The date the contract ends or renews
    - "jurisdiction": The governing law (e.g., "California", "Delaware")
    - "contract_type": The type of agreement (e.g., "SaaS Agreement", "NDA")
    
    Contract Text:
    {text}
    
    Respond ONLY with a valid JSON object.
    """.replace("{text}", sample_text)

    try:
        response = model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(raw_json)
    except Exception as e:
        print(f"[AI Service] ❌ Entity extraction failed: {e}")
    return {
        "party_a": "Undetected",
        "party_b": "Undetected",
        "effective_date": "Not found",
        "expiry_date": "Not found",
        "jurisdiction": "Neutral",
        "contract_type": "Standard Agreement"
    }

def extract_financial_data(full_text: str) -> Dict[str, Any]:
    """
    Extract financial exposure and summary.
    """
    if not model:
        return {}

    sample_text = full_text[:15000]
    
    prompt = """
    Analyze the financial terms of this contract.
    Provide a JSON object with:
    - "total_value": estimated contract value or "Unknown"
    - "currency": e.g. "USD", "INR"
    - "payment_terms": e.g. "Net 30"
    - "late_fees": summary of late payment penalties
    
    Contract Text:
    {text}
    
    Respond ONLY with a valid JSON object.
    """.replace("{text}", sample_text)

    try:
        response = model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(raw_json)
    except Exception:
        return {
            "total_value": "Variable",
            "currency": "USD",
            "payment_terms": "Standard",
            "late_fees": "Standard penalties apply"
        }

def analyze_gdpr_compliance(full_text: str) -> Dict[str, Any]:
    """
    Checks the contract against basic GDPR/Privacy standards.
    """
    if not model:
        return {"gdpr_status": "Missing AI service", "risks": []}

    sample_text = full_text[:10000]
    prompt = f"""
    Evaluate this contract for GDPR and Privacy compliance. 
    Respond in JSON:
    - "gdpr_status": A summary sentence of the overall compliance posture.
    - "risks": List of specific concerns (e.g., ["No data retention policy", "Indemnity for breaches missing"]).
    
    Contract Text:
    {sample_text}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {"gdpr_status": "Unable to verify automatically.", "risks": ["Manual review highly recommended"]}

def get_chat_response(contract_text: str, user_query: str, chat_history: List[Dict[str, str]] = []) -> str:
    """
    Chat with the contract using Gemini.
    """
    if not model:
        return "AI Service unavailable."
        
    history_context = ""
    for msg in chat_history[-6:]: 
        role = "User" if msg['role'] == 'user' else "AI"
        history_context += f"{role}: {msg['text']}\n"
        
    prompt = f"""
    You are LegalEase AI, an expert contract advisor. 
    You have access to the following contract text:
    ---
    {contract_text[:10000]} 
    ---
    
    Context of conversation:
    {history_context}
    
    User Query: {user_query}
    
    Instructions:
    - Answer the question accurately based on the provided contract.
    - Be professional, concise, and helpful.
    - If the answer isn't in the contract, say "This information is not specified in the current document."
    - Refer to specific sections if possible.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[AI Service] Chat failed: {e}")
        return "I encountered an error processing your question. Please try again."
