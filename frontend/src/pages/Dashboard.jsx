import { Link, useNavigate } from "react-router-dom";
import UploadContract from "../components/UploadContract";

function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen relative">
      {/* Decorative glows */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft pointer-events-none"></div>

      {/* Header */}
      <div className="mb-12 animate-slide-in-up relative z-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/")}
            className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
        </div>
        <p className="text-lg text-slate-600 font-medium sm:ml-14 max-w-2xl">
          Upload a document, scan a website, or access your past analyses.
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="animate-slide-in-up relative z-10 mb-16 max-w-3xl sm:ml-14" style={{ animationDelay: "0.1s" }}>
        <UploadContract />
      </div>

      {/* Tools Grid */}
      <div className="animate-slide-in-up relative z-10 sm:ml-14" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Quick Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
          
          {/* Analyze Website */}
          <Link
            to="/analyze-website"
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-teal-700 transition-colors">Scan Website URL</h3>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Paste a link to instantly analyze a privacy policy or terms of service page.
              </p>
            </div>
          </Link>

          {/* Browser Extension */}
          <Link
            to="/download"
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-500 group-hover:text-white transition-colors flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-violet-700 transition-colors">Browser Extension</h3>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Install LegalEase in your browser for real-time contract analysis.
              </p>
            </div>
          </Link>

          {/* Contract Vault */}
          <Link 
            to="/vault"
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">Contract Vault</h3>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Access and review all your previously analyzed documents.
              </p>
            </div>
          </Link>

          {/* Compare Versions */}
          <Link 
            to="/version-compare"
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors">Compare Versions</h3>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Upload two versions of a contract to highlight changes side-by-side.
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
