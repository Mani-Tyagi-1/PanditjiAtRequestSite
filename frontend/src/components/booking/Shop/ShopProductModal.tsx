import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Star, Plus, Minus, Check, ShieldCheck, Truck, RotateCcw,
} from "lucide-react";
import type { ShopProduct } from "./shopData";

interface Props {
    isOpen: boolean;
    product: ShopProduct | null;
    cartQty: number;
    onClose: () => void;
    onAddToCart: (product: ShopProduct, qty: number) => void;
    onBuyNow: (product: ShopProduct, qty: number) => void;
}

export default function ShopProductModal({
    isOpen, product, cartQty, onClose, onAddToCart, onBuyNow,
}: Props) {
    const [qty, setQty] = useState(1);
    const [justAdded, setJustAdded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQty(1);
            setJustAdded(false);
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen, product]);

    if (!product) return null;

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const soldOut = !product.inStock;
    const lineTotal = product.price * qty;

    const handleAdd = () => {
        onAddToCart(product, qty);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1400);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[210] flex items-end justify-center shop-pdp">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                        .shop-pdp { font-family: 'DM Sans', sans-serif; }
                        .shop-pdp-serif { font-family: 'Cormorant Garamond', serif; }
                    `}</style>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="relative w-full max-w-md bg-[#FFFAF3] rounded-t-3xl flex flex-col overflow-hidden"
                        style={{ height: "94vh" }}
                    >
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-sm text-white active:scale-95 transition-transform"
                        >
                            <X className="w-4.5 h-4.5" />
                        </button>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Hero image */}
                            <div className="relative aspect-square bg-amber-50">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className={`w-full h-full object-cover ${soldOut ? "grayscale opacity-70" : ""}`}
                                />
                                {product.badge && !soldOut && (
                                    <span className="absolute top-3 left-3 bg-stone-900/85 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full">
                                        {product.badge}
                                    </span>
                                )}
                                {discount > 0 && !soldOut && (
                                    <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                                        {discount}% OFF
                                    </span>
                                )}
                                {soldOut && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-stone-900/80 text-white text-[13px] font-bold px-4 py-1.5 rounded-full">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="px-5 py-4">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-amber-600">{product.category}</span>
                                <h2 className="shop-pdp-serif font-bold text-stone-900 leading-tight mt-0.5" style={{ fontSize: "26px" }}>
                                    {product.name}
                                </h2>
                                <p className="text-[13px] text-stone-500 mt-0.5">{product.shortDesc}</p>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[12px] font-bold">
                                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                                        {product.rating.toFixed(1)}
                                    </span>
                                    <span className="text-[12px] text-stone-400 font-medium">
                                        {product.reviews.toLocaleString("en-IN")} verified ratings
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-2 mt-3">
                                    <span className="text-[26px] font-extrabold text-stone-900">₹{product.price.toLocaleString("en-IN")}</span>
                                    {product.originalPrice && (
                                        <>
                                            <span className="text-[15px] text-stone-400 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                                            <span className="text-[13px] font-bold text-emerald-600">{discount}% off</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-[11px] text-stone-400 mt-0.5">Inclusive of all taxes</p>

                                {/* Quantity */}
                                {!soldOut && (
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-[13px] font-bold text-stone-700">Quantity</span>
                                        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-1.5 py-1">
                                            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-50 text-stone-600 active:scale-90 transition-transform">
                                                <Minus className="w-4 h-4" strokeWidth={3} />
                                            </button>
                                            <span className="text-[15px] font-extrabold text-stone-800 min-w-[26px] text-center">{qty}</span>
                                            <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 text-white active:scale-90 transition-transform">
                                                <Plus className="w-4 h-4" strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Trust badges */}
                                <div className="grid grid-cols-3 gap-2 mt-5">
                                    {[
                                        { icon: ShieldCheck, label: "Energised & Blessed" },
                                        { icon: Truck, label: "Fast Delivery" },
                                        { icon: RotateCcw, label: "7-Day Returns" },
                                    ].map(({ icon: Icon, label }) => (
                                        <div key={label} className="bg-white border border-stone-100 rounded-xl py-2.5 flex flex-col items-center gap-1 text-center">
                                            <Icon className="w-4 h-4 text-amber-500" />
                                            <span className="text-[9.5px] font-semibold text-stone-500 leading-tight">{label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Highlights */}
                                <div className="mt-5">
                                    <h3 className="text-[13px] font-extrabold text-stone-800 uppercase tracking-wide mb-2">Highlights</h3>
                                    <ul className="space-y-2">
                                        {product.highlights.map((h) => (
                                            <li key={h} className="flex items-start gap-2 text-[13px] text-stone-600">
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* About */}
                                <div className="mt-5">
                                    <h3 className="text-[13px] font-extrabold text-stone-800 uppercase tracking-wide mb-1.5">About this item</h3>
                                    <p className="text-[13px] text-stone-500 leading-relaxed">
                                        {product.shortDesc}. Each {product.name} is carefully sourced, purified and energised by our pandits with the appropriate mantras before it reaches you — ready to be placed in your home mandir or worn for daily worship.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sticky footer */}
                        <div className="shrink-0 bg-white/95 backdrop-blur-sm border-t border-stone-100 px-4 py-3">
                            {soldOut ? (
                                <button disabled className="w-full bg-stone-100 text-stone-400 font-bold py-3.5 rounded-2xl cursor-not-allowed">
                                    Sold Out — Notify Me
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleAdd}
                                        className={`flex-1 flex items-center justify-center gap-1.5 font-bold py-3.5 rounded-2xl border-2 transition-colors ${justAdded ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-amber-500 text-amber-600 bg-white"}`}
                                    >
                                        {justAdded ? (
                                            <><Check className="w-4 h-4" strokeWidth={3} /> Added {cartQty > 0 ? `(${cartQty})` : ""}</>
                                        ) : (
                                            <><Plus className="w-4 h-4" strokeWidth={3} /> Add to Cart</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onBuyNow(product, qty)}
                                        className="flex-1 flex flex-col items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2.5 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-transform leading-none"
                                    >
                                        <span className="text-[14px]">Buy Now</span>
                                        <span className="text-[10px] font-semibold text-amber-50/90 mt-0.5">₹{lineTotal.toLocaleString("en-IN")}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
