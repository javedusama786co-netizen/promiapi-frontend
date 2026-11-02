import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { QRCode } from "react-qrcode-logo";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

/* ───────────── API ───────────── */
const resolveApiBase = () => {
  try {
    if (typeof process !== "undefined" && process?.env?.REACT_APP_API_BASE_URL) return process.env.REACT_APP_API_BASE_URL;
    if (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    if (typeof window !== "undefined") {
      if (window.__env?.REACT_APP_API_BASE_URL) return window.__env.REACT_APP_API_BASE_URL;
      if (window.REACT_APP_API_BASE_URL) return window.REACT_APP_API_BASE_URL;
    }
  } catch (e) { /* ignore */ }
  return "https://api.promiapi.com";
};
const API_BASE_URL = resolveApiBase();
const PAGE_SIZE = 6;
const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } })();

const authHeaders = (extra = {}) => {
  const token = localStorage.getItem("token");
  return { ...extra, Authorization: token ? `Bearer ${token}` : "", "ngrok-skip-browser-warning": "true" };
};

const request = async (path, { method = "GET", body, signal } = {}) => {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method, signal,
    headers: authHeaders(body ? { "Content-Type": "application/json" } : {}),
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
  widget: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m5 12 5 5L20 7" />,
  alert: <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v5M12 18h.01" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  play: <path d="m7 4 13 8-13 8z" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  mobile: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
  desktop: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.500 5.500" /></>,
  cursor: <path d="m5 3 14 7-6 2-2 6z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  chevLeft: <path d="m15 18-6-6 6-6" />,
  chevRight: <path d="m9 18 6-6-6-6" />,
  chevDown: <path d="m6 9 6 6 6-6" />,
  trendUp: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
};
const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    {ICONS[name] || ICONS.qr}
  </svg>
);

/* ───────────── Helpers ───────────── */
const TYPE_META = {
  qr: { label: "QR codes", short: "QR", color: "#2F46E0", icon: "qr", noun: "scan" },
  shortlink: { label: "Short links", short: "Short link", color: "#0891B2", icon: "link", noun: "click" },
  cta: { label: "CTA URLs", short: "CTA", color: "#D9822B", icon: "cta", noun: "click" },
  widget: { label: "Chat widget", short: "Widget", color: "#12B76A", icon: "widget", noun: "chat start" },
};
const TYPE_KEYS = ["qr", "shortlink", "cta", "widget"];
const RANGES = [{ value: "24h", label: "24h" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "90d", label: "90 days" }, { value: "365d", label: "1 year" }];
const THEMES = [
  { name: "Ink", fg: "#101828", bg: "#FFFFFF", eye: "" },
  { name: "Indigo", fg: "#1D2BB8", bg: "#FFFFFF", eye: "#101828" },
  { name: "WhatsApp", fg: "#0B6B4F", bg: "#FFFFFF", eye: "#128C7E" },
  { name: "Plum", fg: "#7A1F3D", bg: "#FFF7F9", eye: "" },
  { name: "Sand", fg: "#3D2B1F", bg: "#FBF4E9", eye: "" },
];

const slug = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "qr-campaign";
const nf = new Intl.NumberFormat("en-US");
const fmtNum = (n) => nf.format(n || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—");
const timeAgo = (d) => {
  if (!d) return "Never";
  const s = Math.max(1, Math.round((Date.now() - new Date(d)) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
};
const regionNames = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; } })();
const countryLabel = (code) => {
  if (!code || code === "Unknown") return "Unknown";
  try { return regionNames?.of(code) || code; } catch { return code; }
};
const flag = (code) => (/^[A-Z]{2}$/.test(code || "") ? String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0))) : "🌐");
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
const isExpired = (d) => d && new Date(d) < new Date();
const itemState = (it) => (it.status === "paused" ? "paused" : isExpired(it.expiresAt) ? "expired" : "active");
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

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
const niceStep = (v) => {
  const p = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * p >= v) return f * p;
  return 10 * p;
};
const axisDate = (key, hourly) => {
  if (!key) return "";
  if (hourly) return key.slice(11, 13) + ":00";
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(220, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ───────────── Charts (dependency-free SVG) ───────────── */
function Spark({ data = [], color = "#2F46E0", w = 84, h = 28 }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * (w - 2) + 1, h - 3 - (v / max) * (h - 6)]);
  const total = data.reduce((a, b) => a + b, 0);
  if (!data.length || !total) return <span className="qs-spark-empty" aria-label="No activity in the last 14 days">—</span>;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={`${total} in the last 14 days`}>
      <path d={`${line} L${w - 1},${h - 1} L1,${h - 1}Z`} fill={color} opacity=".12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TrendChart({ data, keys, hourly }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const H = 250, pad = { l: 38, r: 12, t: 12, b: 26 };
  const iw = Math.max(10, w - pad.l - pad.r), ih = H - pad.t - pad.b;
  const stacks = useMemo(() => data.map((d) => { let acc = 0; const o = {}; keys.forEach((k) => { o[k] = [acc, acc + (d[k] || 0)]; acc += d[k] || 0; }); o.total = acc; return o; }), [data, keys]);
  const peak = Math.max(1, ...stacks.map((s) => s.total));
  const step = niceStep(peak / 4), max = step * 4;
  const x = (i) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / max) * ih;
  const area = (k) => {
    const top = data.map((_, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(stacks[i][k][1]).toFixed(1)}`).join(" ");
    const bot = data.map((_, i) => `L${x(data.length - 1 - i).toFixed(1)},${y(stacks[data.length - 1 - i][k][0]).toFixed(1)}`).join(" ");
    return `${top} ${bot}Z`;
  };
  const line = (k) => data.map((_, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(stacks[i][k][1]).toFixed(1)}`).join(" ");
  const tickEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 78))));
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left - pad.l) / iw;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1)))));
  };
  const hd = hover != null ? data[hover] : null;
  return (
    <div ref={ref} className="qs-chart" style={{ height: H }}>
      <svg width={w} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Clicks over time">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y(step * i)} y2={y(step * i)} stroke="var(--line)" strokeDasharray={i ? "3 4" : ""} />
            <text x={pad.l - 8} y={y(step * i) + 4} textAnchor="end" className="qs-ax">{fmtNum(step * i)}</text>
          </g>
        ))}
        {data.map((d, i) => (i % tickEvery === 0 ? <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" className="qs-ax">{axisDate(d.date, hourly)}</text> : null))}
        {keys.map((k) => <path key={k} d={area(k)} fill={TYPE_META[k].color} opacity=".16" />)}
        {keys.map((k) => <path key={k + "l"} d={line(k)} fill="none" stroke={TYPE_META[k].color} strokeWidth="2" strokeLinejoin="round" />)}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--ink-3)" strokeDasharray="3 3" />
            {keys.map((k) => <circle key={k} cx={x(hover)} cy={y(stacks[hover][k][1])} r="4" fill="#fff" stroke={TYPE_META[k].color} strokeWidth="2" />)}
          </g>
        )}
      </svg>
      {hd && (
        <div className="qs-tip" style={{ left: Math.min(w - 170, Math.max(0, x(hover) + 12)), top: 8 }}>
          <b>{hourly ? hd.date.replace("T", " ") : new Date(hd.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</b>
          {keys.map((k) => <div key={k}><i style={{ background: TYPE_META[k].color }} />{TYPE_META[k].short}<span>{fmtNum(hd[k])}</span></div>)}
          {keys.length > 1 && <div className="qs-tip-total">Total<span>{fmtNum(hd.total)}</span></div>}
        </div>
      )}
    </div>
  );
}

function Donut({ data, colors, centerLabel = "Total" }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="qs-donut">
      <svg width="148" height="148" viewBox="0 0 148 148" role="img" aria-label={`${centerLabel}: ${total}`}>
        <circle cx="74" cy="74" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * C;
          const el = <circle key={d.name} cx="74" cy="74" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 74 74)" />;
          off += len; return el;
        })}
        <text x="74" y="72" textAnchor="middle" className="qs-donut-n">{fmtNum(total)}</text>
        <text x="74" y="90" textAnchor="middle" className="qs-ax">{centerLabel}</text>
      </svg>
      <ul className="qs-legend">
        {data.map((d, i) => (
          <li key={d.name}><i style={{ background: colors[i % colors.length] }} /><span>{d.label || d.name}</span><b>{total ? Math.round((d.value / total) * 100) : 0}%</b></li>
        ))}
      </ul>
    </div>
  );
}

