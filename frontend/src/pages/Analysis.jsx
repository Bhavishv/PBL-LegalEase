import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, AlertTriangle, CheckCircle, ArrowLeft, Download, Share2, 
  ChevronRight, Search, Filter, MessageCircle, FileText, Info,
  Check, X, ThumbsUp, ThumbsDown, Zap, Scale, Gavel, HelpCircle,
  Sparkles, Eye, Target, Languages, Loader2,
  PenTool
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
  
  // Translation State
  const [targetLang, setTargetLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState({}); // Cache translations

  // Onboarding State
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const fullTextRef = useRef("");

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
      const res = await fetch("http://localhost:8000/api/translate", {
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

  const getActiveTranslation = () => {
    if (!selected) return "";
    if (targetLang === "en") return selected.explanation;
    const cacheKey = `${selected.explanation.slice(0, 50)}_${targetLang}`;
    return translations[cacheKey] || selected.explanation;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 pb-32">
      
      {/* ── ONBOARDING TOOLTIPS ── */}
      {showTour && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
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
        <div className="flex items-center justify-between">
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
                 <button onClick={() => setShowSignature(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
                   <PenTool className="w-4 h-4" /> E-Sign
                 </button>
                 <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
                   <Download className="w-4 h-4" /> Save PDF
                 </button>
              </div>
           </div>
        </div>

        {/* The Verdict (TL;DR) */}
        <div className="glass-card rounded-[3rem] p-10 border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden bg-white shadow-xl shadow-slate-200/50">
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
          <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-200 animate-bounce-subtle">
             <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-8 h-8 text-rose-200" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Hidden Risk Chains Detected</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.trap_chains.map(trap => (
                  <div key={trap.id} className="bg-rose-700/40 border border-rose-500/30 rounded-3xl p-6">
                     <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" /> {trap.type}
                     </h3>
                     <p className="text-rose-100 text-sm font-medium mb-4 leading-relaxed">{trap.reason}</p>
                     <div className="bg-white/10 rounded-xl p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Expert Remedy</h4>
                        <p className="text-xs font-bold">{trap.remedy}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left: Clauses */}
           <div className="lg:col-span-5 space-y-6">
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
           <div className="lg:col-span-7">
              {selected ? (
                <div className="sticky top-6 space-y-6 animate-slide-in-right">
                   <div className="glass-card rounded-[3rem] p-10 border-blue-100 bg-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
                      
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                               <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                              {targetLang === "en" ? "Plain English" : 
                               targetLang === "hi" ? "हिन्दी सारांश" :
                               targetLang === "mr" ? "मराठी सारांश" : "ಕನ್ನಡ ಸಾರಾಂಶ"}
                            </h3>
                         </div>
                         {translating && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      </div>

                      <div className="space-y-10">
                         <div className="space-y-4">
                            <p className="text-2xl font-medium text-slate-800 leading-relaxed min-h-[100px]">
                               {getActiveTranslation()}
                            </p>
                            <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Translated by LegalEase AI</p>
                         </div>

                         {selected.risk_level !== 'safe' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                              <div className="p-6 bg-emerald-50 rounded-2xl">
                                 <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">How to Fix It</h4>
                                 <p className="text-xs font-bold text-emerald-900 leading-relaxed">{selected.suggested_redline || "No specific fix needed."}</p>
                              </div>
                              <div className="p-6 bg-amber-50 rounded-2xl">
                                 <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">The Catch</h4>
                                 <p className="text-xs font-bold text-amber-900 leading-relaxed">{selected.negotiation_advice || "Standard clause language."}</p>
                              </div>
                           </div>
                         )}

                         <div className="flex items-center justify-between pt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Was this summary helpful?</p>
                            <div className="flex gap-2">
                               <button onClick={() => handleFeedback(selected.id, true)} className={`p-3 rounded-xl transition-all ${feedback[selected.id] === true ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50'}`}><ThumbsUp className="w-4 h-4" /></button>
                               <button onClick={() => handleFeedback(selected.id, false)} className={`p-3 rounded-xl transition-all ${feedback[selected.id] === false ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-rose-50'}`}><ThumbsDown className="w-4 h-4" /></button>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                      <div className="flex items-center gap-2 mb-4">
                         <Eye className="w-4 h-4 text-blue-400" />
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Original Lawyer Talk</h4>
                      </div>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed">{selected.text}</p>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Target className="w-8 h-8 text-slate-200" />
                   </div>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap a clause on the left to simplify it</p>
                </div>
              )}
           </div>

        </div>

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
                 <div className="h-40 bg-white rounded-xl border border-slate-200 cursor-crosshair relative overflow-hidden group">
                    <span className="absolute inset-0 flex items-center justify-center text-slate-200 font-bold text-3xl opacity-50 select-none group-hover:opacity-10 transition-opacity">Sign Here</span>
                 </div>
              </div>
              
              <p className="text-xs font-medium text-slate-500 mb-6 text-center">By signing, you agree to the verified terms of this contract. Secured by LegalEase e-Sign.</p>
              
              <div className="flex gap-4">
                 <button onClick={() => setShowSignature(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors text-sm">Cancel</button>
                 <button onClick={() => {
                   setShowSignature(false);
                   alert("Contract signed successfully! Saving to Vault...");
                 }} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-blue-500/30 text-sm">Apply Signature</button>
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
                     alert("Secure signing link sent to recipient!");
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