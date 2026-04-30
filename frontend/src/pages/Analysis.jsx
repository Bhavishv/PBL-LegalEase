import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, AlertTriangle, CheckCircle, ArrowLeft, Download, Share2, 
  ChevronRight, Search, Filter, MessageCircle, FileText, Info,
  Check, X, ThumbsUp, ThumbsDown, Zap, Scale, Gavel, HelpCircle,
  Sparkles, Eye, Target, Languages, Loader2,
  PenTool, Volume2, Square
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Analysis = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeClause, setActive] = useState(null);
  const [filter, setFilter] = useState("all");
  const [pageState, setPageState] = useState("loading");
  const [reading, setReading] = useState(false);
  const [activeTab, setActiveTab] = useState("breakdown");
  const [isLive, setIsLive] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [showSignature, setShowSignature] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef(null);
  
  // Translation State
  const [targetLang, setTargetLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState({}); // Cache translations

  // API URL from env
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Onboarding State
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  const fullTextRef = useRef("");
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Signature Canvas Logic
  const startDrawing = (e) => {
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setSignatureData(null);
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("legalease_analysis");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.clauses?.length) {
          const clauses = parsed.clauses.map(c => ({
             ...c,
             risk_level: c.risk_level === "high-risk" ? "high" : c.risk_level
          }));
          setData({ ...parsed, clauses });
          setActive(clauses[0]?.id ?? null);
          setPageState("ready");
          if (!localStorage.getItem("tour_completed")) {
            setTimeout(() => setShowTour(true), 1000);
          }
          return;
        }
      }
    } catch (_) {}
    setPageState("empty");
  }, []);

  const handleFeedback = (clauseId, isAccurate) => {
    setFeedback(prev => ({ ...prev, [clauseId]: isAccurate }));
  };

  const handleTranslate = async (text, lang) => {
    if (lang === "en") return;
    const cacheKey = `${text.slice(0, 50)}_${lang}`;
    if (translations[cacheKey]) return;

    setTranslating(true);
    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_lang: lang })
      });
      const json = await res.json();
      if (json.translated) {
        setTranslations(prev => ({ ...prev, [cacheKey]: json.translated }));
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslating(false);
    }
  };

  const getActiveTranslation = () => {
    if (!selected) return "";
    let text = "";
    if (targetLang === "en") {
      text = selected.explanation;
    } else {
      const cacheKey = `${selected.explanation.slice(0, 50)}_${targetLang}`;
      text = translations[cacheKey] || selected.explanation;
    }
    return text.replace(/\*\*/g, "");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSpeech = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    speechRef.current = utterance;
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem("tour_completed", "true");
  };

  if (pageState === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Zap className="w-12 h-12 text-blue-500 animate-pulse" /></div>;
  if (pageState === "empty") return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="max-w-md text-center glass-card p-10 rounded-[3rem]"><h2 className="text-2xl font-black mb-4">No Document Loaded</h2><button onClick={() => navigate("/dashboard")} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">Go to Dashboard</button></div></div>;

  const clauses = data?.clauses ?? [];
  const filtered = filter === "all" ? clauses : clauses.filter(c => c.risk_level === filter);
  const selected = clauses.find(c => c.id === activeClause);
  const score = data?.overall_score ?? 0;

  const glossaryItems = [
    { section: "ICA Section 10", title: "What is a Valid Contract?", meaning: "For a contract to be legal, everyone must agree freely, be of sound mind, and there must be a lawful reason (consideration)." },
    { section: "ICA Section 27", title: "Freedom to Work", meaning: "Any agreement that stops you from practicing your profession or trade is generally void and illegal." },
    { section: "ICA Section 73", title: "Breach of Contract", meaning: "If someone breaks the contract, you are entitled to compensation for the actual loss caused by that breach." },
    { section: "IPC Section 420", title: "Cheating", meaning: "If someone uses a contract to trick you into giving them money or property dishonestly, it is a criminal offense." },
    { section: "IPC Section 406", title: "Criminal Breach of Trust", meaning: "If you trust someone with your property via a contract and they use it for their own gain, they can be prosecuted." },
    { section: "ICA Section 124", title: "Indemnity", meaning: "A promise to protect you from any loss caused by the person making the promise or by someone else." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 pb-32 print:bg-white print:p-0">
      
      {/* ── ONBOARDING TOOLTIPS ── */}
      {showTour && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm print:hidden">
           <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 shadow-2xl animate-scale-in">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                 {tourStep === 0 && <Shield className="w-8 h-8 text-blue-600" />}
                 {tourStep === 1 && <Target className="w-8 h-8 text-blue-600" />}
                 {tourStep === 2 && <Languages className="w-8 h-8 text-blue-600" />}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                {tourStep === 0 && "Your Trust Score"}
                {tourStep === 1 && "Key Risks"}
                {tourStep === 2 && "Regional Language"}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {tourStep === 0 && "This number tells you at a glance how safe this contract is. A high score means you're good to go!"}
                {tourStep === 1 && "We highlight the 'traps' in your contract so you don't have to search for them. Look for the red tags."}
                {tourStep === 2 && "New! You can now translate the 'Plain English' summary into Hindi, Marathi, or Kannada using the language picker."}
              </p>
              <div className="flex items-center justify-between">
                 <button onClick={completeTour} className="text-sm font-bold text-slate-400 hover:text-slate-600">Skip Tour</button>
                 <button onClick={() => tourStep < 2 ? setTourStep(tourStep + 1) : completeTour()} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200">{tourStep < 2 ? "Next Tip" : "Start Using"}</button>
              </div>
           </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
           <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest">
             <ArrowLeft className="w-4 h-4" /> Exit to Dashboard
           </button>
           <div className="flex items-center gap-4">
              <div className="hidden md:flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                 {[
                   { code: "en", label: "English" },
                   { code: "hi", label: "हिन्दी" },
                   { code: "mr", label: "मराठी" },
                   { code: "kn", label: "ಕನ್ನಡ" }
                 ].map(lang => (
                   <button 
                    key={lang.code}
                    onClick={() => {
                      setTargetLang(lang.code);
                      if (selected) handleTranslate(selected.explanation, lang.code);
                    }}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${targetLang === lang.code ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                   >
                     {lang.label}
                   </button>
                 ))}
              </div>
              <div className="flex flex-wrap gap-3">
                 <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
                   <Share2 className="w-4 h-4" /> Request Sign
                 </button>
                 <button 
                  onClick={() => setShowSignature(true)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:scale-105 ${isSigned ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30'}`}
                 >
                   {isSigned ? <Check className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                   {isSigned ? "Contract Signed" : "E-Sign"}
                 </button>
                 <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
                   <Download className="w-4 h-4" /> Save PDF
                 </button>
              </div>
           </div>
        </div>

        {/* The Verdict (TL;DR) */}
        <div className="glass-card rounded-[3rem] p-10 border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden bg-white shadow-xl shadow-slate-200/50">
           {isSigned && (
             <div className="absolute top-8 right-8 rotate-12 animate-scale-in">
               <div className="border-4 border-emerald-500 text-emerald-500 px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-widest bg-white/80 backdrop-blur-sm">
                 Digitally Signed
               </div>
             </div>
           )}
           <div className={`w-32 h-32 rounded-full border-[8px] flex items-center justify-center flex-shrink-0 ${score >= 80 ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50'}`}>
              <span className="text-4xl font-black">{score}%</span>
           </div>
           <div className="space-y-3">
              <h1 className="text-4xl font-black text-slate-900">
                {score >= 80 ? "Looks safe to sign!" : score >= 60 ? "Proceed with caution." : "Significant risks found."}
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                We've analyzed your <strong>{data.filename}</strong>. Our Smart Accuracy Check found {data.high_risk_count} major risks and {data.warning_count} points you should check.
              </p>
           </div>
        </div>

        {/* Hidden Trap Chains */}
        {data.trap_chains && data.trap_chains.length > 0 && (
          <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-200 animate-bounce-subtle print:bg-rose-50 print:text-rose-900 print:shadow-none">
             <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-8 h-8 text-rose-200 print:text-rose-600" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Hidden Risk Chains Detected</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.trap_chains.map(trap => (
                   <div key={trap.id} className="bg-rose-700/40 border border-rose-500/30 rounded-3xl p-6 print:bg-rose-100 print:border-rose-200">
                      <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                         <Zap className="w-4 h-4 text-amber-400 print:text-rose-600" /> {trap.type}
                      </h3>
                      <p className="text-rose-100 text-sm font-medium mb-4 leading-relaxed print:text-rose-800">{trap.reason}</p>
                      <div className="bg-white/10 rounded-xl p-4 print:bg-white print:border print:border-rose-200">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1 print:text-rose-400">Expert Remedy</h4>
                         <p className="text-xs font-bold print:text-rose-900">{trap.remedy}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Tabs for Analysis vs Glossary */}
        <div className="flex gap-4 border-b border-slate-200 print:hidden">
           <button 
            onClick={() => setActiveTab("breakdown")} 
            className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "breakdown" ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
           >
             Clause Breakdown
           </button>
           <button 
            onClick={() => setActiveTab("glossary")} 
            className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "glossary" ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
           >
             Legal Glossary
           </button>
           <button 
            onClick={() => setActiveTab("negotiation")} 
            className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "negotiation" ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
           >
             Negotiation Playbook
           </button>
        </div>

        {activeTab === "breakdown" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             
             {/* Left: Clauses */}
             <div className="lg:col-span-5 space-y-6 print:hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">The Fine Print</h3>
                  <div className="flex gap-2">
                     {["all", "high", "warning"].map(f => (
                       <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                          {f}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filtered.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setActive(c.id);
                        if (targetLang !== "en") handleTranslate(c.explanation, targetLang);
                      }}
                      className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${activeClause === c.id ? 'bg-white border-blue-500 shadow-xl' : 'bg-white/50 border-transparent hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${c.risk_level === 'high' ? 'bg-rose-50 text-rose-600' : c.risk_level === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {c.risk_level}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{(c.confidence * 100).toFixed(0)}% Certainty</span>
                      </div>
                      <p className={`text-slate-600 text-sm font-medium line-clamp-2 leading-relaxed ${c.risk_level === 'high' ? 'highlight-animated' : c.risk_level === 'warning' ? 'highlight-animated highlight-warning' : ''}`}>
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
             </div>

             {/* Right: The Translation */}
             <div className="lg:col-span-7 print:col-span-12">
                {selected ? (
                  <div className="sticky top-6 space-y-6 animate-slide-in-right print:relative print:top-0">
                     <div className="glass-card rounded-[3rem] p-10 border-blue-100 bg-white shadow-2xl relative overflow-hidden print:shadow-none print:border-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 print:hidden"></div>
                        
                        <div className="flex items-center justify-between mb-10">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 print:hidden">
                                 <Sparkles className="w-6 h-6" />
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {targetLang === "en" ? "Plain English" : 
                                 targetLang === "hi" ? "हिन्दी सारांश" :
                                 targetLang === "mr" ? "मराठी सारांश" : "ಕನ್ನಡ ಸಾರಾಂಶ"}
                              </h3>
                              <button 
                                onClick={() => setShowOriginal(!showOriginal)}
                                className={`p-2 rounded-lg transition-all ${showOriginal ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'} print:hidden`}
                                title="Show Original Lawyer Talk"
                              >
                                 <Info className="w-4 h-4" />
                              </button>
                           </div>
                           <div className="flex items-center gap-3 print:hidden">
                              {translating && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                              <button 
                                onClick={() => handleSpeech(getActiveTranslation())}
                                className={`p-3 rounded-2xl transition-all ${isSpeaking ? 'bg-blue-600 text-white shadow-lg animate-pulse' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                              >
                                {isSpeaking ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
                              </button>
                           </div>
                        </div>

                        <div className="space-y-10">
                           {showOriginal && (
                             <div className="p-6 bg-slate-900 rounded-3xl text-white animate-scale-in print:hidden">
                                <div className="flex items-center gap-2 mb-2">
                                   <Eye className="w-3 h-3 text-blue-400" />
                                   <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Original Clause Text</span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 leading-relaxed italic">"{selected.text}"</p>
                             </div>
                           )}

                           <div className="space-y-4">
                              <p className="text-2xl font-medium text-slate-800 leading-relaxed min-h-[100px] print:text-lg">
                                 {getActiveTranslation()}
                              </p>
                              <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] print:hidden">Translated by LegalEase AI</p>
                           </div>

                           {selected.risk_level !== 'safe' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                                <div className="p-6 bg-emerald-50 rounded-2xl print:bg-white print:border print:border-slate-100">
                                   <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">How to Fix It</h4>
                                   <p className="text-xs font-bold text-emerald-900 leading-relaxed">{selected.suggested_redline || "No specific fix needed."}</p>
                                </div>
                                <div className="p-6 bg-amber-50 rounded-2xl print:bg-white print:border print:border-slate-100">
                                   <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">The Catch</h4>
                                   <p className="text-xs font-bold text-amber-900 leading-relaxed">{selected.negotiation_advice || "Standard clause language."}</p>
                                </div>
                             </div>
                           )}

                           <div className="flex items-center justify-between pt-6 print:hidden">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Was this summary helpful?</p>
                              <div className="flex gap-2">
                                 <button onClick={() => handleFeedback(selected.id, true)} className={`p-3 rounded-xl transition-all ${feedback[selected.id] === true ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50'}`}><ThumbsUp className="w-4 h-4" /></button>
                                 <button onClick={() => handleFeedback(selected.id, false)} className={`p-3 rounded-xl transition-all ${feedback[selected.id] === false ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-rose-50'}`}><ThumbsDown className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Original Text Footer - Hidden by default now */}
                     {!showOriginal && (
                       <div className="p-8 bg-slate-100 rounded-[2.5rem] text-slate-400 border border-slate-200 border-dashed text-center print:hidden">
                          <p className="text-[10px] font-black uppercase tracking-widest">Original Text Hidden • Click the 'i' button above to reveal</p>
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 print:hidden">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Target className="w-8 h-8 text-slate-200" />
                     </div>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap a clause on the left to simplify it</p>
                  </div>
                )}
             </div>

          </div>
        ) : activeTab === "glossary" ? (
          <div className="animate-fade-in py-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {glossaryItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all">
                     <div className="flex items-center gap-2 mb-4">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {item.section}
                        </div>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                     <p className="text-slate-500 font-medium leading-relaxed text-sm italic mb-4">"{item.meaning}"</p>
                     <div className="h-1 w-12 bg-slate-100 rounded-full"></div>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="animate-fade-in py-8 space-y-8">
             <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                   <Target className="w-32 h-32" />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tight">Negotiation Playbook</h2>
                <p className="text-amber-100 font-bold text-lg max-w-2xl">AI-generated pushback strategies for high-risk clauses. Copy these templates to your drafting lawyer or counter-party.</p>
             </div>
             
             <div className="grid grid-cols-1 gap-6">
               {data.risks?.filter(r => r.severity === 'high').map((risk, idx) => (
                 <div key={idx} className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100 border-l-[12px] border-l-amber-500 hover:shadow-2xl transition-all">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                       <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1 block">Risky Clause Found</span>
                          <h3 className="text-2xl font-black text-slate-900">{risk.clause_type}</h3>
                       </div>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(`Re: ${risk.clause_type} - We would like to propose a more balanced version of this clause to ensure mutual protection. Recommended Revision: [PASTE REVISION HERE]`);
                           alert("Pushback template copied!");
                         }}
                         className="px-6 py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                       >
                         Copy Strategy
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="p-6 bg-slate-50 rounded-2xl">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI RISK VERDICT</h4>
                          <p className="text-slate-600 font-bold text-sm leading-relaxed">{risk.explanation}</p>
                       </div>
                       <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">RECOMMENDED COUNTER-OFFER</h4>
                          <p className="text-emerald-900 font-black text-sm leading-relaxed italic">
                             "The liability shall be limited to the total contract value, and any termination must be preceded by a 30-day cure period for both parties."
                          </p>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Simple Footer Details */}
        <div className="flex flex-wrap gap-4 mt-8">
           <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
              <Gavel className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Law: {data.jurisdiction_analysis?.location ?? 'Standard'}</span>
           </div>
           <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
              <Scale className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Industry Check: Verified</span>
           </div>
        </div>

      </div>

      {/* E-Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Digitally Sign Contract</h3>
                 <button onClick={() => setShowSignature(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 mb-6 text-center">
                 <p className="text-slate-400 font-bold mb-4">Draw your signature below</p>
                 <canvas 
                  ref={canvasRef}
                  width={400}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="bg-white rounded-xl border border-slate-200 cursor-crosshair mx-auto shadow-inner"
                 />
                 <button onClick={clearSignature} className="mt-4 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600">Clear Canvas</button>
              </div>
              
              <p className="text-xs font-medium text-slate-500 mb-6 text-center">By signing, you agree to the verified terms of this contract. Secured by LegalEase e-Sign.</p>
              
              <div className="flex gap-4">
                 <button onClick={() => setShowSignature(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors text-sm">Cancel</button>
                 <button 
                  onClick={() => {
                    setIsSigned(true);
                    setShowSignature(false);
                  }} 
                  disabled={!signatureData}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-blue-500/30 text-sm disabled:opacity-50 disabled:scale-100"
                 >
                   Apply Signature
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Email Request Modal for Multi-Party Signing */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Signature</h3>
                 <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="space-y-4 mb-6">
                 <p className="text-sm font-bold text-slate-500">Send this analyzed contract to the counter-party for their digital signature.</p>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Recipient Email Address</label>
                    <input type="email" placeholder="client@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Message (Optional)</label>
                    <textarea placeholder="Please review the AI analysis and sign the contract." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none h-20"></textarea>
                 </div>
              </div>
              
              <div className="flex gap-4">
                 <button onClick={() => setShowEmailModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors text-sm">Cancel</button>
                 <button onClick={() => {
                   setIsSending(true);
                   setTimeout(() => {
                     setIsSending(false);
                     setShowEmailModal(false);
                     alert("Secure signing link sent to recipient! (Simulated)");
                   }, 2000);
                 }} disabled={isSending} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-sm disabled:opacity-50">
                   {isSending ? "Sending..." : "Send Request"}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Analysis;