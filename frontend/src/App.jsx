import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

import Layout from "./components/Layout";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MobileScannerPage from "./pages/MobileScannerPage";
import Analysis from "./pages/Analysis";
import VersionCompare from "./pages/VersionCompare";
import CrowdIntel from "./pages/CrowdIntel";
import ContractVault from "./pages/ContractVault";
import LegalAI from "./pages/LegalAI";
import Glossary from "./pages/Glossary";
import Premium from "./pages/Premium";
import Preloader from "./components/Preloader";

function App() {
  return (
    <GoogleOAuthProvider clientId="1234567890-example.apps.googleusercontent.com">
      <Preloader />
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
          <Route path="/vault" element={<Layout><ContractVault /></Layout>} />
          <Route path="/legal-ai" element={<Layout><LegalAI /></Layout>} />
          <Route path="/glossary" element={<Layout><Glossary /></Layout>} />
          <Route path="/premium" element={<Layout><Premium /></Layout>} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;