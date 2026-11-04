import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import axios from "axios";

// 🌐 Dynamic Base URL Setup with Ngrok Support
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.promiapi.com"; // default fallback

// 🤖 Groq models (backend default = openai/gpt-oss-120b; old OpenAI names like gpt-4o are auto-replaced there)
const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_MODELS = [
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Recommended)" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Fast)" },
];

// Custom Clean SVG Icons
// Official logos. Groq mark = official Groq "G" glyph (single path). Flowise = official FlowiseAI wordmark (PNG, embedded so no external request is needed).
const FLOWISE_LOGO = "data:image/png;base64,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";

const Icons = {
  Groq: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z" />
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.5 10.5 0 0 1 12 19C5.6 19 2 12 2 12a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 5.24A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  Gear: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Bot: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Server: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.28 1.28L3 12l5.8 1.9a2 2 0 0 1 1.28 1.28L12 21l1.9-5.8a2 2 0 0 1 1.28-1.28L21 12l-5.8-1.9a2 2 0 0 1-1.28-1.28L12 3z" />
    </svg>
  ),
  Info: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Save: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  ExternalLink: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

// ---------- Presentational helpers (UI only, no logic) ----------
const listV = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } };
const itemV = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function Section({ id, openSection, onToggle, icon, tone, title, sub, status, children }) {
  const open = openSection === id;
  return (
    <motion.section variants={itemV} className={`ab-card${open ? " is-open" : ""}`} style={{ "--tone": tone }}>
      <h3 className="ab-h">
        <button type="button" className="ab-card-head" onClick={() => onToggle(id)} aria-expanded={open}>
          <span className="ab-badge">{icon}</span>
          <span className="ab-head-text">
            <span className="ab-card-title">{title}</span>
            <span className="ab-card-sub">{sub}</span>
          </span>
          {status !== undefined && (
            <span className={`ab-pill${status ? " on" : ""}`}>
              <i />
              {status ? "Active" : "Off"}
            </span>
          )}
          <motion.span className="ab-chev" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <Icons.ChevronDown />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="ab-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Reveal({ show, children }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="nested"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div className="ab-nested">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Switch({ checked, onChange, title, hint }) {
  return (
    <label className="ab-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="ab-track"><span className="ab-thumb" /></span>
      <span className="ab-switch-text">
        <strong>{title}</strong>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

// Password-style input with an eye button: click to reveal / hide the saved key
function SecretInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="ab-secret">
      <input
        type={visible ? "text" : "password"}
        className="ab-input ab-secret-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="ab-eye"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide key" : "Show key"}
        aria-pressed={visible}
        title={visible ? "Hide" : "Show"}
      >
        {visible ? <Icons.EyeOff /> : <Icons.Eye />}
      </button>
    </span>
  );
}

function Field({ label, value, hint, children }) {
  return (
    <label className="ab-field">
      <span className="ab-label">
        <span>{label}</span>
        {value !== undefined && <b className="ab-chip">{value}</b>}
      </span>
      {children}
      {hint && <small className="ab-hint">{hint}</small>}
    </label>
  );
}


