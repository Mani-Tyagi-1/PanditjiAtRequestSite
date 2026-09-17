import { useState, useEffect } from "react";
import { Check, Gift, Plus, ChevronDown, PackageOpen } from "lucide-react";
import { useMoney } from "../../../utils/currency";
import type { LiveMandirPackage } from "./liveMandirData";

export default function AdminPrasadBoxAddon({
    pkg,
    pujaPrasadBoxEnabled,
    added,
    onToggle,
    selectedTheme = false,
    selected = false,
}: {
    pkg: LiveMandirPackage;
    pujaPrasadBoxEnabled?: boolean;
    added: boolean;
    onToggle?: (next: boolean) => void;
    selectedTheme?: boolean;
    selected?: boolean;
}) {
    const { money } = useMoney();
    const [open, setOpen] = useState(selected);

    // Auto-open when package becomes selected, and auto-close when unselected
    useEffect(() => {
        setOpen(selected);
    }, [selected]);

    // Generic list of items for the prasad box
    const prasadItems = [
        "Blessed Dry Prasad",
        "Sacred Kalawa (Thread)",
        "Holy Chandan / Bhasma",
        "Deity Photo"
    ];

    // Collapsible contents element
    const renderContents = () => {
        if (!pkg.description && (!pkg.bulletPoints || pkg.bulletPoints.length === 0)) return null;

        return (
            <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
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
        );
    };

    const chevronButton = (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border outline-none cursor-pointer transition-colors ${open ? (selectedTheme ? "t-border-active t-bg-alt t-text-dark" : "border-[#C9C3ED] bg-[#F1EEFB] text-[#4C3F91]") : (selectedTheme ? "t-border-light t-bg-alt t-text hover:t-border-active" : "border-[#E6E1F5] bg-[#F8F7FC] text-[#8A8A8A] hover:border-[#C3BBEA] hover:text-[#4C3F91]")}`}
        >
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
    );

    // ── Included free with the package ──
    if (pkg.freePrasad) {
        return (
            <div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 rounded-xl border px-3 py-2.5 transition-colors flex items-start gap-2.5 border-emerald-200 bg-[#F0FDF4]">
                        <Gift className="w-4 h-4 shrink-0 mt-0.5 text-[#087F63]" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold leading-tight text-[#087F63]">
                                FREE Premium Prasad Box
                            </p>
                            <p className="text-[11px] leading-snug mt-0.5 text-[#087F63]">
                                couriered home
                            </p>
                        </div>
                    </div>
                    {chevronButton}
                </div>
                {renderContents()}
            </div>
        );
    }

    // ── Optional ₹501 add-on ──
    if (!pujaPrasadBoxEnabled) return null;

    const interactive = typeof onToggle === "function";

    return (
        <div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={!interactive}
                    onClick={(e) => { e.stopPropagation(); onToggle?.(!added); }}
                    aria-pressed={added}
                    className={`flex-1 min-w-0 text-left rounded-xl border px-2.5 py-2 transition-all flex items-center justify-between gap-2 outline-none cursor-pointer ${added
                        ? (selectedTheme ? "t-border-active t-bg-alt shadow-sm" : "border-[#4C3F91] bg-[#F1EEFB] shadow-sm")
                        : (selectedTheme ? "t-border-light t-bg hover:shadow-sm" : "border-amber-200 bg-[#FFFBEB] hover:border-amber-300")
                        }`}
                >
                    <div className="flex items-start gap-2.5 min-w-0">
                        <span
                            className={`shrink-0 w-[22px] h-[22px] mt-0.5 rounded-md flex items-center justify-center transition-colors ${added
                                ? (selectedTheme ? "text-white t-tab-active" : "bg-[#4C3F91] text-white")
                                : (selectedTheme ? "t-bg-alt t-text-dark border t-border-light" : "bg-amber-300 text-amber-800")
                                }`}
                        >
                            {added ? <Check className="w-3.5 h-3.5" strokeWidth={4} /> : <Plus className="w-3.5 h-3.5" strokeWidth={3} />}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[13.5px] font-bold leading-tight ${added ? (selectedTheme ? "t-text-dark" : "text-[#262454]") : (selectedTheme ? "t-text-dark opacity-90" : "text-[#1E3A8A]")}`}>
                                {added ? "Prasad Box Added" : "Add Prasad Box"}
                            </p>
                            <p className={`text-[11px] leading-snug mt-0.5 ${added ? (selectedTheme ? "t-text" : "text-[#4F4A85]") : (selectedTheme ? "t-text opacity-80" : "text-amber-700")}`}>
                                couriered home
                            </p>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <span className={`block text-[15px] font-extrabold leading-none ${added ? (selectedTheme ? "t-text-dark" : "text-[#4C3F91]") : (selectedTheme ? "t-text-dark" : "text-amber-900")}`}>
                            +{money(501)}
                        </span>
                    </div>
                </button>
                {chevronButton}
            </div>
            {renderContents()}
        </div>
    );
}
