import React from "react";
import { useBranding } from "../context/BrandingContext";

const Navbar = () => {
  const { branding, loading } = useBranding();

  if (loading) {
    return <nav style={{ padding: "15px" }}>Loading brand settings...</nav>;
  }

  return (
    <nav className="app-navbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb"
      }}
    >
      <style>{`
        .app-navbar {
          min-height: 72px;
          gap: 20px;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 4px 18px rgba(15, 23, 42, .05);
        }
        .app-navbar__brand {
          min-width: 0;
          flex: 1;
        }
        .app-navbar__logo {
          width: auto;
          max-width: 180px;
          height: 40px;
        }
        .app-navbar__company {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .app-navbar__campaign {
          white-space: nowrap;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .app-navbar__campaign:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, .14);
        }
        @media (max-width: 700px) {
          .app-navbar { padding: 12px 16px !important; min-height: 64px; gap: 12px; }
          .app-navbar__logo { height: 34px !important; max-width: 120px; }
          .app-navbar__company { font-size: 1rem !important; }
          .app-navbar__campaign { padding: 9px 12px !important; font-size: 11px; }
        }
        @media (max-width: 460px) {
          .app-navbar { padding: 10px 12px !important; }
          .app-navbar__brand { gap: 8px !important; }
          .app-navbar__company { display: none; }
          .app-navbar__campaign { font-size: 0; width: 40px; height: 40px; padding: 0 !important; border-radius: 12px !important; }
          .app-navbar__campaign::before { content: "↗"; font-size: 19px; line-height: 40px; }
        }
      `}</style>
      {/* Client Ka Dynamic Logo aur Company Name */}
      <div className="app-navbar__brand" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src={branding.logoUrl}
          alt={branding.companyName}
          className="app-navbar__logo"
          style={{ height: "40px", objectFit: "contain" }}
        />
        <span className="app-navbar__company" style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#1f2937" }}>
          {branding.companyName}
        </span>
      </div>

      {/* Dynamic Button Color (CSS Variable ya Direct Inline Style) */}
      <button className="app-navbar__campaign"
        style={{
          backgroundColor: branding.primaryColor, // Direct Dynamic Color
          color: "#ffffff",
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600"
        }}
      >
        Send WhatsApp Campaign
      </button>
    </nav>
  );
};

export default Navbar;