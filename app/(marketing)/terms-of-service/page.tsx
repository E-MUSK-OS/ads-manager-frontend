import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-16 px-6">
      <div className="max-w-4xl mx-auto bg-surface border border-border-dim rounded-lg p-8 sm:p-12 shadow-sm">
        <div className="mb-8 pb-6 border-b border-border-dim">
          <Link href="/" className="text-xs font-mono text-primary hover:underline uppercase tracking-wider mb-2 inline-block">
            &larr; Back to AdsManager
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-500 mt-2">Last Updated: November 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6 text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance &amp; Service Description</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Customer&rdquo;, or &ldquo;you&rdquo;) and YOUR-COMPANY-NAME (&ldquo;AdsManager&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing access to the AdsManager platform hosted at YOUR-DOMAIN.
            </p>
            <p className="mt-2">
              AdsManager provides software-as-a-service (SaaS) tools for Amazon sellers and brand owners, including advertising campaign performance analytics, automated bid management, placement metric breakdowns, AI-assisted recommendations, and rule-based optimizations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Account Registration &amp; Security</h2>
            <p>
              To utilize AdsManager, you must register an account with a valid email address and maintain the confidentiality of your login credentials. You are responsible for all activities and automated actions occurring under your account. You agree to notify us immediately of any unauthorized account access.
            </p>
          </section>

          <section className="bg-slate-100 p-4 rounded-md border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Amazon Advertising API Terms &amp; User Authorization</h2>
            <p>
              By linking your Amazon Advertising account through Login with Amazon (LWA), you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>You own or possess explicit managerial authorization for the linked Amazon Seller or Vendor advertising accounts.</li>
              <li>You maintain compliance with all applicable Amazon policies, including the Amazon Advertising Agreement, Amazon Program Policies, and Amazon Brand Guidelines.</li>
              <li>You grant AdsManager permission to programmatically access your advertising metrics and execute campaign creations, bid changes, budget adjustments, and keyword additions on your behalf as directed by your manual commands or configured automation rules.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Subscriptions, Fees &amp; Billing</h2>
            <p>
              AdsManager is provided on a subscription basis billed monthly or annually via Stripe. Subscription fees are payable in advance and are non-refundable except where required by law. You may cancel your subscription at any time through the Billing settings; cancellation takes effect at the end of the current billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Disclaimer of Outcomes &amp; Advertising Risk</h2>
            <p>
              While AdsManager provides analytical insights, rule-based automations, and AI recommendations designed to enhance advertising efficiency, advertising performance depends on marketplace dynamics, competitor bidding, inventory availability, and Amazon search algorithms. We do not guarantee specific sales increases, conversion rates, or ACOS reductions. You retain ultimate discretion over your advertising budgets and bid modifiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, YOUR-COMPANY-NAME and its affiliates shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, advertising spend discrepancies, Amazon platform suspensions, or business interruptions, arising from the use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">7. Termination &amp; Disconnection</h2>
            <p>
              Either party may terminate this agreement at any time. You may disconnect your Amazon Advertising accounts at any time from the account settings, which immediately deletes and purges stored authentication tokens from our database. We reserve the right to suspend or terminate accounts that breach these Terms or Amazon Advertising API compliance rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">8. Governing Law &amp; Dispute Resolution</h2>
            {/* CONFIRM with a lawyer: verify jurisdiction city and arbitration clause */}
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal action or proceeding arising under or in relation to these Terms shall be subject to the exclusive jurisdiction of the courts at YOUR-CITY, India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">9. Contact Information</h2>
            <p>
              For legal notices, billing queries, or questions regarding these Terms, please contact:
            </p>
            <p className="mt-2 font-mono text-xs bg-slate-100 p-3 rounded border border-border-dim inline-block">
              Email: legal@YOUR-DOMAIN<br />
              Entity: YOUR-COMPANY-NAME<br />
              Website: https://YOUR-DOMAIN
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
