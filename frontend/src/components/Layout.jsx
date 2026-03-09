import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] relative z-10">{children}</main>
    </div>
  );
}

export default Layout;
