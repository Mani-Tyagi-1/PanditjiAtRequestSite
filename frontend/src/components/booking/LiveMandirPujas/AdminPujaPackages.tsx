import { useState, useEffect } from "react";
import { Check, Users, Sparkles, ChevronDown, PackageOpen, Gift } from "lucide-react";
import type { LiveMandirPackage } from "./liveMandirData";
import { money } from "../../../utils/currency";
import AdminPrasadBoxAddon from "./AdminPrasadBoxAddon";

export default function AdminPujaPackages({
    packages,
    selectedId,
    onSelect,
    prasadBoxEnabled = false,
    selectedTheme = false, // If there's a custom theme active
    prasadAdded = false,
    onPrasadToggle,
}: {
    packages: LiveMandirPackage[];
    selectedId: string;
    onSelect: (id: string) => void;
    prasadBoxEnabled?: boolean;
    selectedTheme?: boolean;
    prasadAdded?: boolean;
    onPrasadToggle?: (next: boolean) => void;
}) {
    const [openId, setOpenId] = useState<string | null>(selectedId);
    const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

    // Sync expandedDetails whenever selectedId changes (e.g. from parent props)
    useEffect(() => {
        setExpandedDetails(
            packages.reduce((acc, pkg) => ({ ...acc, [pkg.id]: pkg.id === selectedId }), {})
        );
    }, [selectedId, packages]);

    const choose = (id: string) => {
        onSelect(id);
        setOpenId((cur) => (cur === id ? null : id));
        // Open only the description for the package the user just selected, closing the others.
        setExpandedDetails(
            packages.reduce((acc, pkg) => ({ ...acc, [pkg.id]: pkg.id === id }), {})
        );
    };

    if (!packages || packages.length === 0) return null;

    return (
        <div className="space-y-3 mt-3">
            {packages.map((pkg) => {
                const selected = pkg.id === selectedId;

                // Calculate discount percentage
                let discountPercent = 0;
                if (pkg.strikePrice && pkg.strikePrice > pkg.price) {
                    discountPercent = Math.round(((pkg.strikePrice - pkg.price) / pkg.strikePrice) * 100);
                }

                return (
                    <div
                        key={pkg.id}
                        className={`relative rounded-2xl border transition-all duration-200 text-left ${selected
                            ? (selectedTheme
                                ? "t-border-active t-bg-alt ring-1 shadow-md scale-[1.01] z-10"
                                : "border-[#4C3F91] bg-[#F1EEFB] ring-1 ring-[#C9C3ED] shadow-md scale-[1.01] z-10")
                            : "border-[#E6E1F5] bg-white shadow-sm hover:border-[#C3BBEA] cursor-pointer"
                            }`}
                        onClick={() => choose(pkg.id)}
                    >
                        {/* Package Image */}
                        {pkg.images && pkg.images.length > 0 && (
                            <div className="w-full h-[120px] relative bg-stone-100 rounded-t-2xl overflow-hidden">
                                <img
                                    src={pkg.images[0]}
                                    alt={pkg.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            </div>
                        )}

                        <div className="px-3 pt-3.5 pb-2.5">
                            {/* ── Selection: header + the short summary ── */}
                            <div className="w-full text-left flex items-start justify-between gap-2 outline-none">
                                <div className="flex items-start gap-2 min-w-0">
                                    <span
                                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selected
                                            ? (selectedTheme ? "t-border-active t-gradient" : "border-[#4C3F91] bg-[#4C3F91]")
                                            : "border-[#D8D2ED] bg-white"
                                            }`}
                                    >
                                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`text-[14px] font-bold leading-tight ${selectedTheme ? "t-text-dark" : "text-[#262454]"}`}>
                                            {pkg.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                    <p className={`text-[18px] font-extrabold leading-none ${selectedTheme ? "t-text-dark" : "text-[#4C3F91]"}`}>
                                        {money(pkg.price)}
                                    </p>
                                    {(pkg.strikePrice && discountPercent > 0) ? (
                                        <>
                                            <span className="text-[12px] font-bold text-stone-400 line-through">
                                                {money(pkg.strikePrice)}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${selectedTheme ? "bg-orange-100 text-orange-700 t-bg-alt t-text-dark" : "bg-[#FDE8E8] text-[#9B1C1C]"}`}>
                                                {discountPercent}% OFF
                                            </span>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            {/* Family Members Included */}
                            {pkg.freePersons && pkg.freePersons > 0 ? (
                                <div className={`mt-3 rounded-lg p-2 flex items-center gap-2 border ${selectedTheme ? "bg-gradient-to-r from-orange-50 to-orange-50/30 border-orange-100/60 t-bg" : "bg-[#EDF9F0] border-[#A7D8B6]"}`}>
                                    <Users className={`w-3.5 h-3.5 ${selectedTheme ? "t-text-dark" : "text-[#2E8B57]"}`} />
                                    <span className={`text-[11.5px] font-semibold ${selectedTheme ? "t-text-dark" : "text-[#1F7A50]"}`}>
                                        {pkg.freePersons} free family Sankalp{pkg.freePersons > 1 ? "s" : ""}
                                    </span>
                                </div>
                            ) : null}

                            {/* Prasad Box Addon */}
                            {prasadBoxEnabled ? (
                                <div className="mt-3">
                                    <AdminPrasadBoxAddon
                                        pkg={pkg}
                                        pujaPrasadBoxEnabled={prasadBoxEnabled}
                                        added={pkg.freePrasad ? true : (selected && prasadAdded)}
                                        onToggle={pkg.freePrasad ? undefined : (next) => {
                                            if (!selected) onSelect(pkg.id);
                                            onPrasadToggle?.(next);
                                        }}
                                        selectedTheme={!!selectedTheme}
                                        selected={selected}
                                    />
                                </div>
                            ) : (
                                /* When Prasad Box is OFF, show "View Description" with arrow */
                                (pkg.description || (pkg.bulletPoints && pkg.bulletPoints.length > 0)) ? (
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedDetails(prev => ({ ...prev, [pkg.id]: !prev[pkg.id] }));
                                            }}
                                            className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 outline-none cursor-pointer transition-colors ${expandedDetails[pkg.id]
                                                ? (selectedTheme ? "t-border-active t-bg-alt" : "border-[#C9C3ED] bg-[#F1EEFB]")
                                                : (selectedTheme ? "t-border-light t-bg hover:t-border-active" : "border-[#E6E1F5] bg-[#F8F7FC] hover:border-[#C3BBEA]")
                                                }`}
                                        >
                                            <span className={`text-[12.5px] font-semibold ${selectedTheme ? "t-text-dark" : "text-[#4C3F91]"}`}>
                                                View Description
                                            </span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${selectedTheme ? "t-text" : "text-[#8A8A8A]"} ${expandedDetails[pkg.id] ? "rotate-180" : ""}`} />
                                        </button>

                                        <div className={`grid transition-all duration-300 ease-out ${expandedDetails[pkg.id] ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                                            <div className="overflow-hidden">
                                                <div className={`px-3 py-2.5 rounded-xl border ${selectedTheme ? "t-bg t-border-light" : "bg-[#F8F7FC] border-[#E6E1F5]"}`}>
                                                    {pkg.description && (
                                                        <p className="text-[12px] text-stone-700 leading-snug mb-2 font-medium">
                                                            {pkg.description}
                                                        </p>
                                                    )}
                                                    {pkg.bulletPoints && pkg.bulletPoints.length > 0 && (
                                                        <ul className="space-y-1.5">
                                                            {pkg.bulletPoints.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-1.5 text-[11.5px] font-medium text-stone-700">
                                                                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selectedTheme ? "t-text" : "text-[#4C3F91]"}`} strokeWidth={3} />
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null
                            )}

                        </div>
                    </div>
                );
            })}
        </div>
    );
}
