import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Policy() {
  const isDarkMode = useOutletContext(); // MainLayout se dark mode status le rha hai
  const navigate = useNavigate();

  // Color management based on theme state
  const c = {
    bg: isDarkMode ? "#0a1931" : "#f8fafc",
    cardBg: isDarkMode ? "#112240" : "#ffffff",
    text: isDarkMode ? "#e2e8f0" : "#333333",
    titleText: isDarkMode ? "#ffffff" : "#0a1931",
    accent: "#2563eb",
    border: isDarkMode ? "#1e293b" : "#e2e8f0",
    subText: isDarkMode ? "#94a3b8" : "#64748b"
  };

  return (
    <div style={{ backgroundColor: c.bg, color: c.text, minHeight: "100vh", transition: "0.3s", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Back to Home Button */}
        <button 
          onClick={() => navigate("/")} 
          style={{ background: "transparent", border: "none", color: c.accent, cursor: "pointer", fontSize: "16px", fontWeight: "600", marginBottom: "30px", display: "flex", alignItems: "center", gap: "5px" }}
        >
          ← Back to Home
        </button>

        {/* Page Main Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: "38px", fontWeight: "800", color: c.titleText, marginBottom: "10px" }}>Privacy Policy</h1>
          <p style={{ color: c.subText, fontSize: "15px", marginBottom: "40px" }}>Last updated: June 2026</p>
        </motion.div>

        {/* Content Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", lineHeight: "1.8", fontSize: "16px" }}
        >
          <p>
            At PromiAPI, we take your privacy very seriously. This Privacy Policy document outlines the types of personal information that is received and collected by our platform and how it is securely used.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>1. Information We Collect</h3>
          <p>
            When you register an account on PromiAPI or use our developer dashboard, we may collect professional identifier details such as your full name, email address, company name, and standard billing information.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>2. How We Use Your Data</h3>
          <p>We process your data strictly to deliver and maintain our SaaS infrastructure services, which includes:</p>
          <ul style={{ paddingLeft: "20px", color: c.subText }}>
            <li>Providing and managing secure JWT user authentication tokens.</li>
            <li>Generating live system request charts inside your API dashboard metrics.</li>
            <li>Sending essential transaction updates, alerts, and billing invoices.</li>
          </ul>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>3. API Security & Endpoint Protection</h3>
          <p>
            All keys, user segments, and configuration logs pushed onto our systems are stored using enterprise-grade structural encryption. We never sell, distribute, or expose your custom internal dataset parameters to third-party marketing brokers.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>4. Cookies and Sessions</h3>
          <p>
            We use essential local session cookies to keep you safely signed in to your operational workflow area and to store your responsive dashboard dark/light theme preferences seamlessly.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>5. Contact Our Privacy Team</h3>
          <p>
            If you have any compliance questions or structural concerns regarding how user logs are handled, feel free to drop an inquiry line directly at <strong>privacy@promiapi.com</strong>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Policy;