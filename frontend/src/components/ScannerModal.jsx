import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

const ScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('generating');
  const [qrUrl, setQrUrl] = useState('');

  // 1. Generate session ID on mount
  useEffect(() => {
    if (isOpen) {
      const initSession = async () => {
        try {
          // Adjust API URL if backend runs on different port/host
          const host = window.location.hostname;
          const apiUrl = `http://${host}:5000/api/scan/session`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await response.json();
          setSessionId(data.sessionId);
          
          // Generate the URL that the mobile phone will navigate to.
          // Note: for a phone to access it locally, you should ideally use the local IP instead of localhost.
          // We use the current window's hostname, assuming the dev server is exposed (e.g. run with --host)
          const port = window.location.port ? `:${window.location.port}` : '';
          const url = `${window.location.protocol}//${host}${port}/mobile-scan/${data.sessionId}`;
          setQrUrl(url);
          setStatus('pending');
        } catch (error) {
          console.error("Error creating scan session:", error);
          setStatus('error');
        }
      };
      
      initSession();
    }
  }, [isOpen]);

  // 2. Poll for status while modal is open and status is pending
  useEffect(() => {
    let interval;
    if (isOpen && sessionId && status === 'pending') {
      interval = setInterval(async () => {
        try {
          const host = window.location.hostname;
          const res = await fetch(`http://${host}:5000/api/scan/status/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed' && data.imageUrl) {
              setStatus('completed');
              // pass the full URL to the parent component
              onScanComplete(`http://${host}:5000${data.imageUrl}`);
              onClose(); // Optional: close modal immediately or after delay
            }
          }
        } catch (error) {
          console.error("Error polling scan status:", error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, sessionId, status, onClose, onScanComplete]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Scan via Mobile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center">
          {status === 'generating' && (
            <p className="text-gray-600 my-8">Generating secure session...</p>
          )}

          {status === 'error' && (
            <p className="text-red-500 my-8 text-center">Failed to create scan session. Ensure the backend is running.</p>
          )}

          {status === 'pending' && (
            <>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Scan this QR code with your phone's camera.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-xl shadow-inner mb-6">
                 {qrUrl && <QRCode value={qrUrl} size={200} />}
              </div>
              
              <div className="flex items-center space-x-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Waiting for upload...</span>
              </div>
            </>
          )}

          {status === 'completed' && (
            <div className="text-green-600 flex flex-col items-center my-8">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-lg font-semibold">Scan Received!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
