import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/auth/reset-password/${token}`,
        { password }
      );
      setMessage(
        res.data.message || "Password updated successfully! Redirecting to login..."
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.message || "Token expire ho chuka hai ya invalid hai."
      );
    } finally {
      setLoading(false);
    }
  };

  // Password strength logic
  const pw = password;
  const score = pw
    ? [
        pw.length >= 8,
        /[a-z]/.test(pw) && /[A-Z]/.test(pw),
        /\d/.test(pw),
        /[^A-Za-z0-9]/.test(pw),
      ].filter(Boolean).length
    : 0;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = ["#e2e8f0", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][score];

  const eyeIcon = (
    <button
      type="button"
      className="rp-eye"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  );

  return (
    <div className="rp-root">
      <style>{css}</style>

      {/* LEFT: Branding & Secure Recovery Hero Scene */}
      <section className="rp-left">
        <div className="rp-grid" />
        <div className="rp-blob rp-blob-a" />
        <div className="rp-blob rp-blob-b" />

        <div className="rp-copy" style={{ marginTop: "20px" }}>
          <div className="rp-title-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="rp-h1">Secure Account Recovery</h1>
          <p className="rp-sub">
            Your account security is our top priority. Set a new, strong password to regain full access to your workspace and customer chats.
          </p>
        </div>

        <div className="rp-badge-card">
          <div className="rp-badge-icon">🔒</div>
          <div>
            <strong>Encrypted & Secure</strong>
            <span>Your password is updated securely using token verification.</span>
          </div>
        </div>

        <div className="rp-footer-note">
          <span>Official Meta Cloud API Partner Portal</span>
        </div>
      </section>

      {/* RIGHT: Reset Form */}
      <main className="rp-right">
        <motion.div
          className="rp-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="rp-card-header">
            <h2 className="rp-title">Reset Password</h2>
            <p className="rp-subtitle">
              Enter your new secure password below.
            </p>
          </div>

          {error && (
            <div className="rp-alert rp-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{error}</span>
            </div>
          )}

          {message ? (
            <div className="rp-alert rp-alert-success" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rp-form">
              <div className="rp-field">
                <label htmlFor="rp-pw">New Password</label>
                <div className="rp-input-wrap">
                  <svg className="rp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  <input
                    id="rp-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {eyeIcon}
                </div>
              </div>

              <div className="rp-field">
                <label htmlFor="rp-confirm-pw">Confirm Password</label>
                <div className="rp-input-wrap">
                  <svg className="rp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  <input
                    id="rp-confirm-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Strength Meter */}
              <div className="rp-meter">
                <div className="rp-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      style={{
                        background: score >= n ? strengthColor : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="rp-meter-text"
                  style={{ color: score ? strengthColor : "#94a3b8" }}
                >
                  {score
                    ? `${strengthLabel} password`
                    : "Use 8+ chars with uppercase, numbers & symbols"}
                </span>
              </div>

              <button type="submit" className="rp-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="rp-spin" /> Updating Password…
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}

          <p className="rp-foot">
            Remembered your password?{" "}
            <button
              type="button"
              className="rp-link"
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

.rp-root { min-height: 100vh; display: flex; background: #f4f7fb; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
.rp-root *, .rp-root *::before, .rp-root *::after { box-sizing: border-box; }

/* LEFT PANEL */
.rp-left { flex: 1.15; position: relative; overflow: hidden; color: #fff; padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px;
  background: linear-gradient(160deg, #050b18 0%, #0a1931 58%, #0b2a52 100%); }
.rp-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 44px 44px; }
.rp-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.rp-blob-a { width: 400px; height: 400px; top: -100px; left: -80px; background: rgba(37,99,235,.32); filter: blur(100px); }
.rp-blob-b { width: 360px; height: 360px; bottom: -100px; right: -60px; background: rgba(16,185,129,.22); filter: blur(100px); }

.rp-title-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(37,99,235,0.18); border: 1px solid rgba(37,99,235,0.35); display: flex; align-items: center; justify-content: center; color: #60a5fa; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(37,99,235,0.2); }
.rp-copy { position: relative; z-index: 2; max-width: 500px; }
.rp-h1 { font-family: 'Sora', system-ui, sans-serif; font-size: 38px; font-weight: 800; line-height: 1.18; letter-spacing: -1px; margin: 0 0 16px; }
.rp-sub { font-size: 15.5px; line-height: 1.65; color: #9fb0c8; margin: 0; }

.rp-badge-card { position: relative; z-index: 2; display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 16px; backdrop-filter: blur(8px); }
.rp-badge-icon { font-size: 28px; }
.rp-badge-card strong { display: block; font-size: 15px; color: #fff; margin-bottom: 2px; }
.rp-badge-card span { font-size: 13px; color: #94a3b8; line-height: 1.4; }

.rp-footer-note { position: relative; z-index: 2; font-size: 13px; color: #64748b; border-top: 1px solid rgba(255,255,255,.1); padding-top: 18px; }

/* RIGHT PANEL */
.rp-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 32px; }
.rp-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 44px 40px; box-shadow: 0 30px 60px -30px rgba(15,23,42,.18); }
.rp-title { font-family: 'Sora', system-ui, sans-serif; font-size: 26px; font-weight: 700; letter-spacing: -.6px; margin: 0 0 8px; }
.rp-subtitle { font-size: 14.5px; color: #64748b; margin: 0 0 26px; }

.rp-alert { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-radius: 12px; font-size: 14px; line-height: 1.4; margin-bottom: 22px; }
.rp-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.rp-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-weight: 600; }

.rp-form { display: flex; flex-direction: column; gap: 18px; }
.rp-field { display: flex; flex-direction: column; gap: 8px; }
.rp-field label { font-size: 13.5px; font-weight: 600; color: #334155; }
.rp-input-wrap { position: relative; display: flex; align-items: center; }
.rp-ico { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
.rp-input-wrap input { width: 100%; height: 48px; padding: 0 44px 0 42px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-size: 15px; color: #0f172a; outline: none; transition: border-color .2s, box-shadow .2s; }
.rp-input-wrap input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.rp-eye { position: absolute; right: 6px; width: 36px; height: 36px; border: none; background: transparent; color: #64748b; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.rp-eye:hover { background: #f1f5f9; color: #0f172a; }

.rp-meter { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
.rp-bars { display: flex; gap: 4px; }
.rp-bars span { flex: 1; height: 4px; border-radius: 2px; transition: background .2s; }
.rp-meter-text { font-size: 12px; font-weight: 500; }

.rp-submit { height: 50px; border: none; border-radius: 12px; color: #fff; font-size: 15.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 10px 22px -8px rgba(37,99,235,.65); transition: transform .15s, box-shadow .2s; margin-top: 6px; }
.rp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px -8px rgba(37,99,235,.7); }
.rp-submit:disabled { opacity: .75; cursor: not-allowed; }
.rp-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: rpSpin .7s linear infinite; }

.rp-foot { text-align: center; font-size: 14px; color: #64748b; margin: 24px 0 0; }
.rp-link { background: none; border: none; padding: 0; color: #2563eb; font-weight: 600; cursor: pointer; margin-left: 4px; }
.rp-link:hover { text-decoration: underline; }

@keyframes rpSpin { to { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width: 900px) {
  .rp-root { flex-direction: column; }
  .rp-left { padding: 28px 24px; gap: 16px; }
  .rp-h1 { font-size: 28px; }
  .rp-badge-card { display: none; }
  .rp-right { padding: 24px 20px 40px; }
  .rp-card { max-width: 500px; padding: 32px 24px; }
}
`;

export default ResetPassword;