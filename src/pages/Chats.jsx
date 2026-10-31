import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// 🌐 GLOBAL ACTIVE API URL CONFIGURATION
const API_BASE_URL = "https://api.promiapi.com"; // Replace with your actual API base URL

const cleanIdentifier = (idStr) => String(idStr || "").trim();

// 🟢 SMART DISPLAY HELPER: Clean up technical LIDs and show real 0312... phone numbers in UI
const getCleanDisplayPhone = (idStr) => {
  if (!idStr) return "N/A";
  let str = String(idStr).trim();
  
  // Agar identifier mein '@' ya ':' hai toh clean karein
  str = str.split("@")[0].split(":")[0];
  
  // Agar LID hai ya lamba code hai, to agar 03 ya 92 se milta hua clean number mil jaye toh woh nikal lein
  let clean = str.replace(/\D/g, "");
  if (clean.length >= 10) {
    if (clean.startsWith("923") && clean.length === 12) {
      return "0" + clean.substring(2);
    }
    if (clean.startsWith("3") && clean.length === 10) {
      return "0" + clean;
    }
    return clean;
  }
  
  if (str.includes("lid") || str.length > 15) {
    return "WhatsApp User";
  }
  return str.replace(/@s\.whatsapp\.net|@c\.us|@g\.us/g, "");
};

// Format File Size Helper
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// =========================================================================
// 🎵 AUDIO NOTIFICATION ENGINE
// =========================================================================
let globalAudioCtx = null;
let audioUnlocked = false;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) {
      try {
        globalAudioCtx = new AudioCtor();
      } catch (err) {
        console.log("🔊 AudioContext create error:", err.message);
      }
    }
  }
  return globalAudioCtx;
};

const unlockAudio = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const markUnlocked = () => {
    if (audioUnlocked) return;
    try {
      const silent = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silent;
      src.connect(ctx.destination);
      src.start(0);
      audioUnlocked = true;
    } catch (err) {
      /* ignore */
    }
  };

  if (ctx.state !== "running") {
    ctx.resume().then(markUnlocked).catch((err) => console.log("🔊 Audio resume error:", err.message));
  } else {
    markUnlocked();
  }
};

if (typeof window !== "undefined") {
  ["pointerdown", "touchstart", "mousedown", "click", "keydown"].forEach((evt) =>
    window.addEventListener(evt, unlockAudio, { passive: true })
  );
}

const playTones = (notes) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const run = () => {
      const base = ctx.currentTime + 0.01;
      notes.forEach(({ freq, offset = 0, dur = 0.15, vol = 0.4, type = "sine" }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = base + offset;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
      });
    };

    if (ctx.state === "running") {
      run();
    } else {
      ctx.resume().then(run).catch((err) => console.log("🔊 Sound blocked:", err.message));
    }
  } catch (err) {
    console.log("🔊 Sound failed:", err.message);
  }
};

const playIncomingSound = () => {
  playTones([
    { freq: 880, offset: 0, dur: 0.2, vol: 0.6 },
    { freq: 1175, offset: 0.2, dur: 0.3, vol: 0.6 },
    { freq: 880, offset: 0.5, dur: 0.2, vol: 0.6 }
  ]);
};

const playOutgoingSound = () => {
  playTones([{ freq: 620, offset: 0, dur: 0.14, vol: 0.35 }]);
};

const getChatId = (c) =>
  cleanIdentifier(c?.phone || c?.customerPhone || c?.senderId || c?.igId || c?._id);


// =========================================================================
// ICONS (all use currentColor so they follow the light / dark theme)
// =========================================================================
const Svg = ({ size = 18, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    style={{ flexShrink: 0 }}
    {...rest}
  >
    {children}
  </svg>
);

const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7.5" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>;
const CloseIcon = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const MoreIcon = (p) => <Svg {...p} fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></Svg>;
const SunIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Svg>;
const MoonIcon = (p) => <Svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Svg>;
const UserIcon = (p) => <Svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>;
const ClipIcon = (p) => <Svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></Svg>;
const MicIcon = (p) => <Svg {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></Svg>;
const SendIcon = (p) => <Svg {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Svg>;
const TrashIcon = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>;
const ImageIcon = (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></Svg>;
const VideoIcon = (p) => <Svg {...p}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></Svg>;
const DocIcon = (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="17" y1="17" x2="8" y2="17" /></Svg>;
const VolumeIcon = (p) => <Svg {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></Svg>;
const BackIcon = (p) => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Svg>;
const ArrowDownIcon = (p) => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></Svg>;
const AlertIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Svg>;
const ClockIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const CheckIcon = (p) => <Svg {...p} strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></Svg>;
const DoubleCheckIcon = (p) => <Svg {...p} strokeWidth="2.5"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></Svg>;
const ChatBubbleIcon = (p) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
const MegaphoneIcon = (p) => <Svg {...p}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></Svg>;
const BotIcon = (p) => <Svg {...p}><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V4" /><circle cx="12" cy="3.5" r="1" /><circle cx="9" cy="14" r="1" fill="currentColor" /><circle cx="15" cy="14" r="1" fill="currentColor" /></Svg>;
const ZapIcon = (p) => <Svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>;
const UserCardIcon = (p) => <Svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>;
const CheckSmallIcon = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const QrIcon = (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M20 20v.01M17 17h3v3" /></Svg>;
const ShieldCheckIcon = (p) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Svg>;

// =========================================================================
// BRAND ICONS
// =========================================================================
const WhatsAppIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const MessengerIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0084FF" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.082.3 2.23.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.96 3.125 3.26 5.893-3.26-6.559 6.96z" />
  </svg>
);

const InstagramIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#E1306C" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

// =========================================================================
// CHANNEL / STATUS META
// =========================================================================
const CHANNELS = {
  whatsapp: { label: "WhatsApp", color: "var(--c-wa)", soft: "var(--c-wa-soft)", Icon: WhatsAppIcon },
  instagram: { label: "Instagram", color: "var(--c-ig)", soft: "var(--c-ig-soft)", Icon: InstagramIcon },
  messenger: { label: "Messenger", color: "var(--c-ms)", soft: "var(--c-ms-soft)", Icon: MessengerIcon }
};

const getChannelKey = (channel) => {
  const ch = (channel || "whatsapp").toLowerCase();
  if (ch === "instagram") return "instagram";
  if (ch === "messenger" || ch === "facebook") return "messenger";
  return "whatsapp";
};

const STATUS_META = {
  active: { label: "Active", color: "var(--c-ok)" },
  pending: { label: "Pending", color: "var(--c-warn)" },
  completed: { label: "Completed", color: "var(--c-info)" }
};
const getStatusMeta = (s) => STATUS_META[(s || "active").toLowerCase()] || STATUS_META.active;

const StatusDot = ({ status, size = 8 }) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size, borderRadius: "50%", background: getStatusMeta(status).color, display: "inline-block", flexShrink: 0 }}
  />
);

const ChannelBadge = ({ channel }) => {
  const meta = CHANNELS[getChannelKey(channel)];
  const Icon = meta.Icon;
  return (
    <span style={{ ...styles.pill, background: meta.soft, color: meta.color }}>
      <Icon size={12} /> {meta.label}
    </span>
  );
};

const ChatSourceBadge = ({ chat }) => {
  const src = (chat?.source || chat?.connectionType || chat?.origin || chat?.chatSource || "").toLowerCase();
  const platform = (chat?.channel || chat?.platform || "").toLowerCase();

  const isQr = platform === "whatsapp_qr" || src.includes("qr") || src === "chat_qr" || src === "qr_code" || src === "baileys" || src === "wwebjs";

  if (isQr) {
    return (
      <span style={{ ...styles.pill, background: "var(--c-info-soft)", color: "var(--c-info)" }}>
        <QrIcon size={12} /> QR code
      </span>
    );
  }

  if (platform === "whatsapp" || src === "official_meta" || src === "meta" || platform === "instagram" || platform === "messenger") {
    return (
      <span style={{ ...styles.pill, background: "var(--c-ok-soft)", color: "var(--c-ok)" }}>
        <ShieldCheckIcon size={12} /> Official Meta
      </span>
    );
  }

  return null;
};

const MessageStatusTicks = ({ status, isPending, size = 15 }) => {
  const s = (status || "").toLowerCase();

  if (s === "failed") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--c-danger)", fontWeight: 600, marginLeft: 4 }}>
        <AlertIcon size={12} /> Not sent
      </span>
    );
  }

  if (isPending || s === "sending" || s === "pending") {
    return (
      <span title="Sending" style={{ display: "inline-flex", color: "var(--c-text-3)", marginLeft: 4 }}>
        <ClockIcon size={12} />
      </span>
    );
  }

  if (s === "read" || s === "seen") {
    return (
      <span title="Read" style={{ display: "inline-flex", color: "var(--c-read)", marginLeft: 4 }}>
        <DoubleCheckIcon size={size} />
      </span>
    );
  }

  if (s === "delivered") {
    return (
      <span title="Delivered" style={{ display: "inline-flex", color: "var(--c-text-3)", marginLeft: 4 }}>
        <DoubleCheckIcon size={size} />
      </span>
    );
  }

  return (
    <span title="Sent" style={{ display: "inline-flex", color: "var(--c-text-3)", marginLeft: 4 }}>
      <CheckIcon size={size - 1} />
    </span>
  );
};

// =========================================================================
// AVATAR (photo, or coloured initials when there is no photo)
// =========================================================================
const getInitials = (name) => {
  const clean = String(name || "").trim();
  if (!clean || /^[+\d\s()-]+$/.test(clean)) return "";
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0] ? Array.from(parts[0])[0] : "";
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : "";
  return (first + last).toUpperCase();
};

const hueFromString = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
};

const Avatar = ({ name, src, size = 44, channel }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initials = getInitials(name);
  const hue = hueFromString(String(name || "?"));
  const channelMeta = channel ? CHANNELS[getChannelKey(channel)] : null;
  const ChannelIcon = channelMeta ? channelMeta.Icon : null;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: `hsl(${hue} 38% 44%)`,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.round(size * 0.37),
            fontWeight: 600,
            letterSpacing: "0.02em"
          }}
        >
          {initials || <UserIcon size={Math.round(size * 0.5)} />}
        </div>
      )}
      {ChannelIcon && (
        <span
          style={{
            position: "absolute",
            right: -3,
            bottom: -3,
            width: 19,
            height: 19,
            borderRadius: "50%",
            background: "var(--c-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 2px var(--cr-ring, var(--c-surface))"
          }}
        >
          <ChannelIcon size={11} />
        </span>
      )}
    </div>
  );
};

// =========================================================================
// DATE HELPERS
// =========================================================================
const getDateHeaderLabel = (d) => {
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {})
  });
};

// =========================================================================
// SHARED CONTACT (vCard), AI / AUTO-REPLY & BUTTON HELPERS
// =========================================================================
const parseVcard = (raw) => {
  const text = String(raw || "");
  const fn = (text.match(/^FN[^:\n]*:(.+)$/im) || [])[1];
  const n = (text.match(/^N[^:\n]*:(.+)$/im) || [])[1];
  const name = (fn || (n ? n.replace(/;+/g, " ") : "") || "").trim();
  const phones = [];
  const re = /^(?:item\d+\.)?TEL[^:\n]*:(.+)$/gim;
  let m;
  while ((m = re.exec(text)) !== null) phones.push(m[1].trim());
  return { name, phones };
};

