import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function PublicHeader({ toggleTheme, isDarkMode }) {
  const navigate = useNavigate();

  // Dynamic Styles based on Theme
  const navBackground = isDarkMode ? "rgba(10, 25, 49, 0.9)" : "rgba(255, 255, 255, 0.95)";
  const textColor = isDarkMode ? "#e2e8f0" : "#4a5568";
  const brandColor = isDarkMode ? "#fff" : "#0a1931";
  const borderColor = isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0";

  return (
    <motion.nav
      className="public-header"
      style={{ ...styles.nav, background: navBackground, borderBottom: `1px solid ${borderColor}` }} 
      initial={{ y: -50 }} 
      animate={{ y: 0 }}
    >
      <style>{`
        .public-header {
          gap: 24px;
          box-shadow: 0 5px 24px rgba(15, 23, 42, .06);
          transition: background .2s ease, border-color .2s ease;
        }
        .public-header__brand {
          flex: 0 0 auto;
        }
        .public-header__links {
          flex: 1;
          justify-content: center;
          min-width: 0;
        }
        .public-header__link {
          transition: color .2s ease, transform .2s ease;
          white-space: nowrap;
        }
        .public-header__actions {
          flex: 0 0 auto;
        }
        .public-header__theme, .public-header__sign-in, .public-header__get-started {
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .public-header__theme:hover, .public-header__sign-in:hover, .public-header__get-started:hover {
          transform: translateY(-1px);
        }
        .public-header__sign-in:hover { box-shadow: 0 5px 14px rgba(15, 23, 42, .10); }
        .public-header__get-started:hover { box-shadow: 0 7px 18px rgba(37, 99, 235, .28); }
        @media (max-width: 980px) {
          .public-header { padding-left: 28px !important; padding-right: 28px !important; gap: 16px; }
          .public-header__links { gap: 14px !important; }
          .public-header__actions { gap: 9px !important; }
          .public-header__link { font-size: 13px !important; }
        }
        @media (max-width: 760px) {
          .public-header {
            padding: 12px 18px !important;
            flex-wrap: wrap;
            gap: 10px 14px;
          }
          .public-header__brand { flex: 1 1 auto; min-width: 0; }
          .public-header__links {
            order: 3;
            flex: 1 0 100%;
            justify-content: flex-start !important;
            overflow-x: auto;
            scrollbar-width: none;
            padding: 3px 2px 1px;
            gap: 20px !important;
          }
          .public-header__links::-webkit-scrollbar { display: none; }
          .public-header__actions { gap: 8px !important; }
          .public-header__sign-in, .public-header__get-started { padding: 8px 12px !important; font-size: 12px !important; }
        }
        @media (max-width: 460px) {
          .public-header { padding: 10px 12px !important; }
          .public-header__logo { width: 31px !important; }
          .public-header__brand-name { font-size: 18px !important; }
          .public-header__theme { font-size: 18px !important; padding: 2px !important; }
          .public-header__sign-in { font-size: 0 !important; width: 36px; height: 36px; padding: 0 !important; border-radius: 10px !important; }
          .public-header__sign-in::before { content: "↪"; font-size: 18px; }
          .public-header__get-started { font-size: 11px !important; padding: 9px 10px !important; border-radius: 10px !important; }
          .public-header__links { gap: 17px !important; }
        }
      `}</style>
      <div className="public-header__brand" style={styles.brand} onClick={() => navigate("/")}>
        <img className="public-header__logo" src={logo} alt="Logo" style={styles.logo} />
        <span className="public-header__brand-name" style={{ ...styles.brandName, color: brandColor }}>PromiAPI</span>
      </div>

      <div className="public-header__links" style={styles.links}>
        {["Features", "Pricing", "Contact", "Terms", "Policy"].map((item) => (
          <motion.button 
            key={item} 
            className="public-header__link"
            style={{ ...styles.navLink, color: textColor }}
            whileHover={{ scale: 1.1, color: "#2563eb" }}
            onClick={() => navigate(`/#${item.toLowerCase()}`)}
          >
            {item}
          </motion.button>
        ))}
      </div>

      <div className="public-header__actions" style={styles.actions}>
        <motion.button 
          whileHover={{ rotate: 180 }}
          className="public-header__theme"
          style={styles.themeToggle} 
          onClick={toggleTheme}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </motion.button>
        <button className="public-header__sign-in" style={styles.signInBtn} onClick={() => navigate("/login")}>Sign In</button>
        <button className="public-header__get-started" style={styles.getStartedBtn} onClick={() => navigate("/register")}>Get Started</button>
      </div>
    </motion.nav>
  );
}

const styles = {
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 5%", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 1000 },
  brand: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  logo: { width: "38px", height: "38px", objectFit: "contain" },
  brandName: { fontSize: "21px", fontWeight: "800", letterSpacing: "-0.4px" },
  links: { display: "flex", gap: "25px", alignItems: "center" },
  navLink: { background: "none", border: "none", fontSize: "15px", fontWeight: "500", cursor: "pointer" },
  actions: { display: "flex", gap: "15px", alignItems: "center" },
  themeToggle: { background: "none", border: "none", fontSize: "20px", cursor: "pointer" },
  signInBtn: { padding: "9px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "9px", fontWeight: "700", cursor: "pointer", color: "#334155" },
  getStartedBtn: { padding: "9px 17px", background: "linear-gradient(135deg, #2563eb, #4f46e5)", border: "none", borderRadius: "9px", color: "#fff", fontWeight: "700", cursor: "pointer", boxShadow: "0 5px 14px rgba(37,99,235,.20)" },
};

export default PublicHeader;