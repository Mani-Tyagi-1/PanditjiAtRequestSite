import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
    message?: string;
    ctaLabel?: string;
    ctaTo?: string;
};

/**
 * Slim dismissible announcement strip above DesktopHeader (tablet/desktop
 * only — mobile has no equivalent). Dismissal is per-mount (session), not
 * persisted, so it reappears on the next full page load.
 */
export default function TopPromoBar({
    message = "Shani Amavasya Special: Perform Pitra Dosh Nivaran Puja today and receive blessings for your ancestors.",
    ctaLabel = "Book Now & Get 10% Off",
    ctaTo = "/book-puja",
}: Props) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    return (
        <div className="hidden md:block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white">
            <div className="px-6 lg:px-10 h-10 flex items-center justify-center gap-4 text-[12.5px] lg:text-[13px] font-medium relative">
                <p className="truncate">
                    <span aria-hidden="true">🔔</span> {message}
                </p>
                <Link
                    to={ctaTo}
                    className="shrink-0 bg-white/15 hover:bg-white/25 border border-white/25 rounded-full px-3.5 py-1 text-[11.5px] lg:text-xs font-bold transition-colors cursor-pointer"
                >
                    {ctaLabel}
                </Link>
                <button
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss announcement"
                    className="absolute right-6 lg:right-10 shrink-0 w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                    <X size={13} />
                </button>
            </div>
        </div>
    );
}
