"""
ai_service.py — Multi-Model AI services for LegalEase (Mistral Primary, Gemini Fallback).
"""

import os
import json
import requests
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_MODEL = "mistral-small-latest" # Updated for better compatibility

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
else:
    gemini_model = None

def ask_ai(prompt: str, json_mode: bool = False) -> Optional[str]:
    """
    Unified interface to call Mistral first, then Gemini as fallback.
    """
    # 1. Try Mistral
    if MISTRAL_API_KEY:
        try:
            url = "https://api.mistral.ai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {MISTRAL_API_KEY}"
            }
            payload = {
                "model": MISTRAL_MODEL,
                "messages": [{"role": "user", "content": prompt}]
            }
            # Note: mistral-tiny might not support response_format, 
            # so we'll just handle the text output manually.

            response = requests.post(url, headers=headers, json=payload, timeout=10)
            if response.ok:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
            else:
                print(f"[AI Service] Mistral API error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"[AI Service] Mistral request failed: {e}")

    # 2. Fallback to Gemini
    if gemini_model:
        try:
            response = gemini_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[AI Service] Gemini fallback failed: {e}")

    return None

def get_redline_suggestion(clause_text: str, risk_level: str) -> Optional[str]:
    """
    Generate a 'safe' or 'balanced' alternative for a risky clause.
    """
    prompt = f"""
    You are a helpful legal assistant. I have a contract clause that has been flagged as '{risk_level}'.
    Please provide a balanced, fair, and professional alternative to this clause that protects the interests of both parties.
    
    Original Clause:
    "{clause_text}"
    
    Respond ONLY with the suggested replacement text. Do not include introductory or concluding remarks.
    """
    return ask_ai(prompt)

def get_negotiation_advice(clause_text: str, risk_level: str) -> Optional[str]:
    """
    Provide tactical negotiation advice for a risky clause.
    """
    prompt = f"""
    You are a strategic negotiation expert. I have a contract clause that is '{risk_level}'.
    Instead of rewriting the clause, tell the user HOW to negotiate this.
    Mention what to ask for, what the 'middle ground' is, and what to use as leverage or reasoning.
    
    Original Clause:
    "{clause_text}"
    
    Respond with a concise, actionable bullet list of 2-3 points.
    """
    return ask_ai(prompt)

def extract_contract_entities(full_text: str) -> Dict[str, Any]:
    """
    Identify key parties, dates, and jurisdictions.
    """
    sample_text = full_text[:8000]
    prompt = f"""
    Extract the following entities from this contract text in JSON format:
    - "party_a": The primary party or service provider.
    - "party_b": The secondary party or client.
    - "effective_date": The date the contract starts.
    - "jurisdiction": The governing law or court location.
    
    If not found, set as "Not specified".
    
    Contract Text:
    {sample_text}
    """
    
    result = ask_ai(prompt)
    if not result:
        return {"party_a": "Not specified", "party_b": "Not specified", "effective_date": "Not specified", "jurisdiction": "Not specified"}
    
    try:
        cleaned = result.replace("```json", "").replace("```", "").strip()
        last_brace = cleaned.rfind('}')
        if last_brace != -1:
            cleaned = cleaned[:last_brace+1]
        first_brace = cleaned.find('{')
        if first_brace != -1:
            cleaned = cleaned[first_brace:]
        return json.loads(cleaned)
    except:
        return {"party_a": "Not specified", "party_b": "Not specified", "effective_date": "Not specified", "jurisdiction": "Not specified"}

def extract_financial_data(full_text: str) -> Dict[str, Any]:
    """
    Identifies total value, currency, and payment terms.
    """
    sample_text = full_text[:8000]
    prompt = f"""
    Analyze this contract for financial terms and return in JSON:
    - "total_value": The primary dollar amount or price mentioned.
    - "currency": The currency code (USD, EUR, etc).
    - "payment_terms": Summary of payment frequency or deadlines (e.g., "Net 30").
    
    Contract Text:
    {sample_text}
    """
    
    result = ask_ai(prompt)
    if not result:
        return {"total_value": "Variable", "currency": "USD", "payment_terms": "Standard"}
        
    try:
        cleaned = result.replace("```json", "").replace("```", "").strip()
        first_brace = cleaned.find('{')
        last_brace = cleaned.rfind('}')
        if first_brace != -1 and last_brace != -1:
            cleaned = cleaned[first_brace:last_brace+1]
        return json.loads(cleaned)
    except:
        return {"total_value": "Variable", "currency": "USD", "payment_terms": "Standard"}

def analyze_gdpr_compliance(full_text: str) -> Dict[str, Any]:
    """
    Checks the contract against basic GDPR/Privacy standards.
    """
    sample_text = full_text[:8000]
    prompt = f"""
    Evaluate this contract for GDPR and Privacy compliance. 
    Respond in JSON:
    - "gdpr_status": A summary sentence of the overall compliance posture.
    - "risks": List of specific concerns (e.g., ["No data retention policy", "Indemnity for breaches missing"]).
    
    Contract Text:
    {sample_text}
    """

    result = ask_ai(prompt)
    if not result:
        return {"gdpr_status": "Unable to verify automatically.", "risks": ["Manual review recommended"]}
        
    try:
        cleaned = result.replace("```json", "").replace("```", "").strip()
        first_brace = cleaned.find('{')
        last_brace = cleaned.rfind('}')
        if first_brace != -1 and last_brace != -1:
            cleaned = cleaned[first_brace:last_brace+1]
        return json.loads(cleaned)
    except:
        return {"gdpr_status": "Unable to verify automatically.", "risks": ["Manual review recommended"]}

def get_chat_response(contract_text: str, user_query: str, chat_history: List[Dict[str, str]] = []) -> str:
    """
    Chat with the contract using AI.
    """
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
    
    response = ask_ai(prompt)
    if response:
        return response
    return "I encountered an error processing your question. Please ensure your API keys (Mistral or Gemini) are correctly configured."
