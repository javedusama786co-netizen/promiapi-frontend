import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
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
    id: "acceptance",
    title: "Acceptance of these Terms",
    body: (
      <>
        <p>
          These Terms of Service (“Terms”) are an agreement between you and {LEGAL.brand} (“we”, “us”). By creating an account, connecting a WhatsApp number or otherwise using our website, dashboard, APIs or services (the “Service”), you agree to these Terms and to our <Link to="/policy">Privacy Policy</Link>. If you use the Service for a company, you confirm that you can bind that company. If you do not agree, do not use the Service.
        </p>
      </>
    ),
  },
  {
    id: "the-service",
    title: "The Service and our relationship with Meta",
    body: (
      <>
        <p>
          {LEGAL.brand} is a software platform that helps businesses use the <strong>WhatsApp Business Platform (Cloud API)</strong> to manage contacts, a shared inbox, message campaigns, chatbot flows and AI-assisted replies.
        </p>
        <ul>
          <li>WhatsApp and the WhatsApp Business Platform are provided by Meta. {LEGAL.brand} is an independent company and is not owned or endorsed by Meta Platforms, Inc. or WhatsApp LLC unless we state so in writing.</li>
          <li>The official WhatsApp Business Platform (Cloud API) is our primary and recommended connection method. If the dashboard offers any other way to connect a number, it is optional, is not provided or approved by Meta, and you use it at your own risk and under WhatsApp’s terms.</li>
          <li>Access to WhatsApp, message delivery, message pricing, quality ratings and messaging limits are controlled by Meta, not by us. Meta may change or restrict them at any time.</li>
        </ul>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Eligibility and your account",
    body: (
      <>
        <ul>
          <li>You must be at least 18 and able to enter a binding contract. The Service is for business use.</li>
          <li>Give accurate registration details and keep them up to date.</li>
          <li>You are responsible for everything done under your account and for the admins, agents and API credentials you create. Keep your password and tokens private and tell us promptly if you suspect misuse.</li>
          <li>You must own, or be authorised to use, the WhatsApp Business Account and phone number you connect.</li>
        </ul>
      </>
    ),
  },
  {
    id: "meta-whatsapp-compliance",
    title: "Meta and WhatsApp policies you must follow",
    body: (
      <>
        <p>
          You must comply at all times with the rules that apply to your use of WhatsApp, including:
        </p>
        <ul>
          <li>the {ext("https://www.whatsapp.com/legal/business-terms", "WhatsApp Business Terms of Service")} and the {ext("https://www.whatsapp.com/legal/business-solution-terms", "WhatsApp Business Solution Terms")};</li>
          <li>the {ext("https://business.whatsapp.com/policy", "WhatsApp Business Messaging Policy")} and the {ext("https://www.whatsapp.com/legal/commerce-policy", "WhatsApp Commerce Policy")};</li>
          <li>the {ext("https://developers.facebook.com/terms", "Meta Platform Terms")} and {ext("https://developers.facebook.com/devpolicy", "Meta Developer Policies")}.</li>
        </ul>
        <p>
          If Meta restricts, suspends or removes your WhatsApp Business Account or number, or changes its rules or prices, we are not responsible for the effect on your business. We may suspend your use of the Service where needed to comply with Meta’s requirements.
        </p>
      </>
    ),
  },
  {
    id: "messaging-consent",
    title: "Consent, opt-out and message content",
    body: (
      <>
        <p>You are solely responsible for the messages you send through the Service. In particular you must:</p>
        <ul>
          <li><strong>Get opt-in first.</strong> Only message people who have given you clear permission to receive messages from your business on WhatsApp, and keep proof of that consent.</li>
          <li><strong>Honour opt-out.</strong> Stop messaging anyone who asks, including when they reply STOP or UNSUBSCRIBE or block you. Our system marks such contacts as unsubscribed; you must not work around it.</li>
          <li><strong>Use approved templates</strong> for business-initiated messages outside the 24-hour customer service window, and follow Meta’s template and category rules.</li>
          <li><strong>Keep quality high.</strong> Do not send unsolicited bulk or misleading messages. Low quality ratings can limit or end your messaging.</li>
          <li><strong>Identify your business</strong> clearly and give accurate information.</li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You must not use the Service to:</p>
        <ul>
          <li>break any law or any third party’s rights, or send illegal, fraudulent, deceptive, harassing, hateful, violent or sexually explicit content;</li>
          <li>sell or promote goods and services that WhatsApp prohibits or restricts (such as illegal drugs, weapons, gambling, counterfeit goods, adult content or other items listed in the WhatsApp Commerce Policy);</li>
          <li>collect or request sensitive data such as full payment card numbers, government ID numbers, passwords or health information;</li>
          <li>send spam, run scams or phishing, or scrape, harvest or buy contact lists without consent;</li>
          <li>reverse engineer, resell, copy or attack the Service, overload our systems, or bypass limits and security;</li>
          <li>send malware, or use the Service to harm or impersonate anyone.</li>
        </ul>
        <p>We may remove content, limit features or suspend accounts that break these rules.</p>
      </>
    ),
  },
  {
    id: "ai-features",
    title: "AI features",
    body: (
      <>
        <ul>
          <li>AI-assisted replies are generated automatically by third-party AI models and may be inaccurate, incomplete or unsuitable. You are responsible for reviewing your AI instructions and for what the AI sends in your name.</li>
          <li>Do not rely on AI replies for legal, medical, financial or other advice, and do not use AI to mislead people.</li>
          <li>Tell your customers when they are chatting with an automated assistant where the law or WhatsApp’s policies require it, and keep a way for them to reach a human.</li>
          <li>You can turn AI off, set operating hours and hand conversations to an agent at any time. See our Privacy Policy for how AI data is handled.</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-data",
    title: "Your data and our role",
    body: (
      <>
        <p>
          You keep all rights in the contacts, messages, files and other content you load into the Service (“Customer Data”). You give us a limited licence to host, process and transmit it only to provide the Service to you.
        </p>
        <ul>
          <li>For personal data about your own customers, you are the controller and we are your processor. You promise that you have a lawful basis, notices and consents needed to give us that data and to message those people.</li>
          <li>We process Customer Data only on your instructions, keep it confidential, protect it as described in our <Link to="/policy">Privacy Policy</Link>, and use the sub-processors listed there.</li>
          <li>You can export or delete your data in the dashboard or by contacting us, and we delete it after account closure as set out in the Privacy Policy.</li>
        </ul>
      </>
    ),
  },
  {
    id: "fees",
    title: "Plans, fees and billing",
    body: (
      <>
        <ul>
          <li>Paid plans, limits and prices are shown on our Pricing section and may be updated for future billing periods with notice.</li>
          <li>Subscriptions are billed in advance for each period and renew automatically until cancelled. You can cancel at any time and the plan stays active until the end of the period you paid for.</li>
          <li>Fees exclude taxes, which you are responsible for. <strong>Charges made by Meta</strong> (for example WhatsApp conversation or message fees) are separate from our fees and follow Meta’s pricing.</li>
          <li>Except where the law requires or we state otherwise when you buy, fees are non-refundable. If a payment fails we may suspend paid features until it is settled.</li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: (
      <p>
        The Service works with services we do not control, including Meta’s WhatsApp Business Platform, cloud hosting and storage, AI providers and payment processors. Their availability, changes and terms are outside our control, and your use of them is also subject to their own terms.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The Service, including its software, design, dashboard, text and logos, belongs to {LEGAL.brand} and its licensors and is protected by law. We give you a limited, non-exclusive, non-transferable right to use it for your business while these Terms apply. You may not copy, modify, resell or reverse engineer it, or build a competing service from it, without our written permission.
        </p>
        <p>
          Third-party names and logos, including Meta and WhatsApp, belong to their owners and are used only to identify their services. If you send us feedback, we may use it to improve the Service without obligation to you.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes to the Service",
    body: (
      <p>
        We work to keep the Service available but do not promise it will be uninterrupted or error-free. It may be unavailable for maintenance or because of events outside our control, including problems at Meta or other providers. We may add, change or remove features, and will give reasonable notice of changes that significantly affect you.
      </p>
    ),
  },
  {
    id: "suspension-termination",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          You can stop using the Service and close your account at any time. We may suspend or end your access immediately if you break these Terms or Meta/WhatsApp policies, do not pay fees, create risk or legal exposure for us or others, or if Meta requires it.
        </p>
        <p>
          When an account ends, your access stops and we delete Customer Data as set out in the Privacy Policy. Sections that by nature should continue (for example fees owed, intellectual property, disclaimers, liability and governing law) survive termination.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The Service is provided “as is” and “as available”. To the fullest extent the law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and any promise about message delivery, response rates, AI accuracy, or that your WhatsApp account will not be limited or banned by Meta.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent the law allows, {LEGAL.brand} is not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or goodwill, arising from your use of the Service.
        </p>
        <p>
          Our total liability for all claims relating to the Service is limited to the amount you paid us in the 12 months before the event that gave rise to the claim. Nothing in these Terms limits liability that cannot be limited by law.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You will defend and compensate {LEGAL.brand} against claims, losses and costs (including reasonable legal fees) arising from your messages and content, your lack of consent from recipients, your breach of these Terms or of Meta/WhatsApp policies, or your violation of law or third-party rights.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to these Terms",
    body: (
      <p>
        We may update these Terms, for example to reflect changes to the Service, the law or Meta’s requirements. The “Last updated” date shows the current version. For material changes we will notify you by email or in the dashboard before they take effect. If you keep using the Service after that date, you accept the updated Terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by {LEGAL.governingLaw}, without regard to conflict-of-law rules. We will first try to resolve any dispute informally by contacting each other in good faith. If that does not work, the courts of that jurisdiction have exclusive authority, unless mandatory consumer or data protection law gives you the right to go elsewhere.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <>
        <p>Questions about these Terms:</p>
        <ul>
          <li>Email: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a></li>
          <li>Privacy matters: <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a></li>
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

function Terms() {
  const isDarkMode = useOutletContext(); // MainLayout passes the dark mode status
  const navigate = useNavigate();

  return (
    <LegalLayout
      isDarkMode={isDarkMode}
      navigate={navigate}
      kicker="Legal"
      title="Terms of Service"
      intro="The rules for using PromiAPI, our WhatsApp Cloud API platform, including your responsibilities under Meta and WhatsApp policies."
      sections={SECTIONS}
      otherLabel="Privacy Policy"
      otherPath="/policy"
    />
  );
}

export default Terms;
