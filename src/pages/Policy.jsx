import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// ---- Company details used across this page: check them once and keep them accurate ----
const LEGAL = {
  brand: "PromiAPI",
  site: "promiapi.com",
  privacyEmail: "privacy@promiapi.com",
  supportEmail: "support@promiapi.com", // confirm this mailbox exists
  governingLaw: "the laws of Pakistan", // confirm with your lawyer
  effective: "November 5, 2026",
  updated: "November 5, 2026",
};

const ext = (href, label) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
);

const SECTIONS = [
  {
    id: "introduction",
    title: "Who we are and what this policy covers",
    body: (
      <>
        <p>
          {LEGAL.brand} (“{LEGAL.brand}”, “we”, “us”) provides a business messaging platform at <strong>{LEGAL.site}</strong>. Businesses use our dashboard to connect their own WhatsApp Business account through the <strong>WhatsApp Business Platform (Cloud API)</strong> provided by Meta, and to manage contacts, a shared team inbox, campaigns, chatbot flows and AI-assisted replies.
        </p>
        <p>This policy explains what personal data we handle, why, who we share it with, how long we keep it, and the choices you have. It applies to our website, dashboard, APIs and support channels. We act in two different roles:</p>
        <ul>
          <li><strong>As a controller</strong> for the account data of the businesses and team members who sign up for {LEGAL.brand} (name, email, billing, usage).</li>
          <li><strong>As a processor / service provider</strong> for the data our customers load into the platform about <em>their own</em> customers (contact details and conversations). The business that uses {LEGAL.brand} decides why and how that data is used; we only process it on their instructions to run the service.</li>
        </ul>
        <p className="lg-note">
          WhatsApp, Meta, Facebook and Instagram are trademarks of their respective owners. {LEGAL.brand} is an independent company and is not owned by, or endorsed by, Meta Platforms, Inc. or WhatsApp LLC unless we state so in writing.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <table className="lg-table">
          <thead>
            <tr><th>Category</th><th>Examples</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Account &amp; profile</strong></td><td>Full name, email address, company name, phone number, role (admin / agent), login credentials and plan.</td></tr>
            <tr><td><strong>Billing</strong></td><td>Plan, invoices, billing name and address, payment status. Card details are handled by our payment provider and are not stored by us.</td></tr>
            <tr><td><strong>WhatsApp connection data</strong></td><td>Meta Business / WhatsApp Business Account IDs, phone number ID, display name, webhook settings and the access credentials needed to call Meta’s APIs for you.</td></tr>
            <tr><td><strong>Customer contact data</strong></td><td>Names, phone numbers, WhatsApp profile name, tags, groups, source ad, status, and notes that you or your team add or import (for example from a spreadsheet).</td></tr>
            <tr><td><strong>Conversations &amp; media</strong></td><td>Message text, images, audio, video, documents, locations and shared contact cards, plus timestamps and delivery / read status for messages sent and received through your connected number.</td></tr>
            <tr><td><strong>Automation data</strong></td><td>Chatbot flows, keyword rules, templates, campaign settings, AI instructions and the replies they produce.</td></tr>
            <tr><td><strong>Usage &amp; device data</strong></td><td>IP address, browser type, pages and features used, error logs and security events.</td></tr>
            <tr><td><strong>Support communications</strong></td><td>Messages you send to our team and any files you attach.</td></tr>
          </tbody>
        </table>
        <p>
          <strong>Data we receive from Meta.</strong> When a person messages your business number, Meta sends our servers a webhook containing the message, the sender’s phone number and WhatsApp profile name, delivery statuses and, for Click-to-WhatsApp ads, ad referral details. We receive this only for numbers that you connect.
        </p>
        <p>
          The platform is not designed for highly sensitive data. Please do not use it to collect payment card numbers, government ID numbers, passwords, health records or similar information.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-data",
    title: "How we use information",
    body: (
      <>
        <p>We use information only to run, secure and improve the service, and to meet our legal duties:</p>
        <ul>
          <li>Create and authenticate accounts, and keep sessions secure.</li>
          <li>Connect your WhatsApp Business account and send, receive, store and display messages for you and your team.</li>
          <li>Run the features you configure: campaigns, templates, chatbot flows, keyword rules, handover to agents and AI-assisted replies.</li>
          <li>Show analytics and delivery reports in your dashboard.</li>
          <li>Send service messages such as security alerts, billing notices and important updates.</li>
          <li>Provide support, investigate problems and prevent spam, fraud and abuse.</li>
          <li>Enforce our Terms and the policies of Meta and WhatsApp that apply to our customers.</li>
          <li>Comply with law and respond to valid legal requests.</li>
        </ul>
        <p>
          <strong>We do not sell personal data</strong>, we do not use customer conversations to show advertising, and we do not build marketing profiles of the people who message our customers.
        </p>
      </>
    ),
  },
  {
    id: "meta-whatsapp-data",
    title: "Data from the WhatsApp Business Platform",
    body: (
      <>
        <p>
          Data we receive through Meta’s WhatsApp Business Platform is used only to provide the features that our customers asked for. In line with the {ext("https://developers.facebook.com/terms", "Meta Platform Terms")}, the {ext("https://developers.facebook.com/devpolicy", "Meta Developer Policies")} and the {ext("https://www.whatsapp.com/legal/business-solution-terms", "WhatsApp Business Solution Terms")}, we:
        </p>
        <ul>
          <li>do not sell, license or trade platform data, and do not give it to data brokers or advertising networks;</li>
          <li>do not use it for surveillance, to discriminate, or to make eligibility decisions about individuals;</li>
          <li>do not combine it across customers to identify or track individuals;</li>
          <li>only keep it as long as needed for the service, and delete it when you or the person it relates to ask, unless the law requires us to keep it;</li>
          <li>protect it with appropriate technical and organisational safeguards and limit staff access to what is necessary.</li>
        </ul>
        <p>
          Meta processes messages on its own infrastructure under its own terms and is responsible for its own processing. See the {ext("https://www.whatsapp.com/legal/privacy-policy", "WhatsApp Privacy Policy")} and the {ext("https://www.whatsapp.com/legal/business-terms", "WhatsApp Business Terms of Service")} for how Meta handles data.
        </p>
      </>
    ),
  },
  {
    id: "ai-features",
    title: "AI-assisted replies and automation",
    body: (
      <>
        <p>
          If a customer turns on AI replies, the text of an incoming message, a limited number of recent messages from the same conversation and the business’s own instructions are sent to a third-party AI model provider so that a reply can be generated and sent automatically.
        </p>
        <ul>
          <li>We send only what is needed to produce the reply, and we do not use our customers’ conversations to train our own AI models.</li>
          <li>Our AI providers process the text under their own terms; we choose providers that do not use API data for advertising.</li>
          <li>Replies are generated automatically and can be wrong. Customers can switch the AI off, set operating hours, and hand a conversation to a human agent at any time. People can ask for a human by writing words such as “agent” or “human”.</li>
          <li>Businesses are responsible for telling their customers when they are talking to an automated assistant, where the law or WhatsApp’s policies require it.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    body: (
      <>
        <p>We share data only with the service providers and parties below, and only as needed:</p>
        <table className="lg-table">
          <thead>
            <tr><th>Recipient</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Meta Platforms / WhatsApp</strong></td><td>Delivering and receiving WhatsApp messages and managing your WhatsApp Business account.</td></tr>
            <tr><td><strong>Cloud hosting &amp; database providers</strong></td><td>Running the application and storing platform data (for example our hosting provider and managed database).</td></tr>
            <tr><td><strong>Cloudflare (R2 storage)</strong></td><td>Storing images, audio, video and documents that you upload or that customers send.</td></tr>
            <tr><td><strong>AI model providers</strong></td><td>Generating AI replies when a customer enables them (see the section above).</td></tr>
            <tr><td><strong>Payment &amp; email providers</strong></td><td>Taking payments, sending invoices and service emails.</td></tr>
            <tr><td><strong>Your own team</strong></td><td>Admins and agents you invite can see the conversations and contacts they are allowed to access.</td></tr>
            <tr><td><strong>Authorities &amp; advisers</strong></td><td>Where required by law, to protect rights and safety, or in a merger or sale of the business (with notice to you).</td></tr>
          </tbody>
        </table>
        <p>These providers are bound by contracts that limit their use of the data to the purpose we gave them. We never sell personal data.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: (
      <>
        <table className="lg-table">
          <thead>
            <tr><th>Data</th><th>Retention</th></tr>
          </thead>
          <tbody>
            <tr><td>Account &amp; profile data</td><td>While your account is active, then deleted within 30 days of account closure.</td></tr>
            <tr><td>Contacts, conversations, media, flows and templates</td><td>Until you delete them or close the account, then deleted within 30 days.</td></tr>
            <tr><td>Backups</td><td>Removed on the normal backup cycle, no later than 90 days after deletion.</td></tr>
            <tr><td>Billing and tax records</td><td>For the period required by tax and accounting law.</td></tr>
            <tr><td>Security and access logs</td><td>Up to 12 months, to detect abuse and investigate incidents.</td></tr>
          </tbody>
        </table>
        <p>If the law requires us to keep certain data longer, we keep only what is required and restrict its use.</p>
      </>
    ),
  },
  {
    id: "data-deletion",
    title: "Data deletion instructions",
    body: (
      <>
        <p>You can ask us to delete your data at any time. This section is the data deletion instruction page for {LEGAL.brand}.</p>
        <p><strong>If you are a {LEGAL.brand} customer (a business):</strong></p>
        <ul>
          <li>Delete individual contacts, conversations, templates and flows yourself from the dashboard.</li>
          <li>To delete your whole account and all related data, email <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> from your registered email address with the subject “Account deletion request”.</li>
          <li>If you also want to revoke our access to your WhatsApp Business account, remove {LEGAL.brand} from your Meta Business Manager integrations.</li>
        </ul>
        <p><strong>If you are a person who messaged a business that uses {LEGAL.brand}:</strong></p>
        <ul>
          <li>Ask that business to delete your data, or email us at <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> with the subject “Data deletion request” and the WhatsApp phone number concerned. We may need to verify the request and will pass it to the business where it is the controller of your data.</li>
          <li>To stop receiving messages, reply <strong>STOP</strong> or <strong>UNSUBSCRIBE</strong>; we will stop automated messages to your number, or you can block the business in WhatsApp.</li>
        </ul>
        <p>
          We confirm receipt promptly and complete deletion within <strong>30 days</strong>. Backups are overwritten on their normal cycle. Data that Meta holds on its own systems is outside our control and must be requested from Meta through WhatsApp.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights and choices",
    body: (
      <>
        <p>
          Depending on where you live (for example the EEA, the UK, California or Pakistan), you may have the right to access your data, correct it, delete it, restrict or object to its use, receive a copy in a portable format, and withdraw consent where we rely on it. You may also complain to your local data protection authority.
        </p>
        <p>
          To use these rights, write to <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. We answer within 30 days. For data we process for a business customer, we may direct your request to that business. We do not sell personal information and do not share it for cross-context behavioural advertising.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <p>
          We protect data with measures that include encrypted connections (HTTPS / TLS), authenticated access with session tokens, role-based access for admins and agents, restricted staff access, and monitoring of our systems. No online service can be perfectly secure, so please use a strong password and keep your login private.
        </p>
        <p>
          If we become aware of a breach that affects personal data, we will notify affected customers without undue delay and, where the law requires, the relevant authorities.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "International transfers",
    body: (
      <p>
        We and our providers may process data in countries other than your own, including countries whose data protection laws differ. Where required, we rely on appropriate safeguards such as standard contractual clauses or equivalent contractual protections.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>
          We use only what is necessary: a session token that keeps you signed in, and a local setting that remembers your light or dark theme. We do not use advertising cookies or sell data to advertisers. If we add analytics tools in future, we will describe them here and ask for consent where the law requires.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        {LEGAL.brand} is for businesses and is not directed at anyone under 18. We do not knowingly collect personal data from children. If you believe a child has given us data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as our service, the law or Meta’s requirements change. The “Last updated” date above shows the latest version. For material changes we will notify account holders by email or in the dashboard before they take effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <>
        <p>Privacy questions, requests or concerns:</p>
        <ul>
          <li>Email: <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a></li>
          <li>General support: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a></li>
          <li>Website: {LEGAL.site}</li>
        </ul>
      </>
    ),
  },
];

/* ───────────── SHARED LEGAL PAGE LAYOUT (sticky contents list, scroll highlight, animations) ───────────── */
function LegalLayout({ isDarkMode, navigate, kicker, title, intro, sections, otherLabel, otherPath }) {
  const [active, setActive] = useState(sections[0].id);

  const c = {
    bg: isDarkMode ? "#0a1931" : "#f4f7fc",
    card: isDarkMode ? "#112240" : "#ffffff",
    text: isDarkMode ? "#d7e0ee" : "#2b3648",
    title: isDarkMode ? "#ffffff" : "#0a1931",
    sub: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#1e2f4d" : "#e2e8f0",
    accent: isDarkMode ? "#7fb0ff" : "#2563eb",
    soft: isDarkMode ? "rgba(127,176,255,.10)" : "rgba(37,99,235,.07)",
    shadow: isDarkMode ? "rgba(0,0,0,.35)" : "rgba(15,23,42,.08)",
  };

  // highlight the section being read in the contents list
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
      { rootMargin: "-18% 0px -70% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // a link like /policy#data-deletion opens straight at that section
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return undefined;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView();
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    try { window.history.replaceState(null, "", `#${id}`); } catch (e) { /* ignore */ }
  };

  return (
    <div
      className="lg-page"
      style={{
        "--lg-bg": c.bg, "--lg-card": c.card, "--lg-text": c.text, "--lg-title": c.title, "--lg-sub": c.sub,
        "--lg-border": c.border, "--lg-accent": c.accent, "--lg-soft": c.soft, "--lg-shadow": c.shadow,
      }}
    >
      <style>{legalCss}</style>

      <div className="lg-wrap">
        <button type="button" className="lg-back" onClick={() => navigate("/")}>
          <span aria-hidden="true">←</span> Back to Home
        </button>

        <motion.header className="lg-hero" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="lg-kicker">{kicker}</span>
          <h1>{title}</h1>
          <p className="lg-intro">{intro}</p>
          <div className="lg-meta">
            <span>Effective: {LEGAL.effective}</span>
            <span>Last updated: {LEGAL.updated}</span>
            <button type="button" onClick={() => navigate(otherPath)}>{otherLabel} →</button>
          </div>
        </motion.header>

        <div className="lg-grid">
          <nav className="lg-toc" aria-label="Contents">
            <div className="lg-toc-title">Contents</div>
            <ol>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className={active === s.id ? "on" : ""} onClick={() => go(s.id)}>
                    <i>{String(i + 1).padStart(2, "0")}</i>
                    <span>{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <main className="lg-main">
            {sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                className="lg-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
              >
                <h2><i>{String(i + 1).padStart(2, "0")}</i>{s.title}</h2>
                <div className="lg-body">{s.body}</div>
              </motion.section>
            ))}
            <p className="lg-foot">
              © {new Date().getFullYear()} {LEGAL.brand}. This page describes how we operate; it is not legal advice.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}

const legalCss = `
.lg-page { background: var(--lg-bg); color: var(--lg-text); min-height: 100vh; padding: 48px 20px 80px; transition: background .3s, color .3s; font-family: 'Inter', 'Segoe UI', Roboto, system-ui, sans-serif; }
.lg-page *, .lg-page *::before, .lg-page *::after { box-sizing: border-box; }
.lg-wrap { max-width: 1120px; margin: 0 auto; }
.lg-back { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: none; color: var(--lg-accent); cursor: pointer; font-size: 15px; font-weight: 600; padding: 6px 0; margin-bottom: 22px; font-family: inherit; }
.lg-back span { transition: transform .2s; }
.lg-back:hover span { transform: translateX(-4px); }

.lg-hero { position: relative; overflow: hidden; border-radius: 22px; padding: 38px 36px; margin-bottom: 28px; background: linear-gradient(135deg, rgba(37,99,235,.14), rgba(16,185,129,.12)); border: 1px solid var(--lg-border); }
.lg-hero::after { content: ""; position: absolute; right: -80px; top: -80px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,.28), transparent 70%); pointer-events: none; }
.lg-kicker { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--lg-accent); background: var(--lg-soft); border: 1px solid var(--lg-border); padding: 5px 12px; border-radius: 99px; }
.lg-hero h1 { margin: 14px 0 10px; font-size: clamp(30px, 4.4vw, 44px); line-height: 1.1; font-weight: 800; letter-spacing: -1px; color: var(--lg-title); }
.lg-intro { max-width: 720px; margin: 0; font-size: 16.5px; line-height: 1.7; color: var(--lg-text); }
.lg-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 20px; }
.lg-meta span, .lg-meta button { font-size: 13px; font-weight: 600; padding: 7px 13px; border-radius: 99px; border: 1px solid var(--lg-border); background: var(--lg-card); color: var(--lg-sub); font-family: inherit; }
.lg-meta button { cursor: pointer; color: var(--lg-accent); transition: background .2s, transform .2s; }
.lg-meta button:hover { background: var(--lg-soft); transform: translateY(-1px); }

.lg-grid { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 28px; align-items: start; }
.lg-toc { position: sticky; top: 92px; max-height: calc(100vh - 116px); overflow-y: auto; background: var(--lg-card); border: 1px solid var(--lg-border); border-radius: 18px; padding: 16px 10px 12px; box-shadow: 0 10px 30px -18px var(--lg-shadow); }
.lg-toc-title { font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--lg-sub); padding: 0 10px 10px; }
.lg-toc ol { list-style: none; margin: 0; padding: 0; }
.lg-toc button { width: 100%; display: flex; align-items: baseline; gap: 10px; text-align: left; background: transparent; border: none; border-radius: 10px; padding: 8px 10px; cursor: pointer; color: var(--lg-sub); font-size: 13.5px; font-weight: 500; line-height: 1.35; font-family: inherit; transition: background .2s, color .2s; }
.lg-toc button i { font-style: normal; font-size: 11px; font-weight: 700; opacity: .7; flex-shrink: 0; }
.lg-toc button:hover { background: var(--lg-soft); color: var(--lg-title); }
.lg-toc button.on { background: var(--lg-soft); color: var(--lg-accent); font-weight: 700; }

.lg-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.lg-card { scroll-margin-top: 92px; background: var(--lg-card); border: 1px solid var(--lg-border); border-radius: 18px; padding: 28px 30px; box-shadow: 0 10px 30px -22px var(--lg-shadow); }
.lg-card h2 { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; font-size: 21px; line-height: 1.25; font-weight: 700; color: var(--lg-title); letter-spacing: -.3px; }
.lg-card h2 i { font-style: normal; font-size: 12px; font-weight: 800; color: var(--lg-accent); background: var(--lg-soft); border-radius: 8px; padding: 5px 8px; flex-shrink: 0; }
.lg-body { font-size: 15.5px; line-height: 1.8; }
.lg-body p { margin: 0 0 12px; }
.lg-body p:last-child, .lg-body ul:last-child { margin-bottom: 0; }
.lg-body ul { margin: 0 0 12px; padding-left: 22px; }
.lg-body li { margin: 5px 0; }
.lg-body li::marker { color: var(--lg-accent); }
.lg-body strong { color: var(--lg-title); font-weight: 650; }
.lg-body a { color: var(--lg-accent); font-weight: 600; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .2s; word-break: break-word; }
.lg-body a:hover { border-bottom-color: var(--lg-accent); }
.lg-note { margin: 14px 0 0; padding: 13px 16px; border-radius: 12px; background: var(--lg-soft); border-left: 3px solid var(--lg-accent); font-size: 14.5px; line-height: 1.65; }
.lg-table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 14px; display: block; overflow-x: auto; }
.lg-table th, .lg-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--lg-border); vertical-align: top; }
.lg-table th { color: var(--lg-title); font-weight: 700; white-space: nowrap; }
.lg-foot { text-align: center; font-size: 13px; color: var(--lg-sub); margin: 14px 0 0; }

@media (max-width: 900px) {
  .lg-page { padding: 32px 14px 64px; }
  .lg-grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }
  .lg-toc { position: static; max-height: none; }
  .lg-toc ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 8px; }
  .lg-hero { padding: 28px 22px; }
}
@media (max-width: 560px) {
  .lg-toc ol { grid-template-columns: minmax(0, 1fr); }
  .lg-card { padding: 22px 18px; }
  .lg-card h2 { font-size: 19px; }
  .lg-body { font-size: 15px; }
}
@media (prefers-reduced-motion: reduce) { .lg-page * { transition: none !important; animation: none !important; } }
`;

function Policy() {
  const isDarkMode = useOutletContext(); // MainLayout passes the dark mode status
  const navigate = useNavigate();

  return (
    <LegalLayout
      isDarkMode={isDarkMode}
      navigate={navigate}
      kicker="Legal"
      title="Privacy Policy"
      intro="How PromiAPI collects, uses, shares and protects personal data when businesses use our WhatsApp Cloud API platform, including how to ask for your data to be deleted."
      sections={SECTIONS}
      otherLabel="Terms of Service"
      otherPath="/terms"
    />
  );
}

export default Policy;
