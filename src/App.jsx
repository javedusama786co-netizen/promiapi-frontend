import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Branding Context Import (White-Labeling Support)
import { BrandingProvider, useBranding } from "./context/BrandingContext";

// Pages & Components
import YouTubeStyleAnalytics from "./components/Analytics";
import QRCodeGenerator from "./pages/QRCodeGenerator";
import Integrations from "./pages/Integrations";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Policy from "./pages/Policy";
import ActivateAccount from "./pages/ActivateAccount";
import Dashboard from "./pages/Dashboard";
import Chats from "./pages/Chats";
import Contacts from "./pages/Contacts";
import Templates from "./pages/Templates";
import Campaigns from "./pages/Campaigns";
import TeamMembers from "./pages/TeamMembers";
import Subscription from "./pages/Subscription";
import AdminPanel from "./pages/AdminPanel";
import BotBuilder from "./pages/BotBuilder";
import WhatsAppSetup from "./pages/WhatsAppSetup";
import BotRepliesList from "./pages/BotRepliesList";
import CreateBotReply from "./pages/CreateBotReply";
import AiBotSettings from "./pages/AiBotSettings"; 
import Onboarding from "./pages/Onboarding"; 

import Sidebar from "./components/sidebar";
import Header from "./components/Header";
import PublicHeader from "./components/MainHeader";
import ProtectedFeature from "./components/ProtectedFeature";
import MessageLog from "./components/MessageLog";
import GeneralSettings from "./components/GeneralSettings";

import myAppLogo from "./assets/logo.png";

