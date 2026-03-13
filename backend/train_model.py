"""
train_model.py — Train a TF-IDF + Logistic Regression clause-risk classifier
                 on the CUAD (Contract Understanding Atticus Dataset).

Run once (takes ~2–5 minutes on first run to download dataset):
    python train_model.py

Output:
    backend/models/cuad_classifier.joblib   ← trained sklearn pipeline
    backend/models/label_encoder.joblib     ← LabelEncoder for class names

The saved model is consumed by risk_classifier.py at runtime.
No GPU required.
"""

from __future__ import annotations
import os
import sys
import joblib
import numpy as np
from pathlib import Path

# ── Resolve paths ─────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).parent
MODELS_DIR  = BACKEND_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

MODEL_PATH   = MODELS_DIR / "cuad_classifier.joblib"
ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"

# ── Add backend to sys.path (for cuad_label_mapper import) ───────────────────
sys.path.insert(0, str(BACKEND_DIR))
from cuad_label_mapper import get_risk_level


# ── CUAD JSON download URL (Squad-format, no PDFs needed) ────────────────────
CUAD_JSON_URL = (
    "https://huggingface.co/datasets/theatticusproject/cuad/resolve/main/"
    "CUAD_v1.json"
)
CUAD_JSON_CACHE = MODELS_DIR / "CUAD_v1.json"


def load_cuad() -> list:
    """
    Download (or use cached) the pre-processed CUAD_v1.json in SQuAD format.
    Returns a flat list of QA paragraph dicts with keys:
      context, question, answers (dict with 'text' list)
    """
    import json, urllib.request

    if not CUAD_JSON_CACHE.exists():
        print(f"📥 Downloading CUAD_v1.json (~25 MB) from HuggingFace…")
        try:
            urllib.request.urlretrieve(CUAD_JSON_URL, CUAD_JSON_CACHE)
            print(f"   ✓ Saved to {CUAD_JSON_CACHE}")
        except Exception as exc:
            print(f"ERROR: Could not download CUAD JSON: {exc}")
            print(f"       Please download manually from:\n       {CUAD_JSON_URL}")
            print(f"       and save to: {CUAD_JSON_CACHE}")
            sys.exit(1)
    else:
        print(f"📥 Using cached CUAD_v1.json from {CUAD_JSON_CACHE}")

    with open(CUAD_JSON_CACHE, "r", encoding="utf-8") as f:
        raw = json.load(f)

    # SQuAD format: data → list of {title, paragraphs → [{context, qas}]}
    examples = []
    for doc in raw.get("data", []):
        for para in doc.get("paragraphs", []):
            context = para.get("context", "")
            for qa in para.get("qas", []):
                question = qa.get("question", "")
                answers_raw = qa.get("answers", [])
                answer_texts = [a["text"] for a in answers_raw] if answers_raw else []
                examples.append({
                    "context":  context,
                    "question": question,
                    "answers":  {"text": answer_texts},
                })

    print(f"   ✓ Loaded {len(examples):,} QA examples from {len(raw.get('data', []))} contracts")
    return examples


# ══════════════════════════════════════════════════════════════════════════════
# 2. BUILD TEXT + LABEL PAIRS FROM CUAD'S QA FORMAT
# ══════════════════════════════════════════════════════════════════════════════

def build_dataset(cuad_split):
    """
    CUAD is a SQuAD-style extractive QA dataset:
      - context : the full contract paragraph
      - question : e.g. "Does this contract have an Auto-Renewal clause?"
      - answers  : list of answer spans (empty if clause absent)

    Strategy:
      - If answers exist → the answer SPAN is the clause text (positive sample)
      - If no answer     → the context paragraph is "safe" (no risky clause found)

    We extract the clause category from the question title using a keyword match,
    then look up its risk level from CUAD_RISK_MAP.
    """
    texts, labels = [], []

    for example in cuad_split:
        context  = example.get("context", "").strip()
        question = example.get("question", "")
        answers  = example.get("answers", {})

        if not context:
            continue

        answer_texts = answers.get("text", []) if isinstance(answers, dict) else []

        # Extract clause category from question
        # CUAD questions look like: "Highlight the parts (if any) of this contract related to 'Auto-Renewal'..."
        category = _extract_category(question)

        if answer_texts:
            # Positive: the extracted clause span is the training text
            clause_text = answer_texts[0].strip()
            if len(clause_text) > 20:
                risk = get_risk_level(category)
                texts.append(clause_text)
                labels.append(risk)
        else:
            # Negative: whole context paragraph, labelled as safe
            # Only keep shorter paragraphs to avoid noise from full-document contexts
            if 30 < len(context) < 800:
                texts.append(context)
                labels.append("safe")

    return texts, labels


