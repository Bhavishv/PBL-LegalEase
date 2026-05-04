/**
 * Helper to get the JWT token from local storage
 */
const getAuthHeaders = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  return userInfo.token ? { "Authorization": `Bearer ${userInfo.token}` } : {};
};

/**
 * Upload a contract file (PDF / DOCX / TXT / image) for analysis.
 * Returns the AnalysisResponse JSON from the FastAPI backend.
 */
export const uploadContract = async (files) => {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach(file => formData.append("files", file));
  } else {
    formData.append("files", files);
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { ...getAuthHeaders() }, // Forward auth if needed by AI
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${response.status}`);
  }

  return response.json();
};

/**
 * Save an analysis result to the MongoDB database (Node.js backend)
 */
export const saveAnalysis = async (analysisData) => {
  const response = await fetch("/api/analysis/save", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(analysisData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to save analysis to cloud.");
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
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
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
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
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
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
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
  const response = await fetch(`/api/contracts/${contractId}/comments`, {
    headers: { ...getAuthHeaders() }
  });
  if (!response.ok) throw new Error("Failed to fetch comments");
  return response.json();
};

/**
 * Collaboration: Post a new comment.
 */
export const postComment = async (commentData) => {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
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
  const response = await fetch("/api/analysis/crowd-intel", {
    headers: { ...getAuthHeaders() }
  });
  if (!response.ok) throw new Error("Failed to fetch crowd intelligence");
  return response.json();
};

/**
 * Send a chat message about a contract to Gemini.
 */
export const sendChatMessage = async ({ contract_text, history, query }) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ contract_text, history, query }),
  });
  if (!response.ok) throw new Error("Chat request failed");
  return response.json();
};

export const addToPlaybook = async (clauseData) => {
  const response = await fetch("/api/analysis/playbook/add", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(clauseData),
  });
  if (!response.ok) throw new Error("Failed to add to playbook");
  return response.json();
};

export const flagClause = async (flagData) => {
  const response = await fetch("/api/analysis/flag/add", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(flagData),
  });
  if (!response.ok) throw new Error("Failed to flag clause");
  return response.json();
};