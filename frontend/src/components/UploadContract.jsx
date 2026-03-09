import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function UploadContract() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("Analyzing Document...");
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const validateFile = useCallback((selectedFile) => {
    setError(null);

    if (!selectedFile) return false;

    const validExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    // If it's a file from camera (blob), it might not have an extension, so we use MIME type check too
    const isValidFormat = (extension && validExtensions.includes(extension)) || selectedFile.type?.startsWith('image/');

    if (!isValidFormat) {
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
    setUploadStatusText("Extracting Text (OCR)...");

    try {
      // Simulate intelligent processing
      await new Promise(r => setTimeout(r, 600));
      setUploadProgress(30);
      setUploadStatusText("Running NLP Clause Detection...");
      
      await new Promise(r => setTimeout(r, 600));
      setUploadProgress(60);
      setUploadStatusText("Matching Knowledge Base (RAG)...");
      
      await new Promise(r => setTimeout(r, 600));
      setUploadProgress(90);
      setUploadStatusText("Finalizing Risk Score...");
      
      await new Promise(r => setTimeout(r, 400));
      
      setSuccess(true);
      setUploadProgress(100);
      showToast(`Successfully analyzed ${file.name}!`, "success");
      
      setTimeout(() => {
        navigate("/analysis");
      }, 1500);
    } catch (err) {
      showToast("Analysis failed. Please try again.", "error");
      setError("Analysis failed. Please try again.");
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

  // Camera Functions
  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showToast("Camera access denied or unavailable", "error");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const simulatedFile = new File([blob], "scanned_contract.jpg", { type: "image/jpeg" });
          handleFileSelect(simulatedFile);
          closeCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  return (
    <div className="glass rounded-2xl p-8 relative overflow-hidden group">
      {/* Subtle glow behind the upload component */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Upload Contract
        </h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">
          Upload a PDF, DOC, image, or scan directly with your camera to analyze for risky clauses.
        </p>

        {isCameraOpen ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center animate-slide-in-up">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[80%] border-2 border-white/50 border-dashed rounded-lg"></div>
            </div>
            
            <div className="absolute bottom-6 left-0 w-full flex justify-center gap-6 px-6 z-10">
              <button
                onClick={closeCamera}
                className="btn-haptic px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={captureImage}
                className="btn-haptic px-8 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg border-2 border-white hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                Capture Scan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-haptic duration-300 ${
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
                    <p className="text-sm text-emerald-600 font-medium mt-1">Redirecting to Analysis Dashboard...</p>
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
                    <div className="w-full max-w-xs mt-2 animate-fade-in">
                      <div className="bg-slate-200/80 rounded-full h-2.5 overflow-hidden shadow-inner mb-2 border border-slate-300/50">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 relative"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-indigo-700">{uploadStatusText}</span>
                        <span className="font-bold text-blue-600 tracking-wide">{uploadProgress}%</span>
                      </div>
                    </div>
                  )}
                  
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="btn-haptic mt-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      Cancel & Remove
                    </button>
                  )}
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

            {!file && (
              <div className="mt-4 flex items-center justify-center">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            )}

            {!file && (
              <button
                onClick={openCamera}
                className="btn-haptic mt-4 w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan with Camera
              </button>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl animate-spring-pop border border-rose-100">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading || isCameraOpen}
          className="btn-haptic mt-8 w-full block px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none shadow-glow hover:shadow-glow-hover transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {uploadProgress < 100 ? "Analyzing..." : "Finalizing..."}
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
