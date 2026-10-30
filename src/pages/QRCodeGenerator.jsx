import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { QRCode } from "react-qrcode-logo";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

/* ───────────── API base ───────────── */
const resolveApiBase = () => {
  try {
    if (typeof process !== "undefined" && process?.env?.REACT_APP_API_BASE_URL) return process.env.REACT_APP_API_BASE_URL;
    if (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    if (typeof window !== "undefined") {
      if (window.__env?.REACT_APP_API_BASE_URL) return window.__env.REACT_APP_API_BASE_URL;
      if (window.REACT_APP_API_BASE_URL) return window.REACT_APP_API_BASE_URL;
    }
  } catch (e) { /* ignore */ }
  return "http://localhost:5000";
};
const API_BASE_URL = resolveApiBase();
const PAGE_SIZE = 6;

const request = async (path, { method = "GET", body, signal } = {}) => {
  const token = localStorage.getItem("token");
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { /* handled below */ }
  if (resp.status === 401) throw new Error("Your session has expired. Sign in again to continue.");
  if (!data) throw new Error("The server sent an unexpected response. Try again in a moment.");
  if (!resp.ok || !data.success) throw new Error(data.message || `Request failed (${resp.status}).`);
  return data;
};

/* ───────────── Icons ───────────── */
const ICONS = {
  analytics: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  cta: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 15h10M12 9l3 3-3 3" /></>,
  widget: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m5 12 5 5L20 7" />,
  alert: <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v5M12 18h.01" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  chevLeft: <path d="m15 18-6-6 6-6" />,
  chevRight: <path d="m9 18 6-6-6-6" />,
  chevDown: <path d="m6 9 6 6 6-6" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  mobile: <rect x="5" y="2" width="14" height="20" rx="2" />,
  desktop: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>
};
const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    {ICONS[name] || ICONS.qr}
  </svg>
);

/* ───────────── Helpers ───────────── */
const slug = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "qr-campaign";
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—");
const lum = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const colorWarning = (fg, bg) => {
  const a = lum(fg), b = lum(bg);
  if (a == null || b == null) return "";
  if (a > b) return "A light pattern on a dark background is hard for many scanners to read. Use a dark pattern on a light background.";
  const ratio = (b + 0.05) / (a + 0.05);
  return ratio < 3 ? `Contrast is low (${ratio.toFixed(1)}:1). The code may not scan reliably.` : "";
};
const svgSource = (el) => {
  let s = new XMLSerializer().serializeToString(el);
  if (!/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(s)) s = s.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  return s;
};
const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const pageList = (c, t) => {
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
  const arr = [...new Set([1, t, c - 1, c, c + 1])].filter((n) => n >= 1 && n <= t).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => { if (i && n - arr[i - 1] > 1) out.push("…" + n); out.push(n); });
  return out;
};
const FG_PRESETS = ["#101828", "#000000", "#1D2BB8", "#0B6B4F", "#7A1F3D"];

/* ───────────── Sub-components ───────────── */
function ColorField({ id, label, value, onChange }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="qs-field">
      <label htmlFor={id}>{label}</label>
      <div className="qs-color">
        <input type="color" id={id} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input className="qs-input" value={draft} maxLength={7} aria-label={`${label} hex value`} spellCheck={false}
          onChange={(e) => { setDraft(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value); }} />
      </div>
    </div>
  );
}

