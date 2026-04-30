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
import { Joyride, STATUS } from 'react-joyride';

function Dashboard() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({ totalScans: 0, totalRisks: 0, termsLearned: 0, trustScore: "0%" });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tour Guide State
  const [runTour, setRunTour] = useState(false);
  const [tourSteps] = useState([
    {
      target: '.tour-step-1',
      content: 'Welcome to LegalEase! This is your Dashboard where you can monitor all your legal activities.',
      disableBeacon: true,
    },
    {
      target: '.tour-step-2',
      content: 'Start by uploading a contract here. You can drag and drop PDFs, docs, or images. The AI will analyze it instantly.',
    },
    {
      target: '.tour-step-3',
      content: 'Here you can see your recent analysis history and quickly access past reports.',
    },
    {
      target: '.tour-step-4',
      content: 'Access powerful features like Legal AI chat, Glossary, and Community Crowd Intel from this menu.',
    }
  ]);

  useEffect(() => {
    // Only run tour if they haven't seen it
    const hasSeenTour = localStorage.getItem('legalease_tour_completed');
    if (!hasSeenTour) {
      setTimeout(() => setRunTour(true), 1000);
    }
  }, []);

  const handleTourCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem('legalease_tour_completed', 'true');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      
      // If not logged in, don't even try to fetch (prevents 401 errors)
      if (!userInfo.token) {
        setLoading(false);
        return;
      }

      try {
        const headers = { "Authorization": `Bearer ${userInfo.token}` };

        const statsRes = await fetch("/api/analysis/stats", { headers });
        if (statsRes.status === 401) return; // Silent fail on 401
        
        const statsJson = await statsRes.json();
        setStatsData(statsJson);

        const recentRes = await fetch("/api/analysis/recent", { headers });
        if (recentRes.status === 401) return;
        
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

  const [featureIndex, setFeatureIndex] = useState(0);
  const dashboardFeatures = [
    { 
      title: "Legal AI Chat", 
      desc: "Ask questions about your contract", 
      icon: MessageSquare, 
      link: "/legal-ai", 
      color: "bg-blue-600",
      lightColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    { 
      title: "Legal Glossary", 
      desc: "Master 500+ legal terms", 
      icon: BookOpen, 
      link: "/glossary", 
      color: "bg-indigo-600",
      lightColor: "bg-indigo-100",
      iconColor: "text-indigo-600"
    },
    { 
      title: "Crowd Intelligence", 
      desc: "Community risk reports", 
      icon: Users, 
      link: "/crowd-intel", 
      color: "bg-slate-900",
      lightColor: "bg-slate-100",
      iconColor: "text-slate-600"
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % dashboardFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 bg-grid min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 animate-gradient-xy flex flex-col">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#2563eb',
            textColor: '#0f172a',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
          },
          tooltipContainer: { textAlign: 'left' },
          buttonNext: { borderRadius: '8px', fontWeight: 'bold' },
          buttonBack: { color: '#64748b' }
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative flex-1 w-full">
        
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 blur-[120px] rounded-full -mr-48 -mt-24 pointer-events-none"></div>

        {/* Header - Welcome & Search row */}
        <div className="tour-step-1 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              LegalEase <span className="text-blue-600">AI</span>
            </h1>
            <p className="text-slate-500 font-medium">We translate complex contracts into simple language for everyone.</p>
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
            <div className="tour-step-2 glass-card rounded-[2.5rem] p-8 md:p-12 border-slate-200/60 overflow-hidden relative group">
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
            <div className="tour-step-3 glass-card rounded-[2rem] p-8 border-slate-100">
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

          {/* Right Sidebar - Feature Carousel */}
          <div className="tour-step-4 lg:col-span-4 space-y-6 animate-slide-up [animation-delay:0.2s]">
            
            <div className="relative h-44 group overflow-hidden rounded-[2rem] shadow-xl">
               {dashboardFeatures.map((f, idx) => (
                 <Link 
                  key={idx}
                  to={f.link}
                  className={`absolute inset-0 p-8 transition-all duration-700 ease-in-out flex flex-col justify-center ${
                    featureIndex === idx ? 'translate-x-0 opacity-100 z-10' : 'translate-x-full opacity-0 z-0'
                  } ${f.color} text-white`}
                 >
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                          <f.icon className="w-8 h-8 text-white" />
                       </div>
                       <div>
                          <h4 className="text-xl font-black">{f.title}</h4>
                          <p className="text-blue-100 text-sm font-medium">{f.desc}</p>
                       </div>
                    </div>
                    <div className="absolute bottom-4 right-8 flex gap-1">
                       {dashboardFeatures.map((_, dotIdx) => (
                         <div key={dotIdx} className={`w-1.5 h-1.5 rounded-full transition-all ${featureIndex === dotIdx ? 'bg-white w-4' : 'bg-white/30'}`} />
                       ))}
                    </div>
                 </Link>
               ))}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-lg">
               <div className="absolute top-0 right-0 -mr-4 -mt-4 p-8 opacity-20 rotate-12 scale-150 group-hover:rotate-45 transition-transform duration-700">
                <LayoutGrid className="w-20 h-20" />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <h4 className="text-xl font-black">LegalEase Pro</h4>
                  </div>
                  <p className="text-blue-100 text-sm font-medium leading-relaxed">
                    Get unlimited scans, priority AI analysis, and multi-language support.
                  </p>
                  <button 
                    onClick={() => navigate("/premium")}
                    className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl shadow-lg hover:bg-blue-50 transition-all text-xs uppercase tracking-widest active:scale-95"
                  >
                    Upgrade Now
                  </button>
               </div>
            </div>

            {/* Live System Health Widget */}
            <div className="glass-card rounded-[2rem] p-6 border-slate-100">
               <div className="flex items-center justify-between mb-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Health</h5>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-bold text-emerald-600">Operational</span>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                     <span className="text-slate-500">AI Model Response</span>
                     <span className="text-slate-900">1.2s</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold">
                     <span className="text-slate-500">API Latency</span>
                     <span className="text-slate-900">45ms</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Real-time Professional Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-[10px] font-black text-white italic">L</div>
              <span className="text-xs font-black text-slate-900 tracking-tight">LegalEase <span className="text-blue-600">v2.5</span></span>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Server Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="h-4 w-px bg-slate-100" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 PBL LegalEase Project • MIT License</p>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