def _extract_category(question: str) -> str:
    """
    Pull the clause category name from the CUAD question string.
    CUAD questions contain the category name in single quotes, e.g.:
      "...related to 'Auto-Renewal'..."
    """
    import re
    match = re.search(r"'([^']+)'", question)
    if match:
        # Convert snake-case / title variations to match our map keys
        raw = match.group(1).strip()
        return raw
    return "Unknown"


# ══════════════════════════════════════════════════════════════════════════════
# 3. BALANCE CLASSES
# ══════════════════════════════════════════════════════════════════════════════

def balance_classes(texts: list[str], labels: list[str], max_per_class: int = 5000):
    """
    Cap each class at max_per_class samples to avoid the safe-class dominating.
    """
    from collections import defaultdict
    import random
    random.seed(42)

    buckets: dict[str, list] = defaultdict(list)
    for text, label in zip(texts, labels):
        buckets[label].append(text)

    balanced_texts, balanced_labels = [], []
    for label, bucket in buckets.items():
        random.shuffle(bucket)
        sample = bucket[:max_per_class]
        balanced_texts.extend(sample)
        balanced_labels.extend([label] * len(sample))

    # Shuffle combined
    combined = list(zip(balanced_texts, balanced_labels))
    random.shuffle(combined)
    return [t for t, _ in combined], [l for _, l in combined]


# ══════════════════════════════════════════════════════════════════════════════
# 4. TRAIN
# ══════════════════════════════════════════════════════════════════════════════

def train(texts: list[str], labels: list[str]):
    """
    Train a TF-IDF (1–3 gram) + Logistic Regression pipeline.
    Returns the fitted pipeline and label encoder.
    """
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report

    print("\n🔧 Training TF-IDF + Logistic Regression pipeline…")

    le = LabelEncoder()
    y  = le.fit_transform(labels)

    X_train, X_test, y_train, y_test = train_test_split(
        texts, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"   Train: {len(X_train):,}  |  Test: {len(X_test):,}")
    print(f"   Classes: {list(le.classes_)}")

    clf = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=60_000,
            sublinear_tf=True,
            stop_words="english",
            min_df=2,
        )),
        ("lr", LogisticRegression(
            max_iter=1000,
            C=5.0,
            solver="lbfgs",
            multi_class="multinomial",
            class_weight="balanced",
            n_jobs=-1,
        )),
    ])

    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    print("\n📊 Classification Report (test set):")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    acc = (y_pred == y_test).mean()
    print(f"   Overall accuracy: {acc:.1%}")

    return clf, le


# ══════════════════════════════════════════════════════════════════════════════
# 5. SAVE
# ══════════════════════════════════════════════════════════════════════════════

def save_model(clf, le):
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(le,  ENCODER_PATH)
    print(f"\n✅ Model saved   → {MODEL_PATH}")
    print(f"✅ Encoder saved → {ENCODER_PATH}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 65)
    print(" LegalEase — CUAD Classifier Training Script")
    print("=" * 65)

    # 1. Load
    ds = load_cuad()

    # 2. Build dataset from train split
    print("\n📝 Building training corpus from CUAD examples…")
    all_texts, all_labels = [], []
    for split_name in ds.keys():
        t, l = build_dataset(ds[split_name])
        all_texts.extend(t)
        all_labels.extend(l)

    # Class distribution before balancing
    from collections import Counter
    print(f"\n   Raw class distribution: {dict(Counter(all_labels))}")

    # 3. Balance
    texts, labels = balance_classes(all_texts, all_labels, max_per_class=5000)
    from collections import Counter
    print(f"   Balanced distribution : {dict(Counter(labels))}")

    if len(texts) < 50:
        print("ERROR: Too few examples extracted. Check dataset format.")
        sys.exit(1)

    # 4. Train
    clf, le = train(texts, labels)

    # 5. Save
    save_model(clf, le)

    print("\n▶ To use the model, restart the FastAPI server.")
    print("  The updated risk_classifier.py will auto-load it on startup.\n")


if __name__ == "__main__":
    main()
