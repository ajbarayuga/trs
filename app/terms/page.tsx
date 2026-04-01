import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/ui/site-footer";

export const metadata = {
  title: "Terms of Use — The Recording Service",
  description:
    "Terms governing use of The Recording Service Quote Generator and production services.",
};

export default function TermsPage() {
  const effectiveDate = "January 1, 2025";

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-2 px-md-0 py-16">
        {/* Back */}
        <Link
          href="/quote"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-12"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Quote
        </Link>

        {/* Header */}
        <div className="mb-12 pb-8 border-b">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">
            The Recording Service LLC
          </p>
          <h1 className="text-4xl font-black tracking-tight uppercase mb-4">
            Terms of Use
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective date: {effectiveDate}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <p>
            These Terms of Use govern your access to and use of the Quote
            Generator tool operated by The Recording Service LLC ("we," "us," or
            "our"). By submitting a quote request, you agree to these terms. If
            you do not agree, please do not use this tool.
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              1. Nature of the Quote Generator
            </h2>
            <p className="mb-3">
              The Quote Generator produces{" "}
              <strong>automated estimates only</strong>. Submitting a quote
              request does not constitute a binding contract, purchase order, or
              confirmed booking with The Recording Service LLC.
            </p>
            <p>
              All estimates are subject to review by a Producer. Final pricing
              may differ from the automated estimate based on scope changes,
              venue conditions, equipment availability, or other factors. A
              binding agreement is only formed when both parties sign a formal
              production proposal or service agreement.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              2. Accuracy of Information
            </h2>
            <p>
              You agree to provide accurate and complete information when using
              the Quote Generator. Estimates generated from inaccurate or
              incomplete information may not reflect actual production costs.
              The Recording Service LLC is not responsible for quotes that are
              materially different from the final invoice due to information you
              provided being incorrect or incomplete.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              3. Production Terms
            </h2>
            <p className="mb-3">
              The following terms apply to all production engagements confirmed
              through this tool:
            </p>

            <div className="space-y-4">
              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-bold text-foreground text-xs uppercase tracking-widest mb-2">
                  Run of Show
                </p>
                <p className="text-muted-foreground">
                  A final Run of Show document must be submitted at least{" "}
                  <strong className="text-foreground">3 business days</strong>{" "}
                  before the production date. Failure to provide this may affect
                  service delivery.
                </p>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-bold text-foreground text-xs uppercase tracking-widest mb-2">
                  Rush Fee
                </p>
                <p className="text-muted-foreground">
                  A rush fee of up to{" "}
                  <strong className="text-foreground">20%</strong> of the quoted
                  amount applies to events requested with less than two (2) full
                  business days' notice (16 business hours).
                </p>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-bold text-foreground text-xs uppercase tracking-widest mb-2">
                  Cancellation Policy
                </p>
                <div className="text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">
                      30–6 days before:
                    </strong>{" "}
                    Pre-production fully billed for completed work; production
                    labor 50%; equipment 25%.
                  </p>
                  <p>
                    <strong className="text-foreground">5–1 day before:</strong>{" "}
                    Production labor 50% for all labor; equipment 50%.
                  </p>
                  <p>
                    <strong className="text-foreground">
                      Less than 24 hours:
                    </strong>{" "}
                    Production labor and equipment fully billed.
                  </p>
                  <p>
                    Post-production labor is not charged for any cancellation
                    prior to filming.
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-bold text-foreground text-xs uppercase tracking-widest mb-2">
                  Deposit
                </p>
                <p className="text-muted-foreground">
                  For projects valued over{" "}
                  <strong className="text-foreground">$10,000</strong>, a 50%
                  deposit is required at least 14 days before the first
                  production day.
                </p>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-bold text-foreground text-xs uppercase tracking-widest mb-2">
                  Holiday Rates
                </p>
                <p className="text-muted-foreground mb-2">
                  Labor items are billed at{" "}
                  <strong className="text-foreground">1.5×</strong> on: New
                  Year's Day, Memorial Day, July 4th, Labor Day, Black Friday,
                  and New Year's Eve after 12pm.
                </p>
                <p className="text-muted-foreground">
                  Labor items are billed at{" "}
                  <strong className="text-foreground">2×</strong> on:
                  Thanksgiving, Christmas Day, and Christmas Eve.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              4. Video Editing & Delivery
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • Edited videos are delivered within{" "}
                <strong className="text-foreground">14 days</strong> of the
                recording date under a Standard Edit package.
              </li>
              <li>
                • Clients have{" "}
                <strong className="text-foreground">60 days</strong> from
                delivery to submit review feedback. After 60 days, the project
                is considered accepted.
              </li>
              <li>
                • Once feedback is received, a revised version is delivered
                within{" "}
                <strong className="text-foreground">2 business days</strong>.
              </li>
              <li>
                • PowerPoint presentations must be submitted at least{" "}
                <strong className="text-foreground">3 days prior</strong> to the
                event. Discounts or refunds are not issued for PPT-related
                issues when this deadline is not met.
              </li>
              <li>
                • For projects with video editing, billing is split into
                "Production Day" and "Video Editing" invoices. If raw footage is
                delivered immediately after filming, both are included on the
                first invoice.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              5. Venue Built-In AV
            </h2>
            <p>
              If you indicate that your venue has built-in AV equipment, your
              estimate will reflect discounts accordingly. However, if venue
              technology is found to be broken, non-functional, or below the
              required standard on production day, a revised quote will be
              issued to cover the additional equipment required. The Recording
              Service LLC offers a complimentary site visit to evaluate built-in
              AV capabilities prior to your event upon request.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              6. Internet Requirements for Live Streaming
            </h2>
            <p>
              For live streaming services, the client is responsible for
              providing a stable internet connection with an upload speed of at
              least <strong>15 Mb/s per streaming platform</strong>. The
              Recording Service LLC is not responsible for stream failures
              caused by insufficient internet connectivity at the venue.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              7. Acceptable Use of the Quote Generator
            </h2>
            <p className="mb-3">You agree not to use this tool to:</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• Submit false, misleading, or fraudulent information</li>
              <li>• Attempt to manipulate or exploit the pricing calculator</li>
              <li>
                • Conduct automated scraping, crawling, or abuse of the API
                endpoints
              </li>
              <li>
                • Interfere with the security or operation of the tool or its
                underlying infrastructure
              </li>
              <li>
                • Submit content that is unlawful, offensive, or violates the
                rights of others
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to block access to users or IP addresses that
              violate these terms.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              8. Intellectual Property
            </h2>
            <p>
              All content, design, code, and materials on this website are the
              property of The Recording Service LLC. You may not reproduce,
              distribute, or create derivative works from any part of this tool
              without prior written permission.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              9. Limitation of Liability
            </h2>
            <p>
              The Recording Service LLC provides this Quote Generator "as is"
              without warranties of any kind. We are not liable for any
              indirect, incidental, or consequential damages arising from your
              use of or reliance on the automated estimates produced by this
              tool. Our total liability for any claim arising from use of the
              Quote Generator is limited to the amount paid for the relevant
              production service.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              10. Governing Law
            </h2>
            <p>
              These Terms of Use are governed by the laws of the State of
              Georgia, United States, without regard to its conflict of law
              provisions. Any disputes arising from these terms or use of this
              tool shall be subject to the exclusive jurisdiction of the state
              and federal courts located in Georgia.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              11. Changes to These Terms
            </h2>
            <p>
              We reserve the right to modify these Terms of Use at any time.
              Changes take effect immediately upon posting to this page.
              Continued use of the Quote Generator after changes are posted
              constitutes your acceptance of the revised terms.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-base font-black uppercase tracking-widest mb-4 text-foreground">
              12. Contact
            </h2>
            <div className="bg-muted/30 rounded-2xl p-6">
              <p className="font-bold text-foreground mb-2">
                The Recording Service
              </p>
              <p className="text-muted-foreground">Atlanta, GA</p>
              <p className="text-muted-foreground">404-333-8901</p>

              <a
                href="mailto:contact@therecordingservice.com"
                className="text-primary hover:underline font-medium"
              >
                contact@therecordingservice.com
              </a>
            </div>
          </section>
        </div>

      <SiteFooter />
      </div>
    </main>
  );
}
