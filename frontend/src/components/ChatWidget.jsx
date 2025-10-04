import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_PATH = import.meta.env.VITE_API_PATH || "/api/v1/ask";
const API_URL = `${API_BASE.replace(/\/$/, "")}${API_PATH}`;
const API_ADMIN_TOKEN = import.meta.env.VITE_API_ADMIN_TOKEN || "";

export default function ChatWidget({
  title = "Chat",
  placeholder = "Escribe un mensaje...",
  initialOpen = false,
  welcome = "",
}) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() =>
    welcome ? [{ role: "assistant", content: welcome }] : []
  );
  const panelRef = useRef(null);
  const listRef = useRef(null);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Cerrar con ESC cuando está abierto
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Ajusta el payload a lo que espera tu backend.
      // Ejemplo común: { question: "..." } o { message: "..." }
      const body = { question: text };

      const headers = {
        "Content-Type": "application/json",
      };
      if (API_ADMIN_TOKEN) headers["X-API-ADMIN-TOKEN"] = API_ADMIN_TOKEN;

      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      // Ajusta el parseo de respuesta:
      // - Si tu backend devuelve { answer: "..." }
      // - O { data: { reply: "..." } } etc.
      const data = await res.json();
      const botText =
        data?.answer ||
        data?.reply ||
        data?.message ||
        data?.response ||
        JSON.stringify(data);

      setMessages((m) => [...m, { role: "assistant", content: botText }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Lo siento, ocurrió un error al consultar el backend.\n\n" +
            String(err?.message || err),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          style={styles.fab}
        >
          💬
        </button>
      )}

      {/* Panel del chat */}
      <div
        ref={panelRef}
        aria-hidden={!open}
        style={{
          ...styles.panel,
          transform: open ? "translateY(0)" : "translateY(24px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div style={styles.header}>
          <strong>{title}</strong>
          <button onClick={() => setOpen(false)} style={styles.iconBtn} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div ref={listRef} style={styles.messages}>
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.content} />
          ))}
          {loading && <TypingBubble />}
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <input
            type="text"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              ...styles.sendBtn,
              opacity: loading || !input.trim() ? 0.6 : 1,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}

function MessageBubble({ role, text }) {
  const me = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: me ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 12px",
          borderRadius: 12,
          background: me ? "#111827" : "#f3f4f6",
          color: me ? "#ffffff" : "#111827",
          whiteSpace: "pre-wrap",
          lineHeight: 1.3,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: "flex", gap: 6, margin: "8px 0 16px 0" }}>
      <Dot />
      <Dot />
      <Dot />
    </div>
  );
}

function Dot() {
  const base = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#9ca3af",
    animation: "chatdot 1.2s infinite ease-in-out",
  };
  return <span style={base} />;
}

const styles = {
  fab: {
    position: "fixed",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: "9999px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    fontSize: 22,
    lineHeight: "56px",
    textAlign: "center",
    cursor: "pointer",
  },
  panel: {
    position: "fixed",
    right: 20,
    bottom: 20,
    width: 360,
    maxWidth: "92vw",
    height: 520,
    maxHeight: "75vh",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    transition: "all .25s ease",
  },
  header: {
    height: 48,
    padding: "0 12px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    padding: 12,
    overflowY: "auto",
    background: "#fff",
  },
  form: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #f3f4f6",
  },
  input: {
    flex: 1,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
  },
  sendBtn: {
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
  },
};

// Animación simple para los 3 puntitos
const styleEl = document.createElement("style");
styleEl.textContent = `
@keyframes chatdot {
  0%, 80%, 100% { transform: scale(0.8); opacity: .4; }
  40% { transform: scale(1); opacity: 1; }
}
span[style*="animation: chatdot"]:nth-child(2) { animation-delay: .15s; }
span[style*="animation: chatdot"]:nth-child(3) { animation-delay: .3s; }
`;
document.head.appendChild(styleEl);
