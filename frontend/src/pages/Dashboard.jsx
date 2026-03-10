import { Link } from "react-router-dom";
import UploadContract from "../components/UploadContract";

const RECENT_CONTRACTS = [
  { id: 1, name: "SaaS_Subscription_Agreement.pdf", date: "Today, 10:45 AM", risk: "high", status: "Review Required" },
  { id: 2, name: "Acme_Corp_NDA_2026.docx", date: "Yesterday, 2:30 PM", risk: "safe", status: "Approved" },
  { id: 3, name: "Office_Lease_Renewal.pdf", date: "Mar 8, 2026", risk: "warning", status: "In Negotiation" },
];

function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen relative">
      {/* Decorative background element */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft"></div>

      <div className="mb-12 animate-slide-in-up relative z-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 mb-3 tracking-tight">
          Dashboard
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Upload a contract to analyze for risky clauses and hidden traps.
        </p>
      </div>

      <div className="animate-slide-in-up relative z-10" style={{ animationDelay: "0.1s" }}>
        <UploadContract />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
        
        {/* Left Col: Contract Vault */}
        <div className="lg:col-span-2 glass rounded-2xl shadow-sm p-6 flex flex-col h-full border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              Contract Vault
            </h2>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">View All</button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Document</th>
                  <th className="pb-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Uploaded</th>
                  <th className="pb-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Risk</th>
                  <th className="pb-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {RECENT_CONTRACTS.map((contract) => (
                  <tr key={contract.id} className="border-b border-slate-100 last:border-b-0 group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 group-hover:bg-white transition-colors">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <Link to="/analysis" className="hover:text-blue-600 transition-colors truncate max-w-[150px] sm:max-w-xs block" title={contract.name}>{contract.name}</Link>
                    </td>
                    <td className="py-4 px-2 text-slate-500 font-medium whitespace-nowrap">{contract.date}</td>
                    <td className="py-4 px-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border
                        ${contract.risk === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                        ${contract.risk === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                        ${contract.risk === 'safe' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${contract.risk === 'high' ? 'bg-rose-500' : contract.risk === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {contract.risk === 'high' ? 'High' : contract.risk === 'warning' ? 'Medium' : 'Low'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{contract.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Overall Exposure */}
        <div className="glass rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Company Exposure
          </h2>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            <div className="relative w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
              {/* Fake donut chart ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="8" fill="none" className="text-emerald-500" strokeDasharray="100 200" strokeLinecap="round" />
                <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="8" fill="none" className="text-amber-500" strokeDasharray="30 200" strokeDashoffset="-100" strokeLinecap="round" />
                <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="8" fill="none" className="text-rose-500" strokeDasharray="20 200" strokeDashoffset="-130" strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <div className="text-3xl font-extrabold text-slate-800">42</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Active</div>
              </div>
            </div>
            
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-600 font-medium"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Safe (122)</span>
                <span className="font-bold text-slate-800">76%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-600 font-medium"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Warning (28)</span>
                <span className="font-bold text-slate-800">18%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-600 font-medium"><span className="w-3 h-3 rounded-full bg-rose-500"></span> High Risk (10)</span>
                <span className="font-bold text-slate-800">6%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
