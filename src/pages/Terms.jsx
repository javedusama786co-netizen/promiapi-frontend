import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Terms() {
  const isDarkMode = useOutletContext(); 
  const navigate = useNavigate();

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
        
        {/* Back Button */}
        <button 
          onClick={() => navigate("/")} 
          style={{ background: "transparent", border: "none", color: c.accent, cursor: "pointer", fontSize: "16px", fontWeight: "600", marginBottom: "30px", display: "flex", alignItems: "center", gap: "5px" }}
        >
          ← Back to Home
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: "38px", fontWeight: "800", color: c.titleText, marginBottom: "10px" }}>Terms of Service</h1>
          <p style={{ color: c.subText, fontSize: "15px", marginBottom: "40px" }}>Last updated: June 2026</p>
        </motion.div>

        {/* Legal Body Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", lineHeight: "1.8", fontSize: "16px" }}
        >
          <p>
            Welcome to PromiAPI. By accessing our platform, dashboard services, or deploying API keys, you agree to comply with and be bound by the following structural terms and conditions.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>1. Account Registration & Safety</h3>
          <p>
            Users must provide accurate email credentials during signup. You are entirely responsible for preventing unauthorized use or dynamic script exploitation via your master API gateway keys.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>2. Fair Usage Policy</h3>
          <p>
            Your dynamic rate limits are dependent on your current subscription plan parameters. Any attempt to deliberately overload infrastructure endpoints or create automated loops to abuse the PromiAPI gateway will result in temporary suspension.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>3. Intellectual Property</h3>
          <p>
            The software patterns, dashboard UI architectures, and original platform code structures are owned entirely by PromiAPI. No user may reverse-engineer or clone our platform elements without legal consent.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>4. Termination</h3>
          <p>
            We reserve the right to cease service distribution or freeze authentication access for any user account violating endpoint compliance protocols or failing to process cloud subscription renewals on schedule.
          </p>

          <h3 style={{ color: c.titleText, marginTop: "30px", fontSize: "20px", fontWeight: "700" }}>5. Updates to Terms</h3>
          <p>
            These structural regulations may shift dynamically over time to align with regional standards. Continued use of your PromiAPI system metrics interface implies total alignment with our operational adjustments.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Terms;