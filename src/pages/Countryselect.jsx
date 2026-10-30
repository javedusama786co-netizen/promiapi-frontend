import React, { useState, useRef, useEffect } from "react";

// Shared by Onboarding.jsx and Register.jsx

export const BUSINESS_TYPES = [
  "Retail / E-commerce",
  "Restaurant / Food & Beverage",
  "Real Estate",
  "Healthcare / Clinic",
  "Education / Training",
  "Travel & Hospitality",
  "Automotive",
  "Fashion & Apparel",
  "Beauty & Wellness",
  "IT / Software / Agency",
  "Finance / Insurance",
  "Logistics / Delivery",
  "Manufacturing / Wholesale",
  "Other",
];

export const COUNTRIES = [
  { name: "Pakistan", code: "pk" },
  { name: "India", code: "in" },
  { name: "Bangladesh", code: "bd" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Qatar", code: "qa" },
  { name: "Kuwait", code: "kw" },
  { name: "Oman", code: "om" },
  { name: "Bahrain", code: "bh" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Canada", code: "ca" },
  { name: "Australia", code: "au" },
  { name: "Germany", code: "de" },
  { name: "France", code: "fr" },
  { name: "Turkey", code: "tr" },
  { name: "Egypt", code: "eg" },
  { name: "Nigeria", code: "ng" },
  { name: "South Africa", code: "za" },
  { name: "Indonesia", code: "id" },
  { name: "Malaysia", code: "my" },
  { name: "Singapore", code: "sg" },
  { name: "Brazil", code: "br" },
  { name: "Mexico", code: "mx" },
  { name: "Other", code: "" },
];

// 🏳️ Flag image (works on every OS, unlike emoji flags on Windows)
export function Flag({ code }) {
  if (!code) {
    return (
      <svg className="bz-flag bz-flag-globe" width="22" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }
  return (
    <img
      className="bz-flag"
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width="22"
      height="16"
      alt=""
      loading="lazy"
    />
  );
}

// 🌍 Country dropdown with flags
// size="md" (default, Onboarding)  |  size="sm" (compact, Register)
export function CountrySelect({ value, onChange, disabled, id = "country", size = "md" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = COUNTRIES.find((c) => c.name === value) || COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`bz-country bz-${size}`} ref={wrapRef}>
      <style>{css}</style>
      <button
        type="button"
        id={id}
        className={`bz-country-btn${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <Flag code={selected.code} />
        <span className="bz-country-name">{selected.name}</span>
        <svg className="bz-country-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <ul className="bz-country-list" role="listbox" aria-labelledby={id}>
          {COUNTRIES.map((c) => (
            <li
              key={c.name}
              role="option"
              aria-selected={c.name === value}
              className={c.name === value ? "sel" : ""}
              ref={(el) => { if (el && c.name === value) el.scrollIntoView({ block: "nearest" }); }}
              onClick={() => { onChange(c.name); setOpen(false); }}
            >
              <Flag code={c.code} />
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const css = `
.bz-country { position: relative; width: 100%; font-family: inherit; }
.bz-country-btn { width: 100%; height: 48px; padding: 0 40px 0 14px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; font-family: inherit; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; outline: none; transition: border-color .2s, box-shadow .2s; position: relative; }
.bz-country-btn:focus, .bz-country-btn.open { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.bz-country-btn:disabled { background: #f1f5f9; cursor: not-allowed; }
.bz-country-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bz-country-chev { position: absolute; right: 14px; color: #94a3b8; transition: transform .2s; }
.bz-country-btn.open .bz-country-chev { transform: rotate(180deg); }
.bz-flag { width: 22px; height: 16px; flex-shrink: 0; object-fit: cover; border-radius: 3px; box-shadow: 0 0 0 1px rgba(15,23,42,.12); }
.bz-flag-globe { box-shadow: none; color: #94a3b8; }
.bz-country-list { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 30; margin: 0; padding: 6px; list-style: none; max-height: 240px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 20px 40px -12px rgba(15,23,42,.28); }
.bz-country-list li { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; font-size: 15px; color: #0f172a; cursor: pointer; }
.bz-country-list li:hover { background: #f1f5f9; }
.bz-country-list li.sel { background: #eff6ff; color: #1d4ed8; font-weight: 600; }

/* compact size (Register) */
.bz-sm .bz-country-btn { height: 38px; padding: 0 34px 0 12px; border-radius: 8px; font-size: 13.5px; gap: 8px; }
.bz-sm .bz-country-btn:focus, .bz-sm .bz-country-btn.open { box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.bz-sm .bz-country-chev { right: 10px; }
.bz-sm .bz-country-list { border-radius: 10px; max-height: 220px; }
.bz-sm .bz-country-list li { padding: 8px 10px; font-size: 13.5px; }

@media (max-width: 520px) {
  .bz-country-btn { font-size: 16px; }
  .bz-sm .bz-country-btn { height: 44px; font-size: 16px; }
  .bz-country-list { max-height: 220px; }
  .bz-sm .bz-country-list li { font-size: 15px; padding: 10px; }
}
`;

export default CountrySelect;