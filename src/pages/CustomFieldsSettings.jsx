import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

// 🌐 same base URL logic as AiBotSettings.jsx
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.promiapi.com";

const getAxiosConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

// =====================================================================
// Pure helpers (no React) - exported so they can be unit tested
// =====================================================================
export const FIELD_TYPES = [
  { value: "text", label: "Text", hint: "Short text: city, company, source …" },
  { value: "number", label: "Number", hint: "Budget, age, quantity … (used for >, <, between filters)" },
  { value: "date", label: "Date", hint: "Birthday, last visit, renewal date …" },
  { value: "select", label: "Dropdown", hint: "One value from a list you define (interest, plan …)" },
  { value: "boolean", label: "Yes / No", hint: "VIP, interested, has account …" },
  { value: "email", label: "Email", hint: "Validated email address" },
  { value: "phone", label: "Phone", hint: "Alternative phone number" },
  { value: "url", label: "Link", hint: "Website, profile or document link" },
];

// keep in sync with the backend (models/CustomField.js)
export const RESERVED_KEYS = [
  "name", "full_name", "first_name", "last_name", "phone", "group", "tags", "source_ad", "platform", "today",
  "id", "status", "created_at", "customer", "cf", "number", "email_address",
];

// filled automatically by Shopify / WooCommerce orders
export const SYSTEM_KEYS = [
  "last_order_id", "last_order_total", "last_order_date", "last_order_items",
  "orders_count", "total_spent", "shop_city", "shop_email",
];

export const PRESETS = [
  { label: "City", type: "text", description: "City the customer lives in" },
  { label: "Budget", type: "number", description: "Budget in PKR" },
  { label: "Interest", type: "select", optionsText: "Product A, Product B, Product C", description: "Product the customer is interested in" },
  { label: "Birthday", type: "date", description: "Customer's birthday" },
];

/** same rules as the backend's normalizeKey (used for the final key) */
export function slugifyKey(input) {
  let k = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-.]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!k) return "";
  if (!/^[a-z]/.test(k)) k = "f_" + k;
  return k.slice(0, 40);
}

/** lenient version while the user is typing the key (keeps a trailing underscore) */
export function sanitizeKeyInput(input) {
  return String(input ?? "").toLowerCase().replace(/[\s\-.]+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 40);
}

export function parseOptions(text) {
  return [...new Set(String(text ?? "").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 50);
}

export function emptyDraft(preset = {}) {
  return {
    label: preset.label || "",
    key: preset.label ? slugifyKey(preset.label) : "",
    keyTouched: false,
    type: preset.type || "text",
    originalType: null,
    optionsText: preset.optionsText || "",
    defaultValue: "",
    description: preset.description || "",
    aiRead: true,
    aiWrite: true,
  };
}

export function draftFromField(f) {
  return {
    label: f.label || "",
    key: f.key || "",
    keyTouched: true,
    type: f.type || "text",
    originalType: f.type || "text",
    optionsText: (f.options || []).join("\n"),
    defaultValue: f.defaultValue || "",
    description: f.description || "",
    aiRead: f.aiRead !== false,
    aiWrite: f.aiWrite !== false,
  };
}

/** returns an error message, or "" when the draft is fine */
export function validateDraft(draft, { isNew, existingKeys = [] } = {}) {
  const label = String(draft.label || "").trim();
  if (!label) return "Give the field a name (for example: City).";
  if (label.length > 60) return "The name can have at most 60 characters.";
  if (isNew) {
    const key = draft.key;
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key || "")) return "The key must start with a letter and use only a-z, 0-9 and _ (max 40).";
    if (RESERVED_KEYS.includes(key)) return `"${key}" is reserved by the system. Choose another key.`;
    if (existingKeys.includes(key)) return `A field with the key "${key}" already exists.`;
  }
  if (draft.type === "select") {
    const options = parseOptions(draft.optionsText);
    if (!options.length) return "A dropdown needs at least one option (one per line).";
    if (options.some((o) => o.length > 60)) return "Each option can have at most 60 characters.";
  }
  if (String(draft.defaultValue || "").length > 120) return "The fallback text can have at most 120 characters.";
  if (String(draft.description || "").length > 200) return "The description can have at most 200 characters.";
  return "";
}