const getContactCards = (msg) => {
  const cards = [];
  const push = (c) => {
    if (!c) return;
    if (typeof c === "string") {
      const parsed = parseVcard(c);
      if (parsed.name || parsed.phones.length) cards.push({ name: parsed.name || "Contact", phones: parsed.phones });
      return;
    }
    const vc = c.vcard || c.vCard ? parseVcard(c.vcard || c.vCard) : { name: "", phones: [] };
    const rawName = typeof c.name === "object" && c.name ? (c.name.formatted_name || c.name.first_name) : c.name;
    const name = rawName || c.displayName || c.fullName || c.formattedName || vc.name;
    let phones = [];
    if (Array.isArray(c.phones)) {
      phones = c.phones.map((x) => (typeof x === "string" ? x : (x.phone || x.wa_id || x.number || ""))).filter(Boolean);
    } else if (c.phone || c.number || c.wa_id) {
      phones = [c.phone || c.number || c.wa_id];
    }
    if (!phones.length) phones = vc.phones;
    if (name || phones.length) cards.push({ name: name || "Contact", phones });
  };

  const src = msg.contacts || msg.sharedContacts || msg.contactCards;
  if (Array.isArray(src)) src.forEach(push);
  else if (src) push(src);
  if (!cards.length && msg.contact) push(msg.contact);
  if (!cards.length && (msg.vcard || msg.vCard)) push(msg.vcard || msg.vCard);
  if (!cards.length && typeof msg.text === "string" && /BEGIN:VCARD/i.test(msg.text)) push(msg.text);
  return cards;
};

const AI_TOKENS = ["ai", "chatbot", "gpt", "llm", "openai", "gemini", "claude", "assistant"];
const AUTO_TOKENS = ["auto", "autoreply", "bot", "automation", "automated", "flow", "workflow"];

// returns "ai" | "auto" | null  (only for our own outgoing messages)
const getReplyKind = (msg) => {
  if (!msg || msg.sender !== "me") return null;
  if (msg.isAI || msg.isAi || msg.aiGenerated || msg.isAiReply || msg.ai_reply) return "ai";
  if (msg.isAutoReply || msg.autoReply || msg.is_auto_reply || msg.isBot) return "auto";
  const fields = [msg.replyType, msg.replySource, msg.generatedBy, msg.senderType, msg.sentBy, msg.origin, msg.messageSource, msg.senderAgentName, msg.source]
    .filter((v) => typeof v === "string");
  const tokens = fields.join(" ").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.some((t) => AI_TOKENS.includes(t))) return "ai";
  if (tokens.some((t) => AUTO_TOKENS.includes(t))) return "auto";
  return null;
};

const getButtonTitle = (btn, idx = 0) => {
  if (typeof btn === "string") return btn;
  return btn?.title || btn?.text || btn?.label || btn?.displayText || btn?.buttonText || btn?.reply?.title || `Option ${idx + 1}`;
};

const getMsgButtons = (msg) => {
  const candidates = [
    msg?.buttons, msg?.interactiveOptions, msg?.autoReplyButtons, msg?.replyButtons, msg?.quickReplies,
    msg?.interactive?.buttons, msg?.interactive?.action?.buttons
  ];
  const found = candidates.find((c) => Array.isArray(c) && c.length > 0);
  return found || [];
};

// customer's tap on a button / list option => { id, title } or null
const getButtonReply = (msg) => {
  if (!msg || msg.sender === "me") return null;
  const br = msg.buttonReply || msg.button_reply || msg.listReply || msg.interactive?.button_reply || msg.interactive?.list_reply;
  if (br) return { id: br.id || br.buttonId || null, title: br.title || br.displayText || br.text || br.selectedDisplayText || "" };
  if (msg.selectedButtonId || msg.selectedButtonTitle || msg.selectedDisplayText || msg.buttonText) {
    return { id: msg.selectedButtonId || null, title: msg.selectedButtonTitle || msg.selectedDisplayText || msg.buttonText || msg.text || "" };
  }
  const t = String(msg.type || msg.messageType || "").toLowerCase();
  if (["button", "button_reply", "buttons_response", "buttonsresponse", "list_reply", "interactive_reply", "template_button_reply"].includes(t)) {
    return { id: null, title: msg.text || "" };
  }
  return null;
};

// =========================================================================
// CUSTOM VOICE NOTE PLAYER
// =========================================================================
const WhatsAppVoicePlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(console.error);
    } else {
      a.pause();
    }
  };

  const readDuration = () => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration)) setDuration(a.duration);
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    const total = Number.isFinite(a.duration) ? a.duration : 0;
    setProgress(total ? (a.currentTime / total) * 100 : 0);
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={styles.voiceContainer}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={readDuration}
        onDurationChange={readDuration}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />

      <button type="button" onClick={togglePlay} style={styles.voicePlayBtn} aria-label={isPlaying ? "Pause voice message" : "Play voice message"}>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: 2 }}><polygon points="6 3 20 12 6 21 6 3" /></svg>
        )}
      </button>

      <div style={styles.voiceTrackWrap}>
        <div style={styles.voiceTrack} onClick={seek} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div style={{ ...styles.voiceFill, width: `${progress}%` }} />
        </div>
        <div style={styles.voiceMeta}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <MicIcon size={11} /> Voice message
          </span>
          <span>{formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}</span>
        </div>
      </div>
    </div>
  );
};


// =========================================================================
// 🔥 SECURE MEDIA WRAPPER
// =========================================================================
const SecureMediaWrapper = ({ src, type, fallbackText, onLoaded, isMe }) => {
  const [mediaSource, setMediaSource] = useState(null);
  const [resolvedType, setResolvedType] = useState(type || "image");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let createdBlobUrl = null;

    const processMedia = async () => {
      try {
        if (!src) {
          if (active) setLoading(false);
          return;
        }

        const cleanUrl = String(src).split('?')[0].toLowerCase();
        let detected = type || "image";

        if (cleanUrl.match(/\.(jpeg|jpg|png|gif|webp|svg|bmp|heic)$/i)) {
          detected = "image";
        } else if (cleanUrl.match(/\.(mp4|3gp|avi|mov|webm|mkv)$/i)) {
          detected = "video";
        } else if (cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac|amr|opus)$/i)) {
          detected = "audio";
        } else if (cleanUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)$/i)) {
          detected = "document";
        }

        if (src.startsWith("blob:") || src.startsWith("data:")) {
          if (active) {
            setMediaSource(src);
            setResolvedType(detected);
            setLoading(false);
            if (onLoaded) onLoaded();
          }
          return;
        }

        let targetUrl = src;
        const token = localStorage.getItem("token");

        if (
          src.includes("fbsbx.com") || 
          src.includes("facebook.com") || 
          src.includes("instagram.com") ||
          src.includes("fbcdn.net") ||
          /^\d+$/.test(src)
        ) {
          targetUrl = `${API_BASE_URL}/api/chats/media-proxy?mediaUrl=${encodeURIComponent(src)}`;
        } else if (src.startsWith("/uploads/")) {
          targetUrl = `${API_BASE_URL}${src}`;
        } else if (!src.startsWith("http")) {
          targetUrl = `${API_BASE_URL}/${src.replace(/^\/+/, "")}`;
        }

        const response = await axios.get(targetUrl, {
          headers: { 
            "ngrok-skip-browser-warning": "true",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          responseType: "blob"
        });

        if (active) {
          const mime = response.data.type || "";
          let finalCategory = detected;

          if (mime.startsWith("image/")) finalCategory = "image";
          else if (mime.startsWith("video/")) finalCategory = "video";
          else if (mime.startsWith("audio/")) finalCategory = "audio";
          else if (mime.startsWith("application/") && !mime.includes("octet-stream")) finalCategory = "document";

          let blobMime = mime;
          if (finalCategory === "image" && (!mime || mime.includes("octet-stream"))) blobMime = "image/jpeg";
          if (finalCategory === "video" && (!mime || mime.includes("octet-stream"))) blobMime = "video/mp4";
          if (finalCategory === "audio" && (!mime || mime.includes("octet-stream"))) blobMime = "audio/ogg";

          const finalBlob = new Blob([response.data], { type: blobMime });
          createdBlobUrl = URL.createObjectURL(finalBlob);

          setMediaSource(createdBlobUrl);
          setResolvedType(finalCategory);
          setLoading(false);
          if (onLoaded) onLoaded();
        }
      } catch (err) {
        if (active) {
          setMediaSource(src);
          setResolvedType(type || "image");
          setLoading(false);
          if (onLoaded) onLoaded();
        }
      }
    };

    processMedia();

    return () => {
      active = false;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [src, type]);


  if (loading) {
    return <div className="cr-skel" style={styles.mediaSkeleton} role="status" aria-label="Loading media" />;
  }

  if (resolvedType === "audio" || resolvedType === "voice") {
    return <WhatsAppVoicePlayer src={mediaSource || src} />;
  }

  if (error) {
    return (
      <div style={styles.mediaError}>
        <AlertIcon size={16} />
        <span>{fallbackText ? "This file couldn't be loaded." : "Couldn't load media."}</span>
      </div>
    );
  }

  if (resolvedType === "image") {
    return (
      <a href={mediaSource || src} target="_blank" rel="noopener noreferrer" style={{ display: "block", lineHeight: 0 }}>
        <img
          src={mediaSource || src}
          alt="Shared image"
          style={styles.bubbleMediaRender}
          onError={() => setError(true)}
        />
      </a>
    );
  }

  if (resolvedType === "video") {
    return (
      <video
        src={mediaSource || src}
        controls
        preload="metadata"
        style={styles.bubbleMediaRender}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <a href={mediaSource || src} download target="_blank" rel="noopener noreferrer" style={styles.docAttachmentBtn}>
      <span style={styles.docIconBox}>
        <DocIcon size={18} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Document</span>
        <span style={{ fontSize: 11.5, color: "var(--c-text-3)" }}>Open or download</span>
      </span>
    </a>
  );
};


