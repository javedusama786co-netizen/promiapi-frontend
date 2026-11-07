import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import axios from "axios";
import CustomFieldsSettings from "./CustomFieldsSettings"; // 🧩 custom field manager (same folder)

// 🌐 Dynamic Base URL Setup with Ngrok Support
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.promiapi.com"; // default fallback

// 🤖 Groq models (backend default = openai/gpt-oss-120b; old OpenAI names like gpt-4o are auto-replaced there)
const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_MODELS = [
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Recommended)" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Fast)" },
];

// 🤖 OpenAI models (backend default = gpt-4o-mini; Groq / open-source names are auto-replaced there)
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini (Recommended, fast & low cost)" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-5-mini", label: "GPT-5 mini (reasoning, slower)" },
];
const looksLikeGroqModel = (m) => /\//.test(m) || /^(llama|mixtral|gemma|deepseek|qwen|mistral|compound|whisper)/i.test(m);

// Custom Clean SVG Icons
// Official Groq "G" glyph is used below (single path). OpenAI is shown as a plain text badge (no redrawn logo).

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
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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


function AiBotSettings({ onOpenCustomFields } = {}) {
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

  // OpenAI State (backend: settings.openai -> same engine as Groq; real OpenAI keys start with "sk-")
  const [openaiEnabled, setOpenaiEnabled] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiKeyLoaded, setOpenaiKeyLoaded] = useState(false);
  const [openaiModel, setOpenaiModel] = useState(OPENAI_DEFAULT_MODEL);
  const [openaiPrompt, setOpenaiPrompt] = useState("");
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  // which provider answers first when both are ON (the other one is the automatic backup)
  const [aiProvider, setAiProvider] = useState("groq");

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

  // 🧩 Contact data & custom fields (saved through /api/custom-fields/ai-settings)
  const [contactData, setContactData] = useState({ readEnabled: true, writeEnabled: true, askForMissing: false, overwriteManual: false });
  const [contactDataLoaded, setContactDataLoaded] = useState(false);
  const [showFieldsManager, setShowFieldsManager] = useState(false);

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

          // OpenAI settings: only a real OpenAI key (sk-...) is loaded here. A Groq key (gsk_...) that was saved in
          // openai.apiKey in the old days belongs to the Groq box above.
          const rawOKey = typeof s.openai?.apiKey === "string" ? s.openai.apiKey.trim() : "";
          const oKey = /^sk-/.test(rawOKey) ? rawOKey : "";
          // old documents: openai.enabled + a non-OpenAI key (no groq block yet) really meant "Groq on"
          const legacyGroqOn = s.groq?.enabled === undefined && !oKey;
          setOpenaiEnabled(s.openai?.enabled === true && !legacyGroqOn);
          setOpenaiApiKey(oKey);
          setOpenaiKeyLoaded(Boolean(oKey));
          const oModel = s.openai?.model;
          setOpenaiModel(oModel && !looksLikeGroqModel(oModel) ? oModel : OPENAI_DEFAULT_MODEL);
          setOpenaiPrompt(s.groq?.systemPrompt !== undefined ? (s.openai?.systemPrompt || "") : "");
          setOpenaiTemperature(s.openai?.temperature ?? 0.7);
          setAiProvider((s.aiProvider || s.general?.aiProvider) === "openai" ? "openai" : "groq");

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

  // 🧩 load the contact data switches (a failure here never blocks the rest of the page)
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/custom-fields/ai-settings`, getAxiosConfig());
        if (res.data?.success && res.data.contactData) {
          setContactData((prev) => ({ ...prev, ...res.data.contactData }));
          setContactDataLoaded(true);
        }
      } catch (err) {
        console.error("Failed to fetch contact data switches:", err);
      }
    };
    fetchContactData();
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
      // OpenAI is its own provider now. Groq and OpenAI can both be ON; aiProvider is the one that answers first,
      // the other one answers if the first fails.
      openai: {
        enabled: openaiEnabled,
        apiKey: openaiApiKey,
        model: openaiModel,
        systemPrompt: openaiPrompt,
        temperature: openaiTemperature,
      },
      aiProvider,
      // FlowiseAI was removed from the system: make sure an old leftover setting can never switch on again
      flowise: { enabled: false, apiUrl: "" },
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
        // 🧩 the contact data switches have their own endpoint (the AI settings route does not know them)
        let contactNote = "";
        if (contactDataLoaded) {
          try {
            await axios.put(`${API_BASE_URL}/api/custom-fields/ai-settings`, contactData, getAxiosConfig());
          } catch (cdErr) {
            if (cdErr.response?.status !== 403) {
              contactNote = "\n(The contact data switches could not be saved: " + (cdErr.response?.data?.message || cdErr.message) + ")";
            }
          }
        }
        alert("Settings saved successfully! 🎉" + contactNote);
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

            {/* 3. OPENAI */}
            <Section id="openai" {...sp} icon={<Icons.Sparkles />} tone="#10a37f"
              title="OpenAI Integration" sub="GPT models configuration and prompt setup (works together with Groq)" status={openaiEnabled}>
              <div className="ab-brand-row">
                <span className="ab-brand-openai"><b>OpenAI</b></span>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="ab-link">
                  <span>Get OpenAI API Key</span>
                  <Icons.ExternalLink />
                </a>
              </div>
              <Switch
                checked={openaiEnabled}
                onChange={(e) => setOpenaiEnabled(e.target.checked)}
                title="Enable OpenAI Responses"
              />
              <Reveal show={openaiEnabled}>
                <Field
                  label="OpenAI API Key"
                  hint={
                    openaiKeyLoaded
                      ? "✓ Saved key loaded from server. Click the eye icon to view it."
                      : "No key saved yet. If left empty, the server's OPENAI_API_KEY environment variable is used."
                  }
                >
                  <SecretInput value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)} placeholder="sk-..." />
                  {openaiApiKey && !/^sk-/.test(openaiApiKey.trim()) && (
                    <small className="ab-hint ab-hint-warn">OpenAI keys start with "sk-". This looks like a different key (a Groq key starts with "gsk_").</small>
                  )}
                </Field>

                <div className="ab-grid ab-grid-2">
                  <Field label="AI Model">
                    <select className="ab-input ab-select" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}>
                      {OPENAI_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      {!OPENAI_MODELS.some((m) => m.value === openaiModel) && (
                        <option value={openaiModel}>{openaiModel} (custom)</option>
                      )}
                    </select>
                  </Field>

                  <Field label="Temperature" value={openaiTemperature}>
                    <input
                      type="range"
                      className="ab-range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={openaiTemperature}
                      onChange={(e) => setOpenaiTemperature(parseFloat(e.target.value))}
                      style={{ "--fill": `${openaiTemperature * 100}%` }}
                    />
                  </Field>
                </div>

                <Field label="System Instructions / Persona Context" hint="Leave empty to use the same instructions as Groq.">
                  <textarea
                    rows="4"
                    className="ab-input ab-textarea"
                    value={openaiPrompt}
                    onChange={(e) => setOpenaiPrompt(e.target.value)}
                    placeholder="Specify business details, tone of voice, guidelines, and restrictions..."
                  />
                </Field>
              </Reveal>
            </Section>

            {/* 3b. WHICH PROVIDER ANSWERS FIRST */}
            <Section id="provider" {...sp} icon={<Icons.Bot />} tone="#6246ea"
              title="Provider Priority & Backup" sub="Use Groq and OpenAI together: if one fails, the other answers" status={groqEnabled && openaiEnabled}>
              <div className="ab-pri" role="radiogroup" aria-label="Primary AI provider">
                {[["groq", "Groq answers first"], ["openai", "OpenAI answers first"]].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={aiProvider === id}
                    className={`ab-pri-btn ${aiProvider === id ? "is-on" : ""}`}
                    onClick={() => setAiProvider(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <small className="ab-hint">
                {groqEnabled && openaiEnabled
                  ? `Both providers are ON. ${aiProvider === "openai" ? "OpenAI" : "Groq"} replies first; if it fails (no credit, rate limit, outage) the other one replies automatically.`
                  : groqEnabled || openaiEnabled
                    ? `Only ${groqEnabled ? "Groq" : "OpenAI"} is ON. Turn the other one on as well to get an automatic backup.`
                    : "Turn on Groq and/or OpenAI above to let the AI reply."}
              </small>
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

            {/* 7. CONTACT DATA & CUSTOM FIELDS */}
            <Section id="contactData" {...sp} icon={<Icons.Users />} tone="#10b981"
              title="Contact Data & Custom Fields" sub="What the AI may read and save about each customer"
              status={contactData.readEnabled || contactData.writeEnabled}>
              <Switch
                checked={contactData.readEnabled}
                onChange={(e) => setContactData((p) => ({ ...p, readEnabled: e.target.checked }))}
                title="AI can read the customer's saved details"
                hint="Name, city, budget … are added to the AI's prompt, so it never asks for something you already know."
              />
              <Reveal show={contactData.readEnabled}>
                <Switch
                  checked={contactData.askForMissing}
                  onChange={(e) => setContactData((p) => ({ ...p, askForMissing: e.target.checked }))}
                  title="AI may ask for one missing detail"
                  hint="When it fits the conversation, the AI politely asks for ONE missing detail at a time (never passwords, OTPs or card numbers)."
                />
              </Reveal>
              <Switch
                checked={contactData.writeEnabled}
                onChange={(e) => setContactData((p) => ({ ...p, writeEnabled: e.target.checked }))}
                title="AI can save what the customer tells it"
                hint="When a customer says “my name is Ali, I live in Lahore”, the AI saves it on the contact (only fields that allow it)."
              />
              <Reveal show={contactData.writeEnabled}>
                <Switch
                  checked={contactData.overwriteManual}
                  onChange={(e) => setContactData((p) => ({ ...p, overwriteManual: e.target.checked }))}
                  title="Allow the AI to overwrite values your team entered"
                  hint="Off (recommended): values typed by your team, imported or coming from your store are never changed by the AI. It only fills empty fields."
                />
              </Reveal>

              <div className="ab-cf-row">
                <button
                  type="button"
                  className="ab-cf-manage"
                  onClick={() => (onOpenCustomFields ? onOpenCustomFields() : setShowFieldsManager((v) => !v))}
                >
                  {showFieldsManager && !onOpenCustomFields ? "Hide custom fields" : "Manage custom fields"}
                </button>
                <small className="ab-hint">Create fields such as City or Budget and choose which ones the AI may read or save.</small>
              </div>
              {showFieldsManager && !onOpenCustomFields && (
                <div className="ab-cf-embed">
                  <CustomFieldsSettings embedded />
                </div>
              )}
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
.ab-brand-openai{display:inline-flex;align-items:center;color:#10a37f;line-height:1}
.ab-brand-openai b{font-weight:800;letter-spacing:-1px;font-size:26px}
.ab-pri{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
.ab-pri-btn{flex:1 1 200px;padding:12px 16px;border-radius:12px;border:1px solid #d9deef;background:#fff;color:#4a5578;font:700 14px/1.2 inherit;font-family:inherit;cursor:pointer;transition:border-color .2s,background .2s,color .2s,box-shadow .2s}
.ab-pri-btn:hover{border-color:#6246ea;color:#6246ea}
.ab-pri-btn.is-on{border-color:#6246ea;background:rgba(98,70,234,.08);color:#6246ea;box-shadow:0 10px 20px -14px #6246ea}
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
/* ---------- Contact data & custom fields ---------- */
.ab-cf-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.ab-cf-manage{padding:10px 18px;border-radius:12px;border:1px solid color-mix(in srgb,#10b981 45%,#dbe2f4);background:#ecfdf5;color:#047857;
  font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;transition:.15s}
.ab-cf-manage:hover{background:#d1fae5;border-color:#10b981}
.ab-cf-manage:focus-visible{outline:3px solid rgba(16,185,129,.4);outline-offset:2px}
.ab-cf-embed{margin-top:6px;padding-top:18px;border-top:1px dashed var(--line)}
`;

export default AiBotSettings;
