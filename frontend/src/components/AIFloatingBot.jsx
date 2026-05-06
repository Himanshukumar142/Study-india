import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Move, Minus, Maximize2 } from 'lucide-react';
import api from '../services/api';
import { useParams, useLocation } from 'react-router-dom';

export default function AIFloatingBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Antigravity AI. How can I help you with your studies today? You can ask me to "Explain question 1" if you are on a result page!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const chatEndRef = useRef(null);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  // Detect attemptId from URL if on QuizResultPage
  const attemptId = location.pathname.includes('/quiz/result/') ? location.pathname.split('/').pop() : null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = Math.min(Math.max(0, e.clientX - offset.current.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.clientY - offset.current.y), window.innerHeight - 60);
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: userMessage,
        attemptId: attemptId
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'pointer',
          zIndex: 9999,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          border: '3px solid white',
        }}
      >
        <Bot color="white" size={30} />
        {/* Tooltip */}
        {!isOpen && (
           <div style={{ position: 'absolute', right: 70, background: 'white', padding: '8px 12px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', color: '#1e293b' }}>
             Need help? Ask me!
           </div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 90,
            width: 350,
            height: 500,
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Antigravity AI</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Online Mentor</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 16,
                  fontSize: 14,
                  lineHeight: 1.5,
                  background: m.role === 'user' ? '#4f46e5' : 'white',
                  color: m.role === 'user' ? 'white' : '#1e293b',
                  boxShadow: m.role === 'user' ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                  border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '10px 14px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'bounce 0.6s infinite' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'bounce 0.6s infinite 0.2s' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'bounce 0.6s infinite 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, background: 'white' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                border: '1px solid #e2e8f0',
                borderRadius: 99,
                padding: '8px 16px',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
