import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Shield, Mail, Phone, MapPin } from "lucide-react";

const FEATURES = [
  {
    title: "Risky Clause Detection",
    description: "Automatically identify auto-renewal, hidden penalties, and unfair terms with AI precision.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "from-emerald-400 to-green-500",
    bg: "bg-emerald-50 text-emerald-600"
  },
  {
    title: "Plain English Explanation",
    description: "Complex legalese translated into simple, understandable language for everyone.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50 text-blue-600"
  },
  {
    title: "Model Accuracy",
    description: "Industry-leading 95% accuracy in detecting hidden traps, legal risks, and compliance issues.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "from-purple-400 to-fuchsia-500",
    bg: "bg-purple-50 text-purple-600"
  },
  {
    title: "Trap Chain Detection",
    description: "Detect when multiple seemingly innocent clauses combine to create hidden traps.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 text-amber-600"
  },
  {
    title: "Multilingual Support",
    description: "Translate explanations into multiple languages seamlessly.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
    color: "from-rose-400 to-red-500",
    bg: "bg-rose-50 text-rose-600"
  },
  {
    title: "Legal AI Consultant",
    description: "Ask general legal questions and get instant AI-guided answers.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    color: "from-cyan-400 to-blue-500",
    bg: "bg-cyan-50 text-cyan-600"
  },
  {
    title: "Interactive Glossary",
    description: "Searchable database of hundreds of legal terms explained simply.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: "from-orange-400 to-amber-500",
    bg: "bg-orange-50 text-orange-600"
  },
];

function Home() {
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(1);
  const totalBgs = 5;

  const user = JSON.parse(localStorage.getItem("userInfo") || "null");

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev === totalBgs ? 1 : prev + 1));
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-hidden min-h-screen bg-white">
      {/* ── Cinematic Hero Section ── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center pt-20">
        
        {/* Background Image Loop (Unified) */}
        <div className="absolute inset-0 z-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${bgIndex === i ? 'opacity-20' : 'opacity-0'}`}
              style={{ backgroundImage: `url('/images/bg${i}.png')` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black mb-8 animate-fade-in uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Empowering 10,000+ Users with AI
          </div>

          <h1 className="text-6xl sm:text-8xl font-black text-slate-900 mb-6 tracking-tight animate-slide-up">
            Sign Contracts <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Without the Risk.
            </span>
          </h1>

          <p className="text-xl text-slate-500 mb-12 max-w-3xl mx-auto font-medium leading-relaxed animate-slide-up [animation-delay:100ms]">
            LegalEase uses ensemble AI models to detect hidden traps in seconds. 
            Translate complex legalese into plain English and negotiate like a pro.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up [animation-delay:200ms]">
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="px-10 py-5 text-lg font-black text-white bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
            >
              {user ? "Go to Dashboard" : "Start Analyzing Free"}
            </Link>
            <Link
              to={user ? "/dashboard" : "/signin"}
              className="px-10 py-5 text-lg font-black text-slate-700 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-200 transition-all active:scale-95"
            >
              {user ? "View My Scans" : "Sign In"}
            </Link>
          </div>
        </div>

        {/* ── Floating Powerful Features Grid (The "Wow" Factor) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10 w-full">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.slice(0, 4).map((f, i) => (
                <div 
                  key={i} 
                  className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                   <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform`}>
                      {f.icon}
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                   <p className="text-slate-500 font-bold text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
           </div>
           

        </div>

      </div>

      {/* ── More Features (Remaining) ── */}
      <div className="bg-slate-950 py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="text-center mb-20">
              <h2 className="text-4xl font-black !text-white mb-4">Enterprise Grade Intelligence</h2>
              <p className="text-slate-300 font-bold text-lg">Beyond simple analysis. We provide legal strategic dominance.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEATURES.slice(4).map((f, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] bg-white/15 border border-white/30 hover:bg-white/25 transition-all cursor-default shadow-2xl backdrop-blur-sm">
                   <div className="text-blue-400 mb-6">{f.icon}</div>
                   <h4 className="text-xl font-black !text-white mb-2">{f.title}</h4>
                   <p className="text-slate-300 font-medium text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
      {/* ── Proper Footer ── */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic">L</div>
                <span className="text-2xl font-black text-slate-900">LegalEase</span>
              </div>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                Empowering individuals and businesses to understand the fine print using advanced AI orchestration.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link to="/analysis" className="text-slate-500 font-bold text-sm hover:text-blue-600">AI Scanner</Link></li>
                <li><Link to="/legal-ai" className="text-slate-500 font-bold text-sm hover:text-blue-600">Legal Assistant</Link></li>
                <li><Link to="/glossary" className="text-slate-500 font-bold text-sm hover:text-blue-600">Law Glossary</Link></li>
                <li><Link to="/premium" className="text-slate-500 font-bold text-sm hover:text-blue-600">Enterprise Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 font-bold text-sm hover:text-blue-600">About Us</a></li>
                <li><a href="#" className="text-slate-500 font-bold text-sm hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 font-bold text-sm hover:text-blue-600">Terms of Service</a></li>
                <li><a href="#" className="text-slate-500 font-bold text-sm hover:text-blue-600">Contact Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm"><Mail className="w-4 h-4 text-blue-500" /> support@legalease.ai</li>
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm"><Phone className="w-4 h-4 text-blue-500" /> +91 (800) LEGAL-AI</li>
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm"><MapPin className="w-4 h-4 text-blue-500" /> Tech Hub, Bengaluru, India</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-slate-400">© 2026 LegalEase AI. All rights reserved.</p>
            <p className="text-xs font-bold text-slate-300">Built with ❤️ for Indian Contract Act Compliance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
