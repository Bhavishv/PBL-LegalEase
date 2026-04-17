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

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, [location]);

  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  
  const handleSignOut = () => {
    localStorage.removeItem("user");
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
              to={isLoggedIn ? "/dashboard" : "/"}
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
            to={isLoggedIn ? "/dashboard" : "/"}
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

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-haptic text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/10"
                >
                  Log Out
                </button>
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
