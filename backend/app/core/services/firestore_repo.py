import os
from google.cloud import firestore

# Evita colisión de nombres: usa _client_instance SOLO para la instancia
_client_instance = None
COLLECTION = "faqs"

def get_client():
    """Devuelve una única instancia de firestore.Client() (patrón singleton simple)."""
    global _client_instance
    if _client_instance is None:
        cred = os.getenv("FIREBASE_CREDENTIALS")
        if cred:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred
        _client_instance = firestore.Client()
    return _client_instance

def list_faqs(limit=10):
    db = get_client()
    docs = db.collection(COLLECTION).limit(limit).stream()
    items = []
    for d in docs:
        data = d.to_dict() or {}
        items.append({
            "id": d.id,
            "question": data.get("question", ""),
            "answer": data.get("answer", ""),
            "tags": data.get("tags", ""),
        })
    return items

def list_all_faqs():
    db = get_client()
    docs = db.collection(COLLECTION).stream()
    items = []
    for d in docs:
        data = d.to_dict() or {}
        items.append({
            "id": d.id,
            "question": data.get("question", ""),
            "answer": data.get("answer", ""),
            "tags": data.get("tags", ""),
        })
    return items

def add_faq(question: str, answer: str, tags: str = ""):
    db = get_client()
    _, ref = db.collection(COLLECTION).add({
        "question": question,
        "answer": answer,
        "tags": tags or ""
    })
    return ref.id
