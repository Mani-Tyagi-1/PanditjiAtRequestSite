import { Check, Gift } from "lucide-react";
import {
    BANKE_BIHARI_PACKAGES,
    type PujaPackageId,
} from "../../data/bankeBihariPuja";

/**
 * Selectable Banke Bihari package cards, shared by the detail page and the
 * booking page so both show an identical, easy-to-scan comparison.
 *
 * Kept deliberately light: every card is pure white; each lists only its 2–3
 * positive highlights (no crossed-out matrix), so the devotee compares by
 * reading down the short lists rather than parsing a dense grid. The selected
 * card is marked with a Krishna-pink border + soft cream tint and a filled
 * pink check — no heavy dark treatment.
 *
 * When a package that ships physical items is selected, a dropdown of their
 * product images smoothly expands directly beneath THAT card (grid-rows 0fr→1fr
 * for a measure-free height animation).
 */
export default function PujaPackages({
    selectedId,
    onSelect,
}: {
    selectedId: PujaPackageId;
    onSelect: (id: PujaPackageId) => void;
}) {
    return (
        <div className="space-y-2.5">
            {BANKE_BIHARI_PACKAGES.map((pkg) => {
                const selected = pkg.id === selectedId;
                const items = pkg.includedItems ?? [];
                return (
                    // ONE bordered block per package. The card chrome (border,
                    // tint, ring, radius, shadow) lives on this WRAPPER rather
                    // than on the button, so the included-items panel can expand
                    // inside the very same card instead of appearing as a
                    // detached second card floating beneath it.
                    <div
                        key={pkg.id}
                        className={`relative rounded-2xl border transition-all has-[button:active]:scale-[0.99] ${
                            selected
                                ? "border-[#D63D72] bg-[#FFF1F5] ring-1 ring-[#F8B5CB] shadow-md"
                                : "border-[#F4DFC2] bg-white shadow-sm hover:border-[#F8A9C4]"
                        }`}
                    >
                        {/* Corner badge (Most Popular / Best Value) */}
                        {pkg.badge && (
                            <span className="absolute -top-2 left-3 z-10 rounded-full bg-gradient-to-r from-[#D63D72] to-[#E7B63A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                                {pkg.badge}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => onSelect(pkg.id)}
                            aria-pressed={selected}
                            aria-expanded={items.length > 0 ? selected : undefined}
                            className="w-full text-left rounded-2xl p-3.5 pt-4 outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] cursor-pointer"
                        >
                            {/* Header: radio + name/tagline on the left, price on the right */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                    <span
                                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            selected ? "border-[#D63D72] bg-[#D63D72]" : "border-[#E0CDB4]"
                                        }`}
                                    >
                                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold leading-tight text-[#5C1A34]">{pkg.name}</p>
                                        <p className="text-[11px] leading-tight mt-0.5 text-[#7A3E55]">{pkg.tagline}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[19px] font-extrabold leading-none text-[#D63D72]">
                                        ₹{pkg.price.toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-[8.5px] uppercase tracking-wide mt-0.5 text-[#8A8A8A]">one-time</p>
                                </div>
                            </div>

                            {/* Short, positive highlights only */}
                            <div className={`mt-2.5 pt-2.5 border-t space-y-1.5 ${selected ? "border-[#F8B5CB]" : "border-[#F4DFC2]"}`}>
                                {pkg.highlights.map((h) => (
                                    <div key={h} className="flex items-start gap-2">
                                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#2E8B57]" strokeWidth={3} />
                                        <span className="text-[12px] leading-snug text-[#555555]">{h}</span>
                                    </div>
                                ))}
                            </div>
                        </button>

                        {/* Included-items panel — expands INSIDE this card when it
                            is selected, marked off by a rule rather than by card
                            chrome of its own. It is a SIBLING of the button, not a
                            child: nested inside, its labels would be swallowed
                            into the button's accessible name and read out as one
                            long string. grid-rows 0fr→1fr animates the height
                            without measuring; the inner wrapper clips overflow. */}
                        {items.length > 0 && (
                            <div
                                className={`grid transition-all duration-300 ease-out ${
                                    selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="px-3.5 pb-3.5">
                                        <div className="pt-2.5 border-t border-[#F8B5CB]">
                                            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#D63D72] mb-2.5">
                                                <Gift className="w-3.5 h-3.5 text-[#E7B63A]" />
                                                Included in {pkg.name}
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {items.map((it) => (
                                                    <div key={it.label} className="w-16 text-center">
                                                        {it.image ? (
                                                            <img
                                                                src={it.image}
                                                                alt={it.label}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="w-16 h-14 object-cover rounded-lg border border-[#F4DFC2] bg-white"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-14 rounded-lg border border-dashed border-[#E7B63A]/60 bg-white flex items-center justify-center">
                                                                <Gift className="w-5 h-5 text-[#E7B63A]" />
                                                            </div>
                                                        )}
                                                        <p className="text-[9px] font-semibold text-[#5C1A34] mt-1 leading-tight">{it.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
