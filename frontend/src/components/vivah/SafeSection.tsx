import { Component, type ReactNode } from "react";
import { Phone } from "lucide-react";

/**
 * Per-section error boundary for the Vivah pages.
 *
 * The rule: bad data from the backend may cost us ONE section, never the page.
 * If anything inside throws while rendering — a malformed catalog row, an
 * unexpected null off the API, a bad image of state — the boundary swallows it
 * and paints the section's static backup content instead, so the family keeps
 * scrolling and can still reach the callback number. The error is logged for
 * us, invisible to them.
 *
 * Usage:
 *   <SafeSection name="packages" fallback={<StaticPackages />}> …live… </SafeSection>
 */
export default class SafeSection extends Component<
  { name: string; fallback?: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Ours to see, never the family's.
    console.error(`[Vivah] section "${this.props.name}" crashed — static backup shown:`, error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    // Generic backup: keep the visual rhythm and hand them a human.
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl border border-viv-hair bg-viv-sheet p-6 text-center">
          <p className="display text-[18px] text-viv-maroon">
            This section is being refreshed
          </p>
          <p className="text-[12.5px] text-viv-muted mt-1.5">
            Everything else on this page works — or call us and we'll help directly.
          </p>
          <a
            href="tel:+919056955311"
            className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-viv-orange"
          >
            <Phone className="w-3.5 h-3.5" /> +91 90569 55311
          </a>
        </div>
      </div>
    );
  }
}

/* ── Static backups for the sections that matter most ─────────────────────── */

/**
 * The three tiers as plain, dependency-free markup — real prices from the
 * bundled defaults, zero dynamic data, so this can never itself crash.
 */
export function StaticPackagesBackup({ onBook }: { onBook?: () => void }) {
  const tiers = [
    { name: "Shubh Vivah", price: "₹21,000", note: "1 Pandit Ji · every ritual included" },
    { name: "Raj Vivah", price: "₹51,000", note: "2 Pandit Jis · shagun gifts · most popular" },
    { name: "Maharaja Vivah", price: "₹1,11,000", note: "3 Pandit Jis · dedicated coordinator" },
  ];
  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
      <h2 className="text-[26px] text-viv-ink text-center">Complete Marriage Packages</h2>
      <div className="grid sm:grid-cols-3 gap-4 mt-5">
        {tiers.map((t) => (
          <div key={t.name} className="rounded-2xl border border-viv-hair bg-white p-5 text-center">
            <p className="display text-[20px] text-viv-maroon">{t.name}</p>
            <p className="text-[24px] font-bold text-viv-ink mt-1">{t.price}</p>
            <p className="text-[12px] text-viv-muted mt-1.5">{t.note}</p>
            <button
              onClick={onBook}
              className="mt-4 w-full bg-gradient-to-b from-viv-orange-lt to-viv-orange text-white font-semibold text-[13px] py-2.5 rounded-lg"
            >
              Book {t.name}
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-[11.5px] text-viv-muted-2 mt-3">
        Live pricing is confirmed again at checkout before any payment.
      </p>
    </div>
  );
}

/** Guides list as plain links — the SEO hub stays reachable no matter what. */
export function StaticGuidesBackup() {
  const links = [
    ["Shubh Vivah Muhurat 2026–2027", "/vedic-vivah/guides/shubh-vivah-muhurat-2026-2027"],
    ["Saptapadi — the Seven Vows", "/vedic-vivah/guides/saptapadi-seven-vows-hindu-marriage"],
    ["Kundali Milan: 36 Gunas", "/vedic-vivah/guides/kundali-milan-gun-milan-36-gunas"],
    ["Pandit for Marriage: Cost & Booking", "/vedic-vivah/guides/pandit-for-marriage-cost-booking-guide"],
  ];
  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
      <h2 className="text-[24px] text-viv-ink text-center">Vivah Guides</h2>
      <ul className="mt-4 grid sm:grid-cols-2 gap-2 max-w-[640px] mx-auto">
        {links.map(([label, href]) => (
          <li key={href}>
            <a
              href={href}
              className="block rounded-xl border border-viv-hair bg-white px-4 py-3 text-[13px] font-medium text-viv-maroon hover:border-viv-gold transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
