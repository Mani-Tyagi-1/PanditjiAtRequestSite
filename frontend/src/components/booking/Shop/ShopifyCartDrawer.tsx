import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    X,
    Plus,
    Minus,
    Trash2,
    Loader2,
    CreditCard,
    Shield,
    Lock,
    Phone,
    AlertCircle,
    Check,
    ShoppingBag,
    Gift,
    Tag,
    LogIn,
} from "lucide-react";
import API_URL from "../../../utils/apiConfig";
import { useAuth } from "../../../context/AuthContext";
import { useShopifyCart } from "../../../context/ShopifyCartContext";
import { productPrice } from "./shopifyTypes";

const GIFT_WRAP_CHARGE = 49;
const FIRST_ORDER_DISCOUNT_PERCENT = 10;

const FORM_ID = "shopify-cart-checkout-form";

export default function ShopifyCartDrawer() {
    const navigate = useNavigate();
    const { user, openLoginModal } = useAuth();
    const { items, isOpen, count, subtotal, updateQty, removeItem, clear, closeCart } = useShopifyCart();

    const [checkoutForm, setCheckoutForm] = useState({
        name: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Gift wrapping
    const [giftWrap, setGiftWrap] = useState(false);
    const [giftRecipientName, setGiftRecipientName] = useState("");
    const [giftMessage, setGiftMessage] = useState("");

    // First-order discount (checked in the background)
    const [firstOrderEligible, setFirstOrderEligible] = useState(false);

    // Used to auto-scroll to the checkout form right after the user logs in
    const checkoutSectionRef = useRef<HTMLDivElement | null>(null);
    const prevUserRef = useRef(user);

    // Load Razorpay script
    useEffect(() => {
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) return;
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Reset transient state each time the drawer opens
    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setErrorMsg("");
            setGiftWrap(false);
            setGiftRecipientName("");
            setGiftMessage("");
            setCheckoutForm((prev) => ({ ...prev, name: user?.name || prev.name }));
        }
    }, [isOpen, user]);

    // Background check: first-order eligibility (10% off)
    useEffect(() => {
        if (!isOpen || !user?.phone) {
            setFirstOrderEligible(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get(
                    `${API_URL}/shopify-orders/first-order-eligibility/${user.phone}`,
                    { params: { userId: user._id } }
                );
                if (!cancelled) setFirstOrderEligible(Boolean(data?.eligible));
            } catch {
                if (!cancelled) setFirstOrderEligible(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen, user]);

    // When the user logs in while the cart is open, reveal the freshly-shown
    // checkout form by scrolling it into view.
    useEffect(() => {
        const justLoggedIn = isOpen && !prevUserRef.current && !!user;
        prevUserRef.current = user;
        if (justLoggedIn) {
            const t = setTimeout(() => {
                checkoutSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 150);
            return () => clearTimeout(t);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const firstOrderDiscount = firstOrderEligible
        ? Math.round((subtotal * FIRST_ORDER_DISCOUNT_PERCENT) / 100)
        : 0;
    const giftWrapCharge = giftWrap ? GIFT_WRAP_CHARGE : 0;
    const total = Math.max(1, subtotal - firstOrderDiscount + giftWrapCharge);

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            openLoginModal();
            return;
        }
        if (items.length === 0) return;

        const { name, addressLine, city, state, pincode } = checkoutForm;
        if (!name.trim() || !addressLine.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            setErrorMsg("Please fill in all shipping details.");
            return;
        }
        if (!/^\d{6}$/.test(pincode.trim())) {
            setErrorMsg("Please enter a valid 6-digit pincode.");
            return;
        }
        if (giftWrap && !giftRecipientName.trim()) {
            setErrorMsg("Please enter the recipient's name for gift wrapping.");
            return;
        }

        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const orderRes = await axios.post(`${API_URL}/shopify-orders/create-order`, {
                items: items.map((l) => ({
                    shopifyProductId: l.product.shopifyProductId,
                    variantId: "",
                    title: l.product.title,
                    qty: l.qty,
                })),
                customerName: name,
                phone: user?.phone,
                addressLine,
                city,
                state,
                pincode,
                userId: user?._id,
                giftWrap,
                giftRecipientName: giftWrap ? giftRecipientName.trim() : "",
                giftMessage: giftWrap ? giftMessage.trim() : "",
            });

            const orderData = orderRes.data;
            if (!orderData || !orderData.success) {
                throw new Error(orderData.message || "Failed to initialize order.");
            }

            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) {
                throw new Error("Razorpay payment SDK failed to load. Please refresh and try again.");
            }

            const prefillEmail = user?.email || `user${user?.phone || ""}@panditjiatrequest.com`;
            const description = items.length === 1
                ? `${items[0].product.title} (x${items[0].qty})`
                : `${count} items`;

            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: orderData.amount * 100,
                currency: orderData.currency || "INR",
                name: "PanditJi At Request",
                description,
                order_id: orderData.razorpayOrderId,
                prefill: { name, contact: user?.phone, email: prefillEmail },
                theme: { color: "#F97316" },
                handler: async function (response: any) {
                    try {
                        const completeRes = await axios.post(`${API_URL}/shopify-orders/complete-payment`, {
                            bookingId: orderData.bookingId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        if (!completeRes.data || !completeRes.data.success) {
                            throw new Error(completeRes.data.message || "Payment verification failed.");
                        }
                        clear();
                        setIsSuccess(true);
                    } catch (paymentError: any) {
                        setErrorMsg(paymentError.response?.data?.message || paymentError.message || "Payment verification failed.");
                    } finally {
                        setIsSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setErrorMsg("Payment was cancelled. Please try again.");
                        setIsSubmitting(false);
                    },
                },
            });

            rzp.on("payment.failed", function (response: any) {
                setErrorMsg(response?.error?.description || "Payment failed. Please try again.");
                setIsSubmitting(false);
            });

            rzp.open();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] max-w-md mx-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !isSubmitting && closeCart()} />

            {/* Right Drawer Panel */}
            <div className="absolute top-0 right-0 h-full w-[92%] max-w-[420px] bg-[#FFFAF3] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {isSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-8 h-8" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-stone-850 mb-2">Order Confirmed!</h2>
                        <p className="text-stone-500 text-sm mb-6">
                            Thank you! Your payment is successful and your order has been placed.
                        </p>
                        <button
                            onClick={() => {
                                closeCart();
                                navigate("/profile?tab=shopify");
                            }}
                            className="w-full bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-100 active:scale-95 transition-all text-sm"
                        >
                            Go to My Orders
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-orange-100 shrink-0">
                            <h3 className="text-base font-bold text-stone-850">
                                Your Cart{count > 0 ? ` (${count})` : ""}
                            </h3>
                            <button type="button" onClick={() => !isSubmitting && closeCart()} className="p-1 rounded-full bg-stone-100 text-stone-500 active:scale-90">
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
                                <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
                                <p className="text-sm font-semibold text-stone-500">Your cart is empty</p>
                                <p className="text-xs mt-1">Add some energized products to get started.</p>
                                <button
                                    type="button"
                                    onClick={() => { closeCart(); navigate("/shop"); }}
                                    className="mt-5 bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-sm"
                                >
                                    Browse Shop
                                </button>
                            </div>
                        ) : (
                            <>
                                <form id={FORM_ID} onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* ─── Cart items ─── */}
                                    <div className="space-y-3">
                                        {items.map((l) => {
                                            const price = productPrice(l.product);
                                            return (
                                                <div key={l.product._id} className="flex gap-3 bg-white p-3 rounded-2xl border border-orange-50 shadow-xs">
                                                    <div className="w-16 h-16 bg-orange-50/20 rounded-xl border border-orange-100 overflow-hidden shrink-0">
                                                        {l.product.featuredImage?.url ? (
                                                            <img src={l.product.featuredImage.url} alt={l.product.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag className="w-6 h-6" /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="text-[12.5px] font-bold text-stone-850 leading-snug line-clamp-2">{l.product.title}</h4>
                                                            <button type="button" onClick={() => removeItem(l.product._id)} className="text-stone-300 hover:text-red-500 shrink-0 active:scale-90">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-sm font-black text-orange-600">₹{(price * l.qty).toLocaleString("en-IN")}</span>
                                                            <div className="flex items-center gap-2 border border-orange-100 rounded-xl px-2 py-1 bg-orange-50/20">
                                                                <button type="button" onClick={() => updateQty(l.product._id, l.qty - 1)} className="p-0.5 text-stone-500 active:scale-90"><Minus className="w-3.5 h-3.5" /></button>
                                                                <span className="text-xs font-bold text-stone-800 min-w-[12px] text-center">{l.qty}</span>
                                                                <button type="button" onClick={() => updateQty(l.product._id, l.qty + 1)} className="p-0.5 text-stone-500 active:scale-90"><Plus className="w-3.5 h-3.5" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {!user ? (
                                        /* ─── Logged-out: login prompt ─── */
                                        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-xs text-center">
                                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                                                <LogIn className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <h4 className="text-sm font-bold text-stone-850">Login to checkout</h4>
                                            <p className="text-[12px] text-stone-500 mt-1">Sign in to add your delivery details and place the order.</p>
                                            <button
                                                type="button"
                                                onClick={openLoginModal}
                                                className="mt-4 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-2xl shadow-md active:scale-95 transition-all text-sm"
                                            >
                                                Login to Continue
                                            </button>
                                        </div>
                                    ) : (
                                        /* ─── Logged-in: checkout form ─── */
                                        <>
                                            <div ref={checkoutSectionRef} className="space-y-3 scroll-mt-2">
                                                <h4 className="text-[12px] font-black uppercase tracking-wider text-stone-400">Delivery Details</h4>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Full Name</label>
                                                    <input
                                                        type="text" placeholder="Your full name"
                                                        value={checkoutForm.name}
                                                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                                                        className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                        required disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Phone Number</label>
                                                    <div className="mt-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-500">
                                                        <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                                                        <span>+91 {user?.phone}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Shipping Address</label>
                                                    <input
                                                        type="text" placeholder="House No, Street name, Locality"
                                                        value={checkoutForm.addressLine}
                                                        onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine: e.target.value })}
                                                        className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                        required disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">City</label>
                                                        <input
                                                            type="text" placeholder="City"
                                                            value={checkoutForm.city}
                                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                                                            className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                            required disabled={isSubmitting}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">State</label>
                                                        <input
                                                            type="text" placeholder="State"
                                                            value={checkoutForm.state}
                                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                                                            className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                            required disabled={isSubmitting}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Pincode</label>
                                                    <input
                                                        type="text" placeholder="6-digit pincode" maxLength={6}
                                                        value={checkoutForm.pincode}
                                                        onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value.replace(/\D/g, "") })}
                                                        className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white font-mono"
                                                        required disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>

                                            {/* Gift Wrapping */}
                                            <div className="bg-white border border-orange-100 rounded-2xl p-3.5 shadow-xs space-y-3">
                                                <label className="flex items-center justify-between gap-3 cursor-pointer">
                                                    <span className="flex items-center gap-2.5">
                                                        <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                                            <Gift className="w-4.5 h-4.5 text-orange-500" />
                                                        </span>
                                                        <span className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-stone-800">Add Gift Wrapping</span>
                                                            <span className="text-[10.5px] text-stone-400">Premium wrap + personal note · ₹{GIFT_WRAP_CHARGE}</span>
                                                        </span>
                                                    </span>
                                                    <span className="relative shrink-0">
                                                        <input type="checkbox" className="sr-only peer" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} disabled={isSubmitting} />
                                                        <span className="block w-11 h-6 rounded-full bg-stone-200 peer-checked:bg-orange-500 transition-colors" />
                                                        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                                                    </span>
                                                </label>
                                                {giftWrap && (
                                                    <div className="space-y-2.5 pt-1 border-t border-orange-50">
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Recipient's Name <span className="text-orange-500">*</span></label>
                                                            <input
                                                                type="text" placeholder="Who is this gift for?"
                                                                value={giftRecipientName}
                                                                onChange={(e) => setGiftRecipientName(e.target.value)}
                                                                className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Greeting Message <span className="text-stone-300 normal-case font-medium">(optional)</span></label>
                                                            <textarea
                                                                placeholder="Write a short message to include with the gift..."
                                                                value={giftMessage}
                                                                onChange={(e) => setGiftMessage(e.target.value)}
                                                                rows={2} maxLength={200}
                                                                className="mt-1 w-full border border-orange-100 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-orange-400 bg-white resize-none"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price Summary */}
                                            <div className="bg-white border border-orange-100 rounded-2xl p-3.5 shadow-xs space-y-2 text-[12.5px]">
                                                <div className="flex items-center justify-between text-stone-600">
                                                    <span>Subtotal ({count} {count === 1 ? "item" : "items"})</span>
                                                    <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
                                                </div>
                                                {firstOrderDiscount > 0 && (
                                                    <div className="flex items-center justify-between text-emerald-600">
                                                        <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> First order ({FIRST_ORDER_DISCOUNT_PERCENT}% off)</span>
                                                        <span className="font-semibold">−₹{firstOrderDiscount.toLocaleString("en-IN")}</span>
                                                    </div>
                                                )}
                                                {giftWrapCharge > 0 && (
                                                    <div className="flex items-center justify-between text-stone-600">
                                                        <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Gift wrapping</span>
                                                        <span className="font-semibold">+₹{giftWrapCharge.toLocaleString("en-IN")}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between pt-2 border-t border-orange-50 text-stone-850">
                                                    <span className="font-bold">Total</span>
                                                    <span className="text-base font-black text-orange-600">₹{total.toLocaleString("en-IN")}</span>
                                                </div>
                                                {firstOrderDiscount > 0 && (
                                                    <p className="text-[10.5px] text-emerald-600 font-semibold">🎉 You saved ₹{firstOrderDiscount.toLocaleString("en-IN")} on your first order!</p>
                                                )}
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    <span>{errorMsg}</span>
                                                </div>
                                            )}

                                            {/* Trust badges */}
                                            <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border border-stone-100 p-3">
                                                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                                                    <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span className="leading-tight">Genuine Products Blessed by Experts</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                                                    <Lock className="w-4 h-4 text-orange-500 shrink-0" />
                                                    <span className="leading-tight">Secured by Razorpay Payments</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </form>

                                {/* Sticky Footer */}
                                <div className="p-4 border-t border-orange-100 bg-white shrink-0 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-stone-500">{user ? "Total" : "Subtotal"}</span>
                                        <span className="font-black text-stone-850">₹{(user ? total : subtotal).toLocaleString("en-IN")}</span>
                                    </div>
                                    {!user ? (
                                        <button
                                            type="button"
                                            onClick={openLoginModal}
                                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <LogIn className="w-4 h-4" /> Login to Checkout
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            form={FORM_ID}
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 active:scale-95 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing Secure Payment...</span></>
                                            ) : (
                                                <><CreditCard className="w-4 h-4" /><span>Pay ₹{total.toLocaleString("en-IN")} Securely</span></>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