function BarList({ data, color = "#2F46E0", render, empty = "No data yet" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, b) => a + b.value, 0);
  if (!data.length) return <div className="qs-nodata">{empty}</div>;
  return (
    <ul className="qs-bars">
      {data.map((d) => (
        <li key={d.name}>
          <div className="qs-bars-row"><span className="qs-bars-name">{render ? render(d.name) : d.name}</span><span className="qs-bars-val">{fmtNum(d.value)} <em>{total ? Math.round((d.value / total) * 100) : 0}%</em></span></div>
          <div className="qs-prog-bar"><div className="qs-prog-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Columns({ data, color = "#2F46E0", label }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const best = data.reduce((a, b) => (b.value > a.value ? b : a), data[0] || { value: 0 });
  return (
    <div className="qs-cols" role="img" aria-label="Distribution">
      {data.map((d) => (
        <div key={d.name} className="qs-col" title={`${label ? label(d.name) : d.name}: ${d.value}`}>
          <div className="qs-col-bar"><span style={{ height: `${(d.value / max) * 100}%`, background: color, opacity: d === best && d.value ? 1 : 0.45 }} /></div>
          <small>{label ? label(d.name) : d.name}</small>
        </div>
      ))}
    </div>
  );
}

function Funnel({ f }) {
  const steps = [
    { name: "Widget loaded", value: f.impressions, color: "#98A2B3" },
    { name: "Chat opened", value: f.opens, color: "#2F46E0" },
    { name: "WhatsApp started", value: f.leads, color: "#12B76A" },
  ];
  const base = Math.max(1, steps[0].value);
  return (
    <ul className="qs-funnel">
      {steps.map((s, i) => (
        <li key={s.name}>
          <div className="qs-bars-row"><span className="qs-bars-name">{s.name}</span><span className="qs-bars-val">{fmtNum(s.value)}{i > 0 && steps[i - 1].value ? <em>{Math.round((s.value / steps[i - 1].value) * 100)}% of previous</em> : null}</span></div>
          <div className="qs-prog-bar qs-prog-bar--lg"><div className="qs-prog-fill" style={{ width: `${(s.value / base) * 100}%`, background: s.color }} /></div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Shared UI ───────────── */
function ColorField({ id, label, value, onChange, allowEmpty, emptyHint }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="qs-field">
      <label htmlFor={id}>{label}</label>
      <div className="qs-color">
        <input type="color" id={id} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input className="qs-input" value={draft} maxLength={7} aria-label={`${label} hex value`} spellCheck={false} placeholder={emptyHint || ""}
          onChange={(e) => { setDraft(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value) || (allowEmpty && !e.target.value)) onChange(e.target.value); }} />
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

const Switch = ({ checked, onChange, label, hint }) => (
  <label className="qs-switch">
    <span className="qs-switch-text"><b>{label}</b>{hint && <small>{hint}</small>}</span>
    <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <i aria-hidden="true" />
  </label>
);

const StatusPill = ({ state }) => (
  <span className={`qs-pill ${state === "active" ? "on" : state === "paused" ? "off" : "bad"}`}><i />{state === "active" ? "Active" : state === "paused" ? "Paused" : "Expired"}</span>
);

function Pager({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <nav className="qs-pager" aria-label="Pagination">
      <button type="button" className="qs-iconbtn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><Icon name="chevLeft" /></button>
      {pageList(page, total).map((p) => typeof p === "string"
        ? <span key={p} className="qs-gap">…</span>
        : <button type="button" key={p} className={`qs-pg${p === page ? " on" : ""}`} aria-current={p === page ? "page" : undefined} onClick={() => onChange(p)}>{p}</button>)}
      <button type="button" className="qs-iconbtn" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label="Next page"><Icon name="chevRight" /></button>
    </nav>
  );
}

function RowActions({ paused, onStats, onEdit, onToggle, onDelete, extra }) {
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(); };
  return (
    <div className="qs-rowact">
      {extra}
      {onStats && <button type="button" className="qs-iconbtn" title="Analytics" aria-label="View analytics" onClick={stop(onStats)}><Icon name="analytics" size={16} /></button>}
      {onEdit && <button type="button" className="qs-iconbtn" title="Edit" aria-label="Edit" onClick={stop(onEdit)}><Icon name="edit" size={16} /></button>}
      {onToggle && <button type="button" className="qs-iconbtn" title={paused ? "Resume" : "Pause"} aria-label={paused ? "Resume" : "Pause"} onClick={stop(onToggle)}><Icon name={paused ? "play" : "pause"} size={16} /></button>}
      {onDelete && <button type="button" className="qs-iconbtn qs-iconbtn--danger" title="Delete" aria-label="Delete" onClick={stop(onDelete)}><Icon name="trash" size={16} /></button>}
    </div>
  );
}

function Toolbar({ count, noun, search, setSearch, sort, setSort, sorts }) {
  return (
    <div className="qs-saved-head">
      <div><h2 className="qs-h2" style={{ margin: 0 }}>Your {noun}s</h2><p className="qs-meta">{count} in total</p></div>
      <div className="qs-saved-tools">
        <div className="qs-search"><Icon name="search" size={16} /><input className="qs-input" type="search" placeholder="Search" aria-label={`Search ${noun}s`} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="qs-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">{sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, foot, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <motion.div className="qs-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="qs-modal" style={wide ? { maxWidth: 520 } : undefined} role="dialog" aria-modal="true" aria-label={title} initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97 }}>
        <h2 className="qs-modal-title">{title}</h2>
        {children}
        <div className="qs-modal-foot">{foot}</div>
      </motion.div>
    </motion.div>
  );
}

/** Generic edit dialog. fields: [{key,label,type?,placeholder?,textarea?,help?}] */
function EditModal({ title, fields, initial, onSave, onClose }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setBusy(true); setErr("");
    try { await onSave(v); onClose(); } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose} wide foot={<>
      <button type="button" className="qs-btn" onClick={onClose}>Cancel</button>
      <button type="button" className="qs-btn qs-btn--primary" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
    </>}>
      {fields.map((f) => (
        <div className="qs-field" key={f.key}>
          <label htmlFor={`ed-${f.key}`}>{f.label}</label>
          {f.textarea
            ? <textarea id={`ed-${f.key}`} className="qs-input" rows={3} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            : <input id={`ed-${f.key}`} className="qs-input" type={f.type || "text"} placeholder={f.placeholder} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
          {f.help && <small>{f.help}</small>}
        </div>
      ))}
      {err && <div className="qs-note qs-note--bad" role="alert"><Icon name="alert" size={16} />{err}</div>}
    </Modal>
  );
}

function StatCard({ icon, color, value, label, delta, sub }) {
  return (
    <div className="qs-card qs-stat-card">
      <span className="qs-stat-ico" style={{ color }}><Icon name={icon} size={20} /></span>
      <div style={{ minWidth: 0 }}>
        <div className="qs-stat-val">{value}</div>
        <div className="qs-stat-lbl">{label}</div>
        {delta != null && <div className={`qs-delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}`}>{delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}% <span>vs previous period</span></div>}
        {sub && <div className="qs-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

const Panel = ({ title, hint, children, className = "" }) => (
  <section className={`qs-card ${className}`}>
    <div className="qs-panel-head"><h3 className="qs-h3">{title}</h3>{hint && <span className="qs-hint">{hint}</span>}</div>
    {children}
  </section>
);

/* ───────────── Analytics panel (global + single item) ───────────── */
function AnalyticsPanel({ itemId, itemType, onToast }) {
  const [range, setRange] = useState("30d");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hidden, setHidden] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [live, setLive] = useState(true);
  const [updated, setUpdated] = useState(null);
  const [exporting, setExporting] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async (silent) => {
    const my = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const qs = `range=${range}&tz=${encodeURIComponent(TZ)}${!itemId && typeFilter !== "all" ? `&type=${typeFilter}` : ""}`;
      const d = await request(itemId ? `/api/growth-analytics/item/${itemId}?${qs}` : `/api/growth-analytics/overview?${qs}`);
      if (my === seq.current) { setData(d.data); setErr(""); setUpdated(new Date()); }
    } catch (e) { if (my === seq.current) setErr(e.message); }
    finally { if (my === seq.current) setLoading(false); }
  }, [range, typeFilter, itemId]);

  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => { if (!document.hidden) load(true); }, 30000);
    return () => clearInterval(t);
  }, [live, load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/growth-analytics/export?range=${range}${typeFilter !== "all" ? `&type=${typeFilter}` : ""}`, { headers: authHeaders() });
      if (!r.ok) throw new Error("Export failed.");
      saveBlob(await r.blob(), `analytics-${range}.csv`);
      onToast("success", "CSV exported");
    } catch (e) { onToast("error", e.message); } finally { setExporting(false); }
  };

  const d = data;
  const hourly = range === "24h";
  const visibleKeys = itemId ? [itemType || "qr"] : TYPE_KEYS.filter((k) => !hidden[k] && (typeFilter === "all" || typeFilter === k));
  const insight = useMemo(() => {
    if (!d) return {};
    const peakH = d.hourly.reduce((a, b) => (b.value > a.value ? b : a), d.hourly[0]);
    const avg = d.totals.clicks / Math.max(1, d.days);
    return { peak: peakH.value ? hourLabel(peakH.name) : "—", avg: avg >= 10 ? Math.round(avg) : Math.round(avg * 10) / 10 };
  }, [d]);
  const isWidget = (itemId && itemType === "widget") || typeFilter === "widget" || (!itemId && d?.funnel?.impressions > 0);

  return (
    <div className="qs-an" aria-busy={loading}>
      <div className="qs-an-bar">
        <Segmented label="Date range" value={range} onChange={setRange} options={RANGES} />
        {!itemId && (
          <div className="qs-chips" role="group" aria-label="Filter by source">
            {[["all", "All sources"], ...TYPE_KEYS.map((k) => [k, TYPE_META[k].label])].map(([k, l]) => (
              <button type="button" key={k} className={`qs-chip${typeFilter === k ? " on" : ""}`} aria-pressed={typeFilter === k} onClick={() => setTypeFilter(k)}>{l}</button>
            ))}
          </div>
        )}
        <div className="qs-an-right">
          <button type="button" className={`qs-livebtn${live ? " on" : ""}`} aria-pressed={live} onClick={() => setLive(!live)} title="Refresh every 30 seconds">
            <i />{live ? "Live" : "Paused"}{updated && <span>· {updated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          </button>
          {!itemId && <button type="button" className="qs-btn qs-btn--sm" onClick={exportCsv} disabled={exporting}><Icon name="download" size={14} />{exporting ? "Exporting…" : "Export CSV"}</button>}
        </div>
      </div>

      {err && <div className="qs-note qs-note--bad" role="alert"><Icon name="alert" size={16} />{err}<button type="button" className="qs-btn qs-btn--sm" style={{ marginLeft: "auto" }} onClick={() => load(false)}>Retry</button></div>}

      {!d && loading && <div className="qs-skel-grid" aria-hidden="true"><div className="qs-skel" /><div className="qs-skel" /><div className="qs-skel" /><div className="qs-skel" /></div>}

      {d && (<>
        <div className="qs-stat-grid">
          <StatCard icon="cursor" color="#2F46E0" value={fmtNum(d.totals.clicks)} label={isWidget && itemId ? "Chats started" : "Total clicks & scans"} delta={d.totals.change} />
          <StatCard icon="users" color="#067647" value={fmtNum(d.totals.unique)} label="Unique visitors" sub={d.totals.clicks ? `${(d.totals.clicks / Math.max(1, d.totals.unique)).toFixed(1)} clicks per visitor` : "Same device counted once"} />
          <StatCard icon="trendUp" color="#B54708" value={fmtNum(insight.avg)} label={hourly ? "Average per hour" : "Average per day"} sub={`Previous period: ${fmtNum(d.totals.prevClicks)}`} />
          <StatCard icon="clock" color="#7A1F3D" value={insight.peak} label="Busiest hour" sub={`Times in ${TZ.replace("_", " ")}`} />
        </div>

        <Panel title="Activity over time" hint={itemId ? "" : "Click a source to show or hide it"}>
          {!itemId && (
            <div className="qs-legend-inline">
              {TYPE_KEYS.filter((k) => typeFilter === "all" || typeFilter === k).map((k) => (
                <button type="button" key={k} className={hidden[k] ? "off" : ""} aria-pressed={!hidden[k]} onClick={() => setHidden({ ...hidden, [k]: !hidden[k] })}>
                  <i style={{ background: TYPE_META[k].color }} />{TYPE_META[k].label}
                </button>
              ))}
            </div>
          )}
          {d.totals.clicks === 0 && <div className="qs-nodata qs-nodata--over">No activity in this period yet. New scans and clicks appear here within seconds.</div>}
          <TrendChart data={d.series} keys={visibleKeys.length ? visibleKeys : [itemType || "qr"]} hourly={hourly} />
        </Panel>

        {isWidget && (
          <div className="qs-an-grid">
            <Panel title="Widget funnel" hint="From page view to WhatsApp"><Funnel f={d.funnel} /></Panel>
            <Panel title="Top pages" hint="Where the widget was shown"><BarList data={d.pages} color="#12B76A" empty="Page data appears once visitors see the widget." /></Panel>
          </div>
        )}

        <div className="qs-an-grid">
          {!itemId && <Panel title="By source"><Donut data={d.byType.map((x) => ({ ...x, label: TYPE_META[x.name].label }))} colors={TYPE_KEYS.map((k) => TYPE_META[k].color)} centerLabel="clicks" /></Panel>}
          <Panel title="Devices"><Donut data={d.devices} colors={["#2F46E0", "#12B76A", "#D9822B", "#98A2B3"]} centerLabel="clicks" /></Panel>
          <Panel title="Operating systems"><BarList data={d.os} color="#2F46E0" /></Panel>
          <Panel title="Browsers"><BarList data={d.browsers} color="#0891B2" /></Panel>
          <Panel title="Countries" hint={d.countries.every((c) => c.name === "Unknown") && d.countries.length ? "Needs a CDN country header or geoip-lite" : ""}>
            <BarList data={d.countries} color="#067647" render={(n) => <><span className="qs-flag">{flag(n)}</span>{countryLabel(n)}</>} />
          </Panel>
          <Panel title="Referrers"><BarList data={d.referrers} color="#D9822B" empty="No referrer data yet" /></Panel>
          <Panel title="Hour of day" hint={`Your time zone`}><Columns data={d.hourly} color="#2F46E0" label={(n) => (n % 3 === 0 ? hourLabel(n) : "")} /></Panel>
          <Panel title="Day of week"><Columns data={d.weekday} color="#7A1F3D" /></Panel>
        </div>

        {!itemId && (
          <div className="qs-an-grid qs-an-grid--wide">
            <Panel title="Top performers" hint="By clicks in this period">
              {d.topItems.length === 0 ? <div className="qs-nodata">Nothing to rank yet.</div> : (
                <div className="qs-scroll"><table className="qs-table" style={{ minWidth: 420 }}>
                  <thead><tr><th>Name</th><th>Type</th><th>Clicks</th><th>Unique</th></tr></thead>
                  <tbody>{d.topItems.map((t) => (
                    <tr key={t.refId}><td><b>{t.title || "Untitled"}</b><div className="qs-num">Last: {timeAgo(t.last)}</div></td>
                      <td><span className="qs-tag" style={{ "--c": TYPE_META[t.type].color }}>{TYPE_META[t.type].short}</span></td>
                      <td><b>{fmtNum(t.clicks)}</b></td><td>{fmtNum(t.unique)}</td></tr>
                  ))}</tbody></table></div>
              )}
            </Panel>
            <Panel title="Live activity" hint="Latest 15 events">
              {d.recent.length === 0 ? <div className="qs-nodata">No events yet.</div> : (
                <ul className="qs-feed">{d.recent.map((e) => (
                  <li key={e._id}>
                    <span className="qs-feed-dot" style={{ background: TYPE_META[e.type].color }} />
                    <div><b>{e.refTitle || TYPE_META[e.type].short}</b>{" "}<span className="qs-num">{e.event === "lead" ? "started a chat" : TYPE_META[e.type].noun}</span>
                      <div className="qs-num">{flag(e.country)} {e.country ? countryLabel(e.country) : "Unknown location"} · {e.device} · {e.browser} · {e.referrer}</div></div>
                    <time>{timeAgo(e.createdAt)}</time>
                  </li>))}</ul>
              )}
            </Panel>
          </div>
        )}
      </>)}
    </div>
  );
}

function StatsDrawer({ item, onClose, onToast }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <motion.div className="qs-overlay qs-overlay--drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.aside className="qs-drawer" role="dialog" aria-modal="true" aria-label={`Analytics for ${item.title}`} initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} transition={{ type: "tween", duration: 0.2 }}>
        <header className="qs-drawer-head">
          <div><span className="qs-tag" style={{ "--c": TYPE_META[item.type].color }}>{TYPE_META[item.type].short}</span><h2 className="qs-h2" style={{ margin: "6px 0 0" }}>{item.title || "Untitled"}</h2>{item.sub && <p className="qs-meta">{item.sub}</p>}</div>
          <button type="button" className="qs-iconbtn" onClick={onClose} aria-label="Close analytics"><Icon name="x" size={18} /></button>
        </header>
        <AnalyticsPanel itemId={item.id} itemType={item.type} onToast={onToast} />
      </motion.aside>
    </motion.div>
  );
}

/* ───────────── Shared list hook ───────────── */
function useList(path, refreshKey) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try { const d = await request(path); setItems(Array.isArray(d.data) ? d.data : []); setError(""); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { reload(); }, [reload, refreshKey]);
  return { items, loading, error, reload };
}

function useListView(items, { fields, sorters, initial }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(initial);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = items.filter((r) => !q || fields.some((f) => String(r[f] || "").toLowerCase().includes(q)));
    return arr.sort(sorters[sort]);
  }, [items, search, sort, fields, sorters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  useEffect(() => setPage(1), [search, sort]);
  return { search, setSearch, sort, setSort, page: safe, setPage, totalPages, rows: filtered.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE), total: filtered.length };
}

const byNewest = (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0);
const ListState = ({ loading, error, empty, emptyTitle, emptyText, onRetry }) => {
  if (loading) return <div aria-busy="true"><div className="qs-skel" /><div className="qs-skel" /></div>;
  if (error) return <div className="qs-note qs-note--bad" role="alert"><Icon name="alert" size={16} />{error}<button type="button" className="qs-btn qs-btn--sm" style={{ marginLeft: "auto" }} onClick={onRetry}>Retry</button></div>;
  if (empty) return <div className="qs-empty"><h3>{emptyTitle}</h3><p>{emptyText}</p></div>;
  return null;
};
const MiniStats = ({ items }) => (
  <div className="qs-mini">{items.map(([l, v, s]) => <div key={l}><b>{v}</b><span>{l}</span>{s && <em>{s}</em>}</div>)}</div>
);

/* ───────────── QR TAB ───────────── */
function QrTab({ toast, onStats, askDelete, refreshKey }) {
  const { items: saved, loading, error, reload } = useList("/api/qr/my-qrs", refreshKey);
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [defaultMessage, setDefaultMessage] = useState("Hi! I'd like to know more.");
  const [fgColor, setFgColor] = useState("#101828");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [eyeColor, setEyeColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoSize, setLogoSize] = useState(17);
  const [logoPadding, setLogoPadding] = useState(4);
  const [removeBehindLogo, setRemoveBehindLogo] = useState(true);
  const [size, setSize] = useState(512);
  const [ecLevel, setEcLevel] = useState("M");
  const [quietZone, setQuietZone] = useState(10);
  const [eyeRadius, setEyeRadius] = useState(8);
  const [qrStyle, setQrStyle] = useState("dots");
  const [activeId, setActiveId] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [svgOk, setSvgOk] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const view = useListView(saved, {
    fields: ["title", "phoneNumber"],
    sorters: { recent: byNewest, scans_desc: (a, b) => (b.scansCount || 0) - (a.scansCount || 0), scans_asc: (a, b) => (a.scansCount || 0) - (b.scansCount || 0), title: (a, b) => (a.title || "").localeCompare(b.title || "") },
    initial: "recent",
  });
  const totalScans = useMemo(() => saved.reduce((n, r) => n + (r.scansCount || 0), 0), [saved]);

  const cleanNumber = useMemo(() => (phoneNumber || "").replace(/[^0-9]/g, ""), [phoneNumber]);
  const phoneValid = cleanNumber.length >= 8 && cleanNumber.length <= 15;
  const phoneError = touched && !phoneValid ? "Enter the number with its country code, 8 to 15 digits." : "";
  const rawWaLink = phoneValid ? `https://wa.me/${cleanNumber}${defaultMessage ? `?text=${encodeURIComponent(defaultMessage)}` : ""}` : "";
  const qrValue = trackingUrl || rawWaLink;
  const warning = colorWarning(fgColor, bgColor);
  const logoWarn = logoUrl && ecLevel !== "H" && logoSize > 12 ? "A logo hides part of the code. Set error correction to High so it still scans." : "";

  useEffect(() => { setSvgOk(document.getElementById("qs-qr")?.tagName?.toLowerCase() === "svg"); }, [phoneValid, qrStyle, size, logoUrl]);

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("error", "Logo size must be under 2 MB.");
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return toast("error", "Only PNG, JPEG, WebP or SVG images are supported.");
    const reader = new FileReader();
    reader.onload = () => { setLogoUrl(reader.result); setLogoFileName(file.name); if (ecLevel !== "H") setEcLevel("H"); toast("success", "Logo added. Error correction set to High."); };
    reader.onerror = () => toast("error", "Failed to read file.");
    reader.readAsDataURL(file);
  };
  const removeLogo = () => { setLogoUrl(""); setLogoFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  const resetForm = () => {
    setActiveId(null); setTrackingUrl(""); setTitle(""); setPhoneNumber("");
    setDefaultMessage("Hi! I'd like to know more."); removeLogo(); setTouched(false);
  };
  const applyTheme = (t) => { setFgColor(t.fg); setBgColor(t.bg); setEyeColor(t.eye); };

  const payload = () => ({
    title: title.trim() || `Campaign ${new Date().toLocaleDateString("en-GB")}`,
    phoneNumber: cleanNumber, defaultMessage, fgColor, bgColor, eyeColor, logoUrl, logoSize, logoPadding, removeBehindLogo, size, ecLevel, quietZone, eyeRadius, qrStyle,
  });

  const save = async (asNew) => {
    setTouched(true);
    if (!phoneValid) return;
    setSaving(true);
    try {
      const update = activeId && !asNew;
      const d = await request(update ? `/api/qr/${activeId}` : "/api/qr/save", { method: update ? "PUT" : "POST", body: payload() });
      setActiveId(d.data._id); setTrackingUrl(d.data.trackingUrl || "");
      toast("success", update ? "Campaign updated. Printed codes keep working." : "Campaign saved. Scans are now tracked.");
      reload();
    } catch (err) { toast("error", err.message); } finally { setSaving(false); }
  };

  const selectQr = (qr) => {
    setActiveId(qr._id); setTitle(qr.title || ""); setPhoneNumber(qr.phoneNumber || ""); setDefaultMessage(qr.defaultMessage || "");
    setFgColor(qr.fgColor || "#101828"); setBgColor(qr.bgColor || "#ffffff"); setEyeColor(qr.eyeColor || "");
    setLogoUrl(qr.logoUrl || ""); setLogoFileName(""); setLogoSize(qr.logoSize ?? 17); setLogoPadding(qr.logoPadding ?? 4); setRemoveBehindLogo(qr.removeBehindLogo !== false);
    setSize(qr.size || 512); setEcLevel(qr.ecLevel || "M"); setQuietZone(qr.quietZone ?? 10); setEyeRadius(qr.eyeRadius ?? 8); setQrStyle(qr.qrStyle || "dots");
    setTrackingUrl(qr.trackingUrl || ""); setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("info", `Editing “${qr.title || "Untitled"}”`);
  };

  const toggle = async (qr) => {
    try { await request(`/api/qr/${qr._id}`, { method: "PUT", body: { status: qr.status === "paused" ? "active" : "paused" } }); toast("success", qr.status === "paused" ? "QR code resumed" : "QR code paused. Scans show an “unavailable” page."); reload(); }
    catch (e) { toast("error", e.message); }
  };

  const copyText = async (text, what) => { try { await navigator.clipboard.writeText(text); toast("success", `${what} copied`); } catch { toast("error", "Couldn't copy automatically."); } };

  const downloadPng = () => {
    const el = document.getElementById("qs-qr");
    if (!el) return toast("error", "Generate a valid QR code first.");
    try {
      const done = (blob) => (blob ? (saveBlob(blob, `${slug(title)}.png`), toast("success", "PNG downloaded")) : toast("error", "PNG creation failed."));
      if (el.tagName.toLowerCase() === "canvas") return el.toBlob(done, "image/png");
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = c.height = size;
        const ctx = c.getContext("2d"); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size); ctx.drawImage(img, 0, 0, size, size);
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

  return (
    <>
      <MiniStats items={[["Campaigns", fmtNum(saved.length)], ["Total scans", fmtNum(totalScans)], ["Most scanned", saved.length ? [...saved].sort((a, b) => (b.scansCount || 0) - (a.scansCount || 0))[0].title : "—"]]} />
      <div className="qs-grid">
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
                aria-invalid={!!phoneError} aria-describedby="qs-phone-help" onBlur={() => setTouched(true)}
                onChange={(e) => { setPhoneNumber(e.target.value); if (!activeId) setTrackingUrl(""); }} />
              <small id="qs-phone-help" className={phoneError ? "err" : ""}>{phoneError || "Country code first, digits only. Example: 923001234567."}</small>
            </div>
            <div className="qs-field">
              <label htmlFor="qs-msg">Message people send first</label>
              <textarea id="qs-msg" className="qs-input" rows={3} value={defaultMessage} onChange={(e) => setDefaultMessage(e.target.value)} placeholder="Hello, I'd like to know more about…" />
              <small>Optional. It appears ready to send when someone scans the code.</small>
            </div>
            {activeId && <div className="qs-note"><Icon name="info" size={16} />You are editing a saved campaign. Content changes apply to the code that is already printed once you click Update.</div>}
          </section>

          <section className="qs-card">
            <h2 className="qs-h2">Appearance</h2>
            <div className="qs-field">
              <span className="qs-lbl">Quick themes</span>
              <div className="qs-themes">
                {THEMES.map((t) => (
                  <button type="button" key={t.name} className="qs-theme" onClick={() => applyTheme(t)} aria-label={`Apply ${t.name} theme`}>
                    <span style={{ background: t.bg, color: t.fg }}><Icon name="qr" size={18} /></span>{t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="qs-two">
              <ColorField id="qs-fg" label="Pattern color" value={fgColor} onChange={setFgColor} />
              <ColorField id="qs-bg" label="Background color" value={bgColor} onChange={setBgColor} />
            </div>
            {warning && <div className="qs-note qs-note--warn" role="alert"><Icon name="alert" size={16} />{warning}</div>}
            <div className="qs-field">
              <span className="qs-lbl">Pattern style</span>
              <Segmented label="Pattern style" value={qrStyle} onChange={setQrStyle} options={[{ value: "squares", label: "Squares" }, { value: "dots", label: "Dots" }, { value: "fluid", label: "Fluid" }]} />
            </div>
            <div className="qs-field">
              <span className="qs-lbl">Logo</span>
              <div className={`qs-drop${dragging ? " drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleLogoUpload(e.dataTransfer?.files?.[0]); }}>
                {logoUrl ? (<>
                  <img src={logoUrl} alt="" className="qs-logo-thumb" />
                  <div className="qs-drop-text"><b>{logoFileName || "Logo image"}</b><span>Shown in the centre of the code</span></div>
                  <button type="button" className="qs-btn qs-btn--sm" onClick={removeLogo}>Remove</button>
                </>) : (<>
                  <span className="qs-drop-ico"><Icon name="image" size={20} /></span>
                  <div className="qs-drop-text"><b>Drop an image here</b><span>PNG, JPEG, WebP or SVG, up to 2 MB</span></div>
                  <button type="button" className="qs-btn qs-btn--sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} />Choose file</button>
                </>)}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
              </div>
              {logoWarn && <div className="qs-note qs-note--warn" role="alert"><Icon name="alert" size={16} />{logoWarn}</div>}
            </div>

            <details className="qs-adv">
              <summary><Icon name="chevDown" size={15} />Advanced options</summary>
              <div className="qs-adv-body">
                <div className="qs-two">
                  <ColorField id="qs-eye" label="Corner eye color" value={eyeColor || fgColor} onChange={setEyeColor} allowEmpty emptyHint="Same as pattern" />
                  <div className="qs-field"><label htmlFor="qs-ec">Error correction</label>
                    <select id="qs-ec" className="qs-select qs-select--full" value={ecLevel} onChange={(e) => setEcLevel(e.target.value)}>
                      <option value="L">Low (7%)</option><option value="M">Medium (15%)</option><option value="Q">Quartile (25%)</option><option value="H">High (30%), best with logo</option>
                    </select></div>
                </div>
                <Range id="qs-sz" label="Export size" unit="px" min={256} max={1536} step={64} value={size} onChange={setSize} />
                <Range id="qs-qz" label="Quiet zone (margin)" unit="px" min={0} max={40} value={quietZone} onChange={setQuietZone} />
                <Range id="qs-er" label="Corner roundness" unit="" min={0} max={50} value={eyeRadius} onChange={setEyeRadius} />
                {logoUrl && (<>
                  <Range id="qs-ls" label="Logo size" unit="%" min={8} max={30} value={logoSize} onChange={setLogoSize} />
                  <Range id="qs-lp" label="Logo padding" unit="px" min={0} max={20} value={logoPadding} onChange={setLogoPadding} />
                  <Switch checked={removeBehindLogo} onChange={setRemoveBehindLogo} label="Clear code behind logo" hint="Keeps the logo crisp" />
                </>)}
              </div>
            </details>
          </section>
        </div>

        <aside className="qs-preview qs-card" aria-label="Preview">
          <div className="qs-prev-head">
            <h2 className="qs-h2" style={{ margin: 0 }}>Preview</h2>
            <span className={`qs-pill ${trackingUrl ? "on" : "off"}`}><i />{trackingUrl ? "Tracking on" : "Not tracked yet"}</span>
          </div>
          <div className="qs-stage" style={{ background: phoneValid ? bgColor : undefined }}>
            {phoneValid ? (
              <div className="qs-qr">
                <QRCode id="qs-qr" value={qrValue} size={size} fgColor={fgColor} bgColor={bgColor} eyeColor={eyeColor || undefined}
                  logoImage={logoUrl || undefined} logoWidth={Math.round(size * (logoSize / 100))} logoHeight={Math.round(size * (logoSize / 100))}
                  logoPadding={logoPadding} removeQrCodeBehindLogo={removeBehindLogo} ecLevel={ecLevel} quietZone={quietZone} qrStyle={qrStyle} eyeRadius={eyeRadius} enableCORS renderAs="svg" />
              </div>
            ) : (
              <div className="qs-placeholder"><Icon name="qr" size={28} /><b>Your code appears here</b><span>Enter a WhatsApp number to generate it.</span></div>
            )}
          </div>
          {phoneValid && (
            <div className="qs-linkrow">
              <code title={qrValue}>{qrValue}</code>
              <button type="button" className="qs-iconbtn" aria-label="Copy link" onClick={() => copyText(qrValue, "Link")}><Icon name="copy" size={16} /></button>
              <a className="qs-iconbtn" href={rawWaLink} target="_blank" rel="noopener noreferrer" aria-label="Test the chat (not counted as a scan)" title="Test the chat (not counted as a scan)"><Icon name="external" size={16} /></a>
            </div>
          )}
          <div className="qs-export">
            {activeId ? (<>
              <button type="button" className="qs-btn qs-btn--primary" onClick={() => save(false)} disabled={saving}>{saving ? "Saving…" : "Update campaign"}</button>
              <button type="button" className="qs-btn" onClick={() => save(true)} disabled={saving}>Save as new</button>
              <button type="button" className="qs-btn" onClick={resetForm}>New</button>
            </>) : (
              <button type="button" className="qs-btn qs-btn--primary" onClick={() => save(false)} disabled={saving}>{saving ? "Saving…" : "Save campaign"}</button>
            )}
          </div>
          <div className="qs-export">
            <button type="button" className="qs-btn" onClick={downloadPng} disabled={!phoneValid}><Icon name="download" size={15} />PNG</button>
            {svgOk && <button type="button" className="qs-btn" onClick={downloadSvg} disabled={!phoneValid}><Icon name="download" size={15} />SVG</button>}
          </div>
          {!trackingUrl && phoneValid && <small className="qs-hint-text">Save the campaign before printing. An unsaved code goes straight to WhatsApp and can't be counted.</small>}
        </aside>
      </div>

      <section className="qs-card qs-saved" style={{ marginTop: 20 }}>
        <Toolbar count={saved.length} noun="campaign" {...view} sorts={[["recent", "Newest first"], ["scans_desc", "Most scans"], ["scans_asc", "Fewest scans"], ["title", "Title, A to Z"]]} />
        <ListState loading={loading && !saved.length} error={error} empty={!view.total} emptyTitle={saved.length ? "No matches" : "No campaigns yet"} emptyText={saved.length ? "Try a different search." : "Fill in the form above and save it to start counting scans."} onRetry={reload} />
        {!loading && !error && view.total > 0 && (<>
          <div className="qs-scroll"><table className="qs-table">
            <thead><tr><th>Campaign</th><th>Scans</th><th>Last 14 days</th><th>Last scan</th><th>Created</th><th><span className="qs-sr">Actions</span></th></tr></thead>
            <tbody>{view.rows.map((qr) => (
              <tr key={qr._id} className={activeId === qr._id ? "sel" : ""} onClick={() => selectQr(qr)}>
                <td><div className="qs-name">{qr.title || "Untitled"} <StatusPill state={itemState(qr)} /></div><div className="qs-num">+{qr.phoneNumber}</div></td>
                <td className="qs-scans">{fmtNum(qr.scansCount)}</td>
                <td><Spark data={qr.spark} color={TYPE_META.qr.color} /></td>
                <td className="qs-time">{timeAgo(qr.lastScannedAt)}</td>
                <td className="qs-time">{fmtDate(qr.createdAt)}</td>
                <td><RowActions paused={qr.status === "paused"}
                  extra={<button type="button" className="qs-iconbtn" aria-label="Copy tracking link" title="Copy tracking link" onClick={(e) => { e.stopPropagation(); copyText(qr.trackingUrl, "Tracking link"); }}><Icon name="copy" size={16} /></button>}
                  onStats={() => onStats({ id: qr._id, type: "qr", title: qr.title, sub: `+${qr.phoneNumber}` })} onEdit={() => selectQr(qr)} onToggle={() => toggle(qr)}
                  onDelete={() => askDelete({ title: qr.title, noun: "campaign", note: "Printed codes will stop working.", run: async () => { await request(`/api/qr/${qr._id}`, { method: "DELETE" }); if (activeId === qr._id) { setActiveId(null); setTrackingUrl(""); } reload(); } })} /></td>
              </tr>))}</tbody></table></div>
          <Pager page={view.page} total={view.totalPages} onChange={view.setPage} />
        </>)}
      </section>
    </>
  );
}

function Range({ id, label, unit, min, max, step = 1, value, onChange }) {
  return (
    <div className="qs-field qs-range">
      <label htmlFor={id}>{label}<b>{value}{unit}</b></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

/* ───────────── SHORT LINKS TAB ───────────── */
function ShortLinksTab({ toast, onStats, askDelete, refreshKey }) {
  const { items, loading, error, reload } = useList("/api/short-links", refreshKey);
  const [f, setF] = useState({ title: "", phone: "", slug: "", msg: "", expiresAt: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [slugState, setSlugState] = useState({ s: "idle", msg: "" });
  const view = useListView(items, {
    fields: ["title", "slug", "phoneNumber"],
    sorters: { recent: byNewest, clicks: (a, b) => (b.clicks || 0) - (a.clicks || 0), title: (a, b) => (a.title || "").localeCompare(b.title || "") }, initial: "recent",
  });
  const total = items.reduce((n, l) => n + (l.clicks || 0), 0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const s = f.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!s) { setSlugState({ s: "idle", msg: "" }); return undefined; }
    if (s.length < 3) { setSlugState({ s: "bad", msg: "Use at least 3 characters." }); return undefined; }
    setSlugState({ s: "checking", msg: "Checking…" });
    const t = setTimeout(async () => {
      try { const d = await request(`/api/short-links/check-slug/${encodeURIComponent(s)}`); setSlugState(d.available ? { s: "ok", msg: "Available" } : { s: "bad", msg: d.reason || "Not available" }); }
      catch { setSlugState({ s: "idle", msg: "" }); }
    }, 400);
    return () => clearTimeout(t);
  }, [f.slug]);

  const phoneDigits = f.phone.replace(/\D/g, "");
  const create = async () => {
    if (phoneDigits.length < 8 || phoneDigits.length > 15) return toast("error", "Enter the WhatsApp number with country code (8–15 digits).");
    if (slugState.s === "bad") return toast("error", slugState.msg);
    setCreating(true);
    try {
      const d = await request("/api/short-links/create", { method: "POST", body: { title: f.title || "Untitled Short Link", slug: f.slug, phoneNumber: f.phone, defaultMessage: f.msg, expiresAt: f.expiresAt || null } });
      try { await navigator.clipboard.writeText(d.data.shortUrl); toast("success", "Short link created and copied"); } catch { toast("success", "Short link created"); }
      setF({ title: "", phone: "", slug: "", msg: "", expiresAt: "" }); reload();
    } catch (e) { toast("error", e.message); } finally { setCreating(false); }
  };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast("success", "Short link copied"); } catch { toast("error", "Couldn't copy automatically."); } };
  const toggle = async (l) => { try { await request(`/api/short-links/${l._id}`, { method: "PUT", body: { status: l.status === "paused" ? "active" : "paused" } }); reload(); } catch (e) { toast("error", e.message); } };
  const host = API_BASE_URL.replace(/^https?:\/\//, "");

  return (
    <>
      <MiniStats items={[["Links", fmtNum(items.length)], ["Total clicks", fmtNum(total)], ["Top link", items.length ? [...items].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0].title : "—"]]} />
      <div className="qs-grid">
        <div className="qs-form">
          <section className="qs-card">
            <h2 className="qs-h2">Create short link</h2>
            <p className="qs-help">A short, memorable link that opens a WhatsApp chat. Put it in your Instagram bio, SMS, email or ads and see every click.</p>
            <div className="qs-field"><label htmlFor="sl-t">Title</label><input id="sl-t" className="qs-input" placeholder="Summer promo, Instagram bio" value={f.title} onChange={set("title")} maxLength={80} /></div>
            <div className="qs-field"><label htmlFor="sl-p">WhatsApp number</label><input id="sl-p" className="qs-input" inputMode="numeric" placeholder="923001234567" value={f.phone} onChange={set("phone")} /><small>Country code first, digits only.</small></div>
            <div className="qs-field"><label htmlFor="sl-s">Custom slug <span className="qs-opt">optional</span></label>
              <div className="qs-slug"><span>{host}/s/</span><input id="sl-s" className="qs-input" placeholder="summer-sale" value={f.slug} onChange={set("slug")} maxLength={40} /></div>
              <small className={`qs-slug-state ${slugState.s}`} aria-live="polite">{slugState.msg || "Leave empty to get a random one."}</small></div>
            <div className="qs-field"><label htmlFor="sl-m">Message people send first</label><textarea id="sl-m" className="qs-input" rows={3} placeholder="Hi, I am interested in your offer…" value={f.msg} onChange={set("msg")} /></div>
            <div className="qs-field"><label htmlFor="sl-e">Expires on <span className="qs-opt">optional</span></label><input id="sl-e" type="date" className="qs-input" min={new Date().toISOString().slice(0, 10)} value={f.expiresAt} onChange={set("expiresAt")} /><small>After this date the link shows an “unavailable” page.</small></div>
            <button type="button" className="qs-btn qs-btn--primary" onClick={create} disabled={creating}>{creating ? "Creating…" : "Create short link"}</button>
          </section>
        </div>
        <section className="qs-card">
          <Toolbar count={items.length} noun="short link" {...view} sorts={[["recent", "Newest first"], ["clicks", "Most clicks"], ["title", "Title, A to Z"]]} />
          <ListState loading={loading && !items.length} error={error} empty={!view.total} emptyTitle={items.length ? "No matches" : "No short links yet"} emptyText={items.length ? "Try a different search." : "Create your first click-to-chat link with the form."} onRetry={reload} />
          {!loading && !error && view.total > 0 && (<>
            <ul className="qs-cards">{view.rows.map((l) => (
              <li key={l._id} className="qs-item">
                <div className="qs-item-main">
                  <div className="qs-name">{l.title} <StatusPill state={itemState(l)} /></div>
                  <button type="button" className="qs-url" onClick={() => copy(l.shortUrl)} title="Copy link"><code>{l.shortUrl.replace(/^https?:\/\//, "")}</code><Icon name="copy" size={13} /></button>
                  <div className="qs-num">+{l.phoneNumber}{l.expiresAt ? ` · expires ${fmtDate(l.expiresAt)}` : ""} · last click {timeAgo(l.lastClickedAt)}</div>
                </div>
                <div className="qs-item-stat"><b>{fmtNum(l.clicks)}</b><span>clicks</span></div>
                <div className="qs-item-spark"><Spark data={l.spark} color={TYPE_META.shortlink.color} /></div>
                <RowActions paused={l.status === "paused"}
                  extra={<a className="qs-iconbtn" href={l.shortUrl} target="_blank" rel="noopener noreferrer" aria-label="Open link (counts as a click)" title="Open link (counts as a click)"><Icon name="external" size={16} /></a>}
                  onStats={() => onStats({ id: l._id, type: "shortlink", title: l.title, sub: l.shortUrl })}
                  onEdit={() => setEditing(l)} onToggle={() => toggle(l)}
                  onDelete={() => askDelete({ title: l.title, noun: "short link", note: "The link will stop working. Past clicks stay in your analytics.", run: async () => { await request(`/api/short-links/${l._id}`, { method: "DELETE" }); reload(); } })} />
              </li>))}</ul>
            <Pager page={view.page} total={view.totalPages} onChange={view.setPage} />
          </>)}
        </section>
      </div>
      <AnimatePresence>{editing && (
        <EditModal title="Edit short link" initial={{ title: editing.title, phoneNumber: editing.phoneNumber, defaultMessage: editing.defaultMessage, expiresAt: toDateInput(editing.expiresAt) }}
          fields={[{ key: "title", label: "Title" }, { key: "phoneNumber", label: "WhatsApp number" }, { key: "defaultMessage", label: "Message people send first", textarea: true }, { key: "expiresAt", label: "Expires on", type: "date", help: "Leave empty for no expiry. The slug can't be changed so shared links never break." }]}
          onClose={() => setEditing(null)}
          onSave={async (v) => { await request(`/api/short-links/${editing._id}`, { method: "PUT", body: { ...v, expiresAt: v.expiresAt || null } }); toast("success", "Short link updated"); reload(); }} />
      )}</AnimatePresence>
    </>
  );
}

/* ───────────── CTA TAB ───────────── */
function CtaTab({ toast, onStats, askDelete, refreshKey }) {
  const { items, loading, error, reload } = useList("/api/cta-urls", refreshKey);
  const [f, setF] = useState({ label: "", url: "", utmSource: "", utmMedium: "", utmCampaign: "", expiresAt: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const view = useListView(items, {
    fields: ["label", "targetUrl", "code"],
    sorters: { recent: byNewest, clicks: (a, b) => (b.clicks || 0) - (a.clicks || 0), title: (a, b) => (a.label || "").localeCompare(b.label || "") }, initial: "recent",
  });
  const total = items.reduce((n, c) => n + (c.clicks || 0), 0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const finalUrl = useMemo(() => {
    if (!f.url.trim()) return "";
    try {
      const u = new URL(/^https?:\/\//i.test(f.url.trim()) ? f.url.trim() : `https://${f.url.trim()}`);
      [["utm_source", f.utmSource], ["utm_medium", f.utmMedium], ["utm_campaign", f.utmCampaign]].forEach(([k, v]) => { if (v && !u.searchParams.has(k)) u.searchParams.set(k, v); });
      return u.toString();
    } catch { return ""; }
  }, [f]);

  const create = async () => {
    if (!f.label.trim() || !f.url.trim()) return toast("error", "Button label and website URL are required.");
    if (!finalUrl) return toast("error", "Enter a valid website URL.");
    setCreating(true);
    try {
      await request("/api/cta-urls/create", { method: "POST", body: { label: f.label, targetUrl: f.url, utmSource: f.utmSource, utmMedium: f.utmMedium, utmCampaign: f.utmCampaign, expiresAt: f.expiresAt || null } });
      toast("success", "CTA URL saved"); setF({ label: "", url: "", utmSource: "", utmMedium: "", utmCampaign: "", expiresAt: "" }); reload();
    } catch (e) { toast("error", e.message); } finally { setCreating(false); }
  };
  const copy = async (t, w) => { try { await navigator.clipboard.writeText(t); toast("success", `${w} copied`); } catch { toast("error", "Couldn't copy automatically."); } };
  const toggle = async (c) => { try { await request(`/api/cta-urls/${c._id}`, { method: "PUT", body: { status: c.status === "paused" ? "active" : "paused" } }); reload(); } catch (e) { toast("error", e.message); } };

  return (
    <>
      <MiniStats items={[["CTA URLs", fmtNum(items.length)], ["Total clicks", fmtNum(total)], ["Top button", items.length ? [...items].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0].label : "—"]]} />
      <div className="qs-grid">
        <div className="qs-form">
          <section className="qs-card">
            <h2 className="qs-h2">Create CTA URL</h2>
            <p className="qs-help">Use these as the website button in your WhatsApp Cloud API templates and interactive messages. Every tap goes through a tracking link, so you see how many customers clicked.</p>
            <div className="qs-field"><label htmlFor="ct-l">Button label</label><input id="ct-l" className="qs-input" placeholder="Shop now, Track my order" value={f.label} onChange={set("label")} maxLength={60} /><small>WhatsApp shows button text up to 25 characters.</small></div>
            <div className="qs-field"><label htmlFor="ct-u">Destination URL</label><input id="ct-u" className="qs-input" placeholder="https://example.com/offer" value={f.url} onChange={set("url")} /></div>
            <details className="qs-adv">
              <summary><Icon name="chevDown" size={15} />Campaign tags (UTM)</summary>
              <div className="qs-adv-body">
                <div className="qs-field"><label htmlFor="ct-us">Source</label><input id="ct-us" className="qs-input" placeholder="whatsapp" value={f.utmSource} onChange={set("utmSource")} /></div>
                <div className="qs-two">
                  <div className="qs-field"><label htmlFor="ct-um">Medium</label><input id="ct-um" className="qs-input" placeholder="broadcast" value={f.utmMedium} onChange={set("utmMedium")} /></div>
                  <div className="qs-field"><label htmlFor="ct-uc">Campaign</label><input id="ct-uc" className="qs-input" placeholder="eid-sale" value={f.utmCampaign} onChange={set("utmCampaign")} /></div>
                </div>
                {finalUrl && <small className="qs-final"><b>Visitors land on:</b> <code>{finalUrl}</code></small>}
              </div>
            </details>
            <div className="qs-field"><label htmlFor="ct-e">Expires on <span className="qs-opt">optional</span></label><input id="ct-e" type="date" className="qs-input" min={new Date().toISOString().slice(0, 10)} value={f.expiresAt} onChange={set("expiresAt")} /></div>
            <button type="button" className="qs-btn qs-btn--primary" onClick={create} disabled={creating}>{creating ? "Saving…" : "Save CTA URL"}</button>
          </section>
          <section className="qs-card qs-howto">
            <h2 className="qs-h2">Using it in a WhatsApp template</h2>
            <ol>
              <li>In your template, add a <b>Visit website</b> button and choose <b>Dynamic</b> URL.</li>
              <li>Set the URL to <code>{API_BASE_URL}/c/{"{{1}}"}</code>.</li>
              <li>When you send, pass the CTA’s <b>code</b> (copy it from the list) as the variable.</li>
            </ol>
          </section>
        </div>
        <section className="qs-card">
          <Toolbar count={items.length} noun="CTA URL" {...view} sorts={[["recent", "Newest first"], ["clicks", "Most clicks"], ["title", "Label, A to Z"]]} />
          <ListState loading={loading && !items.length} error={error} empty={!view.total} emptyTitle={items.length ? "No matches" : "No CTA URLs yet"} emptyText={items.length ? "Try a different search." : "Add your first tracked button link with the form."} onRetry={reload} />
          {!loading && !error && view.total > 0 && (<>
            <ul className="qs-cards">{view.rows.map((c) => (
              <li key={c._id} className="qs-item">
                <div className="qs-item-main">
                  <div className="qs-name">{c.label} <StatusPill state={itemState(c)} /></div>
                  <button type="button" className="qs-url" onClick={() => copy(c.trackUrl, "Tracking link")} title="Copy tracking link"><code>{c.trackUrl.replace(/^https?:\/\//, "")}</code><Icon name="copy" size={13} /></button>
                  <div className="qs-num qs-trunc" title={c.targetUrl}>→ {c.targetUrl}</div>
                  <div className="qs-num">Code <button type="button" className="qs-code" onClick={() => copy(c.code, "Code")}>{c.code}</button>{c.utmCampaign ? ` · utm: ${c.utmCampaign}` : ""} · last click {timeAgo(c.lastClickedAt)}</div>
                </div>
                <div className="qs-item-stat"><b>{fmtNum(c.clicks)}</b><span>clicks</span></div>
                <div className="qs-item-spark"><Spark data={c.spark} color={TYPE_META.cta.color} /></div>
                <RowActions paused={c.status === "paused"}
                  onStats={() => onStats({ id: c._id, type: "cta", title: c.label, sub: c.targetUrl })} onEdit={() => setEditing(c)} onToggle={() => toggle(c)}
                  onDelete={() => askDelete({ title: c.label, noun: "CTA URL", note: "Buttons using this link will stop working.", run: async () => { await request(`/api/cta-urls/${c._id}`, { method: "DELETE" }); reload(); } })} />
              </li>))}</ul>
            <Pager page={view.page} total={view.totalPages} onChange={view.setPage} />
          </>)}
        </section>
      </div>
      <AnimatePresence>{editing && (
        <EditModal title="Edit CTA URL" initial={{ label: editing.label, targetUrl: editing.targetUrl, utmSource: editing.utmSource, utmMedium: editing.utmMedium, utmCampaign: editing.utmCampaign, expiresAt: toDateInput(editing.expiresAt) }}
          fields={[{ key: "label", label: "Button label" }, { key: "targetUrl", label: "Destination URL" }, { key: "utmSource", label: "UTM source" }, { key: "utmMedium", label: "UTM medium" }, { key: "utmCampaign", label: "UTM campaign" }, { key: "expiresAt", label: "Expires on", type: "date", help: "Leave empty for no expiry. The tracking link and code stay the same." }]}
          onClose={() => setEditing(null)}
          onSave={async (v) => { await request(`/api/cta-urls/${editing._id}`, { method: "PUT", body: { ...v, expiresAt: v.expiresAt || null } }); toast("success", "CTA URL updated"); reload(); }} />
      )}</AnimatePresence>
    </>
  );
}

/* ───────────── WIDGET TAB ───────────── */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_CFG = { enabled: true, phoneNumber: "", title: "Support Team", subtitle: "Typically replies within minutes", welcomeMessage: "Hi! How can we help you?", prefilledMessage: "Hi! I have a question.", buttonLabel: "Chat on WhatsApp", offlineMessage: "We're offline right now. Leave a message and we'll reply when we're back.", position: "right", brandColor: "#128C7E", showBadge: true, autoOpenDelay: 0, showOnMobile: true, showOnDesktop: true, hours: { enabled: false, timezone: TZ, start: "09:00", end: "18:00", days: [1, 2, 3, 4, 5] } };

function WidgetPreview({ c }) {
  const [open, setOpen] = useState(true);
  const left = c.position === "left";
  return (
    <div className="qs-wprev" aria-label="Widget preview">
      <div className="qs-wprev-bar"><i /><i /><i /><span>yourwebsite.com</span></div>
      <div className="qs-wprev-page" aria-hidden="true"><div /><div /><div style={{ width: "60%" }} /></div>
      <div className="qs-wprev-dock" style={{ [left ? "left" : "right"]: 14, alignItems: left ? "flex-start" : "flex-end" }}>
        {open && (
          <div className="qs-wcard">
            <div className="qs-wcard-head" style={{ background: c.brandColor }}>
              <span className="qs-wav">{(c.title || "S").trim().charAt(0).toUpperCase()}</span>
              <div><b>{c.title || "Support"}</b><small><i />{c.hours.enabled ? "Online during business hours" : c.subtitle}</small></div>
              <button type="button" aria-label="Close preview" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="qs-wcard-body"><p>{c.welcomeMessage || "Hi! How can we help you?"}</p></div>
            <div className="qs-wcard-foot"><span style={{ background: c.brandColor }}>{c.buttonLabel || "Chat on WhatsApp"}</span></div>
          </div>
        )}
        <button type="button" className="qs-wfab" style={{ background: c.brandColor }} aria-label={open ? "Hide preview chat" : "Show preview chat"} onClick={() => setOpen(!open)}>
          <Icon name="widget" size={26} />{c.showBadge && !open && <i />}
        </button>
      </div>
    </div>
  );
}

function WidgetTab({ toast, refreshKey }) {
  const [cfg, setCfg] = useState(null);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await request("/api/widgets/config");
      const merged = { ...DEFAULT_CFG, ...d.data, hours: { ...DEFAULT_CFG.hours, ...(d.data.hours || {}) } };
      setCfg(merged); setSaved(JSON.stringify(merged)); setError("");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) return <div className="qs-card" aria-busy="true"><div className="qs-skel" /><div className="qs-skel" /></div>;
  if (error || !cfg) return <ListState error={error || "Could not load widget settings."} onRetry={load} />;

  const set = (k, v) => setCfg({ ...cfg, [k]: v });
  const setH = (k, v) => setCfg({ ...cfg, hours: { ...cfg.hours, [k]: v } });
  const dirty = JSON.stringify(cfg) !== saved;
  const digits = (cfg.phoneNumber || "").replace(/\D/g, "");
  const phoneOk = digits.length >= 8 && digits.length <= 15;
  const phoneErr = touched && !phoneOk ? "Enter the number with country code, 8 to 15 digits." : "";
  const embed = `<script src="${API_BASE_URL}/widget.js" data-key="${cfg.publicKey || ""}" async></script>`;
  const timezones = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return [TZ, "UTC", "Asia/Karachi", "Asia/Dubai", "Europe/London", "America/New_York"]; } })();

  const save = async () => {
    setTouched(true);
    if (!phoneOk) return toast("error", "Enter a valid WhatsApp number first.");
    setSaving(true);
    try {
      const d = await request("/api/widgets/config", { method: "POST", body: { ...cfg, phoneNumber: digits } });
      const merged = { ...DEFAULT_CFG, ...d.data, hours: { ...DEFAULT_CFG.hours, ...(d.data.hours || {}) } };
      setCfg(merged); setSaved(JSON.stringify(merged)); toast("success", "Widget saved. Live on your site within a minute.");
    } catch (e) { toast("error", e.message); } finally { setSaving(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(embed); toast("success", "Embed code copied"); } catch { toast("error", "Couldn't copy automatically."); } };

  return (
    <>
      <div className="qs-note"><Icon name="info" size={16} />This is the floating WhatsApp chat button that sits in the corner of your website. Visitors tap it and start a WhatsApp conversation with your business number.</div>
      <div className="qs-grid" style={{ marginTop: 16 }}>
        <div className="qs-form">
          <section className="qs-card">
            <div className="qs-panel-head"><h2 className="qs-h2" style={{ margin: 0 }}>Chat button</h2>
              <Switch checked={cfg.enabled} onChange={(v) => set("enabled", v)} label={cfg.enabled ? "Live" : "Hidden"} /></div>
            <div className="qs-field"><label htmlFor="w-p">WhatsApp number</label>
              <input id="w-p" className={`qs-input${phoneErr ? " err" : ""}`} inputMode="numeric" placeholder="923001234567" value={cfg.phoneNumber} onBlur={() => setTouched(true)} onChange={(e) => set("phoneNumber", e.target.value)} aria-invalid={!!phoneErr} />
              <small className={phoneErr ? "err" : ""}>{phoneErr || "Country code first, digits only."}</small></div>
            <div className="qs-two">
              <div className="qs-field"><label htmlFor="w-t">Name shown</label><input id="w-t" className="qs-input" maxLength={60} value={cfg.title} onChange={(e) => set("title", e.target.value)} /></div>
              <div className="qs-field"><label htmlFor="w-st">Status line</label><input id="w-st" className="qs-input" maxLength={80} value={cfg.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></div>
            </div>
            <div className="qs-field"><label htmlFor="w-w">Greeting bubble</label><textarea id="w-w" className="qs-input" rows={2} maxLength={300} value={cfg.welcomeMessage} onChange={(e) => set("welcomeMessage", e.target.value)} /></div>
            <div className="qs-field"><label htmlFor="w-pm">Message the visitor sends first</label><textarea id="w-pm" className="qs-input" rows={2} maxLength={300} value={cfg.prefilledMessage} onChange={(e) => set("prefilledMessage", e.target.value)} /><small>Pre-filled in WhatsApp. They can edit it before sending.</small></div>
            <div className="qs-field"><label htmlFor="w-b">Button text</label><input id="w-b" className="qs-input" maxLength={40} value={cfg.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} /></div>
          </section>

          <section className="qs-card">
            <h2 className="qs-h2">Look and behaviour</h2>
            <div className="qs-two">
              <ColorField id="w-c" label="Brand color" value={cfg.brandColor} onChange={(v) => set("brandColor", v)} />
              <div className="qs-field"><span className="qs-lbl">Position</span><Segmented label="Position" value={cfg.position} onChange={(v) => set("position", v)} options={[{ value: "left", label: "Bottom left" }, { value: "right", label: "Bottom right" }]} /></div>
            </div>
            {(lum(cfg.brandColor) ?? 0) > 0.5 && <div className="qs-note qs-note--warn" role="alert"><Icon name="alert" size={16} />White text on this color is hard to read. Pick a darker brand color.</div>}
            <Range id="w-ad" label="Open the chat automatically after" unit=" s" min={0} max={60} value={cfg.autoOpenDelay} onChange={(v) => set("autoOpenDelay", v)} />
            <small className="qs-hint-text" style={{ marginTop: -6, display: "block" }}>{cfg.autoOpenDelay ? `Opens once per visit after ${cfg.autoOpenDelay} seconds.` : "0 means it never opens by itself."}</small>
            <Switch checked={cfg.showBadge} onChange={(v) => set("showBadge", v)} label="Notification dot" hint="A small red dot that draws the eye" />
            <Switch checked={cfg.showOnDesktop} onChange={(v) => set("showOnDesktop", v)} label="Show on desktop" />
            <Switch checked={cfg.showOnMobile} onChange={(v) => set("showOnMobile", v)} label="Show on mobile" />
          </section>

          <section className="qs-card">
            <h2 className="qs-h2">Business hours</h2>
            <Switch checked={cfg.hours.enabled} onChange={(v) => setH("enabled", v)} label="Show “offline” outside hours" hint="Visitors can still message you, with a different note" />
            {cfg.hours.enabled && (<div className="qs-adv-body" style={{ paddingTop: 12 }}>
              <div className="qs-field"><label htmlFor="w-tz">Time zone</label><input id="w-tz" className="qs-input" list="qs-tzs" value={cfg.hours.timezone} onChange={(e) => setH("timezone", e.target.value)} /><datalist id="qs-tzs">{timezones.map((z) => <option key={z} value={z} />)}</datalist></div>
              <div className="qs-two">
                <div className="qs-field"><label htmlFor="w-hs">Opens</label><input id="w-hs" type="time" className="qs-input" value={cfg.hours.start} onChange={(e) => setH("start", e.target.value)} /></div>
                <div className="qs-field"><label htmlFor="w-he">Closes</label><input id="w-he" type="time" className="qs-input" value={cfg.hours.end} onChange={(e) => setH("end", e.target.value)} /></div>
              </div>
              <div className="qs-field"><span className="qs-lbl">Open on</span>
                <div className="qs-days">{DAYS.map((d, i) => { const on = cfg.hours.days.includes(i); return <button type="button" key={d} aria-pressed={on} className={on ? "on" : ""} onClick={() => setH("days", on ? cfg.hours.days.filter((x) => x !== i) : [...cfg.hours.days, i].sort())}>{d}</button>; })}</div></div>
              <div className="qs-field"><label htmlFor="w-om">Message when offline</label><textarea id="w-om" className="qs-input" rows={2} maxLength={300} value={cfg.offlineMessage} onChange={(e) => set("offlineMessage", e.target.value)} /></div>
            </div>)}
          </section>
        </div>

        <aside className="qs-preview qs-card">
          <div className="qs-prev-head"><h2 className="qs-h2" style={{ margin: 0 }}>Live preview</h2><span className={`qs-pill ${dirty ? "off" : "on"}`}><i />{dirty ? "Unsaved changes" : "Saved"}</span></div>
          <WidgetPreview c={cfg} />
          <div className="qs-export"><button type="button" className="qs-btn qs-btn--primary" onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save widget"}</button>
            <button type="button" className="qs-btn" onClick={() => { setCfg(JSON.parse(saved)); setTouched(false); }} disabled={!dirty}>Discard</button></div>
          <div className="qs-field" style={{ marginTop: 16 }}>
            <span className="qs-lbl">Add it to your website</span>
            <pre className="qs-code-block" tabIndex={0}>{embed}</pre>
            <button type="button" className="qs-btn" onClick={copy} style={{ marginTop: 8 }}><Icon name="copy" size={14} />Copy embed code</button>
            <small className="qs-hint-text">Paste before the closing &lt;/body&gt; tag. The code never changes: edit settings here and your site updates by itself.</small>
          </div>
        </aside>
      </div>
      {cfg._id && (<section style={{ marginTop: 20 }}><h2 className="qs-h2" style={{ marginBottom: 12 }}>Widget performance</h2><AnalyticsPanel itemId={cfg._id} itemType="widget" onToast={toast} /></section>)}
    </>
  );
}

/* ───────────── MAIN ───────────── */
const TABS = [
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "qr", label: "QR codes", icon: "qr" },
  { id: "shortlinks", label: "Short links", icon: "link" },
  { id: "cta", label: "CTA URLs", icon: "cta" },
  { id: "widget", label: "Chat widget", icon: "widget" },
];
const HEADINGS = {
  analytics: ["Analytics", "See every scan and click in real time: who, where, on what device and when."],
  qr: ["QR codes", "Design branded WhatsApp QR codes and track every scan."],
  shortlinks: ["Short links", "Short, shareable click-to-chat links with per-link analytics."],
  cta: ["CTA URLs", "Tracked website buttons for WhatsApp templates and messages."],
  widget: ["Chat widget", "A floating WhatsApp button for your website, with business hours and funnel stats."],
};

export default function QRCodeGenerator() {
  const [tab, setTab] = useState("analytics");
  const [visited, setVisited] = useState({ analytics: true });
  const [toasts, setToasts] = useState([]);
  const [statsItem, setStatsItem] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const toast = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const go = (id) => { setTab(id); setVisited((v) => ({ ...v, [id]: true })); };

  const runDelete = async () => {
    setDeleting(true);
    try { await confirm.run(); toast("success", `${confirm.noun[0].toUpperCase()}${confirm.noun.slice(1)} deleted`); setConfirm(null); }
    catch (e) { toast("error", e.message); } finally { setDeleting(false); }
  };

  const common = { toast, onStats: setStatsItem, askDelete: setConfirm, refreshKey };
  const [h1, h2] = HEADINGS[tab];

  return (
    <MotionConfig reducedMotion="user">
      <div className="qs-root">
        <style>{CSS}</style>
        <div className="qs-wrap">
          <header className="qs-head">
            <div><h1 className="qs-title">{h1}</h1><p className="qs-sub">{h2}</p></div>
            <button type="button" className="qs-btn" onClick={() => setRefreshKey((k) => k + 1)}><Icon name="refresh" size={15} />Refresh</button>
          </header>

          <nav className="qs-tabs-nav" role="tablist" aria-label="Sections">
            {TABS.map((t) => (
              <button type="button" key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} className={`qs-tab-btn${tab === t.id ? " active" : ""}`} onClick={() => go(t.id)}>
                <Icon name={t.icon} size={16} />{t.label}
              </button>
            ))}
          </nav>

          {tab === "analytics" && <div role="tabpanel" id="panel-analytics" aria-labelledby="tab-analytics"><AnalyticsPanel onToast={toast} key={refreshKey} /></div>}
          {visited.qr && <div role="tabpanel" id="panel-qr" aria-labelledby="tab-qr" hidden={tab !== "qr"}><QrTab {...common} /></div>}
          {visited.shortlinks && <div role="tabpanel" id="panel-shortlinks" aria-labelledby="tab-shortlinks" hidden={tab !== "shortlinks"}><ShortLinksTab {...common} /></div>}
          {visited.cta && <div role="tabpanel" id="panel-cta" aria-labelledby="tab-cta" hidden={tab !== "cta"}><CtaTab {...common} /></div>}
          {visited.widget && <div role="tabpanel" id="panel-widget" aria-labelledby="tab-widget" hidden={tab !== "widget"}><WidgetTab {...common} /></div>}
        </div>

        <AnimatePresence>{statsItem && <StatsDrawer item={statsItem} onClose={() => setStatsItem(null)} onToast={toast} />}</AnimatePresence>
        <AnimatePresence>{confirm && (
          <Modal title={`Delete this ${confirm.noun}?`} onClose={() => !deleting && setConfirm(null)} foot={<>
            <button type="button" className="qs-btn" onClick={() => setConfirm(null)} disabled={deleting}>Cancel</button>
            <button type="button" className="qs-btn qs-btn--danger" onClick={runDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button></>}>
            <p className="qs-help" style={{ margin: "0 0 4px" }}><b>{confirm.title || "Untitled"}</b> will be removed. {confirm.note}</p>
          </Modal>
        )}</AnimatePresence>

        <div className="qs-toasts" role="status" aria-live="polite">
          <AnimatePresence>{toasts.map((t) => (
            <motion.div key={t.id} className={`qs-toast qs-toast--${t.type}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <Icon name={t.type === "error" ? "alert" : t.type === "info" ? "info" : "check"} size={16} />{t.text}
            </motion.div>))}</AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

/* ───────────── CSS ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.qs-root{--bg:#F2F4F7;--surface:#fff;--surface-2:#F8F9FB;--line:#E4E7EC;--line-2:#D0D5DD;--ink:#101828;--ink-2:#475467;--ink-3:#667085;--accent:#2F46E0;--accent-soft:#EBEEFF;--ok:#067647;--ok-bg:#E7F6EC;--ok-dot:#12B76A;--warn:#B54708;--warn-bg:#FEF3E2;--warn-dot:#F79009;--bad:#B42318;--bad-bg:#FEECEA;
font-family:"Manrope",system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;color:var(--ink);background:var(--bg);min-height:100vh;padding:clamp(16px,3vw,40px);box-sizing:border-box}
.qs-root *,.qs-root *::before,.qs-root *::after{box-sizing:border-box}
.qs-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.qs-wrap{max-width:1240px;margin:0 auto}
.qs-head{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;margin-bottom:16px}
.qs-title{font-size:clamp(22px,3.4vw,28px);font-weight:800;letter-spacing:-.02em;margin:0}
.qs-sub{margin:4px 0 0;color:var(--ink-3);max-width:62ch}
.qs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.qs-tabs-nav{display:flex;gap:6px;background:var(--surface);padding:6px;border-radius:12px;border:1px solid var(--line);margin-bottom:20px;overflow-x:auto}
.qs-tab-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:8px;border:0;background:transparent;font:inherit;font-weight:600;font-size:13.5px;color:var(--ink-3);cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.qs-tab-btn:hover{color:var(--ink);background:var(--surface-2)}
.qs-tab-btn.active{background:var(--accent-soft);color:var(--accent);font-weight:700}

.qs-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px;min-width:0}
.qs-h2{font-size:16px;font-weight:800;margin:0 0 14px;letter-spacing:-.01em}
.qs-h3{font-size:14px;font-weight:700;margin:0}
.qs-help{margin:-6px 0 16px;color:var(--ink-3);font-size:13.5px}
.qs-meta{margin:2px 0 0;color:var(--ink-3);font-size:12.5px}
.qs-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:20px;align-items:start}
.qs-form{display:grid;gap:20px;min-width:0}
.qs-preview{position:sticky;top:16px}
.qs-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.qs-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.qs-hint{font-size:12px;color:var(--ink-3)}

/* fields */
.qs-field{margin-bottom:14px}
.qs-field label,.qs-lbl{display:block;font-weight:700;font-size:13px;margin-bottom:6px}
.qs-field small{display:block;color:var(--ink-3);font-size:12.5px;margin-top:5px}
.qs-field small.err{color:var(--bad)}
.qs-opt{font-weight:500;color:var(--ink-3);font-size:12px;margin-left:4px}
.qs-input,.qs-select{width:100%;min-height:40px;padding:9px 12px;border:1px solid var(--line-2);border-radius:9px;background:var(--surface);font:inherit;font-size:14px;color:var(--ink)}
textarea.qs-input{resize:vertical}
.qs-input::placeholder{color:#98A2B3}
.qs-input:focus,.qs-select:focus{border-color:var(--accent);outline:2px solid var(--accent-soft);outline-offset:0}
.qs-input.err{border-color:var(--bad)}
.qs-select{width:auto;padding-right:30px;cursor:pointer}.qs-select--full{width:100%}
.qs-color{display:flex;gap:8px}
.qs-color input[type=color]{width:42px;height:40px;padding:3px;border:1px solid var(--line-2);border-radius:9px;background:var(--surface);cursor:pointer;flex:none}
.qs-color .qs-input{font-family:ui-monospace,Menlo,monospace;font-size:13px}
.qs-range label{display:flex;justify-content:space-between}
.qs-range input{width:100%;accent-color:var(--accent)}
.qs-slug{display:flex;align-items:stretch;border:1px solid var(--line-2);border-radius:9px;overflow:hidden;background:var(--surface)}
.qs-slug span{display:grid;place-items:center;padding:0 10px;background:var(--surface-2);color:var(--ink-3);font-size:12.5px;white-space:nowrap;border-right:1px solid var(--line)}
.qs-slug .qs-input{border:0;border-radius:0;outline:0}
.qs-slug:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.qs-slug-state.ok{color:var(--ok)!important}.qs-slug-state.bad{color:var(--bad)!important}

.qs-seg{display:inline-flex;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:3px;gap:2px;flex-wrap:wrap}
.qs-seg button{border:0;background:transparent;padding:7px 12px;border-radius:7px;font:inherit;font-size:13px;font-weight:600;color:var(--ink-3);cursor:pointer}
.qs-seg button[aria-checked=true]{background:var(--surface);color:var(--accent);box-shadow:0 1px 2px rgba(16,24,40,.12)}
.qs-switch{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;cursor:pointer;border-top:1px solid var(--line)}
.qs-switch:first-of-type{border-top:0}
.qs-switch-text{display:grid}.qs-switch-text b{font-weight:700;font-size:13.5px}.qs-switch-text small{color:var(--ink-3);font-size:12.5px}
.qs-switch input{position:absolute;opacity:0;width:1px;height:1px}
.qs-switch i{width:40px;height:23px;border-radius:99px;background:var(--line-2);position:relative;flex:none;transition:background .15s}
.qs-switch i::after{content:"";position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .15s}
.qs-switch input:checked+i{background:var(--ok-dot)}.qs-switch input:checked+i::after{transform:translateX(17px)}
.qs-switch input:focus-visible+i{outline:2px solid var(--accent);outline-offset:2px}
.qs-days{display:flex;gap:6px;flex-wrap:wrap}
.qs-days button{min-width:44px;height:36px;border-radius:8px;border:1px solid var(--line-2);background:var(--surface);font:inherit;font-weight:600;font-size:12.5px;cursor:pointer;color:var(--ink-3)}
.qs-days button.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}

/* buttons */
.qs-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;padding:0 14px;border-radius:9px;border:1px solid var(--line-2);background:var(--surface);font:inherit;font-weight:600;font-size:13.5px;color:var(--ink);cursor:pointer;text-decoration:none;white-space:nowrap}
.qs-btn:hover:not(:disabled){background:var(--surface-2);border-color:#98A2B3}
.qs-btn:disabled{opacity:.55;cursor:not-allowed}
.qs-btn--sm{height:32px;padding:0 11px;font-size:12.5px}
.qs-btn--primary{background:var(--accent);border-color:var(--accent);color:#fff!important}
.qs-btn--primary:hover:not(:disabled){background:#2538C4;border-color:#2538C4}
.qs-btn--danger{background:var(--bad);border-color:var(--bad);color:#fff}.qs-btn--danger:hover:not(:disabled){background:#912018;border-color:#912018}
.qs-iconbtn{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--ink-3);cursor:pointer;text-decoration:none}
.qs-iconbtn:hover:not(:disabled){background:var(--surface-2);border-color:var(--line);color:var(--ink)}
.qs-iconbtn:disabled{opacity:.35;cursor:not-allowed}
.qs-iconbtn--danger:hover:not(:disabled){background:var(--bad-bg);color:var(--bad);border-color:var(--bad-bg)}
.qs-export{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.qs-hint-text{display:block;color:var(--ink-3);font-size:12.5px;margin-top:10px}

/* notes, pills, tags */
.qs-note{display:flex;gap:10px;align-items:flex-start;padding:11px 13px;border-radius:10px;background:var(--accent-soft);color:#1F2FA0;font-size:13px;margin:10px 0}
.qs-note svg{margin-top:2px}
.qs-note--warn{background:var(--warn-bg);color:var(--warn)}.qs-note--bad{background:var(--bad-bg);color:var(--bad);align-items:center}
.qs-pill{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:99px;font-size:11.5px;font-weight:700;vertical-align:middle}
.qs-pill i{width:6px;height:6px;border-radius:50%;background:currentColor}
.qs-pill.on{background:var(--ok-bg);color:var(--ok)}.qs-pill.off{background:var(--warn-bg);color:var(--warn)}.qs-pill.bad{background:var(--bad-bg);color:var(--bad)}
.qs-tag{display:inline-block;padding:2px 9px;border-radius:6px;font-size:11.5px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff)}

/* QR studio */
.qs-themes{display:flex;gap:8px;flex-wrap:wrap}
.qs-theme{display:grid;gap:4px;justify-items:center;border:0;background:none;font:inherit;font-size:12px;font-weight:600;color:var(--ink-2);cursor:pointer;padding:0}
.qs-theme span{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;border:1px solid var(--line-2)}
.qs-theme:hover span{border-color:var(--accent)}
.qs-drop{display:flex;align-items:center;gap:12px;padding:12px;border:1.5px dashed var(--line-2);border-radius:11px;background:var(--surface-2);flex-wrap:wrap}
.qs-drop.drag{border-color:var(--accent);background:var(--accent-soft)}
.qs-drop-ico{width:40px;height:40px;border-radius:10px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;color:var(--ink-3)}
.qs-drop-text{flex:1;min-width:140px;display:grid}.qs-drop-text b{font-size:13px}.qs-drop-text span{font-size:12px;color:var(--ink-3)}
.qs-logo-thumb{width:40px;height:40px;border-radius:9px;object-fit:contain;background:#fff;border:1px solid var(--line)}
.qs-adv{border-top:1px solid var(--line);margin-top:6px;padding-top:6px}
.qs-adv summary{display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:13.5px;padding:8px 0;list-style:none}
.qs-adv summary::-webkit-details-marker{display:none}
.qs-adv[open] summary svg{transform:rotate(180deg)}
.qs-adv-body{padding-top:6px}
.qs-prev-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.qs-stage{display:grid;place-items:center;min-height:300px;padding:22px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)}
.qs-qr{width:100%;max-width:300px}.qs-qr canvas,.qs-qr svg{width:100%!important;height:auto!important;display:block}
.qs-placeholder{display:grid;gap:6px;justify-items:center;text-align:center;color:var(--ink-3);max-width:220px}.qs-placeholder b{color:var(--ink)}
.qs-linkrow{display:flex;align-items:center;gap:6px;margin-top:12px;padding:6px 6px 6px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)}
.qs-linkrow code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:var(--ink-2)}

/* lists */
.qs-saved-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.qs-saved-tools{display:flex;gap:8px;flex-wrap:wrap}
.qs-search{position:relative;display:flex;align-items:center}.qs-search svg{position:absolute;left:11px;color:var(--ink-3)}.qs-search .qs-input{padding-left:34px;width:200px}
.qs-scroll{overflow-x:auto}
.qs-table{width:100%;border-collapse:collapse;min-width:640px}
.qs-table th{text-align:left;font-size:12px;font-weight:700;color:var(--ink-3);padding:8px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.qs-table td{padding:12px;border-bottom:1px solid var(--line);vertical-align:middle}
.qs-table tbody tr{cursor:pointer}.qs-table tbody tr:hover{background:var(--surface-2)}.qs-table tbody tr.sel{background:var(--accent-soft)}
.qs-name{font-weight:700;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.qs-num{font-size:12.5px;color:var(--ink-3)}
.qs-scans{font-weight:800;font-size:16px}.qs-time{color:var(--ink-3);font-size:13px;white-space:nowrap}
.qs-rowact{display:flex;gap:2px;justify-content:flex-end;flex-wrap:wrap}
.qs-spark-empty{color:var(--ink-3);font-size:12px}
.qs-cards{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.qs-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:14px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:12px}
.qs-item:hover{border-color:var(--line-2)}
.qs-item-main{min-width:0;display:grid;gap:3px}
.qs-item-stat{text-align:center;min-width:60px}.qs-item-stat b{display:block;font-size:22px;font-weight:800;line-height:1.1}.qs-item-stat span{font-size:12px;color:var(--ink-3)}
.qs-url{display:inline-flex;align-items:center;gap:8px;max-width:100%;border:0;background:var(--accent-soft);color:var(--accent);padding:4px 9px;border-radius:7px;cursor:pointer;font:inherit;justify-self:start}
.qs-url code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600}
.qs-trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qs-code{border:1px solid var(--line-2);background:var(--surface-2);border-radius:6px;padding:0 7px;font-family:ui-monospace,Menlo,monospace;font-size:12px;cursor:pointer;color:var(--ink)}
.qs-final{word-break:break-all}.qs-final code{font-size:12px}
.qs-howto ol{margin:0;padding-left:20px;color:var(--ink-2);display:grid;gap:8px}.qs-howto code{background:var(--surface-2);padding:1px 6px;border-radius:5px;font-size:12.5px;word-break:break-all}
.qs-pager{display:flex;gap:4px;justify-content:center;margin-top:16px;align-items:center}
.qs-pg{min-width:34px;height:34px;border-radius:8px;border:1px solid var(--line);background:var(--surface);font:inherit;font-weight:600;cursor:pointer}.qs-pg.on{background:var(--accent);border-color:var(--accent);color:#fff}.qs-gap{padding:0 4px;color:var(--ink-3)}
.qs-empty{text-align:center;padding:36px 16px;color:var(--ink-3)}.qs-empty h3{margin:0 0 4px;color:var(--ink);font-size:15px}.qs-empty p{margin:0}
.qs-skel{height:62px;border-radius:12px;margin-bottom:10px;background:linear-gradient(90deg,var(--surface-2),#EDEFF3,var(--surface-2));background-size:200% 100%;animation:qs-sh 1.3s infinite}
.qs-skel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.qs-skel-grid .qs-skel{height:90px;margin:0}
@keyframes qs-sh{to{background-position:-200% 0}}
.qs-mini{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.qs-mini div{flex:1;min-width:150px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;display:grid}
.qs-mini b{font-size:20px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qs-mini span{font-size:12.5px;color:var(--ink-3);font-weight:600}

/* analytics */
.qs-an{display:grid;gap:16px}
.qs-an-bar{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.qs-an-right{margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.qs-chips{display:flex;gap:6px;flex-wrap:wrap}
.qs-chip{height:34px;padding:0 13px;border-radius:99px;border:1px solid var(--line-2);background:var(--surface);font:inherit;font-weight:600;font-size:13px;color:var(--ink-2);cursor:pointer}
.qs-chip.on{background:var(--ink);border-color:var(--ink);color:#fff}
.qs-livebtn{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 12px;border-radius:99px;border:1px solid var(--line-2);background:var(--surface);font:inherit;font-size:12.5px;font-weight:700;color:var(--ink-3);cursor:pointer}
.qs-livebtn i{width:8px;height:8px;border-radius:50%;background:var(--line-2)}.qs-livebtn.on{color:var(--ok)}.qs-livebtn.on i{background:var(--ok-dot);animation:qs-pulse 2s infinite}.qs-livebtn span{font-weight:500;color:var(--ink-3)}
@keyframes qs-pulse{0%{box-shadow:0 0 0 0 rgba(18,183,106,.5)}70%,100%{box-shadow:0 0 0 7px rgba(18,183,106,0)}}
.qs-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.qs-stat-card{display:flex;align-items:flex-start;gap:14px;padding:18px 20px}
.qs-stat-ico{width:44px;height:44px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;border:1px solid var(--line);flex:none}
.qs-stat-val{font-size:26px;font-weight:800;line-height:1.1;letter-spacing:-.02em}.qs-stat-lbl{font-size:12.5px;color:var(--ink-3);font-weight:600;margin-top:2px}.qs-stat-sub{font-size:12px;color:var(--ink-3);margin-top:4px}
.qs-delta{font-size:12px;font-weight:700;margin-top:4px;color:var(--ink-3)}.qs-delta.up{color:var(--ok)}.qs-delta.down{color:var(--bad)}.qs-delta span{font-weight:500;color:var(--ink-3)}
.qs-an-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.qs-an-grid--wide{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}
.qs-legend-inline{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.qs-legend-inline button{display:inline-flex;align-items:center;gap:7px;padding:4px 10px;border-radius:99px;border:1px solid var(--line);background:var(--surface);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--ink-2)}
.qs-legend-inline button.off{opacity:.45;text-decoration:line-through}.qs-legend-inline i,.qs-legend i,.qs-tip i{width:9px;height:9px;border-radius:3px;display:inline-block}
.qs-chart{position:relative;width:100%}.qs-chart svg{display:block;touch-action:pan-y}
.qs-ax{font-size:11px;fill:var(--ink-3);font-family:inherit}
.qs-tip{position:absolute;pointer-events:none;background:var(--ink);color:#fff;border-radius:10px;padding:9px 12px;font-size:12.5px;min-width:140px;box-shadow:0 8px 24px rgba(16,24,40,.25)}
.qs-tip b{display:block;margin-bottom:4px}.qs-tip div{display:flex;align-items:center;gap:7px;padding:1px 0}.qs-tip span{margin-left:auto;font-weight:700}.qs-tip-total{border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:4px!important}
.qs-nodata{padding:22px 8px;text-align:center;color:var(--ink-3);font-size:13px}.qs-nodata--over{padding:10px;background:var(--surface-2);border-radius:9px;margin-bottom:6px}
.qs-donut{display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:center}
.qs-donut-n{font-size:22px;font-weight:800;fill:var(--ink)}
.qs-legend{list-style:none;margin:0;padding:0;display:grid;gap:7px;flex:1;min-width:130px}.qs-legend li{display:flex;align-items:center;gap:8px;font-size:13px}.qs-legend span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qs-legend b{font-weight:700}
.qs-bars,.qs-funnel{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.qs-bars-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-bottom:5px}.qs-bars-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qs-bars-val{font-weight:700;white-space:nowrap}.qs-bars-val em{font-style:normal;font-weight:500;color:var(--ink-3);margin-left:6px}
.qs-flag{margin-right:8px}
.qs-prog-bar{height:8px;width:100%;background:var(--surface-2);border-radius:999px;overflow:hidden;border:1px solid var(--line)}.qs-prog-bar--lg{height:14px}.qs-prog-fill{height:100%;border-radius:999px;transition:width .3s}
.qs-cols{display:flex;gap:3px;height:170px;align-items:stretch}
.qs-col{flex:1;display:flex;flex-direction:column;min-width:0}.qs-col-bar{flex:1;display:flex;align-items:flex-end}.qs-col-bar span{display:block;width:100%;min-height:2px;border-radius:4px 4px 0 0;transition:height .3s}
.qs-col small{font-size:10.5px;color:var(--ink-3);text-align:center;height:16px;white-space:nowrap;margin-top:4px}
.qs-feed{list-style:none;margin:0;padding:0;display:grid}.qs-feed li{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);align-items:flex-start;font-size:13px}.qs-feed li:last-child{border:0}
.qs-feed-dot{width:9px;height:9px;border-radius:50%;margin-top:6px;flex:none}.qs-feed time{margin-left:auto;white-space:nowrap;font-size:12px;color:var(--ink-3)}

/* overlays */
.qs-overlay{position:fixed;inset:0;background:rgba(16,24,40,.5);display:grid;place-items:center;padding:16px;z-index:9000}
.qs-overlay--drawer{place-items:stretch end;padding:0}
.qs-modal{background:var(--surface);border-radius:16px;padding:22px;width:100%;max-width:420px;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(16,24,40,.3)}
.qs-modal-title{margin:0 0 14px;font-size:17px;font-weight:800}
.qs-modal-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.qs-drawer{background:var(--bg);width:min(980px,100%);height:100%;overflow:auto;padding:22px;box-shadow:-20px 0 60px rgba(16,24,40,.25)}
.qs-drawer-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}

/* widget preview */
.qs-wprev{position:relative;height:430px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}
.qs-wprev-bar{display:flex;align-items:center;gap:6px;padding:9px 12px;background:var(--surface-2);border-bottom:1px solid var(--line)}.qs-wprev-bar i{width:9px;height:9px;border-radius:50%;background:var(--line-2)}.qs-wprev-bar span{margin-left:10px;font-size:11.5px;color:var(--ink-3)}
.qs-wprev-page{padding:18px;display:grid;gap:10px}.qs-wprev-page div{height:12px;border-radius:6px;background:var(--surface-2)}
.qs-wprev-dock{position:absolute;bottom:14px;display:flex;flex-direction:column;gap:12px}
.qs-wcard{width:min(270px,calc(100vw - 80px));border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 10px 32px rgba(16,24,40,.22)}
.qs-wcard-head{display:flex;align-items:center;gap:10px;padding:12px 14px;color:#fff}.qs-wcard-head>div{flex:1;min-width:0;display:grid}.qs-wcard-head b{font-size:14px}.qs-wcard-head small{display:flex;align-items:center;gap:6px;font-size:11.5px;opacity:.92}.qs-wcard-head small i{width:7px;height:7px;border-radius:50%;background:#6CE9A6}
.qs-wcard-head button{border:0;background:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}
.qs-wav{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;font-weight:700}
.qs-wcard-body{background:#EFEAE2;padding:14px}.qs-wcard-body p{margin:0;background:#fff;padding:9px 11px;border-radius:0 11px 11px 11px;font-size:13px;max-width:90%;overflow-wrap:anywhere}
.qs-wcard-foot{padding:11px 14px 14px}.qs-wcard-foot span{display:block;text-align:center;color:#fff;padding:9px;border-radius:99px;font-weight:600;font-size:13px}
.qs-wfab{position:relative;width:54px;height:54px;border-radius:50%;border:0;color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.qs-wfab i{position:absolute;top:-1px;right:-1px;width:14px;height:14px;border-radius:50%;background:#F04438;border:2px solid #fff}
.qs-code-block{margin:0;padding:12px;background:var(--ink);color:#E4E7EC;border-radius:10px;font-size:12px;overflow:auto;white-space:pre-wrap;word-break:break-all;font-family:ui-monospace,Menlo,monospace}

/* toasts */
.qs-toasts{position:fixed;right:20px;bottom:20px;display:grid;gap:8px;z-index:10000}
.qs-toast{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:11px;background:var(--ink);color:#fff;font-weight:600;font-size:13.5px;box-shadow:0 10px 30px rgba(16,24,40,.25)}
.qs-toast--error{background:var(--bad)}.qs-toast--success{background:#05603A}

@media(max-width:1000px){.qs-grid{grid-template-columns:1fr}.qs-preview{position:static}.qs-an-grid--wide{grid-template-columns:1fr}}
@media(max-width:640px){
  .qs-two{grid-template-columns:1fr}.qs-search .qs-input{width:100%}.qs-search,.qs-saved-tools{width:100%}.qs-saved-tools .qs-select{flex:1}
  .qs-item{grid-template-columns:1fr auto}.qs-item-spark{display:none}.qs-item .qs-rowact{grid-column:1/-1;justify-content:flex-start}
  .qs-an-right{margin-left:0}.qs-drawer{padding:16px}.qs-toasts{left:16px;right:16px}
  .qs-an-grid{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){.qs-root *{animation:none!important;transition:none!important}}
`;
