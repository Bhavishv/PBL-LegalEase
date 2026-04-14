import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

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

/* ─── No MOCK data — real states only ─────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────── *
 *  Build a flat word list from all clauses, keeping per-word metadata *
 *  so we can highlight words AND clause-level colours simultaneously. *
 * ─────────────────────────────────────────────────────────────────── */
function buildWordList(clauses) {
  // returns: [{ word, clauseId, riskLevel, globalIdx }]
  const list = [];
  clauses.forEach((clause) => {
    const words = clause.text.split(/(\s+)/);   // split but keep whitespace tokens
    words.forEach((token) => {
      if (/\S/.test(token)) {                   // real word
        list.push({ word: token, clauseId: clause.id, riskLevel: clause.risk_level, globalIdx: list.length });
      } else {
        list.push({ word: token, space: true, clauseId: clause.id, riskLevel: clause.risk_level, globalIdx: list.length });
      }
    });
    // clause separator
    list.push({ word: " ", space: true, clauseId: clause.id, riskLevel: clause.risk_level, globalIdx: list.length });
  });
  return list;
}

/* ════════════════════════════════════════════════════════════════════ */
function Analysis() {
  const navigate = useNavigate();
  const readerRef = useRef(null);

  const [data, setData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeClause, setActive] = useState(null);
  const [filter, setFilter] = useState("all");
  const [pageState, setPageState] = useState("loading");

  /* ── Contract Read-Aloud state ── */
  const [reading, setReading] = useState(false);
  const [hlWordIdx, setHlWordIdx] = useState(-1);   // global word index being read
  const wordListRef = useRef([]);                     // flat word list
  const fullTextRef = useRef("");                     // full contract string for TTS


  /* ── load session data ── */
  useEffect(() => {
    // Priority 1: fresh analysis from current session
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

    // Priority 2: fallback to most recent vault entry so back-nav never blanks
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

    // Priority 3: nothing at all — first-time user
    setPageState("empty");
  }, []);



  /* ── build word list whenever clauses change ── */
  useEffect(() => {
    if (!data?.clauses) return;
    wordListRef.current = buildWordList(data.clauses);
    fullTextRef.current = data.clauses.map((c) => c.text).join(" ");
  }, [data]);

  /* ── cleanup TTS on unmount ── */
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  /* ─── Read-aloud control ────────────────────────────────────────── */
  const startReading = () => {
    if (!("speechSynthesis" in window)) {
      alert("Your browser does not support text-to-speech.");
      return;
    }
    window.speechSynthesis.cancel();

    const text = fullTextRef.current;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.lang = "en-US";

    utterance.onboundary = (e) => {
      if (e.name !== "word") return;
      // Count how many real words precede character index e.charIndex
      const textBefore = text.slice(0, e.charIndex);
      const realWordCount = textBefore.trim() === "" ? 0 : textBefore.trim().split(/\s+/).length;
      setHlWordIdx(realWordCount);

      // Auto-scroll the word into view inside the reader box
      const el = document.getElementById(`w-${realWordCount}`);
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    utterance.onend = () => { setReading(false); setHlWordIdx(-1); };
    utterance.onerror = () => { setReading(false); setHlWordIdx(-1); };

    window.speechSynthesis.speak(utterance);
    setReading(true);
  };

  const stopReading = () => {
    window.speechSynthesis?.cancel();
    setReading(false);
    setHlWordIdx(-1);
  };

  const toggleReading = () => (reading ? stopReading() : startReading());

  /* ─── Derived values ────────────────────────────────────────────── */
  const clauses = data?.clauses ?? [];
  const filtered = filter === "all" ? clauses : clauses.filter((c) => c.risk_level === filter);
  const selected = clauses.find((c) => c.id === activeClause);
  const score = data?.overall_score ?? 0;
  const counts = {
    high: clauses.filter((c) => c.risk_level === "high").length,
    warning: clauses.filter((c) => c.risk_level === "warning").length,
    safe: clauses.filter((c) => c.risk_level === "safe").length,
  };

  // Build real-word-only list for rendering (no space tokens)
  const renderWords = wordListRef.current.filter((t) => !t.space);

  if (pageState === "loading") return <LoadingSkeleton />;
  if (pageState === "empty") return <EmptyState />;
  if (pageState === "error") return <ErrorState />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Back + Title ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">{data.filename ?? "Contract Analysis"}</h1>
          <p className="text-sm mt-0.5">
            {isLive
              ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>Live AI Analysis</span>
              : <span className="text-amber-600 font-bold">⚠ Demo — upload a real contract to analyse</span>}
          </p>
        </div>
        <button onClick={() => navigate("/dashboard")}
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-glow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Upload
        </button>
      </div>

      {/* ── Hero Score ───────────────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border-2 mb-8 shadow-sm ${score >= 85 ? "bg-emerald-50 border-emerald-200" : score >= 60 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"}`}>
        <div className={`flex-shrink-0 w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-md ${scoreColor(score)}`}>
          <span className="text-4xl font-black">{score}</span>
          <span className="text-xs font-bold uppercase tracking-wide opacity-70">/ 100</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-2xl font-black text-slate-900">{scoreEmoji(score)} {scoreLabel(score)}</p>
          <p className="text-base text-slate-600 mt-1 font-medium">
            {score >= 85 ? "This contract appears fair and balanced." : score >= 60 ? "Some clauses need attention before signing." : "Serious risks found. Do not sign without reviewing every flagged item."}
          </p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
            {[
              { key: "high", bg: "bg-rose-100 text-rose-700 border-rose-200" },
              { key: "warning", bg: "bg-amber-100 text-amber-700 border-amber-200" },
              { key: "safe", bg: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            ].map(({ key, bg }) => (
              <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${bg}`}>
                {riskMeta[key].emoji} {counts[key]} {riskMeta[key].label}
              </span>
            ))}
            {data.trap_chains?.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border bg-purple-100 text-purple-700 border-purple-200">
                ⚡ {data.trap_chains.length} Trap Chain{data.trap_chains.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ *
       *  CONTRACT READER — full document text with read-aloud      *
       * ══════════════════════════════════════════════════════════ */}
      <div className="mb-8 bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Reader toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-bold text-slate-700 text-sm">Contract Text</span>
            <span className="text-xs text-slate-400 font-medium">— {clauses.length} clause{clauses.length !== 1 ? "s" : ""} detected</span>
          </div>

          {/* Read Aloud button */}
          <button
            onClick={toggleReading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${reading
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            {reading ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="5" y="4" width="4" height="12" rx="1" />
                  <rect x="11" y="4" width="4" height="12" rx="1" />
                </svg>
                Stop Reading
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Read Aloud
              </>
            )}
          </button>
        </div>

        {/* Waveform when reading */}
        {reading && (
          <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
            <div className="flex items-end gap-0.5 h-5">
              {[2, 4, 6, 5, 3, 6, 4, 2, 5, 3].map((h, i) => (
                <div key={i}
                  className="w-1 bg-indigo-400 rounded-full animate-bounce"
                  style={{ height: `${h * 3}px`, animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-indigo-600">Reading contract aloud… highlighted words follow along</span>
          </div>
        )}

        {/* Legend */}
        <div className="px-5 py-2 border-b border-slate-100 flex flex-wrap gap-3">
          {[
            { key: "high", label: "High Risk" },
            { key: "warning", label: "Warning" },
            { key: "safe", label: "Safe" },
          ].map(({ key, label }) => (
            <span key={key} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className={`w-3 h-3 rounded-sm ${riskMeta[key].bg.replace("/70", "").replace("/50", "")}`}></span>
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 ml-2">
            <span className="px-1 rounded bg-yellow-300 text-slate-900 text-[10px]">word</span>
            Currently reading
          </span>
        </div>

        {/* Document text — word-by-word highlighted */}
        <div
          ref={readerRef}
          className="px-6 py-6 overflow-y-auto max-h-72 font-serif text-slate-800 leading-loose text-[15px] selection:bg-blue-100"
        >
          {clauses.map((clause, ci) => {
            const meta = riskMeta[clause.risk_level] ?? riskMeta.safe;
            // offset count: how many real words appear before this clause
            const offset = clauses.slice(0, ci).reduce((sum, c) => sum + c.text.split(/\s+/).length, 0);
            const words = clause.text.split(/\s+/);

            return (
              <span key={clause.id}>
                {words.map((word, wi) => {
                  const globalIdx = offset + wi;
                  const isCurrentWord = reading && hlWordIdx === globalIdx;
                  const isClauseRisk = clause.risk_level !== "safe";

                  return (
                    <span
                      key={wi}
                      id={`w-${globalIdx}`}
                      className={`
                        inline transition-all duration-75 rounded px-[1px]
                        ${isCurrentWord
                          ? "bg-yellow-300 text-slate-900 font-bold shadow-sm scale-105"
                          : isClauseRisk
                            ? `${meta.bg} text-slate-800`
                            : ""
                        }
                      `}
                    >
                      {word}{" "}
                    </span>
                  );
                })}
                {/* Clause separator */}
                <br /><br />
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Trap Chain Alerts ──────────────────────────────────── */}
      {data.trap_chains?.length > 0 && (
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">⚡ Detected Clause Traps</h2>
          {data.trap_chains.map((tc, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="font-bold text-purple-900">{tc.name}</p>
                <p className="text-sm text-purple-700 mt-0.5">{tc.description}</p>
                {tc.matched_keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tc.matched_keywords.map((kw, j) => (
                      <span key={j} className="text-xs font-bold px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full">"{kw}"</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Clause List + Detail Panel ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Clause List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Clause Breakdown ({clauses.length})
            </h2>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {["all", "high", "warning", "safe"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${filter === f ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {f === "all" ? "All" : riskMeta[f].emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-10">No clauses in this category.</p>
            )}
            {filtered.map((clause) => {
              const meta = riskMeta[clause.risk_level] ?? riskMeta.safe;
              const active = activeClause === clause.id;
              return (
                <button key={clause.id} onClick={() => setActive(clause.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${active ? "border-blue-500 bg-blue-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-1 self-stretch rounded-full ${meta.bar}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{meta.emoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wide">{meta.label}</span>
                        {clause.confidence && <span className="text-xs font-medium text-slate-400 ml-auto">{Math.round(clause.confidence * 100)}%</span>}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 font-medium">{clause.text}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Clause Detail (plain English explanation) */}
        <div className="lg:sticky lg:top-24 self-start">
          {selected ? (
            <ClauseDetail clause={selected} />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8">
              <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              <p className="text-slate-500 font-semibold">Click any clause for its plain-English explanation</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-glow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Analyse Another Contract
        </button>
        <Link to="/version-compare"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Compare Contract Versions
        </Link>
      </div>
    </div>
  );
}

/* ── Clause Detail Card ─────────────────────────────────────────── */
function ClauseDetail({ clause }) {
  const meta = riskMeta[clause.risk_level] ?? riskMeta.safe;
  const bgMap = { high: "bg-rose-50 border-rose-200", warning: "bg-amber-50 border-amber-200", safe: "bg-emerald-50 border-emerald-200" };
  const hdMap = { high: "text-rose-800", warning: "text-amber-800", safe: "text-emerald-800" };
  const txtMap = { high: "text-rose-900", warning: "text-amber-900", safe: "text-emerald-900" };

  return (
    <div className={`rounded-2xl border-2 p-6 ${bgMap[clause.risk_level] ?? "bg-white border-slate-200"} animate-fade-in`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{meta.emoji}</span>
        <span className={`text-lg font-extrabold ${hdMap[clause.risk_level]}`}>{meta.label}</span>
        {clause.confidence && <span className="ml-auto text-sm font-bold text-slate-400">{Math.round(clause.confidence * 100)}% match</span>}
      </div>

      {/* Plain English */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">What this means for you</p>
        <p className={`text-base font-semibold leading-relaxed ${txtMap[clause.risk_level]}`}>
          {clause.explanation ?? "No explanation available."}
        </p>
      </div>

      {/* Original text */}
      <div className="bg-white/60 rounded-xl p-4 border border-slate-200 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Original clause text</p>
        <p className="text-sm text-slate-600 leading-relaxed font-serif italic">{clause.text}</p>
      </div>

      {/* Action advice */}
      {clause.risk_level !== "safe" && (
        <div className={`p-3 rounded-xl flex items-start gap-2 ${clause.risk_level === "high" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-bold leading-snug">
            {clause.risk_level === "high"
              ? "Action required: Ask the other party to modify or remove this clause before signing."
              : "Review this clause carefully and consider negotiating better terms."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ══ Loading Skeleton ══════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-7 bg-slate-200 rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-32"></div>
        </div>
      </div>

      {/* Score card skeleton */}
      <div className="flex items-center gap-6 p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 mb-8">
        <div className="w-28 h-28 rounded-full bg-slate-200 flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="flex gap-2 mt-2">
            <div className="h-7 w-24 bg-slate-200 rounded-full"></div>
            <div className="h-7 w-24 bg-slate-200 rounded-full"></div>
            <div className="h-7 w-20 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Contract reader skeleton */}
      <div className="rounded-2xl border-2 border-slate-100 overflow-hidden mb-8">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-32"></div>
          <div className="h-8 bg-slate-200 rounded-xl w-28"></div>
        </div>
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${75 + (i % 3) * 10}%` }}></div>
          ))}
        </div>
      </div>

      {/* Clause list skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border-2 border-slate-100 bg-white">
              <div className="flex gap-3">
                <div className="w-1 h-14 bg-slate-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 rounded-2xl border-2 border-slate-100 bg-slate-50"></div>
      </div>
    </div>
  );
}

/* ══ Empty State — no contract uploaded ════════════════════════════ */
function EmptyState() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center animate-fade-in">
      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">No Contract Analysed Yet</h1>
      <p className="text-slate-500 font-medium mb-8">
        Upload a contract from the Dashboard and the full AI analysis will appear here.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-glow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload a Contract
        </Link>
        <Link to="/vault"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          View Contract Vault
        </Link>
      </div>
    </div>
  );
}

/* ══ Error State — corrupt/empty analysis data ══════════════════════ */
function ErrorState() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center animate-fade-in">
      <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Analysis Could Not Load</h1>
      <p className="text-slate-500 font-medium mb-2">
        The AI returned an empty or unreadable result. This can happen if:
      </p>
      <ul className="text-sm text-slate-400 font-medium mb-8 space-y-1 text-left inline-block">
        <li>• The document was too short or had no recognisable clauses</li>
        <li>• The backend timed out analysing a very large file</li>
        <li>• The file was an unreadable image without OCR text</li>
      </ul>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => { sessionStorage.removeItem("legalease_analysis"); navigate("/dashboard"); }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-glow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
        <Link to="/vault"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          View Past Contracts
        </Link>
      </div>
    </div>
  );
}

export default Analysis;