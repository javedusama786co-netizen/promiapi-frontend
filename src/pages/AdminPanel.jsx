import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
  "https://api.promiapi.com"; // default fallback

/* ───────────────────────── helpers ───────────────────────── */
const api = (method, url, data) =>
  axios({
    method,
    url: `${API_BASE_URL}/api/admin${url}`,
    data,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fullName = (u) => `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Unnamed";
const initials = (u) => fullName(u).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const phoneOf = (u) => u.phone || u.phoneNumber || u.mobile || "";
const cityOf = (u) => u.city || u.address?.city || u.location?.city || u.profile?.city || "";
const countryOf = (u) => u.country || u.address?.country || u.location?.country || u.profile?.country || "";
const lastSeen = (u) => u.lastLogin || u.lastLoginAt || u.lastActive || u.lastSeen || null;
const hasAddon = (u, k) => u.subscription?.addons?.[k] === true || u.addons?.[k] === true;
const statusOf = (u) => u.status || "Active";
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const money = (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const daysLeft = (u) => {
  const end = u.subscription?.endDate;
  if (!end) return null;
  return Math.ceil((new Date(end) - new Date()) / 86400000);
};

// none | active | expiring | expired
const subState = (u, warn) => {
  const d = daysLeft(u);
  if (d === null) return u.subscribed ? "active" : "none";
  if (d < 0) return "expired";
  if (d <= warn) return "expiring";
  return u.subscribed === false && u.subscription?.status === "cancelled" ? "none" : "active";
};

const SUB_LABEL = { none: "No plan", active: "Active", expiring: "Expiring soon", expired: "Expired" };
const SUB_TONE = { none: "mute", active: "good", expiring: "warn", expired: "bad" };
const STATUS_TONE = { Active: "good", Suspended: "warn", Terminated: "bad" };

const HIDDEN_KEYS = ["_id", "__v", "password", "subscription", "addons", "firstName", "lastName", "email", "username",
  "plan", "subscribed", "status", "createdAt", "updatedAt", "phone", "phoneNumber", "mobile", "city", "country",
  "address", "location", "profile", "lastLogin", "lastLoginAt", "lastActive", "lastSeen"];

const downloadCSV = (rows, cols, name) => {
  const head = cols.map((c) => c.label).join(",");
  const body = rows.map((u) => cols.map((c) => `"${String(c.get(u) ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([head + "\n" + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

/* Printable columns — shared by the print dialog and CSV export */
const buildCols = (warn) => [
  { id: "name", label: "Name", get: fullName, on: true },
  { id: "username", label: "Username", get: (u) => u.username || "", on: false },
  { id: "email", label: "Email", get: (u) => u.email, on: true },
  { id: "phone", label: "Phone", get: phoneOf, on: true },
  { id: "city", label: "City", get: cityOf, on: true },
  { id: "country", label: "Country", get: countryOf, on: false },
  { id: "plan", label: "Plan", get: (u) => u.plan || "Free", on: true },
  { id: "sub", label: "Subscription", get: (u) => SUB_LABEL[subState(u, warn)], on: true },
  { id: "expiry", label: "Expiry date", get: (u) => fmtDate(u.subscription?.endDate), on: true },
  { id: "days", label: "Days left", get: (u) => { const d = daysLeft(u); return d === null ? "—" : d < 0 ? `Expired ${-d}d ago` : d; }, on: true },
  { id: "setup", label: "Setup add-on", get: (u) => (hasAddon(u, "supportCustomize") ? "Yes" : "No"), on: false },
  { id: "portfolio", label: "Portfolio add-on", get: (u) => (hasAddon(u, "verifiedPortfolio") ? "Yes" : "No"), on: false },
  { id: "status", label: "Account status", get: statusOf, on: true },
  { id: "joined", label: "Joined", get: (u) => fmtDate(u.createdAt), on: false },
];

const PRINT_CSS = `
*{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#0f172a;margin:32px;font-size:13px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:13px;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid #0f766e;color:#0f766e}
.meta{color:#64748b;font-size:12px;margin-bottom:18px}
table{width:100%;border-collapse:collapse}th,td{padding:7px 9px;border:1px solid #dbe2ea;text-align:left;vertical-align:top}
th{background:#f1f5f9;font-size:11px}.kv td:first-child{width:34%;background:#f8fafc;color:#475569;font-weight:600}
.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#e2e8f0}
.good{background:#d1fae5;color:#065f46}.warn{background:#fef3c7;color:#92400e}.bad{background:#fee2e2;color:#991b1b}
.box{border:2px solid #f59e0b;background:#fffbeb;padding:10px 14px;border-radius:8px;margin:14px 0;font-weight:600}
.foot{margin-top:28px;font-size:11px;color:#94a3b8}@media print{body{margin:14mm}}
`;

const printHTML = (title, body, notify) => {
  const w = window.open("", "_blank", "width=960,height=720");
  if (!w) return notify("Pop-up blocked. Allow pop-ups for this site to print.", "bad");
  w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
};

const userSheetHTML = (u, warn) => {
  const d = daysLeft(u);
  const st = subState(u, warn);
  const row = (k, v) => `<tr><td>${esc(k)}</td><td>${esc(v || "—")}</td></tr>`;
  const reminder =
    st === "expiring" ? `<div class="box">Reminder: this subscription ends in ${d} day(s) on ${fmtDate(u.subscription.endDate)}.</div>`
    : st === "expired" ? `<div class="box" style="border-color:#dc2626;background:#fef2f2">Subscription expired on ${fmtDate(u.subscription.endDate)}.</div>` : "";
  return `
  <h1>${esc(fullName(u))}</h1>
  <div class="meta">User data sheet · printed ${fmtDateTime(new Date())}</div>
  ${reminder}
  <h2>Contact</h2><table class="kv">${row("Email", u.email)}${row("Username", u.username && "@" + u.username)}${row("Phone", phoneOf(u))}${row("City", cityOf(u))}${row("Country", countryOf(u))}</table>
  <h2>Subscription</h2><table class="kv">
    ${row("Plan", u.plan || "Free")}${row("Subscription state", SUB_LABEL[st])}${row("Start date", fmtDate(u.subscription?.startDate))}
    ${row("Expiry date", fmtDate(u.subscription?.endDate))}${row("Days left", d === null ? "—" : d < 0 ? `Expired ${-d} days ago` : d)}
    ${row("Activated by", u.subscription?.isManual ? "Admin (manual)" : "Payment")}
    ${row("Setup & customization add-on", hasAddon(u, "supportCustomize") ? "Active" : "Not purchased")}
    ${row("Verified portfolio add-on", hasAddon(u, "verifiedPortfolio") ? "Active" : "Not purchased")}</table>
  <h2>Account</h2><table class="kv">${row("Status", statusOf(u))}${row("Registered", fmtDateTime(u.createdAt))}${row("Last active", lastSeen(u) ? fmtDateTime(lastSeen(u)) : "")}${row("User ID", u._id)}</table>
  <div class="foot">Confidential. For administrative use only.</div>`;
};

const listHTML = (rows, cols, title) => `
  <h1>${esc(title)}</h1><div class="meta">${rows.length} user(s) · printed ${fmtDateTime(new Date())}</div>
  <table><thead><tr><th>#</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((u, i) => `<tr><td>${i + 1}</td>${cols.map((c) => `<td>${esc(c.get(u))}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <div class="foot">Confidential. For administrative use only.</div>`;

/* ───────────────────────── icons ───────────────────────── */
const PATHS = {
  overview: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  menu: "M3 12h18M3 6h18M3 18h18",
  close: "M18 6 6 18M6 6l12 12",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  check: "M20 6 9 17l-5-5",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
};
const Ico = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={PATHS[n]} />
  </svg>
);

/* ───────────────────────── charts (pure SVG, no extra packages) ───────────────────────── */
const CH = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];

const AreaChart = ({ data, id }) => {
  const W = 560, H = 190, P = 26;
  const max = Math.max(1, ...data.map((d) => d.value));
  const x = (i) => P + (i * (W - P * 2)) / Math.max(1, data.length - 1);
  const y = (v) => H - 30 - (v / max) * (H - 60);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - 30} L${x(0)},${H - 30} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Signups per month">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--c1)" stopOpacity=".35" />
          <stop offset="100%" stopColor="var(--c1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={P} x2={W - P} y1={H - 30 - t * (H - 60)} y2={H - 30 - t * (H - 60)} stroke="var(--line)" strokeDasharray="3 4" />
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="var(--c1)" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--panel)" stroke="var(--c1)" strokeWidth="2"><title>{`${d.label}: ${d.value}`}</title></circle>
          <text x={x(i)} y={H - 10} textAnchor="middle" className="ax">{d.label}</text>
        </g>
      ))}
      <text x={P} y="14" className="ax">{max}</text>
    </svg>
  );
};

