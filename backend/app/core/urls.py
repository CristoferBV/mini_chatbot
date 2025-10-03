from django.urls import path
from .views_public import health, get_faq_suggestions, ask
from .views_admin import upsert_faq, reindex

urlpatterns = [
    # Público
    path("health", health, name="health"),
    path("faqs", get_faq_suggestions, name="faqs"),
    path("ask", ask, name="ask"),
    # Admin (protegidos por API key)
    path("admin/faqs", upsert_faq, name="admin_faqs"),
    path("admin/reindex", reindex, name="admin_reindex"),
]
