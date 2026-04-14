import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Mock data for Crowd Risk Intelligence
const TRENDING_CLAUSES = [
  {
    id: "cr1",
    category: "Data Privacy",
    title: "Third-Party Data Sharing Without Consent",
    snippet: "...Provider may share Customer data with third-party partners for marketing...",
    rejectionRate: 87,
    renegotiationSuccess: 42,
    industry: "SaaS",
    comments: [
      { user: "Sarah L.", role: "In-House Counsel", text: "Always redline this. Propose 'opt-in' strictly." },
      { user: "TechStartup Inc.", role: "B2B Client", text: "Successfully removed this by citing GDPR compliance requirements." }
    ]
  },
  {
    id: "cr2",
    category: "Dispute Resolution",
    title: "Mandatory Binding Arbitration (Delaware)",
    snippet: "...Any dispute shall be settled exclusively by binding arbitration in Delaware...",
    rejectionRate: 65,
    renegotiationSuccess: 18,
    industry: "All Industries",
    comments: [
      { user: "LegalEagle99", role: "Contract Lawyer", text: "Very hard to fight against large enterpises, but worth attempting to move jurisdiction to your home state." }
    ]
  },
  {
    id: "cr3",
    category: "Term & Termination",
    title: "Auto-Renewal with >60 Day Notice",
    snippet: "...shall automatically renew... unless written notice is provided ninety (90) days prior...",
    rejectionRate: 92,
    renegotiationSuccess: 76,
    industry: "B2B Software",
    comments: [
      { user: "Mike T.", role: "Procurement Manager", text: "Industry standard is moving to 30 days. Push hard on this, vendors almost always cave." },
      { user: "Freelance Hub", role: "Agency", text: "We got stuck in a 1-year contract because of a 90-day clause. Never again." }
    ]
  },
  {
    id: "cr4",
    category: "Liability",
    title: "Uncapped Consequential Damages",
    snippet: "...Provider shall not be liable for any indirect, special, or consequential damages...",
    rejectionRate: 98,
    renegotiationSuccess: 89,
    industry: "Enterprise SaaS",
    comments: [
      { user: "Jane D.", role: "General Counsel", text: "Standard defensive clause, but ensure exclusions exist for gross negligence or data breaches." }
    ]
  }
];

function CrowdIntel() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All Industries");

  const filteredClauses = filter === "All Industries" 
    ? TRENDING_CLAUSES 
    : TRENDING_CLAUSES.filter(c => c.industry === filter || c.industry === "All Industries");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-sans animate-fade-in relative z-10 pb-20">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Crowd Risk Intelligence
            </h1>
          </div>
          <p className="text-slate-500 font-medium mt-1 max-w-2xl">
            Leverage community insights. See how thousands of users and legal professionals react to standard contract clauses in real-time.
          </p>
        </div>

        {/* Global Stats */}
        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-6 shadow-sm border border-blue-100">
           <div>
             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Total Analyzed</span>
             <span className="text-xl font-extrabold text-blue-900">2.4M<span className="text-blue-500">+</span></span>
           </div>
           <div className="w-px h-8 bg-slate-200"></div>
           <div>
             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Contributors</span>
             <div className="flex -space-x-2">
                <img className="w-6 h-6 rounded-full border border-white bg-slate-200" src="https://ui-avatars.com/api/?name=J+D&background=random" alt="User" />
                <img className="w-6 h-6 rounded-full border border-white bg-slate-200" src="https://ui-avatars.com/api/?name=A+S&background=random" alt="User" />
                <img className="w-6 h-6 rounded-full border border-white bg-slate-200" src="https://ui-avatars.com/api/?name=M+T&background=random" alt="User" />
                <div className="w-6 h-6 rounded-full border border-white bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">+14k</div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
        
        {/* Left Sidebar: Filters & Trending */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-4">Context Filter</h3>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm btn-haptic transition-colors text-sm"
            >
              <option value="All Industries">Global (All Industries)</option>
              <option value="SaaS">SaaS & Tech</option>
              <option value="B2B Software">B2B Software</option>
            </select>
          </div>

          <div className="glass rounded-2xl border border-rose-200 shadow-sm overflow-hidden bg-gradient-to-b from-rose-50/50 to-white">
            <div className="bg-rose-50 border-b border-rose-100 p-4">
              <h3 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Trending Hostile Clauses
              </h3>
            </div>
            <div className="p-4 space-y-3">
               <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-rose-100 shadow-sm">
                 <span className="text-xs font-bold text-slate-700">Auto-Renewal Notice</span>
                 <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">#1 Contested</span>
               </div>
               <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <span className="text-xs font-bold text-slate-700">Data Selling</span>
                 <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Spiking</span>
               </div>
               <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <span className="text-xs font-bold text-slate-700">Binding Arbitration</span>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Constant</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Content: The Feed */}
        <div className="lg:col-span-3 space-y-6">
          {filteredClauses.map((clause, idx) => (
            <div key={clause.id} className="glass rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-in-up flex flex-col md:flex-row" style={{animationDelay: `${idx * 0.1}s`}}>
              
              {/* Stats Block (Left side on desktop) */}
              <div className="bg-slate-50/80 md:w-64 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-center relative overfow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-[100px] -z-10"></div>
                 
                 <div className="mb-6">
                   <div className="flex items-end gap-2 mb-1">
                     <span className={`text-4xl font-black ${clause.rejectionRate > 85 ? 'text-rose-600' : 'text-amber-500'}`}>{clause.rejectionRate}%</span>
                     <span className="text-sm font-bold text-slate-500 mb-1">Reject</span>
                   </div>
                   {/* Simple CSS Bar Chart */}
                   <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2 flex">
                     <div className={`h-full ${clause.rejectionRate > 85 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{width: `${clause.rejectionRate}%`}}></div>
                     <div className="h-full bg-emerald-400" style={{width: `${100 - clause.rejectionRate}%`}}></div>
                   </div>
                 </div>

                 <div>
                   <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Renegotiation Success</span>
                   <p className="text-2xl font-bold text-slate-800">{clause.renegotiationSuccess}%</p>
                 </div>
              </div>

              {/* Detail Block (Right side on desktop) */}
              <div className="flex-1 p-6 flex flex-col justify-between bg-white/40">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">{clause.category}</span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{clause.industry}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{clause.title}</h2>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-serif italic text-sm text-slate-600 mb-4">
                    "{clause.snippet}"
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-slate-800 flex items-center gap-2 border-t border-slate-200/60 pt-4">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Top Community Insights
                  </h4>
                  {clause.comments.map((comment, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                       <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                         {comment.user.charAt(0)}
                       </div>
                       <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 shadow-sm flex-1">
                         <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-slate-800">{comment.user}</span>
                           <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{comment.role}</span>
                         </div>
                         <p className="text-slate-600 font-medium">{comment.text}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 btn-haptic bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Add to Playbook
                  </button>
                  <button className="flex-1 btn-haptic bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share
                  </button>
                </div>
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default CrowdIntel;
