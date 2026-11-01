import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import logoFallback from "../assets/logo.png";
import { useBranding } from "../context/BrandingContext";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://api.promiapi.com"; // default fallback

const formatAvatarUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const extractUserName = (userObj) => {
  if (!userObj) return "User";
  return (
    userObj.name ||
    userObj.fullName ||
    userObj.companyName ||
    userObj.firstName ||
    userObj.username ||
    userObj.vendorTitle ||
    userObj.email?.split("@")[0] ||
    "User"
  );
};

const SecureAvatar = ({ src, alt, style }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let localBlobUrl = null;

    const loadAvatarSecurely = async () => {
      if (!src) {
        if (active) {
          setObjectUrl(null);
          setLoading(false);
        }
        return;
      }

      if (src.startsWith("blob:") || src.startsWith("data:")) {
        if (active) {
          setObjectUrl(src);
          setLoading(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "blob",
        });

        if (active) {
          localBlobUrl = URL.createObjectURL(response.data);
          setObjectUrl(localBlobUrl);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setObjectUrl(src);
          setLoading(false);
        }
      }
    };

    loadAvatarSecurely();

    return () => {
      active = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [src]);

  if (loading) return <div style={{ ...style, background: "var(--sb-track)" }} />;
  if (!objectUrl) return null;

  return <img src={objectUrl} alt={alt} style={style} />;
};

