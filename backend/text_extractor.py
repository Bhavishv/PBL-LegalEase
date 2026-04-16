"""
text_extractor.py — Extract raw text from supported document types.

Supported:
  - PDF / DOC / DOCX / TXT
  - PNG / JPG / JPEG via OCR (pytesseract + Pillow)
"""

import io
import PyPDF2
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file given its raw bytes."""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file given its raw bytes."""
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extract text from an image using OCR.

    Notes:
      - Requires Python deps: pillow, pytesseract
      - Also requires Tesseract OCR engine installed on OS and available in PATH
    """
    try:
        from PIL import Image
        import pytesseract
    except ImportError as exc:
        raise RuntimeError(
            "OCR dependencies are missing. Install with: pip install pillow pytesseract"
        ) from exc

    try:
        # Optional explicit path for Windows setups where tesseract isn't in PATH.
        tesseract_cmd = ( __import__("os").getenv("TESSERACT_CMD", "") or "").strip()
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        image = Image.open(io.BytesIO(file_bytes))
        # Convert to grayscale for better OCR stability across camera photos.
        image = image.convert("L")
        text = pytesseract.image_to_string(image)
        return (text or "").strip()
    except Exception as exc:
        raise RuntimeError(f"OCR failed while reading image: {exc}") from exc


def extract_text(filename: str, file_bytes: bytes) -> str:
    """Dispatcher: extract text based on file extension."""
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="replace")
    elif ext in ("png", "jpg", "jpeg"):
        return extract_text_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")
