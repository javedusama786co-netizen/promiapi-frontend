import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView, animate } from "framer-motion";
import axios from "axios";
import logo from "../assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
/* ───────────── ICONS ───────────── */
const stroke = (children, size = 24) => () => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const Icons = {
  whatsapp: stroke(<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />, 28),
  whatsappOfficial: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.419h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.874 9.877-9.874 2.636 0 5.114 1.028 6.977 2.893s2.888 4.342 2.887 6.98c-.002 5.446-4.431 9.873-9.854 9.873m0-18.176C6.4 3.625 1.758 8.267 1.758 13.993c0 1.831.478 3.618 1.385 5.196L1.6 24.002l4.945-1.296a10.36 10.36 0 005.503 1.565h.005c5.733 0 10.375-4.642 10.377-10.369 0-2.768-1.079-5.37-3.037-7.329-1.958-1.957-4.561-3.036-7.326-3.036" fill="currentColor" /></svg>
  ),
  aiBot: stroke(<><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></>, 28),
  antiBan: stroke(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>, 28),
  growth: stroke(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>, 28),
  shield: stroke(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
  brain: stroke(<><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" /></>),
  inbox: stroke(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>),
  broadcast: stroke(<><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" /></>),
  integration: stroke(<><rect x="2" y="2" width="8" height="8" rx="2" /><rect x="14" y="2" width="8" height="8" rx="2" /><rect x="14" y="14" width="8" height="8" rx="2" /><rect x="2" y="14" width="8" height="8" rx="2" /></>),
  report: stroke(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>),
  quote: stroke(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />, 26),
  spark: stroke(<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />, 18),
  botAvatar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12v3M22 12v3M12 8V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="3" r="1.5" fill="currentColor" /><rect x="4" y="8" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /><circle cx="15" cy="14" r="1.5" fill="currentColor" /></svg>
  ),
  messenger: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.15 2 11.27c0 2.92 1.46 5.53 3.75 7.23V22l3.43-1.88c.9.25 1.86.38 2.82.38 5.52 0 10-4.15 10-9.27S17.52 2 12 2Z" fill="currentColor" /><path d="M6.8 13.6 10.4 9.7l2.6 2.6 3.9-3.9-3.9 4.9-2.6-2.6-3.6 3.9Z" fill="#fff" /></svg>
  ),
  instagram: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" /></svg>
  )
};

// Official Meta logo. Put the file you download from Meta Brand Resources at  public/meta-logo.svg
// (use Meta's original blue logo; "white" tone turns it into the single-colour white version for dark backgrounds)
const META_LOGO_SRC = "/meta-logo.svg";
const MetaLogo = ({ size = 28, id = "m", tone = "auto" }) => {
  const [ok, setOk] = useState(true);
  if (ok) {
    return <img src={META_LOGO_SRC} alt="Meta" height={size} className={`meta-img ${tone === "white" ? "w" : tone === "auto" ? "a" : ""}`} style={{ height: size, width: "auto" }} onError={() => setOk(false)} />;
  }
  // temporary placeholder shown only until the official file exists
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 64 40" fill="none" aria-label="Meta">
      <defs><linearGradient id={`mg-${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0064E0" /><stop offset="1" stopColor="#0866FF" /></linearGradient></defs>
      <path d="M32 20C40 6 58 6 58 20C58 34 40 34 32 20C24 6 6 6 6 20C6 34 24 34 32 20Z" stroke={tone === "white" ? "#fff" : `url(#mg-${id})`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ───────────── SMALL PIECES ───────────── */
const TypingDots = () => (
  <div className="dots"><i /><i /><i /></div>
);

const CountUp = ({ to, decimals = 0, suffix = "", duration = 2 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const display = useTransform(count, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView]);

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>{suffix}
    </span>
  );
};

// 🧠 Neural-network particle field (AI background)
const NeuralBg = () => {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf, pts = [];
    const m = { x: -999, y: -999 };
    const mv = (e) => { const r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; };
    const resize = () => {
      w = cv.width = cv.offsetWidth;
      h = cv.height = cv.offsetHeight;
      const n = Math.min(80, Math.floor((w * h) / 18000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 140) { ctx.strokeStyle = `rgba(61,214,255,${(1 - d / 140) * 0.28})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        ctx.fillStyle = "rgba(139,172,255,0.8)"; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 7); ctx.fill();
      }
      for (const p of pts) { const d = Math.hypot(p.x - m.x, p.y - m.y); if (d < 170) { ctx.strokeStyle = `rgba(139,92,246,${(1 - d / 170) * 0.65})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(m.x, m.y); ctx.stroke(); if (!reduce) { p.x += (m.x - p.x) * 0.012; p.y += (m.y - p.y) * 0.012; } } }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", mv);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", mv); };
  }, []);
  return <canvas ref={ref} className="neural" aria-hidden="true" />;
};

const Reveal = ({ children, d = 0, className = "", x = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, y: x ? 0 : 22, x }} whileInView={{ opacity: 1, y: 0, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: d, ease: "easeOut" }}>
    {children}
  </motion.div>
);

// 🖱️ Cursor: comet trail + magnetic dot + context label pill (desktop only)
const cursorLabel = (el) => {
  if (!el || !el.closest) return "";
  if (el.closest("input,textarea")) return "Type";
  if (el.closest(".plan,.addon")) return "Select";
  if (el.closest("a,button")) return "Click";
  if (el.closest(".fcard,.faq-i,.tcard")) return "Explore";
  return "";
};
const Cursor = () => {
  const [on] = useState(() => typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches);
  const cv = useRef(null);
  const x = useMotionValue(-200), y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 50, damping: 20 }), sy = useSpring(y, { stiffness: 50, damping: 20 });
  const lx = useSpring(x, { stiffness: 260, damping: 24 }), ly = useSpring(y, { stiffness: 260, damping: 24 });
  const [label, setLabel] = useState("");
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (!on) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = cv.current, ctx = c.getContext("2d");
    const pts = []; let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    const mv = (e) => { x.set(e.clientX); y.set(e.clientY); if (!reduce) { pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (pts.length > 40) pts.shift(); } };
    const ov = (e) => setLabel(cursorLabel(e.target));
    const dn = () => setDown(true), up = () => setDown(false);
    const tick = (now) => {
      ctx.clearRect(0, 0, c.width, c.height);
      while (pts.length && now - pts[0].t > 450) pts.shift();
      ctx.lineCap = "round";
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], k = 1 - (now - b.t) / 450;
        ctx.strokeStyle = `rgba(${Math.round(61 + 78 * (1 - k))},${Math.round(214 - 122 * (1 - k))},255,${k * 0.8})`;
        ctx.lineWidth = k * 7;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    resize(); raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize); window.addEventListener("mousemove", mv); window.addEventListener("mouseover", ov);
    window.addEventListener("mousedown", dn); window.addEventListener("mouseup", up);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", mv); window.removeEventListener("mouseover", ov); window.removeEventListener("mousedown", dn); window.removeEventListener("mouseup", up); };
  }, []);
  if (!on) return null;
  return (
    <>
      <canvas ref={cv} className="hxc hxc-trail" aria-hidden="true" />
      <motion.div className="hxc hxc-spot" style={{ x: sx, y: sy }} />
      <motion.div className="hxc hxc-dot" style={{ x, y }} animate={{ scale: down ? 0.55 : label ? 2.4 : 1 }} transition={{ type: "spring", stiffness: 320, damping: 20 }} />
      <motion.div className="hxc hxc-tag" style={{ x: lx, y: ly }}>
        <AnimatePresence>
          {label && <motion.span key={label} initial={{ opacity: 0, scale: 0.6, x: -8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }}>{label}</motion.span>}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// Mouse-tilt helper
const useTilt = (range) => {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [range, -range]), { stiffness: 150, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-range, range]), { stiffness: 150, damping: 20 });
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    rx, ry,
    onMouseMove: (e) => { if (reduce) return; const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); },
    onMouseLeave: () => { mx.set(0); my.set(0); }
  };
};

const heroChatScript = [
  { id: 1, from: "customer", text: "Hello! Is Size M available for this item?" },
  { id: 2, from: "ai", text: "Walaikum Assalam! Yes, size M is in stock ✅ Confirm your order?" },
  { id: 3, from: "customer", text: "Yes please, go ahead and confirm it" },
  { id: 4, from: "ai", text: "Order confirmed 🎉 Tracking details sent on WhatsApp." }
];

