from typing import List, Dict, Optional
from rapidfuzz.fuzz import ratio
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import spmatrix

_items: List[Dict] = []
_vectorizer: Optional[TfidfVectorizer] = None
_matrix: Optional[spmatrix] = None

def build_index(items: List[Dict]) -> int:
    
    global _items, _vectorizer, _matrix
    _items = items or []
    corpus = [(it.get("question") or "").strip() for it in _items]
    _vectorizer = TfidfVectorizer(lowercase=True)
    if len(corpus) == 0:
        _matrix = None
        return 0
    _matrix = _vectorizer.fit_transform(corpus)
    return len(_items)

def query(text: str, top_k: int = 5) -> List[Dict]:
    if _vectorizer is None or _matrix is None:
        return []
    if getattr(_matrix, "shape", (0, 0))[0] == 0 or getattr(_matrix, "shape", (0, 0))[1] == 0:
        return []

    qv = _vectorizer.transform([text or ""])
    sims = cosine_similarity(qv, _matrix).flatten()

    scored: List[Dict] = []
    for i, s in enumerate(sims):
        src = _items[i]
        q_src = (src.get("question") or "")
        fz = ratio((text or "").lower(), q_src.lower()) / 100.0
        score = float(0.7 * float(s) + 0.3 * float(fz))
        scored.append({
            "id": src.get("id"),
            "question": q_src,
            "answer": src.get("answer", ""),
            "score": score,
            "cosine": float(s),
            "fuzzy": float(fz),
            "item": src,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:max(1, top_k)]
