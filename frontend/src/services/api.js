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
 * Fetch webpage HTML, extract visible text server-side, and run the full analysis pipeline.
 */
export const analyzeUrl = async (url) => {
  const response = await fetch("/api/analyze-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let msg = err.detail;
    if (Array.isArray(msg)) {
      msg = msg.map((e) => e.msg || JSON.stringify(e)).join("; ");
    }
    throw new Error(msg || `Server error: ${response.status}`);
  }

  return response.json();
};

/**
 * Send a general legal question to the Mistral-powered chatbot.
 * This is NOT contract-specific — it answers general legal opinions.
 */
export const sendChatMessage = async ({ history = [], message }) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, message }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${response.status}`);
  }

  return response.json();
};