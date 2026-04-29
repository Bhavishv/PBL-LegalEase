import ai_service
from typing import Optional

def translate_text(text: str, target_lang: str) -> Optional[str]:
    """
    Translates text using AI (Gemini/Mistral).
    """
    if not text:
        return None
        
    lang_names = {
        'hi': 'Hindi',
        'mr': 'Marathi',
        'kn': 'Kannada',
        'en': 'English'
    }
    
    target_name = lang_names.get(target_lang, target_lang)
    
    prompt = (
        f"Translate the following legal explanation into {target_name}. "
        "Keep the tone professional and the language simple for a common person to understand. "
        "Only return the translated text.\n\n"
        f"Text: {text}"
    )
    
    try:
        translated = ai_service.ask_ai(prompt)
        if translated:
            return translated.strip()
    except Exception as e:
        print(f"[Translator] AI Translation failed: {e}")
        
    return None
