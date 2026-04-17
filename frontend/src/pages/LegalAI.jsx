import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Shield, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LegalAI = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your LegalEase AI consultant. I can help explain legal terms, discuss contract types, or provide general legal information. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      text: input, // matched for backend
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Create chat history for the AI
      const history = messages.map(m => ({
        role: m.role,
        text: m.content
      }));

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_text: "General Legal Context: You are a legal education assistant. Provide accurate general legal information.",
          query: input,
          history: history
        })
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.reply || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat API Error:", error);
      const errorMessage = {
        role: 'assistant',
        content: "Error: Could not reach the AI service. Please make sure the backend is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-grid">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full p-4 md:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Legal AI Consultant <Sparkles className="w-5 h-5 text-blue-600 fill-blue-600/20" />
              </h1>
              <p className="text-sm text-slate-500">Your intelligent legal companion</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Secure AI Analysis
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden flex flex-col glass-card border-slate-200/60 rounded-3xl relative">
          
          {/* Background Decorative Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 border-slate-800 text-white' 
                      : 'bg-white border-blue-100 text-blue-600 shadow-sm'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={`px-5 py-3.5 rounded-3xl shadow-sm border ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                    }`}>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className={`text-[10px] font-medium text-slate-400 ${msg.role === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Warning / Notice */}
          <div className="mx-8 mb-4 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start animate-fade-in">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-normal">
              Disclaimer: LegalEase AI provides general information, not legal advice. Always consult with a qualified professional for critical legal matters.
            </p>
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSend}
            className="p-4 md:p-6 bg-white border-t border-slate-100 relative group"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a clause, legal term, or contract advice..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                  input.trim() && !isTyping 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Suggested Queries */}
        <div className="mt-6 flex flex-wrap gap-2 animate-fade-in [animation-delay:0.3s]">
          {["What is Indemnification?", "Explain Force Majeure", "Types of NDA", "Termination Clauses"].map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-full text-xs font-medium text-slate-600 hover:text-blue-700 transition-all shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalAI;
