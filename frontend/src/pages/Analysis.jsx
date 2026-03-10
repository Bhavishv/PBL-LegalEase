import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import ContractChatbot from "../components/ContractChatbot";

// Standard mock contract text broken into logical clauses for our NLP detection mock
const CONTRACT_CLAUSES = [
  {
    id: "c1",
    text: "1. Term and Termination: This Agreement shall commence on the Effective Date and shall automatically renew for successive one-year terms unless either party provides written notice of its intent not to renew to the other party at least ninety (90) days prior to the expiration of the then-current term.",
    risk: "high",
    title: "Automatic Renewal",
    explanation: "This contract will automatically renew every year. To stop it, you must cancel 90 days before the year ends.",
    translations: {
      hi: "यह अनुबंध हर साल स्वतः नवीनीकृत (ऑटो-रिन्यू) हो जाएगा। इसे रोकने के लिए, आपको साल खत्म होने से 90 दिन पहले रद्द करना होगा।",
      mr: "हा करार दरवर्षी आपोआप नूतनीकरण (auto-renew) होईल. तो थांबवण्यासाठी, तुम्हाला वर्ष संपण्याच्या ९० दिवस आधी तो रद्द करावा लागेल."
    }
  },
  {
    id: "c2",
    text: "2. Services: Provider agrees to deliver the SaaS platform services as described on Schedule A. Provider guarantees 99.9% uptime, excluding scheduled maintenance.",
    risk: "safe",
    title: "Service Delivery",
    explanation: "The company promises their software will work 99.9% of the time, except when they are doing planned updates.",
    translations: {
      hi: "कंपनी वादा करती है कि उनका सॉफ़्टवेयर 99.9% समय काम करेगा, सिवाय जब वे योजनाबद्ध अपडेट कर रहे हों।",
      mr: "कंपनी वचन देते की त्यांचे सॉफ्टवेअर 99.9% वेळ काम करेल, नियोजित अद्यतनांचा (updates) अपवाद वगळता."
    }
  },
  {
    id: "c3",
    text: "3. Fees and Payment: Customer shall pay all fees specified in Order Forms. If Customer terminates this Agreement early, Customer shall immediately pay all remaining fees that would have been due for the entirety of the intended term.",
    risk: "high",
    title: "Early Cancellation Penalty",
    explanation: "If you cancel the contract early, you still have to pay for the entire contract length.",
    translations: {
      hi: "यदि आप अनुबंध को समय से पहले रद्द करते हैं, तो भी आपको पूरे अनुबंध की अवधि के लिए भुगतान करना होगा।",
      mr: "जर तुम्ही करार वेळेपूर्वी रद्द केला, तरीही तुम्हाला संपूर्ण कराराच्या कालावधीसाठी पैसे द्यावे लागतील."
    }
  },
  {
    id: "c4",
    text: "4. Dispute Resolution: Any dispute, controversy or claim arising out of or relating to this contract shall be settled exclusively by binding arbitration in the state of Delaware. Class actions and jury trials are expressly waived.",
    risk: "warning",
    title: "Mandatory Arbitration",
    explanation: "You give up your right to sue the company in regular court or join a class-action lawsuit. You must use private arbitration in Delaware.",
    translations: {
      hi: "आप कंपनी पर नियमित अदालत में मुकदमा करने या एक सामूहिक मुकदमे (class-action) में शामिल होने का अधिकार छोड़ देते हैं। आपको डेलावेयर में निजी मध्यस्थता का उपयोग करना होगा।",
      mr: "तुम्ही कंपनीवर नियमित न्यायालयात दावा ठोकण्याचा किंवा सामूहिक दाव्यात (class-action) सामील होण्याचा अधिकार सोडून देता. तुम्हाला डेलावेअरमध्ये खाजगी लवादाचा वापर करावा लागेल."
    }
  },
  {
    id: "c5",
    text: "5. Data Privacy: Provider may collect, use, and share Customer data with third-party partners for marketing and analytics purposes without providing direct notification.",
    risk: "warning",
    title: "Data Sharing Waiver",
    explanation: "The company can share your personal data with other companies for marketing without telling you.",
    translations: {
      hi: "कंपनी मार्केटिंग के लिए आपका व्यक्तिगत डेटा आपको बताए बिना अन्य कंपनियों के साथ साझा कर सकती है।",
      mr: "कंपनी तुम्हाला न सांगता मार्केटिंगसाठी तुमचा वैयक्तिक डेटा इतर कंपन्यांसोबत शेअर करू शकते."
    }
  }
];

