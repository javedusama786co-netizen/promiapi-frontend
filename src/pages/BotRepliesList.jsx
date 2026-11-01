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

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

/* ------------------------------------------------------------------ */
/* Plan limits (fallback only: the API's /quota endpoint wins)        */
/* ------------------------------------------------------------------ */
const flowLimitForPlan = (plan) => {
  const p = (plan || "").toString().toLowerCase();
  if (p.includes("standard")) return 5;
  if (p.includes("premium")) return 10;
  if (p.includes("ultimate")) return Infinity;
  return 1;
};
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
const TYPE_LABEL = { simple: "Text", media: "Media", interactive: "Interactive", template: "Template" };
const MATCH_LABEL = { exact: "Exact", contains: "Contains", startsWith: "Starts with" };

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

const rtf = typeof Intl !== "undefined" && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }) : null;
const timeAgo = (d) => {
  if (!d) return "Never";
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf ? rtf.format(Math.round(diff / secs), unit) : formatDate(d);
  }
  return "Just now";
};

const mediaKind = (url) => {
  if (!url) return null;
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "3gp", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "ogg", "aac", "m4a", "amr", "wav"].includes(ext)) return "audio";
  return "file";
};

const flowName = (f) => f.name || f.flowName || "Untitled flow";
const flowKeyword = (flow) => {
  if (flow.triggerKeyword) return flow.triggerKeyword;
  const node = Array.isArray(flow.nodes) && flow.nodes.find((n) => n.type === "triggerNode" || n.type === "startNode");
  return node?.data?.keyword || node?.data?.triggerKeyword || node?.data?.label || "—";
};

