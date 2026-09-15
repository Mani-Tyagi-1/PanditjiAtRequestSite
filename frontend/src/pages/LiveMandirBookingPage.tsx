import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Plus, X, Star, User, Mail, Users, Calendar, Clock, Home, Building, Map, Mailbox, Info, ShieldCheck, Bell, Flower2, Gift } from "lucide-react";
import type { LiveMandirPuja } from "../components/booking/LiveMandirPujas/liveMandirData";
import AdminPujaPackages from "../components/booking/LiveMandirPujas/AdminPujaPackages";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { useAbandonedCart } from "../utils/useAbandonedCart";
import analytics, { type AnalyticsItem } from "../utils/analytics";
import { isValidPhone, toStoredPhone, useMoney } from "../utils/currency";
// import CountryPicker from "../components/checkout/CountryPicker";  // hidden — see the commented block below
import PhoneField from "../components/checkout/PhoneField";

// Puja handed over from LiveMandirPujaDetailPage via navigate(..., { state }).
// Carried in router state (not the URL) so a direct hit / refresh — which has no
// state — redirects back to the puja rather than rendering an empty form.
interface BookingState {
    puja: LiveMandirPuja;
    fromAdminBanner?: boolean;
    adminTheme?: {
        primary: string;
        dark: string;
        background: string;
        backgroundAlt: string;
        border: string;
    } | null;
    preselectedPackageId?: string;
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

function displayScheduledDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

import LiveMandirBookingPageRegular from "./LiveMandirBookingPageRegular";

const INPUT = "w-full bg-transparent px-3 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none";
const INPUT_WRAPPER = "flex border border-stone-200 rounded-lg overflow-hidden bg-white focus-within:border-[#6b0504] focus-within:ring-1 focus-within:ring-[#6b0504]/20 transition-all t-focus-within";
const ICON_CONTAINER = "px-3 bg-stone-50 border-r border-stone-200 flex items-center text-[#6b0504] shrink-0 t-text-dark";
const LABEL = "text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 block";

function AdminLiveMandirBookingPage() {
    // Where the devotee is paying from. `money` renders every price below in
    // their currency; `toInr` converts a list price into the INR this sale is
    // actually worth, which is what the booking records and the server bills.
    const { country, currency, isIndia, money, inr: toInr } = useMoney();
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const state = location.state as BookingState | null;
    const puja = state?.puja ?? null;
    const adminTheme = state?.fromAdminBanner ? state.adminTheme : null;

    const [step, setStep] = useState<Step>("details");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [form, setForm] = useState({
        name: "",
        gotra: "",
        phone: "",
        email: "",
        members: "",
        wish: "",
        familyMembers: [] as string[],
        prasadAdded: (state as any)?.preselectedPrasadAdded || false,
    });

    const [familyInput, setFamilyInput] = useState("");
    const [familyGotraInput, setFamilyGotraInput] = useState("");

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

    // We assume puja and puja.packages are available from state
    const packages = puja?.packages || [];
    const [selectedPackageId, setSelectedPackageId] = useState<string>(state?.preselectedPackageId || (packages.length > 0 ? packages[0].id : ""));
    const selectedPkg = packages.find(p => p.id === selectedPackageId) || packages[0];

    // Blessed prasad is couriered within India only — see `shipsPrasad`. Gated
    // on the DERIVED value so one guard turns the whole feature off: no bill
    // line, no delivery step, no courier instruction on the booking, and a
    // devotee who switched country cannot be left paying for a parcel that will
    // never be sent.
    const isPrasadIncluded = selectedPkg?.freePrasad || form.prasadAdded;
    const prasadAdded = isIndia && isPrasadIncluded;

    // Load saved addresses if logged in and Prasad is added
    useEffect(() => {
        if (user && prasadAdded) {
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
    }, [user, prasadAdded]);

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
    const basePrice = selectedPkg ? selectedPkg.price : (puja?.price || 0);
    const familyCost = form.familyMembers.length * 101;
    const prasadCost = (prasadAdded && !selectedPkg?.freePrasad) ? 501 : 0;
    const totalPrice = basePrice + familyCost + prasadCost;

    // GA4 line items for this seva. Add-ons are separate rows so the item total
    // reconciles with `totalPrice` — a single lump row would show the base
    // price against an inflated order value and read as a tracking bug.
    const liveMandirGa4Items = (): AnalyticsItem[] => [
        {
            id: String(puja?.id ?? "live_mandir_puja"),
            name: `${puja?.pujaName ?? "Live Mandir Puja"} - ${puja?.templeName ?? ""}`.trim(),
            price: basePrice,
            quantity: 1,
            category: "Live Mandir",
            brand: puja?.templeName,
        },
        ...(prasadCost > 0
            ? [{ id: `${puja?.id}__prasad`, name: "Prasad Box", price: 501, quantity: 1, category: "Add-on" }]
            : []),
        ...(familyCost > 0
            ? [{ id: `${puja?.id}__sankalp`, name: "Extra Sankalp Name", price: 101, quantity: form.familyMembers.length, category: "Add-on" }]
            : []),
    ];

    // Whatever delivery address the devotee has settled on so far — a selected
    // saved address, or the new-address form once they start typing into it.
    // Kept out of the abandoned-cart draft while it is still blank.
    const draftAddress = !prasadAdded
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
        phone: toStoredPhone(form.phone, country),
        name: form.name,
        gotra: form.gotra,
        wish: form.wish,
        pujaId: puja?.id,
        pujaSlug: slug,
        pujaName: puja?.pujaName,
        templeName: puja?.templeName,
        amount: toInr(totalPrice),
        familyMembers: form.familyMembers,
        address: draftAddress,
        userId: user?._id || (user as any)?.id,
        extra: { members: form.members, prasadAdded },
    }, String(puja?.id || slug || ""));

