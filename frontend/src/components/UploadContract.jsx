import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import ScannerModal from "./ScannerModal";
import { uploadContract } from "../services/api";
import { saveContractToVault } from "../pages/ContractVault";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function UploadContract() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("Analyzing...");
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const handleScanComplete = async (imageUrl) => {
    try {
      showToast("Fetching scanned document...", "info");
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const ext = imageUrl.split('.').pop() || 'jpg';
      const scannedFile = new File([blob], `scanned_document_${Date.now()}.${ext}`, { type: blob.type });
      handleFileSelect(scannedFile);
    } catch (error) {
      console.error("Error fetching scanned document:", error);
      showToast("Failed to load scanned document.", "error");
    }
  };

  const validateFile = useCallback((selectedFile) => {
    setError(null);
    if (!selectedFile) return false;

    const validExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "txt"];
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    const isValidFormat = (extension && validExtensions.includes(extension)) || selectedFile.type?.startsWith('image/');

    if (!isValidFormat) {
      showToast("Please upload a PDF, DOC, DOCX, TXT, or image file.", "error");
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
        if (selectedFile.type?.startsWith('image/')) {
          const url = URL.createObjectURL(selectedFile);
          setPreviewUrl(url);
        } else {
          setPreviewUrl(null);
        }
        showToast(`Selected: ${selectedFile.name}`, "success");
      } else {
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [validateFile]
  );

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      showToast("Please select a contract first.", "warning");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);
    setUploadStatusText("Uploading document...");

    const progressSteps = [
      { pct: 30, label: "Extracting Text (OCR)..." },
      { pct: 55, label: "Scanning Clauses..." },
      { pct: 80, label: "Applying Legal Intelligence..." },
      { pct: 95, label: "Finalizing Analysis..." },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < progressSteps.length) {
        setUploadProgress(progressSteps[step].pct);
        setUploadStatusText(progressSteps[step].label);
        step++;
      }
    }, 1000);

    try {
      const result = await uploadContract(file);
      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatusText("Analysis complete!");
      sessionStorage.setItem("legalease_analysis", JSON.stringify(result));
      saveContractToVault(result);
      setSuccess(true);
      setTimeout(() => navigate("/analysis"), 1200);
    } catch (err) {
      clearInterval(interval);
      const msg = err.message || "Analysis failed.";
      showToast(msg, "error");
      setError(msg);
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
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      showToast("Camera access denied", "error");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], "scanned_contract.jpg", { type: "image/jpeg" });
          handleFileSelect(f);
          closeCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 relative overflow-hidden group border border-slate-200/50 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-blue-50/20 pointer-events-none"></div>

      <div className="relative z-10">
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Contract Analysis</h3>
        <p className="text-sm text-slate-500 mb-8 font-bold">Securely upload for instant AI decoding</p>

        {isCameraOpen ? (
          <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center animate-slide-in-up shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
            <div className="absolute inset-0 border-2 border-white/30 border-dashed m-10 rounded-2xl pointer-events-none"></div>
            <div className="absolute bottom-6 flex gap-4 z-10">
              <button onClick={closeCamera} className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-black rounded-xl transition-all">Cancel</button>
              <button onClick={captureImage} className="px-8 py-3 bg-white text-slate-900 font-black rounded-xl shadow-xl flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div> Capture Scan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-300 ${
                isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl" :
                file ? "border-indigo-400 bg-indigo-50/30" : "border-slate-200 hover:border-blue-400 bg-white"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleInputChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-5 animate-spring-pop">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-2xl shadow-md border-2 border-white" />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-black text-slate-900 truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs font-bold text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {!isUploading && (
                    <button onClick={clearFile} className="btn-haptic text-xs font-black text-rose-500 uppercase tracking-widest hover:underline px-4 py-2 bg-rose-50 rounded-lg">Remove File</button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto flex items-center justify-center border border-slate-100 shadow-sm animate-bounce-custom relative group-hover:bg-indigo-50 transition-colors">
                     <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800">Drag & drop your contract</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                       <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 font-black hover:underline">browse files</button>
                       <span className="text-slate-300 font-black">|</span>
                       <button onClick={() => setShowScanner(true)} className="text-indigo-600 font-black hover:underline flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                          scan from mobile
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="w-full max-w-xs mx-auto mt-8 space-y-3 animate-fade-in">
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[2px]">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-700">
                    <span>{uploadStatusText}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>

            {!file && (
              <button
                onClick={openCamera}
                className="btn-haptic mt-6 w-full flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-slate-100 text-slate-800 font-black rounded-2xl hover:border-indigo-300 hover:bg-slate-50 transition-all shadow-sm"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Direct Web-Cam Scan
              </button>
            )}
          </>
        )}

        {success && (
          <div className="mt-6 p-5 bg-emerald-50 border-2 border-emerald-100 rounded-[1.5rem] text-center animate-spring-pop">
             <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
            <p className="text-emerald-800 font-black text-xs uppercase tracking-[0.2em]">Analysis Ready! Launching Report...</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading || isCameraOpen}
          className="btn-haptic mt-10 w-full py-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white font-black rounded-[2rem] disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 shadow-glow-hover active:translate-y-1 transition-all text-lg shadow-xl"
        >
          {isUploading ? "Processing Legal Logic..." : "Analyze Contract →"}
        </button>
      </div>

      <ScannerModal 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScanComplete={handleScanComplete} 
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default UploadContract;
