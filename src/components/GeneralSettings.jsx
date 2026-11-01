import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

// Default Dark Blue Color defined
const DARK_BLUE = "#1e3a8a";

// ---------- Icons + presentational helpers (UI only) ----------
const ico = (children, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const I = {
  lock: (s) => ico(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, s),
  edit: (s) => ico(<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>, s),
  building: (s) => ico(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" /></>, s),
  palette: (s) => ico(<><circle cx="13.5" cy="6.5" r=".6" /><circle cx="17.5" cy="10.5" r=".6" /><circle cx="8.5" cy="7.5" r=".6" /><circle cx="6.5" cy="12.5" r=".6" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.9-4.5-9-10-9z" /></>, s),
  briefcase: (s) => ico(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>, s),
  upload: (s) => ico(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>, s),
  x: (s) => ico(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, s),
  check: (s) => ico(<polyline points="20 6 9 17 4 12" />, s),
  sparkle: (s) => ico(<path d="m12 3-1.9 5.8a2 2 0 0 1-1.28 1.28L3 12l5.8 1.9a2 2 0 0 1 1.28 1.28L12 21l1.9-5.8a2 2 0 0 1 1.28-1.28L21 12l-5.8-1.9a2 2 0 0 1-1.28-1.28L12 3z" />, s),
};

const ease = [0.22, 1, 0.36, 1];
const listV = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const itemV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } };

function Section({ tone, icon, title, locked, children }) {
  return (
    <motion.section variants={itemV} className={`gs-card${locked ? " is-locked" : ""}`} style={{ "--tone": tone }}>
      <div className="gs-card-head">
        <h3 className="gs-card-title">
          <span className="gs-badge">{icon}</span>
          {title}
        </h3>
        {locked && <span className="gs-lockpill">{I.lock(13)} Ultimate Plan Required</span>}
      </div>
      <div className="gs-card-body">{children}</div>
    </motion.section>
  );
}

function TextField({ label, optional, ...inputProps }) {
  return (
    <label className="gs-field">
      <span className="gs-label">
        {label}
        {optional && <span className="gs-opt">(Optional)</span>}
      </span>
      <input className="gs-input" {...inputProps} />
    </label>
  );
}

function GeneralSettings() {
  const [formData, setFormData] = useState({
    vendorTitle: "",
    addressLine: "",
    postalCode: "",
    city: "",
    state: "",
    country: "",
    businessPhone: "",
    contactEmail: "",
    timezone: "UTC",
    defaultLanguage: "English (System Language)",
    customDomain: "",
    logoUrl: "",
    primaryColor: DARK_BLUE
  });

  const [isEditable, setIsEditable] = useState(false);
  const [status, setStatus] = useState({ loading: false, msg: "", isError: false });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Subscription state
  const [userSubscription, setUserSubscription] = useState({
    planId: "",
    subscribed: false
  });

  useEffect(() => {
    if (!document.getElementById("settings-animation-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "settings-animation-styles";
      styleSheet.innerText = `
        * {
          box-sizing: border-box;
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-toast { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.08); border-color: #cbd5e1 !important; }
        .input-focus { transition: all 0.2s ease; }
        .input-focus:focus { border-color: #0f172a !important; background-color: #ffffff !important; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08); }
        .btn-animate { transition: all 0.2s ease; }
        .btn-animate:hover:not(:disabled) { background: #1e293b !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15); }
        .btn-animate:active:not(:disabled) { transform: translateY(0); }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite; display: inline-block; }
        
        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .responsive-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .responsive-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .responsive-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .responsive-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .responsive-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .responsive-toast {
            right: 12px !important;
            left: 12px !important;
            top: 12px !important;
            width: auto !important;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  // Fetch Tenant Config, Vendor Settings, & User Subscription
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Fetch Subscription Status
    axios
      .get("http://api.promiapi.com/api/subscription/user/subscription", { headers })
      .then((res) => {
        if (res.data) {
          setUserSubscription({
            planId: res.data.planId || "",
            subscribed: res.data.subscribed || res.data.active || false
          });
        }
      })
      .catch((err) => console.error("Error fetching subscription:", err));

    // 2. Fetch Tenant Config
    axios
      .get("http://api.promiapi.com/api/tenant/config", { headers })
      .then((res) => {
        if (res.data?.branding) {
          const b = res.data.branding;
          setFormData((prev) => ({
            ...prev,
            vendorTitle: b.companyName || b.vendorTitle || "",
            logoUrl: b.logoUrl || "",
            primaryColor: b.primaryColor || DARK_BLUE,
            customDomain: b.customDomain || ""
          }));
        }
      })
      .catch((err) => console.error("Error loading tenant config:", err));

    // 3. Fetch Vendor Settings
    axios
      .get("http://api.promiapi.com/api/vendor/settings", { headers })
      .then((res) => {
        if (res.data?.settings) {
          const s = res.data.settings;
          setFormData((prev) => ({ 
            ...prev, 
            ...s,
            vendorTitle: s.vendorTitle || s.companyName || prev.vendorTitle,
            logoUrl: s.logoUrl || prev.logoUrl,
            primaryColor: s.primaryColor || prev.primaryColor || DARK_BLUE
          }));
        }
      })
      .catch((err) => console.error("Error loading vendor settings:", err));
  }, []);

  // Check if Ultimate Plan is active
  const isUltimatePlan = userSubscription.planId?.toLowerCase().includes("ultimate") || userSubscription.planId === "price_ultimate";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    if (!isUltimatePlan) return;
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("logo", file);

    setUploadingLogo(true);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post("http://api.promiapi.com/api/vendor/upload-logo", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, logoUrl: res.data.url }));
        setStatus({ loading: false, msg: "Logo uploaded successfully!", isError: false });
      }
    } catch (err) {
      setStatus({ loading: false, msg: "Failed to upload logo file.", isError: true });
    } finally {
      setUploadingLogo(false);
      setTimeout(() => setStatus((prev) => ({ ...prev, msg: "" })), 4000);
    }
  };

  const handleRemoveLogo = () => {
    if (!isUltimatePlan) return;
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
    setStatus({ loading: false, msg: "Logo removed. Save changes to update.", isError: false });
    setTimeout(() => setStatus((prev) => ({ ...prev, msg: "" })), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, msg: "", isError: false });
    const token = localStorage.getItem("token");

    const finalVendorName = isUltimatePlan && formData.vendorTitle ? formData.vendorTitle.trim() : "";

    const formattedCustomDomain = isUltimatePlan && formData.customDomain && formData.customDomain.trim() !== ""
      ? formData.customDomain.trim()
      : null;

    const syncData = {
      name: finalVendorName,
      companyName: finalVendorName,
      vendorTitle: finalVendorName,
      customDomain: formattedCustomDomain,
      logoUrl: isUltimatePlan ? formData.logoUrl : "",
      primaryColor: isUltimatePlan ? formData.primaryColor : DARK_BLUE,
      contactEmail: formData.contactEmail,
      businessPhone: formData.businessPhone,
      addressLine: formData.addressLine,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode
    };

    try {
      const tenantRes = await axios.put("http://api.promiapi.com/api/tenant/update", syncData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await axios.post("http://api.promiapi.com/api/vendor/settings", syncData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (tenantRes.status === 200 || tenantRes.data?.success) {
        setStatus({ loading: false, msg: "Settings updated successfully!", isError: false });
        setIsEditable(false);
        window.dispatchEvent(new Event("tenantBrandingUpdated"));
        setTimeout(() => setStatus(prev => ({ ...prev, msg: "" })), 4500);
      }
    } catch (err) {
      console.error(err);
      setStatus({ 
        loading: false, 
        msg: err.response?.data?.message || "Failed to update vendor settings.", 
        isError: true 
      });
      setTimeout(() => setStatus(prev => ({ ...prev, msg: "" })), 4500);
    }
  };

  const lockedRo = !isEditable || !isUltimatePlan; // fields that need Ultimate + edit mode
  const canUpload = isEditable && isUltimatePlan && !uploadingLogo;

  return (
    <MotionConfig reducedMotion="user">
      <div className="gs-root">
        <style>{css}</style>

        {/* TOAST */}
        <AnimatePresence>
          {status.msg && (
            <motion.div
              key="toast"
              role={status.isError ? "alert" : "status"}
              className={`gs-toast ${status.isError ? "is-error" : "is-ok"}`}
              initial={{ opacity: 0, x: 80, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <span className="gs-toast-icon">{status.isError ? I.x(14) : I.check(14)}</span>
              <div>
                <div className="gs-toast-title">{status.isError ? "System Error" : "Success"}</div>
                <div className="gs-toast-body">{status.msg}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="gs-wrap">
          {/* HERO */}
          <motion.header
            className="gs-hero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="gs-orb gs-orb-a" />
            <span className="gs-orb gs-orb-b" />
            <div className="gs-hero-row">
              <div className="gs-hero-left">
                <div className="gs-logo">
                  <span className="gs-logo-ring" />
                  <span className="gs-logo-core">{I.building(26)}</span>
                </div>
                <div>
                  <h2 className="gs-title">General Settings</h2>
                  <p className="gs-subtitle">Manage your profile database, localization setups, and core metadata details.</p>
                </div>
              </div>

              <button
                type="button"
                className={`gs-edit${isEditable ? " is-on" : ""}`}
                aria-pressed={isEditable}
                onClick={() => setIsEditable(!isEditable)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isEditable ? "lock" : "edit"}
                    className="gs-edit-icon"
                    initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
                    transition={{ duration: 0.18 }}
                  >
                    {isEditable ? I.lock(15) : I.edit(15)}
                  </motion.span>
                </AnimatePresence>
                <span>{isEditable ? "Lock Controls" : "Edit Settings"}</span>
              </button>
            </div>
          </motion.header>

          {!isUltimatePlan && (
            <motion.div
              className="gs-upgrade"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease }}
            >
              <span className="gs-upgrade-icon">{I.sparkle(18)}</span>
              <span className="gs-upgrade-text">
                White-Labeling, Custom Domain, and Company Name customization features are only active on the Ultimate Plan.
              </span>
              <a href="/subscription" className="gs-upgrade-btn">Upgrade Now</a>
            </motion.div>
          )}

          <motion.form onSubmit={handleSubmit} className="gs-form" variants={listV} initial="hidden" animate="show">
            {/* BASIC */}
            <Section tone="#6246ea" icon={I.building(18)} title="Basic Settings" locked={!isUltimatePlan}>
              <TextField
                label="Vendor / Company Name"
                optional
                type="text"
                name="vendorTitle"
                value={isUltimatePlan ? formData.vendorTitle : ""}
                onChange={handleChange}
                placeholder={isUltimatePlan ? "e.g., My Company Name" : "Locked (Ultimate Plan Only)"}
                disabled={lockedRo}
              />
            </Section>

            {/* BRANDING */}
            <Section tone="#b832d6" icon={I.palette(18)} title="White-Label & Branding" locked={!isUltimatePlan}>
              <div className="gs-grid gs-grid-2">
                <TextField
                  label="Custom Domain / Subdomain"
                  optional
                  type="text"
                  name="customDomain"
                  value={isUltimatePlan ? formData.customDomain : ""}
                  onChange={handleChange}
                  placeholder={isUltimatePlan ? "e.g. app.yourbrand.com" : "Locked (Ultimate Plan Only)"}
                  disabled={lockedRo}
                />

                <div className="gs-field">
                  <span className="gs-label">Brand Logo Upload</span>
                  <div className="gs-upload-row">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={!isEditable || !isUltimatePlan || uploadingLogo}
                      style={{ display: "none" }}
                      id="logo-file-input"
                    />
                    <label htmlFor="logo-file-input" className={`gs-upload${canUpload ? "" : " is-disabled"}${isEditable && isUltimatePlan ? "" : " is-dim"}`}>
                      {uploadingLogo ? <span className="gs-spinner gs-spinner-dark" /> : I.upload(15)}
                      <span>{uploadingLogo ? "Uploading..." : "Choose File"}</span>
                    </label>

                    {isUltimatePlan && formData.logoUrl && (
                      <div className="gs-preview">
                        <img src={formData.logoUrl} alt="Logo Preview" className="gs-preview-img" />
                        {isEditable && (
                          <button type="button" onClick={handleRemoveLogo} className="gs-remove" title="Remove Logo">
                            {I.x(12)} Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <TextField
                label="Logo Direct URL (Optional fallback)"
                type="text"
                name="logoUrl"
                value={isUltimatePlan ? formData.logoUrl : ""}
                onChange={handleChange}
                placeholder={isUltimatePlan ? "https://domain.com/logo.png" : "Locked (Ultimate Plan Only)"}
                disabled={lockedRo}
              />

              <div className="gs-field">
                <span className="gs-label">Primary Brand Color</span>
                <div className="gs-color-row">
                  <input
                    type="color"
                    name="primaryColor"
                    className="gs-color"
                    value={isUltimatePlan ? (formData.primaryColor || DARK_BLUE) : DARK_BLUE}
                    onChange={handleChange}
                    disabled={lockedRo}
                    aria-label="Pick primary brand color"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    className="gs-input gs-input-color"
                    value={isUltimatePlan ? formData.primaryColor : DARK_BLUE}
                    onChange={handleChange}
                    placeholder={DARK_BLUE}
                    disabled={lockedRo}
                    aria-label="Primary brand color value"
                  />
                </div>
              </div>
            </Section>

            {/* BUSINESS */}
            <Section tone="#2f7cf6" icon={I.briefcase(18)} title="Business Information">
              <div className="gs-grid gs-grid-2">
                <TextField label="Contact Email" type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="operations@company.com" disabled={!isEditable} />
                <TextField label="Business Phone" type="text" name="businessPhone" value={formData.businessPhone} onChange={handleChange} placeholder="+92 300 1234567" disabled={!isEditable} />
              </div>

              <h4 className="gs-subhead"><span>Address Details</span></h4>

              <TextField label="Address Line" type="text" name="addressLine" value={formData.addressLine} onChange={handleChange} placeholder="Street address" disabled={!isEditable} />

              <div className="gs-grid gs-grid-3">
                <TextField label="City" type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" disabled={!isEditable} />
                <TextField label="State" type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" disabled={!isEditable} />
                <TextField label="Postal Code" type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Zip Code" disabled={!isEditable} />
              </div>
            </Section>

            {/* SAVE */}
            <AnimatePresence>
              {isEditable && (
                <motion.div
                  key="savebar"
                  className="gs-savebar"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <button type="submit" disabled={status.loading} className="gs-save">
                    {status.loading && <span className="gs-spinner" />}
                    <span>{status.loading ? "Saving Settings..." : "Save System Config"}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </div>
      </div>
    </MotionConfig>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.gs-root{
  --ink:#0e1530; --muted:#5b6785; --soft:#8793b2; --line:#e3e8f6; --surface:#fff;
  --p:#6246ea; --p2:#2f7cf6; --p3:#14b8e6;
  width:100%; min-height:100vh; padding:32px; color:var(--ink); box-sizing:border-box;
  font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,sans-serif;
  background:
    radial-gradient(900px 480px at 8% -8%, #e6e0ff 0%, transparent 60%),
    radial-gradient(800px 460px at 100% 0%, #d8f3ff 0%, transparent 55%),
    #f5f7ff;
}
.gs-root *{box-sizing:border-box}
.gs-wrap{max-width:860px;margin:0 auto}

/* Hero */
.gs-hero{position:relative;overflow:hidden;border-radius:22px;padding:26px 28px;margin-bottom:20px;
  background:linear-gradient(135deg,#fff 0%,#f0f2ff 55%,#e8f7ff 100%);border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 18px 40px -22px rgba(70,60,200,.35)}
.gs-orb{position:absolute;border-radius:50%;filter:blur(46px);opacity:.55;pointer-events:none}
.gs-orb-a{width:220px;height:220px;right:-50px;top:-70px;background:#a99bff;animation:gsFloat 9s ease-in-out infinite}
.gs-orb-b{width:180px;height:180px;right:140px;bottom:-90px;background:#7fdcff;animation:gsFloat 11s ease-in-out infinite reverse}
.gs-hero-row{position:relative;display:flex;align-items:center;justify-content:space-between;gap:20px}
.gs-hero-left{display:flex;align-items:center;gap:18px;min-width:0}
.gs-logo{position:relative;width:60px;height:60px;flex-shrink:0;display:grid;place-items:center}
.gs-logo-ring{position:absolute;inset:0;border-radius:18px;background:conic-gradient(from 0deg,var(--p),var(--p3),#b832d6,var(--p));animation:gsSpin 6s linear infinite}
.gs-logo-core{position:relative;width:52px;height:52px;border-radius:15px;background:#fff;display:grid;place-items:center;color:var(--p)}
.gs-title{margin:0;font-size:clamp(21px,3.4vw,26px);font-weight:800;letter-spacing:-.6px;line-height:1.2}
.gs-subtitle{margin:6px 0 0;font-size:14.5px;line-height:1.55;color:var(--muted);max-width:52ch}

.gs-edit{display:inline-flex;align-items:center;gap:9px;padding:12px 20px;border-radius:13px;border:1px solid transparent;cursor:pointer;white-space:nowrap;flex-shrink:0;
  font:700 13.5px/1 inherit;font-family:inherit;color:#fff;background:linear-gradient(120deg,var(--p),var(--p2) 60%,var(--p3));
  box-shadow:0 10px 22px -10px rgba(70,60,220,.65);transition:transform .2s,box-shadow .3s,background .3s,color .3s,border-color .3s}
.gs-edit:hover{transform:translateY(-1px)}
.gs-edit.is-on{background:#fff;color:#2a3558;border-color:#d6dcf0;box-shadow:0 6px 16px -10px rgba(40,50,120,.35)}
.gs-edit:focus-visible,.gs-save:focus-visible,.gs-upgrade-btn:focus-visible,.gs-upload:focus-within,.gs-remove:focus-visible{outline:3px solid rgba(98,70,234,.4);outline-offset:3px}
.gs-edit-icon{display:grid}

/* Upgrade banner */
.gs-upgrade{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 18px;margin-bottom:20px;border-radius:16px;
  background:linear-gradient(135deg,#f6f3ff,#eef6ff);border:1px solid rgba(98,70,234,.2);box-shadow:0 12px 26px -20px rgba(70,60,220,.5)}
.gs-upgrade-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;color:var(--p);background:#e7e2ff;animation:gsPulse 2.4s ease-in-out infinite}
.gs-upgrade-text{flex:1;min-width:220px;font-size:13.5px;line-height:1.55;color:#33407a}
.gs-upgrade-btn{padding:10px 18px;border-radius:12px;color:#fff;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;
  background:linear-gradient(120deg,var(--p),var(--p2) 60%,var(--p3));box-shadow:0 10px 20px -10px rgba(70,60,220,.7);transition:transform .2s,box-shadow .2s}
.gs-upgrade-btn:hover{transform:translateY(-1px);box-shadow:0 14px 24px -10px rgba(70,60,220,.8)}

/* Cards */
.gs-form{display:flex;flex-direction:column;gap:16px}
.gs-card{--tone:#6246ea;background:var(--surface);border:1px solid var(--line);border-radius:20px;overflow:hidden;
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 10px 26px -18px rgba(40,50,120,.25);transition:border-color .25s,box-shadow .25s}
.gs-card:hover{border-color:color-mix(in srgb,var(--tone) 35%,var(--line))}
.gs-card.is-locked{background:linear-gradient(180deg,#fcfcff,#f8f9fd)}
.gs-card-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:18px 24px;border-bottom:1px solid var(--line)}
.gs-card-title{display:flex;align-items:center;gap:13px;margin:0;font-size:16px;font-weight:700;letter-spacing:-.2px}
.gs-badge{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;
  background:color-mix(in srgb,var(--tone) 12%,#fff);color:var(--tone)}
.gs-lockpill{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:700;
  background:#fff6e0;color:#97600a;border:1px solid #fbe3a1}
.gs-card-body{display:flex;flex-direction:column;gap:18px;padding:22px 24px 26px;background:linear-gradient(180deg,#fafbff,#fff)}

/* Fields */
.gs-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.gs-label{font-size:13px;font-weight:600;color:#2a3558}
.gs-opt{margin-left:6px;font-weight:500;color:var(--soft)}
.gs-input{width:100%;padding:11px 14px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;color:var(--ink);
  font:500 14px/1.4 inherit;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}
.gs-input::placeholder{color:#a3adc9}
.gs-input:not(:disabled):hover{border-color:#c3ccea}
.gs-input:not(:disabled):focus{border-color:var(--p);box-shadow:0 0 0 4px rgba(98,70,234,.14)}
.gs-input:disabled{background:#f4f6fc;border-color:#e6eaf6;color:#6b7799;cursor:not-allowed;-webkit-text-fill-color:#6b7799;opacity:1}
.gs-input:disabled::placeholder{color:#b3bcd4;-webkit-text-fill-color:#b3bcd4}
.gs-grid{display:grid;gap:16px}
.gs-grid-2{grid-template-columns:1fr 1fr}
.gs-grid-3{grid-template-columns:1fr 1fr 1fr}
.gs-subhead{display:flex;align-items:center;gap:12px;margin:6px 0 -2px;font-size:13.5px;font-weight:700;color:var(--ink)}
.gs-subhead::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}

/* Logo upload */
.gs-upload-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.gs-upload{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:12px;border:1px dashed #b9c3e6;background:#f7f8ff;color:#3a4a8f;
  font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.gs-upload:hover:not(.is-disabled){border-color:var(--p);background:#f1efff;color:var(--p);transform:translateY(-1px)}
.gs-upload.is-disabled{cursor:not-allowed}
.gs-upload.is-dim{opacity:.6}
.gs-preview{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.gs-preview-img{width:42px;height:42px;padding:3px;border-radius:10px;object-fit:contain;border:1px solid var(--line);
  background:repeating-conic-gradient(#f1f4fb 0 25%,#fff 0 50%) 0 0/10px 10px}
.gs-remove{display:inline-flex;align-items:center;gap:5px;padding:7px 11px;border-radius:9px;border:1px solid #fecdd3;background:#fff1f2;color:#be123c;
  font:700 12px/1 inherit;font-family:inherit;cursor:pointer;transition:background .2s}
.gs-remove:hover{background:#ffe4e8}

/* Color */
.gs-color-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.gs-color{-webkit-appearance:none;appearance:none;width:46px;height:46px;padding:0;border:2px solid #fff;border-radius:14px;cursor:pointer;background:none;
  box-shadow:0 0 0 1px #dbe2f4,0 8px 16px -8px rgba(40,50,120,.4);transition:transform .2s}
.gs-color:not(:disabled):hover{transform:scale(1.06)}
.gs-color:disabled{cursor:not-allowed;opacity:.65}
.gs-color::-webkit-color-swatch-wrapper{padding:0}
.gs-color::-webkit-color-swatch{border:0;border-radius:12px}
.gs-color::-moz-color-swatch{border:0;border-radius:12px}
.gs-input-color{width:150px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}

/* Save */
.gs-savebar{position:sticky;bottom:16px;z-index:5;padding:10px;border-radius:18px;background:rgba(255,255,255,.78);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--line);box-shadow:0 14px 34px -18px rgba(40,50,120,.4)}
.gs-save{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 28px;border:0;border-radius:13px;color:#fff;
  font:700 14px/1 inherit;font-family:inherit;cursor:pointer;background:linear-gradient(120deg,var(--p),var(--p2) 55%,var(--p3));background-size:160% 100%;
  box-shadow:0 10px 22px -10px rgba(70,60,220,.65);transition:background-position .5s,box-shadow .3s,opacity .2s,transform .2s}
.gs-save::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg)}
.gs-save:hover:not(:disabled){background-position:100% 0;box-shadow:0 14px 28px -10px rgba(70,60,220,.75)}
.gs-save:hover:not(:disabled)::after{animation:gsShine .8s ease}
.gs-save:active:not(:disabled){transform:scale(.99)}
.gs-save:disabled{opacity:.8;cursor:progress}
.gs-spinner{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;animation:gsSpin .7s linear infinite;display:inline-block}
.gs-spinner-dark{border-color:rgba(98,70,234,.25);border-top-color:var(--p)}

/* Toast */
.gs-toast{position:fixed;top:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:14px;max-width:360px;padding:14px 18px;border-radius:16px;
  background:#fff;border:1px solid var(--line);border-left:4px solid #10b981;box-shadow:0 24px 40px -18px rgba(20,30,80,.35)}
.gs-toast.is-error{border-left-color:#f43f5e}
.gs-toast-icon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;background:#e6f8f1;color:#0b8a63}
.gs-toast.is-error .gs-toast-icon{background:#ffe4e8;color:#e11d48}
.gs-toast-title{font-size:14px;font-weight:700}
.gs-toast-body{margin-top:2px;font-size:13px;line-height:1.45;color:var(--muted)}

@keyframes gsSpin{to{transform:rotate(360deg)}}
@keyframes gsFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,14px)}}
@keyframes gsPulse{0%,100%{transform:scale(1)}50%{transform:scale(.9)}}
@keyframes gsShine{to{left:130%}}

@media (max-width:768px){
  .gs-root{padding:16px}
  .gs-hero{padding:20px;border-radius:18px}
  .gs-hero-row{flex-direction:column;align-items:stretch}
  .gs-edit{justify-content:center}
  .gs-card-head{padding:14px 16px}
  .gs-card-body{padding:18px 16px 22px}
  .gs-grid-2,.gs-grid-3{grid-template-columns:1fr}
  .gs-toast{top:12px;left:12px;right:12px;max-width:none}
  .gs-savebar{bottom:10px}
  .gs-input-color{width:100%;flex:1}
}
@media (prefers-reduced-motion:reduce){
  .gs-root *,.gs-root *::after{animation:none !important;transition:none !important}
}
`;

export default GeneralSettings;