// Content for Negotiation AI mode
const NEGOTIATION_DATA = {
  c1: {
    standard: "This Agreement shall automatically renew for successive one-year terms unless either party provides written notice thirty (30) days prior.",
    suggestion: "Propose reducing the cancellation notice period from 90 days to 30 days to align with standard industry SaaS agreements.",
    aggressiveness: "Medium"
  },
  c3: {
    standard: "If Customer terminates early, Customer shall pay fees only for services rendered up to the date of termination.",
    suggestion: "Strongly push back. Propose a pro-rated refund for unused months rather than paying for the entire intended term.",
    aggressiveness: "High"
  },
  c4: {
    standard: "Disputes shall be resolved in a court of competent jurisdiction in [Customer's State].",
    suggestion: "Request changing the venue from Delaware to your home state, and request striking the class-action waiver.",
    aggressiveness: "High"
  }
};

// Trap chains logic combining multiple clauses
const TRAP_CHAINS = [
  {
    id: "tc1",
    name: "Locked-In Subscription Trap",
    description: "Highly restrictive renewal paired with massive penalty.",
    clauses: ["c1", "c3"],
    impact: "Severe Financial Lock-in",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    )
  }
];

const PLAYBOOK_RULES = [
  { id: "p1", rule: "Payment Terms must be Net-60", status: "fail", found: "Immediate upon signing", clauseId: "c3" },
  { id: "p2", rule: "Governing Law must be California", status: "fail", found: "Delaware", clauseId: "c4" },
  { id: "p3", rule: "Standard Uptime >= 99.5%", status: "pass", found: "99.9%", clauseId: "c2" },
];

const MISSING_CLAUSES = [
  { id: "m1", name: "Force Majeure", description: "Protects you if an unforeseeable event prevents contract fulfillment.", risk: "high" },
  { id: "m2", name: "Limitation of Liability", description: "Caps the maximum financial damages you could be sued for.", risk: "warning" }
];

const JARGON_DICT = {
  "arbitration": "A private process where a neutral person decides a dispute instead of a judge or jury.",
  "successive": "Following one after another without interruption.",
  "expressly waived": "An intentional and explicit surrender of a right.",
  "indemnification": "A promise to pay for the cost of potential damages or losses.",
  "injunction": "A court order requiring a person to do or cease doing a specific action."
};

