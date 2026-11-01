import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

/* ───────────── API base (same resolution order as before) ───────────── */
const resolveApiBase = () => {
  try {
    if (typeof process !== "undefined" && process?.env?.REACT_APP_API_BASE_URL) return process.env.REACT_APP_API_BASE_URL;
    if (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    if (typeof window !== "undefined") {
      if (window.__env?.REACT_APP_API_BASE_URL) return window.__env.REACT_APP_API_BASE_URL;
      if (window.REACT_APP_API_BASE_URL) return window.REACT_APP_API_BASE_URL;
    }
  } catch (e) { /* ignore */ }
  return "http://api.promiapi.com"; // default fallback
};
const API_BASE_URL = resolveApiBase();

/* ───────────── Config ───────────── */
const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "28d", label: "28 days" },
  { value: "90d", label: "90 days" },
];

// goodWhenUp: true = growth is good, false = growth is bad, null = neutral (spend)
const METRICS = [
  { key: "spend", label: "Estimated spend", color: "#2F46E0", icon: "spend", format: "money", goodWhenUp: null, group: "Outreach" },
  { key: "sent", label: "Messages sent", color: "#0D9488", icon: "sent", format: "count", goodWhenUp: true, group: "Outreach" },
  { key: "received", label: "Replies received", color: "#8B5CF6", icon: "received", format: "count", goodWhenUp: true, group: "Outreach" },
  { key: "leads", label: "New leads", color: "#F79009", icon: "leads", format: "count", goodWhenUp: true, group: "Outreach" },
  { key: "confirmedMessages", label: "Order confirmations", color: "#12B76A", icon: "confirm", format: "count", goodWhenUp: true, group: "Orders" },
  { key: "totalSales", label: "Confirmed sales", color: "#0EA5E9", icon: "sales", format: "count", goodWhenUp: true, group: "Orders" },
  { key: "cancelledOrders", label: "Cancelled orders", color: "#F04438", icon: "cancel", format: "count", goodWhenUp: false, group: "Orders" },
];
const GROUPS = ["Outreach", "Orders"];

const C = { line: "#E4E7EC", axis: "#667085", ink: "#101828" };
const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const moneyCompact = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const num = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const numCompact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

const fmt = (m, v, compact = false) => {
  const n = Number(v) || 0;
  if (m.format === "money") return compact && Math.abs(n) >= 10000 ? moneyCompact.format(n) : money.format(n);
  return compact && Math.abs(n) >= 10000 ? numCompact.format(n) : num.format(n);
};
const axisFmt = (m, v) => (m.format === "money" ? moneyCompact.format(v) : numCompact.format(v));

const parseDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
};
const shortDate = (ts) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const longDate = (ts) => new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const sum = (a) => a.reduce((x, y) => x + y, 0);

/** Second half of the period compared with the first half. */
const trendOf = (vals) => {
  const n = Math.floor(vals.length / 2);
  if (n < 1) return null;
  const a = sum(vals.slice(0, n)), b = sum(vals.slice(vals.length - n));
  if (a === 0) return b === 0 ? null : { pct: null, dir: 1 };
  const pct = ((b - a) / Math.abs(a)) * 100;
  return { pct, dir: Math.abs(pct) < 0.05 ? 0 : pct > 0 ? 1 : -1 };
};
const toneOf = (m, t) => (!t || t.dir === 0 || m.goodWhenUp === null ? "neutral" : (t.dir > 0) === m.goodWhenUp ? "good" : "bad");
const pillText = (t) => (!t ? "—" : t.pct === null ? "New" : t.dir === 0 ? "0%" : `${t.pct > 0 ? "+" : ""}${t.pct.toFixed(1)}%`);

const errText = (err) =>
  err?.response?.status === 401
    ? "Your session has expired. Sign in again to continue."
    : err?.response?.data?.message || err?.message || "Couldn't load analytics.";

/* ───────────── Icons ───────────── */
const ICONS = {
  spend: <><path d="M12 3v18" /><path d="M16 7.5c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5 1.8 2.5 4 2.5 4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5" /></>,
  confirm: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  sales: <><path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
  cancel: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  sent: <path d="M21 3l-7 18-4-7-7-4 18-7zM21 3 10 14" />,
  received: <><path d="M3 13h5l1 3h6l1-3h5" /><path d="M5 5h14l2 8v6H3v-6l2-8z" /></>,
  leads: <><circle cx="10" cy="8" r="4" /><path d="M3 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" /><path d="M19 8v6M16 11h6" /></>,
  up: <path d="M7 17 17 7M8 7h9v9" />,
  down: <path d="M7 7l10 10M17 8v9H8" />,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></>,
  alert: <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v5M12 18h.01" /></>,
  chart: <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />,
};
const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    {ICONS[name]}
  </svg>
);

