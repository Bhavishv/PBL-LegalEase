import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { compareVersions } from "../services/api";

function VersionCompare() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diffResults, setDiffResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!text1.trim() || !text2.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await compareVersions(text1, text2);
      setDiffResults(data.diff);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-sans animate-fade-in relative z-10 pb-20">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/analysis" className="text-slate-400 hover:text-blue-600 transition-colors btn-haptic">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Version Comparison</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Compare two versions of a contract to see what changed.
          </p>
        </div>

        <button 
          onClick={handleCompare}
          disabled={isLoading || !text1 || !text2}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          )}
          {isLoading ? "Analyzing..." : "Compare Now"}
        </button>
      </div>

      {!diffResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">Version 1 (Original)</label>
            <textarea 
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="Paste original contract text here..."
              className="w-full h-80 rounded-2xl border-2 border-slate-100 p-6 focus:border-blue-500 focus:outline-none transition-all font-serif leading-relaxed text-slate-700 bg-white/50"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">Version 2 (Modified)</label>
            <textarea 
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="Paste modified contract text here..."
              className="w-full h-80 rounded-2xl border-2 border-slate-100 p-6 focus:border-blue-500 focus:outline-none transition-all font-serif leading-relaxed text-slate-700 bg-white/50"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-8 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Main Diff Interface */}
      {diffResults && (
        <div className="glass rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
          <div className="bg-slate-50/80 border-b border-slate-200 p-4 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
               Comparison Results
            </h2>
            <button 
              onClick={() => setDiffResults(null)}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              Reset Comparison
            </button>
          </div>
          
          <div className="flex-1 p-6 md:p-8 space-y-12 bg-white/40">
             {diffResults.map((clause, idx) => (
              <div key={clause.id} className="animate-slide-in-up" style={{animationDelay: `${idx * 0.15}s`}}>
                <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4 uppercase tracking-wide text-sm">{clause.section}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* Original Side */}
                  <div className="border border-rose-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs font-bold text-rose-800 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                       Draft V1.0 (Original)
                    </div>
                    <div className="p-5 font-serif text-[15px] leading-relaxed text-slate-700 bg-white">
                      {clause.changes.map((change, i) => (
                        <span key={`orig-${i}`} className={change.type === 'removed' ? 'bg-rose-200 text-rose-900 line-through decoration-rose-500 decoration-2' : change.type === 'added' ? 'hidden' : ''}>
                          {change.text}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Modified Side */}
                  <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                       Draft V2.0 (Current)
                    </div>
                    <div className="p-5 font-serif text-[15px] leading-relaxed text-slate-800 bg-white relative">
                      {clause.changes.map((change, i) => (
                        <span key={`mod-${i}`} className={change.type === 'added' ? 'bg-emerald-200 text-emerald-900 font-medium' : change.type === 'removed' ? 'hidden' : ''}>
                          {change.text}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-12"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VersionCompare;
