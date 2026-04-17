import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendChatMessage, translateText } from "../services/api";

/* ─── risk helpers ───────────────────────────────────────────────── */
const riskMeta = {
  high: { label: "High Risk", emoji: "🔴", bar: "bg-rose-500", bg: "bg-rose-200/70" },
  warning: { label: "Warning", emoji: "🟡", bar: "bg-amber-400", bg: "bg-amber-200/70" },
  safe: { label: "Safe", emoji: "🟢", bar: "bg-emerald-500", bg: "bg-emerald-200/50" },
};

const scoreColor = (s) =>
  s >= 85 ? "text-emerald-600 border-emerald-500 bg-emerald-50"
    : s >= 60 ? "text-amber-600 border-amber-400 bg-amber-50"
      : "text-rose-600 border-rose-500 bg-rose-50";

const scoreLabel = (s) =>
  s >= 85 ? "Safe to Sign" : s >= 60 ? "Review Carefully" : "Do NOT Sign Yet";
const scoreEmoji = (s) => s >= 85 ? "✅" : s >= 60 ? "⚠️" : "🚫";

/* ════════════════════════════════════════════════════════════════════ */
function Analysis() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeClause, setActive] = useState(null);
  const [filter, setFilter] = useState("all");
  const [pageState, setPageState] = useState("loading");
  const [activeTab, setActiveTab] = useState("clauses"); // "clauses" | "summary"
  const [showChat, setShowChat] = useState(false);

  /* ── TTS ── */
  const [reading, setReading] = useState(false);
  const fullTextRef = useRef("");

  /* ── load session data ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("legalease_analysis");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.clauses?.length) {
          const clauses = parsed.clauses.map((c) => ({
            ...c,
            risk_level: c.risk_level === "high-risk" ? "high" : c.risk_level,
          }));
          setData({ ...parsed, clauses });
          setIsLive(true);
          setActive(clauses[0]?.id ?? null);
          setPageState("ready");
          return;
        }
      }
    } catch (_) { }

    try {
      const vault = JSON.parse(localStorage.getItem("legalease_vault") || "[]");
      if (vault.length > 0 && vault[0]?.data?.clauses?.length) {
        const entry = vault[0];
        const clauses = entry.data.clauses.map((c) => ({
          ...c,
          risk_level: c.risk_level === "high-risk" ? "high" : c.risk_level,
        }));
        sessionStorage.setItem("legalease_analysis", JSON.stringify(entry.data));
        setData({ ...entry.data, clauses });
        setIsLive(false);
        setActive(clauses[0]?.id ?? null);
        setPageState("ready");
        return;
      }
    } catch (_) { }

    setPageState("empty");
  }, []);

  useEffect(() => {
    if (!data?.clauses) return;
    fullTextRef.current = data.clauses.map((c) => c.text).join(" ");
  }, [data]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleReading = () => {
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(fullTextRef.current);
      utterance.rate = 0.85;
      utterance.onend = () => setReading(false);
      window.speechSynthesis.speak(utterance);
      setReading(true);
    }
  };

  const clauses = data?.clauses ?? [];
  const filtered = filter === "all" ? clauses : clauses.filter(c => c.risk_level === filter);
  const selected = clauses.find(c => c.id === activeClause);
  const score = data?.overall_score ?? 0;
  const counts = {
    high: clauses.filter(c => c.risk_level === "high").length,
    warning: clauses.filter(c => c.risk_level === "warning").length,
    safe: clauses.filter(c => c.risk_level === "safe").length,
  };

  if (pageState === "loading") return <LoadingSkeleton />;
  if (pageState === "empty") return <EmptyState />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24 relative min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight truncate max-w-md">{data.filename ?? "Contract Analysis"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${isLive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {isLive ? "Live Gemini AI Analysis" : "Vault Entry"}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => navigate("/dashboard")} className="px-6 py-3 text-sm font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all shadow-glow">
          New Analysis
        </button>
      </div>

      {/* ── Tab Selector ── */}
      <div className="flex p-1.5 bg-slate-100/80 rounded-2xl mb-8 w-fit border border-slate-200 shadow-inner">
        <button onClick={() => setActiveTab("clauses")} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === "clauses" ? "bg-white text-blue-700 shadow-md" : "text-slate-500 hover:text-slate-700"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          Detailed Breakdown
        </button>
        <button onClick={() => setActiveTab("summary")} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === "summary" ? "bg-white text-blue-700 shadow-md" : "text-slate-500 hover:text-slate-700"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Executive Summary
        </button>
      </div>

      {activeTab === "clauses" ? (
        <>
          {/* ── Score & Stats ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center gap-8 p-8 rounded-[2.5rem] border-2 shadow-sm ${score >= 85 ? "bg-emerald-50 border-emerald-100" : score >= 60 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-200"}`}>
              <div className={`relative flex-shrink-0 w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center shadow-xl bg-white ${scoreColor(score)}`}>
                <span className="text-5xl font-black leading-none">{score}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">SCORE</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-2xl font-black text-slate-900 mb-2">{scoreEmoji(score)} {scoreLabel(score)}</p>
                <div className="flex flex-wrap gap-2 mt-6 justify-center sm:justify-start">
                  {["high", "warning", "safe"].map(key => (
                    <span key={key} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${riskMeta[key].bg.replace("/70", "/30").replace("/50", "/30")} ${riskMeta[key].bar.replace("bg-", "text-").replace("500", "700")}`}>
                      {riskMeta[key].emoji} {counts[key]} {riskMeta[key].label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass rounded-[2.5rem] p-6 border-slate-200 flex flex-col justify-center gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contract Duration</p>
                <p className="text-lg font-black text-slate-900">{data.entities?.expiry_date || "Continuous"}</p>
              </div>
              <div className="h-px bg-slate-100"></div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Jurisdiction</p>
                <p className="text-lg font-black text-slate-900">{data.entities?.jurisdiction || "Neutral"}</p>
              </div>
            </div>
          </div>

          {/* ── Main Dashboard Content ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 font-sans">Clauses ({filtered.length})</h2>
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {["all", "high", "warning"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${filter === f ? "bg-white text-blue-700 shadow-md scale-110" : "text-slate-400"}`}>
                      {f === "all" ? <span className="text-[10px] font-black uppercase">All</span> : riskMeta[f].emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {filtered.map(clause => (
                  <button key={clause.id} onClick={() => setActive(clause.id)} 
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${activeClause === clause.id ? "border-indigo-600 bg-indigo-50/50 shadow-md translate-x-1" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-1 self-stretch rounded-full ${riskMeta[clause.risk_level].bar}`}></div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${riskMeta[clause.risk_level].bg.replace("200/70", "200").replace("200/50", "200")}`}>
                          {riskMeta[clause.risk_level].label}
                        </span>
                        <p className={`text-sm mt-2 font-bold leading-relaxed line-clamp-2 ${activeClause === clause.id ? "text-indigo-900" : "text-slate-700"}`}>{clause.text}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-24">
              {selected ? (
                <ResultPane clause={selected} toggleReading={toggleReading} reading={reading} />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-slate-100 rounded-3xl bg-slate-50 opacity-50">
                  <p className="font-bold text-slate-400">Select a clause to analyze</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <SummaryDashboard data={data} goBack={() => setActiveTab("clauses")} />
      )}

      {/* ── Chat Icon & Slideover ── */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <button onClick={() => setShowChat(!showChat)} className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 group relative">
          {showChat ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <>
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-ping"></span>
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </>
          )}
        </button>
        {showChat && <ChatOverlay onClose={() => setShowChat(false)} fullText={fullTextRef.current} />}
      </div>

    </div>
  );
}

