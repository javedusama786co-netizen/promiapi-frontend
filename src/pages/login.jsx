import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { GlobalLoader } from "../App";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGlobalLoader, setShowGlobalLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // UI only

  const navigate = useNavigate();

  // Initialize Facebook SDK on mount if available
  useEffect(() => {
    if (window.FB) {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || "1543305467331355",
        cookie: true,
        xfbml: true,
        version: "v18.0"
      });
    }
  }, []);

  // 🎬 3D tilt for the hero scene (UI only)
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mvY, [-0.5, 0.5], [9, -9]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mvX, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 20 });

  const handleSceneMove = (e) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mvX.set((e.clientX - rect.left) / rect.width - 0.5);
    mvY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleSceneLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  // 🔑 Dynamic Backend Base URL
  const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://api.promiapi.com");

  // Helper function to handle shared session & route redirection post-login
  const handleSuccessfulLogin = (resData) => {
    if (resData && resData.token) {
      localStorage.setItem("token", resData.token);

      const serverUser = resData.user || {};
      const userRole = (serverUser.role || "Agent").toLowerCase();

      const displayName =
        serverUser.companyName ||
        `${serverUser.firstName || ""} ${serverUser.lastName || ""}`.trim() ||
        serverUser.username ||
        "User";

      const userData = {
        ...serverUser,
        username: displayName,
        email: serverUser.email,
        role: serverUser.role || "Agent",
        id: serverUser.id || serverUser._id,
        subscribed: serverUser.subscribed,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("user_role", userRole);

      if (serverUser.email) {
        localStorage.setItem("user_email", serverUser.email);
      }

      if (resData.branding) {
        const vendorName = resData.branding.companyName || resData.branding.vendorTitle || displayName;
        const vendorLogo = resData.branding.logoUrl;

        const brandingData = {
          companyName: vendorName,
          logoUrl: vendorLogo || "/default-logo.png",
          primaryColor: resData.branding.primaryColor || "#2563eb",
        };

        localStorage.setItem("cached_branding", JSON.stringify(brandingData));
      }

      window.dispatchEvent(new Event("tenantBrandingUpdated"));
      setShowGlobalLoader(true);

      setTimeout(() => {
        let targetRoute = "/dashboard";
        if (userRole === "admin") {
          targetRoute = "/admin-control-cluster";
        } else if (["manager", "agent"].includes(userRole)) {
          targetRoute = "/dashboard";
        } else {
          targetRoute = "/agent-dashboard";
        }
        window.location.href = targetRoute;
      }, 6000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all security credential input fields.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password,
      };

      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, payload);
      handleSuccessfulLogin(res.data);
    } catch (err) {
      console.error("❌ Login Failure:", err);
      const serverErrorMessage =
        err.response?.data?.message || err.response?.data?.error;
      setError(
        serverErrorMessage || "Authentication rejected. Invalid credentials or server offline."
      );
      setLoading(false);
    }
  };

  // 🌐 REAL GOOGLE POPUP LOGIN HANDLER USING @react-oauth/google
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");
        
        const userInfoRes = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        const { email, given_name, family_name, picture, sub } = userInfoRes.data;

        const res = await axios.post(`${BACKEND_URL}/api/auth/social-login`, {
          provider: "google",
          email,
          firstName: given_name || "Google",
          lastName: family_name || "User",
          profilePic: picture || "",
          providerId: sub
        });

        setLoading(false);
        handleSuccessfulLogin(res.data);
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.message || "Google authentication failed on server.");
      }
    },
    onError: (errorResponse) => {
      console.error("Google Login Error:", errorResponse);
      setError("Google popup login was cancelled or failed.");
      setLoading(false);
    },
  });

  // 🌐 REAL SOCIAL LOGIN HANDLER (Google / Facebook / Apple Flow)
  const handleSocialLogin = (provider) => {
    setError("");
    if (provider === "google") {
      googleLogin();
      return;
    }

    if (provider === "facebook") {
      if (!window.FB) {
        setError("Facebook SDK is loading or unavailable. Please check your network.");
        return;
      }

      setLoading(true);
      window.FB.login(
        async (response) => {
          if (response.authResponse) {
            window.FB.api('/me', { fields: 'id,first_name,last_name,email,picture' }, async (userInfo) => {
              try {
                const res = await axios.post(`${BACKEND_URL}/api/auth/social-login`, {
                  provider: "facebook",
                  email: userInfo.email || `${userInfo.id}@facebook.com`,
                  firstName: userInfo.first_name || "Facebook",
                  lastName: userInfo.last_name || "User",
                  profilePic: userInfo.picture?.data?.url || "",
                  providerId: userInfo.id
                });

                setLoading(false);
                handleSuccessfulLogin(res.data);
              } catch (err) {
                setLoading(false);
                setError(err.response?.data?.message || "Facebook authentication failed on server.");
              }
            });
          } else {
            setLoading(false);
            setError("Facebook popup login was cancelled.");
          }
        },
        { scope: 'email,public_profile' }
      );
      return;
    }

    if (provider === "apple") {
      setLoading(true);
      try {
        const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID || "com.promiapi.auth";
        const redirectUri = window.location.origin + "/login";
        const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code id_token&scope=name email&response_mode=popup`;
        
        const width = 500;
        const height = 600;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        
        window.open(appleAuthUrl, "AppleSignin", `width=${width},height=${height},top=${top},left=${left}`);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError("Apple sign-in popup failed to open.");
      }
    }
  };

  if (showGlobalLoader) {
    return <GlobalLoader />;
  }

  // Motion variants for Chat Bubbles Sequence Animation (with 3.5s pause before restart)
  const chatContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 1.8,
        repeat: Infinity,
        repeatDelay: 3.5
      }
    }
  };

  const bubbleVariants = {
    initial: { opacity: 0, y: 12, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } }
  };

  return (
    <div className="lg-root">
      <style>{css}</style>

      {/* LEFT: 3D scene */}
      <section className="lg-left" onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
        <div className="lg-grid" />
        <div className="lg-blob lg-blob-a" />
        <div className="lg-blob lg-blob-b" />

        <div className="lg-copy" style={{ marginTop: "20px" }}>
          <h1 className="lg-h1">Reply to every customer, around the clock.</h1>
          <p className="lg-sub">
            Manage WhatsApp conversations, campaigns and AI bots from one workspace, built on the official Meta Cloud API.
          </p>
        </div>

        {/* 3D scene */}
        <div className="lg-scene" aria-hidden="true">
          <div className="lg-idle">
            <motion.div className="lg-stack" style={{ rotateX, rotateY }}>
              <div className="lg-plate" />

              <div className="lg-chat" style={{ transform: "translateZ(50px)" }}>
                <div className="lg-chat-head">
                  <span className="lg-avatar">P</span>
                  <div>
                    <div className="lg-chat-name">Your Store</div>
                    <div className="lg-chat-status"><i /> AI assistant online</div>
                  </div>
                </div>

                {/* Animated Chat Body Sequence */}
                <motion.div 
                  className="lg-chat-body"
                  variants={chatContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-in">
                    Is size M available?
                  </motion.div>
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-out">
                    Yes, it's in stock. Want me to confirm your order?
                  </motion.div>
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-in">
                    Yes please.
                  </motion.div>
                  <motion.div variants={bubbleVariants} className="lg-bubble lg-out lg-typing">
                    <b /><b /><b />
                  </motion.div>
                </motion.div>
              </div>

              <div className="lg-stat" style={{ "--tz": "95px" }}>
                <span className="lg-stat-num">128</span>
                <span className="lg-stat-label">orders confirmed today</span>
              </div>

              <div className="lg-chip lg-chip-a" style={{ "--tz": "130px" }}>Replies in under 2 seconds</div>
              <div className="lg-chip lg-chip-b" style={{ "--tz": "115px" }}>Official Meta Cloud API</div>
            </motion.div>
          </div>
        </div>

        <div className="lg-metrics">
          <div><strong>99.9%</strong><span>API uptime</span></div>
          <div><strong>Real-time</strong><span>Analytics</span></div>
        </div>
      </section>

      {/* RIGHT: form */}
      <main className="lg-right">
        <motion.div
          className="lg-card"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <h2 className="lg-title">Welcome back</h2>
          <p className="lg-subtitle">Sign in to your workspace to continue.</p>

          {/* OFFICIAL SOCIAL LOGIN BUTTONS */}
          <div className="lg-social-grid">
            <button type="button" className="lg-social-btn" onClick={() => handleSocialLogin("google")} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.21 21.34 7.27 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.19C.43 8.14 0 9.87 0 12s.43 3.86 1.19 5.39l4.08-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.21 2.66 1.19 6.61l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
              <span>Google</span>
            </button>

            <button type="button" className="lg-social-btn" onClick={() => handleSocialLogin("facebook")} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Facebook</span>
            </button>

            <button type="button" className="lg-social-btn" onClick={() => handleSocialLogin("apple")} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 5.38c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.75 1.41-.59.68-1.1 1.78-.96 2.86 1.05.08 2.12-.5 2.74-1.28z"/></svg>
              <span>Apple</span>
            </button>
          </div>

          <div className="lg-divider"><span>or sign in with email</span></div>

          {error && (
            <div className="lg-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="lg-form">
            <div className="lg-field">
              <label htmlFor="lg-email">Email address</label>
              <div className="lg-input-wrap">
                <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></svg>
                <input
                  id="lg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="lg-field">
              <div className="lg-label-row">
                <label htmlFor="lg-password">Password</label>
                <button type="button" className="lg-link" onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </button>
              </div>
              <div className="lg-input-wrap">
                <svg className="lg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <input
                  id="lg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="lg-submit" disabled={loading}>
              {loading ? (<><span className="lg-spin" /> Signing in…</>) : "Sign in"}
            </button>
          </form>

          <p className="lg-foot">
            New to PromiAPI?
            <button type="button" className="lg-link lg-link-strong" onClick={() => navigate("/register")}>
              Create an account
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

.lg-root { min-height: 100vh; display: flex; background: #f4f7fb; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
.lg-root *, .lg-root *::before, .lg-root *::after { box-sizing: border-box; }
.lg-root button { font-family: inherit; }

/* ---------- LEFT ---------- */
.lg-left { flex: 1.15; position: relative; overflow: hidden; color: #fff; padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px;
  background: linear-gradient(160deg, #050b18 0%, #0a1931 58%, #0b2a52 100%); }
.lg-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 44px 44px; -webkit-mask-image: radial-gradient(circle at 30% 40%, #000 20%, transparent 75%); mask-image: radial-gradient(circle at 30% 40%, #000 20%, transparent 75%); }
.lg-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.lg-blob-a { width: 420px; height: 420px; top: -120px; left: -80px; background: rgba(37,99,235,.32); filter: blur(100px); animation: lgDriftA 14s ease-in-out infinite; }
.lg-blob-b { width: 380px; height: 380px; bottom: -120px; right: -60px; background: rgba(16,185,129,.22); filter: blur(100px); animation: lgDriftB 16s ease-in-out infinite; }

.lg-copy { position: relative; z-index: 2; max-width: 520px; }
.lg-h1 { font-family: 'Sora', system-ui, sans-serif; font-size: 40px; font-weight: 800; line-height: 1.15; letter-spacing: -1.2px; margin: 0 0 16px; }
.lg-sub { font-size: 16px; line-height: 1.65; color: #9fb0c8; margin: 0; max-width: 460px; }

/* 3D scene */
.lg-scene { position: relative; z-index: 2; perspective: 1400px; display: flex; justify-content: center; align-items: center; min-height: 380px; }
.lg-idle { transform-style: preserve-3d; animation: lgIdle 9s ease-in-out infinite; }
.lg-stack { position: relative; width: 420px; height: 350px; transform-style: preserve-3d; }
.lg-plate { position: absolute; inset: 0; border-radius: 28px; background: linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 50px 90px -30px rgba(0,0,0,.7); backdrop-filter: blur(6px); }
.lg-chat { position: absolute; left: 34px; top: 18px; width: 290px; border-radius: 20px; overflow: hidden; background: #0f1b33; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 30px 60px -20px rgba(0,0,0,.65); }
.lg-chat-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #075e54; }
.lg-avatar { width: 32px; height: 32px; border-radius: 50%; background: #128c7e; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.lg-chat-name { font-size: 13px; font-weight: 600; }
.lg-chat-status { font-size: 11px; color: #cde9e3; display: flex; align-items: center; gap: 5px; }
.lg-chat-status i { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; }
.lg-chat-body { padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; background: #ece5dd; min-height: 215px; justify-content: flex-end; }
.lg-bubble { max-width: 82%; padding: 8px 11px; font-size: 12px; line-height: 1.4; color: #111827; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,.1); }
.lg-in { align-self: flex-start; background: #fff; border-bottom-left-radius: 3px; }
.lg-out { align-self: flex-end; background: #dcf8c6; border-bottom-right-radius: 3px; }
.lg-typing { display: flex; gap: 4px; padding: 11px 13px; width: fit-content; }
.lg-typing b { width: 6px; height: 6px; border-radius: 50%; background: #075e54; opacity: .5; animation: lgDot 1.2s infinite ease-in-out; }
.lg-typing b:nth-child(2) { animation-delay: .15s; }
.lg-typing b:nth-child(3) { animation-delay: .3s; }

/* Stat box positioned nicely below chat UI */
.lg-stat { position: absolute; right: 10px; bottom: -15px; padding: 14px 18px; border-radius: 16px; background: rgba(15,27,51,.95); border: 1px solid rgba(255,255,255,.16); box-shadow: 0 25px 50px rgba(0,0,0,.55); display: flex; flex-direction: column; z-index: 10; animation: lgFloat 5s ease-in-out infinite; }
.lg-stat-num { font-family: 'Sora', system-ui, sans-serif; font-size: 28px; font-weight: 800; line-height: 1; color: #34d399; }
.lg-stat-label { font-size: 11.5px; color: #9fb0c8; margin-top: 5px; }
.lg-chip { position: absolute; padding: 9px 13px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,.4); }
.lg-chip-a { top: -14px; right: -6px; background: #2563eb; animation: lgFloat 4.4s ease-in-out infinite .4s; }
.lg-chip-b { bottom: -20px; left: 10px; background: #0f766e; animation: lgFloat 4.9s ease-in-out infinite .9s; }

.lg-metrics { position: relative; z-index: 2; display: flex; gap: 40px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.1); }
.lg-metrics div { display: flex; flex-direction: column; gap: 3px; }
.lg-metrics strong { font-family: 'Sora', system-ui, sans-serif; font-size: 18px; font-weight: 700; }
.lg-metrics span { font-size: 12.5px; color: #7f93b0; }

/* ---------- RIGHT ---------- */
.lg-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 32px; }
.lg-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 44px 40px; box-shadow: 0 30px 60px -30px rgba(15,23,42,.18); }
.lg-title { font-family: 'Sora', system-ui, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -.6px; margin: 0 0 8px; }
.lg-subtitle { font-size: 15px; color: #64748b; margin: 0 0 20px; }

/* Social Buttons Grid Styling */
.lg-social-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.lg-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all .2s ease;
}

.lg-social-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.lg-social-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.lg-divider {
  display: flex;
  align-items: center;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 16px 0;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.lg-divider::before, .lg-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.lg-divider span {
  padding: 0 10px;
}

.lg-error { display: flex; gap: 10px; align-items: flex-start; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.45; margin-bottom: 22px; }
.lg-error svg { flex-shrink: 0; margin-top: 1px; }
.lg-form { display: flex; flex-direction: column; gap: 20px; }
.lg-field { display: flex; flex-direction: column; gap: 8px; }
.lg-field label { font-size: 14px; font-weight: 600; color: #334155; }
.lg-label-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.lg-input-wrap { position: relative; display: flex; align-items: center; }
.lg-ico { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; transition: color .2s; }
.lg-input-wrap input { width: 100%; height: 48px; padding: 0 44px 0 42px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-size: 15px; color: #0f172a; outline: none; transition: border-color .2s, box-shadow .2s; }
.lg-input-wrap input::placeholder { color: #94a3b8; }
.lg-input-wrap input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.lg-input-wrap:focus-within .lg-ico { color: #2563eb; }
.lg-input-wrap input:disabled { background: #f1f5f9; cursor: not-allowed; }
.lg-eye { position: absolute; right: 6px; width: 36px; height: 36px; border: none; background: transparent; color: #64748b; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.lg-eye:hover { background: #f1f5f9; color: #0f172a; }
.lg-link { background: none; border: none; padding: 0; color: #2563eb; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.lg-link:hover { text-decoration: underline; }
.lg-link-strong { font-size: 14px; margin-left: 6px; }
.lg-submit { height: 50px; border: none; border-radius: 12px; color: #fff; font-size: 15.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 10px 22px -8px rgba(37,99,235,.65); transition: transform .15s, box-shadow .2s, opacity .2s; }
.lg-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px -8px rgba(37,99,235,.7); }
.lg-submit:active:not(:disabled) { transform: translateY(0) scale(.98); }
.lg-submit:disabled { opacity: .75; cursor: not-allowed; }
.lg-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: lgSpin .7s linear infinite; }
.lg-foot { text-align: center; font-size: 14px; color: #64748b; margin: 26px 0 0; }
.lg-root :focus-visible { outline: 3px solid rgba(37,99,235,.55); outline-offset: 2px; }
.lg-input-wrap input:focus-visible { outline: none; }

@keyframes lgDriftA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-25px) scale(1.1); } }
@keyframes lgDriftB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-35px,25px) scale(1.06); } }
@keyframes lgIdle { 0%,100% { transform: rotateY(-5deg) rotateX(2deg); } 50% { transform: rotateY(5deg) rotateX(-2deg); } }
@keyframes lgFloat { 0%,100% { transform: translateZ(var(--tz)) translateY(0); } 50% { transform: translateZ(var(--tz)) translateY(-10px); } }
@keyframes lgDot { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
@keyframes lgSpin { to { transform: rotate(360deg); } }

/* ---------- TABLET ---------- */
@media (max-width: 1100px) {
  .lg-left { padding: 40px 36px; }
  .lg-h1 { font-size: 34px; }
  .lg-stack { transform-origin: center; }
  .lg-scene { zoom: .88; }
}

/* ---------- STACKED (small tablet + phone) ---------- */
@media (max-width: 900px) {
  .lg-root { flex-direction: column; }
  .lg-left { flex: none; padding: 28px 24px 30px; gap: 14px; }
  .lg-scene, .lg-metrics, .lg-sub { display: none; }
  .lg-h1 { font-size: 26px; margin: 0; letter-spacing: -.6px; }
  .lg-right { padding: 28px 20px 40px; align-items: flex-start; }
  .lg-card { max-width: 520px; }
}

/* ---------- PHONE ---------- */
@media (max-width: 520px) {
  .lg-left { padding: 22px 20px 24px; }
  .lg-h1 { font-size: 22px; }
  .lg-brand-name { font-size: 20px; }
  .lg-right { padding: 0; background: #fff; align-items: stretch; }
  .lg-card { max-width: none; border: none; border-radius: 0; box-shadow: none; padding: 28px 20px 36px; }
  .lg-title { font-size: 24px; }
  .lg-input-wrap input { font-size: 16px; }
  .lg-social-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .lg-blob, .lg-idle, .lg-stat, .lg-chip, .lg-typing b { animation: none !important; }
}
`;

export default Login;