function Analysis() {
  const [selectedClauseId, setSelectedClauseId] = useState("c1");
  const [activeTrapChain, setActiveTrapChain] = useState(null);
  const [language, setLanguage] = useState("en");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState("insights"); // New Tabs State
  
  const speechRef = useRef(null);
  
  // Clean up speech synthesis on unmount to prevent memory leaks/zombie audio
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const generateICS = (title, dateStr) => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART;VALUE=DATE:${dateStr}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTextWithJargon = (text) => {
    let result = text;
    Object.keys(JARGON_DICT).forEach(jargon => {
      const regex = new RegExp(`\\b(${jargon})\\b`, 'gi');
      result = result.replace(regex, `<span class="border-b-2 border-dashed border-indigo-400 text-indigo-900 cursor-help relative group transition-colors hover:bg-indigo-100/50" title="${JARGON_DICT[jargon]}">$1<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2.5 rounded-lg min-w-[200px] z-[60] normal-case shadow-xl text-center font-sans font-medium pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">${JARGON_DICT[jargon]}</span></span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const riskColors = {
    safe: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700", badge: "bg-emerald-500", highlight: "bg-emerald-200/40" },
    warning: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-500", highlight: "bg-amber-200/40" },
    high: { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-700", badge: "bg-rose-500", highlight: "bg-rose-200/40" }
  };

  const selectedClause = CONTRACT_CLAUSES.find((c) => c.id === selectedClauseId);

  const handleClauseClick = (id) => {
    setSelectedClauseId(id);
    setActiveTrapChain(null);
    stopSpeaking();
  };

  const handleTrapChainClick = (id) => {
    if (activeTrapChain === id) {
      setActiveTrapChain(null);
    } else {
      setActiveTrapChain(id);
      setSelectedClauseId(null);
    }
    stopSpeaking();
  };

  const getExplanationText = () => {
    if (!selectedClause) return "";
    if (language === "en") return selectedClause.explanation;
    return selectedClause.translations[language] || selectedClause.explanation;
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if ('speechSynthesis' in window) {
      const text = getExplanationText();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      if (language === 'hi') {
        const hindiVoice = voices.find(v => v.lang.includes('hi'));
        if (hindiVoice) utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (language === 'mr') {
        const marathiVoice = voices.find(v => v.lang.includes('mr'));
        if (marathiVoice) utterance.voice = marathiVoice;
        utterance.lang = 'mr-IN';
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onend = () => setIsSpeaking(false);
      speechRef.current = utterance;
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const isClauseHighlightedInTrap = (id) => {
    if (!activeTrapChain) return false;
    const trap = TRAP_CHAINS.find(tc => tc.id === activeTrapChain);
    return trap?.clauses.includes(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-sans animate-fade-in relative z-10 pb-20">
      <ContractChatbot />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors btn-haptic">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contract Analysis</h1>
          </div>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            SaaS_Subscription_Agreement.pdf
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex gap-4">
          <button className="btn-haptic glass px-4 py-2 rounded-xl flex items-center gap-2 text-white bg-blue-600 font-bold hover:bg-blue-700 hover:shadow-md transition-all border border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <svg className="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Sign Document
          </button>
          <Link to="/version-compare" className="btn-haptic glass px-4 py-2 rounded-xl flex items-center gap-2 text-slate-700 font-bold hover:bg-white hover:shadow-md transition-all border border-slate-200">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            Compare Versions
          </Link>
          <div className="glass px-6 py-2 rounded-xl flex items-center gap-4 shadow-sm border border-rose-100">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Risk Score</p>
              <p className="text-sm font-bold text-rose-600 mt-1">High Risk</p>
            </div>
            <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-rose-50 border-[3px] border-rose-500 text-rose-600 font-bold text-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse-soft">
              78
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">
        
        {/* Left Pane: Document Viewer */}
        <div className="lg:col-span-6 xl:col-span-7 glass rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[78vh]">
          <div className="p-4 border-b border-slate-200/60 bg-white/50 rounded-t-2xl flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Document Viewer
            </h2>
            <div className="flex flex-wrap gap-2 justify-end">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Safe</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Warning</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-100"><span className="w-2 h-2 rounded-full bg-rose-500"></span>High</span>
            </div>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto flex-1 font-serif text-slate-800 leading-loose text-base md:text-lg selection:bg-blue-200 scroll-smooth">
            <h3 className="font-bold text-2xl md:text-3xl mb-8 mt-2 text-center uppercase tracking-wide text-slate-900 filter drop-shadow-sm">Software as a Service Agreement</h3>
            
            <div className="space-y-6 lg:space-y-8">
              {CONTRACT_CLAUSES.map(clause => {
                const isActive = selectedClauseId === clause.id;
                const isTrapped = isClauseHighlightedInTrap(clause.id);
                const colors = riskColors[clause.risk];
                
                return (
                  <div key={clause.id} className="relative mb-6">
                    <div 
                      onClick={() => handleClauseClick(clause.id)}
                      className={`relative p-2 -mx-2 rounded-lg cursor-pointer transition-all duration-300
                        ${isActive ? 'bg-blue-50/80 shadow-[inset_4px_0_0_0_#3b82f6]' : ''}
                        ${isTrapped ? 'bg-purple-50/80 shadow-[inset_4px_0_0_0_#a855f7] animate-pulse-soft' : ''}
                        hover:bg-slate-50
                      `}
                    >
                      <span 
                        className={`
                          transition-colors duration-200
                          ${colors.highlight} rounded border-b-2 ${colors.border}
                          ${(isActive || isTrapped) ? 'font-medium' : ''}
                        `}
                      >
                        {renderTextWithJargon(clause.text)}
                      </span>
                    </div>
                    {/* Inline Comments Mock */}
                    {isActive && (
                      <div className="mt-3 ml-4 border-l-2 border-blue-200 pl-4 animate-slide-in-up">
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm mb-2 relative">
                           <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-white border-2 border-blue-400 shadow-[0_0_0_2px_#3b82f6]"></div>
                           <p className="text-xs font-bold text-slate-800 flex justify-between items-center">
                             <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px]">S</span> Sarah (Legal)</span> 
                             <span className="text-slate-400 font-medium">10 mins ago</span>
                           </p>
                           <p className="text-sm text-slate-600 mt-1.5 font-sans leading-relaxed">We need to push back on this 90-day notice. 30 days is standard for us.</p>
                        </div>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Type @ to tag team..." className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 flex-1 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-sm font-sans" />
                          <button className="bg-blue-600 text-white rounded-lg px-4 py-1.5 text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors btn-haptic">Reply</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="text-slate-500 text-sm mt-12 text-center italic">... End of Document ...</div>
            </div>
          </div>
        </div>

        {/* Right Pane: Intelligence Tabs */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4 overflow-hidden h-[78vh]">
          
          {/* Tabs Navigation */}
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner border border-slate-200 backdrop-blur-sm z-20">
            {['insights', 'negotiate', 'trackers', 'financials', 'trust'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-sm font-bold py-2.5 px-2 rounded-xl text-center capitalize transition-all duration-300 btn-haptic ${
                  activeTab === tab
                    ? 'bg-white text-blue-700 shadow-md transform scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* --- TAB 1: INSIGHTS (Existing Functionality + Summaries) ---  */}
            {activeTab === 'insights' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* File Context & Summary */}
                <div className="glass rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Smart Contract Summary
                    </h3>
                    <button className="btn-haptic text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      MP3 Export
                    </button>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span> 1-year auto-renewing term requiring 90-day cancellation notice.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span> Resolves disputes via mandatory Delaware arbitration only.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> Guarantees standard 99.9% platform uptime.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span> Allows unnotified third-party data sharing.
                    </li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Industry Context</span>
                    <select className="bg-slate-100 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-200 hover:border-blue-300">
                      <option value="saas">SaaS / Software</option>
                      <option value="freelance">Freelance / Agency</option>
                      <option value="realestate">Real Estate</option>
                    </select>
                  </div>
                </div>

                {/* Privacy Alert */}
                <div className="bg-red-50/80 border border-red-200 p-4 rounded-2xl flex gap-4 animate-slide-in-up" style={{animationDelay: '0.1s'}}>
                   <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                     <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   </div>
                   <div>
                     <h4 className="font-bold text-red-800">Critical Privacy Warning</h4>
                     <p className="text-sm font-medium text-red-700 mt-1">This document contains severe data sharing clauses allowing undetected distribution of user data to third parties.</p>
                   </div>
                </div>

                {/* Playbook Enforcement */}
                <div className="glass rounded-2xl p-5 border border-slate-200 shadow-sm animate-slide-in-up" style={{animationDelay: '0.12s'}}>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Company Playbook
                  </h3>
                  <div className="space-y-2">
                    {PLAYBOOK_RULES.map(rule => (
                      <div key={rule.id} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-100 text-sm shadow-sm group hover:border-indigo-200 transition-colors">
                        <span className="font-medium text-slate-700">{rule.rule}</span>
                        {rule.status === 'pass' ? (
                          <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Pass</span>
                        ) : (
                          <span className="text-rose-700 font-bold text-xs bg-rose-50 px-2 py-1 rounded-md border border-rose-100 cursor-help" title={`Found: ${rule.found}`}>Fail</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Protective Clauses */}
                <div className="glass rounded-2xl p-5 border border-slate-200 shadow-sm animate-slide-in-up" style={{animationDelay: '0.15s'}}>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Missing Protective Clauses
                  </h3>
                  <div className="space-y-3">
                    {MISSING_CLAUSES.map(mc => (
                      <div key={mc.id} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${mc.risk === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'} animate-pulse-soft`}></div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{mc.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">{mc.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regional Compliance */}
                <div className="glass rounded-2xl p-4 border border-blue-200 shadow-sm animate-slide-in-up flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent" style={{animationDelay: '0.18s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Regional Compliance</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Checking GDPR & CCPA</p>
                    </div>
                  </div>
                  <div>
                    <span className="bg-rose-100 text-rose-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-md border border-rose-200 flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      Fails GDPR
                    </span>
                  </div>
                </div>

                {/* Trap Chain Detector */}
                <div className="glass rounded-2xl border border-purple-200/50 shadow-sm overflow-hidden animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 px-4">
                    <h2 className="font-bold text-white flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Clause Trap Chains Detected
                    </h2>
                  </div>
                  <div className="p-3 bg-white/40">
                    {TRAP_CHAINS.map(chain => (
                      <button 
                        key={chain.id}
                        onClick={() => handleTrapChainClick(chain.id)}
                        className={`w-full text-left p-3 rounded-xl transition-haptic flex items-start gap-3 
                          ${activeTrapChain === chain.id 
                              ? 'border-2 border-purple-500 bg-purple-50 shadow-glow' 
                              : 'border-2 border-slate-200 bg-white hover:border-purple-300'}`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg ${activeTrapChain === chain.id ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                          {chain.icon}
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm leading-tight ${activeTrapChain === chain.id ? 'text-purple-900' : 'text-slate-800'}`}>{chain.name}</h3>
                          <div className="mt-2 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 inline-flex items-center gap-1 px-2 py-0.5 rounded">
                            Risk: {chain.impact}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clause Detail View */}
                <div className="glass rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-slide-in-up" style={{animationDelay: '0.3s'}}>
                  {selectedClause ? (
                    <>
                      <div className="p-4 border-b border-slate-200/60 bg-white/50 flex flex-col xl:flex-row justify-between xl:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${riskColors[selectedClause.risk].badge} animate-pulse`}></span>
                          <h2 className="font-bold text-slate-800 break-words line-clamp-2 text-sm" title={selectedClause.title}>{selectedClause.title}</h2>
                        </div>
                        <select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="bg-white border text-xs font-bold border-slate-200 text-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors btn-haptic cursor-pointer shadow-sm w-full xl:w-auto"
                        >
                          <option value="en">🇬🇧 English</option>
                          <option value="hi">🇮🇳 Hindi</option>
                          <option value="mr">🇮🇳 Marathi</option>
                        </select>
                      </div>

                      <div className="p-5 flex-1 bg-gradient-to-b from-slate-50/50 to-transparent">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Plain English</h3>
                        
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative group mb-4">
                          <div className="absolute top-0 right-0 -mt-2 -mr-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleSpeech(); }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-haptic hover:scale-110 active:scale-95 focus:outline-none
                                ${isSpeaking ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'}
                              `}
                            >
                              {isSpeaking ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                              ) : (
                                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                              )}
                            </button>
                          </div>
                          <p className={`text-base font-medium leading-relaxed
                            ${language !== 'en' ? 'font-sans tracking-wide' : ''}
                            ${selectedClause.risk === 'high' ? 'text-rose-900' : selectedClause.risk === 'warning' ? 'text-amber-900' : 'text-slate-800'}
                          `}>
                            {getExplanationText()}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center opacity-70">
                      <svg className="w-8 h-8 text-slate-300 mb-2 animate-bounce-custom" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                      <p className="text-sm font-bold text-slate-400">Select a clause to translate</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB 2: MOCK TABS (Placeholder for Next Steps) --- */}
            {activeTab === 'negotiate' && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass rounded-2xl p-5 border border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
                  <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    AI Negotiation Assistant
                  </h3>
                  <p className="text-sm text-indigo-700 font-medium mb-4">Select a highlighted risky clause in the document viewer to see AI-generated pushback strategies and standard market comparisons.</p>
                  
                  {selectedClause && NEGOTIATION_DATA[selectedClause.id] ? (
                    <div className="space-y-4 animate-slide-in-up">
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Strategy Suggestion</span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">Pushback: {NEGOTIATION_DATA[selectedClause.id].aggressiveness}</span>
                        </div>
                        <p className="text-slate-800 font-medium text-sm">{NEGOTIATION_DATA[selectedClause.id].suggestion}</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Market Standard Clause</span>
                        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-slate-600 font-serif text-sm italic">
                          "{NEGOTIATION_DATA[selectedClause.id].standard}"
                        </div>
                      </div>
                      <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors btn-haptic text-sm">
                        Copy Suggestion to Clipboard
                      </button>
                      <button className="w-full py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm transition-colors btn-haptic text-sm flex items-center justify-center gap-2 mt-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Redlined DOCX
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/50 p-6 rounded-xl border border-indigo-100 border-dashed text-center">
                       <p className="text-sm text-indigo-400 font-medium">Select a high-risk clause (like red highlights) to generate a strategy.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB 3: TRACKERS --- */}
            {activeTab === 'trackers' && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass rounded-2xl p-5 border border-amber-200 shadow-sm">
                  <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Obligation & Deadline Tracker
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex justify-between items-center group hover:border-amber-300 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Renewal Cancellation Notice</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Clause 1 • Must notify 90 days prior</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-600 font-bold text-sm">Oct 1, 2026</p>
                        <button onClick={() => generateICS("Renewal Cancellation Notice", "20261001")} className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 tracking-wider mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 w-full ml-auto">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-300 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Payment Due for Term</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Clause 3 • Immediate upon signing</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-600 font-bold text-sm">Upon Execution</p>
                        <button onClick={() => generateICS("First Payment Due", "20260310")} className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 tracking-wider mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 w-full ml-auto">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: FINANCIALS --- */}
            {activeTab === 'financials' && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass rounded-2xl p-5 border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/20">
                  <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Financial Impact Visualizer
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 font-medium">Estimated 36-month cost exposure including base fees and early cancellation penalties.</p>
                  
                  {/* Mock Bar Chart */}
                  <div className="h-48 flex items-end justify-between gap-4 px-2 border-b-2 border-l-2 border-slate-200 pt-6 pb-0 relative ml-8">
                    {/* Y-axis labels */}
                    <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 font-bold py-1">
                      <span>$150k</span>
                      <span>$100k</span>
                      <span>$50k</span>
                      <span>$0</span>
                    </div>

                    {[ 
                      { year: 'Yr 1', base: 40, penalty: 80 },
                      { year: 'Yr 2', base: 60, penalty: 40 },
                      { year: 'Yr 3', base: 80, penalty: 0 }
                    ].map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full pt-4">
                        <div className="w-full max-w-[48px] bg-rose-400/80 rounded-t-sm transition-all duration-300 group-hover:bg-rose-500 relative shadow-inner isolate border-b border-white/20" style={{ height: `${data.penalty}%` }}>
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1.5 py-0.5 rounded shadow-sm border border-rose-100 z-10">Penalty</span>
                        </div>
                        <div className="w-full max-w-[48px] bg-emerald-400/80 rounded-b-sm transition-all duration-300 group-hover:bg-emerald-500 relative shadow-inner isolate border-t border-emerald-500/20" style={{ height: `${data.base}%` }}>
                          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">Base</span>
                        </div>
                        <span className="absolute -bottom-6 text-xs font-bold text-slate-600">{data.year}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 flex justify-center gap-6 text-xs font-bold">
                    <div className="flex items-center gap-2 text-emerald-700"><span className="w-3 h-3 bg-emerald-400 rounded-sm shadow-sm"></span> Base Fees</div>
                    <div className="flex items-center gap-2 text-rose-700"><span className="w-3 h-3 bg-rose-400 rounded-sm shadow-sm"></span> Max Cancellation Penalty</div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 4: TRUST --- */}
            {activeTab === 'trust' && (
              <div className="space-y-6 animate-fade-in">
                <div className="glass rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Company Trust Score
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1">Based on historical contract fairness.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full border-4 border-amber-400 flex items-center justify-center font-bold text-amber-600 text-lg shadow-sm">
                        42
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1 block">Out of 100</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3 mt-8">Industry Benchmarking</h4>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700">Cancellation Notice Period</span>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shadow-sm">90 Days (This Contract)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 relative mt-6 border border-slate-200 shadow-inner">
                        <div className="bg-blue-200 h-full absolute left-0 rounded-l-full" style={{ width: '30%' }}></div>
                        <div className="bg-blue-400 h-full absolute left-[30%]" style={{ width: '30%' }}></div>
                        <div className="bg-blue-600/30 h-full absolute left-[60%] rounded-r-full" style={{ width: '40%' }}></div>
                        
                        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-5 bg-rose-500 rounded-full shadow-md border border-white" style={{ left: '90%' }}></div>
                        
                        <div className="absolute -top-6 left-[30%] -translate-x-1/2 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-1 shadow-sm rounded border border-slate-200">30d (Avg)</span>
                          <div className="w-px h-2 bg-slate-300 mt-0.5"></div>
                        </div>
                        <div className="absolute -top-6 left-[60%] -translate-x-1/2 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400">60d</span>
                          <div className="w-px h-2 bg-slate-300 mt-0.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3 mt-8">Crowd Risk Intelligence</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex gap-4 items-center">
                      <div className="flex -space-x-2">
                        <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://ui-avatars.com/api/?name=J+D&background=random" alt="User" />
                        <img className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" src="https://ui-avatars.com/api/?name=A+S&background=random" alt="User" />
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">+8k</div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">87% of users reject Clause 4</p>
                        <p className="text-xs text-slate-500">The mandatory Delaware arbitration is highly contested.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis;