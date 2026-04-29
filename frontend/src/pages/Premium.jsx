import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    features: ["5 scans / month", "Basic AI analysis", "Community insights", "Contract Vault"],
    cta: "Current Plan",
    current: true,
  },
  {
    name: "Professional",
    price: "$19",
    period: "/month",
    features: ["Unlimited scans", "Priority Gemini 2.5 Analysis", "Multi-language support", "One-click redlining", "Active Deadline Sync"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    features: ["Team collaboration", "Custom Playbooks", "API Access", "SSO & Security", "Dedicated Support"],
    cta: "Contact Sales",
  },
];

function Premium() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (plan) => {
    if (plan.current || plan.name === "Enterprise") return;
    setLoading(true);
    // Simulate payment gateway
    setTimeout(() => {
      setLoading(false);
      alert("Subscription successful! You are now a Pro member.");
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-fade-in pb-32">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Upgrade your Legal <span className="text-blue-600">Power</span></h1>
        <p className="text-slate-500 font-bold text-xl max-w-2xl mx-auto">
          Get unlimited scans, priority Gemini 2.5 Flash analysis, and advanced strategic insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {PLANS.map((plan, i) => (
          <div key={i} className={`glass p-10 rounded-[3rem] border-2 transition-all flex flex-col ${plan.highlight ? "border-blue-400 shadow-xl shadow-blue-100 scale-105 relative z-10" : "border-slate-100 hover:border-blue-200"}`}>
            {plan.highlight && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</span>
            )}
            <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
            <div className="flex items-end gap-1 mb-8">
              <span className="text-4xl font-black text-slate-900">{plan.price}</span>
              {plan.period && <span className="text-slate-400 font-bold mb-1">{plan.period}</span>}
            </div>
            
            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loading || plan.current}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${plan.highlight ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" : "bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50"} disabled:opacity-50`}
            >
              {loading && plan.name === "Professional" ? "Processing..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Section (Simplified Mockup) */}
      <div className="max-w-3xl mx-auto glass p-12 rounded-[3rem] border-slate-200">
         <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm">💳</span>
            Secure Payment Gateway
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Cardholder Name</label>
               <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Card Number</label>
               <input type="text" placeholder="**** **** **** ****" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Expiry Date</label>
               <input type="text" placeholder="MM/YY" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">CVV</label>
               <input type="text" placeholder="***" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
         </div>
         <p className="text-[11px] text-slate-400 font-medium mt-8 text-center italic">
            Payments are encrypted and processed via Stripe. By subscribing, you agree to the Terms of Service.
         </p>
      </div>
    </div>
  );
}

export default Premium;
