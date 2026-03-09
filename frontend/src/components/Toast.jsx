import { useEffect, useState } from "react";

function Toast({ message, type = "info", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  };

  const iconColor = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
    warning: "text-yellow-600",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.071 2.828a2 2 0 114 0l-4-4zm10 0a2 2 0 110-4l4 4z" />
      </svg>
    ),
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md p-4 border rounded-lg shadow-lg animate-slide-in-up ${bgColor[type]}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 ${iconColor[type]}`}>{icons[type]}</div>
        <p className={`text-sm font-medium ${textColor[type]}`}>{message}</p>
      </div>
    </div>
  );
}

export default Toast;
