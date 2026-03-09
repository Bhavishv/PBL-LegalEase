import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === "/dashboard";

  const handleSignOut = () => {
    // Later: clear auth state
    navigate("/signin");
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 shadow-sm transition-smooth">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 transition-colors duration-200"
          >
            LegalEase
          </Link>

          <div className="flex items-center gap-5">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === "/"
                  ? "text-blue-700 font-semibold"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            {isDashboard ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-blue-700 font-semibold inline-flex items-center gap-2 btn-haptic"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  Dashboard
                </Link>
                <Link
                  to="/crowd-intel"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 btn-haptic flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Crowd Intel
                </Link>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-haptic text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="btn-haptic text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100/80 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-haptic inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-glow hover:shadow-glow-hover transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
