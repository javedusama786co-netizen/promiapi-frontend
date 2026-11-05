import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

// Official Meta logo (infinity symbol + "Meta" wordmark). The artwork is NOT redrawn here: put the files in /public
//   meta-logo.webp (full colour)  and  meta-logo-white.webp (for dark backgrounds).
// If the white file is missing, the SAME official logo is shown as a white silhouette.
// symbol = true  ->  only the infinity mark (the left part of the logo file, cropped)
const META_LOGO_COLOR = "/meta-logo.webp";
const META_LOGO_WHITE = "/meta-logo-white.webp";
const META_SYMBOL_ASPECT = 1.54; // width / height of the infinity mark inside the logo file
const MetaLogo = ({ size = 28, tone = "color", symbol = false }) => {
  const [whiteMissing, setWhiteMissing] = useState(false);
  const [missing, setMissing] = useState(false);
  const wantWhite = tone === "white";
  if (missing) {
    return <span style={{ fontWeight: 700, fontSize: size * 0.95, letterSpacing: "-0.02em", lineHeight: 1 }}>Meta</span>;
  }
  const useWhiteFile = wantWhite && !whiteMissing;
  const img = (
    <img
      src={useWhiteFile ? META_LOGO_WHITE : META_LOGO_COLOR}
      alt="Meta"
      className="meta-img"
      style={{ height: size, width: "auto", maxWidth: "none", display: "block", flexShrink: 0, filter: wantWhite && whiteMissing ? "brightness(0) invert(1)" : undefined }}
      onError={() => (useWhiteFile ? setWhiteMissing(true) : setMissing(true))}
    />
  );
  if (!symbol) return img;
  return (
    <span style={{ display: "block", width: size * META_SYMBOL_ASPECT, height: size, overflow: "hidden", flexShrink: 0 }}>
      {img}
    </span>
  );
};

const SECTION_IDS = ["features", "pricing", "contact"];

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.26, ease: "easeOut" } } };

