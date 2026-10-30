import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { CountrySelect, BUSINESS_TYPES } from "./CountrySelect";

function Register() {
  const [formData, setFormData] = useState({
    companyName: "", firstName: "", lastName: "",
    username: "", phone: "",
    email: "", password: "", confirmPassword: "",
    teamSize: "1-5", businessType: "", website: "",
    addressLine: "", city: "", state: "", postalCode: "", country: "Pakistan",
  });
  const [step, setStep] = useState(1);
  const rootRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔑 Dynamic Backend Base URL
  const BACKEND_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
    "http://localhost:5000";

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper function to handle post-registration redirection based on missing details
  const handlePostAuthRedirection = (userData) => {
    if (!userData.companyName || !userData.phone) {
      window.location.href = "/onboarding";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const goTop = () => {
    if (rootRef.current && rootRef.current.scrollTo) rootRef.current.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep1 = () => {
    if (formData.password !== formData.confirmPassword) return "Passwords do not match!";
    return "";
  };

  const validateStep2 = () => {
    const digits = formData.phone.replace(/\D/g, "");
    if (!formData.companyName.trim() || !formData.phone.trim()) {
      return "Please fill in your company name and WhatsApp number.";
    }
    if (digits.length < 7 || digits.length > 15) {
      return "Please enter a valid WhatsApp number with country code.";
    }
    if (!formData.businessType) return "Please select your business type.";
    if (!formData.addressLine.trim() || !formData.city.trim() || !formData.country) {
      return "Please complete your business address (street, city and country).";
    }
    const site = formData.website.trim();
    if (site && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(site)) {
      return "Please enter a valid website URL or leave it empty.";
    }
    return "";
  };

  const handleBack = () => {
    setError("");
    setStep(1);
    goTop();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // ---- Step 1 -> validate, then go to Step 2 ----
    if (step === 1) {
      const msg = validateStep1();
      if (msg) { setError(msg); return; }
      setStep(2);
      goTop();
      return;
    }

    // ---- Step 2 -> validate everything, then register ----
    const msg = validateStep1() || validateStep2();
    if (msg) { setError(msg); return; }

    let timezone = "UTC";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_) { /* keep UTC */ }

    const payload = {
      ...formData,
      companyName: formData.companyName.trim(),
      phone: formData.phone.trim(),
      website: formData.website.trim(),
      addressLine: formData.addressLine.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode.trim(),
      timezone,
    };

    setLoading(true);
    axios
      .post(`${BACKEND_URL}/api/auth/register`, payload)
      .then((res) => {
        setLoading(false);
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("user_role", res.data.user.role || "user");
            localStorage.setItem("user_email", res.data.user.email || formData.email);
          }
          handlePostAuthRedirection(res.data.user || formData);
        } else {
          window.location.href = "/onboarding";
        }
      })
      .catch((err) => {
        setLoading(false);
        const msg = err.response?.data?.message || "Registration failed. Please try again.";
        setError(msg);
        // Email / username problems live on Step 1 -> take the user back there
        if (/already exists/i.test(msg)) {
          setStep(1);
          goTop();
        }
      });
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
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("user_role", res.data.user.role || "user");
            localStorage.setItem("user_email", res.data.user.email || email);
            handlePostAuthRedirection(res.data.user);
          } else {
            window.location.href = "/onboarding";
          }
        }
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

  // 🌐 REAL SOCIAL LOGIN HANDLER (Google / Facebook / Apple SDK Flow)
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
                if (res.data.token) {
                  localStorage.setItem("token", res.data.token);
                  if (res.data.user) {
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                    localStorage.setItem("user_role", res.data.user.role || "user");
                    localStorage.setItem("user_email", res.data.user.email || userInfo.email);
                    handlePostAuthRedirection(res.data.user);
                  } else {
                    window.location.href = "/onboarding";
                  }
                }
              } catch (err) {
                setLoading(false);
                setError(err.response?.data?.message || "Facebook authentication failed.");
              }
            });
          } else {
            setLoading(false);
            setError("Facebook login was cancelled.");
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
        const redirectUri = window.location.origin + "/register";
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

  const pw = formData.password;
  const score = pw
    ? [pw.length >= 8, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length
    : 0;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = ["#e2e8f0", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][score];
  const confirmTouched = formData.confirmPassword.length > 0;
  const passwordsMatch = formData.password === formData.confirmPassword;

  const field = (name, label, placeholder, autoComplete, type = "text") => (
    <div className="rg-field">
      <label htmlFor={`rg-${name}`}>{label}</label>
      <input
        id={`rg-${name}`}
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={!["website", "state", "postalCode"].includes(name)}
        inputMode={type === "tel" ? "tel" : name === "website" ? "url" : undefined}
        value={formData[name]}
        onChange={handleChange}
        disabled={loading}
      />
    </div>
  );

  const selectField = (name, label, options, placeholder) => (
    <div className="rg-field">
      <label htmlFor={`rg-${name}`}>{label}</label>
      <select
        id={`rg-${name}`}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        disabled={loading}
        required
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const eye = (
    <button
      type="button"
      className="rg-eye"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Hide passwords" : "Show passwords"}
    >
      {showPassword ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  );

  const orbit = [
    { name: "WhatsApp", color: "#25D366" },
    { name: "Messenger", color: "#0084FF" },
    { name: "Instagram", color: "#d62976" },
    { name: "AI bots", color: "#a78bfa" },
    { name: "Campaigns", color: "#f59e0b" },
    { name: "Team inbox", color: "#14b8a6" },
  ];

  return (
    <div className="rg-root" ref={rootRef}>
      <style>{css}</style>

      {/* LEFT PANEL */}
      <section className="rg-left">
        <div className="rg-grid" />
        <div className="rg-blob rg-blob-a" />
        <div className="rg-blob rg-blob-b" />

        <div className="rg-brand">
          <div className="rg-logo">
            <img 
              src="/src/assets/logo.png" 
              alt="PromiAPI" 
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "block";
              }} 
            />
            <span className="rg-logo-fallback" style={{ display: "none" }}>P</span>
            <span className="rg-logo-dot" />
          </div>
          <span className="rg-brand-name">PromiAPI</span>
        </div>

        <div className="rg-copy">
          <h1 className="rg-h1">Set up your workspace in minutes.</h1>
          <p className="rg-sub">
            Connect your WhatsApp Business number, turn on AI replies, and invite your team seamlessly.
          </p>
        </div>

        {/* ORBIT ANIMATION SCENE */}
        <div className="rg-scene" aria-hidden="true">
          <div className="rg-orbit-wrapper">
            <div className="rg-path" />
            
            {/* CENTRAL LOGO CORE */}
            <div className="rg-core">
              <span className="rg-pulse" />
              <span className="rg-pulse rg-pulse-2" />
              <div className="rg-core-in">
                <img 
                  src="/src/assets/logo.png" 
                  alt="PromiAPI Logo" 
                  className="rg-core-logo" 
                  onError={(e) => {
                    e.target.style.display = "none";
                    const fallbackText = e.target.nextElementSibling;
                    if (fallbackText) fallbackText.style.display = "block";
                  }} 
                />
                <span className="rg-core-text" style={{ display: "none" }}>P</span>
              </div>
            </div>

            {/* ROTATING ORBIT NODES */}
            <div className="rg-orbit-ring">
              {orbit.map((o, i) => (
                <div className={`rg-node rg-node-${i}`} key={o.name}>
                  <div className="rg-pill">
                    <i style={{ background: o.color }} />
                    {o.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEPS */}
        <ol className="rg-steps">
          <li><b>1</b><span>Create workspace</span></li>
          <li><b>2</b><span>Connect number</span></li>
          <li><b>3</b><span>Launch AI bot</span></li>
        </ol>
      </section>

      {/* RIGHT PANEL - FORM */}
      <main className="rg-right">
        <div className="rg-card">
          <div className="rg-progress" aria-label={`Step ${step} of 2`}>
            <span className="on" />
            <span className={step >= 2 ? "on" : ""} />
          </div>
          <div className="rg-stepno">Step {step} of 2</div>
          <h2 className="rg-title">{step === 1 ? "Create your account" : "Tell us about your business"}</h2>
          <p className="rg-subtitle">
            {step === 1
              ? "Enter your details or sign up instantly with official providers."
              : "Add your company details so your workspace looks verified and professional."}
          </p>

          {step === 1 && (
            <>
              {/* OFFICIAL SOCIAL LOGIN BUTTONS */}
              <div className="rg-social-grid">
                <button type="button" className="rg-social-btn" onClick={() => handleSocialLogin("google")} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.21 21.34 7.27 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.19C.43 8.14 0 9.87 0 12s.43 3.86 1.19 5.39l4.08-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.21 2.66 1.19 6.61l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  <span>Google</span>
                </button>

                <button type="button" className="rg-social-btn" onClick={() => handleSocialLogin("facebook")} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span>Facebook</span>
                </button>

                <button type="button" className="rg-social-btn" onClick={() => handleSocialLogin("apple")} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 5.38c.65-.79 1.09-1.89.97-2.99-.94.04-2.08.63-2.75 1.41-.59.68-1.1 1.78-.96 2.86 1.05.08 2.12-.5 2.74-1.28z"/></svg>
                  <span>Apple</span>
                </button>
              </div>

              <div className="rg-divider"><span>or register with email</span></div>
            </>
          )}

          {error && (
            <div className="rg-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="rg-form">
            {step === 1 && (
              <div className="rg-step" key="step-1">
                <div className="rg-section">About you</div>
                <div className="rg-row rg-keep">
                  {field("firstName", "First name", "John", "given-name")}
                  {field("lastName", "Last name", "Doe", "family-name")}
                </div>
                {field("username", "Username", "usama134", "username")}

                <div className="rg-section">Sign-in details</div>
                {field("email", "Email address", "name@company.com", "email", "email")}

                <div className="rg-row">
                  <div className="rg-field">
                    <label htmlFor="rg-password">Password</label>
                    <div className="rg-pw">
                      <input
                        id="rg-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {eye}
                    </div>
                  </div>
                  <div className="rg-field">
                    <label htmlFor="rg-confirmPassword">Confirm password</label>
                    <input
                      id="rg-confirmPassword"
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      className={confirmTouched ? (passwordsMatch ? "rg-ok" : "rg-bad") : ""}
                    />
                  </div>
                </div>

                <div className="rg-meter">
                  <div className="rg-bars">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} style={{ background: score >= n ? strengthColor : "#e2e8f0" }} />
                    ))}
                  </div>
                  <span className="rg-meter-text" style={{ color: score ? strengthColor : "#94a3b8" }}>
                    {score ? `${strengthLabel} password` : "Use 8+ chars with letters, numbers & symbols"}
                  </span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rg-step" key="step-2">
                <div className="rg-section">Your business</div>
                {field("companyName", "Company / Store name", "e.g. PromiAPI SaaS", "organization")}
                {selectField("businessType", "Business type", BUSINESS_TYPES.map((t) => ({ value: t, label: t })), "Select your industry")}
                <div className="rg-row">
                  {field("phone", "WhatsApp number", "+92 300 1234567", "tel", "tel")}
                  {selectField("teamSize", "Team size", [
                    { value: "1-5", label: "1 - 5" },
                    { value: "6-20", label: "6 - 20" },
                    { value: "21-50", label: "21 - 50" },
                    { value: "50+", label: "50+" },
                  ])}
                </div>

                <div className="rg-section">Business address</div>
                {field("addressLine", "Street address", "Shop / Office no., street, area", "street-address")}
                <div className="rg-row rg-keep">
                  {field("city", "City", "e.g. Lahore", "address-level2")}
                  {field("state", "State / Province", "e.g. Punjab", "address-level1")}
                </div>
                <div className="rg-row">
                  {field("postalCode", "Postal code", "e.g. 54000", "postal-code")}
                  <div className="rg-field">
                    <label htmlFor="rg-country">Country</label>
                    <CountrySelect
                      id="rg-country"
                      size="sm"
                      value={formData.country}
                      onChange={(v) => setFormData((f) => ({ ...f, country: v }))}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="rg-field">
                  <label htmlFor="rg-website">Website <span className="rg-opt">(optional)</span></label>
                  <input
                    id="rg-website"
                    type="text"
                    name="website"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="www.yourstore.com"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="rg-actions">
              {step === 2 && (
                <button type="button" className="rg-back" onClick={handleBack} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Back
                </button>
              )}
              <button type="submit" disabled={loading} className="rg-submit">
                {loading ? (<><span className="rg-spin" /> Creating workspace…</>) : step === 1 ? (<>Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>) : "Create account"}
              </button>
            </div>
          </form>

          <p className="rg-foot">
            Already have an account?
            <button type="button" className="rg-link" onClick={() => (window.location.href = "/login")}>
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

.rg-root {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  overflow-y: auto;
  display: flex;
  background: #f4f7fb;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

.rg-root *, .rg-root *::before, .rg-root *::after { box-sizing: border-box; }

.rg-left {
  flex: 1;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: hidden;
  color: #fff;
  padding: 24px 32px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(165deg, #050b18 0%, #08203a 55%, #0a3a46 100%);
}

.rg-grid {
  position: absolute; inset: 0; opacity: .4; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 36px 36px;
}

.rg-blob { position: absolute; border-radius: 50%; pointer-events: none; }
.rg-blob-a { width: 350px; height: 350px; top: -100px; right: -60px; background: rgba(13,148,136,.25); filter: blur(90px); }
.rg-blob-b { width: 320px; height: 320px; bottom: -100px; left: -60px; background: rgba(37,99,235,.25); filter: blur(90px); }

.rg-brand { position: relative; z-index: 2; display: flex; align-items: center; gap: 10px; }
.rg-logo {
  position: relative; width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
}
.rg-logo img { height: 24px; width: 24px; object-fit: contain; }
.rg-logo-fallback { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 18px; color: #fff; position: absolute; }
.rg-logo-dot { position: absolute; right: 2px; bottom: 2px; width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
.rg-brand-name { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; }

.rg-copy { position: relative; z-index: 2; max-width: 440px; margin-top: 4px; }
.rg-h1 { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -.8px; margin: 0 0 6px; }
.rg-sub { font-size: 14px; line-height: 1.4; color: #9fb7c8; margin: 0; }

.rg-scene {
  position: relative; z-index: 2; flex: 1;
  display: flex; align-items: center; justify-content: center;
}

.rg-orbit-wrapper {
  position: relative; width: 220px; height: 220px;
  display: flex; align-items: center; justify-content: center;
}

.rg-path {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1.5px dashed rgba(255, 255, 255, 0.2);
}

.rg-core {
  position: relative; width: 56px; height: 56px; z-index: 5;
  display: flex; align-items: center; justify-content: center;
}

.rg-core-in {
  position: absolute; inset: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #0b132b; 
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 30px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(37, 99, 235, 0.3);
}

.rg-core-logo { width: 30px; height: 30px; object-fit: contain; }
.rg-core-text { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 18px; color: #fff; }

.rg-pulse {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid rgba(96, 165, 250, 0.6);
  animation: rgPulse 3s ease-out infinite;
}
.rg-pulse-2 { animation-delay: 1.5s; }

.rg-orbit-ring {
  position: absolute; inset: 0; border-radius: 50%;
  animation: rgRotateOrbit 24s linear infinite;
}

.rg-node {
  position: absolute; top: 50%; left: 50%;
  margin-top: -14px; margin-left: -44px;
}

.rg-node-0 { transform: rotate(0deg) translate(110px) rotate(0deg); }
.rg-node-1 { transform: rotate(60deg) translate(110px) rotate(-60deg); }
.rg-node-2 { transform: rotate(120deg) translate(110px) rotate(-120deg); }
.rg-node-3 { transform: rotate(180deg) translate(110px) rotate(-180deg); }
.rg-node-4 { transform: rotate(240deg) translate(110px) rotate(-240deg); }
.rg-node-5 { transform: rotate(300deg) translate(110px) rotate(-300deg); }

.rg-pill {
  display: flex; align-items: center; gap: 6px; white-space: nowrap;
  padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; color: #fff;
  background: rgba(10, 25, 49, 0.9); border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 6px 16px rgba(0,0,0,0.3);
  animation: rgCounterRotate 24s linear infinite;
}
.rg-pill i { width: 7px; height: 7px; border-radius: 50%; }

.rg-steps {
  position: relative; z-index: 2; list-style: none; margin: 0; padding: 8px 0 0;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  border-top: 1px solid rgba(255,255,255,.12);
}
.rg-steps li { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
.rg-steps b {
  width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 11px; background: rgba(255,255,255,.1); color: #cbd5e1;
}

.rg-right {
  flex: 1.2; min-height: 100vh;
  display: flex; align-items: center; justify-content: center; padding: 24px 32px;
}

.rg-card {
  width: 100%; max-width: 520px; background: #fff; border: 1px solid #e2e8f0;
  border-radius: 20px; padding: 28px 34px; box-shadow: 0 20px 40px -20px rgba(15,23,42,.12);
}

.rg-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; margin: 0 0 2px; }
.rg-subtitle { font-size: 13.5px; color: #64748b; margin: 0 0 16px; }

.rg-social-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.rg-social-btn {
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

.rg-social-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.rg-social-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.rg-divider {
  display: flex;
  align-items: center;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 14px 0;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.rg-divider::before, .rg-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.rg-divider span {
  padding: 0 10px;
}

.rg-error {
  display: flex; gap: 8px; align-items: center; background: #fef2f2;
  border: 1px solid #fecaca; color: #b91c1c; padding: 10px 14px;
  border-radius: 10px; font-size: 13px; margin-bottom: 12px;
}

.rg-form { display: flex; flex-direction: column; gap: 10px; }

.rg-section {
  display: flex; align-items: center; gap: 8px; font-size: 11px;
  font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px;
}
.rg-section::after { content: ""; flex: 1; height: 1px; background: #f1f5f9; }

.rg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.rg-field { display: flex; flex-direction: column; gap: 3px; }
.rg-field label { font-size: 12px; font-weight: 600; color: #334155; }
.rg-field input {
  width: 100%; height: 38px; padding: 0 12px; border-radius: 8px;
  border: 1px solid #cbd5e1; background: #fff; font-size: 13.5px; color: #0f172a; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.rg-field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.rg-field input.rg-ok { border-color: #10b981; }
.rg-field input.rg-bad { border-color: #f87171; }

.rg-field select {
  width: 100%; height: 38px; padding: 0 34px 0 12px; border-radius: 8px;
  border: 1px solid #cbd5e1; background-color: #fff; font-size: 13.5px; color: #0f172a; outline: none;
  font-family: inherit; cursor: pointer; appearance: none; -webkit-appearance: none; text-overflow: ellipsis;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  transition: border-color .15s, box-shadow .15s;
}
.rg-field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.rg-field select:disabled { background-color: #f1f5f9; cursor: not-allowed; }
.rg-opt { font-weight: 400; color: #94a3b8; font-size: 11.5px; }

.rg-progress { display: flex; gap: 6px; margin-bottom: 10px; }
.rg-progress span { flex: 1; height: 4px; border-radius: 99px; background: #e2e8f0; transition: background .3s; }
.rg-progress span.on { background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%); }
.rg-stepno { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; }
.rg-step { display: flex; flex-direction: column; gap: 10px; animation: rgStepIn .35s ease-out; }
.rg-row .rg-field { min-width: 0; }
.rg-actions { display: flex; gap: 10px; margin-top: 4px; }
.rg-actions .rg-submit { flex: 1; margin-top: 0; }
.rg-back {
  height: 42px; padding: 0 18px; border-radius: 9px; border: 1px solid #cbd5e1; background: #fff;
  color: #334155; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px; transition: background .2s, border-color .2s;
}
.rg-back:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
.rg-back:disabled { opacity: .6; cursor: not-allowed; }
@keyframes rgStepIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }

.rg-pw { position: relative; display: flex; align-items: center; }
.rg-pw input { padding-right: 36px; }
.rg-eye {
  position: absolute; right: 4px; width: 30px; height: 30px; border: none;
  background: transparent; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.rg-meter { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.rg-bars { display: flex; gap: 4px; }
.rg-bars span { width: 24px; height: 3.5px; border-radius: 2px; }
.rg-meter-text { font-size: 11px; font-weight: 500; }

.rg-submit {
  margin-top: 4px; height: 42px; border: none; border-radius: 9px; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%);
  box-shadow: 0 6px 14px -3px rgba(37,99,235,.4);
}
.rg-submit { font-family: inherit; }
.rg-submit:hover:not(:disabled) { transform: translateY(-1px); }
.rg-submit:disabled { opacity: .7; cursor: not-allowed; }

.rg-spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: rgSpinBtn .7s linear infinite; }

.rg-foot { text-align: center; font-size: 13px; color: #64748b; margin: 10px 0 0; }
.rg-link { background: none; border: none; padding: 0; margin-left: 4px; color: #2563eb; font-weight: 600; cursor: pointer; }

@keyframes rgRotateOrbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rgCounterRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes rgPulse {
  0% { transform: scale(1); opacity: .7; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes rgSpinBtn { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .rg-root { flex-direction: column; height: auto; max-height: none; }
  .rg-left { height: auto; position: relative; padding: 24px; }
  .rg-scene, .rg-steps { display: none; }
  .rg-right { height: auto; padding: 24px 16px; }
  .rg-social-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .rg-right { padding: 0; background: #fff; align-items: stretch; }
  .rg-card { max-width: none; border: none; border-radius: 0; box-shadow: none; padding: 22px 18px 30px; }
  .rg-row { grid-template-columns: 1fr; gap: 10px; }
  .rg-row.rg-keep { grid-template-columns: 1fr 1fr; gap: 10px; }
  .rg-field input, .rg-field select { height: 44px; font-size: 16px; }
  .rg-submit, .rg-back { height: 46px; }
  .rg-social-btn { height: 44px; }
}
`;

export default Register;