/* ---------- Icons ---------- */
const Svg = ({ size = 18, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const icons = {
  dashboard: <Svg><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>,
  analytics: <Svg><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Svg>,
  qrCode: <Svg><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></Svg>,
  chat: <Svg><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>,
  campaign: <Svg><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a4.5 4.5 0 0 1 0 7M19 5.5a8.5 8.5 0 0 1 0 13" /></Svg>,
  contacts: <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>,
  templates: <Svg><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></Svg>,
  bot: <Svg><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 16h.01M16 16h.01" /></Svg>,
  rulesList: <Svg><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></Svg>,
  createRule: <Svg><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></Svg>,
  botBuilder: <Svg><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="9" y="15" width="6" height="6" rx="1" /><path d="M6 9v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" /><path d="M12 13v2" /></Svg>,
  team: <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></Svg>,
  subscription: <Svg><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></Svg>,
  logs: <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Svg>,
  settings: <Svg><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>,
  general: <Svg><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Svg>,
  whatsapp: <Svg><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></Svg>,
  integrations: <Svg><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Svg>,
  chevron: <Svg size={16}><polyline points="6 9 12 15 18 9" /></Svg>,
  close: <Svg size={18}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>,
  logout: <Svg size={17}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Svg>,
  logoutLarge: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/* ---------- Small nav building blocks ---------- */
const NavItem = ({ to, end, icon, label, badge, onClick }) => (
  <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `sb-link${isActive ? " is-active" : ""}`}>
    <span className="sb-icon">{icon}</span>
    <span className="sb-label">{label}</span>
    {badge}
  </NavLink>
);

const SubItem = ({ to, icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `sb-sublink${isActive ? " is-active" : ""}`}>
    <span className="sb-icon">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

const NavGroup = ({ icon, label, open, active, onToggle, children }) => (
  <div>
    <button type="button" className={`sb-link sb-group-btn${active ? " is-parent-active" : ""}`} onClick={onToggle} aria-expanded={open}>
      <span className="sb-icon">{icon}</span>
      <span className="sb-label">{label}</span>
      <span className={`sb-chevron${open ? " is-open" : ""}`}>{icons.chevron}</span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: "hidden" }}
        >
          <div className="sb-submenu">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { branding, loading } = useBranding();
  const primaryColor = branding?.primaryColor || "#2563eb";

  const path = location.pathname;
  const inBotSection = path.startsWith("/dashboard/bot-replies") || path.startsWith("/dashboard/bot-builder");
  const inSettingsSection = path.startsWith("/dashboard/settings") || path.startsWith("/dashboard/integrations");

  const [isBotOpen, setIsBotOpen] = useState(inBotSection);
  const [isSettingsOpen, setIsSettingsOpen] = useState(inSettingsSection);
  const [userRole, setUserRole] = useState("Admin");
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileScreen(isMobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close the logout dialog with the Escape key
  useEffect(() => {
    if (!showLogoutModal) return;
    const onKey = (e) => { if (e.key === "Escape") setShowLogoutModal(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogoutModal]);

  const loadUserData = () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUserName(extractUserName(parsedUser));

        const rawAvatar = parsedUser.avatar || parsedUser.profilePic || "";
        if (rawAvatar) {
          setUserAvatar(formatAvatarUrl(rawAvatar));
        } else {
          setUserAvatar("");
        }

        if (parsedUser.role && parsedUser.role.toLowerCase() === "agent") {
          setUserRole("Agent");
        } else {
          setUserRole("Admin");
        }
      }
    } catch (error) {
      console.error("Error parsing user data in Sidebar:", error);
      setUserRole("Admin");
    }
  };

  // Fetch unread chats count for the badge
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success && Array.isArray(res.data.chats)) {
        const unreadTotal = res.data.chats.reduce((acc, chat) => acc + (Number(chat.unreadCount) || 0), 0);
        setUnreadChatsCount(unreadTotal);
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch unread chats count:", err.message);
    }
  };

  useEffect(() => {
    loadUserData();
    fetchUnreadCount();
    const interval = setInterval(() => {
      loadUserData();
      fetchUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name) => {
    if (!name || name === "User") return "U";
    return name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleNavClick = () => {
    if (isMobileScreen && onClose) {
      onClose();
    }
  };

  const confirmLogout = () => {
    // Keep the chosen light/dark theme across logouts
    const savedTheme = localStorage.getItem("theme");
    localStorage.clear();
    if (savedTheme) localStorage.setItem("theme", savedTheme);
    window.location.href = "/";
  };

  const isAdmin = userRole === "Admin";

  return (
    <>
      <style>{sidebarCss}</style>

      {/* Mobile Backdrop */}
      {isMobileScreen && isOpen && (
        <div className="sb-backdrop" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <aside
        className="sb-root sb-theme"
        style={{
          "--brand": primaryColor,
          transform: isMobileScreen
            ? (isOpen ? "translateX(0)" : "translateX(-100%)")
            : "translateX(0)"
        }}
      >
        {/* Brand */}
        <div className="sb-brand" onClick={() => { navigate("/dashboard"); handleNavClick(); }}>
          {loading ? (
            <div className="sb-skeleton-row">
              <div className="sb-skeleton sb-skeleton-logo" />
              <div className="sb-skeleton sb-skeleton-text" />
            </div>
          ) : (
            <>
              <img
                className="sb-logo"
                src={branding?.logoUrl || logoFallback}
                alt={branding?.companyName || "PromiAPI"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = logoFallback;
                }}
              />
              {(!branding?.companyName || branding.companyName === "PromiAPI") ? (
                <h2 className="sb-brand-name">
                  <span className="sb-brand-a">Promi</span>
                  <span className="sb-brand-b">API</span>
                </h2>
              ) : (
                <h2 className="sb-brand-name sb-brand-custom">{branding.companyName}</h2>
              )}
            </>
          )}
          {isMobileScreen && (
            <button
              type="button"
              className="sb-close"
              aria-label="Close menu"
              onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}
            >
              {icons.close}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sb-nav" aria-label="Main navigation">
          <p className="sb-section">Overview</p>
          <NavItem to="/dashboard" end icon={icons.dashboard} label="Dashboard" onClick={handleNavClick} />
          <NavItem to="/dashboard/analytics" icon={icons.analytics} label="Analytics" onClick={handleNavClick} />

          <p className="sb-section">Messaging</p>
          <NavItem
            to="/dashboard/chats"
            icon={icons.chat}
            label="Chats"
            onClick={handleNavClick}
            badge={unreadChatsCount > 0 && (
              <span className="sb-badge" aria-label={`${unreadChatsCount} unread chats`}>
                {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
              </span>
            )}
          />
          <NavItem to="/dashboard/campaigns" icon={icons.campaign} label="Campaigns" onClick={handleNavClick} />
          <NavItem to="/dashboard/contacts" icon={icons.contacts} label="Contacts" onClick={handleNavClick} />
          <NavItem to="/dashboard/templates" icon={icons.templates} label="Templates" onClick={handleNavClick} />
          <NavItem to="/dashboard/qr" icon={icons.qrCode} label="QR Code" onClick={handleNavClick} />
          <NavItem to="/dashboard/logs" icon={icons.logs} label="Message Log" onClick={handleNavClick} />

          <p className="sb-section">Automation</p>
          <NavGroup icon={icons.bot} label="Bot Replies" open={isBotOpen} active={inBotSection} onToggle={() => setIsBotOpen(!isBotOpen)}>
            <SubItem to="/dashboard/bot-replies" icon={icons.rulesList} label="All Rules" onClick={handleNavClick} />
            <SubItem to="/dashboard/bot-replies/new" icon={icons.createRule} label="Create Rule" onClick={handleNavClick} />
            <SubItem to="/dashboard/bot-builder" icon={icons.botBuilder} label="Bot Builder" onClick={handleNavClick} />
          </NavGroup>

          {isAdmin && (
            <>
              <p className="sb-section">Account</p>
              <NavItem to="/dashboard/team" icon={icons.team} label="Team Members" onClick={handleNavClick} />
              <NavItem to="/dashboard/subscription" icon={icons.subscription} label="My Subscription" onClick={handleNavClick} />
              <NavGroup icon={icons.settings} label="Settings" open={isSettingsOpen} active={inSettingsSection} onToggle={() => setIsSettingsOpen(!isSettingsOpen)}>
                <SubItem to="/dashboard/settings/general" icon={icons.general} label="General Settings" onClick={handleNavClick} />
                <SubItem to="/dashboard/settings/ai-chatbot" icon={icons.bot} label="AI Bot & Settings" onClick={handleNavClick} />
                <SubItem to="/dashboard/settings/whatsapp" icon={icons.whatsapp} label="Social Channels Setup" onClick={handleNavClick} />
                <SubItem to="/dashboard/integrations" icon={icons.integrations} label="Integrations" onClick={handleNavClick} />
              </NavGroup>
            </>
          )}
        </nav>

        {/* Footer: user + logout */}
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar-wrap">
              {userAvatar ? (
                <div className="sb-avatar">
                  <SecureAvatar src={userAvatar} alt={userName} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                </div>
              ) : (
                <div className="sb-avatar sb-avatar-initials">{getInitials(userName)}</div>
              )}
              <span className="sb-online" aria-hidden="true"></span>
            </div>
            <div className="sb-user-text">
              <p className="sb-user-name" title={userName}>{userName}</p>
              <span className="sb-user-role">{isAdmin ? "Vendor Admin" : "Team Agent"}</span>
            </div>
          </div>
          <button type="button" className="sb-logout" onClick={() => setShowLogoutModal(true)}>
            {icons.logout}
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Logout dialog (rendered in a portal) */}
      {createPortal(
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              className="sb-theme sb-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                className="sb-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sb-logout-title"
                initial={{ scale: 0.94, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 8 }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sb-modal-icon">{icons.logoutLarge}</div>
                <h3 id="sb-logout-title" className="sb-modal-title">Log out of your account?</h3>
                <p className="sb-modal-text">You’ll need to sign in again to get back to your workspace.</p>
                <div className="sb-modal-actions">
                  <button type="button" className="sb-btn sb-btn-ghost" autoFocus onClick={() => setShowLogoutModal(false)}>Stay signed in</button>
                  <button type="button" className="sb-btn sb-btn-danger" onClick={confirmLogout}>Log out</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/*
  THEME
  Same rule as the dashboard — no toggle in this file:
    <html data-theme="dark"> or class "dark"  → dark
    <html data-theme="light"> or class "light" → light
    nothing set → follows the device setting
*/
const lightVars = `
  --sb-bg: #ffffff;
  --sb-border: #e3e8f0;
  --sb-strong: #0f172a;
  --sb-text: #475569;
  --sb-muted: #8391a7;
  --sb-hover: #f1f5f9;
  --sb-track: #e8edf5;
  --sb-danger: #dc2626;
  --sb-danger-soft: rgba(220, 38, 38, 0.08);
  --sb-overlay: rgba(15, 23, 42, 0.45);
  --sb-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
`;
const darkVars = `
  --sb-bg: #0c1424;
  --sb-border: #1b2740;
  --sb-strong: #f1f5fb;
  --sb-text: #aab6cc;
  --sb-muted: #6f7d99;
  --sb-hover: rgba(255, 255, 255, 0.06);
  --sb-track: #1b2740;
  --sb-danger: #f87171;
  --sb-danger-soft: rgba(248, 113, 113, 0.12);
  --sb-overlay: rgba(3, 7, 18, 0.7);
  --sb-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7);
`;

const sidebarCss = `
  .sb-theme { ${lightVars} }
  :is([data-theme="dark"], .dark) .sb-theme { ${darkVars} }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]):not(.light):not(.dark) .sb-theme { ${darkVars} }
  }

  .sb-root, .sb-root *, .sb-modal, .sb-modal * { box-sizing: border-box; }
  .sb-root {
    position: fixed; left: 0; top: 0; z-index: 1000;
    width: 270px; height: 100vh;
    display: flex; flex-direction: column;
    background: var(--sb-bg); color: var(--sb-text);
    border-right: 1px solid var(--sb-border);
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    transition: transform 0.3s ease-in-out, background-color 0.25s ease, border-color 0.25s ease;
  }
  .sb-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); z-index: 999; }

  /* Brand */
  .sb-brand { display: flex; align-items: center; gap: 12px; height: 83px; padding: 0 20px; border-bottom: 1px solid var(--sb-border); cursor: pointer; flex-shrink: 0; }
  .sb-logo { height: 40px; width: 40px; object-fit: contain; border-radius: 8px; flex-shrink: 0; }
  .sb-brand-name { margin: 0; font-size: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .sb-brand-a { font-weight: 800; color: var(--sb-strong); letter-spacing: -0.5px; }
  .sb-brand-b { font-weight: 700; margin-left: 2px; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .sb-brand-custom { font-size: 18px; font-weight: 600; color: var(--sb-strong); }
  .sb-close { margin-left: auto; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--sb-text); border-radius: 8px; cursor: pointer; flex-shrink: 0; }
  .sb-close:hover { background: var(--sb-hover); }
  .sb-skeleton-row { display: flex; align-items: center; gap: 12px; width: 100%; }
  .sb-skeleton { background: var(--sb-track); border-radius: 6px; opacity: 0.8; }
  .sb-skeleton-logo { width: 40px; height: 40px; }
  .sb-skeleton-text { width: 110px; height: 18px; }

  /* Navigation */
  .sb-nav { flex: 1; overflow-y: auto; padding: 8px 12px 16px; display: flex; flex-direction: column; gap: 2px; scrollbar-width: thin; scrollbar-color: var(--sb-border) transparent; }
  .sb-nav::-webkit-scrollbar { width: 6px; }
  .sb-nav::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 6px; }
  .sb-section { margin: 16px 0 6px; padding: 0 12px; font-size: 12px; font-weight: 600; color: var(--sb-muted); letter-spacing: 0.2px; }
  .sb-section:first-child { margin-top: 8px; }

  .sb-link { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: none; background: transparent; border-radius: 10px; color: var(--sb-text); font-family: inherit; font-size: 14.5px; font-weight: 500; text-decoration: none; text-align: left; cursor: pointer; transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease; }
  .sb-link:hover { background: var(--sb-hover); color: var(--sb-strong); }
  .sb-link.is-active { background: var(--brand); color: #ffffff; font-weight: 600; box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--brand) 70%, transparent); }
  .sb-link.is-parent-active { color: var(--sb-strong); font-weight: 600; }
  .sb-link.is-parent-active .sb-icon { color: var(--brand); }
  .sb-icon { display: flex; flex-shrink: 0; }
  .sb-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-chevron { display: flex; color: var(--sb-muted); transition: transform 0.2s ease; }
  .sb-chevron.is-open { transform: rotate(180deg); }

  .sb-badge { background: #ef4444; color: #ffffff; font-size: 11px; font-weight: 700; line-height: 1; padding: 4px 7px; border-radius: 999px; min-width: 20px; text-align: center; }

  .sb-submenu { margin: 4px 0 6px 21px; padding-left: 10px; border-left: 1px solid var(--sb-border); display: flex; flex-direction: column; gap: 2px; }
  .sb-sublink { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; color: var(--sb-text); font-size: 13.5px; font-weight: 500; text-decoration: none; transition: background-color 0.18s ease, color 0.18s ease; }
  .sb-sublink:hover { background: var(--sb-hover); color: var(--sb-strong); }
  .sb-sublink.is-active { color: var(--brand); background: color-mix(in srgb, var(--brand) 12%, transparent); font-weight: 600; }

  /* Footer */
  .sb-footer { padding: 14px 16px 16px; border-top: 1px solid var(--sb-border); flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
  .sb-user { display: flex; align-items: center; gap: 12px; padding: 4px 4px 0; }
  .sb-avatar-wrap { position: relative; flex-shrink: 0; }
  .sb-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; }
  .sb-avatar-initials { display: flex; align-items: center; justify-content: center; background: var(--brand); color: #ffffff; font-weight: 700; font-size: 14px; }
  .sb-online { position: absolute; right: -1px; bottom: -1px; width: 11px; height: 11px; border-radius: 50%; background: #22c55e; border: 2px solid var(--sb-bg); }
  .sb-user-text { min-width: 0; }
  .sb-user-name { margin: 0; font-size: 14px; font-weight: 600; color: var(--sb-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-user-role { display: block; margin-top: 2px; font-size: 12px; color: var(--sb-muted); }
  .sb-logout { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--sb-border); background: transparent; color: var(--sb-text); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease; }
  .sb-logout:hover { background: var(--sb-danger-soft); color: var(--sb-danger); border-color: color-mix(in srgb, var(--sb-danger) 40%, var(--sb-border)); }

  /* Logout dialog */
  .sb-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--sb-overlay); backdrop-filter: blur(4px); font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .sb-modal { width: 100%; max-width: 380px; background: var(--sb-bg); border: 1px solid var(--sb-border); border-radius: 18px; padding: 28px 24px 24px; text-align: center; box-shadow: var(--sb-shadow); }
  .sb-modal-icon { width: 54px; height: 54px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: var(--sb-danger-soft); color: var(--sb-danger); }
  .sb-modal-title { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: var(--sb-strong); }
  .sb-modal-text { margin: 0 0 24px; font-size: 14px; line-height: 1.55; color: var(--sb-text); }
  .sb-modal-actions { display: flex; gap: 10px; }
  .sb-btn { flex: 1; padding: 11px 14px; border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.18s ease, opacity 0.18s ease; }
  .sb-btn-ghost { background: transparent; border: 1px solid var(--sb-border); color: var(--sb-strong); }
  .sb-btn-ghost:hover { background: var(--sb-hover); }
  .sb-btn-danger { background: #dc2626; border: 1px solid #dc2626; color: #ffffff; }
  .sb-btn-danger:hover { background: #b91c1c; border-color: #b91c1c; }

  /* Keyboard focus + reduced motion */
  .sb-link:focus-visible, .sb-sublink:focus-visible, .sb-logout:focus-visible, .sb-btn:focus-visible, .sb-close:focus-visible, .sb-brand:focus-visible { outline: 2px solid var(--brand, #2563eb); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    .sb-root, .sb-root *, .sb-modal * { transition: none !important; }
  }
`;

export default Sidebar;
