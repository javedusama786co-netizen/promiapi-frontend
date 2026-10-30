import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const BACKEND_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
    "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      setMessage(
        res.data.message || "Password reset link has been sent to your email."
      );
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err.response?.data?.message || "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-root">
      <style>{css}</style>

      {/* LEFT: Branding & Secure Recovery Hero Scene */}
      <section className="fp-left">
        <div className="fp-grid" />
        <div className="fp-blob fp-blob-a" />
        <div className="fp-blob fp-blob-b" />

        <div className="fp-copy" style={{ marginTop: "20px" }}>
          <div className="fp-title-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <h1 className="fp-h1">Password Recovery</h1>
          <p className="fp-sub">
            Don't worry, it happens. Enter your registered email and we will send you a secure link to reset your password.
          </p>
        </div>

        <div className="fp-badge-card">
          <div className="fp-badge-icon">✉️</div>
          <div>
            <strong>Instant Recovery Link</strong>
            <span>Check your inbox for instructions to restore access to your account.</span>
          </div>
        </div>

        <div className="fp-footer-note">
          <span>Official Meta Cloud API Partner Portal</span>
        </div>
      </section>

      {/* RIGHT: Forgot Password Form */}
      <main className="fp-right">
        <motion.div
          className="fp-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="fp-card-header">
            <h2 className="fp-title">Forgot Password?</h2>
            <p className="fp-subtitle">
              Enter your email address and we'll send you a recovery link.
            </p>
          </div>

          {error && (
            <div className="fp-alert fp-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{error}</span>
            </div>
          )}

          {message ? (
            <div className="fp-alert fp-alert-success" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fp-form">
              <div className="fp-field">
                <label htmlFor="fp-email">Email address</label>
                <div className="fp-input-wrap">
                  <svg className="fp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></svg>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="fp-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="fp-spin" /> Sending Link…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}

          <p className="fp-foot">
            Remembered your password?{" "}
            <button
              type="button"
              className="fp-link"
              onClick={() => navigate("/login")}
            >
              Sign in to workspace
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

.fp-root { min-height: 100vh; display: flex; background: #f4f7fb; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
.fp-root *, .fp-root *::before, .fp-root *::after { box-sizing: border-box; }

/* LEFT PANEL */
.fp-left { flex: 1.15; position: relative; overflow: hidden; color: #fff; padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px;
  background: linear-gradient(160deg, #050b18 0%, #0a1931 58%, #0b2a52 100%); }
.fp-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 44px 44px; }
.fp-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.fp-blob-a { width: 400px; height: 400px; top: -100px; left: -80px; background: rgba(37,99,235,.32); filter: blur(100px); }
.fp-blob-b { width: 360px; height: 360px; bottom: -100px; right: -60px; background: rgba(16,185,129,.22); filter: blur(100px); }

.fp-title-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(37,99,235,0.18); border: 1px solid rgba(37,99,235,0.35); display: flex; align-items: center; justify-content: center; color: #60a5fa; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(37,99,235,0.2); }
.fp-copy { position: relative; z-index: 2; max-width: 500px; }
.fp-h1 { font-family: 'Sora', system-ui, sans-serif; font-size: 38px; font-weight: 800; line-height: 1.18; letter-spacing: -1px; margin: 0 0 16px; }
.fp-sub { font-size: 15.5px; line-height: 1.65; color: #9fb0c8; margin: 0; }

.fp-badge-card { position: relative; z-index: 2; display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 16px; backdrop-filter: blur(8px); }
.fp-badge-icon { font-size: 28px; }
.fp-badge-card strong { display: block; font-size: 15px; color: #fff; margin-bottom: 2px; }
.fp-badge-card span { font-size: 13px; color: #94a3b8; line-height: 1.4; }

.fp-footer-note { position: relative; z-index: 2; font-size: 13px; color: #64748b; border-top: 1px solid rgba(255,255,255,.1); padding-top: 18px; }

/* RIGHT PANEL */
.fp-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 32px; }
.fp-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 44px 40px; box-shadow: 0 30px 60px -30px rgba(15,23,42,.18); }
.fp-title { font-family: 'Sora', system-ui, sans-serif; font-size: 26px; font-weight: 700; letter-spacing: -.6px; margin: 0 0 8px; }
.fp-subtitle { font-size: 14.5px; color: #64748b; margin: 0 0 26px; }

.fp-alert { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-radius: 12px; font-size: 14px; line-height: 1.4; margin-bottom: 22px; }
.fp-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.fp-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-weight: 600; }

.fp-form { display: flex; flex-direction: column; gap: 18px; }
.fp-field { display: flex; flex-direction: column; gap: 8px; }
.fp-field label { font-size: 13.5px; font-weight: 600; color: #334155; }
.fp-input-wrap { position: relative; display: flex; align-items: center; }
.fp-ico { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
.fp-input-wrap input { width: 100%; height: 48px; padding: 0 44px 0 42px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-size: 15px; color: #0f172a; outline: none; transition: border-color .2s, box-shadow .2s; }
.fp-input-wrap input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }

.fp-submit { height: 50px; border: none; border-radius: 12px; color: #fff; font-size: 15.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 10px 22px -8px rgba(37,99,235,.65); transition: transform .15s, box-shadow .2s; margin-top: 6px; }
.fp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px -8px rgba(37,99,235,.7); }
.fp-submit:disabled { opacity: .75; cursor: not-allowed; }
.fp-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: fpSpin .7s linear infinite; }

.fp-foot { text-align: center; font-size: 14px; color: #64748b; margin: 24px 0 0; }
.fp-link { background: none; border: none; padding: 0; color: #2563eb; font-weight: 600; cursor: pointer; margin-left: 4px; }
.fp-link:hover { text-decoration: underline; }

@keyframes fpSpin { to { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width: 900px) {
  .fp-root { flex-direction: column; }
  .fp-left { padding: 28px 24px; gap: 16px; }
  .fp-h1 { font-size: 28px; }
  .fp-badge-card { display: none; }
  .fp-right { padding: 24px 20px 40px; }
  .fp-card { max-width: 500px; padding: 32px 24px; }
}
`;

export default ForgotPassword;