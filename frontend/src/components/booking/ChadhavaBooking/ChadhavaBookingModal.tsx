import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShieldCheck, Flower2 } from "lucide-react";
import { type Chadhava, type ChadhavaSelection } from "./chadhavaData";
import API_URL from "../../../utils/apiConfig";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    chadhava: Chadhava | null;
    selections: ChadhavaSelection[];
    addPrasad: boolean;
    prasadPrice: number;
}

const INPUT =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

export default function ChadhavaBookingModal({ isOpen, onClose, chadhava, selections, addPrasad, prasadPrice }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({ name: "", gotra: "", phone: "", wish: "" });

    useEffect(() => {
        if (isOpen) {
            setSubmitting(false);
            setError("");
            setDone(false);
            setForm({ name: "", gotra: "", phone: "", wish: "" });
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isOpen]);

    // Load the Razorpay checkout script once.
    useEffect(() => {
        const SRC = "https://checkout.razorpay.com/v1/checkout.js";
        if (document.querySelector(`script[src="${SRC}"]`)) return;
        const script = document.createElement("script");
        script.src = SRC;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    if (!chadhava) return null;

    const itemsTotal = selections.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
    const total = itemsTotal + prasadPrice;

    const handlePay = async () => {
        setError("");
        if (!form.name.trim()) { setError("Please enter the devotee's name."); return; }
        if (form.phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
        if (selections.length === 0) { setError("Please select at least one seva."); return; }

        setSubmitting(true);
        try {
            // 1. Pending booking + order. Server resolves prices from the DB —
            //    we send only item codes + quantities, never amounts.
            const orderRes = await fetch(`${API_URL}/chadhava-bookings/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chadhavaSlug: chadhava.id,
                    items: selections.map((s) => ({ code: s.code, quantity: s.quantity })),
                    addPrasadBox: addPrasad,
                    devoteeName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    phone: form.phone.replace(/\D/g, ""),
                    wish: form.wish.trim(),
                }),
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.message || "Failed to start payment.");

            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) throw new Error("Payment SDK failed to load. Please refresh and try again.");

            // 2. Open Razorpay.
            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: Number(orderData.amount) * 100,
                currency: orderData.currency || "INR",
                name: "Pandit Ji At Request",
                description: `${chadhava.deity} Chadhava`,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: form.name.trim(),
                    contact: form.phone.replace(/\D/g, ""),
                    email: `user${form.phone.replace(/\D/g, "")}@panditjiatrequest.com`,
                },
                theme: { color: "#E11D48" },
                handler: async (response: any) => {
                    try {
                        // 3. Verify server-side before showing success.
                        const verifyRes = await fetch(`${API_URL}/chadhava-bookings/complete-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                bookingId: orderData.bookingId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

                        if (window.fbq) {
                            window.fbq("track", "Purchase", {
                                content_name: `Chadhava - ${chadhava.deity} - ${chadhava.templeName}`,
                                content_type: "chadhava",
                                value: Number(orderData.amount) || total,
                                currency: "INR",
                            });
                        }
                        setDone(true);
                    } catch (verifyErr: any) {
                        setError(verifyErr.message || "Payment verification failed. Please contact support.");
                    } finally {
                        setSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setError("Payment was cancelled. You can try again.");
                        setSubmitting(false);
                    },
                },
            });

            rzp.on("payment.failed", (resp: any) => {
                setError(resp?.error?.description || "Payment failed. Please try again.");
                setSubmitting(false);
            });

            rzp.open();
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="relative w-full max-w-md bg-[#FFFAF6] rounded-t-3xl flex flex-col overflow-hidden"
                        style={{ maxHeight: "92vh" }}
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-rose-100">
                            <h2 className="text-[17px] font-bold text-stone-800 flex items-center gap-2">
                                <Flower2 className="w-4.5 h-4.5 text-rose-500" /> Complete your Seva
                            </h2>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center active:scale-90 transition-transform">
                                <X className="w-4 h-4 text-stone-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {done ? (
                                <div className="flex flex-col items-center text-center py-8">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-200">
                                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                    </div>
                                    <h3 className="text-[24px] font-bold text-stone-800 mt-5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                        Chadhava Booked! 🙏
                                    </h3>
                                    <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                                        Your seva will be offered to <span className="font-semibold text-stone-700">{chadhava.deity}</span>.
                                        We'll WhatsApp the proof on <span className="font-semibold text-stone-700">+91 {form.phone}</span>.
                                    </p>
                                    <button onClick={onClose} className="mt-6 w-full bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Order summary */}
                                    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                        {selections.map((s) => (
                                            <div key={s.code} className="flex items-center justify-between px-4 py-2.5 border-b border-stone-50 text-[13px]">
                                                <span className="text-stone-600">{s.name} × {s.quantity}</span>
                                                <span className="font-semibold text-stone-800">₹{(s.unitPrice * s.quantity).toLocaleString("en-IN")}</span>
                                            </div>
                                        ))}
                                        {prasadPrice > 0 && (
                                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-50 text-[13px]">
                                                <span className="text-stone-600">{chadhava.prasad?.name || "Prasad Box"}</span>
                                                <span className="font-semibold text-stone-800">₹{prasadPrice.toLocaleString("en-IN")}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between px-4 py-3 bg-rose-50/50">
                                            <span className="font-bold text-stone-800">Total Payable</span>
                                            <span className="font-bold text-rose-600 text-[18px]">₹{total.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    {/* Sankalp form */}
                                    <p className="text-[12px] text-stone-500 mt-4 mb-3">
                                        The chadhava will be offered to {chadhava.deity} in this name &amp; gotra. 🙏
                                    </p>
                                    <div className="space-y-3.5">
                                        <div>
                                            <label className={LABEL}>Devotee's Full Name *</label>
                                            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name for the sankalp" className={INPUT} />
                                        </div>
                                        <div>
                                            <label className={LABEL}>Gotra</label>
                                            <input value={form.gotra} onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))} placeholder="e.g. Kashyap" className={INPUT} />
                                        </div>
                                        <div>
                                            <label className={LABEL}>Mobile Number *</label>
                                            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit WhatsApp number" inputMode="numeric" className={INPUT} />
                                        </div>
                                        <div>
                                            <label className={LABEL}>Your Wish / Prayer (optional)</label>
                                            <textarea value={form.wish} onChange={(e) => setForm((f) => ({ ...f, wish: e.target.value }))} placeholder="Share the intention behind this offering…" rows={2} className={`${INPUT} resize-none`} />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 text-[11px] text-stone-500 bg-white border border-stone-100 rounded-xl p-3">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>You'll receive a photo/video of your chadhava being offered. 100% secure & fully refundable if not performed.</span>
                                    </div>

                                    {error && <p className="text-red-500 text-[12px] font-semibold mt-3 text-center">{error}</p>}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {!done && (
                            <div className="shrink-0 bg-white/90 backdrop-blur-sm border-t border-stone-100 px-5 py-3.5 flex items-center gap-3">
                                <div className="leading-none">
                                    <span className="text-[10px] text-stone-400 font-semibold uppercase">Total</span>
                                    <p className="text-[18px] font-bold text-stone-900">₹{total.toLocaleString("en-IN")}</p>
                                </div>
                                <button
                                    onClick={handlePay}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                                    ) : (
                                        <>Pay ₹{total.toLocaleString("en-IN")} & Offer</>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
