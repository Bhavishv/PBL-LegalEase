"""
translator.py — Google Cloud Translation integration for LegalEase.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")

def translate_text(text: str, target_lang: str) -> str:
    """
    Translates text to the target language using Google Cloud Translation API (Basic).
    
    Args:
        text: The string to translate.
        target_lang: ISO 639-1 language code (e.g. 'hi', 'mr').
        
    Returns:
        Translated text string.
    """
    if not GOOGLE_API_KEY or "YOUR_GOOGLE_CLOUD_API_KEY" in GOOGLE_API_KEY:
        print(f"[Translator] ⚠️ Missing API Key. Returning mock translation for '{target_lang}'.")
        # Mocking for demo if no key is provided
        mocks = {
            "hi": f"[Mock Hindi] {text}",
            "mr": f"[Mock Marathi] {text}"
        }
        return mocks.get(target_lang, f"[Mock {target_lang}] {text}")

    url = "https://translation.googleapis.com/language/translate/v2"
    params = {
        "q": text,
        "target": target_lang,
        "key": GOOGLE_API_KEY
    }

    try:
        response = requests.post(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data["data"]["translations"][0]["translatedText"]
    except Exception as e:
        print(f"[Translator] ❌ Error during translation: {e}")
        return text  # Fallback to original text on error
