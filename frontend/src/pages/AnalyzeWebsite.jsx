import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/Toast";
import { analyzeUrl } from "../services/api";
import { saveContractToVault } from "./ContractVault";

export default function AnalyzeWebsite() {
  const [url, setUrl] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidUrl = (value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    if (!isValidUrl(url)) {
      setToast({ message: "Enter a valid https:// URL (Terms, Privacy Policy, etc.).", type: "warning" });
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeUrl(url.trim());
      sessionStorage.setItem("legalease_analysis", JSON.stringify(result));
      saveContractToVault(result);
      setToast({ message: "Analysis complete — opening report.", type: "success" });
      setTimeout(() => navigate("/analysis"), 600);
    } catch (err) {
      setToast({ message: err.message || "Could not analyze this URL.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="absolute top-20 right-10 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse-soft pointer-events-none" />

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="mb-8 p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
        title="Back to Dashboard"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Header Section */}
      <div className="text-center mb-12 animate-slide-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-6 shadow-sm border border-indigo-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Scan a Website Link
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Paste the URL of any Terms of Service or Privacy Policy. LegalEase will instantly scan the webpage and highlight any hidden risks before you click 'Accept'.
        </p>
      </div>

      {/* Input Section */}
      <div
        className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 animate-slide-in-up max-w-3xl mx-auto"
        style={{ animationDelay: "0.08s" }}
      >
        <label htmlFor="policy-url" className="block text-sm font-semibold text-slate-700 mb-3">
          Website URL
        </label>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            id="policy-url"
            type="url"
            autoComplete="url"
            placeholder="https://example.com/privacy-policy"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
            disabled={loading}
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors disabled:opacity-60"
          />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            Note: Some websites block automated scanners. If it fails, try the <Link to="/dashboard" className="text-indigo-600 hover:underline font-medium">file upload</Link> instead.
          </p>
          
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-teal-600 to-indigo-600 rounded-xl hover:from-teal-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                Scan Link
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
