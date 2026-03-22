import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MobileScannerPage from "./pages/MobileScannerPage";
import Analysis from "./pages/Analysis";
import VersionCompare from "./pages/VersionCompare";
import CrowdIntel from "./pages/CrowdIntel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/mobile-scan/:sessionId" element={<MobileScannerPage />} />
        <Route path="/analysis" element={<Layout><Analysis /></Layout>} />
        <Route path="/version-compare" element={<Layout><VersionCompare /></Layout>} />
        <Route path="/crowd-intel" element={<Layout><CrowdIntel /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;