const Segmented = ({ label, options, value, onChange }) => (
  <div role="radiogroup" aria-label={label} className="qs-seg">
    {options.map((o) => (
      <button type="button" key={o.value} role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

/* ───────────── Main Studio Component ───────────── */
export default function GrowthToolsStudio() {
  const [activeTab, setActiveTab] = useState("analytics");

  /* Toasts System */
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  /* QR Code Studio State */
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [defaultMessage, setDefaultMessage] = useState("Hi! I'd like to know more.");
  const [fgColor, setFgColor] = useState("#101828");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [size, setSize] = useState(512);
  const [ecLevel, setEcLevel] = useState("M");
  const [quietZone, setQuietZone] = useState(10);
  const [eyeRadius, setEyeRadius] = useState(8);
  const [qrStyle, setQrStyle] = useState("dots");

  const [saved, setSaved] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [listError, setListError] = useState("");
  const [touched, setTouched] = useState(false);
  const [svgOk, setSvgOk] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  /* Real Backend States for Other Tabs */
  const [analyticsData, setAnalyticsData] = useState({ totalClicks: 0, activeQrs: 0, activeShortLinks: 0, widgetLeads: 0, devices: { android: 0, ios: 0, desktop: 0 }, topChannels: [] });
  const [shortLinks, setShortLinks] = useState([]);
  const [shortTitle, setShortTitle] = useState("");
  const [shortSlugStr, setShortSlugStr] = useState("");
  const [shortPhone, setShortPhone] = useState("");
  const [shortMsg, setShortMsg] = useState("");
  const [creatingShort, setCreatingShort] = useState(false);

  const [ctaUrls, setCtaUrls] = useState([]);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaTargetUrl, setCtaTargetUrl] = useState("");
  const [creatingCta, setCreatingCta] = useState(false);

  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetWelcome, setWidgetWelcome] = useState("");
  const [widgetPos, setWidgetPos] = useState("right");
  const [widgetPhone, setWidgetPhone] = useState("");
  const [savingWidget, setSavingWidget] = useState(false);

  const abortRef = useRef(null);
  const fileRef = useRef(null);

  /* Derived QR Values */
  const cleanNumber = useMemo(() => (phoneNumber || "").replace(/[^0-9]/g, ""), [phoneNumber]);
  const phoneValid = cleanNumber.length >= 8 && cleanNumber.length <= 15;
  const phoneError = touched && !phoneValid ? "Enter the number with its country code, 8 to 15 digits." : "";
  const rawWaLink = phoneValid ? `https://wa.me/${cleanNumber}${defaultMessage ? `?text=${encodeURIComponent(defaultMessage)}` : ""}` : "";
  const qrValue = trackingUrl || rawWaLink;
  const warning = colorWarning(fgColor, bgColor);

  /* ───────────── Real API Loaders ───────────── */
  const loadQrs = useCallback(async (ac) => {
    try {
      const d = await request("/api/qr/my-qrs", { signal: ac.signal });
      setSaved(Array.isArray(d.data) ? d.data : []);
    } catch (err) {
      if (err.name !== "AbortError") setListError(err.message);
    }
  }, []);

  const loadAnalytics = useCallback(async (ac) => {
    try {
      const d = await request("/api/analytics/overview", { signal: ac.signal });
      if (d?.data) setAnalyticsData(d.data);
    } catch (e) { /* handled by backend fallback */ }
  }, []);

  const loadShortLinks = useCallback(async (ac) => {
    try {
      const d = await request("/api/short-links", { signal: ac.signal });
      if (Array.isArray(d?.data)) setShortLinks(d.data);
    } catch (e) { /* ignore error on init */ }
  }, []);

  const loadCtaUrls = useCallback(async (ac) => {
    try {
      const d = await request("/api/cta-urls", { signal: ac.signal });
      if (Array.isArray(d?.data)) setCtaUrls(d.data);
    } catch (e) { /* ignore error on init */ }
  }, []);

  const loadWidgetConfig = useCallback(async (ac) => {
    try {
      const d = await request("/api/widgets/config", { signal: ac.signal });
      if (d?.data) {
        setWidgetTitle(d.data.title || "");
        setWidgetWelcome(d.data.welcomeMessage || "");
        setWidgetPos(d.data.position || "right");
        setWidgetPhone(d.data.phoneNumber || "");
      }
    } catch (e) { /* ignore error on init */ }
  }, []);

  const loadAllData = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setFetching(true);
    setListError("");

    await Promise.allSettled([
      loadQrs(ac),
      loadAnalytics(ac),
      loadShortLinks(ac),
      loadCtaUrls(ac),
      loadWidgetConfig(ac),
    ]);

    if (abortRef.current === ac) setFetching(false);
  }, [loadQrs, loadAnalytics, loadShortLinks, loadCtaUrls, loadWidgetConfig]);

  useEffect(() => { loadAllData(); return () => abortRef.current?.abort(); }, [loadAllData]);

  useEffect(() => {
    setSvgOk(document.getElementById("qs-qr")?.tagName?.toLowerCase() === "svg");
  }, [phoneValid, qrStyle, size, logoUrl, activeTab]);

  /* Logo Handlers */
  const handleLogoUpload = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("error", "Logo size must be under 2 MB.");
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return toast("error", "Only PNG, JPEG, WebP or SVG images are supported.");
    const reader = new FileReader();
    reader.onload = () => { setLogoUrl(reader.result); setLogoFileName(file.name); toast("success", "Logo added"); };
    reader.onerror = () => toast("error", "Failed to read file.");
    reader.readAsDataURL(file);
  };
  const removeLogo = () => { setLogoUrl(""); setLogoFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  /* QR Campaign Actions */
  const resetForm = () => {
    setActiveId(null); setTrackingUrl(""); setTitle(""); setPhoneNumber("");
    setDefaultMessage("Hi! I'd like to know more."); removeLogo(); setTouched(false);
  };

  const save = async () => {
    setTouched(true);
    if (!phoneValid) return;
    setSaving(true);
    try {
      const d = await request("/api/qr/save", {
        method: "POST",
        body: {
          title: title.trim() || `Campaign ${new Date().toLocaleString()}`,
          phoneNumber: cleanNumber, defaultMessage, fgColor, bgColor, logoUrl, size, ecLevel, quietZone, eyeRadius, qrStyle,
        },
      });
      setActiveId(d.data._id);
      setTrackingUrl(d.data.trackingUrl || "");
      toast("success", "Campaign saved! Scans are now tracked.");
      loadAllData();
    } catch (err) {
      toast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectQr = (qr) => {
    setActiveId(qr._id);
    setTitle(qr.title || "");
    setPhoneNumber(qr.phoneNumber || "");
    setDefaultMessage(qr.defaultMessage || "");
    setFgColor(qr.fgColor || "#101828");
    setBgColor(qr.bgColor || "#ffffff");
    setLogoUrl(qr.logoUrl || ""); setLogoFileName("");
    setSize(qr.size || 512); setEcLevel(qr.ecLevel || "M");
    setQuietZone(qr.quietZone ?? 10); setEyeRadius(qr.eyeRadius ?? 8);
    setQrStyle(qr.qrStyle || "dots");
    setTrackingUrl(qr.trackingUrl || "");
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("info", `Loaded “${qr.title || "Untitled"}”`);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await request(`/api/qr/${confirm.id}`, { method: "DELETE" });
      if (activeId === confirm.id) { setActiveId(null); setTrackingUrl(""); }
      toast("success", "Campaign deleted");
      loadAllData();
    } catch (err) {
      toast("error", err.message);
    } finally {
      setDeleting(false); setConfirm(null);
    }
  };

  const copyText = async (text, what) => {
    try { await navigator.clipboard.writeText(text); toast("success", `${what} copied`); }
    catch { toast("error", "Couldn't copy text automatically."); }
  };

  const downloadPng = () => {
    const el = document.getElementById("qs-qr");
    if (!el) return toast("error", "Generate a valid QR code first.");
    try {
      const done = (blob) => (blob ? (saveBlob(blob, `${slug(title)}.png`), toast("success", "PNG downloaded")) : toast("error", "PNG creation failed."));
      if (el.tagName.toLowerCase() === "canvas") return el.toBlob(done, "image/png");
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d");
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        try { c.toBlob(done, "image/png"); } catch (e) { toast("error", "Failed to render PNG."); }
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgSource(el));
    } catch (err) { toast("error", "Failed to export image."); }
  };

  const downloadSvg = () => {
    const el = document.getElementById("qs-qr");
    if (!el || el.tagName.toLowerCase() !== "svg") return;
    saveBlob(new Blob([svgSource(el)], { type: "image/svg+xml;charset=utf-8" }), `${slug(title)}.svg`);
    toast("success", "SVG downloaded");
  };

  /* Short Link Action */
  const handleCreateShortLink = async () => {
    if (!shortPhone.trim()) return toast("error", "Please enter a valid WhatsApp number.");
    setCreatingShort(true);
    try {
      await request("/api/short-links/create", {
        method: "POST",
        body: { title: shortTitle || "Untitled Short Link", slug: shortSlugStr, phoneNumber: shortPhone, defaultMessage: shortMsg }
      });
      toast("success", "Short link created successfully!");
      setShortTitle(""); setShortSlugStr(""); setShortPhone(""); setShortMsg("");
      const ac = new AbortController();
      loadShortLinks(ac);
    } catch (err) {
      toast("error", err.message);
    } finally {
      setCreatingShort(false);
    }
  };

  /* CTA URL Action */
  const handleCreateCta = async () => {
    if (!ctaLabel.trim() || !ctaTargetUrl.trim()) return toast("error", "Label and Target URL are required.");
    setCreatingCta(true);
    try {
      await request("/api/cta-urls/create", {
        method: "POST",
        body: { label: ctaLabel, targetUrl: ctaTargetUrl }
      });
      toast("success", "CTA URL saved!");
      setCtaLabel(""); setCtaTargetUrl("");
      const ac = new AbortController();
      loadCtaUrls(ac);
    } catch (err) {
      toast("error", err.message);
    } finally {
      setCreatingCta(false);
    }
  };

  /* Save Widget Config Action */
  const handleSaveWidget = async () => {
    setSavingWidget(true);
    try {
      await request("/api/widgets/config", {
        method: "POST",
        body: { title: widgetTitle, welcomeMessage: widgetWelcome, position: widgetPos, phoneNumber: widgetPhone }
      });
      toast("success", "Widget configuration saved!");
    } catch (err) {
      toast("error", err.message);
    } finally {
      setSavingWidget(false);
    }
  };

  /* List Computations */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = saved.filter((r) => !q || (r.title || "").toLowerCase().includes(q) || (r.phoneNumber || "").includes(q.replace(/\D/g, "") || "\u0000"));
    const t = (r) => +new Date(r.createdAt || 0);
    if (sortBy === "scans_desc") arr.sort((a, b) => (b.scansCount || 0) - (a.scansCount || 0));
    else if (sortBy === "scans_asc") arr.sort((a, b) => (a.scansCount || 0) - (b.scansCount || 0));
    else if (sortBy === "title") arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else arr.sort((a, b) => t(b) - t(a));
    return arr;
  }, [saved, search, sortBy]);

  const totalScans = useMemo(() => saved.reduce((n, r) => n + (r.scansCount || 0), 0), [saved]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <MotionConfig reducedMotion="user">
      <div className="qs-root">
        <div className="qs-wrap">
          {/* Main Top Header */}
          <header className="qs-head">
            <div>
              <h1 className="qs-title">Growth & Marketing Suite</h1>
              <p className="qs-sub">Manage WhatsApp QR codes, short links, CTA buttons, website floaters, and view live analytics.</p>
            </div>
            <div className="qs-actions">
              <button type="button" className="qs-btn" onClick={loadAllData} disabled={fetching}>
                <span className={fetching ? "qs-spin" : ""} style={{ display: "flex" }}><Icon name="refresh" size={15} /></span>Refresh
              </button>
            </div>
          </header>

          {/* Suite Tabs Bar */}
          <nav className="qs-tabs-nav" aria-label="Growth Tools Tabs">
            <button type="button" className={`qs-tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
              <Icon name="analytics" size={17} /> Analytics
            </button>
            <button type="button" className={`qs-tab-btn ${activeTab === "qr" ? "active" : ""}`} onClick={() => setActiveTab("qr")}>
              <Icon name="qr" size={17} /> QR Codes
            </button>
            <button type="button" className={`qs-tab-btn ${activeTab === "shortlinks" ? "active" : ""}`} onClick={() => setActiveTab("shortlinks")}>
              <Icon name="link" size={17} /> Short Links
            </button>
            <button type="button" className={`qs-tab-btn ${activeTab === "cta" ? "active" : ""}`} onClick={() => setActiveTab("cta")}>
              <Icon name="cta" size={17} /> CTA URLs
            </button>
            <button type="button" className={`qs-tab-btn ${activeTab === "widget" ? "active" : ""}`} onClick={() => setActiveTab("widget")}>
              <Icon name="widget" size={17} /> Floating Widget
            </button>
          </nav>

          {/* TAB 1: ANALYTICS */}
          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="qs-stat-grid">
                <div className="qs-card qs-stat-card">
                  <span className="qs-stat-ico"><Icon name="analytics" size={20} /></span>
                  <div>
                    <div className="qs-stat-val">{analyticsData.totalClicks || totalScans}</div>
                    <div className="qs-stat-lbl">Total Scans & Clicks</div>
                  </div>
                </div>
                <div className="qs-card qs-stat-card">
                  <span className="qs-stat-ico" style={{ color: "#2F46E0" }}><Icon name="qr" size={20} /></span>
                  <div>
                    <div className="qs-stat-val">{analyticsData.activeQrs || saved.length}</div>
                    <div className="qs-stat-lbl">Active QR Campaigns</div>
                  </div>
                </div>
                <div className="qs-card qs-stat-card">
                  <span className="qs-stat-ico" style={{ color: "#067647" }}><Icon name="link" size={20} /></span>
                  <div>
                    <div className="qs-stat-val">{analyticsData.activeShortLinks || shortLinks.length}</div>
                    <div className="qs-stat-lbl">Active Short Links</div>
                  </div>
                </div>
                <div className="qs-card qs-stat-card">
                  <span className="qs-stat-ico" style={{ color: "#B54708" }}><Icon name="widget" size={20} /></span>
                  <div>
                    <div className="qs-stat-val">{analyticsData.widgetLeads || 0}</div>
                    <div className="qs-stat-lbl">Widget Leads</div>
                  </div>
                </div>
              </div>

              <div className="qs-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="qs-card">
                  <h2 className="qs-h2">Device Breakdown</h2>
                  <div className="qs-field" style={{ gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontWeight: 600 }}>
                        <span><Icon name="mobile" size={14} /> Android</span><span>{analyticsData.devices?.android || 0}%</span>
                      </div>
                      <div className="qs-prog-bar"><div className="qs-prog-fill" style={{ width: `${analyticsData.devices?.android || 0}%`, background: "#12B76A" }} /></div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontWeight: 600 }}>
                        <span><Icon name="mobile" size={14} /> iOS (iPhone)</span><span>{analyticsData.devices?.ios || 0}%</span>
                      </div>
                      <div className="qs-prog-bar"><div className="qs-prog-fill" style={{ width: `${analyticsData.devices?.ios || 0}%`, background: "#2F46E0" }} /></div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontWeight: 600 }}>
                        <span><Icon name="desktop" size={14} /> Desktop</span><span>{analyticsData.devices?.desktop || 0}%</span>
                      </div>
                      <div className="qs-prog-bar"><div className="qs-prog-fill" style={{ width: `${analyticsData.devices?.desktop || 0}%`, background: "#667085" }} /></div>
                    </div>
                  </div>
                </div>

                <div className="qs-card">
                  <h2 className="qs-h2">Traffic Channels</h2>
                  <div className="qs-scroll">
                    <table className="qs-table" style={{ minWidth: "100%" }}>
                      <thead>
                        <tr><th>Source Channel</th><th>Total Clicks</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {analyticsData.topChannels && analyticsData.topChannels.length > 0 ? (
                          analyticsData.topChannels.map((ch, idx) => (
                            <tr key={idx}><td><b>{ch.name}</b></td><td>{ch.clicks}</td><td><span className="qs-pill on"><i /> Active</span></td></tr>
                          ))
                        ) : (
                          <>
                            <tr><td><b>WhatsApp QR Scans</b></td><td>{totalScans}</td><td><span className="qs-pill on"><i /> Active</span></td></tr>
                            <tr><td><b>Short Links</b></td><td>{shortLinks.reduce((acc, curr) => acc + (curr.clicks || 0), 0)}</td><td><span className="qs-pill on"><i /> Active</span></td></tr>
                            <tr><td><b>Website Widget</b></td><td>{analyticsData.widgetLeads || 0}</td><td><span className="qs-pill on"><i /> Active</span></td></tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: QR CODES (Original Fully Featured Studio) */}
          {activeTab === "qr" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="qs-grid">
                {/* QR Generator Form */}
                <div className="qs-form">
                  <section className="qs-card">
                    <h2 className="qs-h2">Campaign</h2>
                    <div className="qs-field">
                      <label htmlFor="qs-title">Title</label>
                      <input id="qs-title" className="qs-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ramadan promo, shop counter" maxLength={80} />
                      <small>Only you see this. It names the campaign in your list.</small>
                    </div>
                    <div className="qs-field">
                      <label htmlFor="qs-phone">WhatsApp number</label>
                      <input id="qs-phone" className={`qs-input${phoneError ? " err" : ""}`} value={phoneNumber} inputMode="numeric" autoComplete="tel" placeholder="923001234567"
                        aria-invalid={!!phoneError} aria-describedby="qs-phone-help"
                        onBlur={() => setTouched(true)}
                        onChange={(e) => { setPhoneNumber(e.target.value); setTrackingUrl(""); }} />
                      <small id="qs-phone-help" className={phoneError ? "err" : ""}>{phoneError || "Country code first, digits only. Example: 923001234567."}</small>
                    </div>
                    <div className="qs-field">
                      <label htmlFor="qs-msg">Message people send first</label>
                      <textarea id="qs-msg" className="qs-input" rows={3} value={defaultMessage} onChange={(e) => { setDefaultMessage(e.target.value); setTrackingUrl(""); }} placeholder="Hello, I'd like to know more about…" />
                      <small>Optional. It appears ready to send when someone scans the code.</small>
                    </div>
                  </section>

                  <section className="qs-card">
                    <h2 className="qs-h2">Appearance</h2>
                    <div className="qs-two">
                      <ColorField id="qs-fg" label="Pattern color" value={fgColor} onChange={setFgColor} />
                      <ColorField id="qs-bg" label="Background color" value={bgColor} onChange={setBgColor} />
                    </div>
                    <div className="qs-swatches" aria-label="Pattern color presets">
                      {FG_PRESETS.map((c) => (
                        <button type="button" key={c} className="qs-swatch" style={{ background: c }} aria-label={`Use ${c} for the pattern`} aria-pressed={fgColor.toLowerCase() === c.toLowerCase()} onClick={() => setFgColor(c)} />
                      ))}
                    </div>
                    {warning && <div className="qs-note qs-note--warn" role="alert"><Icon name="alert" size={16} />{warning}</div>}

                    <div className="qs-field">
                      <span className="qs-lbl">Pattern style</span>
                      <Segmented label="Pattern style" value={qrStyle} onChange={setQrStyle} options={[{ value: "squares", label: "Squares" }, { value: "dots", label: "Dots" }, { value: "fluid", label: "Fluid" }]} />
                    </div>

                    <div className="qs-field">
                      <span className="qs-lbl">Logo</span>
                      <div
                        className={`qs-drop${dragging ? " drag" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); handleLogoUpload(e.dataTransfer?.files?.[0]); }}
                      >
                        {logoUrl ? (
                          <>
                            <img src={logoUrl} alt="" className="qs-logo-thumb" />
                            <div className="qs-drop-text"><b>{logoFileName || "Logo Image"}</b><span>Shown in the centre of the code</span></div>
                            <button type="button" className="qs-btn qs-btn--sm" onClick={removeLogo}>Remove</button>
                          </>
                        ) : (
                          <>
                            <span className="qs-drop-ico"><Icon name="image" size={20} /></span>
                            <div className="qs-drop-text"><b>Drop an image here</b><span>PNG, JPEG, WebP or SVG, up to 2 MB</span></div>
                            <button type="button" className="qs-btn qs-btn--sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} />Choose file</button>
                          </>
                        )}
                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                      </div>
                    </div>
                  </section>
                </div>

                {/* QR Code Live Preview */}
                <aside className="qs-preview qs-card" aria-label="Preview">
                  <div className="qs-prev-head">
                    <h2 className="qs-h2">Preview</h2>
                    <span className={`qs-pill ${trackingUrl ? "on" : "off"}`}><i />{trackingUrl ? "Tracking on" : "Not tracked yet"}</span>
                  </div>

                  <div className="qs-stage">
                    {phoneValid ? (
                      <div className="qs-qr">
                        <QRCode
                          id="qs-qr"
                          value={qrValue}
                          size={size}
                          fgColor={fgColor}
                          bgColor={bgColor}
                          logoImage={logoUrl || undefined}
                          logoWidth={Math.round(size * 0.17)}
                          logoHeight={Math.round(size * 0.17)}
                          ecLevel={ecLevel}
                          quietZone={quietZone}
                          qrStyle={qrStyle}
                          eyeRadius={eyeRadius}
                          enableCORS
                          renderAs="svg"
                        />
                      </div>
                    ) : (
                      <div className="qs-placeholder"><Icon name="qr" size={28} /><b>Your code appears here</b><span>Enter a WhatsApp number to generate it.</span></div>
                    )}
                  </div>

                  {phoneValid && (
                    <div className="qs-linkrow">
                      <code title={qrValue}>{qrValue}</code>
                      <button type="button" className="qs-iconbtn" aria-label="Copy link" onClick={() => copyText(qrValue, "Link")}><Icon name="copy" size={16} /></button>
                    </div>
                  )}

                  <div className="qs-export">
                    <button type="button" className="qs-btn qs-btn--primary" onClick={save} disabled={saving}>{saving ? "Saving…" : activeId ? "Save as new campaign" : "Save campaign"}</button>
                    <button type="button" className="qs-btn" onClick={downloadPng} disabled={!phoneValid}><Icon name="download" size={15} />PNG</button>
                    {svgOk && <button type="button" className="qs-btn" onClick={downloadSvg} disabled={!phoneValid}><Icon name="download" size={15} />SVG</button>}
                  </div>
                </aside>
              </div>

              {/* Saved Campaigns Section */}
              <section className="qs-card qs-saved" style={{ marginTop: 20 }}>
                <div className="qs-saved-head">
                  <div>
                    <h2 className="qs-h2">Saved campaigns</h2>
                    <p className="qs-meta">{saved.length} campaign{saved.length === 1 ? "" : "s"} · {totalScans} total scan{totalScans === 1 ? "" : "s"}</p>
                  </div>
                  <div className="qs-saved-tools">
                    <div className="qs-search">
                      <Icon name="search" size={16} />
                      <input className="qs-input" type="search" placeholder="Search by title or number" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="qs-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="recent">Newest first</option>
                      <option value="scans_desc">Most scans</option>
                      <option value="scans_asc">Fewest scans</option>
                      <option value="title">Title, A to Z</option>
                    </select>
                  </div>
                </div>

                {fetching && saved.length === 0 ? (
                  <div aria-busy="true"><div className="qs-skel" /><div className="qs-skel" /></div>
                ) : filtered.length === 0 ? (
                  <div className="qs-empty"><h3>No campaigns yet</h3><p>Fill in the form above and save it to start counting scans.</p></div>
                ) : (
                  <div className="qs-scroll">
                    <table className="qs-table">
                      <thead>
                        <tr><th>Campaign</th><th>Scans</th><th>Tracking link</th><th>Created</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {rows.map((qr) => (
                          <tr key={qr._id} className={activeId === qr._id ? "sel" : ""} onClick={() => selectQr(qr)}>
                            <td><div className="qs-name">{qr.title || "Untitled"}</div><div className="qs-num">+{qr.phoneNumber}</div></td>
                            <td className="qs-scans">{qr.scansCount || 0}</td>
                            <td><code title={qr.trackingUrl}>{qr.trackingUrl || "—"}</code></td>
                            <td className="qs-time">{fmtDate(qr.createdAt)}</td>
                            <td>
                              <div className="qs-rowact">
                                <button type="button" className="qs-btn qs-btn--sm" onClick={() => selectQr(qr)}>Open</button>
                                <button type="button" className="qs-iconbtn qs-iconbtn--danger" onClick={(e) => { e.stopPropagation(); setConfirm({ id: qr._id, title: qr.title }); }}><Icon name="trash" size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* TAB 3: SHORT LINKS */}
          {activeTab === "shortlinks" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="qs-grid">
                <div className="qs-form">
                  <section className="qs-card">
                    <h2 className="qs-h2">Create Short Link</h2>
                    <div className="qs-field">
                      <label>Title</label>
                      <input className="qs-input" placeholder="e.g. Summer Promo Bio" value={shortTitle} onChange={(e) => setShortTitle(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>WhatsApp Number</label>
                      <input className="qs-input" placeholder="923001234567" value={shortPhone} onChange={(e) => setShortPhone(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>Custom Slug (Optional)</label>
                      <input className="qs-input" placeholder="summer-sale" value={shortSlugStr} onChange={(e) => setShortSlugStr(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>Prefilled Message</label>
                      <textarea className="qs-input" rows={3} placeholder="Hi, I am interested in your offer..." value={shortMsg} onChange={(e) => setShortMsg(e.target.value)} />
                    </div>
                    <button type="button" className="qs-btn qs-btn--primary" onClick={handleCreateShortLink} disabled={creatingShort}>
                      {creatingShort ? "Creating..." : "Create Short Link"}
                    </button>
                  </section>
                </div>

                <div className="qs-card">
                  <h2 className="qs-h2">Active Short Links</h2>
                  {shortLinks.length === 0 ? (
                    <div className="qs-empty"><h3>No Short Links Created</h3><p>Create your first click-to-chat short link using the form.</p></div>
                  ) : (
                    <div className="qs-scroll">
                      <table className="qs-table" style={{ minWidth: "100%" }}>
                        <thead>
                          <tr><th>Title</th><th>Short URL</th><th>Clicks</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {shortLinks.map((sl) => (
                            <tr key={sl._id || sl.id}>
                              <td><b>{sl.title}</b></td>
                              <td><code>{sl.shortUrl || `promiapi.com/s/${sl.slug}`}</code></td>
                              <td><b>{sl.clicks || 0}</b></td>
                              <td><button type="button" className="qs-iconbtn" onClick={() => copyText(sl.shortUrl || `https://promiapi.com/s/${sl.slug}`, "Short Link")}><Icon name="copy" size={15} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CTA URLS */}
          {activeTab === "cta" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="qs-grid">
                <div className="qs-form">
                  <section className="qs-card">
                    <h2 className="qs-h2">Create CTA Button URL</h2>
                    <div className="qs-field">
                      <label>Button Label</label>
                      <input className="qs-input" placeholder="e.g. Shop Now, Visit Portal" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>Target Website URL</label>
                      <input className="qs-input" placeholder="https://example.com/item" value={ctaTargetUrl} onChange={(e) => setCtaTargetUrl(e.target.value)} />
                    </div>
                    <button type="button" className="qs-btn qs-btn--primary" onClick={handleCreateCta} disabled={creatingCta}>
                      {creatingCta ? "Saving..." : "Save CTA URL"}
                    </button>
                  </section>
                </div>

                <div className="qs-card">
                  <h2 className="qs-h2">Saved CTA URLs</h2>
                  {ctaUrls.length === 0 ? (
                    <div className="qs-empty"><h3>No CTA URLs Configured</h3><p>Add campaign button links for interactive WhatsApp broadcasts.</p></div>
                  ) : (
                    <div className="qs-scroll">
                      <table className="qs-table" style={{ minWidth: "100%" }}>
                        <thead>
                          <tr><th>Label</th><th>Target URL</th><th>Clicks</th></tr>
                        </thead>
                        <tbody>
                          {ctaUrls.map((cta) => (
                            <tr key={cta._id || cta.id}>
                              <td><b>{cta.label}</b></td>
                              <td><code>{cta.targetUrl}</code></td>
                              <td><b>{cta.clicks || 0}</b></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: FLOATING WIDGET */}
          {activeTab === "widget" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="qs-grid">
                <div className="qs-form">
                  <section className="qs-card">
                    <h2 className="qs-h2">Configure Website Chat Widget</h2>
                    <div className="qs-field">
                      <label>WhatsApp Agent Number</label>
                      <input className="qs-input" placeholder="923001234567" value={widgetPhone} onChange={(e) => setWidgetPhone(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>Widget Title / Agent Name</label>
                      <input className="qs-input" placeholder="Support Team" value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>Welcome Message</label>
                      <input className="qs-input" placeholder="Hi! How can we help you?" value={widgetWelcome} onChange={(e) => setWidgetWelcome(e.target.value)} />
                    </div>
                    <div className="qs-field">
                      <label>Position</label>
                      <Segmented label="Position" value={widgetPos} onChange={setWidgetPos} options={[{ value: "right", label: "Bottom Right" }, { value: "left", label: "Bottom Left" }]} />
                    </div>
                    <button type="button" className="qs-btn qs-btn--primary" onClick={handleSaveWidget} disabled={savingWidget}>
                      {savingWidget ? "Saving..." : "Save Widget Config"}
                    </button>
                  </section>
                </div>

                <div className="qs-card">
                  <h2 className="qs-h2">Embed Script Code</h2>
                  <p className="qs-sub" style={{ marginBottom: 12 }}>Paste this script tag before the closing <code>&lt;/body&gt;</code> tag on your website.</p>
                  <pre style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8, overflowX: "auto", fontSize: 12, border: "1px solid var(--line)" }}>
{`<script src="${API_BASE_URL}/widget.js" 
  data-phone="${widgetPhone}"
  data-title="${widgetTitle}" 
  data-msg="${widgetWelcome}" 
  data-pos="${widgetPos}">
</script>`}
                  </pre>
                  <button type="button" className="qs-btn qs-btn--primary" style={{ marginTop: 12 }} onClick={() => copyText(`<script src="${API_BASE_URL}/widget.js" data-phone="${widgetPhone}" data-title="${widgetTitle}" data-msg="${widgetWelcome}" data-pos="${widgetPos}"></script>`, "Embed Code")}>
                    <Icon name="copy" size={15} /> Copy Embed Code
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Modal Confirm Delete */}
        <AnimatePresence>
          {confirm && (
            <motion.div className="qs-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="qs-modal" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}>
                <h2>Delete Campaign?</h2>
                <p>Are you sure you want to delete "{confirm.title}"?</p>
                <div className="qs-modal-foot">
                  <button type="button" className="qs-btn" onClick={() => setConfirm(null)}>Cancel</button>
                  <button type="button" className="qs-btn qs-btn--danger" onClick={confirmDelete}>{deleting ? "Deleting…" : "Delete"}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toasts Render */}
        <div className="qs-toasts">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div key={t.id} className={`qs-toast qs-toast--${t.type}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
                <Icon name={t.type === "error" ? "alert" : "check"} size={16} />{t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

/* ───────────── CSS STYLES ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.qs-root{--bg:#F2F4F7;--surface:#fff;--surface-2:#F8F9FB;--line:#E4E7EC;--line-2:#D0D5DD;--ink:#101828;--ink-2:#475467;--ink-3:#667085;--accent:#2F46E0;--accent-soft:#EBEEFF;--ok:#067647;--ok-bg:#E7F6EC;--ok-dot:#12B76A;--warn:#B54708;--warn-bg:#FEF3E2;--warn-dot:#F79009;--bad:#B42318;--bad-bg:#FEECEA;
font-family:"Manrope",system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;color:var(--ink);background:var(--bg);min-height:100vh;padding:clamp(16px,3vw,40px);box-sizing:border-box}
.qs-root *,.qs-root *::before,.qs-root *::after{box-sizing:border-box}
.qs-wrap{max-width:1240px;margin:0 auto}
.qs-head{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;margin-bottom:16px}
.qs-title{font-size:clamp(22px,3.4vw,28px);font-weight:800;letter-spacing:-.02em;margin:0}
.qs-sub{margin:4px 0 0;color:var(--ink-3);max-width:62ch}

.qs-tabs-nav{display:flex;gap:6px;background:var(--surface);padding:6px;border-radius:12px;border:1px solid var(--line);margin-bottom:20px;overflow-x:auto}
.qs-tab-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:8px;border:0;background:transparent;font-weight:600;font-size:13.5px;color:var(--ink-3);cursor:pointer;white-space:nowrap;transition:all .15s}
.qs-tab-btn:hover{color:var(--ink);background:var(--surface-2)}
.qs-tab-btn.active{background:var(--accent-soft);color:var(--accent);font-weight:700}

.qs-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:20px}
.qs-stat-card{display:flex;align-items:center;gap:16px;padding:18px 20px}
.qs-stat-ico{width:44px;height:44px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;border:1px solid var(--line)}
.qs-stat-val{font-size:24px;font-weight:800;line-height:1.1}
.qs-stat-lbl{font-size:12.5px;color:var(--ink-3);font-weight:600;margin-top:2px}

.qs-prog-bar{height:8px;width:100%;background:var(--surface-2);border-radius:999px;overflow:hidden;border:1px solid var(--line)}
.qs-prog-fill{height:100%;border-radius:999px;transition:width .3s}

.qs-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;padding:0 14px;border-radius:9px;border:1px solid var(--line-2);background:var(--surface);font-weight:600;font-size:13.5px;cursor:pointer}
.qs-btn--primary{background:#2F46E0;border-color:#2F46E0;color:#ffffff !important}
.qs-btn--danger{background:var(--bad);border-color:var(--bad);color:#fff}
.qs-btn--sm{height:30px;padding:0 10px;font-size:12.5px}
.qs-iconbtn{width:32px;height:32px;display:inline-grid;place-items:center;border-radius:8px;border:0;background:transparent;color:var(--ink-3);cursor:pointer}
.qs-iconbtn:hover{background:var(--surface-2);color:var(--ink)}

.qs-grid{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:20px;align-items:start}
.qs-form{display:grid;gap:16px}
.qs-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.qs-h2{font-size:15px;font-weight:700;margin:0 0 14px}
.qs-field{display:grid;gap:6px;margin-bottom:16px}
.qs-field label,.qs-lbl{font-size:13px;font-weight:600;color:var(--ink)}
.qs-input{width:100%;min-height:40px;padding:9px 12px;border:1px solid var(--line-2);border-radius:9px;background:var(--surface);font:inherit;color:var(--ink)}
.qs-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.qs-color{display:flex;gap:8px}
.qs-color input[type=color]{width:40px;height:40px;padding:3px;border:1px solid var(--line-2);border-radius:9px;cursor:pointer}
.qs-swatches{display:flex;gap:8px;margin:-4px 0 16px}
.qs-swatch{width:24px;height:24px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--line-2);cursor:pointer}
.qs-seg{display:inline-flex;padding:3px;gap:2px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px}
.qs-seg button{border:0;background:transparent;height:30px;padding:0 14px;border-radius:7px;font-weight:600;font-size:13px;cursor:pointer}
.qs-seg button[aria-checked=true]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(16,24,40,.12)}
.qs-drop{display:flex;align-items:center;gap:12px;padding:14px;border:1.5px dashed var(--line-2);border-radius:12px;background:var(--surface-2)}
.qs-drop-ico{width:40px;height:40px;border-radius:10px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;color:var(--ink-3)}
.qs-drop-text{flex:1;display:grid}.qs-drop-text b{font-size:13.5px}.qs-drop-text span{font-size:12.5px;color:var(--ink-3)}
.qs-logo-thumb{width:40px;height:40px;object-fit:contain;border-radius:10px;background:#fff;border:1px solid var(--line)}

.qs-preview{position:sticky;top:20px;display:grid;gap:14px}
.qs-prev-head{display:flex;justify-content:space-between;align-items:center}
.qs-pill{display:inline-flex;align-items:center;gap:7px;padding:3px 10px;border-radius:999px;font-size:12.5px;font-weight:600}
.qs-pill i{width:6px;height:6px;border-radius:50%}
.qs-pill.on{background:var(--ok-bg);color:var(--ok)}.qs-pill.on i{background:var(--ok-dot)}
.qs-pill.off{background:var(--warn-bg);color:var(--warn)}.qs-pill.off i{background:var(--warn-dot)}
.qs-stage{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:20px;display:grid;place-items:center;min-height:260px}
.qs-qr{width:100%;max-width:280px;line-height:0;border-radius:6px;overflow:hidden;box-shadow:0 8px 24px -8px rgba(16,24,40,.25)}
.qs-qr canvas,.qs-qr svg{width:100%!important;height:auto!important;aspect-ratio:1;display:block}
.qs-linkrow{display:flex;align-items:center;gap:2px;border:1px solid var(--line);border-radius:10px;padding:4px 4px 4px 12px}
.qs-linkrow code{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px}
.qs-export{display:flex;gap:8px;flex-wrap:wrap}

.qs-saved-head{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:flex-end;margin-bottom:16px}
.qs-saved-tools{display:flex;gap:8px}
.qs-search{position:relative;min-width:230px}
.qs-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink-3)}
.qs-search .qs-input{padding-left:38px;height:38px;min-height:0}
.qs-scroll{overflow-x:auto}
.qs-table{width:100%;border-collapse:collapse;min-width:700px}
.qs-table th{padding:11px 16px;text-align:left;font-size:12.5px;font-weight:600;color:var(--ink-3);background:var(--surface-2);border-bottom:1px solid var(--line)}
.qs-table td{padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.qs-table tbody tr:hover{background:var(--surface-2)}
.qs-table tbody tr.sel{background:var(--accent-soft)}

.qs-overlay{position:fixed;inset:0;background:rgba(16,24,40,.45);backdrop-filter:blur(4px);z-index:9999;display:grid;place-items:center;padding:16px}
.qs-modal{width:100%;max-width:420px;background:var(--surface);border-radius:16px;padding:24px}
.qs-modal-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}
.qs-toasts{position:fixed;right:20px;bottom:20px;display:grid;gap:8px;z-index:10000}
.qs-toast{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:11px;background:var(--ink);color:#fff;font-weight:600;font-size:13.5px}
.qs-toast--error{background:var(--bad)}

.qs-empty{padding:32px 16px;text-align:center;color:var(--ink-3)}
.qs-empty h3{margin:0 0 4px;font-size:15px;color:var(--ink)}

@media(max-width:980px){.qs-grid{grid-template-columns:1fr}.qs-preview{position:static;order:-1}}
`;

if (typeof document !== "undefined") {
  let tag = document.getElementById("qs-styles");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "qs-styles";
    document.head.appendChild(tag);
  }
  tag.textContent = CSS;
}