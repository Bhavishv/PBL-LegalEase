/**
 * LegalEase content script — keyword hint + floating “Analyze with LegalEase”.
 * Heavy work (HTTP, pipeline) stays in background.js.
 */
(function () {
  const KEYWORDS = ["terms", "privacy", "policy"];
  const FAB_ID = "legalease-awareness-fab";
  const MAX_LEN = 500000;

  function sanitize(raw) {
    if (!raw || typeof raw !== "string") return "";
    let t = raw.replace(/\u00a0/g, " ");
    t = t.replace(/[ \t\f\v\r]+/g, " ").replace(/\n{3,}/g, "\n\n");
    return t.trim().slice(0, MAX_LEN);
  }

  function extractMainContent() {
    try {
      // Step 1: Check if Readability is loaded
      if (typeof Readability !== 'undefined') {
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();
        
        if (article && article.content) {
          // Parse the clean HTML returned by Readability
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = article.content;
          
          // Clause splitting: Ensure block elements are separated by newlines
          const blockTags = ['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
          blockTags.forEach(tag => {
            const elements = tempDiv.getElementsByTagName(tag);
            for (let el of elements) {
              el.appendChild(document.createTextNode('\n\n'));
            }
          });
          
          // Step 3: Light text cleaning
          return sanitize(tempDiv.innerText || tempDiv.textContent || "");
        }
      }
      
      // Fallback to basic raw extraction
      return sanitize(document.body?.innerText || document.documentElement?.innerText || "");
    } catch (err) {
      console.warn("LegalEase: Readability extraction failed. Falling back to basic extraction.", err);
      return sanitize(document.body?.innerText || document.documentElement?.innerText || "");
    }
  }

  function pageLooksLikeLegalDoc() {
    const blob =
      (
        document.body?.innerText ||
        document.documentElement?.innerText ||
        ""
      ).toLowerCase();
    return KEYWORDS.some((k) => blob.includes(k));
  }

  function injectFab() {
    if (document.getElementById(FAB_ID)) return;
    if (!document.body) return;

    const btn = document.createElement("button");
    btn.id = FAB_ID;
    btn.type = "button";
    btn.textContent = "Analyze with LegalEase";
    btn.setAttribute("aria-label", "Analyze this page with LegalEase");

    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "2147483646",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      color: "#fff",
      background: "linear-gradient(135deg, #0d9488 0%, #4f46e5 100%)",
      boxShadow: "0 8px 24px rgba(15,23,42,0.35)",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.opacity = "0.95";
      btn.style.transform = "translateY(-1px)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.opacity = "1";
      btn.style.transform = "none";
    });

    btn.addEventListener("click", () => {
      // Step 2 & 5: Hybrid Extraction and Integration with existing flow
      const text = extractMainContent();
      
      if (!text || text.length < 80) {
        alert(
          "LegalEase: Not enough readable text on this page. Try the extension popup while this tab is active."
        );
        return;
      }
      btn.disabled = true;
      btn.style.opacity = "0.85";
      const filename = filenameHint();
      chrome.runtime.sendMessage(
        { type: "ANALYZE_TEXT", text, filename, pageUrl: location.href },
        (response) => {
          btn.disabled = false;
          btn.style.opacity = "1";
          if (chrome.runtime.lastError || !response?.ok) {
            const msg =
              response?.error ||
              chrome.runtime.lastError?.message ||
              "Analysis failed.";
            alert("LegalEase: " + msg);
          }
        }
      );
    });

    document.body.appendChild(btn);
  }

  function filenameHint() {
    try {
      const h = location.hostname.replace(/[^\w.-]+/g, "_") || "page";
      return `browser-${h}.txt`;
    } catch {
      return "browser-page.txt";
    }
  }

  function maybeMountHint() {
    try {
      if (!pageLooksLikeLegalDoc()) return;
      injectFab();
    } catch (_) {
      /* ignore */
    }
  }

  maybeMountHint();
  window.setTimeout(maybeMountHint, 2200);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "GET_PAGE_TEXT") return;
    
    // Step 2 & 5: Hybrid Extraction and Integration with existing flow
    const text = extractMainContent();
    
    sendResponse({
      ok: true,
      text: text,
      title: document.title || "",
      url: location.href,
    });
    return true;
  });
})();
