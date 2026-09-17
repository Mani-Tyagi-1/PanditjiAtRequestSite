import { useState, useEffect } from "react";
import { Check, Plus, Gift, Layers, Flower2, X } from "lucide-react";
import { useMoney } from "../../../utils/currency";

export interface UpsellProduct {
    shopifyProductId: string;
    title: string;
    handle: string;
    image: string;
    price: number;
    compareAtPrice?: number;
    variantId?: string;
    onlineStoreUrl?: string;
    description?: string;
    features?: string[];
    pillText?: string;
}

export default function AdminUpsellAddon({
    product,
    added,
    onToggle,
    adminTheme,
}: {
    product: UpsellProduct;
    added: boolean;
    onToggle: (next: boolean) => void;
    adminTheme?: { primary: string; dark: string; background: string; backgroundAlt: string; border: string; } | null;
}) {
    const { money } = useMoney();
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Slide in effect
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Hide after adding
    useEffect(() => {
        if (added) {
            const timer = setTimeout(() => setIsDismissed(true), 800);
            return () => clearTimeout(timer);
        }
    }, [added]);

    if (isDismissed || !isVisible) return null;

    const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

    const pillStyle = adminTheme
        ? { backgroundImage: `linear-gradient(to right, ${adminTheme.dark}, ${adminTheme.primary}, ${adminTheme.dark})` }
        : undefined;
    const pillClass = adminTheme
        ? "text-white text-[9.5px] font-extrabold px-3.5 py-1.5 rounded-r-full inline-flex items-center gap-1 shadow-md uppercase tracking-wider bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500"
        : "bg-gradient-to-r from-[#8B1A1A] via-[#A02020] to-[#8B1A1A] text-white text-[9.5px] font-extrabold px-3.5 py-1.5 rounded-r-full inline-flex items-center gap-1 shadow-md uppercase tracking-wider bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500";

    const titleStyle = adminTheme ? { color: adminTheme.dark } : undefined;
    const titleClass = adminTheme ? "font-extrabold text-[14px] leading-snug line-clamp-2 drop-shadow-sm" : "text-[#5A1010] font-extrabold text-[14px] leading-snug line-clamp-2 drop-shadow-sm";

    const priceStyle = adminTheme ? { color: adminTheme.dark } : undefined;
    const priceClass = adminTheme ? "text-[17px] font-black tracking-tight" : "text-[17px] font-black text-[#8B1A1A] tracking-tight";

    const iconStyle = adminTheme ? { color: adminTheme.dark } : undefined;
    const iconClass = adminTheme ? "w-3.5 h-3.5" : "w-3.5 h-3.5 text-[#8B1A1A]";

    const btnStyle = !added && adminTheme ? { backgroundImage: `linear-gradient(to right, ${adminTheme.dark}, ${adminTheme.primary})` } : undefined;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-12 pointer-events-none animate-in slide-in-from-top-full duration-500">
            <div className="relative border border-white/60 rounded-[20px] bg-white/85 backdrop-blur-2xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(139,26,26,0.2)] max-w-sm mx-auto pointer-events-auto transition-all duration-500 hover:shadow-[0_32px_60px_-12px_rgba(139,26,26,0.3)] ring-1 ring-[#8B1A1A]/10"
                style={adminTheme ? { boxShadow: `0 24px 60px -12px color-mix(in srgb, ${adminTheme.dark} 20%, transparent)`, outlineColor: `color-mix(in srgb, ${adminTheme.dark} 10%, transparent)` } : undefined}>

                {/* Decorative background blur */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                    style={adminTheme ? { backgroundColor: `color-mix(in srgb, ${adminTheme.dark} 10%, transparent)` } : { backgroundColor: '#A020201a' }}></div>

                {/* Top Pill & Close Button */}
                <div className="flex items-center justify-between pt-3 pb-2 relative z-10">
                    <div className={pillClass} style={pillStyle}>
                        {product.pillText || "Recommended for You"}
                    </div>
                    {/* Close Button */}
                    <button
                        className="p-1.5 mr-2 rounded-full text-stone-400 hover:bg-black/5 transition-all duration-300 outline-none"
                        style={adminTheme ? { color: 'var(--tw-text-opacity)', '--tw-text-opacity': '1' } : undefined}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (added) {
                                onToggle(false);
                            }
                            setIsDismissed(true);
                        }}
                    >
                        <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="px-3.5 pb-4 relative z-10">
                    <div className="flex gap-3.5">
                        {/* Image */}
                        {product.image && (
                            <div className="w-[85px] h-[85px] shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-md relative group">
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10"></div>
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover bg-stone-50 transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                            <div>
                                <h3 className={titleClass} style={titleStyle}>
                                    {product.title}
                                </h3>
                                {product.description && (
                                    <p className="text-[10.5px] font-medium text-stone-500/90 leading-snug mt-1 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <span className={priceClass} style={priceStyle}>
                                    {money(product.price)}
                                </span>
                                {product.compareAtPrice && product.compareAtPrice > product.price && (
                                    <span className="text-[11.5px] font-bold text-stone-400/80 line-through decoration-stone-300">
                                        {money(product.compareAtPrice)}
                                    </span>
                                )}
                                {discountPercent > 0 && (
                                    <span className="bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] text-[#B91C1C] text-[9.5px] font-extrabold px-2 py-0.5 rounded-lg shadow-sm"
                                        style={adminTheme ? { backgroundImage: `linear-gradient(to bottom right, color-mix(in srgb, ${adminTheme.primary} 15%, white), color-mix(in srgb, ${adminTheme.primary} 25%, white))`, color: adminTheme.dark } : undefined}>
                                        {discountPercent}% OFF
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Features Row */}
                    {product.features && product.features.length > 0 && (
                        <div className="flex items-start justify-between px-1.5 mt-3.5 mb-3 bg-stone-50/50 rounded-xl py-2 border border-stone-100/50">
                            {product.features.map((feature, idx) => {
                                const Icon = idx === 0 ? Gift : idx === 1 ? Layers : Flower2;
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-1.5 text-center flex-1">
                                        <div className="bg-white p-1.5 rounded-full shadow-sm">
                                            <Icon className={iconClass} style={iconStyle} strokeWidth={2} />
                                        </div>
                                        <span className="text-[9.5px] font-bold text-stone-600 leading-tight">{feature}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {(!product.features || product.features.length === 0) && <div className="h-3"></div>}

                    {/* Add Button */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggle(!added); }}
                        className={`w-full py-2.5 rounded-xl font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all duration-300 outline-none active:scale-[0.97]
                        ${added
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_8px_16px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/50"
                                : (adminTheme ? "text-white shadow-md hover:shadow-lg ring-1 ring-black/10" : "bg-gradient-to-r from-[#8B1A1A] to-[#6B1414] text-white shadow-[0_8px_16px_rgba(139,26,26,0.25)] hover:shadow-[0_8px_20px_rgba(139,26,26,0.4)] hover:from-[#9B1D1D] hover:to-[#7C1A1A] ring-1 ring-[#8B1A1A]/50")
                            }`}
                        style={btnStyle}
                    >
                        {added ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" strokeWidth={3} />}
                        {added ? "Added to My Puja" : `Add to My Puja - ${money(product.price)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
