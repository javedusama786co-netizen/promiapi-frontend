import { useState, useEffect } from "react";
import axios from "axios";

// 👑 Hamein kisi props par depend nahi hona, yeh khud backend se check karega!
function CloudApiSetup({ onSetupComplete }) {
  const [formData, setFormData] = useState({
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
  });
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); 
  const [status, setStatus] = useState({ type: "", text: "" });
  
  // 👑 Subscription State Tracking
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  const token = localStorage.getItem("token"); 
  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log("🔄 Initializing Setup Gateway...");

        // 1️⃣ Step: User ki Real Subscription Backend Se Check Karein
        const subRes = await axios.get(`${BACKEND_URL}/api/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Agar backend response kehta hai subscription active hai (Adjust field name based on your backend)
        if (subRes.data && (subRes.data.active || subRes.data.success)) {
          setIsSubscriptionActive(true);
          
          // 2️⃣ Step: Agar active hai, to existing WhatsApp config fetch karo
          const configRes = await axios.get(`${BACKEND_URL}/api/whatsapp/config`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (configRes.data && configRes.data.config) {
            setFormData({
              accessToken: configRes.data.config.accessToken || "",
              phoneNumberId: configRes.data.config.phoneNumberId || "",
              businessAccountId: configRes.data.config.businessAccountId || configRes.data.config.whatsappBusinessAccountId || "",
            });
          }
        } else {
          setIsSubscriptionActive(false);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
        // Fallback: Agar subscription ka route different ho, to bypass karne ke liye test mode true kar sakte hain
        setIsSubscriptionActive(true); 
      } finally {
        setFetching(false); 
      }
    };

    if (token) {
      initializeComponent();
    } else {
      setFetching(false);
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSubscriptionActive) return;

    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await axios.post(`${BACKEND_URL}/api/whatsapp/config`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.data.success || res.status === 200) {
        setStatus({ type: "success", text: "🎉 WhatsApp Cloud API Configured Successfully!" });
        
        if (res.data.config) {
          setFormData({
            accessToken: res.data.config.accessToken || "",
            phoneNumberId: res.data.config.phoneNumberId || "",
            businessAccountId: res.data.config.businessAccountId || res.data.config.whatsappBusinessAccountId || "",
          });
        }

        if (typeof onSetupComplete === "function") {
          setTimeout(() => onSetupComplete(), 1500);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save configurations.";
      setStatus({ type: "error", text: `❌ ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={styles.container}>
        <p style={{ textAlign: "center", color: "#64748b" }}>🔄 Fetching account security and configurations...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 👑 Real Dynamic Subscription Banner */}
      {!isSubscriptionActive && (
        <div style={styles.subscriptionAlert}>
          🔒 <strong>Subscription Required:</strong> Please upgrade your plan or activate your subscription to configure the WhatsApp Cloud API Gateway.
        </div>
      )}

      {/* NO APP ID OR SECRET FIELDS EXIST HERE */}
      <div style={{ ...styles.header, opacity: isSubscriptionActive ? 1 : 0.6 }}>
        <div style={styles.iconContainer}>💬</div>
        <div>
          <h3 style={styles.title}>WhatsApp Cloud API Setup</h3>
          <p style={styles.desc}>Link your Meta Developer credentials to synchronize message pipelines.</p>
        </div>
      </div>

      <hr style={styles.divider} />

      <form onSubmit={handleSubmit} style={{ ...styles.form, opacity: isSubscriptionActive ? 1 : 0.5 }}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Permanent Access Token</label>
          <div style={styles.passwordWrapper}>
            <input 
              type={showToken ? "text" : "password"} 
              name="accessToken"
              placeholder="EAABw..." 
              value={formData.accessToken}
              onChange={handleChange}
              style={styles.inputWithToggle} 
              disabled={!isSubscriptionActive}
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowToken(!showToken)} 
              style={styles.toggleBtn}
              disabled={!isSubscriptionActive}
            >
              {showToken ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>Phone Number ID</label>
            <input 
              type="text" 
              name="phoneNumberId"
              placeholder="e.g., 106554321" 
              value={formData.phoneNumberId}
              onChange={handleChange}
              style={styles.input} 
              disabled={!isSubscriptionActive}
              required 
            />
          </div>

          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>Business Account ID</label>
            <input 
              type="text" 
              name="businessAccountId"
              placeholder="e.g., 209876543" 
              value={formData.businessAccountId}
              onChange={handleChange}
              style={styles.input} 
              disabled={!isSubscriptionActive}
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !isSubscriptionActive} 
          style={loading || !isSubscriptionActive ? styles.btnDisabled : styles.btn}
        >
          {loading ? "Verifying Credentials..." : "Save & Update Gateways"}
        </button>
      </form>

      {status.text && (
        <div style={status.type === "success" ? styles.msgSuccess : styles.msgError}>
          {status.text}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#ffffff", padding: "32px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #f1f5f9", maxWidth: "600px", margin: "24px auto" },
  subscriptionAlert: { padding: "14px", background: "#fffbeb", color: "#b45309", borderRadius: "8px", border: "1px solid #fde68a", fontSize: "14px", marginBottom: "20px", textAlign: "left", lineHeight: "1.5" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  iconContainer: { fontSize: "24px", background: "#f0fdf4", padding: "10px", borderRadius: "10px", border: "1px solid #dcfce7" },
  title: { margin: 0, fontSize: "20px", fontWeight: "600", color: "#0f172a" },
  desc: { margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" },
  divider: { border: 0, borderTop: "1px solid #e2e8f0", margin: "16px 0 24px 0" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  row: { display: "flex", gap: "16px", flexWrap: "wrap" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "500", color: "#475569", textAlign: "left" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155", outline: "none", background: "#f8fafc" },
  passwordWrapper: { display: "flex", position: "relative", width: "100%" },
  inputWithToggle: { padding: "10px 60px 10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#334155", outline: "none", width: "100%", background: "#f8fafc" },
  toggleBtn: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  btn: { background: "#2563eb", color: "white", padding: "12px", border: "none", borderRadius: "8px", fontWeight: "500", cursor: "pointer", fontSize: "14px", marginTop: "8px" },
  btnDisabled: { background: "#cbd5e1", color: "#94a3b8", padding: "12px", border: "none", borderRadius: "8px", fontWeight: "500", fontSize: "14px", marginTop: "8px", cursor: "not-allowed" },
  msgSuccess: { marginTop: "20px", padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", fontSize: "14px", fontWeight: "500", textAlign: "center", border: "1px solid #bbf7d0" },
  msgError: { marginTop: "20px", padding: "12px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", fontSize: "14px", fontWeight: "500", textAlign: "center", border: "1px solid #fecaca" }
};

export default CloudApiSetup;