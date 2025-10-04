import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";

// URL robusta
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_PATH = import.meta.env.VITE_API_PATH || "/api/v1/ask/"; // con slash final
const API_URL = `${API_BASE.replace(/\/$/, "")}/${API_PATH.replace(/^\//, "")}`;
const API_ADMIN_TOKEN = import.meta.env.VITE_API_ADMIN_TOKEN || "";

export default function ChatWidget({
  title = "Asistente",
  assistantName = "Pepe",
  assistantAvatar = "🤖",          // puede ser emoji o URL a imagen
  brandColor = "#0ea5e9",          // color principal (cyan por defecto)
  placeholder = "Escribe tu pregunta...",
  initialOpen = false,
  welcome = "¡Hola! ¿En qué puedo ayudarte?",
  initialSuggestions = ["¿Tienen planes y precios?", "¿Puedo cambiar de plan?", "Política de reembolso"]
}) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() =>
    welcome ? [{ role: "assistant", content: welcome }] : []
  );
  const panelRef = useRef(null);
  const listRef = useRef(null);

  // Exponer open/close a la página (para botones externos)
  useEffect(() => {
    window.__openChat = () => setOpen(true);
    window.__closeChat = () => setOpen(false);
    return () => { delete window.__openChat; delete window.__closeChat; };
  }, []);

  // Agregar sugerencias iniciales
  useEffect(() => {
    if (initialSuggestions?.length) {
      setMessages((m) => [
        ...m,
        { role: "assistant", type: "suggestions", content: "Quizá te interese:", suggestions: initialSuggestions }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && open && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Enviar (permite override para sugerencias)
  async function send(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (API_ADMIN_TOKEN) headers["X-API-ADMIN-TOKEN"] = API_ADMIN_TOKEN;

      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorText =
          Array.isArray(data?.message) ? data.message.join(" ")
          : data?.detail || JSON.stringify(data) || res.statusText;
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      if (data?.answer) {
        setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
        return;
      }

      if (data?.status === "not_understood") {
        const byScore = (a, b) => (b.score || 0) - (a.score || 0);
        const fromMatches = (data.matches || [])
          .sort(byScore)
          .map((m) => m.question)
          .filter(Boolean);
        const all = [...(data.suggestions || []), ...fromMatches];
        const unique = [...new Set(all)].slice(0, 5);
        setMessages((m) => [
          ...m,
          { role: "assistant", type: "suggestions", content: "No estoy seguro de eso. ¿Te refieres a…?", suggestions: unique }
        ]);
        return;
      }

      const botText = data?.reply || data?.message || JSON.stringify(data) || "No tengo una respuesta por ahora.";
      setMessages((m) => [...m, { role: "assistant", content: botText }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Lo siento, ocurrió un error.\n\n" + String(err?.message || err) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  // Detectar si el avatar es URL o emoji/texto
  const isImg = typeof assistantAvatar === "string" && /^(https?:|data:|\/)/.test(assistantAvatar);

  return (
    <>
      {!open && (
        <button
          className="chat-fab"
          style={{ background: `linear-gradient(135deg, ${brandColor}, #7c3aed)`, color: "#fff" }}
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
        >
          💬
        </button>
      )}

      <div
        ref={panelRef}
        aria-hidden={!open}
        className={`chat-panel ${open ? "is-open" : ""}`}
        style={{ ["--brand"]: brandColor }}
      >
        <div className="chat-header">
          <div className="header-left">
            <div className="chat-avatar" aria-hidden="true">
              {isImg ? <img src={assistantAvatar} alt="" /> : <span>{assistantAvatar}</span>}
            </div>
            <div className="chat-title">
              <strong>{assistantName}</strong>
              <small>Asistente virtual</small>
            </div>
          </div>
          <div className="header-actions">
            <button className="chat-icon-btn" title="Minimizar" onClick={() => setOpen(false)}>—</button>
            <button className="chat-icon-btn" title="Cerrar" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        <div ref={listRef} className="chat-messages" aria-live="polite">
          {messages.map((m, i) =>
            m.type === "suggestions" ? (
              <SuggestionsBubble key={i} text={m.content} options={m.suggestions || []} onPick={(opt) => send(opt)} />
            ) : (
              <MessageBubble key={i} role={m.role} text={m.content} />
            )
          )}
          {loading && <TypingBubble />}
        </div>

        <form onSubmit={onSubmit} className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={loading || !input.trim()}
            style={{ background: brandColor, borderColor: brandColor }}
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
    <div className={`msg-row ${me ? "me" : "other"}`}>
      <div className={`msg-bubble ${me ? "me" : "other"}`}>{text}</div>
    </div>
  );
}

function SuggestionsBubble({ text, options, onPick }) {
  return (
    <div className="sugg-block">
      <div className="sugg-text">{text}</div>
      <div className="sugg-chips">
        {options.map((opt, i) => (
          <button key={i} className="sugg-chip" onClick={() => onPick(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="typing-dots">
      <span></span><span></span><span></span>
    </div>
  );
}
