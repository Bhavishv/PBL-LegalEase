import { useState, useCallback } from "react";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function UploadContract() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((selectedFile) => {
    setError(null);

    if (!selectedFile) return false;

    const validExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      setError("Please upload a PDF, DOC, DOCX, or image file.");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be under 10MB.");
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile) => {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        setFile(null);
      }
    },
    [validateFile]
  );

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a contract to analyze.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Later: connect backend API
      // const result = await uploadContract(file);
      console.log("Uploading file:", file.name);
      await new Promise((r) => setTimeout(r, 1000)); // Simulate upload
      // navigate("/analysis");
    } catch (err) {
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
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Upload Contract
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Upload a PDF, DOC, or image to analyze for risky clauses.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50"
        }`}
      >
        <input
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${file ? "pointer-events-none" : ""}`}
        />
        {file ? (
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700">
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
              <span className="font-medium truncate max-w-xs">{file.name}</span>
            </div>
            <p className="text-sm text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearFile();
              }}
              className="text-sm text-slate-600 hover:text-slate-900 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto w-12 h-12 text-slate-400"
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
            <p className="text-sm text-slate-600">
              Drag and drop your contract here, or{" "}
              <span className="text-blue-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-slate-400">PDF, DOC, DOCX, PNG, JPG</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="mt-6 w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isUploading ? "Analyzing..." : "Analyze Contract"}
      </button>
    </div>
  );
}

export default UploadContract;
