import UploadContract from "../components/UploadContract";

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

      <div className="mt-12 p-6 glass rounded-2xl shadow-sm hover:shadow-glow-hover transition-haptic animate-slide-in-up relative z-10" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-6 h-6 text-indigo-600 animate-pulse-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-indigo-900 mb-1 tracking-wide uppercase">Coming soon</p>
            <p className="text-sm text-indigo-800 font-medium">
              Analysis results, risk highlighting, and plain English explanations will appear here after processing your contract.
            </p>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
        <div className="p-6 glass rounded-2xl hover:shadow-glow-hover transition-haptic group animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-200/80 transition-transform duration-300">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Analysis</h3>
          <p className="text-sm text-slate-600 font-medium">Advanced AI analyzes contracts for hidden risks and unfavorable terms seamlessly.</p>
        </div>

        <div className="p-6 glass rounded-2xl hover:shadow-glow-hover transition-haptic group animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="w-12 h-12 bg-emerald-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-200/80 transition-transform duration-300">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Clear Results</h3>
          <p className="text-sm text-slate-600 font-medium">Get easy-to-understand explanations of risks translated into plain English.</p>
        </div>

        <div className="p-6 glass rounded-2xl hover:shadow-glow-hover transition-haptic group animate-slide-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="w-12 h-12 bg-purple-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-200/80 transition-transform duration-300">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Protected</h3>
          <p className="text-sm text-slate-600 font-medium">Your documents are secure, analyzed, and processed with complete confidentiality.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
