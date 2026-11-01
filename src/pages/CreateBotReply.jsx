import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

// Move to an env variable (VITE_API_URL / REACT_APP_API_URL) for production builds.
const API_BASE_URL = "http://api.promiapi.com";

const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ------------------------------------------------------------------ */
/* Limits (mirror botReplyRoutes.js)                                  */
/* ------------------------------------------------------------------ */
const MB = 1024 * 1024;
const LIMITS = { keyword: 100, body: 4096, interactiveBody: 1024, footer: 60, buttonText: 20, buttons: 3 };
const MEDIA_RULES = [
  { kind: "image", label: "Image", max: 5 * MB, mimes: ["image/jpeg", "image/png", "image/webp"] },
  { kind: "video", label: "Video", max: 16 * MB, mimes: ["video/mp4", "video/3gpp"] },
  { kind: "audio", label: "Audio", max: 16 * MB, mimes: ["audio/mpeg", "audio/ogg", "audio/aac", "audio/mp4", "audio/amr"] },
  {
    kind: "file", label: "Document", max: 100 * MB,
    mimes: [
      "application/pdf", "text/plain", "application/msword", "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
];
const ACCEPT = MEDIA_RULES.flatMap((r) => r.mimes).join(",");
const ruleForMime = (mime) => MEDIA_RULES.find((r) => r.mimes.includes(mime));

const ruleLimitForPlan = (plan) => {
  const p = (plan || "").toString().toLowerCase();
  if (p.includes("standard")) return 20;
  if (p.includes("premium")) return 100;
  if (p.includes("ultimate")) return Infinity;
  return 5;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const normalize = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
const localMatch = (keyword, matchType, text) => {
  const k = normalize(keyword);
  const t = normalize(text);
  if (!k || !t) return null;
  if (matchType === "contains") return t.includes(k);
  if (matchType === "startsWith") return t.startsWith(k);
  return t === k;
};

const formatBytes = (n) => (n >= MB ? `${(n / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const mediaKindFromUrl = (url) => {
  if (!url) return null;
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "3gp", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "ogg", "aac", "m4a", "amr", "wav"].includes(ext)) return "audio";
  return "file";
};

/** Renders WhatsApp-style *bold*, _italic_ and ~strike~ for the preview. */
const renderWhatsApp = (text) =>
  String(text || "")
    .split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g)
    .map((part, i) => {
      if (/^\*[^*\n]+\*$/.test(part)) return <b key={i}>{part.slice(1, -1)}</b>;
      if (/^_[^_\n]+_$/.test(part)) return <i key={i}>{part.slice(1, -1)}</i>;
      if (/^~[^~\n]+~$/.test(part)) return <s key={i}>{part.slice(1, -1)}</s>;
      return part;
    });

const TYPES = [
  { value: "simple", title: "Text", hint: "A plain written reply", icon: "chat" },
  { value: "media", title: "Media", hint: "Image, video, audio or file", icon: "image" },
  { value: "interactive", title: "Interactive", hint: "Message with buttons", icon: "bolt" },
  { value: "template", title: "Template", hint: "Approved WhatsApp template", icon: "layout" },
];
const MATCHES = [
  { value: "exact", title: "Exact", hint: "The whole message is the keyword", example: "price" },
  { value: "startsWith", title: "Starts with", hint: "The message begins with it", example: "price list please" },
  { value: "contains", title: "Contains", hint: "The keyword appears anywhere", example: "what's the price?" },
];

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */
const ICON_PATHS = {
  plus: ["M12 5v14M5 12h14"],
  trash: ["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  close: ["M18 6L6 18M6 6l12 12"],
  back: ["M19 12H5", "M12 19l-7-7 7-7"],
  chat: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  image: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M21 15l-5-5L5 21", "M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"],
  video: ["M23 7l-7 5 7 5V7z", "M3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"],
  audio: ["M9 18V5l12-2v13", "M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
  phone: ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"],
  check: ["M20 6L9 17l-5-5"],
  bolt: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
  layout: ["M3 3h18v18H3z", "M3 9h18", "M9 21V9"],
  warn: ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
};

function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {(ICON_PATHS[name] || []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small components                                                   */
/* ------------------------------------------------------------------ */
function Field({ id, label, hint, error, count, max, children }) {
  return (
    <div className="cr-field">
      <div className="cr-field-top">
        <label htmlFor={id}>{label}</label>
        {max ? <span className={`cr-count${count > max ? " is-over" : ""}`}>{count}/{max}</span> : null}
      </div>
      {children}
      {error ? <p className="cr-error" id={`${id}-error`}><Icon name="warn" size={14} /> {error}</p> : hint ? <p className="cr-hint" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  );
}

function Choice({ name, value, current, onChange, title, hint, icon }) {
  return (
    <label className={`cr-choice${current === value ? " is-on" : ""}`}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} />
      {icon && <span className="cr-choice-icon"><Icon name={icon} size={18} /></span>}
      <span className="cr-choice-text"><strong>{title}</strong><small>{hint}</small></span>
    </label>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="cr-switch" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

function UpgradeModal({ quota, onClose, onUpgrade }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="cr-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cr-modal" role="dialog" aria-modal="true" aria-label="Reply limit reached" tabIndex={-1} ref={ref}>
        <h3>You've reached your reply limit</h3>
        <p>
          The {quota.plan} plan includes {Number.isFinite(quota.limit) ? quota.limit : "unlimited"} keyword replies, and you're using {quota.used}.
          Upgrade to add more, or delete a reply you no longer need.
        </p>
        <div className="cr-modal-actions">
          <button type="button" className="cr-btn" onClick={onClose}>Not now</button>
          <button type="button" className="cr-btn cr-btn--primary" onClick={onUpgrade}>See plans</button>
        </div>
      </div>
    </div>
  );
}

/* Live WhatsApp-style preview */
function PhonePreview({ keyword, botType, text, footer, mediaUrl, mediaKind, fileName, template, buttons }) {
  const showFooter = botType === "interactive" || buttons.length > 0;
  return (
    <div className="cr-phone" aria-label="Preview of the conversation">
      <div className="cr-msg cr-msg--in">{keyword.trim() || "Customer's keyword"}</div>

      <div className="cr-msg cr-msg--out">
        {botType === "template" ? (
          <p className="cr-msg-template"><Icon name="layout" size={14} /> {template ? <>Template <b>{template}</b></> : "Choose a template"}</p>
        ) : (
          <>
            {botType === "media" && mediaUrl && mediaKind === "image" && <img src={mediaUrl} alt="" className="cr-msg-media" />}
            {botType === "media" && mediaUrl && mediaKind === "video" && <video src={mediaUrl} className="cr-msg-media" controls preload="metadata" />}
            {botType === "media" && mediaUrl && mediaKind === "audio" && <audio src={mediaUrl} controls preload="none" className="cr-msg-audio" />}
            {botType === "media" && mediaUrl && mediaKind === "file" && <span className="cr-msg-file"><Icon name="file" size={16} /> {fileName || "Attachment"}</span>}
            {botType === "media" && !mediaUrl && <span className="cr-msg-placeholder"><Icon name="image" size={20} /> Media appears here</span>}
            {text.trim() ? <p className="cr-msg-text">{renderWhatsApp(text)}</p> : botType !== "media" ? <p className="cr-msg-ghost">Your reply appears here</p> : null}
            {showFooter && footer.trim() && <p className="cr-msg-footer">{footer}</p>}
          </>
        )}
      </div>

      {botType !== "template" && buttons.some((b) => b.text.trim()) && (
        <div className="cr-msg-buttons">
          {buttons.filter((b) => b.text.trim()).map((b) => (
            <span key={b.id} className="cr-msg-btn">
              {b.type === "url" && <Icon name="link" size={14} />}
              {b.type === "phone" && <Icon name="phone" size={14} />}
              {b.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function CreateBotReply() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const ruleId = params.get("id");
  const typeFromUrl = TYPES.some((t) => t.value === params.get("type")) ? params.get("type") : "simple";
  const isEditing = Boolean(ruleId);

  // form state
  const [botType, setBotType] = useState(typeFromUrl);
  const [keyword, setKeyword] = useState("");
  const [matchType, setMatchType] = useState("exact");
  const [level, setLevel] = useState("ANY");
  const [replyText, setReplyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [buttons, setButtons] = useState([]);
  const [buttonMode, setButtonMode] = useState("quick"); // "quick" | "action"

  // media
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [existingMedia, setExistingMedia] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // templates
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [templateId, setTemplateId] = useState("");

  // ui state
  const [loadingRule, setLoadingRule] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { kind: "error" | "ok", text }
  const [quota, setQuota] = useState({ plan: "Free", used: 0, limit: 5 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [testText, setTestText] = useState("");

  const textRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------------- load quota ---------------- */
  useEffect(() => {
    (async () => {
      const [quotaRes, meRes, listRes] = await Promise.allSettled([
        api.get("/api/bot-replies/quota"),
        api.get("/api/auth/me"),
        api.get("/api/bot-replies"),
      ]);
      if (quotaRes.status === "fulfilled" && quotaRes.value.data?.success) {
        const q = quotaRes.value.data;
        setQuota({ plan: q.plan, used: q.used, limit: q.limit === null ? Infinity : q.limit });
        return;
      }
      let plan = "Free";
      let raw = "price_free";
      if (meRes.status === "fulfilled" && meRes.value.data) {
        const u = meRes.value.data.user || meRes.value.data;
        const sub = u?.subscription || {};
        raw = sub.planId || sub.planName || u.planId || u.plan || "price_free";
        plan = sub.planName || raw;
      }
      const d = listRes.status === "fulfilled" ? listRes.value.data : null;
      const used = (d?.rules || d?.data || (Array.isArray(d) ? d : [])).length;
      setQuota({ plan, used, limit: ruleLimitForPlan(raw) });
    })();
  }, []);

  /* ---------------- load rule when editing ---------------- */
  const applyRule = useCallback((rule) => {
    setBotType(rule.botType || "simple");
    setKeyword(rule.keyword || "");
    setMatchType(rule.matchType || "exact");
    setLevel(rule.level || "ANY");
    setReplyText(rule.replyText || "");
    setFooterText(rule.footerText || "");
    setIsActive(rule.isActive ?? true);
    setTemplateId(rule.templateId || "");
    setExistingMedia(rule.mediaUrl || "");
    const mapped = (rule.buttons || []).map((b) => ({
      id: b.id || newId(),
      type: b.type === "reply" || !b.type ? "quick_reply" : b.type,
      text: b.text || "",
      url: b.url || "",
      phone: b.phone || "",
    }));
    setButtons(mapped);
    setButtonMode(mapped.some((b) => b.type !== "quick_reply") ? "action" : "quick");
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const fromState = location.state?.editRule;
    if (fromState && fromState._id === ruleId) {
      applyRule(fromState);
      setLoadingRule(false);
      return;
    }
    api.get(`/api/bot-replies/${ruleId}`)
      .then((res) => res.data?.data && applyRule(res.data.data))
      .catch(() => setBanner({ kind: "error", text: "Couldn't load this reply. Go back and try again." }))
      .finally(() => setLoadingRule(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId]);

  /* ---------------- templates ---------------- */
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError("");
    try {
      const res = await api.get("/api/templates");
      const list = res.data?.templates || res.data?.data || [];
      setTemplates(list);
      setTemplateId((current) => current || list[0]?.templateId || "");
    } catch (err) {
      setTemplatesError(err?.response?.data?.message || "Couldn't load your templates.");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (botType === "template" && templates.length === 0 && !templatesLoading) loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botType]);

  /* ---------------- media preview URL ---------------- */
  useEffect(() => {
    if (!file) { setFilePreview(""); return undefined; }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* ---------------- derived ---------------- */
  const bodyMax = botType === "interactive" ? LIMITS.interactiveBody : LIMITS.body;
  const showFooterField = botType === "interactive" || (botType !== "template" && buttons.length > 0);
  const quotaFull = !isEditing && quota.used >= quota.limit;
  const keywordMatches = testText.trim() ? localMatch(keyword, matchType, testText) : null;

  const currentMediaUrl = file ? filePreview : existingMedia;
  const currentMediaKind = file ? (ruleForMime(file.type)?.kind || "file") : mediaKindFromUrl(existingMedia);
  const currentMediaName = file ? file.name : existingMedia ? decodeURIComponent(existingMedia.split("/").pop() || "") : "";

  const selectedTemplate = templates.find((t) => t.templateId === templateId);

  /* ---------------- handlers ---------------- */
  const clearError = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const changeType = (type) => {
    setBotType(type);
    setErrors({});
    if (type === "interactive" && buttons.length === 0) {
      setButtonMode("quick");
      setButtons([{ id: newId(), type: "quick_reply", text: "", url: "", phone: "" }]);
    }
  };

  const wrapSelection = (mark) => {
    const el = textRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || "text";
    setReplyText(value.slice(0, s) + mark + selected + mark + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + mark.length, s + mark.length + selected.length);
    });
  };

  const pickFile = (f) => {
    if (!f) return;
    const rule = ruleForMime(f.type);
    if (!rule) {
      setErrors((e) => ({ ...e, media: "This file type isn't supported. Use JPG, PNG, WEBP, MP4, 3GP, MP3, OGG, AAC, AMR, PDF or an Office file." }));
      return;
    }
    if (f.size > rule.max) {
      setErrors((e) => ({ ...e, media: `${rule.label} files can be up to ${Math.round(rule.max / MB)} MB. This one is ${formatBytes(f.size)}.` }));
      return;
    }
    clearError("media");
    setFile(f);
  };

  const removeMedia = () => {
    setFile(null);
    setExistingMedia("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addButton = () => {
    if (buttons.length >= LIMITS.buttons) return;
    const type = buttonMode === "quick" ? "quick_reply" : "url";
    setButtons((prev) => [...prev, { id: newId(), type, text: "", url: "", phone: "" }]);
  };
  const updateButton = (id, patch) => setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeButton = (id) => setButtons((prev) => prev.filter((b) => b.id !== id));
  const switchButtonMode = (mode) => {
    if (mode === buttonMode) return;
    setButtonMode(mode);
    setButtons([]);
    setErrors((e) => ({ ...e, buttons: undefined }));
  };

  const validate = () => {
    const e = {};
    const kw = keyword.trim();
    if (!kw) e.keyword = "Enter the word or phrase that starts this reply.";
    else if (kw.length > LIMITS.keyword) e.keyword = `Keep the keyword under ${LIMITS.keyword} characters.`;

    if (botType === "template") {
      if (!templateId) e.template = "Choose an approved template.";
    } else {
      if (botType !== "media" && !replyText.trim()) e.replyText = "Write the message the bot should send.";
      if (replyText.length > bodyMax) e.replyText = `This reply is over the ${bodyMax}-character limit.`;
      if (botType === "media" && !file && !existingMedia) e.media = "Add the file you want to send.";
      if (showFooterField && footerText.length > LIMITS.footer) e.footer = `Footer can be up to ${LIMITS.footer} characters.`;

      const filled = buttons.filter((b) => b.text.trim());
      if (botType === "interactive" && filled.length === 0) e.buttons = "Add at least one button.";
      for (const b of filled) {
        if (b.type === "url") {
          try {
            const u = new URL(b.url.trim());
            if (!["http:", "https:"].includes(u.protocol)) throw new Error();
          } catch (err) { e.buttons = `"${b.text}" needs a full link starting with https://`; break; }
        } else if (b.type === "phone" && !/^\+?\d{7,15}$/.test(b.phone.replace(/[\s()-]/g, ""))) {
          e.buttons = `"${b.text}" needs a phone number with country code, like +923001234567.`;
          break;
        }
      }
      if (!e.buttons && buttons.some((b) => !b.text.trim()) && buttons.length > 0 && botType === "interactive" && filled.length !== buttons.length) {
        e.buttons = "Every button needs a label. Remove the empty ones.";
      }
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setBanner(null);

    if (quotaFull) return setShowUpgrade(true);

    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setBanner({ kind: "error", text: "Fix the highlighted fields and save again." });
      return;
    }

    const form = new FormData();
    form.append("botType", botType);
    form.append("keyword", keyword.trim());
    form.append("matchType", matchType);
    form.append("level", level.trim() || "ANY");
    form.append("isActive", String(isActive));

    if (botType === "template") {
      form.append("templateId", templateId);
    } else {
      form.append("replyText", replyText.trim());
      form.append("footerText", showFooterField ? footerText.trim() : "");
      form.append(
        "buttons",
        JSON.stringify(
          buttons.filter((b) => b.text.trim()).map((b) => ({
            id: b.id, type: b.type, text: b.text.trim(),
            ...(b.type === "url" ? { url: b.url.trim() } : {}),
            ...(b.type === "phone" ? { phone: b.phone.trim() } : {}),
          }))
        )
      );
      if (botType === "media") {
        if (file) form.append("mediaFile", file);
        else if (!existingMedia) form.append("removeMedia", "true");
      } else if (isEditing) {
        form.append("removeMedia", "true");
      }
    }

    setSaving(true);
    try {
      const res = isEditing ? await api.put(`/api/bot-replies/${ruleId}`, form) : await api.post("/api/bot-replies", form);
      if (res.data?.success) {
        setBanner({ kind: "ok", text: isEditing ? "Changes saved." : "Reply created." });
        setTimeout(() => navigate("/dashboard/bot-replies"), 700);
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.quotaExceeded || (err?.response?.status === 403 && !isEditing)) {
        setShowUpgrade(true);
      } else if (err?.response?.status === 409) {
        setErrors({ keyword: "You already have a reply for this keyword. Edit that one or choose another keyword." });
        setBanner({ kind: "error", text: data?.message || "This keyword is already in use." });
      } else {
        setBanner({ kind: "error", text: data?.message || "Couldn't save. Check your connection and try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- render ---------------- */
  return (
    <div className="cr-root">
      <style>{CSS}</style>

      {showUpgrade && <UpgradeModal quota={quota} onClose={() => setShowUpgrade(false)} onUpgrade={() => navigate("/dashboard/subscription")} />}

      <header className="cr-head">
        <button type="button" className="cr-back" onClick={() => navigate("/dashboard/bot-replies")}>
          <Icon name="back" /> All replies
        </button>
        <div className="cr-head-main">
          <div>
            <h1>{isEditing ? "Edit auto-reply" : "New auto-reply"}</h1>
            <p>Choose what customers send, and what the bot answers.</p>
          </div>
          {!isEditing && (
            <div className={`cr-quota${quotaFull ? " is-full" : ""}`}>
              {quota.used} of {Number.isFinite(quota.limit) ? quota.limit : "unlimited"} replies used
              {quotaFull && <button type="button" onClick={() => navigate("/dashboard/subscription")}>Upgrade</button>}
            </div>
          )}
        </div>
      </header>

      {banner && (
        <div className={`cr-banner cr-banner--${banner.kind}`} role={banner.kind === "error" ? "alert" : "status"}>
          <Icon name={banner.kind === "error" ? "warn" : "check"} /> {banner.text}
        </div>
      )}

      {loadingRule ? (
        <div className="cr-loading" aria-busy="true"><span className="cr-skel" style={{ width: "40%" }} /><span className="cr-skel" style={{ width: "80%" }} /><span className="cr-skel" style={{ width: "65%" }} /></div>
      ) : (
        <form className="cr-layout" onSubmit={handleSubmit} noValidate>
          <div className="cr-form">
            {/* ---- Reply type ---- */}
            <fieldset className="cr-section">
              <legend>Reply type</legend>
              <div className="cr-choices cr-choices--4">
                {TYPES.map((t) => <Choice key={t.value} name="botType" current={botType} onChange={changeType} {...t} />)}
              </div>
            </fieldset>

            {/* ---- Trigger ---- */}
            <fieldset className="cr-section">
              <legend>When a customer sends</legend>
              <Field id="cr-keyword" label="Keyword or phrase" count={keyword.length} max={LIMITS.keyword} error={errors.keyword} hint="Capital letters and extra spaces are ignored.">
                <input id="cr-keyword" type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); clearError("keyword"); }} placeholder="price list" aria-invalid={Boolean(errors.keyword)} aria-describedby={errors.keyword ? "cr-keyword-error" : "cr-keyword-hint"} />
              </Field>

              <div className="cr-subhead">Match the message when</div>
              <div className="cr-choices cr-choices--3">
                {MATCHES.map((m) => <Choice key={m.value} name="matchType" current={matchType} onChange={setMatchType} value={m.value} title={m.title} hint={m.hint} />)}
              </div>

              <div className="cr-tester">
                <label htmlFor="cr-test">Try a customer message</label>
                <div className="cr-tester-row">
                  <input id="cr-test" type="text" value={testText} onChange={(e) => setTestText(e.target.value)} placeholder={MATCHES.find((m) => m.value === matchType).example} />
                  {keywordMatches !== null && (
                    <span className={`cr-tester-result${keywordMatches ? " is-yes" : ""}`} role="status">
                      <Icon name={keywordMatches ? "check" : "close"} size={14} /> {keywordMatches ? "Triggers this reply" : "Doesn't trigger"}
                    </span>
                  )}
                </div>
              </div>

              <Field id="cr-level" label="Conversation level" hint="Leave as ANY to reply at every level of the conversation.">
                <input id="cr-level" type="text" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="ANY" />
              </Field>
            </fieldset>

            {/* ---- Reply content ---- */}
            <fieldset className="cr-section">
              <legend>Then reply with</legend>

              {botType === "template" && (
                <Field id="cr-template" label="Approved template" error={errors.template} hint="Only templates approved by WhatsApp can be sent.">
                  <div className="cr-inline">
                    <select id="cr-template" value={templateId} onChange={(e) => { setTemplateId(e.target.value); clearError("template"); }} disabled={templatesLoading} aria-invalid={Boolean(errors.template)}>
                      {templatesLoading && <option value="">Loading templates…</option>}
                      {!templatesLoading && templates.length === 0 && <option value="">No approved templates yet</option>}
                      {!templatesLoading && templateId && !selectedTemplate && <option value={templateId}>{templateId} (not in your list)</option>}
                      {templates.map((t) => <option key={t.id || t.templateId} value={t.templateId}>{t.name}</option>)}
                    </select>
                    <button type="button" className="cr-btn" onClick={loadTemplates} disabled={templatesLoading} aria-label="Reload templates" title="Reload templates"><Icon name="refresh" /></button>
                  </div>
                  {templatesError && <p className="cr-error"><Icon name="warn" size={14} /> {templatesError}</p>}
                </Field>
              )}

              {botType === "media" && (
                <div className="cr-field">
                  <div className="cr-field-top"><label htmlFor="cr-file">Media file</label></div>
                  {currentMediaUrl ? (
                    <div className="cr-file">
                      <span className="cr-file-icon"><Icon name={currentMediaKind === "file" ? "file" : currentMediaKind || "file"} size={20} /></span>
                      <div className="cr-file-meta">
                        <strong>{currentMediaName || "Current file"}</strong>
                        <small>{file ? `${formatBytes(file.size)} · will upload when you save` : "Currently attached"}</small>
                      </div>
                      <button type="button" className="cr-btn" onClick={() => fileInputRef.current?.click()}>Replace</button>
                      <button type="button" className="cr-iconbtn" onClick={removeMedia} aria-label="Remove file"><Icon name="trash" /></button>
                    </div>
                  ) : (
                    <div
                      className={`cr-drop${dragOver ? " is-over" : ""}${errors.media ? " has-error" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
                    >
                      <Icon name="upload" size={22} />
                      <p><button type="button" onClick={() => fileInputRef.current?.click()}>Choose a file</button> or drop it here</p>
                      <small>Image up to 5 MB · Video and audio up to 16 MB · Documents up to 100 MB</small>
                    </div>
                  )}
                  <input id="cr-file" ref={fileInputRef} type="file" accept={ACCEPT} hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
                  {errors.media && <p className="cr-error"><Icon name="warn" size={14} /> {errors.media}</p>}
                </div>
              )}

              {botType !== "template" && (
                <Field
                  id="cr-body"
                  label={botType === "media" ? "Caption (optional)" : "Message"}
                  count={replyText.length}
                  max={bodyMax}
                  error={errors.replyText}
                >
                  <div className="cr-editor">
                    <div className="cr-toolbar" role="toolbar" aria-label="Text formatting">
                      <button type="button" onClick={() => wrapSelection("*")} aria-label="Bold" title="Bold"><b>B</b></button>
                      <button type="button" onClick={() => wrapSelection("_")} aria-label="Italic" title="Italic"><i>I</i></button>
                      <button type="button" onClick={() => wrapSelection("~")} aria-label="Strikethrough" title="Strikethrough"><s>S</s></button>
                    </div>
                    <textarea
                      id="cr-body"
                      ref={textRef}
                      value={replyText}
                      rows={botType === "media" ? 3 : 6}
                      onChange={(e) => { setReplyText(e.target.value); clearError("replyText"); }}
                      placeholder={botType === "media" ? "Add a short caption" : "Hi! Here's our price list…"}
                      aria-invalid={Boolean(errors.replyText)}
                    />
                  </div>
                </Field>
              )}

              {showFooterField && (
                <Field id="cr-footer" label="Footer (optional)" count={footerText.length} max={LIMITS.footer} error={errors.footer} hint="Small grey text shown under the message.">
                  <input id="cr-footer" type="text" value={footerText} onChange={(e) => { setFooterText(e.target.value); clearError("footer"); }} placeholder="Reply STOP to opt out" />
                </Field>
              )}
            </fieldset>

            {/* ---- Buttons ---- */}
            {botType !== "template" && (
              <fieldset className="cr-section">
                <legend>Buttons{botType === "interactive" ? "" : " (optional)"}</legend>

                <div className="cr-seg" role="radiogroup" aria-label="Button type">
                  <button type="button" role="radio" aria-checked={buttonMode === "quick"} className={buttonMode === "quick" ? "is-on" : ""} onClick={() => switchButtonMode("quick")}>Quick replies</button>
                  <button type="button" role="radio" aria-checked={buttonMode === "action"} className={buttonMode === "action" ? "is-on" : ""} onClick={() => switchButtonMode("action")}>Link or call</button>
                </div>
                <p className="cr-hint">
                  {buttonMode === "quick" ? "Customers tap a button to send its label back to the bot." : "Open a website or start a phone call. These can't be mixed with quick replies."}
                  {" "}Up to {LIMITS.buttons} buttons.
                </p>

                {buttons.map((b, i) => (
                  <div className="cr-button" key={b.id}>
                    <div className="cr-button-row">
                      {buttonMode === "action" && (
                        <select value={b.type} onChange={(e) => updateButton(b.id, { type: e.target.value })} aria-label={`Button ${i + 1} type`}>
                          <option value="url">Open link</option>
                          <option value="phone">Call phone</option>
                        </select>
                      )}
                      <input type="text" value={b.text} maxLength={LIMITS.buttonText} onChange={(e) => { updateButton(b.id, { text: e.target.value }); clearError("buttons"); }} placeholder={buttonMode === "quick" ? "Talk to an agent" : "Visit website"} aria-label={`Button ${i + 1} label`} />
                      <span className="cr-count">{b.text.length}/{LIMITS.buttonText}</span>
                      <button type="button" className="cr-iconbtn" onClick={() => removeButton(b.id)} aria-label={`Remove button ${i + 1}`}><Icon name="trash" /></button>
                    </div>
                    {b.type === "url" && <input type="url" value={b.url} onChange={(e) => { updateButton(b.id, { url: e.target.value }); clearError("buttons"); }} placeholder="https://example.com/pricing" aria-label={`Button ${i + 1} link`} />}
                    {b.type === "phone" && <input type="tel" value={b.phone} onChange={(e) => { updateButton(b.id, { phone: e.target.value }); clearError("buttons"); }} placeholder="+923001234567" aria-label={`Button ${i + 1} phone number`} />}
                  </div>
                ))}

                {errors.buttons && <p className="cr-error"><Icon name="warn" size={14} /> {errors.buttons}</p>}

                {buttons.length < LIMITS.buttons && (
                  <button type="button" className="cr-btn cr-btn--dashed" onClick={addButton}><Icon name="plus" /> Add button</button>
                )}
              </fieldset>
            )}

            {/* ---- Status ---- */}
            <fieldset className="cr-section">
              <legend>Status</legend>
              <div className="cr-status">
                <div>
                  <strong>{isActive ? "Active" : "Paused"}</strong>
                  <small>{isActive ? "The bot replies as soon as you save." : "Saved, but the bot won't use it until you activate it."}</small>
                </div>
                <Switch checked={isActive} onChange={setIsActive} label="Reply is active" />
              </div>
            </fieldset>

            <div className="cr-savebar">
              <button type="button" className="cr-btn" onClick={() => navigate("/dashboard/bot-replies")} disabled={saving}>Cancel</button>
              <button type="submit" className="cr-btn cr-btn--primary" disabled={saving}>
                {saving ? "Saving…" : isEditing ? "Save changes" : "Create reply"}
              </button>
            </div>
          </div>

          {/* ---- Preview + tips ---- */}
          <aside className="cr-side">
            <h2>Preview</h2>
            <PhonePreview
              keyword={keyword}
              botType={botType}
              text={replyText}
              footer={footerText}
              mediaUrl={currentMediaUrl}
              mediaKind={currentMediaKind}
              fileName={currentMediaName}
              template={selectedTemplate?.name || templateId}
              buttons={buttons}
            />
            <details className="cr-tips">
              <summary>How replies are chosen</summary>
              <ul>
                <li>If several replies match, an exact match wins over starts with, and starts with wins over contains.</li>
                <li>Interactive messages can be up to {LIMITS.interactiveBody} characters, with up to {LIMITS.buttons} buttons.</li>
                <li>Wrap words in * for bold, _ for italic, or ~ for strikethrough.</li>
                <li>Only one flow can be active at a time, but keyword replies can all run together.</li>
              </ul>
            </details>
          </aside>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles (same tokens as the replies list; override the variables    */
/* or set data-theme="dark" on a parent to retheme)                   */
/* ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');

.cr-root{
  --bg:#f3f6f4; --surface:#ffffff; --ink:#14201e; --ink-2:#47585a; --ink-3:#6f7f7c;
  --line:#e1e8e5; --line-strong:#cbd6d2;
  --brand:#0d7a5f; --brand-hover:#0a6650; --brand-ink:#ffffff; --brand-soft:#e0f3ec;
  --bubble-in:#ffffff; --bubble-out:#d6f0df; --canvas:#e8eee9;
  --warn:#9a5a00; --warn-soft:#fdf0d9; --danger:#c0352b; --danger-soft:#fbe8e6;
  font-family:'Figtree',system-ui,-apple-system,'Segoe UI',sans-serif;
  color:var(--ink); background:var(--bg); min-height:100vh; box-sizing:border-box;
  padding:28px clamp(16px,4vw,44px) 40px; font-size:14px; line-height:1.45;
}
[data-theme="dark"] .cr-root{
  --bg:#0f1715; --surface:#17211f; --ink:#e8f0ed; --ink-2:#a9bab6; --ink-3:#7f908c;
  --line:#243230; --line-strong:#34463f; --brand:#2fb68f; --brand-hover:#46c9a2; --brand-ink:#06251c; --brand-soft:#173a30;
  --bubble-in:#1f2c29; --bubble-out:#14463a; --canvas:#0b1210; --warn:#e8b35c; --warn-soft:#3a2c10; --danger:#ef6a5f; --danger-soft:#3a1b18;
}
.cr-root *,.cr-root *::before,.cr-root *::after{box-sizing:border-box}
.cr-root button,.cr-root input,.cr-root select,.cr-root textarea{font:inherit;color:inherit}
.cr-root :focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.cr-root h1,.cr-root h2,.cr-root h3{margin:0;font-family:'Bricolage Grotesque','Figtree',system-ui,sans-serif;letter-spacing:-0.01em}
.cr-root p{margin:0}

/* header */
.cr-back{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:4px 0;margin-bottom:10px;color:var(--ink-2);font-weight:600;cursor:pointer}
.cr-back:hover{color:var(--ink)}
.cr-head{margin-bottom:22px}
.cr-head-main{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
.cr-head h1{font-size:clamp(24px,3vw,32px);font-weight:700;line-height:1.1}
.cr-head p{color:var(--ink-2);margin-top:6px}
.cr-quota{display:flex;align-items:center;gap:12px;font-weight:600;color:var(--ink-2);background:var(--surface);border:1px solid var(--line);border-radius:99px;padding:6px 14px}
.cr-quota.is-full{background:var(--warn-soft);border-color:transparent;color:var(--warn)}
.cr-quota button{background:none;border:0;color:inherit;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}

.cr-banner{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:18px;font-weight:500}
.cr-banner--error{background:var(--danger-soft);color:var(--danger)}
.cr-banner--ok{background:var(--brand-soft);color:var(--brand)}

/* layout */
.cr-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:32px;align-items:start}
.cr-form{background:var(--surface);border:1px solid var(--line);border-radius:14px;min-width:0}
.cr-section{border:0;border-bottom:1px solid var(--line);margin:0;padding:22px 24px;min-width:0}
.cr-section legend{float:left;width:100%;padding:0;margin-bottom:14px;font-family:'Bricolage Grotesque','Figtree',sans-serif;font-weight:700;font-size:17px}
.cr-section legend + *{clear:both}
.cr-subhead{font-weight:600;margin:18px 0 8px}

/* fields */
.cr-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.cr-field:last-child{margin-bottom:0}
.cr-field-top{display:flex;justify-content:space-between;align-items:baseline}
.cr-field-top label,.cr-tester label{font-weight:600}
.cr-count{font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.cr-count.is-over{color:var(--danger);font-weight:700}
.cr-root input[type="text"],.cr-root input[type="url"],.cr-root input[type="tel"],.cr-root select,.cr-root textarea{
  width:100%;padding:10px 12px;border:1px solid var(--line-strong);border-radius:9px;background:var(--bg);outline:0}
.cr-root input:focus,.cr-root select:focus,.cr-root textarea:focus{border-color:var(--brand);background:var(--surface);box-shadow:0 0 0 3px var(--brand-soft)}
.cr-root input[aria-invalid="true"],.cr-root textarea[aria-invalid="true"],.cr-root select[aria-invalid="true"]{border-color:var(--danger)}
.cr-root textarea{resize:vertical;min-height:84px;line-height:1.5}
.cr-hint{font-size:12.5px;color:var(--ink-3)}
.cr-error{display:flex;align-items:flex-start;gap:6px;font-size:13px;color:var(--danger);font-weight:500;margin-top:2px}
.cr-error svg{flex-shrink:0;margin-top:2px}
.cr-inline{display:flex;gap:8px}

/* choices */
.cr-choices{display:grid;gap:10px}
.cr-choices--4{grid-template-columns:repeat(4,minmax(0,1fr))}
.cr-choices--3{grid-template-columns:repeat(3,minmax(0,1fr))}
.cr-choice{position:relative;display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--line-strong);border-radius:10px;cursor:pointer;background:var(--surface)}
.cr-choice input{position:absolute;opacity:0;pointer-events:none}
.cr-choice:focus-within{outline:2px solid var(--brand);outline-offset:2px}
.cr-choice.is-on{border-color:var(--brand);background:var(--brand-soft);box-shadow:inset 0 0 0 1px var(--brand)}
.cr-choice-icon{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:var(--bg);color:var(--ink-2);flex-shrink:0}
.cr-choice.is-on .cr-choice-icon{background:var(--brand);color:var(--brand-ink)}
.cr-choice-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.cr-choice-text strong{font-weight:600}
.cr-choice-text small{font-size:12.5px;color:var(--ink-2);line-height:1.35}

/* tester */
.cr-tester{margin:16px 0}
.cr-tester-row{display:flex;align-items:center;gap:12px;margin-top:6px;flex-wrap:wrap}
.cr-tester-row input{flex:1 1 220px}
.cr-tester-result{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--ink-2)}
.cr-tester-result.is-yes{color:var(--brand)}

/* editor */
.cr-editor{border:1px solid var(--line-strong);border-radius:9px;background:var(--bg);overflow:hidden}
.cr-editor:focus-within{border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-soft);background:var(--surface)}
.cr-toolbar{display:flex;gap:2px;padding:4px;border-bottom:1px solid var(--line)}
.cr-toolbar button{width:30px;height:28px;border:0;background:transparent;border-radius:6px;cursor:pointer}
.cr-toolbar button:hover{background:var(--line)}
.cr-root .cr-editor textarea{border:0;border-radius:0;background:transparent;box-shadow:none}

/* media */
.cr-drop{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:26px 16px;border:1.5px dashed var(--line-strong);border-radius:12px;background:var(--bg);color:var(--ink-2)}
.cr-drop.is-over{border-color:var(--brand);background:var(--brand-soft)}
.cr-drop.has-error{border-color:var(--danger)}
.cr-drop p button{background:none;border:0;padding:0;color:var(--brand);font-weight:700;cursor:pointer;text-decoration:underline}
.cr-drop small{color:var(--ink-3)}
.cr-file{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line-strong);border-radius:10px;background:var(--bg)}
.cr-file-icon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:8px;background:var(--brand-soft);color:var(--brand);flex-shrink:0}
.cr-file-meta{display:flex;flex-direction:column;min-width:0;flex:1}
.cr-file-meta strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-file-meta small{color:var(--ink-3)}

/* buttons */
.cr-seg{display:inline-flex;padding:3px;border-radius:10px;background:var(--line);margin-bottom:8px}
.cr-seg button{border:0;background:transparent;padding:6px 14px;border-radius:8px;font-weight:600;color:var(--ink-2);cursor:pointer}
.cr-seg button.is-on{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.cr-button{display:flex;flex-direction:column;gap:8px;margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
.cr-button-row{display:flex;align-items:center;gap:8px}
.cr-button-row select{width:auto;flex-shrink:0}
.cr-button-row .cr-count{flex-shrink:0}

.cr-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:9px 16px;border-radius:9px;border:1px solid var(--line-strong);background:var(--surface);font-weight:600;cursor:pointer;white-space:nowrap}
.cr-btn:hover:not(:disabled){background:var(--bg)}
.cr-btn:disabled{opacity:.55;cursor:not-allowed}
.cr-btn--primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.cr-btn--primary:hover:not(:disabled){background:var(--brand-hover)}
.cr-btn--dashed{margin-top:12px;border-style:dashed;color:var(--brand)}
.cr-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex-shrink:0;border-radius:8px;border:0;background:transparent;color:var(--ink-2);cursor:pointer}
.cr-iconbtn:hover{background:var(--danger-soft);color:var(--danger)}

/* status + save bar */
.cr-status{display:flex;justify-content:space-between;align-items:center;gap:16px}
.cr-status div{display:flex;flex-direction:column}
.cr-status small{color:var(--ink-2)}
.cr-switch{position:relative;flex-shrink:0;width:40px;height:22px;border-radius:99px;border:0;background:var(--line-strong);cursor:pointer;padding:0}
.cr-switch span{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}
.cr-switch[aria-checked="true"]{background:var(--brand)}
.cr-switch[aria-checked="true"] span{transform:translateX(18px)}
.cr-savebar{position:sticky;bottom:0;z-index:5;display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;background:var(--surface);border-top:1px solid var(--line);border-radius:0 0 14px 14px}

/* side */
.cr-side{position:sticky;top:20px;display:flex;flex-direction:column;gap:12px}
.cr-side h2{font-size:17px}
.cr-phone{display:flex;flex-direction:column;gap:6px;padding:18px 16px;border-radius:16px;background:var(--canvas);min-height:220px}
.cr-msg{max-width:88%;padding:8px 10px;overflow-wrap:anywhere}
.cr-msg--in{align-self:flex-start;background:var(--bubble-in);border-radius:10px 10px 10px 2px}
.cr-msg--out{align-self:flex-end;background:var(--bubble-out);border-radius:10px 10px 2px 10px;display:flex;flex-direction:column;gap:6px;min-width:140px}
.cr-msg-media{width:100%;max-height:220px;object-fit:cover;border-radius:6px;display:block}
.cr-msg-audio{width:100%;max-width:240px}
.cr-msg-file,.cr-msg-placeholder{display:flex;align-items:center;gap:8px;padding:10px;border-radius:6px;background:rgba(0,0,0,.06);font-weight:600;overflow-wrap:anywhere}
.cr-msg-placeholder{color:var(--ink-3);font-weight:500;justify-content:center;min-height:90px}
.cr-msg-text{white-space:pre-wrap}
.cr-msg-ghost{color:var(--ink-3)}
.cr-msg-footer{font-size:12px;color:var(--ink-3)}
.cr-msg-template{display:flex;align-items:center;gap:6px}
.cr-msg-buttons{align-self:flex-end;width:88%;display:flex;flex-direction:column;gap:4px}
.cr-msg-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border-radius:8px;background:var(--bubble-in);color:var(--brand);font-weight:600;overflow-wrap:anywhere}
.cr-tips{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.cr-tips summary{cursor:pointer;font-weight:600}
.cr-tips ul{margin:10px 0 2px;padding-left:18px;color:var(--ink-2);display:flex;flex-direction:column;gap:6px}

/* modal + loading */
.cr-overlay{position:fixed;inset:0;z-index:80;background:rgba(10,20,18,.5);display:flex;align-items:center;justify-content:center;padding:16px}
.cr-modal{width:min(440px,100%);background:var(--surface);border-radius:14px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.3);outline:0}
.cr-modal h3{font-size:18px;margin-bottom:8px}
.cr-modal p{color:var(--ink-2);margin-bottom:20px}
.cr-modal-actions{display:flex;justify-content:flex-end;gap:10px}
.cr-loading{display:flex;flex-direction:column;gap:12px;padding:24px;background:var(--surface);border:1px solid var(--line);border-radius:14px}
.cr-skel{display:block;height:14px;border-radius:6px;background:linear-gradient(90deg,var(--line) 25%,var(--bg) 50%,var(--line) 75%);background-size:200% 100%;animation:cr-shimmer 1.3s infinite linear}
@keyframes cr-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

@media (max-width:980px){
  .cr-layout{grid-template-columns:minmax(0,1fr)}
  .cr-side{position:static;order:-1}
  .cr-phone{min-height:0}
}
@media (max-width:640px){
  .cr-choices--4,.cr-choices--3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cr-choices--3{grid-template-columns:1fr}
  .cr-section{padding:18px 16px}
  .cr-savebar{padding:12px 16px}
  .cr-savebar .cr-btn{flex:1}
  .cr-button-row{flex-wrap:wrap}
  .cr-button-row input{flex:1 1 140px;width:auto}
}
@media (prefers-reduced-motion:reduce){
  .cr-skel{animation:none}
  .cr-switch span{transition:none}
}
`;
