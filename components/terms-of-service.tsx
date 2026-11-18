"use client";

import React from "react";
import { X } from "lucide-react";

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function TermsOfService({
  isOpen,
  onClose,
  onAccept,
}: TermsOfServiceProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Click backdrop to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[920px] bg-surface border border-border-dim rounded-xl shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-dim bg-slate-50/80">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Terms of Service
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Last Updated: November 2026
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 text-sm leading-relaxed space-y-6 text-slate-700 font-sans overscroll-contain">
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              1. Acceptance &amp; Service Description
            </h3>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally
              binding agreement between you (&ldquo;User&rdquo;,
              &ldquo;Customer&rdquo;, or &ldquo;you&rdquo;) and YOUR-COMPANY-NAME
              (&ldquo;AdsManager&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;), governing access to the AdsManager platform
              hosted at YOUR-DOMAIN.
            </p>
            <p className="mt-2">
              AdsManager provides software-as-a-service (SaaS) tools for Amazon
              sellers and brand owners, including advertising campaign performance
              analytics, automated bid management, placement metric breakdowns,
              AI-assisted recommendations, and rule-based optimizations.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              2. Account Registration &amp; Security
            </h3>
            <p>
              To utilize AdsManager, you must register an account with a valid
              email address and maintain the confidentiality of your login
              credentials. You are responsible for all activities and automated
              actions occurring under your account. You agree to notify us
              immediately of any unauthorized account access.
            </p>
          </section>

          <section className="bg-slate-100 p-4 rounded-md border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              3. Amazon Advertising API Terms &amp; User Authorization
            </h3>
            <p>
              By linking your Amazon Advertising account through Login with
              Amazon (LWA), you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                You own or possess explicit managerial authorization for the
                linked Amazon Seller or Vendor advertising accounts.
              </li>
              <li>
                You maintain compliance with all applicable Amazon policies,
                including the Amazon Advertising Agreement, Amazon Program
                Policies, and Amazon Brand Guidelines.
              </li>
              <li>
                You grant AdsManager permission to programmatically access your
                advertising metrics and execute campaign creations, bid changes,
                budget adjustments, and keyword additions on your behalf as
                directed by your manual commands or configured automation rules.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              4. Subscriptions, Fees &amp; Billing
            </h3>
            <p>
              AdsManager is provided on a subscription basis billed monthly or
              annually via Stripe. Subscription fees are payable in advance and are
              non-refundable except where required by law. You may cancel your
              subscription at any time through the Billing settings; cancellation
              takes effect at the end of the current billing cycle.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              5. Disclaimer of Outcomes &amp; Advertising Risk
            </h3>
            <p>
              While AdsManager provides analytical insights, rule-based
              automations, and AI recommendations designed to enhance
              advertising efficiency, advertising performance depends on
              marketplace dynamics, competitor bidding, inventory availability,
              and Amazon search algorithms. We do not guarantee specific sales
              increases, conversion rates, or ACOS reductions. You retain
              ultimate discretion over your advertising budgets and bid
              modifiers.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              6. Limitation of Liability
            </h3>
            <p>
              To the maximum extent permitted by law, YOUR-COMPANY-NAME and its
              affiliates shall not be liable for any indirect, incidental,
              consequential, special, or punitive damages, including loss of
              profits, advertising spend discrepancies, Amazon platform
              suspensions, or business interruptions, arising from the use or
              inability to use the service.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              7. Termination &amp; Disconnection
            </h3>
            <p>
              Either party may terminate this agreement at any time. You may
              disconnect your Amazon Advertising accounts at any time from the
              account settings, which immediately deletes and purges stored
              authentication tokens from our database. We reserve the right to
              suspend or terminate accounts that breach these Terms or Amazon
              Advertising API compliance rules.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              8. Governing Law &amp; Dispute Resolution
            </h3>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of India. Any legal action or proceeding arising under or in
              relation to these Terms shall be subject to the exclusive
              jurisdiction of the courts at YOUR-CITY, India.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              9. Contact Information
            </h3>
            <p>
              For legal notices, billing queries, or questions regarding these
              Terms, please contact:
            </p>
            <p className="mt-2 font-mono text-xs bg-slate-100 p-3 rounded border border-border-dim inline-block">
              Email: legal@YOUR-DOMAIN
              <br />
              Entity: YOUR-COMPANY-NAME
              <br />
              Website: https://YOUR-DOMAIN
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-dim bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="px-4 py-2 text-sm cursor-pointer font-medium text-white bg-primary rounded-md hover:bg-indigo-600 transition-colors shadow-sm"
            >
              I Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
