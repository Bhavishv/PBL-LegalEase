import { useState, useEffect } from "react";

const Preloader = () => {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 35); // Slightly slower for cinematic effect

    const timer = setTimeout(() => {
      setShow(false);
    }, 6000); // 6 seconds to allow video to play

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source 
          src="https://assets.mixkit.co/videos/preview/mixkit-abstract-digital-technology-background-render-34509-large.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Deep overlay to keep text legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
      
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-blue-600/5 animate-pulse"></div>
      
      {/* Animated Hexagons / Tech elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full"></div>

      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <div className="mb-14 relative">
          <div className="w-28 h-28 border-[3px] border-blue-500/50 rounded-[2rem] animate-spin-slow flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center animate-pulse shadow-inner">
               <span className="text-5xl font-black text-white italic drop-shadow-md">L</span>
            </div>
          </div>
          <div className="absolute -inset-6 border border-blue-400/20 rounded-[3.5rem] animate-ping opacity-30"></div>
        </div>

        <h1 className="text-5xl font-black text-white tracking-tight mb-3 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          Legal<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Ease</span> <span className="px-2.5 py-1 bg-blue-600/20 border border-blue-500/50 text-blue-400 text-xs uppercase tracking-[0.2em] rounded-lg align-middle shadow-[0_0_10px_rgba(59,130,246,0.2)]">v2.5</span>
        </h1>
        <p className="text-blue-200/60 font-black tracking-[0.4em] uppercase text-xs mb-10 drop-shadow-sm">AI Contract Intelligence</p>

        {/* Loading Bar */}
        <div className="w-80 h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative backdrop-blur-sm border border-slate-700/50">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-100 ease-out shadow-[0_0_20px_rgba(59,130,246,0.8)] relative"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[2px] animate-pulse"></div>
          </div>
        </div>
        <div className="mt-5 text-[10px] font-black text-blue-300/70 tabular-nums tracking-[0.2em] animate-pulse">
           SYNCHRONIZING_LEGALEASE_AI_KNOWLEDGE_{progress}%
        </div>
      </div>

      {/* Decorative Text */}
      <div className="absolute bottom-10 left-10 text-[9px] font-mono text-blue-400/40 space-y-2 font-bold tracking-wider">
         <div className="animate-fade-in" style={{animationDelay: '0.5s'}}>[SYSTEM] INITIALIZING_LEGALEASE_AI_PIPELINE...</div>
         <div className="animate-fade-in" style={{animationDelay: '1.5s'}}>[SYSTEM] LOADING_CUAD_MODEL_WEIGHTS...</div>
         <div className="animate-fade-in" style={{animationDelay: '2.5s'}}>[SYSTEM] ESTABLISHING_CROWD_INTEL_BRIDGE...</div>
         <div className="animate-fade-in" style={{animationDelay: '3.5s'}}>[SYSTEM] SECURITY_PROTOCOLS_ACTIVE</div>
      </div>
    </div>
  );
};

export default Preloader;