// =========================================================================
// MAIN CORE CHATS RENDERING INTERFACE
// =========================================================================
function Chats() {
  const [chatList, setChatList] = useState([]); 
  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [chatCache, setChatCache] = useState({});
  const [typedMessage, setTypedMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [fileTypeLabel, setFileTypeLabel] = useState(""); 
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [teamMembers, setTeamMembers] = useState([]); 
  const [assignmentFilter, setAssignmentFilter] = useState("all"); 
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("all"); 
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [assignmentMode, setAssignmentMode] = useState("manual");
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const shouldSendVoiceRef = useRef(true);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null); 
  const msgBodyRef = useRef(null); 

  const isInitialLoadRef = useRef(false);
  const activeChatRef = useRef(activeChat);
  const previousMessagesLengthRef = useRef(0);

  const knownChatsRef = useRef({});              
  const chatsInitializedRef = useRef(false);     
  const markReadInFlightRef = useRef(new Set()); 
  const baseTitleRef = useRef(typeof document !== "undefined" ? document.title : "");

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("chatTheme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) { /* ignore */ }
    return "light";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const menuRef = useRef(null);
  const attachRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 4500);
  }, []);

  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      if (currentUserId) {
        socket.emit("join_agent_room", { agentId: currentUserId, role: userRole });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, userRole]);

  const privilegedRoles = ["admin", "owner", "manager", "superadmin", "administrator", "boss", "creator"];
  const isAdminUser = privilegedRoles.includes(userRole);

  useEffect(() => {
    try { localStorage.setItem("chatTheme", theme); } catch (e) { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!menuOpen && !showAttachmentMenu) return undefined;
    const onDown = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (showAttachmentMenu && attachRef.current && !attachRef.current.contains(e.target)) setShowAttachmentMenu(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, showAttachmentMenu]);

  useEffect(() => {
    try {
      let detectedRole = "";
      let detectedId = "";
      
      const storedRole = localStorage.getItem("userRole") || localStorage.getItem("role") || localStorage.getItem("type") || "";
      if (storedRole) {
        detectedRole = storedRole;
      } else {
        const userStr = localStorage.getItem("user") || localStorage.getItem("userInfo") || localStorage.getItem("admin");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          detectedRole = parsed.role || parsed.userType || parsed.type || (parsed.isAdmin ? "admin" : "") || "";
          detectedId = parsed._id || parsed.id || "";
        }
      }

      setUserRole(detectedRole.trim().toLowerCase());
      setCurrentUserId(detectedId);
      
      const storedAssignMode = localStorage.getItem("chatAssignmentMode");
      if (storedAssignMode) setAssignmentMode(storedAssignMode);
    } catch (e) {
      console.error("Role detection error:", e);
    }
  }, []);

  const handleAssignmentModeToggle = async (mode) => {
    setAssignmentMode(mode);
    try {
      localStorage.setItem("chatAssignmentMode", mode);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/chats/assignment-mode`,
        { mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (mode === "auto" && teamMembers.length > 0) {
        const activeAgents = teamMembers.filter(m => m.status === "Active");
        if (activeAgents.length > 0) {
          setChatList(prev => prev.map(chat => {
            if (!chat.assignedTo) {
              const randomAgent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
              return { ...chat, assignedTo: randomAgent._id };
            }
            return chat;
          }));
        }
      }
    } catch (err) {
      console.error("Failed to update assignment mode:", err.message);
    }
  };

  const canSeeAssignmentToggle = privilegedRoles.includes(userRole);

  const markChatRead = useCallback(async (rawId, platform) => {
    const id = cleanIdentifier(rawId);
    if (!id) return;
    const token = localStorage.getItem("token");
    markReadInFlightRef.current.add(id);
    try {
      await axios.post(
        `${API_BASE_URL}/api/chats/mark-read`,
        { customerPhone: rawId, platform },
        { headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" } }
      );
    } catch (err) {
      console.error("Mark read failed:", err.message);
    } finally {
      markReadInFlightRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const tabHidden = typeof document !== "undefined" && document.visibilityState !== "visible";
    const activeId = getChatId(activeChat);
    const total = chatList.reduce((sum, c) => {
      const n = Number(c.unreadCount ?? c.unread_count ?? c.unread ?? 0) || 0;
      const isActive = activeId && getChatId(c) === activeId;
      return sum + (isActive && !tabHidden ? 0 : n);
    }, 0);
    document.title = total > 0 ? `(${total}) ${baseTitleRef.current}` : baseTitleRef.current;
  }, [chatList, activeChat]);

  useEffect(() => {
    const base = baseTitleRef.current;
    return () => { document.title = base; };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    const container = msgBodyRef.current;
    if (!container) return;

    const handleScroll = () => {
      const totalScrollableHeight = container.scrollHeight - container.clientHeight;
      const currentScrollPosition = container.scrollTop;
      const isAtBottom = totalScrollableHeight - currentScrollPosition <= 20;
      setUserIsScrolling(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [Boolean(activeChat)]);

  const scrollToBottom = useCallback((behaviorMode = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: behaviorMode,
        block: "nearest",
      });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoadRef.current) {
        scrollToBottom("auto");
        isInitialLoadRef.current = false;
      } else if (messages.length > previousMessagesLengthRef.current && !userIsScrolling) {
        scrollToBottom("smooth");
      }
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom, userIsScrolling]);

  const fetchTeamMembers = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chats/team`, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      setTeamMembers(res.data.team || []); 
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  }, []);

  const fetchActiveChats = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      let incomingChats = res.data.chats || [];

      if (assignmentMode === "auto" && teamMembers.length > 0) {
        const activeAgents = teamMembers.filter(m => m.status === "Active");
        if (activeAgents.length > 0) {
          incomingChats = incomingChats.map(chat => {
            if (!chat.assignedTo) {
              const randomAgent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
              return { ...chat, assignedTo: randomAgent._id };
            }
            return chat;
          });
        }
      }

      const activeId = getChatId(activeChatRef.current);
      const tabVisible = typeof document === "undefined" || document.visibilityState === "visible";

      const prevKnown = knownChatsRef.current;
      const nextKnown = {};
      let shouldPlaySound = false;

      const merged = incomingChats.map((newChat) => {
        const id = getChatId(newChat);

        const serverUnread =
          Number(newChat.unreadCount ?? newChat.unread_count ?? newChat.unread ?? 0) || 0;

        const lastTs = newChat.lastMessageTimestamp
          ? new Date(newChat.lastMessageTimestamp).getTime()
          : 0;
        const fingerprint = `${newChat.lastMessageId || ""}|${lastTs}`;
        const before = prevKnown[id];
        nextKnown[id] = { fingerprint };

        if (
          chatsInitializedRef.current &&
          newChat.lastSender === "them" &&
          (!before || before.fingerprint !== fingerprint)
        ) {
          shouldPlaySound = true;
        }

        const isActive = Boolean(activeId) && id === activeId;
        const markingRead = markReadInFlightRef.current.has(id);

        if (isActive && serverUnread > 0 && tabVisible && !markingRead) {
          markChatRead(
            newChat.phone || newChat.customerPhone || newChat._id,
            newChat.platform || newChat.channel
          );
        }

        const finalUnread = (isActive && tabVisible) || markingRead ? 0 : serverUnread;

        return {
          ...newChat,
          channel: newChat.channel || newChat.platform || "whatsapp",
          status: newChat.status || "active",
          unreadCount: finalUnread,
          unread_count: finalUnread,
          unread: finalUnread
        };
      });

      knownChatsRef.current = nextKnown;
      chatsInitializedRef.current = true;
      setChatList(merged);
      setListLoading(false);

      if (shouldPlaySound) playIncomingSound();
    } catch (err) {
      console.error("Fetch active chats error:", err);
      setListLoading(false);
    }
  }, [markChatRead, assignmentMode, teamMembers]);

  const fetchChatMessages = useCallback(async (chatIdentifier) => {
    const token = localStorage.getItem("token");
    try {
      const encodedId = encodeURIComponent(chatIdentifier);
      const res = await axios.get(`${API_BASE_URL}/api/chats/history/${encodedId}`, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      const incomingMsgs = res.data.messages || [];
      const currentActiveId = cleanIdentifier(activeChatRef.current?.phone || activeChatRef.current?.customerPhone || activeChatRef.current?.senderId || activeChatRef.current?.igId || activeChatRef.current?._id);
      
      if (currentActiveId === cleanIdentifier(chatIdentifier)) {
        setMessages((prevMsgs) => {
          const pendingMsgs = prevMsgs.filter(m => m.isPending || String(m._id).startsWith("temp-"));

          const filteredPending = pendingMsgs.filter(pMsg => {
            return !incomingMsgs.some(inc => {
              if (inc._id && String(inc._id) === String(pMsg._id)) return true;
              if (inc.tempId && String(inc.tempId) === String(pMsg._id)) return true;
              
              if (pMsg.fileLocalIdentifier && inc.fileLocalIdentifier === pMsg.fileLocalIdentifier) {
                return true;
              }

              const incKey = inc.clientMessageId || inc.fileLocalIdentifier || inc.tempId;
              if (incKey && (incKey === pMsg.fileLocalIdentifier || incKey === pMsg.tempId)) {
                return true;
              }

              const pText = (pMsg.text || "").trim();
              const iText = (inc.text || "").trim();
              const textMatches = pText !== "" && pText === iText;
              const isSameSender = inc.sender === "me" || pMsg.sender === "me";
              
              const pTime = new Date(pMsg.timestamp || Date.now()).getTime();
              const iTime = new Date(inc.timestamp || Date.now()).getTime();
              const isCloseInTime = Math.abs(iTime - pTime) < 30000;
              
              if (textMatches && isSameSender && isCloseInTime) {
                return true;
              }

              // media fallback: same kind of media, both from me, sent within 30s
              const normType = (t) => {
                const x = String(t || "").toLowerCase();
                return x === "voice" || x === "ptt" ? "audio" : x;
              };
              if (
                pMsg.mediaUrl && inc.mediaUrl &&
                pMsg.sender === "me" && inc.sender === "me" &&
                normType(pMsg.type) === normType(inc.type) &&
                isCloseInTime
              ) {
                return true;
              }

              return false;
            });
          });

          const mergedList = [...incomingMsgs, ...filteredPending];

          if (JSON.stringify(prevMsgs) === JSON.stringify(mergedList)) {
            return prevMsgs;
          }

          return mergedList;
        });
      }

      setChatCache(prev => ({ ...prev, [chatIdentifier]: incomingMsgs }));
    } catch (err) {
      console.error("Fetch chat history error:", err);
    }
  }, []);

  useEffect(() => {
    fetchActiveChats();
    fetchTeamMembers(); 
    
    const backgroundListPoll = setInterval(() => {
      fetchActiveChats();
      fetchTeamMembers(); 
    }, 3000);

    return () => clearInterval(backgroundListPoll);
  }, [fetchActiveChats, fetchTeamMembers]);

  useEffect(() => {
    if (!activeChat) return;
    
    isInitialLoadRef.current = true;
    previousMessagesLengthRef.current = 0; 
    const targetId = activeChat.phone || activeChat.customerPhone || activeChat.senderId || activeChat.igId || activeChat._id;
    fetchChatMessages(targetId);
    
    const interval = setInterval(() => {
      fetchChatMessages(targetId);
    }, 3000); 
    return () => clearInterval(interval);
  }, [activeChat, fetchChatMessages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = { mimeType: "audio/webm;codecs=opus" };
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/ogg;codecs=opus" };
      }
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus") && !MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        options = { mimeType: "audio/mp4" };
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      shouldSendVoiceRef.current = true;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());

        if (!shouldSendVoiceRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const actualType = mediaRecorderRef.current.mimeType || "audio/webm";
        let extension = "webm";
        if (actualType.includes("ogg")) extension = "ogg";
        if (actualType.includes("mp4")) extension = "mp4";
        
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        if (audioBlob.size > 0) {
          const voiceFile = new File([audioBlob], `voice-${Date.now()}.${extension}`, { type: actualType });
          handleSendMessage(null, false, voiceFile);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error(err);
      showToast("Microphone access is blocked. Allow it in your browser settings to record voice messages.");
    }
  };

  const stopVoiceRecording = (shouldSend = true) => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSendVoiceRef.current = shouldSend;
      if (!shouldSend) audioChunksRef.current = []; 
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const triggerFileSelection = (acceptType, label) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      setFileTypeLabel(label);
      fileInputRef.current.click();
    }
    setShowAttachmentMenu(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setSelectedFile(selected);

      const objectUrl = URL.createObjectURL(selected);
      setFilePreviewUrl(objectUrl);

      if (selected.type.startsWith("image/")) setFileTypeLabel("Image");
      else if (selected.type.startsWith("video/")) setFileTypeLabel("Video");
      else if (selected.type.startsWith("audio/")) setFileTypeLabel("Audio");
      else setFileTypeLabel("Document");
    }
  };

  const clearSelectedFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileTypeLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e, specialCallType = false, systemVoiceBlobFile = null) => {
    if (e) e.preventDefault();
    
    const targetFile = systemVoiceBlobFile || selectedFile;
    if ((!typedMessage.trim() && !targetFile && !specialCallType) || !activeChat) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    const targetId = activeChat.phone || activeChat.customerPhone || activeChat.senderId || activeChat.igId || activeChat._id;
    const targetName = activeChat.name || activeChat.customerName || activeChat.username || "Omnichannel User";
    const channelType = activeChat.channel || activeChat.platform || "whatsapp";

    const activeSource = activeChat.source || activeChat.connectionType || activeChat.origin || activeChat.chatSource || "official_meta";

    const uniqueMediaTag = targetFile ? `${targetFile.name}-${targetFile.size}-${Date.now()}` : null;
    const tempId = `temp-${Date.now()}`;

    const sentText = specialCallType 
      ? "📞 Call initiated from agent panel." 
      : (systemVoiceBlobFile ? "🎙 Voice Note" : typedMessage.trim());

    formData.append("to", targetId);
    formData.append("customerPhone", targetId);
    formData.append("customerName", targetName);
    formData.append("text", sentText);
    formData.append("message", sentText);
    formData.append("platform", channelType);
    formData.append("source", activeSource);
    formData.append("chatSource", activeSource);
    formData.append("tempId", tempId);
    if (uniqueMediaTag) formData.append("fileLocalIdentifier", uniqueMediaTag);
    
    let detectedType = "text";
    if (targetFile) {
      if (systemVoiceBlobFile || targetFile.type.startsWith("audio/")) detectedType = "audio";
      else if (targetFile.type.startsWith("image/")) detectedType = "image";
      else if (targetFile.type.startsWith("video/")) detectedType = "video";
      else detectedType = "document";
      
      formData.append("file", targetFile); 
    }
    formData.append("type", detectedType);

    const previewMediaUrl = targetFile ? (filePreviewUrl || URL.createObjectURL(targetFile)) : null;

    const localNewMsg = { 
      _id: tempId,
      tempId: tempId,
      sender: "me", 
      text: specialCallType ? "📞 Call System Logged" : (systemVoiceBlobFile ? "🎙️ Voice Note" : (typedMessage.trim() || `Sending ${fileTypeLabel}...`)), 
      mediaUrl: previewMediaUrl,
      type: detectedType, 
      status: "sending",
      isPending: true,
      fileLocalIdentifier: uniqueMediaTag,
      channel: channelType,
      source: activeSource,
      timestamp: new Date().toISOString()
    };
    
    setUserIsScrolling(false); 
    setMessages((prev) => [...prev, localNewMsg]);

    playOutgoingSound(); 
    setTypedMessage("");
    clearSelectedFile();
    
    requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

    try {
      const res = await axios.post(`${API_BASE_URL}/api/chats/send`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });

      if (res.data.success || res.status === 200) {
        const returnedMsg = (res.data.data && typeof res.data.data === "object") ? res.data.data : null;

        setMessages((prevMsgs) =>
          prevMsgs.map((m) => {
            if (m._id === tempId || m.tempId === tempId) {
              return {
                ...m,
                ...(returnedMsg || {}),
                _id: returnedMsg?._id || m._id,
                status: "sent",
                isPending: false,
                fileLocalIdentifier: uniqueMediaTag,
                mediaUrl: returnedMsg?.mediaUrl || returnedMsg?.url || m.mediaUrl
              };
            }
            return m;
          })
        );

        setTimeout(() => {
          fetchChatMessages(targetId);
          fetchActiveChats();
        }, 500);
      }
    } catch (err) {
      console.error("Outbound API error:", err);
      setMessages((prevMsgs) =>
        prevMsgs.map((m) =>
          m._id === tempId || m.tempId === tempId
            ? { ...m, status: "failed", isPending: false }
            : m
        )
      );
    }
  };

  const handleAssignAgent = async (chatIdentifier, agentId, platform) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/chats/assign`, { 
        customerPhone: chatIdentifier, 
        agentId: agentId || "none",
        platform: platform || "whatsapp"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchActiveChats(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateChatStatus = async (chatIdentifier, newStatus, platform) => {
    const token = localStorage.getItem("token");
    try {
      const cleanTarget = cleanIdentifier(chatIdentifier);
      setChatList((prev) =>
        prev.map((c) =>
          cleanIdentifier(c.phone || c.customerPhone || c.senderId || c.igId || c._id) === cleanTarget
            ? { ...c, status: newStatus }
            : c
        )
      );

      if (activeChat && cleanIdentifier(activeChat.phone || activeChat.customerPhone || activeChat.senderId || activeChat.igId || activeChat._id) === cleanTarget) {
        setActiveChat((prev) => ({ ...prev, status: newStatus }));
      }

      await axios.post(
        `${API_BASE_URL}/api/chats/status`,
        { customerPhone: chatIdentifier, status: newStatus, platform: platform || "whatsapp" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update status:", err.message);
    }
  };

  const filteredChats = chatList.filter(chat => {
    const chatName = chat.name || chat.customerName || chat.username || "";
    const chatPhone = chat.phone || chat.customerPhone || chat.senderId || chat.igId || "";
    const chatChannel = (chat.channel || chat.platform || "whatsapp").toLowerCase();

    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase()) || chatPhone.includes(searchQuery);
    if (!matchesSearch) return false;

    if (assignmentFilter === "unassigned" && chat.assignedTo) return false;
    if (assignmentFilter === "assigned" && !chat.assignedTo) return false;

    if (selectedAgentFilter !== "all" && String(chat.assignedTo) !== String(selectedAgentFilter)) {
      return false;
    }

    if (channelFilter !== "all") {
      if (channelFilter === "whatsapp" && chatChannel !== "whatsapp") return false;
      if (channelFilter === "instagram" && chatChannel !== "instagram") return false;
      if (channelFilter === "messenger" && (chatChannel !== "messenger" && chatChannel !== "facebook")) return false;
    }

    return true;
  });

  const countAllChats = chatList.length;
  const countUnassigned = chatList.filter(c => !c.assignedTo).length;
  const countAssigned = chatList.filter(c => c.assignedTo).length;

  const countWhatsApp = chatList.filter(c => (c.channel || c.platform || "whatsapp").toLowerCase() === "whatsapp").length;
  const countInstagram = chatList.filter(c => (c.channel || c.platform || "").toLowerCase() === "instagram").length;
  const countMessenger = chatList.filter(c => {
    const ch = (c.channel || c.platform || "").toLowerCase();
    return ch === "messenger" || ch === "facebook";
  }).length;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getSidebarDateTimeLabel = (timestampField) => {
    if (!timestampField) return "";
    try {
      const d = new Date(timestampField);
      if (isNaN(d.getTime())) return "";

      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

      const diffDays = (now.getTime() - d.getTime()) / 86400000;
      if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });

      return d.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        ...(d.getFullYear() !== now.getFullYear() ? { year: "2-digit" } : {})
      });
    } catch (e) {
      return "";
    }
  };

  const getCleanTimeLabel = (timestampField, fallbackString) => {
    if (!timestampField) return fallbackString || "";
    try {
      const d = new Date(timestampField);
      if (isNaN(d.getTime())) return fallbackString || "";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return fallbackString || "";
    }
  };

  const getMemberLabel = (m) => `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email || "Agent";
  const getMemberName = (id) => {
    if (!id) return "";
    const m = teamMembers.find((t) => String(t._id) === String(id));
    return m ? getMemberLabel(m) : "";
  };

  const totalUnread = chatList.reduce((sum, c) => sum + (Number(c.unreadCount ?? c.unread_count ?? c.unread ?? 0) || 0), 0);
  const filtersActive = Boolean(searchQuery) || assignmentFilter !== "all" || selectedAgentFilter !== "all" || channelFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setAssignmentFilter("all");
    setSelectedAgentFilter("all");
    setChannelFilter("all");
  };

  const openChat = async (chat) => {
    const currentIdentifier = chat.phone || chat.customerPhone || chat.senderId || chat.igId || chat._id;
    const cleanCurrent = cleanIdentifier(currentIdentifier);
    const chatPlatform = chat.channel || chat.platform || "whatsapp";

    setMessages([]);
    setActiveChat(chat);
    isInitialLoadRef.current = true;
    setUserIsScrolling(false);

    if (chatCache[currentIdentifier]) {
      setMessages(chatCache[currentIdentifier]);
    }

    setChatList((prev) =>
      prev.map((c) => {
        const cId = cleanIdentifier(c.phone || c.customerPhone || c.senderId || c.igId || c._id);
        return cId === cleanCurrent ? { ...c, unreadCount: 0, unread_count: 0, unread: 0 } : c;
      })
    );

    fetchChatMessages(currentIdentifier);

    await markChatRead(currentIdentifier, chatPlatform);
    fetchActiveChats();
  };

  const renderInteractiveOptions = (msg, pressedTitle = null) => {
    const buttons = getMsgButtons(msg);
    if (!buttons.length) return null;

    return (
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {buttons.map((btn, bIdx) => {
          const btnTitle = getButtonTitle(btn, bIdx);
          const isPressed = Boolean(pressedTitle) && String(pressedTitle).trim().toLowerCase() === String(btnTitle).trim().toLowerCase();
          return (
            <div
              key={bIdx}
              style={isPressed ? { ...styles.interactiveButtonOption, ...styles.interactiveButtonPressed } : styles.interactiveButtonOption}
              title={isPressed ? "Customer pressed this button" : undefined}
            >
              {isPressed && <CheckSmallIcon size={13} />}
              <span>{btnTitle}</span>
            </div>
          );
        })}
        {pressedTitle && (
          <span style={styles.pressedNote}>Customer pressed: {pressedTitle}</span>
        )}
      </div>
    );
  };

  const renderContactCards = (msg) => {
    const cards = getContactCards(msg);
    if (!cards.length) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {cards.map((card, cIdx) => (
          <div key={cIdx} style={styles.contactCardBox}>
            <span style={styles.contactAvatar}><UserCardIcon size={18} /></span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={styles.contactName}>{card.name}</div>
              {card.phones.length === 0 && <div style={styles.contactPhone}>No number</div>}
              {card.phones.map((ph, pIdx) => (
                <div key={pIdx} style={styles.contactPhoneRow}>
                  <a href={`tel:${String(ph).replace(/[^\d+]/g, "")}`} style={styles.contactPhone}>{ph}</a>
                  <button
                    type="button"
                    style={styles.contactCopyBtn}
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(String(ph));
                        showToast("Number copied.");
                      } catch (e) { /* ignore */ }
                    }}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReferralCard = (msg) => {
    const referral = msg.referralData || msg.referral;
    if (!referral) return null;

    const headline = referral.headline || referral.title || "";
    const body = referral.body || referral.description || "";
    const sourceId = referral.sourceId || referral.source_id || "";
    const sourceType = referral.sourceType || referral.source_type || "Ad campaign";
    const mediaUrl = referral.imageUrl || referral.thumbnailUrl || referral.videoUrl || referral.media_url || "";
    const sourceUrl = referral.sourceUrl || referral.source_url || "";

    if (!headline && !sourceId && !mediaUrl) return null;

    return (
      <div style={styles.referralCardBox}>
        <div style={styles.referralHeader}>
          <span style={{ fontWeight: 600, color: "var(--c-accent-text)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <MegaphoneIcon size={14} /> Came from a Meta ad
          </span>
          <span style={styles.referralBadge}>{sourceType}</span>
        </div>

        {mediaUrl && (
          <img
            src={mediaUrl}
            alt="Ad thumbnail"
            style={styles.referralImage}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}

        {headline && <p style={styles.referralTitle}>{headline}</p>}
        {body && <p style={styles.referralBody}>{body}</p>}

        <div style={styles.referralFooter}>
          <span>Ad ID: {sourceId || "N/A"}</span>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--c-accent-text)", fontWeight: 600 }}>
              View original post
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderMessageContent = (msg, pressedTitle = null) => {
    const rawMedia = msg.mediaUrl || msg.url || msg.fileUrl || msg.media_url || msg.attachment || "";
    const hasMedia = Boolean(rawMedia && rawMedia !== "null" && String(rawMedia).trim() !== "");

    const textLower = msg.text ? msg.text.replace(/\uFE0F/g, "").toLowerCase() : "";
    const cleanUrl = String(rawMedia).split("?")[0].toLowerCase();
    const typeLower = (msg.type || msg.messageType || "").toLowerCase();

    let finalType = "image";

    if (
      typeLower === "audio" ||
      typeLower === "voice" ||
      typeLower === "ptt" ||
      cleanUrl.includes("voice") ||
      cleanUrl.includes("audio") ||
      cleanUrl.match(/\.(webm|ogg|mp3|amr|m4a|wav|opus)$/i) ||
      (textLower.includes("voice") && hasMedia)
    ) {
      finalType = "audio";
    } else if (
      typeLower === "image" ||
      typeLower === "photo" ||
      cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i) ||
      cleanUrl.includes("lookaside.fbsbx.com") ||
      cleanUrl.includes("cdninstagram.com")
    ) {
      finalType = "image";
    } else if (
      typeLower === "video" ||
      cleanUrl.match(/\.(mp4|3gp|avi|mov|webm)$/i)
    ) {
      finalType = "video";
    } else if (typeLower === "document" || cleanUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/i)) {
      finalType = "document";
    }

    const contactCards = getContactCards(msg);
    const hasContactCards = contactCards.length > 0;
    const buttonReply = getButtonReply(msg);
    const textIsButtonTitle = Boolean(buttonReply?.title) && String(msg.text || "").trim().toLowerCase() === String(buttonReply.title).trim().toLowerCase();

    const isPlaceholderText =
      hasContactCards ||
      textIsButtonTitle ||
      textLower.includes("🎙 voice note") ||
      textLower.includes("voice attachment received") ||
      textLower.includes("media attachment received") ||
      (msg.isPending && /^sending (image|video|audio|document)\.\.\.$/.test(textLower));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {renderReferralCard(msg)}

        {hasMedia && (
          <SecureMediaWrapper
            src={rawMedia}
            type={finalType}
            isMe={msg.sender === "me"}
            fallbackText={finalType === "audio" ? "Voice note load error" : "File format error"}
            onLoaded={() => {
              if (!userIsScrolling) scrollToBottom("smooth");
            }}
          />
        )}

        {renderContactCards(msg)}

        {buttonReply && (
          <div style={styles.buttonReplyChip}>
            <CheckSmallIcon size={13} /> Pressed: {buttonReply.title || msg.text || "button"}
          </div>
        )}

        {msg.text && !isPlaceholderText && (
          <p style={styles.msgText}>{msg.text}</p>
        )}

        {renderInteractiveOptions(msg, pressedTitle)}
      </div>
    );
  };

  // which button (if any) did the customer press after this auto-reply / button message?
  const findPressedButton = (index) => {
    const base = messages[index];
    const btns = getMsgButtons(base);
    if (!btns.length) return null;
    const options = btns.map((b, i) => ({
      title: getButtonTitle(b, i),
      id: typeof b === "object" ? (b.id || b.payload || b.reply?.id || null) : null
    }));

    for (let j = index + 1; j < messages.length; j++) {
      const m = messages[j];
      if (m.sender === "me") {
        if (getMsgButtons(m).length) break;
        continue;
      }
      const reply = getButtonReply(m);
      const textNorm = String(m.text || "").trim().toLowerCase();
      for (const opt of options) {
        const optNorm = String(opt.title).trim().toLowerCase();
        if (reply) {
          if (reply.id && opt.id && String(reply.id) === String(opt.id)) return opt.title;
          if (reply.title && String(reply.title).trim().toLowerCase() === optNorm) return opt.title;
        } else if (textNorm && textNorm === optNorm) {
          return opt.title;
        }
      }
    }
    return null;
  };

  const renderMessagesWithDateHeaders = () => {
    let lastDateStr = "";

    return messages.map((msg, index) => {
      const isMe = msg.sender === "me";
      const replyKind = getReplyKind(msg);
      const pressedTitle = isMe ? findPressedButton(index) : null;
      let dateHeader = null;

      if (msg.timestamp) {
        try {
          const msgDate = new Date(msg.timestamp);
          if (!isNaN(msgDate.getTime())) {
            const currentDateStr = msgDate.toDateString();
            if (currentDateStr !== lastDateStr) {
              lastDateStr = currentDateStr;
              dateHeader = (
                <div key={`date-${index}`} style={styles.dateSeparatorDivider}>
                  <span style={styles.dateSeparatorLabel}>{getDateHeaderLabel(msgDate)}</span>
                </div>
              );
            }
          }
        } catch (e) {
          console.log("Date parser error");
        }
      }

      return (
        <div key={msg._id || index} style={{ width: "100%" }}>
          {dateHeader}
          <div style={{ ...styles.msgRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
            <div
              className="chat-bubble"
              style={{
                ...styles.bubble,
                background: isMe ? "var(--c-bubble-me)" : "var(--c-bubble-them)",
                borderColor: isMe ? "transparent" : "var(--c-bubble-border)",
                borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                opacity: msg.isPending ? 0.8 : 1
              }}
            >
              {replyKind === "ai" && (
                <div style={styles.replyBadgeAi}><BotIcon size={12} /> AI reply</div>
              )}
              {replyKind === "auto" && (
                <div style={styles.replyBadgeAuto}><ZapIcon size={12} /> Auto reply</div>
              )}

              {isMe && msg.senderAgentName && !replyKind && (
                <div style={styles.senderTag}>Sent by {msg.senderAgentName}</div>
              )}

              {renderMessageContent(msg, pressedTitle)}

              <span style={styles.bubbleTime}>
                {getCleanTimeLabel(msg.timestamp, msg.time)}
                {isMe && <MessageStatusTicks status={msg.status} isPending={msg.isPending} />}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  const renderChatRow = (chat) => {
    const currentIdentifier = chat.phone || chat.customerPhone || chat.senderId || chat.igId || chat._id;
    const cleanCurrent = cleanIdentifier(currentIdentifier);
    const cleanActive = cleanIdentifier(activeChat?.phone || activeChat?.customerPhone || activeChat?.senderId || activeChat?.igId || activeChat?._id);
    const isActiveRow = Boolean(cleanActive) && cleanActive === cleanCurrent;

    const badgeCount = Number(chat.unreadCount ?? chat.unread_count ?? chat.unread ?? 0);
    const hasUnread = badgeCount > 0 && !isActiveRow;
    const isAdLead = chat.source === "META_AD" || chat.referralData?.sourceId;
    const chatPlatform = chat.channel || chat.platform || "whatsapp";
    const displayName = chat.name || chat.customerName || chat.username || "Unknown contact";
    const assignee = getMemberName(chat.assignedTo);
    const statusMeta = getStatusMeta(chat.status);

    return (
      <div
        key={chat._id || currentIdentifier}
        className="cr-row"
        role="button"
        tabIndex={0}
        aria-current={isActiveRow ? "true" : undefined}
        onClick={() => openChat(chat)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openChat(chat);
          }
        }}
        style={styles.chatRow}
      >
        <Avatar name={displayName} src={chat.profilePicUrl || chat.avatar} size={44} channel={chatPlatform} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.rowTop}>
            <h4 style={{ ...styles.chatName, fontWeight: hasUnread ? 700 : 600 }}>{displayName}</h4>
            <span style={{ ...styles.rowTime, color: hasUnread ? "var(--c-accent-text)" : "var(--c-text-3)", fontWeight: hasUnread ? 600 : 500 }}>
              {getSidebarDateTimeLabel(chat.lastMessageTimestamp || chat.updatedAt)}
            </span>
          </div>

          <div style={styles.rowMid}>
            <p style={{ ...styles.lastMsgText, color: hasUnread ? "var(--c-text)" : "var(--c-text-2)" }}>
              {chat.lastSender === "me" && <MessageStatusTicks status={chat.lastMessageStatus} size={14} />}
              <span style={{ marginLeft: chat.lastSender === "me" ? 4 : 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                {chat.lastMsg || chat.lastMessage || "No messages yet"}
              </span>
            </p>
            {hasUnread && <span style={styles.unreadBadge}>{badgeCount > 99 ? "99+" : badgeCount}</span>}
          </div>

          <div style={styles.rowMeta}>
            <span style={styles.metaItem}>
              <StatusDot status={chat.status} size={7} /> {statusMeta.label}
            </span>
            <span style={{ ...styles.metaItem, color: assignee ? "var(--c-text-2)" : "var(--c-text-3)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {assignee || "Unassigned"}
            </span>
            {isAdLead && <span style={styles.tagAd}>Meta ad</span>}
          </div>
        </div>
      </div>
    );
  };

  const showSidebar = !isMobile || !activeChat;
  const showChatArea = !isMobile || activeChat;

  const rawActiveIdentifier = activeChat ? (activeChat.phone || activeChat.customerPhone || activeChat.senderId || activeChat.igId || activeChat._id) : "";
  const activeIdentifier = getCleanDisplayPhone(rawActiveIdentifier);
  const activeName = activeChat ? (activeChat.name || activeChat.customerName || activeChat.username || "Unknown contact") : "";
  const activeChannelMeta = CHANNELS[getChannelKey(activeChat?.channel || activeChat?.platform)];
  const historyLoaded = activeChat ? Object.prototype.hasOwnProperty.call(chatCache, rawActiveIdentifier) : false;

  const channelOptions = [
    { key: "all", label: "All", count: countAllChats, Icon: null },
    { key: "whatsapp", label: "WhatsApp", count: countWhatsApp, Icon: WhatsAppIcon },
    { key: "instagram", label: "Instagram", count: countInstagram, Icon: InstagramIcon },
    { key: "messenger", label: "Messenger", count: countMessenger, Icon: MessengerIcon }
  ];

  const assignmentOptions = [
    { key: "all", label: "All", count: countAllChats },
    { key: "unassigned", label: "Unassigned", count: countUnassigned },
    { key: "assigned", label: "Assigned", count: countAssigned }
  ];

  return (
    <div style={styles.container} className="chats-root chat-main-container" data-theme={theme}>
      <style>{CHATS_CSS}</style>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />

      {/* ================= SIDEBAR ================= */}
      {showSidebar && (
        <aside style={styles.sidebar} className="chat-sidebar" aria-label="Conversations">
          <div style={styles.sidebarHeader}>
            <div style={{ minWidth: 0 }}>
              <h2 style={styles.sidebarTitle}>Inbox</h2>
              <p style={styles.sidebarSub}>
                {countAllChats} {countAllChats === 1 ? "conversation" : "conversations"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {totalUnread > 0 && (
                <span style={styles.unreadSummary}>{totalUnread > 99 ? "99+" : totalUnread} unread</span>
              )}

              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  className="cr-icon-btn"
                  aria-label="Inbox settings"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <MoreIcon size={18} />
                  {selectedAgentFilter !== "all" && <span style={styles.menuDot} />}
                </button>

                {menuOpen && (
                  <div role="menu" style={styles.menuPanel}>
                    <div style={styles.menuSection}>
                      <span style={styles.menuLabel}>Appearance</span>
                      <div className="cr-seg" role="group" aria-label="Theme">
                        <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
                          <SunIcon size={14} /> Light
                        </button>
                        <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
                          <MoonIcon size={14} /> Dark
                        </button>
                      </div>
                    </div>

                    {canSeeAssignmentToggle && (
                      <div style={styles.menuSection}>
                        <span style={styles.menuLabel}>Chat routing</span>
                        <div className="cr-seg" role="group" aria-label="Chat routing mode">
                          <button type="button" aria-pressed={assignmentMode === "manual"} onClick={() => handleAssignmentModeToggle("manual")}>
                            Manual
                          </button>
                          <button type="button" aria-pressed={assignmentMode === "auto"} onClick={() => handleAssignmentModeToggle("auto")}>
                            Auto
                          </button>
                        </div>
                        <p style={styles.menuHint}>
                          {assignmentMode === "auto"
                            ? "Unassigned chats are distributed to active agents automatically."
                            : "You assign each chat to an agent yourself."}
                        </p>
                      </div>
                    )}

                    <div style={{ ...styles.menuSection, borderBottom: "none" }}>
                      <span style={styles.menuLabel}>Filter by agent</span>
                      <select
                        value={selectedAgentFilter}
                        onChange={(e) => setSelectedAgentFilter(e.target.value)}
                        style={styles.selectField}
                        aria-label="Filter conversations by agent"
                      >
                        <option value="all">All agents</option>
                        {teamMembers.map((m) => (
                          <option key={m._id} value={m._id}>{getMemberLabel(m)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={styles.searchBox}>
            <label className="cr-search" style={styles.searchFieldWrapper}>
              <span style={{ display: "flex", color: "var(--c-text-3)" }}><SearchIcon size={16} /></span>
              <input
                type="text"
                placeholder="Search by name or number"
                aria-label="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button type="button" className="cr-icon-btn cr-icon-btn-sm" aria-label="Clear search" onClick={() => setSearchQuery("")}>
                  <CloseIcon size={14} />
                </button>
              )}
            </label>
          </div>

          <div style={styles.chipRow} role="group" aria-label="Filter by channel" className="cr-scroll">
            {channelOptions.map(({ key, label, count, Icon }) => (
              <button
                key={key}
                type="button"
                className="cr-chip"
                aria-pressed={channelFilter === key}
                title={label}
                aria-label={`${label}, ${count} conversations`}
                onClick={() => setChannelFilter(key)}
              >
                {Icon ? <Icon size={14} /> : <span>{label}</span>}
                <span style={styles.chipCount}>{count}</span>
              </button>
            ))}
          </div>

          <div style={styles.tabRow} role="tablist" aria-label="Assignment">
            {assignmentOptions.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                role="tab"
                className="cr-tab"
                aria-selected={assignmentFilter === key}
                onClick={() => setAssignmentFilter(key)}
              >
                {label}
                <span style={styles.tabCount}>{count}</span>
              </button>
            ))}
          </div>

          <div style={styles.listWrapper} className="cr-scroll">
            {listLoading ? (
              <div aria-busy="true" aria-label="Loading conversations">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={styles.skelRow}>
                    <div className="cr-skel" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                      <div className="cr-skel" style={{ height: 11, width: "55%", borderRadius: 6 }} />
                      <div className="cr-skel" style={{ height: 10, width: "85%", borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={styles.listEmpty}>
                <span style={styles.listEmptyIcon}><ChatBubbleIcon size={22} /></span>
                <p style={styles.listEmptyTitle}>
                  {filtersActive ? "No matching conversations" : "No conversations yet"}
                </p>
                <p style={styles.listEmptyText}>
                  {filtersActive
                    ? "Try a different search or clear the filters."
                    : "New messages from your customers will show up here."}
                </p>
                {filtersActive && (
                  <button type="button" className="cr-btn-ghost" onClick={clearFilters}>Clear filters</button>
                )}
              </div>
            ) : (
              filteredChats.map(renderChatRow)
            )}
          </div>
        </aside>
      )}

      {/* ================= CHAT PANEL ================= */}
      {showChatArea && (
        <section style={styles.chatArea} className="chat-area" aria-label="Conversation">
          {activeChat ? (
            <>
              <header style={styles.chatHeader} className="chat-header">
                <div style={styles.headerLeft}>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => setActiveChat(null)}
                      className="cr-icon-btn"
                      aria-label="Back to conversations"
                      title="Back to conversations"
                    >
                      <BackIcon size={20} />
                    </button>
                  )}

                  <Avatar name={activeName} src={activeChat.profilePicUrl || activeChat.avatar} size={40} />

                  <div style={{ minWidth: 0 }}>
                    <h3 style={styles.headerName}>{activeName}</h3>
                    <div style={styles.headerMeta}>
                      <ChannelBadge channel={activeChat.channel || activeChat.platform} />
                      <ChatSourceBadge chat={activeChat} />
                      {(activeChat.source === "META_AD" || activeChat.referralData?.sourceId) && (
                        <span style={styles.tagAd}>Meta ad lead</span>
                      )}
                      <span style={styles.headerId}>{activeIdentifier || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.headerActions} className="chat-header-actions">
                  <label className="cr-field" style={styles.selectWrap} title="Conversation status">
                    <StatusDot status={activeChat.status} />
                    <select
                      aria-label="Conversation status"
                      value={activeChat.status || "active"}
                      onChange={(e) => handleUpdateChatStatus(
                        rawActiveIdentifier,
                        e.target.value,
                        activeChat.channel || activeChat.platform
                      )}
                      className="cr-select-bare"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>

                  <label className="cr-field" style={styles.selectWrap} title="Assigned agent">
                    <UserIcon size={14} />
                    <select
                      aria-label="Assign conversation to an agent"
                      value={activeChat.assignedTo || ""}
                      onChange={(e) => handleAssignAgent(rawActiveIdentifier, e.target.value, activeChat.channel || activeChat.platform)}
                      className="cr-select-bare"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers
                        .filter((m) => m.status === "Active" || String(m._id) === String(activeChat.assignedTo))
                        .map((m) => (
                          <option key={m._id} value={m._id}>{getMemberLabel(m)}</option>
                        ))}
                    </select>
                  </label>

                  {(!activeChat.channel || activeChat.channel === "whatsapp") && (
                    <button
                      type="button"
                      onClick={() => window.open(`whatsapp://send?phone=${activeChat.phone || activeChat.customerPhone}`)}
                      className="cr-btn-ghost cr-btn-icon hide-mobile"
                      aria-label="Open this chat in the WhatsApp desktop app"
                      title="Open this chat in the WhatsApp desktop app"
                    >
                      <WhatsAppIcon size={16} />
                    </button>
                  )}
                </div>
              </header>

              <div style={styles.msgRegion}>
                <div ref={msgBodyRef} style={styles.msgBody} className="cr-scroll">
                  {messages.length === 0 ? (
                    historyLoaded ? (
                      <div style={styles.emptyMessages}>
                        <span style={styles.listEmptyIcon}><ChatBubbleIcon size={22} /></span>
                        <p style={styles.listEmptyTitle}>No messages yet</p>
                        <p style={styles.listEmptyText}>Send the first message below.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-busy="true" aria-label="Loading messages">
                        <div className="cr-skel" style={{ height: 38, width: "42%", borderRadius: 14 }} />
                        <div className="cr-skel" style={{ height: 52, width: "55%", borderRadius: 14, alignSelf: "flex-end" }} />
                        <div className="cr-skel" style={{ height: 38, width: "35%", borderRadius: 14 }} />
                      </div>
                    )
                  ) : (
                    renderMessagesWithDateHeaders()
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {userIsScrolling && messages.length > 0 && (
                  <button
                    type="button"
                    className="cr-fab"
                    style={styles.scrollFab}
                    aria-label="Scroll to latest message"
                    title="Scroll to latest message"
                    onClick={() => {
                      setUserIsScrolling(false);
                      scrollToBottom("smooth");
                    }}
                  >
                    <ArrowDownIcon size={18} />
                  </button>
                )}
              </div>

              {/* SELECTED FILE PREVIEW */}
              {selectedFile && (
                <div style={styles.fileSelectedPreviewContainer}>
                  <div style={styles.previewThumbnailWrapper}>
                    {fileTypeLabel === "Image" && filePreviewUrl ? (
                      <img src={filePreviewUrl} alt="Preview" style={styles.previewThumbnailImg} />
                    ) : fileTypeLabel === "Video" && filePreviewUrl ? (
                      <video src={filePreviewUrl} style={styles.previewThumbnailImg} />
                    ) : (
                      <div style={styles.previewTypeIconFrame}>
                        {fileTypeLabel === "Audio" ? <VolumeIcon size={20} /> : <DocIcon size={20} />}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", gap: 3 }}>
                    <span style={styles.previewName}>{selectedFile.name}</span>
                    <span style={styles.previewSub}>
                      {formatFileSize(selectedFile.size)}
                      <span style={{ margin: "0 6px", opacity: 0.5 }}>/</span>
                      Ready to send on {activeChannelMeta.label}
                    </span>
                  </div>

                  <button type="button" onClick={clearSelectedFile} className="cr-icon-btn" aria-label="Remove attached file" title="Remove attached file">
                    <CloseIcon size={16} />
                  </button>
                </div>
              )}

              {/* COMPOSER */}
              <div style={styles.inputContainerLayout} ref={attachRef}>
                {showAttachmentMenu && (
                  <div style={styles.floatingAttachmentHub} role="menu">
                    <button type="button" role="menuitem" className="cr-menu-item" onClick={() => triggerFileSelection("image/*", "Image")} style={styles.attachmentHubBtn}>
                      <span style={styles.hubIconCircle}><ImageIcon size={16} /></span> <span style={styles.hubBtnLabel}>Photo</span>
                    </button>
                    <button type="button" role="menuitem" className="cr-menu-item" onClick={() => triggerFileSelection("video/*", "Video")} style={styles.attachmentHubBtn}>
                      <span style={styles.hubIconCircle}><VideoIcon size={16} /></span> <span style={styles.hubBtnLabel}>Video</span>
                    </button>
                    <button type="button" role="menuitem" className="cr-menu-item" onClick={() => triggerFileSelection(".pdf,.doc,.docx,.xls,.xlsx,.txt", "Document")} style={styles.attachmentHubBtn}>
                      <span style={styles.hubIconCircle}><DocIcon size={16} /></span> <span style={styles.hubBtnLabel}>Document</span>
                    </button>
                    <button type="button" role="menuitem" className="cr-menu-item" onClick={() => triggerFileSelection("audio/*", "Audio")} style={styles.attachmentHubBtn}>
                      <span style={styles.hubIconCircle}><VolumeIcon size={16} /></span> <span style={styles.hubBtnLabel}>Audio</span>
                    </button>
                  </div>
                )}

                <form onSubmit={(e) => handleSendMessage(e, false)} style={styles.inputBar} className="chat-input-bar">
                  <button
                    type="button"
                    className="cr-icon-btn cr-icon-btn-lg"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    aria-label="Attach a file"
                    aria-haspopup="menu"
                    aria-expanded={showAttachmentMenu}
                    title="Attach a file"
                  >
                    <ClipIcon size={20} />
                  </button>

                  {isRecording ? (
                    <div style={styles.recordingPulsePanel}>
                      <button type="button" onClick={() => stopVoiceRecording(false)} className="cr-icon-btn" style={{ color: "var(--c-danger)" }} aria-label="Cancel recording" title="Cancel recording">
                        <TrashIcon size={16} />
                      </button>

                      <div style={styles.audioWaveVisualizer}>
                        <span style={{ animation: "pulseEffect 1.2s infinite", width: 8, height: 8, borderRadius: "50%", background: "var(--c-danger)", display: "inline-block" }} />
                        <div style={styles.waveBarContainer}>
                          <div style={{ ...styles.waveBar, animation: "waveAnim 1s ease-in-out infinite 0.1s" }} />
                          <div style={{ ...styles.waveBar, animation: "waveAnim 1s ease-in-out infinite 0.3s" }} />
                          <div style={{ ...styles.waveBar, animation: "waveAnim 1s ease-in-out infinite 0.2s" }} />
                          <div style={{ ...styles.waveBar, animation: "waveAnim 1s ease-in-out infinite 0.4s" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-danger)", fontVariantNumeric: "tabular-nums" }}>
                          {formatDuration(recordingDuration)}
                        </span>
                      </div>

                      <button type="button" onClick={() => stopVoiceRecording(true)} style={styles.sendVoiceBtn} aria-label="Send voice message" title="Send voice message">
                        <SendIcon size={15} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="cr-input"
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        aria-label="Message"
                        placeholder={selectedFile ? "Add a caption" : `Reply on ${activeChannelMeta.label}`}
                        style={styles.inputField}
                      />

                      {!typedMessage.trim() && !selectedFile ? (
                        <button type="button" onClick={startVoiceRecording} className="cr-btn-neutral" style={styles.micRecordTriggerBtn} aria-label="Record voice message" title="Record voice message">
                          <MicIcon size={19} />
                        </button>
                      ) : (
                        <button type="submit" className="cr-btn-primary" style={styles.sendBtn} aria-label="Send message" title="Send message">
                          <SendIcon size={18} />
                        </button>
                      )}
                    </>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyLogoFrame}><ChatBubbleIcon size={30} /></div>
              <h3 style={styles.emptyTitle}>Select a conversation</h3>
              <p style={styles.emptyText}>
                Pick a chat from the list to read messages and reply across WhatsApp, Instagram and Messenger.
              </p>
            </div>
          )}
        </section>
      )}

      {toast && (
        <div role="status" aria-live="polite" style={styles.toast}>
          <AlertIcon size={16} />
          <span>{toast}</span>
          <button type="button" className="cr-icon-btn cr-icon-btn-sm" style={{ color: "inherit" }} aria-label="Dismiss" onClick={() => setToast("")}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    display: "flex",
    height: "calc(100vh - 120px)",
    width: "100%",
    minHeight: "560px",
    background: "var(--c-surface)",
    borderRadius: "12px",
    border: "1px solid var(--c-border)",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(16, 24, 40, .04)",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "14px",
    lineHeight: 1.4,
    color: "var(--c-text)"
  },

  /* ---------- sidebar ---------- */
  sidebar: { width: "350px", minWidth: "350px", maxWidth: "350px", borderRight: "1px solid var(--c-border)", display: "flex", flexDirection: "column", background: "var(--c-surface)" },
  sidebarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "14px 14px 10px" },
  sidebarTitle: { margin: 0, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--c-text)" },
  sidebarSub: { margin: "1px 0 0", fontSize: "12px", color: "var(--c-text-3)" },
  unreadSummary: { fontSize: "11.5px", fontWeight: 600, color: "var(--c-accent-text)", background: "var(--c-accent-soft)", padding: "3px 9px", borderRadius: "999px", whiteSpace: "nowrap" },
  menuDot: { position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--c-accent)", boxShadow: "0 0 0 2px var(--c-surface)" },
  menuPanel: { position: "absolute", top: "calc(100% + 6px)", right: 0, width: "min(290px, calc(100vw - 32px))", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "12px", boxShadow: "var(--c-shadow)", zIndex: 30, animation: "slideUpIn 0.14s ease-out", overflow: "hidden" },
  menuSection: { padding: "12px 14px", borderBottom: "1px solid var(--c-border)", display: "flex", flexDirection: "column", gap: "8px" },
  menuLabel: { fontSize: "12px", fontWeight: 600, color: "var(--c-text-2)" },
  menuHint: { margin: 0, fontSize: "11.5px", lineHeight: 1.45, color: "var(--c-text-3)" },
  selectField: { width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--c-border-strong)", fontSize: "13px", background: "var(--c-surface-2)", color: "var(--c-text)", cursor: "pointer" },

  searchBox: { padding: "0 14px 10px" },
  searchFieldWrapper: { display: "flex", alignItems: "center", gap: "8px", background: "var(--c-surface-2)", padding: "0 6px 0 11px", height: "38px", borderRadius: "10px", border: "1px solid transparent", cursor: "text" },
  searchInput: { flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: "13.5px", color: "var(--c-text)" },

  chipRow: { display: "flex", gap: "6px", padding: "0 14px 10px", overflowX: "auto" },
  chipCount: { fontSize: "11.5px", fontWeight: 600, color: "var(--c-text-3)", fontVariantNumeric: "tabular-nums" },
  tabRow: { display: "flex", gap: "18px", padding: "0 14px", borderBottom: "1px solid var(--c-border)" },
  tabCount: { marginLeft: "5px", fontSize: "11.5px", fontWeight: 600, color: "var(--c-text-3)", fontVariantNumeric: "tabular-nums" },

  listWrapper: { flex: 1, overflowY: "auto", background: "var(--c-surface)" },
  skelRow: { display: "flex", gap: "12px", padding: "13px 14px" },
  listEmpty: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "44px 24px", gap: "6px" },
  listEmptyIcon: { width: "44px", height: "44px", borderRadius: "12px", background: "var(--c-surface-2)", color: "var(--c-text-3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" },
  listEmptyTitle: { margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--c-text)" },
  listEmptyText: { margin: "0 0 8px", fontSize: "12.5px", color: "var(--c-text-3)", maxWidth: "240px" },

  chatRow: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px 12px 11px", cursor: "pointer", borderLeft: "3px solid transparent", borderBottom: "1px solid var(--c-border)" },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "2px" },
  chatName: { margin: 0, fontSize: "14px", color: "var(--c-text)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rowTime: { fontSize: "11.5px", whiteSpace: "nowrap", flexShrink: 0 },
  rowMid: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  lastMsgText: { margin: 0, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", display: "flex", alignItems: "center", flex: 1, minWidth: 0 },
  unreadBadge: { background: "var(--c-accent)", color: "var(--c-on-accent)", borderRadius: "999px", padding: "0 6px", flexShrink: 0, fontSize: "11px", fontWeight: 700, minWidth: "19px", height: "19px", display: "flex", alignItems: "center", justifyContent: "center" },
  rowMeta: { display: "flex", alignItems: "center", gap: "10px", marginTop: "5px", fontSize: "11.5px", color: "var(--c-text-3)", minWidth: 0 },
  metaItem: { display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" },
  tagAd: { background: "var(--c-accent-soft)", color: "var(--c-accent-text)", padding: "1px 7px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" },
  pill: { display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", fontSize: "11.5px", fontWeight: 600, whiteSpace: "nowrap" },

  /* ---------- chat panel ---------- */
  chatArea: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--c-chat-bg)", position: "relative" },
  chatHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", background: "var(--c-surface)", padding: "12px 20px", borderBottom: "1px solid var(--c-border)", zIndex: 2 },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
  headerName: { margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--c-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  headerMeta: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "3px" },
  headerId: { fontSize: "12px", color: "var(--c-text-3)", fontVariantNumeric: "tabular-nums" },
  headerActions: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  selectWrap: { display: "inline-flex", alignItems: "center", gap: "7px", height: "34px", padding: "0 6px 0 11px", border: "1px solid var(--c-border-strong)", borderRadius: "8px", background: "var(--c-surface)", color: "var(--c-text-2)" },

  msgRegion: { position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
  msgBody: { flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" },
  emptyMessages: { margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "6px" },
  dateSeparatorDivider: { display: "flex", justifyContent: "center", width: "100%", margin: "12px 0 10px" },
  dateSeparatorLabel: { background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text-2)", fontSize: "11.5px", padding: "4px 12px", borderRadius: "999px", fontWeight: 600 },
  msgRow: { display: "flex", width: "100%" },
  bubble: { maxWidth: "70%", padding: "8px 12px 6px", position: "relative", border: "1px solid transparent", color: "var(--c-text)", boxShadow: "0 1px 1px rgba(16, 24, 40, .04)" },
  msgText: { margin: 0, fontSize: "14px", lineHeight: 1.45, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  replyBadgeAi: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 700, color: "var(--c-accent-text)", background: "var(--c-accent-soft)", padding: "2px 8px", borderRadius: "999px", marginBottom: "5px" },
  replyBadgeAuto: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 700, color: "var(--c-info)", background: "var(--c-info-soft)", padding: "2px 8px", borderRadius: "999px", marginBottom: "5px" },
  interactiveButtonPressed: { background: "var(--c-ok-soft)", color: "var(--c-ok)", borderColor: "var(--c-ok)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  pressedNote: { fontSize: "11.5px", fontWeight: 600, color: "var(--c-ok)" },
  buttonReplyChip: { display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", fontSize: "12px", fontWeight: 600, color: "var(--c-ok)", background: "var(--c-ok-soft)", padding: "4px 10px", borderRadius: "999px" },
  contactCardBox: { display: "flex", alignItems: "center", gap: 10, background: "var(--c-surface)", border: "1px solid var(--c-border-strong)", borderRadius: "10px", padding: "10px 12px", minWidth: 210 },
  contactAvatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--c-accent-soft)", color: "var(--c-accent-text)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  contactName: { fontWeight: 600, fontSize: "13.5px", wordBreak: "break-word" },
  contactPhoneRow: { display: "flex", alignItems: "center", gap: 8 },
  contactPhone: { fontSize: "12.5px", color: "var(--c-accent-text)", textDecoration: "none" },
  contactCopyBtn: { fontSize: "11px", fontWeight: 600, background: "transparent", color: "var(--c-text-3)", border: "1px solid var(--c-border-strong)", borderRadius: "6px", padding: "1px 7px", cursor: "pointer" },
  senderTag: { fontSize: "11.5px", fontWeight: 600, color: "var(--c-accent-text)", marginBottom: "3px" },
  bubbleTime: { display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: "11px", marginTop: "3px", fontWeight: 500, color: "var(--c-text-3)", fontVariantNumeric: "tabular-nums" },
  bubbleMediaRender: { display: "block", width: "100%", maxWidth: "280px", maxHeight: "300px", borderRadius: "10px", objectFit: "cover", background: "var(--c-surface-2)" },
  mediaSkeleton: { width: "220px", height: "150px", borderRadius: "10px", maxWidth: "100%" },
  mediaError: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: "var(--c-danger-soft)", color: "var(--c-danger)", fontSize: "12.5px", fontWeight: 500 },
  docAttachmentBtn: { display: "flex", alignItems: "center", gap: "10px", background: "var(--c-surface-2)", padding: "8px 12px 8px 8px", borderRadius: "10px", border: "1px solid var(--c-border)", color: "var(--c-text)", textDecoration: "none", minWidth: "200px" },
  docIconBox: { width: "36px", height: "36px", borderRadius: "8px", background: "var(--c-accent-soft)", color: "var(--c-accent-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  interactiveButtonOption: { background: "var(--c-surface)", border: "1px solid var(--c-border-strong)", color: "var(--c-accent-text)", padding: "7px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textAlign: "center" },

  voiceContainer: { display: "flex", alignItems: "center", gap: "10px", minWidth: "220px", padding: "2px 0" },
  voicePlayBtn: { border: "none", background: "var(--c-accent)", color: "var(--c-on-accent)", borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  voiceTrackWrap: { flex: 1, display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 },
  voiceTrack: { height: "5px", background: "var(--c-border-strong)", borderRadius: "3px", overflow: "hidden", cursor: "pointer" },
  voiceFill: { height: "100%", background: "var(--c-accent)", borderRadius: "3px" },
  voiceMeta: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--c-text-3)", fontWeight: 500, fontVariantNumeric: "tabular-nums" },

  referralCardBox: { padding: "10px", borderRadius: "10px", background: "var(--c-surface-2)", borderLeft: "3px solid var(--c-accent)", fontSize: "12px", color: "var(--c-text)" },
  referralHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px" },
  referralBadge: { fontSize: "11px", background: "var(--c-accent-soft)", color: "var(--c-accent-text)", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 },
  referralImage: { width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px", border: "1px solid var(--c-border)" },
  referralTitle: { fontWeight: 600, fontSize: "13px", margin: "0 0 2px 0", color: "var(--c-text)" },
  referralBody: { color: "var(--c-text-2)", fontSize: "12px", margin: 0, display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" },
  referralFooter: { marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--c-border)", fontSize: "11.5px", color: "var(--c-text-3)", display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" },

  scrollFab: { position: "absolute", right: "20px", bottom: "14px", width: "38px", height: "38px", borderRadius: "50%", border: "1px solid var(--c-border-strong)", background: "var(--c-surface)", color: "var(--c-text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--c-shadow)", zIndex: 3 },

  /* ---------- composer ---------- */
  inputContainerLayout: { position: "relative", background: "var(--c-surface)", borderTop: "1px solid var(--c-border)", zIndex: 2 },
  inputBar: { padding: "12px 16px", display: "flex", gap: "8px", alignItems: "center" },
  inputField: { flex: 1, padding: "0 14px", height: "42px", borderRadius: "12px", border: "1px solid var(--c-border-strong)", outline: "none", fontSize: "14px", background: "var(--c-surface-2)", color: "var(--c-text)", minWidth: 0 },
  sendBtn: { width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-accent)", color: "var(--c-on-accent)", border: "none", borderRadius: "12px", cursor: "pointer", flexShrink: 0 },
  micRecordTriggerBtn: { border: "1px solid var(--c-border-strong)", background: "var(--c-surface-2)", color: "var(--c-text-2)", cursor: "pointer", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  recordingPulsePanel: { flex: 1, height: "42px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--c-danger-soft)", padding: "0 5px 0 4px", borderRadius: "12px", border: "1px solid var(--c-danger)" },
  audioWaveVisualizer: { display: "flex", alignItems: "center", gap: "10px" },
  waveBarContainer: { display: "flex", alignItems: "center", gap: "3px", height: "20px" },
  waveBar: { width: "3px", background: "var(--c-danger)", borderRadius: "2px" },
  sendVoiceBtn: { width: "32px", height: "32px", borderRadius: "9px", background: "var(--c-danger)", color: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  floatingAttachmentHub: { position: "absolute", bottom: "calc(100% + 8px)", left: "16px", background: "var(--c-surface)", padding: "6px", borderRadius: "12px", boxShadow: "var(--c-shadow)", display: "flex", flexDirection: "column", gap: "2px", animation: "slideUpIn 0.15s ease-out", zIndex: 10, border: "1px solid var(--c-border)" },
  attachmentHubBtn: { display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", padding: "7px 10px", width: "168px", textAlign: "left", borderRadius: "8px", cursor: "pointer", color: "var(--c-text)" },
  hubIconCircle: { width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-accent-soft)", color: "var(--c-accent-text)" },
  hubBtnLabel: { fontSize: "13px", fontWeight: 500 },

  fileSelectedPreviewContainer: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "var(--c-surface)", borderTop: "1px solid var(--c-border)", animation: "slideUpIn 0.12s ease-out", zIndex: 2 },
  previewThumbnailWrapper: { width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "var(--c-surface-2)", color: "var(--c-text-2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--c-border)" },
  previewThumbnailImg: { width: "100%", height: "100%", objectFit: "cover" },
  previewTypeIconFrame: { display: "flex", alignItems: "center", justifyContent: "center" },
  previewName: { fontSize: "13px", fontWeight: 600, color: "var(--c-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  previewSub: { fontSize: "12px", color: "var(--c-text-3)" },

  /* ---------- empty / toast ---------- */
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--c-chat-bg)" },
  emptyLogoFrame: { width: "64px", height: "64px", background: "var(--c-accent-soft)", color: "var(--c-accent-text)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" },
  emptyTitle: { fontWeight: 600, color: "var(--c-text)", fontSize: "17px", margin: 0, textAlign: "center" },
  emptyText: { color: "var(--c-text-3)", fontSize: "13.5px", marginTop: "6px", textAlign: "center", maxWidth: "340px" },
  toast: { position: "absolute", left: "50%", bottom: "84px", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "10px", maxWidth: "calc(100% - 32px)", padding: "10px 8px 10px 14px", borderRadius: "10px", background: "var(--c-text)", color: "var(--c-surface)", fontSize: "13px", fontWeight: 500, boxShadow: "var(--c-shadow)", zIndex: 40, animation: "slideUpIn 0.18s ease-out" }
};

// =========================================================================
// THEME TOKENS + INTERACTION STATES
// =========================================================================
const CHATS_CSS = `
  .chats-root {
    --c-surface: #ffffff;
    --c-surface-2: #f4f5f7;
    --c-surface-3: #e9ebef;
    --c-border: #e4e7ec;
    --c-border-strong: #d0d5dd;
    --c-text: #101828;
    --c-text-2: #475467;
    --c-text-3: #667085;
    --c-accent: #2f55d4;
    --c-accent-hover: #2745b3;
    --c-accent-soft: #e9eefc;
    --c-accent-text: #2745b3;
    --c-on-accent: #ffffff;
    --c-chat-bg: #f1f3f6;
    --c-bubble-me: #dbe5ff;
    --c-bubble-them: #ffffff;
    --c-bubble-border: #e4e7ec;
    --c-read: #1e8fe0;
    --c-wa: #168a4a;  --c-wa-soft: #e7f6ed;
    --c-ig: #c2307a;  --c-ig-soft: #fbe9f2;
    --c-ms: #1f6fe0;  --c-ms-soft: #e6f0fd;
    --c-ok: #15803d;  --c-ok-soft: #e6f4ea;
    --c-warn: #b45309; --c-warn-soft: #fdf1dc;
    --c-info: #4338ca; --c-info-soft: #e9e9fb;
    --c-danger: #d92d20; --c-danger-soft: #fdeceb;
    --c-shadow: 0 12px 32px rgba(16, 24, 40, .14), 0 2px 6px rgba(16, 24, 40, .06);
    color-scheme: light;
  }
  .chats-root[data-theme="dark"] {
    --c-surface: #151922;
    --c-surface-2: #1c212c;
    --c-surface-3: #262c3a;
    --c-border: #2a3040;
    --c-border-strong: #3a4256;
    --c-text: #eef0f4;
    --c-text-2: #b4bbc9;
    --c-text-3: #8d95a6;
    --c-accent: #5876f5;
    --c-accent-hover: #6f8bff;
    --c-accent-soft: #1f2a4d;
    --c-accent-text: #a9bcff;
    --c-on-accent: #ffffff;
    --c-chat-bg: #0f1218;
    --c-bubble-me: #26407a;
    --c-bubble-them: #1c212c;
    --c-bubble-border: #2a3040;
    --c-read: #6cc4ff;
    --c-wa: #4ade80;  --c-wa-soft: #12301f;
    --c-ig: #f472b6;  --c-ig-soft: #3a1a2b;
    --c-ms: #6aa5ff;  --c-ms-soft: #15264a;
    --c-ok: #4ade80;  --c-ok-soft: #12301f;
    --c-warn: #fbbf24; --c-warn-soft: #3a2c0f;
    --c-info: #a5a0ff; --c-info-soft: #24244a;
    --c-danger: #f87171; --c-danger-soft: #3d1a1a;
    --c-shadow: 0 12px 32px rgba(0, 0, 0, .5), 0 0 0 1px rgba(255, 255, 255, .05);
    color-scheme: dark;
  }

  @keyframes spinEffect { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes pulseEffect { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: .5; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes waveAnim { 0%, 100% { height: 6px; } 50% { height: 18px; } }
  @keyframes slideUpIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

  .chats-root *, .chats-root *::before, .chats-root *::after { box-sizing: border-box; }
  .chats-root button, .chats-root input, .chats-root select { font-family: inherit; }
  .chats-root input::placeholder { color: var(--c-text-3); }
  .chats-root a { color: inherit; }

  .chats-root button:focus-visible,
  .chats-root select:focus-visible,
  .chats-root .cr-row:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .chats-root .cr-row:focus-visible { outline-offset: -2px; }
  .chats-root input:focus-visible { outline: none; }

  .chats-root .cr-scroll { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }

  .chats-root .cr-skel {
    background: linear-gradient(90deg, var(--c-surface-2) 25%, var(--c-surface-3) 37%, var(--c-surface-2) 63%);
    background-size: 400% 100%;
    animation: shimmer 1.4s ease infinite;
  }

  .chats-root .cr-icon-btn {
    position: relative; width: 32px; height: 32px; border: none; background: transparent; color: var(--c-text-2);
    border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .chats-root .cr-icon-btn:hover { background: var(--c-surface-2); color: var(--c-text); }
  .chats-root .cr-icon-btn[aria-expanded="true"] { background: var(--c-surface-3); color: var(--c-text); }
  .chats-root .cr-icon-btn-sm { width: 24px; height: 24px; border-radius: 6px; }
  .chats-root .cr-icon-btn-lg { width: 40px; height: 40px; border-radius: 10px; }

  .chats-root .cr-chip {
    height: 30px; padding: 0 11px; border: 1px solid var(--c-border); background: transparent; color: var(--c-text-2);
    border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  }
  .chats-root .cr-chip:hover { background: var(--c-surface-2); }
  .chats-root .cr-chip[aria-pressed="true"] { background: var(--c-accent-soft); border-color: var(--c-accent); color: var(--c-accent-text); }
  .chats-root .cr-chip[aria-pressed="true"] span:last-child { color: var(--c-accent-text); }

  .chats-root .cr-tab {
    position: relative; background: none; border: none; padding: 9px 0 10px; font-size: 13px; font-weight: 600;
    color: var(--c-text-3); cursor: pointer; display: inline-flex; align-items: center;
  }
  .chats-root .cr-tab:hover { color: var(--c-text); }
  .chats-root .cr-tab[aria-selected="true"] { color: var(--c-text); }
  .chats-root .cr-tab[aria-selected="true"]::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--c-accent); border-radius: 2px;
  }

  .chats-root .cr-row:hover { background: var(--c-surface-2); --cr-ring: var(--c-surface-2); }
  .chats-root .cr-row[aria-current="true"] { background: var(--c-accent-soft); border-left-color: var(--c-accent); --cr-ring: var(--c-accent-soft); }

  .chats-root .cr-search:focus-within { border-color: var(--c-accent) !important; background: var(--c-surface) !important; box-shadow: 0 0 0 3px var(--c-accent-soft); }
  .chats-root .cr-input:focus { border-color: var(--c-accent) !important; background: var(--c-surface) !important; box-shadow: 0 0 0 3px var(--c-accent-soft); }

  .chats-root .cr-seg { display: flex; gap: 2px; padding: 3px; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: 10px; }
  .chats-root .cr-seg button {
    flex: 1; border: none; background: transparent; padding: 6px 8px; border-radius: 7px; font-size: 12.5px; font-weight: 600;
    color: var(--c-text-2); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .chats-root .cr-seg button:hover { color: var(--c-text); }
  .chats-root .cr-seg button[aria-pressed="true"] { background: var(--c-surface); color: var(--c-text); box-shadow: 0 1px 2px rgba(16, 24, 40, .14); }

  .chats-root .cr-field:focus-within { border-color: var(--c-accent) !important; box-shadow: 0 0 0 3px var(--c-accent-soft); }
  .chats-root .cr-select-bare {
    border: none; background: transparent; color: var(--c-text); font-size: 13px; font-weight: 600; cursor: pointer;
    outline: none; padding: 6px 2px; max-width: 150px;
  }

  .chats-root .cr-btn-ghost {
    height: 34px; padding: 0 12px; border: 1px solid var(--c-border-strong); background: var(--c-surface); color: var(--c-text);
    border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
  }
  .chats-root .cr-btn-ghost:hover { background: var(--c-surface-2); }
  .chats-root .cr-btn-icon { width: 34px; padding: 0; justify-content: center; }

  .chats-root .cr-btn-primary:hover { background: var(--c-accent-hover) !important; }
  .chats-root .cr-btn-neutral:hover { background: var(--c-surface-3) !important; color: var(--c-text) !important; }
  .chats-root .cr-menu-item:hover { background: var(--c-surface-2) !important; }
  .chats-root .cr-fab:hover { background: var(--c-surface-2) !important; }

  @media (prefers-reduced-motion: reduce) {
    .chats-root *, .chats-root *::before, .chats-root *::after { animation: none !important; transition: none !important; }
  }

  @media (max-width: 768px) {
    .chats-root.chat-main-container {
      height: calc(100vh - 70px) !important;
      height: calc(100dvh - 70px) !important;
      border-radius: 0 !important;
      border: none !important;
    }
    .chats-root .chat-sidebar { width: 100% !important; min-width: 100% !important; max-width: 100% !important; border-right: none !important; }
    .chats-root .chat-area { width: 100% !important; }
    .chats-root .chat-bubble { max-width: 88% !important; }
    .chats-root .chat-header { padding: 10px 12px !important; }
    .chats-root .chat-header-actions { width: 100%; flex-shrink: 1; }
    .chats-root .chat-header-actions .cr-field { flex: 1; }
    .chats-root .cr-select-bare { max-width: none; width: 100%; }
    .chats-root .chat-input-bar { padding: 8px 10px !important; }
    .chats-root .hide-mobile { display: none !important; }
  }
`;

export default Chats;