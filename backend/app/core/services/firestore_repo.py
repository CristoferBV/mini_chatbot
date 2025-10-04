import os
import json
from google.cloud import firestore
from google.oauth2 import service_account

_client_instance = None
COLLECTION = "faqs"

def get_client():
    """
    Crea el cliente de Firestore usando:
    - FIREBASE_CREDENTIALS_JSON (contenido JSON en .env), o
    - FIREBASE_CREDENTIALS (ruta ABSOLUTA al JSON).
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
    path = os.getenv("FIREBASE_CREDENTIALS")

    if json_str:
        info = json.loads(json_str)
        creds = service_account.Credentials.from_service_account_info(info)
        project_id = info.get("project_id")
        _client_instance = firestore.Client(project=project_id, credentials=creds)
        return _client_instance

    if path:
        path = os.path.abspath(path)
        if not os.path.isfile(path):
            raise RuntimeError(f"El archivo de credenciales no existe: {path}")
        creds = service_account.Credentials.from_service_account_file(path)
        project_id = getattr(creds, "project_id", None)
        _client_instance = firestore.Client(project=project_id, credentials=creds)
        return _client_instance

    raise RuntimeError(
        "Falta configuración: define FIREBASE_CREDENTIALS (ruta ABSOLUTA) "
        "o FIREBASE_CREDENTIALS_JSON (contenido)."
    )

def list_faqs(limit=10):
    db = get_client()
    docs = db.collection(COLLECTION).limit(limit).stream()
    items = []
    for d in docs:
        data = d.to_dict() or {}
        items.append({
            "id": d.id,
            "question": data.get("question",""),
            "answer": data.get("answer",""),
            "tags": data.get("tags",""),
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
            "question": data.get("question",""),
            "answer": data.get("answer",""),
            "tags": data.get("tags",""),
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