/* ───────────── PAGE ───────────── */
function Home() {
  const navigate = useNavigate();
  const isDarkMode = useOutletContext();

  const whatsappUrl = "https://wa.link/kr35q0";

  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({ supportCustomize: false, verifiedPortfolio: false });
  const [userSubscription, setUserSubscription] = useState({ planId: "price_free", subscribed: false });

  const [visibleCount, setVisibleCount] = useState(1);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  // 🟢 Chat animation loop (unchanged)
  useEffect(() => {
    let timer1, timer2;
    if (visibleCount === 1) {
      timer1 = setTimeout(() => {
        setIsAiTyping(true);
        timer2 = setTimeout(() => { setIsAiTyping(false); setTimeout(() => setVisibleCount(2), 250); }, 1100);
      }, 500);
    } else if (visibleCount === 2) {
      timer1 = setTimeout(() => setVisibleCount(3), 1500);
    } else if (visibleCount === 3) {
      timer1 = setTimeout(() => {
        setIsAiTyping(true);
        timer2 = setTimeout(() => { setIsAiTyping(false); setTimeout(() => setVisibleCount(4), 250); }, 1100);
      }, 500);
    } else if (visibleCount === 4) {
      timer1 = setTimeout(() => setVisibleCount(1), 4000);
    }
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [visibleCount]);

  const heroTilt = useTilt(9);
  const omniTilt = useTilt(7);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/api/subscription/user/subscription`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data.success) {
          setUserSubscription({ planId: res.data.planId || "price_free", subscribed: res.data.subscribed || res.data.active || false });
        }
      } catch (err) {
        console.error("Subscription fetch error:", err);
        const localUser = JSON.parse(localStorage.getItem("user"));
        if (localUser) {
          setUserSubscription({ planId: localUser.subscription?.planId || "price_free", subscribed: localUser.subscribed || false });
        }
      }
    };
    fetchUserData();
  }, []);

  const toggleAddon = (addonKey) => setSelectedAddons((prev) => ({ ...prev, [addonKey]: !prev[addonKey] }));

  const getAddonTotal = () => {
    let total = 0;
    if (selectedAddons.supportCustomize) total += 29.99;
    if (selectedAddons.verifiedPortfolio) total += 99.99;
    return total;
  };

  const plans = [
    {
      id: "price_standard", name: "Standard Plan", badgeText: "STARTER", priceMonthly: 19.99, priceYearly: 179.99,
      features: ["150,000 Contacts Base", "5 AI Bot Flows & Builder", "5 Contact Custom Fields", "3 Team Members / Agents", "Unlimited Broadcast Campaigns & AI Replies", "Official WhatsApp Business API Integration", "Free WhatsApp Blue Tick Verification Apply", "Voice Notes, Audio & Media Sharing", "Click-to-WhatsApp Ads & Smart Retargeting", "Shopify & WooCommerce Auto-Sync", "Multi-Agent Shared Team Inbox", "High-Speed API & Webhook Gateway"],
      current: userSubscription.subscribed && userSubscription.planId === "price_standard", popular: false
    },
    {
      id: "price_premium", name: "Premium Engine", badgeText: "MOST POPULAR", priceMonthly: 89.99, priceYearly: 799.99,
      features: ["1,000,000 Contacts Base", "10 AI Bot Flows & Builder", "10 Contact Custom Fields", "10 Team Members / Agents", "Unlimited Campaigns & Auto AI Chatbots", "Official WhatsApp Business API Integration", "Free WhatsApp Blue Tick Verification Apply", "Voice Notes, Audio & Media Sharing", "Click-to-WhatsApp Ads & Smart Retargeting", "Shopify & WooCommerce Auto-Sync", "Multi-Agent Shared Team Inbox", "High-Speed Webhooks & Meta Sync API", "Advanced Campaign ROI Analytics"],
      current: userSubscription.subscribed && userSubscription.planId === "price_premium", popular: true
    },
    {
      id: "price_ultimate", name: "Ultimate Cluster", badgeText: "ENTERPRISE", priceMonthly: 449.99, priceYearly: 3999.99,
      features: ["Unlimited Contacts Base", "Unlimited AI Bot Flows", "Unlimited Custom Fields", "Unlimited Team Members / Agents", "Unlimited Broadcast Campaigns", "Official WhatsApp Business API Integration", "Free WhatsApp Blue Tick Application", "Voice Notes, Audio & Media Sharing", "Click-to-WhatsApp Ads & Retargeting", "Shopify & WooCommerce Integrations", "Multi-Agent Shared Team Inbox", "Dedicated Webhook Gateway & Custom API", "Campaign Budget Analytics", "White Labeling & Custom Branding", "Custom Domain Integration", "Dedicated Account Manager & 24/7 SLA"],
      current: userSubscription.subscribed && userSubscription.planId === "price_ultimate", popular: false
    }
  ];

  const handleCheckout = async (plan) => {
    if (plan.current) return;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/register"); return; }
    setLoadingPlan(plan.id);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/subscription/checkout`, { planId: plan.id, billingPeriod: billingPeriod, addons: selectedAddons }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.url) window.location.href = res.data.url;
    } catch (error) {
      alert(error.response?.data?.message || "Payment checkout failed. Try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const stats = [
    { value: "100% Ban-Safe", label: "Official Meta Cloud API", icon: <Icons.antiBan /> },
    { value: "10M+", label: "AI Messages Sent", icon: <Icons.whatsapp /> },
    { value: "10x", label: "Sales & Conversion Growth", icon: <Icons.growth /> },
    { value: "24/7", label: "Automated AI Support", icon: <Icons.aiBot /> },
  ];

  const features = [
    { icon: <Icons.shield />, title: "WhatsApp Account Ban Protection", text: "Connect securely via the official Meta Cloud API. Eliminate risks associated with unofficial tools and ensure your business phone number remains 100% safe." },
    { icon: <Icons.brain />, title: "Smart AI Automated Chatbots", text: "Advanced AI agents handle customer queries 24/7, recommend products automatically, answer FAQs instantly, and drive continuous sales conversions." },
    { icon: <Icons.inbox />, title: "Multi-Agent Shared Team Inbox", text: "Manage a single WhatsApp business number across your entire team. Multiple agents can handle conversations simultaneously, assign tags, and track live statuses." },
    { icon: <Icons.broadcast />, title: "Unlimited Broadcast Campaigns", text: "Send promotional updates, discount alerts, and shipping notifications to thousands of customers simultaneously without triggering spam blocks." },
    { icon: <Icons.integration />, title: "Shopify & E-Commerce Integration", text: "Directly sync Shopify and WooCommerce stores to automate abandoned cart recovery, COD confirmation messages, and live delivery tracking updates." },
    { icon: <Icons.report />, title: "Real-Time AI Analytics & Reports", text: "Gain deep insights into message delivery rates, read tracking, and campaign ROI to optimize your revenue generation metrics." },
  ];

  const testimonials = [
    { name: "Usman Ali", photo: "https://randomuser.me/api/portraits/men/32.jpg", role: "Founder, Direct-to-Consumer Brand", quote: "We used to face frequent WhatsApp number bans. Switching to PromiAPI's official Meta Cloud API and AI Automation scaled our revenue 3x with zero blocking issues." },
    { name: "Ayesha Malik", photo: "https://randomuser.me/api/portraits/women/44.jpg", role: "Head of Growth, Online Retail", quote: "The AI chatbot and multi-agent inbox are blazing fast. Our customer support efficiency doubled, and query drop-offs dropped to absolute zero." },
    { name: "Hamza Raza", photo: "https://randomuser.me/api/portraits/men/65.jpg", role: "Co-Founder, Online Business", quote: "Automated Shopify order confirmations and AI-driven lead qualification cut our daily manual operations workload by over 80%." },
  ];

  const portraits = ["men/32", "women/44", "men/65", "women/68", "men/12"].map((k) => `https://randomuser.me/api/portraits/${k}.jpg`);

  const trustBadges = [
    [<Icons.antiBan />, "Official Meta Cloud API"], [<Icons.shield />, "Number-ban protection"], [<Icons.inbox />, "Shared team inbox"],
    [<Icons.brain />, "24/7 AI agents"], [<Icons.spark />, "Blue tick verification help"], [<Icons.integration />, "Shopify & WooCommerce sync"],
    [<Icons.report />, "Live delivery analytics"], [<Icons.broadcast />, "Safe broadcast campaigns"]
  ];

  const steps = [
    { t: "Connect your number", x: "Link your WhatsApp Business number through the official Meta Cloud API. No workarounds, no risk to your number." },
    { t: "Teach your AI agent", x: "Add your products, FAQs and reply flows. The agent learns how your business sells and answers like your team." },
    { t: "Go live and let it close", x: "Customers get instant replies while your team steps in on high-intent chats from the shared inbox." }
  ];

  const safety = [
    { icon: <Icons.antiBan />, t: "Official Meta access", x: "Every message travels through Meta's own Cloud API, not an unofficial tool that can get your number blocked." },
    { icon: <Icons.shield />, t: "Encrypted conversations", x: "Chats are encrypted in transit on the WhatsApp Business Platform, so customer messages stay private." },
    { icon: <Icons.inbox />, t: "Controlled team access", x: "Decide which agents see and answer each conversation, and keep a clear record of who replied." },
    { icon: <Icons.spark />, t: "Verified brand identity", x: "Get help applying for the blue tick so customers see your real business name before they reply." }
  ];

  const faqs = [
    { q: "Will my WhatsApp number get banned?", a: "PromiAPI connects through the official Meta WhatsApp Cloud API, the channel Meta provides to businesses. You are not relying on unofficial tools, which are the main cause of blocked numbers." },
    { q: "Do I need a verified business to start?", a: "No, you can create an account and start right away. When you are ready, our team helps with Meta Business verification and the blue tick application through the Verified Business Portfolio add-on." },
    { q: "Can my team and the AI reply together?", a: "Yes. The AI handles routine questions and passes high-intent leads to live agents in the shared inbox, so nobody starts a conversation from scratch." },
    { q: "How is my customer data handled?", a: "Your contacts and conversations stay inside your workspace, and messages are encrypted in transit on the WhatsApp Business Platform. Write to support@promiapi.com for details on data handling." },
    { q: "Which store platforms do you support?", a: "Shopify and WooCommerce sync automatically. For anything else, use the webhook gateway and API included in your plan." },
    { q: "Can I change or cancel my plan?", a: "You can upgrade from the Choose Your Plan section at any time. For downgrades or cancellations, contact support@promiapi.com and the team will help." }
  ];

  const planMeta = {
    price_standard: { icon: <Icons.broadcast />, tag: "For stores getting started" },
    price_premium: { icon: <Icons.brain />, tag: "For teams scaling sales with AI" },
    price_ultimate: { icon: <Icons.shield />, tag: "For high-volume brands and agencies" }
  };

  const onRootMove = (e) => {
    const el = e.target.closest && e.target.closest(".fcard,.tcard,.trustc,.step,.faq-i,.plan");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };

  return (
    <div className="hx" data-theme={isDarkMode ? "dark" : "light"} onMouseMove={onRootMove}>
      <style>{CSS}</style>
      <Cursor />

      {/* 🟢 FLOATING WHATSAPP */}
      <motion.a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="wa-float" title="Chat with us on WhatsApp" aria-label="Chat with us on WhatsApp"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.1, y: -3 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
        <Icons.whatsappOfficial />
      </motion.a>

      {/* 🚀 HERO */}
      <header className="hero">
        <NeuralBg />
        <div className="aurora a1" /><div className="aurora a2" /><div className="grid-fade" />
        <div className="wrap hero-grid">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="lockup">
              <img src={logo} alt="PromiAPI Hub" className="lockup-logo" />
              <span className="lockup-x">×</span>
              <MetaLogo size={22} id="hero" tone="white" />
            </div>
            <div className="pill"><Icons.spark /> Official Meta Cloud API &amp; Smart AI Power</div>
            <h1 className="hero-h1">While you sleep, your WhatsApp closes deals</h1>
            <p className="lead">Your AI agent replies in seconds, qualifies leads, and confirms orders around the clock — on the official Meta Cloud API, so your number never risks a ban.</p>
            <div className="row">
              <motion.button className="btn primary" whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/register")}>Start Free Trial Now</motion.button>
              <a className="btn ghost" href="#features">Explore AI Features</a>
            </div>
            <div className="proof">
              <div className="stack">{portraits.map((src, i) => <img key={i} src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />)}</div>
              <div><div className="stars" aria-label="5 out of 5 stars">★★★★★</div><span>Trusted by growing e-commerce and service businesses</span></div>
            </div>
            <div className="trust-row">
              <span><Icons.antiBan /> Zero ban risk</span><span><Icons.spark /> AI replies in under 2 sec</span><span><Icons.inbox /> Shared team inbox</span>
            </div>
          </motion.div>

          <motion.div className="phone-stage" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring", stiffness: 80 }} onMouseMove={heroTilt.onMouseMove} onMouseLeave={heroTilt.onMouseLeave}>
            <motion.div className="phone-3d" style={{ rotateX: heroTilt.rx, rotateY: heroTilt.ry }}>
              <div className="phone">
                <div className="phone-bar">
                  <div className="avatar"><Icons.botAvatar /></div>
                  <div>
                    <div className="who">Your Store — AI Assistant</div>
                    <div className="online"><i /> online · powered by AI</div>
                  </div>
                  <MetaLogo size={14} id="ph" tone="white" />
                </div>
                <div className="chat">
                  <AnimatePresence initial={false} mode="popLayout">
                    {heroChatScript.slice(0, visibleCount).map((msg) => (
                      <motion.div key={`msg-${msg.id}`} className={`bub ${msg.from}`} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                        {msg.text}
                        {msg.from === "ai" && <span className="ticks">✓✓</span>}
                      </motion.div>
                    ))}
                    {isAiTyping && (
                      <motion.div key="typing-indicator" className="bub ai" initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.85 }} transition={{ duration: 0.2 }}>
                        <TypingDots />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="chip c1 hero-float" style={{ "--d": "0s" }}><b>AI thinking</b><span>intent: order_confirm</span><div className="bar"><i style={{ width: "96%" }} /></div></div>
              <div className="chip c2 hero-float" style={{ "--d": "0.8s" }}><b>Stock check</b><span>Size M · 14 units ✓</span></div>
              <div className="chip c3 hero-float" style={{ "--d": "1.4s" }}><MetaLogo size={14} id="c3" tone="white" /><span>Verified via Meta Cloud API</span></div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* 🛡️ TRUST MARQUEE */}
      <div className="marq" aria-label="Trust and compliance highlights">
        <div className="marq-t">
          {[...trustBadges, ...trustBadges].map((b, i) => <span className="mi" key={i}>{b[0]}{b[1]}</span>)}
        </div>
      </div>

      {/* 📊 STATS STRIP */}
      <section className="strip">
        <motion.div className="wrap stats-grid" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
          {stats.map((stat, i) => (
            <motion.div key={i} className="stat" variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <div className="ico">{stat.icon}</div>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 🧭 HOW IT WORKS */}
      <section className="sec">
        <div className="wrap">
          <Reveal className="head center">
            <h2>From signup to your first AI reply in three steps</h2>
            <p>No developers needed. Connect, teach, and go live on the official WhatsApp Cloud API.</p>
          </Reveal>
          <div className="steps">
            {steps.map((st, i) => (
              <motion.div key={i} className="step" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}>
                <div className="n">{i + 1}</div><h3>{st.t}</h3><p>{st.x}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 📈 GROWTH */}
      <section className="sec">
        <div className="wrap">
          <Reveal className="head center">
            <h2>Watch what automation does to your growth curve</h2>
            <p>Real accounts that switched from manual replies to PromiAPI's AI agent — tracked over their first six weeks.</p>
          </Reveal>
          <Reveal className="panel growth">
            <div className="metrics">
              {[
                { icon: <Icons.broadcast />, to: 2.8, decimals: 1, suffix: "M+", label: "Messages Automated" },
                { icon: <Icons.inbox />, to: 18500, decimals: 0, suffix: "+", label: "Leads Converted" },
                { icon: <Icons.growth />, to: 312, decimals: 0, suffix: "%", label: "Avg. Revenue Growth" }
              ].map((s, i) => (
                <div key={i} className="metric">
                  <div className="ico">{s.icon}</div>
                  <div><div className="num"><CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} /></div><div className="lbl">{s.label}</div></div>
                </div>
              ))}
            </div>
            <div>
              <div className="legend">
                <span><i className="dash" /> Manual replies</span>
                <span><i className="solid" /> With PromiAPI AI</span>
              </div>
              <div className="chart">
                <svg viewBox="0 0 600 260" role="img" aria-label="Growth chart">
                  <defs>
                    <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0866FF" /><stop offset="100%" stopColor="#3DD6FF" /></linearGradient>
                    <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DD6FF" stopOpacity="0.32" /><stop offset="100%" stopColor="#3DD6FF" stopOpacity="0" /></linearGradient>
                  </defs>
                  {[60, 100, 140, 180, 220].map((y) => <line key={y} x1="40" y1={y} x2="560" y2={y} stroke="var(--ln)" strokeWidth="1" />)}
                  <motion.path d="M40,200 L144,195 L248,190 L352,185 L456,182 L560,178" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.3, ease: "easeInOut" }} />
                  <motion.path d="M40,200 L144,175 L248,140 L352,100 L456,60 L560,30 L560,220 L40,220 Z" fill="url(#gArea)" stroke="none" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 1.6 }} />
                  <motion.path d="M40,200 L144,175 L248,140 L352,100 L456,60 L560,30" fill="none" stroke="url(#gLine)" strokeWidth="3.5" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.7, ease: "easeInOut", delay: 0.25 }} />
                  {["W1", "W2", "W3", "W4", "W5", "W6"].map((l, i) => <text key={l} x={40 + i * 104} y="245" textAnchor="middle" fontSize="12" fill="var(--sub)">{l}</text>)}
                </svg>
                <motion.div className="peak" initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.9, type: "spring", stiffness: 260, damping: 18 }}>
                  <span className="dot" /><span className="ring" /><span className="tag">+312% growth</span>
                </motion.div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 🌐 OMNICHANNEL */}
      <section className="sec alt">
        <div className="wrap omni-grid">
          <Reveal x={-30}>
            <div className="pill blue">Omnichannel Team Inbox</div>
            <h2 className="left">Every channel. Your whole team. One inbox.</h2>
            <p className="lead sm">Stop switching between apps. WhatsApp, Messenger and Instagram messages all land in one shared inbox — where your team replies, blasts campaigns, and watches new customers come in.</p>
            <div className="list">
              {[
                { icon: <Icons.integration />, title: "All 3 channels, one inbox", text: "Reply to WhatsApp, Messenger and Instagram without switching apps." },
                { icon: <Icons.inbox />, title: "Your whole team can jump in", text: "Add agents, assign chats, and see who's replying in real time." },
                { icon: <Icons.broadcast />, title: "Bulk campaigns in one click", text: "Blast offers and updates to thousands of contacts at once." },
                { icon: <Icons.growth />, title: "Every reply becomes a lead", text: "New conversations turn into tracked customers automatically." }
              ].map((it, i) => (
                <div key={i} className="li"><div className="ico sm">{it.icon}</div><div><b>{it.title}</b><span>{it.text}</span></div></div>
              ))}
            </div>
            <motion.button className="btn primary" whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/register")}>Try The Unified Inbox</motion.button>
          </Reveal>

          <Reveal className="omni-wrap">
            <div className="omni-stage" onMouseMove={omniTilt.onMouseMove} onMouseLeave={omniTilt.onMouseLeave}>
              <motion.div className="omni" style={{ rotateX: omniTilt.rx, rotateY: omniTilt.ry }}>
                <svg viewBox="0 0 380 380" className="omni-lines">
                  <path d="M42,52 Q120,120 190,190" stroke="#25D366" /><path d="M338,52 Q260,120 190,190" stroke="#0084FF" /><path d="M190,338 L190,190" stroke="#d62976" />
                </svg>
                <div className="inbox">
                  <div className="inbox-h"><b>Team Inbox</b><span><i /> 3 online</span></div>
                  {[
                    { icon: <Icons.whatsappOfficial />, color: "#25D366", name: "Emma Watson", msg: "Is my order confirmed?", time: "2m" },
                    { icon: <Icons.messenger />, color: "#0084FF", name: "Alexander Wright", msg: "Is this available in blue?", time: "5m" },
                    { icon: <Icons.instagram />, color: "#d62976", name: "Sophia Smith", msg: "Loved your last post!", time: "9m" }
                  ].map((r, i) => (
                    <motion.div key={i} className="inbox-r" initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * i, duration: 0.4 }}>
                      <div className="ch" style={{ background: r.color }}><div style={{ transform: "scale(0.62)", display: "flex" }}>{r.icon}</div></div>
                      <div className="tx"><b>{r.name}</b><span>{r.msg}</span></div><em>{r.time}</em>
                    </motion.div>
                  ))}
                </div>
                <div className="orb o1" style={{ background: "#25D366" }}><Icons.whatsappOfficial /></div>
                <div className="orb o2" style={{ background: "linear-gradient(135deg,#00c6ff,#0068ff)" }}><Icons.messenger /></div>
                <div className="orb o3" style={{ background: "linear-gradient(135deg,#feda75,#d62976,#4f5bd5)" }}><Icons.instagram /></div>
                <div className="chip p1 omni-proof">👥 3 team members online</div>
                <div className="chip p2 omni-proof">📢 Sent to 12,500 customers</div>
                <div className="chip p3 omni-proof">🔥 47 new customers today</div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 🤝 META PARTNER */}
      <section className="sec">
        <div className="wrap">
          <Reveal className="head center">
            <div className="pill meta"><MetaLogo size={14} id="pill" tone="auto" /> Official Meta Business Partner</div>
            <h2>Your number, protected. Your brand, verified.</h2>
            <p>We're a certified Meta Cloud API technology partner, not a third-party workaround — so your number never risks a ban, and customers see your real business name with a verified blue tick.</p>
          </Reveal>
          <Reveal className="panel trust">
            <div className="seal-col">
              <div className="seal">
                <div className="seal-ring" />
                <div className="seal-core"><div className="shine" /><MetaLogo size={46} id="seal" tone="white" /></div>
              </div>
              <b>Official Meta Business Partner</b>
              <span>Certified WhatsApp Cloud API Provider</span>
            </div>
            <div className="vs-col">
              <div className="vs bad"><div className="vs-ic">📵</div><div><b>+92 3•• •••••••</b><span>⚠ Risk of permanent ban</span></div></div>
              <div className="vs-arrow">with PromiAPI</div>
              <motion.div className="vs good" initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 16 }}>
                <div className="vs-ic wa"><Icons.whatsappOfficial /></div>
                <div>
                  <b>PromiAPI Store
                    <svg width="15" height="15" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#32a9f7" /><polyline points="7 12.5 10.5 16 17 8.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </b>
                  <span>✅ Verified Business Account</span>
                </div>
              </motion.div>
            </div>
            <div className="tags"><span>🚫 Zero number bans</span><span>✅ Blue tick verified</span><span>🤝 Certified Meta partner</span></div>
          </Reveal>
        </div>
      </section>

      {/* 🔒 SECURITY & RELIABILITY */}
      <section className="sec">
        <div className="wrap">
          <Reveal className="head center">
            <h2>Built so every customer can trust your messages</h2>
            <p>Your brand name sits on every conversation. We build on Meta's official infrastructure so it stays protected.</p>
          </Reveal>
          <div className="sec-grid">
            {safety.map((it, i) => (
              <motion.div key={i} className="trustc" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <div className="ico">{it.icon}</div><h3>{it.t}</h3><p>{it.x}</p>
              </motion.div>
            ))}
          </div>
          <div className="seals"><MetaLogo size={22} id="seals" tone="auto" /><span>Meta Business Partner</span><span>WhatsApp Business Platform</span><span>Cloud API provider</span></div>
        </div>
      </section>

      {/* 💥 FEATURES (bento) */}
      <section id="features" className="sec alt">
        <div className="wrap">
          <Reveal className="head center">
            <h2>Why Businesses Choose PromiAPI</h2>
            <p>Everything you need to run WhatsApp sales on autopilot, built on the official Meta Cloud API.</p>
          </Reveal>
          <div className="bento">
            {features.map((f, i) => (
              <motion.div key={i} className={`fcard ${i === 0 ? "wide" : ""} ${hoveredFeature === i ? "on" : ""}`}
                onMouseEnter={() => setHoveredFeature(i)} onTouchStart={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)}
                onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`); }}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}>
                <div className="ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🧠 AI SECTION */}
      <section className="sec">
        <div className="wrap ai-grid">
          <Reveal x={-30}>
            <div className="pill"><Icons.spark /> Built-in AI Brain Engine</div>
            <h2 className="left">Built-in AI Intelligence Managing Your Sales 24/7</h2>
            <p className="lead sm">Our smart AI chatbots go beyond basic keyword triggers. Utilizing advanced natural language processing, they understand conversational text queries seamlessly.</p>
            <ul className="checks">
              {[
                "Automated Lead Qualification: Instantly filter high-intent buyers and route them to live agents.",
                "Instant FAQ Resolution: Auto-respond to product specs, pricing inquiries, and delivery updates.",
                "Zero Human Delay: Ensure every prospect receives an immediate response around the clock."
              ].map((t, i) => <li key={i}><span>✓</span>{t}</li>)}
            </ul>
            <motion.button className="btn primary" whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/register")}>Try AI Bot Demo</motion.button>
          </Reveal>

          <Reveal className="brain-wrap">
            <div className="brain">
              <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
              <div className="node n1"><Icons.whatsappOfficial /></div>
              <div className="node n2"><Icons.inbox /></div>
              <div className="node n3"><Icons.report /></div>
              <div className="node n4"><Icons.integration /></div>
              <div className="core"><img src={logo} alt="AI System Shell" /></div>
              <div className="console">
                <div><i className="g" /> lead.qualify() → <b>high intent</b></div>
                <div><i className="b" /> faq.answer() → <b>pricing sent</b></div>
                <div><i className="v" /> order.confirm() → <b>done in 1.4s</b></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 💬 TESTIMONIALS */}
      <section className="sec alt">
        <div className="wrap">
          <Reveal className="head center"><h2>Trusted by teams that sell on WhatsApp</h2></Reveal>
          <div className="testi-grid">
            {testimonials.map((t, i) => (
              <motion.div key={i} className="tcard" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="tq"><div className="qi"><Icons.quote /></div><div className="stars" aria-label="5 out of 5 stars">★★★★★</div></div>
                <p>"{t.quote}"</p>
                <div className="by"><div className="av">{t.name[0]}<img src={t.photo} alt={t.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /></div><div><b>{t.name}</b><span>{t.role}</span><em>✓ Verified customer</em></div></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ❓ FAQ */}
      <section className="sec alt">
        <div className="wrap">
          <Reveal className="head center">
            <h2>Questions people ask before they switch</h2>
            <p>Straight answers about bans, verification, data, and billing.</p>
          </Reveal>
          <div className="faq">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-i ${faqOpen === i ? "open" : ""}`}>
                <button className="faq-q" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>{f.q}<i>+</i></button>
                <AnimatePresence initial={false}>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} style={{ overflow: "hidden" }}>
                      <div className="faq-a">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📬 CONTACT */}
      <section id="contact" className="sec">
        <div className="wrap contact-grid">
          <Reveal x={-30}>
            <h2 className="left">Need Custom AI Setup?</h2>
            <p className="lead sm">Have unique business workflows or high-volume enterprise requirements? Connect with our team to configure your custom WhatsApp Cloud API infrastructure.</p>
            <div className="list">
              <div className="li"><div className="ico"><Icons.whatsapp /></div><div><b>Official Email Support</b><span>support@promiapi.com</span></div></div>
              <div className="li"><div className="ico"><Icons.antiBan /></div><div><b>Headquarters</b><span>Lahore, Punjab, Pakistan</span></div></div>
            </div>
          </Reveal>
          <Reveal x={30} className="panel form">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <label>Your Name<input type="text" placeholder="Ali Raza" /></label>
                <label>WhatsApp Number<input type="text" placeholder="+92 326 5064865" /></label>
              </div>
              <label>Business Type<input type="text" placeholder="E-commerce Store / Real Estate / Service" /></label>
              <label>Your Requirement<textarea rows="4" placeholder="AI Chatbot, Meta Verification, Campaign Automation..." /></label>
              <motion.button className="btn primary full" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit">Submit Requirement</motion.button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* 💰 PRICING */}
      <section id="pricing" className="sec alt">
        <div className="wrap">
          <Reveal className="head center">
            <h2>Choose Your Plan</h2>
            <p>Official WhatsApp Cloud API &amp; AI Automation Plans for every business scale</p>
            <div className="toggle">
              <motion.button whileTap={{ scale: 0.95 }} className={billingPeriod === "monthly" ? "act" : ""} onClick={() => setBillingPeriod("monthly")}>Monthly</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className={billingPeriod === "yearly" ? "act" : ""} onClick={() => setBillingPeriod("yearly")}>Yearly <em>Save 20%</em></motion.button>
            </div>
          </Reveal>

          <div className="addons">
            <h3>Optional Setup &amp; Managed Add-ons</h3>
            <p>Select professional services to automatically attach to your base plan checkout.</p>
            <div className="addon-grid">
              <motion.div whileTap={{ scale: 0.98 }} className={`addon ${selectedAddons.supportCustomize ? "sel" : ""}`} onClick={() => toggleAddon("supportCustomize")}>
                <div><b>Support for Complete Customize Setup</b><strong>+$29.99</strong></div>
                <span>Hands-on technical guidance, system configuration, and workflow customization.</span>
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} className={`addon ${selectedAddons.verifiedPortfolio ? "sel" : ""}`} onClick={() => toggleAddon("verifiedPortfolio")}>
                <div><b>Verified Business Portfolio Setup</b><strong>+$99.99</strong></div>
                <span>Meta Manager setup, document audit, domain email routing, and approval help.</span>
              </motion.div>
            </div>
          </div>

          <div className="plans">
            {plans.map((plan) => {
              const basePrice = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
              const totalPrice = (basePrice + getAddonTotal()).toFixed(2);
              const meta = planMeta[plan.id] || {};
              const limits = plan.features.slice(0, 4).map((f) => { const m = f.match(/^(\S+)\s+(.*)$/); return m ? [m[1], m[2]] : [f, ""]; });
              return (
                <motion.div key={plan.id} className={`plan ${plan.popular ? "pop" : ""} ${plan.current ? "is-current" : ""}`} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -6 }}>
                  {plan.current && <span className="flag is-current">CURRENT PLAN</span>}
                  {!plan.current && plan.popular && <span className="flag">MOST POPULAR</span>}
                  <div>
                    <div className="plan-h">
                      <div className="plan-ic">{meta.icon}</div>
                      <div><h3>{plan.name}</h3><p className="plan-tag">{meta.tag}</p></div>
                      <em>{plan.badgeText}</em>
                    </div>
                    <div className="price"><small>$</small><strong>{totalPrice}</strong><span>/{billingPeriod === "monthly" ? "mo" : "yr"}</span></div>
                    {billingPeriod === "yearly" && <div className="per">About ${(plan.priceYearly / 12).toFixed(2)}/mo, billed yearly</div>}
                    {getAddonTotal() > 0 && <div className="base">(Base ${basePrice} +${getAddonTotal().toFixed(2)} Add-ons)</div>}
                    <div className="limits">{limits.map(([v, l], i) => <div key={i}><strong>{v}</strong><span>{l}</span></div>)}</div>
                    <div className="inc">Everything included</div>
                    <ul>{plan.features.slice(4).map((f, i) => <li key={i}><i>✓</i>{f}</li>)}</ul>
                  </div>
                  <motion.button className={`btn plan-btn ${plan.popular ? "primary" : "ghost"}`} whileTap={{ scale: plan.current ? 1 : 0.96 }} onClick={() => handleCheckout(plan)} disabled={loadingPlan !== null || plan.current}>
                    {loadingPlan === plan.id ? "Processing..." : plan.current ? "Active Workspace" : "Upgrade Plan →"}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
          <div className="plan-note"><span>✓ Official Meta Cloud API in every plan</span><span>✓ Secure checkout</span><span>✓ Upgrade any time from this page</span></div>
        </div>
      </section>

      {/* 🤝 REAL PEOPLE */}
      <section className="sec" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Reveal className="panel care">
            <div className="proof" style={{ margin: 0 }}>
              <div className="stack">{portraits.map((src, i) => <img key={i} src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />)}</div>
              <div><h3 style={{ fontSize: 22 }}>Real people behind the AI</h3><span>Stuck on Meta verification or setup? Our team answers on WhatsApp and email.</span></div>
            </div>
            <div className="row">
              <a className="btn primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <a className="btn ghost" href="mailto:support@promiapi.com">Email support</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ⚡ FINAL CTA */}
      <section className="sec">
        <div className="wrap">
          <Reveal className="cta">
            <NeuralBg />
            <div className="cta-in">
              <MetaLogo size={30} id="cta" tone="white" />
              <h2>Ready to Grow Your Business Safely?</h2>
              <p>Scale your business confidently with official Meta WhatsApp APIs and intelligent AI bots without fear of getting blocked.</p>
              <motion.button className="btn primary big" whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/register")}>Create Free Account</motion.button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 🌐 FOOTER */}
      <footer className="foot">
        <div className="wrap foot-grid">
          <div>
            <div className="lockup"><img src={logo} alt="PromiAPI" className="lockup-logo sm" /><h3>PromiAPI</h3></div>
            <p>Official WhatsApp Cloud API &amp; Smart AI Automation System for growing modern businesses.</p>
            <div className="meta-badge"><MetaLogo size={16} id="foot" tone="white" /> Built on the Meta Cloud API</div>
          </div>
          <div><h4>Features</h4><p>WhatsApp Cloud API</p><p>Smart AI Bots</p><p>Anti-Ban Architecture</p></div>
          <div><h4>Company</h4><p>About Us</p><p>Contact Support</p></div>
        </div>
        <div className="wrap copy">© 2026 PromiAPI Technologies. All rights reserved.</div>
      </footer>
    </div>
  );
}

