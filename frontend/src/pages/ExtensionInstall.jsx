import { Link, useNavigate } from "react-router-dom";

export default function ExtensionInstall() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-8rem)]">
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
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 text-teal-600 mb-6 shadow-sm border border-teal-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Install the Browser Extension
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
          Get real-time contract analysis directly in your browser. Follow these simple steps to add LegalEase in under a minute.
        </p>
      </div>

      {/* Download Action */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
        <a
          href="/extension/legalease-extension.zip"
          download="legalease-extension.zip"
          className="btn-haptic flex items-center gap-2 px-8 py-4 font-semibold text-white rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 transition-all text-lg w-full sm:w-auto justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Extension
        </a>
        <Link
          to="/analyze-website"
          className="btn-haptic flex items-center gap-2 px-8 py-4 font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-lg w-full sm:w-auto justify-center shadow-sm"
        >
          Try URL Analyzer Instead
        </Link>
      </div>

      {/* Installation Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Installation Guide
          </h2>
        </div>
        
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Extract the File</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                Locate the downloaded ZIP file on your computer. Right-click the file and select <strong className="text-slate-800">Extract All...</strong> to unzip the folder.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="hidden md:block absolute top-5 -left-8 w-6 h-px bg-slate-200"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Open Extensions</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                Open a new tab in your browser and type <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-slate-200">chrome://extensions</code> in the address bar.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="hidden md:block absolute top-5 -left-8 w-6 h-px bg-slate-200"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">Load Extension</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                Turn on <strong className="text-slate-800">Developer mode</strong> (usually in the top right). Click <strong className="text-slate-800">Load unpacked</strong> and select your extracted folder.
              </p>
            </div>

          </div>
        </div>
      </div>

      <p className="text-center text-sm text-slate-400 mt-12 flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Privacy first: The extension analyzes page text only when you explicitly choose to run it.
      </p>
    </div>
  );
}