const BarChart = ({ data, colors }) => {
  const W = 420, H = 190, P = 20;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - P * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Bar chart">
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 62);
        return (
          <g key={i}>
            <rect x={P + i * bw + bw * 0.18} y={H - 32 - h} width={bw * 0.64} height={Math.max(h, 2)} rx="6" fill={colors?.[i] || "var(--c2)"}><title>{`${d.label}: ${d.value}`}</title></rect>
            <text x={P + i * bw + bw / 2} y={H - 36 - h} textAnchor="middle" className="val">{d.value}</text>
            <text x={P + i * bw + bw / 2} y={H - 12} textAnchor="middle" className="ax">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const Donut = ({ data, total, centerLabel }) => {
  const R = 52, C = 2 * Math.PI * R;
  const sum = data.reduce((a, d) => a + d.value, 0) || 1;
  let off = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={centerLabel}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
        {data.map((d, i) => {
          const len = (d.value / sum) * C;
          const el = (
            <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={d.color || CH[i % CH.length]} strokeWidth="16"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)"><title>{`${d.label}: ${d.value}`}</title></circle>
          );
          off += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-n">{total}</text>
        <text x="70" y="84" textAnchor="middle" className="ax">{centerLabel}</text>
      </svg>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={i}><i style={{ background: d.color || CH[i % CH.length] }} />{d.label}<b>{d.value}</b></li>
        ))}
      </ul>
    </div>
  );
};

const HBars = ({ data, empty = "No data yet" }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="mute">{empty}</p>;
  return (
    <ul className="hbars">
      {data.map((d, i) => (
        <li key={i}>
          <span>{d.label}</span>
          <div><em style={{ width: `${(d.value / max) * 100}%`, background: CH[i % CH.length] }} /></div>
          <b>{d.value}</b>
        </li>
      ))}
    </ul>
  );
};

/* ───────────────────────── styles ───────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ap{--bg:#f3f5f9;--panel:#fff;--panel2:#f7f9fc;--line:#e3e8f0;--text:#0f172a;--sub:#64748b;--accent:#0f766e;--accent-soft:#d9f3ef;--on-accent:#fff;
--good:#047857;--good-bg:#d1fae5;--warn:#b45309;--warn-bg:#fef3c7;--bad:#b91c1c;--bad-bg:#fee2e2;--mute-bg:#eef1f6;--shadow:0 1px 2px rgba(15,23,42,.05),0 8px 24px -12px rgba(15,23,42,.12);
--c1:#0f766e;--c2:#6366f1;--c3:#f59e0b;--c4:#ec4899;--c5:#0ea5e9;--c6:#84cc16}
.ap[data-theme=dark]{--bg:#0a101d;--panel:#121a2b;--panel2:#172136;--line:#243049;--text:#e8edf6;--sub:#8c9bb6;--accent:#2dd4bf;--accent-soft:rgba(45,212,191,.14);--on-accent:#04211e;
--good:#34d399;--good-bg:rgba(52,211,153,.14);--warn:#fbbf24;--warn-bg:rgba(251,191,36,.14);--bad:#f87171;--bad-bg:rgba(248,113,113,.15);--mute-bg:#1c2740;--shadow:0 1px 2px rgba(0,0,0,.3),0 12px 28px -14px rgba(0,0,0,.6);
--c1:#2dd4bf;--c2:#818cf8;--c3:#fbbf24;--c4:#f472b6;--c5:#38bdf8;--c6:#a3e635}
.ap,.ap *{box-sizing:border-box}
.ap{font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;font-size:14px;line-height:1.45;transition:background .25s,color .25s}
.ap button{font-family:inherit;cursor:pointer}.ap :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ap h1,.ap h2,.ap h3,.ap h4,.ap p{margin:0}.mute{color:var(--sub)}
.side{width:248px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);padding:22px 14px;display:flex;flex-direction:column;gap:22px;position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:10px;padding:0 8px;font-weight:800;font-size:18px;letter-spacing:-.4px}
.brand i{width:32px;height:32px;border-radius:10px;background:var(--accent);color:var(--on-accent);display:grid;place-items:center;font-style:normal;font-size:15px}
.nav{display:flex;flex-direction:column;gap:4px}
.nav button{display:flex;align-items:center;gap:12px;padding:11px 12px;border:0;border-radius:10px;background:transparent;color:var(--sub);font-weight:600;font-size:14px;text-align:left;transition:background .15s,color .15s}
.nav button:hover{background:var(--panel2);color:var(--text)}.nav button.on{background:var(--accent-soft);color:var(--accent)}
.nav .pill{margin-left:auto;background:var(--warn-bg);color:var(--warn);font-size:11px;font-weight:700;padding:1px 8px;border-radius:99px}
.side-foot{margin-top:auto;display:flex;flex-direction:column;gap:10px}
.main{flex:1;min-width:0;padding:28px 34px 60px}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.top h1{font-size:25px;font-weight:800;letter-spacing:-.6px}.top p{color:var(--sub);margin-top:3px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-weight:600;font-size:13px;transition:background .15s,border-color .15s}
.btn:hover{background:var(--panel2);border-color:var(--sub)}.btn:disabled{opacity:.5;cursor:not-allowed}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}.btn.pri:hover{filter:brightness(1.08)}
.btn.bad{color:var(--bad);border-color:transparent;background:var(--bad-bg)}.btn.good{color:var(--good);border-color:transparent;background:var(--good-bg)}
.btn.warn{color:var(--warn);border-color:transparent;background:var(--warn-bg)}.btn.sm{padding:6px 10px;font-size:12px;border-radius:8px}
.icon-btn{width:38px;height:38px;padding:0;justify-content:center}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow)}
.card-h{padding:16px 20px 0;display:flex;justify-content:space-between;align-items:center;gap:10px}.card-h h3{font-size:15px;font-weight:700}
.card-b{padding:14px 20px 20px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:16px}
.kpi{padding:16px 18px;display:flex;flex-direction:column;gap:4px}.kpi span{color:var(--sub);font-size:12.5px;font-weight:600}
.kpi b{font-size:28px;font-weight:800;letter-spacing:-1px}.kpi small{font-size:12px;font-weight:600;color:var(--sub)}
.kpi.lead{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}.kpi.lead span,.kpi.lead small{color:inherit;opacity:.85}
.grid{display:grid;gap:16px;margin-bottom:16px}.g3{grid-template-columns:2fr 1fr}.g2{grid-template-columns:1fr 1fr}.g3b{grid-template-columns:1fr 1fr 1fr}
.chart{width:100%;height:auto;display:block}.ax{font-size:10px;fill:var(--sub);font-family:inherit}.val{font-size:11px;font-weight:700;fill:var(--text);font-family:inherit}
.donut-wrap{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.donut-n{font-size:24px;font-weight:800;fill:var(--text);font-family:inherit}
.legend{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;flex:1;min-width:120px}
.legend li{display:flex;align-items:center;gap:8px;font-size:13px}.legend i{width:10px;height:10px;border-radius:3px}.legend b{margin-left:auto}
.hbars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:11px}
.hbars li{display:grid;grid-template-columns:96px 1fr 28px;gap:10px;align-items:center;font-size:13px}
.hbars li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hbars div{height:9px;background:var(--mute-bg);border-radius:9px;overflow:hidden}
.hbars em{display:block;height:100%;border-radius:9px}.hbars b{text-align:right}
.meter{margin-bottom:14px}.meter div{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
.meter p{height:9px;background:var(--mute-bg);border-radius:9px;overflow:hidden}.meter em{display:block;height:100%;border-radius:9px}
.tools{padding:14px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line)}
.search{position:relative;flex:1;min-width:210px}.search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--sub)}
.inp,.sel{width:100%;padding:10px 12px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;font-size:13px}
.search .inp{padding-left:36px}.sel{width:auto;min-width:130px}
.tbl-wrap{overflow-x:auto}table.tbl{width:100%;border-collapse:collapse;min-width:900px}
.tbl th{padding:11px 14px;text-align:left;font-size:12px;font-weight:700;color:var(--sub);background:var(--panel2);border-bottom:1px solid var(--line);white-space:nowrap}
.tbl th.s{cursor:pointer;user-select:none}.tbl td{padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
.tbl tbody tr{transition:background .12s}.tbl tbody tr:hover{background:var(--panel2)}.tbl tr.sel{background:var(--accent-soft)}
.who{display:flex;align-items:center;gap:11px;min-width:210px}.who b{display:block;font-weight:700}.who small{color:var(--sub);font-size:12px}
.av{width:36px;height:36px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:800;font-size:12px;flex-shrink:0}
.av.lg{width:56px;height:56px;font-size:18px}
.tag{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap}
.tag.good{background:var(--good-bg);color:var(--good)}.tag.warn{background:var(--warn-bg);color:var(--warn)}.tag.bad{background:var(--bad-bg);color:var(--bad)}.tag.mute{background:var(--mute-bg);color:var(--sub)}
.tag.acc{background:var(--accent-soft);color:var(--accent)}
.chk{width:16px;height:16px;accent-color:var(--accent)}
.pager{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;color:var(--sub);font-size:13px;flex-wrap:wrap;gap:10px}
.bulk{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--accent-soft);color:var(--accent);font-weight:600;flex-wrap:wrap}
.empty{padding:44px 20px;text-align:center;color:var(--sub)}
.scrim{position:fixed;inset:0;background:rgba(8,12,22,.55);backdrop-filter:blur(3px);z-index:90}
.modal-wrap{position:fixed;inset:0;display:grid;place-items:center;padding:16px;z-index:100;pointer-events:none}
.modal{pointer-events:auto;width:100%;max-width:460px;max-height:92vh;overflow:auto;padding:24px}.modal h3{font-size:18px;font-weight:800;margin-bottom:4px}
.field{margin-bottom:14px}.field label{display:block;font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px}
.checks{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}.checks label{display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer}
.box{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px}
.box label{display:flex;gap:10px;align-items:center;font-size:13px;cursor:pointer}
.foot{display:flex;gap:10px;justify-content:flex-end;margin-top:6px;flex-wrap:wrap}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(540px,100%);background:var(--bg);border-left:1px solid var(--line);z-index:95;overflow-y:auto;box-shadow:-20px 0 50px -20px rgba(0,0,0,.35)}
.d-head{position:sticky;top:0;background:var(--panel);border-bottom:1px solid var(--line);padding:18px 20px;display:flex;gap:14px;align-items:center;z-index:2}
.d-body{padding:18px 20px 40px;display:flex;flex-direction:column;gap:14px}
.sec{padding:16px 18px}.sec h4{font-size:12.5px;font-weight:800;color:var(--accent);margin-bottom:10px}
.kv{display:grid;grid-template-columns:140px 1fr;gap:9px 12px;font-size:13px}.kv dt{color:var(--sub);font-weight:600}.kv dd{margin:0;word-break:break-word;font-weight:500}
.acts{display:flex;gap:8px;flex-wrap:wrap}
.alert{display:flex;gap:10px;padding:12px 14px;border-radius:12px;font-weight:600;font-size:13px}.alert.warn{background:var(--warn-bg);color:var(--warn)}.alert.bad{background:var(--bad-bg);color:var(--bad)}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:200;padding:11px 18px;border-radius:12px;font-weight:600;font-size:13px;box-shadow:var(--shadow);background:var(--text);color:var(--bg)}
.toast.bad{background:var(--bad);color:#fff}.toast.good{background:var(--good);color:#fff}
.m-top{display:none}
.seg{display:inline-flex;background:var(--mute-bg);border-radius:10px;padding:3px;gap:2px;flex-wrap:wrap}
.seg button{border:0;background:transparent;color:var(--sub);padding:7px 12px;border-radius:8px;font-weight:600;font-size:13px}.seg button.on{background:var(--panel);color:var(--text);box-shadow:var(--shadow)}
.set-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--line)}.set-row:last-child{border:0}
.set-row p{color:var(--sub);font-size:12.5px;margin-top:2px}.set-row .inp{width:96px}
@media(max-width:1100px){.g3,.g2,.g3b{grid-template-columns:1fr}.main{padding:22px 20px 60px}}
@media(max-width:860px){
 .ap{flex-direction:column}.m-top{display:flex;position:sticky;top:0;z-index:60;background:var(--panel);border-bottom:1px solid var(--line);padding:12px 16px;justify-content:space-between;align-items:center}
 .side{position:fixed;inset:57px 0 0 0;width:100%;height:auto;z-index:70;transform:translateX(-100%);transition:transform .22s}.side.open{transform:none}
 .main{padding:18px 14px 60px}.top h1{font-size:21px}.kv{grid-template-columns:110px 1fr}
}
@media(prefers-reduced-motion:reduce){.ap *{transition:none!important}}
`;

/* ───────────────────────── small UI pieces ───────────────────────── */
const Modal = ({ onClose, children, wide }) => (
  <>
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ zIndex: 98 }} />
    <div className="modal-wrap">
      <motion.div className="card modal" style={wide ? { maxWidth: 560 } : null} role="dialog" aria-modal="true"
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}>
        {children}
      </motion.div>
    </div>
  </>
);

