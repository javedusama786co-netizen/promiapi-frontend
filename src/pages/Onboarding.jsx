import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GlobalLoader } from "../App";

const BUSINESS_TYPES = [
  "Retail / E-commerce",
  "Restaurant / Food & Beverage",
  "Real Estate",
  "Healthcare / Clinic",
  "Education / Training",
  "Travel & Hospitality",
  "Automotive",
  "Fashion & Apparel",
  "Beauty & Wellness",
  "IT / Software / Agency",
  "Finance / Insurance",
  "Logistics / Delivery",
  "Manufacturing / Wholesale",
  "Other",
];

const COUNTRIES = [
  { name: "Pakistan", code: "pk" },
  { name: "India", code: "in" },
  { name: "Bangladesh", code: "bd" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Qatar", code: "qa" },
  { name: "Kuwait", code: "kw" },
  { name: "Oman", code: "om" },
  { name: "Bahrain", code: "bh" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Canada", code: "ca" },
  { name: "Australia", code: "au" },
  { name: "Germany", code: "de" },
  { name: "France", code: "fr" },
  { name: "Turkey", code: "tr" },
  { name: "Egypt", code: "eg" },
  { name: "Nigeria", code: "ng" },
  { name: "South Africa", code: "za" },
  { name: "Indonesia", code: "id" },
  { name: "Malaysia", code: "my" },
  { name: "Singapore", code: "sg" },
  { name: "Brazil", code: "br" },
  { name: "Mexico", code: "mx" },
  { name: "Other", code: "" },
];

// 🏳️ Flag image (works on every OS, unlike emoji flags on Windows)
function Flag({ code }) {
  if (!code) {
    return (
      <svg className="lg-flag lg-flag-globe" width="22" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }
  return (
    <img
      className="lg-flag"
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width="22"
      height="16"
      alt=""
      loading="lazy"
    />
  );
}

// 🌍 Country dropdown with flags
function CountrySelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = COUNTRIES.find((c) => c.name === value) || COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg-country" ref={wrapRef}>
      <button
        type="button"
        id="country"
        className={`lg-country-btn${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <Flag code={selected.code} />
        <span className="lg-country-name">{selected.name}</span>
        <svg className="lg-country-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <ul className="lg-country-list" role="listbox" aria-labelledby="country">
          {COUNTRIES.map((c) => (
            <li
              key={c.name}
              role="option"
              aria-selected={c.name === value}
              className={c.name === value ? "sel" : ""}
              ref={(el) => { if (el && c.name === value) el.scrollIntoView({ block: "nearest" }); }}
              onClick={() => { onChange(c.name); setOpen(false); }}
            >
              <Flag code={c.code} />
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Onboarding() {
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamSize, setTeamSize] = useState("1-5");
  const [businessType, setBusinessType] = useState("");
  const [website, setWebsite] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGlobalLoader, setShowGlobalLoader] = useState(false);

  const navigate = useNavigate();

  // 🛡️ Secure Route Protection: Prevent direct URL access without token session
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    // Already finished onboarding -> no need to see this page again
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored && stored.onboardingCompleted === true) {
        navigate("/dashboard", { replace: true });
      }
    } catch (_) { /* ignore broken localStorage */ }
  }, [navigate]);

  // 🎬 3D tilt for the hero scene (UI only)
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mvY, [-0.5, 0.5], [9, -9]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mvX, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 20 });

  const handleSceneMove = (e) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mvX.set((e.clientX - rect.left) / rect.width - 0.5);
    mvY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleSceneLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  // 🔑 Fixed Dynamic Backend Base URL
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : "https://api.promiapi.com");

  const validateStep1 = () => {
    const phoneDigits = phone.replace(/\D/g, "");
    if (!companyName.trim() || !phone.trim()) {
      return "Please fill in your company name and WhatsApp number.";
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return "Please enter a valid WhatsApp number with country code.";
    }
    if (!businessType) {
      return "Please select your business type.";
    }
    return "";
  };

  const validateStep2 = () => {
    if (!addressLine.trim() || !city.trim() || !country) {
      return "Please complete your business address (street, city and country).";
    }
    if (website.trim() && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(website.trim())) {
      return "Please enter a valid website URL or leave it empty.";
    }
    return "";
  };

  const handleBack = () => {
    setError("");
    setStep(1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    setError("");

    // ---- Step 1 -> validate, then go to Step 2 ----
    if (step === 1) {
      const msg = validateStep1();
      if (msg) {
        setError(msg);
        return;
      }
      setStep(2);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ---- Step 2 -> validate everything, then submit ----
    const msg = validateStep1() || validateStep2();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);

    let timezone = "UTC";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_) { /* keep UTC */ }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        companyName: companyName.trim(),
        phone: phone.trim(),
        teamSize: teamSize,
        businessType,
        website: website.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: stateRegion.trim(),
        postalCode: postalCode.trim(),
        country,
        timezone,
      };

      // Backend API call to update user profile
      const res = await axios.post(`${BACKEND_URL}/api/auth/complete-onboarding`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        // Merge EVERYTHING the server saved (id, username, company, phone, settings...) into the session
        const serverUser = res.data.user || {};
        let storedUser = {};
        try {
          storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        } catch (_) {
          storedUser = {};
        }

        const role = serverUser.role || storedUser.role || "Admin";
        const mergedUser = {
          ...storedUser,
          ...serverUser,
          id: serverUser.id || storedUser.id,
          handle: serverUser.username || storedUser.handle || "",
          username: companyName.trim(), // same display-name convention Login.jsx uses
          email: serverUser.email || storedUser.email,
          companyName: companyName.trim(),
          phone: phone.trim(),
          teamSize: teamSize,
          role,
          onboardingCompleted: true,
          settings: {
            ...(storedUser.settings || {}),
            ...(serverUser.settings || {}),
          },
        };

        localStorage.setItem("user", JSON.stringify(mergedUser));
        localStorage.setItem("user_role", String(role).toLowerCase());
        if (mergedUser.email) localStorage.setItem("user_email", mergedUser.email);

        setShowGlobalLoader(true);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setError((res.data && res.data.message) || "Failed to save details. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Onboarding Error:", err);
      if (err.response?.status === 401) {
        // session expired / invalid token -> sign in again
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setError(err.response?.data?.message || "Failed to save details. Please try again.");
      setLoading(false);
    }
  };

  if (showGlobalLoader) {
    return <GlobalLoader />;
  }

  // Motion variants for Chat Bubbles Sequence Animation
  const chatContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 1.8,
        repeat: Infinity,
        repeatDelay: 3.5
      }
    }
  };

  const bubbleVariants = {
    initial: { opacity: 0, y: 12, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } }
  };

  return (
    <div className="lg-root">
      <style>{css}</style>

      {/* LEFT: 3D scene (Same as Login) */}
      <section className="lg-left" onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
        <div className="lg-grid" />
        <div className="lg-blob lg-blob-a" />
        <div className="lg-blob lg-blob-b" />

        <div className="lg-copy" style={{ marginTop: "20px" }}>
          <h1 className="lg-h1">Almost there! Configure your workspace.</h1>
          <p className="lg-sub">
            Tell us a bit about your business so we can customize your automated WhatsApp AI experience.
          </p>
        </div>

        {/* 3D scene */}
        <div className="lg-scene" aria-hidden="true">
          <div className="lg-idle">
            <motion.div className="lg-stack" style={{ rotateX, rotateY }}>
              <div className="lg-plate" />

              <div className="lg-chat" style={{ transform: "translateZ(50px)" }}>
                <div className="lg-chat-head">
                  <span className="lg-avatar">P</span>
                  <div>
                    <div className="lg-chat-name">Setup Assistant</div>
                    <div className="lg-chat-status"><i /> Workspace ready</div>
                  </div>
                </div>

                {/* Animated Chat Body Sequence */}
                <motion.div 
                  className="lg-chat-body"
                  variants={chatContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-in">
                    Welcome to PromiAPI!
                  </motion.div>
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-out">
                    Let's connect your WhatsApp business number.
                  </motion.div>
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-in">
                    Ready to automate replies 🚀
                  </motion.div>
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-out lg-typing">
                    <b /><b /><b />
                  </motion.div>
                </motion.div>
              </div>

              <div className="lg-stat" style={{ "--tz": "95px" }}>
                <span className="lg-stat-num">100%</span>
                <span className="lg-stat-label">Cloud API secured</span>
              </div>

              <div className="lg-chip lg-chip-a" style={{ "--tz": "130px" }}>Official Meta Partner</div>
              <div className="lg-chip lg-chip-b" style={{ "--tz": "115px" }}>Instant Setup</div>
            </motion.div>
          </div>
        </div>

        <div className="lg-metrics">
          <div><strong>Step {step} of 2</strong><span>{step === 1 ? "Business Profile" : "Business Location"}</span></div>
          <div><strong>Secure</strong><span>Data Encryption</span></div>
        </div>
      </section>

      {/* RIGHT: Onboarding Form */}
      <main className="lg-right">
        <motion.div
          className="lg-card"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="lg-progress" aria-label={`Step ${step} of 2`}>
            <span className={step >= 1 ? "on" : ""} />
            <span className={step >= 2 ? "on" : ""} />
          </div>
          <div className="lg-stepno">Step {step} of 2</div>
          <h2 className="lg-title">{step === 1 ? "Complete your profile" : "Business location"}</h2>
          <p className="lg-subtitle">
            {step === 1
              ? "Tell us who you are and how customers can reach you."
              : "Add your business address so your profile looks verified and professional."}
          </p>

          {error && (
            <div className="lg-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCompleteOnboarding} className="lg-form">
            {step === 1 && (
              <div className="lg-step" key="step-1">
              <div className="lg-field">
                <label htmlFor="company-name">Company / Store Name</label>
                <div className="lg-input-wrap">
                  <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M5 7l7-4 7 4" /></svg>
                  <input
                    id="company-name"
                    type="text"
                    placeholder="e.g. Promi Store"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="whatsapp-phone">WhatsApp Business Number</label>
                <div className="lg-input-wrap">
                  <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  <input
                    id="whatsapp-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="business-type">Business Type</label>
                <div className="lg-input-wrap">
                  <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  <select
                    id="business-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    disabled={loading}
                    required
                  >
                    <option value="" disabled>Select your industry</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="team-size">Team / Employee Size</label>
                <div className="lg-input-wrap">
                  <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <select
                    id="team-size"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    disabled={loading}
                  >
                    <option value="1-5">1 - 5 employees</option>
                    <option value="6-20">6 - 20 employees</option>
                    <option value="21-50">21 - 50 employees</option>
                    <option value="50+">50+ employees</option>
                  </select>
                </div>
              </div>
              </div>
            )}

            {step === 2 && (
              <div className="lg-step" key="step-2">
              <div className="lg-field">
                <label htmlFor="address-line">Street Address</label>
                <div className="lg-input-wrap">
                  <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <input
                    id="address-line"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Shop / Office no., street, area"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="lg-row">
                <div className="lg-field">
                  <label htmlFor="city">City</label>
                  <div className="lg-input-wrap">
                    <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
                    <input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="e.g. Lahore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="lg-field">
                  <label htmlFor="state">State / Province</label>
                  <div className="lg-input-wrap">
                    <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
                    <input
                      id="state"
                      type="text"
                      autoComplete="address-level1"
                      placeholder="e.g. Punjab"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="lg-row">
                <div className="lg-field">
                  <label htmlFor="postal-code">Postal Code</label>
                  <div className="lg-input-wrap">
                    <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    <input
                      id="postal-code"
                      type="text"
                      inputMode="text"
                      autoComplete="postal-code"
                      placeholder="e.g. 54000"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="lg-field">
                  <label htmlFor="country">Country</label>
                  <CountrySelect value={country} onChange={setCountry} disabled={loading} />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="website">Website <span className="lg-opt">(optional)</span></label>
                <div className="lg-input-wrap">
                  <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  <input
                    id="website"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="www.yourstore.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              </div>
            )}

            <div className="lg-actions">
              {step === 2 && (
                <button type="button" className="lg-back" onClick={handleBack} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Back
                </button>
              )}
              <button type="submit" className="lg-submit" disabled={loading}>
                {loading ? (<><span className="lg-spin" /> Saving details…</>) : step === 1 ? (<>Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>) : "Continue to Dashboard"}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

.lg-root { min-height: 100vh; display: flex; background: #f4f7fb; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
.lg-root *, .lg-root *::before, .lg-root *::after { box-sizing: border-box; }
.lg-root button { font-family: inherit; }

/* ---------- LEFT ---------- */
.lg-left { flex: 1.15; position: relative; overflow: hidden; color: #fff; padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px;
  background: linear-gradient(160deg, #050b18 0%, #0a1931 58%, #0b2a52 100%); }
.lg-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 44px 44px; -webkit-mask-image: radial-gradient(circle at 30% 40%, #000 20%, transparent 75%); mask-image: radial-gradient(circle at 30% 40%, #000 20%, transparent 75%); }
.lg-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.lg-blob-a { width: 420px; height: 420px; top: -120px; left: -80px; background: rgba(37,99,235,.32); filter: blur(100px); animation: lgDriftA 14s ease-in-out infinite; }
.lg-blob-b { width: 380px; height: 380px; bottom: -120px; right: -60px; background: rgba(16,185,129,.22); filter: blur(100px); animation: lgDriftB 16s ease-in-out infinite; }

.lg-copy { position: relative; z-index: 2; max-width: 520px; }
.lg-h1 { font-family: 'Sora', system-ui, sans-serif; font-size: 40px; font-weight: 800; line-height: 1.15; letter-spacing: -1.2px; margin: 0 0 16px; }
.lg-sub { font-size: 16px; line-height: 1.65; color: #9fb0c8; margin: 0; max-width: 460px; }

/* 3D scene */
.lg-scene { position: relative; z-index: 2; perspective: 1400px; display: flex; justify-content: center; align-items: center; min-height: 380px; }
.lg-idle { transform-style: preserve-3d; animation: lgIdle 9s ease-in-out infinite; }
.lg-stack { position: relative; width: 420px; height: 350px; transform-style: preserve-3d; }
.lg-plate { position: absolute; inset: 0; border-radius: 28px; background: linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 50px 90px -30px rgba(0,0,0,.7); backdrop-filter: blur(6px); }
.lg-chat { position: absolute; left: 34px; top: 18px; width: 290px; border-radius: 20px; overflow: hidden; background: #0f1b33; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 30px 60px -20px rgba(0,0,0,.65); }
.lg-chat-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #075e54; }
.lg-avatar { width: 32px; height: 32px; border-radius: 50%; background: #128c7e; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.lg-chat-name { font-size: 13px; font-weight: 600; }
.lg-chat-status { font-size: 11px; color: #cde9e3; display: flex; align-items: center; gap: 5px; }
.lg-chat-status i { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; }
.lg-chat-body { padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; background: #ece5dd; min-height: 215px; justify-content: flex-end; }
.lg-bubble { max-width: 82%; padding: 8px 11px; font-size: 12px; line-height: 1.4; color: #111827; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,.1); }
.lg-in { align-self: flex-start; background: #fff; border-bottom-left-radius: 3px; }
.lg-out { align-self: flex-end; background: #dcf8c6; border-bottom-right-radius: 3px; }
.lg-typing { display: flex; gap: 4px; padding: 11px 13px; width: fit-content; }
.lg-typing b { width: 6px; height: 6px; border-radius: 50%; background: #075e54; opacity: .5; animation: lgDot 1.2s infinite ease-in-out; }
.lg-typing b:nth-child(2) { animation-delay: .15s; }
.lg-typing b:nth-child(3) { animation-delay: .3s; }

/* Stat box positioned nicely below chat UI */
.lg-stat { position: absolute; right: 10px; bottom: -15px; padding: 14px 18px; border-radius: 16px; background: rgba(15,27,51,.95); border: 1px solid rgba(255,255,255,.16); box-shadow: 0 25px 50px rgba(0,0,0,.55); display: flex; flex-direction: column; z-index: 10; animation: lgFloat 5s ease-in-out infinite; }
.lg-stat-num { font-family: 'Sora', system-ui, sans-serif; font-size: 28px; font-weight: 800; line-height: 1; color: #34d399; }
.lg-stat-label { font-size: 11.5px; color: #9fb0c8; margin-top: 5px; }
.lg-chip { position: absolute; padding: 9px 13px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,.4); }
.lg-chip-a { top: -14px; right: -6px; background: #2563eb; animation: lgFloat 4.4s ease-in-out infinite .4s; }
.lg-chip-b { bottom: -20px; left: 10px; background: #0f766e; animation: lgFloat 4.9s ease-in-out infinite .9s; }

.lg-metrics { position: relative; z-index: 2; display: flex; gap: 40px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.1); }
.lg-metrics div { display: flex; flex-direction: column; gap: 3px; }
.lg-metrics strong { font-family: 'Sora', system-ui, sans-serif; font-size: 18px; font-weight: 700; }
.lg-metrics span { font-size: 12.5px; color: #7f93b0; }

/* ---------- RIGHT ---------- */
.lg-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 32px; }
.lg-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 44px 40px; box-shadow: 0 30px 60px -30px rgba(15,23,42,.18); }
.lg-title { font-family: 'Sora', system-ui, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -.6px; margin: 0 0 8px; }
.lg-subtitle { font-size: 15px; color: #64748b; margin: 0 0 20px; }

.lg-error { display: flex; gap: 10px; align-items: flex-start; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.45; margin-bottom: 22px; }
.lg-error svg { flex-shrink: 0; margin-top: 1px; }
.lg-form { display: flex; flex-direction: column; gap: 20px; }
.lg-field { display: flex; flex-direction: column; gap: 8px; }
.lg-field label { font-size: 14px; font-weight: 600; color: #334155; }
.lg-input-wrap { position: relative; display: flex; align-items: center; }
.lg-ico { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; transition: color .2s; z-index: 2; }
.lg-input-wrap input, .lg-input-wrap select { width: 100%; height: 48px; padding: 0 44px 0 42px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-size: 15px; color: #0f172a; outline: none; transition: border-color .2s, box-shadow .2s; }
.lg-input-wrap select { appearance: none; -webkit-appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; text-overflow: ellipsis; }
.lg-input-wrap input::placeholder { color: #94a3b8; }
.lg-input-wrap input:focus, .lg-input-wrap select:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.lg-input-wrap:focus-within .lg-ico { color: #2563eb; }
.lg-input-wrap input:disabled, .lg-input-wrap select:disabled { background: #f1f5f9; cursor: not-allowed; }

.lg-submit { height: 50px; border: none; border-radius: 12px; color: #fff; font-size: 15.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 10px 22px -8px rgba(37,99,235,.65); transition: transform .15s, box-shadow .2s, opacity .2s; }
.lg-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px -8px rgba(37,99,235,.7); }
.lg-submit:active:not(:disabled) { transform: translateY(0) scale(.98); }
.lg-submit:disabled { opacity: .75; cursor: not-allowed; }
.lg-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: lgSpin .7s linear infinite; }

@keyframes lgDriftA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-25px) scale(1.1); } }
@keyframes lgDriftB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-35px,25px) scale(1.06); } }
@keyframes lgIdle { 0%,100% { transform: rotateY(-5deg) rotateX(2deg); } 50% { transform: rotateY(5deg) rotateX(-2deg); } }
@keyframes lgFloat { 0%,100% { transform: translateZ(var(--tz)) translateY(0); } 50% { transform: translateZ(var(--tz)) translateY(-10px); } }
@keyframes lgDot { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
@keyframes lgSpin { to { transform: rotate(360deg); } }

.lg-country { position: relative; width: 100%; }
.lg-country-btn { width: 100%; height: 48px; padding: 0 40px 0 14px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-family: inherit; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; outline: none; transition: border-color .2s, box-shadow .2s; position: relative; }
.lg-country-btn:focus, .lg-country-btn.open { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.lg-country-btn:disabled { background: #f1f5f9; cursor: not-allowed; }
.lg-country-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lg-country-chev { position: absolute; right: 14px; color: #94a3b8; transition: transform .2s; }
.lg-country-btn.open .lg-country-chev { transform: rotate(180deg); }
.lg-flag { width: 22px; height: 16px; flex-shrink: 0; object-fit: cover; border-radius: 3px; box-shadow: 0 0 0 1px rgba(15,23,42,.12); }
.lg-flag-globe { box-shadow: none; color: #94a3b8; }
.lg-country-list { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 30; margin: 0; padding: 6px; list-style: none; max-height: 240px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 20px 40px -12px rgba(15,23,42,.28); }
.lg-country-list li { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; font-size: 15px; color: #0f172a; cursor: pointer; }
.lg-country-list li:hover { background: #f1f5f9; }
.lg-country-list li.sel { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
.lg-opt { font-weight: 400; color: #94a3b8; font-size: 13px; }
.lg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.lg-row .lg-field { min-width: 0; }
.lg-progress { display: flex; gap: 8px; margin-bottom: 14px; }
.lg-progress span { flex: 1; height: 5px; border-radius: 99px; background: #e2e8f0; transition: background .3s; }
.lg-progress span.on { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
.lg-stepno { font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
.lg-step { display: flex; flex-direction: column; gap: 20px; animation: lgStepIn .35s ease-out; }
.lg-actions { display: flex; gap: 12px; margin-top: 10px; }
.lg-actions .lg-submit { flex: 1; }
.lg-back { height: 50px; padding: 0 20px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; color: #334155; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background .2s, border-color .2s; }
.lg-back:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
.lg-back:disabled { opacity: .6; cursor: not-allowed; }
@keyframes lgStepIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
.lg-divider { display: flex; align-items: center; gap: 12px; margin: 6px 0 -4px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; }
.lg-divider::before, .lg-divider::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }

/* ---------- RESPONSIVE MEDIA QUERIES ---------- */
@media (max-width: 1100px) {
  .lg-left { padding: 40px 36px; }
  .lg-h1 { font-size: 34px; }
  .lg-scene { zoom: .88; }
}

@media (max-width: 900px) {
  .lg-root { flex-direction: column; }
  .lg-left { flex: none; padding: 28px 24px 30px; gap: 14px; }
  .lg-scene, .lg-metrics, .lg-sub { display: none; }
  .lg-h1 { font-size: 26px; margin: 0; }
  .lg-right { padding: 28px 20px 40px; align-items: flex-start; }
  .lg-card { max-width: 520px; }
}

@media (max-width: 520px) {
  .lg-left { padding: 22px 20px 24px; }
  .lg-h1 { font-size: 22px; }
  .lg-right { padding: 0; background: #fff; align-items: stretch; }
  .lg-card { max-width: none; border: none; border-radius: 0; box-shadow: none; padding: 28px 20px 36px; }
  .lg-title { font-size: 24px; }
  .lg-input-wrap input, .lg-input-wrap select { font-size: 16px; }
  .lg-row { grid-template-columns: 1fr; gap: 20px; }
  .lg-submit, .lg-back { height: 52px; }
  .lg-country-btn { height: 48px; font-size: 16px; }
  .lg-country-list { max-height: 220px; }
}

@media (max-width: 520px) and (min-width: 380px) {
  .lg-row { grid-template-columns: 1fr 1fr; gap: 12px; }
}
`;

export default Onboarding;
