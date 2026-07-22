import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Gift, Plus, X, Users, AlertCircle } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG, KASHI_MAHADEV_POOJA_ID, PRASAD_BOX_PRICE, FAMILY_MEMBER_PRICE } from "../data/kashiMahadevPuja";

type Step = "details" | "success";

const INPUT =
    "w-full bg-[#F0FAF7] border border-[#DDEBE6] rounded-xl px-4 py-3 text-sm text-[#17211D] placeholder-[#66736E] focus:outline-none focus:border-[#008C68] focus:ring-2 focus:ring-[#008C68]/20 transition-all";
const LABEL = "text-[11px] font-bold text-[#66736E] uppercase tracking-wide mb-1.5 block";

// Meta's browser pixel drops _fbp / _fbc; both are forwarded to the server so
// its CAPI Purchase can be matched and deduplicated against the browser event.
function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : "";
}

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
        // Extra people taken during the Sankalp alongside the main devotee.
        // Persisted on the booking as `familyMembers` (the live-mandir branch of
        // the controller already stores this field, and the schema types it as a
        // plain Array, so name+gotra objects are stored as-is).
        familyMembers: [] as { name: string; gotra: string }[],
    });

    // The not-yet-added row in the "add family member" box. Devotees routinely
    // type a name here and assume it counted, so this being uncommitted is
    // surfaced loudly in the UI and blocks checkout rather than being dropped.
    const [familyInput, setFamilyInput] = useState({ name: "", gotra: "" });
    const pendingFamilyName = familyInput.name.trim();

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

    const addFamilyMember = () => {
        const name = familyInput.name.trim();
        if (!name) return;
        // Same name twice would be charged twice and read oddly in the Sankalp.
        if (form.familyMembers.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
            setFamilyInput({ name: "", gotra: "" });
            return;
        }
        setForm((f) => ({
            ...f,
            familyMembers: [...f.familyMembers, { name, gotra: familyInput.gotra.trim() }],
        }));
        setFamilyInput({ name: "", gotra: "" });
    };

    const removeFamilyMember = (index: number) => {
        setForm((f) => ({ ...f, familyMembers: f.familyMembers.filter((_, i) => i !== index) }));
    };

    const basePrice = puja.poojaPriceOnline;
    const prasadCost = form.prasadAdded ? PRASAD_BOX_PRICE : 0;
    const familyCost = form.familyMembers.length * FAMILY_MEMBER_PRICE;
    const totalPrice = basePrice + prasadCost + familyCost;

    // Fires once the devotee has a usable name + phone in the form, on blur of
    // either field — same signal (and event name) BookingModal reports, so the
    // "started filling details" step exists for this puja too. `hasTrackedDetails`
    // is a ref, not state, so re-firing is impossible even before a re-render.
    const hasTrackedDetails = useRef(false);
    const trackCustomerDetails = () => {
        if (hasTrackedDetails.current) return;
        if (form.name.trim().length < 3 || form.phone.replace(/\D/g, "").length < 10) return;
        hasTrackedDetails.current = true;
        if ((window as any).fbq) {
            (window as any).fbq("track", "CustomerDetailsFilled", {
                content_name: puja.poojaNameEng,
                bhaktName: form.name.trim(),
                contactNumber: form.phone.replace(/\D/g, ""),
            });
        }
    };

    const handleConfirm = async () => {
        setError("");

        if (!form.name.trim()) {
            setError("Please enter the devotee's name.");
            return;
        }
        // A typed-but-not-added family member is the most common mistake on this
        // form: the devotee assumes typing the name was enough. Stop here and say
        // so, rather than silently dropping the name from the Sankalp, or adding
        // it and charging ₹101 more than the total they were just shown.
        if (pendingFamilyName) {
            setError(`Tap "Add" to include ${pendingFamilyName} in the Sankalp, or clear the name field.`);
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
                    // Resolve the catalog row by its stable `poojaID` string rather
                    // than a hardcoded Mongo _id, which differs between the dev and
                    // production clusters. The server falls back to
                    // `Pooja.findOne({ poojaID: pujaSlug })` when poojaId is absent.
                    // Requires the row seeded by
                    // server/src/scripts/seedKashiMahadevPuja.ts.
                    pujaSlug: KASHI_MAHADEV_POOJA_ID,
                    // Treat this as a temple (Live Mandir) puja, not a home puja.
                    // The server then:
                    //   • stores poojaType: "live_puja_at_mandir" so it groups
                    //     under Live Puja rather than the home-puja list,
                    //   • sends the Live Mandir WhatsApp copy, which credits the
                    //     temple priests instead of naming an assigned pandit,
                    //   • persists prasadAdded on the booking (that field is only
                    //     saved on the live-mandir branch of the controller).
                    isLiveMandir: true,
                    // REQUIRED whenever isLiveMandir is true: on that branch the
                    // controller takes the booking name from `packageName` and
                    // falls back to the raw `pujaSlug`, so omitting this would
                    // label every booking "RF_SAVAN_01".
                    packageName: puja.poojaNameEng,
                    templeName: puja.templeName,
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
                    // Stored on the booking by the isLiveMandir branch of
                    // create-pending, so the pandit knows every name to take
                    // during the Sankalp.
                    familyMembers: form.familyMembers,
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

            // AddToCart already fired on the detail-page CTA that led here, so
            // this step only reports InitiateCheckout — firing both here would
            // put two funnel steps on a single trigger.
            if ((window as any).fbq) {
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
                theme: { color: "#008C68" },
                handler: async (response: any) => {
                    try {
                        setSubmitting(true);
                        // 3) Verify payment → server creates the final booking and
                        //    sends the WhatsApp + email confirmation.
                        const verifyRes = await fetch(`${API_URL}/bookings/complete-booking`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                // Match-quality signals for the server-side CAPI
                                // Purchase that complete-booking fires. It reads
                                // exactly these three headers; without them the
                                // server event carries no fbp/fbc and Meta cannot
                                // attribute it back to the ad click.
                                "x-event-source-url": window.location.href,
                                "x-fbp": readCookie("_fbp"),
                                "x-fbc": readCookie("_fbc"),
                            },
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
                        // "live", not "pooja": this booking is created with
                        // isLiveMandir/poojaType=live_puja_at_mandir, and
                        // MyBookingsPage filters those OUT of the Puja tab into
                        // the Live Puja tab. Sending the devotee to ?tab=pooja
                        // shows them an empty list right after they paid.
                        setTimeout(() => navigate("/account?tab=live"), 2500);
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
        <div className="svb-page min-h-screen bg-[#FFFDF8] w-full max-w-md mx-auto border-x border-[#DDEBE6] relative pb-28">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .svb-page { font-family: 'DM Sans', sans-serif; }
                .svb-serif { font-family: 'Cormorant Garamond', serif; }
            `}</style>
            <Helmet>
                <title>{`Complete your booking — ${puja.poojaNameEng} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-[#DDEBE6] px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => (location.key !== "default" ? navigate(-1) : navigate(`/${KASHI_MAHADEV_PUJA_SLUG}`))}
                    aria-label="Go back"
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#DDEBE6] shadow-sm active:scale-90 transition-transform shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 text-[#17211D]" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-bold text-[#17211D] leading-tight truncate">Complete Your Savan Puja</h1>
                    <p className="text-[11px] text-[#66736E] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#086B50] shrink-0" />
                        <span className="truncate">{puja.templeName} · {puja.templeLocation}</span>
                    </p>
                </div>
            </div>

            {/* Savan occasion ribbon */}
            <div className="bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] text-center py-1.5 px-4">
                <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-white">
                    {puja.occasion} · {puja.pujaDate} · हर हर महादेव
                </p>
            </div>

            {/* Content */}
            <div className="px-5 pt-4 space-y-6">
                {step === "details" ? (
                    <div className="space-y-6">
                        {/* Order summary — itemises the prasad box when added */}
                        <div className="bg-white border border-[#DDEBE6] rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[13.5px] font-bold text-[#17211D] leading-snug">{puja.poojaNameEng}</p>
                                <span className="flex items-center gap-1 shrink-0 bg-[#C89B3C]/15 text-[#17211D] rounded-full px-2 py-0.5 text-[11px] font-bold">
                                    ★ {puja.rating}
                                </span>
                            </div>
                            {puja.poojaNameHindi && <p className="text-[11.5px] text-[#086B50] font-medium mt-0.5">{puja.poojaNameHindi}</p>}

                            {form.prasadAdded || form.familyMembers.length > 0 ? (
                                <div className="mt-2.5 pt-2.5 border-t border-[#DDEBE6] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#66736E] font-medium">Base Seva</span>
                                        <span className="text-[13px] font-bold text-[#17211D]">₹{basePrice.toLocaleString("en-IN")}</span>
                                    </div>
                                    {form.familyMembers.length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12.5px] text-[#66736E] font-medium flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-[#086B50]" />
                                                Family Sankalp × {form.familyMembers.length}
                                            </span>
                                            <span className="text-[13px] font-bold text-[#17211D]">+₹{familyCost.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    {form.prasadAdded && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12.5px] text-[#66736E] font-medium flex items-center gap-1.5">
                                                <Gift className="w-3.5 h-3.5 text-[#086B50]" />
                                                Sacred Prasad Box
                                            </span>
                                            <span className="text-[13px] font-bold text-[#17211D]">+₹{PRASAD_BOX_PRICE.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    <div className="flex items-baseline justify-between pt-2 border-t border-[#DDEBE6]">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#66736E]">Total</span>
                                        <span className="text-xl font-extrabold text-[#086B50]">₹{totalPrice.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-baseline gap-2 mt-2.5 pt-2.5 border-t border-[#DDEBE6]">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#66736E]">Base Seva</span>
                                    <span className="text-xl font-bold text-[#17211D]">₹{basePrice.toLocaleString("en-IN")}</span>
                                </div>
                            )}
                        </div>

                        {/* Step 1: Devotee Details */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DDEBE6]">
                                <span className="w-7 h-7 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center font-bold text-sm">01</span>
                                <div>
                                    <h3 className="font-bold text-[#17211D] text-[14px]">Devotee Details</h3>
                                    <p className="text-[11px] text-[#66736E]">For the main Sankalp</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className={LABEL}>Mobile Number *</label>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                                        onBlur={trackCustomerDetails}
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
                                        onBlur={trackCustomerDetails}
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

                        {/* Step 2: Family Sankalp (optional) — each name adds ₹101 */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DDEBE6]">
                                <span className="w-7 h-7 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center font-bold text-sm">02</span>
                                <div>
                                    <h3 className="font-bold text-[#17211D] text-[14px]">Family Sankalp</h3>
                                    <p className="text-[11px] text-[#66736E]">Optional · add members at ₹{FAMILY_MEMBER_PRICE} each</p>
                                </div>
                            </div>

                            {/* Name + gotra for the person being added. The row is
                                only committed by the Add button (or Enter), so it is
                                framed as a draft — amber border and an explicit
                                "not added yet" warning — until it is. */}
                            <div
                                className={`rounded-2xl border p-3 space-y-2.5 transition-colors ${
                                    pendingFamilyName ? "border-[#C89B3C] bg-[#C89B3C]/[0.07]" : "border-[#DDEBE6] bg-white"
                                }`}
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={LABEL}>Member's Name</label>
                                        <input
                                            value={familyInput.name}
                                            onChange={(e) => setFamilyInput((p) => ({ ...p, name: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFamilyMember(); } }}
                                            placeholder="Full name"
                                            className={INPUT}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Gotra</label>
                                        <input
                                            value={familyInput.gotra}
                                            onChange={(e) => setFamilyInput((p) => ({ ...p, gotra: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFamilyMember(); } }}
                                            placeholder="Optional"
                                            className={INPUT}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={addFamilyMember}
                                    disabled={!pendingFamilyName}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#086B50] hover:bg-[#065A43] disabled:bg-[#DDEBE6] disabled:text-[#66736E] text-white font-bold text-[13px] py-2.5 transition-colors active:scale-95 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    {pendingFamilyName ? `Add ${pendingFamilyName} · +₹${FAMILY_MEMBER_PRICE}` : "Add member"}
                                </button>

                                {/* The whole point of this block: make "typed but not
                                    added" impossible to mistake for "added". */}
                                {pendingFamilyName && (
                                    <p className="flex items-start gap-1.5 text-[11px] font-semibold text-[#8A6A1F] leading-snug">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                                        {pendingFamilyName} is not added yet — tap the Add button above to include them in the Sankalp.
                                    </p>
                                )}
                            </div>

                            {form.familyMembers.length > 0 && (
                                <div className="space-y-2 pt-0.5">
                                    {form.familyMembers.map((m, idx) => (
                                        <div
                                            key={`${m.name}-${idx}`}
                                            className="flex items-center gap-2 bg-[#DFF5EF] border border-[#DDEBE6] rounded-xl px-3 py-2"
                                        >
                                            <Check className="w-3.5 h-3.5 text-[#008C68] shrink-0" strokeWidth={3} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12.5px] font-bold text-[#17211D] truncate">{m.name}</p>
                                                <p className="text-[10.5px] text-[#66736E] truncate">
                                                    Gotra: {m.gotra || "Kashyap (default)"}
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#086B50] shrink-0">+₹{FAMILY_MEMBER_PRICE}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFamilyMember(idx)}
                                                aria-label={`Remove ${m.name}`}
                                                className="text-[#008C68] hover:text-[#065A43] transition-colors shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {form.familyMembers.length > 0 && (
                                <p className="flex items-center gap-1.5 text-[11px] text-[#66736E]">
                                    <Users className="w-3.5 h-3.5 text-[#086B50] shrink-0" />
                                    {form.familyMembers.length} member{form.familyMembers.length > 1 ? "s" : ""} added · +₹{familyCost.toLocaleString("en-IN")}
                                </p>
                            )}
                        </div>

                        {/* Step 3: Prasad Delivery (optional) */}
                        <div className="space-y-3 pb-6">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DDEBE6]">
                                <span className="w-7 h-7 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center font-bold text-sm">03</span>
                                <div>
                                    <h3 className="font-bold text-[#17211D] text-[14px]">Prasad Delivery</h3>
                                    <p className="text-[11px] text-[#66736E]">Optional delivery at your address</p>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 bg-white border border-[#DDEBE6] rounded-2xl p-4 shadow-sm cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.prasadAdded}
                                    onChange={(e) => setForm((f) => ({ ...f, prasadAdded: e.target.checked }))}
                                    className="w-4 h-4 rounded text-[#008C68] focus:ring-[#008C68] border-[#DDEBE6]"
                                />
                                <div>
                                    <p className="text-xs font-bold text-[#17211D]">Add Sacred Prasad</p>
                                    <p className="text-[11px] text-[#66736E] mt-0.5">Blessed at {puja.templeName} · +₹{PRASAD_BOX_PRICE}</p>
                                </div>
                            </label>

                            {form.prasadAdded && user && addresses.length > 0 && !showNewAddressForm && (
                                <div className="space-y-2">
                                    <p className={LABEL}>Select Delivery Address</p>
                                    {addresses.map((addr) => (
                                        <label
                                            key={addr._id}
                                            className={`flex items-start gap-3 bg-white border rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-[#008C68] bg-[#DFF5EF]/70" : "border-[#DDEBE6]"}`}
                                        >
                                            <input
                                                type="radio"
                                                name="addressSelect"
                                                checked={selectedAddressId === addr._id}
                                                onChange={() => setSelectedAddressId(addr._id)}
                                                className="mt-1 text-[#008C68] focus:ring-[#008C68] border-[#DDEBE6]"
                                            />
                                            <div className="text-[12.5px] text-[#17211D] leading-relaxed">
                                                <span className="font-bold text-[11px] text-[#086B50] uppercase tracking-wider block mb-0.5">{addr.addressName || addr.saveAs}</span>
                                                {addr.addressLine1 || addr.houseNo}, {addr.addressLine2 || addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                            </div>
                                        </label>
                                    ))}
                                    <button
                                        onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                                        className="text-[#086B50] hover:text-[#065A43] text-xs font-bold pt-1 block cursor-pointer"
                                    >
                                        + Add New Address
                                    </button>
                                </div>
                            )}

                            {form.prasadAdded && (!user || showNewAddressForm) && (
                                <div className="bg-white border border-[#DDEBE6] rounded-2xl p-4 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-[#DDEBE6]">
                                        <span className="text-[12px] font-bold text-[#17211D]">Delivery Address Details</span>
                                        {user && addresses.length > 0 && (
                                            <button
                                                onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(addresses[0]._id); }}
                                                className="text-[#66736E] hover:text-[#66736E] text-xs font-medium cursor-pointer"
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
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#008C68] to-[#086B50] flex items-center justify-center shadow-xl shadow-[#008C68]/25"
                        >
                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </motion.div>
                        <h3 className="svb-serif font-bold text-[#17211D] mt-5 text-2xl">
                            Booking Confirmed! 🙏
                        </h3>
                        <p className="text-[13px] text-[#66736E] mt-2 max-w-[280px] leading-relaxed">
                            Your <span className="font-semibold text-[#17211D]">{puja.poojaNameEng}</span> at <span className="font-semibold text-[#17211D]">{puja.templeName}</span> is booked for <span className="font-semibold text-[#17211D]">{puja.pujaDate}</span>. Our team will WhatsApp you the puja video with your name &amp; gotra shortly.
                        </p>
                        <p className="text-[13px] font-serif font-bold text-[#086B50] mt-3">ॐ नमः शिवाय</p>
                        <button onClick={() => navigate("/account?tab=live")} className="mt-6 w-full bg-[#086B50] text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform cursor-pointer">
                            Done
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Sticky Footer */}
            {step !== "success" && (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-[#DDEBE6] px-5 py-4">
                    {error && (
                        <p className="text-red-500 text-[12px] font-semibold mb-3 text-center">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-[#66736E] font-semibold uppercase block">TOTAL TO PAY</span>
                            <span className="text-[20px] font-extrabold text-[#086B50]">₹{totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] hover:from-[#065A43] hover:to-[#065A43] text-white font-bold text-[14px] px-8 py-3.5 rounded-full shadow-lg shadow-[#008C68]/20 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
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
