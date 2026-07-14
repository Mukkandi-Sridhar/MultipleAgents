import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ShieldAlert } from 'lucide-react';
import type { SupportMessage } from '../types';
import { API_BASE_URL } from '../lib/apiConfig';

export const SupportAgent: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([
    { role: 'assistant', content: 'Hello! I am the Aether FAQ Support Assistant. Ask me anything about Aether Agents features, subscription rates, or developer API integrations!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || escalated || loading) return;

    const userMessage: SupportMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages
        })
      });
      if (!response.ok) throw new Error('API server returned error');
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.escalate_to_human) {
        setEscalated(true);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the local server or chat request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      { role: 'assistant', content: 'Hello! I am the Aether FAQ Support Assistant. Ask me anything about Aether Agents features, subscription rates, or developer API integrations!' }
    ]);
    setEscalated(false);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in w-full h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Title */}
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
            [ rag grounding & support ]
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">
            FAQ Support Agent
          </h2>
          <p className="text-slate-400 text-sm">
            Instant grounded answers based on our static FAQ articles. Escalates immediately if query is out of bounds.
          </p>
        </div>
        <button
          onClick={handleResetChat}
          className="text-xs font-semibold text-slate-500 hover:text-white uppercase transition-colors"
        >
          Reset Session
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 glass-panel rounded-3xl p-6 overflow-y-auto mb-4 space-y-4 shadow-inner min-h-[300px]">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${
                isUser ? 'bg-brand-500/15 border-brand-500/35 text-brand-400' : 'bg-amber-500/15 border-amber-500/35 text-amber-400'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed border ${
                isUser 
                  ? 'bg-brand-500/10 border-brand-500/20 text-slate-200' 
                  : 'bg-dark-900 border-white/5 text-slate-300'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3.5 max-w-[85%]">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border bg-amber-500/15 border-amber-500/35 text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-dark-900 border border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
            </div>
          </div>
        )}

        {/* Escalated Status */}
        {escalated && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 text-center mt-6 animate-fade-in">
            <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <h5 className="font-bold text-rose-300 text-sm mb-0.5">Support Escalated to Human</h5>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              Our FAQ database does not cover this question. A help ticket has been dispatched to human support, and standard chat flows are temporarily locked.
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} className="flex items-center gap-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={escalated || loading}
          placeholder={escalated ? "Support channel locked..." : "Ask about prices, setups, customized models..."}
          className="flex-1 bg-dark-850 border border-white/5 disabled:bg-slate-900 disabled:text-slate-700 rounded-2xl px-5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          disabled={escalated || loading || !input.trim()}
          className="bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-2xl transition-all duration-200 shadow-glow-purple-strong shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
