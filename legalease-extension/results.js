const mount = document.getElementById("mount");
const hdrTitle = document.getElementById("hdrTitle");

function riskClass(level) {
  const l = (level || "").toLowerCase().replace(/\s+/g, "-");
  if (l.includes("high")) return "risk-high";
  if (l.includes("warning") || l.includes("warn")) return "risk-warn";
  return "";
}

function labelColor(riskLabel) {
  const s = String(riskLabel || "").toLowerCase();
  if (s.includes("high") || s.includes("danger")) return { bg: "#ffe4e6", text: "#e11d48" };
  if (s.includes("careful") || s.includes("review") || s.includes("warning"))
    return { bg: "#fef3c7", text: "#d97706" };
  return { bg: "#d1fae5", text: "#059669" };
}

function scoreColor(score) {
  const s = Number(score) || 0;
  if (s < 40) return "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)";
  if (s < 70) return "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)";
  return "linear-gradient(135deg, #10b981 0%, #047857 100%)";
}

function scoreLabelInfo(score) {
  const s = Number(score) || 0;
  if (s >= 85) return { emoji: "✅", text: "Looks Good", desc: "This agreement appears fair and balanced." };
  if (s >= 60) return { emoji: "⚠️", text: "Review Carefully", desc: "Some clauses need your attention before accepting." };
  return { emoji: "🚫", text: "High Risk", desc: "Serious risks found. Do not accept without review." };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCard(data) {
  const score = data.overall_score ?? "—";
  const label = data.risk_label ?? "Unknown";
  const summary = data.contract_summary || "";
  
  if (data.filename) {
    const siteName = data.filename.replace("browser-", "").replace(".txt", "");
    hdrTitle.textContent = `Report for ${siteName}`;
  }

  const clauses = [...(data.clauses || [])]
    .filter((c) => c.risk_level && String(c.risk_level).replace("high-risk", "high") !== "safe")
    .sort((a, b) => {
      const ord = { "high-risk": 0, high: 0, warning: 1 };
      const ra = ord[a.risk_level] ?? 2;
      const rb = ord[b.risk_level] ?? 2;
      return ra - rb;
    })
    .slice(0, 8);

  const traps = data.trap_chains || [];
  const colors = labelColor(label);
  const info = scoreLabelInfo(score);

  let trapHtml = traps.length === 0
      ? `<p style="margin:0;font-size:0.95rem;color:#64748b;font-style:italic;">No trap chains flagged.</p>`
      : traps.slice(0, 6).map(
            (t) => `<div class="trap-box"><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.predicted_consequence || t.description || "")}</span></div>`
          ).join("");

  let clauseHtml = clauses.length === 0
      ? `<p style="margin:0;font-size:0.95rem;color:#64748b;font-style:italic;">No high-severity clauses found.</p>`
      : `<ul class="clauses">${clauses.map(
            (c) => `<li class="${riskClass(c.risk_level)}"><strong>${escapeHtml(String(c.risk_level || "").toUpperCase().replace("-", " "))}</strong> — ${escapeHtml((c.text || "").slice(0, 380))}${(c.text || "").length > 380 ? "…" : ""}</li>`
          ).join("")}</ul>`;

  mount.innerHTML = `
      <div style="display: flex; align-items: center; gap: 20px; background: ${colors.bg}; padding: 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid ${colors.text}40;">
        <div style="width: 90px; height: 90px; border-radius: 50%; background: ${scoreColor(score)}; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
          <span style="font-size: 2.2rem; font-weight: 800; line-height: 1;">${escapeHtml(score)}</span>
          <span style="font-size: 0.8rem; font-weight: 700; opacity: 0.9;">/ 100</span>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 1.5rem;">${info.emoji}</span>
            <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: ${colors.text};">${escapeHtml(info.text)}</h2>
          </div>
          <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: ${colors.text}; opacity: 0.9;">${escapeHtml(info.desc)}</p>
          <span style="display: inline-block; margin-top: 8px; padding: 4px 10px; background: white; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: ${colors.text}; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(label)}</span>
        </div>
      </div>

      ${summary ? `<section>
        <h2>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          AI Summary
        </h2>
        <div class="summary-box">${escapeHtml(summary)}</div>
      </section>` : ""}

      <section>
        <h2>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Trap Chains
        </h2>
        ${trapHtml}
      </section>

      <section>
        <h2>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Risky Clauses
        </h2>
        ${clauseHtml}
      </section>

      <div class="btn-row">
        <a class="btn btn-primary" href="http://localhost:5173" target="_blank">Open LegalEase Dashboard</a>
      </div>
    `;
}

chrome.storage.local.get(["legalease_last_analysis"]).then(({ legalease_last_analysis }) => {
  if (!legalease_last_analysis?.clauses) {
    mount.innerHTML =
      '<div class="empty">No analysis data found.<br>Open this extension’s popup on a webpage and click <strong>Scan This Page</strong>.</div>';
    hdrTitle.textContent = "No Data Found";
    return;
  }
  renderCard(legalease_last_analysis);
});