function MainHeader({ toggleTheme, isDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false); // UI only
  const [logoFailed, setLogoFailed] = useState(false); // UI only
  const [hoverId, setHoverId] = useState(null); // UI only (sliding hover pill)
  const [activeId, setActiveId] = useState(""); // UI only (section highlight while scrolling)
  const progressRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (id, isRoute = false) => {
    setMobileMenuOpen(false);
    if (isRoute) {
      navigate(id);
    } else {
      if (location.pathname !== "/") {
        navigate(`/#${id}`);
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  // ---- UI-only effects ----
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y < 200) setActiveId("");
      // thin reading-progress line along the bottom edge of the header
      if (progressRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        progressRef.current.style.transform = `scaleX(${p})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // highlight the section that is on screen (home page only)
  useEffect(() => {
    if (location.pathname !== "/" || typeof IntersectionObserver === "undefined") {
      setActiveId("");
      return undefined;
    }
    let io;
    const start = () => {
      const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
      if (!els.length) return false;
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting && window.scrollY >= 200) setActiveId(en.target.id);
          });
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
      );
      els.forEach((el) => io.observe(el));
      return true;
    };
    let retry;
    if (!start()) retry = setTimeout(start, 700);
    return () => {
      clearTimeout(retry);
      if (io) io.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileMenuOpen(false);
    const onResize = () => window.innerWidth > 900 && setMobileMenuOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // lock page scroll behind the open mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const links = [
    { label: "Features", id: "features" },
    { label: "Pricing", id: "pricing" },
    { label: "Contact", id: "contact" },
    { label: "Terms", id: "/terms", isRoute: true },
    { label: "Policy", id: "/policy", isRoute: true },
  ];

  const isActive = (l) => (l.isRoute ? location.pathname === l.id : activeId === l.id);

  const SunIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
  );
  const MoonIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
  );
  const metaTone = isDarkMode ? "white" : "color";

  return (
    <div className={`mh-wrap ${isDarkMode ? "mh-dark" : "mh-light"}`}>
      <style>{css}</style>

      <motion.nav
        className={`mh-nav ${scrolled ? "mh-scrolled" : ""}`}
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* reading progress */}
        <div className="mh-progress" aria-hidden="true"><span ref={progressRef} /></div>

        {/* Brand wordmark: open logo (no box) + PromiAPI + official Meta logo */}
        <button type="button" className="mh-brand" onClick={() => navigate("/")} aria-label="PromiAPI home">
          <span className="mh-mark">
            {logoFailed ? (
              <span className="mh-mono">P</span>
            ) : (
              <img src={logo} alt="" onError={() => setLogoFailed(true)} />
            )}
          </span>
          <span className="mh-words">
            <span className="mh-name">Promi<em>API</em></span>
            <span className="mh-tag">WhatsApp Cloud API Platform</span>
          </span>
          <span className="mh-meta">
            <span className="mh-meta-sep" />
            <span className="mh-meta-full"><MetaLogo size={18} tone={metaTone} /></span>
            <span className="mh-meta-sym"><MetaLogo size={16} tone={metaTone} symbol /></span>
          </span>
        </button>

        {/* Desktop navigation */}
        <div className="mh-links" onMouseLeave={() => setHoverId(null)}>
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`mh-link ${isActive(l) ? "mh-active" : ""}`}
              onMouseEnter={() => setHoverId(l.id)}
              onFocus={() => setHoverId(l.id)}
              onBlur={() => setHoverId(null)}
              onClick={() => handleNavClick(l.id, l.isRoute)}
            >
              {hoverId === l.id && (
                <motion.span
                  layoutId="mh-hover-pill"
                  className="mh-pill"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              )}
              <span className="mh-link-label">{l.label}</span>
            </button>
          ))}

          <span className="mh-sep" />

          <button
            type="button"
            className="mh-theme"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDarkMode ? "sun" : "moon"}
                className="mh-theme-ic"
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? SunIcon : MoonIcon}
              </motion.span>
            </AnimatePresence>
          </button>

          <button type="button" className="mh-ghost" onClick={() => navigate("/login")}>Sign in</button>
          <button type="button" className="mh-cta" onClick={() => navigate("/register")}>
            <span className="mh-cta-shine" aria-hidden="true" />
            <span className="mh-cta-text">Get started<span className="mh-long">&nbsp;free</span></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>

        {/* Mobile actions */}
        <div className="mh-mobile">
          <button type="button" className="mh-ghost mh-ghost-sm" onClick={() => navigate("/login")}>Sign in</button>
          <button
            type="button"
            className={`mh-burger ${mobileMenuOpen ? "mh-open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              className="mh-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              key="drawer"
              className="mh-drawer"
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <motion.div variants={listVariants} initial="hidden" animate="show">
                {links.map((l) => (
                  <motion.button
                    key={l.id}
                    variants={itemVariants}
                    type="button"
                    className={`mh-dlink ${isActive(l) ? "mh-active" : ""}`}
                    onClick={() => handleNavClick(l.id, l.isRoute)}
                  >
                    <span className="mh-dlink-label">{l.label}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </motion.button>
                ))}

                <motion.div variants={itemVariants} className="mh-dactions">
                  <button type="button" className="mh-dtheme" onClick={toggleTheme}>
                    {isDarkMode ? SunIcon : MoonIcon}
                    {isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  </button>
                  <button
                    type="button"
                    className="mh-cta mh-cta-block"
                    onClick={() => { setMobileMenuOpen(false); navigate("/register"); }}
                  >
                    <span className="mh-cta-shine" aria-hidden="true" />
                    <span className="mh-cta-text">Get started free</span>
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} className="mh-dpartner">
                  <span>Official partner</span>
                  <MetaLogo size={20} tone={metaTone} />
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap');

.mh-wrap { position: sticky; top: 0; z-index: 1000; font-family: 'Inter', 'Segoe UI', Roboto, system-ui, sans-serif; }
.mh-wrap *, .mh-wrap *::before, .mh-wrap *::after { box-sizing: border-box; }
.mh-wrap button { font-family: inherit; -webkit-tap-highlight-color: transparent; }
.mh-light { --bg: rgba(255,255,255,.80); --bg-s: rgba(255,255,255,.94); --bd: #e2e8f0; --tx: #0a1931; --mu: #475569; --hv: #eef2f9; --dr: #ffffff; --shadow: rgba(15,23,42,.18); }
.mh-dark  { --bg: rgba(9,19,40,.74);    --bg-s: rgba(9,19,40,.92);    --bd: #1e2b45; --tx: #ffffff; --mu: #c3cee0; --hv: #16294a; --dr: #0a1931; --shadow: rgba(0,0,0,.5); }

/* ---- bar ---- */
.mh-nav { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 5%;
  background: var(--bg); -webkit-backdrop-filter: saturate(180%) blur(18px); backdrop-filter: saturate(180%) blur(18px);
  border-bottom: 1px solid var(--bd); transition: padding .3s ease, background .3s ease, box-shadow .3s ease; }
.mh-nav.mh-scrolled { padding-top: 8px; padding-bottom: 8px; background: var(--bg-s); box-shadow: 0 14px 34px -18px var(--shadow); }

/* reading progress line */
.mh-progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; overflow: hidden; pointer-events: none; opacity: 0; transition: opacity .3s; }
.mh-scrolled .mh-progress { opacity: 1; }
.mh-progress span { display: block; width: 100%; height: 100%; transform: scaleX(0); transform-origin: left; background: linear-gradient(90deg, #2563eb, #10b981); will-change: transform; }

/* ---- wordmark ---- */
.mh-brand { display: flex; align-items: center; gap: 12px; min-width: 0; background: none; border: none; padding: 0; cursor: pointer; color: var(--tx); text-align: left; }
.mh-mark { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform .35s cubic-bezier(.2,.9,.3,1.3); }
.mh-brand:hover .mh-mark { transform: scale(1.08) rotate(-3deg); }
.mh-mark img { height: 42px; width: auto; max-width: 72px; object-fit: contain; display: block; }
.mh-mono { font-family: 'Sora', system-ui, sans-serif; font-weight: 800; font-size: 28px; line-height: 1; background: linear-gradient(135deg, #2563eb, #10b981); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.mh-words { display: flex; flex-direction: column; line-height: 1; min-width: 0; }
.mh-name { font-family: 'Sora', system-ui, sans-serif; font-size: 21px; font-weight: 700; letter-spacing: -.6px; color: var(--tx); white-space: nowrap; }
.mh-name em { font-style: normal; font-weight: 800; margin-left: 1px; background: linear-gradient(135deg, #2563eb 0%, #10b981 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.mh-tag { margin-top: 5px; font-size: 10.5px; font-weight: 500; letter-spacing: .2px; color: var(--mu); opacity: .85; white-space: nowrap; }
.mh-meta { display: flex; align-items: center; gap: 12px; margin-left: 2px; color: var(--tx); flex-shrink: 0; }
.mh-meta-sep { width: 1px; height: 28px; background: var(--bd); }
.mh-meta-sym { display: none; }

/* ---- desktop links ---- */
.mh-links { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.mh-link { position: relative; background: none; border: none; cursor: pointer; padding: 9px 13px; border-radius: 10px; font-size: 14.5px; font-weight: 500; color: var(--mu); transition: color .2s; }
.mh-pill { position: absolute; inset: 0; border-radius: 10px; background: var(--hv); }
.mh-link-label { position: relative; z-index: 1; }
.mh-link::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 18px; height: 2px; margin-left: -9px; border-radius: 2px; background: linear-gradient(90deg, #2563eb, #10b981); transform: scaleX(0); transition: transform .25s ease; }
.mh-link:hover { color: var(--tx); }
.mh-link.mh-active { color: var(--tx); font-weight: 600; }
.mh-link.mh-active::after { transform: scaleX(1); }
.mh-sep { width: 1px; height: 22px; background: var(--bd); margin: 0 10px; }
.mh-theme { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--bd); background: transparent; color: var(--mu); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s, color .2s, border-color .2s; }
.mh-theme:hover { background: var(--hv); color: #f59e0b; border-color: rgba(245,158,11,.5); }
.mh-theme-ic { display: flex; }
.mh-ghost { height: 38px; padding: 0 17px; margin-left: 6px; border-radius: 10px; border: 1px solid var(--bd); background: transparent; color: var(--tx); font-size: 14.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: border-color .2s, background .2s, color .2s, transform .15s; }
.mh-ghost:hover { border-color: #2563eb; color: #2563eb; background: rgba(37,99,235,.07); transform: translateY(-1px); }
.mh-cta { position: relative; overflow: hidden; height: 38px; padding: 0 18px; margin-left: 4px; border: none; border-radius: 10px; color: #fff; font-size: 14.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #0ea5e9 130%); box-shadow: 0 8px 20px -8px rgba(37,99,235,.8); transition: transform .15s, box-shadow .25s; }
.mh-cta > svg, .mh-cta-text { position: relative; z-index: 1; }
.mh-cta svg { transition: transform .2s; }
.mh-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 26px -8px rgba(37,99,235,.9); }
.mh-cta:hover svg { transform: translateX(4px); }
.mh-cta:active { transform: translateY(0) scale(.98); }
.mh-cta-shine { position: absolute; top: 0; left: 0; width: 38%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.42), transparent); transform: translateX(-160%) skewX(-20deg); animation: mhShine 4.6s ease-in-out infinite; }
@keyframes mhShine { 0%, 62% { transform: translateX(-160%) skewX(-20deg); } 100% { transform: translateX(420%) skewX(-20deg); } }

/* ---- mobile ---- */
.mh-mobile { display: none; align-items: center; gap: 8px; flex-shrink: 0; }
.mh-ghost-sm { height: 38px; padding: 0 15px; margin: 0; font-size: 14px; flex-shrink: 0; white-space: nowrap; border-color: rgba(37,99,235,.6); color: #2563eb; background: rgba(37,99,235,.06); }
.mh-dark .mh-ghost-sm { color: #7fb0ff; border-color: rgba(127,176,255,.55); background: rgba(127,176,255,.08); }
.mh-burger { width: 40px; height: 40px; flex-shrink: 0; border-radius: 10px; border: 1px solid var(--bd); background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; transition: background .2s; }
.mh-burger:hover { background: var(--hv); }
.mh-burger span { display: block; width: 18px; height: 2px; border-radius: 2px; background: var(--tx); transition: transform .25s, opacity .2s; }
.mh-burger.mh-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.mh-burger.mh-open span:nth-child(2) { opacity: 0; }
.mh-burger.mh-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

.mh-backdrop { position: fixed; inset: 0; z-index: 1; background: rgba(2,8,23,.5); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); }
.mh-drawer { position: absolute; z-index: 2; top: 100%; left: 0; right: 0; max-height: calc(100vh - 64px); max-height: calc(100dvh - 64px); overflow-y: auto; padding: 8px 5% 22px; background: var(--dr); border-bottom: 1px solid var(--bd); border-radius: 0 0 22px 22px; box-shadow: 0 28px 44px -18px var(--shadow); transform-origin: top center; }
.mh-dlink { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 16px 4px; background: none; border: none; border-bottom: 1px solid var(--bd); cursor: pointer; font-size: 16px; font-weight: 500; color: var(--tx); text-align: left; }
.mh-dlink svg { color: var(--mu); transition: transform .2s, color .2s; }
.mh-dlink:active svg, .mh-dlink:hover svg { transform: translateX(3px); color: #2563eb; }
.mh-dlink.mh-active { color: #2563eb; font-weight: 600; }
.mh-dark .mh-dlink.mh-active { color: #7fb0ff; }
.mh-dactions { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.mh-dtheme { height: 46px; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: 12px; border: 1px solid var(--bd); background: var(--hv); color: var(--tx); font-size: 15px; font-weight: 600; cursor: pointer; }
.mh-cta-block { width: 100%; height: 48px; margin-left: 0; font-size: 15.5px; border-radius: 12px; }
.mh-dpartner { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--bd); color: var(--tx); }
.mh-dpartner span { font-size: 12px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; color: var(--mu); }

.mh-wrap :focus-visible { outline: 3px solid rgba(37,99,235,.55); outline-offset: 2px; }

/* ---- breakpoints (same 900px switch as before) ---- */
@media (max-width: 1100px) {
  .mh-links { gap: 2px; }
  .mh-link { padding: 9px 9px; font-size: 14px; }
  .mh-sep { margin: 0 4px; }
  .mh-long { display: none; }
}
@media (max-width: 900px) {
  .mh-links { display: none; }
  .mh-mobile { display: flex; }
}
/* phones: tagline + wide Meta lockup make way for the Sign in button; the infinity mark stays */
@media (max-width: 640px) {
  .mh-nav { gap: 10px; }
  .mh-tag { display: none; }
  .mh-meta-full { display: none; }
  .mh-meta-sym { display: block; }
  .mh-meta { gap: 9px; }
  .mh-meta-sep { height: 22px; }
}
@media (max-width: 520px) {
  .mh-nav { padding-left: 4%; padding-right: 4%; }
  .mh-brand { gap: 9px; }
  .mh-name { font-size: 19px; }
  .mh-mark img { height: 36px; max-width: 60px; }
  .mh-ghost-sm { height: 36px; padding: 0 13px; font-size: 13.5px; }
  .mh-burger { width: 38px; height: 38px; }
}
@media (max-width: 360px) {
  .mh-meta { display: none; }
  .mh-name { font-size: 17px; }
  .mh-mark img { height: 32px; max-width: 54px; }
  .mh-ghost-sm { padding: 0 11px; }
}
@media (prefers-reduced-motion: reduce) {
  .mh-wrap * { transition: none !important; animation: none !important; }
}
`;

export default MainHeader;
