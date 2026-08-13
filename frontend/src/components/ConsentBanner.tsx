import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import analytics from "../utils/analytics";

/**
 * Cookie consent banner, wired to Google Consent Mode v2.
 *
 * Pairs with the `gtag('consent', 'default', ...)` block in index.html: that
 * sets the starting position (granted outside the EEA/UK, denied inside), and
 * this collects the visitor's answer and pushes a `consent update` on top.
 *
 * Deliberately renders nothing until after mount and only when no choice is
 * stored. Reading localStorage during render would make the banner flash on
 * every page load for visitors who already answered.
 */
export default function ConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Replay a previous answer into the tag runtime. Consent Mode state is
        // held in memory, not in a cookie, so without this a returning visitor
        // who accepted last week starts denied again.
        analytics.restoreConsent();

        if (analytics.readStoredConsent() === null) setVisible(true);
    }, []);

    if (!visible) return null;

    const decide = (accepted: boolean) => {
        analytics.setConsent({ analytics: accepted, ads: accepted });
        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Cookie preferences"
            className="fixed inset-x-0 bottom-0 z-[9999] p-3 sm:p-4"
        >
            <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[13px] leading-relaxed text-stone-600">
                        We use cookies to understand how devotees use the site and to measure
                        our advertising. You can decline without losing any functionality —
                        bookings, payments and your account all work either way.{" "}
                        <Link
                            to="/privacypolicy"
                            className="font-semibold text-orange-600 underline underline-offset-2"
                        >
                            Privacy Policy
                        </Link>
                    </p>

                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={() => decide(false)}
                            className="rounded-xl border border-stone-300 px-4 py-2.5 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-50"
                        >
                            Decline
                        </button>
                        <button
                            type="button"
                            onClick={() => decide(true)}
                            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition hover:shadow-lg"
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