function AiBotSettings() {
  const [openSection, setOpenSection] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [failedMessage, setFailedMessage] = useState("");
  const [enableForNewContacts, setEnableForNewContacts] = useState(false);

  // Groq AI State (backend: settings.groq -> runGroqChat in webhookRoutes.js)
  const [groqEnabled, setGroqEnabled] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState("");
  const [savedKeyLoaded, setSavedKeyLoaded] = useState(false);
  const [groqModel, setGroqModel] = useState(GROQ_DEFAULT_MODEL);
  const [groqPrompt, setGroqPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);

  // Flowise State
  const [flowiseEnabled, setFlowiseEnabled] = useState(false);
  const [flowiseApiUrl, setFlowiseApiUrl] = useState("");

  // Bank CBS / External Server State Added
  const [externalEnabled, setExternalEnabled] = useState(false);
  const [externalBaseUrl, setExternalBaseUrl] = useState("");
  const [externalApiKey, setExternalApiKey] = useState("");
  const [externalApiSecret, setExternalApiSecret] = useState("");
  const [externalDescription, setExternalDescription] = useState("");

  // Timing State
  const [enableTiming, setEnableTiming] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [timingTriggers, setTimingTriggers] = useState({
    welcome: false,
    is: false,
    startsWith: false,
    endsWith: false,
    containsWhole: false,
    contains: false,
    stopPromotional: false,
    startPromotional: false,
    startAiBot: false,
    stopAiBot: false,
  });

  // Handover & Delay State
  const [handoverKeyword, setHandoverKeyword] = useState("");
  const [responseDelay, setResponseDelay] = useState(0);

  // Axios Custom Config for Ngrok
  const getAxiosConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  // Fetch Existing Settings on Mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/ai-bot/settings`, getAxiosConfig());

        if (res.data?.success && res.data?.data) {
          const s = res.data.data;
          setFailedMessage(s.general?.failedMessage || "");
          setEnableForNewContacts(s.general?.enableForNewContacts || false);

          // Groq settings (old openai.* values are only used as fallback for enabled / prompt / temperature,
          // same as the backend does. The old OpenAI API key and gpt-* model are NOT loaded: they don't work on Groq.)
          setGroqEnabled(s.groq?.enabled ?? s.openai?.enabled ?? false);
          // Same lookup order as backend resolveGroqApiKey(): groq.apiKey first; a Groq key (gsk_...) that was
          // pasted into the old "OpenAI API Key" box is also found in openai.apiKey. Real OpenAI keys (sk-...) are ignored.
          const legacyKey = typeof s.openai?.apiKey === "string" && s.openai.apiKey.trim().startsWith("gsk_") ? s.openai.apiKey.trim() : "";
          const loadedKey = (s.groq?.apiKey || legacyKey || "").trim();
          setGroqApiKey(loadedKey);
          setSavedKeyLoaded(Boolean(loadedKey));
          if (!loadedKey) console.warn("[AiBotSettings] No Groq API key came back from /api/ai-bot/settings (groq.apiKey is empty). If you saved one, the GET route may be masking or not returning it.");
          const savedModel = s.groq?.model;
          setGroqModel(savedModel && !/^(gpt-|chatgpt|o1|o3|o4)/i.test(savedModel) ? savedModel : GROQ_DEFAULT_MODEL);
          setGroqPrompt(s.groq?.systemPrompt ?? s.openai?.systemPrompt ?? "");
          setTemperature(s.groq?.temperature ?? s.openai?.temperature ?? 0.7);

          setFlowiseEnabled(s.flowise?.enabled || false);
          setFlowiseApiUrl(s.flowise?.apiUrl || "");

          // Load External API Settings
          setExternalEnabled(s.externalApi?.enabled || false);
          setExternalBaseUrl(s.externalApi?.baseUrl || "");
          setExternalApiKey(s.externalApi?.apiKey || "");
          setExternalApiSecret(s.externalApi?.apiSecret || "");
          setExternalDescription(s.externalApi?.description || "");

          setEnableTiming(s.timing?.enabled || false);
          setStartTime(s.timing?.startTime || "");
          setEndTime(s.timing?.endTime || "");
          setTimezone(s.timing?.timezone || "UTC");
          if (s.timing?.triggers) {
            setTimingTriggers((prev) => ({ ...prev, ...s.timing.triggers }));
          }

          setHandoverKeyword(s.advanced?.handoverKeyword || "");
          setResponseDelay(s.advanced?.responseDelay || 0);
        }
      } catch (err) {
        console.error("Failed to fetch AI Bot Settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleTimingCheckbox = (key) => {
    setTimingTriggers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      general: { failedMessage, enableForNewContacts },
      groq: {
        enabled: groqEnabled,
        apiKey: groqApiKey,
        model: groqModel,
        systemPrompt: groqPrompt,
        temperature,
      },
      // Backend treats (openai.enabled || groq.enabled) as "AI on". Force the legacy flag OFF
      // so that turning Groq off here really turns the bot off.
      openai: { enabled: false },
      flowise: { enabled: flowiseEnabled, apiUrl: flowiseApiUrl },
      externalApi: {
        enabled: externalEnabled,
        baseUrl: externalBaseUrl,
        apiKey: externalApiKey,
        apiSecret: externalApiSecret,
        description: externalDescription,
      },
      timing: {
        enabled: enableTiming,
        startTime,
        endTime,
        timezone,
        triggers: timingTriggers,
      },
      advanced: { handoverKeyword, responseDelay },
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/ai-bot/settings`, payload, getAxiosConfig());

      if (res.data?.success) {
        alert("Settings saved successfully! 🎉");
      }
    } catch (err) {
      console.error("Error saving configuration:", err);
      alert(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ab-root ab-center">
        <style>{css}</style>
        <div className="ab-loader">
          <span className="ab-ring" />
          <span className="ab-loader-icon"><Icons.Sparkles /></span>
        </div>
        <p className="ab-loading-text">Loading AI Configuration...</p>
      </div>
    );
  }

  const sp = { openSection, onToggle: toggleSection };

  // MotionConfig reducedMotion="never": when Windows/PC has "Show animations" OFF (or power saver / remote desktop),
  // browsers report reduced-motion and "user" mode silently disabled every animation on desktop.

  return (
    <MotionConfig reducedMotion="never">
      <div className="ab-root aibot-settings-container">
        <style>{css}</style>
        <div className="ab-wrap">
          {/* Header */}
          <motion.header
            className="ab-hero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="ab-orb ab-orb-a" />
            <span className="ab-orb ab-orb-b" />
            <div className="ab-hero-row">
              <div className="ab-logo">
                <span className="ab-logo-ring" />
                <span className="ab-logo-core"><Icons.Bot /></span>
              </div>
              <div>
                <h1 className="ab-title">AI Chatbot Configuration</h1>
                <p className="ab-subtitle">
                  Manage automated responses, LLM integrations, and availability controls.
                </p>
              </div>
            </div>
            <div className="ab-info">
              <span className="ab-info-icon"><Icons.Info /></span>
              <span>
                AI Bot triggers only when standard keyword rules do not match and AI response is active for the contact.
              </span>
            </div>
          </motion.header>

          <motion.form onSubmit={handleSave} className="ab-form" variants={listV} initial="hidden" animate="show">
            {/* 1. GENERAL */}
            <Section id="general" {...sp} icon={<Icons.Gear />} tone="#6246ea"
              title="General Engine Settings" sub="Fallback responses and contact defaults" status={enableForNewContacts}>
              <Field label="AI Fallback Error Message" hint="Sent to the recipient if the AI API fails or times out.">
                <input
                  type="text"
                  className="ab-input"
                  value={failedMessage}
                  onChange={(e) => setFailedMessage(e.target.value)}
                  placeholder="e.g., Unable to process request right now. An agent will assist you soon."
                />
              </Field>
              <Switch
                checked={enableForNewContacts}
                onChange={(e) => setEnableForNewContacts(e.target.checked)}
                title="Enable AI Chat Bot for New Contacts"
                hint="Automatically enables AI automation for incoming new leads and contacts."
              />
            </Section>

            {/* 2. GROQ */}
            <Section id="groq" {...sp} icon={<Icons.Groq />} tone="#f55036"
              title="Groq AI Integration" sub="Groq-hosted GPT-OSS model configuration and prompt setup" status={groqEnabled}>
              <div className="ab-brand-row">
                <span className="ab-brand-groq"><Icons.Groq /><b>groq</b></span>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="ab-link">
                  <span>Get Groq API Key</span>
                  <Icons.ExternalLink />
                </a>
              </div>
              <Switch
                checked={groqEnabled}
                onChange={(e) => setGroqEnabled(e.target.checked)}
                title="Enable Groq AI Responses"
              />
              <Reveal show={groqEnabled}>
                <Field
                  label="Groq API Key"
                  hint={
                    savedKeyLoaded
                      ? "✓ Saved key loaded from server. Click the eye icon to view it."
                      : "No key saved yet. If left empty, the server's GROQ_API_KEY environment variable is used."
                  }
                >
                  <SecretInput value={groqApiKey} onChange={(e) => setGroqApiKey(e.target.value)} placeholder="gsk_..." />
                  {groqApiKey && !/^gsk_/.test(groqApiKey.trim()) && (
                    <small className="ab-hint ab-hint-warn">Groq keys normally start with "gsk_". This looks like a different key.</small>
                  )}
                </Field>

                <div className="ab-grid ab-grid-2">
                  <Field label="AI Model">
                    <select className="ab-input ab-select" value={groqModel} onChange={(e) => setGroqModel(e.target.value)}>
                      {GROQ_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      {!GROQ_MODELS.some((m) => m.value === groqModel) && (
                        <option value={groqModel}>{groqModel} (custom)</option>
                      )}
                    </select>
                  </Field>

                  <Field label="Temperature" value={temperature}>
                    <input
                      type="range"
                      className="ab-range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      style={{ "--fill": `${temperature * 100}%` }}
                    />
                  </Field>
                </div>

                <Field label="System Instructions / Persona Context">
                  <textarea
                    rows="4"
                    className="ab-input ab-textarea"
                    value={groqPrompt}
                    onChange={(e) => setGroqPrompt(e.target.value)}
                    placeholder="Specify business details, tone of voice, guidelines, and restrictions..."
                  />
                </Field>
              </Reveal>
            </Section>

            {/* 3. FLOWISE */}
            <Section id="flowise" {...sp} icon={<Icons.Zap />} tone="#f59e0b"
              title="FlowiseAI Endpoint Integration" sub="Connect custom visual drag-and-drop workflow chains" status={flowiseEnabled}>
              <div className="ab-brand-row">
                <img src={FLOWISE_LOGO} alt="FlowiseAI" className="ab-brand-logo" />
                <a href="https://flowiseai.com" target="_blank" rel="noreferrer" className="ab-link">
                  <span>Docs & Platform</span>
                  <Icons.ExternalLink />
                </a>
              </div>
              <Switch
                checked={flowiseEnabled}
                onChange={(e) => setFlowiseEnabled(e.target.checked)}
                title="Enable FlowiseAI Workflow Engine"
              />
              <Reveal show={flowiseEnabled}>
                <Field label="Flowise Prediction API Endpoint URL" hint="Obtain this prediction URL from Flowise canvas API dialog.">
                  <input
                    type="text"
                    className="ab-input"
                    value={flowiseApiUrl}
                    onChange={(e) => setFlowiseApiUrl(e.target.value)}
                    placeholder="https://your-flowise-instance.com/api/v1/prediction/..."
                  />
                </Field>
              </Reveal>
            </Section>

            {/* 4. BANK CBS / EXTERNAL API */}
            <Section id="externalApi" {...sp} icon={<Icons.Server />} tone="#2f7cf6"
              title="Bank CBS & External Server Connection" sub="Secure API gateway for real-time AI function calling" status={externalEnabled}>
              <Switch
                checked={externalEnabled}
                onChange={(e) => setExternalEnabled(e.target.checked)}
                title="Enable Bank CBS / External Server API"
              />
              <Reveal show={externalEnabled}>
                <Field
                  label="External Server / Bank CBS Base URL"
                  hint="AI will dispatch requests here when customers ask for account balances or status."
                >
                  <input
                    type="url"
                    className="ab-input"
                    value={externalBaseUrl}
                    onChange={(e) => setExternalBaseUrl(e.target.value)}
                    placeholder="https://api.yourbank-cbs.com/v1/webhook"
                  />
                </Field>

                <div className="ab-grid ab-grid-2">
                  <Field label="API Key / Bearer Token">
                    <SecretInput value={externalApiKey} onChange={(e) => setExternalApiKey(e.target.value)} placeholder="Enter secure API key..." />
                  </Field>
                  <Field label="API Secret / Signature (Optional)">
                    <SecretInput value={externalApiSecret} onChange={(e) => setExternalApiSecret(e.target.value)} placeholder="Enter API secret..." />
                  </Field>
                </div>

                <Field label="Description / Notes">
                  <input
                    type="text"
                    className="ab-input"
                    value={externalDescription}
                    onChange={(e) => setExternalDescription(e.target.value)}
                    placeholder="e.g., Core Banking System Production Server"
                  />
                </Field>
              </Reveal>
            </Section>

            {/* 5. TIMING */}
            <Section id="timing" {...sp} icon={<Icons.Clock />} tone="#0ea5c6"
              title="Operating Hours & Schedule" sub="Restrict AI execution to specific time windows" status={enableTiming}>
              <Switch
                checked={enableTiming}
                onChange={(e) => setEnableTiming(e.target.checked)}
                title="Enable Time-Based Operating Schedule"
              />
              <Reveal show={enableTiming}>
                <div className="ab-grid ab-grid-3">
                  <Field label="Start Time">
                    <input type="time" className="ab-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </Field>
                  <Field label="End Time">
                    <input type="time" className="ab-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </Field>
                  <Field label="Timezone">
                    <select className="ab-input ab-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Asia/Karachi">Asia/Karachi (PKT +05:00)</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                    </select>
                  </Field>
                </div>

                <div className="ab-warn">
                  Outside operating hours, selected bots below will be paused. Unchecked triggers will remain active 24/7.
                </div>

                <h4 className="ab-subhead">Apply Schedule Limits To:</h4>
                <div className="ab-tiles">
                  {Object.keys(timingTriggers).map((key) => (
                    <label key={key} className="ab-tile">
                      <input type="checkbox" checked={timingTriggers[key]} onChange={() => handleTimingCheckbox(key)} />
                      <span className="ab-box" />
                      <span className="ab-tile-text">{key.replace(/([A-Z])/g, " $1")}</span>
                    </label>
                  ))}
                </div>
              </Reveal>
            </Section>

            {/* 6. HANDOVER */}
            <Section id="handover" {...sp} icon={<Icons.Sparkles />} tone="#b832d6"
              title="Human Handover & Delay Simulation" sub="Pause AI on human escalation and add human typing delays">
              <Field
                label="Human Escalation Keywords"
                hint="Comma-separated list. Receiving these words will instantly pause AI automation for the conversation."
              >
                <input
                  type="text"
                  className="ab-input"
                  value={handoverKeyword}
                  onChange={(e) => setHandoverKeyword(e.target.value)}
                  placeholder="e.g. human, agent, support, representative"
                />
              </Field>

              <Field
                label="Simulated Typing Delay"
                value={`${responseDelay}s`}
                hint="Simulates human response cadence before sending automated AI messages."
              >
                <input
                  type="range"
                  className="ab-range"
                  min="0"
                  max="10"
                  value={responseDelay}
                  onChange={(e) => setResponseDelay(parseInt(e.target.value, 10))}
                  style={{ "--fill": `${responseDelay * 10}%` }}
                />
              </Field>
            </Section>

            {/* SAVE */}
            <div className="ab-savebar">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSaving}
                className="ab-save"
              >
                {isSaving ? <span className="ab-spinner" /> : <Icons.Save />}
                <span>{isSaving ? "Saving Config..." : "Save Settings"}</span>
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </MotionConfig>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.ab-root{
  --ink:#0e1530; --muted:#5b6785; --soft:#8793b2; --line:#e3e8f6; --surface:#ffffff;
  --p:#6246ea; --p2:#2f7cf6; --p3:#14b8e6;
  min-height:100vh; min-height:100dvh; padding:32px; color:var(--ink); box-sizing:border-box;
  font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,sans-serif;
  background:
    radial-gradient(900px 480px at 8% -8%, #e6e0ff 0%, transparent 60%),
    radial-gradient(800px 460px at 100% 0%, #d8f3ff 0%, transparent 55%),
    #f5f7ff;
}
.ab-root *{box-sizing:border-box}
.ab-wrap{max-width:980px;margin:0 auto}
.ab-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}

/* ---------- Loader ---------- */
.ab-loader{position:relative;width:68px;height:68px;display:grid;place-items:center}
.ab-ring{position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(from 0deg,var(--p),var(--p3),transparent 70%);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
          mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
  animation:abSpin 1.1s linear infinite}
.ab-loader-icon{color:var(--p);display:grid;animation:abPulse 1.6s ease-in-out infinite}
.ab-loading-text{margin:0;color:var(--muted);font-size:14px;font-weight:500}

/* ---------- Hero ---------- */
.ab-hero{position:relative;overflow:hidden;border-radius:22px;padding:28px;margin-bottom:22px;
  background:linear-gradient(135deg,#ffffff 0%,#f0f2ff 55%,#e8f7ff 100%);
  border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 18px 40px -22px rgba(70,60,200,.35)}
.ab-orb{position:absolute;border-radius:50%;filter:blur(46px);opacity:.55;pointer-events:none;will-change:transform;transform:translateZ(0)}
.ab-orb-a{width:220px;height:220px;right:-50px;top:-70px;background:#a99bff;animation:abFloat 9s ease-in-out infinite}
.ab-orb-b{width:180px;height:180px;right:140px;bottom:-90px;background:#7fdcff;animation:abFloat 11s ease-in-out infinite reverse}
.ab-hero-row{position:relative;display:flex;align-items:center;gap:18px}
.ab-logo{position:relative;width:60px;height:60px;flex-shrink:0;display:grid;place-items:center}
.ab-logo-ring{position:absolute;inset:0;border-radius:18px;will-change:transform;
  background:conic-gradient(from 0deg,var(--p),var(--p3),#b832d6,var(--p));animation:abSpin 6s linear infinite}
.ab-logo-core{position:relative;width:52px;height:52px;border-radius:15px;background:#fff;display:grid;place-items:center;color:var(--p)}
.ab-logo-core svg{width:26px;height:26px}
.ab-title{margin:0;font-size:26px;font-weight:800;letter-spacing:-.6px;line-height:1.2;color:var(--ink)}
.ab-subtitle{margin:6px 0 0;font-size:14.5px;line-height:1.55;color:var(--muted);max-width:60ch}
.ab-info{position:relative;display:flex;align-items:flex-start;gap:10px;margin-top:20px;padding:12px 16px;border-radius:14px;
  background:rgba(255,255,255,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border:1px solid rgba(98,70,234,.16);font-size:13.5px;line-height:1.5;color:#3a4566}
.ab-info-icon{display:grid;color:var(--p);margin-top:1px;flex-shrink:0}

/* ---------- Cards ---------- */
.ab-form{display:flex;flex-direction:column;gap:14px}
.ab-card{--tone:#6246ea;background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden;
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 10px 26px -18px rgba(40,50,120,.25);
  transition:border-color .25s,box-shadow .25s}
.ab-card:hover{border-color:color-mix(in srgb,var(--tone) 35%,var(--line))}
.ab-card.is-open{border-color:color-mix(in srgb,var(--tone) 45%,var(--line));
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 18px 36px -20px color-mix(in srgb,var(--tone) 55%,transparent)}
.ab-h{margin:0;font-size:inherit}
.ab-card-head{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:14px;padding:18px 22px;cursor:pointer;user-select:none}
.ab-card-head:focus-visible{outline:3px solid color-mix(in srgb,var(--tone) 40%,transparent);outline-offset:-3px;border-radius:18px}
.ab-badge{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;flex-shrink:0;
  background:color-mix(in srgb,var(--tone) 12%,#fff);color:var(--tone);transition:background .3s,color .3s,box-shadow .3s}
.ab-card.is-open .ab-badge{background:linear-gradient(135deg,var(--tone),color-mix(in srgb,var(--tone) 55%,#14b8e6));
  color:#fff;box-shadow:0 8px 18px -8px var(--tone)}
.ab-head-text{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.ab-card-title{font-size:15.5px;font-weight:700;color:var(--ink);letter-spacing:-.2px}
.ab-card-sub{font-size:12.5px;color:var(--soft);line-height:1.4}
.ab-chev{display:grid;color:var(--soft);flex-shrink:0}
.ab-pill{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;
  background:#eef1f9;color:#66739a;flex-shrink:0}
.ab-pill i{width:7px;height:7px;border-radius:50%;background:#aab4d0}
.ab-pill.on{background:#e6f8f1;color:#0b8a63}
.ab-pill.on i{background:#10b981;animation:abDot 1.8s ease-out infinite}
.ab-body{display:flex;flex-direction:column;gap:18px;padding:22px 24px 26px;border-top:1px solid var(--line);
  background:linear-gradient(180deg,#fafbff,#ffffff)}

/* ---------- Fields ---------- */
.ab-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.ab-label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;font-weight:600;color:#2a3558}
.ab-chip{padding:2px 9px;border-radius:999px;font-size:12px;font-weight:700;color:var(--p);background:#efecff;font-variant-numeric:tabular-nums}
.ab-hint{font-size:12.5px;line-height:1.5;color:var(--soft)}
.ab-input{width:100%;padding:11px 14px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;color:var(--ink);
  font:500 14px/1.4 inherit;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}
.ab-input::placeholder{color:#a3adc9}
.ab-input:hover{border-color:#c3ccea}
.ab-input:focus{border-color:var(--p);box-shadow:0 0 0 4px rgba(98,70,234,.14)}
.ab-textarea{resize:vertical;min-height:100px}
.ab-select{appearance:none;-webkit-appearance:none;padding-right:38px;cursor:pointer;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238793b2' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center}
.ab-grid{display:grid;gap:16px}
.ab-grid-2{grid-template-columns:1fr 1fr}
.ab-grid-3{grid-template-columns:1fr 1fr 1fr}

.ab-nested{display:flex;flex-direction:column;gap:18px;padding:4px 4px 4px 18px;margin:4px 0 0 4px;
  border-left:2px solid transparent;
  border-image:linear-gradient(180deg,var(--tone),transparent) 1}

/* ---------- Switch ---------- */
.ab-switch{position:relative;display:flex;align-items:flex-start;gap:14px;cursor:pointer;width:fit-content;max-width:100%}
.ab-switch input,.ab-tile input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.ab-track{position:relative;flex-shrink:0;width:46px;height:26px;border-radius:999px;background:#d3daee;margin-top:1px;
  transition:background .3s,box-shadow .3s}
.ab-thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;
  box-shadow:0 2px 6px rgba(20,30,80,.28);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.ab-switch:hover .ab-track{background:#c5cee8}
.ab-switch input:checked + .ab-track{background:linear-gradient(135deg,var(--p),var(--p2) 60%,var(--p3));box-shadow:0 6px 14px -6px var(--p)}
.ab-switch input:checked + .ab-track .ab-thumb{transform:translateX(20px)}
.ab-switch input:focus-visible + .ab-track,.ab-tile input:focus-visible + .ab-box{outline:3px solid rgba(98,70,234,.35);outline-offset:2px}
.ab-switch-text{display:flex;flex-direction:column;gap:3px}
.ab-switch-text strong{font-size:14px;font-weight:600;color:var(--ink)}
.ab-switch-text small{font-size:12.5px;line-height:1.5;color:var(--soft)}

/* ---------- Range ---------- */
.ab-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;margin:12px 0 6px;border-radius:999px;outline:none;cursor:pointer;
  background:linear-gradient(90deg,var(--p) 0,var(--p3) var(--fill),#dfe5f5 var(--fill))}
.ab-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--p);
  box-shadow:0 3px 8px rgba(98,70,234,.4);transition:transform .15s}
.ab-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--p);box-shadow:0 3px 8px rgba(98,70,234,.4)}
.ab-range:active::-webkit-slider-thumb{transform:scale(1.18)}
.ab-range:focus-visible{box-shadow:0 0 0 4px rgba(98,70,234,.18)}

/* ---------- Secret input (eye) + brand logos ---------- */
.ab-secret{position:relative;display:block;width:100%}
.ab-secret-input{padding-right:48px}
.ab-eye{position:absolute;top:50%;right:6px;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;
  border:0;border-radius:10px;background:transparent;color:var(--soft);cursor:pointer;transition:background .2s,color .2s}
.ab-eye:hover{background:#eef1f9;color:var(--p)}
.ab-eye:focus-visible{outline:3px solid rgba(98,70,234,.35)}
.ab-hint-warn{color:#b45309}
.ab-brand-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.ab-brand-logo{height:38px;width:auto;max-width:60%;object-fit:contain;display:block}
.ab-brand-groq{display:inline-flex;align-items:center;gap:8px;color:#f55036;font-size:26px;line-height:1}
.ab-brand-groq svg{width:30px;height:30px}
.ab-brand-groq b{font-weight:800;letter-spacing:-1px;font-size:26px}

/* ---------- Misc ---------- */
.ab-link{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;
  color:#2a3558;text-decoration:none;font-size:13px;font-weight:600;transition:border-color .2s,color .2s,transform .2s}
.ab-link:hover{border-color:var(--p);color:var(--p);transform:translateY(-1px)}
.ab-warn{padding:12px 16px;border-radius:12px;background:#fff8e6;border:1px solid #fbe3a1;color:#8a5a00;font-size:13px;line-height:1.5}
.ab-subhead{margin:4px 0 -6px;font-size:14px;font-weight:700;color:var(--ink)}
.ab-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.ab-tile{position:relative;display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;border:1px solid #dbe2f4;
  background:#fff;font-size:13px;font-weight:500;color:#3a4566;cursor:pointer;transition:border-color .2s,background .2s}
.ab-tile:hover{border-color:#b9c3e6}
.ab-tile:has(input:checked){border-color:color-mix(in srgb,var(--p) 55%,#fff);background:#f4f2ff;color:var(--ink)}
.ab-box{position:relative;width:20px;height:20px;border-radius:7px;flex-shrink:0;border:1.5px solid #c3ccea;background:#fff;transition:all .2s}
.ab-box::after{content:"";position:absolute;left:6px;top:2.5px;width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;
  transform:rotate(45deg) scale(0);transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
.ab-tile input:checked + .ab-box{background:linear-gradient(135deg,var(--p),var(--p2));border-color:transparent}
.ab-tile input:checked + .ab-box::after{transform:rotate(45deg) scale(1)}
.ab-tile-text{text-transform:capitalize}

/* ---------- Save ---------- */
.ab-savebar{position:sticky;bottom:16px;z-index:5;display:flex;justify-content:flex-end;padding:10px;margin-top:6px;border-radius:18px;
  background:rgba(255,255,255,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--line);
  box-shadow:0 14px 34px -18px rgba(40,50,120,.4)}
.ab-save{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:13px 30px;border:0;border-radius:13px;
  color:#fff;font:700 14px/1 inherit;font-family:inherit;cursor:pointer;
  background:linear-gradient(120deg,var(--p),var(--p2) 55%,var(--p3));background-size:160% 100%;background-position:0 0;
  box-shadow:0 10px 22px -10px rgba(70,60,220,.65);transition:background-position .5s,box-shadow .3s,opacity .2s}
.ab-save::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg)}
.ab-save:hover:not(:disabled){background-position:100% 0;box-shadow:0 14px 28px -10px rgba(70,60,220,.75)}
.ab-save:hover:not(:disabled)::after{animation:abShine .8s ease}
.ab-save:focus-visible{outline:3px solid rgba(98,70,234,.4);outline-offset:3px}
.ab-save:disabled{opacity:.75;cursor:progress}
.ab-spinner{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;animation:abSpin .7s linear infinite}

/* ---------- Motion ---------- */
@keyframes abSpin{to{transform:rotate(360deg)}}
@keyframes abFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-26px,18px)}}
@keyframes abPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.7}}
@keyframes abDot{0%{box-shadow:0 0 0 0 rgba(16,185,129,.55)}80%,100%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
@keyframes abShine{to{left:130%}}

/* ---------- Large desktop ---------- */
@media (min-width:1200px){
  .ab-root{padding:44px 40px}
  .ab-wrap{max-width:1040px}
  .ab-hero{padding:34px 36px}
  .ab-title{font-size:30px}
  .ab-orb-a{width:280px;height:280px;right:-60px;top:-90px}
  .ab-orb-b{width:230px;height:230px;right:200px;bottom:-110px}
}

/* ---------- Tablet ---------- */
@media (max-width:1024px){
  .ab-root{padding:24px}
  .ab-grid-3{grid-template-columns:1fr 1fr}
}

/* ---------- Mobile ---------- */
@media (max-width:768px){
  .ab-root{padding:16px;padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right));padding-bottom:max(16px,env(safe-area-inset-bottom))}
  .ab-hero{padding:20px;border-radius:18px}
  .ab-title{font-size:21px}
  .ab-card-head{padding:14px 16px;gap:12px}
  .ab-body{padding:18px 16px 22px}
  .ab-grid-2,.ab-grid-3{grid-template-columns:1fr}
  .ab-pill{display:none}
  .ab-nested{padding-left:12px}
  .ab-savebar{bottom:10px}
  .ab-save{width:100%;min-height:48px}
  .ab-input{font-size:16px;min-height:44px} /* 16px stops iOS auto-zoom on focus */
  .ab-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ab-hero-row{gap:14px}
  .ab-logo{width:52px;height:52px}
  .ab-logo-core{width:45px;height:45px}
  .ab-subtitle{font-size:13.5px}
}
@media (max-width:380px){
  .ab-tiles{grid-template-columns:1fr}
  .ab-title{font-size:19px}
}
/* Touch devices: bigger tap targets */
@media (hover:none) and (pointer:coarse){
  .ab-card-head{min-height:64px}
  .ab-tile{min-height:46px}
  .ab-range{height:8px}
  .ab-range::-webkit-slider-thumb{width:26px;height:26px}
  .ab-range::-moz-range-thumb{width:20px;height:20px}
}
/* NOTE: the old blanket "prefers-reduced-motion: reduce" rule is removed on purpose.
   Many Windows/Linux PCs report reduced-motion (animations off in OS settings, remote desktop, power saver),
   which killed the hero orbs / rotating logo ring on desktop while phones still showed them. */
`;

export default AiBotSettings;
