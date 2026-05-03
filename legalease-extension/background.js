/**
 * Service worker — calls LegalEase API (avoids page CSP blocking fetch).
 */

const SYNC_DEFAULTS = {
  apiBaseUrl: "http://localhost:8000",
};

function normalizeBase(url) {
  return (url || "").replace(/\/+$/, "");
}

async function getApiBase() {
  const s = await chrome.storage.sync.get(SYNC_DEFAULTS);
  return normalizeBase(s.apiBaseUrl);
}

async function analyzeTextAndOpen(filename, text) {
  const base = await getApiBase();
  if (!text || text.trim().length < 100) {
    throw new Error("Not enough plain text extracted (need at least 100 characters).");
  }

  const res = await fetch(`${base}/api/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      filename: filename || "extension-page.txt",
    }),
  });

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const err = await res.json();
      if (typeof err.detail === "string") detail = err.detail;
      else if (Array.isArray(err.detail))
        detail = err.detail.map((x) => x.msg || "").filter(Boolean).join("; ");
    } catch {
      detail = `${res.status} ${res.statusText}`;
    }
    throw new Error(detail);
  }

  const analysis = await res.json();
  await chrome.storage.local.set({
    legalease_last_analysis: analysis,
    legalease_last_analyzed_at: Date.now(),
  });
  await chrome.tabs.create({ url: chrome.runtime.getURL("results.html") });
  return analysis;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "ANALYZE_TEXT") {
    const fname =
      msg.filename ||
      (() => {
        try {
          return `browser-${new URL(msg.pageUrl || "http://local").hostname}.txt`;
        } catch {
          return "browser-page.txt";
        }
      })();

    analyzeTextAndOpen(fname, msg.text || "")
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }
});
