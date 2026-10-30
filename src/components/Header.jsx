import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import axios from "axios";
import { useBranding } from "../context/BrandingContext";

const API_BASE_URL = 
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || 
  "http://localhost:5000";

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
  const [isSubscribed, setIsSubscribed] = useState(true);

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

        setUser({ name: realName, role: currentRole, avatar: avatarUrl });
        
        localStorage.setItem("user", JSON.stringify({ 
          ...(localUserParsed || {}), 
          ...liveUser, 
          name: realName,
          avatar: avatarUrl,
          profilePic: avatarUrl
        }));
      }

      if (currentRole === "Agent") {
        setIsSubscribed(true);
      } else {
        const subResponse = await axios.get(`${API_BASE_URL}/api/subscription/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (subResponse && subResponse.data) {
          const isUserActive = subResponse.data.active === true ||
            subResponse.data.subscribed === true ||
            subResponse.data.success === true ||
            subResponse.data.status === "active" ||
            (subResponse.data.data && subResponse.data.data.status === "active");
          setIsSubscribed(isUserActive);
        } else if (localUserParsed) {
          setIsSubscribed(localUserParsed.subscribed === true || localUserParsed.active === true || localUserParsed.status === "active");
        }
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
    const interval = setInterval(fetchHeaderData, 10000);

    const handleCampaignNotification = () => fetchHeaderData();
    window.addEventListener("campaignCompleted", handleCampaignNotification);

    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    if (path.includes("/dashboard/settings")) return "Global System Configurations";
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

  const pageTitle = getPageTitle();

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

        <header className="hdr">
          {/* LEFT: burger + title */}
          <div className="hdr-left">
            <button type="button" className="hdr-burger" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <Ico size={20} sw={2.4}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></Ico>
            </button>
            <span className="hdr-bar" />
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

          {/* RIGHT: actions */}
          <div className="hdr-right">
            {/* GO PRO */}
            <AnimatePresence>
              {user.role !== "Agent" && isSubscribed === false && (
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
                        {avatarNode(46)}
                        <button type="button" onClick={handleOpenModal} className="hp-camera" title="Upload Avatar" aria-label="Upload Avatar">
                          <Ico size={11} sw={2.6}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Ico>
                        </button>
                      </div>
                      <div className="hp-who">
                        <span className="hp-name">{user.name}</span>
                        <span className="hp-role">{user.role}</span>
                      </div>
                    </div>

                    <div className="hp-items">
                      <button type="button" role="menuitem" className="hp-item" onClick={handleOpenModal}>
                        <Ico size={16}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Ico>
                        Change Picture
                      </button>
                      <div className="hp-div" />
                      <button type="button" role="menuitem" className="hp-item is-danger" onClick={handleOpenLogoutModal}>
                        <Ico size={16}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Ico>
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

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

.hdr,.hn-panel,.hp-panel,.hdr-overlay{
  --ink:#0e1530; --muted:#5b6785; --soft:#8793b2; --line:#e3e8f6; --surface:#fff;
  --brand2:color-mix(in srgb,var(--brand) 55%,#14b8e6);
  --brand-soft:color-mix(in srgb,var(--brand) 9%,#fff);
  font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,sans-serif; box-sizing:border-box; color:var(--ink);
}
.hdr *,.hn-panel *,.hp-panel *,.hdr-overlay *{box-sizing:border-box}
.hdr button{font-family:inherit}

/* ---------- Header bar ---------- */
.hdr{position:sticky;top:0;z-index:90;height:72px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:rgba(255,255,255,.82);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);
  border-bottom:1px solid var(--line);box-shadow:0 8px 24px -20px rgba(40,50,120,.35)}
.hdr-left{display:flex;align-items:center;gap:12px;min-width:0}
.hdr-bar{width:4px;height:22px;border-radius:4px;flex-shrink:0;background:linear-gradient(180deg,var(--brand),var(--brand2))}
.hdr-title{margin:0;font-size:18px;font-weight:700;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hdr-burger{display:none;width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;place-items:center;flex-shrink:0;transition:background .2s}
.hdr-burger:hover{background:#f4f6fc}
.hdr-right{display:flex;align-items:center;gap:12px;flex-shrink:0}
.hdr-sep{width:1px;height:26px;background:var(--line)}
.hdr-pop{position:relative}

/* Go Pro */
.hdr-pro{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border:0;border-radius:999px;cursor:pointer;color:#fff;
  font-size:12.5px;font-weight:700;background:linear-gradient(120deg,var(--brand),var(--brand2) 60%,#b832d6);background-size:160% 100%;
  box-shadow:0 10px 20px -10px var(--brand);transition:background-position .5s,box-shadow .3s}
.hdr-pro::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);animation:hdrShine 3.2s ease-in-out infinite}
.hdr-pro:hover{background-position:100% 0;box-shadow:0 14px 24px -10px var(--brand)}

/* Bell */
.hdr-icon{position:relative;width:42px;height:42px;display:grid;place-items:center;border-radius:13px;border:1px solid var(--line);background:#fff;color:var(--muted);cursor:pointer;
  transition:background .2s,border-color .2s,color .2s,box-shadow .2s}
.hdr-icon:hover{background:#f7f8fe;border-color:#d3daf0;color:var(--ink)}
.hdr-icon.is-open{background:var(--brand-soft);border-color:color-mix(in srgb,var(--brand) 35%,var(--line));color:var(--brand);box-shadow:0 8px 18px -12px var(--brand)}
.hdr-bell{display:grid;transform-origin:50% 8%}
.hdr-bell.has-unread{color:var(--brand)}
.hdr-bell.is-ringing{animation:hdrRing 1.2s ease-in-out}
.hdr-badge{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;display:grid;place-items:center;
  background:linear-gradient(135deg,#f43f5e,#e11d48);color:#fff;font-size:10.5px;font-weight:800;border:2px solid #fff;font-variant-numeric:tabular-nums}
.hdr-badge>span:last-child{position:relative}
.hdr-ping{position:absolute;inset:-2px;border-radius:999px;background:#f43f5e;opacity:.55;animation:hdrPing 1.1s ease-out 2}

/* Profile trigger */
.hdr-profile{display:flex;align-items:center;gap:10px;padding:5px 12px 5px 5px;border-radius:14px;border:1px solid var(--line);background:#fff;cursor:pointer;text-align:left;
  transition:background .2s,border-color .2s,box-shadow .2s}
.hdr-profile:hover{background:#f7f8fe;border-color:#d3daf0}
.hdr-profile.is-open{border-color:color-mix(in srgb,var(--brand) 35%,var(--line));box-shadow:0 8px 18px -12px var(--brand)}
.hdr-avatar{position:relative;display:block;width:36px;height:36px;flex-shrink:0}
.hdr-avatar-fallback{display:grid;place-items:center;border-radius:12px;color:#fff;font-weight:800;font-size:13px;letter-spacing:.2px;
  background:linear-gradient(135deg,var(--brand),var(--brand2))}
.hdr-online{position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid #fff}
.hdr-pinfo{display:flex;flex-direction:column;gap:1px;min-width:0}
.hdr-pname{font-size:13px;font-weight:700;line-height:1.2;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hdr-prole{font-size:11px;font-weight:500;color:var(--soft)}
.hdr-chev{display:grid;color:var(--soft)}
.hdr-skel{background:linear-gradient(90deg,#e9edf8 0%,#f6f8fd 50%,#e9edf8 100%);background-size:200% 100%;animation:hdrSkel 1.2s linear infinite}

.hdr button:focus-visible,.hn-panel button:focus-visible,.hp-panel button:focus-visible,.hdr-overlay button:focus-visible,.hdr-overlay input:focus-visible{
  outline:3px solid color-mix(in srgb,var(--brand) 40%,transparent);outline-offset:2px}

/* ---------- Notification panel ---------- */
.hn-panel{position:absolute;right:0;top:calc(100% + 12px);width:408px;max-width:calc(100vw - 24px);z-index:100;transform-origin:top right;
  background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;
  box-shadow:0 30px 60px -20px rgba(30,40,110,.35),0 8px 20px -12px rgba(30,40,110,.2)}
.hn-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px 10px}
.hn-title{margin:0;font-size:16px;font-weight:800;letter-spacing:-.3px}
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
.hp-panel{position:absolute;right:0;top:calc(100% + 12px);width:250px;z-index:100;transform-origin:top right;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;
  box-shadow:0 30px 60px -20px rgba(30,40,110,.35),0 8px 20px -12px rgba(30,40,110,.2)}
.hp-banner{display:flex;align-items:center;gap:12px;padding:16px;color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand2))}
.hp-avatar{position:relative;flex-shrink:0;border-radius:14px;box-shadow:0 0 0 2px rgba(255,255,255,.55)}
.hp-camera{position:absolute;right:-6px;bottom:-6px;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;border:2px solid #fff;background:var(--ink);color:#fff;cursor:pointer;padding:0;transition:transform .2s}
.hp-camera:hover{transform:scale(1.12)}
.hp-who{display:flex;flex-direction:column;gap:3px;min-width:0}
.hp-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp-role{align-self:flex-start;padding:2px 9px;border-radius:999px;background:rgba(255,255,255,.22);font-size:11px;font-weight:600}
.hp-items{padding:6px}
.hp-item{width:100%;display:flex;align-items:center;gap:11px;padding:10px 12px;border:0;border-radius:11px;background:none;color:#2a3558;font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:background .15s}
.hp-item:hover{background:#f3f5fc}
.hp-item.is-danger{color:#e11d48}
.hp-item.is-danger:hover{background:#fff1f2}
.hp-div{height:1px;margin:4px 6px;background:var(--line)}

/* ---------- Modals ---------- */
.hdr-overlay{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;
  background:rgba(14,21,48,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.hdr-modal{width:460px;max-width:100%;max-height:92vh;overflow-y:auto;padding:22px;border-radius:24px;background:#fff;border:1px solid var(--line);
  box-shadow:0 40px 80px -24px rgba(14,21,48,.55)}
.hdr-modal-sm{width:400px;text-align:center;display:flex;flex-direction:column;align-items:center;padding:28px 24px 24px}
.hm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid var(--line)}
.hm-title{display:flex;align-items:center;gap:12px;margin:0;font-size:16px;font-weight:800;letter-spacing:-.2px}
.hm-badge{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--brand);background:var(--brand-soft)}
.hm-close{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;border:0;background:#f3f5fc;color:var(--muted);cursor:pointer;transition:background .2s,color .2s}
.hm-close:hover{background:#e8ecf8;color:var(--ink)}
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

/* ---------- Responsive ---------- */
@media (max-width:768px){
  .hdr{height:60px;padding:0 12px;gap:10px}
  .hdr-burger{display:grid}
  .hdr-bar{display:none}
  .hdr-title{font-size:15.5px;max-width:48vw}
  .hdr-right{gap:8px}
  .hdr-sep,.hdr-pinfo,.hdr-chev{display:none}
  .hdr-profile{padding:3px;border-radius:13px}
  .hdr-pro{padding:10px}
  .hdr-pro-text{display:none}
  .hdr-pop{position:static}
  .hn-panel,.hp-panel{top:calc(100% + 8px);left:12px;right:12px;width:auto;max-width:none}
  .hp-panel{left:auto;width:250px}
  .hn-list{max-height:min(420px,58vh)}
  .hdr-modal{padding:18px;border-radius:20px}
  .hm-foot{flex-direction:column-reverse;align-items:stretch}
  .hm-foot-right{width:100%}
  .hm-foot-right .hm-btn{flex:1}
}
@media (prefers-reduced-motion:reduce){
  .hdr *,.hdr *::after,.hn-panel *,.hp-panel *,.hdr-overlay *{animation:none !important}
}
`;

export default Header;
