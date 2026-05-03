import { Link, useLocation, useNavigate } from "react-router-dom";

// Auth pages where we show minimal nav (sign in / sign up)
const AUTH_PAGES = ["/signin", "/signup"];

// Pages that belong to authenticated users (used for toolbar + branding)
const APP_PAGES = [
  "/dashboard",
  "/download",
  "/dashboard/extension",
  "/analyze-website",
  "/analysis",
  "/version-compare",
  "/vault",
];

/** Short URL for browser-extension ZIP page (legacy: `/dashboard/extension` also works) */
const LEGALEASE_DOWNLOAD_PATH = "/download";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const isAppPage = APP_PAGES.some((p) => location.pathname.startsWith(p));

  const handleSignOut = () => {
    localStorage.removeItem("legalease_token");
    sessionStorage.removeItem("legalease_analysis");
    navigate("/signin");
  };

  // Minimal bar on sign-in / sign-up
  if (isAuthPage) {
    return (
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600"
            >
              LegalEase
            </Link>
            <Link
              to={location.pathname === "/signin" ? "/signup" : "/signin"}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              {location.pathname === "/signin" ? "Create account →" : "Sign in →"}
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 shadow-sm transition-smooth">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to={isAppPage ? "/dashboard" : "/"}
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 transition-colors duration-200"
          >
            LegalEase
          </Link>

          {/* Navigation links */}
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 max-w-[calc(100%-8rem)] sm:max-w-none">

            {isAppPage ? (
              /* ── Authenticated App Nav ── */
              <>  
                <NavLink to="/dashboard" label="Dashboard" current={location.pathname} />
                <NavLink
                  to={LEGALEASE_DOWNLOAD_PATH}
                  label="Download"
                  current={location.pathname}
                  alternateActivePaths={["/dashboard/extension"]}
                />
                <NavLink to="/analyze-website" label="Website" current={location.pathname} />
                <NavLink
                  to="/vault"
                  label="Vault"
                  current={location.pathname}
                  title="Contract Vault"
                />

                <span className="text-slate-300 mx-1 hidden lg:inline">|</span>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-haptic text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              /* ── Public / Landing Nav ── */
              <>
                <NavLink to="/" label="Home" current={location.pathname} />

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
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/** Helper — single nav link with active underline */
function NavLink({ to, label, current, title, alternateActivePaths = [] }) {
  const alsoActive = alternateActivePaths.includes(current);

  // `/dashboard` must not stay active on `/dashboard/extension` or child paths (substring match).
  const isActive =
    alsoActive ||
    current === to ||
    (to !== "/" &&
      to !== "/dashboard" &&
      (current.startsWith(`${to}/`) || current.startsWith(`${to}?`)));

  const dashboardActive = to === "/dashboard" && current === "/dashboard";

  return (
    <Link
      to={to}
      title={title}
      className={`text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
        isActive || dashboardActive
          ? "text-blue-700 bg-blue-50 font-semibold"
          : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export default Navbar;
