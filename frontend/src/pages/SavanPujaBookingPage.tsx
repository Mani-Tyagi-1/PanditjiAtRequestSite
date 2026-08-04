import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Gift, Plus, X, Users, AlertCircle, Sparkles, Droplets, ArrowUpRight } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { useAbandonedCart } from "../utils/useAbandonedCart";
import { optimizedImg } from "../utils/img";
import { useMoney, isValidPhone, shipsPrasad, toStoredPhone } from "../utils/currency";
import CountryPicker from "../components/checkout/CountryPicker";
import PhoneField from "../components/checkout/PhoneField";
import {
    kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG, KASHI_MAHADEV_POOJA_ID,
    PRASAD_BOX_PRICE, FAMILY_MEMBER_PRICE, RUDRAKSH_BRACELET_IMAGE,
    SAVAN_PACKAGES, DEFAULT_PACKAGE_ID, getPackage,
    extraFamilyCount, packageCore, packageOfferings, packagePrasadBox, packageTotal,
    packageNeedsDelivery, prasadBoxCost, prasadBoxContents, shippedPrasadBox,
    type SavanPackageId,
} from "../data/kashiMahadevPuja";
import { ItemTileRow } from "../components/savanPuja/ItemTiles";

type Step = "details" | "success";

const INPUT =
    "w-full bg-[#F0FAF7] border border-[#DDEBE6] rounded-xl px-4 py-3 text-sm text-[#17211D] placeholder-[#66736E] focus:outline-none focus:border-[#008C68] focus:ring-2 focus:ring-[#008C68]/20 transition-all";
const LABEL = "text-[11px] font-bold text-[#66736E] uppercase tracking-wide mb-1.5 block";

/**
 * Beat before the free-bracelet toast appears, and how long it stays.
 *
 * The delay is long enough that it lands after the devotee has settled into
 * the form rather than on top of the page they just opened, and the lifetime
 * is long enough to read the offer and reach for it on a phone.
 */