const replySummary = (rule) => {
  if (rule.botType === "template") return `Template ${rule.templateId || ""}`.trim();
  if (rule.replyText) return rule.replyText;
  if (rule.mediaUrl) return "Media file only";
  return "No reply text";
};

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */
const ICON_PATHS = {
  plus: ["M12 5v14M5 12h14"],
  edit: ["M12 20h9", "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"],
  copy: ["M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
  trash: ["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  search: ["M21 21l-4.35-4.35", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"],
  close: ["M18 6L6 18M6 6l12 12"],
  flow: ["M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"],
  chat: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  warn: ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  image: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M21 15l-5-5L5 21", "M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"],
  video: ["M23 7l-7 5 7 5V7z", "M3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"],
  audio: ["M9 18V5l12-2v13", "M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
  phone: ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"],
  check: ["M20 6L9 17l-5-5"],
  bolt: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
  layout: ["M3 3h18v18H3z", "M3 9h18", "M9 21V9"],
};

function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {(ICON_PATHS[name] || []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const typeIcon = (rule) => {
  if (rule.botType === "media") return mediaKind(rule.mediaUrl) === "file" ? "file" : mediaKind(rule.mediaUrl) || "image";
  if (rule.botType === "interactive") return "bolt";
  if (rule.botType === "template") return "layout";
  return "chat";
};

/* ------------------------------------------------------------------ */
/* Small components                                                   */
/* ------------------------------------------------------------------ */
function Switch({ checked, onChange, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="br-switch" onClick={onChange}>
      <span />
    </button>
  );
}

function Meter({ label, used, limit }) {
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 8 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const full = !unlimited && used >= limit;
  return (
    <div className="br-meter">
      <div className="br-meter-top">
        <span>{label}</span>
        <strong>{used} of {unlimited ? "unlimited" : limit}</strong>
      </div>
      <div className="br-meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={unlimited ? undefined : limit} aria-valuenow={used}>
        <span className={full ? "is-full" : ""} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, actions, wide }) {
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
    <div className="br-overlay br-overlay--center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`br-modal${wide ? " br-modal--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <h3>{title}</h3>
        <div className="br-modal-body">{children}</div>
        <div className="br-modal-actions">{actions}</div>
      </div>
    </div>
  );
}

/* WhatsApp-style preview of one rule */
function ChatPreview({ rule }) {
  const kind = mediaKind(rule.mediaUrl);
  const buttons = rule.buttons || [];
  return (
    <div className="br-phone">
      <div className="br-msg br-msg--in">{rule.keyword}</div>
      <div className="br-msg br-msg--out">
        {rule.botType === "template" ? (
          <p className="br-msg-template"><Icon name="layout" size={14} /> Template <b>{rule.templateId || "—"}</b></p>
        ) : (
          <>
            {kind === "image" && <img src={rule.mediaUrl} alt="" className="br-msg-media" onError={(e) => (e.currentTarget.style.display = "none")} />}
            {kind === "video" && <video src={rule.mediaUrl} className="br-msg-media" controls preload="metadata" />}
            {kind === "audio" && <audio src={rule.mediaUrl} controls preload="none" className="br-msg-audio" />}
            {kind === "file" && (
              <a href={rule.mediaUrl} target="_blank" rel="noreferrer" className="br-msg-file"><Icon name="file" size={16} /> Open attachment</a>
            )}
            {rule.replyText && <p className="br-msg-text">{rule.replyText}</p>}
            {rule.footerText && <p className="br-msg-footer">{rule.footerText}</p>}
          </>
        )}
      </div>
      {buttons.length > 0 && (
        <div className="br-msg-buttons">
          {buttons.map((b, i) => (
            <span key={b.id || i} className="br-msg-btn">
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
/* Rows                                                               */
/* ------------------------------------------------------------------ */
function RuleRow({ rule, selected, highlighted, busy, onSelect, onOpen, onToggle, onEdit, onDuplicate, onDelete }) {
  const active = rule.isActive ?? true;
  const buttonCount = rule.buttons?.length || 0;
  return (
    <li id={`rule-${rule._id}`} className={`br-row${highlighted ? " is-hit" : ""}${active ? "" : " is-paused"}`}>
      <input type="checkbox" className="br-check" checked={selected} onChange={() => onSelect(rule._id)} aria-label={`Select ${rule.keyword}`} />

      <button type="button" className="br-convo" onClick={() => onOpen(rule._id)} aria-label={`Open details for ${rule.keyword}`}>
        <span className="br-bubble br-bubble--in">
          <span className="br-kw">{rule.keyword}</span>
          <span className="br-chip">{MATCH_LABEL[rule.matchType || "exact"] || rule.matchType}</span>
          {rule.level && rule.level !== "ANY" && <span className="br-chip">Level {rule.level}</span>}
        </span>
        <span className="br-bubble br-bubble--out">
          <span className="br-reply">{replySummary(rule)}</span>
          <span className="br-tags">
            <span className="br-tag"><Icon name={typeIcon(rule)} size={13} />{TYPE_LABEL[rule.botType] || "Text"}</span>
            {buttonCount > 0 && <span className="br-tag">{buttonCount} {buttonCount === 1 ? "button" : "buttons"}</span>}
            {(rule.hitCount || 0) > 0 && <span className="br-tag">Sent {rule.hitCount}×</span>}
          </span>
        </span>
      </button>

      <div className="br-side">
        <label className="br-switch-label">
          <Switch checked={active} disabled={busy} onChange={() => onToggle(rule)} label={`${active ? "Pause" : "Activate"} ${rule.keyword}`} />
          <span>{busy ? "Saving" : active ? "Active" : "Paused"}</span>
        </label>
        <button type="button" className="br-iconbtn" onClick={() => onEdit(rule)} aria-label={`Edit ${rule.keyword}`} title="Edit"><Icon name="edit" /></button>
        <button type="button" className="br-iconbtn" onClick={() => onDuplicate(rule)} aria-label={`Duplicate ${rule.keyword}`} title="Duplicate"><Icon name="copy" /></button>
        <button type="button" className="br-iconbtn br-iconbtn--danger" onClick={() => onDelete(rule)} aria-label={`Delete ${rule.keyword}`} title="Delete"><Icon name="trash" /></button>
      </div>
    </li>
  );
}

function FlowRow({ flow, busy, onToggle, onEdit, onDelete }) {
  return (
    <li className={`br-row br-row--flow${flow.isActive ? "" : " is-paused"}`}>
      <span className="br-flow-icon"><Icon name="flow" size={18} /></span>
      <div className="br-flow-main">
        <strong>{flowName(flow)}</strong>
        <span className="br-flow-meta">Starts with <span className="br-chip">{flowKeyword(flow)}</span> · Created {formatDate(flow.createdAt)}</span>
      </div>
      <div className="br-side">
        <label className="br-switch-label">
          <Switch checked={!!flow.isActive} disabled={busy} onChange={() => onToggle(flow)} label={`${flow.isActive ? "Pause" : "Activate"} ${flowName(flow)}`} />
          <span>{busy ? "Saving" : flow.isActive ? "Active" : "Paused"}</span>
        </label>
        <button type="button" className="br-iconbtn" onClick={() => onEdit(flow)} aria-label={`Edit ${flowName(flow)}`} title="Edit"><Icon name="edit" /></button>
        <button type="button" className="br-iconbtn br-iconbtn--danger" onClick={() => onDelete(flow)} aria-label={`Delete ${flowName(flow)}`} title="Delete"><Icon name="trash" /></button>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function BotRepliesList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get("tab") === "flows" ? "flows" : "rules");
  const [rules, setRules] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const [selected, setSelected] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [drawerId, setDrawerId] = useState(null);

  const [quota, setQuota] = useState({ plan: "Free", maxRules: 5, maxFlows: 1 });
  const [confirm, setConfirm] = useState(null); // { kind: "rule" | "flow" | "bulk", ids, name }
  const [deleting, setDeleting] = useState(false);
  const [conflict, setConflict] = useState(null); // { flowId, activeName }

  const [testText, setTestText] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((text, kind = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  /* ---------------- data ---------------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [rulesRes, flowsRes, userRes, quotaRes] = await Promise.allSettled([
      api.get("/api/bot-replies"),
      api.get("/api/bot-flows/list"),
      api.get("/api/auth/me"),
      api.get("/api/bot-replies/quota"),
    ]);

    if (rulesRes.status === "fulfilled") {
      const d = rulesRes.value.data;
      setRules(d?.rules || d?.data || (Array.isArray(d) ? d : []));
    } else {
      setLoadError(errorMessage(rulesRes.reason, "Couldn't load your replies."));
    }

    if (flowsRes.status === "fulfilled") {
      const d = flowsRes.value.data;
      setFlows(d?.flows || d?.data || (Array.isArray(d) ? d : []));
    }

    let plan = "Free";
    let rawPlan = "price_free";
    if (userRes.status === "fulfilled" && userRes.value.data) {
      const u = userRes.value.data.user || userRes.value.data;
      const sub = u?.subscription || {};
      rawPlan = sub.planId || sub.planName || u.planId || u.plan || "price_free";
      plan = sub.planName || rawPlan;
    }
    const apiQuota = quotaRes.status === "fulfilled" ? quotaRes.value.data : null;
    setQuota({
      plan: apiQuota?.plan || plan,
      maxFlows: flowLimitForPlan(rawPlan),
      maxRules: apiQuota ? (apiQuota.limit === null ? Infinity : apiQuota.limit) : ruleLimitForPlan(rawPlan),
    });

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ids = new Set(rules.map((r) => r._id));
    setSelected((prev) => new Set([...prev].filter((id) => ids.has(id))));
  }, [rules]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`rule-${highlightId}`);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [highlightId, rules]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("all");
    navigate({ pathname: location.pathname, search: `?tab=${tab}` }, { replace: true });
  };

  /* ---------------- derived ---------------- */
  const ruleLimitReached = rules.length >= quota.maxRules;
  const flowLimitReached = flows.length >= quota.maxFlows;
  const drawerRule = rules.find((r) => r._id === drawerId) || null;

  const typeCounts = useMemo(() => {
    const c = { all: rules.length, simple: 0, media: 0, interactive: 0, template: 0 };
    rules.forEach((r) => { if (c[r.botType] !== undefined) c[r.botType] += 1; });
    return c;
  }, [rules]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rules.filter((r) => {
      const active = r.isActive ?? true;
      if (typeFilter !== "all" && r.botType !== typeFilter) return false;
      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "paused" && active) return false;
      if (!q) return true;
      return (r.keyword || "").toLowerCase().includes(q) || (r.replyText || "").toLowerCase().includes(q);
    });
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      used: (a, b) => (b.hitCount || 0) - (a.hitCount || 0),
      name: (a, b) => (a.keyword || "").localeCompare(b.keyword || ""),
    };
    return [...list].sort(sorters[sort]);
  }, [rules, search, typeFilter, statusFilter, sort]);

  const filteredFlows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flows.filter((f) => {
      if (statusFilter === "active" && !f.isActive) return false;
      if (statusFilter === "paused" && f.isActive) return false;
      return !q || flowName(f).toLowerCase().includes(q) || String(flowKeyword(f)).toLowerCase().includes(q);
    });
  }, [flows, search, statusFilter]);

  const allSelected = filteredRules.length > 0 && filteredRules.every((r) => selected.has(r._id));

  /* ---------------- actions: rules ---------------- */
  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(filteredRules.map((r) => r._id)));

  const toggleRule = async (rule) => {
    const next = !(rule.isActive ?? true);
    setBusyId(rule._id);
    try {
      await api.patch(`/api/bot-replies/${rule._id}/toggle`, { isActive: next });
      setRules((prev) => prev.map((r) => (r._id === rule._id ? { ...r, isActive: next } : r)));
    } catch (err) {
      toast(errorMessage(err, `Couldn't ${next ? "activate" : "pause"} "${rule.keyword}".`), "error");
    } finally {
      setBusyId(null);
    }
  };

  const editRule = (rule) => navigate(`/dashboard/bot-replies/new?id=${rule._id}`, { state: { editRule: rule } });

  const duplicateRule = async (rule) => {
    if (ruleLimitReached) return toast("You've reached your plan's limit. Upgrade to add more replies.", "error");
    try {
      await api.post(`/api/bot-replies/${rule._id}/duplicate`);
      toast(`Duplicated "${rule.keyword}". The copy is paused.`);
      fetchData();
    } catch (err) {
      toast(errorMessage(err, "Couldn't duplicate this reply."), "error");
    }
  };

  const runBulk = async (action) => {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "delete") {
      setConfirm({ kind: "bulk", ids, name: `${ids.length} ${ids.length === 1 ? "reply" : "replies"}` });
      return;
    }
    setBulkBusy(true);
    try {
      await api.post("/api/bot-replies/bulk", { ids, action });
      const next = action === "enable";
      setRules((prev) => prev.map((r) => (selected.has(r._id) ? { ...r, isActive: next } : r)));
      toast(`${ids.length} ${ids.length === 1 ? "reply" : "replies"} ${next ? "activated" : "paused"}.`);
      setSelected(new Set());
    } catch (err) {
      toast(errorMessage(err, "Couldn't update the selected replies."), "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const runTest = async (e) => {
    e.preventDefault();
    const text = testText.trim();
    if (!text) return;
    setTesting(true);
    try {
      const { data } = await api.post("/api/bot-replies/test", { text });
      setTestResult({ text, rule: data.rule || null });
      if (data.rule) {
        setActiveTab("rules");
        setSearch("");
        setTypeFilter("all");
        setStatusFilter("all");
        setHighlightId(data.rule._id);
      } else {
        setHighlightId(null);
      }
    } catch (err) {
      toast(errorMessage(err, "Couldn't run the test."), "error");
    } finally {
      setTesting(false);
    }
  };

  /* ---------------- actions: flows ---------------- */
  const requestToggleFlow = (flow) => {
    const next = !flow.isActive;
    if (next) {
      const other = flows.find((f) => f.isActive && f._id !== flow._id);
      if (other) return setConflict({ flowId: flow._id, activeName: flowName(other) });
    }
    executeToggleFlow(flow._id, next);
  };

  const executeToggleFlow = async (flowId, next) => {
    setBusyId(flowId);
    try {
      await api.put(`/api/bot-flows/${flowId}/toggle`, { isActive: next });
      setFlows((prev) => prev.map((f) => (f._id === flowId ? { ...f, isActive: next } : next ? { ...f, isActive: false } : f)));
    } catch (err) {
      toast(errorMessage(err, "Couldn't update the flow."), "error");
    } finally {
      setBusyId(null);
      setConflict(null);
    }
  };

  /* ---------------- delete ---------------- */
  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.kind === "flow") {
        await api.delete(`/api/bot-flows/${confirm.ids[0]}`);
        setFlows((prev) => prev.filter((f) => f._id !== confirm.ids[0]));
      } else if (confirm.kind === "bulk") {
        await api.post("/api/bot-replies/bulk", { ids: confirm.ids, action: "delete" });
        setRules((prev) => prev.filter((r) => !confirm.ids.includes(r._id)));
        setSelected(new Set());
      } else {
        await api.delete(`/api/bot-replies/${confirm.ids[0]}`);
        setRules((prev) => prev.filter((r) => r._id !== confirm.ids[0]));
        if (drawerId === confirm.ids[0]) setDrawerId(null);
      }
      toast(`Deleted ${confirm.name}.`);
      setConfirm(null);
    } catch (err) {
      toast(errorMessage(err, "Couldn't delete. Check your connection and try again."), "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- render ---------------- */
  const list = activeTab === "rules" ? filteredRules : filteredFlows;
  const totalForTab = activeTab === "rules" ? rules.length : flows.length;

  return (
    <div className="br-root">
      <style>{CSS}</style>

      <header className="br-head">
        <div>
          <h1>Auto-replies</h1>
          <p>Answer common WhatsApp messages automatically, using keywords or step-by-step flows.</p>
        </div>
        <div className="br-head-actions">
          <button type="button" className="br-btn" aria-disabled={flowLimitReached} onClick={() => (flowLimitReached ? toast("You've reached your plan's flow limit. Upgrade to add more.", "error") : navigate("/dashboard/bot-builder"))}>
            <Icon name="flow" /> New flow
          </button>
          <button type="button" className="br-btn br-btn--primary" aria-disabled={ruleLimitReached} onClick={() => (ruleLimitReached ? toast("You've reached your plan's reply limit. Upgrade to add more.", "error") : navigate("/dashboard/bot-replies/new?type=simple"))}>
            <Icon name="plus" /> New reply
          </button>
        </div>
      </header>

      <section className="br-quota" aria-label="Plan usage">
        <Meter label="Keyword replies" used={rules.length} limit={quota.maxRules} />
        <Meter label="Flows" used={flows.length} limit={quota.maxFlows} />
        {(ruleLimitReached || flowLimitReached) && (
          <p className="br-quota-note"><Icon name="warn" size={15} /> Limit reached on the {quota.plan} plan. <a href="/dashboard/subscription">Upgrade your plan</a> to add more.</p>
        )}
      </section>

      {activeTab === "rules" && (
        <form className="br-test" onSubmit={runTest}>
          <label htmlFor="br-test-input"><Icon name="bolt" size={15} /> Test a message</label>
          <div className="br-test-row">
            <input id="br-test-input" type="text" value={testText} onChange={(e) => { setTestText(e.target.value); setTestResult(null); }} placeholder='Type what a customer might send, e.g. "price list"' />
            <button type="submit" className="br-btn" disabled={testing || !testText.trim()}>{testing ? "Testing" : "Test"}</button>
          </div>
          {testResult && (
            <p className={`br-test-result${testResult.rule ? " is-match" : ""}`} role="status">
              {testResult.rule ? (
                <><Icon name="check" size={15} /> "{testResult.text}" triggers <b>{testResult.rule.keyword}</b> ({(MATCH_LABEL[testResult.rule.matchType || "exact"] || "").toLowerCase()} match). It's highlighted below.</>
              ) : (
                <><Icon name="warn" size={15} /> No active reply matches "{testResult.text}". Add a rule or adjust the match type.</>
              )}
            </p>
          )}
        </form>
      )}

      <div className="br-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === "rules"} className={activeTab === "rules" ? "is-on" : ""} onClick={() => switchTab("rules")}>
          Keyword replies <span>{rules.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "flows"} className={activeTab === "flows" ? "is-on" : ""} onClick={() => switchTab("flows")}>
          Flows <span>{flows.length}</span>
        </button>
      </div>

      <div className="br-toolbar">
        <div className="br-search">
          <Icon name="search" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={activeTab === "rules" ? "Search keywords or reply text" : "Search flows"} aria-label="Search" />
        </div>
        <div className="br-chips" role="group" aria-label="Status">
          {["all", "active", "paused"].map((s) => (
            <button key={s} type="button" className={statusFilter === s ? "is-on" : ""} aria-pressed={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s === "active" ? "Active" : "Paused"}
            </button>
          ))}
        </div>
        {activeTab === "rules" && (
          <select className="br-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort replies">
            <option value="newest">Newest first</option>
            <option value="used">Most used</option>
            <option value="name">Keyword A to Z</option>
          </select>
        )}
      </div>

      {activeTab === "rules" && (
        <div className="br-chips br-chips--types" role="group" aria-label="Reply type">
          {["all", "simple", "media", "interactive", "template"].map((t) => (
            <button key={t} type="button" className={typeFilter === t ? "is-on" : ""} aria-pressed={typeFilter === t} onClick={() => setTypeFilter(t)}>
              {t === "all" ? "All types" : TYPE_LABEL[t]} <span>{typeCounts[t]}</span>
            </button>
          ))}
        </div>
      )}

      {loadError && (
        <div className="br-alert" role="alert">
          <Icon name="warn" /> <span>{loadError}</span>
          <button type="button" className="br-btn" onClick={fetchData}>Try again</button>
        </div>
      )}

      {loading ? (
        <ul className="br-list" aria-busy="true" aria-label="Loading">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="br-row br-row--skel"><span className="br-skel" style={{ width: "30%" }} /><span className="br-skel" style={{ width: "60%" }} /></li>
          ))}
        </ul>
      ) : list.length === 0 ? (
        <div className="br-empty">
          <Icon name={activeTab === "rules" ? "chat" : "flow"} size={28} />
          {totalForTab === 0 ? (
            <>
              <h2>{activeTab === "rules" ? "No keyword replies yet" : "No flows yet"}</h2>
              <p>{activeTab === "rules" ? "Create a reply so the bot can answer when a customer sends a keyword." : "Design a flow to guide customers through several steps."}</p>
              <button type="button" className="br-btn br-btn--primary" onClick={() => (activeTab === "rules" ? navigate("/dashboard/bot-replies/new?type=simple") : navigate("/dashboard/bot-builder"))}>
                <Icon name="plus" /> {activeTab === "rules" ? "Create your first reply" : "Design your first flow"}
              </button>
            </>
          ) : (
            <>
              <h2>Nothing matches these filters</h2>
              <p>Try a different search or clear the filters.</p>
              <button type="button" className="br-btn" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}>Clear filters</button>
            </>
          )}
        </div>
      ) : (
        <>
          {activeTab === "rules" && (
            <label className="br-selectall">
              <input type="checkbox" className="br-check" checked={allSelected} onChange={toggleSelectAll} />
              <span>{selected.size > 0 ? `${selected.size} selected` : `Select all ${filteredRules.length}`}</span>
            </label>
          )}
          <ul className="br-list">
            {activeTab === "rules"
              ? filteredRules.map((rule) => (
                  <RuleRow
                    key={rule._id}
                    rule={rule}
                    selected={selected.has(rule._id)}
                    highlighted={highlightId === rule._id}
                    busy={busyId === rule._id}
                    onSelect={toggleSelect}
                    onOpen={setDrawerId}
                    onToggle={toggleRule}
                    onEdit={editRule}
                    onDuplicate={duplicateRule}
                    onDelete={(r) => setConfirm({ kind: "rule", ids: [r._id], name: `"${r.keyword}"` })}
                  />
                ))
              : filteredFlows.map((flow) => (
                  <FlowRow
                    key={flow._id}
                    flow={flow}
                    busy={busyId === flow._id}
                    onToggle={requestToggleFlow}
                    onEdit={(f) => navigate(`/dashboard/bot-builder?id=${f._id}`)}
                    onDelete={(f) => setConfirm({ kind: "flow", ids: [f._id], name: `"${flowName(f)}"` })}
                  />
                ))}
          </ul>
        </>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && activeTab === "rules" && (
        <div className="br-bulk" role="region" aria-label="Bulk actions">
          <span>{selected.size} selected</span>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk("enable")}>Activate</button>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk("disable")}>Pause</button>
          <button type="button" disabled={bulkBusy} className="is-danger" onClick={() => runBulk("delete")}>Delete</button>
          <button type="button" className="br-bulk-clear" onClick={() => setSelected(new Set())} aria-label="Clear selection"><Icon name="close" size={15} /></button>
        </div>
      )}

      {/* Detail drawer */}
      {drawerRule && <Drawer rule={drawerRule} onClose={() => setDrawerId(null)} onEdit={editRule} onDuplicate={duplicateRule} onDelete={(r) => setConfirm({ kind: "rule", ids: [r._id], name: `"${r.keyword}"` })} />}

      {/* Dialogs */}
      {conflict && (
        <Modal
          title="Only one flow can be active"
          onClose={() => setConflict(null)}
          actions={<>
            <button type="button" className="br-btn" onClick={() => setConflict(null)}>Cancel</button>
            <button type="button" className="br-btn br-btn--primary" onClick={() => executeToggleFlow(conflict.flowId, true)}>Switch to this flow</button>
          </>}
        >
          <p>"{conflict.activeName}" is active right now. Activating this flow will pause it, so customers don't get two replies at once.</p>
        </Modal>
      )}

      {confirm && (
        <Modal
          title={`Delete ${confirm.name}?`}
          onClose={() => !deleting && setConfirm(null)}
          actions={<>
            <button type="button" className="br-btn" onClick={() => setConfirm(null)} disabled={deleting}>Keep</button>
            <button type="button" className="br-btn br-btn--danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting" : "Delete"}</button>
          </>}
        >
          <p>This can't be undone. The bot will stop replying to {confirm.kind === "flow" ? "this flow's trigger" : "these keywords"} straight away.</p>
        </Modal>
      )}

      <div className="br-toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`br-toast br-toast--${t.kind}`}>{t.text}</div>)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                             */
/* ------------------------------------------------------------------ */
function Drawer({ rule, onClose, onEdit, onDuplicate, onDelete }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const active = rule.isActive ?? true;
  return (
    <div className="br-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="br-drawer" role="dialog" aria-modal="true" aria-label={`Details for ${rule.keyword}`} tabIndex={-1} ref={ref}>
        <div className="br-drawer-head">
          <div>
            <h2>{rule.keyword}</h2>
            <span className={`br-status${active ? " is-on" : ""}`}>{active ? "Active" : "Paused"}</span>
          </div>
          <button type="button" className="br-iconbtn" onClick={onClose} aria-label="Close details"><Icon name="close" /></button>
        </div>

        <ChatPreview rule={rule} />

        <dl className="br-facts">
          <div><dt>Reply type</dt><dd>{TYPE_LABEL[rule.botType] || "Text"}</dd></div>
          <div><dt>Matches when</dt><dd>{{ exact: "The message is exactly the keyword", contains: "The message contains the keyword", startsWith: "The message starts with the keyword" }[rule.matchType || "exact"]}</dd></div>
          <div><dt>Conversation level</dt><dd>{rule.level && rule.level !== "ANY" ? rule.level : "Any"}</dd></div>
          <div><dt>Replies sent</dt><dd>{rule.hitCount || 0}</dd></div>
          <div><dt>Last triggered</dt><dd>{timeAgo(rule.lastTriggeredAt)}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(rule.createdAt)}</dd></div>
          {rule.updatedAt && <div><dt>Last edited</dt><dd>{timeAgo(rule.updatedAt)}</dd></div>}
        </dl>

        <div className="br-drawer-actions">
          <button type="button" className="br-btn br-btn--primary" onClick={() => onEdit(rule)}><Icon name="edit" /> Edit</button>
          <button type="button" className="br-btn" onClick={() => onDuplicate(rule)}><Icon name="copy" /> Duplicate</button>
          <button type="button" className="br-btn br-btn--danger-quiet" onClick={() => onDelete(rule)}><Icon name="trash" /> Delete</button>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* Colours are CSS variables: add data-theme="dark" on a parent to    */
/* switch, or override the variables to match your brand.             */
/* ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');

.br-root{
  --bg:#f3f6f4; --surface:#ffffff; --ink:#14201e; --ink-2:#47585a; --ink-3:#6f7f7c;
  --line:#e1e8e5; --line-strong:#cbd6d2;
  --brand:#0d7a5f; --brand-hover:#0a6650; --brand-ink:#ffffff; --brand-soft:#e0f3ec;
  --bubble-in:#ffffff; --bubble-out:#d6f0df; --canvas:#e8eee9;
  --warn:#9a5a00; --warn-soft:#fdf0d9; --danger:#c0352b; --danger-soft:#fbe8e6;
  font-family:'Figtree',system-ui,-apple-system,'Segoe UI',sans-serif;
  color:var(--ink); background:var(--bg); min-height:100vh; box-sizing:border-box;
  padding:32px clamp(16px,4vw,44px) 96px; font-size:14px; line-height:1.45;
}
[data-theme="dark"] .br-root{
  --bg:#0f1715; --surface:#17211f; --ink:#e8f0ed; --ink-2:#a9bab6; --ink-3:#7f908c;
  --line:#243230; --line-strong:#34463f; --brand:#2fb68f; --brand-hover:#46c9a2; --brand-ink:#06251c; --brand-soft:#173a30;
  --bubble-in:#1f2c29; --bubble-out:#14463a; --canvas:#0b1210; --warn:#e8b35c; --warn-soft:#3a2c10; --danger:#ef6a5f; --danger-soft:#3a1b18;
}
.br-root *,.br-root *::before,.br-root *::after{box-sizing:border-box}
.br-root button,.br-root input,.br-root select{font:inherit;color:inherit}
.br-root :focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.br-root h1,.br-root h2,.br-root h3{margin:0;font-family:'Bricolage Grotesque','Figtree',system-ui,sans-serif;letter-spacing:-0.01em}
.br-root p{margin:0}

/* header */
.br-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:24px}
.br-head h1{font-size:clamp(26px,3.2vw,34px);font-weight:700;line-height:1.1}
.br-head p{color:var(--ink-2);margin-top:6px;max-width:52ch}
.br-head-actions{display:flex;gap:10px;flex-wrap:wrap}

/* buttons */
.br-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:9px 16px;border-radius:9px;border:1px solid var(--line-strong);background:var(--surface);font-weight:600;cursor:pointer;white-space:nowrap}
.br-btn:hover:not(:disabled){background:var(--bg)}
.br-btn:disabled{opacity:.55;cursor:not-allowed}
.br-btn[aria-disabled="true"]{opacity:.6}
.br-btn--primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.br-btn--primary:hover:not(:disabled){background:var(--brand-hover)}
.br-btn--danger{background:var(--danger);border-color:var(--danger);color:#fff}
.br-btn--danger:hover:not(:disabled){background:var(--danger);filter:brightness(.92)}
.br-btn--danger-quiet{color:var(--danger);border-color:transparent;background:var(--danger-soft)}
.br-btn--danger-quiet:hover:not(:disabled){background:var(--danger-soft);filter:brightness(.97)}
.br-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;border:0;background:transparent;color:var(--ink-2);cursor:pointer}
.br-iconbtn:hover{background:var(--bg);color:var(--ink)}
.br-iconbtn--danger:hover{background:var(--danger-soft);color:var(--danger)}

/* quota */
.br-quota{display:flex;flex-wrap:wrap;align-items:center;gap:12px 36px;margin-bottom:20px;padding:14px 18px;background:var(--surface);border:1px solid var(--line);border-radius:12px}
.br-meter{min-width:200px;flex:1 1 200px;max-width:320px}
.br-meter-top{display:flex;justify-content:space-between;font-size:13px;color:var(--ink-2);margin-bottom:6px}
.br-meter-top strong{color:var(--ink);font-weight:600}
.br-meter-track{height:6px;border-radius:99px;background:var(--line);overflow:hidden}
.br-meter-track span{display:block;height:100%;background:var(--brand);border-radius:99px}
.br-meter-track span.is-full{background:var(--warn)}
.br-quota-note{display:flex;align-items:center;gap:8px;flex-basis:100%;color:var(--warn);background:var(--warn-soft);padding:8px 12px;border-radius:8px;font-weight:500}
.br-quota-note a{color:inherit;font-weight:700}

/* test panel */
.br-test{margin-bottom:22px;padding:14px 18px;background:var(--surface);border:1px solid var(--line);border-radius:12px}
.br-test label{display:flex;align-items:center;gap:6px;font-weight:600;margin-bottom:8px}
.br-test-row{display:flex;gap:10px}
.br-test-row input{flex:1;min-width:0;padding:9px 12px;border:1px solid var(--line-strong);border-radius:9px;background:var(--bg)}
.br-test-result{display:flex;gap:8px;align-items:flex-start;margin-top:10px;color:var(--warn);font-weight:500}
.br-test-result svg{flex-shrink:0;margin-top:2px}
.br-test-result.is-match{color:var(--brand)}

/* tabs, toolbar */
.br-tabs{display:flex;gap:24px;border-bottom:1px solid var(--line);margin-bottom:16px}
.br-tabs button{background:none;border:0;border-bottom:2px solid transparent;padding:10px 2px;margin-bottom:-1px;font-weight:600;color:var(--ink-3);cursor:pointer;display:flex;gap:8px;align-items:center}
.br-tabs button.is-on{color:var(--ink);border-bottom-color:var(--brand)}
.br-tabs button span{font-size:12px;font-weight:600;background:var(--line);color:var(--ink-2);border-radius:99px;padding:1px 8px}
.br-toolbar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-bottom:12px}
.br-search{display:flex;align-items:center;gap:8px;flex:1 1 240px;max-width:360px;padding:0 12px;border:1px solid var(--line-strong);border-radius:9px;background:var(--surface);color:var(--ink-3)}
.br-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;padding:9px 0}
.br-search:focus-within{outline:2px solid var(--brand);outline-offset:2px}
.br-chips{display:flex;flex-wrap:wrap;gap:6px}
.br-chips--types{margin-bottom:14px}
.br-chips button{border:1px solid var(--line-strong);background:var(--surface);border-radius:99px;padding:5px 12px;font-weight:500;color:var(--ink-2);cursor:pointer}
.br-chips button span{margin-left:4px;color:var(--ink-3)}
.br-chips button.is-on{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.br-chips button.is-on span{color:inherit;opacity:.7}
.br-select{padding:8px 10px;border:1px solid var(--line-strong);border-radius:9px;background:var(--surface);margin-left:auto}

/* list */
.br-selectall{display:flex;align-items:center;gap:10px;padding:0 18px 8px;color:var(--ink-2);font-weight:500}
.br-check{width:16px;height:16px;accent-color:var(--brand);cursor:pointer;margin:0}
.br-list{list-style:none;margin:0;padding:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.br-row{display:grid;grid-template-columns:20px minmax(0,1fr) auto;gap:16px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line)}
.br-row:last-child{border-bottom:0}
.br-row.is-hit{background:var(--brand-soft);box-shadow:inset 3px 0 0 var(--brand)}
.br-row.is-paused .br-bubble--out{opacity:.55}
.br-convo{display:flex;flex-direction:column;gap:6px;min-width:0;text-align:left;background:none;border:0;padding:0;cursor:pointer}
.br-bubble{display:flex;max-width:100%;padding:8px 12px;line-height:1.4}
.br-bubble--in{align-self:flex-start;align-items:baseline;flex-wrap:wrap;gap:4px 8px;background:var(--bubble-in);border:1px solid var(--line);border-radius:12px 12px 12px 3px}
.br-bubble--out{align-self:flex-end;flex-direction:column;gap:5px;width:min(560px,94%);background:var(--bubble-out);border-radius:12px 12px 3px 12px}
.br-kw{font-weight:700}
.br-chip{font-size:12px;font-weight:500;color:var(--ink-2);background:var(--bg);border:1px solid var(--line);border-radius:99px;padding:0 8px}
.br-reply{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere}
.br-tags{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:var(--ink-2)}
.br-tag{display:inline-flex;align-items:center;gap:4px}
.br-side{display:flex;align-items:center;gap:4px}
.br-switch-label{display:flex;align-items:center;gap:8px;margin-right:8px;font-size:13px;color:var(--ink-2);min-width:84px;cursor:pointer}
.br-switch{position:relative;flex-shrink:0;width:36px;height:20px;border-radius:99px;border:0;background:var(--line-strong);cursor:pointer;padding:0}
.br-switch span{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
.br-switch[aria-checked="true"]{background:var(--brand)}
.br-switch[aria-checked="true"] span{transform:translateX(16px)}
.br-switch:disabled{opacity:.6;cursor:wait}
.br-row--flow{grid-template-columns:36px minmax(0,1fr) auto}
.br-flow-icon{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9px;background:var(--brand-soft);color:var(--brand)}
.br-flow-main{display:flex;flex-direction:column;gap:2px;min-width:0}
.br-flow-meta{color:var(--ink-2);font-size:13px}
.br-row--skel{grid-template-columns:1fr;gap:10px}
.br-skel{display:block;height:14px;border-radius:6px;background:linear-gradient(90deg,var(--line) 25%,var(--bg) 50%,var(--line) 75%);background-size:200% 100%;animation:br-shimmer 1.3s infinite linear}
@keyframes br-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

/* empty + alert */
.br-empty{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:56px 20px;background:var(--surface);border:1px dashed var(--line-strong);border-radius:12px;color:var(--ink-2)}
.br-empty h2{font-size:19px;color:var(--ink)}
.br-empty p{max-width:44ch;margin-bottom:6px}
.br-alert{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 14px;border-radius:10px;background:var(--danger-soft);color:var(--danger);font-weight:500}
.br-alert span{flex:1}

/* bulk bar */
.br-bulk{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:40;display:flex;align-items:center;gap:4px;padding:8px 10px 8px 16px;background:var(--ink);color:var(--surface);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.28);max-width:calc(100vw - 24px)}
.br-bulk span{margin-right:10px;font-weight:600}
.br-bulk button{background:transparent;border:0;color:inherit;font-weight:600;padding:7px 12px;border-radius:8px;cursor:pointer}
.br-bulk button:hover:not(:disabled){background:rgba(255,255,255,.14)}
.br-bulk button:disabled{opacity:.5}
.br-bulk .is-danger{color:#ff9a90}
.br-bulk-clear{display:inline-flex;padding:7px!important}

/* overlay, drawer, modal */
.br-overlay{position:fixed;inset:0;z-index:60;background:rgba(10,20,18,.5);display:flex;justify-content:flex-end}
.br-overlay--center{justify-content:center;align-items:center;padding:16px;z-index:70}
.br-drawer{width:min(440px,100%);height:100%;overflow-y:auto;background:var(--surface);padding:22px;display:flex;flex-direction:column;gap:20px;animation:br-slide .2s ease-out;outline:0}
@keyframes br-slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
.br-drawer-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.br-drawer-head h2{font-size:22px;overflow-wrap:anywhere}
.br-status{display:inline-block;margin-top:6px;font-size:12px;font-weight:600;padding:1px 10px;border-radius:99px;background:var(--line);color:var(--ink-2)}
.br-status.is-on{background:var(--brand-soft);color:var(--brand)}
.br-facts{margin:0;display:flex;flex-direction:column}
.br-facts div{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--line)}
.br-facts dt{color:var(--ink-2)}
.br-facts dd{margin:0;font-weight:600;text-align:right}
.br-drawer-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}
.br-modal{width:min(440px,100%);background:var(--surface);border-radius:14px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.3);outline:0}
.br-modal h3{font-size:18px;margin-bottom:8px}
.br-modal-body{color:var(--ink-2);margin-bottom:20px}
.br-modal-actions{display:flex;justify-content:flex-end;gap:10px}

