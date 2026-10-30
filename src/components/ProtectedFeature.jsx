import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function ProtectedFeature({ children }) {
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      const token = localStorage.getItem("token");
      const localUser = JSON.parse(localStorage.getItem("user")) || {};

      // 🎯 CRITICAL FIX FOR AGENTS: 
      // Agar logged in user "Agent" hai, toh direct authorization pass karein (Kyunki subscription Admin ke account par hoti hai)
      if (localUser.role === "Agent") {
        setIsSubscribed(true);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/subscription/user/subscription", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const status = res.data?.active === true || res.data?.subscribed === true;
        setIsSubscribed(status);
        
        localUser.subscribed = status;
        localStorage.setItem("user", JSON.stringify(localUser));

      } catch (err) {
        console.error("Feature authorization check failed:", err);
        // Fallback check standard state se
        setIsSubscribed(localUser.subscribed === true); 
      } finally {
        setLoading(false);
      }
    };

    verifySubscription();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", fontFamily: "sans-serif" }}>
        <p>Verifying workspace access security context...</p>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div style={styles.lockContainer}>
        <div style={styles.iconWrapper}>
          <span style={styles.lockIcon}>🔒</span>
        </div>
        <h2 style={styles.title}>Feature Locked</h2>
        <p style={styles.subtitle}>
          Is feature ko use karne ke liye apna plan upgrade karein.
        </p>
        <button 
          onClick={() => navigate("/dashboard/subscription")} 
          style={styles.upgradeBtn}
        >
          View Subscription Plans ⚡
        </button>
      </div>
    );
  }

  return children;
}

const styles = {
  lockContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", maxWidth: "600px", margin: "40px auto", fontFamily: "'Inter', sans-serif" },
  iconWrapper: { background: "#f8fafc", width: "#80px", height: "#80px", borderRadius: "50% ", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", border: "1px solid #e2e8f0" },
  lockIcon: { fontSize: "36px" },
  title: { margin: "0 0 12px 0", fontSize: "24px", fontWeight: "700", color: "#0f172a" },
  subtitle: { margin: "0 0 24px 0", fontSize: "15px", color: "#64748b", maxWidth: "400px", lineHeight: "1.5" },
  upgradeBtn: { background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#ffffff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14.5px", cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", transition: "all 0.2s" }
};

export default ProtectedFeature;