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
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link
            to="/"
            className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors duration-200"
          >
            LegalEase
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === "/"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Home
            </Link>
            {isDashboard ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-blue-600"
                >
                  Dashboard
                </Link>
                <span className="text-sm text-gray-400">|</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
