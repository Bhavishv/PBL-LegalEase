import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadVault } from "./ContractVault";

function VersionCompare() {
  const navigate = useNavigate();
  const [vault, setVault] = useState([]);
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

  useEffect(() => {
    setVault(loadVault());
  }, []);

  const handleCompare = () => {
    const a = vault.find(v => v.id === selectedA);
    const b = vault.find(v => v.id === selectedB);
    setDataA(a?.data || null);
    setDataB(b?.data || null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in pb-32">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Contract Comparison</h1>
      </div>

      {/* Selection Row */}
      <div className="glass p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm mb-10">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
          <div className="md:col-span-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Contract Version A</p>
            <select 
              value={selectedA} 
              onChange={(e) => setSelectedA(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">Select a contract...</option>
              {vault.map(v => <option key={v.id} value={v.id}>{v.filename}</option>)}
            </select>
          </div>
          
          <div className="md:col-span-1 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 shadow-inner">VS</div>
          </div>

          <div className="md:col-span-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Contract Version B</p>
            <select 
              value={selectedB} 
              onChange={(e) => setSelectedB(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">Select a contract...</option>
              {vault.map(v => <option key={v.id} value={v.id}>{v.filename}</option>)}
            </select>
          </div>
        </div>
        <button 
          onClick={handleCompare}
          disabled={!selectedA || !selectedB}
          className="w-full mt-8 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          GENERATE COMPARATIVE ANALYSIS
        </button>
      </div>

      {/* Results View */}
      {dataA && dataB && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <CompareCard data={dataA} />
          <CompareCard data={dataB} />
          
          {/* Detailed Differences */}
          <div className="lg:col-span-2 glass p-10 rounded-[2.5rem] border-slate-200">
             <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">⚖️</span>
                Key Differences Detected
             </h3>
             <div className="space-y-6">
                <DiffItem 
                  label="Risk Score" 
                  valA={`${dataA.overall_score}/100`} 
                  valB={`${dataB.overall_score}/100`} 
                  highlight={dataA.overall_score !== dataB.overall_score} 
                />
                <DiffItem 
                  label="High Risks" 
                  valA={dataA.high_risk_count || 0} 
                  valB={dataB.high_risk_count || 0} 
                  highlight={dataA.high_risk_count !== dataB.high_risk_count} 
                />
                <DiffItem 
                  label="Total Clauses" 
                  valA={dataA.clauses?.length || 0} 
                  valB={dataB.clauses?.length || 0} 
                  highlight={dataA.clauses?.length !== dataB.clauses?.length} 
                />
                <DiffItem 
                  label="Jurisdiction" 
                  valA={dataA.jurisdiction_analysis?.location || "Unknown"} 
                  valB={dataB.jurisdiction_analysis?.location || "Unknown"} 
                  highlight={dataA.jurisdiction_analysis?.location !== dataB.jurisdiction_analysis?.location} 
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareCard({ data }) {
  return (
    <div className="glass p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-200 transition-all shadow-sm flex flex-col h-full">
       <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-black text-slate-900 truncate pr-4">{data.filename}</h2>
          <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase ${data.overall_score >= 85 ? "bg-emerald-100 text-emerald-700" : data.overall_score >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
            {data.overall_score}/100
          </span>
       </div>
       
       <div className="flex-1 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Entity A</p>
             <p className="text-sm font-bold text-slate-800">{data.entities?.party_a || "Not specified"}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Entity B</p>
             <p className="text-sm font-bold text-slate-800">{data.entities?.party_b || "Not specified"}</p>
          </div>
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Core Strategy</p>
             <p className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-4">{data.negotiation_playbook || "No strategy generated."}</p>
          </div>
       </div>
       <Link to="/analysis" onClick={() => sessionStorage.setItem("legalease_analysis", JSON.stringify(data))} className="mt-8 text-center text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Open Full Report</Link>
    </div>
  );
}

function DiffItem({ label, valA, valB, highlight }) {
  return (
    <div className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${highlight ? "border-amber-200 bg-amber-50/30" : "border-slate-50 bg-white"}`}>
       <span className="text-sm font-black text-slate-500 uppercase tracking-tight">{label}</span>
       <div className="flex items-center gap-8">
          <span className={`text-lg font-black ${highlight ? "text-amber-700" : "text-slate-800"}`}>{valA}</span>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5-5 5M6 7l5 5-5 5" /></svg>
          <span className={`text-lg font-black ${highlight ? "text-amber-700" : "text-slate-800"}`}>{valB}</span>
       </div>
    </div>
  );
}

export default VersionCompare;
