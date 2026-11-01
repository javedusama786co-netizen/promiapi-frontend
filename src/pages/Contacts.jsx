import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

/* -------------------------------------------------------------------------- */
/*  Icons                                                                     */
/* -------------------------------------------------------------------------- */

const ICON_PATHS = {
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  ),
  userPlus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </>
  ),
  messenger: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  inbox: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
};

function Icon({ name, size = 16, className = "", strokeWidth = 2 }) {
  return (
    <svg
      className={`ct-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg className="ct-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.237a9.994 9.994 0 004.779 1.22h.005c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.038-5.176-2.925-7.062A9.925 9.925 0 0012.012 2zm5.845 14.167c-.247.692-1.247 1.341-1.744 1.396-.467.051-1.076.073-3.414-.863-2.991-1.198-4.919-4.212-5.068-4.409-.148-.197-1.21-1.611-1.21-3.072 0-1.462.766-2.181 1.037-2.478.271-.297.592-.371.79-.371.197 0 .395.002.567.01.185.008.432-.07.676.516.247.592.839 2.049.913 2.197.074.148.123.321.025.518-.099.197-.148.321-.296.494-.148.173-.311.387-.444.518-.148.148-.302.309-.13.605.172.296.764 1.261 1.639 2.04 1.127 1.002 2.078 1.312 2.374 1.46.296.148.469.123.642-.074.173-.197.74-0.864.938-1.16.197-.296.395-.247.666-.148.271.099 1.727.815 2.023.963.296.148.494.222.567.346.074.123.074.716-.173 1.408z" />
    </svg>
  );
}

function PlatformIcon({ platform, size = 15 }) {
  if (platform === "instagram") return <Icon name="instagram" size={size} />;
  if (platform === "messenger") return <Icon name="messenger" size={size} />;
  if (platform === "whatsapp") return <WhatsAppIcon size={size} />;
  return <Icon name="globe" size={size} />;
}

const PLATFORM_LABELS = {
  All: "All platforms",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                             */
/* -------------------------------------------------------------------------- */

const AVATAR_TONES = [
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#cffafe", fg: "#155e75" },
  { bg: "#ede9fe", fg: "#5b21b6" },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getTone = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function Contacts() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("contacts");

  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("All");
  const [selectedTagFilter, setSelectedTagFilter] = useState("All");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState("All");

  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);

  // Verification result modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyStats, setVerifyStats] = useState({ verifiedCount: 0, activeCount: 0, invalidCount: 0 });
  const [targetGroupForMove, setTargetGroupForMove] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [newContact, setNewContact] = useState({
    platform: "whatsapp",
    name: "",
    phone: "",
    recipientId: "",
    group: "",
    tags: "",
    sourceAd: "",
  });
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // UI-only state
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE_URL = "http://api.promiapi.com"; // Move to an env variable (VITE_API_URL / REACT_APP_API_URL) for production builds.

  /* ----------------------------- Toasts & confirm ----------------------------- */

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (type, title, message = "") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
      setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast]
  );

  const askConfirm = (options) =>
    new Promise((resolve) => {
      setConfirmState({ tone: "danger", confirmLabel: "Confirm", ...options, resolve });
    });

  const closeConfirm = (result) => {
    if (confirmState) confirmState.resolve(result);
    setConfirmState(null);
  };

  /* --------------------------------- Effects --------------------------------- */

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPlatformDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("tab") === "groups") {
      setActiveTab("groups");
    }
  }, [location]);

  useEffect(() => {
    fetchInitialData(false);

    const interval = setInterval(() => {
      fetchInitialData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGroupFilter, selectedTagFilter, selectedPlatformFilter]);

  // Escape closes the top-most layer; background scroll is locked while a dialog is open
  const anyDialogOpen = showManualModal || showExcelModal || showVerifyModal || !!confirmState;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirmState) {
        confirmState.resolve(false);
        setConfirmState(null);
      } else if (showManualModal) setShowManualModal(false);
      else if (showExcelModal) setShowExcelModal(false);
      else if (showVerifyModal) setShowVerifyModal(false);
      else setIsPlatformDropdownOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmState, showManualModal, showExcelModal, showVerifyModal]);

  useEffect(() => {
    document.body.style.overflow = anyDialogOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyDialogOpen]);

  /* ------------------------------- Data loading ------------------------------- */

  const fetchInitialData = async (isBackground = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    try {
      if (!isBackground) setPageLoading(true);
      const [groupsRes, contactsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/contacts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const fetchedGroups = groupsRes.data.groups?.map((g) => g.name) || [];
      setGroups(fetchedGroups);
      setContacts(contactsRes.data.contacts || []);
      if (fetchedGroups.length > 0) {
        setNewContact((prev) => ({ ...prev, group: prev.group || fetchedGroups[0] }));
        setTargetGroupForMove((prev) => prev || fetchedGroups[0]);
      }
    } catch (err) {
      console.error("Error fetching data from server:", err);
      if (!isBackground) {
        pushToast("error", "Couldn't load contacts", "Check your connection and refresh the page.");
      }
    } finally {
      if (!isBackground) setPageLoading(false);
    }
  };

  /* -------------------------------- Formatting -------------------------------- */

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDay = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  /* --------------------------------- Derived --------------------------------- */

  const allUniqueTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  const filteredContacts = contacts.filter((c) => {
    const targetIdentifier = c.phone || c.phoneNumber || c.recipientId || c.instagramId || c.facebookId || "";
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      targetIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sourceAd?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = selectedGroupFilter === "All" || c.group === selectedGroupFilter;
    const matchesTag = selectedTagFilter === "All" || (c.tags && c.tags.includes(selectedTagFilter));
    const matchesPlatform =
      selectedPlatformFilter === "All" ||
      (c.platform || "whatsapp").toLowerCase() === selectedPlatformFilter.toLowerCase();

    return matchesSearch && matchesGroup && matchesTag && matchesPlatform;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedGroupFilter !== "All" ||
    selectedTagFilter !== "All" ||
    selectedPlatformFilter !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGroupFilter("All");
    setSelectedTagFilter("All");
    setSelectedPlatformFilter("All");
  };

  const summary = {
    total: contacts.length,
    groups: groups.length,
    active: contacts.filter((c) => c.platform === "whatsapp" && c.status === "ACTIVE").length,
    invalid: contacts.filter((c) => c.platform === "whatsapp" && c.status === "INVALID").length,
  };

  const pageWindow = (() => {
    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  /* --------------------------------- Handlers --------------------------------- */

  // Bulk WhatsApp verification & opening the result modal
  const handleVerifyWhatsApp = async () => {
    const ok = await askConfirm({
      tone: "primary",
      title: "Verify WhatsApp numbers?",
      message: "We'll check every WhatsApp number in your database and mark it as active or invalid. This may take a moment.",
      confirmLabel: "Start verification",
    });
    if (!ok) return;
    setVerifying(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/contacts/verify-whatsapp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVerifyStats(res.data.stats || { verifiedCount: 0, activeCount: 0, invalidCount: 0 });
      setShowVerifyModal(true);
      fetchInitialData(true);
    } catch (err) {
      pushToast("error", "Verification failed", err.response?.data?.message || "The server couldn't complete the verification.");
    } finally {
      setVerifying(false);
    }
  };

  // Delete all INVALID contacts after verification
  const handleDeleteInvalidContacts = async () => {
    const ok = await askConfirm({
      title: "Delete all invalid numbers?",
      message: "Every WhatsApp number marked as invalid will be permanently removed. This can't be undone.",
      confirmLabel: "Delete invalid numbers",
    });
    if (!ok) return;
    const token = localStorage.getItem("token");
    try {
      const invalidIds = contacts.filter((c) => c.platform === "whatsapp" && c.status === "INVALID").map((c) => c._id);
      for (const id of invalidIds) {
        await axios.delete(`${API_BASE_URL}/api/contacts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      setContacts((prev) => prev.filter((c) => !(c.platform === "whatsapp" && c.status === "INVALID")));
      pushToast("success", "Invalid numbers deleted", `${invalidIds.length} contact${invalidIds.length === 1 ? "" : "s"} removed from your database.`);
      setShowVerifyModal(false);
    } catch (err) {
      pushToast("error", "Some numbers weren't deleted", "Try again, or remove the remaining contacts one by one.");
    }
  };

  // Move ACTIVE contacts to a specific group
  const handleSaveActiveToGroup = async () => {
    if (!targetGroupForMove) {
      pushToast("warning", "Select a group", "Choose a target group before moving contacts.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const activeContacts = contacts.filter((c) => c.platform === "whatsapp" && c.status === "ACTIVE");
      for (const c of activeContacts) {
        await axios.patch(
          `${API_BASE_URL}/api/contacts/${c._id}/group`,
          { group: targetGroupForMove },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      pushToast("success", "Contacts moved", `Active WhatsApp numbers are now in "${targetGroupForMove}".`);
      setShowVerifyModal(false);
      fetchInitialData(false);
    } catch (err) {
      pushToast("error", "Couldn't update the group", "Something went wrong while moving the contacts. Try again.");
    }
  };

  const handleExportExcel = () => {
    if (filteredContacts.length === 0) {
      pushToast("warning", "Nothing to export", "There are no contacts matching the current filters.");
      return;
    }
    const excelData = filteredContacts.map((c, index) => ({
      "#": index + 1,
      Platform: (c.platform || "whatsapp").toUpperCase(),
      "Contact Name": c.name,
      "Contact Identifier":
        c.platform === "whatsapp"
          ? `+${c.phone || c.phoneNumber || ""}`
          : c.recipientId || c.instagramId || c.facebookId || "N/A",
      "Group Segment": c.group,
      "WhatsApp Status": c.status || "ACTIVE",
      "Ad Source / Campaign": c.sourceAd || "Organic",
      Tags: c.tags ? c.tags.join(", ") : "",
      "Date Added": formatDate(c.createdAt),
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Contacts");
    XLSX.writeFile(workbook, "Contacts_Report.xlsx");
    pushToast("success", "Export ready", `${filteredContacts.length} contact${filteredContacts.length === 1 ? "" : "s"} saved to Contacts_Report.xlsx.`);
  };

  const handleDownloadTemplate = () => {
    const sample = [{ Name: "Asif Munir", Phone: "03001234567", Tags: "VIP, High-Spend" }];
    const worksheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "Contacts_Import_Template.xlsx");
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (groups.includes(newGroupName.trim())) {
      pushToast("warning", "Group already exists", `"${newGroupName.trim()}" is already in your list. Use a different name.`);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .post(`${API_BASE_URL}/api/groups/create`, { name: newGroupName.trim() }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setGroups([...groups, res.data.group.name]);
        setNewContact((prev) => ({ ...prev, group: res.data.group.name }));
        pushToast("success", "Group created", `"${res.data.group.name}" is ready to use.`);
        setNewGroupName("");
      })
      .catch((err) => {
        pushToast("error", "Couldn't create the group", err.response?.data?.message || "Failed to save the group. Try again.");
      });
  };

  const handleDeleteGroup = async (groupName) => {
    const ok = await askConfirm({
      title: `Delete "${groupName}"?`,
      message: "The group will be removed. Contacts inside it won't be deleted.",
      confirmLabel: "Delete group",
    });
    if (!ok) return;
    const token = localStorage.getItem("token");
    axios
      .delete(`${API_BASE_URL}/api/groups/${groupName}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setGroups(groups.filter((g) => g !== groupName));
        if (selectedGroupFilter === groupName) setSelectedGroupFilter("All");
        pushToast("success", "Group deleted", `"${groupName}" has been removed.`);
      })
      .catch((err) => {
        pushToast("error", "Couldn't delete the group", err.response?.data?.message || "Server error while deleting the group.");
      });
  };

  const resetNewContact = () =>
    setNewContact({
      platform: "whatsapp",
      name: "",
      phone: "",
      recipientId: "",
      group: groups[0] || "",
      tags: "",
      sourceAd: "",
    });

  const openManualModal = () => {
    setFormErrors({});
    setShowManualModal(true);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    if (!newContact.name.trim()) errors.name = "Enter the client's name.";
    if (newContact.platform === "whatsapp") {
      if (!newContact.phone.trim()) {
        errors.phone = "Enter a WhatsApp number.";
      } else if (!newContact.phone.startsWith("92") && !newContact.phone.startsWith("03")) {
        errors.phone = "Use the format 03XXXXXXXXX or 92XXXXXXXXXX.";
      }
    } else if (!newContact.recipientId.trim()) {
      errors.recipientId = "Recipient ID is required for this platform.";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formattedTags = newContact.tags
      ? newContact.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      ...newContact,
      phone: newContact.platform === "whatsapp" ? newContact.phone : undefined,
      phoneNumber: newContact.platform === "whatsapp" ? newContact.phone : undefined,
      recipientId: newContact.platform !== "whatsapp" ? newContact.recipientId : undefined,
      facebookId: newContact.platform === "messenger" ? newContact.recipientId : undefined,
      instagramId: newContact.platform === "instagram" ? newContact.recipientId : undefined,
      tags: formattedTags,
    };

    const token = localStorage.getItem("token");
    setSaving(true);
    axios
      .post(`${API_BASE_URL}/api/contacts/add`, payload, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.contact) {
          setContacts((prev) => [res.data.contact, ...prev]);
        }
        const savedName = newContact.name.trim();
        const savedGroup = newContact.group;
        setShowManualModal(false);
        resetNewContact();
        setFormErrors({});
        pushToast(
          "success",
          "Contact added successfully",
          savedGroup ? `${savedName} has been saved to "${savedGroup}".` : `${savedName} has been saved.`
        );
      })
      .catch((err) => {
        pushToast("error", "Couldn't add the contact", err.response?.data?.message || "Failed to add the new contact. Try again.");
      })
      .finally(() => setSaving(false));
  };

  const handleRemoveContact = async (contact) => {
    const ok = await askConfirm({
      title: "Remove this contact?",
      message: `${contact.name || "This contact"} will be permanently removed from your database.`,
      confirmLabel: "Remove contact",
    });
    if (!ok) return;
    const token = localStorage.getItem("token");
    axios
      .delete(`${API_BASE_URL}/api/contacts/${contact._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setContacts((prev) => prev.filter((c) => c._id !== contact._id));
        pushToast("success", "Contact removed", `${contact.name || "The contact"} has been deleted.`);
      })
      .catch(() => pushToast("error", "Couldn't remove the contact", "Failed to remove the contact from the server."));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setExcelFile(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      pushToast("warning", "Unsupported file", "Upload an .xlsx, .xls or .csv file.");
      return;
    }
    setExcelFile(file);
  };

  const openExcelModal = () => {
    setExcelFile(null);
    setShowExcelModal(true);
  };

  const handleExcelUpload = (e) => {
    e.preventDefault();
    if (!excelFile) {
      pushToast("warning", "Select a file", "Choose a spreadsheet to import.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("excelFile", excelFile);
    formData.append("group", newContact.group || groups[0] || "All");
    const token = localStorage.getItem("token");
    axios
      .post(`${API_BASE_URL}/api/contacts/bulk-import`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const inserted = res.data.insertedContacts;
        if (inserted) {
          setContacts((prev) => [...inserted, ...prev]);
        }
        setShowExcelModal(false);
        setExcelFile(null);
        pushToast(
          "success",
          "Import complete",
          inserted ? `${inserted.length} contact${inserted.length === 1 ? "" : "s"} imported from your spreadsheet.` : "Contacts imported from your spreadsheet."
        );
      })
      .catch((err) => pushToast("error", "Import failed", err.response?.data?.message || "The server couldn't process this file."))
      .finally(() => setUploading(false));
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      pushToast("success", "Copied", `${value} is on your clipboard.`);
    } catch (err) {
      pushToast("error", "Couldn't copy", "Your browser blocked clipboard access.");
    }
  };

  const viewGroupContacts = (groupName) => {
    setSelectedGroupFilter(groupName);
    setActiveTab("contacts");
  };

  /* --------------------------------- Renderers -------------------------------- */

  const renderPlatformBadge = (platform) => {
    const p = (platform || "whatsapp").toLowerCase();
    return (
      <span className={`ct-platform ct-platform--${p}`}>
        <PlatformIcon platform={p} size={13} />
        {PLATFORM_LABELS[p] || p}
      </span>
    );
  };

  const renderStatus = (contact) => {
    if (contact.platform !== "whatsapp") return <span className="ct-muted">Not applicable</span>;
    const status = contact.status || "PENDING";
    const label = status === "ACTIVE" ? "Active" : status === "INVALID" ? "Invalid" : "Pending";
    return (
      <span className={`ct-status ct-status--${status.toLowerCase()}`}>
        <span className="ct-status-dot" />
        {label}
      </span>
    );
  };

  const renderIdentifier = (contact) => {
    const isWhatsApp = contact.platform === "whatsapp" || !contact.platform;
    const raw = isWhatsApp
      ? contact.phone || contact.phoneNumber
      : contact.recipientId || contact.instagramId || contact.facebookId;
    if (!raw) return <span className="ct-muted">Not available</span>;
    const display = isWhatsApp ? `+${raw}` : raw;
    return (
      <span className="ct-identifier">
        <span className="ct-mono">{display}</span>
        <button
          type="button"
          className="ct-copy"
          onClick={() => handleCopy(display)}
          aria-label={`Copy ${display}`}
          title="Copy"
        >
          <Icon name="copy" size={13} />
        </button>
      </span>
    );
  };

  const renderToastIcon = (type) => {
    if (type === "success") return <Icon name="check" size={14} strokeWidth={3} />;
    if (type === "error") return <Icon name="x" size={14} strokeWidth={3} />;
    return <Icon name="alert" size={14} strokeWidth={2.5} />;
  };

  const platformOptions = ["All", "whatsapp", "instagram", "messenger"];

  /* ----------------------------------- JSX ----------------------------------- */

  return (
    <div className="ct-root">
      <style>{CSS}</style>

      {/* Toasts */}
      <div className="ct-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ct-toast ct-toast--${t.type}`} role="status">
            <span className="ct-toast-icon">{renderToastIcon(t.type)}</span>
            <div className="ct-toast-body">
              <p className="ct-toast-title">{t.title}</p>
              {t.message && <p className="ct-toast-msg">{t.message}</p>}
            </div>
            <button type="button" className="ct-toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
              <Icon name="x" size={14} />
            </button>
            <span className="ct-toast-timer" />
          </div>
        ))}
      </div>

      {/* Page header */}
      <header className="ct-header">
        <div className="ct-header-text">
          <h1 className="ct-title">Audience &amp; Ad-Tracking Database</h1>
          <p className="ct-subtitle">
            Organize leads from TikTok and Meta ads, manage segments, and track every channel in one place.
          </p>
        </div>

        {activeTab === "contacts" && (
          <div className="ct-actions">
            <button type="button" className="ct-btn ct-btn--ghost" onClick={handleVerifyWhatsApp} disabled={verifying}>
              {verifying ? <span className="ct-spinner" /> : <Icon name="shield" size={16} />}
              {verifying ? "Verifying…" : "Verify WhatsApp"}
            </button>
            <button type="button" className="ct-btn ct-btn--ghost" onClick={handleExportExcel}>
              <Icon name="download" size={16} /> Export
            </button>
            <button type="button" className="ct-btn ct-btn--ghost" onClick={openExcelModal}>
              <Icon name="upload" size={16} /> Import
            </button>
            <button type="button" className="ct-btn ct-btn--primary" onClick={openManualModal}>
              <Icon name="userPlus" size={16} /> Add contact
            </button>
          </div>
        )}
      </header>

      {/* Summary */}
      <section className="ct-summary" aria-label="Database summary">
        <div className="ct-stat">
          <span className="ct-stat-label">Total contacts</span>
          <span className="ct-stat-value">{pageLoading ? "–" : summary.total.toLocaleString()}</span>
        </div>
        <div className="ct-stat">
          <span className="ct-stat-label">Groups</span>
          <span className="ct-stat-value">{pageLoading ? "–" : summary.groups.toLocaleString()}</span>
        </div>
        <div className="ct-stat">
          <span className="ct-stat-label">Active on WhatsApp</span>
          <span className="ct-stat-value ct-stat-value--good">{pageLoading ? "–" : summary.active.toLocaleString()}</span>
        </div>
        <div className="ct-stat">
          <span className="ct-stat-label">Invalid numbers</span>
          <span className={`ct-stat-value ${summary.invalid > 0 ? "ct-stat-value--bad" : ""}`}>
            {pageLoading ? "–" : summary.invalid.toLocaleString()}
          </span>
        </div>
      </section>

      {/* Tabs */}
      <div className="ct-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "contacts"}
          className={`ct-tab ${activeTab === "contacts" ? "is-active" : ""}`}
          onClick={() => setActiveTab("contacts")}
        >
          <Icon name="users" size={16} /> All contacts <span className="ct-tab-count">{contacts.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "groups"}
          className={`ct-tab ${activeTab === "groups" ? "is-active" : ""}`}
          onClick={() => setActiveTab("groups")}
        >
          <Icon name="folder" size={16} /> Manage groups <span className="ct-tab-count">{groups.length}</span>
        </button>
      </div>

      {pageLoading ? (
        <div className="ct-card" aria-busy="true" aria-label="Loading contacts">
          <div className="ct-skeleton-list">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="ct-skeleton-row">
                <span className="ct-skeleton ct-skeleton--avatar" />
                <span className="ct-skeleton ct-skeleton--wide" />
                <span className="ct-skeleton ct-skeleton--mid" />
                <span className="ct-skeleton ct-skeleton--short" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {activeTab === "contacts" && (
            <div>
              {/* Filters */}
              <div className="ct-filters">
                <div className="ct-search">
                  <Icon name="search" size={16} className="ct-search-icon" />
                  <input
                    type="text"
                    className="ct-input ct-search-input"
                    placeholder="Search by name, number, ID or campaign"
                    aria-label="Search contacts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" className="ct-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>

                <div className="ct-dropdown" ref={dropdownRef}>
                  <button
                    type="button"
                    className="ct-input ct-dropdown-trigger"
                    onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isPlatformDropdownOpen}
                  >
                    <span className="ct-dropdown-label">
                      <PlatformIcon platform={selectedPlatformFilter === "All" ? "all" : selectedPlatformFilter} />
                      {PLATFORM_LABELS[selectedPlatformFilter]}
                    </span>
                    <Icon name="chevronDown" size={14} className="ct-dropdown-caret" />
                  </button>

                  {isPlatformDropdownOpen && (
                    <ul className="ct-dropdown-menu" role="listbox">
                      {platformOptions.map((p) => (
                        <li key={p} role="option" aria-selected={selectedPlatformFilter === p}>
                          <button
                            type="button"
                            className={`ct-dropdown-option ${selectedPlatformFilter === p ? "is-selected" : ""}`}
                            onClick={() => {
                              setSelectedPlatformFilter(p);
                              setIsPlatformDropdownOpen(false);
                            }}
                          >
                            <PlatformIcon platform={p === "All" ? "all" : p} />
                            {PLATFORM_LABELS[p]}
                            {selectedPlatformFilter === p && <Icon name="check" size={14} className="ct-dropdown-check" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <select
                  className="ct-input ct-select"
                  aria-label="Filter by group"
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                >
                  <option value="All">All groups and campaigns</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <select
                  className="ct-input ct-select"
                  aria-label="Filter by tag"
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                >
                  <option value="All">All tags</option>
                  {allUniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ct-result-bar">
                <span className="ct-result-count">
                  {filteredContacts.length.toLocaleString()} {filteredContacts.length === 1 ? "contact" : "contacts"}
                  {hasActiveFilters ? " match your filters" : ""}
                </span>
                {hasActiveFilters && (
                  <button type="button" className="ct-link" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="ct-card ct-table-card">
                <div className="ct-table-scroll">
                  <table className="ct-table">
                    <thead>
                      <tr>
                        <th className="ct-th ct-th--index">#</th>
                        <th className="ct-th">Contact</th>
                        <th className="ct-th">Platform</th>
                        <th className="ct-th">ID / Number</th>
                        <th className="ct-th">Group</th>
                        <th className="ct-th">WhatsApp status</th>
                        <th className="ct-th">Ad source</th>
                        <th className="ct-th">Added</th>
                        <th className="ct-th ct-th--action">
                          <span className="ct-sr">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContacts.length === 0 ? (
                        <tr>
                          <td colSpan="9">
                            <div className="ct-empty">
                              <span className="ct-empty-icon">
                                <Icon name={hasActiveFilters ? "search" : "inbox"} size={22} />
                              </span>
                              <p className="ct-empty-title">
                                {hasActiveFilters ? "No contacts match these filters" : "No contacts yet"}
                              </p>
                              <p className="ct-empty-text">
                                {hasActiveFilters
                                  ? "Try a different search term or clear the filters to see everyone."
                                  : "Add your first contact or import a spreadsheet to get started."}
                              </p>
                              {hasActiveFilters ? (
                                <button type="button" className="ct-btn ct-btn--ghost" onClick={clearFilters}>
                                  Clear filters
                                </button>
                              ) : (
                                <div className="ct-empty-actions">
                                  <button type="button" className="ct-btn ct-btn--primary" onClick={openManualModal}>
                                    <Icon name="userPlus" size={16} /> Add contact
                                  </button>
                                  <button type="button" className="ct-btn ct-btn--ghost" onClick={openExcelModal}>
                                    <Icon name="upload" size={16} /> Import spreadsheet
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentContacts.map((contact, index) => {
                          const sequenceNum = indexOfFirstItem + index + 1;
                          const tone = getTone(contact.name);
                          const picture = contact.profilePicUrl || contact.avatar;
                          return (
                            <tr key={contact._id || contact.id} className="ct-row">
                              <td className="ct-td ct-td--index">{sequenceNum}</td>

                              <td className="ct-td">
                                <div className="ct-person">
                                  <span className="ct-avatar" style={{ background: tone.bg, color: tone.fg }}>
                                    {getInitials(contact.name)}
                                    {picture && (
                                      <img
                                        src={picture}
                                        alt=""
                                        className="ct-avatar-img"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    )}
                                  </span>
                                  <span className="ct-person-text">
                                    <span className="ct-person-name">{contact.name}</span>
                                    {contact.tags && contact.tags.length > 0 && (
                                      <span className="ct-tags">
                                        {contact.tags.slice(0, 2).map((tag) => (
                                          <span key={tag} className="ct-tag">
                                            {tag}
                                          </span>
                                        ))}
                                        {contact.tags.length > 2 && (
                                          <span className="ct-tag ct-tag--more" title={contact.tags.slice(2).join(", ")}>
                                            +{contact.tags.length - 2}
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="ct-td">{renderPlatformBadge(contact.platform)}</td>
                              <td className="ct-td">{renderIdentifier(contact)}</td>
                              <td className="ct-td">
                                {contact.group ? (
                                  <span className="ct-group-chip">
                                    <Icon name="folder" size={12} />
                                    {contact.group}
                                  </span>
                                ) : (
                                  <span className="ct-muted">Ungrouped</span>
                                )}
                              </td>
                              <td className="ct-td">{renderStatus(contact)}</td>
                              <td className="ct-td">
                                {contact.sourceAd ? (
                                  <span className="ct-ad-chip">
                                    <Icon name="target" size={12} />
                                    {contact.sourceAd}
                                  </span>
                                ) : (
                                  <span className="ct-muted">Organic</span>
                                )}
                              </td>
                              <td className="ct-td">
                                <span className="ct-date">
                                  <span className="ct-date-day">{formatDay(contact.createdAt)}</span>
                                  <span className="ct-date-time">{formatTime(contact.createdAt)}</span>
                                </span>
                              </td>
                              <td className="ct-td ct-td--action">
                                <button
                                  type="button"
                                  className="ct-icon-btn ct-icon-btn--danger"
                                  onClick={() => handleRemoveContact(contact)}
                                  aria-label={`Remove ${contact.name}`}
                                  title="Remove contact"
                                >
                                  <Icon name="trash" size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredContacts.length > 0 && (
                  <div className="ct-pagination">
                    <span className="ct-page-info">
                      Showing <strong>{indexOfFirstItem + 1}</strong>–<strong>{Math.min(indexOfLastItem, filteredContacts.length)}</strong> of{" "}
                      <strong>{filteredContacts.length.toLocaleString()}</strong>
                    </span>
                    {totalPages > 1 && (
                      <nav className="ct-page-controls" aria-label="Pagination">
                        <button
                          type="button"
                          className="ct-page-btn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          aria-label="Previous page"
                        >
                          <Icon name="chevronLeft" size={16} />
                        </button>
                        {pageWindow[0] > 1 && (
                          <>
                            <button type="button" className="ct-page-btn" onClick={() => setCurrentPage(1)}>
                              1
                            </button>
                            {pageWindow[0] > 2 && <span className="ct-page-gap">…</span>}
                          </>
                        )}
                        {pageWindow.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`ct-page-btn ${p === currentPage ? "is-current" : ""}`}
                            onClick={() => setCurrentPage(p)}
                            aria-current={p === currentPage ? "page" : undefined}
                          >
                            {p}
                          </button>
                        ))}
                        {pageWindow[pageWindow.length - 1] < totalPages && (
                          <>
                            {pageWindow[pageWindow.length - 1] < totalPages - 1 && <span className="ct-page-gap">…</span>}
                            <button type="button" className="ct-page-btn" onClick={() => setCurrentPage(totalPages)}>
                              {totalPages}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="ct-page-btn"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          aria-label="Next page"
                        >
                          <Icon name="chevronRight" size={16} />
                        </button>
                      </nav>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "groups" && (
            <div className="ct-groups">
              <div className="ct-card ct-panel">
                <h2 className="ct-panel-title">Create a group</h2>
                <p className="ct-panel-text">Groups segment your contacts by ad campaign, product or audience.</p>
                <form onSubmit={handleCreateGroup} className="ct-form">
                  <div className="ct-field">
                    <label className="ct-label" htmlFor="ct-group-name">
                      Group name
                    </label>
                    <input
                      id="ct-group-name"
                      type="text"
                      className="ct-input"
                      placeholder="e.g. TikTok Earbuds Ad"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="ct-btn ct-btn--primary ct-btn--block" disabled={!newGroupName.trim()}>
                    Create group
                  </button>
                </form>
              </div>

              <div className="ct-card ct-table-card">
                <div className="ct-table-scroll">
                  <table className="ct-table ct-table--groups">
                    <thead>
                      <tr>
                        <th className="ct-th ct-th--index">#</th>
                        <th className="ct-th">Group / campaign</th>
                        <th className="ct-th">Contacts</th>
                        <th className="ct-th ct-th--action-wide">
                          <span className="ct-sr">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.length === 0 ? (
                        <tr>
                          <td colSpan="4">
                            <div className="ct-empty">
                              <span className="ct-empty-icon">
                                <Icon name="folder" size={22} />
                              </span>
                              <p className="ct-empty-title">No groups yet</p>
                              <p className="ct-empty-text">Create your first group to start organizing contacts.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        groups.map((group, index) => {
                          const count = contacts.filter((c) => c.group === group).length;
                          return (
                            <tr key={group} className="ct-row">
                              <td className="ct-td ct-td--index">{index + 1}</td>
                              <td className="ct-td">
                                <span className="ct-group-name">
                                  <span className="ct-group-icon">
                                    <Icon name="folder" size={16} />
                                  </span>
                                  {group}
                                </span>
                              </td>
                              <td className="ct-td">
                                <strong>{count}</strong> {count === 1 ? "lead" : "leads"}
                              </td>
                              <td className="ct-td ct-td--action-wide">
                                <div className="ct-row-actions">
                                  <button type="button" className="ct-link" onClick={() => viewGroupContacts(group)}>
                                    View contacts
                                  </button>
                                  <button
                                    type="button"
                                    className="ct-icon-btn ct-icon-btn--danger"
                                    onClick={() => handleDeleteGroup(group)}
                                    aria-label={`Delete group ${group}`}
                                    title="Delete group"
                                  >
                                    <Icon name="trash" size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Verification report modal */}
      {showVerifyModal && (
        <div className="ct-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowVerifyModal(false)}>
          <div className="ct-modal ct-modal--wide" role="dialog" aria-modal="true" aria-labelledby="ct-verify-title">
            <div className="ct-modal-header">
              <div>
                <h3 className="ct-modal-title" id="ct-verify-title">
                  WhatsApp verification report
                </h3>
                <p className="ct-modal-sub">Results from checking every WhatsApp number in your database.</p>
              </div>
              <button type="button" className="ct-icon-btn" onClick={() => setShowVerifyModal(false)} aria-label="Close">
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="ct-verify-stats">
              <div className="ct-verify-stat">
                <span className="ct-verify-label">Total checked</span>
                <span className="ct-verify-value">{verifyStats.verifiedCount}</span>
              </div>
              <div className="ct-verify-stat ct-verify-stat--good">
                <span className="ct-verify-label">Active on WhatsApp</span>
                <span className="ct-verify-value">{verifyStats.activeCount}</span>
              </div>
              <div className="ct-verify-stat ct-verify-stat--bad">
                <span className="ct-verify-label">Invalid or not found</span>
                <span className="ct-verify-value">{verifyStats.invalidCount}</span>
              </div>
            </div>

            {verifyStats.invalidCount > 0 && (
              <div className="ct-callout ct-callout--danger">
                <div className="ct-callout-body">
                  <h4 className="ct-callout-title">Clean up invalid numbers</h4>
                  <p className="ct-callout-text">
                    {verifyStats.invalidCount} {verifyStats.invalidCount === 1 ? "number isn't" : "numbers aren't"} registered on WhatsApp. Removing{" "}
                    {verifyStats.invalidCount === 1 ? "it" : "them"} keeps your campaigns clean.
                  </p>
                </div>
                <button type="button" className="ct-btn ct-btn--danger" onClick={handleDeleteInvalidContacts}>
                  Delete invalid
                </button>
              </div>
            )}

            {verifyStats.activeCount > 0 && (
              <div className="ct-callout ct-callout--good">
                <div className="ct-callout-body">
                  <h4 className="ct-callout-title">Organize active leads</h4>
                  <p className="ct-callout-text">Move every active WhatsApp contact into a single group.</p>
                  <div className="ct-callout-row">
                    <select
                      className="ct-input ct-select"
                      aria-label="Target group"
                      value={targetGroupForMove}
                      onChange={(e) => setTargetGroupForMove(e.target.value)}
                    >
                      {groups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="ct-btn ct-btn--success" onClick={handleSaveActiveToGroup}>
                      Move to group
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button type="button" className="ct-btn ct-btn--ghost ct-btn--block" onClick={() => setShowVerifyModal(false)}>
              Close report
            </button>
          </div>
        </div>
      )}

      {/* Add contact modal */}
      {showManualModal && (
        <div className="ct-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowManualModal(false)}>
          <div className="ct-modal" role="dialog" aria-modal="true" aria-labelledby="ct-add-title">
            <div className="ct-modal-header">
              <div>
                <h3 className="ct-modal-title" id="ct-add-title">
                  Add contact
                </h3>
                <p className="ct-modal-sub">Save a single lead to your database.</p>
              </div>
              <button type="button" className="ct-icon-btn" onClick={() => setShowManualModal(false)} aria-label="Close">
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="ct-form" noValidate>
              <div className="ct-field">
                <span className="ct-label">Platform</span>
                <div className="ct-segmented" role="radiogroup" aria-label="Platform">
                  {[
                    { id: "whatsapp", name: "WhatsApp" },
                    { id: "instagram", name: "Instagram" },
                    { id: "messenger", name: "Messenger" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={newContact.platform === p.id}
                      className={`ct-segment ct-segment--${p.id} ${newContact.platform === p.id ? "is-active" : ""}`}
                      onClick={() => {
                        setNewContact({ ...newContact, platform: p.id });
                        setFormErrors({});
                      }}
                    >
                      <PlatformIcon platform={p.id} size={15} /> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ct-field">
                <label className="ct-label" htmlFor="ct-name">
                  Client name
                </label>
                <input
                  id="ct-name"
                  type="text"
                  className={`ct-input ${formErrors.name ? "has-error" : ""}`}
                  placeholder="e.g. Asif Munir"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  aria-invalid={!!formErrors.name}
                />
                {formErrors.name && <p className="ct-error">{formErrors.name}</p>}
              </div>

              {newContact.platform === "whatsapp" ? (
                <div className="ct-field">
                  <label className="ct-label" htmlFor="ct-phone">
                    WhatsApp number
                  </label>
                  <input
                    id="ct-phone"
                    type="text"
                    inputMode="tel"
                    className={`ct-input ${formErrors.phone ? "has-error" : ""}`}
                    placeholder="e.g. 03001234567"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    aria-invalid={!!formErrors.phone}
                  />
                  {formErrors.phone ? (
                    <p className="ct-error">{formErrors.phone}</p>
                  ) : (
                    <p className="ct-hint">Use 03XXXXXXXXX or 92XXXXXXXXXX.</p>
                  )}
                </div>
              ) : (
                <div className="ct-field">
                  <label className="ct-label" htmlFor="ct-recipient">
                    {newContact.platform === "instagram" ? "Instagram IGSID / recipient ID" : "Messenger PSID / recipient ID"}
                  </label>
                  <input
                    id="ct-recipient"
                    type="text"
                    className={`ct-input ${formErrors.recipientId ? "has-error" : ""}`}
                    placeholder="e.g. 178414000000000"
                    value={newContact.recipientId}
                    onChange={(e) => setNewContact({ ...newContact, recipientId: e.target.value })}
                    aria-invalid={!!formErrors.recipientId}
                  />
                  {formErrors.recipientId && <p className="ct-error">{formErrors.recipientId}</p>}
                </div>
              )}

              <div className="ct-field">
                <label className="ct-label" htmlFor="ct-group">
                  Group
                </label>
                <select
                  id="ct-group"
                  value={newContact.group}
                  onChange={(e) => setNewContact({ ...newContact, group: e.target.value })}
                  className="ct-input ct-select"
                >
                  {groups.length === 0 ? (
                    <option value="">No groups yet</option>
                  ) : (
                    groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))
                  )}
                </select>
                {groups.length === 0 && (
                  <p className="ct-hint">
                    You don't have any groups.{" "}
                    <button
                      type="button"
                      className="ct-link"
                      onClick={() => {
                        setShowManualModal(false);
                        setActiveTab("groups");
                      }}
                    >
                      Create one first
                    </button>
                  </p>
                )}
              </div>

              <div className="ct-field-row">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="ct-source">
                    Ad campaign source <span className="ct-optional">Optional</span>
                  </label>
                  <input
                    id="ct-source"
                    type="text"
                    className="ct-input"
                    placeholder="e.g. Meta_Earbuds_Promo"
                    value={newContact.sourceAd}
                    onChange={(e) => setNewContact({ ...newContact, sourceAd: e.target.value })}
                  />
                </div>

                <div className="ct-field">
                  <label className="ct-label" htmlFor="ct-tags">
                    Tags <span className="ct-optional">Optional</span>
                  </label>
                  <input
                    id="ct-tags"
                    type="text"
                    className="ct-input"
                    placeholder="e.g. VIP, High-Spend"
                    value={newContact.tags}
                    onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                  />
                </div>
              </div>
              <p className="ct-hint ct-hint--flush">Separate multiple tags with commas.</p>

              <div className="ct-modal-footer">
                <button type="button" className="ct-btn ct-btn--ghost" onClick={() => setShowManualModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ct-btn ct-btn--primary" disabled={saving}>
                  {saving && <span className="ct-spinner ct-spinner--light" />}
                  {saving ? "Saving…" : "Save contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showExcelModal && (
        <div className="ct-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowExcelModal(false)}>
          <div className="ct-modal" role="dialog" aria-modal="true" aria-labelledby="ct-import-title">
            <div className="ct-modal-header">
              <div>
                <h3 className="ct-modal-title" id="ct-import-title">
                  Import contacts
                </h3>
                <p className="ct-modal-sub">Add many contacts at once from a spreadsheet.</p>
              </div>
              <button type="button" className="ct-icon-btn" onClick={() => setShowExcelModal(false)} aria-label="Close">
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleExcelUpload} className="ct-form">
              <div className="ct-callout ct-callout--info">
                <span className="ct-callout-icon">
                  <Icon name="info" size={16} />
                </span>
                <div className="ct-callout-body">
                  <h4 className="ct-callout-title">Spreadsheet format</h4>
                  <p className="ct-callout-text">
                    Name your columns <strong>Name</strong>, <strong>Phone</strong> and, optionally, <strong>Tags</strong> (comma separated).
                  </p>
                  <button type="button" className="ct-link" onClick={handleDownloadTemplate}>
                    Download sample template
                  </button>
                </div>
              </div>

              <div className="ct-field">
                <label className="ct-label" htmlFor="ct-import-group">
                  Add contacts to group
                </label>
                <select
                  id="ct-import-group"
                  value={newContact.group}
                  onChange={(e) => setNewContact({ ...newContact, group: e.target.value })}
                  className="ct-input ct-select"
                >
                  {groups.length === 0 ? (
                    <option value="">No groups yet</option>
                  ) : (
                    groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="ct-field">
                <span className="ct-label">Spreadsheet file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="ct-file-input"
                  tabIndex={-1}
                />
                {excelFile ? (
                  <div className="ct-file-chip">
                    <span className="ct-file-chip-icon">
                      <Icon name="file" size={18} />
                    </span>
                    <span className="ct-file-chip-text">
                      <span className="ct-file-chip-name">{excelFile.name}</span>
                      <span className="ct-file-chip-size">{formatFileSize(excelFile.size)}</span>
                    </span>
                    <button
                      type="button"
                      className="ct-icon-btn"
                      onClick={() => {
                        setExcelFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      aria-label="Remove file"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`ct-dropzone ${dragActive ? "is-drag" : ""}`}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleFileDrop}
                  >
                    <span className="ct-dropzone-icon">
                      <Icon name="upload" size={20} />
                    </span>
                    <span className="ct-dropzone-title">Drop your file here, or browse</span>
                    <span className="ct-dropzone-text">Supports .xlsx, .xls and .csv</span>
                  </button>
                )}
              </div>

              <div className="ct-modal-footer">
                <button type="button" className="ct-btn ct-btn--ghost" onClick={() => setShowExcelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ct-btn ct-btn--primary" disabled={uploading || !excelFile}>
                  {uploading && <span className="ct-spinner ct-spinner--light" />}
                  {uploading ? "Importing…" : "Import contacts"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmState && (
        <div className="ct-backdrop ct-backdrop--top" onMouseDown={(e) => e.target === e.currentTarget && closeConfirm(false)}>
          <div className="ct-modal ct-modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="ct-confirm-title">
            <span className={`ct-confirm-icon ct-confirm-icon--${confirmState.tone}`}>
              <Icon name={confirmState.tone === "danger" ? "alert" : "shield"} size={20} />
            </span>
            <h3 className="ct-confirm-title" id="ct-confirm-title">
              {confirmState.title}
            </h3>
            <p className="ct-confirm-text">{confirmState.message}</p>
            <div className="ct-confirm-actions">
              <button type="button" className="ct-btn ct-btn--ghost" onClick={() => closeConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                className={`ct-btn ${confirmState.tone === "danger" ? "ct-btn--danger" : "ct-btn--primary"}`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const CSS = `
.ct-root {
  --ct-ink: #0f172a;
  --ct-text: #334155;
  --ct-muted: #64748b;
  --ct-faint: #94a3b8;
  --ct-line: #e2e8f0;
  --ct-line-soft: #eef2f6;
  --ct-surface: #ffffff;
  --ct-surface-alt: #f8fafc;
  --ct-primary: #1d4ed8;
  --ct-primary-hover: #1e40af;
  --ct-primary-soft: #eff4ff;
  --ct-good: #15803d;
  --ct-good-soft: #ecfdf3;
  --ct-bad: #b91c1c;
  --ct-bad-soft: #fef2f2;
  --ct-warn: #b45309;
  --ct-warn-soft: #fffbeb;
  --ct-radius: 8px;
  --ct-radius-lg: 12px;

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--ct-text);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.ct-root *, .ct-root *::before, .ct-root *::after { box-sizing: border-box; }
.ct-root button { font-family: inherit; }
.ct-icon { flex-shrink: 0; }
.ct-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ct-muted { color: var(--ct-faint); font-size: 13px; }
.ct-mono { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 13px; color: var(--ct-ink); }

.ct-root :focus-visible { outline: 2px solid var(--ct-primary); outline-offset: 2px; }

/* Header */
.ct-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.ct-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: var(--ct-ink); }
.ct-subtitle { margin: 0; max-width: 560px; color: var(--ct-muted); font-size: 14px; }
.ct-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Buttons */
.ct-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: var(--ct-radius); border: 1px solid transparent; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background-color .15s, border-color .15s, box-shadow .15s, color .15s; }
.ct-btn:disabled { opacity: .55; cursor: not-allowed; }
.ct-btn--block { width: 100%; }
.ct-btn--primary { background: var(--ct-primary); color: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, .12); }
.ct-btn--primary:hover:not(:disabled) { background: var(--ct-primary-hover); }
.ct-btn--ghost { background: var(--ct-surface); color: var(--ct-ink); border-color: var(--ct-line); }
.ct-btn--ghost:hover:not(:disabled) { background: var(--ct-surface-alt); border-color: #cbd5e1; }
.ct-btn--danger { background: var(--ct-bad); color: #fff; }
.ct-btn--danger:hover:not(:disabled) { background: #991b1b; }
.ct-btn--success { background: var(--ct-good); color: #fff; }
.ct-btn--success:hover:not(:disabled) { background: #166534; }

.ct-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; color: var(--ct-muted); cursor: pointer; transition: background-color .15s, color .15s; }
.ct-icon-btn:hover { background: var(--ct-line-soft); color: var(--ct-ink); }
.ct-icon-btn--danger:hover { background: var(--ct-bad-soft); color: var(--ct-bad); }

.ct-link { background: none; border: none; padding: 0; color: var(--ct-primary); font-weight: 600; font-size: 13px; cursor: pointer; }
.ct-link:hover { text-decoration: underline; }

.ct-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ct-line); border-top-color: var(--ct-primary); animation: ct-spin .7s linear infinite; }
.ct-spinner--light { border-color: rgba(255,255,255,.4); border-top-color: #fff; }
@keyframes ct-spin { to { transform: rotate(360deg); } }

/* Summary */
.ct-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
.ct-stat { background: var(--ct-surface); border: 1px solid var(--ct-line); border-radius: var(--ct-radius-lg); padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
.ct-stat-label { font-size: 13px; color: var(--ct-muted); }
.ct-stat-value { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: var(--ct-ink); font-variant-numeric: tabular-nums; line-height: 1.2; }
.ct-stat-value--good { color: var(--ct-good); }
.ct-stat-value--bad { color: var(--ct-bad); }

/* Tabs */
.ct-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--ct-line); margin-bottom: 20px; overflow-x: auto; }
.ct-tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; margin-bottom: -1px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--ct-muted); font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: color .15s, border-color .15s; }
.ct-tab:hover { color: var(--ct-ink); }
.ct-tab.is-active { color: var(--ct-primary); border-bottom-color: var(--ct-primary); font-weight: 600; }
.ct-tab-count { min-width: 22px; padding: 1px 7px; border-radius: 999px; background: var(--ct-line-soft); color: var(--ct-text); font-size: 12px; font-weight: 600; text-align: center; font-variant-numeric: tabular-nums; }
.ct-tab.is-active .ct-tab-count { background: var(--ct-primary-soft); color: var(--ct-primary); }

/* Cards */
.ct-card { background: var(--ct-surface); border: 1px solid var(--ct-line); border-radius: var(--ct-radius-lg); }
.ct-table-card { overflow: hidden; }

/* Filters */
.ct-filters { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(170px, 1fr) minmax(190px, 1fr) minmax(150px, 1fr); gap: 10px; margin-bottom: 12px; }
.ct-input { width: 100%; height: 38px; padding: 0 12px; border-radius: var(--ct-radius); border: 1px solid #cbd5e1; background: var(--ct-surface); color: var(--ct-ink); font-size: 14px; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
.ct-input::placeholder { color: var(--ct-faint); }
.ct-input:hover { border-color: #94a3b8; }
.ct-input:focus { outline: none; border-color: var(--ct-primary); box-shadow: 0 0 0 3px rgba(29, 78, 216, .15); }
.ct-input.has-error { border-color: var(--ct-bad); }
.ct-input.has-error:focus { box-shadow: 0 0 0 3px rgba(185, 28, 28, .15); }
.ct-select { cursor: pointer; appearance: none; padding-right: 32px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }

.ct-search { position: relative; }
.ct-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ct-faint); pointer-events: none; }
.ct-search-input { padding-left: 36px; padding-right: 34px; }
.ct-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: none; background: none; border-radius: 6px; color: var(--ct-muted); cursor: pointer; }
.ct-search-clear:hover { background: var(--ct-line-soft); color: var(--ct-ink); }

.ct-dropdown { position: relative; }
.ct-dropdown-trigger { display: flex; align-items: center; justify-content: space-between; text-align: left; cursor: pointer; }
.ct-dropdown-label { display: inline-flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ct-dropdown-caret { color: var(--ct-muted); }
.ct-dropdown-menu { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 40; margin: 0; padding: 4px; list-style: none; background: var(--ct-surface); border: 1px solid var(--ct-line); border-radius: 10px; box-shadow: 0 12px 28px -8px rgba(15, 23, 42, .18), 0 2px 6px rgba(15, 23, 42, .06); }
.ct-dropdown-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: none; border-radius: 6px; background: none; color: var(--ct-text); font-size: 14px; text-align: left; cursor: pointer; }
.ct-dropdown-option:hover { background: var(--ct-surface-alt); }
.ct-dropdown-option.is-selected { background: var(--ct-primary-soft); color: var(--ct-primary); font-weight: 600; }
.ct-dropdown-check { margin-left: auto; }

.ct-result-bar { display: flex; justify-content: space-between; align-items: center; min-height: 24px; margin-bottom: 10px; padding: 0 2px; }
.ct-result-count { font-size: 13px; color: var(--ct-muted); }

/* Table */
.ct-table-scroll { width: 100%; overflow-x: auto; }
.ct-table { width: 100%; min-width: 1040px; border-collapse: collapse; text-align: left; }
.ct-table--groups { min-width: 480px; }
.ct-th { position: sticky; top: 0; padding: 12px 16px; background: var(--ct-surface-alt); border-bottom: 1px solid var(--ct-line); color: var(--ct-muted); font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.ct-th--index, .ct-td--index { width: 56px; text-align: center; font-variant-numeric: tabular-nums; }
.ct-th--action, .ct-td--action { width: 56px; text-align: right; }
.ct-th--action-wide, .ct-td--action-wide { width: 200px; text-align: right; }
.ct-td { padding: 12px 16px; border-bottom: 1px solid var(--ct-line-soft); vertical-align: middle; white-space: nowrap; color: var(--ct-text); font-size: 13.5px; }
.ct-td--index { color: var(--ct-faint); font-size: 13px; }
.ct-row:last-child .ct-td { border-bottom: none; }
.ct-row:hover .ct-td { background: #fafbfd; }

.ct-person { display: flex; align-items: center; gap: 12px; }
.ct-avatar { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; font-size: 13px; font-weight: 700; flex-shrink: 0; overflow: hidden; }
.ct-avatar-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ct-person-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ct-person-name { font-weight: 600; color: var(--ct-ink); font-size: 14px; }
.ct-tags { display: flex; gap: 4px; }
.ct-tag { padding: 0 7px; border-radius: 999px; background: var(--ct-line-soft); color: var(--ct-text); font-size: 11.5px; font-weight: 500; line-height: 18px; }
.ct-tag--more { background: transparent; border: 1px solid var(--ct-line); color: var(--ct-muted); line-height: 16px; }

.ct-platform { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid transparent; }
.ct-platform--whatsapp { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.ct-platform--instagram { background: #fdf2f8; color: #be185d; border-color: #fbcfe8; }
.ct-platform--messenger { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }

.ct-identifier { display: inline-flex; align-items: center; gap: 4px; }
.ct-copy { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: none; border-radius: 6px; color: var(--ct-faint); cursor: pointer; opacity: 0; transition: opacity .15s, background-color .15s, color .15s; }
.ct-row:hover .ct-copy, .ct-copy:focus-visible { opacity: 1; }
.ct-copy:hover { background: var(--ct-line-soft); color: var(--ct-ink); }

.ct-group-chip, .ct-ad-chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 6px; font-size: 12.5px; font-weight: 600; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.ct-group-chip { background: var(--ct-primary-soft); color: var(--ct-primary-hover); }
.ct-ad-chip { background: var(--ct-warn-soft); color: var(--ct-warn); }

.ct-status { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; }
.ct-status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.ct-status--active { color: var(--ct-good); }
.ct-status--invalid { color: var(--ct-bad); }
.ct-status--pending { color: var(--ct-muted); }

.ct-date { display: flex; flex-direction: column; line-height: 1.35; }
.ct-date-day { color: var(--ct-ink); font-size: 13px; }
.ct-date-time { color: var(--ct-faint); font-size: 12px; }

/* Pagination */
.ct-pagination { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px; border-top: 1px solid var(--ct-line); background: var(--ct-surface); }
.ct-page-info { font-size: 13px; color: var(--ct-muted); }
.ct-page-info strong { color: var(--ct-ink); font-weight: 600; }
.ct-page-controls { display: flex; align-items: center; gap: 4px; }
.ct-page-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 8px; border: 1px solid transparent; border-radius: 6px; background: none; color: var(--ct-text); font-size: 13px; font-weight: 600; cursor: pointer; font-variant-numeric: tabular-nums; transition: background-color .15s; }
.ct-page-btn:hover:not(:disabled):not(.is-current) { background: var(--ct-line-soft); }
.ct-page-btn:disabled { opacity: .4; cursor: not-allowed; }
.ct-page-btn.is-current { background: var(--ct-ink); color: #fff; }
.ct-page-gap { padding: 0 4px; color: var(--ct-faint); }

/* Empty & loading */
.ct-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 16px; white-space: normal; }
.ct-empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--ct-line-soft); color: var(--ct-muted); margin-bottom: 14px; }
.ct-empty-title { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--ct-ink); }
.ct-empty-text { margin: 0 0 18px; max-width: 360px; color: var(--ct-muted); font-size: 13.5px; }
.ct-empty-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

.ct-skeleton-list { padding: 8px 16px; }
.ct-skeleton-row { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--ct-line-soft); }
.ct-skeleton-row:last-child { border-bottom: none; }
.ct-skeleton { display: block; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #eef2f6 25%, #f8fafc 37%, #eef2f6 63%); background-size: 400% 100%; animation: ct-shimmer 1.4s ease infinite; }
.ct-skeleton--avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.ct-skeleton--wide { flex: 2; }
.ct-skeleton--mid { flex: 1.2; }
.ct-skeleton--short { flex: .6; }
@keyframes ct-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* Groups tab */
.ct-groups { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 20px; align-items: start; }
.ct-panel { padding: 20px; }
.ct-panel-title { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: var(--ct-ink); }
.ct-panel-text { margin: 0 0 16px; color: var(--ct-muted); font-size: 13.5px; }
.ct-group-name { display: inline-flex; align-items: center; gap: 12px; font-weight: 600; color: var(--ct-ink); font-size: 14px; }
.ct-group-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--ct-primary-soft); color: var(--ct-primary); }
.ct-row-actions { display: inline-flex; align-items: center; gap: 12px; }

/* Forms */
.ct-form { display: flex; flex-direction: column; gap: 16px; }
.ct-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ct-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ct-label { font-size: 13px; font-weight: 600; color: var(--ct-ink); }
.ct-optional { margin-left: 4px; font-weight: 400; color: var(--ct-faint); font-size: 12px; }
.ct-hint { margin: 0; font-size: 12.5px; color: var(--ct-muted); }
.ct-hint--flush { margin-top: -8px; }
.ct-error { margin: 0; font-size: 12.5px; color: var(--ct-bad); font-weight: 500; }

.ct-segmented { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px; background: var(--ct-line-soft); border-radius: 10px; }
.ct-segment { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 34px; border: none; border-radius: 7px; background: transparent; color: var(--ct-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color .15s, color .15s, box-shadow .15s; }
.ct-segment:hover:not(.is-active) { color: var(--ct-ink); }
.ct-segment.is-active { background: var(--ct-surface); color: var(--ct-ink); box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
.ct-segment--whatsapp.is-active { color: #15803d; }
.ct-segment--instagram.is-active { color: #be185d; }
.ct-segment--messenger.is-active { color: #1d4ed8; }

/* Modals */
.ct-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, .5); backdrop-filter: blur(2px); animation: ct-fade .15s ease; }
.ct-backdrop--top { z-index: 1100; }
.ct-modal { width: 100%; max-width: 500px; max-height: 92vh; overflow-y: auto; padding: 24px; background: var(--ct-surface); border-radius: 14px; box-shadow: 0 24px 48px -12px rgba(15, 23, 42, .35); animation: ct-pop .18s ease; }
.ct-modal--wide { max-width: 620px; }
.ct-modal--wide > * + * { margin-top: 16px; }
.ct-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
.ct-modal--wide .ct-modal-header { margin-bottom: 4px; }
.ct-modal-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--ct-ink); letter-spacing: -0.01em; }
.ct-modal-sub { margin: 2px 0 0; font-size: 13px; color: var(--ct-muted); }
.ct-modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
@keyframes ct-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ct-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

.ct-modal--confirm { max-width: 420px; text-align: center; }
.ct-confirm-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; margin-bottom: 14px; }
.ct-confirm-icon--danger { background: var(--ct-bad-soft); color: var(--ct-bad); }
.ct-confirm-icon--primary { background: var(--ct-primary-soft); color: var(--ct-primary); }
.ct-confirm-title { margin: 0 0 6px; font-size: 17px; font-weight: 700; color: var(--ct-ink); }
.ct-confirm-text { margin: 0 0 20px; color: var(--ct-muted); font-size: 13.5px; }
.ct-confirm-actions { display: flex; gap: 8px; }
.ct-confirm-actions .ct-btn { flex: 1; }

/* Verification report */
.ct-verify-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.ct-verify-stat { padding: 14px; border: 1px solid var(--ct-line); border-radius: 10px; background: var(--ct-surface-alt); display: flex; flex-direction: column; gap: 2px; }
.ct-verify-stat--good { background: var(--ct-good-soft); border-color: #bbf7d0; }
.ct-verify-stat--bad { background: var(--ct-bad-soft); border-color: #fecaca; }
.ct-verify-label { font-size: 12.5px; color: var(--ct-muted); }
.ct-verify-value { font-size: 24px; font-weight: 700; color: var(--ct-ink); font-variant-numeric: tabular-nums; }
.ct-verify-stat--good .ct-verify-value, .ct-verify-stat--good .ct-verify-label { color: var(--ct-good); }
.ct-verify-stat--bad .ct-verify-value, .ct-verify-stat--bad .ct-verify-label { color: var(--ct-bad); }

.ct-callout { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border-radius: 10px; border: 1px solid var(--ct-line); background: var(--ct-surface-alt); }
.ct-callout--danger { background: var(--ct-bad-soft); border-color: #fecaca; align-items: center; justify-content: space-between; }
.ct-callout--good { background: var(--ct-good-soft); border-color: #bbf7d0; }
.ct-callout--info { background: var(--ct-primary-soft); border-color: #c7d7fe; }
.ct-callout-icon { color: var(--ct-primary); margin-top: 1px; }
.ct-callout-body { flex: 1; min-width: 0; }
.ct-callout-title { margin: 0 0 2px; font-size: 14px; font-weight: 600; color: var(--ct-ink); }
.ct-callout-text { margin: 0 0 8px; font-size: 13px; color: var(--ct-text); }
.ct-callout--danger .ct-callout-text { margin: 0; }
.ct-callout-row { display: flex; gap: 8px; }
.ct-callout-row .ct-select { flex: 1; }

/* Import */
.ct-file-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.ct-dropzone { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 24px 16px; border: 1.5px dashed #cbd5e1; border-radius: 10px; background: var(--ct-surface-alt); cursor: pointer; transition: border-color .15s, background-color .15s; }
.ct-dropzone:hover, .ct-dropzone.is-drag { border-color: var(--ct-primary); background: var(--ct-primary-soft); }
.ct-dropzone-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--ct-surface); border: 1px solid var(--ct-line); color: var(--ct-primary); margin-bottom: 8px; }
.ct-dropzone-title { font-size: 14px; font-weight: 600; color: var(--ct-ink); }
.ct-dropzone-text { font-size: 12.5px; color: var(--ct-muted); }
.ct-file-chip { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--ct-line); border-radius: 10px; background: var(--ct-surface-alt); }
.ct-file-chip-icon { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; background: var(--ct-good-soft); color: var(--ct-good); }
.ct-file-chip-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.ct-file-chip-name { font-size: 14px; font-weight: 600; color: var(--ct-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ct-file-chip-size { font-size: 12.5px; color: var(--ct-muted); }

/* Toasts */
.ct-toasts { position: fixed; top: 20px; right: 20px; z-index: 1200; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.ct-toast { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 14px 14px 16px; background: var(--ct-surface); border: 1px solid var(--ct-line); border-radius: 12px; box-shadow: 0 16px 32px -8px rgba(15, 23, 42, .22), 0 2px 6px rgba(15, 23, 42, .06); overflow: hidden; pointer-events: auto; animation: ct-toast-in .25s cubic-bezier(.2, .8, .2, 1); }
.ct-toast-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; color: #fff; margin-top: 1px; }
.ct-toast--success .ct-toast-icon { background: var(--ct-good); }
.ct-toast--error .ct-toast-icon { background: var(--ct-bad); }
.ct-toast--warning .ct-toast-icon { background: #d97706; }
.ct-toast-body { flex: 1; min-width: 0; }
.ct-toast-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--ct-ink); }
.ct-toast-msg { margin: 2px 0 0; font-size: 13px; color: var(--ct-muted); }
.ct-toast-close { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: none; border-radius: 6px; color: var(--ct-faint); cursor: pointer; flex-shrink: 0; }
.ct-toast-close:hover { background: var(--ct-line-soft); color: var(--ct-ink); }
.ct-toast-timer { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; transform-origin: left; animation: ct-timer 4.5s linear forwards; }
.ct-toast--success .ct-toast-timer { background: var(--ct-good); }
.ct-toast--error .ct-toast-timer { background: var(--ct-bad); }
.ct-toast--warning .ct-toast-timer { background: #d97706; }
@keyframes ct-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes ct-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* Responsive */
@media (max-width: 1100px) {
  .ct-filters { grid-template-columns: 1fr 1fr; }
  .ct-search { grid-column: 1 / -1; }
}
@media (max-width: 900px) {
  .ct-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ct-groups { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .ct-root { padding: 16px; }
  .ct-title { font-size: 21px; }
  .ct-actions { width: 100%; }
  .ct-actions .ct-btn { flex: 1 1 auto; }
  .ct-filters { grid-template-columns: 1fr; }
  .ct-field-row { grid-template-columns: 1fr; }
  .ct-verify-stats { grid-template-columns: 1fr; }
  .ct-callout--danger { flex-direction: column; align-items: stretch; }
  .ct-modal { padding: 20px; }
  .ct-toasts { top: auto; bottom: 16px; right: 16px; left: 16px; width: auto; }
  .ct-pagination { justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .ct-root *, .ct-root *::before, .ct-root *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

export default Contacts;
