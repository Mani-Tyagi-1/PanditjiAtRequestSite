import { Check, Gift, Users, Sparkles } from "lucide-react";
import {
    SAVAN_PACKAGES,
    packageCore,
    packageOfferings,
    type SavanPackage,
    type SavanPackageId,
} from "../../data/kashiMahadevPuja";
import { ItemTileRow } from "./ItemTiles";

/**
 * Selectable Savan package cards, shared by the detail page and the booking
 * page so both show an identical, easy-to-scan comparison.
 *
 * A card carries ONLY what makes it different from the card below it — its
 * offerings, its Sankalp allowance and, where there is one, a single line about
 * what the prasad box costs at this tier. Anything true of all three packages is
 * stated once above them and never repeated inside one.
 *
 * The prasad box itself is NOT decided here. It is picked on the booking page,
 * at every tier including the free one, so this page has exactly one decision on
 * it: which seva. An add-box control here was a second place to decide the same
 * thing, and its contents grid made each card twice as tall as the choice it was
 * asking for.
 */

/**
 * DOM id of the card list, so the page can scroll the first package card into
 * view. Exported rather than typed out in both files, because a scroll target
 * that silently stops matching just quietly does nothing.
 */
export const PACKAGE_CARDS_ANCHOR_ID = "savan-package-cards";

export default function SavanPackages({
    selectedId,
    onSelect,
}: {
    selectedId: SavanPackageId;
    onSelect: (id: SavanPackageId) => void;
}) {
    // Identical in all three packages, so it is stated here instead of on every
    // card: repeated per card it was nine identical lines inside a three-card
    // list, padding each card with promises that can never help anyone choose
    // between them.
    const sharedCore = packageCore(SAVAN_PACKAGES[0]);

    return (
        <div className="space-y-2.5">
            <div className="rounded-2xl border border-[#DDEBE6] bg-[#DFF5EF]/60 px-3 py-2.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#086B50]">
                    <Sparkles className="w-3 h-3 text-[#C89B3C]" />
                    In every package
                </p>
                <div className="space-y-1">
                    {sharedCore.map((c) => (
                        <Line key={c}>{c}</Line>
                    ))}
                </div>
            </div>

            {/* Scroll anchor — the cards alone, below the shared-core strip. */}
            <div id={PACKAGE_CARDS_ANCHOR_ID} className="space-y-2.5">
                {SAVAN_PACKAGES.map((pkg) => (
                    <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        selected={pkg.id === selectedId}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}

function PackageCard({
    pkg,
    selected,
    onSelect,
}: {
    pkg: SavanPackage;
    selected: boolean;
    onSelect: (id: SavanPackageId) => void;
}) {
    const allOfferings = packageOfferings(pkg);

    return (
        <div
            className={`relative rounded-2xl border transition-all ${
                selected
                    ? "border-[#008C68] bg-[#DFF5EF]/70 ring-1 ring-[#008C68]/35 shadow-md"
                    : "border-[#DDEBE6] bg-white shadow-sm hover:border-[#008C68]/50"
            }`}
        >
            {/* Corner badge (Most Popular / Best Value) */}
            {pkg.badge && (
                <span className="absolute -top-2 left-3 z-10 rounded-full bg-gradient-to-r from-[#086B50] to-[#C89B3C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    {pkg.badge}
                </span>
            )}

            {/* The whole card is ONE button: picking the seva is the only thing
                it can do, so there is nothing here a nested control could
                swallow. */}
            <button
                type="button"
                onClick={() => onSelect(pkg.id)}
                aria-pressed={selected}
                className="w-full text-left rounded-2xl px-3 pt-3.5 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-[#008C68] cursor-pointer active:scale-[0.995] transition-transform"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                        <span
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                selected ? "border-[#008C68] bg-[#008C68]" : "border-[#DDEBE6]"
                            }`}
                        >
                            {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                        </span>
                        <div className="min-w-0">
                            <p className="text-[14px] font-bold leading-tight text-[#17211D]">{pkg.name}</p>
                            <p className="text-[10.5px] leading-tight mt-0.5 text-[#66736E]">{pkg.tagline}</p>
                        </div>
                    </div>
                    <p className="shrink-0 text-[18px] font-extrabold leading-none text-[#086B50]">
                        ₹{pkg.price.toLocaleString("en-IN")}
                    </p>
                </div>

                {/* What this tier gives, now that the core seva is stated once
                    above the list.

                    Offerings are CUMULATIVE, not just this tier's additions:
                    there is no "Everything in <cheaper tier>" chip implying
                    inheritance, so listing only the new ones would read as the
                    higher tier dropping the cheaper tier's offerings. Pictures,
                    not a comma list — seven item names in a row is exactly what
                    makes the top card unreadable. */}
                <div className={`mt-2 pt-2 border-t ${selected ? "border-[#008C68]/30" : "border-[#DDEBE6]"}`}>
                    {pkg.freeFamilyMembers > 0 && (
                        <Line icon={<Users className="w-3.5 h-3.5 shrink-0 mt-px text-[#008C68]" />}>
                            <b className="text-[#17211D]">
                                {pkg.freeFamilyMembers} family Sankalp
                                {pkg.freeFamilyMembers > 1 ? "s" : ""} free
                            </b>
                        </Line>
                    )}
                    {allOfferings.length > 0 && (
                        <div className={pkg.freeFamilyMembers > 0 ? "mt-2" : ""}>
                            <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#086B50] mb-1.5">
                                <Sparkles className="w-3 h-3 text-[#C89B3C]" />
                                Offered to Mahadev in your name
                            </p>
                            <ItemTileRow items={allOfferings} />
                        </div>
                    )}

                    {/* The one prasad line this tier is allowed to say — a gold
                        note, not a control: the box is added on the booking
                        page. The entry tier has no note, so its card ends at
                        the offerings. */}
                    {pkg.prasadNote && (
                        <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-[#FFF8E7] border border-[#E8CF9A] px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-[#8A6A1F]">
                            <Gift className="w-3.5 h-3.5 shrink-0 text-[#C89B3C]" />
                            <span>{pkg.prasadNote}</span>
                        </p>
                    )}
                </div>
            </button>
        </div>
    );
}

/** A green-ticked line — the page's standard "you get this" row. */
function Line({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-1.5">
            {icon ?? <Check className="w-3.5 h-3.5 shrink-0 mt-px text-[#008C68]" strokeWidth={3} />}
            <span className="text-[11.5px] leading-snug text-[#66736E]">{children}</span>
        </div>
    );
}
