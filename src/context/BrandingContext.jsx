import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BrandingContext = createContext();

const DEFAULT_BRANDING = {
  companyName: "PromiAPI",
  logoUrl: "/default-logo.png",
  primaryColor: "#2563eb",
};

const getInitialBranding = () => {
  try {
    const cached = localStorage.getItem("cached_branding");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Error reading cached branding:", e);
  }
  return DEFAULT_BRANDING;
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(getInitialBranding);
  const [loading, setLoading] = useState(true); // Default loading state set to true

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const currentDomain = window.location.hostname;

      const headers = {};
      if (token && token.trim() !== "" && token !== "null" && token !== "undefined") {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        setBranding(DEFAULT_BRANDING);
        localStorage.removeItem("cached_branding");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/tenant/config?domain=${currentDomain}`,
        { headers }
      );

      if (res.data?.branding) {
        const vendorName = res.data.branding.companyName || res.data.branding.vendorTitle;
        const vendorLogo = res.data.branding.logoUrl;

        const updatedBranding = {
          companyName:
            vendorName && vendorName.trim() !== ""
              ? vendorName
              : DEFAULT_BRANDING.companyName,

          logoUrl:
            vendorLogo && vendorLogo.trim() !== ""
              ? vendorLogo.startsWith("http") || vendorLogo.startsWith("data:")
                ? vendorLogo
                : vendorLogo
              : DEFAULT_BRANDING.logoUrl,

          primaryColor: res.data.branding.primaryColor || DEFAULT_BRANDING.primaryColor,
        };

        setBranding(updatedBranding);
        localStorage.setItem("cached_branding", JSON.stringify(updatedBranding));
      } else {
        setBranding(DEFAULT_BRANDING);
      }
    } catch (err) {
      console.error("Error fetching tenant branding:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();

    const handleBrandingUpdate = () => fetchBranding();
    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "user") {
        fetchBranding();
      }
    };

    window.addEventListener("tenantBrandingUpdated", handleBrandingUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("tenantBrandingUpdated", handleBrandingUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);