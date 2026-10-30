import React from 'react';

function QuickStartGuide({ onViewChange }) {
  const steps = [
    {
      id: 1,
      title: "WhatsApp Device Pair Connection",
      desc: "Go to your dashboard scanner panel, link your instance account via Baileys multi-device protocol system.",
      actionText: "Scan QR Code",
      action: () => onViewChange("stats")
    },
    {
      id: 2,
      title: "Manage & Sync WhatsApp Templates",
      desc: "Design context-aware automated template payloads, custom placeholders, and interactive reply nodes.",
      actionText: "Configure Templates",
      action: () => onViewChange("templates")
    },
    {
      id: 3,
      title: "Manage Groups Segmentations",
      desc: "Create dedicated target workspace buckets to categorize your bulk numbers cleanly into groups.",
      actionText: "Manage Groups",
      action: () => onViewChange("groups")
    },
    {
      id: 4,
      title: "Contacts Dataset Optimization",
      desc: "Manually build your audience list or upload your customized system-compatible Excel database sheets seamlessly.",
      actionText: "Manage Contacts",
      action: () => onViewChange("contacts")
    },
    {
      id: 5,
      title: "Create & Schedule Your Campaigns",
      desc: "Trigger high-throughput sequence distributions or schedule marketing streams to broadcast efficiently.",
      actionText: "Launch Campaign",
      action: () => onViewChange("campaigns")
    }
  ];

  return (
    <div style={styles.guideWrapper}>
      <h3 style={styles.sectionTitle}>🚀 Core System Onboarding Checklist</h3>
      <p style={styles.sectionSubtitle}>Complete these foundational parameters to unlock automated SaaS capabilities across your connected layout channels.</p>
      
      <div style={styles.stepsGrid}>
        {steps.map((step) => (
          <div key={step.id} style={styles.stepCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepBadge}>Step {step.id}</span>
            </div>
            <h4 style={styles.stepTitle}>{step.title}</h4>
            <p style={styles.stepDesc}>{step.desc}</p>
            <button onClick={step.action} style={styles.actionBtn}>
              {step.actionText} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  guideWrapper: { marginTop: "32px", padding: "8px" },
  sectionTitle: { margin: "0 0 6px 0", fontSize: "20px", fontWeight: "700", color: "#0f172a" },
  sectionSubtitle: { margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", maxWidth: "600px", lineHeight: "1.5" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
  stepCard: { background: "white", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
  stepHeader: { marginBottom: "12px" },
  stepBadge: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  stepTitle: { margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#1e293b" },
  stepDesc: { margin: "0 0 16px 0", fontSize: "13px", color: "#64748b", lineHeight: "1.6", flexGrow: 1 },
  actionBtn: { background: "none", border: "none", color: "#2563eb", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: 0, textAlign: "left", width: "fit-content" }
};

export default QuickStartGuide;