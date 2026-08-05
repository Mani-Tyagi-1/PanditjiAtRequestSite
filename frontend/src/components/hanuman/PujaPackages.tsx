import { Check, Gift, Users, Sparkles } from "lucide-react";
import {
    HANUMAN_PACKAGES,
    type PujaPackageId,
} from "../../data/hanumanPuja";
import { money } from "../../utils/currency";

/**
 * Selectable Hanuman package cards, shared by the detail page and the booking
 * page so both show an identical, easy-to-scan comparison.
 *
 * UX principles baked in:
 *  • Warm-white cards; the selected one lifts with a saffron border + tint,
 *    a gold ring and a filled saffron radio — impossible to misread which is on.
 *  • Each card reads top-to-bottom: name/tagline → price → a quick chip row
 *    (laddoo bhog + free family) for at-a-glance comparison → 2–3 positive
 *    highlights. No dense crossed-out matrix to parse.
 *  • Selecting a package that ships physical blessings smoothly expands a panel
 *    of their product images directly beneath THAT card (grid-rows 0fr→1fr, a
 *    measure-free height animation).
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
            {HANUMAN_PACKAGES.map((pkg) => {
                const selected = pkg.id === selectedId;
                const items = pkg.includedItems ?? [];
                // Quick-scan chips: the laddoo bhog and the free-family allowance.
                const chips = [
                    pkg.laddooKg > 0 && { icon: Gift, text: `${pkg.laddooKg} Kg Laddoo` },
                    pkg.freeFamilyMembers > 0 && { icon: Users, text: `${pkg.freeFamilyMembers} Free Family` },
                ].filter(Boolean) as { icon: typeof Gift; text: string }[];
                return (
                    <div key={pkg.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(pkg.id)}
                            aria-pressed={selected}
                            className={`relative w-full text-left rounded-2xl border p-3.5 pt-4 transition-all active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-[#E65A00] ${
                                selected
                                    ? "border-[#E65A00] bg-[#FFF3E3] ring-1 ring-[#D4A017]/50 shadow-md"
                                    : "border-[#EAD9B5] bg-white shadow-sm hover:border-[#E65A00]/50"
                            }`}
                        >
                            {/* Corner badge (Most Popular / Best Value) */}
                            {pkg.badge && (
                                <span className="absolute -top-2 left-3 rounded-full bg-gradient-to-r from-[#B71C1C] to-[#E65A00] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                                    {pkg.badge}
                                </span>
                            )}

                            {/* Header: radio + name/tagline on the left, price on the right */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                    <span
                                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            selected ? "border-[#E65A00] bg-[#E65A00]" : "border-[#C9B48A]"
                                        }`}
                                    >
                                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold leading-tight text-[#4E342E]">{pkg.name}</p>
                                        <p className="text-[11px] leading-tight mt-0.5 text-[#7A5A3A]">{pkg.tagline}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[19px] font-extrabold leading-none text-[#C63D00]">
                                        {money(pkg.price)}
                                    </p>
                                    <p className="text-[8.5px] uppercase tracking-wide mt-0.5 text-[#A78A6B]">one-time</p>
                                </div>
                            </div>

                            {/* Quick-scan chip row (only when the package has perks) */}
                            {chips.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {chips.map(({ icon: Icon, text }) => (
                                        <span
                                            key={text}
                                            className="inline-flex items-center gap-1 rounded-full bg-[#FBE7CE] border border-[#EAD9B5] px-2 py-0.5 text-[10px] font-bold text-[#C63D00]"
                                        >
                                            <Icon className="w-3 h-3 text-[#E65A00]" />
                                            {text}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Short, positive highlights only */}
                            <div className="mt-2.5 pt-2.5 border-t border-[#EAD9B5] space-y-1.5">
                                {pkg.highlights.map((h) => (
                                    <div key={h} className="flex items-start gap-2">
                                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4A017]" strokeWidth={3} />
                                        <span className="text-[12px] leading-snug text-[#4E342E]">{h}</span>
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
                                        <div className="rounded-2xl border border-[#E65A00]/40 bg-white p-3 shadow-sm">
                                            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#C63D00] mb-2.5">
                                                <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                                                Couriered home with {pkg.name}
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
                                                                className="w-16 h-14 object-cover rounded-lg border border-[#EAD9B5] bg-[#FBE7CE]"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-14 rounded-lg border border-dashed border-[#E65A00]/40 bg-[#FBE7CE] flex items-center justify-center">
                                                                <Gift className="w-5 h-5 text-[#E65A00]/60" />
                                                            </div>
                                                        )}
                                                        <p className="text-[9px] font-semibold text-[#4E342E] mt-1 leading-tight">{it.label}</p>
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
