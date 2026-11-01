import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

function ActivateAccount() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const BACKEND_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
    "https://api.promiapi.com"; // default fallback

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      const res = await axios.post(`${BACKEND_URL}/api/team/activate`, {
        token,
        password,
      });

      if (res.data && res.data.success) {
        setSuccess("🎉 Account activated successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      }
    } catch (err) {
      console.error("Activation error:", err);
      setError(
        err.response?.data?.message || "Activation failed or token has expired."
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
      className="act-eye"
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
    <div className="act-root">
      <style>{css}</style>

      {/* LEFT: Branding & Animated Hero Scene with Professional SVG Icon */}
      <section className="act-left">
        <div className="act-grid" />
        <div className="act-blob act-blob-a" />
        <div className="act-blob act-blob-b" />

        <div className="act-copy" style={{ marginTop: "20px" }}>
          <div className="act-title-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="act-h1">Welcome to the Team!</h1>
          <p className="act-sub">
            You've been invited to join the workspace. Set up your password below to gain full access to customer conversations, live chats, and tools.
          </p>
        </div>

        <div className="act-badge-card">
          <div className="act-badge-icon">✨</div>
          <div>
            <strong>Special Invitation</strong>
            <span>Your official workspace credentials are ready to be configured.</span>
          </div>
        </div>

        <div className="act-footer-note">
          <span>Official Meta Cloud API Partner Portal</span>
        </div>
      </section>

      {/* RIGHT: Activation Form */}
      <main className="act-right">
        <motion.div
          className="act-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="act-card-header">
            <h2 className="act-title">Activate Account</h2>
            <p className="act-subtitle">
              Choose a strong password to complete your account setup.
            </p>
          </div>

          {error && (
            <div className="act-alert act-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="act-alert act-alert-success" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>{success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="act-form">
              <div className="act-field">
                <label htmlFor="act-pw">New Password</label>
                <div className="act-input-wrap">
                  <svg className="act-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  <input
                    id="act-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {eyeIcon}
                </div>
              </div>

              <div className="act-field">
                <label htmlFor="act-confirm-pw">Confirm Password</label>
                <div className="act-input-wrap">
                  <svg className="act-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  <input
                    id="act-confirm-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Strength Meter */}
              <div className="act-meter">
                <div className="act-bars">
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
                  className="act-meter-text"
                  style={{ color: score ? strengthColor : "#94a3b8" }}
                >
                  {score
                    ? `${strengthLabel} password`
                    : "Use 8+ chars with uppercase, numbers & symbols"}
                </span>
              </div>

              <button type="submit" className="act-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="act-spin" /> Activating Account…
                  </>
                ) : (
                  "Activate Account & Login"
                )}
              </button>
            </form>
          )}

          <p className="act-foot">
            Already activated?{" "}
            <button
              type="button"
              className="act-link"
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

.act-root { min-height: 100vh; display: flex; background: #f4f7fb; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
.act-root *, .act-root *::before, .act-root *::after { box-sizing: border-box; }

/* LEFT PANEL */
.act-left { flex: 1.15; position: relative; overflow: hidden; color: #fff; padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px;
  background: linear-gradient(160deg, #050b18 0%, #0a1931 58%, #0b2a52 100%); }
.act-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 44px 44px; }
.act-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.act-blob-a { width: 400px; height: 400px; top: -100px; left: -80px; background: rgba(37,99,235,.32); filter: blur(100px); }
.act-blob-b { width: 360px; height: 360px; bottom: -100px; right: -60px; background: rgba(16,185,129,.22); filter: blur(100px); }

.act-title-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(37,99,235,0.18); border: 1px solid rgba(37,99,235,0.35); display: flex; align-items: center; justify-content: center; color: #60a5fa; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(37,99,235,0.2); }
.act-copy { position: relative; z-index: 2; max-width: 500px; }
.act-h1 { font-family: 'Sora', system-ui, sans-serif; font-size: 38px; font-weight: 800; line-height: 1.18; letter-spacing: -1px; margin: 0 0 16px; }
.act-sub { font-size: 15.5px; line-height: 1.65; color: #9fb0c8; margin: 0; }

.act-badge-card { position: relative; z-index: 2; display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 16px; backdrop-filter: blur(8px); }
.act-badge-icon { font-size: 28px; }
.act-badge-card strong { display: block; font-size: 15px; color: #fff; margin-bottom: 2px; }
.act-badge-card span { font-size: 13px; color: #94a3b8; line-height: 1.4; }

.act-footer-note { position: relative; z-index: 2; font-size: 13px; color: #64748b; border-top: 1px solid rgba(255,255,255,.1); padding-top: 18px; }

/* RIGHT PANEL */
.act-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 32px; }
.act-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 44px 40px; box-shadow: 0 30px 60px -30px rgba(15,23,42,.18); }
.act-title { font-family: 'Sora', system-ui, sans-serif; font-size: 26px; font-weight: 700; letter-spacing: -.6px; margin: 0 0 8px; }
.act-subtitle { font-size: 14.5px; color: #64748b; margin: 0 0 26px; }

.act-alert { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-radius: 12px; font-size: 14px; line-height: 1.4; margin-bottom: 22px; }
.act-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.act-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-weight: 600; }

.act-form { display: flex; flex-direction: column; gap: 18px; }
.act-field { display: flex; flex-direction: column; gap: 8px; }
.act-field label { font-size: 13.5px; font-weight: 600; color: #334155; }
.act-input-wrap { position: relative; display: flex; align-items: center; }
.act-ico { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
.act-input-wrap input { width: 100%; height: 48px; padding: 0 44px 0 42px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-size: 15px; color: #0f172a; outline: none; transition: border-color .2s, box-shadow .2s; }
.act-input-wrap input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.act-eye { position: absolute; right: 6px; width: 36px; height: 36px; border: none; background: transparent; color: #64748b; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.act-eye:hover { background: #f1f5f9; color: #0f172a; }

.act-meter { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
.act-bars { display: flex; gap: 4px; }
.act-bars span { flex: 1; height: 4px; border-radius: 2px; transition: background .2s; }
.act-meter-text { font-size: 12px; font-weight: 500; }

.act-submit { height: 50px; border: none; border-radius: 12px; color: #fff; font-size: 15.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 10px 22px -8px rgba(37,99,235,.65); transition: transform .15s, box-shadow .2s; margin-top: 6px; }
.act-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px -8px rgba(37,99,235,.7); }
.act-submit:disabled { opacity: .75; cursor: not-allowed; }
.act-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: actSpin .7s linear infinite; }

.act-foot { text-align: center; font-size: 14px; color: #64748b; margin: 24px 0 0; }
.act-link { background: none; border: none; padding: 0; color: #2563eb; font-weight: 600; cursor: pointer; margin-left: 4px; }
.act-link:hover { text-decoration: underline; }

@keyframes actSpin { to { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width: 900px) {
  .act-root { flex-direction: column; }
  .act-left { padding: 28px 24px; gap: 16px; }
  .act-h1 { font-size: 28px; }
  .act-badge-card { display: none; }
  .act-right { padding: 24px 20px 40px; }
  .act-card { max-width: 500px; padding: 32px 24px; }
}
`;

export default ActivateAccount;