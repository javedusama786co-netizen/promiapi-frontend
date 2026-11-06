import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import axios from "axios";
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
    userObj.email?.split("@")[0] || 
    "User"
  );
};

async function getCroppedImg(image, crop) {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      blob.name = "cropped-avatar.jpg";
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
}

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

  if (loading) return <div className="hdr-skel" style={style} />;
  if (!objectUrl) return null;

  return <img src={objectUrl} alt={alt} style={style} />;
};

// ---------- Notification helpers (UI only) ----------
const tsOf = (n) => {
  const t = new Date(n.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const timeAgo = (ts) => {
  if (!ts) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" });
};

const groupLabel = (ts) => {
  if (!ts) return "Earlier";
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const day = 24 * 60 * 60 * 1000;
  if (ts >= startToday.getTime()) return "Today";
  if (ts >= startToday.getTime() - day) return "Yesterday";
  if (ts >= startToday.getTime() - 6 * day) return "This week";
  return "Earlier";
};

const notifKind = (n) => {
  const text = `${n.type || ""} ${n.title || ""} ${n.message || ""}`.toLowerCase();
  if (/fail|error|cancel|reject|declin|expire|blocked|limit/.test(text)) return "error";
  if (/campaign/.test(text)) return "campaign";
  if (/success|complet|sent|deliver|connect|paid|activat|subscri|upgrad/.test(text)) return "success";
  if (/warn|pending|low |alert|attention/.test(text)) return "warning";
  return "info";
};

const KIND_TONE = { error: "#e11d48", campaign: "#6246ea", success: "#059669", warning: "#d97706", info: "#2f7cf6" };

const KIND_PATH = {
  error: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  success: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  campaign: <><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
  warning: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
};

const Ico = ({ children, size = 18, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ease = [0.22, 1, 0.36, 1];

// ---------- Subscription state reader ----------
// The old check treated `success === true` as "subscribed". Almost every API answers { success: true } even when the
// plan is expired / missing, so the "inactive subscription" alert could never appear. This reads the real signals:
// expiry date, explicit flags, status text, or an empty subscription. It returns true / false, or null = "cannot tell"
// (then the previous value is kept, so a failed request never flips the alert on or off by mistake).
const ACTIVE_WORDS = ["active", "trialing", "trial", "paid", "running", "current", "valid", "subscribed"];
const INACTIVE_WORDS = ["inactive", "expired", "cancelled", "canceled", "none", "unpaid", "past_due", "pastdue", "suspended", "pending", "incomplete", "ended", "terminated", "free", "no_subscription", "nosubscription", "not_subscribed"];
const statusToBool = (s) => {
  if (typeof s !== "string") return undefined;
  const v = s.trim().toLowerCase();
  if (!v) return undefined;
  if (INACTIVE_WORDS.includes(v)) return false;
  if (ACTIVE_WORDS.includes(v)) return true;
  return undefined;
};

const readSubscriptionState = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const inner = raw.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : {};
  const root = { ...raw, ...inner };
  const subRaw = root.subscription !== undefined ? root.subscription : root.userSubscription;
  const sub = subRaw && typeof subRaw === "object" ? subRaw : null;

  // 1) an end date in the past always means "not active"
  const endRaw =
    sub?.endDate || sub?.expiresAt || sub?.expiryDate || sub?.currentPeriodEnd || sub?.validUntil ||
    root.endDate || root.expiresAt || root.expiryDate || root.currentPeriodEnd || root.validUntil;
  const endTs = endRaw ? new Date(endRaw).getTime() : NaN;
  if (!Number.isNaN(endTs) && endTs < Date.now()) return false;

  // 2) explicit yes / no flags
  const flag = [root.active, root.isActive, root.subscribed, root.isSubscribed, root.hasActiveSubscription, root.subscriptionActive, sub?.active, sub?.isActive]
    .find((v) => typeof v === "boolean");
  if (flag !== undefined) return flag;

  // 3) status text
  for (const s of [root.status, root.subscriptionStatus, sub?.status, sub?.subscriptionStatus]) {
    const b = statusToBool(s);
    if (b !== undefined) return b;
  }

  // 4) "no subscription" answers, or a subscription object with nothing negative in it
  if ((subRaw === null || subRaw === false) && ("subscription" in root || "userSubscription" in root)) return false;
  if (sub) return true;
  return null;
};

// Account / settings pages shown in the profile menu. The paths are the SAME ones the sidebar links to
// (see Sidebar.jsx). Settings pages are for admins only, exactly like in the sidebar.
const SETTINGS_LINKS = [
  { to: "/dashboard/settings/general", label: "General Settings", icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
  { to: "/dashboard/settings/ai-chatbot", label: "AI Bot & Settings", icon: <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 16h.01M16 16h.01" /></> },
  { to: "/dashboard/settings/whatsapp", label: "Social Channels Setup", icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> },
  { to: "/dashboard/integrations", label: "Integrations", icon: <><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" /></> },
  { to: "/dashboard/team", label: "Team Members", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></> },
  { to: "/dashboard/subscription", label: "Subscription & Billing", icon: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></> },
];

const hpList = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } } };
const hpItem = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2, ease } } };

