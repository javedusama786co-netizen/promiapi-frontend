import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const API_URL = "http://localhost:5000/api/templates";
const META_MANAGER_URL = "https://business.facebook.com/wa/manage/message-templates/";

const EMPTY_FORM = {
  title: "",
  headerType: "none",
  headerText: "",
  content: "",
  footerText: "",
  delayTime: 0,
  mediaFile: null,
  category: "UTILITY",
  language: "en_US",
  buttons: [],
};

const LANGUAGES = [
  { value: "en_US", label: "English (US)" },
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

const BODY_LIMIT = 1024;
const FOOTER_LIMIT = 60;
const HEADER_LIMIT = 60;
const BUTTON_LABEL_LIMIT = 25;
const MAX_BUTTONS = 3;

/* -------------------------------------------------------------------------- */
/*  Icons                                                                     */
/* -------------------------------------------------------------------------- */

const ICON_PATHS = {
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  sync: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  video: (
    <>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  reply: (
    <>
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </>
  ),
  inbox: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  rotate: (
    <>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </>
  ),
};

function Icon({ name, size = 16, strokeWidth = 2, className = "" }) {
  return (
    <svg
      className={`tp-icon ${className}`}
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

function DoubleCheck() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 6 4 9 10 2" />
      <polyline points="6 8.5 7 9 13 2" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const statusKey = (status) => {
  const upper = status ? status.toUpperCase() : "PENDING";
  if (upper === "APPROVED") return "approved";
  if (upper === "REJECTED") return "rejected";
  return "pending";
};

const STATUS_LABELS = { approved: "Approved", rejected: "Rejected", pending: "Pending review" };

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const languageLabel = (code) => LANGUAGES.find((l) => l.value === code)?.label || code || "English (US)";

// Highlights {{1}}-style variables inside the body text
const renderBodyWithVariables = (text) => {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) =>
    /^\{\{\d+\}\}$/.test(part) ? (
      <span key={i} className="tp-var">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

/* -------------------------------------------------------------------------- */
/*  WhatsApp preview                                                          */
/* -------------------------------------------------------------------------- */

function WhatsAppPreview({ headerText, mediaKind, mediaUrl, showMediaSlot, body, bodyPlaceholder, footerText, buttons, time }) {
  const mediaIcon = mediaKind === "video" ? "video" : mediaKind === "document" ? "file" : "image";
  return (
    <div className="tp-chat">
      <div className="tp-bubble">
        {headerText && <div className="tp-bubble-header">{headerText}</div>}

        {showMediaSlot && (
          <div className="tp-bubble-media">
            {mediaUrl && mediaKind === "image" && <img src={mediaUrl} alt="Header" className="tp-bubble-img" />}
            {mediaUrl && mediaKind === "video" && <video src={mediaUrl} className="tp-bubble-img" muted autoPlay loop playsInline />}
            {mediaKind === "document" && (
              <div className="tp-media-ph">
                <Icon name="file" size={20} />
                <span>{mediaUrl ? "PDF document attached" : "PDF document"}</span>
              </div>
            )}
            {!mediaUrl && mediaKind !== "document" && (
              <div className="tp-media-ph">
                <Icon name={mediaIcon} size={20} />
                <span>{mediaKind ? `${mediaKind.charAt(0).toUpperCase()}${mediaKind.slice(1)} header` : "Media header"}</span>
              </div>
            )}
          </div>
        )}

        <div className="tp-bubble-body">
          {body ? renderBodyWithVariables(body) : <span className="tp-bubble-placeholder">{bodyPlaceholder}</span>}
        </div>

        {footerText && <div className="tp-bubble-footer">{footerText}</div>}

        <div className="tp-bubble-time">
          {time}
          <DoubleCheck />
        </div>
      </div>

      {buttons && buttons.length > 0 && (
        <div className="tp-wa-buttons">
          {buttons.map((btn, idx) => (
            <div key={idx} className="tp-wa-btn">
              {btn.buttonType === "url" && <Icon name="external" size={14} />}
              {btn.buttonType === "call" && <Icon name="phone" size={14} />}
              {btn.buttonType === "reply" && <Icon name="reply" size={14} />}
              <span>{btn.buttonText || `Button ${idx + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function Templates() {
  const [activeTab, setActiveTab] = useState("list");
  const [templates, setTemplates] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ------------------------------ Toasts & confirm ------------------------------ */

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = (type, title, message = "") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => dismissToast(id), 4500);
  };

  const askConfirm = (options) =>
    new Promise((resolve) => {
      setConfirmState({ tone: "danger", confirmLabel: "Confirm", ...options, resolve });
    });

  const closeConfirm = (result) => {
    if (confirmState) confirmState.resolve(result);
    setConfirmState(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && confirmState) {
        confirmState.resolve(false);
        setConfirmState(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmState]);

  useEffect(() => {
    document.body.style.overflow = confirmState ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmState]);

  // Release the local preview URL when it changes or the page unmounts
  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  /* --------------------------------- Data & actions --------------------------------- */

  const fetchTemplates = async () => {
    setListLoading(true);
    setListError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      setListError("We couldn't load your templates. Check your connection and try again.");
    } finally {
      setListLoading(false);
    }
  };

  const handleMetaSync = async () => {
    setSyncLoading(true);
    setListError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/sync-meta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        triggerToast("success", "Templates synced", "Your Meta Cloud templates are now up to date in the database.");
        fetchTemplates();
      }
    } catch (err) {
      console.error("Meta Sync Error:", err);
      const errMsg = err.response?.data?.message || "Failed to sync templates from the Meta API.";
      triggerToast("error", "Sync failed", errMsg);
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (template) => {
    const ok = await askConfirm({
      title: "Delete this template?",
      message: `"${template.title || template.name}" will be removed from your database. This can't be undone.`,
      confirmLabel: "Delete template",
    });
    if (!ok) return;
    const id = template._id;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTemplates((prev) => prev.filter((t) => t._id !== id));
        triggerToast("success", "Template deleted", `"${template.title || template.name}" has been removed.`);
      }
    } catch (err) {
      triggerToast("error", "Couldn't delete the template", "Something went wrong. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------ Form ------------------------------------ */

  const addVariableToContent = () => {
    const matches = formData.content.match(/\{\{\d+\}\}/g) || [];
    const nextVarIndex = matches.length + 1;
    const variableText = `{{${nextVarIndex}}}`;
    setFormData((prev) => ({
      ...prev,
      content: prev.content + ` ${variableText}`,
    }));
  };

  const addButton = () => {
    if (formData.buttons.length >= MAX_BUTTONS) {
      triggerToast("warning", "Button limit reached", "WhatsApp supports a maximum of 3 action buttons per template.");
      return;
    }
    setFormData({
      ...formData,
      buttons: [...formData.buttons, { buttonText: "", buttonType: "reply", value: "" }],
    });
  };

  const handleButtonChange = (index, field, value) => {
    const updatedButtons = formData.buttons.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    setFormData({ ...formData, buttons: updatedButtons });
  };

  const removeButton = (index) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index),
    });
  };

  const acceptMediaFile = (file) => {
    if (!file) return;
    setFormData((prev) => ({ ...prev, mediaFile: file }));
    setMediaPreviewUrl(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, media: undefined }));
  };

  const handleFileChange = (e) => {
    acceptMediaFile(e.target.files[0]);
  };

  const clearMediaFile = () => {
    setFormData((prev) => ({ ...prev, mediaFile: null }));
    setMediaPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMediaDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const type = formData.headerType;
    const valid =
      (type === "image" && file.type.startsWith("image/")) ||
      (type === "video" && file.type.startsWith("video/")) ||
      (type === "document" && file.type === "application/pdf");
    if (!valid) {
      triggerToast("warning", "Unsupported file", `Upload a ${type === "document" ? "PDF" : type} file for this header type.`);
      return;
    }
    acceptMediaFile(file);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setMediaPreviewUrl("");
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const nameLooksValid = /^[a-z0-9_]+$/.test(formData.title);

  const validateForm = () => {
    const next = {};
    if (!formData.title.trim()) next.title = "Give your template a name.";
    if (formData.headerType === "text" && !formData.headerText.trim()) next.headerText = "Enter the header text.";
    if (["image", "document", "video"].includes(formData.headerType) && !formData.mediaFile) {
      next.media = "Upload a file for this header.";
    }
    if (!formData.content.trim()) next.content = "The message body can't be empty.";

    const buttonErrors = {};
    formData.buttons.forEach((btn, i) => {
      const e = {};
      if (!btn.buttonText.trim()) e.buttonText = "Add a label.";
      if (btn.buttonType !== "reply" && !btn.value.trim()) {
        e.value = btn.buttonType === "url" ? "Add a link." : "Add a phone number.";
      }
      if (Object.keys(e).length) buttonErrors[i] = e;
    });
    if (Object.keys(buttonErrors).length) next.buttons = buttonErrors;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerToast("warning", "Check the highlighted fields", "Some required fields are missing.");
      return;
    }
    setFormLoading(true);

    try {
      const token = localStorage.getItem("token");

      const dataToSend = new FormData();
      dataToSend.append("title", formData.title);
      dataToSend.append("headerType", formData.headerType);
      dataToSend.append("headerText", formData.headerText);
      dataToSend.append("content", formData.content);
      dataToSend.append("footerText", formData.footerText);
      dataToSend.append("delayTime", formData.delayTime);
      dataToSend.append("category", formData.category);
      dataToSend.append("language", formData.language);
      dataToSend.append("buttons", JSON.stringify(formData.buttons));

      if (formData.mediaFile) {
        dataToSend.append("media", formData.mediaFile);
      }

      const res = await axios.post(API_URL, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success || res.status === 200 || res.status === 201) {
        triggerToast("success", "Template submitted successfully", `"${formData.title}" has been saved.`);
        resetForm();
        fetchTemplates();
        setTimeout(() => {
          setActiveTab("list");
        }, 1200);
      }
    } catch (err) {
      console.error("Error creating template:", err);
      triggerToast(
        "error",
        "Couldn't save the template",
        err.response?.data?.message || "Verify that the backend is running and your session is valid."
      );
    } finally {
      setFormLoading(false);
    }
  };

  /* ---------------------------------- Derived ---------------------------------- */

  const counts = {
    total: templates.length,
    approved: templates.filter((t) => statusKey(t.status) === "approved").length,
    pending: templates.filter((t) => statusKey(t.status) === "pending").length,
    rejected: templates.filter((t) => statusKey(t.status) === "rejected").length,
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesStatus = statusFilter === "all" || statusKey(t.status) === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const rawBody = t.components?.find((c) => c.type === "BODY");
    const haystack = `${t.title || ""} ${t.name || ""} ${t.content || rawBody?.text || ""}`.toLowerCase();
    return matchesStatus && (!q || haystack.includes(q));
  });

  const hasFilters = searchQuery !== "" || statusFilter !== "all";
  const currentTimeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const detectedVariables = Array.from(new Set(formData.content.match(/\{\{\d+\}\}/g) || []));
  const isMediaHeader = ["image", "document", "video"].includes(formData.headerType);

  const renderToastIcon = (type) => {
    if (type === "success") return <Icon name="check" size={14} strokeWidth={3} />;
    if (type === "error") return <Icon name="x" size={14} strokeWidth={3} />;
    return <Icon name="alert" size={14} strokeWidth={2.5} />;
  };

  /* ------------------------------------ JSX ------------------------------------ */

  return (
    <div className="tp-root">
      <style>{CSS}</style>

      {/* Toasts */}
      <div className="tp-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`tp-toast tp-toast--${t.type}`} role="status">
            <span className="tp-toast-icon">{renderToastIcon(t.type)}</span>
            <div className="tp-toast-body">
              <p className="tp-toast-title">{t.title}</p>
              {t.message && <p className="tp-toast-msg">{t.message}</p>}
            </div>
            <button type="button" className="tp-toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
              <Icon name="x" size={14} />
            </button>
            <span className="tp-toast-timer" />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="tp-header">
        <div>
          <h1 className="tp-title">Message Templates</h1>
          <p className="tp-subtitle">Create, preview and manage WhatsApp templates, and keep them in sync with Meta.</p>
        </div>
        <div className="tp-actions">
          <a href={META_MANAGER_URL} target="_blank" rel="noopener noreferrer" className="tp-btn tp-btn--ghost">
            <Icon name="external" size={16} /> Meta Manager
          </a>
          <button type="button" className="tp-btn tp-btn--ghost" onClick={handleMetaSync} disabled={syncLoading}>
            <Icon name="sync" size={16} className={syncLoading ? "tp-spin" : ""} />
            {syncLoading ? "Syncing…" : "Sync from Meta"}
          </button>
          <button type="button" className="tp-btn tp-btn--primary" onClick={() => setActiveTab("create")}>
            <Icon name="plus" size={16} /> New template
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="tp-summary" aria-label="Template summary">
        <div className="tp-stat">
          <span className="tp-stat-label">Total templates</span>
          <span className="tp-stat-value">{listLoading ? "–" : counts.total}</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-label">Approved</span>
          <span className="tp-stat-value tp-stat-value--good">{listLoading ? "–" : counts.approved}</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-label">Pending review</span>
          <span className="tp-stat-value tp-stat-value--warn">{listLoading ? "–" : counts.pending}</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-label">Rejected</span>
          <span className={`tp-stat-value ${counts.rejected > 0 ? "tp-stat-value--bad" : ""}`}>{listLoading ? "–" : counts.rejected}</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="tp-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "list"}
          className={`tp-tab ${activeTab === "list" ? "is-active" : ""}`}
          onClick={() => {
            setActiveTab("list");
            setListError("");
          }}
        >
          <Icon name="layers" size={16} /> Saved templates <span className="tp-tab-count">{templates.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "create"}
          className={`tp-tab ${activeTab === "create" ? "is-active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          <Icon name="plus" size={16} /> Create template
        </button>
      </div>

      {/* ------------------------------- LIST TAB ------------------------------- */}
      {activeTab === "list" && (
        <div>
          {!listLoading && !listError && templates.length > 0 && (
            <div className="tp-toolbar">
              <div className="tp-search">
                <Icon name="search" size={16} className="tp-search-icon" />
                <input
                  type="text"
                  className="tp-input tp-search-input"
                  placeholder="Search by name or message text"
                  aria-label="Search templates"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="tp-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
              <div className="tp-chips" role="group" aria-label="Filter by status">
                {[
                  ["all", "All"],
                  ["approved", "Approved"],
                  ["pending", "Pending"],
                  ["rejected", "Rejected"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`tp-chip ${statusFilter === value ? "is-active" : ""}`}
                    aria-pressed={statusFilter === value}
                    onClick={() => setStatusFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listLoading ? (
            <div className="tp-grid" aria-busy="true" aria-label="Loading templates">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="tp-card tp-card--skeleton">
                  <span className="tp-skeleton tp-skeleton--title" />
                  <span className="tp-skeleton tp-skeleton--chips" />
                  <span className="tp-skeleton tp-skeleton--block" />
                </div>
              ))}
            </div>
          ) : listError ? (
            <div className="tp-card tp-empty">
              <span className="tp-empty-icon tp-empty-icon--bad">
                <Icon name="alert" size={22} />
              </span>
              <p className="tp-empty-title">Couldn't load templates</p>
              <p className="tp-empty-text">{listError}</p>
              <button type="button" className="tp-btn tp-btn--ghost" onClick={fetchTemplates}>
                <Icon name="rotate" size={16} /> Try again
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="tp-card tp-empty">
              <span className="tp-empty-icon">
                <Icon name="inbox" size={22} />
              </span>
              <p className="tp-empty-title">No templates yet</p>
              <p className="tp-empty-text">Create your first template, or sync the ones you already have in Meta.</p>
              <div className="tp-empty-actions">
                <button type="button" className="tp-btn tp-btn--primary" onClick={() => setActiveTab("create")}>
                  <Icon name="plus" size={16} /> Create template
                </button>
                <button type="button" className="tp-btn tp-btn--ghost" onClick={handleMetaSync} disabled={syncLoading}>
                  <Icon name="sync" size={16} /> Sync from Meta
                </button>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="tp-card tp-empty">
              <span className="tp-empty-icon">
                <Icon name="search" size={22} />
              </span>
              <p className="tp-empty-title">No templates match your search</p>
              <p className="tp-empty-text">Try a different keyword or status.</p>
              {hasFilters && (
                <button
                  type="button"
                  className="tp-btn tp-btn--ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="tp-grid">
              {filteredTemplates.map((template) => {
                const rawHeader = template.components?.find((c) => c.type === "HEADER");
                const rawBody = template.components?.find((c) => c.type === "BODY");
                const rawFooter = template.components?.find((c) => c.type === "FOOTER");
                const key = statusKey(template.status);

                const headerText = template.headerText || rawHeader?.text || "";
                const rawFormat = rawHeader && rawHeader.format && rawHeader.format !== "TEXT" ? rawHeader.format.toLowerCase() : null;
                const mediaKind =
                  template.headerType && !["none", "text"].includes(template.headerType) ? template.headerType : rawFormat;

                return (
                  <article key={template._id} className="tp-card">
                    <div className="tp-card-head">
                      <h3 className="tp-card-title">{template.title || template.name}</h3>
                      <button
                        type="button"
                        className="tp-icon-btn tp-icon-btn--danger"
                        onClick={() => handleDelete(template)}
                        disabled={deletingId === template._id}
                        aria-label={`Delete ${template.title || template.name}`}
                        title="Delete template"
                      >
                        {deletingId === template._id ? <span className="tp-spinner tp-spinner--dark" /> : <Icon name="trash" size={16} />}
                      </button>
                    </div>

                    <div className="tp-meta">
                      <span className={`tp-status tp-status--${key}`}>
                        <span className="tp-status-dot" />
                        {STATUS_LABELS[key]}
                      </span>
                      <span className="tp-tag">{template.category || "UTILITY"}</span>
                      <span className="tp-tag">{languageLabel(template.language)}</span>
                      <span className="tp-tag tp-tag--icon">
                        <Icon name="clock" size={12} /> {template.delayTime || 0}s delay
                      </span>
                    </div>

                    <div className="tp-card-preview">
                      <WhatsAppPreview
                        headerText={headerText}
                        mediaKind={mediaKind}
                        mediaUrl={template.mediaUrl}
                        showMediaSlot={Boolean(mediaKind)}
                        body={template.content || rawBody?.text || ""}
                        bodyPlaceholder="No message body"
                        footerText={template.footerText || rawFooter?.text || ""}
                        buttons={template.buttons}
                        time={currentTimeString}
                      />
                    </div>

                    <div className="tp-card-foot">
                      <a href={META_MANAGER_URL} target="_blank" rel="noopener noreferrer" className="tp-link">
                        Open in Meta <Icon name="external" size={13} />
                      </a>
                      {template.buttons?.length > 0 && (
                        <span className="tp-card-note">
                          {template.buttons.length} button{template.buttons.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ CREATE TAB ------------------------------ */}
      {activeTab === "create" && (
        <div className="tp-create">
          <form onSubmit={handleSubmit} className="tp-card tp-form" noValidate>
            {/* Details */}
            <fieldset className="tp-fieldset">
              <legend className="tp-legend">Details</legend>

              <div className="tp-field">
                <label className="tp-label" htmlFor="tp-title">
                  Template name
                </label>
                <input
                  id="tp-title"
                  type="text"
                  className={`tp-input ${errors.title ? "has-error" : ""}`}
                  placeholder="promotional_alert_style"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: undefined });
                  }}
                  aria-invalid={!!errors.title}
                />
                {errors.title ? (
                  <p className="tp-error">{errors.title}</p>
                ) : formData.title && !nameLooksValid ? (
                  <p className="tp-warn">Meta only accepts lowercase letters, numbers and underscores in template names.</p>
                ) : (
                  <p className="tp-hint">Use lowercase letters, numbers and underscores, e.g. order_update.</p>
                )}
              </div>

              <div className="tp-field-row">
                <div className="tp-field">
                  <label className="tp-label" htmlFor="tp-category">
                    Category
                  </label>
                  <select
                    id="tp-category"
                    className="tp-input tp-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                  </select>
                </div>
                <div className="tp-field">
                  <label className="tp-label" htmlFor="tp-language">
                    Language
                  </label>
                  <select
                    id="tp-language"
                    className="tp-input tp-select"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Header */}
            <fieldset className="tp-fieldset">
              <legend className="tp-legend">Header</legend>

              <div className="tp-field">
                <label className="tp-label" htmlFor="tp-header-type">
                  Header type
                </label>
                <select
                  id="tp-header-type"
                  className="tp-input tp-select"
                  value={formData.headerType}
                  onChange={(e) => {
                    setFormData({ ...formData, headerType: e.target.value, headerText: "", mediaFile: null });
                    setMediaPreviewUrl("");
                    setErrors({ ...errors, headerText: undefined, media: undefined });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <option value="none">No header</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="document">Document (PDF)</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {formData.headerType === "text" && (
                <div className="tp-field">
                  <div className="tp-label-row">
                    <label className="tp-label" htmlFor="tp-header-text">
                      Header text
                    </label>
                    <span className="tp-counter">
                      {formData.headerText.length}/{HEADER_LIMIT}
                    </span>
                  </div>
                  <input
                    id="tp-header-text"
                    type="text"
                    maxLength={HEADER_LIMIT}
                    className={`tp-input ${errors.headerText ? "has-error" : ""}`}
                    placeholder="e.g. Important update"
                    value={formData.headerText}
                    onChange={(e) => {
                      setFormData({ ...formData, headerText: e.target.value });
                      if (errors.headerText) setErrors({ ...errors, headerText: undefined });
                    }}
                    aria-invalid={!!errors.headerText}
                  />
                  {errors.headerText && <p className="tp-error">{errors.headerText}</p>}
                </div>
              )}

              {isMediaHeader && (
                <div className="tp-field">
                  <span className="tp-label">Header file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={formData.headerType === "image" ? "image/*" : formData.headerType === "video" ? "video/*" : "application/pdf"}
                    className="tp-file-input"
                    onChange={handleFileChange}
                    tabIndex={-1}
                  />
                  {formData.mediaFile ? (
                    <div className="tp-file-chip">
                      <span className="tp-file-chip-icon">
                        <Icon name={formData.headerType === "video" ? "video" : formData.headerType === "document" ? "file" : "image"} size={18} />
                      </span>
                      <span className="tp-file-chip-text">
                        <span className="tp-file-chip-name">{formData.mediaFile.name}</span>
                        <span className="tp-file-chip-size">{formatFileSize(formData.mediaFile.size)}</span>
                      </span>
                      <button type="button" className="tp-icon-btn" onClick={clearMediaFile} aria-label="Remove file">
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`tp-dropzone ${dragActive ? "is-drag" : ""} ${errors.media ? "has-error" : ""}`}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleMediaDrop}
                    >
                      <span className="tp-dropzone-icon">
                        <Icon name="upload" size={20} />
                      </span>
                      <span className="tp-dropzone-title">Drop your file here, or browse</span>
                      <span className="tp-dropzone-text">
                        {formData.headerType === "image" ? "PNG or JPG" : formData.headerType === "video" ? "MP4 video" : "PDF document"}
                      </span>
                    </button>
                  )}
                  {errors.media && <p className="tp-error">{errors.media}</p>}
                </div>
              )}
            </fieldset>

            {/* Message */}
            <fieldset className="tp-fieldset">
              <legend className="tp-legend">Message</legend>

              <div className="tp-field">
                <div className="tp-label-row">
                  <label className="tp-label" htmlFor="tp-body">
                    Body text
                  </label>
                  <div className="tp-label-tools">
                    <span className="tp-counter">
                      {formData.content.length}/{BODY_LIMIT}
                    </span>
                    <button type="button" className="tp-mini-btn" onClick={addVariableToContent}>
                      <Icon name="plus" size={12} strokeWidth={2.5} /> Add variable
                    </button>
                  </div>
                </div>
                <textarea
                  id="tp-body"
                  rows="5"
                  maxLength={BODY_LIMIT}
                  className={`tp-input tp-textarea ${errors.content ? "has-error" : ""}`}
                  placeholder="Write your message. Use Add variable, or type {{1}} for personalised values."
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    if (errors.content) setErrors({ ...errors, content: undefined });
                  }}
                  aria-invalid={!!errors.content}
                />
                {errors.content && <p className="tp-error">{errors.content}</p>}
                {detectedVariables.length > 0 && (
                  <p className="tp-hint">
                    {detectedVariables.length} variable{detectedVariables.length === 1 ? "" : "s"} in this message:{" "}
                    {detectedVariables.map((v) => (
                      <span key={v} className="tp-var tp-var--inline">
                        {v}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <div className="tp-field">
                <div className="tp-label-row">
                  <label className="tp-label" htmlFor="tp-footer">
                    Footer <span className="tp-optional">Optional</span>
                  </label>
                  <span className="tp-counter">
                    {formData.footerText.length}/{FOOTER_LIMIT}
                  </span>
                </div>
                <input
                  id="tp-footer"
                  type="text"
                  maxLength={FOOTER_LIMIT}
                  className="tp-input"
                  placeholder="e.g. Reply STOP to unsubscribe"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                />
              </div>
            </fieldset>

            {/* Buttons */}
            <fieldset className="tp-fieldset">
              <legend className="tp-legend">Buttons</legend>

              <div className="tp-label-row">
                <span className="tp-hint tp-hint--flush">
                  {formData.buttons.length} of {MAX_BUTTONS} buttons added
                </span>
                <button type="button" className="tp-mini-btn" onClick={addButton} disabled={formData.buttons.length >= MAX_BUTTONS}>
                  <Icon name="plus" size={12} strokeWidth={2.5} /> Add button
                </button>
              </div>

              {formData.buttons.length === 0 && <p className="tp-hint">Buttons are optional. Add quick replies, a link or a call button.</p>}

              {formData.buttons.map((btn, index) => {
                const be = errors.buttons?.[index] || {};
                return (
                  <div key={index} className="tp-button-card">
                    <div className="tp-button-grid">
                      <div className="tp-field">
                        <label className="tp-label tp-label--sm" htmlFor={`tp-btn-type-${index}`}>
                          Type
                        </label>
                        <select
                          id={`tp-btn-type-${index}`}
                          className="tp-input tp-select"
                          value={btn.buttonType}
                          onChange={(e) => handleButtonChange(index, "buttonType", e.target.value)}
                        >
                          <option value="reply">Quick reply</option>
                          <option value="url">Link (URL)</option>
                          <option value="call">Call phone</option>
                        </select>
                      </div>
                      <div className="tp-field">
                        <label className="tp-label tp-label--sm" htmlFor={`tp-btn-label-${index}`}>
                          Label
                        </label>
                        <input
                          id={`tp-btn-label-${index}`}
                          type="text"
                          maxLength={BUTTON_LABEL_LIMIT}
                          className={`tp-input ${be.buttonText ? "has-error" : ""}`}
                          placeholder="e.g. Shop now"
                          value={btn.buttonText}
                          onChange={(e) => handleButtonChange(index, "buttonText", e.target.value)}
                          aria-invalid={!!be.buttonText}
                        />
                        {be.buttonText && <p className="tp-error">{be.buttonText}</p>}
                      </div>
                      {btn.buttonType !== "reply" && (
                        <div className="tp-field tp-field--wide">
                          <label className="tp-label tp-label--sm" htmlFor={`tp-btn-value-${index}`}>
                            {btn.buttonType === "url" ? "Link" : "Phone number"}
                          </label>
                          <input
                            id={`tp-btn-value-${index}`}
                            type="text"
                            className={`tp-input ${be.value ? "has-error" : ""}`}
                            placeholder={btn.buttonType === "url" ? "https://example.com" : "+923001234567"}
                            value={btn.value}
                            onChange={(e) => handleButtonChange(index, "value", e.target.value)}
                            aria-invalid={!!be.value}
                          />
                          {be.value && <p className="tp-error">{be.value}</p>}
                        </div>
                      )}
                    </div>
                    <button type="button" className="tp-icon-btn tp-icon-btn--danger" onClick={() => removeButton(index)} aria-label={`Remove button ${index + 1}`} title="Remove button">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                );
              })}
            </fieldset>

            {/* Delivery */}
            <fieldset className="tp-fieldset">
              <legend className="tp-legend">Delivery</legend>
              <div className="tp-field tp-field--narrow">
                <label className="tp-label" htmlFor="tp-delay">
                  Delay before sending
                </label>
                <div className="tp-suffix">
                  <input
                    id="tp-delay"
                    type="number"
                    min="0"
                    className="tp-input"
                    value={formData.delayTime}
                    onChange={(e) => setFormData({ ...formData, delayTime: Math.max(0, Number(e.target.value)) })}
                  />
                  <span className="tp-suffix-text">seconds</span>
                </div>
              </div>
            </fieldset>

            <div className="tp-form-footer">
              <button type="button" className="tp-btn tp-btn--ghost" onClick={resetForm} disabled={formLoading}>
                Reset form
              </button>
              <button type="submit" className="tp-btn tp-btn--primary" disabled={formLoading}>
                {formLoading ? <span className="tp-spinner" /> : <Icon name="check" size={16} strokeWidth={2.5} />}
                {formLoading ? "Saving template…" : "Submit template"}
              </button>
            </div>
          </form>

          {/* Live preview */}
          <aside className="tp-card tp-preview" aria-label="Live preview">
            <div className="tp-preview-head">
              <h2 className="tp-section-title">Live preview</h2>
              <p className="tp-section-sub">How your template will look in WhatsApp.</p>
            </div>
            <div className="tp-phone">
              <div className="tp-phone-header">
                <span className="tp-phone-avatar">
                  <Icon name="inbox" size={16} />
                </span>
                <div>
                  <div className="tp-phone-title">WhatsApp Business</div>
                  <div className="tp-phone-sub">Business account</div>
                </div>
              </div>
              <div className="tp-phone-body">
                <WhatsAppPreview
                  headerText={formData.headerType === "text" ? formData.headerText : ""}
                  mediaKind={isMediaHeader ? formData.headerType : null}
                  mediaUrl={mediaPreviewUrl}
                  showMediaSlot={isMediaHeader}
                  body={formData.content}
                  bodyPlaceholder="Your message body will appear here."
                  footerText={formData.footerText}
                  buttons={formData.buttons}
                  time={currentTimeString}
                />
              </div>
            </div>
            <div className="tp-note">
              <Icon name="info" size={15} className="tp-note-icon" />
              <p>New templates are reviewed by Meta before they can be used in campaigns. Approval usually takes a few minutes to a day.</p>
            </div>
          </aside>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmState && (
        <div className="tp-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeConfirm(false)}>
          <div className="tp-modal" role="alertdialog" aria-modal="true" aria-labelledby="tp-confirm-title">
            <span className={`tp-confirm-icon tp-confirm-icon--${confirmState.tone}`}>
              <Icon name="alert" size={20} />
            </span>
            <h3 className="tp-confirm-title" id="tp-confirm-title">
              {confirmState.title}
            </h3>
            <p className="tp-confirm-text">{confirmState.message}</p>
            <div className="tp-confirm-actions">
              <button type="button" className="tp-btn tp-btn--ghost" onClick={() => closeConfirm(false)}>
                Cancel
              </button>
              <button type="button" autoFocus className="tp-btn tp-btn--danger" onClick={() => closeConfirm(true)}>
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
.tp-root {
  --tp-ink: #0f172a;
  --tp-text: #334155;
  --tp-muted: #64748b;
  --tp-faint: #94a3b8;
  --tp-line: #e2e8f0;
  --tp-line-soft: #eef2f6;
  --tp-surface: #ffffff;
  --tp-surface-alt: #f8fafc;
  --tp-primary: #1d4ed8;
  --tp-primary-hover: #1e40af;
  --tp-primary-soft: #eff4ff;
  --tp-good: #15803d;
  --tp-good-soft: #ecfdf3;
  --tp-bad: #b91c1c;
  --tp-bad-soft: #fef2f2;
  --tp-warn: #b45309;
  --tp-warn-soft: #fffbeb;
  --tp-wa: #008069;
  --tp-radius: 8px;
  --tp-radius-lg: 12px;

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--tp-text);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.tp-root *, .tp-root *::before, .tp-root *::after { box-sizing: border-box; }
.tp-root button { font-family: inherit; }
.tp-icon { flex-shrink: 0; }
.tp-root :focus-visible { outline: 2px solid var(--tp-primary); outline-offset: 2px; }
.tp-spin { animation: tp-spin 1s linear infinite; }
@keyframes tp-spin { to { transform: rotate(360deg); } }

/* Header */
.tp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.tp-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: var(--tp-ink); }
.tp-subtitle { margin: 0; max-width: 560px; color: var(--tp-muted); font-size: 14px; }
.tp-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Buttons */
.tp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: var(--tp-radius); border: 1px solid transparent; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap; transition: background-color .15s, border-color .15s; }
.tp-btn:disabled { opacity: .6; cursor: not-allowed; }
.tp-btn--primary { background: var(--tp-primary); color: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, .12); }
.tp-btn--primary:hover:not(:disabled) { background: var(--tp-primary-hover); }
.tp-btn--ghost { background: var(--tp-surface); color: var(--tp-ink); border-color: var(--tp-line); }
.tp-btn--ghost:hover:not(:disabled) { background: var(--tp-surface-alt); border-color: #cbd5e1; }
.tp-btn--danger { background: var(--tp-bad); color: #fff; }
.tp-btn--danger:hover:not(:disabled) { background: #991b1b; }

.tp-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; color: var(--tp-muted); cursor: pointer; flex-shrink: 0; transition: background-color .15s, color .15s; }
.tp-icon-btn:hover:not(:disabled) { background: var(--tp-line-soft); color: var(--tp-ink); }
.tp-icon-btn--danger:hover:not(:disabled) { background: var(--tp-bad-soft); color: var(--tp-bad); }
.tp-icon-btn:disabled { cursor: not-allowed; opacity: .7; }

.tp-mini-btn { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--tp-line); background: var(--tp-surface); color: var(--tp-primary); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background-color .15s; }
.tp-mini-btn:hover:not(:disabled) { background: var(--tp-primary-soft); }
.tp-mini-btn:disabled { color: var(--tp-faint); cursor: not-allowed; }

.tp-link { display: inline-flex; align-items: center; gap: 5px; color: var(--tp-primary); font-size: 13px; font-weight: 600; text-decoration: none; }
.tp-link:hover { text-decoration: underline; }

.tp-spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: tp-spin .7s linear infinite; }
.tp-spinner--dark { border-color: var(--tp-line); border-top-color: var(--tp-bad); }

/* Summary */
.tp-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
.tp-stat { display: flex; flex-direction: column; gap: 4px; padding: 16px 18px; background: var(--tp-surface); border: 1px solid var(--tp-line); border-radius: var(--tp-radius-lg); }
.tp-stat-label { font-size: 13px; color: var(--tp-muted); }
.tp-stat-value { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; color: var(--tp-ink); font-variant-numeric: tabular-nums; }
.tp-stat-value--good { color: var(--tp-good); }
.tp-stat-value--warn { color: var(--tp-warn); }
.tp-stat-value--bad { color: var(--tp-bad); }

/* Tabs */
.tp-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--tp-line); overflow-x: auto; }
.tp-tab { display: inline-flex; align-items: center; gap: 8px; margin-bottom: -1px; padding: 10px 14px; border: none; border-bottom: 2px solid transparent; background: none; color: var(--tp-muted); font-size: 14px; font-weight: 500; white-space: nowrap; cursor: pointer; transition: color .15s, border-color .15s; }
.tp-tab:hover { color: var(--tp-ink); }
.tp-tab.is-active { color: var(--tp-primary); border-bottom-color: var(--tp-primary); font-weight: 600; }
.tp-tab-count { min-width: 22px; padding: 1px 7px; border-radius: 999px; background: var(--tp-line-soft); color: var(--tp-text); font-size: 12px; font-weight: 600; text-align: center; font-variant-numeric: tabular-nums; }
.tp-tab.is-active .tp-tab-count { background: var(--tp-primary-soft); color: var(--tp-primary); }

/* Cards */
.tp-card { background: var(--tp-surface); border: 1px solid var(--tp-line); border-radius: var(--tp-radius-lg); }

/* Toolbar */
.tp-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.tp-search { position: relative; flex: 1 1 280px; max-width: 420px; }
.tp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--tp-faint); pointer-events: none; }
.tp-search-input { padding-left: 36px; padding-right: 34px; }
.tp-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: none; border-radius: 6px; background: none; color: var(--tp-muted); cursor: pointer; }
.tp-search-clear:hover { background: var(--tp-line-soft); color: var(--tp-ink); }
.tp-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.tp-chip { height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--tp-line); background: var(--tp-surface); color: var(--tp-text); font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color .15s; }
.tp-chip:hover:not(.is-active) { background: var(--tp-surface-alt); }
.tp-chip.is-active { background: var(--tp-ink); border-color: var(--tp-ink); color: #fff; }

/* Inputs */
.tp-input { width: 100%; height: 40px; padding: 0 12px; border-radius: var(--tp-radius); border: 1px solid #cbd5e1; background: var(--tp-surface); color: var(--tp-ink); font-size: 14px; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
.tp-input::placeholder { color: var(--tp-faint); }
.tp-input:hover { border-color: #94a3b8; }
.tp-input:focus { outline: none; border-color: var(--tp-primary); box-shadow: 0 0 0 3px rgba(29, 78, 216, .15); }
.tp-input.has-error { border-color: var(--tp-bad); }
.tp-input.has-error:focus { box-shadow: 0 0 0 3px rgba(185, 28, 28, .15); }
.tp-textarea { height: auto; min-height: 120px; padding: 10px 12px; resize: vertical; line-height: 1.5; }
.tp-select { cursor: pointer; appearance: none; padding-right: 32px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }

/* Grid of template cards */
.tp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; align-items: start; }
.tp-grid > .tp-card { padding: 18px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.tp-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.tp-card-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--tp-ink); word-break: break-word; line-height: 1.4; padding-top: 4px; }
.tp-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tp-tag { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 6px; background: var(--tp-line-soft); color: var(--tp-text); font-size: 12px; font-weight: 600; }
.tp-card-preview { border-radius: 10px; overflow: hidden; }
.tp-card-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid var(--tp-line-soft); }
.tp-card-note { font-size: 12.5px; color: var(--tp-muted); }

.tp-status { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid transparent; }
.tp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tp-status--approved { color: var(--tp-good); background: var(--tp-good-soft); border-color: #bbf7d0; }
.tp-status--rejected { color: var(--tp-bad); background: var(--tp-bad-soft); border-color: #fecaca; }
.tp-status--pending { color: var(--tp-warn); background: var(--tp-warn-soft); border-color: #fde68a; }

/* Empty & skeleton */
.tp-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 16px; }
.tp-empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; margin-bottom: 14px; border-radius: 50%; background: var(--tp-line-soft); color: var(--tp-muted); }
.tp-empty-icon--bad { background: var(--tp-bad-soft); color: var(--tp-bad); }
.tp-empty-title { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--tp-ink); }
.tp-empty-text { margin: 0 0 18px; max-width: 380px; color: var(--tp-muted); font-size: 13.5px; }
.tp-empty-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.tp-card--skeleton { gap: 14px; }
.tp-skeleton { display: block; border-radius: 6px; background: linear-gradient(90deg, #eef2f6 25%, #f8fafc 37%, #eef2f6 63%); background-size: 400% 100%; animation: tp-shimmer 1.4s ease infinite; }
.tp-skeleton--title { height: 16px; width: 60%; }
.tp-skeleton--chips { height: 12px; width: 80%; }
.tp-skeleton--block { height: 150px; border-radius: 10px; }
@keyframes tp-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* Create layout */
.tp-create { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px, .75fr); gap: 24px; align-items: start; }
.tp-form { padding: 8px 24px 24px; }
.tp-fieldset { margin: 0; padding: 20px 0; border: none; border-bottom: 1px solid var(--tp-line-soft); display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.tp-legend { float: left; width: 100%; padding: 0; margin-bottom: 16px; font-size: 15px; font-weight: 700; color: var(--tp-ink); letter-spacing: -0.01em; }
.tp-legend + * { clear: both; }
.tp-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.tp-field--narrow { max-width: 220px; }
.tp-field--wide { grid-column: 1 / -1; }
.tp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.tp-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--tp-ink); }
.tp-label--sm { font-size: 12.5px; color: var(--tp-text); }
.tp-label-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.tp-label-tools { display: flex; align-items: center; gap: 10px; }
.tp-optional { margin-left: 2px; font-weight: 400; font-size: 12px; color: var(--tp-faint); }
.tp-counter { font-size: 12px; color: var(--tp-faint); font-variant-numeric: tabular-nums; }
.tp-hint { margin: 0; font-size: 12.5px; color: var(--tp-muted); }
.tp-hint--flush { margin: 0; }
.tp-warn { margin: 0; font-size: 12.5px; color: var(--tp-warn); font-weight: 500; }
.tp-error { margin: 0; font-size: 12.5px; color: var(--tp-bad); font-weight: 500; }
.tp-suffix { display: flex; align-items: center; gap: 10px; }
.tp-suffix .tp-input { max-width: 120px; }
.tp-suffix-text { font-size: 13px; color: var(--tp-muted); }

.tp-var { display: inline-block; padding: 0 5px; border-radius: 4px; background: #e0e7ff; color: #3730a3; font-weight: 600; }
.tp-var--inline { margin-right: 4px; font-size: 12px; }

.tp-button-card { display: flex; align-items: flex-start; gap: 8px; padding: 12px; border: 1px solid var(--tp-line); border-radius: 10px; background: var(--tp-surface-alt); }
.tp-button-grid { flex: 1; display: grid; grid-template-columns: 150px 1fr; gap: 10px 12px; min-width: 0; }
.tp-button-card > .tp-icon-btn { margin-top: 22px; }

.tp-form-footer { display: flex; justify-content: flex-end; gap: 8px; padding-top: 20px; }

.tp-file-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.tp-dropzone { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 22px 16px; border: 1.5px dashed #cbd5e1; border-radius: 10px; background: var(--tp-surface-alt); cursor: pointer; transition: border-color .15s, background-color .15s; }
.tp-dropzone:hover, .tp-dropzone.is-drag { border-color: var(--tp-primary); background: var(--tp-primary-soft); }
.tp-dropzone.has-error { border-color: var(--tp-bad); }
.tp-dropzone-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-bottom: 8px; border-radius: 50%; background: var(--tp-surface); border: 1px solid var(--tp-line); color: var(--tp-primary); }
.tp-dropzone-title { font-size: 14px; font-weight: 600; color: var(--tp-ink); }
.tp-dropzone-text { font-size: 12.5px; color: var(--tp-muted); }
.tp-file-chip { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--tp-line); border-radius: 10px; background: var(--tp-surface-alt); }
.tp-file-chip-icon { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; background: var(--tp-primary-soft); color: var(--tp-primary); }
.tp-file-chip-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.tp-file-chip-name { font-size: 14px; font-weight: 600; color: var(--tp-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tp-file-chip-size { font-size: 12.5px; color: var(--tp-muted); }

/* Preview panel */
.tp-preview { position: sticky; top: 20px; padding: 20px; }
.tp-preview-head { margin-bottom: 16px; }
.tp-section-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--tp-ink); }
.tp-section-sub { margin: 2px 0 0; font-size: 13px; color: var(--tp-muted); }
.tp-note { display: flex; gap: 10px; margin-top: 16px; padding: 10px 12px; border: 1px solid #c7d7fe; border-radius: var(--tp-radius); background: var(--tp-primary-soft); }
.tp-note p { margin: 0; font-size: 12.5px; color: var(--tp-text); }
.tp-note-icon { margin-top: 2px; color: var(--tp-primary); }

.tp-phone { border: 1px solid var(--tp-line); border-radius: 16px; overflow: hidden; }
.tp-phone-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--tp-wa); color: #fff; }
.tp-phone-avatar { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.2); }
.tp-phone-title { font-size: 14px; font-weight: 600; line-height: 1.3; }
.tp-phone-sub { font-size: 11.5px; opacity: .85; }
.tp-phone-body { max-height: 460px; min-height: 240px; overflow-y: auto; padding: 14px 12px; background-color: #efeae2; background-image: radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px); background-size: 14px 14px; }

/* WhatsApp bubble (shared by cards and live preview) */
.tp-chat { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 12px; background-color: #efeae2; background-image: radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px); background-size: 14px 14px; }
.tp-phone-body .tp-chat { padding: 0; background: none; }
.tp-bubble { position: relative; width: 100%; max-width: 94%; padding: 7px 9px 22px; border-radius: 0 8px 8px 8px; background: #fff; box-shadow: 0 1px 1px rgba(15, 23, 42, .13); }
.tp-bubble::before { content: ""; position: absolute; top: 0; left: -7px; border-top: 0 solid transparent; border-right: 8px solid #fff; border-bottom: 8px solid transparent; }
.tp-bubble-header { margin-bottom: 4px; font-size: 14px; font-weight: 700; color: #111b21; word-break: break-word; }
.tp-bubble-media { margin-bottom: 6px; border-radius: 6px; overflow: hidden; }
.tp-bubble-img { display: block; width: 100%; max-height: 150px; object-fit: cover; }
.tp-media-ph { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 90px; padding: 8px; background: #e9edef; color: #667781; font-size: 12px; font-weight: 500; text-align: center; }
.tp-bubble-body { font-size: 14px; line-height: 1.4; color: #111b21; white-space: pre-wrap; word-break: break-word; }
.tp-bubble-placeholder { color: #8696a0; font-style: italic; }
.tp-bubble-footer { margin-top: 4px; font-size: 12px; color: #667781; word-break: break-word; }
.tp-bubble-time { position: absolute; right: 8px; bottom: 4px; display: flex; align-items: center; gap: 3px; font-size: 10.5px; color: #667781; }
.tp-wa-buttons { display: flex; flex-direction: column; gap: 3px; width: 100%; max-width: 94%; }
.tp-wa-btn { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 10px; border-radius: 8px; background: #fff; color: #00a884; font-size: 13.5px; font-weight: 600; box-shadow: 0 1px 1px rgba(15, 23, 42, .1); word-break: break-word; }

/* Confirm */
.tp-backdrop { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, .5); backdrop-filter: blur(2px); animation: tp-fade .15s ease; }
.tp-modal { width: 100%; max-width: 420px; padding: 24px; text-align: center; background: var(--tp-surface); border-radius: 14px; box-shadow: 0 24px 48px -12px rgba(15, 23, 42, .35); animation: tp-pop .18s ease; }
.tp-confirm-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-bottom: 14px; border-radius: 50%; }
.tp-confirm-icon--danger { background: var(--tp-bad-soft); color: var(--tp-bad); }
.tp-confirm-title { margin: 0 0 6px; font-size: 17px; font-weight: 700; color: var(--tp-ink); }
.tp-confirm-text { margin: 0 0 20px; color: var(--tp-muted); font-size: 13.5px; word-break: break-word; }
.tp-confirm-actions { display: flex; gap: 8px; }
.tp-confirm-actions .tp-btn { flex: 1; }
@keyframes tp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes tp-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

/* Toasts */
.tp-toasts { position: fixed; top: 20px; right: 20px; z-index: 1200; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.tp-toast { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 14px 14px 16px; background: var(--tp-surface); border: 1px solid var(--tp-line); border-radius: 12px; box-shadow: 0 16px 32px -8px rgba(15, 23, 42, .22), 0 2px 6px rgba(15, 23, 42, .06); overflow: hidden; pointer-events: auto; animation: tp-toast-in .25s cubic-bezier(.2, .8, .2, 1); }
.tp-toast-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; margin-top: 1px; border-radius: 50%; color: #fff; flex-shrink: 0; }
.tp-toast--success .tp-toast-icon { background: var(--tp-good); }
.tp-toast--error .tp-toast-icon { background: var(--tp-bad); }
.tp-toast--warning .tp-toast-icon { background: #d97706; }
.tp-toast-body { flex: 1; min-width: 0; }
.tp-toast-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--tp-ink); }
.tp-toast-msg { margin: 2px 0 0; font-size: 13px; color: var(--tp-muted); word-break: break-word; }
.tp-toast-close { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; border-radius: 6px; background: none; color: var(--tp-faint); cursor: pointer; flex-shrink: 0; }
.tp-toast-close:hover { background: var(--tp-line-soft); color: var(--tp-ink); }
.tp-toast-timer { position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; transform-origin: left; animation: tp-timer 4.5s linear forwards; }
.tp-toast--success .tp-toast-timer { background: var(--tp-good); }
.tp-toast--error .tp-toast-timer { background: var(--tp-bad); }
.tp-toast--warning .tp-toast-timer { background: #d97706; }
@keyframes tp-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes tp-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* Responsive */
@media (max-width: 1000px) {
  .tp-create { grid-template-columns: 1fr; }
  .tp-preview { position: static; }
}
@media (max-width: 900px) {
  .tp-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .tp-root { padding: 16px; }
  .tp-title { font-size: 21px; }
  .tp-actions { width: 100%; }
  .tp-actions .tp-btn { flex: 1 1 auto; }
  .tp-form { padding: 4px 16px 20px; }
  .tp-field-row { grid-template-columns: 1fr; }
  .tp-button-grid { grid-template-columns: 1fr; }
  .tp-grid { grid-template-columns: 1fr; }
  .tp-toasts { top: auto; bottom: 16px; right: 16px; left: 16px; width: auto; }
  .tp-form-footer { flex-direction: column-reverse; }
  .tp-form-footer .tp-btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .tp-root *, .tp-root *::before, .tp-root *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

export default Templates;