/* ───────────── Small components ───────────── */
const Pill = ({ m, t }) => {
  const tone = toneOf(m, t);
  return (
    <span className={`an-pill an-pill--${tone}`} title="Second half of the period compared with the first half">
      {t && t.dir !== 0 && <Icon name={t.dir > 0 ? "up" : "down"} size={12} />}
      {pillText(t)}
    </span>
  );
};

const Spark = ({ m, data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
      <defs>
        <linearGradient id={`an-sp-${m.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={m.color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={1.75} fill={`url(#an-sp-${m.key})`} dot={false} isAnimationActive={false} />
    </AreaChart>
  </ResponsiveContainer>
);

const ChartTooltip = ({ active, payload, m }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="an-tip">
      <div className="an-tip-date">{longDate(row.ts)}</div>
      <div className="an-tip-row"><i style={{ background: m.color }} />{m.label}<b>{fmt(m, row[m.key])}</b></div>
    </div>
  );
};

/* ───────────── Main component ───────────── */
function Analytics() {
  const [timeRange, setTimeRange] = useState("28d");
  const [activeKey, setActiveKey] = useState("spend");
  const [chartType, setChartType] = useState("area");
  const [showAvg, setShowAvg] = useState(true);
  const [data, setData] = useState({ totals: {}, chart: [] });
  const [initial, setInitial] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setFetching(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/analytics/overview`, {
        params: { range: timeRange },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: ac.signal,
      });
      if (res.data?.success) {
        const p = res.data.data || {};
        setData({ totals: p.totals || {}, chart: Array.isArray(p.chart) ? p.chart : [] });
        setLastUpdated(Date.now());
      } else {
        setError("The server returned no analytics for this period.");
      }
    } catch (err) {
      if (axios.isCancel(err) || err?.name === "CanceledError") return;
      console.error("Analytics API error:", err);
      setError(errText(err));
    } finally {
      if (abortRef.current === ac) { setFetching(false); setInitial(false); }
    }
  }, [timeRange]);

  useEffect(() => { load(); return () => abortRef.current?.abort(); }, [load]);

  /* derived */
  const series = useMemo(
    () =>
      data.chart
        .map((d) => {
          const row = { ts: +parseDate(d.date) };
          METRICS.forEach((m) => { row[m.key] = Number(d[m.key]) || 0; });
          return row;
        })
        .sort((a, b) => a.ts - b.ts),
    [data.chart]
  );
  const active = METRICS.find((m) => m.key === activeKey) || METRICS[0];
  const vals = useMemo(() => series.map((r) => r[active.key]), [series, active]);
  const hasActivity = vals.some((v) => v !== 0);
  const total = data.totals?.[active.key] ?? sum(vals);
  const stats = useMemo(() => {
    if (!vals.length) return null;
    const max = Math.max(...vals), min = Math.min(...vals);
    return { avg: sum(vals) / vals.length, max, maxTs: series[vals.indexOf(max)].ts, min, minTs: series[vals.indexOf(min)].ts };
  }, [vals, series]);
  const activeTrend = trendOf(vals);

  const received = Number(data.totals?.received) || 0, sentTotal = Number(data.totals?.sent) || 0;
  const spendTotal = Number(data.totals?.spend) || 0, leadsTotal = Number(data.totals?.leads) || 0;
  const replyRate = sentTotal ? `${((received / sentTotal) * 100).toFixed(1)}%` : "—";
  const costPerLead = leadsTotal ? money.format(spendTotal / leadsTotal) : "—";

  const exportCsv = () => {
    const head = ["Date", ...METRICS.map((m) => m.label)];
    const rows = series.map((r) => [new Date(r.ts).toISOString().slice(0, 10), ...METRICS.map((m) => r[m.key])]);
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const xTick = (ts) => shortDate(ts);
  const chartLabel = `${active.label} over the last ${RANGES.find((r) => r.value === timeRange)?.label}. Total ${fmt(active, total)}.${stats ? ` Peak ${fmt(active, stats.max)} on ${shortDate(stats.maxTs)}.` : ""}`;
  const commonAxes = (
    <>
      <CartesianGrid stroke={C.line} vertical={false} />
      <XAxis dataKey="ts" tickFormatter={xTick} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: C.line }} minTickGap={28} tickMargin={10} />
      <YAxis tickFormatter={(v) => axisFmt(active, v)} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={52} allowDecimals={active.format === "money"} domain={[0, "auto"]} tickCount={5} />
      {showAvg && stats && hasActivity && (
        <ReferenceLine y={stats.avg} stroke={C.axis} strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: `Avg ${fmt(active, stats.avg, true)}`, position: "insideTopRight", fill: C.axis, fontSize: 11 }} />
      )}
    </>
  );

  return (
    <div className="an-root" aria-busy={fetching}>
      <style>{CSS}</style>
      <div className="an-wrap">
        {/* Header */}
        <header className="an-head">
          <div>
            <h1 className="an-title">Analytics</h1>
            <p className="an-sub">WhatsApp messaging, order confirmations and ad spend for the period you choose.</p>
          </div>
          <div className="an-tools">
            <div className="an-seg" role="radiogroup" aria-label="Time range">
              {RANGES.map((r) => (
                <button type="button" key={r.value} role="radio" aria-checked={timeRange === r.value} onClick={() => setTimeRange(r.value)}>{r.label}</button>
              ))}
            </div>
            <button type="button" className="an-btn" onClick={load} disabled={fetching} title={lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString("en-GB", { timeStyle: "short" })}` : "Refresh"}>
              <span className={fetching ? "an-spin" : ""} style={{ display: "flex" }}><Icon name="refresh" size={15} /></span>
              {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString("en-GB", { timeStyle: "short" })}` : "Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="an-alert" role="alert">
            <Icon name="alert" size={18} />
            <span>{error}{series.length > 0 && " Showing the last data that loaded."}</span>
            <button type="button" className="an-btn an-btn--sm" onClick={load}>Try again</button>
          </div>
        )}

        {/* Metric cards */}
        <div className="an-dim">
          {GROUPS.map((g) => (
            <section key={g} className="an-group" aria-label={g}>
              <h2 className="an-group-title">{g}</h2>
              <div className="an-cards">
                {METRICS.filter((m) => m.group === g).map((m) => {
                  const isActive = m.key === activeKey;
                  const t = trendOf(series.map((r) => r[m.key]));
                  return (
                    <button type="button" key={m.key} className={`an-card${isActive ? " active" : ""}`} style={{ "--c": m.color }} aria-pressed={isActive} onClick={() => setActiveKey(m.key)}>
                      {initial ? (
                        <>
                          <span className="an-sk" style={{ width: 120 }} />
                          <span className="an-sk" style={{ width: 90, height: 24 }} />
                          <span className="an-sk" style={{ width: 70 }} />
                        </>
                      ) : (
                        <>
                          <span className="an-card-top"><span className="an-chip"><Icon name={m.icon} size={15} /></span>{m.label}</span>
                          <span className="an-card-mid">
                            <b className="an-card-value">{fmt(m, data.totals?.[m.key] ?? 0, true)}</b>
                            <span className="an-spark">{series.length > 1 && <Spark m={m} data={series} />}</span>
                          </span>
                          <span className="an-card-foot"><Pill m={m} t={t} /><span>vs first half</span></span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Chart */}
        <section className="an-panel" aria-label={`${active.label} chart`} style={{ "--c": active.color }}>
          {fetching && <div className="an-progress" />}
          <div className="an-panel-head">
            <div>
              <div className="an-panel-name"><span className="an-chip"><Icon name={active.icon} size={15} /></span>{active.label}</div>
              {initial ? (
                <span className="an-sk" style={{ width: 160, height: 32, marginTop: 8 }} />
              ) : (
                <div className="an-big">
                  <span className="an-bignum">{fmt(active, total)}</span>
                  <Pill m={active} t={activeTrend} />
                  <span className="an-meta">vs first half of the period</span>
                </div>
              )}
            </div>
            <div className="an-panel-tools">
              <div className="an-seg" role="radiogroup" aria-label="Chart type">
                <button type="button" role="radio" aria-checked={chartType === "area"} onClick={() => setChartType("area")}>Area</button>
                <button type="button" role="radio" aria-checked={chartType === "bar"} onClick={() => setChartType("bar")}>Bars</button>
              </div>
              <button type="button" className="an-btn" aria-pressed={showAvg} onClick={() => setShowAvg((v) => !v)}>Average line</button>
              <button type="button" className="an-btn" onClick={exportCsv} disabled={series.length === 0}><Icon name="download" size={15} />Export CSV</button>
            </div>
          </div>

          <div className="an-plot an-dim" role="img" aria-label={chartLabel}>
            {initial ? (
              <div className="an-sk" style={{ width: "100%", height: "100%", borderRadius: 12 }} />
            ) : series.length === 0 || !hasActivity ? (
              <div className="an-empty">
                <span className="an-empty-ico"><Icon name="chart" size={20} /></span>
                <h3>{error && series.length === 0 ? "Couldn't load this chart" : "No activity in this period"}</h3>
                <p>{error && series.length === 0 ? "Check your connection, then try again." : `There's no ${active.label.toLowerCase()} data for the last ${RANGES.find((r) => r.value === timeRange)?.label}. Try a longer range.`}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={series} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="an-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={active.color} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={active.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {commonAxes}
                    <Tooltip content={(p) => <ChartTooltip {...p} m={active} />} cursor={{ stroke: C.axis, strokeDasharray: "3 3" }} />
                    <Area type="monotone" dataKey={active.key} stroke={active.color} strokeWidth={2.25} fill="url(#an-grad)" dot={false} activeDot={{ r: 5, fill: active.color, stroke: "#fff", strokeWidth: 2 }} animationDuration={500} />
                  </AreaChart>
                ) : (
                  <BarChart data={series} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    {commonAxes}
                    <Tooltip content={(p) => <ChartTooltip {...p} m={active} />} cursor={{ fill: "rgba(16,24,40,.05)" }} />
                    <Bar dataKey={active.key} fill={active.color} radius={[4, 4, 0, 0]} maxBarSize={26} animationDuration={500} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {!initial && stats && hasActivity && (
            <dl className="an-stats">
              <div><dt>Daily average</dt><dd>{fmt(active, stats.avg, true)}</dd></div>
              <div><dt>Best day</dt><dd>{fmt(active, stats.max, true)}<span>{shortDate(stats.maxTs)}</span></dd></div>
              <div><dt>Lowest day</dt><dd>{fmt(active, stats.min, true)}<span>{shortDate(stats.minTs)}</span></dd></div>
              <div><dt>Days with activity</dt><dd>{vals.filter((v) => v > 0).length}<span>of {vals.length}</span></dd></div>
            </dl>
          )}
        </section>

        {/* Ratios */}
        {!initial && (
          <section className="an-ratios" aria-label="Performance ratios">
            <div className="an-ratio">
              <span className="an-ratio-label">Reply rate</span>
              <b>{replyRate}</b>
              <span className="an-meta">Replies received per message sent</span>
            </div>
            <div className="an-ratio">
              <span className="an-ratio-label">Cost per lead</span>
              <b>{costPerLead}</b>
              <span className="an-meta">Estimated spend per new lead</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ───────────── Styles (scoped to .an-root) ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.an-root{--bg:#F2F4F7;--surface:#fff;--surface-2:#F8F9FB;--line:#E4E7EC;--line-2:#D0D5DD;--ink:#101828;--ink-2:#475467;--ink-3:#667085;--accent:#2F46E0;--accent-soft:#EBEEFF;--ok:#067647;--ok-bg:#E7F6EC;--bad:#B42318;--bad-bg:#FEECEA;
font-family:"Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;line-height:1.5;color:var(--ink);background:var(--bg);min-height:100vh;padding:clamp(16px,3vw,40px);-webkit-font-smoothing:antialiased}
.an-root *,.an-root *::before,.an-root *::after{box-sizing:border-box}
.an-root button{font:inherit;color:inherit;cursor:pointer}
.an-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.an-wrap{max-width:1240px;margin:0 auto}
.an-head{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.an-title{font-size:clamp(22px,3.4vw,28px);font-weight:800;letter-spacing:-.02em;margin:0;line-height:1.2}
.an-sub{margin:4px 0 0;color:var(--ink-3);max-width:62ch}
.an-tools,.an-panel-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.an-seg{display:inline-flex;padding:3px;gap:2px;background:var(--surface);border:1px solid var(--line-2);border-radius:10px}
.an-seg button{border:0;background:transparent;height:30px;padding:0 14px;border-radius:7px;font-weight:600;font-size:13px;color:var(--ink-2)}
.an-seg button:hover{color:var(--ink)}
.an-seg button[aria-checked=true]{background:var(--ink);color:#fff}
.an-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:36px;padding:0 14px;border-radius:9px;border:1px solid var(--line-2);background:var(--surface);font-weight:600;font-size:13.5px;white-space:nowrap;transition:background .15s,border-color .15s}
.an-btn:hover:not(:disabled){background:var(--surface-2);border-color:var(--ink-3)}
.an-btn:disabled{opacity:.55;cursor:not-allowed}
.an-btn[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.an-btn--sm{height:30px;padding:0 10px;font-size:12.5px;border-radius:8px}
.an-spin{animation:an-rot .9s linear infinite}
@keyframes an-rot{to{transform:rotate(360deg)}}
.an-alert{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:12px;background:var(--bad-bg);color:var(--bad);border:1px solid #FDA29B;margin-bottom:16px;font-weight:500}
.an-alert span{flex:1}
.an-root[aria-busy=true] .an-dim{opacity:.6}
.an-dim{transition:opacity .2s}
.an-group{margin-bottom:16px}
.an-group-title{font-size:13px;font-weight:700;color:var(--ink-3);margin:0 0 8px}
.an-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.an-card{display:grid;gap:10px;text-align:left;padding:14px 16px;background:var(--surface);border:1px solid var(--line);border-radius:14px;min-height:112px;transition:border-color .15s,box-shadow .15s}
.an-card:hover{border-color:var(--line-2)}
.an-card.active{border-color:var(--c);box-shadow:0 0 0 1px var(--c)}
.an-card-top{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink-2)}
.an-chip{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex:none;color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent)}
.an-card-mid{display:flex;align-items:center;justify-content:space-between;gap:10px}
.an-card-value{font-size:24px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1}
.an-spark{width:84px;height:34px;flex:none}
.an-card-foot{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-3)}
.an-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;background:var(--surface-2);color:var(--ink-2)}
.an-pill--good{background:var(--ok-bg);color:var(--ok)}
.an-pill--bad{background:var(--bad-bg);color:var(--bad)}
.an-panel{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px 18px;margin-bottom:16px;overflow:hidden}
.an-progress{position:absolute;left:0;top:0;height:2px;width:35%;background:var(--c);animation:an-slide 1.1s ease-in-out infinite}
@keyframes an-slide{0%{left:-35%}100%{left:100%}}
.an-panel-head{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.an-panel-name{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink-2)}
.an-big{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}
.an-bignum{font-size:clamp(26px,4vw,34px);font-weight:800;letter-spacing:-.03em;line-height:1.1;font-variant-numeric:tabular-nums}
.an-meta{color:var(--ink-3);font-size:12.5px}
.an-plot{height:340px;width:100%}
.an-plot .recharts-wrapper{outline:none}
.an-tip{background:var(--ink);color:#fff;border-radius:10px;padding:9px 12px;box-shadow:0 12px 28px -8px rgba(16,24,40,.45);font-size:13px;min-width:150px}
.an-tip-date{color:#98A2B3;font-size:12px;margin-bottom:4px}
.an-tip-row{display:flex;align-items:center;gap:8px}
.an-tip-row i{width:8px;height:8px;border-radius:50%;flex:none}
.an-tip-row b{margin-left:auto;padding-left:14px;font-variant-numeric:tabular-nums}
.an-stats{display:grid;grid-template-columns:repeat(4,1fr);margin:16px 0 0;border-top:1px solid var(--line);padding-top:14px}
.an-stats>div{padding:0 16px;border-left:1px solid var(--line)}
.an-stats>div:first-child{padding-left:0;border-left:0}
.an-stats dt{color:var(--ink-3);font-size:12.5px;margin-bottom:2px}
.an-stats dd{margin:0;font-size:18px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.an-stats dd span{margin-left:8px;font-size:12.5px;font-weight:500;color:var(--ink-3)}
.an-ratios{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.an-ratio{display:grid;gap:2px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.an-ratio-label{font-size:13px;font-weight:600;color:var(--ink-2)}
.an-ratio b{font-size:24px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.an-empty{height:100%;display:grid;place-content:center;justify-items:center;text-align:center;color:var(--ink-3);background:var(--surface-2);border:1px dashed var(--line-2);border-radius:12px;padding:20px}
.an-empty h3{margin:14px 0 4px;color:var(--ink);font-size:16px}
.an-empty p{margin:0;max-width:44ch}
.an-empty-ico{width:44px;height:44px;border-radius:12px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center}
.an-sk{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,var(--line) 25%,var(--surface-2) 50%,var(--line) 75%);background-size:200% 100%;animation:an-sh 1.4s infinite}
@keyframes an-sh{to{background-position:-200% 0}}
@media(max-width:760px){
  .an-plot{height:260px}
  .an-panel{padding:16px}
  .an-stats{grid-template-columns:1fr 1fr;row-gap:14px}
  .an-stats>div:nth-child(odd){padding-left:0;border-left:0}
  .an-seg button{padding:0 10px}
}
@media(prefers-reduced-motion:reduce){.an-root *{animation:none!important;transition:none!important}}
`;

export default Analytics;
