import { useState, useCallback } from "react";
import Toast from "./Toast";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function UploadContract() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const validateFile = useCallback((selectedFile) => {
    setError(null);

    if (!selectedFile) return false;

    const validExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      showToast("Please upload a PDF, DOC, DOCX, or image file.", "error");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      showToast("File size must be under 10MB.", "error");
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile) => {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setSuccess(false);
        showToast(`File selected: ${selectedFile.name}`, "success");
      } else {
        setFile(null);
      }
    },
    [validateFile]
  );

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a contract to analyze.", "warning");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload with progress
      console.log("Uploading file:", file.name);
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((r) => setTimeout(r, 100));
      }
      
      setSuccess(true);
      setUploadProgress(100);
      showToast(`Successfully uploaded ${file.name}!`, "success");
      
      // Reset after showing success state
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);
      // Later: navigate("/analysis");
    } catch (err) {
      showToast("Upload failed. Please try again.", "error");
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile || null);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    showToast("File cleared", "info");
  };

  return (
    <div className="glass rounded-2xl p-8 relative overflow-hidden group">
      {/* Subtle glow behind the upload component */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Upload Contract
        </h3>
        <p className="text-sm text-slate-500 mb-8 font-medium">
          Upload a PDF, DOC, or image to analyze for risky clauses.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-haptic duration-300 ${
            isDragging
              ? "border-blue-500 bg-blue-50/80 scale-[1.02] shadow-glow"
              : success
              ? "border-emerald-500 bg-emerald-50/80 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              : "border-slate-300 hover:border-blue-400 bg-white/50 hover:bg-white/80 hover:shadow-md"
          }`}
        >
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleInputChange}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${file ? "pointer-events-none" : ""}`}
          />
          {success ? (
            <div className="relative z-10 flex flex-col items-center gap-4 animate-spring-pop">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center rotate-3">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">Uploaded successfully!</p>
                <p className="text-sm text-emerald-600 font-medium mt-1">Processing your contract...</p>
              </div>
            </div>
          ) : file ? (
            <div className="relative z-10 flex flex-col items-center gap-4 animate-slide-in-up">
              <div className="flex flex-col items-center gap-3 text-slate-700">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center -rotate-3 transition-transform hover:rotate-0">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="max-w-xs text-center">
                  <span className="font-bold text-slate-800 break-words block">{file.name}</span>
                  <span className="text-sm text-slate-500 font-medium">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              
              {isUploading && (
                <div className="w-full max-w-xs mt-2">
                  <div className="bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full"></div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-blue-600 mt-2 tracking-wide text-right">{uploadProgress}%</p>
                </div>
              )}
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={isUploading}
                className="btn-haptic mt-2 text-sm font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
              >
                Cancel & Remove
              </button>
            </div>
          ) : (
            <div className="space-y-4 pointer-events-none">
              <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm animate-bounce-custom">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base text-slate-700 font-medium">
                  Drag and drop your contract here, or{" "}
                  <span className="text-blue-600 font-bold">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">SUPPORTS PDF, DOC, DOCX, PNG, JPG</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl animate-spring-pop border border-rose-100">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="btn-haptic mt-8 w-full block px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none shadow-glow hover:shadow-glow-hover transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Analyzing Document...
            </span>
          ) : (
            "Analyze Contract"
          )}
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default UploadContract;
