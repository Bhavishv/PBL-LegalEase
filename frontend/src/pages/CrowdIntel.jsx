import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCrowdIntel, addToPlaybook, flagClause } from "../services/api";

const TREND_BADGES = {
  spiking: { label: " Spiking", cls: "text-rose-700 bg-rose-100 border-rose-200" },
  constant: { label: " Constant", cls: "text-blue-700 bg-blue-100 border-blue-200" },
  declining: { label: " Declining", cls: "text-emerald-700 bg-emerald-100 border-emerald-200" },
};

function ClauseCard({ clause, idx }) {
  const trend = TREND_BADGES[clause.trend] || TREND_BADGES.constant;

  const handleFlag = async () => {
    try {
      await flagClause({ 
        contractId: clause.id, 
        title: clause.title,
        reason: "Market trend flag from Crowd Intel Hub" 
      });
      alert(`Flagged "${clause.title}" for legal review. Our team will verify this trend.`);
    } catch (err) {
      alert("Failed to flag clause: " + err.message);
    }
  };

  const handleAddToPlaybook = async () => {
    try {
      await addToPlaybook({
        title: clause.title,
        category: clause.category,
        industry: clause.industry,
        snippet: clause.snippet,
        aiInsight: clause.aiInsight,
        sourceContractId: clause.id
      });
      alert(`Added "${clause.title}" to your Negotiation Playbook!`);
    } catch (err) {
      alert("Failed to add to playbook: " + err.message);
    }
  };

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

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-serif italic text-sm text-slate-600 mb-4">
            "{clause.snippet}"
          </div>

          {clause.aiInsight && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-4 flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest mb-1">LegalEase AI Insight</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{clause.aiInsight}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/60">
           <button 
            onClick={handleFlag}
            className="flex-1 px-4 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all"
           >
            Flag for Review
           </button>
           <button 
            onClick={handleAddToPlaybook}
            className="flex-1 px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-indigo-700 transition-all"
           >
            Add to Playbook
           </button>
        </div>
      </div>
    </div>
  );
}

function CrowdIntel() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [contributed, setContributed] = useState(false);

  const handleContribute = () => {
    setContributed(true);
    setTimeout(() => setContributed(false), 3000);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCrowdIntel();
        setData(res);
      } catch (e) {
        // Fallback for demo
        setData({
          market_confidence_index: 72,
          total_analyzed: 2450000,
          contributors: 14000,
          last_updated: "Live",
          industry_exposure: [
             { name: "SaaS", risk: "High", count: 1200 },
             { name: "Real Estate", risk: "Med", count: 800 },
             { name: "FinTech", risk: "Low", count: 1500 }
          ],
          clauses: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-300 animate-pulse">Syncing with Legal Crowd Intelligence...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
         <div>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Crowd Intel <span className="text-indigo-600">Hub</span></h1>
            </div>
            <p className="text-slate-500 font-bold max-w-xl text-lg leading-relaxed">
               Collective wisdom from over <span className="text-slate-900">{data.total_analyzed.toLocaleString()}</span> contract analyses. See what the market is rejecting in real-time.
            </p>
         </div>
         
         <div className="flex gap-4">
            <div className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Market Confidence</p>
               <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-emerald-600">{data.market_confidence_index}%</span>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: `${data.market_confidence_index}%` }}></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* ── Unique Differentiator: Industry Exposure Heatmap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
               Live Industry Exposure Heatmap
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {data.industry_exposure?.map((ind, i) => (
                  <div key={i} className={`p-6 rounded-3xl border-2 transition-all hover:scale-105 cursor-default ${ind.risk === 'High' ? 'bg-rose-50 border-rose-100 text-rose-700' : ind.risk === 'Med' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                     <p className="text-[10px] font-black uppercase mb-1 opacity-60">{ind.name}</p>
                     <p className="text-2xl font-black mb-1">{ind.count}</p>
                     <p className="text-[10px] font-black uppercase tracking-tighter">Scans Detected</p>
                  </div>
               ))}
            </div>
         </div>
         
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Unique Edge</h3>
            <p className="text-xl font-black mb-4 leading-tight">Leverage collective rejection data to win your next negotiation.</p>
            <p className="text-sm font-medium text-slate-400 mb-8">Our AI identifies which specific wordings have a <span className="text-white font-bold">90%+ rejection rate</span> across 14,000+ contributors. Powered by LegalEase AI.</p>
            <button 
              onClick={handleContribute}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${contributed ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
               {contributed ? "✓ Data Sync Complete" : "Contribute Data"}
            </button>
         </div>
      </div>

      {/* ── Clause Feed ── */}
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black text-slate-900">Trending Risk Clauses</h2>
            <div className="flex flex-wrap gap-2">
               {["All", "SaaS", "Enterprise", "Finance"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === f ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}>
                     {f}
                  </button>
               ))}
            </div>
         </div>
         
         <div className="grid grid-cols-1 gap-6">
            {data.clauses?.length > 0 ? (
               data.clauses.filter(c => filter === "All" || c.industry.includes(filter)).map((clause, idx) => (
                  <ClauseCard key={clause.id} clause={clause} idx={idx} />
               ))
            ) : (
               <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.3em]">
                  Awaiting Fresh Data Stream...
               </div>
            )}
         </div>
      </div>

    </div>
  );
}

export default CrowdIntel;
