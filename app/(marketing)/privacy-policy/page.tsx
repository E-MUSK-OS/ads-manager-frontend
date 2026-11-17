import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-16 px-6">
      <div className="max-w-4xl mx-auto bg-surface border border-border-dim rounded-lg p-8 sm:p-12 shadow-sm">
        <div className="mb-8 pb-6 border-b border-border-dim">
          <Link href="/" className="text-xs font-mono text-primary hover:underline uppercase tracking-wider mb-2 inline-block">
            &larr; Back to AdsManager
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-2">Last Updated: November 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6 text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Introduction &amp; Scope</h2>
            <p>
              This Privacy Policy describes how YOUR-COMPANY-NAME (&ldquo;AdsManager&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operating at YOUR-DOMAIN, collects, uses, stores, and protects information when you use our software-as-a-service application. We provide analytics, automated bidding, and campaign management tools for Amazon sellers and advertising accounts as a third-party developer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Data We Collect</h2>
            <p>To provide and improve our advertising management tools, we collect the following categories of data:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>User Account Information:</strong> Name, business email address, company name, and encrypted authentication credentials.</li>
              <li><strong>Contact Form Submissions:</strong> Contact-form submissions (name, email, message, IP address) are stored so we can respond to support requests.</li>
              <li><strong>Amazon Advertising API Data:</strong> When you connect your account via Login with Amazon (LWA), we access advertising profiles, entity IDs, marketplace identifiers, campaign metadata, targeting criteria, keywords, search terms, and historical performance metrics (impressions, clicks, spend, sales, orders, ACOS, and ROAS).</li>
              <li><strong>Billing Information:</strong> Payment processing is handled directly by Stripe. We do not store full credit card or debit card numbers on our servers.</li>
              <li><strong>Technical &amp; Usage Logs:</strong> IP addresses, browser types, and API access logs utilized strictly for service reliability, security auditing, and rate limiting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. How We Use Your Data</h2>
            <p>We process collected information solely for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Displaying customized advertising dashboards, metric trends, and placement analytics.</li>
              <li>Generating algorithmic and AI-driven campaign optimization suggestions and bid adjustments.</li>
              <li>Executing automated bid modifiers, budget changes, and keyword updates that you authorize or configure.</li>
              <li>Communicating critical service alerts, billing notifications, and customer support responses.</li>
            </ul>
          </section>

          <section className="bg-slate-100 p-4 rounded-md border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Amazon Advertising Data Protection &amp; Restrictions</h2>
            <p className="font-medium text-slate-800">
              In strict adherence to Amazon&apos;s Data Protection Policy and Advertising API Developer Agreement:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>No Data Brokering or Sale:</strong> We do NOT sell, rent, lease, or monetize Amazon advertising data to any third party.</li>
              <li><strong>No Cross-Seller Intelligence:</strong> Your Amazon advertising data is completely isolated. We never aggregate, pool, or benchmark your campaign metrics with other sellers for commercial or intelligence products.</li>
              <li><strong>Strict Purpose Limitation:</strong> Amazon Advertising data is utilized exclusively to provide service features to the specific user account that granted authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. AI Processing &amp; Large Language Models</h2>
            <p>
              AdsManager incorporates Anthropic&apos;s Claude API to generate advertising recommendations and performance summaries. When you use AI features, the AI receives:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Aggregated 30-day performance totals (spend, sales, and ACOS in ₹).</li>
              <li>The number of active campaigns.</li>
              <li>The text of the questions you type in AI chat.</li>
            </ul>
            <p className="mt-2 text-slate-700">
              Please do not enter personal information or customer data in AI chat. Customer data is not used by our AI providers to train foundation models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">6. Storage, Encryption &amp; Security Standards</h2>
            <p>We enforce modern administrative, physical, and technical safeguards:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Encryption at Rest:</strong> All Amazon LWA OAuth refresh tokens are encrypted at rest using Fernet (AES-128-CBC with HMAC-SHA256) authenticated cryptography before database storage. Application data is stored in a managed database that encrypts data at rest.</li>
              <li><strong>Encryption in Transit:</strong> All web traffic and outbound Amazon Ads API requests are encrypted in transit using TLS (HTTPS).</li>
              <li><strong>Secret Hygiene:</strong> Application tokens and authorization credentials are excluded from source code, version control, and client-facing API responses.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">7. Data Retention &amp; Deletion Policy</h2>
            <p>
              We retain advertising data only as long as your account remains active. You may disconnect an Amazon account at any time using the in-app &ldquo;Disconnect&rdquo; button, which immediately and permanently purges stored OAuth tokens and cryptographic keys from our production database, and cascades deletion of synced account data. Backups are purged within YOUR-BACKUP-RETENTION-PERIOD. Contact-form messages are kept for YOUR-CONTACT-RETENTION-PERIOD and then deleted. You can delete your account and all associated data directly at any time from Settings (&ldquo;Delete my account&rdquo;) or by requesting erasure through our Grievance Officer. Upon account deletion or written deletion request, all historical metrics and cached records are permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">8. Third-Party Subprocessors</h2>
            <p>We partner with vetted cloud and infrastructure providers subject to rigorous confidentiality and security standards:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {/* CONFIRM: verify managed database hosting region for India (e.g. AWS ap-south-1 Mumbai) */}
              <li><strong>Neon Inc.:</strong> Managed cloud PostgreSQL database.</li>
              <li><strong>Stripe Inc.:</strong> Payment processing and billing subscription infrastructure.</li>
              <li><strong>Anthropic PBC:</strong> Large language model inference for advertising recommendations.</li>
              {/* CONFIRM: list only the hosting providers actually used (e.g. AWS, Vercel, Railway) */}
              <li><strong>Hosting Infrastructure:</strong> YOUR-HOSTING-PROVIDER (e.g., AWS / Vercel).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">9. Your Rights &amp; Grievance Redressal</h2>
            <p>
              In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian law, you possess the right to access, review, correct, update, or request the erasure of your personal data, as well as the right to grievance redressal. You may delete your account directly via Settings (&ldquo;Delete my account&rdquo;) or request erasure through our Grievance Officer. You may also revoke AdsManager&apos;s API permissions directly from your Amazon Seller Central India or Advertising Console under <em>Manage App Permissions</em>.
            </p>
            <div className="mt-4 p-4 rounded-md border border-slate-200 bg-slate-50 text-xs">
              <h3 className="font-bold text-slate-900 mb-1">Grievance Officer (India)</h3>
              <p className="text-slate-600">
                In compliance with the Information Technology Act, 2000 and the DPDP Act, 2023, the details of our Grievance Officer are:
              </p>
              <p className="font-mono mt-1 text-slate-800">
                Name: YOUR-GRIEVANCE-OFFICER-NAME<br />
                Email: grievance@YOUR-DOMAIN<br />
                Response Time: Within YOUR-GRIEVANCE-RESPONSE-TIME (e.g. 48 hours)
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">10. Contact Us</h2>
            <p>
              For privacy inquiries, data deletion requests, or questions regarding our Amazon Ads data compliance, please contact our Data Protection team at:
            </p>
            <p className="mt-2 font-mono text-xs bg-slate-100 p-3 rounded border border-border-dim inline-block">
              Email: support@YOUR-DOMAIN<br />
              Entity: YOUR-COMPANY-NAME<br />
              Website: https://YOUR-DOMAIN
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
