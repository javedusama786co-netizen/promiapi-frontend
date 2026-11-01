import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = "https://api.promiapi.com";

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
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  inbox: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
};

function Icon({ name, size = 16, strokeWidth = 2, className = "" }) {
  return (
    <svg
      className={`cp-icon ${className}`}
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

function PlatformIcon({ platform, size = 16 }) {
  if (platform === "instagram") {
    return (
      <svg className="cp-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  if (platform === "messenger") {
    return (
      <svg className="cp-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.303 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.964z" />
      </svg>
    );
  }
  return (
    <svg className="cp-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const PLATFORM_NAMES = { whatsapp: "WhatsApp", instagram: "Instagram", messenger: "Messenger" };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Local-time value for <input type="datetime-local" min="...">
const localDateTimeMin = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const statusCategory = (status) => {
  if (status === "SENT" || status === "SUCCESS" || status === "COMPLETED") return "completed";
  if (status === "FAILED") return "failed";
  if (status === "PENDING" || status === "PROCESSING" || status === "QUEUED") return "queue";
  if (status === "SCHEDULED") return "scheduled";
  return "other";
};

const STATUS_LABELS = {
  completed: "Completed",
  failed: "Failed",
  queue: "In queue",
  scheduled: "Scheduled",
};

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function Campaigns() {
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [nameError, setNameError] = useState("");

  const [platform, setPlatform] = useState("whatsapp");

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [messageText, setMessageText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const [selectedMetricCampaignId, setSelectedMetricCampaignId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [metrics, setMetrics] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
  });

  /* ----------------------------- Toasts & confirm ----------------------------- */

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerNotification = (type, title, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => dismissToast(id), 6000);
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

  /* --------------------------------- Logic ---------------------------------- */

  const handlePlatformSwitch = (selectedPlatform) => {
    setPlatform(selectedPlatform);
    setSelectedTemplate("");
    setMessageText("");
  };

  const detectMediaType = (url) => {
    if (!url) return null;
    const cleanUrl = url.toLowerCase().trim();
    if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) return "image";
    if (cleanUrl.match(/\.(mp4|3gp|mov|avi)($|\?)/i)) return "video";
    if (cleanUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i)) return "document";
    return "image";
  };

  const getCampaignStats = (camp) => {
    const total = camp.totalContacts || camp.dispatchCount || camp.totalCount || camp.recipientsCount || 0;
    const sent = camp.successCount !== undefined ? camp.successCount : camp.sentCount || 0;
    const failed = camp.failureCount !== undefined ? camp.failureCount : camp.failedCount || 0;
    let pending = 0;

    if (camp.status === "SENT" || camp.status === "SUCCESS" || camp.status === "COMPLETED" || camp.status === "FAILED") {
      pending = 0;
    } else {
      pending = Math.max(0, total - sent - failed);
    }

    return { total, sent, failed, pending };
  };

  const updateMetricsFromHistory = useCallback(
    (campaignsList, filterId = selectedMetricCampaignId) => {
      if (!Array.isArray(campaignsList) || campaignsList.length === 0) {
        setMetrics({ total: 0, sent: 0, failed: 0, pending: 0 });
        return;
      }

      let targetList = campaignsList;
      if (filterId !== "ALL") {
        targetList = campaignsList.filter((c) => c._id === filterId || c.id === filterId);
      }

      let total = 0;
      let sent = 0;
      let failed = 0;
      let pending = 0;

      targetList.forEach((item) => {
        const stats = getCampaignStats(item);
        total += stats.total;
        sent += stats.sent;
        failed += stats.failed;
        pending += stats.pending;
      });

      setMetrics({ total, sent, failed, pending: Math.max(0, pending) });
    },
    [selectedMetricCampaignId]
  );

  const handleMetricFilterChange = (e) => {
    const campaignId = e.target.value;
    setSelectedMetricCampaignId(campaignId);
    updateMetricsFromHistory(history, campaignId);
  };

  const fetchCampaignHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    const configHeaders = {
      headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
    };
    try {
      const res = await axios.get(`${API_BASE_URL}/api/campaigns`, configHeaders);
      let list = [];
      if (res.data && Array.isArray(res.data.campaigns)) {
        list = res.data.campaigns;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      }

      setHistory(list);
      updateMetricsFromHistory(list, selectedMetricCampaignId);
    } catch (err) {
      console.error("History Stream Sync Fault:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [updateMetricsFromHistory, selectedMetricCampaignId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
      const configHeaders = {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
      };

      try {
        setLoadingData(true);
        const [groupsRes, templatesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/groups`, configHeaders).catch(() => ({ data: { groups: [] } })),
          axios.get(`${API_BASE_URL}/api/templates`, configHeaders).catch(() => ({ data: { templates: [] } })),
        ]);

        setGroups(groupsRes?.data?.groups?.map((g) => g.name || g) || []);

        const rawTemplates = templatesRes?.data?.templates || [];
        const verifiedTemplates = rawTemplates.filter(
          (t) => !t.status || t.status.toUpperCase() === "APPROVED" || t.status.toUpperCase() === "VERIFIED"
        );
        setTemplates(verifiedTemplates);
      } catch (err) {
        console.error("Sync Operational Error:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchInitialData();
    fetchCampaignHistory();

    const interval = setInterval(() => {
      fetchCampaignHistory();
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchCampaignHistory]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setMessageText("");
      return;
    }
    const found = templates.find((t) => t._id === templateId || t.id === templateId);
    if (found) {
      setMessageText("");
      if (found.mediaUrl || found.headerMediaUrl) {
        setMediaUrl(found.mediaUrl || found.headerMediaUrl);
      }
    }
  };

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      setNameError("Give this campaign a name so you can find it later.");
      return;
    }
    setNameError("");

    if (isScheduled && !scheduledTime) {
      triggerNotification("error", "Schedule time missing", "Pick a future date and time for this campaign.");
      return;
    }

    const token = localStorage.getItem("token");
    const detectedType = detectMediaType(mediaUrl);
    const matchedTemplate = templates.find((t) => t._id === selectedTemplate || t.id === selectedTemplate);

    const activeText = messageText.trim();
    const activeTemplate = platform === "whatsapp" && selectedTemplate ? matchedTemplate?.name || selectedTemplate : null;
    const activeMedia = mediaUrl ? mediaUrl.trim() : null;

    if (platform === "whatsapp") {
      if (!activeTemplate && !activeText && !activeMedia) {
        triggerNotification("error", "Message is empty", "A WhatsApp campaign needs a template, a text message or a media URL.");
        return;
      }
    } else {
      if (!activeText && !activeMedia) {
        triggerNotification("error", "Message is empty", `A ${PLATFORM_NAMES[platform]} campaign needs a message or a media attachment.`);
        return;
      }
    }

    const audienceLabel = selectedGroup === "All" || !selectedGroup ? `all ${PLATFORM_NAMES[platform]} contacts` : `the "${selectedGroup}" group`;
    const ok = await askConfirm({
      tone: "primary",
      title: isScheduled ? "Schedule this campaign?" : "Launch this campaign now?",
      message: isScheduled
        ? `"${campaignName.trim()}" will be sent to ${audienceLabel} on ${formatDateTime(scheduledTime)}.`
        : `"${campaignName.trim()}" will be sent to ${audienceLabel} on ${PLATFORM_NAMES[platform]} right away.`,
      confirmLabel: isScheduled ? "Schedule campaign" : "Launch campaign",
    });
    if (!ok) return;

    const payload = {
      name: campaignName.trim() || `${platform.toUpperCase()}-Broadcast-${Date.now()}`,
      platform: platform.toLowerCase(),
      targetGroup: selectedGroup || "All",
      group: selectedGroup || "All",
      messageText: activeText,
      message: activeText || (activeTemplate ? `Template: ${activeTemplate}` : ""),
      templateName: activeTemplate,
      language: matchedTemplate?.language || "en_US",
      mediaUrl: activeMedia,
      mediaType: activeMedia ? detectedType : null,
      scheduledTime: isScheduled && scheduledTime ? new Date(scheduledTime).toISOString() : null,
    };

    try {
      setSending(true);

      const res = await axios.post(`${API_BASE_URL}/api/campaigns/send`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.success) {
        const dispatched = res.data.dispatchCount || res.data.totalContacts || 1;
        triggerNotification(
          "success",
          isScheduled ? "Campaign scheduled" : "Campaign launched",
          `Queued for ${dispatched} ${PLATFORM_NAMES[platform]} contact${dispatched === 1 ? "" : "s"}.`
        );

        setCampaignName("");
        setMessageText("");
        setMediaUrl("");
        setIsScheduled(false);
        setScheduledTime("");
        setSelectedGroup("All");
        setSelectedTemplate("");
        fetchCampaignHistory();
      } else {
        triggerNotification("error", "Couldn't launch the campaign", res.data?.message || "The server rejected this campaign.");
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || errorData?.error || "The broadcast request failed. Try again.";
      triggerNotification("error", "Couldn't launch the campaign", errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleRemoveCampaign = async (camp) => {
    const ok = await askConfirm({
      title: "Delete this campaign record?",
      message: `"${camp.name}" will be removed from your activity register. Messages already sent aren't affected.`,
      confirmLabel: "Delete record",
    });
    if (!ok) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE_URL}/api/campaigns/${camp._id}`, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
      });
      triggerNotification("success", "Record deleted", `"${camp.name}" has been removed.`);
      fetchCampaignHistory();
    } catch (err) {
      triggerNotification("error", "Couldn't delete the record", "Something went wrong. Try again.");
    }
  };

  /* --------------------------------- Derived --------------------------------- */

  const sentPercent = metrics.total > 0 ? (metrics.sent / metrics.total) * 100 : 0;
  const failedPercent = metrics.total > 0 ? (metrics.failed / metrics.total) * 100 : 0;
  const pendingPercent = metrics.total > 0 ? Math.max(0, 100 - sentPercent - failedPercent) : 0;

  const isTemplateMode = platform === "whatsapp" && Boolean(selectedTemplate);
  const selectedTemplateName = templates.find((t) => t._id === selectedTemplate || t.id === selectedTemplate)?.name;

  const filteredHistory = history.filter((c) => statusFilter === "all" || statusCategory(c.status) === statusFilter);
  const visibleHistory = filteredHistory.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [statusFilter]);

  /* --------------------------------- Renderers -------------------------------- */

  const renderStatusBadge = (status) => {
    const cat = statusCategory(status);
    const label = STATUS_LABELS[cat] || (status ? status.charAt(0) + status.slice(1).toLowerCase() : "Unknown");
    return (
      <span className={`cp-status cp-status--${cat}`}>
        <span className="cp-status-dot" />
        {label}
      </span>
    );
  };

  const renderChannel = (pName) => (
    <span className={`cp-channel cp-channel--${pName}`}>
      <PlatformIcon platform={pName} size={13} />
      {PLATFORM_NAMES[pName] || pName}
    </span>
  );

  const renderProgress = (stats) => {
    const s = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;
    const f = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
    return (
      <div className="cp-mini">
        <div className="cp-mini-track" role="img" aria-label={`${Math.round(s)}% sent, ${Math.round(f)}% failed`}>
          <span className="cp-mini-sent" style={{ width: `${s}%` }} />
          <span className="cp-mini-failed" style={{ width: `${f}%` }} />
        </div>
        <span className="cp-mini-text">
          <strong>{stats.sent}</strong> of {stats.total} sent
        </span>
      </div>
    );
  };

  const renderPhoneMediaPreview = () => {
    if (!mediaUrl || !mediaUrl.trim()) return null;
    const type = detectMediaType(mediaUrl);

    if (type === "image") {
      return (
        <div className="cp-bubble-media">
          <img src={mediaUrl.trim()} alt="Attachment preview" className="cp-bubble-img" />
        </div>
      );
    }

    if (type === "video") {
      return (
        <div className="cp-bubble-media">
          <video src={mediaUrl.trim()} controls className="cp-bubble-video" />
        </div>
      );
    }

    return (
      <div className="cp-bubble-doc">
        <Icon name="file" size={16} />
        <span>Document attachment</span>
      </div>
    );
  };

  const renderToastIcon = (type) => {
    if (type === "success") return <Icon name="check" size={14} strokeWidth={3} />;
    if (type === "error") return <Icon name="x" size={14} strokeWidth={3} />;
    return <Icon name="alert" size={14} strokeWidth={2.5} />;
  };

  const submitLabel = sending
    ? "Launching…"
    : isScheduled
    ? "Schedule campaign"
    : `Launch ${PLATFORM_NAMES[platform]} campaign`;

  /* ----------------------------------- JSX ----------------------------------- */

  return (
    <div className="cp-root">
      <style>{CSS}</style>

      {/* Toasts */}
      <div className="cp-toasts" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`cp-toast cp-toast--${t.type}`} role="status">
            <span className="cp-toast-icon">{renderToastIcon(t.type)}</span>
            <div className="cp-toast-body">
              <p className="cp-toast-title">{t.title}</p>
              {t.message && <p className="cp-toast-msg">{t.message}</p>}
            </div>
            <button type="button" className="cp-toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
              <Icon name="x" size={14} />
            </button>
            <span className="cp-toast-timer" />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="cp-header">
        <span className="cp-header-icon">
          <Icon name="layers" size={22} />
        </span>
        <div>
          <h1 className="cp-title">Campaign Broadcasting Engine</h1>
          <p className="cp-subtitle">
            Pick an audience, choose an approved template and send broadcasts on one channel at a time.
          </p>
        </div>
      </header>

      {/* Metrics */}
      <section className="cp-card cp-metrics" aria-label="Campaign performance">
        <div className="cp-metrics-head">
          <div>
            <h2 className="cp-section-title">Performance</h2>
            <p className="cp-section-sub">
              {selectedMetricCampaignId === "ALL" ? "Combined results across all campaigns" : "Results for the selected campaign"}
            </p>
          </div>
          <div className="cp-scope">
            <Icon name="filter" size={14} className="cp-scope-icon" />
            <select
              className="cp-input cp-select cp-scope-select"
              aria-label="Choose which campaign to analyze"
              value={selectedMetricCampaignId}
              onChange={handleMetricFilterChange}
            >
              <option value="ALL">All campaigns</option>
              {history.map((c, idx) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {idx + 1}. {c.name} ({PLATFORM_NAMES[c.platform || "whatsapp"] || c.platform})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cp-metric-grid">
          <div className="cp-metric">
            <span className="cp-metric-icon cp-metric-icon--neutral">
              <Icon name="target" size={16} />
            </span>
            <span className="cp-metric-label">Total targets</span>
            <span className="cp-metric-value">{metrics.total.toLocaleString()}</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-icon cp-metric-icon--good">
              <Icon name="checkCircle" size={16} />
            </span>
            <span className="cp-metric-label">Sent</span>
            <span className="cp-metric-value cp-metric-value--good">{metrics.sent.toLocaleString()}</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-icon cp-metric-icon--bad">
              <Icon name="xCircle" size={16} />
            </span>
            <span className="cp-metric-label">Failed</span>
            <span className="cp-metric-value cp-metric-value--bad">{metrics.failed.toLocaleString()}</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-icon cp-metric-icon--warn">
              <Icon name="clock" size={16} />
            </span>
            <span className="cp-metric-label">In queue</span>
            <span className="cp-metric-value cp-metric-value--warn">{metrics.pending.toLocaleString()}</span>
          </div>
        </div>

        <div className="cp-ratio">
          <div className="cp-ratio-head">
            <span>Delivery progress</span>
            <span className="cp-ratio-pct">{metrics.total > 0 ? `${Math.round(sentPercent)}% sent` : "No activity yet"}</span>
          </div>
          <div className="cp-track" role="img" aria-label={`${Math.round(sentPercent)} percent sent`}>
            <span className="cp-track-sent" style={{ width: `${sentPercent}%` }} />
            <span className="cp-track-failed" style={{ width: `${failedPercent}%` }} />
          </div>
          <div className="cp-legend">
            <span className="cp-legend-item">
              <span className="cp-legend-dot cp-legend-dot--sent" />
              Sent {Math.round(sentPercent)}%
            </span>
            <span className="cp-legend-item">
              <span className="cp-legend-dot cp-legend-dot--failed" />
              Failed {Math.round(failedPercent)}%
            </span>
            <span className="cp-legend-item">
              <span className="cp-legend-dot cp-legend-dot--queue" />
              In queue {Math.round(pendingPercent)}%
            </span>
          </div>
        </div>
      </section>

      {/* Composer + preview */}
      <div className="cp-workspace">
        <section className="cp-card cp-panel" aria-label="Create campaign">
          <h2 className="cp-section-title">New campaign</h2>
          <p className="cp-section-sub cp-section-sub--spaced">Set up the channel, audience and message, then launch or schedule.</p>

          <form onSubmit={handleLaunchCampaign} className="cp-form" noValidate>
            <div className="cp-field">
              <span className="cp-label">Channel</span>
              <div className="cp-segmented" role="radiogroup" aria-label="Channel">
                {["whatsapp", "instagram", "messenger"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={platform === p}
                    className={`cp-segment cp-segment--${p} ${platform === p ? "is-active" : ""}`}
                    onClick={() => handlePlatformSwitch(p)}
                  >
                    <PlatformIcon platform={p} size={16} />
                    {PLATFORM_NAMES[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-name">
                Campaign name
              </label>
              <input
                id="cp-name"
                type="text"
                className={`cp-input ${nameError ? "has-error" : ""}`}
                placeholder="e.g. Summer discount campaign"
                value={campaignName}
                onChange={(e) => {
                  setCampaignName(e.target.value);
                  if (nameError) setNameError("");
                }}
                aria-invalid={!!nameError}
              />
              {nameError && <p className="cp-error">{nameError}</p>}
            </div>

            <div className="cp-field-row">
              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-group">
                  Audience
                </label>
                <select id="cp-group" className="cp-input cp-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                  <option value="All">All {PLATFORM_NAMES[platform]} contacts</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {platform === "whatsapp" ? (
                <div className="cp-field">
                  <label className="cp-label" htmlFor="cp-template">
                    Approved template
                  </label>
                  <select
                    id="cp-template"
                    className="cp-input cp-select"
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    disabled={loadingData}
                  >
                    <option value="">{loadingData ? "Loading templates…" : "None (write a free-text message)"}</option>
                    {templates.map((t, index) => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {index + 1}. {t.name} ({t.language || "en"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="cp-field">
                  <label className="cp-label" htmlFor="cp-mode">
                    Message type
                  </label>
                  <input id="cp-mode" type="text" className="cp-input" disabled value={`${PLATFORM_NAMES[platform]} direct message`} />
                </div>
              )}
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-media">
                <Icon name="paperclip" size={14} /> Media URL <span className="cp-optional">Optional</span>
              </label>
              <input
                id="cp-media"
                type="url"
                className="cp-input"
                placeholder="https://domain.com/banner.png"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              <p className="cp-hint">Supports images, videos and documents (.png, .jpg, .mp4, .pdf).</p>
            </div>

            <div className="cp-field">
              <div className="cp-label-row">
                <label className="cp-label" htmlFor="cp-message">
                  {isTemplateMode ? "Template variable values" : "Message"}
                  {isTemplateMode && <span className="cp-optional">Optional</span>}
                </label>
                {!isTemplateMode && <span className="cp-counter">{messageText.length} characters</span>}
              </div>
              <textarea
                id="cp-message"
                rows="4"
                className="cp-input cp-textarea"
                placeholder={
                  isTemplateMode
                    ? "Values only, separated by commas. Example: Ali, 20% OFF"
                    : "Write your campaign message…"
                }
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              {isTemplateMode && (
                <div className="cp-note">
                  <Icon name="info" size={15} className="cp-note-icon" />
                  <p>
                    The template text is already approved on Meta, so don't paste it here. Enter only the values for {"{{1}}, {{2}}"} and so on,
                    separated by commas. Leave this empty if your template has no variables.
                  </p>
                </div>
              )}
            </div>

            <div className="cp-schedule">
              <div className="cp-schedule-row">
                <label className="cp-switch">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => {
                      setIsScheduled(e.target.checked);
                      if (!e.target.checked) setScheduledTime("");
                    }}
                  />
                  <span className="cp-switch-track">
                    <span className="cp-switch-thumb" />
                  </span>
                  <span className="cp-switch-text">
                    <span className="cp-switch-title">Schedule for later</span>
                    <span className="cp-switch-sub">Send at a specific future date and time</span>
                  </span>
                </label>
              </div>

              {isScheduled && (
                <div className="cp-schedule-drawer">
                  <label className="cp-label" htmlFor="cp-time">
                    <Icon name="calendar" size={14} /> Send date and time
                  </label>
                  <input
                    id="cp-time"
                    type="datetime-local"
                    className="cp-input"
                    value={scheduledTime}
                    min={localDateTimeMin()}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button type="submit" disabled={sending} className={`cp-btn cp-btn--submit cp-btn--${platform}`}>
              {sending ? <span className="cp-spinner" /> : <Icon name="send" size={16} />}
              {submitLabel}
            </button>
          </form>
        </section>

        <aside className="cp-card cp-panel cp-preview" aria-label="Live preview">
          <h2 className="cp-section-title">Live preview</h2>
          <p className="cp-section-sub cp-section-sub--spaced">How your message will look on {PLATFORM_NAMES[platform]}.</p>

          <div className={`cp-phone cp-phone--${platform}`}>
            <div className="cp-phone-header">
              <span className="cp-phone-avatar">
                <PlatformIcon platform={platform} size={16} />
              </span>
              <div>
                <div className="cp-phone-title">{PLATFORM_NAMES[platform]} Business</div>
                <div className="cp-phone-sub">Connected account</div>
              </div>
            </div>

            <div className="cp-phone-body">
              <div className="cp-bubble">
                {renderPhoneMediaPreview()}
                <div className="cp-bubble-text">
                  {isTemplateMode ? (
                    <>
                      <span className="cp-bubble-tag">Template</span>
                      {selectedTemplateName || "Selected template"}
                      {messageText.trim() && <span className="cp-bubble-vars">Variables: {messageText.trim()}</span>}
                    </>
                  ) : (
                    messageText || <span className="cp-bubble-placeholder">Your message preview will appear here.</span>
                  )}
                </div>
                <div className="cp-bubble-time">
                  {isScheduled && scheduledTime ? `Scheduled for ${formatDateTime(scheduledTime)}` : "Sends immediately"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Activity register */}
      <section className="cp-card cp-history" aria-label="Campaign activity">
        <div className="cp-history-head">
          <div>
            <h2 className="cp-section-title">Campaign activity</h2>
            <p className="cp-section-sub">
              {loadingHistory ? "Loading campaigns…" : `${history.length} campaign${history.length === 1 ? "" : "s"} · refreshes automatically`}
            </p>
          </div>
          <div className="cp-chips" role="group" aria-label="Filter by status">
            {[
              ["all", "All"],
              ["completed", "Completed"],
              ["queue", "In queue"],
              ["scheduled", "Scheduled"],
              ["failed", "Failed"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`cp-chip ${statusFilter === value ? "is-active" : ""}`}
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="cp-skeleton-list" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="cp-skeleton-row">
                <span className="cp-skeleton cp-skeleton--wide" />
                <span className="cp-skeleton cp-skeleton--mid" />
                <span className="cp-skeleton cp-skeleton--short" />
              </div>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="cp-empty">
            <span className="cp-empty-icon">
              <Icon name="inbox" size={22} />
            </span>
            <p className="cp-empty-title">{history.length === 0 ? "No campaigns yet" : "No campaigns match this filter"}</p>
            <p className="cp-empty-text">
              {history.length === 0
                ? "Launch your first campaign using the form above. Results will show up here."
                : "Try a different status to see more of your campaigns."}
            </p>
            {history.length > 0 && (
              <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setStatusFilter("all")}>
                Show all campaigns
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="cp-desktop-only cp-table-scroll">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th className="cp-th cp-th--index">#</th>
                    <th className="cp-th">Campaign</th>
                    <th className="cp-th">Channel</th>
                    <th className="cp-th">Audience</th>
                    <th className="cp-th">Delivery</th>
                    <th className="cp-th cp-th--num">Failed</th>
                    <th className="cp-th cp-th--num">Queued</th>
                    <th className="cp-th">Status</th>
                    <th className="cp-th">Failure reason</th>
                    <th className="cp-th cp-th--action">
                      <span className="cp-sr">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHistory.map((camp, index) => {
                    const cStats = getCampaignStats(camp);
                    const pName = camp.platform || "whatsapp";
                    const failReason = camp.lastError || "";
                    return (
                      <tr key={camp._id} className="cp-row">
                        <td className="cp-td cp-td--index">{index + 1}</td>
                        <td className="cp-td">
                          <span className="cp-camp-name">{camp.name}</span>
                          <span className="cp-camp-date">{formatDateTime(camp.createdAt)}</span>
                        </td>
                        <td className="cp-td">{renderChannel(pName)}</td>
                        <td className="cp-td">
                          <span className="cp-group-chip">{camp.targetGroup || "All"}</span>
                        </td>
                        <td className="cp-td">{renderProgress(cStats)}</td>
                        <td className="cp-td cp-td--num">
                          <span className={cStats.failed > 0 ? "cp-num cp-num--bad" : "cp-num"}>{cStats.failed}</span>
                        </td>
                        <td className="cp-td cp-td--num">
                          <span className={cStats.pending > 0 ? "cp-num cp-num--warn" : "cp-num"}>{cStats.pending}</span>
                        </td>
                        <td className="cp-td">{renderStatusBadge(camp.status)}</td>
                        <td className="cp-td cp-td--reason">
                          {failReason ? (
                            <span className="cp-error-pill" title={failReason}>
                              {failReason}
                            </span>
                          ) : (
                            <span className="cp-muted">None</span>
                          )}
                        </td>
                        <td className="cp-td cp-td--action">
                          <button
                            type="button"
                            className="cp-icon-btn cp-icon-btn--danger"
                            onClick={() => handleRemoveCampaign(camp)}
                            aria-label={`Delete ${camp.name}`}
                            title="Delete record"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="cp-mobile-only cp-cards">
              {visibleHistory.map((camp) => {
                const cStats = getCampaignStats(camp);
                const pName = camp.platform || "whatsapp";
                const failReason = camp.lastError || "";
                return (
                  <article key={camp._id} className="cp-mcard">
                    <div className="cp-mcard-top">
                      <div className="cp-mcard-title">
                        <span className="cp-camp-name">{camp.name}</span>
                        <span className="cp-camp-date">{formatDateTime(camp.createdAt)}</span>
                      </div>
                      {renderStatusBadge(camp.status)}
                    </div>

                    <div className="cp-mcard-meta">
                      {renderChannel(pName)}
                      <span className="cp-group-chip">{camp.targetGroup || "All"}</span>
                    </div>

                    {renderProgress(cStats)}

                    <div className="cp-mcard-stats">
                      <div>
                        <span className="cp-mcard-stat-label">Total</span>
                        <span className="cp-mcard-stat-value">{cStats.total}</span>
                      </div>
                      <div>
                        <span className="cp-mcard-stat-label">Sent</span>
                        <span className="cp-mcard-stat-value cp-num--good">{cStats.sent}</span>
                      </div>
                      <div>
                        <span className="cp-mcard-stat-label">Failed</span>
                        <span className="cp-mcard-stat-value cp-num--bad">{cStats.failed}</span>
                      </div>
                      <div>
                        <span className="cp-mcard-stat-label">Queued</span>
                        <span className="cp-mcard-stat-value cp-num--warn">{cStats.pending}</span>
                      </div>
                    </div>

                    {failReason && (
                      <div className="cp-mcard-error">
                        <strong>Failure reason:</strong> {failReason}
                      </div>
                    )}

                    <button type="button" className="cp-btn cp-btn--danger-soft cp-btn--block" onClick={() => handleRemoveCampaign(camp)}>
                      <Icon name="trash" size={15} /> Delete record
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="cp-footer">
              <span className="cp-footer-text">
                Showing <strong>{visibleHistory.length}</strong> of <strong>{filteredHistory.length}</strong>
              </span>
              {visibleCount < filteredHistory.length && (
                <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, filteredHistory.length - visibleCount)} more
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Confirm dialog */}
      {confirmState && (
        <div className="cp-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeConfirm(false)}>
          <div className="cp-modal" role="alertdialog" aria-modal="true" aria-labelledby="cp-confirm-title">
            <span className={`cp-confirm-icon cp-confirm-icon--${confirmState.tone}`}>
              <Icon name={confirmState.tone === "danger" ? "alert" : "send"} size={20} />
            </span>
            <h3 className="cp-confirm-title" id="cp-confirm-title">
              {confirmState.title}
            </h3>
            <p className="cp-confirm-text">{confirmState.message}</p>
            <div className="cp-confirm-actions">
              <button type="button" className="cp-btn cp-btn--ghost" onClick={() => closeConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                className={`cp-btn ${confirmState.tone === "danger" ? "cp-btn--danger" : "cp-btn--primary"}`}
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
.cp-root {
  --cp-ink: #0f172a;
  --cp-text: #334155;
  --cp-muted: #64748b;
  --cp-faint: #94a3b8;
  --cp-line: #e2e8f0;
  --cp-line-soft: #eef2f6;
  --cp-surface: #ffffff;
  --cp-surface-alt: #f8fafc;
  --cp-primary: #1d4ed8;
  --cp-primary-hover: #1e40af;
  --cp-primary-soft: #eff4ff;
  --cp-good: #15803d;
  --cp-good-soft: #ecfdf3;
  --cp-bad: #b91c1c;
  --cp-bad-soft: #fef2f2;
  --cp-warn: #b45309;
  --cp-warn-soft: #fffbeb;
  --cp-wa: #128c4a;
  --cp-ig: #be185d;
  --cp-ms: #1d4ed8;
  --cp-radius: 8px;
  --cp-radius-lg: 12px;

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--cp-text);
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.cp-root *, .cp-root *::before, .cp-root *::after { box-sizing: border-box; }
.cp-root button { font-family: inherit; }
.cp-icon { flex-shrink: 0; }
.cp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.cp-muted { color: var(--cp-faint); font-size: 13px; }
.cp-root :focus-visible { outline: 2px solid var(--cp-primary); outline-offset: 2px; }
.cp-mobile-only { display: none; }

/* Header */
.cp-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.cp-header-icon { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 12px; background: var(--cp-primary-soft); color: var(--cp-primary); flex-shrink: 0; }
.cp-title { margin: 0 0 2px; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: var(--cp-ink); }
.cp-subtitle { margin: 0; color: var(--cp-muted); font-size: 14px; max-width: 620px; }

/* Cards & section heads */
.cp-card { background: var(--cp-surface); border: 1px solid var(--cp-line); border-radius: var(--cp-radius-lg); }
.cp-section-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--cp-ink); letter-spacing: -0.01em; }
.cp-section-sub { margin: 2px 0 0; font-size: 13px; color: var(--cp-muted); }
.cp-section-sub--spaced { margin-bottom: 20px; }

/* Buttons */
.cp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: var(--cp-radius); border: 1px solid transparent; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background-color .15s, border-color .15s, color .15s; }
.cp-btn:disabled { opacity: .6; cursor: not-allowed; }
.cp-btn--block { width: 100%; }
.cp-btn--primary { background: var(--cp-primary); color: #fff; }
.cp-btn--primary:hover:not(:disabled) { background: var(--cp-primary-hover); }
.cp-btn--ghost { background: var(--cp-surface); color: var(--cp-ink); border-color: var(--cp-line); }
.cp-btn--ghost:hover:not(:disabled) { background: var(--cp-surface-alt); border-color: #cbd5e1; }
.cp-btn--danger { background: var(--cp-bad); color: #fff; }
.cp-btn--danger:hover:not(:disabled) { background: #991b1b; }
.cp-btn--danger-soft { background: var(--cp-bad-soft); color: var(--cp-bad); border-color: #fecaca; }
.cp-btn--danger-soft:hover { background: #fee2e2; }
.cp-btn--submit { width: 100%; height: 44px; font-size: 14.5px; color: #fff; }
.cp-btn--whatsapp { background: var(--cp-wa); }
.cp-btn--whatsapp:hover:not(:disabled) { background: #0f7a41; }
.cp-btn--instagram { background: var(--cp-ig); }
.cp-btn--instagram:hover:not(:disabled) { background: #9d174d; }
.cp-btn--messenger { background: var(--cp-ms); }
.cp-btn--messenger:hover:not(:disabled) { background: var(--cp-primary-hover); }

.cp-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; color: var(--cp-muted); cursor: pointer; transition: background-color .15s, color .15s; }
.cp-icon-btn--danger:hover { background: var(--cp-bad-soft); color: var(--cp-bad); }

.cp-spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: cp-spin .7s linear infinite; }
@keyframes cp-spin { to { transform: rotate(360deg); } }

/* Inputs */
.cp-input { width: 100%; height: 40px; padding: 0 12px; border-radius: var(--cp-radius); border: 1px solid #cbd5e1; background: var(--cp-surface); color: var(--cp-ink); font-size: 14px; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
.cp-input::placeholder { color: var(--cp-faint); }
.cp-input:hover:not(:disabled) { border-color: #94a3b8; }
.cp-input:focus { outline: none; border-color: var(--cp-primary); box-shadow: 0 0 0 3px rgba(29, 78, 216, .15); }
.cp-input:disabled { background: var(--cp-surface-alt); color: var(--cp-muted); cursor: not-allowed; }
.cp-input.has-error { border-color: var(--cp-bad); }
.cp-input.has-error:focus { box-shadow: 0 0 0 3px rgba(185, 28, 28, .15); }
.cp-textarea { height: auto; padding: 10px 12px; resize: vertical; line-height: 1.5; min-height: 104px; }
.cp-select { cursor: pointer; appearance: none; padding-right: 32px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }

.cp-form { display: flex; flex-direction: column; gap: 18px; }
.cp-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.cp-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--cp-ink); }
.cp-label-row { display: flex; justify-content: space-between; align-items: center; }
.cp-optional { margin-left: 2px; font-weight: 400; color: var(--cp-faint); font-size: 12px; }
.cp-counter { font-size: 12px; color: var(--cp-faint); font-variant-numeric: tabular-nums; }
.cp-hint { margin: 0; font-size: 12.5px; color: var(--cp-muted); }
.cp-error { margin: 0; font-size: 12.5px; color: var(--cp-bad); font-weight: 500; }

.cp-note { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid #c7d7fe; border-radius: var(--cp-radius); background: var(--cp-primary-soft); }
.cp-note p { margin: 0; font-size: 12.5px; color: var(--cp-text); line-height: 1.5; }
.cp-note-icon { color: var(--cp-primary); margin-top: 2px; }

/* Segmented channel selector */
.cp-segmented { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px; background: var(--cp-line-soft); border-radius: 10px; }
.cp-segment { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; border: none; border-radius: 7px; background: transparent; color: var(--cp-muted); font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background-color .15s, color .15s, box-shadow .15s; }
.cp-segment:hover:not(.is-active) { color: var(--cp-ink); }
.cp-segment.is-active { background: var(--cp-surface); box-shadow: 0 1px 3px rgba(15, 23, 42, .14); }
.cp-segment--whatsapp.is-active { color: var(--cp-wa); }
.cp-segment--instagram.is-active { color: var(--cp-ig); }
.cp-segment--messenger.is-active { color: var(--cp-ms); }

/* Schedule */
.cp-schedule { border: 1px solid var(--cp-line); border-radius: 10px; padding: 14px; background: var(--cp-surface-alt); }
.cp-switch { display: flex; align-items: center; gap: 12px; cursor: pointer; position: relative; }
.cp-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.cp-switch-track { position: relative; width: 40px; height: 22px; border-radius: 999px; background: #cbd5e1; flex-shrink: 0; transition: background-color .2s; }
.cp-switch-thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, .3); transition: transform .2s; }
.cp-switch input:checked + .cp-switch-track { background: var(--cp-primary); }
.cp-switch input:checked + .cp-switch-track .cp-switch-thumb { transform: translateX(18px); }
.cp-switch input:focus-visible + .cp-switch-track { outline: 2px solid var(--cp-primary); outline-offset: 2px; }
.cp-switch-text { display: flex; flex-direction: column; }
.cp-switch-title { font-size: 13.5px; font-weight: 600; color: var(--cp-ink); }
.cp-switch-sub { font-size: 12.5px; color: var(--cp-muted); }
.cp-schedule-drawer { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--cp-line); }

/* Metrics */
.cp-metrics { padding: 24px; margin-bottom: 24px; }
.cp-metrics-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.cp-scope { position: relative; min-width: 260px; }
.cp-scope-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--cp-muted); pointer-events: none; }
.cp-scope-select { padding-left: 34px; font-weight: 600; }
.cp-metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.cp-metric { display: flex; flex-direction: column; gap: 2px; padding: 16px 18px; border: 1px solid var(--cp-line-soft); border-radius: var(--cp-radius-lg); background: var(--cp-surface-alt); }
.cp-metric-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; margin-bottom: 8px; }
.cp-metric-icon--neutral { background: var(--cp-line-soft); color: var(--cp-text); }
.cp-metric-icon--good { background: var(--cp-good-soft); color: var(--cp-good); }
.cp-metric-icon--bad { background: var(--cp-bad-soft); color: var(--cp-bad); }
.cp-metric-icon--warn { background: var(--cp-warn-soft); color: var(--cp-warn); }
.cp-metric-label { font-size: 13px; color: var(--cp-muted); }
.cp-metric-value { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: var(--cp-ink); font-variant-numeric: tabular-nums; line-height: 1.2; }
.cp-metric-value--good { color: var(--cp-good); }
.cp-metric-value--bad { color: var(--cp-bad); }
.cp-metric-value--warn { color: var(--cp-warn); }

.cp-ratio { margin-top: 20px; }
.cp-ratio-head { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--cp-ink); }
.cp-ratio-pct { color: var(--cp-muted); font-weight: 500; }
.cp-track { display: flex; width: 100%; height: 10px; border-radius: 999px; background: var(--cp-line-soft); overflow: hidden; }
.cp-track-sent { height: 100%; background: #16a34a; transition: width .4s ease; }
.cp-track-failed { height: 100%; background: #dc2626; transition: width .4s ease; }
.cp-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 10px; }
.cp-legend-item { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--cp-muted); }
.cp-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.cp-legend-dot--sent { background: #16a34a; }
.cp-legend-dot--failed { background: #dc2626; }
.cp-legend-dot--queue { background: var(--cp-line); border: 1px solid #cbd5e1; }

/* Workspace */
.cp-workspace { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(300px, .7fr); gap: 24px; align-items: start; margin-bottom: 24px; }
.cp-panel { padding: 24px; min-width: 0; }
.cp-preview { position: sticky; top: 20px; }

/* Phone preview */
.cp-phone { border: 1px solid var(--cp-line); border-radius: 16px; overflow: hidden; background: var(--cp-surface); }
.cp-phone-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #fff; }
.cp-phone--whatsapp .cp-phone-header { background: #075e54; }
.cp-phone--instagram .cp-phone-header { background: linear-gradient(45deg, #f09433, #dc2743 55%, #bc1888); }
.cp-phone--messenger .cp-phone-header { background: linear-gradient(135deg, #0084ff, #00a6ff); }
.cp-phone-avatar { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 255, 255, .22); flex-shrink: 0; }
.cp-phone-title { font-size: 14px; font-weight: 600; line-height: 1.3; }
.cp-phone-sub { font-size: 11.5px; opacity: .85; }
.cp-phone-body { min-height: 260px; padding: 16px 12px; background: #ffffff; }
.cp-phone--whatsapp .cp-phone-body { background: #ece5dd; }
.cp-bubble { max-width: 92%; padding: 8px 10px; border-radius: 0 10px 10px 10px; background: #ffffff; box-shadow: 0 1px 2px rgba(15, 23, 42, .14); overflow: hidden; }
.cp-phone--instagram .cp-bubble, .cp-phone--messenger .cp-bubble { background: #f1f3f5; box-shadow: none; border-radius: 16px 16px 16px 4px; }
.cp-bubble-media { margin-bottom: 6px; border-radius: 6px; overflow: hidden; }
.cp-bubble-img { display: block; width: 100%; max-height: 170px; object-fit: cover; }
.cp-bubble-video { display: block; width: 100%; max-height: 170px; }
.cp-bubble-doc { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; padding: 10px; border: 1px solid var(--cp-line); border-radius: 6px; background: var(--cp-surface-alt); font-size: 12.5px; font-weight: 600; color: var(--cp-text); }
.cp-bubble-text { font-size: 13.5px; color: #111827; line-height: 1.45; word-break: break-word; white-space: pre-wrap; }
.cp-bubble-placeholder { color: var(--cp-faint); font-style: italic; }
.cp-bubble-tag { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 4px; background: var(--cp-primary-soft); color: var(--cp-primary); font-size: 11px; font-weight: 600; }
.cp-bubble-vars { display: block; margin-top: 4px; font-size: 12px; color: var(--cp-muted); }
.cp-bubble-time { margin-top: 6px; text-align: right; font-size: 10.5px; color: #6b7280; }

/* History */
.cp-history { padding: 24px; }
.cp-history-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.cp-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.cp-chip { height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--cp-line); background: var(--cp-surface); color: var(--cp-text); font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color .15s, border-color .15s, color .15s; }
.cp-chip:hover:not(.is-active) { background: var(--cp-surface-alt); }
.cp-chip.is-active { background: var(--cp-ink); border-color: var(--cp-ink); color: #fff; }

.cp-table-scroll { width: 100%; overflow-x: auto; border: 1px solid var(--cp-line); border-radius: 10px; }
.cp-table { width: 100%; min-width: 1080px; border-collapse: collapse; text-align: left; }
.cp-th { padding: 12px 16px; background: var(--cp-surface-alt); border-bottom: 1px solid var(--cp-line); color: var(--cp-muted); font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.cp-th--index, .cp-td--index { width: 52px; text-align: center; }
.cp-th--num, .cp-td--num { text-align: center; }
.cp-th--action, .cp-td--action { width: 56px; text-align: right; }
.cp-td { padding: 14px 16px; border-bottom: 1px solid var(--cp-line-soft); vertical-align: middle; font-size: 13.5px; }
.cp-td--index { color: var(--cp-faint); font-size: 13px; font-variant-numeric: tabular-nums; }
.cp-td--reason { max-width: 240px; }
.cp-row:last-child .cp-td { border-bottom: none; }
.cp-row:hover .cp-td { background: #fafbfd; }

.cp-camp-name { display: block; font-weight: 600; color: var(--cp-ink); font-size: 14px; word-break: break-word; }
.cp-camp-date { display: block; margin-top: 1px; font-size: 12px; color: var(--cp-faint); }

.cp-channel { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.cp-channel--whatsapp { background: #f0fdf4; color: #15803d; }
.cp-channel--instagram { background: #fdf2f8; color: #be185d; }
.cp-channel--messenger { background: #eff6ff; color: #1d4ed8; }

.cp-group-chip { display: inline-block; max-width: 180px; padding: 3px 9px; border-radius: 6px; background: var(--cp-primary-soft); color: var(--cp-primary-hover); font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }

.cp-mini { display: flex; flex-direction: column; gap: 5px; min-width: 130px; }
.cp-mini-track { display: flex; height: 6px; border-radius: 999px; background: var(--cp-line-soft); overflow: hidden; }
.cp-mini-sent { height: 100%; background: #16a34a; }
.cp-mini-failed { height: 100%; background: #dc2626; }
.cp-mini-text { font-size: 12px; color: var(--cp-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.cp-mini-text strong { color: var(--cp-ink); font-weight: 600; }

.cp-num { font-weight: 600; color: var(--cp-faint); font-variant-numeric: tabular-nums; }
.cp-num--bad { color: var(--cp-bad); }
.cp-num--warn { color: var(--cp-warn); }
.cp-num--good { color: var(--cp-good); }

.cp-status { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; white-space: nowrap; }
.cp-status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.cp-status--completed { color: var(--cp-good); }
.cp-status--failed { color: var(--cp-bad); }
.cp-status--queue { color: var(--cp-warn); }
.cp-status--scheduled { color: var(--cp-primary); }
.cp-status--other { color: var(--cp-muted); }

.cp-error-pill { display: inline-block; max-width: 100%; padding: 3px 8px; border: 1px solid #fed7aa; border-radius: 6px; background: #fff7ed; color: #9a3412; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }

.cp-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.cp-footer-text { font-size: 13px; color: var(--cp-muted); }
.cp-footer-text strong { color: var(--cp-ink); font-weight: 600; }

/* Mobile cards */
.cp-cards { flex-direction: column; gap: 12px; }
.cp-mcard { display: flex; flex-direction: column; gap: 12px; padding: 14px; border: 1px solid var(--cp-line); border-radius: var(--cp-radius-lg); background: var(--cp-surface); }
.cp-mcard-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.cp-mcard-title { min-width: 0; }
.cp-mcard-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cp-mcard-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 10px; border-radius: var(--cp-radius); background: var(--cp-surface-alt); text-align: center; }
.cp-mcard-stat-label { display: block; font-size: 11.5px; color: var(--cp-muted); }
.cp-mcard-stat-value { display: block; font-size: 16px; font-weight: 700; color: var(--cp-ink); font-variant-numeric: tabular-nums; }
.cp-mcard-error { padding: 8px 10px; border: 1px solid #fed7aa; border-radius: var(--cp-radius); background: #fff7ed; color: #9a3412; font-size: 12.5px; word-break: break-word; }

/* Empty & loading */
.cp-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 16px; }
.cp-empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--cp-line-soft); color: var(--cp-muted); margin-bottom: 14px; }
.cp-empty-title { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--cp-ink); }
.cp-empty-text { margin: 0 0 16px; max-width: 380px; color: var(--cp-muted); font-size: 13.5px; }
.cp-skeleton-list { padding: 4px 0; }
.cp-skeleton-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--cp-line-soft); }
.cp-skeleton-row:last-child { border-bottom: none; }
.cp-skeleton { display: block; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #eef2f6 25%, #f8fafc 37%, #eef2f6 63%); background-size: 400% 100%; animation: cp-shimmer 1.4s ease infinite; }
.cp-skeleton--wide { flex: 2; }
.cp-skeleton--mid { flex: 1.2; }
.cp-skeleton--short { flex: .6; }
@keyframes cp-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* Confirm dialog */
.cp-backdrop { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, .5); backdrop-filter: blur(2px); animation: cp-fade .15s ease; }
.cp-modal { width: 100%; max-width: 420px; padding: 24px; text-align: center; background: var(--cp-surface); border-radius: 14px; box-shadow: 0 24px 48px -12px rgba(15, 23, 42, .35); animation: cp-pop .18s ease; }
.cp-confirm-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-bottom: 14px; border-radius: 50%; }
.cp-confirm-icon--danger { background: var(--cp-bad-soft); color: var(--cp-bad); }
.cp-confirm-icon--primary { background: var(--cp-primary-soft); color: var(--cp-primary); }
.cp-confirm-title { margin: 0 0 6px; font-size: 17px; font-weight: 700; color: var(--cp-ink); }
.cp-confirm-text { margin: 0 0 20px; color: var(--cp-muted); font-size: 13.5px; word-break: break-word; }
.cp-confirm-actions { display: flex; gap: 8px; }
.cp-confirm-actions .cp-btn { flex: 1; }
@keyframes cp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cp-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

/* Toasts */
.cp-toasts { position: fixed; top: 20px; right: 20px; z-index: 1200; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.cp-toast { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 14px 14px 16px; background: var(--cp-surface); border: 1px solid var(--cp-line); border-radius: 12px; box-shadow: 0 16px 32px -8px rgba(15, 23, 42, .22), 0 2px 6px rgba(15, 23, 42, .06); overflow: hidden; pointer-events: auto; animation: cp-toast-in .25s cubic-bezier(.2, .8, .2, 1); }
.cp-toast-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; margin-top: 1px; border-radius: 50%; color: #fff; flex-shrink: 0; }
.cp-toast--success .cp-toast-icon { background: var(--cp-good); }
.cp-toast--error .cp-toast-icon { background: var(--cp-bad); }
.cp-toast--warning .cp-toast-icon { background: #d97706; }
.cp-toast-body { flex: 1; min-width: 0; }
.cp-toast-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--cp-ink); }
.cp-toast-msg { margin: 2px 0 0; font-size: 13px; color: var(--cp-muted); word-break: break-word; }
.cp-toast-close { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: none; border-radius: 6px; color: var(--cp-faint); cursor: pointer; flex-shrink: 0; }
.cp-toast-close:hover { background: var(--cp-line-soft); color: var(--cp-ink); }
.cp-toast-timer { position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; transform-origin: left; animation: cp-timer 6s linear forwards; }
.cp-toast--success .cp-toast-timer { background: var(--cp-good); }
.cp-toast--error .cp-toast-timer { background: var(--cp-bad); }
.cp-toast--warning .cp-toast-timer { background: #d97706; }
@keyframes cp-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes cp-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* Responsive */
@media (max-width: 1000px) {
  .cp-workspace { grid-template-columns: 1fr; }
  .cp-preview { position: static; }
}
@media (max-width: 768px) {
  .cp-desktop-only { display: none; }
  .cp-mobile-only { display: flex; }
  .cp-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .cp-root { padding: 14px; }
  .cp-title { font-size: 20px; }
  .cp-header-icon { display: none; }
  .cp-panel, .cp-metrics, .cp-history { padding: 16px; }
  .cp-field-row { grid-template-columns: 1fr; }
  .cp-scope { width: 100%; min-width: 0; }
  .cp-segment { font-size: 12.5px; gap: 5px; }
  .cp-toasts { top: auto; bottom: 16px; right: 16px; left: 16px; width: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .cp-root *, .cp-root *::before, .cp-root *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

export default Campaigns;
