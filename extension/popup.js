document.addEventListener('DOMContentLoaded', async () => {
  const selectionView = document.getElementById('selection-view');
  const loadingView = document.getElementById('loading');
  const resultsView = document.getElementById('results');
  const selectedTextEl = document.getElementById('selected-text');
  const summaryEl = document.getElementById('summary');
  const scoreContainer = document.getElementById('score-container');
  const recommendationEl = document.getElementById('recommendation');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resetBtn = document.getElementById('reset-btn');

  const API_BASE_URL = "http://localhost:8000"; // FastAPI backend

  // Load last selected text
  chrome.storage.local.get(['lastSelectedText'], (result) => {
    if (result.lastSelectedText) {
      selectedTextEl.textContent = result.lastSelectedText;
    } else {
      selectedTextEl.textContent = "No text selected. Please select some contract text on the page or paste it here.";
      document.getElementById('manual-paste').style.display = 'block';
      selectedTextEl.style.display = 'none';
    }
  });

  analyzeBtn.addEventListener('click', async () => {
    let textToAnalyze = "";
    const manualPaste = document.getElementById('manual-paste');
    
    if (manualPaste.style.display !== 'none' && manualPaste.value) {
      textToAnalyze = manualPaste.value;
    } else {
      textToAnalyze = selectedTextEl.textContent;
    }

    if (!textToAnalyze || textToAnalyze.length < 10) {
      alert("Please provide at least a sentence of contract text.");
      return;
    }

    // Show loading
    selectionView.style.display = 'none';
    loadingView.style.display = 'block';

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textToAnalyze,
          filename: "Browser_Selection.txt"
        })
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      displayResults(data);
    } catch (error) {
      console.error(error);
      alert("Could not connect to LegalEase AI server. Please make sure the backend is running at http://localhost:8000");
      selectionView.style.display = 'block';
      loadingView.style.display = 'none';
    }
  });

  resetBtn.addEventListener('click', () => {
    resultsView.style.display = 'none';
    selectionView.style.display = 'block';
    chrome.storage.local.remove('lastSelectedText');
    selectedTextEl.textContent = "Select text on a page and right-click to analyze, or paste it here...";
  });

  // Formatting function for **bold** text
  function formatText(text) {
    if (!text) return "";
    // Replace **bold** with <b>bold</b>
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  }

  function displayResults(data) {
    loadingView.style.display = 'none';
    resultsView.style.display = 'block';

    const score = data.overall_score || 0;
    const firstClause = data.clauses?.[0] || {};
    
    // Set Summary with formatting
    summaryEl.innerHTML = formatText(firstClause.explanation || "No summary available.");
    
    // Set Recommendation with formatting
    recommendationEl.innerHTML = formatText(firstClause.negotiation_advice || "Standard clause. Proceed with normal care.");

    // Set Score Badge
    let badgeClass = 'score-low';
    let label = 'High Risk';
    if (score >= 80) {
      badgeClass = 'score-high';
      label = 'Safe to Sign';
    } else if (score >= 60) {
      badgeClass = 'score-med';
      label = 'Proceed with Caution';
    }

    scoreContainer.innerHTML = `
      <div class="score-badge ${badgeClass}">
        ${score}% Trust Score • ${label}
      </div>
    `;
  }

  // ── Voice AI Assistant Logic ──
  const micBtn = document.getElementById('mic-btn');
  const voiceStatus = document.getElementById('voice-status');
  const chatResponse = document.getElementById('chat-response');

  let recognition;
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      micBtn.classList.add('active');
      voiceStatus.textContent = "Listening...";
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      voiceStatus.textContent = `You asked: "${transcript}"`;
      micBtn.classList.remove('active');
      
      await askLegalAI(transcript);
    };

    recognition.onerror = (event) => {
      micBtn.classList.remove('active');
      voiceStatus.textContent = "Error occurred. Try again.";
      console.error("Speech Error:", event.error);
    };

    recognition.onend = () => {
      micBtn.classList.remove('active');
    };
  }

  micBtn.addEventListener('click', () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    recognition.start();
  });

  async function askLegalAI(query) {
    voiceStatus.textContent = "AI is thinking...";
    chatResponse.style.display = 'none';

    try {
      // Use the chat endpoint. For general terms, we pass empty context.
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: "general_query",
          contract_text: "General legal knowledge query.",
          query: query
        })
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      const reply = data.reply;

      // Display response
      chatResponse.innerHTML = formatText(reply);
      chatResponse.style.display = 'block';
      voiceStatus.textContent = "AI Responded:";

      // Speak response
      speak(reply);
    } catch (error) {
      console.error(error);
      voiceStatus.textContent = "Failed to get AI response.";
    }
  }

  function speak(text) {
    // Remove formatting for speech
    const cleanText = text.replace(/\*\*/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
});
