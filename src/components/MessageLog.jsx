import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

/* ───────────── Config ───────────── */
const API_BASE = "https://unawake-oversized-moneybags.ngrok-free.dev/api/message-logs";
const PAGE_SIZE = 10;
const POLL_MS = 10000;
const DIRECT = "Direct message";

const cfg = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "ngrok-skip-browser-warning": "true",
  },
});

/* ───────────── Icons ───────────── */
const ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m5 12 5 5L20 7" />,
  chevDown: <path d="m6 9 6 6 6-6" />,
  chevLeft: <path d="m15 18-6-6 6-6" />,
  chevRight: <path d="m9 18 6-6-6-6" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  alert: <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v5M12 18h.01" /></>,
  megaphone: <><path d="M3 11l18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
  message: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10z" /></>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  inbox: <><path d="M3 13h5l1 3h6l1-3h5" /><path d="M5 5h14l2 8v6H3v-6l2-8z" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
};
const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    {ICONS[name]}
  </svg>
);

const CHANNELS = {
  whatsapp: {
    label: "WhatsApp", color: "#25D366",
    path: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z",
  },
  instagram: {
    label: "Instagram", color: "#E1306C",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  messenger: {
    label: "Messenger", color: "#0A7CFF",
    path: "M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.888-3.26-6.559 6.963z",
  },
};
const BrandIcon = ({ channel, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={CHANNELS[channel].path} /></svg>
);

/* ───────────── Helpers ───────────── */
const normStatus = (s) => {
  const v = (s || "").toLowerCase();
  if (["sent", "delivered", "read"].includes(v)) return "delivered";
  if (["failed", "error"].includes(v)) return "failed";
  return "pending";
};
const STATUS_LABEL = { delivered: "Delivered", pending: "Pending", failed: "Failed" };
const normChannel = (p) => {
  const v = (p || "whatsapp").toLowerCase();
  return v === "instagram" || v === "messenger" ? v : "whatsapp";
};
const contactName = (l) => (l.receiverName || "").trim() || (l.name || "").trim() || "Unknown contact";
const campaignOf = (l) => (l.campaignName && l.campaignName !== "Direct Message" ? l.campaignName : null);
const initials = (n) => n.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
const ts = (l) => (l.createdAt ? +new Date(l.createdAt) : Number.MAX_SAFE_INTEGER);
const fmtFull = (d) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Just now");
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const timeAgo = (d, now) => {
  if (!d) return "Just now";
  const s = Math.round((new Date(d) - now) / 1000), a = Math.abs(s);
  if (a < 45) return "Just now";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 604800) return rtf.format(Math.round(s / 86400), "day");
  return new Date(d).toLocaleDateString("en-GB", { dateStyle: "medium" });
};
const inRange = (l, range, now) => {
  if (range === "all" || !l.createdAt) return true;
  const t = +new Date(l.createdAt);
  if (range === "today") return t >= new Date().setHours(0, 0, 0, 0);
  return t >= now - (range === "7d" ? 7 : 30) * 864e5;
};
const errText = (err, fallback) =>
  err.response?.status === 401 ? "Your session has expired. Sign in again to continue." : err.response?.data?.message || fallback;
const toCsv = (rows) =>
  rows.map((r) => r.map((v) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s; // prevent spreadsheet formula injection
    return `"${s.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
const pageList = (c, t) => {
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
  const arr = [...new Set([1, t, c - 1, c, c + 1])].filter((n) => n >= 1 && n <= t).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => { if (i && n - arr[i - 1] > 1) out.push("…" + n); out.push(n); });
  return out;
};

/* ───────────── Small components ───────────── */
function ChannelTag({ channel }) {
  const c = CHANNELS[channel];
  return (
    <span className="ml-chan" style={{ "--c": c.color }}>
      <span className="ml-chan-mark"><BrandIcon channel={channel} /></span>{c.label}
    </span>
  );
}
const StatusPill = ({ status }) => (
  <span className={`ml-status ml-status--${status}`}><i />{STATUS_LABEL[status]}</span>
);
const CampaignTag = ({ log }) => {
  const c = campaignOf(log);
  return c
    ? <span className="ml-tag ml-tag--camp"><Icon name="megaphone" size={13} />{c}</span>
    : <span className="ml-tag"><Icon name="message" size={13} />{DIRECT}</span>;
};

function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sel = options.find((o) => o.value === value) || options[0];
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <div className="ml-dd" ref={ref}>
      <button type="button" className={`ml-dd-btn${value !== options[0].value ? " active" : ""}`} aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${sel.label}`} onClick={() => setOpen((o) => !o)}>
        {sel.icon}<span className="t">{sel.label}</span><Icon name="chevDown" size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="ml-dd-menu" role="listbox" aria-label={label} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}>
            {options.map((o) => (
              <button type="button" key={o.value} role="option" aria-selected={o.value === value} className="ml-dd-item" onClick={() => { onChange(o.value); setOpen(false); }}>
                {o.icon}<span>{o.label}</span>{o.count !== undefined && <span className="n">{o.count}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── Main component ───────────── */
function MessageLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [campaign, setCampaign] = useState("all");
  const [range, setRange] = useState("all");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState([]);
  const [allMatching, setAllMatching] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState({});
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  /* data */
  const fetchLogs = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await axios.get(API_BASE, cfg());
      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setError("");
        setLastSynced(Date.now());
      } else {
        setError(res.data?.message || "The server returned an unexpected response.");
      }
    } catch (err) {
      console.error(err);
      setError(errText(err, "Can't reach the message server. Check your connection and try again."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLogs(false); }, [fetchLogs]);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => { if (!document.hidden) fetchLogs(false); }, POLL_MS);
    return () => clearInterval(id);
  }, [live, fetchLogs]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  /* derived */
  const sorted = useMemo(() => [...logs].sort((a, b) => ts(b) - ts(a)), [logs]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((l) =>
      (!q || [contactName(l), l.receiverNumber, l.messageBody, l.campaignName, l.platform].some((v) => (v || "").toLowerCase().includes(q))) &&
      (channel === "all" || normChannel(l.platform) === channel) &&
      (status === "all" || normStatus(l.status) === status) &&
      (campaign === "all" || (campaignOf(l) || DIRECT) === campaign) &&
      inRange(l, range, now)
    );
  }, [sorted, search, channel, status, campaign, range, now]);

  const stats = useMemo(() => {
    const s = { total: logs.length, delivered: 0, pending: 0, failed: 0 };
    logs.forEach((l) => { s[normStatus(l.status)]++; });
    return s;
  }, [logs]);
  const rate = stats.total ? `${(Math.round((stats.delivered / stats.total) * 1000) / 10).toString()}%` : "—";

  const channelOptions = useMemo(() => [
    { value: "all", label: "All channels", count: logs.length, icon: <Icon name="globe" size={15} /> },
    ...Object.keys(CHANNELS).map((k) => ({
      value: k, label: CHANNELS[k].label, count: logs.filter((l) => normChannel(l.platform) === k).length,
      icon: <span style={{ color: CHANNELS[k].color, display: "flex" }}><BrandIcon channel={k} size={15} /></span>,
    })),
  ], [logs]);
  const statusOptions = useMemo(() => [
    { value: "all", label: "All statuses", count: stats.total, icon: <Icon name="activity" size={15} /> },
    ...["delivered", "pending", "failed"].map((k) => ({ value: k, label: STATUS_LABEL[k], count: stats[k], icon: <i className={`ml-dot ml-dot--${k}`} /> })),
  ], [stats]);
  const campaignOptions = useMemo(() => {
    const map = {};
    logs.forEach((l) => { const k = campaignOf(l) || DIRECT; map[k] = (map[k] || 0) + 1; });
    return [
      { value: "all", label: "All campaigns", count: logs.length, icon: <Icon name="megaphone" size={15} /> },
      ...Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ value: k, label: k, count: n, icon: <Icon name={k === DIRECT ? "message" : "megaphone"} size={14} /> })),
    ];
  }, [logs]);
  const rangeOptions = [
    { value: "all", label: "Any time", icon: <Icon name="calendar" size={15} /> },
    { value: "today", label: "Today", icon: <Icon name="calendar" size={15} /> },
    { value: "7d", label: "Last 7 days", icon: <Icon name="calendar" size={15} /> },
    { value: "30d", label: "Last 30 days", icon: <Icon name="calendar" size={15} /> },
  ];

  const hasFilters = !!search.trim() || channel !== "all" || status !== "all" || campaign !== "all" || range !== "all";
  const clearFilters = () => { setSearch(""); setChannel("all"); setStatus("all"); setCampaign("all"); setRange("all"); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  useEffect(() => { setPage(1); setSelected([]); setAllMatching(false); }, [search, channel, status, campaign, range]);

  /* selection */
  const pageIds = pageRows.map((l) => l._id);
  const isSel = (id) => allMatching || selected.includes(id);
  const allPageSel = pageIds.length > 0 && pageIds.every(isSel);
  const somePageSel = pageIds.some(isSel);
  const selCount = allMatching ? filtered.length : selected.length;
  const clearSel = () => { setSelected([]); setAllMatching(false); };
  const togglePage = () => {
    if (allPageSel) { allMatching ? clearSel() : setSelected((s) => s.filter((id) => !pageIds.includes(id))); }
    else setSelected((s) => [...new Set([...s, ...pageIds])]);
  };
  const toggleRow = (id) => {
    if (allMatching) { setAllMatching(false); setSelected(filtered.map((l) => l._id).filter((x) => x !== id)); }
    else setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  /* actions */
  const deleteIds = async (ids) => {
    try {
      const res = ids.length === 1
        ? await axios.delete(`${API_BASE}/${ids[0]}`, cfg())
        : await axios.post(`${API_BASE}/bulk-delete`, { logIds: ids }, cfg());
      if (!res.data?.success) throw new Error(res.data?.message || "The server couldn't delete the logs.");
      setLogs((prev) => prev.filter((l) => !ids.includes(l._id)));
      clearSel();
      setDetailId(null);
      toast("ok", ids.length === 1 ? "Log deleted" : `${ids.length} logs deleted`);
      fetchLogs(false);
    } catch (err) {
      console.error(err);
      toast("error", errText(err, err.message || "Couldn't delete the logs. Try again."));
    }
  };
  const askDelete = (ids) => setConfirm({
    title: ids.length === 1 ? "Delete this message log?" : `Delete ${ids.length} message logs?`,
    body: "The log is permanently removed from your records. Messages that were already sent are not recalled.",
    label: ids.length === 1 ? "Delete log" : `Delete ${ids.length} logs`,
    run: () => deleteIds(ids),
  });
  const runConfirm = async () => {
    setBusy(true);
    try { await confirm.run(); } finally { setBusy(false); setConfirm(null); }
  };
  const retry = async (id) => {
    setRetrying((r) => ({ ...r, [id]: true }));
    try {
      const res = await axios.post(`${API_BASE}/retry/${id}`, {}, cfg());
      if (!res.data?.success) throw new Error(res.data?.message || "The server couldn't retry this message.");
      toast("ok", "Retry queued");
      fetchLogs(false);
    } catch (err) {
      console.error(err);
      toast("error", errText(err, err.message || "Couldn't retry this message."));
    } finally {
      setRetrying((r) => { const n = { ...r }; delete n[id]; return n; });
    }
  };
  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); toast("ok", `${what} copied`); }
    catch { toast("error", "Couldn't copy. Select the text and copy it manually."); }
  };

  /* EXPORT ALL DATA FIX: Exports ALL filtered data regardless of current page */
  const exportCsv = () => {
    const dataToExport = filtered.length > 0 ? filtered : logs;
    const head = ["Sent at", "Channel", "Recipient", "Number", "Message", "Campaign", "Status"];
    const rows = dataToExport.map((l) => [
      fmtFull(l.createdAt),
      CHANNELS[normChannel(l.platform)].label,
      contactName(l),
      l.receiverNumber,
      l.messageBody,
      campaignOf(l) || DIRECT,
      STATUS_LABEL[normStatus(l.status)]
    ]);
    const blob = new Blob(["\ufeff" + toCsv([head, ...rows])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-message-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("ok", `Exported ALL ${rows.length} log${rows.length === 1 ? "" : "s"}`);
  };

  const detail = logs.find((l) => l._id === detailId);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirm) { if (!busy) setConfirm(null); } else if (detailId) setDetailId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirm, busy, detailId]);

  /* render helpers */
  const renderStatus = (l) => {
    const s = normStatus(l.status);
    return (
      <div className="ml-statuscell">
        <StatusPill status={s} />
        {s === "failed" && (
          <button type="button" className="ml-btn ml-btn--sm" disabled={!!retrying[l._id]} onClick={(e) => { e.stopPropagation(); retry(l._id); }}>
            <Icon name="refresh" size={13} />{retrying[l._id] ? "Retrying…" : "Retry"}
          </button>
        )}
      </div>
    );
  };
  const failReason = detail && (detail.errorMessage || detail.error || detail.failureReason);
  const showEmpty = !loading && filtered.length === 0 && (!error || logs.length > 0);
  const liveLabel = !live ? "Paused" : lastSynced ? `Live · updated ${timeAgo(lastSynced, now)}` : "Live";
  const start = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <MotionConfig reducedMotion="user">
      <div className="ml-root">
        <div className="ml-wrap">
          {/* Header */}
          <header className="ml-head">
            <div>
              <h1 className="ml-title">Message logs</h1>
              <p className="ml-sub">Every message sent through your WhatsApp, Instagram and Messenger channels, with delivery status.</p>
            </div>
            <div className="ml-actions">
              <button type="button" className={`ml-live ${live ? "on" : "off"}`} aria-pressed={live} onClick={() => setLive((v) => !v)} title={live ? "Pause automatic updates" : "Resume automatic updates"}>
                <i />{liveLabel}
              </button>
              <button type="button" className="ml-btn" onClick={() => fetchLogs(true)} disabled={refreshing}>
                <span className={refreshing ? "ml-spin" : ""} style={{ display: "flex" }}><Icon name="refresh" size={15} /></span>Refresh
              </button>
              <button type="button" className="ml-btn ml-btn--primary" onClick={exportCsv} disabled={logs.length === 0}>
                <Icon name="download" size={15} />Export CSV
              </button>
            </div>
          </header>

          {error && (
            <div className="ml-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{error}{logs.length > 0 && " Showing the last data that loaded."}</span>
              <button type="button" className="ml-btn ml-btn--sm" onClick={() => fetchLogs(true)}>Try again</button>
            </div>
          )}

          {/* Delivery health */}
          <section className="ml-health" aria-label="Delivery summary">
            {loading ? (
              <><span className="ml-sk" style={{ width: 140, height: 30 }} /><span className="ml-sk" style={{ width: "100%", height: 10, margin: "16px 0" }} /></>
            ) : (
              <>
                <div className="ml-health-top">
                  <span className="ml-rate">{rate}</span>
                  <span className="ml-rate-sub">{stats.total ? `delivered, out of ${stats.total} message${stats.total === 1 ? "" : "s"}` : "No messages yet"}</span>
                </div>
                <div className="ml-bar" role="img" aria-label={`${stats.delivered} delivered, ${stats.pending} pending, ${stats.failed} failed`}>
                  {stats.total === 0 && <span className="ml-seg" style={{ flex: 1 }} />}
                  {["delivered", "pending", "failed"].map((k) => stats[k] > 0 && <span key={k} className={`ml-seg ml-seg--${k}`} style={{ flex: `${stats[k]} 1 0` }} />)}
                </div>
              </>
            )}
            <div className="ml-legend">
              {[["all", "All", stats.total], ["delivered", "Delivered", stats.delivered], ["pending", "Pending", stats.pending], ["failed", "Failed", stats.failed]].map(([k, label, n]) => (
                <button type="button" key={k} className="ml-chip" aria-pressed={status === k} onClick={() => setStatus(status === k ? "all" : k)}>
                  {k !== "all" && <i className={`ml-dot ml-dot--${k}`} />}{label}<b>{n}</b>
                </button>
              ))}
            </div>
          </section>

          {/* Toolbar */}
          <div className="ml-toolbar">
            <div className="ml-search">
              <Icon name="search" size={16} />
              <input className="ml-input" type="search" placeholder="Search by name, number, message or campaign" aria-label="Search message logs" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Dropdown label="Channel" options={channelOptions} value={channel} onChange={setChannel} />
            <Dropdown label="Status" options={statusOptions} value={status} onChange={setStatus} />
            <Dropdown label="Campaign" options={campaignOptions} value={campaign} onChange={setCampaign} />
            <Dropdown label="Date range" options={rangeOptions} value={range} onChange={setRange} />
            {hasFilters && <button type="button" className="ml-btn" onClick={clearFilters}><Icon name="x" size={14} />Clear filters</button>}
          </div>

          {/* Selection bar */}
          <AnimatePresence>
            {selCount > 0 && (
              <motion.div className="ml-selbar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <span><b>{selCount}</b> selected</span>
                {!allMatching && allPageSel && filtered.length > pageRows.length && (
                  <button type="button" className="link" onClick={() => setAllMatching(true)}>Select all {filtered.length} matching logs</button>
                )}
                <span className="grow" />
                <button type="button" className="ml-btn ml-btn--sm" onClick={clearSel}>Clear selection</button>
                <button type="button" className="ml-btn ml-btn--sm ml-btn--danger" onClick={() => askDelete(allMatching ? filtered.map((l) => l._id) : selected)}>
                  <Icon name="trash" size={13} />Delete {selCount}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logs */}
          <div className="ml-card">
            {loading ? (
              <div className="ml-skel" aria-busy="true" aria-label="Loading message logs">
                {Array.from({ length: 6 }, (_, i) => (
                  <div className="ml-skel-row" key={i}>
                    <span className="ml-sk" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                    <div style={{ display: "grid", gap: 8 }}><span className="ml-sk" style={{ width: 150 }} /><span className="ml-sk" style={{ width: 100 }} /></div>
                    <span className="ml-sk" style={{ flex: 1, maxWidth: 360 }} />
                    <span className="ml-sk" style={{ width: 80 }} />
                  </div>
                ))}
              </div>
            ) : showEmpty ? (
              <div className="ml-empty">
                <span className="ml-empty-ico"><Icon name={hasFilters ? "search" : "inbox"} size={20} /></span>
                <h3>{hasFilters ? "No logs match these filters" : "No messages yet"}</h3>
                <p>{hasFilters ? "Try a different search term or widen the date range." : "Messages sent from campaigns or direct chats will show up here."}</p>
                {hasFilters && <button type="button" className="ml-btn" onClick={clearFilters}>Clear filters</button>}
              </div>
            ) : filtered.length > 0 && (
              <>
                {/* Desktop table */}
                <div className="ml-scroll">
                  <table className="ml-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>
                          <input type="checkbox" className="ml-check" aria-label="Select all logs on this page" checked={allPageSel} ref={(el) => { if (el) el.indeterminate = somePageSel && !allPageSel; }} onChange={togglePage} />
                        </th>
                        <th>Channel</th><th>Recipient</th><th>Message</th><th>Campaign</th><th>Status</th><th>Sent</th>
                        <th style={{ width: 90 }}><span className="ml-sr">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((l) => {
                        const name = contactName(l);
                        return (
                          <tr key={l._id} className={isSel(l._id) ? "sel" : ""} onClick={() => setDetailId(l._id)}>
                            <td onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="ml-check" aria-label={`Select log for ${name}`} checked={isSel(l._id)} onChange={() => toggleRow(l._id)} />
                            </td>
                            <td><ChannelTag channel={normChannel(l.platform)} /></td>
                            <td>
                              <div className="ml-who">
                                <span className="ml-avatar">{initials(name)}</span>
                                <div><div className="ml-name">{name}</div><div className="ml-num">{l.receiverNumber || "No number"}</div></div>
                              </div>
                            </td>
                            <td><button type="button" className="ml-msg" onClick={(e) => { e.stopPropagation(); setDetailId(l._id); }} title="View details">{l.messageBody || "—"}</button></td>
                            <td><CampaignTag log={l} /></td>
                            <td>{renderStatus(l)}</td>
                            <td className="ml-time" title={fmtFull(l.createdAt)}>{timeAgo(l.createdAt, now)}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="ml-rowact">
                                <button type="button" className="ml-iconbtn" aria-label={`View details for ${name}`} onClick={() => setDetailId(l._id)}><Icon name="eye" size={16} /></button>
                                <button type="button" className="ml-iconbtn ml-iconbtn--danger" aria-label={`Delete log for ${name}`} onClick={() => askDelete([l._id])}><Icon name="trash" size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="ml-cards">
                  {pageRows.map((l) => {
                    const name = contactName(l);
                    return (
                      <article key={l._id} className={`ml-mcard${isSel(l._id) ? " sel" : ""}`}>
                        <div className="ml-mrow">
                          <label className="ml-who">
                            <input type="checkbox" className="ml-check" aria-label={`Select log for ${name}`} checked={isSel(l._id)} onChange={() => toggleRow(l._id)} />
                            <span className="ml-avatar">{initials(name)}</span>
                            <div><div className="ml-name">{name}</div><div className="ml-num">{l.receiverNumber || "No number"}</div></div>
                          </label>
                          <ChannelTag channel={normChannel(l.platform)} />
                        </div>
                        <button type="button" className="ml-msg" style={{ maxWidth: "none" }} onClick={() => setDetailId(l._id)}>{l.messageBody || "—"}</button>
                        <CampaignTag log={l} />
                        <div className="ml-mrow">
                          {renderStatus(l)}
                          <span className="ml-time" title={fmtFull(l.createdAt)}>{timeAgo(l.createdAt, now)}</span>
                        </div>
                        <div className="ml-mrow" style={{ justifyContent: "flex-end", gap: 8 }}>
                          <button type="button" className="ml-btn ml-btn--sm" onClick={() => setDetailId(l._id)}><Icon name="eye" size={13} />Details</button>
                          <button type="button" className="ml-btn ml-btn--sm" onClick={() => askDelete([l._id])}><Icon name="trash" size={13} />Delete</button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                <nav className="ml-pager" aria-label="Pagination">
                  <span>Showing {start}–{end} of {filtered.length}</span>
                  <div className="ml-pages">
                    <button type="button" className="ml-page" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><Icon name="chevLeft" size={16} /></button>
                    {pageList(safePage, totalPages).map((n) =>
                      typeof n === "string"
                        ? <span key={n} className="ml-page" style={{ cursor: "default" }}>…</span>
                        : <button type="button" key={n} className="ml-page" aria-current={n === safePage ? "page" : undefined} onClick={() => setPage(n)}>{n}</button>
                    )}
                    <button type="button" className="ml-page" aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><Icon name="chevRight" size={16} /></button>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>

        {/* Details drawer */}
        <AnimatePresence>
          {detail && (
            <>
              <motion.div className="ml-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailId(null)} />
              <motion.aside className="ml-drawer" role="dialog" aria-modal="true" aria-label="Message details" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}>
                <div className="ml-drawer-head">
                  <h2>Message details</h2>
                  <button type="button" className="ml-iconbtn" aria-label="Close details" autoFocus onClick={() => setDetailId(null)}><Icon name="x" size={18} /></button>
                </div>
                <div className="ml-drawer-body">
                  <div className="ml-statuscell">{<StatusPill status={normStatus(detail.status)} />}<span className="ml-time">{fmtFull(detail.createdAt)}</span></div>
                  {normStatus(detail.status) === "failed" && (
                    <div className="ml-fail"><b>This message wasn't delivered.</b><div>{failReason || "The channel didn't return a failure reason. Retry the message to try again."}</div></div>
                  )}
                  <div>
                    <div className="ml-label">Message</div>
                    <div className="ml-bubble">{detail.messageBody || "—"}</div>
                    <button type="button" className="ml-btn ml-btn--sm" style={{ marginTop: 10 }} onClick={() => copy(detail.messageBody || "", "Message")}><Icon name="copy" size={13} />Copy message</button>
                  </div>
                  <dl className="ml-dl">
                    <dt>Recipient</dt><dd>{contactName(detail)}</dd>
                    <dt>Number</dt>
                    <dd>{detail.receiverNumber || "—"}{detail.receiverNumber && <button type="button" className="ml-iconbtn" aria-label="Copy number" onClick={() => copy(detail.receiverNumber, "Number")}><Icon name="copy" size={14} /></button>}</dd>
                    <dt>Channel</dt><dd><ChannelTag channel={normChannel(detail.platform)} /></dd>
                    <dt>Campaign</dt><dd><CampaignTag log={detail} /></dd>
                    <dt>Log ID</dt>
                    <dd><code>{detail._id}</code><button type="button" className="ml-iconbtn" aria-label="Copy log ID" onClick={() => copy(detail._id, "Log ID")}><Icon name="copy" size={14} /></button></dd>
                  </dl>
                </div>
                <div className="ml-drawer-foot">
                  <button type="button" className="ml-btn" onClick={() => askDelete([detail._id])}><Icon name="trash" size={14} />Delete log</button>
                  {normStatus(detail.status) === "failed" && (
                    <button type="button" className="ml-btn ml-btn--primary" disabled={!!retrying[detail._id]} onClick={() => retry(detail._id)}><Icon name="refresh" size={14} />{retrying[detail._id] ? "Retrying…" : "Retry message"}</button>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Confirm dialog */}
        <AnimatePresence>
          {confirm && (
            <motion.div className="ml-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !busy && setConfirm(null)}>
              <motion.div className="ml-modal" role="alertdialog" aria-modal="true" aria-labelledby="ml-confirm-title" initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} transition={{ duration: 0.16 }} onMouseDown={(e) => e.stopPropagation()}>
                <span className="ml-modal-ico"><Icon name="alert" size={20} /></span>
                <h2 id="ml-confirm-title">{confirm.title}</h2>
                <p>{confirm.body}</p>
                <div className="ml-modal-foot">
                  <button type="button" className="ml-btn" autoFocus disabled={busy} onClick={() => setConfirm(null)}>Cancel</button>
                  <button type="button" className="ml-btn ml-btn--danger" disabled={busy} onClick={runConfirm}>{busy ? "Deleting…" : confirm.label}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toasts */}
        <div className="ml-toasts" role="status" aria-live="polite">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div key={t.id} className={`ml-toast ml-toast--${t.type}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}>
                <Icon name={t.type === "ok" ? "check" : "alert"} size={16} />{t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

/* ───────────── Styles ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.ml-root{--bg:#F2F4F7;--surface:#fff;--surface-2:#F8F9FB;--line:#E4E7EC;--line-2:#D0D5DD;--ink:#101828;--ink-2:#475467;--ink-3:#667085;--accent:#2F46E0;--accent-soft:#EBEEFF;--ok:#067647;--ok-bg:#E7F6EC;--ok-dot:#12B76A;--warn:#B54708;--warn-bg:#FEF3E2;--warn-dot:#F79009;--bad:#B42318;--bad-bg:#FEECEA;--bad-dot:#F04438;
font-family:"Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.5;color:var(--ink);background:var(--bg);min-height:100vh;padding:clamp(16px,3vw,40px);box-sizing:border-box;-webkit-font-smoothing:antialiased}
.ml-root *,.ml-root *::before,.ml-root *::after{box-sizing:border-box}
.ml-root button{font:inherit;color:inherit;cursor:pointer}
.ml-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ml-wrap{max-width:1320px;margin:0 auto}
.ml-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.ml-head{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.ml-title{font-size:clamp(22px,3.4vw,28px);font-weight:800;letter-spacing:-.02em;margin:0;line-height:1.2}
.ml-sub{margin:4px 0 0;color:var(--ink-3);max-width:62ch}
.ml-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.ml-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:36px;padding:0 14px;border-radius:9px;border:1px solid var(--line-2);background:var(--surface);font-weight:600;font-size:13.5px;transition:background .15s,border-color .15s;white-space:nowrap}
.ml-btn:hover:not(:disabled){background:var(--surface-2);border-color:var(--ink-3)}
.ml-btn:disabled{opacity:.5;cursor:not-allowed}

/* Fixed Primary & Export CSV Button CSS with High Contrast */
.ml-btn--primary{background:#2F46E0;border-color:#2F46E0;color:#ffffff !important;box-shadow:0 2px 4px rgba(47,70,224,0.2)}
.ml-btn--primary:hover:not(:disabled){background:#1E32B8;border-color:#1E32B8;color:#ffffff !important}

.ml-btn--danger{background:var(--bad);border-color:var(--bad);color:#fff}
.ml-btn--danger:hover:not(:disabled){background:#912018;border-color:#912018}
.ml-btn--sm{height:30px;padding:0 10px;font-size:12.5px;border-radius:8px}
.ml-iconbtn{width:32px;height:32px;display:inline-grid;place-items:center;border-radius:8px;border:0;background:transparent;color:var(--ink-3)}
.ml-iconbtn:hover{background:var(--surface-2);color:var(--ink)}
.ml-iconbtn--danger:hover{background:var(--bad-bg);color:var(--bad)}
.ml-live{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 6px;border:0;background:none;font-size:12.5px;font-weight:500;color:var(--ink-3)}
.ml-live i{width:8px;height:8px;border-radius:50%;background:var(--line-2)}
.ml-live.on i{background:var(--ok-dot);animation:ml-pulse 2s infinite}
@keyframes ml-pulse{0%{box-shadow:0 0 0 0 rgba(18,183,106,.5)}70%,100%{box-shadow:0 0 0 7px rgba(18,183,106,0)}}
.ml-spin{animation:ml-rot .9s linear infinite}
@keyframes ml-rot{to{transform:rotate(360deg)}}
.ml-alert{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:12px;background:var(--bad-bg);color:var(--bad);border:1px solid #FDA29B;margin-bottom:16px;font-weight:500}
.ml-alert span{flex:1}
.ml-health{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:16px}
.ml-health-top{display:flex;align-items:baseline;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.ml-rate{font-size:clamp(28px,4vw,36px);font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1}
.ml-rate-sub{color:var(--ink-3)}
.ml-bar{display:flex;gap:3px;height:10px;border-radius:6px;overflow:hidden;background:var(--surface-2)}
.ml-seg{border-radius:3px;min-width:4px;background:var(--line)}
.ml-seg--delivered{background:var(--ok-dot)}.ml-seg--pending{background:var(--warn-dot)}.ml-seg--failed{background:var(--bad-dot)}
.ml-legend{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.ml-chip{display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:13px;font-weight:500;color:var(--ink-2)}
.ml-chip b{color:var(--ink);font-variant-numeric:tabular-nums}
.ml-chip:hover{border-color:var(--line-2);background:var(--surface-2)}
.ml-chip[aria-pressed=true]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.ml-chip[aria-pressed=true] b{color:var(--accent)}
.ml-dot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}
.ml-dot--delivered{background:var(--ok-dot)}.ml-dot--pending{background:var(--warn-dot)}.ml-dot--failed{background:var(--bad-dot)}
.ml-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.ml-search{position:relative;flex:1 1 280px;min-width:200px}
.ml-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink-3);pointer-events:none}
.ml-input{width:100%;height:38px;padding:0 12px 0 38px;border:1px solid var(--line-2);border-radius:9px;background:var(--surface);font:inherit;color:var(--ink)}
.ml-input::placeholder{color:var(--ink-3)}
.ml-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.ml-dd{position:relative}
.ml-dd-btn{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 12px;border:1px solid var(--line-2);border-radius:9px;background:var(--surface);font-weight:600;font-size:13.5px;max-width:220px}
.ml-dd-btn .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ml-dd-btn:hover{border-color:var(--ink-3)}
.ml-dd-btn.active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.ml-dd-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:100%;width:max-content;max-width:300px;max-height:320px;overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 32px -8px rgba(16,24,40,.18);padding:4px;z-index:30}
.ml-dd-item{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:0;background:transparent;border-radius:8px;text-align:left;font-size:13.5px;font-weight:500}
.ml-dd-item:hover{background:var(--surface-2)}
.ml-dd-item[aria-selected=true]{background:var(--accent-soft);color:var(--accent);font-weight:700}
.ml-dd-item .n{margin-left:auto;padding-left:12px;color:var(--ink-3);font-size:12.5px;font-variant-numeric:tabular-nums;font-weight:500}
.ml-selbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:10px 14px;margin-bottom:12px;background:var(--ink);color:#fff;border-radius:12px;overflow:hidden}
.ml-selbar .grow{flex:1}
.ml-selbar .link{background:none;border:0;padding:0;color:#C7D0FF;text-decoration:underline;font-weight:600}
.ml-selbar .ml-btn:not(.ml-btn--danger){background:transparent;border-color:rgba(255,255,255,.3);color:#fff}
.ml-selbar .ml-btn:not(.ml-btn--danger):hover:not(:disabled){background:rgba(255,255,255,.1)}
.ml-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.ml-scroll{overflow-x:auto}
.ml-table{width:100%;border-collapse:collapse;min-width:960px}
.ml-table th{padding:11px 16px;text-align:left;font-size:12.5px;font-weight:600;color:var(--ink-3);background:var(--surface-2);border-bottom:1px solid var(--line);white-space:nowrap}
.ml-table td{padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.ml-table tbody tr{cursor:pointer;transition:background .12s}
.ml-table tbody tr:hover{background:var(--surface-2)}
.ml-table tbody tr.sel{background:var(--accent-soft)}
.ml-table tbody tr:last-child td{border-bottom:0}
.ml-check{width:16px;height:16px;accent-color:var(--accent);cursor:pointer}
.ml-who{display:flex;align-items:center;gap:10px;min-width:0}
.ml-avatar{width:32px;height:32px;border-radius:50%;background:var(--surface-2);border:1px solid var(--line);display:grid;place-items:center;font-weight:700;font-size:12px;color:var(--ink-2);flex:none}
.ml-name{font-weight:600;white-space:nowrap}
.ml-num{font-size:12.5px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.ml-msg{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:340px;color:var(--ink-2);text-align:left;background:none;border:0;padding:0;word-break:break-word}
.ml-msg:hover{color:var(--ink)}
.ml-time{color:var(--ink-3);white-space:nowrap;font-size:13px}
.ml-rowact{display:flex;gap:2px;justify-content:flex-end}
.ml-chan{display:inline-flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap}
.ml-chan-mark{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent)}
.ml-status{display:inline-flex;align-items:center;gap:7px;padding:3px 10px;border-radius:999px;font-size:12.5px;font-weight:600;white-space:nowrap}
.ml-status i{width:6px;height:6px;border-radius:50%}
.ml-status--delivered{background:var(--ok-bg);color:var(--ok)}.ml-status--delivered i{background:var(--ok-dot)}
.ml-status--pending{background:var(--warn-bg);color:var(--warn)}.ml-status--pending i{background:var(--warn-dot)}
.ml-status--failed{background:var(--bad-bg);color:var(--bad)}.ml-status--failed i{background:var(--bad-dot)}
.ml-statuscell{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ml-tag{display:inline-flex;align-items:center;gap:6px;color:var(--ink-3);font-size:13px;font-weight:500;white-space:nowrap}
.ml-tag--camp{color:var(--ink-2);background:var(--surface-2);border:1px solid var(--line);border-radius:7px;padding:3px 9px;max-width:100%}
.ml-cards{display:none}
.ml-mcard{padding:14px 16px;border-bottom:1px solid var(--line);display:grid;gap:10px;justify-items:start}
.ml-mcard>*{max-width:100%}
.ml-mcard.sel{background:var(--accent-soft)}
.ml-mrow{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;flex-wrap:wrap}
@media(max-width:860px){.ml-scroll{display:none}.ml-cards{display:block}.ml-head{align-items:flex-start}}
.ml-pager{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--line);color:var(--ink-3);font-size:13px}
.ml-pages{display:flex;gap:4px;align-items:center}
.ml-page{min-width:32px;height:32px;padding:0 8px;display:inline-grid;place-items:center;border-radius:8px;border:0;background:transparent;font-weight:600;font-variant-numeric:tabular-nums;color:var(--ink-2)}
.ml-page:hover:not(:disabled){background:var(--surface-2)}
.ml-page[aria-current=page]{background:var(--ink);color:#fff}
.ml-page:disabled{opacity:.4;cursor:not-allowed}
.ml-empty{padding:56px 20px;text-align:center;color:var(--ink-3)}
.ml-empty h3{margin:14px 0 4px;color:var(--ink);font-size:16px}
.ml-empty p{margin:0 auto 16px;max-width:42ch}
.ml-empty-ico{width:44px;height:44px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line);display:inline-grid;place-items:center}
.ml-skel-row{display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid var(--line)}
.ml-sk{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,var(--line) 25%,var(--surface-2) 50%,var(--line) 75%);background-size:200% 100%;animation:ml-sh 1.4s infinite}
@keyframes ml-sh{to{background-position:-200% 0}}
.ml-scrim{position:fixed;inset:0;background:rgba(16,24,40,.3);z-index:9997}
.ml-drawer{position:fixed;top:0;right:0;bottom:0;width:min(460px,100%);background:var(--surface);z-index:9998;display:flex;flex-direction:column;box-shadow:-16px 0 40px -12px rgba(16,24,40,.25)}
.ml-drawer-head{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid var(--line)}
.ml-drawer-head h2{margin:0;font-size:16px}
.ml-drawer-body{flex:1;overflow:auto;padding:20px;display:grid;gap:20px;align-content:start}
.ml-drawer-foot{display:flex;gap:8px;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--line)}
.ml-label{font-size:13px;font-weight:600;color:var(--ink-3);margin-bottom:6px}
.ml-bubble{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px;white-space:pre-wrap;word-break:break-word}
.ml-fail{background:var(--bad-bg);color:var(--bad);border-radius:12px;padding:12px 14px}
.ml-dl{display:grid;grid-template-columns:96px 1fr;gap:10px 16px;margin:0;align-items:center}
.ml-dl dt{color:var(--ink-3)}
.ml-dl dd{margin:0;display:flex;align-items:center;gap:6px;min-width:0;word-break:break-all}
.ml-dl code{font-size:12.5px;color:var(--ink-2)}
.ml-overlay{position:fixed;inset:0;background:rgba(16,24,40,.45);backdrop-filter:blur(4px);z-index:9999;display:grid;place-items:center;padding:16px}
.ml-modal{width:100%;max-width:420px;background:var(--surface);border-radius:16px;padding:24px;box-shadow:0 24px 48px -12px rgba(16,24,40,.35)}
.ml-modal h2{margin:14px 0 6px;font-size:17px}
.ml-modal p{margin:0;color:var(--ink-2)}
.ml-modal-ico{width:40px;height:40px;border-radius:10px;background:var(--bad-bg);color:var(--bad);display:grid;place-items:center}
.ml-modal-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}
.ml-toasts{position:fixed;right:20px;bottom:20px;display:grid;gap:8px;z-index:10000}
.ml-toast{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:11px;background:var(--ink);color:#fff;box-shadow:0 12px 28px -8px rgba(16,24,40,.4);font-weight:600;font-size:13.5px;max-width:360px}
.ml-toast--error{background:var(--bad)}
@media(max-width:600px){.ml-toasts{left:12px;right:12px;bottom:12px}.ml-health{padding:16px}}
@media(prefers-reduced-motion:reduce){.ml-root *{animation:none!important;transition:none!important}}
`;

if (typeof document !== "undefined") {
  let tag = document.getElementById("ml-styles");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "ml-styles";
    document.head.appendChild(tag);
  }
  tag.textContent = CSS;
}

export default MessageLog;