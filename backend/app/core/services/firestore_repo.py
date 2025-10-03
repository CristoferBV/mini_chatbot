import os
from google.cloud import firestore

_client = None
COLLECTION = "faqs"

def _client():
    global _client
    if _client is None:
        cred = os.getenv("FIREBASE_CREDENTIALS")
        if cred:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred
        _client = firestore.Client()
    return _client

def list_faqs(limit=10):
    docs = _client().collection(COLLECTION).limit(limit).stream()
    out = []
    for d in docs:
        data = d.to_dict() or {}
        out.append({
            "id": d.id,
            "question": data.get("question",""),
            "answer": data.get("answer",""),
            "tags": data.get("tags",""),
        })
    return out

def list_all_faqs():
    docs = _client().collection(COLLECTION).stream()
    out = []
    for d in docs:
        data = d.to_dict() or {}
        out.append({
            "id": d.id,
            "question": data.get("question",""),
            "answer": data.get("answer",""),
            "tags": data.get("tags",""),
        })
    return out

def add_faq(question:str, answer:str, tags:str=""):
    _, ref = _client().collection(COLLECTION).add({
        "question": question, "answer": answer, "tags": tags or ""
    })
    return ref.id