function Header({ toggleSidebar }) {
  const { branding } = useBranding();
  const primaryColor = branding?.primaryColor || "#2563eb";

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Logout confirmation state
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState({ name: "User", role: "Client", avatar: "" });
  const [isSubscribed, setIsSubscribed] = useState(null); // null = not known yet (no alert until we know)
  const [userEmail, setUserEmail] = useState("");
  const [chatOpenMobile, setChatOpenMobile] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("hdr_sub_alert_dismissed") === "1"; } catch (e) { return false; }
  });

  // Modal States
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [onlineUrlInput, setOnlineUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [uploading, setUploading] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const modalFileInputRef = useRef(null);
  const imgRef = useRef(null);

  const fetchHeaderData = async () => {
    try {
      const token = localStorage.getItem("token");
      const savedUserCheck = localStorage.getItem("user");
      
      let localUserParsed = null;
      if (savedUserCheck) {
        try {
          localUserParsed = JSON.parse(savedUserCheck);
        } catch (e) {}
      }

      if (localUserParsed) {
        setUserEmail(localUserParsed.email || "");
        setUser({
          name: extractUserName(localUserParsed),
          role: localUserParsed.role || "Client",
          avatar: formatAvatarUrl(localUserParsed.avatar || localUserParsed.profilePic || "")
        });
      }

      if (!token) return;

      const notifResponse = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (notifResponse && notifResponse.data) {
        setNotifications(notifResponse.data.notifications || []);
        setUnreadCount(notifResponse.data.unreadCount || 0);
      }

      const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })).catch(() => null);

      let currentRole = "Client";

      if (profileResponse && profileResponse.data) {
        const liveUser = profileResponse.data.user || profileResponse.data.data || profileResponse.data;
        const realName = extractUserName(liveUser);
        
        const rawAvatar = liveUser.avatar || liveUser.profilePic || localUserParsed?.avatar || "";
        const avatarUrl = formatAvatarUrl(rawAvatar);
        currentRole = liveUser.role || localUserParsed?.role || "Client";
        setUserEmail(liveUser.email || localUserParsed?.email || "");

        setUser({ name: realName, role: currentRole, avatar: avatarUrl });
        
        localStorage.setItem("user", JSON.stringify({ 
          ...(localUserParsed || {}), 
          ...liveUser, 
          name: realName,
          avatar: avatarUrl,
          profilePic: avatarUrl
        }));
      }

      if (String(currentRole).toLowerCase() === "agent") {
        setIsSubscribed(true);
      } else {
        let subStatus = null;
        const subResponse = await axios.get(`${API_BASE_URL}/api/subscription/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch((err) => {
          if (err?.response?.status === 402) subStatus = false; // 402 Payment Required = no active plan
          return null;
        });

        if (subResponse && subResponse.data) {
          const parsed = readSubscriptionState(subResponse.data);
          if (parsed !== null) subStatus = parsed;
          else console.info("[Header] Could not read the subscription answer, check its shape:", subResponse.data);
        }

        // request failed completely: fall back to what the saved user record says (no guessing from "status")
        if (subStatus === null && localUserParsed) {
          subStatus = readSubscriptionState({
            subscribed: localUserParsed.subscribed,
            isSubscribed: localUserParsed.isSubscribed,
            subscriptionStatus: localUserParsed.subscriptionStatus,
          });
        }

        if (subStatus !== null) setIsSubscribed(subStatus);
      }

    } catch (error) {
      console.error("Failed to load header data:", error);
    }
  };

  const handleOpenModal = () => {
    setShowCropModal(true);
    setShowProfileMenu(false);
    setSelectedImageSrc(user.avatar || null);
    setShowUrlInput(false);
    setOnlineUrlInput("");
  };

  const handleSelectFileFromDevice = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImageSrc(reader.result?.toString() || null);
        setShowUrlInput(false);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleApplyOnlineUrl = () => {
    if (onlineUrlInput.trim()) {
      setSelectedImageSrc(onlineUrlInput.trim());
      setShowUrlInput(false);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleSaveCroppedImage = async () => {
    try {
      setUploading(true);
      let updatedAvatar = selectedImageSrc;

      if (imgRef.current && completedCrop) {
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        const formData = new FormData();
        formData.append("avatar", croppedBlob, "profile.jpg");

        const token = localStorage.getItem("token");
        const response = await axios.post(`${API_BASE_URL}/api/auth/profile/avatar`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const rawAvatar = 
          response.data?.avatar || 
          response.data?.user?.avatar || 
          response.data?.profilePic || 
          response.data?.filePath || 
          response.data?.url ||
          response.data?.path;

        updatedAvatar = rawAvatar ? formatAvatarUrl(rawAvatar) : URL.createObjectURL(croppedBlob);
      } else if (selectedImageSrc && selectedImageSrc.startsWith("http")) {
        const token = localStorage.getItem("token");
        await axios.put(`${API_BASE_URL}/api/auth/profile`, { avatar: selectedImageSrc }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
      }

      setUser(prev => ({ ...prev, avatar: updatedAvatar }));
      
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ 
        ...localUser, 
        avatar: updatedAvatar,
        profilePic: updatedAvatar 
      }));

      setShowCropModal(false);
    } catch (error) {
      console.error("Failed to upload cropped avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      
      await axios.delete(`${API_BASE_URL}/api/auth/profile/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      setUser(prev => ({ ...prev, avatar: "" }));

      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ 
        ...localUser, 
        avatar: "",
        profilePic: "" 
      }));

      setShowCropModal(false);
      setSelectedImageSrc(null);
    } catch (err) {
      console.error("Failed to remove avatar:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    setShowProfileMenu(false);

    if (nextState && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      try {
        await markAllAsRead();
      } catch (err) {
        console.error("Failed to sync read status:", err);
      }
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHeaderData();
    } catch (error) {
      console.error("Error updating notification status:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const unreadNotifs = notifications.filter(n => !n.isRead);
      if (unreadNotifs.length === 0) return;

      // Single efficient bulk request instead of multiple promises
      await axios.put(`${API_BASE_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Bulk read conversion failed:", error);
    }
  };

  const handleOpenLogoutModal = () => {
    setShowProfileMenu(false);
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/login");
  };

  useEffect(() => {
    fetchHeaderData();
    const interval = setInterval(() => { if (!document.hidden) fetchHeaderData(); }, 10000);
    const onVisible = () => { if (!document.hidden) fetchHeaderData(); };
    document.addEventListener("visibilitychange", onVisible);

    const handleCampaignNotification = () => fetchHeaderData();
    window.addEventListener("campaignCompleted", handleCampaignNotification);

    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("campaignCompleted", handleCampaignNotification);
      clearInterval(interval);
    };
  }, []);

  const getInitials = (name) => {
    if (!name || name === "User") return "U";
    return name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPageTitle = () => {
    const path = location.pathname.toLowerCase();
    if (path === "/dashboard/bot-builder") return "Visual Bot Flow Builder";
    if (path === "/dashboard/bot-replies/new") return "Create New Bot Rule";
    if (path.includes("/dashboard/bot-replies")) return "Bot Rules Engine";
    if (path.includes("/dashboard/campaigns")) return "Campaigns Platform";
    if (path.includes("/contacts")) return "Contacts Database";
    if (path.includes("/templates")) return "Message Templates";
    if (path.includes("/dashboard/logs")) return "System Activity Logs";
    if (path.includes("/dashboard/chats")) return "Live Conversational Hub";
    if (path.includes("/dashboard/settings/general")) return "General Settings";
    if (path.includes("/dashboard/settings/ai-chatbot")) return "AI Bot & Settings";
    if (path.includes("/dashboard/settings/whatsapp")) return "Social Channels Setup";
    if (path.includes("/dashboard/settings")) return "Global System Configurations";
    if (path.includes("/dashboard/integrations")) return "Integrations";
    if (path.includes("/dashboard/analytics")) return "Analytics";
    if (path.includes("/dashboard/qr")) return "Growth Tools";
    if (path.includes("/dashboard/team")) return "Team Members";
    if (path.includes("/dashboard/subscription")) return "My Subscription";
    return "Control Dashboard";
  };

  // ---------- UI-only state (does not touch data logic above) ----------
  const [notifTab, setNotifTab] = useState("all");
  const [freshIds, setFreshIds] = useState(() => new Set());
  const [ringBell, setRingBell] = useState(false);
  const prevUnread = useRef(null);

  // Ring the bell when a new notification arrives
  useEffect(() => {
    if (prevUnread.current !== null && unreadCount > prevUnread.current) {
      setRingBell(true);
      const t = setTimeout(() => setRingBell(false), 1400);
      prevUnread.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  // Reset notification view when the panel closes
  useEffect(() => {
    if (!showNotifications) {
      setNotifTab("all");
      setFreshIds(new Set());
    }
  }, [showNotifications]);

  // Escape closes any open popover / modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowCropModal(false);
        setShowLogoutModal(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // MOBILE ONLY: while a conversation is open in Chats, the header steps aside so the chat gets the whole screen.
  // (Chats shows `.chat-area .chat-header` on phones only after a chat is opened; the back arrow brings the list back.)
  useEffect(() => {
    if (!location.pathname.toLowerCase().includes("/dashboard/chats")) {
      setChatOpenMobile(false);
      return undefined;
    }
    let raf = 0;
    const check = () => {
      raf = 0;
      const open = window.innerWidth <= 768 && !!document.querySelector(".chats-root .chat-area .chat-header");
      setChatOpenMobile((prev) => (prev === open ? prev : open));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [location.pathname]);

  // lets the chat screen use the full height while the header is hidden, and closes any open popover
  useEffect(() => {
    document.body.classList.toggle("pm-chat-open", chatOpenMobile);
    if (chatOpenMobile) {
      setShowNotifications(false);
      setShowProfileMenu(false);
    }
    return () => document.body.classList.remove("pm-chat-open");
  }, [chatOpenMobile]);

  const pageTitle = getPageTitle();
  const isAgent = String(user.role || "").toLowerCase() === "agent";
  const showUpsell = !isAgent && isSubscribed === false;
  const onSubscriptionPage = location.pathname.toLowerCase().includes("/subscription");
  const showBanner = showUpsell && !bannerDismissed && !onSubscriptionPage;

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { sessionStorage.setItem("hdr_sub_alert_dismissed", "1"); } catch (e) { /* ignore */ }
  };
  // a fresh "inactive" result after the user had dismissed it earlier is still dismissed for this session only
  const goTo = (path) => {
    setShowProfileMenu(false);
    setShowNotifications(false);
    navigate(path);
  };

  // Notifications view-model: opening the bell clears the badge (existing behavior),
  // but items that were unread stay highlighted until the panel closes.
  const isUnread = (n) => !n.isRead || freshIds.has(n._id);
  const sortedNotifs = [...notifications].sort((a, b) => tsOf(b) - tsOf(a));
  const unreadTotal = notifications.filter(isUnread).length;
  const visibleNotifs = notifTab === "unread" ? sortedNotifs.filter(isUnread) : sortedNotifs;
  const groups = [];
  visibleNotifs.forEach((n) => {
    const label = groupLabel(tsOf(n));
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(n);
  });

  const onBellClick = () => {
    if (!showNotifications) {
      setFreshIds(new Set(notifications.filter((n) => !n.isRead).map((n) => n._id)));
    }
    handleToggleNotifications();
  };

  const onMarkAll = async () => {
    await markAllAsRead();
    fetchHeaderData();
    setFreshIds(new Set());
  };

  const onItemClick = (n) => {
    handleMarkAsRead(n._id, n.isRead);
    setFreshIds((prev) => {
      const next = new Set(prev);
      next.delete(n._id);
      return next;
    });
    const link = n.link || n.url;
    if (typeof link === "string" && link.startsWith("/")) {
      setShowNotifications(false);
      navigate(link);
    }
  };

  const avatarNode = (size = 38) =>
    user.avatar ? (
      <SecureAvatar src={user.avatar} alt={user.name} style={{ width: size, height: size, borderRadius: 12, objectFit: "cover", display: "block" }} />
    ) : (
      <div className="hdr-avatar-fallback" style={{ width: size, height: size }}>
        {getInitials(user.name)}
      </div>
    );

  let itemIndex = 0;

  return (
    <div className="hdr-scope" style={{ "--brand": primaryColor, display: "contents" }}>
      <MotionConfig reducedMotion="user">
        <style>{css}</style>

        <header className={`hdr${chatOpenMobile ? " hdr--chat" : ""}`}>
          {/* LEFT: burger + title */}
          <div className="hdr-left">
            <button type="button" className="hdr-burger" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <Ico size={20} sw={2.4}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></Ico>
            </button>
            <span className="hdr-bar" />
            <div className="hdr-titles">
            <span className="hdr-eyebrow">Workspace</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={pageTitle}
                className="hdr-title"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease }}
              >
                {pageTitle}
              </motion.h2>
            </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: actions */}
          <div className="hdr-right">
            {/* GO PRO */}
            <AnimatePresence>
              {showUpsell && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/dashboard/subscription")}
                  className="hdr-pro"
                >
                  <Ico size={15} sw={2.4}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.28 1.28L3 12l5.8 1.9a2 2 0 0 1 1.28 1.28L12 21l1.9-5.8a2 2 0 0 1 1.28-1.28L21 12l-5.8-1.9a2 2 0 0 1-1.28-1.28L12 3z" /></Ico>
                  <span className="hdr-pro-text">Go Pro</span>
                  <span className="hdr-pro-dot" aria-hidden="true" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* NOTIFICATIONS */}
            <div className="hdr-pop" ref={notifRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={onBellClick}
                className={`hdr-icon${showNotifications ? " is-open" : ""}`}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                aria-haspopup="dialog"
                aria-expanded={showNotifications}
              >
                <span className={`hdr-bell${ringBell ? " is-ringing" : ""}${unreadCount > 0 ? " has-unread" : ""}`}>
                  <Ico size={19} sw={2.1}>{KIND_PATH.info}</Ico>
                </span>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      className="hdr-badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    >
                      {ringBell && <span className="hdr-ping" />}
                      <span>{unreadCount > 9 ? "9+" : unreadCount}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    key="notif-panel"
                    role="dialog"
                    aria-label="Notifications"
                    className="hn-panel"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  >
                    <div className="hn-head">
                      <div>
                        <h3 className="hn-title">Notifications</h3>
                        <span className="hn-sub">{unreadTotal > 0 ? `${unreadTotal} unread` : "You're all caught up"}</span>
                      </div>
                      {unreadTotal > 0 && (
                        <button type="button" className="hn-markall" onClick={onMarkAll}>
                          <Ico size={14} sw={2.6}><polyline points="20 6 9 17 4 12" /></Ico>
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="hn-tabs" role="tablist">
                      {[
                        { id: "all", label: "All", count: notifications.length },
                        { id: "unread", label: "Unread", count: unreadTotal },
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          role="tab"
                          aria-selected={notifTab === t.id}
                          className={`hn-tab${notifTab === t.id ? " is-active" : ""}`}
                          onClick={() => setNotifTab(t.id)}
                        >
                          <span>{t.label}</span>
                          <i>{t.count}</i>
                          {notifTab === t.id && <motion.span layoutId="hn-tab-line" className="hn-tab-line" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                        </button>
                      ))}
                    </div>

                    <div className="hn-list">
                      {groups.length === 0 ? (
                        <div className="hn-empty">
                          <div className="hn-empty-art">
                            <Ico size={28} sw={1.8}>{KIND_PATH.info}</Ico>
                            <span className="hn-empty-spark" />
                          </div>
                          <strong>{notifTab === "unread" ? "No unread notifications" : "No notifications yet"}</strong>
                          <span>{notifTab === "unread" ? "You're all caught up. Nice work!" : "Campaign updates and system alerts will show up here."}</span>
                        </div>
                      ) : (
                        groups.map((g) => (
                          <div key={g.label} className="hn-group">
                            <div className="hn-group-label">{g.label}</div>
                            {g.items.map((n) => {
                              const kind = notifKind(n);
                              const unread = isUnread(n);
                              const delay = Math.min(itemIndex++, 8) * 0.03;
                              return (
                                <motion.button
                                  type="button"
                                  key={n._id}
                                  className={`hn-item${unread ? " is-unread" : ""}`}
                                  style={{ "--k": KIND_TONE[kind] }}
                                  onClick={() => onItemClick(n)}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay, ease }}
                                >
                                  <span className="hn-icon"><Ico size={17} sw={2.1}>{KIND_PATH[kind]}</Ico></span>
                                  <span className="hn-body">
                                    {n.title && <span className="hn-item-title">{n.title}</span>}
                                    <span className="hn-msg">{n.message}</span>
                                    <span className="hn-time">{timeAgo(tsOf(n))}</span>
                                  </span>
                                  {unread && <span className="hn-dot" aria-label="Unread" />}
                                </motion.button>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="hdr-sep" />

            {/* PROFILE */}
            <div className="hdr-pop" ref={profileRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className={`hdr-profile${showProfileMenu ? " is-open" : ""}`}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
              >
                <span className="hdr-avatar">
                  {avatarNode(36)}
                  <span className="hdr-online" />
                </span>
                <span className="hdr-pinfo">
                  <span className="hdr-pname">{user.name}</span>
                  <span className="hdr-prole">{user.role}</span>
                </span>
                <motion.span className="hdr-chev" animate={{ rotate: showProfileMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <Ico size={14} sw={2.6}><polyline points="6 9 12 15 18 9" /></Ico>
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    key="profile-menu"
                    role="menu"
                    className="hp-panel"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  >
                    <div className="hp-banner">
                      <div className="hp-avatar">
                        {avatarNode(48)}
                        <button type="button" onClick={handleOpenModal} className="hp-camera" title="Upload Avatar" aria-label="Upload Avatar">
                          <Ico size={11} sw={2.6}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Ico>
                        </button>
                      </div>
                      <div className="hp-who">
                        <span className="hp-name">{user.name}</span>
                        {userEmail && <span className="hp-email">{userEmail}</span>}
                        <span className="hp-role">{user.role}</span>
                      </div>
                    </div>

                    {!isAgent && isSubscribed !== null && (
                      <div className="hp-plan">
                        <span className="hp-plan-l">
                          <i className={`hp-plan-dot ${isSubscribed ? "on" : "off"}`} />
                          <span>Subscription<b>{isSubscribed ? "Active" : "Not active"}</b></span>
                        </span>
                        {!isSubscribed && (
                          <button type="button" className="hp-plan-btn" onClick={() => goTo("/dashboard/subscription")}>Upgrade</button>
                        )}
                      </div>
                    )}

                    <motion.div className="hp-items" variants={hpList} initial="hidden" animate="show">
                      <div className="hp-label">Account</div>
                      <motion.button variants={hpItem} type="button" role="menuitem" className="hp-item" onClick={handleOpenModal}>
                        <span className="hp-ic"><Ico size={16}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Ico></span>
                        Change Picture
                        <span className="hp-go"><Ico size={14} sw={2.4}><polyline points="9 18 15 12 9 6" /></Ico></span>
                      </motion.button>
                      <motion.button
                        variants={hpItem}
                        type="button"
                        role="menuitem"
                        className="hp-item"
                        onClick={() => { setShowProfileMenu(false); if (!showNotifications) onBellClick(); }}
                      >
                        <span className="hp-ic"><Ico size={16}>{KIND_PATH.info}</Ico></span>
                        Notifications
                        {unreadCount > 0 && <span className="hp-go" style={{ opacity: 1, transform: "none", color: "#e11d48", fontWeight: 800, fontSize: 12 }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
                      </motion.button>

                      {!isAgent && (
                        <>
                          <div className="hp-div" />
                          <div className="hp-label">Settings</div>
                          {SETTINGS_LINKS.map((item) => (
                            <motion.button
                              key={item.to}
                              variants={hpItem}
                              type="button"
                              role="menuitem"
                              className={`hp-item${location.pathname.toLowerCase().startsWith(item.to) ? " is-current" : ""}`}
                              onClick={() => goTo(item.to)}
                            >
                              <span className="hp-ic"><Ico size={16}>{item.icon}</Ico></span>
                              {item.label}
                              <span className="hp-go"><Ico size={14} sw={2.4}><polyline points="9 18 15 12 9 6" /></Ico></span>
                            </motion.button>
                          ))}
                        </>
                      )}

                      <div className="hp-div" />
                      <div className="hp-label">Support</div>
                      <motion.button variants={hpItem} type="button" role="menuitem" className="hp-item" onClick={() => { setShowProfileMenu(false); window.location.href = "mailto:support@promiapi.com"; }}>
                        <span className="hp-ic"><Ico size={16}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></Ico></span>
                        Help &amp; Support
                        <span className="hp-go"><Ico size={14} sw={2.4}><polyline points="9 18 15 12 9 6" /></Ico></span>
                      </motion.button>

                      <div className="hp-div" />
                      <motion.button variants={hpItem} type="button" role="menuitem" className="hp-item is-danger" onClick={handleOpenLogoutModal}>
                        <span className="hp-ic"><Ico size={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Ico></span>
                        Log Out
                      </motion.button>
                    </motion.div>

                    <div className="hp-foot">
                      <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
                      <a href="/policy" target="_blank" rel="noopener noreferrer">Privacy</a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* SUBSCRIPTION ALERT: shown whenever the plan is not active (owner / admin accounts only) */}
        <AnimatePresence initial={false}>
          {showBanner && (
            <motion.div
              key="sub-alert"
              role="alert"
              className={`hdr-alert${chatOpenMobile ? " hdr-alert--chat" : ""}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              <div className="hdr-alert-in">
                <span className="hdr-alert-ico"><Ico size={17} sw={2.2}>{KIND_PATH.warning}</Ico></span>
                <span className="hdr-alert-text">
                  <strong>Your subscription is not active.</strong>
                  Activate a plan to keep using campaigns, bots and live chat.
                </span>
                <button type="button" className="hdr-alert-cta" onClick={() => navigate("/dashboard/subscription")}>Choose a plan</button>
                <button type="button" className="hdr-alert-x" onClick={dismissBanner} aria-label="Dismiss alert">
                  <Ico size={15} sw={2.4}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ico>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CROP MODAL */}
        <AnimatePresence>
          {showCropModal && (
            <motion.div
              className="hdr-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCropModal(false)}
            >
              <motion.div
                className="hdr-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Change Profile Picture"
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <input type="file" ref={modalFileInputRef} onChange={handleSelectFileFromDevice} accept="image/*" style={{ display: "none" }} />

                <div className="hm-head">
                  <h3 className="hm-title">
                    <span className="hm-badge"><Ico size={18}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Ico></span>
                    Change Profile Picture
                  </h3>
                  <button type="button" onClick={() => setShowCropModal(false)} className="hm-close" aria-label="Close">
                    <Ico size={16} sw={2.4}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ico>
                  </button>
                </div>

                <div className="hm-sources">
                  <button type="button" onClick={() => modalFileInputRef.current?.click()} className="hm-source">
                    <Ico size={16}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Ico>
                    Select from PC
                  </button>
                  <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className={`hm-source${showUrlInput ? " is-on" : ""}`}>
                    <Ico size={16}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Ico>
                    Online Image URL
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showUrlInput && (
                    <motion.div
                      key="url"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="hm-url">
                        <input
                          type="url"
                          placeholder="Paste image address (https://...)"
                          value={onlineUrlInput}
                          onChange={(e) => setOnlineUrlInput(e.target.value)}
                          className="hm-input"
                        />
                        <button type="button" onClick={handleApplyOnlineUrl} className="hm-btn hm-primary">Load</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="hm-crop">
                  {selectedImageSrc ? (
                    <ReactCrop
                      crop={crop}
                      onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                    >
                      <img
                        ref={imgRef}
                        alt="Avatar crop canvas"
                        src={selectedImageSrc}
                        onLoad={onImageLoad}
                        style={{ maxHeight: "280px", maxWidth: "100%", borderRadius: "10px", display: "block" }}
                      />
                    </ReactCrop>
                  ) : (
                    <div className="hm-placeholder">
                      <Ico size={28} sw={1.6}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></Ico>
                      <span>Select an image from PC or input an image URL to preview &amp; crop.</span>
                    </div>
                  )}
                </div>

                <div className="hm-foot">
                  <button type="button" onClick={handleRemovePicture} className="hm-remove" disabled={uploading}>Remove Picture</button>
                  <div className="hm-foot-right">
                    <button type="button" onClick={() => setShowCropModal(false)} className="hm-btn hm-ghost">Cancel</button>
                    <button type="button" onClick={handleSaveCroppedImage} className="hm-btn hm-primary" disabled={uploading || !selectedImageSrc}>
                      {uploading && <span className="hm-spinner" />}
                      {uploading ? "Saving..." : "Apply & Save"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOGOUT CONFIRMATION MODAL */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              className="hdr-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                className="hdr-modal hdr-modal-sm"
                role="alertdialog"
                aria-modal="true"
                aria-label="Sign Out Confirmation"
                initial={{ scale: 0.92, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="hl-icon">
                  <Ico size={24} sw={2.2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Ico>
                </div>
                <h3 className="hl-title">Sign Out Confirmation</h3>
                <p className="hl-text">Are you sure you want to log out of your session? You will need to log back in to access your dashboard.</p>
                <div className="hl-actions">
                  <button type="button" onClick={() => setShowLogoutModal(false)} className="hm-btn hm-ghost">Cancel</button>
                  <button type="button" onClick={handleConfirmSignOut} className="hm-btn hm-danger">Yes, Log Out</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.hdr,.hdr-alert,.hn-panel,.hp-panel,.hdr-overlay{
  --ink:#0e1530; --muted:#55627f; --soft:#8793b2; --line:#e4e9f6; --surface:#fff;
  --brand2:color-mix(in srgb,var(--brand) 55%,#14b8e6);
  --brand-soft:color-mix(in srgb,var(--brand) 9%,#fff);
  --hdr-h:72px;
  font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,sans-serif; box-sizing:border-box; color:var(--ink);
}
.hdr *,.hdr-alert *,.hn-panel *,.hp-panel *,.hdr-overlay *{box-sizing:border-box}
.hdr button,.hdr-alert button,.hp-panel button,.hn-panel button{font-family:inherit;-webkit-tap-highlight-color:transparent}

/* ---------- Header bar ---------- */
.hdr{position:sticky;top:0;z-index:90;height:var(--hdr-h);padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:rgba(255,255,255,.80);backdrop-filter:blur(18px) saturate(1.6);-webkit-backdrop-filter:blur(18px) saturate(1.6);
  border-bottom:1px solid var(--line);box-shadow:0 10px 30px -24px rgba(40,50,120,.45)}
.hdr::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;pointer-events:none;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--brand) 55%,transparent),transparent);background-size:200% 100%;animation:hdrLine 7s linear infinite;opacity:.7}
.hdr-left{display:flex;align-items:center;gap:12px;min-width:0}
.hdr-bar{width:4px;height:30px;border-radius:4px;flex-shrink:0;background:linear-gradient(180deg,var(--brand),var(--brand2));box-shadow:0 6px 14px -6px var(--brand)}
.hdr-titles{display:flex;flex-direction:column;gap:2px;min-width:0}
.hdr-eyebrow{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;color:var(--soft)}
.hdr-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)}
.hdr-title{margin:0;font-size:19px;line-height:1.15;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hdr-burger{display:none;width:42px;height:42px;border-radius:13px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;place-items:center;flex-shrink:0;transition:background .2s,transform .2s,box-shadow .2s}
.hdr-burger:hover{background:#f4f6fc}
.hdr-burger:active{transform:scale(.94)}
.hdr-right{display:flex;align-items:center;gap:12px;flex-shrink:0}
.hdr-sep{width:1px;height:28px;background:var(--line)}
.hdr-pop{position:relative}

/* Go Pro */
.hdr-pro{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:7px;padding:10px 17px;border:0;border-radius:999px;cursor:pointer;color:#fff;
  font-size:12.5px;font-weight:700;letter-spacing:.1px;background:linear-gradient(120deg,var(--brand),var(--brand2) 60%,#b832d6);background-size:160% 100%;
  box-shadow:0 12px 22px -12px var(--brand);transition:background-position .5s,box-shadow .3s}
.hdr-pro svg{animation:hdrSpark 2.8s ease-in-out infinite}
.hdr-pro::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);animation:hdrShine 3.2s ease-in-out infinite}
.hdr-pro:hover{background-position:100% 0;box-shadow:0 16px 26px -12px var(--brand)}
.hdr-pro-dot{position:absolute;top:5px;right:7px;width:7px;height:7px;border-radius:50%;background:#fde047;box-shadow:0 0 0 0 rgba(253,224,71,.7);animation:hdrPulse 1.8s ease-out infinite}

/* Bell */
.hdr-icon{position:relative;width:44px;height:44px;display:grid;place-items:center;border-radius:14px;border:1px solid var(--line);background:#fff;color:var(--muted);cursor:pointer;
  transition:background .2s,border-color .2s,color .2s,box-shadow .2s,transform .2s}
.hdr-icon:hover{background:#f7f8fe;border-color:#d3daf0;color:var(--ink);transform:translateY(-1px)}
.hdr-icon.is-open{background:var(--brand-soft);border-color:color-mix(in srgb,var(--brand) 35%,var(--line));color:var(--brand);box-shadow:0 10px 20px -14px var(--brand)}
.hdr-bell{display:grid;transform-origin:50% 8%}
.hdr-bell.has-unread{color:var(--brand)}
.hdr-bell.is-ringing{animation:hdrRing 1.2s ease-in-out}
.hdr-badge{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;display:grid;place-items:center;
  background:linear-gradient(135deg,#f43f5e,#e11d48);color:#fff;font-size:10.5px;font-weight:800;border:2px solid #fff;font-variant-numeric:tabular-nums;box-shadow:0 6px 12px -6px #e11d48}
.hdr-badge>span:last-child{position:relative}
.hdr-ping{position:absolute;inset:-2px;border-radius:999px;background:#f43f5e;opacity:.55;animation:hdrPing 1.1s ease-out 2}

/* Profile trigger */
.hdr-profile{display:flex;align-items:center;gap:10px;padding:5px 12px 5px 5px;border-radius:16px;border:1px solid var(--line);background:#fff;cursor:pointer;text-align:left;
  transition:background .2s,border-color .2s,box-shadow .2s,transform .2s}
.hdr-profile:hover{background:#f7f8fe;border-color:#d3daf0;transform:translateY(-1px)}
.hdr-profile.is-open{border-color:color-mix(in srgb,var(--brand) 35%,var(--line));box-shadow:0 10px 20px -14px var(--brand)}
.hdr-avatar{position:relative;display:block;width:40px;height:40px;flex-shrink:0;border-radius:13px;padding:2px;background:linear-gradient(135deg,var(--brand),var(--brand2))}
.hdr-avatar>*{border-radius:11px !important;border:2px solid #fff}
.hdr-avatar-fallback{display:grid;place-items:center;border-radius:11px;color:#fff;font-weight:800;font-size:13px;letter-spacing:.2px;
  background:linear-gradient(135deg,var(--brand),var(--brand2))}
.hdr-online{position:absolute;right:-3px;bottom:-3px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff}
.hdr-pinfo{display:flex;flex-direction:column;gap:1px;min-width:0}
.hdr-pname{font-size:13px;font-weight:700;line-height:1.2;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hdr-prole{font-size:11px;font-weight:500;color:var(--soft)}
.hdr-chev{display:grid;color:var(--soft)}
.hdr-skel{background:linear-gradient(90deg,#e9edf8 0%,#f6f8fd 50%,#e9edf8 100%);background-size:200% 100%;animation:hdrSkel 1.2s linear infinite}

.hdr button:focus-visible,.hdr-alert button:focus-visible,.hn-panel button:focus-visible,.hp-panel button:focus-visible,.hdr-overlay button:focus-visible,.hdr-overlay input:focus-visible{
  outline:3px solid color-mix(in srgb,var(--brand) 40%,transparent);outline-offset:2px}

/* ---------- Subscription alert ---------- */
.hdr-alert{position:sticky;top:var(--hdr-h);z-index:89;overflow:hidden;background:linear-gradient(90deg,#fff7ed,#fff1f2);border-bottom:1px solid #fed7aa}
.hdr-alert-in{display:flex;align-items:center;gap:12px;padding:10px 28px}
.hdr-alert-ico{width:34px;height:34px;flex-shrink:0;display:grid;place-items:center;border-radius:11px;color:#c2410c;background:#ffedd5;animation:hdrPulseSoft 2.2s ease-in-out infinite}
.hdr-alert-text{flex:1;min-width:0;font-size:13px;line-height:1.45;color:#7c2d12}
.hdr-alert-text strong{font-weight:800;margin-right:4px}
.hdr-alert-cta{flex-shrink:0;padding:8px 15px;border:0;border-radius:11px;cursor:pointer;color:#fff;font-size:12.5px;font-weight:700;white-space:nowrap;
  background:linear-gradient(120deg,#ea580c,#e11d48);box-shadow:0 10px 18px -10px #e11d48;transition:transform .2s,box-shadow .3s}
.hdr-alert-cta:hover{transform:translateY(-1px);box-shadow:0 14px 22px -10px #e11d48}
.hdr-alert-x{flex-shrink:0;width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:#9a3412;cursor:pointer;transition:background .2s}
.hdr-alert-x:hover{background:rgba(154,52,18,.1)}

/* ---------- Notification panel ---------- */
.hn-panel{position:absolute;right:0;top:calc(100% + 12px);width:408px;max-width:calc(100vw - 24px);z-index:100;transform-origin:top right;
  background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden;
  box-shadow:0 34px 64px -22px rgba(30,40,110,.4),0 10px 24px -14px rgba(30,40,110,.25)}
.hn-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 18px 10px}
.hn-title{margin:0;font-size:17px;font-weight:800;letter-spacing:-.3px}
.hn-sub{display:block;margin-top:2px;font-size:12px;font-weight:500;color:var(--soft)}
.hn-markall{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:10px;border:0;background:var(--brand-soft);color:var(--brand);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background .2s}
.hn-markall:hover{background:color-mix(in srgb,var(--brand) 15%,#fff)}
.hn-tabs{display:flex;gap:4px;padding:0 14px;border-bottom:1px solid var(--line)}
.hn-tab{position:relative;display:inline-flex;align-items:center;gap:7px;padding:10px 8px;border:0;background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--soft);transition:color .2s}
.hn-tab i{font-style:normal;min-width:20px;padding:1px 6px;border-radius:999px;background:#eef1f9;color:var(--muted);font-size:11px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums}
.hn-tab.is-active{color:var(--ink)}
.hn-tab.is-active i{background:var(--brand-soft);color:var(--brand)}
.hn-tab-line{position:absolute;left:6px;right:6px;bottom:-1px;height:2.5px;border-radius:3px;background:linear-gradient(90deg,var(--brand),var(--brand2))}
.hn-list{max-height:min(440px,60vh);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#d3daf0 transparent}
.hn-group-label{position:sticky;top:0;z-index:1;padding:10px 18px 6px;font-size:12px;font-weight:700;color:var(--soft);background:rgba(255,255,255,.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}

.hn-item{position:relative;width:100%;display:flex;align-items:flex-start;gap:12px;padding:12px 18px;border:0;background:transparent;cursor:pointer;text-align:left;font-family:inherit;color:inherit;transition:background .15s}
.hn-item:hover{background:#f6f8fd}
.hn-item.is-unread{background:var(--brand-soft)}
.hn-item.is-unread:hover{background:color-mix(in srgb,var(--brand) 13%,#fff)}
.hn-item.is-unread::before{content:"";position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:0 3px 3px 0;background:var(--brand)}
.hn-icon{width:38px;height:38px;flex-shrink:0;display:grid;place-items:center;border-radius:12px;color:var(--k);background:color-mix(in srgb,var(--k) 12%,#fff)}
.hn-body{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.hn-item-title{font-size:13px;font-weight:700;line-height:1.35}
.hn-msg{font-size:13px;line-height:1.45;color:var(--muted);word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hn-item.is-unread .hn-msg{color:var(--ink);font-weight:600}
.hn-item-title + .hn-msg{font-weight:500}
.hn-time{font-size:11.5px;font-weight:500;color:var(--soft)}
.hn-item.is-unread .hn-time{color:var(--brand);font-weight:600}
.hn-dot{width:9px;height:9px;margin-top:6px;flex-shrink:0;border-radius:50%;background:var(--brand);box-shadow:0 0 0 4px color-mix(in srgb,var(--brand) 18%,transparent)}

.hn-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:44px 28px}
.hn-empty-art{position:relative;width:64px;height:64px;border-radius:20px;display:grid;place-items:center;margin-bottom:8px;color:var(--brand);background:var(--brand-soft);animation:hdrBob 3.2s ease-in-out infinite}
.hn-empty-spark{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--brand2));border:3px solid #fff}
.hn-empty strong{font-size:14.5px;font-weight:700}
.hn-empty span:last-child{font-size:12.5px;line-height:1.5;color:var(--soft);max-width:30ch}

/* ---------- Profile menu ---------- */
.hp-panel{position:absolute;right:0;top:calc(100% + 12px);width:288px;z-index:100;transform-origin:top right;background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden;
  box-shadow:0 34px 64px -22px rgba(30,40,110,.4),0 10px 24px -14px rgba(30,40,110,.25)}
.hp-panel{max-height:calc(100vh - var(--hdr-h) - 24px);max-height:calc(100dvh - var(--hdr-h) - 24px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}
.hp-banner{position:relative;overflow:hidden;display:flex;align-items:center;gap:13px;padding:18px 16px;color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand2))}
.hp-banner::before,.hp-banner::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.14);pointer-events:none}
.hp-banner::before{width:120px;height:120px;right:-34px;top:-52px}
.hp-banner::after{width:70px;height:70px;right:40px;bottom:-40px;background:rgba(255,255,255,.1)}
.hp-avatar{position:relative;z-index:1;flex-shrink:0;border-radius:15px;box-shadow:0 0 0 2px rgba(255,255,255,.6)}
.hp-camera{position:absolute;right:-6px;bottom:-6px;width:23px;height:23px;display:grid;place-items:center;border-radius:50%;border:2px solid #fff;background:var(--ink);color:#fff;cursor:pointer;padding:0;transition:transform .2s}
.hp-camera:hover{transform:scale(1.14)}
.hp-who{position:relative;z-index:1;display:flex;flex-direction:column;gap:3px;min-width:0}
.hp-name{font-size:14.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp-email{font-size:11.5px;font-weight:500;opacity:.88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp-role{align-self:flex-start;margin-top:2px;padding:2px 9px;border-radius:999px;background:rgba(255,255,255,.22);font-size:11px;font-weight:700}
.hp-plan{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 10px 0;padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:#f8faff}
.hp-plan-l{display:flex;align-items:center;gap:9px;min-width:0;font-size:12px;font-weight:600;color:var(--muted)}
.hp-plan-l b{display:block;font-size:13px;font-weight:800;color:var(--ink)}
.hp-plan-dot{width:9px;height:9px;flex-shrink:0;border-radius:50%}
.hp-plan-dot.on{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.18)}
.hp-plan-dot.off{background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.2);animation:hdrPulseSoft 2s ease-in-out infinite}
.hp-plan-btn{flex-shrink:0;padding:7px 12px;border:0;border-radius:10px;cursor:pointer;color:#fff;font-size:11.5px;font-weight:700;background:linear-gradient(120deg,var(--brand),var(--brand2));transition:transform .2s}
.hp-plan-btn:hover{transform:translateY(-1px)}
.hp-items{padding:8px}
.hp-label{padding:8px 10px 4px;font-size:10.5px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:var(--soft)}
.hp-item{position:relative;width:100%;display:flex;align-items:center;gap:12px;padding:9px 10px;border:0;border-radius:13px;background:none;color:#26325a;font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:background .15s,transform .15s}
.hp-item:hover{background:#f3f5fc}
.hp-item:active{transform:scale(.985)}
.hp-ic{width:32px;height:32px;flex-shrink:0;display:grid;place-items:center;border-radius:10px;color:var(--brand);background:var(--brand-soft);transition:transform .2s}
.hp-item:hover .hp-ic{transform:scale(1.08) rotate(-4deg)}
.hp-item .hp-go{margin-left:auto;color:var(--soft);opacity:0;transform:translateX(-4px);transition:opacity .2s,transform .2s}
.hp-item:hover .hp-go{opacity:1;transform:translateX(0)}
.hp-item.is-current{background:var(--brand-soft);color:var(--brand)}
.hp-item.is-current .hp-ic{background:#fff}
.hp-item.is-danger{color:#e11d48}
.hp-item.is-danger .hp-ic{color:#e11d48;background:#fff1f2}
.hp-item.is-danger:hover{background:#fff1f2}
.hp-div{height:1px;margin:6px 8px;background:var(--line)}
.hp-foot{display:flex;justify-content:center;gap:14px;padding:6px 10px 12px;font-size:11px;font-weight:600;color:var(--soft)}
.hp-foot a{color:inherit;text-decoration:none;transition:color .2s}
.hp-foot a:hover{color:var(--brand)}

/* ---------- Modals ---------- */
.hdr-overlay{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;
  background:rgba(14,21,48,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.hdr-modal{width:460px;max-width:100%;max-height:92vh;overflow-y:auto;padding:22px;border-radius:26px;background:#fff;border:1px solid var(--line);
  box-shadow:0 40px 80px -24px rgba(14,21,48,.55)}
.hdr-modal-sm{width:400px;text-align:center;display:flex;flex-direction:column;align-items:center;padding:28px 24px 24px}
.hm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid var(--line)}
.hm-title{display:flex;align-items:center;gap:12px;margin:0;font-size:16px;font-weight:800;letter-spacing:-.2px}
.hm-badge{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--brand);background:var(--brand-soft)}
.hm-close{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;border:0;background:#f3f5fc;color:var(--muted);cursor:pointer;transition:background .2s,color .2s,transform .2s}
.hm-close:hover{background:#e8ecf8;color:var(--ink);transform:rotate(90deg)}
.hm-sources{display:flex;gap:10px;margin-bottom:12px}
.hm-source{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;border-radius:12px;border:1px dashed #b9c3e6;background:#f7f8ff;color:#3a4a8f;font-size:12.5px;font-weight:700;cursor:pointer;transition:all .2s}
.hm-source:hover,.hm-source.is-on{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}
.hm-url{display:flex;gap:8px;padding-bottom:12px}
.hm-input{flex:1;min-width:0;padding:10px 13px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;font:500 13px/1.4 inherit;font-family:inherit;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s}
.hm-input:focus{border-color:var(--brand);box-shadow:0 0 0 4px color-mix(in srgb,var(--brand) 15%,transparent)}
.hm-crop{display:flex;align-items:center;justify-content:center;min-height:230px;padding:14px;border-radius:16px;border:1px dashed #cfd7ee;
  background:repeating-conic-gradient(#f3f5fb 0 25%,#fff 0 50%) 0 0/16px 16px}
.hm-placeholder{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:30ch;text-align:center;font-size:13px;line-height:1.5;color:var(--soft)}
.hm-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px}
.hm-foot-right{display:flex;gap:10px}
.hm-remove{padding:8px 4px;border:0;background:none;color:#e11d48;font-size:12.5px;font-weight:700;cursor:pointer;border-radius:8px}
.hm-remove:hover:not(:disabled){text-decoration:underline;text-underline-offset:3px}
.hm-remove:disabled{opacity:.5;cursor:not-allowed}
.hm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:12px;border:0;font-size:13px;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .3s,background .2s,opacity .2s}
.hm-btn:disabled{opacity:.6;cursor:not-allowed}
.hm-ghost{background:#fff;color:#475569;border:1px solid #d6dcf0}
.hm-ghost:hover{background:#f6f8fd}
.hm-primary{color:#fff;background:linear-gradient(120deg,var(--brand),var(--brand2));box-shadow:0 10px 20px -10px var(--brand)}
.hm-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 24px -10px var(--brand)}
.hm-danger{color:#fff;background:linear-gradient(135deg,#f43f5e,#e11d48);box-shadow:0 10px 20px -10px rgba(225,29,72,.7)}
.hm-danger:hover{transform:translateY(-1px);box-shadow:0 14px 24px -10px rgba(225,29,72,.8)}
.hm-spinner{width:14px;height:14px;border-radius:50%;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;animation:hdrSpin .7s linear infinite}
.hl-icon{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;margin-bottom:16px;color:#e11d48;background:#fff1f2;box-shadow:0 0 0 8px #fff6f7}
.hl-title{margin:0 0 8px;font-size:18px;font-weight:800;letter-spacing:-.3px}
.hl-text{margin:0 0 22px;font-size:13.5px;line-height:1.6;color:var(--muted);max-width:34ch}
.hl-actions{display:flex;gap:12px;width:100%}
.hl-actions .hm-btn{flex:1}

/* ---------- Motion ---------- */
@keyframes hdrShine{0%,60%{left:-60%}100%{left:130%}}
@keyframes hdrRing{0%,100%{transform:rotate(0)}10%{transform:rotate(16deg)}20%{transform:rotate(-14deg)}30%{transform:rotate(11deg)}40%{transform:rotate(-8deg)}50%{transform:rotate(5deg)}60%{transform:rotate(0)}}
@keyframes hdrPing{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.2);opacity:0}}
@keyframes hdrBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes hdrSkel{to{background-position:-200% 0}}
@keyframes hdrSpin{to{transform:rotate(360deg)}}
@keyframes hdrLine{to{background-position:-200% 0}}
@keyframes hdrSpark{0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(18deg) scale(1.18)}}
@keyframes hdrPulse{0%{box-shadow:0 0 0 0 rgba(253,224,71,.7)}100%{box-shadow:0 0 0 8px rgba(253,224,71,0)}}
@keyframes hdrPulseSoft{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}

/* ---------- Responsive ---------- */
@media (max-width:768px){
  .hdr,.hdr-alert,.hn-panel,.hp-panel{--hdr-h:60px}
  .hdr{padding:0 12px;gap:10px}
  .hdr-burger{display:grid}
  .hdr-bar,.hdr-eyebrow{display:none}
  .hdr-title{font-size:16px;max-width:46vw}
  .hdr-right{gap:8px}
  .hdr-sep,.hdr-pinfo,.hdr-chev{display:none}
  .hdr-icon{width:42px;height:42px}
  .hdr-profile{padding:3px;border-radius:15px}
  .hdr-pro{padding:11px}
  .hdr-pro-text{display:none}
  .hdr-pro-dot{top:6px;right:6px}
  .hdr-pop{position:static}
  .hn-panel,.hp-panel{top:calc(100% + 8px);left:10px;right:10px;width:auto;max-width:none;border-radius:20px}
  .hp-panel{left:auto;width:min(300px,calc(100vw - 20px))}
  .hn-list{max-height:min(420px,58vh)}
  .hdr-alert-in{padding:10px 12px;gap:10px;flex-wrap:wrap}
  .hdr-alert-text{flex:1 1 100%;order:1;font-size:12.5px}
  .hdr-alert-ico{order:0}
  .hdr-alert-cta{order:2;flex:1}
  .hdr-alert-x{order:0;margin-left:auto}
  .hdr-modal{padding:18px;border-radius:22px}
  .hm-foot{flex-direction:column-reverse;align-items:stretch}
  .hm-foot-right{width:100%}
  .hm-foot-right .hm-btn{flex:1}

  /* mobile only: while a conversation is open the header (and alert) step aside so the chat gets the whole screen */
  .hdr.hdr--chat,.hdr-alert.hdr-alert--chat{display:none}
  body.pm-chat-open .chats-root.chat-main-container{height:100vh !important;height:100dvh !important}
}
@media (prefers-reduced-motion:reduce){
  .hdr *,.hdr *::after,.hdr::after,.hdr-alert *,.hn-panel *,.hp-panel *,.hdr-overlay *{animation:none !important}
}
`;

export default Header;
