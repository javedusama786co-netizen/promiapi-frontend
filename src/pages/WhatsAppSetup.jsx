import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  ExternalLink, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Settings, 
  Layers, 
  Key, 
  Globe,
  QrCode,
  ShieldAlert,
  Zap,
  RefreshCw,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

// --- REAL BRAND ICONS ---
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.84L0 24l6.337-1.488C8.017 23.42 9.957 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.808 0-3.535-.478-5.04-1.312l-.361-.2-.375.088-3.327.78.8-3.239.096-.388-.222-.361C2.637 15.82 2 13.972 2 12 2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const MessengerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 0C5.24 0 0 4.97 0 11.11c0 3.49 1.74 6.58 4.47 8.55V24l4.13-2.27c1.07.3 2.22.46 3.4.46 6.76 0 12-4.97 12-11.11S18.76 0 12 0zm1.19 14.96l-3.05-3.25-5.95 3.25 6.55-6.95 3.12 3.25 5.88-3.25-6.55 6.95z"/>
  </svg>
);

const BRAND = {
  whatsapp_official: { tone: "#1fa855", Icon: WhatsAppIcon, label: "WhatsApp Official (Cloud API)" },
  whatsapp_qr: { tone: "#10b981", Icon: QrCode, label: "WhatsApp QR Scan (Web Engine)" },
  instagram: { tone: "#e1306c", Icon: InstagramIcon, label: "Instagram" },
  messenger: { tone: "#0084ff", Icon: MessengerIcon, label: "Messenger" },
};

const ease = [0.22, 1, 0.36, 1];
const cardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease },
};

function CopyRow({ label, value, onCopy, copied, copyText, onChange, placeholder }) {
  return (
    <div className="sc-copy-group">
      <span className="sc-copy-label">{label}</span>
      <div className="sc-copybox">
        <input
          className={`sc-url${onChange ? " is-edit" : ""}`}
          type="text"
          readOnly={!onChange}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className={`sc-copy${copied ? " is-copied" : ""}`} onClick={onCopy}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "c" : "n"}
              className="sc-copy-icon"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.4} />}
            </motion.span>
          </AnimatePresence>
          <span>{copied ? "Copied!" : copyText}</span>
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="sc-field">
      <span className="sc-label">{label}</span>
      {children}
    </label>
  );
}

