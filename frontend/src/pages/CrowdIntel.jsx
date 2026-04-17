import { useState, useEffect, useCallback } from "react";
import { getCrowdIntel } from "../services/api";

const TREND_BADGES = {
  spiking: { label: "📈 Spiking", cls: "text-rose-700 bg-rose-100 border-rose-200" },
  constant: { label: "📊 Constant", cls: "text-blue-700 bg-blue-100 border-blue-200" },
  declining: { label: "📉 Declining", cls: "text-emerald-700 bg-emerald-100 border-emerald-200" },
};

function ClauseCard({ clause, idx }) {
  const trend = TREND_BADGES[clause.trend] || TREND_BADGES.constant;

  return (
    <div
      className="glass rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-in-up flex flex-col md:flex-row"
      style={{ animationDelay: `${idx * 0.08}s` }}
    >
      {/* Left Stats Block */}
      <div className="bg-slate-50/80 md:w-56 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-bl-full -z-10" />

        <div className="mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${trend.cls}`}>
            {trend.label}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-end gap-1.5 mb-1">
            <span className={`text-4xl font-black tabular-nums ${clause.rejectionRate > 85 ? "text-rose-600" : "text-amber-500"}`}>
              {clause.rejectionRate}%
            </span>
            <span className="text-xs font-bold text-slate-500 mb-1">reject</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-700 ${clause.rejectionRate > 85 ? "bg-rose-500" : "bg-amber-400"}`}
              style={{ width: `${clause.rejectionRate}%` }}
            />
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${100 - clause.rejectionRate}%` }}
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 block mb-0.5">
            Renegotiation Success
          </span>
          <span className="text-2xl font-bold text-slate-800 tabular-nums">
            {clause.renegotiationSuccess}%
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Users Encountered</span>
          <p className="text-sm font-bold text-slate-700 mt-0.5">
            {(clause.userCount || 0).toLocaleString()}+
          </p>
        </div>
      </div>

      {/* Right Detail Block */}
      <div className="flex-1 p-6 flex flex-col justify-between bg-white/40">
        <div>
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {clause.category}
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              {clause.industry}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{clause.title}</h2>

          {/* Clause Snippet */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-serif italic text-sm text-slate-600 mb-4">
            "{clause.snippet}"
          </div>

          {/* Gemini AI Insight */}
          {clause.aiInsight && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-4 flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest mb-1">Gemini AI Insight</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{clause.aiInsight}</p>
              </div>
            </div>
          )}

          {/* Community Comments */}
          {clause.comments?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Community Insights
              </h4>
              {clause.comments.map((comment, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0">
                    {comment.user?.charAt(0)}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 shadow-sm flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 text-xs">{comment.user}</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{comment.role}</span>
                    </div>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3 pt-4 border-t border-slate-200/60">
          <button className="flex-1 btn-haptic bg-white border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add to Playbook
          </button>
          <button className="flex-1 btn-haptic bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl border border-slate-200 overflow-hidden animate-pulse flex flex-col md:flex-row">
      <div className="bg-slate-100 md:w-56 p-6 flex flex-col gap-4">
        <div className="h-5 bg-slate-200 rounded w-20" />
        <div className="h-10 bg-slate-200 rounded w-28" />
        <div className="h-2.5 bg-slate-200 rounded-full w-full" />
        <div className="h-6 bg-slate-200 rounded w-16 mt-2" />
      </div>
      <div className="flex-1 p-6 flex flex-col gap-3">
        <div className="h-4 bg-slate-100 rounded w-24" />
        <div className="h-6 bg-slate-100 rounded w-3/4" />
        <div className="h-16 bg-slate-100 rounded-xl w-full" />
        <div className="h-20 bg-blue-50 rounded-xl w-full" />
      </div>
    </div>
  );
}

function CrowdIntel() {
  const [clauses, setClauses] = useState([]);
  const [meta, setMeta] = useState({ total_analyzed: "2.4M+", contributors: "14k+", last_updated: "Loading..." });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCrowdIntel();
      setClauses(data.clauses || []);
      setMeta({
        total_analyzed: (data.total_analyzed || 2400000).toLocaleString() + "+",
        contributors: (data.contributors || 14300).toLocaleString() + "+",
        last_updated: data.last_updated || "Live",
      });
      setLastRefresh(new Date());
    } catch (e) {
      setError("Could not connect to backend. Showing cached data.");
      // Use static fallback
      setClauses([
        { id: "cr1", category: "Data Privacy", title: "Third-Party Data Sharing Without Consent", snippet: "...Provider may share Customer data with third-party partners for marketing...", rejectionRate: 87, renegotiationSuccess: 42, industry: "SaaS", trend: "spiking", aiInsight: "This clause likely violates GDPR Article 6. Always push for explicit opt-in consent for data sharing.", userCount: 12400, comments: [{ user: "Sarah L.", role: "In-House Counsel", text: "Always redline this. Propose opt-in strictly." }] },
        { id: "cr2", category: "Dispute Resolution", title: "Mandatory Binding Arbitration", snippet: "...Any dispute shall be settled exclusively by binding arbitration in Delaware...", rejectionRate: 65, renegotiationSuccess: 18, industry: "All Industries", trend: "constant", aiInsight: "Binding arbitration removes your right to sue in court and often favors large corporations.", userCount: 8900, comments: [{ user: "LegalEagle99", role: "Contract Lawyer", text: "Worth attempting to move jurisdiction to your home state." }] },
        { id: "cr3", category: "Term & Termination", title: "Auto-Renewal with >60 Day Notice", snippet: "...shall automatically renew unless written notice is provided ninety (90) days prior...", rejectionRate: 92, renegotiationSuccess: 76, industry: "B2B Software", trend: "declining", aiInsight: "Industry standard is moving to 30 days. Push back hard — vendors almost always agree.", userCount: 19200, comments: [{ user: "Mike T.", role: "Procurement Manager", text: "Push hard on this — vendors almost always cave." }] },
        { id: "cr4", category: "Liability", title: "Uncapped Indirect Liability Waiver", snippet: "...Provider shall not be liable for any indirect, special, or consequential damages...", rejectionRate: 98, renegotiationSuccess: 89, industry: "Enterprise SaaS", trend: "constant", aiInsight: "Standard boilerplate but ensure there are exclusions for gross negligence and data breaches.", userCount: 31000, comments: [{ user: "Jane D.", role: "General Counsel", text: "Ensure exclusions exist for gross negligence and data breaches." }] },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const industries = ["All", ...new Set(clauses.map(c => c.industry))];
  const filtered = filter === "All" ? clauses : clauses.filter(c => c.industry === filter || c.industry === "All Industries");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-sans animate-fade-in relative z-10 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Crowd Risk Intelligence
          </h1>
          <p className="text-slate-500 font-medium mt-1 max-w-xl text-sm">
            Real-time Gemini AI analysis of thousands of contracts — see what clauses the community flags most.
          </p>
        </div>

        {/* Live Stats */}
        <div className="glass px-5 py-3 rounded-2xl flex items-center gap-5 shadow-sm border border-blue-100 flex-shrink-0">
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Analyzed</span>
            <span className="text-lg font-extrabold text-blue-900">{meta.total_analyzed}</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Contributors</span>
            <span className="text-lg font-extrabold text-blue-900">{meta.contributors}</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Data Source</span>
            <span className="flex items-center gap-1 text-sm font-extrabold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {meta.last_updated}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex flex-wrap gap-2">
          {industries.map(ind => (
            <button
              key={ind}
              onClick={() => setFilter(ind)}
              className={`btn-haptic text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                filter === ind
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="ml-auto btn-haptic flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? "Fetching Gemini Data..." : "Refresh with AI"}
        </button>
      </div>

      {/* Last refresh timestamp */}
      {lastRefresh && !loading && (
        <p className="text-[11px] text-slate-400 font-medium mb-4">
          ⚡ Last refreshed at {lastRefresh.toLocaleTimeString()} · Powered by Google Gemini 1.5 Flash
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass rounded-2xl border border-rose-200 shadow-sm overflow-hidden bg-gradient-to-b from-rose-50/50 to-white">
            <div className="bg-rose-50 border-b border-rose-100 px-4 py-3">
              <h3 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Trending (Live)
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {loading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </>
              ) : (
                filtered
                  .sort((a, b) => b.rejectionRate - a.rejectionRate)
                  .slice(0, 4)
                  .map((c, i) => (
                    <div key={c.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-rose-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{c.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${c.rejectionRate > 85 ? "text-rose-600 bg-rose-100" : "text-amber-600 bg-amber-100"}`}>
                        #{i + 1}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Gemini badge */}
          <div className="glass rounded-2xl p-4 border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-800">Gemini AI Powered</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Click "Refresh with AI" to generate fresh insights based on current contract patterns using Google Gemini 1.5 Flash.
            </p>
          </div>
        </div>

        {/* Clause Feed */}
        <div className="lg:col-span-3 space-y-5">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-bold">No clauses found for this filter</p>
            </div>
          ) : (
            filtered.map((clause, idx) => (
              <ClauseCard key={clause.id || idx} clause={clause} idx={idx} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CrowdIntel;
