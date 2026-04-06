import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const MobileScannerPage = () => {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('idle'); // idle, camera, uploading, success, error
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
      // Trigger re-render first, then useEffect attaches stream after <video> is in DOM
      setStatus('camera');
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg('Camera access denied or not available. Please use "Select from Gallery" instead.');
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

    // Guard: video must have actual dimensions (stream must be active & loaded)
    if (!video.videoWidth || video.videoWidth === 0) {
      setErrorMsg('Camera is not ready yet. Please wait a moment and try again.');
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
  // Uses a relative path (/api/scan/upload) which routes through the Vite proxy.
  // When accessed via ngrok, the request goes: Phone → ngrok → Vite (port 5173) → Backend (port 5000)
  // This avoids all direct-IP and firewall issues.
  const uploadImage = async (fileOrBlob, filename) => {
    setStatus('uploading');

    const formData = new FormData();
    // IMPORTANT: sessionId must come BEFORE the image file.
    // Multer processes fields in stream order — if image comes first,
    // req.body.sessionId is still undefined when the filename function runs → 500 error.
    formData.append('sessionId', sessionId);
    formData.append('image', fileOrBlob, filename);

    try {
      const response = await fetch('/api/scan/upload', {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true', // Bypass ngrok's interstitial for API calls
        },
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
      } else {
        const data = await response.json();
        setErrorMsg(data.message || 'Upload failed');
        setStatus('error');
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setErrorMsg(`Upload failed: ${err.message || err.toString()}`);
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

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Document Scanner</h1>
        
        {status === 'idle' && (
          <div className="space-y-4 mt-6">
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Scan your document using your phone camera or select an existing photo.
            </p>
            
            {/* Primary: Open Camera */}
            <button 
              onClick={startCamera}
              className="w-full bg-indigo-600 active:bg-indigo-700 text-white font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-lg active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              Take Photo
            </button>

            {/* Secondary: Gallery */}
            <div className="relative group">
              <input 
                type="file" 
                id="gallery-input"
                accept="image/*" 
                onChange={handleGallerySelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className="w-full bg-white text-slate-700 border-2 border-slate-200 font-bold py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-3 text-base active:scale-95 transition-transform leading-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Select from Gallery
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Session: <span className="font-mono">{sessionId?.substring(0, 8)}...</span>
              </p>
            </div>
          </div>
        )}

        {status === 'uploading' && (
          <div className="py-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-6"></div>
            <p className="text-lg font-medium text-slate-700">Uploading to your PC...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Sent!</h2>
            <p className="text-slate-600 text-lg">
              You can now safely close this page and check your PC.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something Went Wrong</h2>
            <p className="text-red-500 mb-6 text-sm">{errorMsg}</p>
            <button 
              onClick={() => { setErrorMsg(''); setStatus('idle'); }}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl active:bg-slate-200"
            >
              Try Again
            </button>
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
