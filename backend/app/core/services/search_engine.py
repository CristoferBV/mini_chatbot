from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz.fuzz import ratio

_vectorizer = None
_matrix = None
_items: List[Dict] = []

def build_index(items: List[Dict]) -> int:
    """items: [{id, question, answer, tags}]"""
    global _vectorizer, _matrix, _items
    _items = items[:]
    if not _items:
        _vectorizer = _matrix = None
        return 0
    corpus = [it["question"] or "" for it in _items]
    # Nota: scikit-learn solo trae stop_words='english'. Usamos sin stopwords para evitar errores.
    _vectorizer = TfidfVectorizer(lowercase=True)
    _matrix = _vectorizer.fit_transform(corpus)
    return len(_items)

def query(text: str, top_k: int = 5) -> List[Dict]:
    if not _matrix or not _vectorizer:
        return []
    qv = _vectorizer.transform([text or ""])
    sims = cosine_similarity(qv, _matrix).flatten()
    scored = []
    for i, s in enumerate(sims):
        fz = ratio((text or "").lower(), (_items[i]["question"] or "").lower()) / 100.0
        score = 0.75 * float(s) + 0.25 * float(fz)
        scored.append((i, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    out = []
    for idx, sc in scored[:top_k]:
        it = _items[idx]
        out.append({
            "id": it["id"], "question": it["question"], "answer": it["answer"],
            "tags": it.get("tags"), "score": round(sc, 3)
        })
    return out