// 🔒 SECURE ADMIN PROTECTION GATEWAY
function AdminProtectedRoute() {
  const isAuthenticated = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role");
  
  // Safe extraction of email from localStorage or user object
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = localStorage.getItem("user_email") || storedUser.email || "";

  // MASTER OWNER CONFIGURATION
  const DEVELOPER_OWNER_EMAIL = "javedusama786.co@gmail.com"; 

  // Strict local validation before rendering route
  if (
    !isAuthenticated || 
    userRole !== "admin" || 
    !userEmail || 
    userEmail.toLowerCase() !== DEVELOPER_OWNER_EMAIL.toLowerCase()
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Global Loader Component
const loaderIcons = {
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.419h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.874 9.877-9.874 2.636 0 5.114 1.028 6.977 2.893s2.888 4.342 2.887 6.98c-.002 5.446-4.431 9.873-9.854 9.873m0-18.176C6.4 3.625 1.758 8.267 1.758 13.993c0 1.831.478 3.618 1.385 5.196L1.6 24.002l4.945-1.296a10.36 10.36 0 005.503 1.565h.005c5.733 0 10.375-4.642 10.377-10.369 0-2.768-1.079-5.37-3.037-7.329-1.958-1.957-4.561-3.036-7.326-3.036" /></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" /></svg>,
  growth: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="7.5 12.5 10.7 15.7 16.5 9" /></svg>,
  rocket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  bulb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.74c.6.45 1 1.16 1 1.91V17h6v-.35c0-.75.4-1.46 1-1.91A7 7 0 0 0 12 2z" /></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  coin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v2m0 8v2" /><path d="M15 9a3 3 0 0 0-3-1.5c-1.7 0-3 .9-3 2.25S10.3 12 12 12s3 .9 3 2.25S13.7 16.5 12 16.5A3 3 0 0 1 9 15" /></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
};

const loaderIconColor = {
  whatsapp: "#25D366", instagram: "#f472b6", growth: "#34d399", success: "#10b981", rocket: "#fb923c", trophy: "#fbbf24", star: "#facc15",
  target: "#f87171", bulb: "#fcd34d", chat: "#60a5fa", coin: "#fde047", shield: "#2dd4bf", zap: "#a78bfa",
};

// 3D Animated Cubes with dynamic float, drift and rotational paths
const loaderCubes = [
  { s: 84, from: [-720, -260, -800], to: [-300, -60, 200],  dur: 11, bob: 4.5, spin: 14, rev: false, faces: ["whatsapp", "growth", "instagram", "success", "rocket", "trophy"] },
  { s: 72, from: [700, -220, 200],   to: [320, -300, -900], dur: 13, bob: 5.2, spin: 17, rev: true,  faces: ["growth", "chat", "star", "whatsapp", "target", "coin"] },
  { s: 78, from: [-560, -300, -200], to: [-480, 300, -200], dur: 10, bob: 4.0, spin: 12, rev: false, faces: ["instagram", "success", "bulb", "growth", "shield", "whatsapp"] },
  { s: 90, from: [600, 300, -700],   to: [520, -260, -100], dur: 12, bob: 5.8, spin: 18, rev: true,  faces: ["trophy", "whatsapp", "growth", "rocket", "instagram", "zap"] },
  { s: 64, from: [-300, -340, -900], to: [300, -340, -300], dur: 14, bob: 4.8, spin: 15, rev: false, faces: ["success", "star", "coin", "chat", "growth", "target"] },
  { s: 60, from: [320, 330, -300],   to: [-320, 330, -800], dur: 15, bob: 5.5, spin: 16, rev: true,  faces: ["rocket", "instagram", "shield", "trophy", "whatsapp", "bulb"] },
  { s: 56, from: [-760, 120, -1000], to: [760, -120, -1000], dur: 16, bob: 4.2, spin: 20, rev: false, faces: ["growth", "whatsapp", "success", "star", "zap", "instagram"] },
];

export function GlobalLoader() {
  const [textIndex, setTextIndex] = useState(0);
  const [percent, setPercent] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const { branding, loading } = useBranding();

  const loadingLines = [
    "Initializing secure database core...",
    "Syncing WhatsApp Cloud API modules...",
    "Decrypting system token metrics...",
    "Loading custom contact dashboards...",
    "Readying automation handshake protocols..."
  ];

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % loadingLines.length);
    }, 1400);
    return () => clearInterval(textInterval);
  }, [loadingLines.length]);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setPercent(Math.min(100, Math.round(((Date.now() - start) / 6500) * 100)));
    }, 100);
    return () => clearInterval(id);
  }, []);

  const hasValidLogo = branding?.logoUrl && branding.logoUrl !== "/default-logo.png";
  const m = typeof window !== "undefined" ? (window.innerWidth <= 520 ? 0.45 : window.innerWidth <= 900 ? 0.72 : 1) : 1;

  return (
    <div className="ld-overlay" role="status" aria-live="polite" aria-label="Loading your workspace">
      <style>{loaderCss}</style>

      {/* 3D Horizon & Ambient Floor */}
      <div className="ld-horizon" />
      <div className="ld-floor" />
      <div className="ld-vignette" />

      <div className="ld-container">
        {/* 3D Tunnel & Dynamic Floating Cubes */}
        <div className="ld-stage" aria-hidden="true">
          <div className="ld-tunnel">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="ld-frame" style={{ animationDelay: `${-i * 1.5}s` }} />
            ))}
            {loaderCubes.map((c, i) => (
              <div
                key={i}
                className="ld-drift"
                style={{
                  "--x1": `${Math.round(c.from[0] * m)}px`, "--y1": `${Math.round(c.from[1] * m)}px`, "--z1": `${c.from[2]}px`,
                  "--x2": `${Math.round(c.to[0] * m)}px`, "--y2": `${Math.round(c.to[1] * m)}px`, "--z2": `${c.to[2]}px`,
                  animationDuration: `${c.dur}s`,
                  animationDelay: `${-i * 3.1}s`,
                }}
              >
                <div className="ld-bob" style={{ animationDuration: `${c.bob}s`, animationDelay: `${-i * 1.3}s` }}>
                  <div
                    className="ld-cube"
                    style={{ "--s": `${c.s}px`, animationDuration: `${c.spin}s`, animationDirection: c.rev ? "reverse" : "normal", animationDelay: `${-i * 2.2}s` }}
                  >
                    {c.faces.map((f, k) => (
                      <i key={k} style={{ "--ic": loaderIconColor[f] }}>{loaderIcons[f]}</i>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Central Logo Box / Professional Promi API Fallback */}
        <div className="ld-logo-zone">
          <span className="ld-pulse" />
          <span className="ld-pulse ld-pulse-2" />
          <span className="ld-halo" />
          <div className="ld-tile">
            <span className="ld-shine" />
            {loading ? (
              <div className="ld-skel" />
            ) : hasValidLogo && !imgFailed ? (
              <img
                src={branding.logoUrl}
                alt={branding?.companyName || "App Logo"}
                className="ld-img"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="ld-pro-brand">
                <span className="ld-brand-main">PROMI</span>
                <span className="ld-brand-sub">API</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="ld-info">
          <div className="ld-title">Preparing your workspace</div>
          <div className="ld-line">
            <div key={textIndex} className="ld-line-text">
              {loadingLines[textIndex]}
            </div>
          </div>
          <div className="ld-track">
            <div className="ld-fill" />
          </div>
          <div className="ld-percent">{percent}%</div>
        </div>
      </div>

      <div className="ld-foot">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        Secured by the official WhatsApp Cloud API
      </div>
    </div>
  );
}

const ContactPage = () => (
  <div style={{ padding: "100px", textAlign: "center" }}>
    <Helmet>
      <title>Contact Us | PromiAPI</title>
    </Helmet>
    <h1>Contact Us Page</h1>
    <p>Get in touch with PromiAPI team.</p>
  </div>
);

function PublicLayout({ toggleTheme, isDarkMode }) {
  return (
    <>
      <PublicHeader toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <Outlet context={isDarkMode} />
    </>
  );
}

// 🏷️ Dynamic Dashboard Title component for White-Labeling support
function DynamicDashboardTitle() {
  const { branding } = useBranding();
  const location = useLocation();
  const brandName = branding?.companyName || "PromiAPI";

  let pageTitle = "Dashboard";
  switch (location.pathname) {
    case "/dashboard": pageTitle = "Dashboard"; break;
    case "/dashboard/analytics": pageTitle = "Analytics"; break;
    case "/dashboard/qr": pageTitle = "QR Code Studio"; break;
    case "/dashboard/settings/general": pageTitle = "General Settings"; break;
    case "/dashboard/settings/ai-chatbot": pageTitle = "AI Chatbot Settings"; break;
    case "/dashboard/settings/whatsapp": pageTitle = "WhatsApp Setup"; break;
    case "/dashboard/bot-replies": pageTitle = "Bot Replies"; break;
    case "/dashboard/bot-replies/new": pageTitle = "Create Bot Reply"; break;
    case "/dashboard/campaigns": pageTitle = "Campaigns"; break;
    case "/dashboard/bot-builder": pageTitle = "Bot Builder"; break;
    case "/dashboard/integrations":
    case "/dashboard/settings/integrations": pageTitle = "Integrations"; break;
    case "/dashboard/chats": pageTitle = "Live Chats"; break;
    case "/dashboard/contacts": pageTitle = "Contacts Manager"; break;
    case "/dashboard/templates": pageTitle = "Message Templates"; break;
    case "/dashboard/team": pageTitle = "Team Members"; break;
    case "/dashboard/subscription": pageTitle = "Subscription & Billing"; break;
    case "/dashboard/logs": pageTitle = "Message Logs"; break;
    default: pageTitle = "Dashboard";
  }

  return (
    <Helmet>
      <title>{`${pageTitle} | ${brandName}`}</title>
    </Helmet>
  );
}

function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div style={{ display: "flex", background: "#f8fafc", minHeight: "100vh", width: "100%" }}>
      {/* Automatically sets title based on White-Labeling company name or PromiAPI fallback */}
      <DynamicDashboardTitle />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div 
        style={{ 
          marginLeft: isMobile ? "0px" : "270px", 
          width: isMobile ? "100%" : "calc(100% - 270px)", 
          transition: "all 0.3s",
          minHeight: "100vh",
          boxSizing: "border-box"
        }}
      >
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div style={{ padding: isMobile ? "15px" : "30px", width: "100%", boxSizing: "border-box" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    if (!document.getElementById("premium-engine-animations")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "premium-engine-animations";
      styleSheet.innerText = `
        @keyframes customSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0% { transform: scale(0.95); opacity: 0.2; } 50% { transform: scale(1.1); opacity: 0.4; } 100% { transform: scale(0.95); opacity: 0.2; } }
        @keyframes fluidText { 0% { opacity: 0; transform: translateY(8px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-8px); } }
        @keyframes fullLoad { 0% { width: 0%; } 100% { width: 100%; } }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES WITH DYNAMIC TITLES */}
          <Route element={<PublicLayout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}>
            <Route path="/" element={<><Helmet><title>Home | PromiAPI</title></Helmet><Home /></>} />
            <Route path="/register" element={<><Helmet><title>Register | PromiAPI</title></Helmet><Register /></>} />
            <Route path="/onboarding" element={<><Helmet><title>Onboarding | PromiAPI</title></Helmet><Onboarding /></>} />
            <Route path="/login" element={<><Helmet><title>Login | PromiAPI</title></Helmet><Login /></>} />
            <Route path="/forgot-password" element={<><Helmet><title>Forgot Password | PromiAPI</title></Helmet><ForgotPassword /></>} />
            <Route path="/reset-password/:token" element={<><Helmet><title>Reset Password | PromiAPI</title></Helmet><ResetPassword /></>} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<><Helmet><title>Terms & Conditions | PromiAPI</title></Helmet><Terms /></>} />
            <Route path="/policy" element={<><Helmet><title>Privacy Policy | PromiAPI</title></Helmet><Policy /></>} />
            <Route path="/activate-account/:token" element={<><Helmet><title>Activate Account | PromiAPI</title></Helmet><ActivateAccount /></>} />
          </Route>

          {/* ADMIN PROTECTED ROUTE */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin-control-cluster" element={<><Helmet><title>Admin Control Panel | PromiAPI</title></Helmet><AdminPanel /></>} />
          </Route>

          {/* DASHBOARD ROUTES (Title managed by DynamicDashboardTitle in DashboardLayout) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/analytics" element={<YouTubeStyleAnalytics />} />
            <Route path="/dashboard/qr" element={<QRCodeGenerator />} />
            <Route path="/dashboard/settings/general" element={<GeneralSettings />} />
            
            <Route path="/dashboard/settings/ai-chatbot" element={<AiBotSettings />} />
            <Route path="/dashboard/settings/whatsapp" element={<WhatsAppSetup />} />

            {/* PROTECTED PREMIUM FEATURES */}
            <Route path="/dashboard/bot-replies" element={<ProtectedFeature><BotRepliesList /></ProtectedFeature>} />
            <Route path="/dashboard/bot-replies/new" element={<ProtectedFeature><CreateBotReply /></ProtectedFeature>} />
            <Route path="/dashboard/campaigns" element={<ProtectedFeature><Campaigns /></ProtectedFeature>} />
            <Route path="/dashboard/bot-builder" element={<ProtectedFeature><BotBuilder /></ProtectedFeature>} />

            <Route path="/dashboard/integrations" element={<Integrations />} />
            <Route path="/dashboard/settings/integrations" element={<Integrations />} />

            <Route path="/dashboard/chats" element={<Chats />} />
            <Route path="/dashboard/contacts" element={<Contacts />} />
            <Route path="/dashboard/templates" element={<Templates />} />
            <Route path="/dashboard/team" element={<TeamMembers />} />
            <Route path="/dashboard/subscription" element={<Subscription />} />
            <Route path="/dashboard/logs" element={<MessageLog />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

// 🌐 GOOGLE OAUTH PROVIDER WRAPPER
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "277523302863-3lccdghg4gt3dm9f7otf7setaceoipqc.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrandingProvider>
        <AppContent />
      </BrandingProvider>
    </GoogleOAuthProvider>
  );
}

/* Updated CSS for Better Mobile Responsiveness & Loading Bar Visibility */
const loaderCss = `
.ld-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #040914; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.ld-overlay *, .ld-overlay *::before, .ld-overlay *::after { box-sizing: border-box; }

/* 3D World Stage & Ambience */
.ld-horizon { position: absolute; left: 50%; top: 50%; width: 900px; height: 900px; max-width: 160vw; margin: -450px 0 0 -450px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, rgba(37,99,235,.20) 0%, rgba(13,148,136,.08) 38%, transparent 68%); animation: ldBreath 4s ease-in-out infinite; }
.ld-floor { position: absolute; left: -60%; right: -60%; bottom: -8%; height: 62%; transform-origin: 50% 100%; transform: perspective(520px) rotateX(68deg);
  background-image: linear-gradient(rgba(59,130,246,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.25) 1px, transparent 1px);
  background-size: 64px 64px; animation: ldGrid 2.5s linear infinite;
  -webkit-mask-image: linear-gradient(to top, #000 0%, transparent 90%); mask-image: linear-gradient(to top, #000 0%, transparent 90%); opacity: .35; }
.ld-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 35%, rgba(2,6,15,.92) 100%); }

.ld-container { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; padding: 24px; text-align: center; width: 100%; max-width: 100vw; box-sizing: border-box; }

/* 3D Floating Stage & Cubes */
.ld-stage { position: absolute; left: 50%; top: 0; width: 0; height: 168px; perspective: 900px; perspective-origin: 50% 50%; pointer-events: none; }
.ld-tunnel { position: absolute; left: 0; top: 84px; width: 0; height: 0; transform-style: preserve-3d; animation: ldCam 12s ease-in-out infinite; }
.ld-frame { position: absolute; left: -230px; top: -230px; width: 460px; height: 460px; border-radius: 50%; border: 1.5px dashed rgba(59, 130, 246, 0.35); opacity: 0;
  box-shadow: 0 0 15px rgba(59,130,246,.15); animation: ldWarp 12s linear infinite; }
.ld-frame:nth-child(even) { border-color: rgba(20, 184, 166, 0.3); box-shadow: 0 0 15px rgba(20,184,166,.12); }
.ld-drift { position: absolute; left: 0; top: 0; transform-style: preserve-3d; will-change: transform; animation: ldDrift 16s ease-in-out infinite alternate; }
.ld-bob { position: absolute; left: 0; top: 0; transform-style: preserve-3d; will-change: transform; animation: ldBob3d 6s ease-in-out infinite alternate; }
.ld-cube { position: absolute; left: calc(var(--s) / -2); top: calc(var(--s) / -2); width: var(--s); height: var(--s); transform-style: preserve-3d; will-change: transform; animation: ldTumble 20s linear infinite; }
.ld-cube i { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--ic); border: 1px solid rgba(147,197,253,.35); border-radius: 12%; background: rgba(8,20,45,.65); box-shadow: inset 0 0 12px rgba(96,165,250,.2), 0 0 8px rgba(0,0,0,.4); }
.ld-cube svg { width: 56%; height: 56%; filter: drop-shadow(0 0 4px currentColor); }
.ld-cube i:nth-child(1) { transform: translateZ(calc(var(--s) / 2)); }
.ld-cube i:nth-child(2) { transform: rotateY(180deg) translateZ(calc(var(--s) / 2)); }
.ld-cube i:nth-child(3) { transform: rotateY(90deg) translateZ(calc(var(--s) / 2)); }
.ld-cube i:nth-child(4) { transform: rotateY(-90deg) translateZ(calc(var(--s) / 2)); }
.ld-cube i:nth-child(5) { transform: rotateX(90deg) translateZ(calc(var(--s) / 2)); }
.ld-cube i:nth-child(6) { transform: rotateX(-90deg) translateZ(calc(var(--s) / 2)); }

/* Central Logo Box & Brand Styling */
.ld-logo-zone { position: relative; width: 168px; height: 168px; display: flex; align-items: center; justify-content: center; margin-bottom: 30px; }
.ld-pulse { position: absolute; width: 112px; height: 112px; border-radius: 28px; border: 2px solid rgba(96,165,250,.5); animation: ldPulse 3s ease-out infinite; }
.ld-pulse-2 { animation-delay: 1.5s; }
.ld-halo { position: absolute; width: 150px; height: 150px; border-radius: 50%; animation: ldSpinFlat 3.2s linear infinite;
  background: conic-gradient(from 0deg, transparent 0deg, #2563eb 120deg, #14b8a6 220deg, transparent 300deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
  filter: drop-shadow(0 0 8px rgba(37,99,235,.8)); }
.ld-tile { position: relative; width: 115px; height: 115px; border-radius: 28px; display: flex; align-items: center; justify-content: center; overflow: hidden; animation: ldBob 3s ease-in-out infinite;
  background: linear-gradient(145deg, rgba(255,255,255,.18), rgba(255,255,255,.03)); border: 1px solid rgba(255,255,255,.28);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: 0 24px 55px rgba(37,99,235,.5), inset 0 1px 0 rgba(255,255,255,.35); }
.ld-shine { position: absolute; top: 0; left: -70%; width: 45%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,.45), transparent); transform: skewX(-20deg); animation: ldShine 3.2s ease-in-out infinite; }
.ld-img { width: 68px; height: 68px; object-fit: contain; border-radius: 12px; position: relative; z-index: 1; }
.ld-skel { width: 60px; height: 60px; border-radius: 14px; background: linear-gradient(90deg, #1e293b 25%, #2b3b55 50%, #1e293b 75%); background-size: 200% 100%; animation: ldShimmer 1.4s linear infinite; }

/* Professional "PROMI API" Text inside Central Tile */
.ld-pro-brand { display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; z-index: 1; line-height: 1.05; }
.ld-brand-main { font-size: 19px; font-weight: 900; letter-spacing: 1.5px; background: linear-gradient(135deg, #ffffff 0%, #a5f3fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
.ld-brand-sub { font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #38bdf8; margin-top: 2px; text-shadow: 0 0 10px rgba(56,189,248,0.8); }

/* Loader Info Details */
.ld-info { 
  position: relative; 
  z-index: 10; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  background: rgba(4, 9, 20, 0.75); 
  padding: 18px 24px; 
  border-radius: 20px; 
  border: 1px solid rgba(255, 255, 255, 0.08); 
  backdrop-filter: blur(12px); 
  -webkit-backdrop-filter: blur(12px); 
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); 
  width: 100%;
  max-width: 320px;
}

.ld-title { font-size: 18px; font-weight: 600; letter-spacing: -.2px; color: #fff; margin-bottom: 8px; }
.ld-line { height: 22px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.ld-line-text { font-size: 13px; color: #94a3b8; letter-spacing: .2px; animation: ldText 1.4s infinite ease-in-out; }
.ld-track { width: 100%; height: 6px; border-radius: 10px; background: rgba(255,255,255,.1); overflow: hidden; position: relative; }
.ld-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981); box-shadow: 0 0 14px rgba(56, 189, 248, 0.9); animation: ldFill 6.5s linear forwards; }
.ld-percent { margin-top: 10px; font-size: 13px; font-weight: 700; color: #38bdf8; font-variant-numeric: tabular-nums; text-shadow: 0 0 8px rgba(56, 189, 248, 0.4); }
.ld-foot { position: absolute; z-index: 10; bottom: 20px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 12px; color: #64748b; padding: 0 20px; text-align: center; }

/* 3D Animations */
@keyframes ldWarp { 0% { transform: translateZ(-2000px) rotate(0deg); opacity: 0; } 15% { opacity: 0.5; } 80% { opacity: 0.4; } 100% { transform: translateZ(400px) rotate(180deg); opacity: 0; } }
@keyframes ldDrift { from { transform: translate3d(var(--x1), var(--y1), var(--z1)); } to { transform: translate3d(var(--x2), var(--y2), var(--z2)); } }
@keyframes ldBob3d { 0% { transform: translate3d(-20px, -40px, -40px) rotateX(-10deg); } 50% { transform: translate3d(0px, 20px, 10px) rotateX(10deg); } 100% { transform: translate3d(20px, 40px, 40px) rotateX(-10deg); } }
@keyframes ldTumble { 0% { transform: rotateX(-25deg) rotateY(0deg) rotateZ(0deg); } 50% { transform: rotateX(25deg) rotateY(180deg) rotateZ(90deg); } 100% { transform: rotateX(-25deg) rotateY(360deg) rotateZ(180deg); } }
@keyframes ldCam { 0%,100% { transform: rotateX(-2deg) rotateY(-3deg); } 50% { transform: rotateX(2deg) rotateY(3deg); } }
@keyframes ldGrid { from { background-position: 0 0; } to { background-position: 0 64px; } }
@keyframes ldBreath { 0%,100% { transform: scale(.95); opacity: .6; } 50% { transform: scale(1.05); opacity: .85; } }
@keyframes ldPulse { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(1.8); opacity: 0; } }
@keyframes ldSpinFlat { to { transform: rotate(360deg); } }
@keyframes ldBob { 0%,100% { transform: translateY(-4px); } 50% { transform: translateY(4px); } }
@keyframes ldShine { 0% { left: -70%; } 55%,100% { left: 140%; } }
@keyframes ldShimmer { to { background-position: -200% 0; } }
@keyframes ldText { 0% { opacity: 0; transform: translateY(8px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-8px); } }
@keyframes ldFill { from { width: 0%; } to { width: 100%; } }

/* Mobile Adjustments */
@media (max-width: 520px) {
  .ld-logo-zone { width: 130px; height: 130px; margin-bottom: 20px; }
  .ld-tile { width: 90px; height: 90px; border-radius: 22px; }
  .ld-pulse { width: 90px; height: 90px; }
  .ld-halo { width: 120px; height: 120px; }
  .ld-img { width: 52px; height: 52px; }
  .ld-brand-main { font-size: 16px; }
  .ld-brand-sub { font-size: 9px; }
  .ld-info { max-width: 88vw; padding: 14px 18px; }
  .ld-title { font-size: 16px; }
  .ld-foot { bottom: 12px; font-size: 11px; }
}
`;

export default App;