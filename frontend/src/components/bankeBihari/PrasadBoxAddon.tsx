import { Check, Gift, PackageOpen, Truck } from "lucide-react";
import {
    PRASAD_BOXES,
    PRASAD_BOX_PRICE,
    canAddPrasadBox,
    prasadBoxContents,
    type PujaPackage,
} from "../../data/bankeBihariPuja";
import { ItemTileRow } from "./ItemTiles";

/**
 * The prasad-box row, shared by the detail page and the booking page so the
 * devotee sees the same control (and the same wording) in both places.
 *
 * It renders one of two mutually exclusive states, decided purely by the chosen
 * package — never both, and never a paid toggle on a package that already
 * includes a box:
 *
 *   • ₹1100 / ₹2100 — an OPT-IN toggle. Off by default, so nothing is ever
 *     added to the bill without a deliberate tap, and the ₹501 is shown on the
 *     control itself rather than only in the total.
 *   • ₹5100 / ₹11000 — a read-only "already included, free" confirmation, so
 *     the higher tiers visibly cash in the upgrade instead of just going quiet.
 *
 * Contents are listed item by item in both states: the box is the main reason
 * to upgrade, so hiding what is inside it behind a name would be the one thing
 * most likely to make the pricing feel like a trick.
 */
export default function PrasadBoxAddon({
    pkg,
    added,
    onToggle,
}: {
    pkg: PujaPackage;
    added: boolean;
    /** Omit to render the toggle as read-only (e.g. a summary view). */
    onToggle?: (next: boolean) => void;
}) {
    const freeBox = pkg.freePrasadBox ? PRASAD_BOXES[pkg.freePrasadBox] : null;

    // ── Included free with the package ──
    if (freeBox) {
        return (
            <div className="rounded-2xl border border-[#A7D8B6] bg-[#EDF9F0] p-3.5">
                <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-9 h-9 rounded-full bg-white border border-[#A7D8B6] flex items-center justify-center">
                        <Gift className="w-4 h-4 text-[#2E8B57]" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-[#1F7A50] leading-tight">
                            {freeBox.name} — included FREE
                        </p>
                        <p className="text-[11px] text-[#2E8B57] mt-0.5 leading-snug">
                            Already part of your {pkg.name}. Nothing extra to pay.
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#2E8B57] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        ₹0
                    </span>
                </div>

                <ContentList
                    items={prasadBoxContents(freeBox.tier)}
                    className="mt-3 border-t border-[#A7D8B6] pt-2.5"
                    tone="free"
                />

                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#1F7A50]">
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    Couriered to your home after the seva
                </p>
            </div>
        );
    }

    // ── Optional ₹501 add-on ──
    if (!canAddPrasadBox(pkg)) return null;

    const box = PRASAD_BOXES.standard;
    const interactive = typeof onToggle === "function";

    return (
        <div
            className={`rounded-2xl border p-3.5 transition-all ${
                added
                    ? "border-[#D63D72] bg-[#FFF1F5] ring-1 ring-[#F8B5CB] shadow-md"
                    : "border-[#F4DFC2] bg-white shadow-sm"
            }`}
        >
            {/* The whole header is the toggle — a small checkbox alone is an easy
                target to miss on a phone. `aria-pressed` (not a raw checkbox)
                because this is a price-changing action, not form data. */}
            <button
                type="button"
                disabled={!interactive}
                onClick={() => onToggle?.(!added)}
                aria-pressed={added}
                className="w-full text-left flex items-start gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] rounded-xl disabled:cursor-default cursor-pointer"
            >
                <span
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        added ? "border-[#D63D72] bg-[#D63D72]" : "border-[#E0CDB4] bg-white"
                    }`}
                >
                    {added && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                        <PackageOpen className="w-3.5 h-3.5 text-[#E7B63A] shrink-0" />
                        <span className="text-[13.5px] font-bold text-[#5C1A34] leading-tight">
                            Add {box.name}
                        </span>
                        <span className="rounded-full bg-[#FFF2E4] border border-[#E7B63A]/50 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-[#8A5A12]">
                            Optional
                        </span>
                    </span>
                    <span className="block text-[11px] text-[#7A3E55] mt-0.5 leading-snug">
                        Blessed prasad couriered to your home. Skip it and you pay only the
                        package price.
                    </span>
                </span>

                <span className="text-right shrink-0">
                    <span className="block text-[15px] font-extrabold leading-none text-[#D63D72]">
                        +₹{PRASAD_BOX_PRICE}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wide mt-0.5 text-[#8A8A8A]">
                        {added ? "added" : "one-time"}
                    </span>
                </span>
            </button>

            <ContentList
                items={prasadBoxContents(box.tier)}
                className={`mt-3 border-t pt-2.5 ${added ? "border-[#F8B5CB]" : "border-[#F4DFC2]"}`}
                tone="paid"
            />

            {added && (
                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#D63D72]">
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    ₹{PRASAD_BOX_PRICE} added to your total · we'll ask for a delivery address
                </p>
            )}
        </div>
    );
}

function ContentList({
    items,
    className = "",
    tone,
}: {
    items: string[];
    className?: string;
    tone: "free" | "paid";
}) {
    return (
        <div className={className}>
            <p
                className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                    tone === "free" ? "text-[#1F7A50]" : "text-[#8A5A12]"
                }`}
            >
                What's inside
            </p>
            <ItemTileRow items={items} tone={tone === "free" ? "green" : "sand"} />
        </div>
    );
}
