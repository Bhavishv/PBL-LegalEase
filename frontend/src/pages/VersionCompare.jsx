import { Link } from "react-router-dom";

// Mock version diff data representing V1 -> V2 of a clause
const DIFF_CLAUSES = [
  {
    id: "diff1",
    section: "1. Term and Termination",
    original: "This Agreement shall commence on the Effective Date and shall automatically renew for successive one-year terms. Either party may cancel with 90 days notice.",
    modified: "This Agreement shall commence on the Effective Date and shall automatically renew for successive one-year terms unless either party provides written notice of its intent not to renew to the other party at least ninety (30) days prior to the expiration.",
    changes: [
      { type: "unchanged", text: "This Agreement shall commence on the Effective Date and shall automatically renew for successive one-year terms " },
      { type: "removed", text: ". Either party may cancel with 90 days notice." },
      { type: "added", text: "unless either party provides written notice of its intent not to renew to the other party at least ninety (30) days prior to the expiration." }
    ]
  },
  {
    id: "diff2",
    section: "4. Dispute Resolution",
    original: "Any dispute arising out of this contract shall be settled exclusively by resolving the issue in a court of competent jurisdiction in the state of California.",
    modified: "Any dispute, controversy or claim arising out of or relating to this contract shall be settled exclusively by binding arbitration in the state of Delaware. Class actions and jury trials are expressly waived.",
    changes: [
      { type: "unchanged", text: "Any dispute" },
      { type: "added", text: ", controversy or claim " },
      { type: "unchanged", text: "arising out of " },
      { type: "added", text: "or relating to " },
      { type: "unchanged", text: "this contract shall be settled exclusively by " },
      { type: "removed", text: "resolving the issue in a court of competent jurisdiction in the state of California." },
      { type: "added", text: "binding arbitration in the state of Delaware. Class actions and jury trials are expressly waived." }
    ]
  }
];

function VersionCompare() {
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
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            SaaS_Subscription_Agreement.pdf
          </p>
        </div>

        {/* Global Controls */}
        <div className="glass px-2 py-2 rounded-xl flex items-center shadow-sm border border-slate-200">
           <div className="px-4 py-1.5 flex flex-col items-center">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Base</span>
             <span className="text-sm font-bold text-slate-700">Draft v1.0</span>
           </div>
           <div className="text-slate-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </div>
           <div className="px-4 py-1.5 flex flex-col items-center">
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Compare</span>
             <span className="text-sm font-bold text-blue-600">Draft v2.0 (Current)</span>
           </div>
        </div>
      </div>

      {/* Main Diff Interface */}
      <div className="glass rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
        <div className="bg-slate-50/80 border-b border-slate-200 p-4 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
             Document Changes
          </h2>
          <div className="flex gap-4 items-center text-sm font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
             <span className="text-rose-600 font-bold bg-rose-50 px-2 rounded">- 2 Deletions</span>
             <span className="text-slate-300">|</span>
             <span className="text-emerald-600 font-bold bg-emerald-50 px-2 rounded">+ 4 Additions</span>
          </div>
        </div>
        
        <div className="flex-1 p-6 md:p-8 space-y-12 bg-white/40">
           {DIFF_CLAUSES.map((clause, idx) => (
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
                     {/* Suggestion AI Hint */}
                     {idx === 0 && (
                        <div className="absolute top-2 right-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                           AI Negotiated Change
                        </div>
                     )}
                     
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
    </div>
  );
}

export default VersionCompare;
