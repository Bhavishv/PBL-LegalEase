import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  FileText, 
  Users, 
  ShieldAlert, 
  BookOpen, 
  Sparkles, 
  History,
  LayoutGrid,
  TrendingUp,
  Search,
  MessageSquare,
  Loader2
} from "lucide-react";
import UploadContract from "../components/UploadContract";

function Dashboard() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({ totalScans: 0, totalRisks: 0, termsLearned: 0, trustScore: "0%" });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch("/api/analysis/stats");
        const statsJson = await statsRes.json();
        setStatsData(statsJson);

        const recentRes = await fetch("/api/analysis/recent");
        const recentJson = await recentRes.json();
        setRecentScans(recentJson);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const stats = [
    { label: "Total Scanned", value: statsData.totalScans, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Risks Found", value: statsData.totalRisks, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
    { label: "Terms Learned", value: statsData.termsLearned, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Trust Score", value: statsData.trustScore, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="flex-1 bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 blur-[120px] rounded-full -mr-48 -mt-24 pointer-events-none"></div>

        {/* Header - Welcome & Search row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Contract <span className="text-blue-600">Commander</span>
            </h1>
            <p className="text-slate-500 font-medium">Protect your interests with AI-powered legal analysis.</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search your contracts..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-600 shadow-sm"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-slide-up">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card rounded-3xl p-6 border-slate-100 flex flex-col gap-3">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area - Upload */}
          <div className="lg:col-span-8 space-y-8 animate-slide-up [animation-delay:0.1s]">
            <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border-slate-200/60 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 scale-150 opacity-10 group-hover:scale-[1.7] transition-transform duration-700 pointer-events-none">
                <Sparkles className="w-20 h-20 text-blue-600" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-slate-900">Analyze New Contract</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Upload your PDF, Docx, or Image. We'll extract the clauses and highlight potential legal traps in seconds.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {["NDA", "Rental", "Employment", "SaaS"].map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{tag} Support</span>
                    ))}
                  </div>
                  
                  <UploadContract />
                </div>
              </div>
            </div>
            
            {/* Recent Activity Mini-Section */}
            <div className="glass-card rounded-[2rem] p-8 border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" /> Recent Activity
                </h3>
                <Link to="/vault" className="text-sm font-bold text-blue-600 hover:text-blue-700">View Vault</Link>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : recentScans.length > 0 ? (
                  recentScans.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{item.filename}</p>
                        <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.risk_label === 'High Risk' ? 'bg-red-50 text-red-600' : 
                        item.risk_label === 'Warning' ? 'bg-amber-50 text-amber-600' : 
                        'bg-green-50 text-green-600'
                      }`}>
                        {item.risk_label}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-slate-400 font-medium">No recent activity found. Start by uploading a contract!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Feature Quick Access */}
          <div className="lg:col-span-4 space-y-6 animate-slide-up [animation-delay:0.2s]">
            
            <Link to="/legal-ai" className="block glass-card rounded-[2rem] p-6 border-slate-200 group hover:bg-blue-600 transition-all duration-300">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 font-bold scale-110">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-white transition-colors">Legal AI</h4>
                  <p className="text-xs text-slate-500 group-hover:text-blue-100 transition-colors">Chat with your AI lawyer</p>
                </div>
              </div>
            </Link>

            <Link to="/glossary" className="block glass-card rounded-[2rem] p-6 border-slate-200 group hover:bg-indigo-600 transition-all duration-300">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 font-bold scale-110">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-white transition-colors">Glossary</h4>
                  <p className="text-xs text-slate-500 group-hover:text-indigo-100 transition-colors">Learn legal terminology</p>
                </div>
              </div>
            </Link>

            <Link to="/crowd-intel" className="block glass-card rounded-[2rem] p-6 border-slate-200 group hover:bg-slate-900 transition-all duration-300">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300 font-bold scale-110">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-white transition-colors">Community</h4>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Crowd Intel reports</p>
                </div>
              </div>
            </Link>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-4 -mt-4 p-8 opacity-20 rotate-12 scale-150">
                <LayoutGrid className="w-20 h-20" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h4 className="text-xl font-black">Upgrade to Pro</h4>
                  <p className="text-blue-100 text-sm font-medium leading-relaxed">
                    Get unlimited scans, priority AI analysis, and multi-language support.
                  </p>
                  <button className="w-full py-3 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:translate-y-[-2px]">
                    Go Premium
                  </button>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
