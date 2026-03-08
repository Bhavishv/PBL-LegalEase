import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}

export default Layout;
