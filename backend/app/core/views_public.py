from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import AskRequest
from .services.firestore_repo import list_faqs, list_all_faqs
from .services.search_engine import build_index, query as search_query

_index_ready = False

def _ensure_index():
    global _index_ready
    if not _index_ready:
        items = list_all_faqs()
        build_index(items)
        _index_ready = True

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})

@api_view(["GET"])
def get_faq_suggestions(request):
    limit = int(request.GET.get("limit", 10))
    items = list_faqs(limit=limit)
    return Response([{"id": i["id"], "question": i["question"], "tags": i["tags"]} for i in items])

@api_view(["POST"])
def ask(request):
    _ensure_index()
    ser = AskRequest(data=request.data)
    ser.is_valid(raise_exception=True)
    message = ser.validated_data["message"]

    results = search_query(message, top_k=5)
    if not results:
        return Response({"status": "not_understood", "suggestions": []})

    TH_ANSWER = 0.65
    TH_SUGGEST = 0.40
    best = results[0]
    matches = [{"id": r["id"], "question": r["question"], "score": r["score"]} for r in results]

    if best["score"] >= TH_ANSWER:
        return Response({
            "status": "answered",
            "answer": best["answer"],
            "matches": matches,
            "context_tag": (best.get("tags") or "").split(",")[0] or None
        })
    elif best["score"] >= TH_SUGGEST:
        return Response({
            "status": "suggestions",
            "suggestions": [r["question"] for r in results[:3]],
            "matches": matches
        })
    else:
        return Response({
            "status": "not_understood",
            "suggestions": [r["question"] for r in results],
            "matches": matches
        })