const Tag = ({ tone, children }) => <span className={`tag ${tone}`}>{children}</span>;

const KV = ({ rows }) => (
  <dl className="kv">
    {rows.map(([k, v]) => (
      <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v || v === 0 ? v : <span className="mute">—</span>}</dd></div>
    ))}
  </dl>
);

/* ───────────────────────── main component ───────────────────────── */
function AdminPanel() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("admin-theme") || "light"; } catch { return "light"; } });
  const [tab, setTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);

  // settings (saved in this browser only)
  const [cfg, setCfg] = useState(() => {
    try { return { warn: 7, pageSize: 10, setupPrice: 29.99, portfolioPrice: 99.99, ...JSON.parse(localStorage.getItem("admin-cfg") || "{}") }; }
    catch { return { warn: 7, pageSize: 10, setupPrice: 29.99, portfolioPrice: 99.99 }; }
  });

  // users tab state
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fPlan, setFPlan] = useState("all");
  const [fSub, setFSub] = useState("all");
  const [fCity, setFCity] = useState("all");
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState([]);

  // overlays
  const [openId, setOpenId] = useState(null);
  const [subModal, setSubModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [printModal, setPrintModal] = useState(null);
  const [remindFilter, setRemindFilter] = useState("expiring");

  const notify = useCallback((msg, type = "") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => { try { localStorage.setItem("admin-theme", theme); } catch { /* ignore */ } }, [theme]);
  useEffect(() => { try { localStorage.setItem("admin-cfg", JSON.stringify(cfg)); } catch { /* ignore */ } }, [cfg]);

  const load = useCallback(async (silent) => {
    try {
      if (!silent) setLoading(true);
      setLoadError("");
      const res = await api("get", "/users");
      setUsers(res.data?.users || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      setLoadError(err.response?.data?.message || "Could not load users. Check that the server is running and you are signed in as the owner.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const warn = Number(cfg.warn) || 7;
  const cols = useMemo(() => buildCols(warn), [warn]);
  const openUser = users.find((u) => u._id === openId) || null;

  /* generic action runner */
  const run = async (fn, okMsg) => {
    try {
      const res = await fn();
      notify(res?.data?.message || okMsg, "good");
      await load(true);
      return true;
    } catch (err) {
      notify(err.response?.data?.message || "Action failed. Please try again.", "bad");
      return false;
    }
  };

  const setStatus = (u, status) =>
    status === "Terminated"
      ? setConfirm({ title: "Terminate account?", text: `${fullName(u)} (${u.email}) will lose access to the portal immediately. You can reactivate the account later.`, label: "Terminate account", danger: true, go: () => run(() => api("patch", `/users/${u._id}/status`, { status }), "Account terminated") })
      : run(() => api("patch", `/users/${u._id}/status`, { status }), `Account set to ${status}`);

  const bulkStatus = (status) =>
    setConfirm({
      title: `Set ${picked.length} account(s) to ${status}?`, text: "The owner account is always skipped.", label: `Set to ${status}`, danger: status === "Terminated",
      go: async () => { if (await run(() => api("post", "/users/bulk-status", { ids: picked, status }), "Updated")) setPicked([]); },
    });

  const deleteUser = (u) =>
    setConfirm({
      title: "Delete user permanently?", text: `${fullName(u)} and all their data will be removed from the database. This cannot be undone. Use Terminate if you may need the account again.`, label: "Delete permanently", danger: true,
      go: async () => { if (await run(() => api("delete", `/users/${u._id}`), "User deleted")) setOpenId(null); },
    });

  const remindMail = (u) => {
    const d = daysLeft(u);
    const when = d === null ? "" : d < 0 ? `expired on ${fmtDate(u.subscription.endDate)}` : `ends on ${fmtDate(u.subscription.endDate)} (${d} day${d === 1 ? "" : "s"} left)`;
    const subject = encodeURIComponent("Your subscription renewal reminder");
    const body = encodeURIComponent(`Hi ${u.firstName || "there"},\n\nThis is a reminder that your ${u.plan || ""} subscription ${when}.\nPlease renew to keep your access without interruption.\n\nThank you.`);
    window.location.href = `mailto:${u.email}?subject=${subject}&body=${body}`;
  };

  /* ─── derived data ─── */
  const stats = useMemo(() => {
    const now = new Date();
    const states = { none: 0, active: 0, expiring: 0, expired: 0 };
    const plans = {}, statuses = { Active: 0, Suspended: 0, Terminated: 0 }, cities = {};
    let setup = 0, portfolio = 0, thisMonth = 0, lastMonth = 0;
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: "short" }), value: 0 };
    });
    const buckets = [{ label: "Expired", value: 0 }, { label: "0-7d", value: 0 }, { label: "8-14d", value: 0 }, { label: "15-30d", value: 0 }, { label: "31-60d", value: 0 }];
    users.forEach((u) => {
      const st = subState(u, warn); states[st]++;
      const p = u.plan || "Free"; plans[p] = (plans[p] || 0) + 1;
      statuses[statusOf(u)] = (statuses[statusOf(u)] || 0) + 1;
      const c = cityOf(u); if (c) cities[c] = (cities[c] || 0) + 1;
      if (hasAddon(u, "supportCustomize")) setup++;
      if (hasAddon(u, "verifiedPortfolio")) portfolio++;
      if (u.createdAt) {
        const d = new Date(u.createdAt);
        const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`); if (m) m.value++;
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) thisMonth++;
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth()) lastMonth++;
      }
      const dl = daysLeft(u);
      if (dl !== null) { if (dl < 0) buckets[0].value++; else if (dl <= 7) buckets[1].value++; else if (dl <= 14) buckets[2].value++; else if (dl <= 30) buckets[3].value++; else if (dl <= 60) buckets[4].value++; }
    });
    const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
    return { states, plans: top(plans, 6), statuses, cities: top(cities, 6), setup, portfolio, thisMonth, lastMonth, months, buckets,
      revenue: setup * cfg.setupPrice + portfolio * cfg.portfolioPrice };
  }, [users, warn, cfg.setupPrice, cfg.portfolioPrice]);

  const planOptions = useMemo(() => [...new Set(users.map((u) => u.plan || "Free"))], [users]);
  const cityOptions = useMemo(() => [...new Set(users.map(cityOf).filter(Boolean))].sort(), [users]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const rows = users.filter((u) => {
      if (t && !`${fullName(u)} ${u.email} ${u.username || ""} ${phoneOf(u)} ${cityOf(u)}`.toLowerCase().includes(t)) return false;
      if (fStatus !== "all" && statusOf(u) !== fStatus) return false;
      if (fPlan !== "all" && (u.plan || "Free") !== fPlan) return false;
      if (fSub !== "all" && subState(u, warn) !== fSub) return false;
      if (fCity !== "all" && cityOf(u) !== fCity) return false;
      return true;
    });
    const val = { name: fullName, city: cityOf, plan: (u) => u.plan || "Free", expiry: (u) => (u.subscription?.endDate ? new Date(u.subscription.endDate).getTime() : 0), status: statusOf, createdAt: (u) => (u.createdAt ? new Date(u.createdAt).getTime() : 0) }[sort.key];
    rows.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === "asc" ? 1 : -1); });
    return rows;
  }, [users, q, fStatus, fPlan, fSub, fCity, sort, warn]);

  useEffect(() => { setPage(1); }, [q, fStatus, fPlan, fSub, fCity, cfg.pageSize]);
  const pageSize = Number(cfg.pageSize) || 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allOnPage = pageRows.length > 0 && pageRows.every((u) => picked.includes(u._id));
  const sortBy = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  const arrow = (key) => (sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : "");

  const remindList = useMemo(() => {
    const f = { expiring: (u) => subState(u, warn) === "expiring", expired: (u) => subState(u, warn) === "expired", active: (u) => subState(u, warn) === "active", all: (u) => daysLeft(u) !== null }[remindFilter];
    return users.filter(f).sort((a, b) => (daysLeft(a) ?? 1e9) - (daysLeft(b) ?? 1e9));
  }, [users, remindFilter, warn]);

  const nav = [
    { id: "overview", label: "Overview", icon: "overview" },
    { id: "users", label: "Users", icon: "users" },
    { id: "reminders", label: "Renewals", icon: "bell", pill: stats.states.expiring + stats.states.expired || null },
    { id: "settings", label: "Settings", icon: "settings" },
  ];
  const titles = {
    overview: ["Overview", "How your platform is doing right now."],
    users: ["Users", "Every account, with full control over access and plans."],
    reminders: ["Renewals", "Who needs a reminder, and who has already lapsed."],
    settings: ["Settings", "Appearance and how this panel counts things."],
  };

  /* ───────────────────────── render ───────────────────────── */
  return (
    <div className="ap" data-theme={theme}>
      <style>{CSS}</style>

      <div className="m-top">
        <div className="brand"><i>P</i>PromiAPI</div>
        <button className="btn icon-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"><Ico n={menuOpen ? "close" : "menu"} /></button>
      </div>

      <aside className={`side ${menuOpen ? "open" : ""}`}>
        <div className="brand" style={{ display: undefined }}><i>P</i>PromiAPI <span className="tag acc" style={{ fontSize: 10 }}>Owner</span></div>
        <nav className="nav">
          {nav.map((n) => (
            <button key={n.id} className={tab === n.id ? "on" : ""} onClick={() => { setTab(n.id); setMenuOpen(false); }}>
              <Ico n={n.icon} />{n.label}{n.pill ? <span className="pill">{n.pill}</span> : null}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <button className="btn" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Ico n={theme === "light" ? "moon" : "sun"} />{theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div><h1>{titles[tab][0]}</h1><p>{titles[tab][1]}</p></div>
          <div className="row">
            <button className="btn" onClick={() => load()} disabled={loading}><Ico n="refresh" s={16} />Refresh</button>
            <button className="btn" onClick={() => setPrintModal({ rows: filtered, title: "User report" })}><Ico n="print" s={16} />Print report</button>
          </div>
        </header>

        {loadError && <div className="alert bad" style={{ marginBottom: 16 }}>{loadError}</div>}

        {/* ───── OVERVIEW ───── */}
        {tab === "overview" && (
          <>
            <div className="kpis">
              <div className="card kpi lead"><span>Total users</span><b>{users.length}</b><small>{stats.thisMonth} new this month{stats.lastMonth ? ` (${stats.lastMonth} last month)` : ""}</small></div>
              <div className="card kpi"><span>Paying or active plans</span><b>{stats.states.active + stats.states.expiring}</b><small>{users.length ? Math.round(((stats.states.active + stats.states.expiring) / users.length) * 100) : 0}% of all users</small></div>
              <div className="card kpi"><span>Expiring in {warn} days</span><b style={{ color: stats.states.expiring ? "var(--warn)" : undefined }}>{stats.states.expiring}</b><small>Send a reminder</small></div>
              <div className="card kpi"><span>Expired</span><b style={{ color: stats.states.expired ? "var(--bad)" : undefined }}>{stats.states.expired}</b><small>Need renewal</small></div>
              <div className="card kpi"><span>Suspended / terminated</span><b>{stats.statuses.Suspended + stats.statuses.Terminated}</b><small>{stats.statuses.Suspended} suspended · {stats.statuses.Terminated} terminated</small></div>
              <div className="card kpi"><span>Add-on revenue</span><b>{money(stats.revenue)}</b><small>{stats.setup} setup + {stats.portfolio} portfolio</small></div>
            </div>

            <div className="grid g3">
              <div className="card"><div className="card-h"><h3>New signups, last 12 months</h3></div><div className="card-b"><AreaChart data={stats.months} id="signupGrad" /></div></div>
              <div className="card"><div className="card-h"><h3>Plans</h3></div><div className="card-b"><Donut data={stats.plans} total={users.length} centerLabel="users" /></div></div>
            </div>

            <div className="grid g3b">
              <div className="card"><div className="card-h"><h3>When subscriptions end</h3></div><div className="card-b"><BarChart data={stats.buckets} colors={["var(--bad)", "var(--warn)", "var(--c3)", "var(--c5)", "var(--c1)"]} /></div></div>
              <div className="card"><div className="card-h"><h3>Account status</h3></div><div className="card-b">
                <Donut total={users.length} centerLabel="accounts" data={[
                  { label: "Active", value: stats.statuses.Active, color: "var(--good)" },
                  { label: "Suspended", value: stats.statuses.Suspended, color: "var(--warn)" },
                  { label: "Terminated", value: stats.statuses.Terminated, color: "var(--bad)" }]} />
              </div></div>
              <div className="card"><div className="card-h"><h3>Top cities</h3></div><div className="card-b"><HBars data={stats.cities} empty="No city data on users yet" /></div></div>
            </div>

            <div className="grid g2">
              <div className="card"><div className="card-h"><h3>Add-on adoption</h3></div><div className="card-b">
                {[["Setup & customization", stats.setup, cfg.setupPrice, "var(--c2)"], ["Verified portfolio", stats.portfolio, cfg.portfolioPrice, "var(--c1)"]].map(([l, n, p, c]) => (
                  <div className="meter" key={l}><div><span>{l} <span className="mute">({money(p)})</span></span><b>{n} of {users.length}</b></div><p><em style={{ width: `${users.length ? (n / users.length) * 100 : 0}%`, background: c }} /></p></div>
                ))}
              </div></div>
              <div className="card"><div className="card-h"><h3>Subscription health</h3></div><div className="card-b">
                <Donut total={users.length} centerLabel="users" data={[
                  { label: "Active", value: stats.states.active, color: "var(--good)" },
                  { label: "Expiring soon", value: stats.states.expiring, color: "var(--warn)" },
                  { label: "Expired", value: stats.states.expired, color: "var(--bad)" },
                  { label: "No plan", value: stats.states.none, color: "var(--sub)" }]} />
              </div></div>
            </div>
          </>
        )}

        {/* ───── USERS ───── */}
        {tab === "users" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="tools">
              <div className="search"><Ico n="search" s={16} /><input className="inp" placeholder="Search name, email, username, phone or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" /></div>
              <select className="sel" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Status"><option value="all">All statuses</option><option>Active</option><option>Suspended</option><option>Terminated</option></select>
              <select className="sel" value={fSub} onChange={(e) => setFSub(e.target.value)} aria-label="Subscription"><option value="all">All subscriptions</option><option value="active">Active</option><option value="expiring">Expiring soon</option><option value="expired">Expired</option><option value="none">No plan</option></select>
              <select className="sel" value={fPlan} onChange={(e) => setFPlan(e.target.value)} aria-label="Plan"><option value="all">All plans</option>{planOptions.map((p) => <option key={p}>{p}</option>)}</select>
              <select className="sel" value={fCity} onChange={(e) => setFCity(e.target.value)} aria-label="City"><option value="all">All cities</option>{cityOptions.map((c) => <option key={c}>{c}</option>)}</select>
              <button className="btn" onClick={() => downloadCSV(filtered, cols, `users-${new Date().toISOString().slice(0, 10)}.csv`)}><Ico n="download" s={16} />CSV</button>
            </div>

            {picked.length > 0 && (
              <div className="bulk">
                {picked.length} selected
                <button className="btn sm" onClick={() => setPrintModal({ rows: users.filter((u) => picked.includes(u._id)), title: "Selected users" })}><Ico n="print" s={14} />Print</button>
                <button className="btn sm good" onClick={() => bulkStatus("Active")}>Activate</button>
                <button className="btn sm warn" onClick={() => bulkStatus("Suspended")}>Suspend</button>
                <button className="btn sm bad" onClick={() => bulkStatus("Terminated")}>Terminate</button>
                <button className="btn sm" onClick={() => setPicked([])}>Clear</button>
              </div>
            )}

            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr>
                  <th style={{ width: 36 }}><input type="checkbox" className="chk" checked={allOnPage} onChange={() => setPicked(allOnPage ? picked.filter((id) => !pageRows.some((u) => u._id === id)) : [...new Set([...picked, ...pageRows.map((u) => u._id)])])} aria-label="Select page" /></th>
                  <th className="s" onClick={() => sortBy("name")}>User{arrow("name")}</th>
                  <th className="s" onClick={() => sortBy("city")}>Location{arrow("city")}</th>
                  <th className="s" onClick={() => sortBy("plan")}>Plan{arrow("plan")}</th>
                  <th className="s" onClick={() => sortBy("expiry")}>Subscription{arrow("expiry")}</th>
                  <th>Add-ons</th>
                  <th className="s" onClick={() => sortBy("status")}>Status{arrow("status")}</th>
                  <th className="s" onClick={() => sortBy("createdAt")}>Joined{arrow("createdAt")}</th>
                  <th />
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="9" className="empty">Loading users…</td></tr>
                    : pageRows.length === 0 ? <tr><td colSpan="9" className="empty">No users match these filters. Clear a filter or change the search.</td></tr>
                    : pageRows.map((u) => {
                      const st = subState(u, warn), d = daysLeft(u);
                      return (
                        <tr key={u._id} className={picked.includes(u._id) ? "sel" : ""}>
                          <td><input type="checkbox" className="chk" checked={picked.includes(u._id)} onChange={() => setPicked(picked.includes(u._id) ? picked.filter((i) => i !== u._id) : [...picked, u._id])} aria-label={`Select ${fullName(u)}`} /></td>
                          <td><div className="who"><div className="av">{initials(u)}</div><div><b>{fullName(u)}</b><small>{u.email}{u.username ? ` · @${u.username}` : ""}</small></div></div></td>
                          <td>{cityOf(u) || countryOf(u) ? <>{cityOf(u)}{cityOf(u) && countryOf(u) ? ", " : ""}{countryOf(u)}</> : <span className="mute">—</span>}</td>
                          <td><Tag tone="acc">{u.plan || "Free"}</Tag>{u.subscription?.isManual && <span className="mute" style={{ fontSize: 11, marginLeft: 6 }}>manual</span>}</td>
                          <td><Tag tone={SUB_TONE[st]}>{SUB_LABEL[st]}</Tag>{d !== null && <div className="mute" style={{ fontSize: 12, marginTop: 3 }}>{d < 0 ? `Ended ${fmtDate(u.subscription.endDate)}` : `${d} day${d === 1 ? "" : "s"} left · ${fmtDate(u.subscription.endDate)}`}</div>}</td>
                          <td><div className="row" style={{ gap: 6 }}>{hasAddon(u, "supportCustomize") && <Tag tone="acc">Setup</Tag>}{hasAddon(u, "verifiedPortfolio") && <Tag tone="good">Portfolio</Tag>}{!hasAddon(u, "supportCustomize") && !hasAddon(u, "verifiedPortfolio") && <span className="mute">—</span>}</div></td>
                          <td><Tag tone={STATUS_TONE[statusOf(u)] || "mute"}>{statusOf(u)}</Tag></td>
                          <td className="mute" style={{ whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                          <td><button className="btn sm" onClick={() => setOpenId(u._id)}>Open</button></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>{filtered.length} user{filtered.length === 1 ? "" : "s"}{filtered.length !== users.length ? ` (filtered from ${users.length})` : ""}</span>
              <div className="row">
                <button className="btn sm icon-btn" style={{ width: 32, height: 32 }} disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><Ico n="chevL" s={16} /></button>
                <span>Page {page} of {pages}</span>
                <button className="btn sm icon-btn" style={{ width: 32, height: 32 }} disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><Ico n="chevR" s={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* ───── RENEWALS ───── */}
        {tab === "reminders" && (
          <>
            <div className="kpis">
              <div className="card kpi"><span>Expiring in {warn} days</span><b style={{ color: "var(--warn)" }}>{stats.states.expiring}</b></div>
              <div className="card kpi"><span>Already expired</span><b style={{ color: "var(--bad)" }}>{stats.states.expired}</b></div>
              <div className="card kpi"><span>Healthy</span><b style={{ color: "var(--good)" }}>{stats.states.active}</b></div>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              <div className="tools">
                <div className="seg">
                  {[["expiring", "Expiring soon"], ["expired", "Expired"], ["active", "Active"], ["all", "All with expiry"]].map(([k, l]) => (
                    <button key={k} className={remindFilter === k ? "on" : ""} onClick={() => setRemindFilter(k)}>{l}</button>
                  ))}
                </div>
                <span style={{ flex: 1 }} />
                <button className="btn" onClick={() => setPrintModal({ rows: remindList, title: "Renewal reminder list" })} disabled={!remindList.length}><Ico n="print" s={16} />Print this list</button>
              </div>
              <div className="tbl-wrap">
                <table className="tbl" style={{ minWidth: 720 }}>
                  <thead><tr><th>User</th><th>Plan</th><th>Expiry</th><th>Time left</th><th>Contact</th><th /></tr></thead>
                  <tbody>
                    {remindList.length === 0 ? <tr><td colSpan="6" className="empty">Nobody in this group right now.</td></tr> : remindList.map((u) => {
                      const d = daysLeft(u);
                      return (
                        <tr key={u._id}>
                          <td><div className="who"><div className="av">{initials(u)}</div><div><b>{fullName(u)}</b><small>{u.email}</small></div></div></td>
                          <td><Tag tone="acc">{u.plan || "Free"}</Tag></td>
                          <td>{fmtDate(u.subscription?.endDate)}</td>
                          <td><Tag tone={d < 0 ? "bad" : d <= warn ? "warn" : "good"}>{d < 0 ? `${-d}d overdue` : `${d}d left`}</Tag></td>
                          <td className="mute">{phoneOf(u) || "—"}</td>
                          <td><div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                            <button className="btn sm" onClick={() => remindMail(u)}><Ico n="mail" s={14} />Remind</button>
                            <button className="btn sm good" onClick={() => run(() => api("post", `/users/${u._id}/subscription/extend`, { days: 30 }), "Extended by 30 days")}>+30 days</button>
                            <button className="btn sm" onClick={() => printHTML(`${fullName(u)} sheet`, userSheetHTML(u, warn), notify)}><Ico n="print" s={14} /></button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ───── SETTINGS ───── */}
        {tab === "settings" && (
          <div className="card" style={{ maxWidth: 720 }}><div className="card-b" style={{ paddingTop: 6 }}>
            <div className="set-row"><div><b>Theme</b><p>Light is the default. Your choice is remembered on this device.</p></div>
              <div className="seg">{["light", "dark"].map((t) => <button key={t} className={theme === t ? "on" : ""} onClick={() => setTheme(t)}>{t === "light" ? "Light" : "Dark"}</button>)}</div></div>
            <div className="set-row"><div><b>Expiry warning window</b><p>Subscriptions ending within this many days count as “expiring soon”.</p></div>
              <input className="inp" type="number" min="1" max="60" value={cfg.warn} onChange={(e) => setCfg({ ...cfg, warn: e.target.value })} /></div>
            <div className="set-row"><div><b>Rows per page</b><p>Applies to the Users table.</p></div>
              <select className="sel" value={cfg.pageSize} onChange={(e) => setCfg({ ...cfg, pageSize: Number(e.target.value) })}>{[10, 20, 50, 100].map((n) => <option key={n}>{n}</option>)}</select></div>
            <div className="set-row"><div><b>Setup & customization price</b><p>Used for the revenue estimate on Overview.</p></div>
              <input className="inp" type="number" step="0.01" value={cfg.setupPrice} onChange={(e) => setCfg({ ...cfg, setupPrice: Number(e.target.value) || 0 })} /></div>
            <div className="set-row"><div><b>Verified portfolio price</b><p>Used for the revenue estimate on Overview.</p></div>
              <input className="inp" type="number" step="0.01" value={cfg.portfolioPrice} onChange={(e) => setCfg({ ...cfg, portfolioPrice: Number(e.target.value) || 0 })} /></div>
          </div></div>
        )}
      </main>

      {/* ───── USER DRAWER ───── */}
      <AnimatePresence>
        {openUser && (
          <>
            <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenId(null)} />
            <motion.aside className="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.22 }} aria-label="User details">
              {(() => {
                const u = openUser, st = subState(u, warn), d = daysLeft(u), isOwnerRow = false;
                const extras = Object.entries(u).filter(([k, v]) => !HIDDEN_KEYS.includes(k) && v !== null && typeof v !== "object" && v !== "");
                return (
                  <>
                    <div className="d-head">
                      <div className="av lg">{initials(u)}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{fullName(u)}</h3>
                        <div className="row" style={{ gap: 6, marginTop: 4 }}><Tag tone={STATUS_TONE[statusOf(u)] || "mute"}>{statusOf(u)}</Tag><Tag tone="acc">{u.plan || "Free"}</Tag></div>
                      </div>
                      <button className="btn icon-btn" onClick={() => setOpenId(null)} aria-label="Close"><Ico n="close" /></button>
                    </div>
                    <div className="d-body">
                      {st === "expiring" && <div className="alert warn"><Ico n="bell" />Subscription ends in {d} day{d === 1 ? "" : "s"} on {fmtDate(u.subscription.endDate)}.</div>}
                      {st === "expired" && <div className="alert bad"><Ico n="bell" />Subscription expired on {fmtDate(u.subscription.endDate)}.</div>}

                      <div className="card sec"><h4>Contact & location</h4>
                        <KV rows={[["Email", u.email], ["Username", u.username && `@${u.username}`], ["Phone", phoneOf(u)], ["City", cityOf(u)], ["Country", countryOf(u)]]} /></div>

                      <div className="card sec"><h4>Subscription</h4>
                        <KV rows={[["Plan", u.plan || "Free"], ["State", <Tag key="s" tone={SUB_TONE[st]}>{SUB_LABEL[st]}</Tag>], ["Plan ID", u.subscription?.planId], ["Provider status", u.subscription?.status],
                          ["Started", fmtDate(u.subscription?.startDate)], ["Expires", fmtDate(u.subscription?.endDate)],
                          ["Time left", d === null ? null : d < 0 ? `Expired ${-d} days ago` : `${d} days`], ["Activated by", u.subscription?.isManual ? "Admin (manual)" : u.subscribed ? "Payment" : null]]} /></div>

                      <div className="card sec"><h4>Add-ons</h4>
                        <KV rows={[["Setup & customization", hasAddon(u, "supportCustomize") ? <Tag key="a" tone="good">Active</Tag> : "Not purchased"], ["Verified portfolio", hasAddon(u, "verifiedPortfolio") ? <Tag key="b" tone="good">Active</Tag> : "Not purchased"]]} /></div>

                      <div className="card sec"><h4>Account</h4>
                        <KV rows={[["Status", statusOf(u)], ["Registered", fmtDateTime(u.createdAt)], ["Last updated", fmtDateTime(u.updatedAt)], ["Last active", lastSeen(u) ? fmtDateTime(lastSeen(u)) : null], ["User ID", u._id]]} /></div>

                      {extras.length > 0 && (
                        <div className="card sec"><h4>Other stored fields</h4><KV rows={extras.map(([k, v]) => [k, String(v)])} /></div>
                      )}

                      <div className="card sec"><h4>Actions</h4>
                        <div className="acts">
                          <button className="btn pri sm" onClick={() => setSubModal({ user: u, form: { planId: u.subscription?.planId || "price_standard", days: 30, supportCustomize: hasAddon(u, "supportCustomize"), verifiedPortfolio: hasAddon(u, "verifiedPortfolio") } })}>Manage plan & add-ons</button>
                          <button className="btn sm good" onClick={() => run(() => api("post", `/users/${u._id}/subscription/extend`, { days: 30 }), "Extended by 30 days")}>+30 days</button>
                          <button className="btn sm" onClick={() => setConfirm({ title: "Cancel subscription?", text: `${fullName(u)} will lose their paid plan right away.`, label: "Cancel subscription", danger: true, go: () => run(() => api("post", `/users/${u._id}/subscription/cancel`), "Subscription cancelled") })} disabled={!u.subscribed}>Cancel plan</button>
                          <button className="btn sm" onClick={() => setEditModal({ user: u, form: { firstName: u.firstName || "", lastName: u.lastName || "", phone: phoneOf(u), city: cityOf(u), country: countryOf(u) } })}><Ico n="edit" s={14} />Edit profile</button>
                          <button className="btn sm" onClick={() => remindMail(u)}><Ico n="mail" s={14} />Email</button>
                          <button className="btn sm" onClick={() => printHTML(`${fullName(u)} sheet`, userSheetHTML(u, warn), notify)}><Ico n="print" s={14} />Print sheet</button>
                        </div>
                        {!isOwnerRow && (
                          <div className="acts" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                            {statusOf(u) !== "Active" && <button className="btn sm good" onClick={() => setStatus(u, "Active")}>Reactivate</button>}
                            {statusOf(u) === "Active" && <button className="btn sm warn" onClick={() => setStatus(u, "Suspended")}>Suspend</button>}
                            {statusOf(u) !== "Terminated" && <button className="btn sm bad" onClick={() => setStatus(u, "Terminated")}>Terminate</button>}
                            <button className="btn sm bad" onClick={() => deleteUser(u)}><Ico n="trash" s={14} />Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ───── MODALS ───── */}
      <AnimatePresence>
        {subModal && (
          <Modal onClose={() => setSubModal(null)} key="sub">
            <h3>Manage plan & add-ons</h3>
            <p className="mute" style={{ marginBottom: 18 }}>{fullName(subModal.user)} · {subModal.user.email}</p>
            <div className="field"><label>Plan</label>
              <select className="inp" value={subModal.form.planId} onChange={(e) => setSubModal({ ...subModal, form: { ...subModal.form, planId: e.target.value } })}>
                <option value="price_standard">Standard</option><option value="price_premium">Premium</option><option value="price_ultimate">Ultimate</option></select></div>
            <div className="field"><label>Duration from today (days)</label>
              <input className="inp" type="number" min="1" value={subModal.form.days} onChange={(e) => setSubModal({ ...subModal, form: { ...subModal.form, days: e.target.value } })} /></div>
            <div className="box">
              <label><input type="checkbox" className="chk" checked={subModal.form.supportCustomize} onChange={(e) => setSubModal({ ...subModal, form: { ...subModal.form, supportCustomize: e.target.checked } })} />Setup & customization service ({money(cfg.setupPrice)})</label>
              <label><input type="checkbox" className="chk" checked={subModal.form.verifiedPortfolio} onChange={(e) => setSubModal({ ...subModal, form: { ...subModal.form, verifiedPortfolio: e.target.checked } })} />Verified portfolio service ({money(cfg.portfolioPrice)})</label>
            </div>
            <div className="foot">
              <button className="btn" onClick={() => setSubModal(null)}>Cancel</button>
              <button className="btn pri" onClick={async () => { if (await run(() => api("patch", `/users/${subModal.user._id}/subscription`, subModal.form), "Subscription saved")) setSubModal(null); }}>Save changes</button>
            </div>
          </Modal>
        )}

        {editModal && (
          <Modal onClose={() => setEditModal(null)} key="edit">
            <h3>Edit profile</h3>
            <p className="mute" style={{ marginBottom: 18 }}>{editModal.user.email}</p>
            {[["firstName", "First name"], ["lastName", "Last name"], ["phone", "Phone"], ["city", "City"], ["country", "Country"]].map(([k, l]) => (
              <div className="field" key={k}><label>{l}</label><input className="inp" value={editModal.form[k]} onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, [k]: e.target.value } })} /></div>
            ))}
            <div className="foot">
              <button className="btn" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn pri" onClick={async () => { if (await run(() => api("patch", `/users/${editModal.user._id}`, editModal.form), "Profile saved")) setEditModal(null); }}>Save changes</button>
            </div>
          </Modal>
        )}

        {confirm && (
          <Modal onClose={() => setConfirm(null)} key="confirm">
            <h3>{confirm.title}</h3>
            <p className="mute" style={{ margin: "6px 0 20px" }}>{confirm.text}</p>
            <div className="foot">
              <button className="btn" onClick={() => setConfirm(null)}>Keep as is</button>
              <button className={`btn ${confirm.danger ? "bad" : "pri"}`} style={confirm.danger ? { background: "var(--bad)", color: "#fff" } : null} onClick={async () => { const c = confirm; setConfirm(null); await c.go(); }}>{confirm.label}</button>
            </div>
          </Modal>
        )}

        {printModal && <PrintDialog key="print" {...printModal} cols={cols} notify={notify} onClose={() => setPrintModal(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <motion.div key="toast" className={`toast ${toast.type}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status">{toast.msg}</motion.div>}
      </AnimatePresence>
    </div>
  );
}

/* Print dialog: choose which columns go on the paper */
function PrintDialog({ rows, title, cols, notify, onClose }) {
  const [on, setOn] = useState(() => cols.filter((c) => c.on).map((c) => c.id));
  const chosen = cols.filter((c) => on.includes(c.id));
  return (
    <Modal onClose={onClose} wide>
      <h3>Print {title.toLowerCase()}</h3>
      <p className="mute" style={{ marginBottom: 16 }}>{rows.length} user{rows.length === 1 ? "" : "s"} will be printed. Pick the details to include.</p>
      <div className="checks">
        {cols.map((c) => (
          <label key={c.id}><input type="checkbox" className="chk" checked={on.includes(c.id)} onChange={() => setOn(on.includes(c.id) ? on.filter((i) => i !== c.id) : [...on, c.id])} />{c.label}</label>
        ))}
      </div>
      <div className="foot">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!chosen.length} onClick={() => downloadCSV(rows, chosen, "users.csv")}><Ico n="download" s={16} />CSV</button>
        <button className="btn pri" disabled={!chosen.length || !rows.length} onClick={() => { printHTML(title, listHTML(rows, chosen, title), notify); onClose(); }}><Ico n="print" s={16} />Print</button>
      </div>
    </Modal>
  );
}

export default AdminPanel;
