# Mini Chatbot — React + Django REST + Firestore

Widget de chat **embebible** (flotante) que responde **Preguntas Frecuentes (FAQ)** usando un backend en **Django REST** y datos en **Firebase/Firestore**.  
Cuando no encuentra una respuesta exacta, ofrece **sugerencias** (chips clicables) para guiar al usuario.

> **Highlights**
>
> - ✅ Botón flotante (FAB) que abre/cierra el chat
> - ✅ UX cuidada: sugerencias si no entiende, “typing” y autoscroll
> - ✅ Resetea la conversación al cerrar el widget
> - ✅ Configurable desde el front (color de marca, saludo, icono, etc.)
> - ✅ Sin LLMs ni servicios de terceros prohibidos: **solo Django + Firestore**
> - ✅ Seguridad práctica: `.env`, CORS, y push protection de secretos

* * *

## Tabla de contenidos

- [Requisitos](#requisitos)
- [Estructura del repo](#estructura-del-repo)
- [Puesta en marcha (dev)](#puesta-en-marcha-dev)
  - [Backend (Django)](#backend-django)
  - [Frontend (Vite/React)](#frontend-vitereact)
- [Uso rápido](#uso-rápido)
- [Contrato de API](#contrato-de-api)
- [Arquitectura y diseño](#arquitectura-y-diseño)
  - [Diagrama](#diagrama)
  - [Cómo “entiende” el bot](#cómo-entiende-el-bot)
  - [Por qué estas tecnologías](#por-qué-estas-tecnologías)
- [Configuración](#configuración)
  - [Variables de entorno (backend)](#variables-de-entorno-backend)
  - [Variables de entorno (frontend)](#variables-de-entorno-frontend)
  - [Cargar FAQs en Firestore](#cargar-faqs-en-firestore)
- [Personalización del widget](#personalización-del-widget)
- [Build y despliegue](#build-y-despliegue)
- [Solución de problemas](#solución-de-problemas)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

* * *

## Requisitos

- **Python 3.11+**
- **Node 18+** (o 20 LTS)
- **pip** y **venv**
- Proyecto de **Firebase** con **Firestore** habilitado y credencial de **Service Account** (JSON)

* * *

## Estructura del repo

```
mini_chatbot/
├─ backend/
│  ├─ app/                 # Proyecto Django (settings, urls, wsgi)
│  │  ├─ core/             # Vista / lógica de búsqueda y sugerencias
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  └─ wsgi.py
│  ├─ manage.py
│  └─ requirements.txt
└─ frontend/
   ├─ public/
   │  └─ assets/           # Íconos e imágenes (ej. Mini-Chatbot.png)
   ├─ src/
   │  ├─ components/
   │  │  ├─ ChatWidget.jsx
   │  │  └─ ChatWidget.css
   │  ├─ App.jsx
   │  └─ main.jsx
   ├─ index.html
   └─ package.json
```

> Nota: la carpeta y nombres exactos pueden variar mínimamente; esta guía asume la estructura actual del repo.

* * *

## Puesta en marcha (dev)

### Backend (Django)

1) Preparar entorno e instalar dependencias:
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scriptsctivate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

2) Variables de entorno (ver [Configuración](#variables-de-entorno-backend)).

3) Migraciones y runserver:
```bash
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

- Endpoint principal: `POST http://127.0.0.1:8000/api/v1/ask/`

---

### Frontend (Vite/React)

1) Variables de entorno (ver [Configuración](#variables-de-entorno-frontend)).

2) Instalar y correr:
```bash
cd frontend
npm ci
npm run dev
```

3) Abrir `http://localhost:5173`.  
Haz clic en el **botón flotante** (FAB) para abrir el chat.

* * *

## Uso rápido

- Escribe una pregunta **que exista** en tu colección `faqs` (Firestore) → el bot responde el `answer`.
- Escribe una pregunta **ambigua/inesperada** → responde “No estoy seguro…” y muestra **sugerencias** (chips) para clicar.
- Cierra el chat con ✕ → el widget **reinicia** la conversación (saludo + sugerencias iniciales, si las definiste).

* * *

## Contrato de API

### `POST /api/v1/ask/`

**Request**
```json
{ "message": "texto de la consulta" }
```

**Response — caso conocido**
```json
{ "answer": "contenido de la respuesta exacta" }
```

**Response — no entendido (con sugerencias)**
```json
{
  "status": "not_understood",
  "suggestions": ["Pregunta A", "Pregunta B", "Pregunta C"],
  "matches": [
    { "question": "Pregunta similar 1", "score": 0.82 },
    { "question": "Pregunta similar 2", "score": 0.73 }
  ]
}
```

> El frontend formatea este segundo caso como **chips clicables**.

* * *

## Arquitectura y diseño

### Diagrama

```mermaid
flowchart LR
  U[Usuario] -- escribe --> W[Widget React (Vite)]
  W -- POST /api/v1/ask --> D[Django REST]
  D -->|consulta| F[Firestore (FAQs)]
  D -->|answer / suggestions| W
```

### Cómo “entiende” el bot

1. Normaliza y compara la consulta contra las **FAQs** en Firestore.
2. Si hay **match** suficiente → devuelve `answer`.
3. Si el match es bajo o nulo → devuelve `status: not_understood` + **sugerencias** (mezcla `suggestions` + `matches`).
4. El **front** pinta las sugerencias como “chips” y permite reenviar con un clic.

### Por qué estas tecnologías

- **Django REST**: rápido de levantar, robusto, claro para una prueba técnica.
- **Firestore**: NoSQL administrado; alta disponibilidad; CRUD sencillo para FAQs.
- **Vite + React**: DX excelente y **widget** embebible y temable.

* * *

## Configuración

### Variables de entorno (backend)

Crea `backend/.env`:

```env
# Django
DJANGO_SECRET_KEY=pon-un-secreto-largo-y-unico
DEBUG=1
ALLOWED_HOSTS=127.0.0.1,localhost

# CORS: en dev puedes permitir el front local
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Header opcional si quieres validar un token por request
API_ADMIN_TOKEN=tokensito-opcional

# Firebase (elige UNA forma):

# A) Ruta a archivo JSON de Service Account (NO subir al repo)
GOOGLE_APPLICATION_CREDENTIALS=/ruta/segura/firebase-key.json

# B) JSON embebido (si tu hosting no permite archivos)
# FIREBASE_CREDENTIALS_JSON={ ...json... }
```

> Asegúrate de **NO** committear `.env` ni el JSON —déjalos ignorados por git.

---

### Variables de entorno (frontend)

Crea `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_PATH=/api/v1/ask/

# Opcional
# VITE_API_ADMIN_TOKEN=...
# VITE_CHAT_ICON=/assets/Mini-Chatbot.png
```

---

### Cargar FAQs en Firestore

Colección: **`faqs`**  
Documento (campos mínimos):

```json
{
  "question": "¿Cuál es la política de reembolso?",
  "answer": "Puedes solicitar reembolso dentro de X días...",
  "tags": ["pagos","reembolsos"]   // opcional
}
```

Formas de carga:
- Consola de **Firebase** → Firestore → Agregar documento.
- (Futuro) Script/seed o endpoint admin protegido.

* * *

## Personalización del widget

En `src/components/ChatWidget.jsx`:

- `brandColor="#111827"` — color de marca (afecta FAB, header, send button).
- `assistantAvatar="/assets/Mini-Chatbot.png"` — avatar en el header del chat.
- `welcome="¡Hola! ¿En qué puedo ayudarte?"` — mensaje inicial.
- `initialOpen={false}` — abre el chat al cargar si lo pones en `true`.
- `initialSuggestions={[...]}` — chips iniciales (máximo 10 recomendado).

CSS en `ChatWidget.css` (clases: `.chat-fab`, `.chat-panel`, `.msg-bubble`, etc.).

* * *

## Build y despliegue

### Opción A — **Mismo dominio** (sin CORS)
- **Reverse proxy (Nginx/Traefik)**:
  - `/` → sirve el **build** del frontend (`npm run build` → `dist/`)
  - `/api/` → proxy al **Django** (gunicorn/uvicorn)
- Front `.env`:
  ```
  VITE_API_BASE_URL=
  VITE_API_PATH=/api/v1/ask/
  ```
- Back `.env`:
  ```
  DEBUG=0
  ALLOWED_HOSTS=tu-dominio.com
  ```
- **HTTPS** recomendado.

### Opción B — **Dominios separados** (con CORS)
- **Frontend**: Vercel / Netlify / Cloudflare Pages
- **Backend**: Render / Railway / Fly.io / Cloud Run
- Front `.env` (prod):
  ```
  VITE_API_BASE_URL=https://api.tu-dominio.com
  VITE_API_PATH=/api/v1/ask/
  ```
- Back `.env`:
  ```
  DEBUG=0
  ALLOWED_HOSTS=api.tu-dominio.com
  CORS_ALLOWED_ORIGINS=https://tu-front.vercel.app
  ```

> **Firebase en producción**: usa secretos del proveedor (archivos secretos o variables encriptadas). **No** subas el JSON.

* * *

## Solución de problemas

- **CORS bloqueado** → agrega el origen exacto del front en `CORS_ALLOWED_ORIGINS`.
- **400 “Este campo es requerido”** → el body debe ser `{ "message": "..." }` y header `Content-Type: application/json`.
- **Credenciales Firebase** → revisa `GOOGLE_APPLICATION_CREDENTIALS` o `FIREBASE_CREDENTIALS_JSON` y permisos del Service Account.
- **404 del endpoint** → respeta el **slash final** en `VITE_API_PATH=/api/v1/ask/`.
- **Doble render en dev (StrictMode)** → evita duplicar efectos de montaje; usa estado inicial para sugerencias.

* * *

## Roadmap

- [ ] Endpoint admin para CRUD de FAQs (autenticado).
- [ ] Búsqueda semántica (embeddings + vector store) manteniendo compatibilidad.
- [ ] Rate limiting + logging estructurado para prod.
- [ ] Tests unitarios (matcher/endpoints) y CI.

* * *

## Licencia

MIT (o la que prefieras).

---

**© 2025 CristoferBV — Todos los derechos reservados.**
