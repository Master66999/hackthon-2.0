import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatTeardropDots, X, PaperPlaneRight, Sparkle, SpeakerHigh,
  Plant, CaretUp, Robot
} from '@phosphor-icons/react';
import './ChatWidget.css';

const PRESET_QUESTIONS = [
  '🌿 How do I treat leaf rust organically?',
  '🧪 What N-P-K fertilizer ratio is best for cotton?',
  '💧 How much watering is needed for black soil?',
  '☀️ How does heat wave affect fungal disease risk?'
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechLang, setSpeechLang] = useState('en');
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your LeafSense AI Agronomist. Ask me anything about crop diseases, soil nutrients, organic treatments, or climate impacts!'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const apiKey = localStorage.getItem('leafsense_ai_key') || '';
      const res = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-AI-API-Key': apiKey } : {})
        },
        body: JSON.stringify({
          question: text,
          context: { crop: 'Crop', disease: 'Condition' }
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.answer || 'I am currently examining the agronomic data. Please try again.' }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'For organic pathology care: apply Neem oil 5ml/L or Trichoderma viride. Ensure proper field drainage.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', es: 'es-ES' };
    utterance.lang = langMap[speechLang] || 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="cw-wrapper">
      {/* Floating Chat Trigger Button */}
      <motion.button
        className="cw-trigger neo-raised"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open AI Agronomist Chat"
      >
        {isOpen ? (
          <X size={24} weight="bold" />
        ) : (
          <div className="cw-trigger-content">
            <Sparkle size={22} weight="fill" className="cw-sparkle-icon" />
            <span className="cw-trigger-text">AI Agronomist</span>
          </div>
        )}
      </motion.button>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cw-card neo-raised"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <header className="cw-header">
              <div className="cw-header-info">
                <div className="cw-avatar">
                  <Robot size={20} weight="fill" />
                </div>
                <div>
                  <h4 className="cw-title">LeafSense AI Agronomist</h4>
                  <span className="cw-status">
                    <span className="cw-status-dot" /> Online • Pathological Assistant
                  </span>
                </div>
              </div>

              <div className="cw-header-actions">
                <select
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value)}
                  className="cw-lang-select"
                  title="Speech Audio Language"
                >
                  <option value="en">EN</option>
                  <option value="hi">हिन्दी</option>
                  <option value="mr">मराठी</option>
                  <option value="es">ES</option>
                </select>

                <button className="cw-close-btn" onClick={() => setIsOpen(false)}>
                  <X size={18} weight="bold" />
                </button>
              </div>
            </header>

            {/* Chat Transcript Area */}
            <div className="cw-body">
              {messages.map((msg, idx) => (
                <div key={idx} className={`cw-msg cw-msg--${msg.sender}`}>
                  {msg.sender === 'ai' && (
                    <div className="cw-msg-avatar">
                      <Plant size={14} weight="fill" />
                    </div>
                  )}
                  <div className="cw-bubble">
                    <p>{msg.text}</p>
                    {msg.sender === 'ai' && (
                      <button
                        className="cw-speak-btn"
                        onClick={() => speakText(msg.text)}
                        title="Listen to advice"
                      >
                        <SpeakerHigh size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="cw-msg cw-msg--ai">
                  <div className="cw-msg-avatar">
                    <Plant size={14} weight="fill" />
                  </div>
                  <div className="cw-bubble cw-bubble--loading">
                    <span className="cw-dot" />
                    <span className="cw-dot" />
                    <span className="cw-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="cw-presets">
              {PRESET_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="cw-preset-pill"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="cw-footer"
            >
              <input
                type="text"
                className="cw-input"
                placeholder="Ask about crops, fertilizers, or diseases..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="cw-send-btn btn btn-primary"
                disabled={loading || !input.trim()}
              >
                <PaperPlaneRight size={18} weight="bold" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
