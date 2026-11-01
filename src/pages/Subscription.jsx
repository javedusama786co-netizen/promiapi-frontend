import { useState, useEffect } from "react";
import axios from "axios"; 
import { useSearchParams } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";

function Subscription() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null); 
  const [searchParams, setSearchParams] = useSearchParams(); 
  const [showMetaCharges, setShowMetaCharges] = useState(false);

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [selectedAddons, setSelectedAddons] = useState({
    supportCustomize: false,  // $29.99
    verifiedPortfolio: false  // $99.99
  });

  const [userSubscription, setUserSubscription] = useState({
    planId: "price_free", 
    subscribed: false
  });

  const API_BASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
    "https://api.promiapi.com"; // default fallback

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/api/subscription/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data && res.data.success) {
          setUserSubscription({
            planId: res.data.planId || "price_free",
            subscribed: res.data.subscribed || res.data.active || false
          });
        }
      } catch (err) {
        console.error("Subscription fetch error:", err);
        const localUser = JSON.parse(localStorage.getItem("user"));
        if (localUser) {
          setUserSubscription({
            planId: localUser.subscription?.planId || "price_free",
            subscribed: localUser.subscribed || false
          });
        }
      }
    };

    fetchUserData();
  }, [API_BASE_URL]);

  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId) {
      const verifyUserPayment = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.post(
            `${API_BASE_URL}/api/subscription/verify-payment`, 
            { sessionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data.success) {
            const updatedUser = res.data.user;
            setUserSubscription({
              planId: updatedUser.subscription?.planId || "price_free",
              subscribed: updatedUser.subscribed || true
            });
            localStorage.setItem("user", JSON.stringify(updatedUser));
            
            setStatusModal({
              isOpen: true,
              type: "success",
              title: "Payment Confirmed!",
              message: "Thank you for your purchase. Your subscription is now fully activated and ready to use."
            });

            setSearchParams({});
          }
        } catch (err) {
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Verification Failed",
            message: err.response?.data?.message || "We encountered an issue verifying your payment. Please contact support."
          });
        }
      };
      verifyUserPayment();
    }
  }, [searchParams, setSearchParams, API_BASE_URL]);

  const toggleAddon = (addonKey) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonKey]: !prev[addonKey]
    }));
  };

  const getAddonTotal = () => {
    let total = 0;
    if (selectedAddons.supportCustomize) total += 29.99;
    if (selectedAddons.verifiedPortfolio) total += 99.99;
    return total;
  };

  const plans = [
    { 
      id: "price_standard", 
      name: "Standard Plan", 
      badgeText: "STARTER",
      priceMonthly: 19.99, 
      priceYearly: 179.99, 
      features: [
        { name: "150,000 Contacts Base", included: true },
        { name: "5 Bot Flows & Flows Builder", included: true },
        { name: "5 Contact Custom Fields", included: true },
        { name: "3 Team Members / Agents", included: true },
        { name: "Unlimited Campaigns & Bot Replies", included: true },
        { name: "Free WhatsApp Business API Integration", included: true },
        { name: "Free WhatsApp Blue Tick Application", included: true },
        { name: "Voice Notes, Calls & Rich Media Sharing", included: true },
        { name: "Click-to-WhatsApp Ads & Retargeting", included: true },
        { name: "Shopify & WooCommerce Integrations", included: true },
        { name: "Multi-Agent Shared Team Inbox", included: true },
        { name: "API & Webhook Access", included: true },
        { name: "Campaign Budget Analytics", included: false },
        { name: "White Labeling & Custom Branding", included: false },
        { name: "Custom Domain Integration", included: false }
      ], 
      current: userSubscription.subscribed && userSubscription.planId === "price_standard",
      popular: false
    },
    { 
      id: "price_premium",
      name: "Premium Engine", 
      badgeText: "MOST POPULAR",
      priceMonthly: 89.99, 
      priceYearly: 799.99, 
      features: [
        { name: "1,000,000 Contacts Base", included: true },
        { name: "10 Bot Flows & Flows Builder", included: true },
        { name: "10 Contact Custom Fields", included: true },
        { name: "10 Team Members / Agents", included: true },
        { name: "Unlimited Campaigns & Bot Replies", included: true },
        { name: "Free WhatsApp Business API Integration", included: true },
        { name: "Free WhatsApp Blue Tick Application", included: true },
        { name: "Voice Notes, Calls & Rich Media Sharing", included: true },
        { name: "Click-to-WhatsApp Ads & Retargeting", included: true },
        { name: "Shopify & WooCommerce Integrations", included: true },
        { name: "Multi-Agent Shared Team Inbox", included: true },
        { name: "High-Speed Webhooks & Meta Sync API", included: true },
        { name: "Campaign Budget Analytics", included: true },
        { name: "White Labeling & Custom Branding", included: false },
        { name: "Custom Domain Integration", included: false }
      ], 
      current: userSubscription.subscribed && userSubscription.planId === "price_premium",
      popular: true
    },
    { 
      id: "price_ultimate",
      name: "Ultimate Cluster", 
      badgeText: "ENTERPRISE",
      priceMonthly: 449.99, 
      priceYearly: 3999.99, 
      features: [
        { name: "Unlimited Contacts Base", included: true },
        { name: "Unlimited Bot Flows", included: true },
        { name: "Unlimited Contact Custom Fields", included: true },
        { name: "Unlimited Team Members / Agents", included: true },
        { name: "Unlimited Campaigns & Bot Replies", included: true },
        { name: "Free WhatsApp Business API Integration", included: true },
        { name: "Free WhatsApp Blue Tick Application", included: true },
        { name: "Voice Notes, Calls & Rich Media Sharing", included: true },
        { name: "Click-to-WhatsApp Ads & Retargeting", included: true },
        { name: "Shopify & WooCommerce Integrations", included: true },
        { name: "Multi-Agent Shared Team Inbox", included: true },
        { name: "Dedicated Webhook Gateway & Custom API", included: true },
        { name: "Campaign Budget Analytics", included: true },
        { name: "White Labeling & Custom Branding", included: true },
        { name: "Custom Domain Integration", included: true },
        { name: "Dedicated Account Manager & SLA", included: true }
      ], 
      current: userSubscription.subscribed && userSubscription.planId === "price_ultimate",
      popular: false
    }
  ];

  const handleCheckout = async (plan) => {
    if (plan.current) return; 

    setLoadingPlan(plan.id);
    try {
      const token = localStorage.getItem("token"); 
      const res = await axios.post(`${API_BASE_URL}/api/subscription/checkout`, {
        planId: plan.id,
        billingPeriod: billingPeriod,
        addons: selectedAddons
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data.url) {
        window.location.href = res.data.url; 
      }
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Checkout Error",
        message: error.response?.data?.message || "Payment processing failed. Please try again or contact support."
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={styles.container}
    >
      {/* ALERT BANNER */}
      {!userSubscription.subscribed && (
        <div style={styles.alertBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={styles.alertIcon}>⚡</span>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <strong style={{ color: '#ffffff', fontSize: '14px' }}>No Active Subscription</strong>
              <p style={{ margin: "2px 0 0 0", fontSize: '13px', opacity: 0.9 }}>
                Select a base plan below to initialize your high-speed automation engine.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ROW */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.topTag}>BILLING & QUOTAS</span>
          <h2 style={styles.title}>Subscription Plans</h2>
          <p style={styles.subtitle}>Choose an enterprise infrastructure package tailored to your messaging volume</p>
        </div>

        <div style={styles.actionControlsGroup}>
          <button
            onClick={() => setShowMetaCharges(true)}
            style={styles.metaChargesBtn}
          >
            <span style={{ fontSize: '15px' }}>📊</span> Meta API Rates
          </button>

          <div style={styles.toggleWrapper}>
            <button 
              onClick={() => setBillingPeriod("monthly")} 
              style={{...styles.toggleBtn, ...(billingPeriod === "monthly" ? styles.toggleActive : {})}}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod("yearly")} 
              style={{...styles.toggleBtn, ...(billingPeriod === "yearly" ? styles.toggleActive : {})}}
            >
              Yearly <span style={styles.saveBadge}>Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* OPTIONAL ADD-ONS SECTION */}
      <div style={styles.addonsWrapper}>
        <div style={styles.addonsHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
              Optional Setup & Managed Add-ons
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Select professional setup services to automatically combine with your base plan checkout.
            </p>
          </div>
          <span style={styles.optionalBadge}>OPTIONAL SERVICES</span>
        </div>

        <div style={styles.addonsGrid}>
          <div 
            onClick={() => toggleAddon("supportCustomize")}
            style={{
              ...styles.addonCard,
              ...(selectedAddons.supportCustomize ? styles.addonSelected : {})
            }}
          >
            <div style={styles.addonHeaderRow}>
              <div style={styles.checkboxContainer}>
                <div style={{
                  ...styles.customCheckbox,
                  ...(selectedAddons.supportCustomize ? styles.customCheckboxChecked : {})
                }}>
                  {selectedAddons.supportCustomize && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={styles.addonTitle}>Support for Complete Customize Setup</span>
              </div>
              <span style={styles.addonPrice}>+$29.99</span>
            </div>
            <p style={styles.addonDescription}>
              Includes end-to-end hands-on technical guidance, tailored system configuration, workflow customization, and personalized onboard troubleshooting.
            </p>
          </div>

          <div 
            onClick={() => toggleAddon("verifiedPortfolio")}
            style={{
              ...styles.addonCard,
              ...(selectedAddons.verifiedPortfolio ? styles.addonSelected : {})
            }}
          >
            <div style={styles.addonHeaderRow}>
              <div style={styles.checkboxContainer}>
                <div style={{
                  ...styles.customCheckbox,
                  ...(selectedAddons.verifiedPortfolio ? styles.customCheckboxChecked : {})
                }}>
                  {selectedAddons.verifiedPortfolio && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={styles.addonTitle}>Verified Business Portfolio Setup</span>
              </div>
              <span style={styles.addonPrice}>+$99.99</span>
            </div>
            <p style={styles.addonDescription}>
              Complete end-to-end Meta Business Manager setup, official business document audit, domain email routing, 1-page site, and display name approval assistance.
            </p>
          </div>
        </div>

        {getAddonTotal() > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.addonSummaryBanner}
          >
            <span>✨ Selected Add-ons Total: <strong>+${getAddonTotal().toFixed(2)}</strong></span>
          </motion.div>
        )}
      </div>

      {/* BASE PLANS GRID */}
      <div style={styles.grid}>
        {plans.map((plan, index) => {
          const basePrice = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
          const totalPrice = (basePrice + getAddonTotal()).toFixed(2);
          
          return (
            <motion.div 
              key={index} 
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              style={{ 
                ...styles.card, 
                ...(plan.current ? styles.activeCard : {}),
                ...(plan.popular && !plan.current ? styles.popularCard : {})
              }}
            >
              {plan.current && <span style={styles.badgeActive}>CURRENT PLAN</span>}
              {plan.popular && !plan.current && <span style={styles.badgePopular}>MOST POPULAR</span>}
              
              <div>
                <div style={styles.planHeader}>
                  <h3 style={styles.planName}>{plan.name}</h3>
                  <span style={styles.planBadgeTag}>{plan.badgeText}</span>
                </div>

                <div style={styles.priceContainer}>
                  <span style={styles.currency}>$</span>
                  <span style={styles.priceAmount}>{totalPrice}</span>
                  <span style={styles.period}>/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
                </div>

                {getAddonTotal() > 0 && (
                  <span style={styles.addonNoticeText}>
                    (Base ${basePrice} +${getAddonTotal().toFixed(2)} Add-ons)
                  </span>
                )}
                
                <div style={styles.divider} />
                
                <ul style={styles.featureList}>
                  {plan.features.map((feat, i) => (
                    <li key={i} style={{
                      ...styles.featureItem,
                      opacity: feat.included ? 1 : 0.4 
                    }}>
                      <div style={{
                        ...styles.checkCircle, 
                        backgroundColor: feat.included 
                          ? (plan.popular ? "#2563eb" : "#10b981")
                          : "#e2e8f0",
                        color: feat.included ? "#ffffff" : "#94a3b8"
                      }}>
                        {feat.included ? "✓" : "✕"}
                      </div>
                      <span style={{
                        ...styles.featureText,
                        textDecoration: feat.included ? "none" : "line-through"
                      }}>
                        {feat.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan !== null || plan.current}
                style={{ 
                  ...styles.btn, 
                  ...(plan.current ? styles.btnActive : plan.popular ? styles.btnPopular : styles.btnNormal),
                  cursor: plan.current ? "default" : "pointer"
                }}
              >
                {loadingPlan === plan.id ? "Processing..." : plan.current ? "Active Workspace" : "Upgrade Plan →"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* STATUS MODAL */}
      <AnimatePresence>
        {statusModal.isOpen && (
          <div style={styles.modalOverlay} onClick={() => setStatusModal({ ...statusModal, isOpen: false })}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                ...styles.modalContent,
                background: "#0f172a",
                border: statusModal.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ffffff",
                textAlign: "center",
                maxWidth: "420px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: statusModal.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: statusModal.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  color: statusModal.type === "success" ? "#10b981" : "#ef4444",
                  fontSize: "28px"
                }}
              >
                {statusModal.type === "success" ? "✓" : "✕"}
              </div>

              <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800", color: "#f8fafc" }}>
                {statusModal.title}
              </h3>

              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px 0" }}>
                {statusModal.message}
              </p>

              <button
                type="button"
                onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: statusModal.type === "success" ? "#10b981" : "#2563eb",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP META CHARGES MODAL */}
      <AnimatePresence>
        {showMetaCharges && (
          <div style={styles.modalOverlay} onClick={() => setShowMetaCharges(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ ...styles.modalContent, maxWidth: "620px" }}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Meta Cloud API Official Rates</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                    Standard conversation charges billed directly by Meta/Facebook
                  </p>
                </div>
                <button style={styles.closeModalBtn} onClick={() => setShowMetaCharges(false)}>✕</button>
              </div>

              <div style={styles.infoNoteBox}>
                🎁 <strong>First 1,000 Service conversations</strong> every month are completely FREE.
              </div>
              
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Use Case</th>
                      <th style={styles.th}>Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{...styles.td, fontWeight: '700', color: '#2563eb'}}>Marketing</td>
                      <td style={styles.td}>Promotional offers & alerts.</td>
                      <td style={styles.td}>~$0.0099 - $0.014</td>
                    </tr>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <td style={{...styles.td, fontWeight: '700', color: '#10b981'}}>Utility</td>
                      <td style={styles.td}>Order receipts, shipping, OTP.</td>
                      <td style={styles.td}>~$0.0045 - $0.006</td>
                    </tr>
                    <tr>
                      <td style={{...styles.td, fontWeight: '700', color: '#64748b'}}>Service</td>
                      <td style={styles.td}>Inbound user support chats.</td>
                      <td style={styles.td}>~$0.0030 - $0.004</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const styles = {
  container: { 
    padding: "20px 12px", 
    maxWidth: "1280px", 
    margin: "0 auto", 
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#0f172a",
    boxSizing: "border-box",
    width: "100%"
  },
  alertBanner: { 
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
    color: "#ffffff", 
    padding: "14px 16px", 
    borderRadius: "14px", 
    marginBottom: "24px", 
    border: "1px solid #334155",
    boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)"
  },
  alertIcon: {
    background: "#2563eb",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0
  },
  headerRow: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    flexDirection: "column",
    gap: "16px", 
    marginBottom: "24px" 
  },
  topTag: { fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "1px", textTransform: "uppercase" },
  title: { margin: "4px 0 0 0", fontSize: "26px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.8px" },
  subtitle: { margin: "6px 0 0 0", fontSize: "14px", color: "#64748b" },
  actionControlsGroup: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%" },
  metaChargesBtn: { 
    background: "#ffffff", 
    color: "#334155", 
    border: "1px solid #cbd5e1", 
    padding: "10px 14px", 
    borderRadius: "10px", 
    fontSize: "13px", 
    fontWeight: "700", 
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: "1",
    justifyContent: "center",
    minWidth: "130px"
  },
  toggleWrapper: { display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px", border: "1px solid #e2e8f0", flex: "1", justifyContent: "center", minWidth: "200px" },
  toggleBtn: { padding: "8px 12px", border: "none", background: "none", borderRadius: "8px", fontWeight: "700", color: "#64748b", cursor: "pointer", fontSize: "12.5px", flex: 1, textAlign: "center" },
  toggleActive: { background: "#ffffff", color: "#0f172a", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" },
  saveBadge: { fontSize: "9px", background: "#dbeafe", color: "#1e40af", padding: "2px 4px", borderRadius: "4px", fontWeight: "800", marginLeft: "2px" },
  
  addonsWrapper: { 
    background: "#ffffff", 
    borderRadius: "16px", 
    padding: "20px 16px", 
    border: "1px solid #e2e8f0", 
    marginBottom: "30px", 
    boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)" 
  },
  addonsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  optionalBadge: { background: "#f8fafc", color: "#475569", fontSize: "10px", fontWeight: "800", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e2e8f0" },
  addonsGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "14px" },
  addonCard: { 
    background: "#f8fafc", 
    borderRadius: "12px", 
    padding: "16px", 
    border: "2px solid #e2e8f0", 
    cursor: "pointer", 
    transition: "all 0.2s ease",
    position: "relative"
  },
  addonSelected: { borderColor: "#2563eb", background: "#f0f6ff", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)" },
  addonHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" },
  checkboxContainer: { display: "flex", alignItems: "center", gap: "10px" },
  customCheckbox: { 
    width: "18px", 
    height: "18px", 
    borderRadius: "5px", 
    border: "2px solid #cbd5e1", 
    background: "#ffffff", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    flexShrink: 0
  },
  customCheckboxChecked: { background: "#2563eb", borderColor: "#2563eb" },
  addonTitle: { fontSize: "13.5px", fontWeight: "700", color: "#0f172a" },
  addonPrice: { fontSize: "13px", fontWeight: "800", color: "#2563eb", background: "#dbeafe", padding: "3px 8px", borderRadius: "6px", flexShrink: 0 },
  addonDescription: { fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: "1.4" },
  addonSummaryBanner: { marginTop: "16px", background: "#eff6ff", color: "#1e40af", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", border: "1px solid #bfdbfe", display: "block", textAlign: "center" },

  grid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
  card: { 
    background: "#ffffff", 
    borderRadius: "20px", 
    padding: "24px 20px", 
    border: "1px solid #e2e8f0", 
    position: "relative", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "space-between", 
    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)" 
  },
  activeCard: { borderColor: "#2563eb", boxShadow: "0 20px 35px -10px rgba(37, 99, 235, 0.12)" },
  popularCard: { borderColor: "#3b82f6", boxShadow: "0 20px 35px -10px rgba(59, 130, 246, 0.1)" },
  badgeActive: { position: "absolute", top: "-10px", left: "20px", background: "#10b981", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "20px" },
  badgePopular: { position: "absolute", top: "-10px", left: "20px", background: "#2563eb", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "20px" },
  
  planHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" },
  planName: { fontSize: "20px", fontWeight: "800", margin: 0, color: "#0f172a" },
  planBadgeTag: { fontSize: "10px", fontWeight: "800", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" },

  priceContainer: { display: "flex", alignItems: "baseline", gap: "4px" },
  currency: { fontSize: "20px", fontWeight: "800", color: "#0f172a" },
  priceAmount: { fontSize: "36px", fontWeight: "800", color: "#0f172a", lineHeight: "1", letterSpacing: "-1px" },
  period: { fontSize: "13px", color: "#64748b", fontWeight: "600" },
  addonNoticeText: { fontSize: "11.5px", color: "#2563eb", fontWeight: "700", display: "block", marginTop: "4px" },

  divider: { height: "1px", background: "#f1f5f9", margin: "18px 0" },
  featureList: { listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: { display: "flex", alignItems: "center", gap: "10px" },
  checkCircle: { width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", flexShrink: 0 },
  featureText: { fontSize: "13.5px", color: "#334155", fontWeight: "600" },
  
  btn: { width: "100%", padding: "12px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", transition: "all 0.2s ease", border: "none" },
  btnNormal: { background: "#0f172a", color: "#ffffff" },
  btnPopular: { background: "#2563eb", color: "#ffffff", boxShadow: "0 8px 20px -4px rgba(37, 99, 235, 0.4)" },
  btnActive: { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "16px" },
  modalContent: { background: "#ffffff", borderRadius: "16px", padding: "20px", width: "100%", maxWidth: "100%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", boxSizing: "border-box" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "8px" },
  closeModalBtn: { border: "none", background: "#f1f5f9", borderRadius: "50%", width: "28px", height: "28px", fontSize: "12px", cursor: "pointer", color: "#64748b", flexShrink: 0 },
  infoNoteBox: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "10px 12px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "16px" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "400px" },
  thRow: { borderBottom: "2px solid #e2e8f0" },
  th: { padding: "10px 8px", fontSize: "11.5px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 8px", fontSize: "13px", color: "#334155", borderBottom: "1px solid #f1f5f9" }
};

// میڈیا کیوریز یا بڑی سکرینوں (جیسے لیپ ٹاپ/مانیٹر) کے لیے رسپانسیو گرڈ ایڈجسٹمنٹ
if (typeof window !== "undefined" && window.innerWidth >= 768) {
  styles.container.padding = "40px 24px";
  styles.headerRow.flexDirection = "row";
  styles.headerRow.alignItems = "flex-end";
  styles.actionControlsGroup.flex = "unset";
  styles.metaChargesBtn.flex = "unset";
  styles.toggleWrapper.flex = "unset";
  styles.addonsGrid.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))";
  styles.grid.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))";
  styles.modalContent.padding = "32px";
}

export default Subscription;