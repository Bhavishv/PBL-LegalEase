import { useState, useRef, useEffect } from "react";

function ContractChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hello! I'm your LegalEase AI assistant. Ask me anything about this contract, or just say 'summarize'!" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleListening = (e) => {
    e.preventDefault();
    if (isListening) return;
    setIsListening(true);
    setInput("");
    
    let text = "What does clause 4 mean?";
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      setInput(text.substring(0, currentIndex + 1));
      currentIndex++;
      if (currentIndex === text.length) {
        clearInterval(interval);
        setTimeout(() => setIsListening(false), 500);
      }
    }, 50);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response Logic based on keywords
    setTimeout(() => {
      let botResponse = "I'm sorry, I don't see specific information about that in the highlighted clauses. Could you rephrase your question?";
      const lowerInput = userMessage.text.toLowerCase();

      if (lowerInput.includes("cancel") || lowerInput.includes("termination") || lowerInput.includes("stop")) {
        botResponse = "Regarding cancellation (Clause 1 & 3): You must provide written notice 90 days before the yearly renewal. Beware: if you cancel early, you are still liable for all remaining fees for the year.";
      } else if (lowerInput.includes("sue") || lowerInput.includes("court") || lowerInput.includes("dispute")) {
        botResponse = "Based on Clause 4: You cannot sue in regular court or join a class action. All disputes must be settled by mandatory, binding arbitration in Delaware.";
      } else if (lowerInput.includes("privacy") || lowerInput.includes("data") || lowerInput.includes("share")) {
        botResponse = "Clause 5 states that the provider can collect and share your data with third parties for marketing purposes without telling you directly.";
      } else if (lowerInput.includes("guarantee") || lowerInput.includes("uptime") || lowerInput.includes("work")) {
        botResponse = "Clause 2 guarantees 99.9% uptime for the SaaS platform, which excludes scheduled maintenance windows.";
      } else if (lowerInput.includes("summary") || lowerInput.includes("summarize") || lowerInput.includes("tl;dr")) {
        botResponse = "Contract Summary: 1-year auto-renewing term (90-day notice to cancel), strict early cancellation penalties, mandatory arbitration in Delaware, and broad data sharing permissions. Overall Risk Score: High.";
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "bot", text: botResponse }]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 btn-haptic ${
          isOpen ? "bg-slate-800 text-white rotate-90 scale-90" : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-bounce-custom"
        }`}
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-28 right-6 z-50 w-full max-w-sm sm:w-96 h-[32rem] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col transition-all duration-300 transform origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-50 opacity-0 pointer-events-none"
        }`}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 w-full animate-pulse-soft"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">Ask Your Contract</h3>
              <p className="text-xs text-blue-100 font-medium">AI Agent Online</p>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-sm shadow-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-white rounded-b-2xl border-t border-slate-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask a question..."}
              className={`flex-1 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${isListening ? 'bg-rose-50 placeholder-rose-400' : 'bg-slate-100'}`}
            />
            <button
               type="button"
               onClick={toggleListening}
               className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors btn-haptic ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
               title="Voice Input"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors btn-haptic"
            >
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ContractChatbot;
