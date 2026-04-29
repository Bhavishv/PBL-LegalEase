import React, { useState } from 'react';
import { Search, Book, Bookmark, Star, ArrowRight, ExternalLink, Filter, Plus, X } from 'lucide-react';

const INITIAL_TERMS = [
  { term: "Adhesion Contract", definition: "A standard-form contract, such as a mortgage, insurance policy, or lease, in which one side has significantly more power than the other.", category: "Contract Law", risk: "Medium" },
  { term: "Force Majeure", definition: "A clause that removes liability for natural and unavoidable catastrophes that interrupt the expected course of events and prevent participants from fulfilling obligations.", category: "General", risk: "Low" },
  { term: "Indemnification", definition: "A promise by one party to pay for any loss or damage the other party suffers, often used to shift risk between parties.", category: "Liability", risk: "High" },
  { term: "Arbitration", definition: "A method of resolving a dispute outside of court, where an independent 'arbitrator' makes a decision that is usually final and binding.", category: "Dispute Resolution", risk: "Medium" },
  { term: "Liquidated Damages", definition: "A specific amount of money that parties agree to pay if they breach a contract, settled upon during the contract's formation.", category: "Financial", risk: "Medium" },
  { term: "Intellectual Property", definition: "Refers to creations of the mind, such as inventions; literary and artistic works; designs; and symbols, names and images used in commerce.", category: "Property", risk: "Low" },
  { term: "Severability", definition: "A clause that allows for the rest of a contract to remain in effect even if one part is found to be unenforceable or illegal.", category: "General", risk: "Low" },
  { term: "Covenant", definition: "A formal agreement or promise in a contract to do or not do a specific thing.", category: "Obligations", risk: "Low" },
];

const Glossary = () => {
  const [terms, setTerms] = useState(INITIAL_TERMS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ term: "", definition: "", category: "General", risk: "Low" });

  const categories = ["All", ...new Set(terms.map(t => t.category))];

  const filteredTerms = terms.filter(t => 
    (selectedCategory === "All" || t.category === selectedCategory) &&
    (t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddTerm = (e) => {
    e.preventDefault();
    if (!newTerm.term || !newTerm.definition) return;
    
    setTerms([newTerm, ...terms]);
    setNewTerm({ term: "", definition: "", category: "General", risk: "Low" });
    setIsModalOpen(false);
    alert("Term added successfully! LegalEase AI has verified the entry.");
  };

  return (
    <div className="min-h-screen bg-grid p-6 md:p-10 pb-32">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Legal <span className="text-blue-600">Glossary</span>
            </h1>
            <p className="text-slate-500 max-w-xl text-lg font-medium">
              Understand the 'Legalese' within your contracts with our curated encyclopedia of legal terminology.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
            >
              <Plus className="w-4 h-4" /> Contribute
            </button>
            <div className="relative hidden md:block">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative animate-slide-up [animation-delay:0.1s]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
          <input 
            type="text"
            placeholder="Search for terms like 'Indemnification' or 'Arbitration'..."
            className="w-full h-16 pl-14 pr-6 bg-white border border-slate-200 rounded-3xl text-lg shadow-premium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up [animation-delay:0.2s]">
          {filteredTerms.length > 0 ? (
            filteredTerms.map((term, i) => (
              <div key={i} className="glass-card rounded-[2rem] p-8 flex flex-col group border-slate-100 h-full relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                    <Book className="w-6 h-6" />
                  </div>
                  <button className="text-slate-300 hover:text-amber-500 transition-colors">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-1">{term.category}</span>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">{term.term}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 italic">
                    "{term.definition}"
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      term.risk === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                      term.risk === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {term.risk} Risk Profile
                    </span>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors uppercase tracking-tight">
                      AI Verified <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No terms found</h3>
              <p className="text-slate-400">Try searching for a different keyword</p>
            </div>
          )}
        </div>

        {/* Footer Help */}
        <div className="mt-8 p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden animate-slide-up [animation-delay:0.3s]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="space-y-4 relative z-10 max-w-xl">
            <h2 className="text-3xl font-bold leading-tight">Can't find a term?</h2>
            <p className="text-slate-400 font-medium">
              Our dictionary is constantly growing. If you've encountered a term that isn't here, submit it now and our AI will verify and add it instantly!
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                Submit New Term <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative z-10 md:w-1/3">
            <div className="w-full aspect-square bg-slate-800 rounded-3xl border border-slate-700 p-8 flex items-center justify-center shadow-2xl">
              <div className="text-center space-y-2">
                <div className="text-5xl font-black text-blue-500">{terms.length}+</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Terms</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contribute Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative glass bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-scale-in">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all">
               <X className="w-6 h-6 text-slate-400" />
            </button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Submit New Term</h2>
            <p className="text-slate-500 font-medium mb-8">Contribute to the LegalEase AI collective knowledge base.</p>
            
            <form onSubmit={handleAddTerm} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Term Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pari Passu"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                    value={newTerm.term}
                    onChange={e => setNewTerm({...newTerm, term: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Plain English Definition</label>
                  <textarea 
                    rows={3}
                    placeholder="Simplify it for a non-lawyer..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all resize-none"
                    value={newTerm.definition}
                    onChange={e => setNewTerm({...newTerm, definition: e.target.value})}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                     <select 
                       className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                       value={newTerm.category}
                       onChange={e => setNewTerm({...newTerm, category: e.target.value})}
                     >
                        <option>General</option>
                        <option>Contract Law</option>
                        <option>Financial</option>
                        <option>Liability</option>
                        <option>Dispute Resolution</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Risk Profile</label>
                     <select 
                       className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                       value={newTerm.risk}
                       onChange={e => setNewTerm({...newTerm, risk: e.target.value})}
                     >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                     </select>
                  </div>
               </div>
               <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all">Verify & Add Term</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Glossary;
