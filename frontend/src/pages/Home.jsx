import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

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
    title: "Contract Risk Score",
    description: "Get a unified, comprehensive risk rating before you sign on the dotted line.",
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
  const [bgIndex, setBgIndex] = useState(1);
  const totalBgs = 5;

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
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${bgIndex === i ? 'opacity-10' : 'opacity-0'}`}
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
              to="/signup"
              className="px-10 py-5 text-lg font-black text-white bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
            >
              Start Analyzing Free
            </Link>
            <Link
              to="/signin"
              className="px-10 py-5 text-lg font-black text-slate-700 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-200 transition-all active:scale-95"
            >
              Sign In
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
           
           <div className="mt-12 text-center animate-fade-in [animation-delay:500ms]">
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] mb-8">Trusted by Modern Teams</p>
              <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale filter">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png" alt="Partner" className="h-6" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1024px-Google_2015_logo.svg.png" alt="Partner" className="h-6" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/LinkedIn_Logo.svg/1024px-LinkedIn_Logo.svg.png" alt="Partner" className="h-6" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Slack_Technologies_Logo.svg/1024px-Slack_Technologies_Logo.svg.png" alt="Partner" className="h-6" />
              </div>
           </div>
        </div>

      </div>

      {/* ── More Features (Remaining) ── */}
      <div className="bg-slate-950 py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-white mb-4">Enterprise Grade Intelligence</h2>
              <p className="text-slate-400 font-bold text-lg">Beyond simple analysis. We provide legal strategic dominance.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEATURES.slice(4).map((f, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default">
                   <div className="text-blue-500 mb-6">{f.icon}</div>
                   <h4 className="text-xl font-black text-white mb-2">{f.title}</h4>
                   <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>

    </div>
  );
}

export default Home;