/* ───────────── STYLES ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
.hx{--bg:#05070E;--s1:#0A0F1E;--s2:#0F1629;--ln:rgba(148,163,184,.14);--tx:#DDE3F2;--sub:#8E9AB7;--hd:#fff;--acc:#0866FF;--cy:#3DD6FF;--vi:#8B5CF6;--gr:#25D366;--glow:rgba(8,102,255,.35);
 background:var(--bg);color:var(--tx);font-family:'Hanken Grotesk',system-ui,sans-serif;min-height:100vh;overflow-x:hidden;position:relative;line-height:1.5}
.hx[data-theme=light]{--bg:#E8EEFC;--s1:#DCE6FA;--s2:#F6F8FF;--ln:rgba(30,58,138,.16);--tx:#22304f;--sub:#4a5a80;--hd:#0a1226;--glow:rgba(8,102,255,.25);background:radial-gradient(900px 520px at 6% 3%,rgba(8,102,255,.16),transparent 60%),radial-gradient(800px 520px at 96% 38%,rgba(139,92,246,.16),transparent 60%),#E8EEFC}
.hx *{box-sizing:border-box}
.hx h1,.hx h2,.hx h3{font-family:'Bricolage Grotesque','Hanken Grotesk',sans-serif;color:var(--hd);margin:0}
.hx p{margin:0}
.wrap{max-width:1200px;margin:0 auto;padding:0 6%;position:relative;z-index:2}
.sec{padding:110px 0;position:relative}.sec.alt{background:var(--s1);border-block:1px solid var(--ln)}
.head{margin-bottom:56px}.head.center{text-align:center}.head h2,.hx h2{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-1.2px;line-height:1.12}
.hx h2.left{margin-bottom:20px}
.head p{color:var(--sub);font-size:17px;max-width:640px;margin:16px auto 0}
.lead{font-size:19px;color:var(--sub);max-width:540px;margin-bottom:34px}.lead.sm{font-size:17px;max-width:500px;margin-bottom:30px}
.ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:var(--cy);background:linear-gradient(145deg,rgba(8,102,255,.2),rgba(139,92,246,.12));border:1px solid rgba(8,102,255,.3);flex-shrink:0}
.ico.sm{width:42px;height:42px;border-radius:12px}
.pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;border:1px solid rgba(61,214,255,.3);background:rgba(61,214,255,.08);color:var(--cy);font-weight:600;font-size:13.5px;margin-bottom:22px}
.pill.blue{color:#6ea8ff;border-color:rgba(8,102,255,.4);background:rgba(8,102,255,.1)}.pill.meta{color:#6ea8ff;border-color:rgba(8,102,255,.4);background:rgba(8,102,255,.1)}
.btn{font:700 16px 'Hanken Grotesk',sans-serif;padding:16px 30px;border-radius:14px;border:1px solid transparent;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:box-shadow .25s,background .25s}
.btn.primary{color:#fff;background:linear-gradient(120deg,#0866FF,#6d4dff);box-shadow:0 10px 30px -8px var(--glow),inset 0 1px 0 rgba(255,255,255,.25)}
.btn.primary:hover{box-shadow:0 16px 40px -8px rgba(8,102,255,.6),inset 0 1px 0 rgba(255,255,255,.25)}
.btn.ghost{color:var(--hd);background:transparent;border-color:var(--ln)}.btn.ghost:hover{background:var(--s2)}
.btn.big{padding:18px 44px;font-size:17px}.btn.full{width:100%}.btn:disabled{cursor:default;opacity:.85}
.btn:focus-visible,.hx a:focus-visible,.hx input:focus-visible,.hx textarea:focus-visible{outline:2px solid var(--cy);outline-offset:3px}
.row{display:flex;gap:16px;flex-wrap:wrap;align-items:center}

/* hero */
.hero{position:relative;padding:130px 0 110px;overflow:hidden;background:radial-gradient(1200px 600px at 70% -10%,rgba(8,102,255,.18),transparent 60%),var(--bg)}
.neural{position:absolute;inset:0;width:100%;height:100%;opacity:.75;pointer-events:none}
.hx[data-theme=light] .neural{opacity:.35}
.aurora{position:absolute;border-radius:50%;filter:blur(110px);pointer-events:none}
.a1{width:460px;height:460px;left:-6%;top:-12%;background:rgba(8,102,255,.35);animation:drift 15s ease-in-out infinite}
.a2{width:420px;height:420px;right:2%;bottom:-18%;background:rgba(139,92,246,.3);animation:drift 18s ease-in-out infinite reverse}
.hx[data-theme=light] .aurora{opacity:.4}
.grid-fade{position:absolute;inset:0;background-image:linear-gradient(var(--ln) 1px,transparent 1px),linear-gradient(90deg,var(--ln) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse at 50% 30%,#000 10%,transparent 70%);-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 10%,transparent 70%);opacity:.5;pointer-events:none}
.hero-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:70px;align-items:center}
.lockup{display:flex;align-items:center;gap:14px;margin-bottom:26px}.lockup-logo{height:44px;width:auto}.lockup-logo.sm{height:34px}.lockup-x{color:var(--sub);font-size:20px}.lockup h3{font-size:20px}
.hero-h1{font-size:clamp(36px,5.6vw,68px);font-weight:800;letter-spacing:-2px;line-height:1.04;margin-bottom:24px}
.trust-row{display:flex;gap:22px;flex-wrap:wrap;margin-top:34px;color:var(--sub);font-size:14px;font-weight:600}
.trust-row span{display:inline-flex;align-items:center;gap:8px}.trust-row svg{width:18px;height:18px;color:var(--cy)}
.phone-stage{perspective:1600px;display:flex;justify-content:center}
.phone-3d{position:relative;transform-style:preserve-3d;will-change:transform}
.phone{width:320px;background:#0b1120;border-radius:38px;padding:11px;border:1px solid rgba(255,255,255,.14);box-shadow:0 50px 90px -20px rgba(0,0,0,.7),0 0 80px -10px var(--glow);transform:translateZ(30px)}
.phone-bar{background:#0f1a2e;border-radius:28px 28px 0 0;padding:14px 16px;display:flex;align-items:center;gap:12px;color:#fff}
.avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0866FF,#8B5CF6);display:grid;place-items:center;flex-shrink:0}
.who{font-weight:700;font-size:13.5px}.online{font-size:11px;color:#7ee2a8;display:flex;align-items:center;gap:5px}.online i{width:6px;height:6px;border-radius:50%;background:#25D366;box-shadow:0 0 8px #25D366}
.phone-bar>svg{margin-left:auto}
.chat{min-height:330px;padding:16px 14px;display:flex;flex-direction:column;gap:10px;justify-content:flex-end;background:linear-gradient(180deg,#0a1322,#0c1628);border-radius:0 0 28px 28px}
.bub{max-width:86%;padding:10px 14px;font-size:13.5px;line-height:1.4;color:#eaf0ff}
.bub.customer{align-self:flex-start;background:#18233b;border-radius:14px 14px 14px 4px}
.bub.ai{align-self:flex-end;background:linear-gradient(135deg,#0b5f4e,#0e7a5f);border-radius:14px 14px 4px 14px}
.ticks{color:#6fd3ff;font-size:11px;margin-left:6px;font-weight:700}
.dots{display:flex;gap:4px;padding:4px 2px}.dots i{width:6px;height:6px;border-radius:50%;background:#bdf5dc;animation:bounce 1.2s infinite ease-in-out}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
.chip{position:absolute;background:rgba(15,22,41,.85);backdrop-filter:blur(12px);border:1px solid rgba(148,163,184,.22);border-radius:14px;padding:10px 14px;font-size:12.5px;color:#fff;box-shadow:0 20px 40px rgba(0,0,0,.35);white-space:nowrap;z-index:5;display:flex;flex-direction:column;gap:3px}
.hx[data-theme=light] .chip{background:rgba(255,255,255,.9);color:#0a1226}
.chip span{color:var(--sub);font-size:11.5px}.chip.c3{flex-direction:row;align-items:center;gap:8px}
.chip .bar{height:4px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:3px}.chip .bar i{display:block;height:100%;background:linear-gradient(90deg,#0866FF,#3DD6FF);border-radius:4px;animation:grow 2.4s ease-in-out infinite alternate}
.c1{top:30px;left:-150px;--tz:120px}.c2{bottom:70px;left:-160px;--tz:140px}.c3{top:120px;right:-150px;--tz:110px}
.hero-float{animation:float 4.6s ease-in-out infinite var(--d,0s)}

/* strip */
.strip{padding:50px 0;background:var(--s1);border-block:1px solid var(--ln)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.stat{padding:8px 4px}.stat .ico{margin-bottom:16px}.stat h3{font-size:clamp(24px,2.6vw,34px);font-weight:800;letter-spacing:-1px}.stat p{color:var(--sub);font-weight:600;font-size:14.5px;margin-top:4px}

/* panels */
.panel{background:linear-gradient(145deg,var(--s2),var(--s1));border:1px solid var(--ln);border-radius:28px;padding:44px;position:relative;overflow:hidden}
.growth{display:grid;grid-template-columns:.8fr 1.2fr;gap:50px;align-items:center}
.metrics{display:flex;flex-direction:column;gap:30px}.metric{display:flex;gap:16px;align-items:center}
.num{font:800 34px 'Bricolage Grotesque',sans-serif;color:var(--hd);line-height:1}.lbl{font-size:13.5px;color:var(--sub);font-weight:600;margin-top:6px}
.legend{display:flex;gap:22px;flex-wrap:wrap;margin-bottom:14px;font-size:13px;color:var(--sub)}.legend span{display:flex;align-items:center;gap:8px}
.legend .dash{width:18px;border-top:3px dashed #64748b}.legend .solid{width:18px;height:3px;border-radius:2px;background:linear-gradient(90deg,#0866FF,#3DD6FF)}
.chart{position:relative}.chart svg{width:100%;height:auto;display:block}
.peak{position:absolute;left:89%;top:3%}.peak .dot,.peak .ring{position:absolute;width:12px;height:12px;border-radius:50%;left:0;top:0}.peak .dot{background:var(--cy)}.peak .ring{border:2px solid var(--cy);animation:ping 1.8s ease-out infinite}
.peak .tag{position:absolute;top:-8px;left:20px;white-space:nowrap;background:linear-gradient(120deg,#0866FF,#3DD6FF);color:#fff;font-weight:800;font-size:12.5px;padding:5px 10px;border-radius:8px;box-shadow:0 10px 24px rgba(8,102,255,.45)}

/* omni */
.omni-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:70px;align-items:center}
.list{display:flex;flex-direction:column;gap:20px;margin-bottom:32px}.li{display:flex;gap:16px;align-items:flex-start}
.li b{display:block;color:var(--hd);font-size:15.5px}.li span{display:block;color:var(--sub);font-size:14px;margin-top:2px}
.omni-wrap{display:flex;justify-content:center}.omni-stage{perspective:1600px}
.omni{position:relative;width:380px;height:380px;transform-style:preserve-3d}
.omni-lines{position:absolute;inset:0;width:380px;height:380px;overflow:visible}.omni-lines path{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-dasharray:8 6;animation:dash 1s linear infinite}
.inbox{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translateZ(40px);width:240px;background:var(--s2);border:1px solid var(--ln);border-radius:20px;box-shadow:0 30px 60px -15px rgba(0,0,0,.5),0 0 50px -15px var(--glow);overflow:hidden}
.inbox-h{padding:14px 16px;border-bottom:1px solid var(--ln);display:flex;justify-content:space-between;align-items:center}.inbox-h b{color:var(--hd);font-size:13.5px}.inbox-h span{font-size:10.5px;color:var(--gr);font-weight:700;display:flex;align-items:center;gap:4px}.inbox-h i{width:6px;height:6px;border-radius:50%;background:var(--gr)}
.inbox-r{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--ln)}.inbox-r:last-child{border:0}
.ch{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;flex-shrink:0}.tx{flex:1;min-width:0}.tx b{display:block;font-size:12.5px;color:var(--hd)}.tx span{display:block;font-size:11.5px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inbox-r em{font-size:10px;color:var(--sub);font-style:normal}
.orb{position:absolute;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;color:#fff;box-shadow:0 15px 30px rgba(0,0,0,.4);animation:float 4.2s ease-in-out infinite;--tz:100px}
.o1{top:20px;left:10px}.o2{top:20px;right:10px;animation-delay:.4s}.o3{bottom:10px;left:50%;margin-left:-29px;animation-delay:.8s}
.p1{top:-10px;left:-140px;--tz:130px;animation:float 4.6s ease-in-out infinite}.p2{top:130px;right:-170px;--tz:130px;animation:float 5s ease-in-out infinite .6s}.p3{bottom:-10px;left:-130px;--tz:130px;animation:float 4.3s ease-in-out infinite 1s}

/* trust */
.trust{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:56px 44px;background:radial-gradient(600px 300px at 20% 0%,rgba(8,102,255,.22),transparent 70%),linear-gradient(145deg,#0a1226,#0d1730)}
.hx[data-theme=light] .trust{background:radial-gradient(600px 300px at 20% 0%,rgba(8,102,255,.2),transparent 70%),linear-gradient(145deg,#0a1226,#0d1730);color:#fff}
.seal-col{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;color:#fff}.seal-col span{color:#94a3b8;font-size:13px}
.seal{position:relative;width:150px;height:150px;display:grid;place-items:center;margin-bottom:14px}
.seal-ring{position:absolute;inset:-8px;border-radius:50%;border:2px dashed rgba(255,255,255,.35);animation:spin 16s linear infinite}
.seal-core{position:relative;width:122px;height:122px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#16264a,#0a1226);border:1px solid rgba(61,214,255,.4);display:grid;place-items:center;overflow:hidden;box-shadow:0 0 50px rgba(8,102,255,.5)}
.shine{position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.3),transparent);transform:skewX(-20deg);animation:shine 3.2s ease-in-out infinite}
.vs-col{display:flex;flex-direction:column;align-items:center;gap:10px}
.vs{width:270px;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;color:#fff}.vs b{display:flex;align-items:center;gap:5px;font-size:13.5px}.vs span{display:block;font-size:11.5px;font-weight:600}
.vs.bad{background:#161d2e;border:1px solid rgba(255,255,255,.08);opacity:.65}.vs.bad span{color:#f87171}
.vs.good{background:linear-gradient(135deg,#0f2745,#0b1120);border:1px solid rgba(61,214,255,.45);box-shadow:0 15px 35px rgba(8,102,255,.35)}.vs.good span{color:#4ade80}
.vs-ic{width:38px;height:38px;border-radius:50%;background:#2b3650;display:grid;place-items:center;flex-shrink:0}.vs-ic.wa{background:var(--gr);color:#fff}
.vs-arrow{font-size:12px;color:#64748b;font-weight:700}
.tags{grid-column:1/-1;display:flex;gap:12px;flex-wrap:wrap;justify-content:center}.tags span{padding:8px 14px;border-radius:99px;border:1px solid rgba(255,255,255,.14);color:#e2e8f0;font-size:13px;font-weight:600;background:rgba(255,255,255,.04)}

/* bento */
.bento{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.fcard{position:relative;padding:32px;border-radius:24px;background:var(--s2);border:1px solid var(--ln);overflow:hidden;transition:border-color .3s,transform .3s}
.fcard.wide{grid-column:span 2}
.fcard::before{content:"";position:absolute;inset:0;background:radial-gradient(320px circle at var(--mx,50%) var(--my,0%),rgba(8,102,255,.22),transparent 60%);opacity:0;transition:opacity .3s}
.fcard.on{border-color:rgba(8,102,255,.6);transform:translateY(-4px)}.fcard.on::before{opacity:1}
.fcard>*{position:relative}.fcard .ico{margin-bottom:22px}.fcard h3{font-size:21px;font-weight:700;letter-spacing:-.4px;margin-bottom:10px}.fcard p{color:var(--sub);font-size:15px;line-height:1.65}

/* ai */
.ai-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:center}
.checks{list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:14px}.checks li{display:flex;gap:12px;font-size:15px}.checks span{color:var(--gr);font-weight:800}
.brain-wrap{display:flex;justify-content:center}.brain{position:relative;width:min(420px,88vw);aspect-ratio:1;display:grid;place-items:center}
.ring{position:absolute;border-radius:50%;border:1px dashed rgba(61,214,255,.35)}.r1{inset:0;animation:spin 40s linear infinite}.r2{inset:16%;animation:spin 28s linear infinite reverse;border-color:rgba(139,92,246,.4)}.r3{inset:32%;border-style:solid;border-color:rgba(8,102,255,.35);animation:pulse 3s ease-in-out infinite}
.core{position:relative;width:34%;aspect-ratio:1;border-radius:26px;background:var(--s2);border:1px solid rgba(8,102,255,.5);display:grid;place-items:center;box-shadow:0 0 70px var(--glow);padding:16px}.core img{width:100%;height:100%;object-fit:contain}
.node{position:absolute;width:46px;height:46px;border-radius:14px;background:var(--s2);border:1px solid var(--ln);display:grid;place-items:center;color:var(--cy);animation:float 4s ease-in-out infinite;--tz:0px}
.n1{top:6%;left:50%;margin-left:-23px;color:var(--gr)}.n2{top:50%;right:2%;margin-top:-23px;animation-delay:.5s}.n3{bottom:6%;left:50%;margin-left:-23px;animation-delay:1s}.n4{top:50%;left:2%;margin-top:-23px;animation-delay:1.5s}
.console{position:absolute;bottom:-6%;left:50%;transform:translateX(-50%);background:rgba(8,12,24,.92);border:1px solid var(--ln);border-radius:14px;padding:12px 16px;font:12px ui-monospace,Menlo,monospace;color:#9fb0d4;white-space:nowrap;display:flex;flex-direction:column;gap:5px;box-shadow:0 20px 40px rgba(0,0,0,.4)}
.console b{color:#fff;font-weight:600}.console i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px}.console .g{background:#25D366}.console .b{background:#0866FF}.console .v{background:#8B5CF6}

/* testimonials */
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tcard{padding:34px;border-radius:24px;background:var(--s2);border:1px solid var(--ln);display:flex;flex-direction:column;justify-content:space-between;gap:28px}
.qi{color:var(--cy)}.tcard p{font-size:16.5px;line-height:1.7;color:var(--tx)}
.by{display:flex;gap:14px;align-items:center}.av{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#0866FF,#8B5CF6)}.by b{display:block;color:var(--hd)}.by span{display:block;font-size:13.5px;color:var(--sub)}

/* contact */
.contact-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:70px;align-items:center}
.form{padding:40px}.form form{display:flex;flex-direction:column;gap:20px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.form label{display:block;font-weight:600;font-size:14px;color:var(--hd)}
.form input,.form textarea{display:block;width:100%;margin-top:9px;padding:14px;border-radius:12px;border:1px solid var(--ln);background:var(--bg);color:var(--tx);font:inherit;resize:none;transition:border-color .2s,box-shadow .2s}
.form input:focus,.form textarea:focus{border-color:var(--acc);box-shadow:0 0 0 4px rgba(8,102,255,.18);outline:none}

/* pricing */
.toggle{display:inline-flex;margin-top:26px;background:var(--s2);padding:4px;border-radius:14px;border:1px solid var(--ln)}
.toggle button{border:0;background:transparent;color:var(--sub);font:700 14px 'Hanken Grotesk',sans-serif;padding:10px 22px;border-radius:10px;cursor:pointer;transition:all .2s}
.toggle button.act{background:linear-gradient(120deg,#0866FF,#6d4dff);color:#fff}.toggle em{font-style:normal;font-size:10px;background:rgba(61,214,255,.2);color:var(--cy);padding:2px 6px;border-radius:6px;margin-left:5px}
.addons{max-width:1100px;margin:0 auto 44px;background:var(--s2);border:1px solid var(--ln);border-radius:22px;padding:28px}
.addons h3{font-size:18px}.addons>p{color:var(--sub);font-size:14px;margin:6px 0 20px}
.addon-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:16px}
.addon{padding:18px;border-radius:14px;border:1.5px solid var(--ln);background:var(--bg);cursor:pointer;transition:all .2s}.addon.sel{border-color:var(--acc);background:rgba(8,102,255,.1)}
.addon>div{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}.addon b{color:var(--hd);font-size:15px}.addon strong{color:var(--cy);font-size:14px}.addon span{font-size:13px;color:var(--sub)}
.plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;max-width:1100px;margin:0 auto;align-items:stretch}
.plans>.plan{min-width:0;margin:0;align-self:stretch;transform-origin:center}
@media(max-width:1000px){.plans{grid-template-columns:minmax(0,480px);justify-content:center;gap:34px}}

/* cta */
.cta{position:relative;overflow:hidden;text-align:center;border-radius:32px;padding:90px 30px;background:radial-gradient(700px 320px at 50% 0%,rgba(8,102,255,.5),transparent 70%),linear-gradient(135deg,#070d1f,#10173a);border:1px solid rgba(8,102,255,.35);color:#fff}
.cta .neural{opacity:.55}.cta-in{position:relative;z-index:2}.cta h2{color:#fff;margin:22px 0 16px}.cta p{color:#b6c3e0;font-size:18px;max-width:600px;margin:0 auto 36px}

/* footer */
.foot{background:var(--s1);border-top:1px solid var(--ln);padding:90px 0 36px;color:var(--sub)}
.foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:50px;margin-bottom:50px}
.foot h3{font-size:20px;margin:0}.foot h4{color:var(--hd);margin:0 0 18px;font-size:16px}.foot p{font-size:15px;margin-bottom:10px}.foot .lockup{margin-bottom:16px}
.meta-badge{display:inline-flex;align-items:center;gap:10px;margin-top:14px;padding:8px 14px;border:1px solid var(--ln);border-radius:12px;font-size:13px;color:var(--tx)}
.copy{border-top:1px solid var(--ln);padding-top:26px;text-align:center;font-size:14px}

.wa-float{position:fixed;bottom:28px;right:28px;width:58px;height:58px;border-radius:50%;background:var(--gr);color:#fff;display:grid;place-items:center;z-index:9999;box-shadow:0 12px 28px -6px rgba(37,211,102,.55)}


/* light-mode depth: dark hero/cta/footer, tinted sections, coloured shadows */
.hx[data-theme=light] :is(.hero,.cta,.foot){--bg:#05070E;--s1:#0A0F1E;--s2:#0F1629;--ln:rgba(148,163,184,.14);--tx:#DDE3F2;--sub:#8E9AB7;--hd:#fff;--glow:rgba(8,102,255,.35)}
.hx[data-theme=light] :is(.hero,.cta) .neural{opacity:.75}
.hx[data-theme=light] .hero .chip{background:rgba(15,22,41,.85);color:#fff}
.hx[data-theme=light] :is(.fcard,.tcard,.plan,.addons,.stat,.trustc,.step,.faq-i,.panel,.inbox,.mi){box-shadow:0 22px 44px -26px rgba(30,58,138,.42)}
.hx[data-theme=light] .sec.alt{background:linear-gradient(180deg,#DCE6FA,#D2DEF6)}
.hx[data-theme=light] .strip{background:linear-gradient(90deg,#DCE6FA,#E2E2FA)}
.hx[data-theme=light] .marq{background:#DCE6FA}
/* cursor */
.hxc{position:fixed;left:0;top:0;pointer-events:none;z-index:10000}
.hxc-trail{inset:0;width:100vw;height:100vh;z-index:9998}
.hxc-dot{width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#fff;mix-blend-mode:difference;box-shadow:0 0 14px rgba(61,214,255,.9);z-index:10001}
.hxc-tag{z-index:10002}.hxc-tag span{display:block;margin:18px 0 0 18px;padding:5px 12px;border-radius:99px;background:rgba(8,12,24,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(61,214,255,.55);color:#fff;font:700 11.5px 'Hanken Grotesk',sans-serif;letter-spacing:.2px;white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.meta-img{display:block;flex-shrink:0}.meta-img.w{filter:brightness(0) invert(1)}.hx[data-theme=dark] .meta-img.a{filter:brightness(0) invert(1)}
.hxc-spot{width:560px;height:560px;margin:-280px 0 0 -280px;border-radius:50%;background:radial-gradient(circle,rgba(8,102,255,.17),transparent 65%);z-index:40}
@media(pointer:coarse){.hxc{display:none}}
/* trust marquee */
.marq{overflow:hidden;padding:18px 0;background:var(--s1);border-bottom:1px solid var(--ln);-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.marq-t{display:flex;gap:14px;width:max-content;animation:marq 40s linear infinite}.marq:hover .marq-t{animation-play-state:paused}
.mi{display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:99px;border:1px solid var(--ln);background:var(--s2);color:var(--hd);font-weight:600;font-size:14px;white-space:nowrap}.mi svg{width:18px;height:18px;color:var(--cy)}
/* social proof */
.proof{display:flex;align-items:center;gap:14px;margin-top:30px}
.stack{display:flex}.stack img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--bg);margin-left:-12px;background:var(--s2)}.stack img:first-child{margin-left:0}
.stars{color:#fbbf24;letter-spacing:2px;font-size:15px}.proof span{display:block;color:var(--sub);font-size:13.5px;max-width:340px}
.trust-row{margin-top:26px}
/* steps, trust cards, faq */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.step,.trustc,.faq-i{position:relative;overflow:hidden;background:var(--s2);border:1px solid var(--ln)}
.step{padding:34px;border-radius:24px}.step .n{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font:800 18px 'Bricolage Grotesque',sans-serif;color:#fff;background:linear-gradient(135deg,#0866FF,#8B5CF6);margin-bottom:22px;box-shadow:0 0 30px var(--glow)}
.step h3{font-size:21px;margin-bottom:10px;position:relative}.step p{color:var(--sub);font-size:15px;position:relative}
.sec-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.trustc{padding:28px;border-radius:22px}.trustc>*{position:relative}.trustc .ico{margin-bottom:18px}.trustc h3{font-size:18px;margin-bottom:8px}.trustc p{font-size:14.5px;color:var(--sub)}
.seals{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px;margin-top:34px}.seals span{padding:8px 16px;border-radius:99px;border:1px solid var(--ln);background:var(--s2);font-size:13px;font-weight:600;color:var(--tx)}
.step::before,.tcard::before,.trustc::before,.faq-i::before{content:"";position:absolute;inset:0;background:radial-gradient(300px circle at var(--mx,50%) var(--my,0%),rgba(8,102,255,.2),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}
.step:hover::before,.tcard:hover::before,.trustc:hover::before,.faq-i:hover::before{opacity:1}
.tcard{position:relative;overflow:hidden}.tcard>*{position:relative}
.tq{display:flex;justify-content:space-between;align-items:center}
.av{position:relative;overflow:hidden;flex-shrink:0}.av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.by em{display:block;font-style:normal;font-size:11.5px;color:#4ade80;font-weight:700;margin-top:3px}
.faq{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.faq-i{border-radius:18px;transition:border-color .3s}.faq-i.open{border-color:rgba(8,102,255,.6)}
.faq-q{position:relative;width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;background:none;border:0;color:var(--hd);font:700 16.5px 'Hanken Grotesk',sans-serif;text-align:left;cursor:pointer}
.faq-q i{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(8,102,255,.16);color:var(--cy);font-style:normal;font-size:18px;flex-shrink:0;transition:transform .3s}.faq-i.open .faq-q i{transform:rotate(45deg)}
.faq-a{position:relative;padding:0 24px 22px;color:var(--sub);font-size:15.5px;line-height:1.7}
.care{display:flex;align-items:center;justify-content:space-between;gap:30px;flex-wrap:wrap;padding:34px 40px}
@keyframes marq{to{transform:translateX(-50%)}}
@media(max-width:1024px){.sec-grid{grid-template-columns:1fr 1fr}.steps{grid-template-columns:1fr}}
@media(max-width:680px){.sec-grid{grid-template-columns:1fr}.care{padding:26px 18px}.proof{flex-wrap:wrap}.faq-q{padding:18px}}
@media(prefers-reduced-motion:reduce){.marq-t{animation:none!important}}
/* plan cards */
.plan{position:relative;width:100%;padding:30px 26px 26px;border-radius:28px;background:linear-gradient(180deg,var(--s2),var(--s1));border:1px solid var(--ln);display:flex;flex-direction:column;justify-content:space-between;gap:28px;transition:border-color .3s,box-shadow .3s}
.plan>*{position:relative}
.plan::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(340px circle at var(--mx,50%) var(--my,0%),rgba(8,102,255,.2),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}
.plan:hover::before{opacity:1}.plan:hover{border-color:rgba(8,102,255,.5)}
.plan.pop{border:1.5px solid transparent;background:linear-gradient(var(--s2),var(--s1)) padding-box,linear-gradient(120deg,#0866FF,#8B5CF6,#3DD6FF,#0866FF) border-box;background-size:100% 100%,300% 100%;animation:bdr 7s linear infinite;box-shadow:0 40px 80px -30px var(--glow)}
.plan.is-current{border:1.5px solid var(--gr);animation:none}
.plan>.flag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(120deg,#0866FF,#6d4dff);color:#fff;padding:6px 16px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 8px 20px -6px var(--glow)}
.plan>.flag.is-current{background:var(--gr)}
.plan-h{display:flex;align-items:center;gap:12px}
.plan-ic{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;flex-shrink:0;color:var(--cy);background:linear-gradient(145deg,rgba(8,102,255,.25),rgba(139,92,246,.15));border:1px solid rgba(8,102,255,.35)}
.plan-h h3{font-size:20px;letter-spacing:-.3px;line-height:1.15}.plan-tag{font-size:12.5px;color:var(--sub);margin-top:3px}
.plan-h em{margin-left:auto;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.5px;padding:5px 9px;border-radius:99px;color:var(--cy);background:rgba(61,214,255,.1);border:1px solid rgba(61,214,255,.3);white-space:nowrap}
.price{display:flex;align-items:baseline;gap:4px;margin:26px 0 4px}.price small{font-size:22px;font-weight:700;color:var(--sub)}.price strong{font:800 52px/1 'Bricolage Grotesque',sans-serif;color:var(--hd);letter-spacing:-2px}.price span{color:var(--sub);font-weight:600;font-size:14px}
.per{font-size:12.5px;color:var(--sub)}.base{font-size:12px;color:var(--cy);font-weight:700;margin-top:8px}
.limits{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:24px 0}
.limits div{padding:12px 14px;border-radius:14px;background:rgba(8,102,255,.08);border:1px solid var(--ln)}
.limits strong{display:block;font:800 20px 'Bricolage Grotesque',sans-serif;color:var(--hd);letter-spacing:-.4px}.limits span{display:block;font-size:12px;color:var(--sub);line-height:1.35;margin-top:2px}
.inc{font-size:13px;font-weight:700;color:var(--hd);margin-bottom:14px}
.plan ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:11px}.plan li{display:flex;gap:10px;font-size:14px;color:var(--tx);line-height:1.4}
.plan li i{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:10.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,#0866FF,#3DD6FF);flex-shrink:0;margin-top:1px}
.plan-btn{width:100%;padding:16px}
.plan.is-current .plan-btn{background:rgba(37,211,102,.12);color:#4ade80;border-color:rgba(37,211,102,.4);box-shadow:none}
.plan-note{display:flex;flex-wrap:wrap;gap:10px 26px;justify-content:center;margin-top:36px;color:var(--sub);font-size:13.5px;font-weight:600}
@keyframes bdr{to{background-position:0 0,300% 0}}
@media(prefers-reduced-motion:reduce){.plan.pop{animation:none}}
@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes float{0%,100%{transform:translateZ(var(--tz,0px)) translateY(0)}50%{transform:translateZ(var(--tz,0px)) translateY(-10px)}}
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
@keyframes ping{0%{transform:scale(.8);opacity:.7}100%{transform:scale(2.4);opacity:0}}
@keyframes dash{to{stroke-dashoffset:-28}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shine{0%{left:-60%}55%,100%{left:130%}}
@keyframes grow{from{width:40%}to{width:96%}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.05);opacity:1}}

@media(max-width:1024px){
 .hero-grid,.omni-grid,.ai-grid,.contact-grid,.growth,.trust{grid-template-columns:1fr;gap:44px}
 .hero-float,.omni-proof{display:none}.stats-grid{grid-template-columns:repeat(2,1fr)}
 .bento,.testi-grid{grid-template-columns:1fr 1fr}.fcard.wide{grid-column:span 2}.foot-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:680px){
 .sec{padding:70px 0}.hero{padding:100px 0 70px}.panel,.form{padding:26px 18px;border-radius:22px}.trust{padding:36px 16px}
 .bento,.testi-grid,.foot-grid,.form-row{grid-template-columns:1fr}.fcard.wide{grid-column:auto}
 .phone{width:min(310px,86vw)}.row .btn{width:100%}.wa-float{width:52px;height:52px;bottom:16px;right:16px}
 .omni-wrap{zoom:.8}.vs{width:min(270px,80vw)}.cta{padding:60px 20px;border-radius:24px}
}
@media(prefers-reduced-motion:reduce){
 .aurora,.hero-float,.orb,.node,.ring,.seal-ring,.shine,.dots i,.omni-lines path,.peak .ring,.chip .bar i{animation:none!important}
}
`;

export default Home;
