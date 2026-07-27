import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Plus, X, Star } from "lucide-react";
import type { LiveMandirPuja } from "../components/booking/LiveMandirPujas/liveMandirData";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { useAbandonedCart } from "../utils/useAbandonedCart";

// Puja handed over from LiveMandirPujaDetailPage via navigate(..., { state }).
// Carried in router state (not the URL) so a direct hit / refresh — which has no
// state — redirects back to the puja rather than rendering an empty form.
interface BookingState {
    puja: LiveMandirPuja;
}

type Step = "details" | "success";

// Live Mandir pujas carry a human date label ("Today", "Tomorrow", "Mon, 16 Jun").
// Resolve it to an ISO timestamp for the booking record; fall back to today.
function resolveScheduledDate(label: string): string {
    const today = new Date();
    const norm = (label || "").trim().toLowerCase();
    if (norm === "today") return today.toISOString();
    if (norm === "tomorrow") return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const parsed = new Date(label);
    return isNaN(parsed.getTime()) ? today.toISOString() : parsed.toISOString();
}

const INPUT =
    "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all";
const LABEL = "text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block";

export default function LiveMandirBookingPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const state = location.state as BookingState | null;
    const puja = state?.puja ?? null;

    const [step, setStep] = useState<Step>("details");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [form, setForm] = useState({
        name: "",
        gotra: "",
        phone: "",
        members: "",
        wish: "",
        familyMembers: [] as string[],
        prasadAdded: false,
    });

    const [familyInput, setFamilyInput] = useState("");

    // Address states
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        houseNo: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        saveAs: "Home"
    });

    // No router state (direct URL / refresh) → bounce back to the puja.
    useEffect(() => {
        if (!puja) navigate(slug ? `/live-mandir-puja/${slug}` : "/", { replace: true });
    }, [puja, slug, navigate]);

    // Prefill from the logged-in user once it resolves.
    useEffect(() => {
        setForm((f) => ({
            ...f,
            name: user?.name || user?.fullName || f.name,
            gotra: user?.gotra || f.gotra,
            phone: user?.phone || f.phone,
        }));
    }, [user]);

    // Load saved addresses if logged in and Prasad is added
    useEffect(() => {
        if (user && form.prasadAdded) {
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
        }
    }, [user, form.prasadAdded]);

    // Load Razorpay script
    useEffect(() => {
        const SRC = "https://checkout.razorpay.com/v1/checkout.js";
        if (document.querySelector(`script[src="${SRC}"]`)) return;
        const script = document.createElement("script");
        script.src = SRC;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Dynamic pricing — computed above the `!puja` guard so the abandoned-cart
    // draft below (a hook, so it must run before any early return) can carry the
    // running total.
    const basePrice = puja?.price ?? 0;
    const familyCost = form.familyMembers.length * 101;
    const prasadCost = form.prasadAdded ? 501 : 0;
    const totalPrice = basePrice + familyCost + prasadCost;

    // Whatever delivery address the devotee has settled on so far — a selected
    // saved address, or the new-address form once they start typing into it.
    // Kept out of the abandoned-cart draft while it is still blank.
    const draftAddress = !form.prasadAdded
        ? null
        : selectedAddressId
            ? addresses.find((a) => (a._id || a.id) === selectedAddressId) || null
            : [newAddress.houseNo, newAddress.street, newAddress.city, newAddress.state, newAddress.pincode].some((v) => v.trim())
                ? newAddress
                : null;

    // Abandoned-cart capture: the row is created as soon as the 10-digit mobile
    // number is typed, then patched with every further detail, so a devotee who
    // drops off before paying is still reachable with full context.
    const { markCartConverted } = useAbandonedCart("live-mandir-booking", {
        phone: form.phone,
        name: form.name,
        gotra: form.gotra,
        wish: form.wish,
        pujaId: puja?.id,
        pujaSlug: slug,
        pujaName: puja?.pujaName,
        templeName: puja?.templeName,
        amount: totalPrice,
        familyMembers: form.familyMembers,
        address: draftAddress,
        userId: user?._id || (user as any)?.id,
        extra: { members: form.members, prasadAdded: form.prasadAdded },
    }, String(puja?.id || slug || ""));

    if (!puja) return null;

    const addFamilyMember = () => {
        if (familyInput.trim()) {
            setForm(f => ({
                ...f,
                familyMembers: [...f.familyMembers, familyInput.trim()]
            }));
            setFamilyInput("");
        }
    };

    const removeFamilyMember = (index: number) => {
        setForm(f => ({
            ...f,
            familyMembers: f.familyMembers.filter((_, i) => i !== index)
        }));
    };

    const handleConfirm = async () => {
        setError("");

        // Basic Validations
        if (!form.name.trim()) {
            setError("Please enter the devotee's name.");
            return;
        }

        const phoneDigits = form.phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        let addressPayload: any = null;
        if (form.prasadAdded) {
            if (user && !showNewAddressForm) {
                if (!selectedAddressId) {
                    setError("Please select a delivery address.");
                    return;
                }
                const selected = addresses.find(a => (a._id || a.id) === selectedAddressId);
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
                // Validate new address form
                if (!newAddress.houseNo.trim() || !newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
                    setError("Please fill out all address fields.");
                    return;
                }
                addressPayload = {
                    addressLine1: newAddress.houseNo.trim(),
                    addressLine2: newAddress.street.trim(),
                    city: newAddress.city.trim(),
                    state: newAddress.state.trim(),
                    pincode: newAddress.pincode.trim(),
                    addressName: newAddress.saveAs.trim(),
                };
            }
        }

        setSubmitting(true);

        try {
            // 1. Create booking order via unified endpoint
            const res = await fetch(`${API_URL}/bookings/create-pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encryptPayload({
                    isLiveMandir: true,
                    pujaSlug: puja.id,
                    packageName: puja.pujaName,
                    templeName: puja.templeName,
                    bhaktName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    phone: phoneDigits,
                    amount: totalPrice,
                    poojaMode: "online",
                    bookingDate: resolveScheduledDate(puja.scheduledDate),
                    familyMembers: form.familyMembers,
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
            if (!RazorpayCtor) throw new Error("Payment SDK failed to load. Please check your connection and refresh.");

            // 2. Open Razorpay checkout widget
            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: totalPrice * 100,
                currency: "INR",
                name: "Pandit Ji At Request",
                description: `${puja.pujaName} — ${puja.templeName}`,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: form.name.trim(),
                    contact: phoneDigits,
                    email: `user${phoneDigits}@panditjiatrequest.com`,
                },
                theme: { color: "#FF7000" },
                handler: async (response: any) => {
                    try {
                        setSubmitting(true);
                        // 3. Verify payment signature
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

                        // Auto-login user if returned
                        if (verifyData.token && verifyData.user) {
                            login(verifyData.token, verifyData.user);
                        }

                        if ((window as any).fbq) {
                            // Website live-mandir bookings settle through the unified pooja
                            // /bookings/complete-booking endpoint, whose server CAPI emits
                            // `puja_purchase_<orderID>`. eventID must match that for dedup.
                            (window as any).fbq("track", "Purchase", {
                                content_name: `${puja.pujaName} - ${puja.templeName}`,
                                content_ids: [puja.id],
                                content_type: "live_mandir_puja",
                                value: totalPrice,
                                currency: "INR",
                            }, { eventID: `puja_purchase_${response.razorpay_order_id}` });
                        }
                        // Paid — drop this row out of the abandoned-lead list.
                        markCartConverted(orderData.bookingId);

                        setStep("success");
                        // Auto-redirect to Live Pooja Bookings after 2.5s
                        setTimeout(() => {
                            navigate("/account?tab=live");
                        }, 2500);
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

            if ((window as any).fbq) {
                (window as any).fbq("track", "InitiateCheckout", {
                    content_name: `${puja.pujaName} - ${puja.templeName}`,
                    content_ids: [puja.id],
                    content_type: "live_mandir_puja",
                    value: totalPrice,
                    currency: "INR",
                });
            }

            rzp.open();
        } catch (err: any) {
            console.error("[LiveMandirBooking] Pay & Book failed:", err);
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="lmb-page min-h-screen bg-[#FFFAF3] w-full max-w-md mx-auto border-x border-orange-100 relative pb-28">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .lmb-page { font-family: 'DM Sans', sans-serif; }
                .lmb-serif { font-family: 'Cormorant Garamond', serif; }
            `}</style>
            <Helmet>
                <title>{`Complete your booking — ${puja.pujaName} at ${puja.templeName} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#FFFAF3]/95 backdrop-blur-md border-b border-orange-100 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-200/50 shadow-sm active:scale-90 transition-transform shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 text-stone-700" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-bold text-stone-800 leading-tight truncate">Complete Your Mandir Puja</h1>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="truncate">{puja.templeName}{puja.templeLocation ? ` · ${puja.templeLocation}` : ""}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 pt-4 space-y-6">
                {step === "details" ? (
                    <div className="space-y-6">
                        {/* Base Puja price info */}
                        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[13.5px] font-bold text-stone-800 leading-snug">{puja.pujaName}</p>
                                <span className="flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-[11px] font-bold">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    4.5
                                </span>
                            </div>
                            {puja.pujaNameHindi && <p className="text-[11.5px] text-orange-500 font-medium mt-0.5">{puja.pujaNameHindi}</p>}
                            <div className="flex items-baseline gap-2 mt-2.5 pt-2.5 border-t border-orange-100/60">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Base Seva</span>
                                <span className="text-xl font-bold text-stone-900">₹{basePrice.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        {/* Step 1: Devotee Details */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50">
                                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">01</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-[14px]">Devotee Details</h3>
                                    <p className="text-[11px] text-stone-400">For the main Sankalp</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {/* Mobile Number input (required if user not logged in or edit allowed) */}
                                <div>
                                    <label className={LABEL}>Mobile Number *</label>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                                        placeholder="10-digit number for live link & updates"
                                        inputMode="numeric"
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Devotee's Name *</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Name for main Sankalp"
                                        className={INPUT}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Gotra</label>
                                    <input
                                        value={form.gotra}
                                        onChange={(e) => setForm(f => ({ ...f, gotra: e.target.value }))}
                                        placeholder="e.g. Kashyap"
                                        className={INPUT}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Family Sankalp */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50">
                                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">02</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-[14px]">Family Sankalp</h3>
                                    <p className="text-[11px] text-stone-400">Add members at ₹101 each</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={familyInput}
                                    onChange={(e) => setFamilyInput(e.target.value)}
                                    placeholder="Family member's name"
                                    className={INPUT}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFamilyMember(); } }}
                                />
                                <button
                                    onClick={addFamilyMember}
                                    className="w-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Render Family List */}
                            {form.familyMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {form.familyMembers.map((m, idx) => (
                                        <span key={idx} className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-850 text-xs px-3 py-1.5 rounded-full">
                                            {m}
                                            <button onClick={() => removeFamilyMember(idx)} className="text-orange-400 hover:text-orange-600 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Puja Date */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50">
                                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">03</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-[14px]">Puja Date</h3>
                                    <p className="text-[11px] text-stone-400">Scheduled date for this puja</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                                <span className="text-sm font-semibold text-stone-800">{puja.scheduledDate}</span>
                                <span className="text-[12px] text-stone-500">{puja.scheduledTime}</span>
                            </div>
                        </div>

                        {/* Step 4: Prasad Delivery */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50">
                                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">04</span>
                                <div>
                                    <h3 className="font-bold text-stone-800 text-[14px]">Prasad Delivery</h3>
                                    <p className="text-[11px] text-stone-400">Optional delivery at your address</p>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 bg-white border border-orange-100 rounded-2xl p-4 shadow-sm cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.prasadAdded}
                                    onChange={(e) => setForm(f => ({ ...f, prasadAdded: e.target.checked }))}
                                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 border-orange-200"
                                />
                                <div>
                                    <p className="text-xs font-bold text-stone-800">Add Sacred Prasad</p>
                                    <p className="text-[11px] text-stone-400 mt-0.5">Blessed at the Mandir · +₹501</p>
                                </div>
                            </label>

                            {/* Addresses List if Prasad checked */}
                            {form.prasadAdded && (
                                <div className="space-y-3 pt-2">
                                    {user && addresses.length > 0 && !showNewAddressForm && (
                                        <div className="space-y-2">
                                            <p className={LABEL}>Select Delivery Address</p>
                                            {addresses.map(addr => (
                                                <label
                                                    key={addr._id}
                                                    className={`flex items-start gap-3 bg-white border rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-orange-500 bg-orange-50/20" : "border-stone-100"}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="addressSelect"
                                                        checked={selectedAddressId === addr._id}
                                                        onChange={() => setSelectedAddressId(addr._id)}
                                                        className="mt-1 text-orange-500 focus:ring-orange-400 border-orange-200"
                                                    />
                                                    <div className="text-[12.5px] text-stone-700 leading-relaxed">
                                                        <span className="font-bold text-[11px] text-orange-600 uppercase tracking-wider block mb-0.5">{addr.addressName || addr.saveAs}</span>
                                                        {addr.addressLine1 || addr.houseNo}, {addr.addressLine2 || addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                    </div>
                                                </label>
                                            ))}
                                            <button
                                                onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                                                className="text-orange-600 hover:text-orange-700 text-xs font-bold pt-1 block cursor-pointer"
                                            >
                                                + Add New Address
                                            </button>
                                        </div>
                                    )}

                                    {/* Address Input fields */}
                                    {(!user || showNewAddressForm) && (
                                        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-3">
                                            <div className="flex items-center justify-between pb-1 border-b border-stone-50">
                                                <span className="text-[12px] font-bold text-stone-850">Delivery Address Details</span>
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
                                                    onChange={(e) => setNewAddress(a => ({ ...a, houseNo: e.target.value }))}
                                                    placeholder="e.g. 73a VIP Road"
                                                    className={INPUT}
                                                />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Area/Street *</label>
                                                <input
                                                    value={newAddress.street}
                                                    onChange={(e) => setNewAddress(a => ({ ...a, street: e.target.value }))}
                                                    placeholder="e.g. Zirakpur"
                                                    className={INPUT}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className={LABEL}>City *</label>
                                                    <input
                                                        value={newAddress.city}
                                                        onChange={(e) => setNewAddress(a => ({ ...a, city: e.target.value }))}
                                                        placeholder="e.g. Zirakpur"
                                                        className={INPUT}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={LABEL}>State *</label>
                                                    <input
                                                        value={newAddress.state}
                                                        onChange={(e) => setNewAddress(a => ({ ...a, state: e.target.value }))}
                                                        placeholder="e.g. Punjab"
                                                        className={INPUT}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Pincode *</label>
                                                <input
                                                    value={newAddress.pincode}
                                                    onChange={(e) => setNewAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, "") }))}
                                                    placeholder="6-digit pincode"
                                                    inputMode="numeric"
                                                    className={INPUT}
                                                />
                                            </div>
                                        </div>
                                    )}
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
                        <h3 className="lmb-serif font-bold text-stone-850 mt-5 text-2xl">
                            Booking Confirmed! 🙏
                        </h3>
                        <p className="text-[13px] text-stone-500 mt-2 max-w-[280px] leading-relaxed">
                            Your <span className="font-semibold text-stone-700">{puja.pujaName}</span> at{" "}
                            <span className="font-semibold text-stone-700">{puja.templeName}</span> is reserved. Our pandit ji will WhatsApp the live link &amp; details shortly.
                        </p>
                        <button onClick={() => navigate("/account?tab=live")} className="mt-6 w-full bg-stone-800 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform cursor-pointer">
                            Done
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Sticky Footer */}
            {step !== "success" && (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-stone-100 px-5 py-4">
                    {/* Error is shown here (always visible) so the user gets feedback
                        even when the form is not scrolled to the bottom. */}
                    {error && (
                        <p className="text-red-500 text-[12px] font-semibold mb-3 text-center">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-stone-400 font-semibold uppercase block">TOTAL TO PAY</span>
                            <span className="text-[20px] font-extrabold text-[#D85C0E]">₹{totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="flex items-center gap-1.5 bg-[#E05A10] hover:bg-[#C94D0C] text-white font-bold text-[14px] px-8 py-3.5 rounded-full shadow-lg shadow-orange-200/50 hover:shadow-orange-300/40 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                        >
                            {submitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                            ) : (
                                <>Offer With Devotion <ChevronRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
