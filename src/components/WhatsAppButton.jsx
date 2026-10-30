import React from "react";
import { motion } from "framer-motion";

const WhatsAppButton = () => {
  // 🟢 Apna WhatsApp Number yahan country code ke sath daalein (Bina '+' sign ke)
  const whatsappNumber = "03265064865"; 
  const defaultMessage = "Hello! I am interested in your automation services.";

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={styles.floatingBtn}
      title="Chat with us on WhatsApp"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.419h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.874 9.877-9.874 2.636 0 5.114 1.028 6.977 2.893s2.888 4.342 2.887 6.98c-.002 5.446-4.431 9.873-9.854 9.873m0-18.176C6.4 3.625 1.758 8.267 1.758 13.993c0 1.831.478 3.618 1.385 5.196L1.6 24.002l4.945-1.296a10.36 10.36 0 005.503 1.565h.005c5.733 0 10.375-4.642 10.377-10.369 0-2.768-1.079-5.37-3.037-7.329-1.958-1.957-4.561-3.036-7.326-3.036"
          fill="currentColor"
        />
      </svg>
    </motion.a>
  );
};

const styles = {
  floatingBtn: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    backgroundColor: "#25D366",
    color: "#ffffff",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 25px -5px rgba(37, 211, 102, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
    zIndex: 9999,
    cursor: "pointer",
    textDecoration: "none",
  },
};

export default WhatsAppButton;