from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UpsertFaq
from .auth import require_admin
from .services.firestore_repo import add_faq, list_all_faqs
from .services.search_engine import build_index

@api_view(["POST"])
def upsert_faq(request):
    require_admin(request)
    ser = UpsertFaq(data=request.data)
    ser.is_valid(raise_exception=True)
    new_id = add_faq(**ser.validated_data)
    return Response({"ok": True, "id": new_id})

@api_view(["POST"])
def reindex(request):
    require_admin(request)
    count = build_index(list_all_faqs())
    return Response({"ok": True, "count": count})
