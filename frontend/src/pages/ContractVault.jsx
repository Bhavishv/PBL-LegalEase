import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

/* ─── storage helpers ─────────────────────────────────────────── */
const VAULT_KEY = "legalease_vault";

export function saveContractToVault(analysisData) {
  try {
    const existing = JSON.parse(localStorage.getItem(VAULT_KEY) || "[]");
    const entry = {
      id:        Date.now().toString(),
      filename:  analysisData.filename ?? "Unknown",
      score:     analysisData.overall_score ?? 0,
      riskLabel: analysisData.risk_label   ?? "Unknown",
      highRisk:  analysisData.high_risk_count ?? analysisData.clauses?.filter(c => c.risk_level === "high-risk" || c.risk_level === "high").length ?? 0,
      warnings:  analysisData.warning_count   ?? analysisData.clauses?.filter(c => c.risk_level === "warning").length ?? 0,
      traps:     analysisData.trap_chains?.length ?? 0,
      analyzedAt: new Date().toISOString(),
      data:      analysisData,             // full result for re-view
    };
    // De-duplicate by filename: keep only the latest run for same file
    const deduped = existing.filter(e => e.filename !== entry.filename);
    const updated = [entry, ...deduped].slice(0, 50); // keep last 50
    localStorage.setItem(VAULT_KEY, JSON.stringify(updated));
    return entry.id;
  } catch (_) {}
}

export function loadVault() {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY) || "[]"); }
  catch (_) { return []; }
}

export function deleteFromVault(id) {
  const updated = loadVault().filter(e => e.id !== id);
  localStorage.setItem(VAULT_KEY, JSON.stringify(updated));
}

/* ─── risk helpers ─────────────────────────────────────────────── */
const scoreMeta = (s) =>
  s >= 85 ? { label: "Safe",          color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", emoji: "✅" }
  : s >= 60 ? { label: "Moderate Risk", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400",   emoji: "⚠️" }
  :            { label: "High Risk",     color: "text-rose-700",    bg: "bg-rose-50 border-rose-200",       dot: "bg-rose-500",    emoji: "🚫" };

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffH  = diffMs / 3600000;
    if (diffH < 1)    return "Just now";
    if (diffH < 24)   return `${Math.floor(diffH)}h ago`;
    if (diffH < 48)   return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch (_) { return "Unknown date"; }
}

/* ════════════════════════════════════════════════════════════════ */
function ContractVault() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");  // all | safe | moderate | high

  useEffect(() => {
    setContracts(loadVault());
  }, []);

  const filtered = contracts.filter(c => {
    const matchSearch = c.filename.toLowerCase().includes(search.toLowerCase());
    const s = c.score;
    const matchFilter =
      filter === "all"      ? true :
      filter === "safe"     ? s >= 85 :
      filter === "moderate" ? s >= 60 && s < 85 :
      filter === "high"     ? s < 60  : true;
    return matchSearch && matchFilter;
  });

  const handleView = (entry) => {
    sessionStorage.setItem("legalease_analysis", JSON.stringify(entry.data));
    navigate("/analysis");
  };

  const handleDelete = (id) => {
    deleteFromVault(id);
    setContracts(loadVault());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </span>
          Contract Vault
        </h1>
        <p className="text-slate-500 text-base font-medium mt-2">All contracts you have analysed — click any to view its full AI report.</p>
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { key: "all",      label: "All"      },
            { key: "safe",     label: "✅ Safe"   },
            { key: "moderate", label: "⚠️ Moderate" },
            { key: "high",     label: "🚫 High Risk" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${filter === f.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {contracts.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No contracts yet</h3>
          <p className="text-slate-400 text-sm mb-6">Upload a contract from the Dashboard to see it here.</p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-glow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Upload Your First Contract
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">No contracts match your search / filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const meta = scoreMeta(entry.score);
            return (
              <div key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">

                {/* File icon + info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate text-base" title={entry.filename}>{entry.filename}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{fmtDate(entry.analyzedAt)}</p>
                  </div>
                </div>

                {/* Score pill */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${meta.bg} ${meta.color} flex-shrink-0`}>
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
                  {entry.score}/100 · {meta.label}
                </div>

                {/* Counts */}
                <div className="flex gap-3 text-xs font-bold flex-shrink-0">
                  {entry.highRisk > 0 && <span className="text-rose-600">🔴 {entry.highRisk} High</span>}
                  {entry.warnings > 0 && <span className="text-amber-600">🟡 {entry.warnings} Warn</span>}
                  {entry.traps    > 0 && <span className="text-purple-600">⚡ {entry.traps} Trap</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleView(entry)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.27.909-.677 1.76-1.193 2.536"/></svg>
                    View Analysis
                  </button>
                  <Link
                    to="/version-compare"
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-xl transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                    Compare
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete from vault"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {contracts.length > 0 && (
        <div className="mt-8 text-center">
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-glow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Analyse Another Contract
          </Link>
        </div>
      )}
    </div>
  );
}

export default ContractVault;
