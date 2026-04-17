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
 * Translate text to a target language using the Google Cloud Translation API.
 * Returns { translated_text: string }
 */
export const translateText = async (text, targetLang) => {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_lang: targetLang }),
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
 * Compare two versions of a contract.
 * Returns { diff: [...] }
 */
export const compareVersions = async (text1, text2) => {
  const response = await fetch("/api/diff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text1, text2 }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${response.status}`);
  }

  return response.json();
};

/**
 * Collaboration: Fetch all comments for a contract.
 */
export const fetchComments = async (contractId) => {
  const response = await fetch(`/api/contracts/${contractId}/comments`);
  if (!response.ok) throw new Error("Failed to fetch comments");
  return response.json();
};

/**
 * Collaboration: Post a new comment.
 */
export const postComment = async (commentData) => {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(commentData),
  });
  if (!response.ok) throw new Error("Failed to post comment");
  return response.json();
};

/**
 * Fetch Gemini-powered crowd risk intelligence data.
 * Returns { clauses: [...], total_analyzed, contributors, last_updated }
 */
export const getCrowdIntel = async () => {
  const response = await fetch("/api/crowd-intel");
  if (!response.ok) throw new Error("Failed to fetch crowd intelligence");
  return response.json();
};

/**
 * Send a chat message about a contract to Gemini.
 */
export const sendChatMessage = async ({ contract_text, history, query }) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contract_text, history, query }),
  });
  if (!response.ok) throw new Error("Chat request failed");
  return response.json();
};