function SocialIntegrations() {
  const [activeTab, setActiveTab] = useState("whatsapp_official");

  // Meta Credentials
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("usama_javed_secret_token_123");

  // QR Session State
  const [qrCodeData, setQrCodeData] = useState("");
  const [qrSessionStatus, setQrSessionStatus] = useState("DISCONNECTED"); // DISCONNECTED, SCAN_REQUIRED, CONNECTED
  const [connectedNumber, setConnectedNumber] = useState("");

  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [notification, setNotification] = useState({ type: "", message: "" });
  const pollingRef = useRef(null);

  const token = localStorage.getItem("token");

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: "", message: "" }), 4000);
  };

  const BACKEND_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
    (window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://api.promiapi.com");

  const WEBHOOK_CALLBACK_URL = `${BACKEND_URL}/api/webhook`;

  const META_APP_ID =
    (typeof import.meta !== "undefined" && (import.meta.env?.VITE_META_APP_ID || import.meta.env?.VITE_FACEBOOK_APP_ID)) ||
    (typeof process !== "undefined" && (process.env?.REACT_APP_META_APP_ID || process.env?.FACEBOOK_APP_ID)) ||
    "1543305467331355";

  const resetFormState = () => {
    setAccessToken("");
    setPhoneNumberId("");
    setBusinessAccountId("");
    setPageId("");
    setInstagramAccountId("");
    setIsConfigured(false);
    setIsEditing(false);
    setShowManualForm(false);
  };

  const checkQrStatus = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/whatsapp-qr/status`, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      if (res.data) {
        setQrSessionStatus(res.data.status || "DISCONNECTED");
        if (res.data.qrCode) setQrCodeData(res.data.qrCode);
        if (res.data.phoneNumber) setConnectedNumber(res.data.phoneNumber);
        
        if (res.data.status === "CONNECTED") {
          setIsConfigured(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      }
    } catch (err) {
      console.error("Error polling QR status:", err);
    }
  };

  useEffect(() => {
    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;
      js.defer = true;
      js.crossOrigin = "anonymous";
      document.body.appendChild(js);
    }

    const checkSdkInterval = setInterval(() => {
      if (window.FB) {
        if (!window.FB._initialized) {
          try {
            window.FB.init({
              appId: META_APP_ID,
              cookie: true,
              xfbml: true,
              version: "v20.0"
            });
            window.FB._initialized = true;
          } catch (e) {
            console.log("SDK Init Warning:", e);
          }
        }
        setIsSdkReady(true);
        clearInterval(checkSdkInterval);
      }
    }, 300);

    const fetchConfig = async () => {
      setFetching(true);
      resetFormState();
      if (pollingRef.current) clearInterval(pollingRef.current);

      try {
        if (activeTab === "whatsapp_qr") {
          await checkQrStatus();
        } else {
          const apiEndpoint = activeTab === "whatsapp_official" ? "whatsapp" : activeTab;
          const res = await axios.get(`${BACKEND_URL}/api/${apiEndpoint}/config`, {
            headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
          });

          if (res.data && res.data.config) {
            const cfg = res.data.config;
            setAccessToken(cfg.accessToken || "");
            if (cfg.webhookVerifyToken) setWebhookVerifyToken(cfg.webhookVerifyToken);
            
            if (activeTab === "whatsapp_official") {
              setPhoneNumberId(cfg.phoneNumberId || "");
              setBusinessAccountId(cfg.businessAccountId || "");
            } else if (activeTab === "instagram") {
              setInstagramAccountId(cfg.instagramAccountId || "");
            } else if (activeTab === "messenger") {
              setPageId(cfg.pageId || "");
            }
            setIsConfigured(true);
          }
        }
      } catch (err) {
        console.error(`Error loading ${activeTab} config:`, err);
      } finally {
        setFetching(false);
      }
    };

    if (token) fetchConfig();
    else setFetching(false);

    return () => {
      clearInterval(checkSdkInterval);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token, activeTab]);

  // Auto Polling for QR Scanning Completion
  useEffect(() => {
    if (activeTab === "whatsapp_qr" && qrSessionStatus === "SCAN_REQUIRED") {
      pollingRef.current = setInterval(checkQrStatus, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeTab, qrSessionStatus]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // QR Session Actions
  const handleStartQrSession = async () => {
    setLoading(true);
    setQrCodeData("");
    try {
      const res = await axios.post(`${BACKEND_URL}/api/whatsapp-qr/start`, {}, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      if (res.data) {
        setQrSessionStatus("SCAN_REQUIRED");
        if (res.data.qrCode) setQrCodeData(res.data.qrCode);
        showNotification("success", "Real WhatsApp QR Code session initialized! Scan it via mobile.");
      }
    } catch (err) {
      showNotification("error", "Failed to start Baileys QR session.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectQr = async () => {
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/whatsapp-qr/disconnect`, {}, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      setQrSessionStatus("DISCONNECTED");
      setIsConfigured(false);
      setQrCodeData("");
      setConnectedNumber("");
      showNotification("success", "WhatsApp QR Session disconnected.");
    } catch (err) {
      showNotification("error", "Failed to disconnect QR session.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaAutoConnect = () => {
    if (!window.FB) {
      showNotification("error", "Meta SDK load ho raha hai, wait karein...");
      return;
    }

    let scope = "";
    const targetTab = activeTab === "whatsapp_official" ? "whatsapp" : activeTab;
    if (targetTab === "whatsapp") {
      scope = "whatsapp_business_management,whatsapp_business_messaging,business_management";
    } else if (targetTab === "instagram") {
      scope = "instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement";
    } else if (targetTab === "messenger") {
      scope = "pages_show_list,pages_messaging,pages_read_engagement";
    }

    setLoading(true);

    window.FB.login((response) => {
      if (response.authResponse && response.authResponse.accessToken) {
        const userAccessToken = response.authResponse.accessToken;

        axios.post(`${BACKEND_URL}/api/${targetTab}/oauth-connect`,
          { accessToken: userAccessToken, webhookVerifyToken },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true"
            }
          }
        )
        .then((res) => {
          if (res.data.success && res.data.config) {
            const cfg = res.data.config;
            setAccessToken(cfg.accessToken || userAccessToken);
            if (cfg.webhookVerifyToken) setWebhookVerifyToken(cfg.webhookVerifyToken);
            
            if (targetTab === "whatsapp") {
              setPhoneNumberId(cfg.phoneNumberId);
              setBusinessAccountId(cfg.businessAccountId);
            } else if (targetTab === "instagram") {
              setInstagramAccountId(cfg.instagramAccountId);
            } else if (targetTab === "messenger") {
              setPageId(cfg.pageId);
            }
            setIsConfigured(true);
            setIsEditing(false);
            showNotification("success", `🎉 Successfully connected to ${targetTab.toUpperCase()}!`);
          } else {
            showNotification("error", res.data.message || "Auto-connection failed.");
          }
        })
        .catch((err) => {
          console.error("OAuth Error:", err);
          showNotification("error", err.response?.data?.message || "Failed to auto-connect Meta account.");
        })
        .finally(() => setLoading(false));
      } else {
        setLoading(false);
        showNotification("error", "Authentication cancelled or failed.");
      }
    }, { scope });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (accessToken.includes("••••")) {
      showNotification("error", "Valid Access Token enter karein.");
      return;
    }

    setLoading(true);
    const targetTab = activeTab === "whatsapp_official" ? "whatsapp" : activeTab;

    try {
      const payload = { accessToken, webhookVerifyToken };
      if (targetTab === "whatsapp") {
        payload.phoneNumberId = phoneNumberId;
        payload.businessAccountId = businessAccountId;
      } else if (targetTab === "instagram") {
        payload.instagramAccountId = instagramAccountId;
      } else if (targetTab === "messenger") {
        payload.pageId = pageId;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/${targetTab}/config`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true"
          }
        }
      );

      if (response.data.success) {
        setIsConfigured(true);
        setIsEditing(false);
        showNotification("success", "🎉 Configuration saved successfully with Master Token.");
      }
    } catch (err) {
      console.error("Manual Submit Error:", err);
      showNotification("error", err.response?.data?.message || "Error saving configuration.");
    } finally {
      setLoading(false);
    }
  };

  const brand = BRAND[activeTab];
  const BrandIcon = brand.Icon;
  const details =
    activeTab === "whatsapp_official"
      ? [["Phone Number ID", phoneNumberId], ["Business Account ID", businessAccountId]]
      : activeTab === "instagram"
      ? [["Instagram Account ID", instagramAccountId]]
      : [["Facebook Page ID", pageId]];

  const sdkBusy = loading || !isSdkReady;

  return (
    <MotionConfig reducedMotion="user">
      <div className="sc-root">
        <style>{css}</style>
        <div className="sc-wrap">
          {/* HEADER */}
          <motion.header
            className="sc-hero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="sc-orb sc-orb-a" />
            <span className="sc-orb sc-orb-b" />
            <div className="sc-hero-row">
              <div className="sc-logo">
                <span className="sc-logo-ring" />
                <span className="sc-logo-core"><Layers size={26} /></span>
              </div>
              <div>
                <h2 className="sc-title">Promy API Messaging Engine</h2>
                <p className="sc-subtitle">Choose between Meta Official Cloud API or Quick QR Scan Web Engine.</p>
              </div>
            </div>
          </motion.header>

          {/* TABS */}
          <div className="sc-tabs" role="tablist">
            {Object.entries(BRAND).map(([id, b]) => (
              <button
                type="button"
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`sc-tab${activeTab === id ? " is-active" : ""}`}
                style={{ "--tone": b.tone }}
              >
                {activeTab === id && (
                  <motion.span layoutId="sc-tab-pill" className="sc-tab-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className="sc-tab-inner">
                  <span className="sc-tab-icon"><b.Icon /></span>
                  <span>{b.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* NOTIFICATION */}
          <AnimatePresence>
            {notification.message && (
              <motion.div
                key="note"
                role={notification.type === "success" ? "status" : "alert"}
                className={`sc-note ${notification.type === "success" ? "is-success" : "is-error"}`}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3, ease }}
              >
                <div className="sc-note-inner">
                  <span className="sc-note-icon">
                    {notification.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  </span>
                  <span className="sc-note-text">{notification.message}</span>
                  <button type="button" aria-label="Dismiss" className="sc-note-close" onClick={() => setNotification({ type: "", message: "" })}>×</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN CARD */}
          <AnimatePresence mode="wait" initial={false}>
            {fetching ? (
              <motion.div key="loading" className="sc-loading" {...cardMotion}>
                <span className="sc-ring" />
              </motion.div>
            ) : activeTab === "whatsapp_qr" ? (
              /* QR SCAN ENGINE TAB */
              <motion.section key="qr-tab" className="sc-card" style={{ "--tone": brand.tone }} {...cardMotion}>
                <div className="sc-risk-box">
                  <div className="sc-risk-head">
                    <ShieldAlert size={20} className="sc-risk-icon" />
                    <h4>WhatsApp Account Risk & Safety Notice</h4>
                  </div>
                  <p>
                    <strong>Web Engine Policy:</strong> QR Scan mode utilizes automated web sessions. High-frequency unsolicited bulk messages may result in temporary or permanent phone number suspension by WhatsApp's spam algorithms.
                  </p>
                  <ul className="sc-risk-list">
                    <li>⚠️ Add <strong>10–30 seconds random delay</strong> between bulk campaign messages.</li>
                    <li>⚠️ Avoid sending thousands of messages from newly registered numbers (Warmup required).</li>
                    <li>✅ For 100% Guaranteed Zero-Ban Risk & Verified Badge, use <strong>WhatsApp Official (Cloud API)</strong> tab.</li>
                  </ul>
                </div>

                {qrSessionStatus === "CONNECTED" ? (
                  <div className="sc-connected">
                    <div className="sc-badge-lg"><QrCode size={28} /></div>
                    <span className="sc-pill"><i />Active QR Web Session</span>
                    <h3 className="sc-card-title">Connected via WhatsApp Web</h3>
                    <p className="sc-card-desc">Your number ({connectedNumber || "Linked Device"}) is live. Visual Flow Builder & AI replies are active.</p>
                    <button type="button" className="sc-ghost" onClick={handleDisconnectQr} disabled={loading}>
                      {loading ? "Disconnecting..." : "Disconnect QR Session"}
                    </button>
                  </div>
                ) : (
                  <div className="sc-auto">
                    <div className="sc-badge-lg"><Smartphone size={28} /></div>
                    <h3 className="sc-card-title">Pair Device via QR Code</h3>
                    <p className="sc-card-desc">Scan the QR code below using WhatsApp Link Device option to start instant messaging without Meta verification.</p>

                    {qrSessionStatus === "SCAN_REQUIRED" ? (
                      <div className="sc-qr-container">
                        {qrCodeData ? (
                          <img src={qrCodeData} alt="WhatsApp QR Code" className="sc-qr-img" />
                        ) : (
                          <div className="sc-qr-loader">
                            <span className="sc-spinner" />
                            <p style={{ margin: "10px 0 0", fontSize: "13px" }}>Generating live Baileys QR...</p>
                          </div>
                        )}
                        <p className="sc-qr-hint">Open WhatsApp on Phone → Settings → Linked Devices → Link a Device</p>
                        <button type="button" className="sc-ghost" onClick={handleStartQrSession} disabled={loading}>
                          <RefreshCw size={14} /> Refresh QR Code
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="sc-save" onClick={handleStartQrSession} disabled={loading}>
                        {loading ? <span className="sc-spinner" /> : <Zap size={16} />}
                        <span>{loading ? "Generating Code..." : "Generate Session QR Code"}</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.section>
            ) : isConfigured && !isEditing ? (
              /* CONFIGURED STATE FOR META CHANNELS */
              <motion.section key={`cfg-${activeTab}`} className="sc-card" style={{ "--tone": brand.tone }} {...cardMotion}>
                <div className="sc-connected">
                  <div className="sc-badge-lg"><BrandIcon /></div>
                  <span className="sc-pill"><i />Connected</span>
                  <h3 className="sc-card-title">Connected to {activeTab.replace("_official", "").toUpperCase()}</h3>
                  <p className="sc-card-desc">Your automated responses are active with the Master Token setup.</p>
                </div>

                <dl className="sc-details">
                  {details.map(([k, v]) => (
                    <div className="sc-detail" key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="sc-webhook">
                  <h4 className="sc-webhook-title"><Layers size={17} /> Master Meta Webhook Configuration</h4>
                  <p className="sc-webhook-desc">
                    Use this exact <strong>Master URL</strong> and <strong>Master Verify Token</strong> across all Meta Apps/Products.
                  </p>
                  <CopyRow label="Master Callback URL" value={WEBHOOK_CALLBACK_URL} copied={copiedUrl} copyText="Copy URL" onCopy={() => copyToClipboard(WEBHOOK_CALLBACK_URL, "url")} />
                  <CopyRow label="Master Verify Token (Universal)" value={webhookVerifyToken} copied={copiedToken} copyText="Copy Token" onCopy={() => copyToClipboard(webhookVerifyToken, "token")} />
                </div>

                <div className="sc-center">
                  <button type="button" className="sc-ghost" onClick={() => { setIsEditing(true); setShowManualForm(true); }}>
                    <Settings size={15} /> Reconfigure Integration
                  </button>
                </div>
              </motion.section>
            ) : (
              /* UNCONFIGURED / EDIT STATE FOR META CHANNELS */
              <motion.section key={`setup-${activeTab}`} className="sc-card" style={{ "--tone": brand.tone }} {...cardMotion}>
                <AnimatePresence mode="wait" initial={false}>
                  {!showManualForm ? (
                    <motion.div key="auto" className="sc-auto" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22, ease }}>
                      <div className="sc-badge-lg"><BrandIcon /></div>
                      <span className="sc-rec">Recommended</span>
                      <h3 className="sc-card-title">One-Click {activeTab.replace("_official", "").toUpperCase()} Connect</h3>
                      <p className="sc-card-desc">
                        Log in via Meta to auto-detect tokens and assign the Master Verify Token automatically.
                      </p>

                      <button type="button" className="sc-meta" onClick={handleMetaAutoConnect} disabled={sdkBusy}>
                        {sdkBusy && <span className="sc-spinner" />}
                        <span>{loading ? "Connecting..." : !isSdkReady ? "Loading SDK..." : `Connect ${activeTab.replace("_official", "").toUpperCase()}`}</span>
                      </button>

                      <div className="sc-or"><span>OR</span></div>

                      <button type="button" className="sc-link" onClick={() => setShowManualForm(true)}>
                        Advanced: Manual Configuration
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="manual" onSubmit={handleManualSubmit} className="sc-form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22, ease }}>
                      <div className="sc-form-head">
                        <h4 className="sc-form-title"><span className="sc-form-icon"><Key size={17} /></span> Manual Setup ({activeTab.replace("_official", "").toUpperCase()})</h4>
                        <button type="button" className="sc-link" onClick={() => setShowManualForm(false)}>← Auto-Connect</button>
                      </div>

                      <div className="sc-webhook">
                        <h4 className="sc-webhook-title"><Layers size={17} /> Universal Master Webhook Credentials</h4>
                        <CopyRow label="Master Callback URL" value={WEBHOOK_CALLBACK_URL} copied={copiedUrl} copyText="Copy" onCopy={() => copyToClipboard(WEBHOOK_CALLBACK_URL, "url")} />
                        <CopyRow
                          label="Master Verify Token (Shared across all channels)"
                          value={webhookVerifyToken}
                          onChange={(e) => setWebhookVerifyToken(e.target.value)}
                          placeholder="usama_javed_secret_token_123"
                          copied={copiedToken}
                          copyText="Copy"
                          onCopy={() => copyToClipboard(webhookVerifyToken, "token")}
                        />
                      </div>

                      <Field label="Access Token">
                        <input type="text" className="sc-input" placeholder="EAAG...." value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required />
                      </Field>

                      {activeTab === "whatsapp_official" && (
                        <>
                          <Field label="Phone Number ID">
                            <input type="text" className="sc-input" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} required />
                          </Field>
                          <Field label="Business Account ID">
                            <input type="text" className="sc-input" value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} required />
                          </Field>
                        </>
                      )}

                      {activeTab === "instagram" && (
                        <Field label="Instagram Business Account ID">
                          <input type="text" className="sc-input" value={instagramAccountId} onChange={(e) => setInstagramAccountId(e.target.value)} required />
                        </Field>
                      )}

                      {activeTab === "messenger" && (
                        <Field label="Facebook Page ID">
                          <input type="text" className="sc-input" value={pageId} onChange={(e) => setPageId(e.target.value)} required />
                        </Field>
                      )}

                      <div className="sc-actions">
                        {isEditing && <button type="button" className="sc-cancel" onClick={() => setIsEditing(false)}>Cancel</button>}
                        <button type="submit" className="sc-save" disabled={loading}>
                          {loading && <span className="sc-spinner" />}
                          <span>{loading ? "Saving..." : "Save Master Credentials"}</span>
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>

          {/* META DEVELOPER SETUP GUIDE */}
          {activeTab !== "whatsapp_qr" && (
            <motion.section className="sc-guide" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15, ease }}>
              <div className="sc-guide-head">
                <h3 className="sc-guide-title"><span className="sc-guide-icon"><Globe size={18} /></span> How to Configure Master Webhook on Meta</h3>
                <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="sc-portal">
                  Open Meta Portal <ExternalLink size={14} />
                </a>
              </div>
              <p className="sc-guide-desc">
                By utilizing a Master Verify Token, you can plug in the exact same URL and Token into your WhatsApp, Instagram, and Messenger app settings inside Meta Dashboard.
              </p>
              <ol className="sc-steps">
                <li><div><strong>Go to App Dashboard:</strong> Open your Meta App at <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="sc-inline">developers.facebook.com</a>.</div></li>
                <li><div><strong>Navigate to Webhooks:</strong> Select each product (WhatsApp / Messenger / Instagram) and go to Configuration / Webhooks.</div></li>
                <li><div><strong>Paste Master Credentials:</strong> Paste the <em>Master Callback URL</em> and the unified <em>Master Verify Token</em> shown above for verification.</div></li>
              </ol>
            </motion.section>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.sc-root{
  --ink:#0e1530; --muted:#5b6785; --soft:#8793b2; --line:#e3e8f6; --surface:#fff;
  --p:#6246ea; --p2:#2f7cf6; --p3:#14b8e6;
  width:100%; min-height:100vh; padding:32px; color:var(--ink); box-sizing:border-box;
  font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,sans-serif;
  background:
    radial-gradient(900px 480px at 8% -8%, #e6e0ff 0%, transparent 60%),
    radial-gradient(800px 460px at 100% 0%, #d8f3ff 0%, transparent 55%),
    #f5f7ff;
}
.sc-root *{box-sizing:border-box}
.sc-wrap{max-width:860px;margin:0 auto}

/* Hero */
.sc-hero{position:relative;overflow:hidden;border-radius:22px;padding:28px;margin-bottom:20px;
  background:linear-gradient(135deg,#fff 0%,#f0f2ff 55%,#e8f7ff 100%);border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 18px 40px -22px rgba(70,60,200,.35)}
.sc-orb{position:absolute;border-radius:50%;filter:blur(46px);opacity:.55;pointer-events:none}
.sc-orb-a{width:220px;height:220px;right:-50px;top:-70px;background:#a99bff;animation:scFloat 9s ease-in-out infinite}
.sc-orb-b{width:180px;height:180px;right:140px;bottom:-90px;background:#7fdcff;animation:scFloat 11s ease-in-out infinite reverse}
.sc-hero-row{position:relative;display:flex;align-items:center;gap:18px}
.sc-logo{position:relative;width:60px;height:60px;flex-shrink:0;display:grid;place-items:center}
.sc-logo-ring{position:absolute;inset:0;border-radius:18px;background:conic-gradient(from 0deg,var(--p),var(--p3),#b832d6,var(--p));animation:scSpin 6s linear infinite}
.sc-logo-core{position:relative;width:52px;height:52px;border-radius:15px;background:#fff;display:grid;place-items:center;color:var(--p)}
.sc-title{margin:0;font-size:clamp(20px,3.4vw,26px);font-weight:800;letter-spacing:-.6px;line-height:1.2}
.sc-subtitle{margin:6px 0 0;font-size:14.5px;line-height:1.55;color:var(--muted)}

/* Tabs */
.sc-tabs{display:flex;gap:4px;padding:5px;margin-bottom:18px;border-radius:16px;background:rgba(255,255,255,.8);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--line)}
.sc-tab{all:unset;box-sizing:border-box;position:relative;flex:1;padding:11px 12px;border-radius:12px;cursor:pointer;text-align:center;
  font-size:13px;font-weight:600;color:var(--muted);transition:color .2s}
.sc-tab:hover{color:var(--ink)}
.sc-tab.is-active{color:var(--ink)}
.sc-tab:focus-visible{outline:3px solid color-mix(in srgb,var(--tone) 40%,transparent);outline-offset:1px}
.sc-tab-pill{position:absolute;inset:0;border-radius:12px;background:#fff;border:1px solid color-mix(in srgb,var(--tone) 40%,var(--line));
  box-shadow:0 8px 18px -10px color-mix(in srgb,var(--tone) 65%,transparent)}
.sc-tab-inner{position:relative;display:flex;align-items:center;justify-content:center;gap:7px}
.sc-tab-icon{display:grid;color:var(--tone)}
.sc-tab-icon svg{width:17px;height:17px}

/* Notification */
.sc-note{overflow:hidden}
.sc-note-inner{display:flex;align-items:center;gap:12px;padding:13px 16px;margin-bottom:18px;border-radius:14px;border:1px solid;font-size:14px;font-weight:500;line-height:1.45}
.sc-note.is-success .sc-note-inner{background:#e9f8f1;border-color:#bdeed8;color:#0b6b4c}
.sc-note.is-error .sc-note-inner{background:#fff1f2;border-color:#fecdd3;color:#9f1239}
.sc-note-icon{display:grid;flex-shrink:0}
.sc-note-text{flex:1;word-break:break-word}
.sc-note-close{all:unset;cursor:pointer;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:18px;opacity:.65;transition:opacity .2s,background .2s}
.sc-note-close:hover{opacity:1;background:rgba(0,0,0,.06)}
.sc-note-close:focus-visible{outline:2px solid currentColor}

/* Card */
.sc-card{--tone:#1fa855;background:var(--surface);border:1px solid color-mix(in srgb,var(--tone) 22%,var(--line));border-radius:20px;
  padding:clamp(20px,3.4vw,32px);margin-bottom:20px;
  box-shadow:0 1px 2px rgba(20,30,80,.04),0 18px 36px -22px color-mix(in srgb,var(--tone) 55%,transparent)}
.sc-connected,.sc-auto{display:flex;flex-direction:column;align-items:center;text-align:center}
.sc-badge-lg{width:60px;height:60px;border-radius:18px;display:grid;place-items:center;color:var(--tone);margin-bottom:14px;
  background:color-mix(in srgb,var(--tone) 12%,#fff);border:1px solid color-mix(in srgb,var(--tone) 24%,#fff)}
.sc-badge-lg svg{width:28px;height:28px}
.sc-card-title{margin:0 0 6px;font-size:clamp(18px,3vw,21px);font-weight:800;letter-spacing:-.4px}
.sc-card-desc{margin:0 0 22px;max-width:52ch;font-size:14px;line-height:1.6;color:var(--muted)}
.sc-pill{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;margin-bottom:12px;border-radius:999px;font-size:12px;font-weight:700;background:#e6f8f1;color:#0b8a63}
.sc-pill i{width:7px;height:7px;border-radius:50%;background:#10b981;animation:scDot 1.8s ease-out infinite}
.sc-rec{padding:4px 12px;margin-bottom:12px;border-radius:999px;font-size:12px;font-weight:700;color:var(--p);background:#efecff;border:1px solid rgba(98,70,234,.18)}
.sc-center{display:flex;justify-content:center;margin-top:20px}

/* QR Risk Box */
.sc-risk-box{background:#fffbeb;border:1px solid #fef3c7;border-radius:16px;padding:18px;margin-bottom:24px;text-align:left}
.sc-risk-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;color:#b45309}
.sc-risk-head h4{margin:0;font-size:15px;font-weight:700}
.sc-risk-icon{color:#d97706}
.sc-risk-box p{margin:0 0 10px;font-size:13px;line-height:1.55;color:#92400e}
.sc-risk-list{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:#78350f}

/* QR Display */
.sc-qr-container{display:flex;flex-direction:column;align-items:center;gap:14px;padding:20px;border-radius:16px;background:#f8fafc;border:1px dashed #cbd5e1}
.sc-qr-img{width:220px;height:220px;border-radius:12px;border:4px solid #fff;box-shadow:0 10px 25px -5px rgba(0,0,0,.1)}
.sc-qr-loader{width:220px;height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;border-radius:12px;border:1px solid #e2e8f0;color:var(--muted)}
.sc-qr-hint{margin:0;font-size:13px;color:var(--muted);font-weight:600}

/* Details */
.sc-details{margin:0 0 18px;padding:6px 18px;border-radius:14px;background:#fafbff;border:1px solid var(--line)}
.sc-detail{display:flex;justify-content:space-between;gap:16px;padding:12px 0;font-size:13.5px}
.sc-detail + .sc-detail{border-top:1px dashed var(--line)}
.sc-detail dt{color:var(--soft);font-weight:500}
.sc-detail dd{margin:0;color:var(--ink);font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;word-break:break-all;text-align:right}

/* Webhook box */
.sc-webhook{padding:clamp(14px,2.4vw,20px);margin-bottom:6px;border-radius:16px;background:linear-gradient(180deg,#f3f1ff,#f7f9ff);border:1px solid rgba(98,70,234,.16);text-align:left}
.sc-webhook-title{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:15px;font-weight:700;color:#3b2fb0}
.sc-webhook-desc{margin:0 0 16px;font-size:12.5px;line-height:1.55;color:#5b5aa6}
.sc-webhook-title + .sc-copy-group{margin-top:12px}
.sc-copy-group + .sc-copy-group{margin-top:14px}
.sc-copy-label{display:block;margin-bottom:7px;font-size:12.5px;font-weight:600;color:#3b2fb0}
.sc-copybox{display:flex;gap:10px}
.sc-url{flex:1;min-width:0;padding:11px 14px;border-radius:12px;border:1px solid #d6d3f5;background:#fff;color:#2a3a78;
  font:500 13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;outline:none;transition:border-color .2s,box-shadow .2s}
.sc-url:hover{border-color:#b9b4ee}
.sc-url:focus{border-color:var(--p);box-shadow:0 0 0 4px rgba(98,70,234,.14)}
.sc-url.is-edit{color:var(--ink);font-weight:700}
.sc-copy{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:112px;padding:11px 16px;border:0;border-radius:12px;color:#fff;
  font:700 12.5px/1 inherit;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0;
  background:linear-gradient(135deg,var(--p),var(--p2));box-shadow:0 10px 18px -10px rgba(70,60,220,.7);transition:transform .2s,box-shadow .3s,background .3s}
.sc-copy:hover{transform:translateY(-1px);box-shadow:0 14px 22px -10px rgba(70,60,220,.8)}
.sc-copy:active{transform:scale(.97)}
.sc-copy.is-copied{background:linear-gradient(135deg,#059669,#10b981)}
.sc-copy-icon{display:grid}

/* Buttons */
.sc-ghost{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;color:#2a3558;
  font:700 13px/1 inherit;font-family:inherit;cursor:pointer;transition:all .2s}
.sc-ghost:hover{border-color:var(--p);color:var(--p);transform:translateY(-1px)}
.sc-meta{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:360px;padding:15px 28px;border:0;border-radius:14px;
  color:#fff;font:700 15px/1 inherit;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,#1877f2,#0b5fd6 60%,#14a0e6);
  box-shadow:0 14px 26px -12px rgba(24,119,242,.8);transition:transform .2s,box-shadow .3s,opacity .2s}
.sc-meta::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg)}
.sc-meta:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 18px 30px -12px rgba(24,119,242,.9)}
.sc-meta:hover:not(:disabled)::after{animation:scShine .8s ease}
.sc-meta:disabled{opacity:.75;cursor:progress}
.sc-or{display:flex;align-items:center;gap:14px;width:100%;max-width:360px;margin:22px 0;color:var(--soft);font-size:12px;font-weight:700}
.sc-or::before,.sc-or::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--line))}
.sc-or::after{background:linear-gradient(270deg,transparent,var(--line))}
.sc-link{all:unset;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--p);border-radius:6px;transition:color .2s}
.sc-link:hover{color:var(--p2);text-decoration:underline;text-underline-offset:3px}
.sc-meta:focus-visible,.sc-ghost:focus-visible,.sc-save:focus-visible,.sc-cancel:focus-visible,.sc-link:focus-visible,.sc-copy:focus-visible,.sc-portal:focus-visible{outline:3px solid rgba(98,70,234,.4);outline-offset:3px}

/* Form */
.sc-form{display:flex;flex-direction:column;gap:18px}
.sc-form-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.sc-form-title{display:flex;align-items:center;gap:10px;margin:0;font-size:15.5px;font-weight:700}
.sc-form-icon{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,#fff)}
.sc-field{display:flex;flex-direction:column;gap:7px}
.sc-label{font-size:13px;font-weight:600;color:#2a3558}
.sc-input{width:100%;padding:11px 14px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;color:var(--ink);font:500 14px/1.4 inherit;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
.sc-input::placeholder{color:#a3adc9}
.sc-input:hover{border-color:#c3ccea}
.sc-input:focus{border-color:var(--p);box-shadow:0 0 0 4px rgba(98,70,234,.14)}
.sc-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:6px}
.sc-cancel{padding:12px 24px;border:0;border-radius:12px;background:#eef1f9;color:#475569;font:700 14px/1 inherit;font-family:inherit;cursor:pointer;transition:background .2s}
.sc-cancel:hover{background:#e2e7f4}
.sc-save{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:13px 28px;border:0;border-radius:13px;color:#fff;
  font:700 14px/1 inherit;font-family:inherit;cursor:pointer;background:linear-gradient(120deg,var(--p),var(--p2) 55%,var(--p3));
  box-shadow:0 10px 22px -10px rgba(70,60,220,.65);transition:transform .2s,box-shadow .3s,opacity .2s}
.sc-save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 28px -10px rgba(70,60,220,.75)}
.sc-save:disabled{opacity:.75;cursor:progress}
.sc-spinner{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.4);border-top-color:var(--p);animation:scSpin .7s linear infinite}

/* Loader */
.sc-loading{display:grid;place-items:center;height:240px}
.sc-ring{width:44px;height:44px;border-radius:50%;background:conic-gradient(from 0deg,var(--p),var(--p3),transparent 70%);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
  animation:scSpin 1.1s linear infinite}

/* Guide */
.sc-guide{padding:clamp(18px,3vw,26px);border-radius:20px;background:var(--surface);border:1px solid var(--line);box-shadow:0 1px 2px rgba(20,30,80,.04),0 10px 26px -18px rgba(40,50,120,.25)}
.sc-guide-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:10px}
.sc-guide-title{display:flex;align-items:center;gap:10px;margin:0;font-size:15.5px;font-weight:700}
.sc-guide-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#1877f2;background:#e8f1ff}
.sc-portal{display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:11px;background:#1877f2;color:#fff;text-decoration:none;font-size:12.5px;font-weight:700;
  box-shadow:0 10px 18px -10px rgba(24,119,242,.8);transition:transform .2s,box-shadow .3s}
.sc-portal:hover{transform:translateY(-1px);box-shadow:0 14px 22px -10px rgba(24,119,242,.9)}
.sc-guide-desc{margin:0 0 18px;font-size:13.5px;line-height:1.6;color:var(--muted)}
.sc-steps{list-style:none;counter-reset:s;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.sc-steps li{counter-increment:s;position:relative;padding-left:40px;min-height:28px;display:flex;align-items:center;font-size:13.5px;line-height:1.6;color:var(--muted)}
.sc-steps li::before{content:counter(s);position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12.5px;font-weight:700;color:var(--p);
  background:#efecff;border:1px solid rgba(98,70,234,.2)}
.sc-steps strong{color:var(--ink);font-weight:600}
.sc-inline{color:var(--p);font-weight:600;text-decoration:underline;text-underline-offset:3px}

@keyframes scSpin{to{transform:rotate(360deg)}}
@keyframes scFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,14px)}}
@keyframes scDot{0%{box-shadow:0 0 0 0 rgba(16,185,129,.55)}80%,100%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
@keyframes scShine{to{left:130%}}

@media (max-width:640px){
  .sc-root{padding:14px}
  .sc-hero{padding:20px;border-radius:18px}
  .sc-hero-row{align-items:flex-start}
  .sc-tabs{flex-wrap:wrap}
  .sc-tab{padding:10px 6px;font-size:12px;flex:1 0 45%}
  .sc-tab-inner{gap:6px}
  .sc-tab-icon svg{width:16px;height:16px}
  .sc-copybox{flex-direction:column}
  .sc-copy{width:100%}
  .sc-detail{flex-direction:column;gap:4px}
  .sc-detail dd{text-align:left}
  .sc-actions{flex-direction:column-reverse}
  .sc-actions button{width:100%}
}
@media (prefers-reduced-motion:reduce){
  .sc-root *,.sc-root *::after{animation:none !important;transition:none !important}
}
`;

export default SocialIntegrations;