import React from "react";
import ChatWidget from "./components/ChatWidget.jsx";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <main style={{ textAlign: "center", maxWidth: 720 }}>
        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Mini Chatbot</h1>
        <p style={{ opacity: 0.7 }}>
          Página ligera. Usa el botón flotante abajo a la derecha
          para abrir el chat, o configúralo para abrirse automáticamente.
        </p>
      </main>

      {/* Widget flotante (pon initialOpen a true si quieres que se abra solo) */}
      <ChatWidget
        title="Asistente"
        placeholder="Escribe tu pregunta..."
        initialOpen={false}      // ← pon true para abrir al cargar
        welcome="¡Hola! ¿En qué puedo ayudarte?"
      />
    </div>
  );
}
