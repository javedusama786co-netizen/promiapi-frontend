import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function MainHeader({ toggleTheme, isDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false); // UI only
  const [logoFailed, setLogoFailed] = useState(false); // UI only
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const links = [
    { label: "Features", id: "features" },
    { label: "Pricing", id: "pricing" },
    { label: "Contact", id: "contact" },
    { label: "Terms", id: "/terms", isRoute: true },
    { label: "Policy", id: "/policy", isRoute: true },
  ];

  const SunIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
  );
  const MoonIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
  );

  return (
    <div className={`mh-wrap ${isDarkMode ? "mh-dark" : "mh-light"}`}>
      <style>{css}</style>

      <motion.nav
        className={`mh-nav ${scrolled ? "mh-scrolled" : ""}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand wordmark */}
        <button type="button" className="mh-brand" onClick={() => navigate("/")} aria-label="PromiAPI home">
          <span className="mh-mark">
            {logoFailed ? (
              <span className="mh-mono">P</span>
            ) : (
              <img src={logo} alt="" onError={() => setLogoFailed(true)} />
            )}
            <i className="mh-live" />
          </span>
          <span className="mh-words">
            <span className="mh-name">Promi<em>API</em></span>
            <span className="mh-tag">WhatsApp Cloud API Platform</span>
          </span>
        </button>

        {/* Desktop navigation */}
        <div className="mh-links">
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`mh-link ${l.isRoute && location.pathname === l.id ? "mh-active" : ""}`}
              onClick={() => handleNavClick(l.id, l.isRoute)}
            >
              {l.label}
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
            {isDarkMode ? SunIcon : MoonIcon}
          </button>

          <button type="button" className="mh-ghost" onClick={() => navigate("/login")}>Sign in</button>
          <button type="button" className="mh-cta" onClick={() => navigate("/register")}>
            Get started<span className="mh-long">&nbsp;free</span>
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {links.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`mh-dlink ${l.isRoute && location.pathname === l.id ? "mh-active" : ""}`}
                  onClick={() => handleNavClick(l.id, l.isRoute)}
                >
                  {l.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}

              <div className="mh-dactions">
                <button type="button" className="mh-dtheme" onClick={toggleTheme}>
                  {isDarkMode ? SunIcon : MoonIcon}
                  {isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                </button>
                <button
                  type="button"
                  className="mh-cta mh-cta-block"
                  onClick={() => { setMobileMenuOpen(false); navigate("/register"); }}
                >
                  Get started free
                </button>
              </div>
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
.mh-wrap button { font-family: inherit; }
.mh-light { --bg: rgba(255,255,255,.88); --bd: #e2e8f0; --tx: #0a1931; --mu: #475569; --hv: #f1f5f9; --dr: #ffffff; }
.mh-dark  { --bg: rgba(10,25,49,.88);   --bd: #1e293b; --tx: #ffffff; --mu: #cbd5e1; --hv: #16294a; --dr: #0a1931; }

.mh-nav { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 5%;
  background: var(--bg); -webkit-backdrop-filter: saturate(160%) blur(14px); backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid var(--bd); transition: box-shadow .3s, background .3s; }
.mh-nav.mh-scrolled { box-shadow: 0 10px 30px -12px rgba(2,8,23,.28); }

/* ---- wordmark ---- */
.mh-brand { display: flex; align-items: center; gap: 12px; background: none; border: none; padding: 0; cursor: pointer; color: var(--tx); text-align: left; }
.mh-mark { position: relative; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(37,99,235,.16), rgba(16,185,129,.16)); border: 1px solid rgba(37,99,235,.35);
  box-shadow: 0 6px 16px -6px rgba(37,99,235,.55); transition: transform .3s cubic-bezier(.2,.9,.3,1.3); }
.mh-brand:hover .mh-mark { transform: rotate(-6deg) scale(1.06); }
.mh-mark img { width: 24px; height: 24px; object-fit: contain; }
.mh-mono { font-family: 'Sora', system-ui, sans-serif; font-weight: 800; font-size: 20px; background: linear-gradient(135deg, #2563eb, #10b981); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.mh-live { position: absolute; right: -3px; bottom: -3px; width: 10px; height: 10px; border-radius: 50%; background: #10b981; border: 2px solid var(--dr); box-shadow: 0 0 8px #10b981; }
.mh-words { display: flex; flex-direction: column; line-height: 1; }
.mh-name { font-family: 'Sora', system-ui, sans-serif; font-size: 21px; font-weight: 700; letter-spacing: -.6px; color: var(--tx); }
.mh-name em { font-style: normal; font-weight: 800; margin-left: 1px; background: linear-gradient(135deg, #2563eb 0%, #10b981 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.mh-tag { margin-top: 5px; font-size: 10.5px; font-weight: 500; letter-spacing: .2px; color: var(--mu); opacity: .85; }

/* ---- desktop links ---- */
.mh-links { display: flex; align-items: center; gap: 6px; }
.mh-link { position: relative; background: none; border: none; cursor: pointer; padding: 9px 12px; border-radius: 10px; font-size: 14.5px; font-weight: 500; color: var(--mu); transition: color .2s, background .2s; }
.mh-link::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 4px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, #2563eb, #10b981); transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }
.mh-link:hover { color: var(--tx); background: var(--hv); }
.mh-link:hover::after, .mh-link.mh-active::after { transform: scaleX(1); }
.mh-link.mh-active { color: var(--tx); }
.mh-sep { width: 1px; height: 22px; background: var(--bd); margin: 0 8px; }
.mh-theme { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--bd); background: transparent; color: var(--mu); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s, color .2s, transform .3s; }
.mh-theme:hover { background: var(--hv); color: #f59e0b; transform: rotate(18deg); }
.mh-ghost { height: 38px; padding: 0 16px; margin-left: 4px; border-radius: 10px; border: 1px solid var(--bd); background: transparent; color: var(--tx); font-size: 14.5px; font-weight: 600; cursor: pointer; transition: border-color .2s, background .2s, color .2s; }
.mh-ghost:hover { border-color: #2563eb; color: #2563eb; background: rgba(37,99,235,.06); }
.mh-cta { height: 38px; padding: 0 16px; border: none; border-radius: 10px; color: #fff; font-size: 14.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 8px 18px -8px rgba(37,99,235,.75); transition: transform .15s, box-shadow .2s; }
.mh-cta svg { transition: transform .2s; }
.mh-cta:hover { transform: translateY(-1px); box-shadow: 0 12px 22px -8px rgba(37,99,235,.85); }
.mh-cta:hover svg { transform: translateX(3px); }
.mh-cta:active { transform: translateY(0) scale(.98); }

/* ---- mobile ---- */
.mh-mobile { display: none; align-items: center; gap: 10px; }
.mh-ghost-sm { height: 36px; padding: 0 14px; margin: 0; font-size: 13.5px; border-color: rgba(37,99,235,.55); color: #2563eb; }
.mh-burger { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--bd); background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.mh-burger span { display: block; width: 18px; height: 2px; border-radius: 2px; background: var(--tx); transition: transform .25s, opacity .2s; }
.mh-burger.mh-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.mh-burger.mh-open span:nth-child(2) { opacity: 0; }
.mh-burger.mh-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

.mh-backdrop { position: fixed; inset: 0; z-index: 1; background: rgba(2,8,23,.45); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
.mh-drawer { position: absolute; z-index: 2; top: 100%; left: 0; right: 0; max-height: calc(100vh - 64px); overflow-y: auto; padding: 10px 5% 20px; background: var(--dr); border-bottom: 1px solid var(--bd); box-shadow: 0 24px 40px -16px rgba(2,8,23,.4); }
.mh-dlink { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 15px 4px; background: none; border: none; border-bottom: 1px solid var(--bd); cursor: pointer; font-size: 16px; font-weight: 500; color: var(--tx); text-align: left; }
.mh-dlink svg { color: var(--mu); }
.mh-dlink.mh-active { color: #2563eb; font-weight: 600; }
.mh-dactions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.mh-dtheme { height: 46px; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: 12px; border: 1px solid var(--bd); background: var(--hv); color: var(--tx); font-size: 15px; font-weight: 600; cursor: pointer; }
.mh-cta-block { width: 100%; height: 48px; font-size: 15.5px; }

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
@media (max-width: 520px) {
  .mh-tag { display: none; }
  .mh-name { font-size: 19px; }
  .mh-mark { width: 36px; height: 36px; }
  .mh-mark img { width: 22px; height: 22px; }
}
@media (prefers-reduced-motion: reduce) {
  .mh-wrap * { transition: none !important; animation: none !important; }
}
`;

export default MainHeader;