const PRASAD_NUDGE_DELAY_MS = 5000;
const PRASAD_NUDGE_VISIBLE_MS = 12000;

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

    // Where the devotee is paying from — detected on first render, no network
    // call. Every price below goes through `money()`, so switching country
    // re-prices the whole page (and re-shapes the phone + address fields) in a
    // single re-render. Prices themselves never leave INR; see utils/currency.
    const { country, currency, isIndia, money, inr: toInr } = useMoney();

    // Package chosen on the detail page (handed over as navigation state), or
    // the entry package when this page is opened directly. The `addPrasadBox` /
    // `prasadAdded` keys are the shapes earlier versions of the funnel sent;
    // still honoured so an old link or a stale tab can't lose the choice.
    const handover = location.state as
        | { packageId?: SavanPackageId; addPrasadBox?: boolean; prasadAdded?: boolean }
        | null;
    const [packageId, setPackageId] = useState<SavanPackageId>(handover?.packageId ?? DEFAULT_PACKAGE_ID);
    const selectedPkg = getPackage(packageId);

    /**
     * The prasad box — decided HERE, at every tier, and never pre-ticked.
     *
     * The top package makes the box free rather than automatic: a parcel still
     * has to be packed and couriered to an address, so a devotee who never asks
     * for one is not sent one and is never made to enter an address for it. That
     * is also why upgrading doesn't tick this on its own — the upgrade changes
     * what the box COSTS (₹298 → free), not whether it was wanted.
     */
    const [prasadOptedIn, setPrasadOptedIn] = useState(
        Boolean(handover?.addPrasadBox ?? handover?.prasadAdded),
    );

    /**
     * Blessed prasad is couriered within India only — see `shipsPrasad`.
     *
     * The gate is applied HERE, once, on the derived value rather than on the
     * checkbox: everything downstream (the bill line, the total, the delivery
     * step, the shipping label sent to the team) is computed from
     * `prasadBoxAdded`, so one guard turns the whole feature off cleanly and a
     * devotee who ticked the box in India and then switched country cannot be
     * left paying for a parcel that will never be sent.
     */
    const prasadShippable = shipsPrasad(country);
    const prasadBoxAdded = prasadShippable && prasadOptedIn;
    const shippedBox = shippedPrasadBox(selectedPkg, prasadBoxAdded);
    const needsDelivery = packageNeedsDelivery(selectedPkg, prasadBoxAdded);

    // The next tier up, for the one-tap upgrade strip under the summary.
    // Packages are ordered cheapest-first, so the first one priced above the
    // current package IS the next rung; undefined on the top tier.
    const nextPkg = SAVAN_PACKAGES.find((p) => p.price > selectedPkg.price);

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
        // Extra people taken during the Sankalp alongside the main devotee.
        // Persisted on the booking as `familyMembers` (the live-mandir branch of
        // the controller already stores this field, and the schema types it as a
        // plain Array, so name+gotra objects are stored as-is). The first
        // `selectedPkg.freeFamilyMembers` are free; each beyond that adds
        // FAMILY_MEMBER_PRICE to the total.
        familyMembers: [] as { name: string; gotra: string }[],
    });

    // The not-yet-added row in the "add family member" box. Devotees routinely
    // type a name here and assume it counted, so this being uncommitted is
    // surfaced loudly in the UI and blocks checkout rather than being dropped.
    const [familyInput, setFamilyInput] = useState({ name: "", gotra: "" });
    const pendingFamilyName = familyInput.name.trim();

    /**
     * Prasad nudge — the toast that surfaces the free Rudraksh bracelet a few
     * seconds in, for devotees who scrolled past the Step 3 checkbox.
     *
     * `nudgeDue` is only "the timer has elapsed"; whether it actually shows is
     * derived at render time. That split is deliberate — the delay timer runs
     * once on mount with no deps, so ticking the prasad box can never restart
     * it, and a devotee who adds the box before or during the toast makes it
     * disappear without any extra effect wiring.
     *
     * Dismissal is permanent for the visit (including the auto-hide): a repeat
     * toast over a checkout form is nagging, and the offer is still sitting in
     * Step 3 where the toast points.
     */
    const [nudgeDue, setNudgeDue] = useState(false);
    const [nudgeDismissed, setNudgeDismissed] = useState(false);
    const prasadSectionRef = useRef<HTMLDivElement | null>(null);
    // Shown on every tier, because on every tier the box is opt-in — on the top
    // one it is a free parcel the devotee is about to walk away from, which is
    // the single most worth-interrupting case on this page.
    const showPrasadNudge = prasadShippable && nudgeDue && !nudgeDismissed && !prasadBoxAdded && step === "details";

    useEffect(() => {
        const t = setTimeout(() => setNudgeDue(true), PRASAD_NUDGE_DELAY_MS);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!showPrasadNudge) return;
        const t = setTimeout(() => setNudgeDismissed(true), PRASAD_NUDGE_VISIBLE_MS);
        return () => clearTimeout(t);
    }, [showPrasadNudge]);

    // Taking the offer from the toast: tick the box, retire the toast, and put
    // the devotee at Step 3 so the delivery address it just made mandatory is
    // on screen rather than somewhere below the fold.
    const acceptPrasadNudge = () => {
        setPrasadOptedIn(true);
        setNudgeDismissed(true);
        if ((window as any).fbq) {
            (window as any).fbq("trackCustom", "PrasadNudgeAccepted", {
                content_name: puja.poojaNameEng,
                value: PRASAD_BOX_PRICE,
                currency: "INR",
            });
        }
        prasadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

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

    // Load saved addresses if logged in and a box actually ships.
    useEffect(() => {
        if (!user || !needsDelivery) return;
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
    }, [user, needsDelivery]);

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

    // Two things are billed on top of the package: family members beyond its
    // free allowance, and the prasad box (only on packages that don't already
    // include one free).
    const basePrice = selectedPkg.price;
    const chargedMembers = extraFamilyCount(selectedPkg, form.familyMembers.length);
    const familyCost = chargedMembers * FAMILY_MEMBER_PRICE;
    const prasadCost = prasadBoxCost(selectedPkg, prasadBoxAdded);
    const totalPrice = packageTotal(selectedPkg, form.familyMembers.length, prasadBoxAdded);

    // Everything poured over the Shivling at this tier, in the devotee's name.
    const offerings = packageOfferings(selectedPkg);

    // What must physically be couriered — appended to the booking name so the
    // WhatsApp/admin/pandit notifications spell out exactly what to pack. The
    // box name alone would be ambiguous between the two tiers, so the contents
    // ride along with it.
    const shipList = shippedBox ? prasadBoxContents(shippedBox.tier) : [];
    const boxLabel = shippedBox
        ? `${shippedBox.name}${selectedPkg.prasadBoxFree ? " (free)" : ` (paid add-on ${money(PRASAD_BOX_PRICE)})`}: ${shipList.join(", ")}`
        : "";
    // e.g. "Shree Mahakaleshwar Rudrabhishek Mahapuja — Rudri Path Mahaseva [Prasad Box + Shiv Chalisa (free): Dry Prasad…]"
    const packageLabel = `${puja.poojaNameEng} — ${selectedPkg.name}${boxLabel ? ` [${boxLabel}]` : ""}`;

    // Line-item breakdown reported to Meta alongside `value`. The package price
    // is the base line; extra Sankalp names (beyond the free allowance) and the
    // paid box are separate lines — without this, every order looks like one
    // anonymous unit in Events Manager and the higher value can't be reconciled
    // against the puja price. Ids mirror the ones the server CAPI Purchase sends
    // (built off the booking name) so the deduplicated pair reports identically
    // either way.
    const metaContents = () => [
        { id: packageLabel, quantity: 1, item_price: toInr(basePrice) },
        // Only the PAID box is a line item; a free one is part of the package
        // price and would double-count the order value here.
        ...(prasadCost > 0
            ? [{ id: `${puja.poojaNameEng} — Prasad Box`, quantity: 1, item_price: toInr(PRASAD_BOX_PRICE) }]
            : []),
        ...(chargedMembers > 0
            ? [{
                id: `${puja.poojaNameEng} — Extra Sankalp Name`,
                quantity: chargedMembers,
                item_price: toInr(FAMILY_MEMBER_PRICE),
            }]
            : []),
    ];

    // Whatever delivery address the devotee has settled on so far — a selected
    // saved address, or the new-address form once they start typing into it.
    // Kept out of the abandoned-cart draft while it is still blank.
    const draftAddress = !needsDelivery
        ? null
        : selectedAddressId
            ? addresses.find((a) => (a._id || a.id) === selectedAddressId) || null
            : [newAddress.houseNo, newAddress.street, newAddress.city, newAddress.state, newAddress.pincode].some((v) => v.trim())
                ? newAddress
                : null;

    // Abandoned-cart capture: the row is created as soon as the 10-digit mobile
    // number is typed, then patched with every further detail, so a devotee who
    // drops off before paying is still reachable with full context.
    const { markCartConverted } = useAbandonedCart("savan-puja-booking", {
        // Country code included, so a lead from abroad is a number the team can
        // actually dial back rather than a stranded national fragment.
        phone: toStoredPhone(form.phone, country),
        name: form.name,
        gotra: form.gotra,
        email: form.email,
        pujaId: puja._id,
        pujaSlug: KASHI_MAHADEV_POOJA_ID,
        pujaName: puja.poojaNameEng,
        templeName: puja.templeName,
        packageId: selectedPkg.id,
        packageName: packageLabel,
        amount: toInr(totalPrice),
        familyMembers: form.familyMembers,
        address: draftAddress,
        userId: user?._id || (user as any)?.id,
        extra: {
            time: form.time,
            prasadAdded: shippedBox !== null,
            prasadBox: shippedBox ? shippedBox.name : "none",
            prasadBoxPaid: prasadCost > 0,
            // `amount` above stays INR; these say where the lead was and what
            // they were being quoted, so a follow-up call opens with the right
            // number in the right currency.
            country: country.iso2,
            currency,
        },
    });

    // Fires once the devotee has a usable name + phone in the form, on blur of
    // either field — same signal (and event name) BookingModal reports, so the
    // "started filling details" step exists for this puja too. `hasTrackedDetails`
    // is a ref, not state, so re-firing is impossible even before a re-render.
    const hasTrackedDetails = useRef(false);
    const trackCustomerDetails = () => {
        if (hasTrackedDetails.current) return;
        if (form.name.trim().length < 3 || !isValidPhone(form.phone, country)) return;
        hasTrackedDetails.current = true;
        if ((window as any).fbq) {
            (window as any).fbq("track", "CustomerDetailsFilled", {
                content_name: puja.poojaNameEng,
                bhaktName: form.name.trim(),
                contactNumber: toStoredPhone(form.phone, country),
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

        // Length varies by country (10 in India, 8 in Singapore, 11 in Germany),
        // so the rule comes from the selected country rather than a fixed 10.
        if (!isValidPhone(form.phone, country)) {
            setError(`Please enter a valid ${country.name} mobile number.`);
            return;
        }
        // `phoneDigits` carries the country code for everyone outside India, so
        // the WhatsApp confirmation and any callback reach the right number.
        const phoneDigits = toStoredPhone(form.phone, country);

        if (!isIndia && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
            setError("Please enter a valid email for your booking confirmation.");
            return;
        }

        // Delivery address is only required when a box actually ships (bundled
        // free with the package, or the paid add-on opted into).
        let addressPayload: any = null;
        if (needsDelivery) {
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
                        country: selected.country || country.name,
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
                    // Stored on the booking so the courier desk can tell a
                    // Zirakpur parcel from a New Jersey one at a glance.
                    country: country.name,
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
                    // label every booking "RF_SAVAN_01". Carries the chosen
                    // package + what ships so the team knows what to courier.
                    packageName: packageLabel,
                    packageId: selectedPkg.id,
                    packageDetails: {
                        id: selectedPkg.id,
                        name: selectedPkg.name,
                        tagline: selectedPkg.tagline,
                        basePrice,
                        core: packageCore(selectedPkg),
                        offerings,
                        freeFamilyMembers: selectedPkg.freeFamilyMembers,
                        selectedFamilyMembers: form.familyMembers.length,
                        extraFamilyMembers: chargedMembers,
                        extraFamilyMemberPrice: FAMILY_MEMBER_PRICE,
                        prasadBox: shippedBox ? {
                            added: true,
                            free: selectedPkg.prasadBoxFree,
                            name: shippedBox.name,
                            contents: shipList,
                            price: prasadCost,
                        } : { added: false, free: false, price: 0 },
                        totalPrice,
                    },
                    templeName: puja.templeName,
                    poojaMode: "online",
                    bookingDate,
                    // ALWAYS the INR total. The server converts it into the
                    // devotee's currency itself and bills that — the browser
                    // never sends the amount to charge, only the currency to
                    // charge it in, so a tampered page can't change the price.
                    // The list price with the foreign multiplier applied —
                    // the INR this sale is actually worth. Sending `totalPrice`
                    // would record a 1x sale for a booking charged at 2x.
                    amount: toInr(totalPrice),
                    currency,
                    // Tells the server this is (or isn't) an Indian number, so
                    // it stores the country code instead of trimming to 10.
                    dialCode: country.dial,
                    // Stored on the booking so the team can see which market a
                    // sale came from without decoding a currency or a phone.
                    countryCode: country.iso2,
                    country: country.name,
                    panditDakshina: puja.panditDakshina,
                    bhaktName: form.name.trim(),
                    gotra: form.gotra.trim(),
                    contactNumber: phoneDigits,
                    phone: phoneDigits,
                    emailId: form.email.trim(),
                    // True whenever a box ships at all — bundled free with the
                    // package or added as the paid option.
                    prasadAdded: shippedBox !== null,
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
                const contents = metaContents();
                (window as any).fbq("track", "InitiateCheckout", {
                    content_name: puja.poojaNameEng,
                    content_ids: [puja._id],
                    content_type: "product",
                    contents,
                    num_items: contents.reduce((n, c) => n + c.quantity, 0),
                    value: toInr(totalPrice),
                    currency: "INR",
                });
            }

            // 2) Open Razorpay checkout.
            //    Amount and currency come straight from the order the server
            //    just created — Razorpay rejects a checkout whose amount or
            //    currency disagrees with its order, so re-deriving them here
            //    would be the one place the two could drift apart. The `??`
            //    fallbacks keep an older server build (which returned neither
            //    field) working on the plain INR path.
            const rzp = new RazorpayCtor({
                key: orderData.razorpayKeyId,
                amount: orderData.amountMinor ?? totalPrice * 100,
                currency: orderData.currency ?? "INR",
                name: "Pandit Ji At Request",
                description: puja.poojaNameEng,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: form.name.trim(),
                    // E.164 for international numbers — Razorpay expects the
                    // "+" form and will not prefill a bare digit string.
                    contact: isIndia ? phoneDigits : `+${phoneDigits}`,
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
                                amountPaid: toInr(totalPrice),
                            })),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

                        if (verifyData.token && verifyData.user) login(verifyData.token, verifyData.user);

                        if ((window as any).fbq) {
                            const contents = metaContents();
                            (window as any).fbq("track", "Purchase", {
                                content_name: puja.poojaNameEng,
                                content_ids: [puja._id],
                                content_type: "product",
                                contents,
                                num_items: contents.reduce((n, c) => n + c.quantity, 0),
                                value: toInr(totalPrice),
                                currency: "INR",
                            }, { eventID: `puja_purchase_${response.razorpay_order_id}` });
                        }

                        // Paid — drop this row out of the abandoned-lead list.
                        markCartConverted(orderData.bookingId);

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

            {/* Where the devotee is paying from. Shown before any price is read,
                because that is what the prices below are quoted in — a currency
                the devotee only discovers at the card screen is a cancelled
                payment. Detected automatically; this row is the correction. */}
            <div className="flex items-center justify-between gap-2 px-5 py-2 border-b border-[#DDEBE6] bg-[#F0FAF7]">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#66736E]">
                    Paying from
                </span>
                <CountryPicker
                    className="bg-white border border-[#DDEBE6] text-[#17211D] hover:border-[#008C68]"
                    accentClass="text-[#086B50]"
                />
            </div>

            {/* Content */}
            <div className="px-5 pt-4 space-y-6">
                {step === "details" ? (
                    <div className="space-y-6">
                        {/* Order summary — reflects the chosen package + extras */}
                        <div className="bg-white border border-[#DDEBE6] rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[13.5px] font-bold text-[#17211D] leading-snug">{puja.poojaNameEng}</p>
                                    <p className="text-[11px] text-[#086B50] font-semibold mt-0.5">{selectedPkg.name}</p>
                                </div>
                                <span className="flex items-center gap-1 shrink-0 bg-[#C89B3C]/15 text-[#17211D] rounded-full px-2 py-0.5 text-[11px] font-bold">
                                    ★ {puja.rating}
                                </span>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-[#DDEBE6] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12.5px] text-[#66736E] font-medium">{selectedPkg.name}</span>
                                    <span className="text-[13px] font-bold text-[#17211D]">{money(basePrice)}</span>
                                </div>

                                {/* Offerings made in your name — shown as "Included"
                                    so the value of the tier is visible on the bill. */}
                                {offerings.length > 0 && (
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[12px] text-[#66736E] font-medium flex items-start gap-1.5 min-w-0">
                                            <Droplets className="w-3.5 h-3.5 text-[#086B50] shrink-0 mt-0.5" />
                                            <span className="leading-snug">{offerings.join(", ")} offered in your name</span>
                                        </span>
                                        <span className="text-[11px] font-bold text-[#008C68] shrink-0">Included</span>
                                    </div>
                                )}

                                {selectedPkg.freeFamilyMembers > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#66736E] font-medium flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[#C89B3C]" />
                                            {selectedPkg.freeFamilyMembers} family Sankalp
                                        </span>
                                        <span className="text-[11px] font-bold text-[#008C68]">Free</span>
                                    </div>
                                )}

                                {chargedMembers > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#66736E] font-medium flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[#086B50]" />
                                            Extra Sankalp × {chargedMembers}
                                        </span>
                                        <span className="text-[13px] font-bold text-[#17211D]">+{money(familyCost)}</span>
                                    </div>
                                )}

                                {/* Prasad box — free with the tier, a priced line when
                                    it was opted into, and explicitly "Not added"
                                    otherwise so its absence is never a silent
                                    surprise at delivery time. Outside India there is
                                    no line at all: the parcel is not sold there, and
                                    a greyed-out row would only raise a question the
                                    bill cannot answer. */}
                                {prasadShippable && (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12.5px] text-[#66736E] font-medium flex items-center gap-1.5 min-w-0">
                                        <Gift className="w-3.5 h-3.5 text-[#086B50] shrink-0" />
                                        <span className="truncate">{packagePrasadBox(selectedPkg).name}</span>
                                    </span>
                                    {!prasadBoxAdded ? (
                                        // "Not added" even on the tier where it is free:
                                        // free still has to be asked for, and a bill
                                        // reading "Free" for a parcel nobody requested
                                        // is how a devotee ends up expecting one.
                                        <span className="text-[11px] font-semibold text-[#66736E] shrink-0">Not added</span>
                                    ) : selectedPkg.prasadBoxFree ? (
                                        <span className="text-[11px] font-bold text-[#008C68] shrink-0">Free</span>
                                    ) : (
                                        <span className="text-[13px] font-bold text-[#17211D] shrink-0">+{money(prasadCost)}</span>
                                    )}
                                </div>
                                )}

                                {/* The bracelet rides inside the box and adds nothing
                                    to the total — listed only when a box actually
                                    ships, so it is counted rather than merely promised. */}
                                {shippedBox && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#66736E] font-medium flex items-center gap-1.5">
                                            <Gift className="w-3.5 h-3.5 text-[#C89B3C]" />
                                            Rudraksh Bracelet
                                        </span>
                                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#C89B3C]">Free</span>
                                    </div>
                                )}

                                <div className="flex items-baseline justify-between pt-2 border-t border-[#DDEBE6]">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#66736E]">Total</span>
                                    <span className="text-xl font-extrabold text-[#086B50]">{money(totalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* One-tap upgrade to the NEXT tier only. A devotee who
                            deep-linked into this page (an ad straight to /booking)
                            never saw the package cards, so without this the higher
                            sevas would be unreachable from here. It pitches one rung,
                            never a ladder — re-offering all the way up mid-checkout
                            is badgering someone who has already decided to pay. */}
                        {nextPkg && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPackageId(nextPkg.id);
                                    if ((window as any).fbq) {
                                        (window as any).fbq("trackCustom", "PujaPackageUpgrade", {
                                            to: nextPkg.id,
                                            value: nextPkg.price,
                                            currency: "INR",
                                            source: "booking_summary",
                                        });
                                    }
                                }}
                                className="w-full text-left rounded-2xl border border-[#E8CF9A] bg-gradient-to-br from-[#FFF8E7] to-[#FFF3DC] px-3.5 py-3 shadow-sm active:scale-[0.99] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#C89B3C] shrink-0" />
                                    <p className="flex-1 min-w-0 text-[12.5px] font-bold text-[#17211D] leading-snug">
                                        Upgrade to {nextPkg.name}
                                    </p>
                                    <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-[#C89B3C] px-2 py-0.5 text-[11px] font-extrabold text-white">
                                        +{money(nextPkg.price - selectedPkg.price)}
                                        <ArrowUpRight className="w-3 h-3" />
                                    </span>
                                </div>
                                {/* What the upgrade actually buys, in the devotee's
                                    terms: the parcel first (it arrives at their door),
                                    then the extra Sankalps, then the new offerings. */}
                                <p className="mt-1 text-[11px] text-[#66736E] leading-snug">
                                    {[
                                        // Never pitched abroad — the upgrade's headline
                                        // perk there is the offerings, not a parcel that
                                        // cannot be couriered.
                                        prasadShippable && nextPkg.prasadBoxFree
                                            ? `Prasad box free instead of ${money(PRASAD_BOX_PRICE)}`
                                            : null,
                                        nextPkg.freeFamilyMembers > selectedPkg.freeFamilyMembers
                                            ? `${nextPkg.freeFamilyMembers - selectedPkg.freeFamilyMembers} more family Sankalp${nextPkg.freeFamilyMembers - selectedPkg.freeFamilyMembers > 1 ? "s" : ""} free`
                                            : null,
                                        nextPkg.addedOfferings.length > 0
                                            ? `${nextPkg.addedOfferings.join(", ")} offered in your name`
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </button>
                        )}

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
                                    <PhoneField
                                        country={country}
                                        value={form.phone}
                                        onChange={(phone) => setForm((f) => ({ ...f, phone }))}
                                        onBlur={trackCustomerDetails}
                                        inputClass={INPUT}
                                        prefixClass="text-[#086B50]"
                                    />
                                    <p className="text-[10.5px] text-[#66736E] mt-1">
                                        We WhatsApp your puja video and updates here.
                                    </p>
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
                                {/* Asked for only outside India, where it is the
                                    reliable channel: an overseas devotee may not
                                    use WhatsApp on this number, and the card
                                    receipt has to reach them somewhere. Adding it
                                    for everyone would put a new required field in
                                    front of the home market for no gain. */}
                                {!isIndia && (
                                    <div>
                                        <label className={LABEL}>Email *</label>
                                        <input
                                            value={form.email}
                                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                            placeholder="For your booking confirmation"
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            className={INPUT}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Family Sankalp — free up to the package
                            allowance, then ₹101 each */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DDEBE6]">
                                <span className="w-7 h-7 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center font-bold text-sm">02</span>
                                <div>
                                    <h3 className="font-bold text-[#17211D] text-[14px]">Family Sankalp</h3>
                                    <p className="text-[11px] text-[#66736E]">
                                        {selectedPkg.freeFamilyMembers > 0
                                            ? `${selectedPkg.freeFamilyMembers} free in ${selectedPkg.name} · ${money(FAMILY_MEMBER_PRICE)} each after`
                                            : `Optional · add members at ${money(FAMILY_MEMBER_PRICE)} each`}
                                    </p>
                                </div>
                            </div>

                            {/* Free-allowance meter — reassures the devotee how many
                                of the package's free Sankalps are still available. */}
                            {selectedPkg.freeFamilyMembers > 0 && (
                                <div className="flex items-center gap-1.5 bg-[#DFF5EF] border border-[#DDEBE6] rounded-xl px-3 py-2 text-[11.5px] font-semibold text-[#086B50]">
                                    <Sparkles className="w-3.5 h-3.5 text-[#008C68] shrink-0" />
                                    {selectedPkg.freeFamilyMembers - form.familyMembers.length > 0
                                        ? `${selectedPkg.freeFamilyMembers - form.familyMembers.length} free family Sankalp${selectedPkg.freeFamilyMembers - form.familyMembers.length > 1 ? "s" : ""} left in your package`
                                        : `Free members used — extra names add ${money(FAMILY_MEMBER_PRICE)} each`}
                                </div>
                            )}

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
                                    {pendingFamilyName
                                        ? `Add ${pendingFamilyName} · ${form.familyMembers.length < selectedPkg.freeFamilyMembers ? "FREE" : `+${money(FAMILY_MEMBER_PRICE)}`}`
                                        : "Add member"}
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
                                            {idx < selectedPkg.freeFamilyMembers ? (
                                                <span className="text-[11px] font-bold text-[#008C68] shrink-0">FREE</span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-[#086B50] shrink-0">+{money(FAMILY_MEMBER_PRICE)}</span>
                                            )}
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
                                    {form.familyMembers.length} member{form.familyMembers.length > 1 ? "s" : ""} added
                                    {chargedMembers > 0 ? ` · +${money(familyCost)}` : " · all free"}
                                </p>
                            )}
                        </div>

                        {/* Step 3: Prasad Box — the one place it is decided, on
                            every package. The top tier makes it free, not
                            automatic: unticked means nothing is couriered, and
                            no address is asked for.

                            Outside India the whole step is replaced by a single
                            line saying so. Said once, plainly, up front — a
                            devotee in Toronto who reads "prasad couriered home"
                            on the detail page must not have to wonder where the
                            option went, and must never be charged for it. */}
                        {!prasadShippable ? (
                            <div className="flex items-start gap-2.5 rounded-2xl border border-[#DDEBE6] bg-[#F0FAF7] px-3.5 py-3">
                                <Gift className="w-4 h-4 text-[#086B50] shrink-0 mt-px" />
                                <p className="text-[11.5px] text-[#66736E] leading-snug">
                                    <b className="text-[#17211D]">Prasad box ships within India only.</b>{" "}
                                    It is not part of your total, and no delivery address is
                                    needed. Your puja, Sankalp and video are unaffected —
                                    the recording reaches you on WhatsApp as usual.
                                </p>
                            </div>
                        ) : (
                        <div ref={prasadSectionRef} className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DDEBE6]">
                                <span className="w-7 h-7 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center font-bold text-sm">03</span>
                                <div>
                                    <h3 className="font-bold text-[#17211D] text-[14px]">Prasad Box</h3>
                                    <p className="text-[11px] text-[#66736E]">
                                        {selectedPkg.prasadBoxFree
                                            ? `FREE with ${selectedPkg.name} · add it to have it couriered`
                                            : `${money(PRASAD_BOX_PRICE)} · blessed prasad couriered to your home`}
                                    </p>
                                </div>
                            </div>

                            {/* The box carries the free Rudraksh bracelet, so the gift
                                is sold on this checkbox rather than mentioned once in
                                the summary — this is the moment the devotee decides.
                                The card turns gold when ticked so the choice reads as
                                claimed, not merely selected. */}
                            <label
                                className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm cursor-pointer select-none border transition-colors ${prasadBoxAdded
                                    ? "bg-gradient-to-br from-[#FFF8E7] to-[#FFF3DC] border-[#E8CF9A]"
                                    : "bg-white border-[#DDEBE6]"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={prasadBoxAdded}
                                    onChange={(e) => {
                                        setPrasadOptedIn(e.target.checked);
                                        if ((window as any).fbq) {
                                            (window as any).fbq("trackCustom", "PujaPrasadBoxToggle", {
                                                added: e.target.checked,
                                                package: selectedPkg.id,
                                                value: prasadBoxCost(selectedPkg, true),
                                                currency: "INR",
                                            });
                                        }
                                    }}
                                    className="w-4 h-4 shrink-0 rounded text-[#008C68] focus:ring-[#008C68] border-[#DDEBE6]"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#17211D]">Add {packagePrasadBox(selectedPkg).name}</p>
                                    <p className="text-[11px] text-[#66736E] mt-0.5">
                                        Blessed at {puja.templeName} ·{" "}
                                        {selectedPkg.prasadBoxFree ? (
                                            <b className="text-[#8A6A1F]">FREE with this seva</b>
                                        ) : (
                                            <>+{money(PRASAD_BOX_PRICE)}</>
                                        )}
                                    </p>
                                    <p className="text-[11px] font-bold text-[#8A6A1F] mt-1 leading-snug">
                                        {prasadBoxAdded
                                            ? "Free Rudraksh bracelet added 🎁"
                                            : "Includes a FREE Rudraksh bracelet"}
                                    </p>
                                </div>
                                {/* Drawn at 48px; 140px covers ~3x density. onError falls
                                    back to the origin URL — the convention `optimizedImg`
                                    documents — so a proxy hiccup can't blank the gift. */}
                                <span className="relative shrink-0">
                                    <img
                                        src={optimizedImg(RUDRAKSH_BRACELET_IMAGE, 140)}
                                        onError={(e) => { e.currentTarget.src = RUDRAKSH_BRACELET_IMAGE; }}
                                        alt="Free 5 Mukhi Rudraksh bracelet"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-12 h-12 rounded-xl object-cover border border-[#F0E2C2]"
                                    />
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#C89B3C] text-white text-[7.5px] font-extrabold uppercase tracking-wide px-1.5 py-[1px] rounded-full shadow-sm">
                                        Free
                                    </span>
                                </span>
                            </label>

                            {/* What is actually in the box, once it is added, so
                                the price is attached to objects rather than to
                                the word "prasad". */}
                            {prasadBoxAdded && (
                                <div className="rounded-2xl border border-[#DDEBE6] bg-white p-3 shadow-sm">
                                    <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-[#086B50] mb-1.5">
                                        <Gift className="w-3 h-3 text-[#C89B3C]" />
                                        In your {packagePrasadBox(selectedPkg).name}
                                    </p>
                                    <ItemTileRow
                                        items={shipList}
                                        tone={selectedPkg.prasadBoxFree ? "gold" : "emerald"}
                                        cols={4}
                                    />
                                </div>
                            )}
                        </div>
                        )}

                        {/* Step 4: Delivery Address — only once the box has been
                            added, free tier included. Without a box there is nothing
                            to courier, so this step is hidden and never blocks
                            checkout for someone who didn't want one. */}
                        {needsDelivery && (
                        <div className="space-y-3 pb-6">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#DDEBE6]">
                                <span className="w-7 h-7 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center font-bold text-sm">04</span>
                                <div>
                                    <h3 className="font-bold text-[#17211D] text-[14px]">Delivery Address</h3>
                                    <p className="text-[11px] text-[#66736E]">Where we courier your {shippedBox?.name}</p>
                                </div>
                            </div>

                            {user && addresses.length > 0 && !showNewAddressForm && (
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

                            {(!user || showNewAddressForm) && (
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
                                    {/* Digits-only, 6-max is an Indian pincode rule.
                                        A UK postcode has letters and a Canadian
                                        one has both — outside India the field
                                        takes the local format verbatim. */}
                                    <div>
                                        <label className={LABEL}>{country.postal} *</label>
                                        <input
                                            value={newAddress.pincode}
                                            onChange={(e) =>
                                                setNewAddress((a) => ({
                                                    ...a,
                                                    pincode: isIndia
                                                        ? e.target.value.replace(/\D/g, "").slice(0, 6)
                                                        : e.target.value.slice(0, 12),
                                                }))
                                            }
                                            placeholder={isIndia ? "6-digit pincode" : `Your ${country.postal.toLowerCase()}`}
                                            inputMode={isIndia ? "numeric" : "text"}
                                            className={INPUT}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Country</label>
                                        <input
                                            value={country.name}
                                            readOnly
                                            aria-describedby="savan-country-hint"
                                            className={`${INPUT} opacity-70 cursor-not-allowed`}
                                        />
                                        <p id="savan-country-hint" className="text-[10.5px] text-[#66736E] mt-1">
                                            Change it from “Paying from” at the top of this page.
                                        </p>
                                    </div>
                                </div>
                            )}
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

            {/* Free-bracelet nudge — drops in at the TOP, clear of both the
                form fields and the pay button, so it never sits between the
                devotee and the next thing they were about to tap.

                `top-[72px]` parks it below the sticky header (~62px) instead of
                over the back button and title — with enough clearance that the
                close button, which hangs 8px above the card, still lands clear
                of the header. Same max-w-md rail as the header, so the two
                line up as one stack on desktop.

                z-50 puts it over the header's z-40; nothing else on this page
                sits higher. It is dismissible and self-retiring — see the
                nudge state above for why it never returns once closed. */}
            {showPrasadNudge && (
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    role="status"
                    className="fixed top-[72px] left-0 right-0 z-50 max-w-md mx-auto px-4"
                >
                    <div className="relative flex items-center gap-3 rounded-2xl border border-[#E8CF9A] bg-gradient-to-br from-[#FFF8E7] to-[#FFF3DC] px-3 py-2.5 shadow-lg">
                        {/* Drawn at 44px; 140px covers ~3x density. onError falls
                            back to the origin URL — the convention `optimizedImg`
                            documents — so a proxy hiccup can't blank the gift. */}
                        <img
                            src={optimizedImg(RUDRAKSH_BRACELET_IMAGE, 140)}
                            onError={(e) => { e.currentTarget.src = RUDRAKSH_BRACELET_IMAGE; }}
                            alt="Free 5 Mukhi Rudraksh bracelet"
                            loading="lazy"
                            decoding="async"
                            className="w-11 h-11 shrink-0 rounded-xl object-cover border border-[#F0E2C2]"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-[#17211D] leading-tight">
                                {selectedPkg.prasadBoxFree
                                    ? "Your prasad box is FREE — claim it"
                                    : "Get a FREE Rudraksh bracelet"}
                            </p>
                            <p className="text-[10.5px] text-[#66736E] leading-snug mt-0.5">
                                {selectedPkg.prasadBoxFree ? (
                                    <>
                                        {selectedPkg.name} includes the {packagePrasadBox(selectedPkg).name} at
                                        no charge — add it and we'll courier it home with a Rudraksh bracelet.
                                    </>
                                ) : (
                                    <>
                                        Add the {packagePrasadBox(selectedPkg).name} (+{money(PRASAD_BOX_PRICE)}) and
                                        we'll send the bracelet with it.
                                    </>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={acceptPrasadNudge}
                            className="shrink-0 bg-[#C89B3C] hover:bg-[#B98C2F] text-white text-[11px] font-extrabold px-3 py-2 rounded-full shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setNudgeDismissed(true)}
                            aria-label="Dismiss offer"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-[#E8CF9A] flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-[#66736E]" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Sticky Footer */}
            {step !== "success" && (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-[#DDEBE6] px-5 py-4">
                    {error && (
                        <p className="text-red-500 text-[12px] font-semibold mb-3 text-center">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-[#66736E] font-semibold uppercase block">TOTAL TO PAY</span>
                            <span className="text-[20px] font-extrabold text-[#086B50]">{money(totalPrice)}</span>
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
