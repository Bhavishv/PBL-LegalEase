/**
 * Upload a contract file (PDF / DOCX / TXT / image) for analysis.
 * Returns the AnalysisResponse JSON from the FastAPI backend.
 */
export const uploadContract = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${response.status}`);
  }

  return response.json();
};

/**
 * Submit raw contract text for analysis (e.g. after camera OCR).
 * Returns the AnalysisResponse JSON from the FastAPI backend.
 */
export const analyzeText = async (text, filename = "contract.txt") => {
  const response = await fetch("/api/analyze-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, filename }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${response.status}`);
  }

  return response.json();
};

/**
 * Ask a question about the analyzed contract using the backend chat endpoint.
 * `history` should use UI roles: "user" | "assistant".
 */
export const chatWithContract = async ({
  contractText,
  contractFilename,
  history = [],
  message,
}) => {
  const normalizedHistory = history.map((entry) => ({
    role: entry.role === "assistant" ? "model" : "user",
    content: entry.content,
  }));

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contract_text: contractText,
      contract_filename: contractFilename,
      history: normalizedHistory,
      message,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${response.status}`);
  }

  return response.json();
};