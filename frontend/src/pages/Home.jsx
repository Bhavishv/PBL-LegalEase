import { Link } from "react-router-dom";

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
];

function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-10 overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft"></div>
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

      <section className="text-center py-20 sm:py-32 relative z-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-slide-in-up transition-haptic hover:shadow-glow-hover cursor-default">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          Next-Gen Contract Intelligence
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          AI Contract Risk <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
            Analyzer
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          Understand contracts before you sign. LegalEase detects risky clauses,
          explains them in plain English, and helps you avoid hidden traps with powerful AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center animate-spring-pop" style={{ animationDelay: '0.3s' }}>
          <Link
            to="/signup"
            className="btn-haptic inline-flex justify-center items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-glow hover:shadow-glow-hover transition-all"
          >
            Start Analyzing Free
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            to="/signin"
            className="btn-haptic inline-flex justify-center items-center px-8 py-4 text-lg font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-haptic"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="mt-10 relative z-10 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
          Powerful Features
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 cursor-default">
          {FEATURES.map((feature, idx) => (
            <div
              key={feature.title}
              className="glass rounded-2xl p-8 hover:shadow-glow-hover transition-haptic group animate-slide-in-up"
              style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
            >
              <div className={`w-14 h-14 flex items-center justify-center mb-6 rounded-xl ${feature.bg} bg-opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-colors">
                {feature.title}
              </h3>
              <p className="text-base text-slate-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
