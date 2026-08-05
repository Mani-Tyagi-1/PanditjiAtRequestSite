import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Plus, Minus, Trash2, ShoppingBag, Check,
    ChevronLeft, ShieldCheck, Truck,
} from "lucide-react";
import API_URL from "../../../utils/apiConfig";
import {
    calcShipping, FREE_SHIPPING_THRESHOLD,
    type CartLine, type ShopProduct,
} from "./shopData";
import { money } from "../../../utils/currency";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cart: CartLine[];
    onAdd: (product: ShopProduct) => void;
    onRemove: (product: ShopProduct) => void;
    onDelete: (product: ShopProduct) => void;
    onOrderPlaced: () => void;
}

type Step = "cart" | "checkout" | "success";

const INPUT =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

export default function ShopCartModal({
    isOpen, onClose, cart, onAdd, onRemove, onDelete, onOrderPlaced,
}: Props) {
    const [step, setStep] = useState<Step>("cart");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });

    useEffect(() => {
        if (isOpen) {
            setStep("cart");
            setError("");
            setSubmitting(false);
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen]);

    const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
    const shipping = calcShipping(subtotal);
    const total = subtotal + shipping;
    const itemCount = cart.reduce((s, l) => s + l.qty, 0);

    const goCheckout = () => {
        if (cart.length === 0) return;
        setError("");
        setStep("checkout");
    };

    const placeOrder = async () => {
        if (!form.name.trim()) { setError("Please enter your name."); return; }
        if (form.phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
        if (!form.address.trim() || !form.city.trim() || form.pincode.replace(/\D/g, "").length !== 6) {
            setError("Please enter a complete delivery address with a 6-digit pincode.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/shop-orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map((l) => ({
                        productSlug: l.product.id,
                        name: l.product.name,
                        price: l.product.price,
                        qty: l.qty,
                    })),
                    customerName: form.name.trim(),
                    phone: form.phone.replace(/\D/g, ""),
                    addressLine: form.address.trim(),
                    city: form.city.trim(),
                    pincode: form.pincode.replace(/\D/g, ""),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            if (window.fbq) {
                window.fbq("track", "Purchase", {
                    content_type: "shop_product",
                    num_items: itemCount,
                    value: total,
                    currency: "INR",
                });
            }
            setStep("success");
        } catch {
            setError("Could not place your order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        onOrderPlaced();
        onClose();
        setForm({ name: "", phone: "", address: "", city: "", pincode: "" });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center shop-modal">
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                        .shop-modal { font-family: 'DM Sans', sans-serif; }
                        .shop-serif { font-family: 'Cormorant Garamond', serif; }
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
                        style={{ maxHeight: "92vh" }}
                    >
                        {/* Header */}
                        <div className="shrink-0 px-5 pt-4 pb-3 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                                {step === "checkout" ? (
                                    <button onClick={() => setStep("cart")} className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full bg-white/20 active:scale-95">
                                        <ChevronLeft className="w-4.5 h-4.5" />
                                    </button>
                                ) : (
                                    <ShoppingBag className="w-5 h-5" />
                                )}
                                <h2 className="shop-serif font-bold" style={{ fontSize: "22px" }}>
                                    {step === "cart" ? `Your Cart (${itemCount})` : step === "checkout" ? "Delivery Details" : "Order Placed"}
                                </h2>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white active:scale-95">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <AnimatePresence mode="wait">
                                {/* CART */}
                                {step === "cart" && (
                                    <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {cart.length === 0 ? (
                                            <div className="text-center py-16">
                                                <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                                                <p className="text-stone-500 font-semibold mt-3">Your cart is empty</p>
                                                <p className="text-stone-400 text-[12px] mt-1">Add some blessed items to get started 🙏</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {cart.map((line) => (
                                                    <div key={line.product.id} className="flex gap-3 bg-white rounded-2xl border border-stone-100 p-2.5">
                                                        <img src={line.product.image} alt={line.product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-stone-800 text-[13px] leading-tight line-clamp-2">{line.product.name}</h4>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[14px] font-bold text-stone-900">{money(line.product.price)}</span>
                                                                {line.product.originalPrice && (
                                                                    <span className="text-[11px] text-stone-400 line-through">{money(line.product.originalPrice)}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between mt-1.5">
                                                                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-1 py-0.5">
                                                                    <button onClick={() => onRemove(line.product)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-amber-600">
                                                                        <Minus className="w-3 h-3" strokeWidth={3} />
                                                                    </button>
                                                                    <span className="text-[13px] font-bold text-stone-800 min-w-[18px] text-center">{line.qty}</span>
                                                                    <button onClick={() => onAdd(line.product)} className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-500 text-white">
                                                                        <Plus className="w-3 h-3" strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                                <button onClick={() => onDelete(line.product)} className="text-stone-400 hover:text-red-500 transition-colors p-1">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Shipping nudge */}
                                                {shipping > 0 && (
                                                    <div className="flex items-center gap-2 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                        <Truck className="w-4 h-4 shrink-0" />
                                                        Add {money((FREE_SHIPPING_THRESHOLD - subtotal))} more for FREE delivery
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* CHECKOUT */}
                                {step === "checkout" && (
                                    <motion.div key="checkout" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                                        <div className="space-y-3.5">
                                            <div>
                                                <label className={LABEL}>Full Name *</label>
                                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Recipient name" className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Mobile Number *</label>
                                                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit number" inputMode="numeric" className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Address *</label>
                                                <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="House no., street, area" rows={2} className={`${INPUT} resize-none`} />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className={LABEL}>City *</label>
                                                    <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className={INPUT} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className={LABEL}>Pincode *</label>
                                                    <input value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="6-digit" inputMode="numeric" className={INPUT} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order summary */}
                                        <div className="mt-4 bg-white rounded-2xl border border-stone-100 p-4">
                                            <div className="flex items-center justify-between text-[13px] text-stone-600">
                                                <span>Subtotal ({itemCount} items)</span>
                                                <span>{money(subtotal)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[13px] mt-1">
                                                <span className="text-stone-600">Delivery</span>
                                                <span className={shipping === 0 ? "text-emerald-600 font-semibold" : "text-stone-600"}>
                                                    {shipping === 0 ? "FREE" : `${money(shipping)}`}
                                                </span>
                                            </div>
                                            <div className="my-2.5 h-px bg-stone-100" />
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-stone-800">Total</span>
                                                <span className="font-bold text-amber-600 text-[20px]">{money(total)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-start gap-2 text-[11px] text-stone-500 bg-white border border-stone-100 rounded-xl p-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Cash on Delivery available. Easy 7-day returns on all items.</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUCCESS */}
                                {step === "success" && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-200">
                                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                        </motion.div>
                                        <h3 className="shop-serif font-bold text-stone-800 mt-5" style={{ fontSize: "26px" }}>Order Placed! 🙏</h3>
                                        <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                                            Thank you, <span className="font-semibold text-stone-700">{form.name}</span>. Your order of {itemCount} item{itemCount > 1 ? "s" : ""} is confirmed. We'll WhatsApp tracking details on <span className="font-semibold text-stone-700">+91 {form.phone}</span>.
                                        </p>
                                        <button onClick={handleSuccessClose} className="mt-6 w-full bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
                                            Continue Shopping
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && step !== "success" && (
                                <p className="text-red-500 text-[12px] font-semibold mt-3 text-center">{error}</p>
                            )}
                        </div>

                        {/* Footer */}
                        {step !== "success" && cart.length > 0 && (
                            <div className="shrink-0 bg-white/90 backdrop-blur-sm border-t border-stone-100 px-5 py-3.5 flex items-center gap-3">
                                <div className="leading-none">
                                    <span className="text-[10px] text-stone-400 font-semibold uppercase">Total</span>
                                    <p className="text-[18px] font-bold text-stone-900">{money(total)}</p>
                                </div>
                                {step === "cart" ? (
                                    <button onClick={goCheckout} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-transform">
                                        Proceed to Checkout
                                    </button>
                                ) : (
                                    <button onClick={placeOrder} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-transform disabled:opacity-60">
                                        {submitting ? (
                                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing…</>
                                        ) : (
                                            <>Place Order <Check className="w-4 h-4" strokeWidth={3} /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
