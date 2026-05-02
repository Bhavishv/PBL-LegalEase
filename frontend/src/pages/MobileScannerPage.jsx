import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const MobileScannerPage = () => {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('idle'); // idle, camera, uploading, success, error
  const [imageCount, setImageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera stream — only sets status to 'camera', stream is attached in useEffect
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      setStatus('camera');
    } catch (err) {
      console.error("Camera access error:", err);
      let msg = 'Camera access denied or not available.';
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        msg += ' 🔐 Browser security blocks camera on non-secure (HTTP) connections. Use ngrok or HTTPS.';
      }
      setErrorMsg(msg);
      setStatus('error');
    }
  }, []);

  // Attach stream to video element AFTER it has been rendered into the DOM
  useEffect(() => {
    if (status === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Video play error:", err));
    }
  }, [status]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.videoWidth || video.videoWidth === 0) {
      setErrorMsg('Camera is not ready yet.');
      setStatus('error');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setErrorMsg('Failed to capture image.');
        setStatus('error');
        return;
      }
      await uploadImage(blob, `scan_${Date.now()}.jpg`);
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  // Handle gallery file selection
  const handleGallerySelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await uploadImage(file, file.name);
  };

  // Upload image to backend
  const uploadImage = async (fileOrBlob, filename) => {
    setStatus('uploading');

    // SCANNING ROUTES are on the Node server (Port 5000)
    const API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000";

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('image', fileOrBlob, filename);

    try {
      const response = await fetch(`/api/scan/upload`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageCount(data.count);
        setStatus('idle'); // Back to idle to allow more scans
      } else {
        const data = await response.json();
        setErrorMsg(data.message || 'Upload failed');
        setStatus('error');
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setErrorMsg(`Upload failed: ${err.message}`);
      setStatus('error');
    }
  };

  // Mark session as finished
  const finishSession = async () => {
    setStatus('uploading');
    try {
      const response = await fetch(`/api/scan/finish/${sessionId}`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (response.ok) {
        setStatus('success');
      } else {
        setErrorMsg('Failed to finish session');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg('Error finishing session');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Camera Viewfinder (fullscreen-like when active) */}
      {status === 'camera' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="flex-1 w-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => { stopCamera(); setStatus('idle'); }}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/50 shadow-2xl active:scale-90 transition-transform"
              >
                <div className="w-full h-full rounded-full bg-white active:bg-gray-200"></div>
              </button>
              <div className="w-14 h-14"></div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for capturing photo */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {imageCount > 0 && (
            <span className="absolute -top-1 -right-1 w-8 h-8 bg-indigo-600 text-white text-xs font-black rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              {imageCount}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Multi-Page Scanner</h1>
        
        {status === 'idle' && (
          <div className="space-y-4 mt-6">
            <p className="text-slate-500 font-bold text-sm mb-4">
              {imageCount === 0 
                ? "Scan the first page of your document." 
                : `Successfully scanned ${imageCount} page(s). Take more photos or finish.`}
            </p>
            
            <button onClick={startCamera} className="w-full bg-indigo-600 active:bg-indigo-700 text-white font-black py-5 px-6 rounded-2xl shadow-glow flex items-center justify-center gap-3 text-lg active:scale-95 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {imageCount === 0 ? "Scan First Page" : "Add Another Page"}
            </button>

            {imageCount > 0 && (
              <button onClick={finishSession} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-base transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Finish & Sync to PC
              </button>
            )}

            <div className="relative group">
              <input type="file" id="gallery-input" accept="image/*" onChange={handleGallerySelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              <div className="w-full bg-slate-50 text-slate-600 border-2 border-slate-100 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-sm active:scale-95 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Upload from Files
              </div>
            </div>
          </div>
        )}

        {status === 'uploading' && (
          <div className="py-12 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-6"></div>
            <p className="text-lg font-black text-slate-700">Syncing with PC...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">All Pages Sent!</h2>
            <p className="text-slate-500 font-bold">Your document is ready on your PC.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Sync Error</h2>
            <p className="text-red-500 mb-6 text-sm font-bold">{errorMsg}</p>
            <button onClick={() => { setErrorMsg(''); setStatus('idle'); }} className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl">Try Again</button>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-slate-400 text-sm font-medium">
        Securely connected to LegalEase
      </div>
    </div>
  );
};

export default MobileScannerPage;
