const statusEl = document.getElementById("status");
const analyzeBtn = document.getElementById("analyzeBtn");

function setStatus(msg, variant) {
  if (!msg) {
    statusEl.className = "idle";
    return;
  }
  statusEl.textContent = msg;
  statusEl.className = variant || "idle";
}

async function injectExtractFallback(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: () => {
      const raw =
        document.body?.innerText || document.documentElement?.innerText || "";
      let t = raw.replace(/\u00a0/g, " ");
      t = t
        .replace(/[ \t\f\v\r]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 500000);
      return { text: t, title: document.title || "", url: location.href };
    },
  });
  return result || { text: "", title: "", url: "" };
}

async function getActiveTabExtract() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");
  const u = tab.url || "";
  if (
    !u.startsWith("http:") &&
    !u.startsWith("https:")
  ) {
    throw new Error("Open an http(s) webpage first.");
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      { type: "GET_PAGE_TEXT" },
      async (resp) => {
        if (chrome.runtime.lastError) {
          try {
            resolve(await injectExtractFallback(tab.id));
          } catch (e) {
            reject(e);
          }
          return;
        }
        resolve({
          text: resp?.text || "",
          title: resp?.title || tab.title || "",
          url: resp?.url || u,
        });
      }
    );
  });
}

function filenameFromExtract(ex) {
  try {
    const h = new URL(ex.url || "http://local").hostname.replace(/[^\w.-]+/g, "_") || "page";
    return `browser-${h}.txt`;
  } catch {
    return "browser-page.txt";
  }
}

async function runAnalyze() {
  analyzeBtn.disabled = true;
  setStatus("Scanning webpage...", "wait");
  try {
    const ex = await getActiveTabExtract();
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "ANALYZE_TEXT",
          text: ex.text,
          filename: filenameFromExtract(ex),
          pageUrl: ex.url,
        },
        (r) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!r?.ok) reject(new Error(r?.error || "Analysis failed"));
          else resolve();
        }
      );
    });
    setStatus("Done! Opening results...", "wait");
    window.close();
  } catch (e) {
    setStatus(e.message || String(e), "error");
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener("click", runAnalyze);
