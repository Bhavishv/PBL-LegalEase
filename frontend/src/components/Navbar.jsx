import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Auth pages where we show minimal nav (sign in / sign up)
const AUTH_PAGES = ["/signin", "/signup"];

// Pages that belong to authenticated users
const APP_PAGES = ["/dashboard", "/analysis", "/version-compare", "/crowd-intel", "/vault", "/legal-ai", "/glossary"];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("userInfo");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setUser(parsedUser);
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, [location]);

  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  
  const handleSignOut = () => {
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("legalease_analysis");
    setIsLoggedIn(false);
    navigate("/signin");
  };

  // Minimal bar on sign-in / sign-up
  if (isAuthPage) {
    return (
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2 group"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white scale-90 group-hover:rotate-12 transition-transform">L</div>
              LegalEase
            </Link>
            <Link
              to={location.pathname === "/signin" ? "/signup" : "/signin"}
              className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl"
            >
              {location.pathname === "/signin" ? "Create Account" : "Sign In"}
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/60 transition-smooth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white scale-90 group-hover:rotate-12 transition-transform">L</div>
            LegalEase
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-1 sm:gap-2">

            {isLoggedIn ? (
              /* ── Authenticated App Nav ── */
              <div className="flex items-center gap-2">  
                <NavLink to="/dashboard"      label="Dashboard"    current={location.pathname} />
                <NavLink to="/vault"          label="Vault" current={location.pathname} />
                <NavLink to="/legal-ai"       label="Legal AI"     current={location.pathname} />
                <NavLink to="/glossary"       label="Glossary"     current={location.pathname} />
                <NavLink to="/crowd-intel"    label="Community"  current={location.pathname} />

                <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

                <div className="relative">
                  <div 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl pl-2 pr-4 py-1.5 hover:bg-slate-100 transition-all cursor-pointer group"
                  >
                     {user?.picture ? (
                       <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black uppercase">
                         {user?.name?.charAt(0) || "U"}
                       </div>
                     )}
                     <div className="hidden lg:block text-left">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Authenticated</p>
                        <p className="text-sm font-bold text-slate-800 leading-none truncate max-w-[100px]">{user?.name || "User"}</p>
                     </div>
                     <svg className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 animate-scale-in z-[60]">
                       <div className="flex items-center gap-3 p-2 mb-4 border-b border-slate-50 pb-4">
                          {user?.picture ? (
                            <img src={user.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-blue-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">{user?.name?.charAt(0)}</div>
                          )}
                          <div>
                             <p className="text-sm font-black text-slate-900 leading-tight">{user?.name}</p>
                             <p className="text-xs font-medium text-slate-500 truncate max-w-[140px]">{user?.email}</p>
                          </div>
                       </div>
                       
                       <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                          Sign Out
                       </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Public / Landing Nav ── */
              <div className="flex items-center gap-4">
                <NavLink to="/" label="Home" current={location.pathname} />

                <Link
                  to="/signin"
                  className="btn-haptic text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100/80 transition-all font-display"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-haptic inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/** Helper — single nav link with active underline */
function NavLink({ to, label, current }) {
  const isActive = current === to || (to !== "/" && current.startsWith(to));
  return (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "text-blue-700 bg-blue-50 font-semibold"
          : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export default Navbar;
