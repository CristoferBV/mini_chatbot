import os
from rest_framework.exceptions import PermissionDenied

def require_admin(request):
    expected = os.getenv("API_ADMIN_TOKEN")
    token = request.headers.get("X-API-KEY")
    if not expected or token != expected:
        raise PermissionDenied("Invalid admin token")
