from django.core.management.base import BaseCommand
from app.core.services.firestore_repo import add_faq

SEED = [
    ("¿Cuáles son los horarios de atención?", "Lun–Vie 8:00–17:00.", "soporte,horario"),
    ("¿Tienen planes y precios?", "Básico ($9), Pro ($19), Empresa ($49).", "planes,precios"),
    ("¿Qué métodos de pago aceptan?", "Tarjeta y transferencia.", "pagos"),
    ("¿Cómo contacto soporte?", "soporte@ejemplo.com o chat en la web.", "soporte,contacto"),
    ("¿Cómo cancelo mi suscripción?", "Panel → Configuración → Suscripción.", "suscripcion"),
    ("¿Ofrecen prueba gratis?", "Sí, 7 días en Plan Pro.", "planes,trial"),
    ("¿Política de reembolso?", "14 días si no cumple expectativas.", "legal,reembolsos"),
    ("¿Puedo cambiar de plan?", "Sí, en cualquier momento.", "planes"),
    ("¿Cómo recupero mi contraseña?", "Usa 'Olvidé mi contraseña' en la pantalla de acceso.", "cuentas,seguridad"),
    ("¿Dónde veo mis facturas?", "Panel → Facturación → Historial.", "pagos,facturacion"),
]

class Command(BaseCommand):
    help = "Carga 10 FAQs en Firestore"

    def handle(self, *args, **kwargs):
        for q, a, t in SEED:
            add_faq(question=q, answer=a, tags=t)
        self.stdout.write(self.style.SUCCESS("Seed FAQs listo"))
