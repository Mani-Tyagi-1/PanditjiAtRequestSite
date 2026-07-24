import { Check, Gift } from "lucide-react";
import {
    KAAL_BHAIRAV_PACKAGES,
    type PujaPackageId,
} from "../../data/kaalBhairavPuja";

/**
 * Selectable Kaal Bhairav package cards, shared by the detail page and the
 * booking page so both show an identical, easy-to-scan comparison.
 *
 * Kept deliberately light: every card is warm-white; each lists only its 2–3
 * positive highlights (no crossed-out matrix), so the devotee compares by
 * reading down the short lists rather than parsing a dense grid. The selected
 * card is marked with a gold border + tint and a filled gold check — no heavy
 * dark treatment.
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
            {KAAL_BHAIRAV_PACKAGES.map((pkg) => {
                const selected = pkg.id === selectedId;
                const items = pkg.includedItems ?? [];
                return (
                    <div key={pkg.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(pkg.id)}
                            aria-pressed={selected}
                            className={`relative w-full text-left rounded-2xl border p-3.5 pt-4 transition-all active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] ${
                                selected
                                    ? "border-[#B8860B] bg-[#FBF6EA] ring-1 ring-[#B8860B]/40 shadow-md"
                                    : "border-[#E7DAC0] bg-white shadow-sm hover:border-[#B8860B]/50"
                            }`}
                        >
                            {/* Corner badge (Most Popular / Best Value) */}
                            {pkg.badge && (
                                <span className="absolute -top-2 left-3 rounded-full bg-gradient-to-r from-[#8B0000] to-[#B8860B] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                                    {pkg.badge}
                                </span>
                            )}

                            {/* Header: radio + name/tagline on the left, price on the right */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                    <span
                                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            selected ? "border-[#B8860B] bg-[#B8860B]" : "border-[#C9B9A0]"
                                        }`}
                                    >
                                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold leading-tight text-[#1A1A1A]">{pkg.name}</p>
                                        <p className="text-[11px] leading-tight mt-0.5 text-[#6E6257]">{pkg.tagline}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[19px] font-extrabold leading-none text-[#8B0000]">
                                        ₹{pkg.price.toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-[8.5px] uppercase tracking-wide mt-0.5 text-[#B7AE9C]">one-time</p>
                                </div>
                            </div>

                            {/* Short, positive highlights only */}
                            <div className="mt-2.5 pt-2.5 border-t border-[#E7DAC0] space-y-1.5">
                                {pkg.highlights.map((h) => (
                                    <div key={h} className="flex items-start gap-2">
                                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B8860B]" strokeWidth={3} />
                                        <span className="text-[12px] leading-snug text-[#1A1A1A]">{h}</span>
                                    </div>
                                ))}
                            </div>
                        </button>

                        {/* Included-items dropdown — expands beneath this card only
                            when it is selected. grid-rows 0fr→1fr animates height
                            without measuring; the inner wrapper clips the overflow. */}
                        {items.length > 0 && (
                            <div
                                className={`grid transition-all duration-300 ease-out ${
                                    selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-2">
                                        <div className="rounded-2xl border border-[#B8860B]/40 bg-white p-3 shadow-sm">
                                            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#8B0000] mb-2.5">
                                                <Gift className="w-3.5 h-3.5 text-[#B8860B]" />
                                                Included in {pkg.name}
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {items.map((it) => (
                                                    <div key={it.label} className="w-14 text-center">
                                                        {it.image ? (
                                                            <img
                                                                src={it.image}
                                                                alt={it.label}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="w-20 h-14 object-cover rounded-lg border border-[#E7DAC0] bg-[#F3ECDC]"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-14 rounded-lg border border-dashed border-[#B8860B]/40 bg-[#F3E9D2] flex items-center justify-center">
                                                                <Gift className="w-5 h-5 text-[#B8860B]/60" />
                                                            </div>
                                                        )}
                                                        <p className="text-[9px] font-semibold text-[#1A1A1A] mt-1 leading-tight">{it.label}</p>
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