export function draftToPayload(draft, { isNew, force = false } = {}) {
  const payload = {
    label: String(draft.label).trim(),
    defaultValue: String(draft.defaultValue || "").trim(),
    description: String(draft.description || "").trim(),
    aiRead: Boolean(draft.aiRead),
    aiWrite: Boolean(draft.aiWrite),
  };
  if (draft.type === "select") payload.options = parseOptions(draft.optionsText);
  if (isNew) {
    payload.key = draft.key;
    payload.type = draft.type;
  } else {
    if (draft.type !== draft.originalType) payload.type = draft.type;
    if (force) payload.force = true;
  }
  return payload;
}

export const apiError = (err, fallback) => {
  const d = err?.response?.data;
  const msg = (d && (d.message || d.error)) || "";
  return typeof msg === "string" && msg ? msg : fallback;
};

// =====================================================================
// Small icons
// =====================================================================
const Ico = {
  Plus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  Edit: () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>),
  Trash: () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>),
  Up: () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>),
  Down: () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>),
  Copy: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>),
  Close: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
  Tag: () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>),
};

// =====================================================================
// Modal (rendered in document.body, so it never sits inside the AI settings <form>)
// =====================================================================
function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="cf-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{css}</style>
      <div className="cf-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="cf-modal-head">
          <h4>{title}</h4>
          <button type="button" className="cf-icon-btn" onClick={onClose} aria-label="Close"><Ico.Close /></button>
        </div>
        <div className="cf-modal-body">{children}</div>
        <div className="cf-modal-foot">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

function Toggle({ checked, onChange, label, title, disabled }) {
  return (
    <label className={`cf-toggle${disabled ? " is-disabled" : ""}`} title={title}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="cf-track"><span className="cf-thumb" /></span>
      <span className="cf-toggle-label">{label}</span>
    </label>
  );
}

