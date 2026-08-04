import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Sparkles, Users, X, ChevronRight } from "lucide-react";
import type { PujaPackageId } from "../../data/bankeBihariPuja";
import { ItemTileRow } from "./ItemTiles";
import { useMoney } from "../../utils/currency";

/**
 * The one-step package upgrade toast on the booking page.
 *
 * This replaced a stack of upgrade CARDS sitting in the booking column — one
 * per package priced above the chosen one. Three problems with that: it put a
 * sales pitch between the devotee and the form they came to fill in, it pitched
 * every higher tier at once (so the ₹1100 devotee got sold ₹2100, ₹5100 AND
 * ₹11000 simultaneously, which reads as a price list rather than an offer), and
 * being inline it was scrolled past exactly like the prasad-box tick was.
 *
 * So: ONE offer, the next tier up only, shown as a toast over the page. Every
 * package is a strict superset of the one below it, which is what makes a
 * single-step pitch honest — the copy is purely what the upgrade ADDS.
 *
 * SHOW, don't list. The first version of this toast spelled the upgrade out in
 * four ticked sentences plus a name, a tagline and an "everything in X" chip,
 * and it read as homework: nobody being asked for ₹3,000 reads a paragraph
 * first, they swipe. It now carries one headline naming the single best thing
 * the upgrade unlocks, PHOTOS of the items it adds, and a price. The pictures
 * do the persuading that the sentences were failing to do, and they take less
 * room than the text they replaced.
 *
 * Dismissal is a swipe in either direction as well as the ✕, because a toast
 * that can only be closed by hitting a small target is a toast people leave on
 * screen. Purely presentational: what to offer, when, and how often all live in
 * the page.
 */

export type UpgradeOffer = {
    /** The package being pitched — handed straight back by `onUpgrade`. */
    id: PujaPackageId;
    /** Package name, shown small — the benefit sells this, not the name. */
    name: string;
    /** The single strongest thing this upgrade unlocks. One short line. */
    headline: string;
    /** Everything the upgraded package offers, drawn as photo tiles. One row. */
    items: string[];
    /** The subset of `items` this upgrade adds — ringed in gold. */
    highlight?: string[];
    /** Anything left over worth a few words, e.g. extra free Sankalps. */
    subline?: string;
    /** Extra rupees over the currently selected package. */
    diff: number;
};

/** Past this far, or this fast, a drag counts as "get rid of it". */
const SWIPE_DISTANCE = 90;
const SWIPE_VELOCITY = 500;

export default function PackageUpgradeNudge({
    offer,
    onUpgrade,
    onDismiss,
}: {
    offer: UpgradeOffer | null;
    onUpgrade: () => void;
    onDismiss: () => void;
}) {
    // Prices stay INR in the data layer; only what is drawn changes.
    const { money } = useMoney();

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (
            Math.abs(info.offset.x) > SWIPE_DISTANCE ||
            Math.abs(info.velocity.x) > SWIPE_VELOCITY
        ) {
            onDismiss();
        }
    };

    return (
        <AnimatePresence>
            {offer && (
                <motion.div
                    // Under the sticky header (56 px). Solid and saturated for
                    // the same reason as the prasad toast: on the page's ivory
                    // background a tinted card is invisible.
                    className="fixed top-[64px] left-0 right-0 z-[35] max-w-md mx-auto px-3"
                    initial={{ opacity: 0, y: -22, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={handleDragEnd}
                >
                    <div
                        role="status"
                        aria-live="polite"
                        className="rounded-2xl px-3 pt-2 pb-3 ring-1 ring-white/25 shadow-[0_16px_40px_rgba(0,0,0,.36)] cursor-grab active:cursor-grabbing"
                        style={{
                            background:
                                "linear-gradient(105deg,#7E1B40 0%,#B82A5C 45%,#D63D72 100%)",
                        }}
                    >
                        {/* Grabber — advertises that this can be swiped away,
                            which nothing else about a toast does. */}
                        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-white/35" />

                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#FFD98A]">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {offer.name}
                                </p>
                                {/* The whole pitch, in one line. */}
                                <p className="text-[15px] font-extrabold leading-tight text-white mt-0.5">
                                    {offer.headline}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onDismiss}
                                aria-label="Dismiss"
                                className="shrink-0 p-1 -mr-1 -mt-1 text-white/70 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
                            >
                                <X className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                        </div>

                        {/* EVERYTHING the upgraded package offers, with the new
                            items ringed in gold — not just the two being added.
                            Two tiles alone left most of the row as bare magenta
                            and made a ₹1,000 upgrade look like it bought almost
                            nothing; the full set fills the row and shows the
                            devotee the whole thali they end up with, while the
                            gold rings keep it honest about which are new. */}
                        {offer.items.length > 0 && (
                            <div className="mt-2">
                                <ItemTileRow
                                    items={offer.items}
                                    tone="onDark"
                                    highlight={offer.highlight}
                                />
                            </div>
                        )}

                        {offer.subline && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-white/15 ring-1 ring-white/30 px-2.5 py-1.5">
                                <Users className="w-3.5 h-3.5 shrink-0 text-[#FFD98A]" />
                                <p className="text-[11.5px] font-bold leading-tight text-white">
                                    {offer.subline}
                                </p>
                            </div>
                        )}

                        {/* Gold on magenta — the page's established "tap this". */}
                        <button
                            type="button"
                            onClick={onUpgrade}
                            className="mt-2.5 w-full flex items-center justify-center gap-1 rounded-xl bg-[#F7C547] py-2.5 text-[13px] font-extrabold text-[#5A3600] shadow-md outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98] transition-transform"
                        >
                            Upgrade for +{money(offer.diff)}
                            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
