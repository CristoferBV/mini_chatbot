import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_PATH = import.meta.env.VITE_API_PATH || "/api/v1/ask/";
const API_URL = `${API_BASE.replace(/\/$/, "")}/${API_PATH.replace(/^\//, "")}`;
const API_ADMIN_TOKEN = import.meta.env.VITE_API_ADMIN_TOKEN || "";

const FAB_ICON = import.meta.env.VITE_CHAT_ICON || "/assets/Mini-Chatbot.png";

function getInitialMessages(welcome, initialSuggestions) {
  const init = [];
  if (welcome) {
    init.push({ role: "assistant", content: welcome });
  }
  if (Array.isArray(initialSuggestions) && initialSuggestions.length) {
    init.push({
      role: "assistant",
      type: "suggestions",
      content: "Quizá te interese:",
      suggestions: initialSuggestions,
    });
  }
  return init;
}

export default function ChatWidget({
  title = "Mini Chatbot",
  assistantAvatar = "/assets/Mini-Chatbot.png",
  brandColor = "#020203ff",
  placeholder = "Escribe tu pregunta...",
  initialOpen = false,
  welcome = "¡Hola! ¿En qué puedo ayudarte?",
  initialSuggestions = ["¿Tienen planes y precios?", "¿Puedo cambiar de plan?", "Política de reembolso"],
}) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() =>
    getInitialMessages(welcome, initialSuggestions)
  );
  const listRef = useRef(null);

  // Cerrar y reiniciar
  function handleClose() {
    setOpen(false);
    setInput("");
    setLoading(false);
    setMessages(getInitialMessages(welcome, initialSuggestions));
  }

  useEffect(() => {
    window.__openChat = () => setOpen(true);
    window.__closeChat = handleClose;
    return () => {
      delete window.__openChat;
      delete window.__closeChat;
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && open && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
          : data?.detail || res.statusText || "Error";
        throw new Error(errorText);
      }

      if (data?.answer) {
        setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
        return;
      }

      const hasSuggestions =
        Array.isArray(data?.suggestions) ||
        data?.status === "suggestions" ||
        data?.status === "not_understood" ||
        (Array.isArray(data?.matches) && data.matches.length > 0);

      if (hasSuggestions) {
        const byScore = (a, b) => (b.score || 0) - (a.score || 0);
        const fromMatches = (data.matches || [])
          .sort(byScore)
          .map((m) => m.question)
          .filter(Boolean);

        const all = [...(data.suggestions || []), ...fromMatches];
        const unique = [...new Set(all)].slice(0, 5);

        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            type: "suggestions",
            content: "Quizá te interese:",
            suggestions: unique,
          },
        ]);
        return;
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: "No tengo una respuesta por ahora. ¿Quieres intentar con otra forma de preguntarlo?" },
      ]);
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

  const isImg = typeof assistantAvatar === "string" && /^(https?:|data:|\/)/.test(assistantAvatar);

  return (
    <>
      {!open && (
        <button
          className="chat-fab"
          style={{ background: `linear-gradient(135deg, ${brandColor}, #000000ff)` }}
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
        >
          <img src={FAB_ICON} alt="Abrir Mini Chatbot" />
        </button>
      )}

      <div
        aria-hidden={!open}
        className={`chat-panel ${open ? "is-open" : ""}`}
        style={{ ["--brand"]: brandColor }}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="header-left">
            <div className="chat-avatar" aria-hidden="true">
              {isImg ? <img src={assistantAvatar} alt="" /> : <span>{assistantAvatar}</span>}
            </div>
            <div className="chat-title">
              <strong>{title}</strong>
            </div>
          </div>
          <div className="header-actions">
            <button className="chat-icon-btn" title="Cerrar" onClick={handleClose}>✕</button>
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
            aria-label="Enviar"
            style={{ background: brandColor, borderColor: brandColor }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff" aria-hidden="true">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
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
