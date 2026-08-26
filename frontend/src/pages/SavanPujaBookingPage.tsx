import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Gift, Plus, X, Users, AlertCircle, Sparkles, Droplets, ArrowUpRight } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { useAbandonedCart } from "../utils/useAbandonedCart";
import analytics, { type AnalyticsItem } from "../utils/analytics";
import { optimizedImg } from "../utils/img";
import { useMoney, isValidPhone, shipsPrasad, toStoredPhone } from "../utils/currency";
// import CountryPicker from "../components/checkout/CountryPicker";  // hidden — see the commented block below
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
import CheckoutRecommendationsSheet, { type RecommendedPuja } from "../components/booking/CheckoutRecommendationsSheet";
import { useShopifyCart } from "../context/ShopifyCartContext";
import { clearPujaCheckoutDraft, loadPujaCheckoutDraft, savePujaCheckoutDraft } from "../utils/pujaCheckoutDraft";

type Step = "details" | "success";

/**
 * ── Theme ────────────────────────────────────────────────────────────────
 * This page wears the same antique parchment / aged gold / deep crimson
 * manuscript theme as SavanPujaPage: the `svn-*` decorative classes and the
 * four `font-svn-*` faces both live in src/index.css, and the four faces are
 * loaded once in index.html rather than imported here.
 *
 * Colours are written as literal hexes rather than theme utilities because
 * that is how every hue on the detail page is written, and one convention
 * across the two halves of a funnel beats two.
 *
 * The palette, in the roles this page uses it:
 *   #F6F0E3 / #FCF8F0 / #FFFDF8   parchment, card, field
 *   #F3E5BF / #EFE3CC             warm beige fills (chips, gift surfaces)
 *   #D8B66A / #C79A2B             aged gold hairline / struck gold rule
 *   #7A1622 / #A41F2E             deep crimson ink / the one action colour
 *   #23201B / #665C50 / #8C8274   ink, body, faint
 *   #8E6A25                       gold text, and every small icon
 *   #3E6B4A                       Forest Green — the ONLY success hue, so a
 *                                 tick or a "Free" never reads as ornament
 */
const INPUT =
    "w-full bg-[#FFFDF8] border border-[#D8B66A]/70 rounded-xl px-4 py-3 text-sm text-[#23201B] placeholder-[#8C8274] focus:outline-none focus:border-[#C79A2B] focus:ring-2 focus:ring-[#C79A2B]/25 transition-all";
const LABEL =
    "font-svn-sub text-[10px] font-bold text-[#8E6A25] uppercase tracking-[0.12em] mb-1.5 block";

/**
 * Numbered step head — a wax-seal numeral beside a Cinzel small-caps title,
 * over the theme's gold hairline.
 *
 * The counterpart to `SectionTitle` on the detail page, with the seal standing
 * in for that page's leading icon: a checkout's sections are an ordered list, a
 * landing page's are not, so the numeral has to survive the restyle.
 */
