import { Link, useNavigate } from "react-router-dom";
import UploadContract from "../components/UploadContract";

function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen relative">
      {/* Decorative glow */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft pointer-events-none"></div>

      {/* Header */}
      <div className="mb-10 animate-slide-in-up relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
            Dashboard
          </h1>
        </div>
        <p className="text-lg text-slate-600 font-medium ml-11">
          Upload a contract to get an instant AI-powered risk report.
        </p>
      </div>

      {/* Upload box */}
      <div className="animate-slide-in-up relative z-10" style={{ animationDelay: "0.1s" }}>
        <UploadContract />
      </div>

      {/* Quick action tiles */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in-up relative z-10" style={{ animationDelay: "0.2s" }}>

        <Link to="/vault"
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">Contract Vault</p>
            <p className="text-sm text-slate-500">View all your past analyses</p>
          </div>
          <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link to="/crowd-intel"
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Crowd Intelligence</p>
            <p className="text-sm text-slate-500">See what others found risky</p>
          </div>
          <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-400 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
