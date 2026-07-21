import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Gift } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG, PRASAD_BOX_PRICE } from "../data/kashiMahadevPuja";

type Step = "details" | "success";

const INPUT =
    "w-full bg-emerald-50/40 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

// Resolve the fixed puja date + a chosen HH:mm into an ISO timestamp.
function resolveBookingDate(dateLabel: string, time: string): string {
    const base = new Date(dateLabel);
    if (isNaN(base.getTime())) return new Date().toISOString();
    const m = time?.match(/(\d{1,2}):(\d{2})/);
    if (m) base.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
    return base.toISOString();
}

export default function SavanPujaBookingPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Whether the devotee chose to add the prasad box on the upsell sheet.
    const prasadPreselected = Boolean((location.state as { prasadAdded?: boolean } | null)?.prasadAdded);

    // Static frontend puja data.
    const puja = kashiMahadevPuja;

    const [step, setStep] = useState<Step>("details");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Devotee + schedule form
    const [form, setForm] = useState({
        name: "",
        gotra: "",
        phone: "",
        email: "",
        time: "06:00", // Savan Somwar abhishek is performed in the early morning
        prasadAdded: prasadPreselected,
    });

    // Delivery address (only required when blessed prasad is added)
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        houseNo: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        saveAs: "Home",
    });

    // Prefill from the logged-in user once it resolves.
    useEffect(() => {
        setForm((f) => ({
            ...f,
            name: user?.name || (user as any)?.fullName || f.name,
            gotra: (user as any)?.gotra || f.gotra,
            phone: user?.phone || f.phone,
            email: user?.email || f.email,
        }));
    }, [user]);

    // Load saved addresses if logged in and prasad delivery is added.
    useEffect(() => {
        if (!user || !form.prasadAdded) return;
        fetch(`${API_URL}/addresses?userId=${user._id}`)
            .then((res) => res.json())
            .then((data) => {
                const decrypted = data?.encrypted ? decryptData(data.encrypted) : data;
                const list = Array.isArray(decrypted) ? decrypted : Array.isArray(data) ? data : [];
                setAddresses(list);
                if (list.length > 0) {
                    setSelectedAddressId(list[0]._id || list[0].id);
                    setShowNewAddressForm(false);
                } else {
                    setShowNewAddressForm(true);
                }
            })
            .catch((err) => console.error("Error fetching addresses:", err));
    }, [user, form.prasadAdded]);

    // Load Razorpay checkout script.
    useEffect(() => {
        const SRC = "https://checkout.razorpay.com/v1/checkout.js";
        if (document.querySelector(`script[src="${SRC}"]`)) return;
        const script = document.createElement("script");
        script.src = SRC;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const basePrice = puja.poojaPriceOnline;
    const prasadCost = form.prasadAdded ? PRASAD_BOX_PRICE : 0;
    const totalPrice = basePrice + prasadCost;

    const handleConfirm = async () => {
        setError("");

        if (!form.name.trim()) {
            setError("Please enter the devotee's name.");
            return;
        }
        const phoneDigits = form.phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        // Delivery address is only required when blessed prasad is added.
        let addressPayload: any = null;
        if (form.prasadAdded) {
            if (user && !showNewAddressForm) {
                if (!selectedAddressId) {
                    setError("Please select a delivery address for the prasad.");
                    return;
                }
                const selected = addresses.find((a) => (a._id || a.id) === selectedAddressId);
                if (selected) {
                    addressPayload = {
                        addressLine1: selected.addressLine1 || selected.houseNo,
                        addressLine2: selected.addressLine2 || selected.street,
                        city: selected.city,
                        state: selected.state,
                        pincode: selected.pincode,
                        addressName: selected.addressName || selected.saveAs,
                    };
                }
            } else {
                if (!newAddress.houseNo.trim() || !newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
                    setError("Please fill out the full delivery address for the prasad.");
                    return;
                }
                addressPayload = {
                    addressLine1: newAddress.houseNo.trim(),
                    addressLine2: newAddress.street.trim(),
                    city: newAddress.city.trim(),
                    state: newAddress.state.trim(),
                    pincode: newAddress.pincode.trim(),
                    addressName: newAddress.saveAs.trim() || "Home",
                };
            }
        }

        setSubmitting(true);

        try {
            const bookingDate = resolveBookingDate(puja.pujaDate, form.time);

            // 1) Create the pending booking + Razorpay order. The server
            //    auto-registers the user by phone when userId is absent.
            const res = await fetch(`${API_URL}/bookings/create-pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encryptPayload({
                    userId: user?._id || (user as any)?.id,
                    poojaId: puja._id,
                    poojaMode: "online",
                    bookingDate,
                    amount: totalPrice,
                    panditDakshina: puja.panditDakshina,
                    bhaktName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    contactNumber: phoneDigits,
                    phone: phoneDigits,
                    emailId: form.email.trim(),
                    prasadAdded: form.prasadAdded,
                    address: addressPayload,
                })),
            });
            const orderData = await res.json();
            if (!res.ok) throw new Error(orderData.message || "Failed to start booking payment.");
            if (!orderData.razorpayOrderId || !orderData.razorpayKeyId) {
                throw new Error("Could not initialise payment. Please try again.");
            }

            const RazorpayCtor = (window as any).Razorpay;
            if (!RazorpayCtor) throw new Error("Payment SDK failed to load. Please refresh and try again.");

            if ((window as any).fbq) {
                (window as any).fbq("track", "AddToCart", {
                    content_name: puja.poojaNameEng,
                    content_ids: [puja._id],
                    content_type: "product",
                    value: totalPrice,
                    currency: "INR",
                });
                (window as any).fbq("track", "InitiateCheckout", {
                    content_name: puja.poojaNameEng,
                    content_ids: [puja._id],
                    content_type: "product",
                    value: totalPrice,
                    currency: "INR",
                });
            }

            // 2) Open Razorpay checkout.
            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: totalPrice * 100,
                currency: "INR",
                name: "Pandit Ji At Request",
                description: puja.poojaNameEng,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: form.name.trim(),
                    contact: phoneDigits,
                    email: form.email.trim() || `user${phoneDigits}@panditjiatrequest.com`,
                },
                theme: { color: "#059669" },
                handler: async (response: any) => {
                    try {
                        setSubmitting(true);
                        // 3) Verify payment → server creates the final booking and
                        //    sends the WhatsApp + email confirmation.
                        const verifyRes = await fetch(`${API_URL}/bookings/complete-booking`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(encryptPayload({
                                pendingBookingId: orderData.bookingId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                amountPaid: totalPrice,
                            })),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

                        if (verifyData.token && verifyData.user) login(verifyData.token, verifyData.user);

                        if ((window as any).fbq) {
                            (window as any).fbq("track", "Purchase", {
                                content_name: puja.poojaNameEng,
                                content_ids: [puja._id],
                                content_type: "product",
                                value: totalPrice,
                                currency: "INR",
                            }, { eventID: `puja_purchase_${response.razorpay_order_id}` });
                        }

                        setStep("success");
                        setTimeout(() => navigate("/account?tab=pooja"), 2500);
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
            console.error("[SavanPujaBooking] booking failed:", err);
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="svb-page min-h-screen bg-[#F5FCF8] w-full max-w-md mx-auto border-x border-emerald-100 relative pb-28">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .svb-page { font-family: 'DM Sans', sans-serif; }
                .svb-serif { font-family: 'Cormorant Garamond', serif; }
            `}</style>
            <Helmet>
                <title>{`Complete your booking — ${puja.poojaNameEng} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#F5FCF8]/95 backdrop-blur-md border-b border-emerald-100 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => (location.key !== "default" ? navigate(-1) : navigate(`/${KASHI_MAHADEV_PUJA_SLUG}`))}
                    aria-label="Go back"
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-200/60 shadow-sm active:scale-90 transition-transform shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-bold text-stone-800 leading-tight truncate">Complete Your Savan Puja</h1>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{puja.templeName} · {puja.templeLocation}</span>
                    </p>
                </div>
            </div>

            {/* Savan occasion ribbon */}
            <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 text-center py-1.5 px-4">
                <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-white">
                    {puja.occasion} · {puja.pujaDate} · हर हर महादेव
                </p>
            </div>

            {/* Content */}
            <div className="px-5 pt-4 space-y-6">
                {step === "details" ? (
                    <div className="space-y-6">
                        {/* Order summary — itemises the prasad box when added */}
                        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[13.5px] font-bold text-stone-800 leading-snug">{puja.poojaNameEng}</p>
                                <span className="flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-[11px] font-bold">
                                    ★ {puja.rating}
                                </span>
                            </div>
                            {puja.poojaNameHindi && <p className="text-[11.5px] text-emerald-600 font-medium mt-0.5">{puja.poojaNameHindi}</p>}

                            {form.prasadAdded ? (
                                <div className="mt-2.5 pt-2.5 border-t border-emerald-100/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-stone-600 font-medium">Base Seva</span>
                                        <span className="text-[13px] font-bold text-stone-800">₹{basePrice.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-stone-600 font-medium flex items-center gap-1.5">
                                            <Gift className="w-3.5 h-3.5 text-emerald-500" />
                                            Sacred Prasad Box
                                        </span>
                                        <span className="text-[13px] font-bold text-stone-800">+₹{PRASAD_BOX_PRICE.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex items-baseline justify-between pt-2 border-t border-emerald-100/60">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Total</span>
                                        <span className="text-xl font-extrabold text-emerald-700">₹{totalPrice.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-baseline gap-2 mt-2.5 pt-2.5 border-t border-emerald-100/60">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Base Seva</span>
                                    <span className="text-xl font-bold text-stone-900">₹{basePrice.toLocaleString("en-IN")}</span>
                                </div>
                            )}
                        </div>

                        {/* Step 1: Devotee Details */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-100/60">
                                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">01</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-[14px]">Devotee Details</h3>
                                    <p className="text-[11px] text-stone-400">For the main Sankalp</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className={LABEL}>Mobile Number *</label>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                                        placeholder="10-digit number for updates"
                                        inputMode="numeric"
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Devotee's Name *</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        placeholder="Name for main Sankalp"
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Gotra</label>
                                    <input
                                        value={form.gotra}
                                        onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))}
                                        placeholder="e.g. Kashyap"
                                        className={INPUT}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Prasad Delivery (optional) */}
                        <div className="space-y-3 pb-6">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-100/60">
                                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">02</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-[14px]">Prasad Delivery</h3>
                                    <p className="text-[11px] text-stone-400">Optional delivery at your address</p>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.prasadAdded}
                                    onChange={(e) => setForm((f) => ({ ...f, prasadAdded: e.target.checked }))}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 border-emerald-200"
                                />
                                <div>
                                    <p className="text-xs font-bold text-stone-800">Add Sacred Prasad</p>
                                    <p className="text-[11px] text-stone-400 mt-0.5">Blessed at {puja.templeName} · +₹{PRASAD_BOX_PRICE}</p>
                                </div>
                            </label>

                            {form.prasadAdded && user && addresses.length > 0 && !showNewAddressForm && (
                                <div className="space-y-2">
                                    <p className={LABEL}>Select Delivery Address</p>
                                    {addresses.map((addr) => (
                                        <label
                                            key={addr._id}
                                            className={`flex items-start gap-3 bg-white border rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-emerald-500 bg-emerald-50/30" : "border-stone-100"}`}
                                        >
                                            <input
                                                type="radio"
                                                name="addressSelect"
                                                checked={selectedAddressId === addr._id}
                                                onChange={() => setSelectedAddressId(addr._id)}
                                                className="mt-1 text-emerald-600 focus:ring-emerald-400 border-emerald-200"
                                            />
                                            <div className="text-[12.5px] text-stone-700 leading-relaxed">
                                                <span className="font-bold text-[11px] text-emerald-700 uppercase tracking-wider block mb-0.5">{addr.addressName || addr.saveAs}</span>
                                                {addr.addressLine1 || addr.houseNo}, {addr.addressLine2 || addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                            </div>
                                        </label>
                                    ))}
                                    <button
                                        onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                                        className="text-emerald-700 hover:text-emerald-800 text-xs font-bold pt-1 block cursor-pointer"
                                    >
                                        + Add New Address
                                    </button>
                                </div>
                            )}

                            {form.prasadAdded && (!user || showNewAddressForm) && (
                                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-stone-50">
                                        <span className="text-[12px] font-bold text-stone-800">Delivery Address Details</span>
                                        {user && addresses.length > 0 && (
                                            <button
                                                onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(addresses[0]._id); }}
                                                className="text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className={LABEL}>House/Flat No *</label>
                                        <input
                                            value={newAddress.houseNo}
                                            onChange={(e) => setNewAddress((a) => ({ ...a, houseNo: e.target.value }))}
                                            placeholder="e.g. 73a VIP Road"
                                            className={INPUT}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Area/Street *</label>
                                        <input
                                            value={newAddress.street}
                                            onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))}
                                            placeholder="e.g. Zirakpur"
                                            className={INPUT}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL}>City *</label>
                                            <input
                                                value={newAddress.city}
                                                onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                                                placeholder="e.g. Zirakpur"
                                                className={INPUT}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL}>State *</label>
                                            <input
                                                value={newAddress.state}
                                                onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                                                placeholder="e.g. Punjab"
                                                className={INPUT}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL}>Pincode *</label>
                                        <input
                                            value={newAddress.pincode}
                                            onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                                            placeholder="6-digit pincode"
                                            inputMode="numeric"
                                            className={INPUT}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center py-10 px-2"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-200"
                        >
                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </motion.div>
                        <h3 className="svb-serif font-bold text-stone-800 mt-5 text-2xl">
                            Booking Confirmed! 🙏
                        </h3>
                        <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                            Your <span className="font-semibold text-stone-700">{puja.poojaNameEng}</span> at <span className="font-semibold text-stone-700">{puja.templeName}</span> is booked for <span className="font-semibold text-stone-700">{puja.pujaDate}</span>. Our team will WhatsApp you the puja video with your name &amp; gotra shortly.
                        </p>
                        <p className="text-[13px] font-serif font-bold text-emerald-700 mt-3">ॐ नमः शिवाय</p>
                        <button onClick={() => navigate("/account?tab=pooja")} className="mt-6 w-full bg-emerald-700 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform cursor-pointer">
                            Done
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Sticky Footer */}
            {step !== "success" && (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-emerald-100 px-5 py-4">
                    {error && (
                        <p className="text-red-500 text-[12px] font-semibold mb-3 text-center">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-stone-400 font-semibold uppercase block">TOTAL TO PAY</span>
                            <span className="text-[20px] font-extrabold text-emerald-700">₹{totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 hover:from-emerald-800 hover:to-emerald-800 text-white font-bold text-[14px] px-8 py-3.5 rounded-full shadow-lg shadow-emerald-200/60 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                        >
                            {submitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                            ) : (
                                <>Book With Devotion <ChevronRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Route slug re-exported for convenience.
export { KASHI_MAHADEV_PUJA_SLUG };