function StepHead({ n, title, sub }: { n: string; title: string; sub: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#D8B66A]/60">
            <span className="svn-seal shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-svn-sub text-[11px] font-bold">
                {n}
            </span>
            <div className="min-w-0">
                <h3 className="font-svn-sub text-[13px] font-bold uppercase tracking-[0.1em] text-[#7A1622] leading-tight">
                    {title}
                </h3>
                <p className="text-[11px] text-[#665C50] leading-snug mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

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
    const { items: shopCartItems, subtotal: shopSubtotal } = useShopifyCart();

    // Package chosen on the detail page (handed over as navigation state), or
    // the entry package when this page is opened directly. The `addPrasadBox` /
    // `prasadAdded` keys are the shapes earlier versions of the funnel sent;
    // still honoured so an old link or a stale tab can't lose the choice.
    const handover = location.state as
        | { packageId?: SavanPackageId; addPrasadBox?: boolean; prasadAdded?: boolean }
        | null;
    const savedDraft = loadPujaCheckoutDraft<{
        packageId?: SavanPackageId;
        prasadOptedIn?: boolean;
        form?: { name: string; gotra: string; phone: string; email: string; time: string; familyMembers: { name: string; gotra: string }[] };
        selectedAddressId?: string | null;
        showNewAddressForm?: boolean;
        newAddress?: { houseNo: string; street: string; city: string; state: string; pincode: string; saveAs: string };
        relatedPuja?: RecommendedPuja | null;
    }>("savan");
    const [packageId, setPackageId] = useState<SavanPackageId>(savedDraft?.packageId ?? handover?.packageId ?? DEFAULT_PACKAGE_ID);
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
        Boolean(savedDraft?.prasadOptedIn ?? handover?.addPrasadBox ?? handover?.prasadAdded),
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

    /**
     * Saved Razorpay order that can be retried without hitting create-pending
     * again. Set as soon as the server returns an order; cleared on success or
     * when the user edits the form (which changes the total and invalidates the
     * old order).
     *
     * Why: when Google Pay times out the modal is dismissed, but the Razorpay
     * order and the PendingPoojaBooking row are still valid — Razorpay allows
     * retrying the same order_id within its expiry window (usually 15 minutes).
     * Reusing the same order avoids creating a second orphan pending row and
     * lets the webhook reconcile whichever attempt eventually succeeds.
     */
    const [retryOrderData, setRetryOrderData] = useState<{
        razorpayOrderId: string;
        razorpayKeyId: string;
        amountMinor: number;
        currency: string;
        bookingId: string;
        prefill: { name: string; contact: string; email: string };
    } | null>(null);
    const [showCheckoutRecommendations, setShowCheckoutRecommendations] = useState(false);
    const [selectedRelatedPuja, setSelectedRelatedPuja] = useState<RecommendedPuja | null>(savedDraft?.relatedPuja ?? null);

    // Devotee + schedule form
    const [form, setForm] = useState(savedDraft?.form ?? {
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
        analytics.custom(
            "prasad_nudge_accepted",
            { item_name: puja.poojaNameEng, value: PRASAD_BOX_PRICE, currency: "INR" },
            {
                event: "PrasadNudgeAccepted",
                custom: true,
                params: {
                    content_name: puja.poojaNameEng,
                    value: PRASAD_BOX_PRICE,
                    currency: "INR",
                },
            },
        );
        prasadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // Delivery address (only required when blessed prasad is added)
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(savedDraft?.selectedAddressId ?? null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(savedDraft?.showNewAddressForm ?? false);
    const [newAddress, setNewAddress] = useState(savedDraft?.newAddress ?? {
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
    const relatedPujaPrice = selectedRelatedPuja?.poojaPriceOffline || 0;
    const payablePrice = totalPrice + shopSubtotal + relatedPujaPrice;

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
    // e.g. "Shree Ujjain Rudrabhishek Mahapuja — Rudri Path Mahaseva [Prasad Box + Shiv Chalisa (free): Dry Prasad…]"
    const packageLabel = `${puja.poojaNameEng} — ${selectedPkg.name}${boxLabel ? ` [${boxLabel}]` : ""}`;

    // Line-item breakdown reported to Meta alongside `value`. The package price
    // is the base line; extra Sankalp names (beyond the free allowance) and the
    // paid box are separate lines — without this, every order looks like one
    // anonymous unit in Events Manager and the higher value can't be reconciled
    // against the puja price. Ids mirror the ones the server CAPI Purchase sends
    // (built off the booking name) so the deduplicated pair reports identically
    // either way.
    // GA4 line items for the same basket metaContents() describes. Kept next to
    // it deliberately: an add-on added to one and forgotten in the other is how
    // Google and Meta start reporting different revenue for the same order.
    const ga4Items = (): AnalyticsItem[] => [
        {
            id: String(puja._id),
            name: packageLabel,
            price: toInr(basePrice),
            quantity: 1,
            category: "Puja",
            brand: "Savan",
        },
        ...(prasadCost > 0
            ? [{
                id: `${puja._id}__prasad`,
                name: `${puja.poojaNameEng} — Prasad Box`,
                price: toInr(PRASAD_BOX_PRICE),
                quantity: 1,
                category: "Add-on",
            }]
            : []),
        ...(chargedMembers > 0
            ? [{
                id: `${puja._id}__sankalp`,
                name: `${puja.poojaNameEng} — Extra Sankalp Name`,
                price: toInr(FAMILY_MEMBER_PRICE),
                quantity: chargedMembers,
                category: "Add-on",
            }]
            : []),
    ];

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
        ...shopCartItems.map((line) => ({
            id: line.product.shopifyProductId || line.product._id,
            quantity: line.qty,
            item_price: toInr(Number(line.product.priceRangeV2?.minVariantPrice?.amount || 0)),
        })),
        ...(selectedRelatedPuja
            ? [{ id: selectedRelatedPuja._id, quantity: 1, item_price: toInr(selectedRelatedPuja.poojaPriceOffline || 0) }]
            : []),
    ];

    const persistSavanCheckoutDraft = (relatedPuja: RecommendedPuja | null = selectedRelatedPuja) => {
        savePujaCheckoutDraft("savan", {
            packageId,
            prasadOptedIn,
            form,
            selectedAddressId,
            showNewAddressForm,
            newAddress,
            relatedPuja,
        });
    };

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
        amount: toInr(payablePrice),
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
        // Meta keeps receiving the devotee's name and number, as it always has.
        // GA4 gets only the item — a phone number in a GA4 property is a Terms
        // of Service violation, which is why the two payloads are separate.
        analytics.checkoutDetailsFilled({
            itemName: puja.poojaNameEng,
            itemId: String(puja._id),
            meta: {
                event: "CustomerDetailsFilled",
                params: {
                    content_name: puja.poojaNameEng,
                    bhaktName: form.name.trim(),
                    contactNumber: toStoredPhone(form.phone, country),
                },
            },
        });
    };

    const handleConfirm = async (skipRecommendations = false, checkout?: { shopSubtotal: number; relatedPuja?: RecommendedPuja | null }) => {
        setError("");
        // A fresh submit starts a new order — discard any stale retry state
        // so the user doesn't accidentally reopen a superseded Razorpay order.
        setRetryOrderData(null);

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

        if (!skipRecommendations) {
            setShowCheckoutRecommendations(true);
            return;
        }

        setSubmitting(true);

        try {
            // The recommendation sheet supplies a snapshot when a product was
            // just added, avoiding a race with the asynchronous cart update.
            const checkoutShopSubtotal = checkout?.shopSubtotal ?? shopSubtotal;
            const checkoutRelatedPuja = checkout?.relatedPuja || selectedRelatedPuja;
            const checkoutRelatedPujaPrice = checkoutRelatedPuja?.poojaPriceOffline || 0;
            const checkoutTotal = totalPrice + checkoutShopSubtotal + checkoutRelatedPujaPrice;
            const addons = {
                shopItems: shopCartItems.map((line) => {
                    const unitPrice = Number(line.product.priceRangeV2?.minVariantPrice?.amount || 0);
                    return {
                        type: "shop_item",
                        productId: line.product._id,
                        shopifyProductId: line.product.shopifyProductId,
                        name: line.product.title,
                        quantity: line.qty,
                        unitPrice,
                        totalPrice: unitPrice * line.qty,
                    };
                }),
                relatedPujas: checkoutRelatedPuja ? [{
                    type: "related_puja",
                    poojaId: checkoutRelatedPuja._id,
                    poojaID: checkoutRelatedPuja.poojaID,
                    name: checkoutRelatedPuja.poojaNameEng,
                    mode: "offline",
                    quantity: 1,
                    unitPrice: checkoutRelatedPujaPrice,
                    totalPrice: checkoutRelatedPujaPrice,
                }] : [],
                addonsTotal: checkoutShopSubtotal + checkoutRelatedPujaPrice,
            };
            const bookingDate = resolveBookingDate(puja.pujaDate, form.time);

            // 1) Create the pending booking + Razorpay order. The server
            //    auto-registers the user by phone when userId is absent.
            const res = await fetch(`${API_URL}/bookings/create-pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encryptPayload({
                    userId: user?._id || (user as any)?.id,
                    addons,
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
                        shopSubtotal: checkoutShopSubtotal,
                        relatedPuja: checkoutRelatedPuja ? {
                            id: checkoutRelatedPuja._id,
                            name: checkoutRelatedPuja.poojaNameEng,
                            price: checkoutRelatedPujaPrice,
                            mode: "offline",
                        } : null,
                        payableTotal: checkoutTotal,
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
                    amount: toInr(checkoutTotal),
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

            // Persist the order so ondismiss can surface a Retry button that
            // reopens THIS Razorpay order instead of calling create-pending again.
            const savedPrefill = {
                name: form.name.trim(),
                contact: isIndia ? phoneDigits : `+${phoneDigits}`,
                email: form.email.trim() || `user${phoneDigits}@panditjiatrequest.com`,
            };
            setRetryOrderData({
                razorpayOrderId: orderData.razorpayOrderId,
                razorpayKeyId: orderData.razorpayKeyId,
                amountMinor: orderData.amountMinor ?? totalPrice * 100,
                currency: orderData.currency ?? "INR",
                bookingId: orderData.bookingId,
                prefill: savedPrefill,
            });

            // AddToCart already fired on the detail-page CTA that led here, so
            // this step only reports InitiateCheckout — firing both here would
            // put two funnel steps on a single trigger.
            {
                const contents = metaContents();
                analytics.beginCheckout({
                    items: ga4Items(),
                    value: toInr(totalPrice),
                    currency: "INR",
                    meta: {
                        event: "InitiateCheckout",
                        params: {
                            content_name: puja.poojaNameEng,
                            content_ids: [puja._id],
                            content_type: "product",
                            contents,
                            num_items: contents.reduce((n, c) => n + c.quantity, 0),
                            value: toInr(checkoutTotal),
                            currency: "INR",
                        },
                    },
                });

                // The Razorpay sheet is about to open on a real order — the
                // strongest pre-purchase signal there is, and a usable
                // secondary conversion for Ads while purchase volume is thin.
                analytics.addPaymentInfo({
                    items: ga4Items(),
                    value: toInr(totalPrice),
                    currency: "INR",
                });

                // Park this browser's GA4/Ads ids against the order id, so the
                // Razorpay webhook can still attribute the purchase correctly
                // if this tab is gone by the time payment settles.
                analytics.stashOrderAttribution(orderData.razorpayOrderId);
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
                amount: orderData.amountMinor ?? toInr(checkoutTotal) * 100,
                currency: orderData.currency ?? "INR",
                name: "Pandit Ji At Request",
                description: puja.poojaNameEng,
                order_id: orderData.razorpayOrderId,
                prefill: savedPrefill,
                // Keep the sheet open for the full UPI collect-request window.
                // Google Pay issues a 5-minute UPI collect; without this the
                // Razorpay modal can time out before the network settles and
                // the payment is dropped even though the user approved it.
                timeout: 300,
                // Explicit UPI instrument config.
                //
                // `intent` opens Google Pay / PhonePe directly (deeplink).
                // `qr`     is the fallback for in-app browsers (Instagram,
                //           WhatsApp, Facebook) that block upi:// deep-links.
                // `collect` covers UPI pull when the device has no UPI app
                //           or intent fails.
                //
                // `show_default_blocks: true` keeps cards and netbanking
                // alongside UPI so this config is additive, never restrictive.
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: "Pay via UPI",
                                instruments: [{
                                    method: "upi",
                                    flows: ["intent", "qr", "collect"],
                                }],
                            },
                        },
                        sequence: ["block.upi"],
                        preferences: { show_default_blocks: true },
                    },
                },
                // Razorpay's own chrome, tinted to the theme's action colour so
                // the checkout sheet doesn't open in a different palette than
                // the button that summoned it.
                theme: { color: "#7A1622" },
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
                                amountPaid: toInr(checkoutTotal),
                            })),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

                        if (verifyData.token && verifyData.user) login(verifyData.token, verifyData.user);

                        {
                            const contents = metaContents();
                            analytics.purchase({
                                // MUST be the Razorpay order id: the server
                                // fires this same purchase from the webhook,
                                // and a shared transaction_id is what keeps
                                // GA4 from counting the sale twice.
                                transactionId: response.razorpay_order_id,
                                items: ga4Items(),
                                value: toInr(totalPrice),
                                currency: "INR",
                                meta: {
                                    event: "Purchase",
                                    eventId: `puja_purchase_${response.razorpay_order_id}`,
                                    params: {
                                        content_name: puja.poojaNameEng,
                                        content_ids: [puja._id],
                                        content_type: "product",
                                        contents,
                                        num_items: contents.reduce((n, c) => n + c.quantity, 0),
                                        value: toInr(checkoutTotal),
                                        currency: "INR",
                                    },
                                },
                            });
                        }

                        // Paid — drop this row out of the abandoned-lead list.
                        markCartConverted(orderData.bookingId);
                        clearPujaCheckoutDraft("savan");

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
                        // The Razorpay order is still valid — Razorpay allows
                        // retrying the same order_id within its expiry window.
                        // retryOrderData is already set (above) so the Retry
                        // button can reopen the sheet without a new create-pending.
                        setError(
                            "Payment was not completed. Tap \"Retry Payment\" to try again — " +
                            "your booking details are saved."
                        );
                        setSubmitting(false);
                        // retryOrderData stays set so the Retry button is visible.
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
        <div className="svn svn-parchment min-h-screen font-svn-body w-full max-w-md mx-auto shadow-xl border-x border-[#D8B66A] relative pb-28">
            <CheckoutRecommendationsSheet
                isOpen={showCheckoutRecommendations}
                source="savan_checkout_recommendations"
                shopTags={["shiva", "mahadev", "rudrabhishek", "rudraksha"]}
                pujaTerms={["shiva", "mahadev", "rudra", "rudrabhishek", "mrityunjaya", "mrityunjay", "homa", "jaap"]}
                excludePoojaID={KASHI_MAHADEV_POOJA_ID}
                summary={{ pujaAmount: totalPrice, formatAmount: money }}
                onDismiss={() => setShowCheckoutRecommendations(false)}
                selectedRelatedPuja={selectedRelatedPuja}
                enableRelatedPujaCart
                onRelatedPujaChange={(next) => {
                    setSelectedRelatedPuja(next);
                    persistSavanCheckoutDraft(next);
                }}
                onPujaInfo={() => persistSavanCheckoutDraft()}
                onContinue={(checkout) => {
                    setShowCheckoutRecommendations(false);
                    persistSavanCheckoutDraft(checkout?.relatedPuja || selectedRelatedPuja);
                    void handleConfirm(true, checkout);
                }}
            />
            {/* No Savan rain here, deliberately — it falls on the detail page
                and stops at this one. That page is being read; this one is
                being filled in, and a checkout is the wrong place for drifting
                motion behind the fields. The parchment, the gold rules and the
                crimson carry the continuity instead. */}

            <Helmet>
                <title>{`Complete your booking — ${puja.poojaNameEng} | Pandit Ji At Request`}</title>
                {/* A checkout page has nothing to gain from being indexed and
                    everything to lose: it is a step, not a destination, and it
                    competes with the landing page for the same query. */}
                <meta name="robots" content="noindex, follow" />
            </Helmet>

            {/* ── Sticky header ──
                Parchment rather than white, with the theme's gold rule along
                its bottom edge, so the bar reads as the head of the sheet
                rather than chrome laid over it. Matches the detail page's, but
                at z-40 — the free-bracelet nudge below owns z-50 here. */}
            <div className="sticky top-0 z-40 bg-[#F6F0E3]/92 backdrop-blur-md border-b border-[#D8B66A] px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => (location.key !== "default" ? navigate(-1) : navigate(`/${KASHI_MAHADEV_PUJA_SLUG}`))}
                    aria-label="Go back"
                    className="w-8 h-8 rounded-full bg-[#FFFDF8] flex items-center justify-center border border-[#C79A2B] shadow-sm active:scale-90 transition-transform shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 text-[#7A1622]" />
                </button>
                <div className="min-w-0">
                    <h1 className="font-svn-head text-[16px] font-semibold text-[#23201B] leading-tight truncate">
                        Complete Your Savan Puja
                    </h1>
                    <p className="text-[11px] text-[#665C50] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8E6A25] shrink-0" />
                        <span className="truncate">{puja.templeName} · {puja.templeLocation}</span>
                    </p>
                </div>
            </div>

            {/* ── Savan occasion ribbon ──
                Deep crimson, gold-ruled top and bottom, set in Cinzel caps —
                the one saturated band at the head of this page, exactly as on
                the detail page the devotee just came from. */}
            <div className="svn-crimson border-y border-[#C79A2B]/70 text-center py-1.5 px-4">
                <p className="font-svn-sub text-[10px] font-semibold tracking-[0.18em] uppercase text-[#E2BF62]">
                    {puja.occasion} · {puja.pujaDate} · जय श्री महाकाल
                </p>
            </div>

            {/* Currency switcher — HIDDEN. The country is resolved automatically
                from the visitor's IP on the server, so there is no manual
                override on screen. Left here, commented, so bringing it back is
                one uncomment (plus its import above).

                Restyled to the parchment theme while it sat here: the block
                arrived carrying the page's old teal palette, and a commented
                block is exactly the kind of thing that gets uncommented a year
                later without anyone re-reading its classes.
                <div className="flex items-center justify-between gap-2 px-5 py-2 border-b border-[#D8B66A] bg-[#F3E5BF]">
                    <span className="font-svn-sub text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E6A25]">
                        Paying from
                    </span>
                    <CountryPicker
                        className="bg-[#FFFDF8] border border-[#D8B66A] text-[#23201B] hover:border-[#C79A2B]"
                        accentClass="text-[#7A1622]"
                    />
                </div>
            */}

            {/* Content. */}
            <div className="px-5 pt-4 space-y-6">
                {step === "details" ? (
                    <div className="space-y-6">
                        {/* Order summary — reflects the chosen package + extras */}
                        <div className="bg-[#FCF8F0] border border-[#D8B66A]/70 rounded-2xl p-4 shadow-[0_3px_14px_-8px_rgba(40,25,10,0.35)]">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-svn-head text-[16px] font-semibold text-[#23201B] leading-snug">{puja.poojaNameEng}</p>
                                    <p className="font-svn-sub text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7A1622] mt-1">{selectedPkg.name}</p>
                                </div>
                                <span className="flex items-center gap-1 shrink-0 bg-[#F3E5BF] border border-[#D8B66A] text-[#23201B] rounded-full px-2 py-0.5 text-[11px] font-bold">
                                    <span className="text-[#C79A2B]">★</span> {puja.rating}
                                </span>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-[#D8B66A]/45 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12.5px] text-[#665C50] font-medium">{selectedPkg.name}</span>
                                    <span className="font-svn-head lining-nums text-[14px] font-bold text-[#23201B]">{money(basePrice)}</span>
                                </div>

                                {/* Offerings made in your name — shown as "Included"
                                    so the value of the tier is visible on the bill. */}
                                {offerings.length > 0 && (
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[12px] text-[#665C50] font-medium flex items-start gap-1.5 min-w-0">
                                            <Droplets className="w-3.5 h-3.5 text-[#8E6A25] shrink-0 mt-0.5" />
                                            <span className="leading-snug">{offerings.join(", ")} offered in your name</span>
                                        </span>
                                        <span className="text-[11px] font-bold text-[#3E6B4A] shrink-0">Included</span>
                                    </div>
                                )}

                                {selectedPkg.freeFamilyMembers > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#665C50] font-medium flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[#C79A2B]" />
                                            {selectedPkg.freeFamilyMembers} family Sankalp
                                        </span>
                                        <span className="text-[11px] font-bold text-[#3E6B4A]">Free</span>
                                    </div>
                                )}

                                {chargedMembers > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#665C50] font-medium flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[#8E6A25]" />
                                            Extra Sankalp × {chargedMembers}
                                        </span>
                                        <span className="font-svn-head lining-nums text-[14px] font-bold text-[#23201B]">+{money(familyCost)}</span>
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
                                    <span className="text-[12.5px] text-[#665C50] font-medium flex items-center gap-1.5 min-w-0">
                                        <Gift className="w-3.5 h-3.5 text-[#8E6A25] shrink-0" />
                                        <span className="truncate">{packagePrasadBox(selectedPkg).name}</span>
                                    </span>
                                    {!prasadBoxAdded ? (
                                        // "Not added" even on the tier where it is free:
                                        // free still has to be asked for, and a bill
                                        // reading "Free" for a parcel nobody requested
                                        // is how a devotee ends up expecting one.
                                        <span className="text-[11px] font-semibold text-[#8C8274] shrink-0">Not added</span>
                                    ) : selectedPkg.prasadBoxFree ? (
                                        <span className="text-[11px] font-bold text-[#3E6B4A] shrink-0">Free</span>
                                    ) : (
                                        <span className="font-svn-head lining-nums text-[14px] font-bold text-[#23201B] shrink-0">+{money(prasadCost)}</span>
                                    )}
                                </div>
                                )}

                                {/* The bracelet rides inside the box and adds nothing
                                    to the total — listed only when a box actually
                                    ships, so it is counted rather than merely promised. */}
                                {shippedBox && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#665C50] font-medium flex items-center gap-1.5">
                                            <Gift className="w-3.5 h-3.5 text-[#C79A2B]" />
                                            Rudraksh Bracelet
                                        </span>
                                        <span className="font-svn-sub text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E6A25]">Free</span>
                                    </div>
                                )}

                                {shopSubtotal > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="min-w-0 truncate pr-3 text-[12.5px] text-[#665C50] font-medium">{shopCartItems.map((line) => `${line.product.title}${line.qty > 1 ? ` ×${line.qty}` : ""}`).join(", ") || "Shop additions"}</span>
                                        <span className="font-svn-sub text-[12px] font-bold text-[#8E6A25]">{money(shopSubtotal)}</span>
                                    </div>
                                )}

                                {selectedRelatedPuja && (
                                    <div className="flex items-center justify-between">
                                        <span className="min-w-0 truncate pr-3 text-[12.5px] text-[#665C50] font-medium">{selectedRelatedPuja.poojaNameEng}</span>
                                        <span className="font-svn-sub text-[12px] font-bold text-[#8E6A25]">{money(selectedRelatedPuja.poojaPriceOffline || 0)}</span>
                                    </div>
                                )}

                                {/* The bill's own total. It is deliberately quieter
                                    than the sticky bar's — crimson on parchment, not
                                    the lacquered plate — because the bar is the one a
                                    devotee pays from and two equally loud totals on
                                    one screen is two prices to reconcile. */}
                                <div className="flex items-baseline justify-between pt-2 border-t border-[#D8B66A]/60">
                                    <span className="font-svn-sub text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E6A25]">Total</span>
                                    <span className="font-svn-head lining-nums text-xl font-bold text-[#7A1622]">{money(payablePrice)}</span>
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
                                    analytics.custom(
                                        "puja_package_upgrade",
                                        {
                                            package_id: nextPkg.id,
                                            value: nextPkg.price,
                                            currency: "INR",
                                            source: "booking_summary",
                                        },
                                        {
                                            event: "PujaPackageUpgrade",
                                            custom: true,
                                            params: {
                                                to: nextPkg.id,
                                                value: nextPkg.price,
                                                currency: "INR",
                                                source: "booking_summary",
                                            },
                                        },
                                    );
                                }}
                                className="w-full text-left rounded-2xl border border-[#D8B66A] bg-gradient-to-br from-[#F3E5BF] to-[#EFE3CC] px-3.5 py-3 shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)] active:scale-[0.99] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#C79A2B] cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#C79A2B] shrink-0" />
                                    <p className="flex-1 min-w-0 font-svn-sub text-[12px] font-semibold text-[#23201B] leading-snug">
                                        Upgrade to {nextPkg.name}
                                    </p>
                                    {/* A wax seal, the theme's badge language — the
                                        same mark the package cards wear for "Most
                                        Popular", which is what makes this read as
                                        part of that ladder rather than an ad. */}
                                    <span className="svn-seal shrink-0 flex items-center gap-0.5 rounded-full px-2 py-0.5 font-svn-sub text-[10.5px] font-bold lining-nums">
                                        +{money(nextPkg.price - selectedPkg.price)}
                                        <ArrowUpRight className="w-3 h-3" />
                                    </span>
                                </div>
                                {/* What the upgrade actually buys, in the devotee's
                                    terms: the parcel first (it arrives at their door),
                                    then the extra Sankalps, then the new offerings. */}
                                <p className="mt-1 text-[11px] text-[#665C50] leading-snug">
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
                            <StepHead n="01" title="Devotee Details" sub="For the main Sankalp" />
                            <div className="space-y-3">
                                <div>
                                    <label className={LABEL}>Mobile Number *</label>
                                    <PhoneField
                                        country={country}
                                        value={form.phone}
                                        onChange={(phone) => setForm((f) => ({ ...f, phone }))}
                                        onBlur={trackCustomerDetails}
                                        inputClass={INPUT}
                                        prefixClass="text-[#7A1622]"
                                    />
                                    <p className="text-[10.5px] text-[#665C50] mt-1">
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
                            <StepHead
                                n="02"
                                title="Family Sankalp"
                                sub={
                                    selectedPkg.freeFamilyMembers > 0
                                        ? `${selectedPkg.freeFamilyMembers} free in ${selectedPkg.name} · ${money(FAMILY_MEMBER_PRICE)} each after`
                                        : `Optional · add members at ${money(FAMILY_MEMBER_PRICE)} each`
                                }
                            />

                            {/* Free-allowance meter — reassures the devotee how many
                                of the package's free Sankalps are still available. */}
                            {selectedPkg.freeFamilyMembers > 0 && (
                                <div className="flex items-center gap-1.5 bg-[#F3E5BF] border border-[#D8B66A] rounded-xl px-3 py-2 text-[11.5px] font-semibold text-[#8E6A25]">
                                    <Sparkles className="w-3.5 h-3.5 text-[#C79A2B] shrink-0" />
                                    {selectedPkg.freeFamilyMembers - form.familyMembers.length > 0
                                        ? `${selectedPkg.freeFamilyMembers - form.familyMembers.length} free family Sankalp${selectedPkg.freeFamilyMembers - form.familyMembers.length > 1 ? "s" : ""} left in your package`
                                        : `Free members used — extra names add ${money(FAMILY_MEMBER_PRICE)} each`}
                                </div>
                            )}

                            {/* Name + gotra for the person being added. The row is
                                only committed by the Add button (or Enter), so it is
                                framed as a draft — struck gold border and an explicit
                                "not added yet" warning — until it is. */}
                            <div
                                className={`rounded-2xl border p-3 space-y-2.5 transition-colors ${
                                    pendingFamilyName ? "border-[#C79A2B] bg-[#F3E5BF]/70" : "border-[#D8B66A]/60 bg-[#FCF8F0]"
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
                                    className="w-full font-svn-ui flex items-center justify-center gap-1.5 rounded-xl border border-[#C79A2B]/60 bg-[#A41F2E] hover:bg-[#87121E] disabled:bg-[#EFE3CC] disabled:text-[#8C8274] disabled:border-[#D8B66A]/60 text-[#FFF8F0] font-bold text-[13px] py-2.5 transition-colors active:scale-95 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    {pendingFamilyName
                                        ? `Add ${pendingFamilyName} · ${form.familyMembers.length < selectedPkg.freeFamilyMembers ? "FREE" : `+${money(FAMILY_MEMBER_PRICE)}`}`
                                        : "Add member"}
                                </button>

                                {/* The whole point of this block: make "typed but not
                                    added" impossible to mistake for "added". */}
                                {pendingFamilyName && (
                                    <p className="flex items-start gap-1.5 text-[11px] font-semibold text-[#8E6A25] leading-snug">
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
                                            className="flex items-center gap-2 bg-[#F3E5BF] border border-[#D8B66A] rounded-xl px-3 py-2"
                                        >
                                            <Check className="w-3.5 h-3.5 text-[#3E6B4A] shrink-0" strokeWidth={3} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12.5px] font-bold text-[#23201B] truncate">{m.name}</p>
                                                <p className="text-[10.5px] text-[#665C50] truncate">
                                                    Gotra: {m.gotra || "Kashyap (default)"}
                                                </p>
                                            </div>
                                            {idx < selectedPkg.freeFamilyMembers ? (
                                                <span className="text-[11px] font-bold text-[#3E6B4A] shrink-0">FREE</span>
                                            ) : (
                                                <span className="lining-nums text-[11px] font-bold text-[#7A1622] shrink-0">+{money(FAMILY_MEMBER_PRICE)}</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFamilyMember(idx)}
                                                aria-label={`Remove ${m.name}`}
                                                className="text-[#8E6A25] hover:text-[#7A1622] transition-colors shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {form.familyMembers.length > 0 && (
                                <p className="flex items-center gap-1.5 text-[11px] text-[#665C50]">
                                    <Users className="w-3.5 h-3.5 text-[#8E6A25] shrink-0" />
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
                            <div className="flex items-start gap-2.5 rounded-2xl border border-[#D8B66A]/70 bg-[#F3E5BF]/60 px-3.5 py-3">
                                <Gift className="w-4 h-4 text-[#8E6A25] shrink-0 mt-px" />
                                <p className="text-[11.5px] text-[#665C50] leading-snug">
                                    <b className="text-[#23201B]">Prasad box ships within India only.</b>{" "}
                                    It is not part of your total, and no delivery address is
                                    needed. Your puja, Sankalp and video are unaffected —
                                    the recording reaches you on WhatsApp as usual.
                                </p>
                            </div>
                        ) : (
                        <div ref={prasadSectionRef} className="space-y-3">
                            <StepHead
                                n="03"
                                title="Prasad Box"
                                sub={
                                    selectedPkg.prasadBoxFree
                                        ? `FREE with ${selectedPkg.name} · add it to have it couriered`
                                        : `${money(PRASAD_BOX_PRICE)} · blessed prasad couriered to your home`
                                }
                            />

                            {/* The box carries the free Rudraksh bracelet, so the gift
                                is sold on this checkbox rather than mentioned once in
                                the summary — this is the moment the devotee decides.
                                The card turns gold when ticked so the choice reads as
                                claimed, not merely selected. */}
                            <label
                                className={`flex items-center gap-3 rounded-2xl p-4 shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)] cursor-pointer select-none border transition-colors ${prasadBoxAdded
                                    ? "bg-gradient-to-br from-[#F3E5BF] to-[#EFE3CC] border-[#C79A2B]"
                                    : "bg-[#FCF8F0] border-[#D8B66A]/60"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={prasadBoxAdded}
                                    onChange={(e) => {
                                        setPrasadOptedIn(e.target.checked);
                                        analytics.custom(
                                            "puja_prasad_box_toggle",
                                            {
                                                added: e.target.checked,
                                                package_id: selectedPkg.id,
                                                value: prasadBoxCost(selectedPkg, true),
                                                currency: "INR",
                                            },
                                            {
                                                event: "PujaPrasadBoxToggle",
                                                custom: true,
                                                params: {
                                                    added: e.target.checked,
                                                    package: selectedPkg.id,
                                                    value: prasadBoxCost(selectedPkg, true),
                                                    currency: "INR",
                                                },
                                            },
                                        );
                                    }}
                                    className="w-4 h-4 shrink-0 rounded accent-[#A41F2E] border-[#D8B66A] focus:ring-[#C79A2B]"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-svn-sub text-[11.5px] font-semibold text-[#23201B]">Add {packagePrasadBox(selectedPkg).name}</p>
                                    <p className="text-[11px] text-[#665C50] mt-0.5">
                                        Blessed at {puja.templeName} ·{" "}
                                        {selectedPkg.prasadBoxFree ? (
                                            <b className="text-[#8E6A25]">FREE with this seva</b>
                                        ) : (
                                            <>+{money(PRASAD_BOX_PRICE)}</>
                                        )}
                                    </p>
                                    <p className="text-[11px] font-bold text-[#8E6A25] mt-1 leading-snug">
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
                                        className="w-12 h-12 rounded-xl object-cover border border-[#D8B66A]"
                                    />
                                    <span className="svn-seal absolute -top-1.5 -right-1.5 font-svn-sub text-[7.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-[1px] rounded-full">
                                        Free
                                    </span>
                                </span>
                            </label>

                            {/* What is actually in the box, once it is added, so
                                the price is attached to objects rather than to
                                the word "prasad". */}
                            {prasadBoxAdded && (
                                <div className="rounded-2xl border border-[#D8B66A]/70 bg-[#FCF8F0] p-3 shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)]">
                                    <p className="svn-rule flex items-center gap-1.5 font-svn-sub text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#7A1622] mb-1.5">
                                        <Gift className="w-3 h-3 text-[#C79A2B]" />
                                        In your {packagePrasadBox(selectedPkg).name}
                                    </p>
                                    {/* `parchment`, the theme's own tone — the same
                                        tiles the package cards render on the detail
                                        page. `gold` still marks the free box, because
                                        gold is this theme's language for a gift. */}
                                    <ItemTileRow
                                        items={shipList}
                                        tone={selectedPkg.prasadBoxFree ? "gold" : "parchment"}
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
                            <StepHead
                                n="04"
                                title="Delivery Address"
                                sub={`Where we courier your ${shippedBox?.name}`}
                            />

                            {user && addresses.length > 0 && !showNewAddressForm && (
                                <div className="space-y-2">
                                    <p className={LABEL}>Select Delivery Address</p>
                                    {addresses.map((addr) => (
                                        <label
                                            key={addr._id}
                                            className={`flex items-start gap-3 border rounded-2xl p-3.5 cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-[#C79A2B] bg-[#F3E5BF]/70 ring-1 ring-[#C79A2B]/40" : "border-[#D8B66A]/60 bg-[#FCF8F0]"}`}
                                        >
                                            <input
                                                type="radio"
                                                name="addressSelect"
                                                checked={selectedAddressId === addr._id}
                                                onChange={() => setSelectedAddressId(addr._id)}
                                                className="mt-1 accent-[#A41F2E] border-[#D8B66A] focus:ring-[#C79A2B]"
                                            />
                                            <div className="text-[12.5px] text-[#23201B] leading-relaxed">
                                                <span className="font-svn-sub font-bold text-[10px] text-[#7A1622] uppercase tracking-[0.12em] block mb-0.5">{addr.addressName || addr.saveAs}</span>
                                                {addr.addressLine1 || addr.houseNo}, {addr.addressLine2 || addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                            </div>
                                        </label>
                                    ))}
                                    <button
                                        onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                                        className="font-svn-ui text-[#7A1622] hover:text-[#87121E] text-xs font-bold pt-1 block cursor-pointer"
                                    >
                                        + Add New Address
                                    </button>
                                </div>
                            )}

                            {(!user || showNewAddressForm) && (
                                <div className="bg-[#FCF8F0] border border-[#D8B66A]/70 rounded-2xl p-4 shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)] space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-[#D8B66A]/45">
                                        <span className="font-svn-sub text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7A1622]">Delivery Address Details</span>
                                        {user && addresses.length > 0 && (
                                            <button
                                                onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(addresses[0]._id); }}
                                                className="text-[#8C8274] hover:text-[#665C50] text-xs font-medium cursor-pointer"
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
                                        <p id="savan-country-hint" className="text-[10.5px] text-[#665C50] mt-1">
                                            Detected from your location. Tell us on WhatsApp if this is wrong.
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
                            /* A struck wax seal — the theme's mark of a thing
                               made official, which is exactly what has just
                               happened. */
                            className="svn-seal w-20 h-20 rounded-full flex items-center justify-center"
                        >
                            <Check className="w-10 h-10 text-[#F3E5BF]" strokeWidth={3} />
                        </motion.div>
                        <h3 className="font-svn-head font-semibold text-[#23201B] mt-5 text-2xl">
                            Booking Confirmed! 🙏
                        </h3>
                        <p className="text-[13px] text-[#665C50] mt-2 max-w-[280px] leading-relaxed">
                            Your <span className="font-semibold text-[#23201B]">{puja.poojaNameEng}</span> in <span className="font-semibold text-[#23201B]">Mahakal Nagri Ujjain</span> is booked for <span className="font-semibold text-[#23201B]">{puja.pujaDate}</span>. Our team will WhatsApp you the puja video with your name &amp; gotra shortly.
                        </p>
                        {/* Gold leaf, on the one sacred line — the same treatment
                            the detail page's mantra strip reserves for it, and
                            for the same reason: a sweep everywhere is a sweep
                            nowhere. */}
                        <p className="svn-foil font-svn-head text-[19px] font-semibold tracking-wide mt-3">ॐ नमः शिवाय</p>
                        <button onClick={() => navigate("/account?tab=live")} className="mt-6 w-full font-svn-ui bg-[#A41F2E] hover:bg-[#87121E] text-[#FFF8F0] font-bold py-3.5 rounded-2xl border border-[#C79A2B]/60 shadow-[0_6px_16px_-8px_rgba(122,22,34,0.9)] active:scale-95 transition-all cursor-pointer">
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
                    {/* Deep crimson with a lacquered black corner, on a struck
                        gold rim with the theme's engraved inner hairline —
                        essentially `svn-crimson`, entered from the shadow of
                        `svn-plate` rather than starting flat.

                        Dark, not the gift-gold it used to be: this thing drops
                        IN OVER a parchment page, and a beige card on a beige
                        sheet had to shout with a border to be seen at all. A
                        crimson one needs no such help.

                        The black is held to the first ~quarter on purpose. It
                        sits under the bracelet photo, which is the darkest
                        thing on the card anyway, so it reads as the shadow the
                        gift is lit out of — push it past halfway and the card
                        stops being crimson and starts being a black bar. */}
                    <div className="relative flex items-center gap-3 rounded-2xl border border-[#C79A2B] bg-[linear-gradient(135deg,#1A1210_0%,#7A1622_26%,#A41F2E_100%)] px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(199,154,43,0.22),0_12px_28px_-12px_rgba(20,10,0,0.9)]">
                        {/* Drawn at 44px; 140px covers ~3x density. onError falls
                            back to the origin URL — the convention `optimizedImg`
                            documents — so a proxy hiccup can't blank the gift. */}
                        <img
                            src={optimizedImg(RUDRAKSH_BRACELET_IMAGE, 140)}
                            onError={(e) => { e.currentTarget.src = RUDRAKSH_BRACELET_IMAGE; }}
                            alt="Free 5 Mukhi Rudraksh bracelet"
                            loading="lazy"
                            decoding="async"
                            className="w-11 h-11 shrink-0 rounded-xl object-cover border border-[#C79A2B]"
                        />
                        <div className="min-w-0 flex-1">
                            {/* Gold headline over cream body — the occasion
                                ribbon's own pairing, because most of this card
                                is now the same crimson that ribbon is. The
                                warm grey that was here reads fine on near-black
                                and goes muddy on red. */}
                            <p className="font-svn-sub text-[11.5px] font-semibold text-[#E2BF62] leading-tight">
                                {selectedPkg.prasadBoxFree
                                    ? "Your prasad box is FREE — claim it"
                                    : "Get a FREE Rudraksh bracelet"}
                            </p>
                            <p className="text-[10.5px] text-[#F3E5BF]/85 leading-snug mt-0.5">
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
                            /* Gold, and this is the one place on the page where
                               the action ISN'T crimson — the card's gradient
                               ends in crimson right where this button sits, so
                               the page's usual #A41F2E would sink into its own
                               background. Bright gold on lacquer is the only
                               pairing here with anything left to give. */
                            className="shrink-0 font-svn-ui bg-[#C79A2B] hover:bg-[#E2BF62] text-[#1E1A17] text-[11px] font-bold px-3.5 py-2 rounded-full border border-[#E2BF62]/70 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.6)] active:scale-95 transition-all cursor-pointer"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setNudgeDismissed(true)}
                            aria-label="Dismiss offer"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FFFDF8] border border-[#C79A2B] flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-[#8E6A25]" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── Sticky pay bar ──
                Ivory rather than white, gold-ruled along its top edge, and the
                button is the palette's flat Primary (#A41F2E, hover #87121E) —
                NOT a gradient. Same bar the detail page ends on, so the last
                thing a devotee taps there and the last thing they tap here are
                recognisably the same control. */}
            {step !== "success" && (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-[#FCF8F0]/96 backdrop-blur-md border-t border-[#C79A2B] shadow-[0_-6px_20px_-10px_rgba(40,25,10,0.5)] px-5 py-3.5">
                    {error && (
                        <p className="text-[#A41F2E] text-[12px] font-semibold mb-2.5 text-center leading-snug">{error}</p>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            <span className="font-svn-sub text-[8.5px] text-[#8E6A25] font-semibold uppercase tracking-[0.1em] block leading-none">
                                Total to pay
                            </span>
                            {/* `lining-nums` because Cormorant Garamond defaults
                                to oldstyle figures, which drop the 1, 4, 7 and 9
                                below the baseline. Charming in a heading, wrong
                                in a price. */}
                            <span className="font-svn-head lining-nums text-[22px] font-bold text-[#7A1622] leading-tight">
                                {money(payablePrice)}
                            </span>
                        </div>

                        {/* Retry Payment — shown after a Google Pay timeout / modal dismiss.
                            Reopens the SAME Razorpay order so no second pending booking
                            is created and the webhook can reconcile whichever attempt
                            eventually succeeds. Hidden once the order is gone or
                            the user edits their form (which resets retryOrderData). */}
                        {retryOrderData && !submitting ? (
                            <button
                                onClick={() => {
                                    const RazorpayCtor = (window as any).Razorpay;
                                    if (!RazorpayCtor) {
                                        setError("Payment SDK not loaded. Please refresh and try again.");
                                        return;
                                    }
                                    setError("");
                                    setSubmitting(true);
                                    const rzpRetry = new RazorpayCtor({
                                        key: retryOrderData.razorpayKeyId,
                                        amount: retryOrderData.amountMinor,
                                        currency: retryOrderData.currency,
                                        name: "Pandit Ji At Request",
                                        description: puja.poojaNameEng,
                                        order_id: retryOrderData.razorpayOrderId,
                                        prefill: retryOrderData.prefill,
                                        timeout: 300,
                                        // Same UPI config as the primary checkout — intent
                                        // first, QR fallback for in-app browsers, collect
                                        // last. Keeps the retry path consistent.
                                        config: {
                                            display: {
                                                blocks: {
                                                    upi: {
                                                        name: "Pay via UPI",
                                                        instruments: [{
                                                            method: "upi",
                                                            flows: ["intent", "qr", "collect"],
                                                        }],
                                                    },
                                                },
                                                sequence: ["block.upi"],
                                                preferences: { show_default_blocks: true },
                                            },
                                        },
                                        theme: { color: "#7A1622" },
                                        handler: async (response: any) => {
                                            try {
                                                const verifyRes = await fetch(`${API_URL}/bookings/complete-booking`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "x-event-source-url": window.location.href,
                                                        "x-fbp": readCookie("_fbp"),
                                                        "x-fbc": readCookie("_fbc"),
                                                    },
                                                    body: JSON.stringify(encryptPayload({
                                                        pendingBookingId: retryOrderData.bookingId,
                                                        razorpayOrderId: response.razorpay_order_id,
                                                        razorpayPaymentId: response.razorpay_payment_id,
                                                        razorpaySignature: response.razorpay_signature,
                                                        amountPaid: toInr(totalPrice),
                                                    })),
                                                });
                                                const verifyData = await verifyRes.json();
                                                if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");
                                                if (verifyData.token && verifyData.user) login(verifyData.token, verifyData.user);
                                                const contents = metaContents();
                                                analytics.purchase({
                                                    transactionId: response.razorpay_order_id,
                                                    items: ga4Items(),
                                                    value: toInr(totalPrice),
                                                    currency: "INR",
                                                    meta: {
                                                        event: "Purchase",
                                                        eventId: `puja_purchase_${response.razorpay_order_id}`,
                                                        params: {
                                                            content_name: puja.poojaNameEng,
                                                            content_ids: [puja._id],
                                                            content_type: "product",
                                                            contents,
                                                            num_items: contents.reduce((n, c) => n + c.quantity, 0),
                                                            value: toInr(totalPrice),
                                                            currency: "INR",
                                                        },
                                                    },
                                                });
                                                markCartConverted(retryOrderData.bookingId);
                                                setRetryOrderData(null);
                                                setStep("success");
                                                setTimeout(() => navigate("/account?tab=live"), 2500);
                                            } catch (verifyErr: any) {
                                                setError(verifyErr.message || "Payment verification failed. Please contact support.");
                                            } finally {
                                                setSubmitting(false);
                                            }
                                        },
                                        modal: {
                                            ondismiss: () => {
                                                setError(
                                                    "Payment was not completed. Tap \"Retry Payment\" to try again — " +
                                                    "your booking details are saved."
                                                );
                                                setSubmitting(false);
                                            },
                                        },
                                    });
                                    rzpRetry.on("payment.failed", (resp: any) => {
                                        setError(resp?.error?.description || "Payment failed. Please try again.");
                                        setSubmitting(false);
                                    });
                                    rzpRetry.open();
                                }}
                                className="flex-1 font-svn-ui flex items-center justify-center gap-1.5 bg-[#8E6A25] hover:bg-[#7A5A1E] text-[#FFF8F0] font-bold text-[13px] py-3 rounded-xl border border-[#C79A2B]/60 shadow-[0_6px_16px_-8px_rgba(122,22,34,0.6)] active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#C79A2B] outline-none cursor-pointer"
                            >
                                Retry Payment <ArrowUpRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => { void handleConfirm(); }}
                                disabled={submitting}
                                className="flex-1 font-svn-ui flex items-center justify-center gap-1.5 bg-[#A41F2E] hover:bg-[#87121E] text-[#FFF8F0] font-bold text-[14px] py-3 rounded-xl border border-[#C79A2B]/60 shadow-[0_6px_16px_-8px_rgba(122,22,34,0.9)] active:scale-95 transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#C79A2B] outline-none cursor-pointer"
                            >
                                {submitting ? (
                                    <><span className="w-4 h-4 border-2 border-[#FFF8F0] border-t-transparent rounded-full animate-spin" /> Processing…</>
                                ) : (
                                    <>Book With Devotion <ChevronRight className="w-4 h-4" /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Route slug re-exported for convenience.
export { KASHI_MAHADEV_PUJA_SLUG };