/* ── Result Detail Pane ── */
function ResultPane({ clause, toggleReading, reading }) {
  const [activeMode, setActiveMode] = useState("smart"); // "smart" | "action" | "hindi"
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async (lang) => {
    setTranslating(true);
    try {
      const res = await translateText(clause.explanation, lang);
      setTranslation(res.translated_text);
      setActiveMode("hindi");
    } catch (e) {
      alert("Translation failed. Ensure Google Translate API is configured.");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={`glass rounded-[2.5rem] p-8 border-2 shadow-2xl transition-all duration-300 ${clause.risk_level === 'high' ? 'border-rose-200' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          {riskMeta[clause.risk_level].emoji} Analysis
        </h3>
        <button onClick={toggleReading} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${reading ? "bg-rose-500 text-white" : "bg-white border border-slate-200 text-indigo-600"}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">{reading ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /> : <path d="M8 5v14l11-7z" />}</svg>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        <button onClick={() => setActiveMode("smart")} className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeMode === "smart" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400"}`}>Plain English</button>
        <button onClick={() => setActiveMode("action")} className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeMode === "action" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400"}`}>Strategic Advice</button>
        <button onClick={() => handleTranslate("hi")} disabled={translating} className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeMode === "hindi" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400"}`}>
          {translating ? "..." : "Translate (Hindi)"}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-h-[12rem]">
         {activeMode === "smart" && (
           <p className="text-lg font-bold text-slate-800 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-1">"{clause.explanation}"</p>
         )}
         {activeMode === "action" && (
           <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-100">
                <p className="text-[10px] font-black uppercase text-amber-700 mb-1">Negotiation Tactic</p>
                <p className="text-sm font-bold text-amber-900">{clause.negotiation_advice || "Standard terms. No special strategy needed."}</p>
              </div>
              {clause.suggested_redline && (
                <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-100">
                  <p className="text-[10px] font-black uppercase text-emerald-700 mb-1">Proposed Redline</p>
                  <p className="text-sm font-bold text-emerald-900">{clause.suggested_redline}</p>
                </div>
              )}
           </div>
         )}
         {activeMode === "hindi" && (
           <p className="text-lg font-bold text-slate-800 leading-relaxed font-hindi">{translation}</p>
         )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-100">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Selected clause content</p>
        <p className="text-sm font-serif italic text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">{clause.text}</p>
      </div>
    </div>
  );
}

/* ── Summary Dashboard ── */
function SummaryDashboard({ data, goBack }) {
  return (
    <div className="animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DetailCard title="Primary Party" value={data.entities?.party_a} color="indigo" />
          <DetailCard title="Secondary Party" value={data.entities?.party_b} color="blue" />
          <DetailCard title="Financial Exposure" value={data.financial_data?.total_value || "Variable"} color="emerald" />
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-[2.5rem] border-slate-200">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13zM7 13a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" /></svg>
              Compliance Audit (GDPR)
            </h3>
            <p className="text-slate-800 font-bold leading-relaxed">{data.compliance?.gdpr_status}</p>
            <div className="mt-4 space-y-2">
              {data.compliance?.risks?.map((r, i) => (
                <div key={i} className="flex gap-2 text-xs font-black text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">
                  <span>⚠</span> {r}
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-8 rounded-[2.5rem] border-slate-200">
             <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
               <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
               Financial Overview
             </h3>
             <div className="space-y-3">
               <div className="flex justify-between p-4 bg-white border border-slate-100 rounded-xl">
                 <span className="text-xs font-black text-slate-400 uppercase">Currency</span>
                 <span className="text-sm font-black text-slate-800">{data.financial_data?.currency || "USD"}</span>
               </div>
               <div className="flex justify-between p-4 bg-white border border-slate-100 rounded-xl">
                 <span className="text-xs font-black text-slate-400 uppercase">Payment Terms</span>
                 <span className="text-sm font-black text-slate-800">{data.financial_data?.payment_terms || "Standard"}</span>
               </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function DetailCard({ title, value, color }) {
  const c = color === 'indigo' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 
            color === 'emerald' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
            'text-blue-600 bg-blue-50 border-blue-100';
  return (
    <div className={`p-6 rounded-[2rem] border-2 bg-white shadow-sm ${c}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">{title}</p>
      <p className="text-lg font-black truncate">{value || "Unknown"}</p>
    </div>
  );
}

/* ── Chat Overlay ── */
function ChatOverlay({ onClose, fullText }) {
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim() || loading) return;
    const userMsg = msg;
    setMsg("");
    setHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await sendChatMessage({ contract_text: fullText, history, query: userMsg });
      setHistory(prev => [...prev, { role: "assistant", text: res.reply }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: "assistant", text: "Sorry, I lost connection to Gemini." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-20 right-0 w-[400px] h-[550px] glass rounded-[2.5rem] border-2 border-indigo-200 shadow-3xl flex flex-col overflow-hidden animate-slide-in-up">
       <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black">L</div>
            <span className="font-black text-sm uppercase tracking-widest">LegalEase Chat</span>
          </div>
          <button onClick={onClose}><svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl text-xs font-bold text-slate-500 leading-relaxed">
            I've read this contract. Ask me anything like "What is the notice period?" or "Is there a penalty if I cancel early?"
          </div>
          {history.map((h, i) => (
            <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[90%] p-4 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap leading-relaxed ${h.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none border'}`}>
                 {h.text}
               </div>
            </div>
          ))}
          {loading && <div className="text-xs font-black text-indigo-400 animate-pulse">Gemini is thinking...</div>}
          <div ref={scrollRef}></div>
       </div>
       <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ask about this context..." className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <button type="submit" className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-all">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
       </form>
    </div>
  );
}

/* ── Fallbacks ── */
function LoadingSkeleton() {
  return <div className="max-w-5xl mx-auto py-24 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse">Assembling Intelligence Dashboard...</div>;
}

function EmptyState() {
  return (
    <div className="max-w-lg mx-auto py-32 text-center">
       <h1 className="text-2xl font-black text-slate-900 mb-4">No Data in Context</h1>
       <p className="text-slate-500 font-bold mb-8">Please upload a document to begin analysis.</p>
       <button onClick={() => window.location.href='/dashboard'} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs">Back to Dashboard</button>
    </div>
  );
}

export default Analysis;