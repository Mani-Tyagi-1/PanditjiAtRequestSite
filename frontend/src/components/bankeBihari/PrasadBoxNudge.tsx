import { AnimatePresence, motion } from "framer-motion";
import { Gift, X, Plus, Check } from "lucide-react";
import { useMoney } from "../../utils/currency";

/**
 * The prasad-box toast.
 *
 * The box is chosen by a tick inside whichever package card is selected, which
 * is the right place for it — package and box are one decision — but it is a
 * small dashed control below a block of colourful tiles, and devotees were
 * scrolling straight past it to the sticky CTA without ever registering that
 * blessed prasad could be couriered to them. This surfaces the same choice a
 * few seconds after a package is picked, pinned under the sticky header where
 * it stays on screen no matter where the devotee has scrolled to.
 *
 * Three shapes, one per state the box can be in. Only the first is an upsell:
 *
 *   • `add`   — ₹1100 / ₹2100 ship no box and none has been added. The toast is
 *               an OFFER and carries the action, so the box can be added without
 *               scrolling back up.
 *   • `added` — the ₹501 box is already ticked. Confirmation, no action.
 *   • `free`  — ₹5100 / ₹11000 already include a richer box. Reassurance, and
 *               deliberately NO action; a button would imply there is something
 *               left to buy.
 *
 * Every state says something, so the toast never silently does nothing — a
 * do-nothing branch is indistinguishable from the feature being broken.
 *
 * Purely presentational — every decision about whether and when to show it
 * lives in the page, so this file cannot be the reason a devotee gets nagged.
 */

export type PrasadNudge =
    | { kind: "add"; boxName: string; price: number }
    | { kind: "added"; boxName: string }
    | { kind: "free"; boxName: string; packageName: string };

export default function PrasadBoxNudge({
    nudge,
    onAdd,
    onDismiss,
}: {
    nudge: PrasadNudge | null;
    onAdd: () => void;
    onDismiss: () => void;
}) {
    // Prices stay INR in the data layer; only what is drawn changes.
    const { money } = useMoney();

    // Only `add` is an upsell and gets the pink "do something" fill; the other
    // two are confirmations and get green.
    const isOffer = nudge?.kind === "add";

    return (
        <AnimatePresence>
            {nudge && (
                <motion.div
                    // Drops in under the sticky header (56 px tall) rather than
                    // sitting above the payment bar: down there it landed in the
                    // same corner of the screen the thumb rests on and went
                    // unseen, which is the exact problem this toast exists to
                    // solve. z-[45] keeps it under the header it slides out of.
                    className="fixed top-[64px] left-0 right-0 z-[45] max-w-md mx-auto px-3 pointer-events-none"
                    // Slight overshoot on the way in — motion is the other half
                    // of being noticed, and a toast that merely fades is easy to
                    // miss mid-scroll.
                    initial={{ opacity: 0, y: -20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                    {/* SOLID and saturated, with white text.
                        The first version used the page's own tinted-card palette
                        — pale green on ivory, white on ivory — which is correct
                        for a card that BELONGS to the page and exactly wrong for
                        one that has to interrupt it. On a #FFF9F2 background a
                        #EDF9F0 panel is invisible. These two fills appear nowhere
                        else in the column, so the toast reads as a layer on top
                        of the page rather than another block in it. */}
                    <div
                        role="status"
                        aria-live="polite"
                        className="pointer-events-auto flex items-center gap-2.5 rounded-2xl px-3 py-2.5 ring-1 ring-white/25 shadow-[0_14px_36px_rgba(0,0,0,.34)]"
                        style={{
                            background: isOffer
                                ? "linear-gradient(100deg,#B82A5C 0%,#D63D72 55%,#F05C83 100%)"
                                : "linear-gradient(100deg,#186043 0%,#1F7A50 55%,#2E8B57 100%)",
                        }}
                    >
                        <span className="shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Gift className="w-4 h-4 text-white" />
                        </span>

                        <div className="min-w-0 flex-1">
                            {nudge.kind === "add" && (
                                <>
                                    <p className="text-[12.5px] font-bold leading-tight text-white">
                                        Add the {nudge.boxName}?
                                    </p>
                                    <p className="text-[10.5px] leading-tight mt-0.5 text-white/85">
                                        Blessed prasad couriered to your home
                                    </p>
                                </>
                            )}
                            {nudge.kind === "added" && (
                                <>
                                    <p className="text-[12.5px] font-bold leading-tight text-white">
                                        <Check className="inline w-3 h-3 mb-px" strokeWidth={4} />{" "}
                                        {nudge.boxName} added
                                    </p>
                                    <p className="text-[10.5px] leading-tight mt-0.5 text-white/85">
                                        Blessed prasad couriered to your home
                                    </p>
                                </>
                            )}
                            {nudge.kind === "free" && (
                                <>
                                    <p className="text-[12.5px] font-bold leading-tight text-white">
                                        <Check className="inline w-3 h-3 mb-px" strokeWidth={4} />{" "}
                                        {nudge.boxName} included FREE
                                    </p>
                                    <p className="text-[10.5px] leading-tight mt-0.5 text-white/85">
                                        Couriered home with your {nudge.packageName}
                                    </p>
                                </>
                            )}
                        </div>

                        {nudge.kind === "add" && (
                            // Gold on pink — the same pairing as the sticky bar's
                            // "Book" button, so the one tappable thing here looks
                            // like the page's other tappable thing.
                            <button
                                type="button"
                                onClick={onAdd}
                                className="shrink-0 flex items-center gap-0.5 rounded-full bg-[#F7C547] px-3 py-1.5 text-[12px] font-extrabold text-[#5A3600] shadow-md outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 transition-transform"
                            >
                                <Plus className="w-3 h-3" strokeWidth={3.5} />
                                {money(nudge.price)}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onDismiss}
                            aria-label="Dismiss"
                            className="shrink-0 p-1 -mr-1 text-white/70 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
                        >
                            <X className="w-3.5 h-3.5" strokeWidth={3} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
