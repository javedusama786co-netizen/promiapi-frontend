import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Safe Vite + Fallback Environment URL Configuration
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://api.promiapi.com");

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  
  // 📊 Live States Exact Backend Data Model Architecture
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalGroups: 0,
    totalCampaigns: 0,
    totalTemplates: 0,
    totalBotReplies: 0,
    totalBotFlows: 0,
    activeTeamMembers: 0,
    messagesInQueue: 0,
    messagesProcessed: 0
  });

  const [isWhatsAppSetupComplete, setIsWhatsAppSetupComplete] = useState(false);

  // 🟢 Heartbeat Ping Interval
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          await axios.post(
            `${API_BASE_URL}/api/team/heartbeat`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.warn("⚠️ Heartbeat sync ping failed:", err.message);
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 120000);
    return () => clearInterval(heartbeatInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) navigate("/login");
          return;
        }

        // STEP 1: Profile Sync Pipeline
        try {
          const profileRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (profileRes.data && isMounted) {
            if (profileRes.data.success || profileRes.data.user) {
              const liveUser = profileRes.data.user || profileRes.data;
              const realName = liveUser.name || liveUser.fullName || liveUser.companyName || liveUser.firstName || liveUser.username || "Real User";
              setUserName(realName);
            } else {
              const savedUser = localStorage.getItem("user");
              if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                const localName = parsedUser.name || parsedUser.fullName || parsedUser.companyName || parsedUser.firstName || parsedUser.username || "User";
                setUserName(localName);
              }
            }
          }
        } catch (profileErr) {
          console.warn("⚠️ Profile Fetch Guard Active:", profileErr.message);
          if (isMounted) {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
              try {
                const parsedUser = JSON.parse(savedUser);
                const localName = parsedUser.name || parsedUser.fullName || parsedUser.companyName || parsedUser.firstName || parsedUser.username || "User";
                setUserName(localName);
              } catch {
                setUserName("User");
              }
            }
          }
        }

        // STEP 2: Realtime WhatsApp Engine Check (Updated to correctly support QR Code & Official Meta)
        try {
          const configRes = await axios.get(`${API_BASE_URL}/api/whatsapp/config`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (isMounted && configRes.data) {
            const configData = configRes.data.config || configRes.data;
            const configsList = Array.isArray(configRes.data.configs) ? configRes.data.configs : [configData];
            
            // Check karein ke aya koi bhi session (QR ya Official) CONNECTED hai ya configured hai
            const isAnyQrConnected = configsList.some(c => (c.platform === "whatsapp_qr" && c.status === "CONNECTED") || c.status === "CONNECTED");
            const isOfficialConfigured = Boolean(configData.phoneNumberId && configData.accessToken);
            
            if (isAnyQrConnected || isOfficialConfigured || configRes.data.success) {
              setIsWhatsAppSetupComplete(true);
            }
          }
        } catch (we) {
          console.warn("⚠️ WhatsApp config check skipped:", we.message);
        }

        // STEP 3: Core Database Aggregation Statistics
        try {
          const statsRes = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (statsRes.data && isMounted) {
            const incoming = statsRes.data.stats || statsRes.data.data || statsRes.data || {};

            setStats({
              totalContacts: Number(incoming.contacts ?? incoming.totalContacts ?? 0),
              totalGroups: Number(incoming.groups ?? incoming.totalGroups ?? 0),
              totalCampaigns: Number(incoming.campaigns ?? incoming.totalCampaigns ?? 0),
              totalTemplates: Number(incoming.templates ?? incoming.totalTemplates ?? 0),
              totalBotReplies: Number(incoming.botReplies ?? incoming.bot_replies ?? incoming.totalBotReplies ?? incoming.replies ?? 0),
              totalBotFlows: Number(incoming.flows ?? incoming.botFlows ?? incoming.totalBotFlows ?? incoming.bot_flows ?? 0),
              activeTeamMembers: Number(incoming.activeTeamMembers ?? incoming.teamMembers ?? 0),
              messagesInQueue: Number(incoming.queue ?? incoming.messagesInQueue ?? 0),
              messagesProcessed: Number(incoming.processed ?? incoming.messagesProcessed ?? 0)
            });
            
            // Agar pehle se QR connected hone ki wajah se setup true hai toh use false mat hone dein
            if (statsRes.data.metaConfigured === true) {
              setIsWhatsAppSetupComplete(true);
            }
          }
        } catch (statsErr) {
          console.error("❌ Critical database collection mapping failed:", statsErr.message);
        }

      } catch (error) {
        console.error("❌ Critical System Analytical Failure:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, [navigate]);

  // Vector Inline Icons Collection
  const inlineIcons = {
    contacts: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    groups: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>,
    campaigns: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a4.5 4.5 0 0 1 0 7M19 5.5a8.5 8.5 0 0 1 0 13"></path></svg>,
    templates: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
    bot: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4M8 16h.01M16 16h.01"></path></svg>,
    flow: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M6 9v3a3 3 0 0 0 3 3h6"></path></svg>,
    team: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>,
    queue: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    processed: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
    warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
    flash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
  };

  const cardsData = [
    { title: "TOTAL CONTACTS", value: stats.totalContacts, link: "/dashboard/contacts", icon: inlineIcons.contacts, accent: "#2563eb", bgGlow: "rgba(37, 99, 235, 0.08)" },
    { title: "TOTAL GROUPS", value: stats.totalGroups, link: "/dashboard/contacts?tab=groups", icon: inlineIcons.groups, accent: "#4f46e5", bgGlow: "rgba(79, 70, 229, 0.08)" },
    { title: "TOTAL CAMPAIGNS", value: stats.totalCampaigns, link: "/dashboard/campaigns", icon: inlineIcons.campaigns, accent: "#06b6d4", bgGlow: "rgba(6, 182, 212, 0.08)" },
    { title: "TOTAL TEMPLATES", value: stats.totalTemplates, link: "/dashboard/templates", icon: inlineIcons.templates, accent: "#7c3aed", bgGlow: "rgba(124, 58, 237, 0.08)" },
    { title: "BOT REPLIES (LIST)", value: stats.totalBotReplies, link: "/dashboard/bot-replies", icon: inlineIcons.bot, accent: "#10b981", bgGlow: "rgba(16, 185, 129, 0.08)" },
    { title: "VISUAL FLOW BUILDER", value: stats.totalBotFlows, link: "/dashboard/bot-builder", icon: inlineIcons.flow, accent: "#059669", bgGlow: "rgba(5, 150, 105, 0.08)" },
    { title: "ACTIVE TEAM MEMBERS", value: stats.activeTeamMembers, link: "/dashboard/team", icon: inlineIcons.team, accent: "#f97316", bgGlow: "rgba(249, 115, 22, 0.08)" },
    { title: "MESSAGES IN QUEUE", value: stats.messagesInQueue, link: "/dashboard/logs", icon: inlineIcons.queue, accent: "#3b82f6", bgGlow: "rgba(59, 130, 246, 0.08)" },
    { title: "MESSAGES PROCESSED", value: stats.messagesProcessed, link: "/dashboard/logs", icon: inlineIcons.processed, accent: "#22c55e", bgGlow: "rgba(34, 197, 94, 0.08)" }
  ];

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <style>{`@keyframes dashboardSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className="dash-container" style={styles.dashboardWrapper}>
      <style>{`
        @keyframes dashboardSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dash-container {
          padding: 24px;
        }

        .dash-matrix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
          margin-bottom: 30px;
        }

        .dash-guide-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .warning-banner-responsive {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .dash-container {
            padding: 14px !important;
          }
          .dash-matrix-grid {
            grid-template-columns: repeat(auto-fill, minmax(100%, 1fr)) !important;
            gap: 12px !important;
          }
          .dash-guide-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .warning-banner-responsive {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .warning-btn-mob {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
          }
        }
      `}</style>
      
      {/* Professional Multi-Channel Welcome Header */}
      <div style={styles.welcomeRow}>
        <div style={styles.welcomeHeaderFlex}>
          <div>
            <h1 style={styles.greetingText}>Welcome back, {userName}</h1>
            <p style={styles.subtext}>Here is what's happening across your WhatsApp, Messenger, and Instagram ecosystem today.</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {!isWhatsAppSetupComplete && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="warning-banner-responsive"
          style={styles.warningBanner}
        >
          <div style={styles.warningLeft}>
            <span style={{ color: "#e11d48", display: "flex", alignItems: "center" }}>{inlineIcons.warning}</span>
            <div>
              <h4 style={styles.warningTitle}>Messaging Engine Not Fully Configured!</h4>
              <p style={styles.warningDesc}>Your channel configurations (WhatsApp, Messenger, or Instagram) require attention.</p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate("/dashboard/settings/whatsapp"); }}
            className="warning-btn-mob"
            style={styles.warningBtn}
          >
            Configure Channels →
          </button>
        </motion.div>
      )}

      {/* Main Stats Grid */}
      <div className="dash-matrix-grid">
        {cardsData.map((card, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -4, boxShadow: "0 12px 24px -6px rgba(0, 0, 0, 0.06)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(card.link)}
            style={styles.cardContainer}
          >
            <div style={styles.cardHeader}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={styles.cardTitle}>{card.title}</span>
                <span style={styles.cardValue}>{card.value.toLocaleString()}</span>
              </div>
              <div style={{ ...styles.cleanIconBox, color: card.accent, backgroundColor: card.bgGlow }}>
                {card.icon}
              </div>
            </div>
            
            <div style={styles.cardFooter}>
              <span style={{ color: card.accent }}>Manage Operations</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={card.accent} strokeWidth="3">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Guide Section */}
      <div style={styles.guideSection}>
        <div style={styles.guideHeader}>
          <span style={{ color: "#2563eb", display: "flex", alignItems: "center" }}>{inlineIcons.flash}</span>
          <h3 style={styles.guideTitle}>Quick Start Multi-Channel Integration</h3>
        </div>
        <div className="dash-guide-grid">
          {[
            { step: "1", text: "Link your Meta Developer App with WhatsApp, Messenger, and Instagram pages." },
            { step: "2", text: "Configure webhooks and secure access tokens for all active channels." },
            { step: "3", text: "Sync and verify message templates across social platforms." },
            { step: "4", text: "Segment and organize your unified contact base into targeted groups." },
            { step: "5", text: "Construct automated chatbot flows to handle multi-platform inquiries." },
            { step: "6", text: "Deploy and track broadcast marketing campaigns seamlessly." }
          ].map((item, index) => (
            <div key={index} style={styles.guideItem}>
              <div style={styles.stepBadge}>{item.step}</div>
              <p style={styles.guideStepText}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboardWrapper: { 
    backgroundColor: "#f8fafc", 
    minHeight: "100vh", 
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", 
    boxSizing: "border-box" 
  },
  welcomeRow: { marginBottom: "20px" },
  welcomeHeaderFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  greetingText: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.3px" },
  subtext: { fontSize: "13.5px", color: "#64748b", margin: 0 },
  systemStatusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #dcfce7",
    padding: "6px 14px",
    borderRadius: "20px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#22c55e",
    borderRadius: "50%",
    boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.15)",
  },
  statusText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#15803d",
    letterSpacing: "0.2px"
  },
  loadingWrapper: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" },
  spinner: { width: "36px", height: "36px", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "dashboardSpin 0.8s linear infinite" },
  warningBanner: { 
    backgroundColor: "#fff1f2", 
    border: "1px solid #fecdd3", 
    padding: "14px 18px", 
    borderRadius: "14px", 
    marginBottom: "24px", 
    boxSizing: "border-box" 
  },
  warningLeft: { display: "flex", alignItems: "center", gap: "12px" },
  warningTitle: { margin: 0, fontSize: "13.5px", fontWeight: "700", color: "#9f1239" },
  warningDesc: { margin: "2px 0 0 0", fontSize: "12.5px", color: "#be123c" },
  warningBtn: { 
    backgroundColor: "#e11d48", 
    color: "#ffffff", 
    border: "none", 
    padding: "9px 15px", 
    borderRadius: "8px", 
    fontSize: "12px", 
    fontWeight: "600", 
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  cardContainer: { 
    backgroundColor: "#ffffff", 
    border: "1px solid #e2e8f0", 
    borderRadius: "14px", 
    padding: "18px", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "space-between", 
    minHeight: "120px", 
    cursor: "pointer", 
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)"
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" },
  cardValue: { fontSize: "22px", fontWeight: "700", color: "#0f172a", marginTop: "6px" },
  cleanIconBox: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    width: "40px", 
    height: "40px", 
    borderRadius: "10px" 
  },
  cardFooter: { 
    display: "flex", 
    alignItems: "center", 
    gap: "5px", 
    fontSize: "12px", 
    fontWeight: "600", 
    borderTop: "1px solid #f1f5f9", 
    paddingTop: "10px", 
    marginTop: "12px" 
  },
  guideSection: { 
    backgroundColor: "#ffffff", 
    border: "1px solid #e2e8f0", 
    borderRadius: "16px", 
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)"
  },
  guideHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" },
  guideTitle: { margin: 0, fontSize: "14.5px", fontWeight: "700", color: "#0f172a" },
  guideItem: { display: "flex", gap: "10px", alignItems: "flex-start" },
  stepBadge: { 
    minWidth: "22px", 
    height: "22px", 
    backgroundColor: "#eff6ff", 
    borderRadius: "6px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontSize: "11px", 
    fontWeight: "700", 
    color: "#2563eb" 
  },
  guideStepText: { margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: "1.4" }
};

export default Dashboard;