    if (!puja) return null;

    const addFamilyMember = () => {
        if (familyInput.trim()) {
            const val = familyGotraInput.trim() ? `${familyInput.trim()} (${familyGotraInput.trim()})` : familyInput.trim();
            setForm(f => ({
                ...f,
                familyMembers: [...f.familyMembers, val]
            }));
            setFamilyInput("");
            setFamilyGotraInput("");
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

        if (!isValidPhone(form.phone, country)) {
            setError(`Please enter a valid ${country.name} mobile number.`);
            return;
        }
        const phoneDigits = toStoredPhone(form.phone, country);

        if (!isIndia && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
            setError("Please enter a valid email — it's how we send your booking confirmation.");
            return;
        }

        let addressPayload: any = null;
        if (prasadAdded) {
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
            const bookingEndpoint = adminTheme ? "generalpooja-bookings" : "bookings";
            // 1. Create booking order via unified endpoint
            const res = await fetch(`${API_URL}/${bookingEndpoint}/create-pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encryptPayload({
                    isLiveMandir: true,
                    pujaSlug: puja.id,
                    packageName: `${puja.pujaName} - ${selectedPkg?.name || "Standard"}`,
                    templeName: puja.templeName,
                    bhaktName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    phone: phoneDigits,
                    emailId: form.email.trim(),
                    // Marked-up INR — the value of this sale, not the
                    // India list price. See utils/currency `inrEquivalent`.
                    amount: toInr(totalPrice),
                    currency,
                    dialCode: country.dial,
                    countryCode: country.iso2,
                    country: country.name,
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
                // Straight from the order the server just created — deriving
                // these again is the one place display and charge could drift.
                amount: orderData.amountMinor ?? toInr(totalPrice) * 100,
                currency: orderData.currency ?? "INR",
                name: "Pandit Ji At Request",
                description: `${puja.pujaName} — ${puja.templeName}`,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: form.name.trim(),
                    contact: phoneDigits,
                    email: form.email.trim() || `user${phoneDigits}@panditjiatrequest.com`,
                },
                theme: { color: "#FF7000" },
                handler: async (response: any) => {
                    try {
                        setSubmitting(true);
                        // 3. Verify payment signature
                        const verifyRes = await fetch(`${API_URL}/${bookingEndpoint}/complete-booking`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(encryptPayload({
                                pendingBookingId: orderData.bookingId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                amountPaid: toInr(totalPrice),
                            })),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

                        // Auto-login user if returned
                        if (verifyData.token && verifyData.user) {
                            login(verifyData.token, verifyData.user);
                        }

                        analytics.purchase({
                            transactionId: response.razorpay_order_id,
                            items: liveMandirGa4Items(),
                            value: totalPrice,
                            currency: "INR",
                            meta: {
                                // Website live-mandir bookings settle through the unified pooja
                                // /bookings/complete-booking endpoint, whose server CAPI emits
                                // `puja_purchase_<orderID>`. eventID must match that for dedup.
                                event: "Purchase",
                                eventId: `puja_purchase_${response.razorpay_order_id}`,
                                params: {
                                    content_name: `${puja.pujaName} - ${puja.templeName}`,
                                    content_ids: [puja.id],
                                    content_type: "live_mandir_puja",
                                    value: totalPrice,
                                    currency: "INR",
                                },
                            },
                        });
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

            analytics.beginCheckout({
                items: liveMandirGa4Items(),
                value: totalPrice,
                currency: "INR",
                meta: {
                    event: "InitiateCheckout",
                    params: {
                        content_name: `${puja.pujaName} - ${puja.templeName}`,
                        content_ids: [puja.id],
                        content_type: "live_mandir_puja",
                        value: totalPrice,
                        currency: "INR",
                    },
                },
            });
            analytics.addPaymentInfo({ items: liveMandirGa4Items(), value: totalPrice, currency: "INR" });

            // Lets the Razorpay webhook attribute the purchase to this visitor
            // even if the tab is gone before payment settles.
            analytics.stashOrderAttribution(orderData.razorpayOrderId);

            rzp.open();
        } catch (err: any) {
            console.error("[LiveMandirBooking] Pay & Book failed:", err);
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div
            className={`lmb-page min-h-screen ${adminTheme ? '' : 'bg-[#FFFAF3]'} w-full max-w-md mx-auto border-x ${adminTheme ? '' : 'border-orange-100'} relative pb-28`}
            style={adminTheme ? {
                backgroundColor: adminTheme.background,
                backgroundImage: `linear-gradient(145deg, ${adminTheme.background}, ${adminTheme.backgroundAlt}, ${adminTheme.background})`,
                borderColor: adminTheme.border,
                '--theme-primary': adminTheme.primary,
                '--theme-dark': adminTheme.dark,
                '--theme-bg': adminTheme.background,
                '--theme-bg-alt': adminTheme.backgroundAlt,
                '--theme-border': adminTheme.border,
            } as React.CSSProperties : undefined}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .lmb-page { font-family: 'DM Sans', sans-serif; }
                .lmb-serif { font-family: 'Cormorant Garamond', serif; }
                ${adminTheme ? `
                .t-text { color: var(--theme-primary) !important; }
                .t-text-dark { color: var(--theme-dark) !important; }
                .t-bg { background-color: var(--theme-bg) !important; }
                .t-bg-alt { background-color: var(--theme-bg-alt) !important; }
                .t-border { border-color: var(--theme-border) !important; }
                .t-border-active { border-color: var(--theme-primary) !important; }
                .t-border-light { border-color: color-mix(in srgb, var(--theme-primary) 25%, transparent) !important; }
                .t-ring { --tw-ring-color: var(--theme-primary) !important; }
                .t-gradient { background-image: linear-gradient(100deg, var(--theme-dark), var(--theme-primary)) !important; }
                .t-focus-within:focus-within { border-color: var(--theme-dark) !important; --tw-ring-color: color-mix(in srgb, var(--theme-dark) 20%, transparent) !important; }
                ` : ''}
            `}</style>
            <Helmet>
                <title>{`Complete your booking — ${puja.pujaName} at ${puja.templeName} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header Top */}
            <div className="px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-stone-200 shadow-sm active:scale-90 transition-transform shrink-0"
                >
                    <ArrowLeft className="w-5 h-5 text-stone-700" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-[17px] font-bold text-stone-900 leading-tight truncate">Complete Your Mandir Puja</h1>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 t-text shrink-0" />
                        <span className="truncate">{puja.templeName}{puja.templeLocation && puja.templeLocation !== puja.templeName ? ` · ${puja.templeLocation}` : ""}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 space-y-4 pt-1 relative z-20">
                {step === "details" ? (
                    <div className="space-y-4">
                        {/* Order summary — reflects the chosen package + extras */}
                        <div className={`bg-white border rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,.07)] relative ${adminTheme ? 't-border' : 'border-stone-200'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 pr-2">
                                    <h2 className={`text-[15px] font-bold leading-snug ${adminTheme ? 't-text-dark' : 'text-stone-900'}`}>{puja.pujaName}</h2>
                                    <p className={`text-[12px] font-medium mt-1 ${adminTheme ? 't-text' : 'text-[#4C3F91]'}`}>{selectedPkg.name} package</p>
                                </div>
                                <span className={`flex items-center gap-1 shrink-0 border rounded-full px-2 py-0.5 text-[11px] font-bold ${adminTheme ? 't-bg-alt t-border-light t-text-dark' : 'bg-orange-50 border-orange-100 text-[#4C3F91]'}`}>
                                    ★ 4.6
                                </span>
                            </div>

                            <div className={`mt-3 pt-3 border-t space-y-2.5 ${adminTheme ? 't-border-light' : 'border-stone-100'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] text-stone-600 font-medium">{selectedPkg.name}</span>
                                    <span className={`text-[14px] font-bold ${adminTheme ? 't-text-dark' : 'text-stone-900'}`}>{money(basePrice)}</span>
                                </div>

                                {/* Offerings made in your name — shown as "Included" */}
                                {selectedPkg.images && selectedPkg.images.length > 0 && (
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[12.5px] text-stone-600 font-medium flex items-start gap-2 min-w-0">
                                            <Flower2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span className="leading-snug">Offerings in your name</span>
                                        </span>
                                        <span className="text-[12px] font-bold text-emerald-600 shrink-0">Included</span>
                                    </div>
                                )}

                                {/* Prasad box summary */}
                                {puja.prasadBoxEnabled && (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[12.5px] text-stone-600 font-medium flex items-center gap-2 min-w-0">
                                            <Gift className={`w-4 h-4 shrink-0 ${adminTheme ? 't-text' : 'text-amber-500'}`} />
                                            <span className="truncate">Prasad Box</span>
                                        </span>
                                        {selectedPkg.freePrasad ? (
                                            <span className="text-[12px] font-bold text-emerald-600 shrink-0">Free</span>
                                        ) : prasadCost > 0 ? (
                                            <span className={`text-[14px] font-bold shrink-0 ${adminTheme ? 't-text-dark' : 'text-stone-900'}`}>+{money(prasadCost)}</span>
                                        ) : (
                                            <span className="text-[12px] font-semibold text-stone-400 shrink-0">Not added</span>
                                        )}
                                    </div>
                                )}

                                {familyCost > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-stone-600 font-medium flex items-center gap-2">
                                            <Users className={`w-4 h-4 ${adminTheme ? 't-text' : 'text-orange-500'}`} />
                                            Extra Sankalp × {form.familyMembers.length}
                                        </span>
                                        <span className={`text-[14px] font-bold ${adminTheme ? 't-text-dark' : 'text-stone-900'}`}>+{money(familyCost)}</span>
                                    </div>
                                )}

                                <div className={`flex items-baseline justify-between pt-3 border-t ${adminTheme ? 't-border-light' : 'border-stone-100'}`}>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">TOTAL</span>
                                    <span className={`text-[22px] font-extrabold ${adminTheme ? 't-text-dark' : 'text-[#4C3F91]'}`}>{money(totalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Devotee Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50 t-border">
                                <span className="w-7 h-7 rounded-full bg-[#6b0504] text-white t-bg-alt t-text-dark flex items-center justify-center font-bold text-sm" style={adminTheme ? { backgroundColor: adminTheme.dark } : undefined}>01</span>
                                <div>
                                    <h3 className="font-bold text-[#6b0504] t-text-dark text-[14px]">Devotee Details</h3>
                                    <p className="text-[11px] text-stone-400">For the main Sankalp</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {/* Mobile Number input */}
                                <div>
                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">MOBILE NUMBER *</label>
                                    <PhoneField
                                        country={country}
                                        value={form.phone}
                                        onChange={(phone) => setForm((f) => ({ ...f, phone }))}
                                        inputClass="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within pl-14"
                                        prefixClass="text-orange-500 t-text font-bold text-[13px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">DEVOTEE'S NAME *</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Devotee's Name"
                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">GOTRA</label>
                                    <input
                                        value={form.gotra}
                                        onChange={(e) => setForm(f => ({ ...f, gotra: e.target.value }))}
                                        placeholder="e.g. Kashyap"
                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Family Sankalp */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50 t-border">
                                <span className="w-7 h-7 rounded-full bg-[#6b0504] text-white t-bg-alt t-text-dark flex items-center justify-center font-bold text-sm" style={adminTheme ? { backgroundColor: adminTheme.dark } : undefined}>02</span>
                                <div>
                                    <h3 className="font-bold text-[#6b0504] t-text-dark text-[14px]">Family Sankalp</h3>
                                    <p className="text-[11px] text-stone-400">Add members at {money(101)} each</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className={`${INPUT_WRAPPER}`}>
                                    <div className={ICON_CONTAINER}><Users className="w-4 h-4" /></div>
                                    <input
                                        value={familyInput}
                                        onChange={(e) => setFamilyInput(e.target.value)}
                                        placeholder="Name"
                                        className={INPUT}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFamilyMember(); } }}
                                    />
                                </div>
                                <div className={`${INPUT_WRAPPER}`}>
                                    <div className={ICON_CONTAINER}><span className="text-lg font-bold leading-none mb-1">ॐ</span></div>
                                    <input
                                        value={familyGotraInput}
                                        onChange={(e) => setFamilyGotraInput(e.target.value)}
                                        placeholder="Gotra"
                                        className={INPUT}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFamilyMember(); } }}
                                    />
                                </div>
                                <button
                                    onClick={addFamilyMember}
                                    className={`w-full py-2.5 mt-1 rounded-lg bg-[#6b0504] hover:bg-[#8a0b09] t-gradient text-white flex items-center justify-center font-bold text-[13px] transition-all cursor-pointer shadow-sm`}
                                    style={adminTheme ? { backgroundImage: `linear-gradient(100deg, ${adminTheme.dark}, ${adminTheme.primary})` } : undefined}
                                >
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Family Member
                                </button>
                            </div>

                            {/* Render Family List */}
                            {form.familyMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {form.familyMembers.map((m, idx) => (
                                        <span key={idx} className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-850 t-bg-alt t-border t-text-dark text-xs px-3 py-1.5 rounded-full">
                                            {m}
                                            <button onClick={() => removeFamilyMember(idx)} className="text-orange-400 t-text hover:opacity-75 transition-opacity">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Prasad Delivery Address */}
                        {prasadAdded && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100/50 t-border">
                                    <span className="w-7 h-7 rounded-full bg-[#6b0504] text-white t-bg-alt t-text-dark flex items-center justify-center font-bold text-sm" style={adminTheme ? { backgroundColor: adminTheme.dark } : undefined}>03</span>
                                    <div>
                                        <h3 className="font-bold text-[#6b0504] t-text-dark text-[14px]">Delivery Address</h3>
                                        <p className="text-[11px] text-stone-400">Where should we deliver the Sacred Prasad?</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    {user && addresses.length > 0 && !showNewAddressForm && (
                                        <div className="space-y-2">
                                            <p className={LABEL}>Select Delivery Address</p>
                                            {addresses.map(addr => (
                                                <label
                                                    key={addr._id}
                                                    className={`flex items-start gap-3 bg-white border rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-orange-500 t-border-active bg-orange-50/20" : "border-stone-100"}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="addressSelect"
                                                        checked={selectedAddressId === addr._id}
                                                        onChange={() => setSelectedAddressId(addr._id)}
                                                        className="mt-1 text-orange-500 t-text focus:ring-orange-400 t-ring border-orange-200 t-border"
                                                    />
                                                    <div className="text-[12.5px] text-stone-700 leading-relaxed">
                                                        <span className="font-bold text-[11px] text-orange-600 t-text-dark uppercase tracking-wider block mb-0.5">{addr.addressName || addr.saveAs}</span>
                                                        {addr.addressLine1 || addr.houseNo}, {addr.addressLine2 || addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                    </div>
                                                </label>
                                            ))}
                                            <button
                                                onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                                                className="text-orange-600 t-text-dark hover:opacity-80 text-xs font-bold pt-1 block cursor-pointer transition-opacity"
                                            >
                                                + Add New Address
                                            </button>
                                        </div>
                                    )}

                                    {/* Address Input fields */}
                                    {(!user || showNewAddressForm) && (
                                        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-stone-50">
                                                <span className="text-[13px] font-bold text-stone-900">Delivery Address Details</span>
                                                {user && addresses.length > 0 && (
                                                    <button
                                                        onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(addresses[0]._id); }}
                                                        className="text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">HOUSE/FLAT NO *</label>
                                                    <input
                                                        value={newAddress.houseNo}
                                                        onChange={(e) => setNewAddress(a => ({ ...a, houseNo: e.target.value }))}
                                                        placeholder="e.g. 73a VIP Road"
                                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">AREA/STREET *</label>
                                                    <input
                                                        value={newAddress.street}
                                                        onChange={(e) => setNewAddress(a => ({ ...a, street: e.target.value }))}
                                                        placeholder="e.g. Zirakpur"
                                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">CITY *</label>
                                                        <input
                                                            value={newAddress.city}
                                                            onChange={(e) => setNewAddress(a => ({ ...a, city: e.target.value }))}
                                                            placeholder="e.g. Zirakpur"
                                                            className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">STATE *</label>
                                                        <input
                                                            value={newAddress.state}
                                                            onChange={(e) => setNewAddress(a => ({ ...a, state: e.target.value }))}
                                                            placeholder="e.g. Punjab"
                                                            className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1.5 block">PINCODE *</label>
                                                    <input
                                                        value={newAddress.pincode}
                                                        onChange={(e) => setNewAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, "") }))}
                                                        placeholder="6-digit pincode"
                                                        inputMode="numeric"
                                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#6b0504] focus:ring-1 focus:ring-[#6b0504]/20 transition-all t-focus-within"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-[#FFFAF3] border-t border-[#F2E0C4] px-4 py-3 pb-4 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] rounded-t-3xl t-bg">
                    {/* Error is shown here */}
                    {error && (
                        <p className="text-red-500 text-[12px] font-semibold mb-2 text-center">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-stone-500 font-bold uppercase block tracking-wider">TOTAL TO PAY</span>
                            <span className={`text-[18px] font-extrabold ${adminTheme ? 't-text-dark' : 'text-[#6b0504]'}`}>{money(totalPrice)}</span>
                            <div className="text-[9px] text-stone-400 mt-0.5 flex items-center gap-1 font-medium">Incl. all charges <Info className="w-2.5 h-2.5" /></div>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className={`flex items-center gap-2 ${adminTheme ? 't-gradient text-white' : 'bg-[#6b0504] hover:bg-[#8a0b09] text-white'} font-bold text-[13px] px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer`}
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

export default function LiveMandirBookingPage() {
    const location = useLocation();
    const state = location.state as BookingState | null;
    const adminTheme = state?.fromAdminBanner ? state.adminTheme : null;

    if (adminTheme) {
        return <AdminLiveMandirBookingPage />;
    } else {
        return <LiveMandirBookingPageRegular />;
    }
}
