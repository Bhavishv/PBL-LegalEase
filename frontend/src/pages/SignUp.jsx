import { Link, useNavigate } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Later connect backend API
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4">
        <Link
          to="/"
          className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Home
        </Link>
      </header>
      <div className="flex-1 flex justify-center items-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
          <p className="text-slate-600 text-sm mb-6">
            Get started with LegalEase
          </p>

          <input
            type="text"
            placeholder="Name"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 mb-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 mb-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 mb-6 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Account
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;