// =====================================================================
// Main component
//   <CustomFieldsSettings />            full page
//   <CustomFieldsSettings embedded />   inside another settings page (no hero / background)
// =====================================================================
export default function CustomFieldsSettings({ embedded = false }) {
  const [fields, setFields] = useState([]);
  const [meta, setMeta] = useState({ limit: 50, builtin: [] });
  const [coverage, setCoverage] = useState({});
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(null);       // { mode, id, draft, error, saving }
  const [removing, setRemoving] = useState(null); // { field, purge, saving, error }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text, type = "ok") => {
    setToast({ text, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadCoverage = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/custom-fields/coverage`, getAxiosConfig());
      const map = {};
      (res.data.fields || []).forEach((f) => { map[f.key] = f; });
      setCoverage(map);
      setTotalContacts(res.data.total || 0);
    } catch (e) { /* coverage is optional */ }
  }, []);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/custom-fields`, getAxiosConfig());
      setFields(res.data.fields || []);
      setMeta({ limit: res.data.limit || 50, builtin: res.data.builtinVariables || [] });
    } catch (err) {
      setLoadError(apiError(err, "Could not load custom fields."));
    } finally {
      setLoading(false);
    }
    loadCoverage();
  }, [loadCoverage]);

  useEffect(() => { load(); }, [load]);

  // ---------- actions ----------
  const copyToken = async (key) => {
    const text = `{{${key}}}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) { /* ignore */ }
      document.body.removeChild(ta);
    }
    showToast(`Copied ${text}`);
  };

  const patchField = async (field, patch) => {
    const before = fields;
    setFields((list) => list.map((f) => (f._id === field._id ? { ...f, ...patch } : f)));
    try {
      await axios.put(`${API_BASE_URL}/api/custom-fields/${field._id}`, patch, getAxiosConfig());
    } catch (err) {
      setFields(before);
      showToast(apiError(err, "Could not update the field."), "err");
    }
  };

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= fields.length) return;
    const before = fields;
    const next = [...fields];
    [next[index], next[j]] = [next[j], next[index]];
    setFields(next);
    try {
      await axios.post(`${API_BASE_URL}/api/custom-fields/reorder`, { order: next.map((f) => f._id) }, getAxiosConfig());
    } catch (err) {
      setFields(before);
      showToast(apiError(err, "Could not change the order."), "err");
    }
  };

  const openCreate = (preset) => setModal({ mode: "create", id: null, draft: emptyDraft(preset), error: "", saving: false });
  const openEdit = (field) => setModal({ mode: "edit", id: field._id, draft: draftFromField(field), error: "", saving: false });
  const setDraft = (patch) => setModal((m) => ({ ...m, error: "", draft: { ...m.draft, ...patch } }));

  const onLabelChange = (value) => {
    setModal((m) => {
      const draft = { ...m.draft, label: value };
      if (m.mode === "create" && !m.draft.keyTouched) draft.key = slugifyKey(value);
      return { ...m, error: "", draft };
    });
  };

  const submitModal = async (force = false) => {
    const { mode, id, draft } = modal;
    const isNew = mode === "create";
    const problem = validateDraft(draft, { isNew, existingKeys: fields.filter((f) => f._id !== id).map((f) => f.key) });
    if (problem) { setModal((m) => ({ ...m, error: problem })); return; }

    setModal((m) => ({ ...m, saving: true, error: "" }));
    try {
      const payload = draftToPayload(draft, { isNew, force });
      if (isNew) {
        const res = await axios.post(`${API_BASE_URL}/api/custom-fields`, payload, getAxiosConfig());
        setFields((list) => [...list, res.data.field]);
        showToast(`Field "${res.data.field.label}" created. Use {{${res.data.field.key}}} in your messages.`);
      } else {
        const res = await axios.put(`${API_BASE_URL}/api/custom-fields/${id}`, payload, getAxiosConfig());
        setFields((list) => list.map((f) => (f._id === id ? res.data.field : f)));
        showToast("Field updated.");
      }
      setModal(null);
      loadCoverage();
    } catch (err) {
      const data = err?.response?.data;
      if (!isNew && err?.response?.status === 409 && data?.removed && !force) {
        setModal((m) => ({ ...m, saving: false }));
        if (window.confirm(`${data.message}\n\nSave anyway?`)) submitModal(true);
        return;
      }
      setModal((m) => ({ ...m, saving: false, error: apiError(err, "Could not save the field.") }));
    }
  };

  const confirmRemove = async () => {
    const { field, purge } = removing;
    setRemoving((r) => ({ ...r, saving: true, error: "" }));
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/custom-fields/${field._id}?purge=${purge ? "true" : "false"}`, getAxiosConfig());
      setFields((list) => list.filter((f) => f._id !== field._id));
      setRemoving(null);
      showToast(res.data?.message || "Field deleted.");
      loadCoverage();
    } catch (err) {
      setRemoving((r) => ({ ...r, saving: false, error: apiError(err, "Could not delete the field.") }));
    }
  };

  // ---------- render ----------
  const draft = modal?.draft;
  const isEdit = modal?.mode === "edit";
  const hasData = (key) => (coverage[key]?.filled || 0) > 0;
  const atLimit = fields.length >= meta.limit;

  return (
    <div className={`cf-root${embedded ? " is-embedded" : ""}`}>
      <style>{css}</style>

      {!embedded && (
        <header className="cf-hero">
          <div className="cf-hero-icon"><Ico.Tag /></div>
          <div>
            <h1 className="cf-title">Custom Fields</h1>
            <p className="cf-subtitle">
              Save extra details about every contact (city, budget, interest …) and use them as <b>{"{{variables}}"}</b> in campaigns,
              bot replies, flows and chat. The AI can read them and save what customers tell it.
            </p>
          </div>
        </header>
      )}

      <div className="cf-info">
        <span>Use <code>{"{{city}}"}</code> in a message. Add a fallback for contacts without a value: <code>{"{{city|your city}}"}</code>.</span>
        <div className="cf-chips">
          {meta.builtin.map((v) => (
            <button type="button" key={v.key} className="cf-chip" onClick={() => copyToken(v.key)} title="Click to copy">{`{{${v.key}}}`}</button>
          ))}
        </div>
      </div>

      <div className="cf-toolbar">
        <div className="cf-count">
          <b>{fields.length}</b> / {meta.limit} fields{totalContacts ? <> · {totalContacts} contacts</> : null}
        </div>
        <button type="button" className="cf-btn cf-btn-primary" onClick={() => openCreate()} disabled={atLimit} title={atLimit ? "Field limit reached" : ""}>
          <Ico.Plus /> Add field
        </button>
      </div>

      {loading && <div className="cf-empty">Loading custom fields…</div>}

      {!loading && loadError && (
        <div className="cf-error-box">
          {loadError}
          <button type="button" className="cf-btn" onClick={load}>Try again</button>
        </div>
      )}

      {!loading && !loadError && fields.length === 0 && (
        <div className="cf-empty">
          <div className="cf-empty-icon"><Ico.Tag /></div>
          <strong>No custom fields yet</strong>
          <span>Start with one of these, or create your own.</span>
          <div className="cf-chips cf-center">
            {PRESETS.map((p) => (
              <button type="button" key={p.label} className="cf-chip cf-chip-big" onClick={() => openCreate(p)}>+ {p.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="cf-list">
        {fields.map((f, i) => {
          const cov = coverage[f.key];
          const isSystem = SYSTEM_KEYS.includes(f.key);
          return (
            <div className={`cf-card${f.isActive === false ? " is-off" : ""}`} key={f._id}>
              <div className="cf-card-main">
                <div className="cf-card-top">
                  <strong className="cf-name">{f.label}</strong>
                  <span className="cf-badge">{(FIELD_TYPES.find((t) => t.value === f.type) || {}).label || f.type}</span>
                  {isSystem && <span className="cf-badge cf-badge-store" title="Filled automatically from store orders">Store order</span>}
                  {f.isActive === false && <span className="cf-badge cf-badge-off">Disabled</span>}
                  <button type="button" className="cf-token" onClick={() => copyToken(f.key)} title="Copy variable">
                    {`{{${f.key}}}`} <Ico.Copy />
                  </button>
                </div>
                {f.description ? <p className="cf-desc">{f.description}</p> : null}
                {f.type === "select" && f.options?.length > 0 && (
                  <div className="cf-chips">{f.options.map((o) => <span key={o} className="cf-chip cf-chip-static">{o}</span>)}</div>
                )}
                {f.defaultValue ? <p className="cf-desc">Fallback in messages: <b>{f.defaultValue}</b></p> : null}
                {cov && totalContacts > 0 && (
                  <div className="cf-cov" title={`${cov.filled} of ${totalContacts} contacts have this value`}>
                    <div className="cf-cov-bar"><span style={{ width: `${Math.min(100, cov.percent || 0)}%` }} /></div>
                    <small>{cov.filled} of {totalContacts} contacts ({cov.percent || 0}%)</small>
                  </div>
                )}
              </div>

              <div className="cf-card-side">
                <div className="cf-toggles">
                  <Toggle checked={f.aiRead !== false} onChange={(e) => patchField(f, { aiRead: e.target.checked })} label="AI can read" title="The AI sees this value in the customer profile" />
                  <Toggle checked={f.aiWrite !== false} onChange={(e) => patchField(f, { aiWrite: e.target.checked })} label="AI can save" title="The AI saves what the customer says into this field" />
                  <Toggle checked={f.isActive !== false} onChange={(e) => patchField(f, { isActive: e.target.checked })} label="Active" title="Disabled fields are hidden from variables and filters" />
                </div>
                <div className="cf-actions">
                  <button type="button" className="cf-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Ico.Up /></button>
                  <button type="button" className="cf-icon-btn" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="Move down"><Ico.Down /></button>
                  <button type="button" className="cf-icon-btn" onClick={() => openEdit(f)} aria-label="Edit"><Ico.Edit /></button>
                  <button type="button" className="cf-icon-btn cf-danger" onClick={() => setRemoving({ field: f, purge: false, saving: false, error: "" })} aria-label="Delete"><Ico.Trash /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className={`cf-toast${toast.type === "err" ? " is-err" : ""}`} role="status">{toast.text}</div>}

      {/* ---------- create / edit ---------- */}
      {modal && (
        <Modal
          title={isEdit ? "Edit custom field" : "New custom field"}
          onClose={() => !modal.saving && setModal(null)}
          footer={(
            <>
              <button type="button" className="cf-btn" onClick={() => setModal(null)} disabled={modal.saving}>Cancel</button>
              <button type="button" className="cf-btn cf-btn-primary" onClick={() => submitModal(false)} disabled={modal.saving}>
                {modal.saving ? "Saving…" : isEdit ? "Save changes" : "Create field"}
              </button>
            </>
          )}
        >
          <div className="cf-form" onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); submitModal(false); } }}>
            <label className="cf-field">
              <span className="cf-label">Field name</span>
              <input className="cf-input" value={draft.label} onChange={(e) => onLabelChange(e.target.value)} placeholder="e.g. City" maxLength={60} autoFocus />
            </label>

            <label className="cf-field">
              <span className="cf-label">Variable key</span>
              <div className="cf-key">
                <span>{"{{"}</span>
                <input
                  className="cf-input"
                  value={draft.key}
                  onChange={(e) => setDraft({ key: sanitizeKeyInput(e.target.value), keyTouched: true })}
                  disabled={isEdit}
                  placeholder="city"
                />
                <span>{"}}"}</span>
              </div>
              <small className="cf-hint">{isEdit ? "The key cannot be changed after the field is created." : "Used in messages and filters. Letters, numbers and _ only."}</small>
            </label>

            <label className="cf-field">
              <span className="cf-label">Type</span>
              <select
                className="cf-input"
                value={draft.type}
                onChange={(e) => setDraft({ type: e.target.value })}
                disabled={isEdit && hasData(draft.key)}
              >
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <small className="cf-hint">
                {isEdit && hasData(draft.key)
                  ? "Contacts already have values, so the type cannot be changed. Create a new field instead."
                  : (FIELD_TYPES.find((t) => t.value === draft.type) || {}).hint}
              </small>
            </label>

            {draft.type === "select" && (
              <label className="cf-field">
                <span className="cf-label">Dropdown options</span>
                <textarea className="cf-input cf-textarea" rows={4} value={draft.optionsText} onChange={(e) => setDraft({ optionsText: e.target.value })} placeholder={"One option per line\nSolar\nUPS\nBatteries"} />
                <div className="cf-chips">
                  {parseOptions(draft.optionsText).map((o) => <span key={o} className="cf-chip cf-chip-static">{o}</span>)}
                </div>
              </label>
            )}

            <label className="cf-field">
              <span className="cf-label">Fallback text <i>(optional)</i></span>
              <input className="cf-input" value={draft.defaultValue} onChange={(e) => setDraft({ defaultValue: e.target.value })} placeholder="e.g. your city" maxLength={120} />
              <small className="cf-hint">Used in messages when a contact has no value, so nobody gets “Hi , …”.</small>
            </label>

            <label className="cf-field">
              <span className="cf-label">Description <i>(optional)</i></span>
              <input className="cf-input" value={draft.description} onChange={(e) => setDraft({ description: e.target.value })} placeholder="e.g. City the customer lives in" maxLength={200} />
              <small className="cf-hint">Shown to your team and also tells the AI what this field means.</small>
            </label>

            <div className="cf-switch-box">
              <Toggle checked={draft.aiRead} onChange={(e) => setDraft({ aiRead: e.target.checked })} label="AI can read this field" />
              <Toggle checked={draft.aiWrite} onChange={(e) => setDraft({ aiWrite: e.target.checked })} label="AI can save this field when a customer tells it" />
            </div>

            {modal.error && <div className="cf-error">{modal.error}</div>}
          </div>
        </Modal>
      )}

      {/* ---------- delete ---------- */}
      {removing && (
        <Modal
          title="Delete custom field"
          onClose={() => !removing.saving && setRemoving(null)}
          footer={(
            <>
              <button type="button" className="cf-btn" onClick={() => setRemoving(null)} disabled={removing.saving}>Cancel</button>
              <button type="button" className="cf-btn cf-btn-danger" onClick={confirmRemove} disabled={removing.saving}>
                {removing.saving ? "Deleting…" : "Delete field"}
              </button>
            </>
          )}
        >
          <p className="cf-confirm">
            Delete <b>{removing.field.label}</b> ({`{{${removing.field.key}}}`})?
            {" "}Messages that still use <code>{`{{${removing.field.key}}}`}</code> will send it empty.
          </p>
          {SYSTEM_KEYS.includes(removing.field.key) && (
            <p className="cf-hint">Tip: this field is filled by store orders. Switching it off (Active) is safer than deleting it.</p>
          )}
          <label className="cf-check">
            <input type="checkbox" checked={removing.purge} onChange={(e) => setRemoving((r) => ({ ...r, purge: e.target.checked }))} />
            <span>Also remove the saved values from all contacts ({coverage[removing.field.key]?.filled ?? "?"} contacts have one)</span>
          </label>
          {removing.error && <div className="cf-error">{removing.error}</div>}
        </Modal>
      )}
    </div>
  );
}

// =====================================================================
// Styles (same palette and look as AiBotSettings.jsx)
// =====================================================================
const css = `
.cf-root,.cf-layer{--ink:#0e1530;--muted:#5b6785;--soft:#8793b2;--line:#e3e8f6;--surface:#ffffff;--p:#6246ea;--p2:#2f7cf6;--p3:#14b8e6;--ok:#10b981;--bad:#e11d48;
  font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,sans-serif;color:var(--ink)}
.cf-root *,.cf-layer *{box-sizing:border-box}
.cf-root{position:relative;display:flex;flex-direction:column;gap:14px;max-width:980px;margin:0 auto}
.cf-root:not(.is-embedded){min-height:100vh;padding:32px;max-width:1012px;
  background:radial-gradient(900px 480px at 8% -8%,#e6e0ff 0%,transparent 60%),radial-gradient(800px 460px at 100% 0%,#d8f3ff 0%,transparent 55%),#f5f7ff}
.cf-hero{display:flex;align-items:center;gap:18px;padding:26px;border-radius:22px;border:1px solid var(--line);
  background:linear-gradient(135deg,#fff 0%,#f0f2ff 55%,#e8f7ff 100%);box-shadow:0 1px 2px rgba(20,30,80,.04),0 18px 40px -22px rgba(70,60,200,.35)}
.cf-hero-icon{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;flex-shrink:0;color:#fff;background:linear-gradient(135deg,var(--p),var(--p3))}
.cf-title{margin:0;font-size:26px;font-weight:800;letter-spacing:-.6px;line-height:1.2}
.cf-subtitle{margin:6px 0 0;font-size:14.5px;line-height:1.55;color:var(--muted);max-width:68ch}
.cf-info{display:flex;flex-direction:column;gap:10px;padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.72);border:1px solid rgba(98,70,234,.16);font-size:13.5px;line-height:1.5;color:#3a4566}
.cf-info code,.cf-confirm code{padding:1px 6px;border-radius:6px;background:#efecff;color:var(--p);font-size:12.5px}
.cf-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cf-count{font-size:13.5px;color:var(--muted)}
.cf-count b{color:var(--ink)}
.cf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;color:var(--ink);
  font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:.15s}
.cf-btn:hover:not(:disabled){border-color:#c3ccea;background:#f8f9ff}
.cf-btn:disabled{opacity:.55;cursor:not-allowed}
.cf-btn-primary{border:0;color:#fff;background:linear-gradient(135deg,var(--p),var(--p2) 60%,var(--p3));box-shadow:0 8px 18px -10px var(--p)}
.cf-btn-primary:hover:not(:disabled){background:linear-gradient(135deg,var(--p),var(--p2) 60%,var(--p3));box-shadow:0 12px 24px -10px var(--p)}
.cf-btn-danger{border:0;color:#fff;background:var(--bad)}
.cf-btn-danger:hover:not(:disabled){background:#be123c}
.cf-list{display:flex;flex-direction:column;gap:12px}
.cf-card{display:flex;gap:18px;justify-content:space-between;padding:16px 18px;border-radius:18px;background:var(--surface);border:1px solid var(--line);transition:.15s}
.cf-card:hover{border-color:#cbd3ee;box-shadow:0 10px 26px -18px rgba(70,60,200,.45)}
.cf-card.is-off{opacity:.62}
.cf-card-main{display:flex;flex-direction:column;gap:7px;min-width:0;flex:1}
.cf-card-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.cf-name{font-size:15.5px;font-weight:700;letter-spacing:-.2px}
.cf-badge{padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700;color:var(--p);background:#efecff}
.cf-badge-store{color:#047857;background:#d1fae5}
.cf-badge-off{color:#92400e;background:#fef3c7}
.cf-token{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:8px;border:1px dashed #c7cff0;background:#f8f9ff;color:#3a4566;font:inherit;font-size:12.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}
.cf-token:hover{border-color:var(--p);color:var(--p)}
.cf-desc{margin:0;font-size:13px;line-height:1.5;color:var(--soft)}
.cf-desc b{color:var(--muted)}
.cf-chips{display:flex;flex-wrap:wrap;gap:6px}
.cf-center{justify-content:center}
.cf-chip{padding:3px 10px;border-radius:999px;border:1px solid #dbe2f4;background:#fff;color:#3a4566;font:inherit;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}
.cf-chip:hover{border-color:var(--p);color:var(--p);background:#f6f4ff}
.cf-chip-static{cursor:default;font-family:inherit;background:#f4f6fd}
.cf-chip-static:hover{border-color:#dbe2f4;color:#3a4566;background:#f4f6fd}
.cf-chip-big{padding:8px 16px;font-family:inherit;font-size:13.5px;font-weight:600}
.cf-cov{display:flex;align-items:center;gap:10px}
.cf-cov-bar{width:140px;height:7px;border-radius:999px;background:#eceffa;overflow:hidden;flex-shrink:0}
.cf-cov-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--p),var(--p3))}
.cf-cov small{font-size:12px;color:var(--soft)}
.cf-card-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:12px;flex-shrink:0}
.cf-toggles{display:flex;flex-direction:column;gap:7px;align-items:flex-start}
.cf-actions{display:flex;gap:6px}
.cf-icon-btn{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;border:1px solid #dbe2f4;background:#fff;color:#3a4566;cursor:pointer;transition:.15s}
.cf-icon-btn:hover:not(:disabled){border-color:var(--p);color:var(--p);background:#f6f4ff}
.cf-icon-btn:disabled{opacity:.35;cursor:not-allowed}
.cf-icon-btn.cf-danger:hover:not(:disabled){border-color:var(--bad);color:var(--bad);background:#fff1f4}
.cf-toggle{position:relative;display:inline-flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px;font-weight:600;color:#2a3558}
.cf-toggle input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.cf-toggle.is-disabled{opacity:.5;cursor:not-allowed}
.cf-track{position:relative;width:34px;height:20px;border-radius:999px;background:#d5dbef;flex-shrink:0;transition:.2s}
.cf-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}
.cf-toggle input:checked + .cf-track{background:linear-gradient(135deg,var(--p),var(--p2) 60%,var(--p3))}
.cf-toggle input:checked + .cf-track .cf-thumb{transform:translateX(14px)}
.cf-toggle input:focus-visible + .cf-track{outline:3px solid rgba(98,70,234,.35);outline-offset:2px}
.cf-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:34px 20px;border-radius:18px;border:1px dashed #c7cff0;background:rgba(255,255,255,.7);color:var(--muted);font-size:14px;text-align:center}
.cf-empty strong{color:var(--ink);font-size:16px}
.cf-empty-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#efecff;color:var(--p)}
.cf-error-box{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:14px;background:#fff1f4;border:1px solid #fecdd6;color:#9f1239;font-size:13.5px}
.cf-error{padding:10px 14px;border-radius:12px;background:#fff1f4;border:1px solid #fecdd6;color:#9f1239;font-size:13px;line-height:1.45}
.cf-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:100000;max-width:min(92vw,520px);padding:12px 18px;border-radius:14px;background:#0e1530;color:#fff;font-size:13.5px;font-weight:600;box-shadow:0 18px 40px -16px rgba(10,15,40,.6)}
.cf-toast.is-err{background:var(--bad)}
.cf-layer{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:16px;background:rgba(14,21,48,.46);backdrop-filter:blur(3px)}
.cf-modal{display:flex;flex-direction:column;width:min(560px,100%);max-height:calc(100dvh - 32px);border-radius:20px;background:#fff;box-shadow:0 30px 80px -24px rgba(10,15,40,.6)}
.cf-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--line)}
.cf-modal-head h4{margin:0;font-size:17px;font-weight:800;letter-spacing:-.3px}
.cf-modal-body{display:flex;flex-direction:column;gap:14px;padding:20px 22px;overflow:auto}
.cf-modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid var(--line)}
.cf-form{display:flex;flex-direction:column;gap:15px}
.cf-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.cf-label{font-size:13px;font-weight:600;color:#2a3558}
.cf-label i{font-weight:500;color:var(--soft)}
.cf-hint{font-size:12.5px;line-height:1.5;color:var(--soft)}
.cf-input{width:100%;padding:10px 13px;border-radius:12px;border:1px solid #dbe2f4;background:#fff;color:var(--ink);font:inherit;font-size:14px;outline:none;transition:.15s}
.cf-input::placeholder{color:#a3adc9}
.cf-input:hover:not(:disabled){border-color:#c3ccea}
.cf-input:focus{border-color:var(--p);box-shadow:0 0 0 4px rgba(98,70,234,.14)}
.cf-input:disabled{background:#f4f6fd;color:var(--soft);cursor:not-allowed}
.cf-textarea{resize:vertical;min-height:84px}
.cf-key{display:flex;align-items:center;gap:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--soft)}
.cf-switch-box{display:flex;flex-direction:column;gap:11px;padding:13px 15px;border-radius:14px;background:#f7f8ff;border:1px solid var(--line)}
.cf-confirm{margin:0;font-size:14px;line-height:1.6;color:#3a4566}
.cf-check{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.5;color:#2a3558;cursor:pointer}
.cf-check input{margin-top:3px}
@media (max-width:768px){
  .cf-root:not(.is-embedded){padding:16px}
  .cf-hero{padding:18px}
  .cf-title{font-size:22px}
  .cf-card{flex-direction:column}
  .cf-card-side{flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap}
  .cf-toolbar{flex-wrap:wrap}
}
`;
