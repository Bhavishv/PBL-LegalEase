import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MobileScannerPage from "./pages/MobileScannerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/mobile-scan/:sessionId" element={<MobileScannerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;