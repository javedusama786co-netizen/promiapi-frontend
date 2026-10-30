import React from "react";

function GlobalLoader({ message = "Synchronizing secure gateway..." }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Modern Engineered Spinner */}
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
          <div style={styles.innerPulse}></div>
        </div>

        {/* Branding & Status Info */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <h3 style={styles.title}>CRM Core Engine</h3>
          <p style={styles.subtitle}>{message}</p>
        </div>

        {/* Micro Tech Loader Line */}
        <div style={styles.lineTrack}>
          <div style={styles.lineProgress}></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#0f172a", // Solid Slate-900 Dark Theme background
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  card: {
    background: "rgba(30, 41, 59, 0.7)", // Slate-800 with glassmorphism opacity
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "40px 50px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
    width: "100%",
    maxWidth: "360px",
  },
  spinnerContainer: {
    position: "relative",
    width: "60px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "100%",
    height: "100%",
    border: "3.5px solid rgba(37, 99, 235, 0.15)", // Blue outline track
    borderTop: "3.5px solid #2563eb", // Premium Blue moving hub
    borderRight: "3.5px solid #0d9488", // Teal gradient connector
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  innerPulse: {
    position: "absolute",
    width: "24px",
    height: "24px",
    backgroundColor: "rgba(13, 148, 136, 0.2)",
    borderRadius: "50%",
    border: "1px solid #0d9488",
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: "0.5px",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  lineTrack: {
    width: "140px",
    height: "3px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "99px",
    marginTop: "20px",
    overflow: "hidden",
    position: "relative",
  },
  lineProgress: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb, #0d9488)",
    width: "60%",
    borderRadius: "99px",
    position: "absolute",
    animation: "shimmer 1.5s infinite ease-in-out",
  },
};

// CSS Injection for Keyframes Animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0% { left: -100%; width: 40%; }
    50% { width: 70%; }
    100% { left: 100%; width: 40%; }
  }
`;
document.head.appendChild(styleSheet);

export default GlobalLoader;