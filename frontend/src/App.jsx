import React from "react";
import ChatWidget from "./components/ChatWidget.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="site">
      {/* Header minimal */}
      <header className="nav">
        <div className="container nav-inner">
          <div className="brand">
            <span className="logo">🤖</span>
            <span>Mini Chatbot</span>
          </div>
          <nav className="nav-links">
            <button className="btn btn-primary" onClick={() => window.__openChat?.()}>
              Probar el chatbot
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Atiende preguntas al instante</h1>
            <p>
              Tu asistente virtual para responder preguntas frecuentes 24/7,
              con respuestas claras y sugerencias cuando no entiende.
            </p>
            <div className="cta-row">
              <button className="btn btn-primary" onClick={() => window.__openChat?.()}>
                Hablar con el asistente
              </button>
              <a className="btn btn-ghost" href="#about">Saber más</a>
            </div>
          </div>
          <div className="hero-art">
            <BotIllustration />
          </div>
        </div>
      </section>

      {/* Sobre el chatbot (breve) */}
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">Sobre el chatbot</h2>
          <ul className="about-list">
            <li>💬 Responde FAQs en segundos.</li>
            <li>🧠 Sugiere alternativas si no entiende tu pregunta.</li>
            <li>⚡ Ligero y fácil de integrar en cualquier web.</li>
            <li>🔒 Seguro: variables y credenciales fuera del repositorio.</li>
          </ul>
          <div className="center">
            <button className="btn" onClick={() => window.__openChat?.()}>
              Abrir chat
            </button>
          </div>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="brand">
            <span className="logo">🤖</span>
            <span>Mini Chatbot</span>
          </div>
          <p className="muted-text">React + Django · Demo minimal</p>
        </div>
      </footer>

      {/* Widget flotante */}
      <ChatWidget
        title="Asistente"
        placeholder="Escribe tu pregunta..."
        initialOpen={false}
        welcome="¡Hola! ¿En qué puedo ayudarte?"
        // Si usas la versión “Pepe-like”, puedes pasar también:
        // assistantName="Pepe"
        // assistantAvatar="🤖" // o URL a imagen
        // brandColor="#0ea5e9"
      />
    </div>
  );
}

/* --- Ilustración inline --- */
function BotIllustration() {
  return (
    <svg viewBox="0 0 320 320" className="bot-svg" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="140" fill="url(#g)" opacity="0.12" />
      <rect x="60" y="90" rx="16" ry="16" width="200" height="140" fill="#fff" stroke="#e5e7eb" />
      <circle cx="120" cy="150" r="10" fill="#111827" />
      <circle cx="200" cy="150" r="10" fill="#111827" />
      <rect x="120" y="185" width="80" height="10" rx="5" fill="#e5e7eb" />
      <path d="M160 70 v20" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <circle cx="160" cy="65" r="10" fill="#111827" />
      <rect x="40" y="250" width="240" height="6" rx="3" fill="#e5e7eb" />
      <rect x="75" y="115" width="170" height="20" rx="10" fill="#f3f4f6" />
      <rect x="75" y="205" width="170" height="20" rx="10" fill="#f3f4f6" />
    </svg>
  );
}
