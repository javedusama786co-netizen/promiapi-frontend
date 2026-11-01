import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";

/* ================================================================== */
/*  AGENT ANALYTICS POPUP (chart, filters, summary)                   */
/* ================================================================== */
/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const RANGES = [
  { id: "today", label: "Today", unit: "hour", period: "Today", prevPhrase: "yesterday" },
  { id: "7d", label: "7 Days", unit: "day", period: "Last 7 days", prevPhrase: "in the previous 7 days" },
  { id: "30d", label: "30 Days", unit: "day", period: "Last 30 days", prevPhrase: "in the previous 30 days" },
  { id: "1y", label: "1 Year", unit: "month", period: "Last 12 months", prevPhrase: "in the previous 12 months" }
];

const METRICS = [
  { id: "messages", label: "Replies", c1: "#60a5fa", c2: "#1d4ed8", p1: "#818cf8", p2: "#3730a3" },
  { id: "minutes", label: "Active time", c1: "#6ee7b7", c2: "#059669", p1: "#34d399", p2: "#065f46" }
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatMinutes = (value) => {
  const total = Math.round(Number(value) || 0);
  if (total <= 0) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatNumber = (value) => {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

const formatMetric = (metricId, value) =>
  metricId === "minutes" ? formatMinutes(value) : formatNumber(value);

const describeLastActive = (iso) => {
  if (!iso) return { text: "Never active", live: false };
  const date = new Date(iso);
  if (isNaN(date.getTime())) return { text: "Never active", live: false };
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 5) return { text: "Active now", live: true };
  if (mins < 60) return { text: `Last active ${mins} min ago`, live: false };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { text: `Last active ${hours} h ago`, live: false };
  const days = Math.floor(hours / 24);
  if (days < 30) return { text: `Last active ${days} day${days === 1 ? "" : "s"} ago`, live: false };
  return { text: `Last active ${date.toLocaleDateString()}`, live: false };
};

const calcChange = (current, previous) => {
  if (!previous && !current) return { kind: "none" };
  if (!previous) return { kind: "new" };
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.05) return { kind: "flat" };
  return { kind: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
};

const formatPct = (pct) => (pct < 10 ? pct.toFixed(1) : Math.round(pct).toString());

// Picks a tidy axis (4 equal intervals) that fits the biggest bar.
const niceScale = (peak, isMinutes) => {
  const raw = Math.max(peak, 4) / 4;
  let step;
  if (isMinutes) {
    const steps = [1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 1440];
    step = steps.find((s) => s >= raw) || Math.ceil(raw / 1440) * 1440;
  } else {
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const candidates = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => Math.max(1, Math.ceil(m * pow)));
    step = candidates.find((s) => s >= raw) || Math.ceil(raw);
  }
  return { step, max: step * 4 };
};

const labelEvery = (rangeId, narrow) => {
  if (rangeId === "today") return narrow ? 6 : 3;
  if (rangeId === "30d") return narrow ? 7 : 3;
  if (rangeId === "1y") return narrow ? 2 : 1;
  return 1;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const to = Number(target) || 0;
    if (prefersReducedMotion()) {
      fromRef.current = to;
      setValue(to);
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      fromRef.current = current;
      setValue(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function useIsNarrow(breakpoint) {
  const [narrow, setNarrow] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return narrow;
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Segmented({ options, value, onChange, label, size }) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div
      className={`aam-seg ${size === "sm" ? "aam-seg-sm" : ""}`}
      role="group"
      aria-label={label}
      style={{ "--n": options.length, "--i": index }}
    >
      <span className="aam-seg-thumb" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Arrow = ({ down }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ transform: down ? "rotate(180deg)" : "none" }}>
    <path d="M5 1.5 9 7.5H1z" fill="currentColor" />
  </svg>
);

function Delta({ change }) {
  if (change.kind === "none") return <span className="aam-delta aam-delta-flat">No activity</span>;
  if (change.kind === "new") return <span className="aam-delta aam-delta-new">New activity</span>;
  if (change.kind === "flat") return <span className="aam-delta aam-delta-flat">No change</span>;
  const up = change.kind === "up";
  return (
    <span className={`aam-delta ${up ? "aam-delta-up" : "aam-delta-down"}`}>
      <Arrow down={!up} />
      {formatPct(change.pct)}%
    </span>
  );
}

function Cell({ label, children, foot }) {
  return (
    <div className="aam-cell">
      <span className="aam-cell-label">{label}</span>
      {children}
      {foot}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar chart                                                          */
/* ------------------------------------------------------------------ */

function BarChart({ data, metric, narrow, rangeCfg }) {
  const [hover, setHover] = useState(null);

  const values = data[metric.id] || [];
  const otherId = metric.id === "messages" ? "minutes" : "messages";
  const others = data[otherId] || [];
  const isMinutes = metric.id === "minutes";
  const count = values.length;
  const peakValue = Math.max(0, ...values);
  const hasData = peakValue > 0;
  const peakIndex = hasData ? values.indexOf(peakValue) : -1;
  const { step, max } = niceScale(peakValue, isMinutes);
  const average = count ? values.reduce((a, b) => a + b, 0) / count : 0;
  const every = labelEvery(rangeCfg.id, narrow);
  const ticks = [4, 3, 2, 1, 0].map((i) => i * step);
  const gap = count > 12 ? 4 : 10;

  useEffect(() => setHover(null), [data, metric.id]);

  return (
    <div
      className="aam-chart"
      role="img"
      aria-label={`${metric.label} per ${rangeCfg.unit}, ${rangeCfg.period.toLowerCase()}. Highest: ${
        hasData ? `${formatMetric(metric.id, peakValue)} on ${data.fullLabels[peakIndex]}` : "no activity"
      }.`}
    >
      <div className="aam-plotrow">
        <div className="aam-yaxis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>
              {isMinutes ? formatMinutes(t) : formatNumber(t)}
            </span>
          ))}
        </div>

        <div className="aam-plot">
          {ticks.map((t) => (
            <div
              key={t}
              className={`aam-grid ${t === 0 ? "aam-grid-base" : ""}`}
              style={{ bottom: `${(t / max) * 100}%` }}
            />
          ))}

          <div
            className={`aam-bars ${hover !== null ? "aam-has-hover" : ""}`}
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: `${gap}px` }}
            onMouseLeave={() => setHover(null)}
          >
            {values.map((v, i) => {
              const pct = (v / max) * 100;
              const isPeak = i === peakIndex;
              const edge = i <= 1 ? "aam-tip-left" : i >= count - 2 ? "aam-tip-right" : "";
              return (
                <div
                  key={i}
                  className={`aam-col ${hover === i ? "aam-col-on" : ""}`}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover((h) => (h === i ? null : i))}
                >
                  <div
                    className={`aam-bar ${v <= 0 ? "aam-bar-zero" : ""} ${isPeak ? "aam-bar-peak" : ""}`}
                    style={{
                      height: v > 0 ? `max(${pct}%, 4px)` : undefined,
                      animationDelay: `${Math.min(i * 18, 480)}ms`
                    }}
                  />
                  {hover === i && (
                    <div className={`aam-tip ${edge}`} style={{ bottom: `calc(${pct}% + 10px)` }}>
                      <span className="aam-tip-label">{data.fullLabels[i]}</span>
                      <strong>
                        {formatMetric(metric.id, v)} {isMinutes ? "active" : v === 1 ? "reply" : "replies"}
                      </strong>
                      <span className="aam-tip-sub">
                        {otherId === "minutes"
                          ? `${formatMinutes(others[i])} active`
                          : `${formatNumber(others[i])} ${others[i] === 1 ? "reply" : "replies"}`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasData && average > 0 && (
            <div className="aam-avg" style={{ bottom: `${(average / max) * 100}%` }} aria-hidden="true">
              <span>Avg {formatMetric(metric.id, average)}</span>
            </div>
          )}

          {!hasData && (
            <div className="aam-empty">
              <strong>No activity in this period</strong>
              <span>Replies and active time show up here once this member starts working in the inbox.</span>
            </div>
          )}
        </div>
      </div>

      <div className="aam-xrow">
        <div className="aam-ygap" />
        <div className="aam-xaxis" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: `${gap}px` }}>
          {data.labels.map((label, i) => (
            <div key={i} className={hover === i ? "aam-x-on" : ""}>
              {i % every === 0 || hover === i ? <span>{label}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  const heights = [38, 62, 48, 80, 55, 92, 44];
  return (
    <div className="aam-skel-wrap" aria-hidden="true">
      {heights.map((h, i) => (
        <div key={i} className="aam-skel" style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

function AgentAnalyticsModal({ member, apiBaseUrl, onClose }) {
  const [range, setRange] = useState("7d");
  const [metricId, setMetricId] = useState("messages");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const narrow = useIsNarrow(560);

  const memberId = member._id || member.id;
  const metric = METRICS.find((m) => m.id === metricId);
  const rangeCfg = RANGES.find((r) => r.id === (data?.range || range));

  // Esc to close, lock page scroll, move focus into the dialog.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Load real data whenever the range changes.
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    axios
      .get(`${apiBaseUrl}/api/team/analytics/${memberId}`, {
        params: { range },
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      })
      .then((res) => {
        if (res.data?.success) setData(res.data.analytics);
        else setError("Analytics could not be loaded.");
      })
      .catch((err) => {
        if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;
        setError(err.response?.data?.message || "Could not reach the server.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [apiBaseUrl, memberId, range, retryKey]);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  // Numbers for the summary strip.
  const totals = data?.totals || { messages: 0, minutes: 0 };
  const previous = data?.previousTotals || { messages: 0, minutes: 0 };
  const animReplies = useCountUp(totals.messages);
  const animMinutes = useCountUp(totals.minutes);

  const series = data ? data[metricId] : [];
  const activeBuckets = series.filter((v) => v > 0).length;
  const seriesTotal = series.reduce((a, b) => a + b, 0);
  const avgPerActive = activeBuckets ? seriesTotal / activeBuckets : 0;
  const peakValue = Math.max(0, ...series);
  const peakIndex = peakValue > 0 ? series.indexOf(peakValue) : -1;
  const animAvg = useCountUp(avgPerActive);

  const lastActive = describeLastActive(data?.lastActiveAt ?? member.metrics?.lastActiveAt);
  const initials = `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() || "?";
  const status = member.status || "Pending";

  const showDayRibbon = data && data.range !== "today";
  const repliesChange = calcChange(totals.messages, previous.messages);
  const minutesChange = calcChange(totals.minutes, previous.minutes);

  return (
    <div className="aam-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>

      <div
        className="aam-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aam-title"
        style={{ "--c1": metric.c1, "--c2": metric.c2, "--p1": metric.p1, "--p2": metric.p2 }}
      >
        {/* ---------- Header ---------- */}
        <header className="aam-head">
          <div className="aam-avatar" aria-hidden="true">{initials}</div>
          <div className="aam-head-text">
            <h3 id="aam-title">{member.firstName} {member.lastName}</h3>
            <div className="aam-head-meta">
              <span className={`aam-pill aam-pill-${status.toLowerCase()}`}>{status}</span>
              <span>{member.role || "Agent"}</span>
              <span className="aam-sep" aria-hidden="true" />
              <span className="aam-live">
                {lastActive.live && <i className="aam-live-dot" aria-hidden="true" />}
                {lastActive.text}
              </span>
            </div>
          </div>
          <button ref={closeRef} type="button" className="aam-close" onClick={onClose} aria-label="Close analytics">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="aam-body" aria-busy={loading}>
          {/* ---------- Range filter ---------- */}
          <div className="aam-toolbar">
            <Segmented options={RANGES} value={range} onChange={setRange} label="Time range" />
            {data && <span className="aam-tz">Times shown in {data.timezone}</span>}
          </div>

          {error && (
            <div className="aam-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={retry}>Try again</button>
            </div>
          )}

          {/* ---------- Summary strip ---------- */}
          <div className={`aam-strip ${loading && data ? "aam-dim" : ""}`}>
            <Cell
              label="Replies sent"
              foot={
                <div className="aam-foot">
                  <Delta change={repliesChange} />
                  <span>Was {formatNumber(previous.messages)} {rangeCfg.prevPhrase}</span>
                </div>
              }
            >
              <span className="aam-cell-value" style={{ color: "#1d4ed8" }}>{formatNumber(animReplies)}</span>
            </Cell>

            <Cell
              label="Active time"
              foot={
                <div className="aam-foot">
                  <Delta change={minutesChange} />
                  <span>Was {formatMinutes(previous.minutes)} {rangeCfg.prevPhrase}</span>
                </div>
              }
            >
              <span className="aam-cell-value" style={{ color: "#047857" }}>{formatMinutes(animMinutes)}</span>
            </Cell>

            <Cell
              label={`Average per active ${rangeCfg.unit}`}
              foot={
                <div className="aam-foot">
                  <span>
                    {activeBuckets} active {rangeCfg.unit}{activeBuckets === 1 ? "" : "s"}
                  </span>
                </div>
              }
            >
              <span className="aam-cell-value">{formatMetric(metricId, animAvg)}</span>
            </Cell>

            <Cell
              label={`Busiest ${rangeCfg.unit}`}
              foot={
                <div className="aam-foot">
                  <span>{peakIndex >= 0 ? formatMetric(metricId, peakValue) : "No activity yet"}</span>
                </div>
              }
            >
              <span className="aam-cell-value aam-cell-value-sm">
                {peakIndex >= 0 ? data.fullLabels[peakIndex] : "—"}
              </span>
            </Cell>
          </div>

          {/* ---------- Today vs yesterday ---------- */}
          {showDayRibbon && (
            <div className="aam-ribbon">
              <div>
                <span className="aam-ribbon-title">Today</span>
                <strong>{formatNumber(data.today.messages)} replies</strong>
                <span>{formatMinutes(data.today.minutes)} active</span>
              </div>
              <div>
                <span className="aam-ribbon-title">Yesterday</span>
                <strong>{formatNumber(data.yesterday.messages)} replies</strong>
                <span>{formatMinutes(data.yesterday.minutes)} active</span>
              </div>
              <div className="aam-ribbon-delta">
                <Delta change={calcChange(data.today.messages, data.yesterday.messages)} />
                <span>replies vs yesterday</span>
              </div>
            </div>
          )}

          {/* ---------- Chart ---------- */}
          <section className="aam-panel">
            <div className="aam-panel-head">
              <div>
                <h4>{metric.label} per {rangeCfg.unit}</h4>
                <p>{rangeCfg.period}</p>
              </div>
              <Segmented options={METRICS} value={metricId} onChange={setMetricId} label="Chart metric" size="sm" />
            </div>

            <div className={`aam-chart-area ${loading && data ? "aam-dim" : ""}`}>
              {data ? (
                <BarChart
                  key={`${data.range}-${metricId}-${data.generatedAt}`}
                  data={data}
                  metric={metric}
                  narrow={narrow}
                  rangeCfg={rangeCfg}
                />
              ) : (
                <ChartSkeleton />
              )}
            </div>
          </section>
        </div>

        <footer className="aam-foot-actions">
          <button type="button" className="aam-btn" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles (scoped with the aam- prefix)                               */
/* ------------------------------------------------------------------ */

const CSS = `
@keyframes aam-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes aam-pop { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes aam-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes aam-pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.55) } 100% { box-shadow: 0 0 0 8px rgba(16,185,129,0) } }
@keyframes aam-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
@keyframes aam-tip-in { from { opacity: 0; transform: translate(-50%, 4px) } to { opacity: 1; transform: translate(-50%, 0) } }

.aam-overlay { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; background: rgba(15,23,42,.55); backdrop-filter: blur(4px); animation: aam-fade .2s ease-out both; }
.aam-overlay *, .aam-overlay *::before, .aam-overlay *::after { box-sizing: border-box; }
.aam-dialog { width: 100%; max-width: 800px; max-height: 92vh; overflow-y: auto; background: #fff; color: #0f172a; border-radius: 18px; box-shadow: 0 30px 60px -15px rgba(15,23,42,.5); animation: aam-pop .3s cubic-bezier(.2,.9,.3,1) both; }
.aam-dialog button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

/* header */
.aam-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid #e2e8f0; }
.aam-avatar { flex: none; width: 46px; height: 46px; border-radius: 14px; background: #dbeafe; color: #1e40af; display: grid; place-items: center; font-weight: 700; font-size: 16px; letter-spacing: .02em; }
.aam-head-text { flex: 1; min-width: 0; }
.aam-head-text h3 { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aam-head-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 5px; font-size: 13px; color: #64748b; }
.aam-sep { width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1; }
.aam-pill { padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.aam-pill-active { background: #dcfce7; color: #15803d; }
.aam-pill-pending { background: #fef3c7; color: #b45309; }
.aam-pill-inactive { background: #fee2e2; color: #b91c1c; }
.aam-live { display: inline-flex; align-items: center; gap: 7px; }
.aam-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: aam-pulse 1.6s ease-out infinite; }
.aam-close { flex: none; width: 34px; height: 34px; border-radius: 10px; border: 0; background: #f1f5f9; color: #475569; display: grid; place-items: center; cursor: pointer; transition: background .15s, color .15s, transform .15s; }
.aam-close:hover { background: #e2e8f0; color: #0f172a; }
.aam-close:active { transform: scale(.94); }

/* body */
.aam-body { padding: 18px 24px 8px; display: flex; flex-direction: column; gap: 16px; }
.aam-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.aam-tz { font-size: 12px; color: #94a3b8; }
.aam-dim { opacity: .55; transition: opacity .2s; }

/* segmented control */
.aam-seg { position: relative; display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; background: #f1f5f9; border-radius: 12px; padding: 3px; }
.aam-seg-thumb { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / var(--n)); background: #fff; border-radius: 9px; box-shadow: 0 1px 3px rgba(15,23,42,.14), 0 0 0 1px rgba(15,23,42,.04); transform: translateX(calc(var(--i) * 100%)); transition: transform .3s cubic-bezier(.3,.9,.3,1); }
.aam-seg button { position: relative; z-index: 1; border: 0; background: none; padding: 8px 16px; font: inherit; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 9px; white-space: nowrap; transition: color .2s; }
.aam-seg button[aria-pressed="true"] { color: #1e40af; }
.aam-seg-sm button { padding: 6px 12px; font-size: 12.5px; }

/* summary strip */
.aam-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.aam-cell { background: #fff; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.aam-cell-label { font-size: 12.5px; font-weight: 600; color: #64748b; }
.aam-cell-value { font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.aam-cell-value-sm { font-size: 17px; line-height: 1.3; }
.aam-foot { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; font-size: 12px; color: #64748b; }

/* delta pills */
.aam-delta { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.aam-delta-up { background: #dcfce7; color: #15803d; }
.aam-delta-down { background: #fee2e2; color: #b91c1c; }
.aam-delta-flat { background: #f1f5f9; color: #64748b; }
.aam-delta-new { background: #dbeafe; color: #1d4ed8; }

/* today vs yesterday */
.aam-ribbon { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 28px; padding: 12px 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #475569; }
.aam-ribbon > div { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; }
.aam-ribbon-title { font-weight: 600; color: #0f172a; min-width: 62px; }
.aam-ribbon strong { color: #0f172a; font-variant-numeric: tabular-nums; }
.aam-ribbon-delta { margin-left: auto; align-items: center !important; }

/* chart panel */
.aam-panel { border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 16px 12px; }
.aam-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.aam-panel-head h4 { margin: 0; font-size: 15px; font-weight: 700; }
.aam-panel-head p { margin: 3px 0 0; font-size: 12.5px; color: #64748b; }
.aam-chart-area { min-height: 252px; }

.aam-plotrow { display: flex; height: 220px; }
.aam-yaxis { position: relative; flex: none; width: 48px; }
.aam-yaxis span { position: absolute; right: 10px; transform: translateY(50%); font-size: 11px; color: #94a3b8; font-variant-numeric: tabular-nums; white-space: nowrap; }
.aam-plot { position: relative; flex: 1; min-width: 0; }
.aam-grid { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid #eef2f7; }
.aam-grid-base { border-top-color: #cbd5e1; }
.aam-bars { position: absolute; inset: 0; display: grid; padding: 0 3px; z-index: 1; }
.aam-col { position: relative; display: flex; align-items: flex-end; justify-content: center; cursor: pointer; }
.aam-bar { width: 100%; max-width: 38px; border-radius: 7px 7px 2px 2px; background: linear-gradient(180deg, var(--c1), var(--c2)); transform-origin: bottom; animation: aam-grow .65s cubic-bezier(.2,.8,.2,1) both; transition: opacity .15s, filter .15s; }
.aam-bar-peak { background: linear-gradient(180deg, var(--p1), var(--p2)); }
.aam-bar-zero { height: 2px; border-radius: 2px; background: #e2e8f0; animation: none; }
.aam-has-hover .aam-col:not(.aam-col-on) .aam-bar { opacity: .45; }
.aam-col-on .aam-bar { filter: brightness(1.08); }

.aam-avg { position: absolute; left: 0; right: 0; z-index: 2; border-top: 1.5px dashed #64748b; pointer-events: none; }
.aam-avg span { position: absolute; right: 0; top: -22px; padding: 2px 8px; border-radius: 6px; background: #0f172a; color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; }

.aam-tip { position: absolute; z-index: 5; left: 50%; transform: translateX(-50%); min-width: 124px; padding: 8px 11px; border-radius: 10px; background: #0f172a; color: #fff; display: flex; flex-direction: column; gap: 2px; pointer-events: none; white-space: nowrap; box-shadow: 0 10px 20px -6px rgba(15,23,42,.45); animation: aam-tip-in .15s ease-out both; }
.aam-tip strong { font-size: 14px; font-variant-numeric: tabular-nums; }
.aam-tip-label { font-size: 11.5px; color: #94a3b8; }
.aam-tip-sub { font-size: 11.5px; color: #cbd5e1; }
.aam-tip-left { left: 0; transform: none; animation-name: aam-fade; }
.aam-tip-right { left: auto; right: 0; transform: none; animation-name: aam-fade; }

.aam-empty { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; padding: 0 24px; font-size: 12.5px; color: #64748b; }
.aam-empty strong { font-size: 14px; color: #334155; }

.aam-xrow { display: flex; margin-top: 8px; }
.aam-ygap { flex: none; width: 48px; }
.aam-xaxis { flex: 1; min-width: 0; display: grid; padding: 0 3px; }
.aam-xaxis > div { display: flex; justify-content: center; font-size: 11.5px; color: #64748b; min-height: 16px; }
.aam-xaxis span { white-space: nowrap; }
.aam-x-on { color: #0f172a !important; font-weight: 700; }

/* skeleton */
.aam-skel-wrap { height: 220px; margin-left: 48px; display: flex; align-items: flex-end; gap: 14px; padding: 0 3px; border-bottom: 1px solid #cbd5e1; }
.aam-skel { flex: 1; border-radius: 7px 7px 2px 2px; background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%); background-size: 200% 100%; animation: aam-shimmer 1.4s linear infinite; }

/* error + footer */
.aam-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 13px; }
.aam-error button { border: 0; background: #b91c1c; color: #fff; border-radius: 8px; padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.aam-foot-actions { display: flex; justify-content: flex-end; padding: 8px 24px 20px; }
.aam-btn { border: 0; background: #1e40af; color: #fff; border-radius: 10px; padding: 10px 20px; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .15s, transform .15s; }
.aam-btn:hover { background: #1e3a8a; }
.aam-btn:active { transform: scale(.97); }

@media (max-width: 640px) {
  .aam-head { padding: 16px; }
  .aam-body { padding: 14px 16px 6px; }
  .aam-foot-actions { padding: 8px 16px 16px; }
  .aam-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .aam-cell-value { font-size: 22px; }
  .aam-seg { width: 100%; }
  .aam-seg button { padding: 8px 6px; }
  .aam-seg-sm { width: auto; }
  .aam-yaxis, .aam-ygap { width: 38px; }
  .aam-skel-wrap { margin-left: 38px; }
  .aam-ribbon-delta { margin-left: 0; }
  .aam-avg span { top: -20px; }
}

@media (prefers-reduced-motion: reduce) {
  .aam-overlay, .aam-overlay *, .aam-overlay *::before, .aam-overlay *::after { animation-duration: .01ms !important; animation-delay: 0ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

/* ================================================================== */
/*  TEAM MEMBERS PAGE                                                 */
/* ================================================================== */

const API_BASE_URL = "https://api.promiapi.com";

const getMemberLimitByPlan = (planInput) => {
  if (!planInput) return 1;
  const planStr = planInput.toString().toLowerCase();
  if (planStr.includes("standard")) return 3;
  if (planStr.includes("premium")) return 10;
  if (planStr.includes("ultimate")) return Infinity;
  return 1;
};

const formatPlanName = (plan) => {
  const s = String(plan || "free").replace(/^price_/i, "").replace(/[_-]+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "Free";
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "Active", label: "Active" },
  { id: "Pending", label: "Pending" },
  { id: "Inactive", label: "Inactive" }
];

const STATUS_OPTIONS = [
  { id: "Active", label: "Active" },
  { id: "Pending", label: "Pending" },
  { id: "Inactive", label: "Inactive" }
];

const ROLES = [
  { id: "Agent", title: "Agent", desc: "Replies to customer chats." },
  { id: "Manager", title: "Manager", desc: "Oversees agents and their work." }
];

const PERMISSIONS = [
  { key: "manageContacts", label: "Manage contacts", hint: "View, add and edit contacts" },
  { key: "manageTemplates", label: "Manage templates", hint: "Create and edit message templates" },
  { key: "manageCampaigns", label: "Manage campaigns", hint: "Create, schedule and send campaigns" },
  { key: "manageBotflow", label: "Manage botflow", hint: "Build and edit automated flows" }
];

const AVATAR_TONES = [
  ["#dbeafe", "#1e40af"], ["#dcfce7", "#166534"], ["#ede9fe", "#5b21b6"],
  ["#ffedd5", "#9a3412"], ["#cffafe", "#155e75"], ["#fce7f3", "#9d174d"]
];

const toneFor = (seed) => {
  let h = 0;
  for (const c of String(seed || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
};

const initialsOf = (m) =>
  `${(m.firstName || "")[0] || ""}${(m.lastName || "")[0] || ""}`.toUpperCase() || "?";

const shortLastActive = (iso) => describeLastActive(iso).text.replace(/^Last active /, "");

const fullDateTime = (iso) => {
  if (!iso) return "Never";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "Never" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------- icons ---------------- */

const Svg = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconChart = () => <Svg><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;
const IconEdit = () => <Svg><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;
const IconTrash = () => <Svg><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Svg>;
const IconPlus = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>;
const IconRefresh = ({ spinning }) => (
  <span className={spinning ? "tm-spin-icon" : ""} style={{ display: "inline-flex" }}>
    <Svg><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Svg>
  </span>
);
const IconSearch = () => <Svg><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
const IconCheck = () => <Svg size={15}><path d="m5 12 5 5L20 7" /></Svg>;
const IconAlert = () => <Svg size={15}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Svg>;
const IconUsers = () => <Svg size={22}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></Svg>;

/* ---------------- shared dialog behaviour ---------------- */

function useDialogBehavior(onClose, focusRef, locked) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !lockedRef.current) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusRef?.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------------- small building blocks ---------------- */

function Avatar({ member, live, size = 40 }) {
  const [bg, fg] = toneFor(member.email || member._id);
  return (
    <div className="tm-avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }} aria-hidden="true">
      {initialsOf(member)}
      {live && <i className="tm-avatar-live" />}
    </div>
  );
}

function Meter({ value, max, tone }) {
  const pct = max > 0 ? Math.min(100, Math.max((value / max) * 100, value > 0 ? 6 : 0)) : 0;
  return (
    <div className="tm-meter" aria-hidden="true">
      <i className={tone} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusPill({ status }) {
  const s = status || "Pending";
  return <span className={`aam-pill aam-pill-${s.toLowerCase()}`}>{s}</span>;
}

function RolePill({ role }) {
  return <span className={`tm-role ${role === "Manager" ? "tm-role-manager" : ""}`}>{role || "Agent"}</span>;
}

function Switch({ checked, onChange, label, hint, warn }) {
  return (
    <div className={`tm-perm ${warn ? "tm-perm-warn" : ""}`}>
      <div>
        <div className="tm-perm-title">{label}</div>
        <div className="tm-perm-hint">{hint}</div>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} className="tm-switch" onClick={onChange}>
        <i />
      </button>
    </div>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="tm-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <span className="tm-field-error" role="alert">{error}</span> : hint ? <span className="tm-field-hint">{hint}</span> : null}
    </div>
  );
}

/* ---------------- confirm dialog ---------------- */

function ConfirmDialog({ title, body, confirmLabel, confirmHref, cancelLabel = "Cancel", danger, busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useDialogBehavior(onCancel, cancelRef, busy);

  return (
    <div className="aam-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="aam-dialog tm-confirm" role="alertdialog" aria-modal="true" aria-labelledby="tm-confirm-title">
        <div className={`tm-confirm-icon ${danger ? "tm-confirm-icon-danger" : ""}`}><IconAlert /></div>
        <h3 id="tm-confirm-title">{title}</h3>
        <p>{body}</p>
        <div className="tm-confirm-actions">
          <button ref={cancelRef} type="button" className="tm-secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          {confirmHref ? (
            <a className="tm-primary" href={confirmHref}>{confirmLabel}</a>
          ) : (
            <button type="button" className={danger ? "tm-danger" : "tm-primary"} onClick={onConfirm} disabled={busy}>
              {busy && <span className="tm-spinner" />}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- add / edit member modal ---------------- */

function MemberFormModal({ member, saving, error, onClose, onSubmit }) {
  const editing = !!member;
  const firstRef = useRef(null);
  useDialogBehavior(onClose, firstRef, saving);

  const [form, setForm] = useState(() => ({
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    email: member?.email || "",
    phoneNumber: member?.phoneNumber || "",
    role: member?.role || "Agent",
    status: member?.status || "Pending",
    permissions: {
      manageContacts: !!member?.permissions?.manageContacts,
      manageTemplates: !!member?.permissions?.manageTemplates,
      manageCampaigns: !!member?.permissions?.manageCampaigns,
      administrative: !!member?.permissions?.administrative,
      manageBotflow: !!member?.permissions?.manageBotflow
    }
  }));
  const [touched, setTouched] = useState({});

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const togglePermission = (key) =>
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  const blur = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter a first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!editing) {
    if (!form.email.trim()) errors.email = "Enter an email address.";
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address, like name@company.com.";
  }
  if (!form.phoneNumber.trim()) errors.phoneNumber = "Enter a phone number.";

  const show = (key) => (touched[key] ? errors[key] : undefined);

  const submit = (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, phoneNumber: true });
    if (Object.keys(errors).length) return;
    onSubmit({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim()
    });
  };

  const fullName = `${member?.firstName || ""} ${member?.lastName || ""}`.trim();

  return (
    <div className="aam-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="aam-dialog tm-form-dialog" role="dialog" aria-modal="true" aria-labelledby="tm-form-title">
        <header className="aam-head">
          {editing ? <Avatar member={member} size={46} /> : <div className="tm-head-icon"><IconUsers /></div>}
          <div className="aam-head-text">
            <h3 id="tm-form-title">{editing ? `Edit ${fullName}` : "Add a team member"}</h3>
            <div className="aam-head-meta">
              <span>{editing ? "Update their details, role and access." : "They'll get an email to set their own password."}</span>
            </div>
          </div>
          <button type="button" className="aam-close" onClick={onClose} disabled={saving} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </header>

        <form onSubmit={submit} noValidate>
          <div className="tm-form-body">
            {error && <div className="aam-error" role="alert"><span>{error}</span></div>}

            <div className="tm-grid2">
              <Field id="tm-first" label="First name" error={show("firstName")}>
                <input ref={firstRef} id="tm-first" className={`tm-input ${show("firstName") ? "tm-invalid" : ""}`} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} onBlur={() => blur("firstName")} placeholder="Ayesha" autoComplete="off" />
              </Field>
              <Field id="tm-last" label="Last name" error={show("lastName")}>
                <input id="tm-last" className={`tm-input ${show("lastName") ? "tm-invalid" : ""}`} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} onBlur={() => blur("lastName")} placeholder="Khan" autoComplete="off" />
              </Field>
            </div>

            <Field id="tm-email" label="Work email" error={show("email")} hint={editing ? "Email can't be changed after the invitation is sent." : undefined}>
              <input id="tm-email" type="email" className={`tm-input ${show("email") ? "tm-invalid" : ""}`} value={form.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} placeholder="name@company.com" readOnly={editing} autoComplete="off" />
            </Field>

            <Field id="tm-phone" label="Phone number" error={show("phoneNumber")}>
              <input id="tm-phone" type="tel" className={`tm-input ${show("phoneNumber") ? "tm-invalid" : ""}`} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} onBlur={() => blur("phoneNumber")} placeholder="+92 300 1234567" autoComplete="off" />
            </Field>

            <div className="tm-field">
              <span className="tm-label">Role</span>
              <div className="tm-roles" role="radiogroup" aria-label="Role">
                {ROLES.map((r) => (
                  <button key={r.id} type="button" role="radio" aria-checked={form.role === r.id} className={`tm-role-card ${form.role === r.id ? "tm-role-on" : ""}`} onClick={() => set("role", r.id)}>
                    <span className="tm-role-dot" aria-hidden="true">{form.role === r.id && <IconCheck />}</span>
                    <span>
                      <strong>{r.title}</strong>
                      <small>{r.desc}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {editing && (
              <div className="tm-field">
                <span className="tm-label">Account status</span>
                <Segmented options={STATUS_OPTIONS} value={form.status} onChange={(v) => set("status", v)} label="Account status" />
              </div>
            )}

            <div className="tm-field">
              <span className="tm-label">Access</span>
              <div className="tm-perms">
                {PERMISSIONS.map((p) => (
                  <Switch key={p.key} label={p.label} hint={p.hint} checked={form.permissions[p.key]} onChange={() => togglePermission(p.key)} />
                ))}
                <Switch warn label="Administrative controls" hint="Full access to account settings. Grant with care." checked={form.permissions.administrative} onChange={() => togglePermission("administrative")} />
              </div>
            </div>
          </div>

          <footer className="tm-form-foot">
            <button type="button" className="tm-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="tm-primary" disabled={saving}>
              {saving && <span className="tm-spinner" />}
              {saving ? (editing ? "Saving…" : "Sending invite…") : editing ? "Save changes" : "Send invite"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ---------------- the page ---------------- */

function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [userPlan, setUserPlan] = useState("FREE");
  const [maxAllowedMembers, setMaxAllowedMembers] = useState(1);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formState, setFormState] = useState(null); // null | { member: object | null }
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const [analyticsMember, setAnalyticsMember] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [limitDialog, setLimitDialog] = useState(false);
  const [toasts, setToasts] = useState([]);

  const isMobile = useIsNarrow(768);

  const pushToast = useCallback((type, text) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list, { id, type, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);

  // mode: "initial" (full loader + plan), "refresh" (manual button), "auto" (silent background)
  const fetchTeamAndPlan = useCallback(async (mode = "initial") => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Authentication token missing. Please login again.");
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    if (mode === "initial") {
      setLoading(true);
      setErrorMessage("");
    } else if (mode === "refresh") {
      setRefreshing(true);
    }

    try {
      if (mode === "initial") {
        try {
          const userRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
          if (userRes.data) {
            const userObj = userRes.data.user || userRes.data;
            const sub = userObj?.subscription || {};
            const rawPlan = sub.planId || sub.planName || userObj.planId || userObj.plan || "price_free";
            setUserPlan(sub.planName || rawPlan);
            setMaxAllowedMembers(getMemberLimitByPlan(rawPlan));
          }
        } catch (err) {
          console.warn("User subscription check bypassed or endpoint failed", err);
        }
      }

      const res = await axios.get(`${API_BASE_URL}/api/team`, { headers });
      if (res.data && res.data.success) {
        setMembers(res.data.members || []);
        setLastUpdated(new Date());
        setErrorMessage("");
      }
    } catch (error) {
      console.error("Failed to load team data", error);
      const message = error.response?.data?.message || "Backend server connection failed.";
      if (mode === "initial") setErrorMessage(message);
      else if (mode === "refresh") pushToast("error", `Couldn't refresh the team. ${message}`);
    } finally {
      if (mode === "initial") setLoading(false);
      if (mode === "refresh") setRefreshing(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetchTeamAndPlan("initial");
  }, [fetchTeamAndPlan]);

  // Keep the numbers fresh while the page is open.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchTeamAndPlan("auto");
    }, 60000);
    return () => clearInterval(id);
  }, [fetchTeamAndPlan]);

  /* ---------- actions ---------- */

  const openAdd = () => {
    setActionError("");
    if (members.length >= maxAllowedMembers) {
      setLimitDialog(true);
      return;
    }
    setFormState({ member: null });
  };

  const openEdit = (member) => {
    setActionError("");
    setFormState({ member });
  };

  const closeForm = () => {
    if (saving) return;
    setFormState(null);
    setActionError("");
  };

  const handleSubmit = async (values) => {
    setActionError("");
    const editingMember = formState?.member;
    const editingId = editingMember?._id || editingMember?.id;

    if (!editingId && members.length >= maxAllowedMembers) {
      setActionError(`Plan limit reached (${maxAllowedMembers} member max). Please upgrade your package.`);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setActionError("Session expired. Please login again.");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    setSaving(true);
    try {
      if (editingId) {
        const res = await axios.put(
          `${API_BASE_URL}/api/team/${editingId}`,
          { firstName: values.firstName, lastName: values.lastName, phoneNumber: values.phoneNumber, role: values.role, status: values.status, permissions: values.permissions },
          { headers }
        );
        if (!res.data?.success) throw new Error("Update failed.");
        pushToast("success", `${values.firstName} ${values.lastName} was updated.`);
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/team`,
          { firstName: values.firstName, lastName: values.lastName, email: values.email, phoneNumber: values.phoneNumber, role: values.role, permissions: values.permissions },
          { headers }
        );
        if (!res.data?.success) throw new Error("Invitation failed.");
        pushToast("success", `Invitation sent to ${values.email}.`);
      }
      setFormState(null);
      fetchTeamAndPlan("auto");
    } catch (error) {
      console.error("Action error:", error);
      setActionError(error.response?.data?.message || error.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const id = removeTarget._id || removeTarget.id;
    const name = `${removeTarget.firstName || ""} ${removeTarget.lastName || ""}`.trim();
    setRemoving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_BASE_URL}/api/team/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        setMembers((list) => list.filter((m) => (m._id || m.id) !== id));
        pushToast("success", `${name} was removed from your team.`);
        setRemoveTarget(null);
        fetchTeamAndPlan("auto");
      }
    } catch (error) {
      console.error("Delete error:", error);
      pushToast("error", error.response?.data?.message || "Failed to remove member.");
    } finally {
      setRemoving(false);
    }
  };

  /* ---------- derived numbers ---------- */

  const stats = useMemo(() => {
    let replies = 0;
    let minutes = 0;
    let online = 0;
    let maxReplies = 0;
    let maxMinutes = 0;
    for (const m of members) {
      const t = m.today || {};
      replies += t.messages || 0;
      minutes += t.minutes || 0;
      maxReplies = Math.max(maxReplies, t.messages || 0);
      maxMinutes = Math.max(maxMinutes, t.minutes || 0);
      if (m.status === "Active" && describeLastActive(m.metrics?.lastActiveAt).live) online += 1;
    }
    return { replies, minutes, online, maxReplies, maxMinutes };
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && (m.status || "Pending") !== statusFilter) return false;
      if (!q) return true;
      return `${m.firstName || ""} ${m.lastName || ""} ${m.email || ""}`.toLowerCase().includes(q);
    });
  }, [members, query, statusFilter]);

  const animReplies = useCountUp(stats.replies);
  const animMinutes = useCountUp(stats.minutes);
  const animOnline = useCountUp(stats.online);

  const unlimited = maxAllowedMembers === Infinity;
  const isLimitReached = members.length >= maxAllowedMembers;
  const quotaPct = unlimited ? 0 : Math.min(100, (members.length / maxAllowedMembers) * 100);
  const limitText = unlimited ? "Unlimited" : maxAllowedMembers;

  /* ---------- row pieces ---------- */

  const nameOf = (m) => `${m.firstName || ""} ${m.lastName || ""}`.trim();

  const repliesCell = (m) => (
    <div className="tm-metric">
      <div className="tm-metric-main">
        <strong>{formatNumber(m.today?.messages || 0)}</strong>
        <span>today</span>
      </div>
      <Meter value={m.today?.messages || 0} max={stats.maxReplies} tone="tm-fill-blue" />
      <div className="tm-metric-sub">{formatNumber(m.metrics?.totalMessagesSent || 0)} in total</div>
    </div>
  );

  const timeCell = (m) => (
    <div className="tm-metric">
      <div className="tm-metric-main">
        <strong>{formatMinutes(m.today?.minutes || 0)}</strong>
        <span>today</span>
      </div>
      <Meter value={m.today?.minutes || 0} max={stats.maxMinutes} tone="tm-fill-green" />
      <div className="tm-metric-sub">{formatMinutes(m.metrics?.totalActiveTimeMinutes || 0)} in total</div>
    </div>
  );

  const lastActiveCell = (m) => {
    const info = describeLastActive(m.metrics?.lastActiveAt);
    return (
      <span className="tm-last" title={fullDateTime(m.metrics?.lastActiveAt)}>
        {info.live && <i className="aam-live-dot" aria-hidden="true" />}
        {shortLastActive(m.metrics?.lastActiveAt)}
      </span>
    );
  };

  const actionButtons = (m) => (
    <div className="tm-actions">
      <button type="button" className="tm-ghost" onClick={() => setAnalyticsMember(m)}>
        <IconChart /> Analytics
      </button>
      <button type="button" className="tm-icon-btn" onClick={() => openEdit(m)} aria-label={`Edit ${nameOf(m)}`} title="Edit">
        <IconEdit />
      </button>
      <button type="button" className="tm-icon-btn tm-icon-danger" onClick={() => setRemoveTarget(m)} aria-label={`Remove ${nameOf(m)}`} title="Remove">
        <IconTrash />
      </button>
    </div>
  );

  const identity = (m) => (
    <div className="tm-identity">
      <Avatar member={m} live={m.status === "Active" && describeLastActive(m.metrics?.lastActiveAt).live} />
      <div className="tm-identity-text">
        <div className="tm-name">{nameOf(m) || "Unnamed"}</div>
        <div className="tm-email">{m.email}</div>
      </div>
    </div>
  );

  /* ---------- render ---------- */

  const hasMembers = members.length > 0;

  return (
    <div className="tm-root">
      <style>{CSS}{TM_CSS}</style>

      {/* Header */}
      <header className="tm-header">
        <div>
          <h2>Team</h2>
          <p>See who is online and how each agent is performing.</p>
        </div>
        <div className="tm-header-actions">
          {lastUpdated && (
            <span className="tm-updated">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button type="button" className="tm-secondary" onClick={() => fetchTeamAndPlan("refresh")} disabled={refreshing || loading}>
            <IconRefresh spinning={refreshing} /> Refresh
          </button>
          <button type="button" className="tm-primary" onClick={openAdd}>
            <IconPlus /> Add member
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="aam-error" role="alert" style={{ marginBottom: 16 }}>
          <span><strong>Couldn't load your team.</strong> {errorMessage}</span>
          <button type="button" onClick={() => fetchTeamAndPlan("initial")}>Try again</button>
        </div>
      )}

      {/* Overview */}
      <section className="aam-strip tm-overview" aria-label="Team overview">
        <Cell
          label="Team size"
          foot={
            <div className="tm-quota-foot">
              {!unlimited && (
                <div className="tm-quota" aria-hidden="true">
                  <i className={isLimitReached ? "tm-quota-full" : ""} style={{ width: `${quotaPct}%` }} />
                </div>
              )}
              <span>
                {formatPlanName(userPlan)} plan
                {isLimitReached && !unlimited && <> · <a href="/subscription" className="tm-link">Upgrade</a></>}
              </span>
            </div>
          }
        >
          <span className="aam-cell-value">
            {members.length}<span className="tm-of"> of {limitText}</span>
          </span>
        </Cell>
        <Cell label="Online now" foot={<div className="aam-foot"><span>Active in the last 5 minutes</span></div>}>
          <span className="aam-cell-value" style={{ color: "#047857" }}>{Math.round(animOnline)}</span>
        </Cell>
        <Cell label="Replies today" foot={<div className="aam-foot"><span>Across the whole team</span></div>}>
          <span className="aam-cell-value" style={{ color: "#1d4ed8" }}>{formatNumber(animReplies)}</span>
        </Cell>
        <Cell label="Active time today" foot={<div className="aam-foot"><span>Across the whole team</span></div>}>
          <span className="aam-cell-value">{formatMinutes(animMinutes)}</span>
        </Cell>
      </section>

      {/* Toolbar */}
      {(hasMembers || loading) && (
        <div className="tm-toolbar">
          <div className="tm-search">
            <IconSearch />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search team members"
            />
          </div>
          <Segmented options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} label="Filter by status" />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="tm-card-wrap" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="tm-sk-row" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="tm-sk tm-sk-avatar" />
              <div style={{ flex: 1 }}>
                <div className="tm-sk" style={{ width: "34%", height: 12 }} />
                <div className="tm-sk" style={{ width: "22%", height: 10, marginTop: 8 }} />
              </div>
              <div className="tm-sk" style={{ width: 90, height: 12 }} />
            </div>
          ))}
        </div>
      ) : !hasMembers ? (
        <div className="tm-card-wrap tm-empty">
          <div className="tm-empty-icon"><IconUsers /></div>
          <h3>No team members yet</h3>
          <p>Invite your first agent. They'll get an email to set a password and start replying to chats.</p>
          <button type="button" className="tm-primary" onClick={openAdd}><IconPlus /> Add member</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tm-card-wrap tm-empty">
          <h3>No matches</h3>
          <p>Nobody matches "{query}" with this status. Try a different search or filter.</p>
          <button type="button" className="tm-secondary" onClick={() => { setQuery(""); setStatusFilter("all"); }}>Clear filters</button>
        </div>
      ) : isMobile ? (
        <div className="tm-mlist">
          {filtered.map((m, i) => (
            <article key={m._id || m.id} className="tm-mcard" style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}>
              <div className="tm-mcard-head">
                {identity(m)}
                <StatusPill status={m.status} />
              </div>
              <div className="tm-mcard-grid">
                <div><span className="tm-mlabel">Replies</span>{repliesCell(m)}</div>
                <div><span className="tm-mlabel">Active time</span>{timeCell(m)}</div>
              </div>
              <div className="tm-mcard-meta">
                <RolePill role={m.role} />
                {lastActiveCell(m)}
              </div>
              <div className="tm-mcard-actions">
                {actionButtons(m)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tm-card-wrap">
          <table className="tm-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Replies</th>
                <th>Active time</th>
                <th>Last active</th>
                <th>Role</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m._id || m.id} className="tm-row" style={{ animationDelay: `${Math.min(i * 45, 450)}ms` }}>
                  <td>{identity(m)}</td>
                  <td>{repliesCell(m)}</td>
                  <td>{timeCell(m)}</td>
                  <td>{lastActiveCell(m)}</td>
                  <td><RolePill role={m.role} /></td>
                  <td><StatusPill status={m.status} /></td>
                  <td>{actionButtons(m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      {analyticsMember && (
        <AgentAnalyticsModal member={analyticsMember} apiBaseUrl={API_BASE_URL} onClose={() => setAnalyticsMember(null)} />
      )}

      {formState && (
        <MemberFormModal
          key={formState.member ? formState.member._id || formState.member.id : "new"}
          member={formState.member}
          saving={saving}
          error={actionError}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          danger
          busy={removing}
          title={`Remove ${nameOf(removeTarget)}?`}
          body="They lose access right away and their activity history is deleted. This can't be undone."
          confirmLabel="Remove member"
          onConfirm={confirmRemove}
          onCancel={() => !removing && setRemoveTarget(null)}
        />
      )}

      {limitDialog && (
        <ConfirmDialog
          title="Team limit reached"
          body={`Your ${formatPlanName(userPlan)} plan includes ${limitText} team member${maxAllowedMembers === 1 ? "" : "s"}. Upgrade your plan to add more.`}
          confirmLabel="Upgrade plan"
          confirmHref="/subscription"
          cancelLabel="Not now"
          onCancel={() => setLimitDialog(false)}
        />
      )}

      {/* Toasts */}
      <div className="tm-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`tm-toast tm-toast-${t.type}`} role="status">
            {t.type === "success" ? <IconCheck /> : <IconAlert />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page styles (scoped with the tm- prefix)                           */
/* ------------------------------------------------------------------ */

const TM_CSS = `
@keyframes tm-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes tm-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes tm-spin { to { transform: rotate(360deg) } }
@keyframes tm-toast-in { from { opacity: 0; transform: translateY(12px) scale(.98) } to { opacity: 1; transform: none } }

.tm-root { padding: 16px; max-width: 1280px; margin: 0 auto; width: 100%; color: #1e293b; box-sizing: border-box; }
.tm-root *, .tm-root *::before, .tm-root *::after { box-sizing: border-box; }
.tm-root button:focus-visible, .tm-root a:focus-visible, .tm-root input:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

/* header */
.tm-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; animation: tm-rise .5s cubic-bezier(.2,.8,.2,1) both; }
.tm-header h2 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -.02em; color: #0f172a; }
.tm-header p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
.tm-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tm-updated { font-size: 12.5px; color: #94a3b8; margin-right: 4px; }

/* buttons */
.tm-primary, .tm-secondary, .tm-danger { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 10px; padding: 10px 16px; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background .15s, transform .15s, box-shadow .15s; }
.tm-primary { background: #1e40af; color: #fff; box-shadow: 0 1px 2px rgba(30,64,175,.3); }
.tm-primary:hover { background: #1e3a8a; }
.tm-secondary { background: #f1f5f9; color: #334155; }
.tm-secondary:hover { background: #e2e8f0; }
.tm-danger { background: #dc2626; color: #fff; }
.tm-danger:hover { background: #b91c1c; }
.tm-primary:active, .tm-secondary:active, .tm-danger:active { transform: scale(.97); }
.tm-primary:disabled, .tm-secondary:disabled, .tm-danger:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.tm-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: tm-spin .7s linear infinite; }
.tm-spin-icon { animation: tm-spin .8s linear infinite; }
.tm-link { color: #1d4ed8; font-weight: 600; text-decoration: underline; }

/* overview */
.tm-overview { margin-bottom: 18px; animation: tm-rise .5s .06s cubic-bezier(.2,.8,.2,1) both; }
.tm-of { font-size: 15px; font-weight: 600; color: #94a3b8; letter-spacing: 0; }
.tm-quota-foot { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #64748b; }
.tm-quota { height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.tm-quota i { display: block; height: 100%; background: #2563eb; border-radius: inherit; transform-origin: left; animation: tm-fill .8s .2s cubic-bezier(.2,.8,.2,1) both; }
.tm-quota i.tm-quota-full { background: #d97706; }

/* toolbar */
.tm-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; animation: tm-rise .5s .1s cubic-bezier(.2,.8,.2,1) both; }
.tm-search { position: relative; flex: 1 1 260px; max-width: 360px; color: #94a3b8; }
.tm-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.tm-search input { width: 100%; height: 40px; padding: 0 12px 0 38px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; font: inherit; font-size: 14px; color: #0f172a; transition: border-color .15s, box-shadow .15s; }
.tm-search input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }

/* table */
.tm-card-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
.tm-table { width: 100%; min-width: 900px; border-collapse: collapse; text-align: left; }
.tm-table th { padding: 12px 16px; font-size: 12.5px; font-weight: 600; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.tm-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 14px; }
.tm-table tbody tr:last-child td { border-bottom: 0; }
.tm-row { animation: tm-rise .5s cubic-bezier(.2,.8,.2,1) both; transition: background .15s; }
.tm-row:hover { background: #f8fafc; }

.tm-identity { display: flex; align-items: center; gap: 12px; min-width: 0; }
.tm-identity-text { min-width: 0; }
.tm-name { font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-email { font-size: 12.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.tm-avatar { position: relative; flex: none; border-radius: 12px; display: grid; place-items: center; font-weight: 700; letter-spacing: .02em; }
.tm-avatar-live { position: absolute; right: -3px; bottom: -3px; width: 11px; height: 11px; border-radius: 50%; background: #10b981; border: 2px solid #fff; }

.tm-metric { min-width: 120px; }
.tm-metric-main { display: flex; align-items: baseline; gap: 6px; }
.tm-metric-main strong { font-size: 16px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; }
.tm-metric-main span { font-size: 12px; color: #64748b; }
.tm-metric-sub { margin-top: 5px; font-size: 12px; color: #64748b; font-variant-numeric: tabular-nums; }
.tm-meter { height: 5px; margin-top: 7px; border-radius: 999px; background: #eef2f7; overflow: hidden; }
.tm-meter i { display: block; height: 100%; border-radius: inherit; transform-origin: left; animation: tm-fill .8s .15s cubic-bezier(.2,.8,.2,1) both; }
.tm-fill-blue { background: linear-gradient(90deg, #60a5fa, #1d4ed8); }
.tm-fill-green { background: linear-gradient(90deg, #6ee7b7, #059669); }

.tm-last { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: #475569; white-space: nowrap; }
.tm-role { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 12.5px; font-weight: 600; background: #f1f5f9; color: #475569; }
.tm-role-manager { background: #dbeafe; color: #1e40af; }

.tm-actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
.tm-ghost { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 10px; padding: 7px 12px; margin-right: 6px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s, transform .15s; }
.tm-ghost:hover { background: #dbeafe; }
.tm-ghost:active { transform: scale(.97); }
.tm-icon-btn { width: 34px; height: 34px; border: 0; border-radius: 10px; background: transparent; color: #64748b; display: grid; place-items: center; cursor: pointer; transition: background .15s, color .15s; }
.tm-icon-btn:hover { background: #f1f5f9; color: #0f172a; }
.tm-icon-danger:hover { background: #fef2f2; color: #b91c1c; }

/* skeleton + empty */
.tm-sk-row { display: flex; align-items: center; gap: 14px; padding: 18px 16px; border-bottom: 1px solid #f1f5f9; animation: tm-rise .5s both; }
.tm-sk-row:last-child { border-bottom: 0; }
.tm-sk { border-radius: 8px; background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%); background-size: 200% 100%; animation: aam-shimmer 1.4s linear infinite; }
.tm-sk-avatar { width: 40px; height: 40px; border-radius: 12px; flex: none; }
.tm-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 24px; gap: 8px; }
.tm-empty h3 { margin: 6px 0 0; font-size: 17px; color: #0f172a; }
.tm-empty p { margin: 0 0 12px; max-width: 380px; font-size: 14px; color: #64748b; line-height: 1.5; }
.tm-empty-icon { width: 52px; height: 52px; border-radius: 16px; background: #eff6ff; color: #1d4ed8; display: grid; place-items: center; }

/* mobile cards */
.tm-mlist { display: flex; flex-direction: column; gap: 12px; }
.tm-mcard { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; animation: tm-rise .5s cubic-bezier(.2,.8,.2,1) both; }
.tm-mcard-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.tm-mcard .tm-email { max-width: 170px; }
.tm-mcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; padding: 14px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
.tm-mlabel { display: block; margin-bottom: 6px; font-size: 12.5px; font-weight: 600; color: #64748b; }
.tm-mcard-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.tm-mcard-actions .tm-actions { justify-content: stretch; }
.tm-mcard-actions .tm-ghost { flex: 1; justify-content: center; }

/* confirm dialog */
.tm-confirm { max-width: 440px; padding: 26px 24px 22px; }
.tm-confirm h3 { margin: 14px 0 6px; font-size: 18px; letter-spacing: -.01em; }
.tm-confirm p { margin: 0; font-size: 14px; line-height: 1.55; color: #475569; }
.tm-confirm-icon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: #fef3c7; color: #b45309; }
.tm-confirm-icon-danger { background: #fee2e2; color: #b91c1c; }
.tm-confirm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

/* form dialog */
.tm-form-dialog { max-width: 600px; }
.tm-head-icon { flex: none; width: 46px; height: 46px; border-radius: 14px; background: #dbeafe; color: #1e40af; display: grid; place-items: center; }
.tm-form-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
.tm-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.tm-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.tm-field label, .tm-label { font-size: 13px; font-weight: 600; color: #334155; }
.tm-input { width: 100%; height: 42px; padding: 0 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; font: inherit; font-size: 14px; color: #0f172a; transition: border-color .15s, box-shadow .15s; }
.tm-input::placeholder { color: #94a3b8; }
.tm-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.tm-input[readonly] { background: #f8fafc; color: #64748b; cursor: not-allowed; }
.tm-invalid { border-color: #ef4444; }
.tm-invalid:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.15); }
.tm-field-error { font-size: 12.5px; color: #b91c1c; }
.tm-field-hint { font-size: 12.5px; color: #94a3b8; }

.tm-roles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tm-role-card { display: flex; align-items: flex-start; gap: 10px; text-align: left; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; background: #fff; font: inherit; cursor: pointer; transition: border-color .15s, background .15s; }
.tm-role-card:hover { border-color: #cbd5e1; }
.tm-role-card strong { display: block; font-size: 14px; color: #0f172a; }
.tm-role-card small { display: block; margin-top: 2px; font-size: 12.5px; color: #64748b; line-height: 1.4; }
.tm-role-dot { flex: none; width: 20px; height: 20px; margin-top: 1px; border-radius: 50%; border: 1.5px solid #cbd5e1; display: grid; place-items: center; color: #fff; transition: background .15s, border-color .15s; }
.tm-role-on { border-color: #2563eb; background: #eff6ff; }
.tm-role-on .tm-role-dot { background: #2563eb; border-color: #2563eb; }

.tm-perms { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.tm-perm { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
.tm-perm:last-child { border-bottom: 0; }
.tm-perm-warn { background: #fffbeb; }
.tm-perm-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.tm-perm-hint { margin-top: 2px; font-size: 12.5px; color: #64748b; }
.tm-switch { position: relative; flex: none; width: 42px; height: 24px; border: 0; border-radius: 999px; background: #cbd5e1; cursor: pointer; transition: background .2s; padding: 0; }
.tm-switch i { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(15,23,42,.3); transition: transform .22s cubic-bezier(.3,.9,.3,1); }
.tm-switch[aria-checked="true"] { background: #2563eb; }
.tm-switch[aria-checked="true"] i { transform: translateX(18px); }
.tm-perm-warn .tm-switch[aria-checked="true"] { background: #d97706; }

.tm-form-foot { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px; background: #fff; border-top: 1px solid #e2e8f0; }

/* toasts */
.tm-toasts { position: fixed; right: 20px; bottom: 20px; z-index: 1300; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.tm-toast { display: flex; align-items: center; gap: 10px; max-width: 360px; padding: 12px 16px; border-radius: 12px; background: #0f172a; color: #fff; font-size: 13.5px; box-shadow: 0 12px 24px -8px rgba(15,23,42,.45); animation: tm-toast-in .3s cubic-bezier(.2,.9,.3,1) both; }
.tm-toast svg { flex: none; }
.tm-toast-success svg { color: #34d399; }
.tm-toast-error svg { color: #f87171; }

@media (max-width: 767px) {
  .tm-root { padding: 12px; }
  .tm-header h2 { font-size: 22px; }
  .tm-header-actions { width: 100%; }
  .tm-header-actions .tm-primary { flex: 1; }
  .tm-updated { display: none; }
  .tm-search { max-width: none; }
  .tm-toolbar .aam-seg { width: 100%; }
  .tm-toasts { left: 12px; right: 12px; bottom: 12px; }
  .tm-toast { max-width: none; }
}
@media (max-width: 560px) {
  .tm-grid2, .tm-roles { grid-template-columns: 1fr; }
  .tm-form-body { padding: 16px; }
  .tm-form-foot { padding: 12px 16px; }
  .tm-confirm-actions { flex-direction: column-reverse; }
  .tm-confirm-actions > * { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .tm-root *, .tm-root *::before, .tm-root *::after { animation-duration: .01ms !important; animation-delay: 0ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

export default TeamMembers;
