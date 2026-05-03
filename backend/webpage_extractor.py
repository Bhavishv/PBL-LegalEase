"""
Fetch legal / policy webpages and extract main visible text for the analysis pipeline.

Pipeline: fetch_html → extract_visible_text → clean_text (or extract_text_from_url).
"""
import re
import requests
from bs4 import BeautifulSoup
from readability import Document


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

STRIP_TAGS = ("script", "style", "nav", "header", "footer", "aside", "noscript", "iframe", "svg")


def fetch_html(url: str, timeout: int = 20) -> str:
    """Fetch raw HTML from a URL with a browser-like User-Agent."""
    response = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
    response.raise_for_status()
    return response.text


def _strip_noise(soup: BeautifulSoup) -> None:
    for name in STRIP_TAGS:
        for el in soup.find_all(name):
            el.decompose()
    for el in soup.find_all(class_=re.compile(r"(^|\s)(ad|ads|advert|banner|cookie-bar|promo)(-|\s|$)", re.I)):
        el.decompose()


def extract_visible_text(html: str) -> str:
    """
    Prefer readability's main content; fall back to cleaned full-body text.
    Removes scripts, chrome (nav/header/footer), and common ad containers.
    """
    candidates: list[str] = []

    try:
        doc = Document(html)
        soup_read = BeautifulSoup(doc.summary(), "html.parser")
        _strip_noise(soup_read)
        candidates.append(soup_read.get_text(separator="\n"))
    except Exception:
        candidates.append("")

    soup_full = BeautifulSoup(html, "html.parser")
    _strip_noise(soup_full)
    candidates.append(soup_full.get_text(separator="\n"))

    best = max(candidates, key=lambda t: len(t.strip()))
    return best


def clean_text(text: str) -> str:
    """Normalize whitespace and collapse blank lines."""
    text = re.sub(r"[ \t\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_text_from_url(url: str) -> str:
    """Full pipeline: URL → clean visible text."""
    html = fetch_html(url)
    raw = extract_visible_text(html)
    return clean_text(raw)