/* phone preview */
.br-phone{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:14px;background:var(--canvas)}
.br-msg{max-width:86%;padding:8px 10px;font-size:14px;overflow-wrap:anywhere}
.br-msg--in{align-self:flex-start;background:var(--bubble-in);border-radius:10px 10px 10px 2px}
.br-msg--out{align-self:flex-end;background:var(--bubble-out);border-radius:10px 10px 2px 10px;display:flex;flex-direction:column;gap:6px}
.br-msg-media{width:100%;max-height:220px;object-fit:cover;border-radius:6px;display:block}
.br-msg-audio{width:100%;max-width:240px}
.br-msg-file{display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;background:rgba(0,0,0,.06);color:inherit;text-decoration:none;font-weight:600}
.br-msg-text{white-space:pre-wrap}
.br-msg-footer{font-size:12px;color:var(--ink-3)}
.br-msg-template{display:flex;align-items:center;gap:6px}
.br-msg-buttons{align-self:flex-end;width:86%;display:flex;flex-direction:column;gap:4px}
.br-msg-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border-radius:8px;background:var(--bubble-in);color:var(--brand);font-weight:600}

/* toasts */
.br-toasts{position:fixed;top:16px;right:16px;z-index:90;display:flex;flex-direction:column;gap:8px;max-width:min(360px,calc(100vw - 32px))}
.br-toast{padding:10px 14px;border-radius:10px;background:var(--ink);color:var(--surface);font-weight:500;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.br-toast--error{background:var(--danger);color:#fff}

@media (max-width:720px){
  .br-row{grid-template-columns:20px minmax(0,1fr);row-gap:10px}
  .br-row .br-side{grid-column:1 / -1;justify-content:space-between;padding-left:36px}
  .br-row--flow{grid-template-columns:36px minmax(0,1fr)}
  .br-row--flow .br-side{padding-left:0}
  .br-select{margin-left:0}
  .br-test-row{flex-direction:column}
  .br-bubble--out{width:100%}
  .br-bulk{bottom:12px;flex-wrap:wrap;justify-content:center}
}
@media (prefers-reduced-motion:reduce){
  .br-drawer,.br-skel{animation:none}
  .br-switch span{transition:none}
}
`;
