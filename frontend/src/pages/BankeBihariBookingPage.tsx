import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Check, ChevronRight, Gift, Plus, X, Users, AlertCircle, Sparkles, Flower2 } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { encryptPayload, decryptData } from "../utils/encryption";
import { useAuth } from "../context/AuthContext";
import { useAbandonedCart } from "../utils/useAbandonedCart";
import { useMoney, isValidPhone, shipsPrasad, toStoredPhone } from "../utils/currency";
// import CountryPicker from "../components/checkout/CountryPicker";  // hidden — see the commented block below
import PhoneField from "../components/checkout/PhoneField";
import {
    bankeBihariPuja, BANKE_BIHARI_PUJA_SLUG, BANKE_BIHARI_POOJA_ID,
    EXTRA_FAMILY_MEMBER_PRICE, PRASAD_BOX_PRICE, DEFAULT_PACKAGE_ID, getPackage,
    BANKE_BIHARI_PACKAGES, extraFamilyCount, packageTotal, packageNeedsDelivery,
    canAddPrasadBox, prasadBoxCost, shippedPrasadBox, prasadBoxContents,
    packageCore, packageOfferings, PRASAD_BOXES, type PujaPackageId,
} from "../data/bankeBihariPuja";
import PrasadBoxAddon from "../components/bankeBihari/PrasadBoxAddon";
import PackageUpgradeNudge, { type UpgradeOffer } from "../components/bankeBihari/PackageUpgradeNudge";

type Step = "details" | "success";

/**
 * When the upgrade toast appears after landing on the booking page, and how
 * long it stays.
 *
 * The delay lets the devotee take in the order summary they arrived at first —
 * an offer that lands the instant the page paints reads as a pop-up ad. The
 * lifetime is generous because the toast carries three lines to read and a
 * decision to make, but bounded, because it is positioned over the form and
 * must never be what stands between someone and a field they want to type in.
 */
const UPGRADE_NUDGE_DELAY_MS = 2500;
const UPGRADE_NUDGE_VISIBLE_MS = 11000;

const INPUT =
    "w-full bg-[#FFF2E4] border border-[#F4DFC2] rounded-xl px-4 py-3 text-sm text-[#5C1A34] placeholder-[#8A8A8A] focus:outline-none focus:border-[#D63D72] focus:ring-2 focus:ring-[#F8B5CB] transition-all";
const LABEL = "text-[11px] font-bold text-[#7A3E55] uppercase tracking-wide mb-1.5 block";

// Meta's browser pixel drops _fbp / _fbc; both are forwarded to the server so
// its CAPI Purchase can be matched and deduplicated against the browser event.
function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : "";
}

/** "a", "a & b", "a, b & c" — for naming an upgrade's new items in one line. */
function listify(items: string[]): string {
    if (items.length <= 1) return items[0] ?? "";
    return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}

// Resolve the fixed puja date + a chosen HH:mm into an ISO timestamp.
function resolveBookingDate(dateLabel: string, time: string): string {
    const base = new Date(dateLabel);
    if (isNaN(base.getTime())) return new Date().toISOString();
    const m = time?.match(/(\d{1,2}):(\d{2})/);
    if (m) base.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
    return base.toISOString();
}

export default function BankeBihariBookingPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Where the devotee is paying from — detected on first render, no network
    // call. Every price below goes through `money()`, so switching country
    // re-prices the whole page (and re-shapes the phone + address fields) in a
    // single re-render. Prices themselves never leave INR; see utils/currency.
    const { country, currency, isIndia, money, inr: toInr } = useMoney();

    // Package + prasad-box choice made on the detail page (handed over as
    // navigation state); the devotee can still change both here. Defaults to the
    // recommended package and no box when the booking page is opened directly.
    const handover = location.state as
        | { packageId?: PujaPackageId; addPrasadBox?: boolean }
        | null;
    const [packageId, setPackageId] = useState<PujaPackageId>(handover?.packageId ?? DEFAULT_PACKAGE_ID);
    const [addPrasadBox, setAddPrasadBox] = useState(handover?.addPrasadBox ?? false);
    const selectedPkg = getPackage(packageId);

    // Upgrading to a package that already includes a box free must drop the paid
    // add-on: its control disappears with the upgrade, so leaving the flag set
    // would charge ₹501 the devotee can no longer see or remove.
    /**
     * Blessed prasad is couriered within India only — see `shipsPrasad`.
     *
     * Both the paid add-on AND the shipped box are gated, and they have to be
     * gated separately: the two top tiers bundle a box regardless of the
     * checkbox, so `shippedPrasadBox` returns one for them whether or not
     * anything was ticked. Without the first guard a devotee abroad could be
     * charged ₹501 (the detail page can hand the flag over); without the
     * second they would be shown a delivery step and a courier promise for a
     * parcel that cannot leave the country.
     */
    const prasadShippable = shipsPrasad(country);
    const prasadBoxAdded = prasadShippable && canAddPrasadBox(selectedPkg) && addPrasadBox;
    const shippedBox = prasadShippable ? shippedPrasadBox(selectedPkg, prasadBoxAdded) : null;
    const needsDelivery = prasadShippable && packageNeedsDelivery(selectedPkg, prasadBoxAdded);

    // Static frontend puja data.
    const puja = bankeBihariPuja;

    const [step, setStep] = useState<Step>("details");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Devotee + schedule form
    const [form, setForm] = useState({
        name: "",
        gotra: "",
        phone: "",
        email: "",
        // Janmashtami's main seva is performed around the Nishith Kaal
        // (midnight) muhurat, so the booking is stamped near that hour.
        time: "23:30",
        // Extra people taken during the Sankalp alongside the main devotee.
        // Persisted on the booking as `familyMembers` (the live-mandir branch of
        // the controller already stores this field, and the schema types it as a
        // plain Array, so name+gotra objects are stored as-is). The first
        // `selectedPkg.freeFamilyMembers` are free; each beyond that adds
        // EXTRA_FAMILY_MEMBER_PRICE to the total.
        familyMembers: [] as { name: string; gotra: string }[],
    });

    // The not-yet-added row in the "add family member" box. Devotees routinely
    // type a name here and assume it counted, so this being uncommitted is
    // surfaced loudly in the UI and blocks checkout rather than being dropped.
    const [familyInput, setFamilyInput] = useState({ name: "", gotra: "" });
    const pendingFamilyName = familyInput.name.trim();

    // Delivery address (only required when the package ships something)
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

    // Load saved addresses if logged in and the package ships a physical item.
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
    // free allowance, and the optional prasad box (only on packages that don't
    // already include one free).
    const basePrice = selectedPkg.price;
    const chargedMembers = extraFamilyCount(selectedPkg, form.familyMembers.length);
    const familyCost = chargedMembers * EXTRA_FAMILY_MEMBER_PRICE;
    const prasadCost = prasadBoxCost(selectedPkg, prasadBoxAdded);
    const totalPrice = packageTotal(selectedPkg, form.familyMembers.length, prasadBoxAdded);

    // Everything offered to Bihari Ji at this tier, in the devotee's name.
    const offerings = packageOfferings(selectedPkg);

    // ── One-step upgrade toast ────────────────────────────────────────────
    //
    // The devotee arrives here having already chosen a package on the detail
    // page, so this is the last moment an upgrade is still a decision rather
    // than a regret. It pitches the NEXT tier only and only ONCE per visit:
    // re-offering after a dismissal, or laddering to the tier above after an
    // upgrade, turns a helpful nudge into badgering someone mid-checkout.
    const [upgradeOffer, setUpgradeOffer] = useState<UpgradeOffer | null>(null);
    const upgradeNudged = useRef(false);

    useEffect(() => {
        if (upgradeNudged.current || step !== "details") return;

        // ENTRY TIER ONLY. A devotee who picked ₹5100 or ₹11000 has already
        // weighed the tiers and chosen to spend; interrupting their checkout to
        // sell them the next one up is pestering a decided buyer. The ₹1100
        // package is the one where an upgrade is genuinely likely to be news.
        if (selectedPkg.id !== BANKE_BIHARI_PACKAGES[0].id) return;

        // Packages are ordered cheapest-first, so the first one priced above
        // the current package IS the next rung.
        const next = BANKE_BIHARI_PACKAGES.find((p) => p.price > selectedPkg.price);
        if (!next) return; // already on the top tier

        const timer = setTimeout(() => {
            upgradeNudged.current = true;
            const extraFree = next.freeFamilyMembers - selectedPkg.freeFamilyMembers;
            const newOfferings = packageOfferings(next).filter((o) => !offerings.includes(o));

            // ONE headline, naming the single most tangible thing the upgrade
            // unlocks. A free prasad box beats a longer offerings list every
            // time: it is a parcel that arrives at their door, not an abstraction.
            const nextBox = prasadShippable ? next.freePrasadBox : null;
            const headline = nextBox
                ? canAddPrasadBox(selectedPkg)
                    ? `FREE ${PRASAD_BOXES[nextBox].name} at home`
                    : `Free upgrade to the ${PRASAD_BOXES[nextBox].name}`
                // Names the new items rather than counting them, so it reads
                // against the gold-ringed tiles instead of contradicting them —
                // the row shows five, only two of which are the gain.
                : `Also get ${listify(newOfferings)}`;

            setUpgradeOffer({
                id: next.id,
                name: next.name,
                headline,
                // The upgraded tier's FULL set of offerings, with the new ones
                // ringed. Showing only the additions left the row mostly empty
                // and undersold the package the devotee actually ends up with.
                items: packageOfferings(next),
                highlight: newOfferings,
                // Only what the headline and the tiles don't already show.
                subline:
                    extraFree > 0
                        ? `${extraFree} more family Sankalp${extraFree > 1 ? "s" : ""} free`
                        : undefined,
                diff: next.price - selectedPkg.price,
            });
            window.fbq?.("trackCustom", "PujaUpgradeNudge", {
                from: selectedPkg.id,
                to: next.id,
            });
        }, UPGRADE_NUDGE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [selectedPkg, offerings, step]);

    // Auto-retires so it can never sit on top of the form the devotee is
    // filling in. Long enough to read three gain lines and decide.
    useEffect(() => {
        if (!upgradeOffer) return;
        const timer = setTimeout(() => setUpgradeOffer(null), UPGRADE_NUDGE_VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [upgradeOffer]);

    // What must physically be couriered — appended to the booking name so the
    // WhatsApp/admin/pandit notifications spell out exactly what to pack. The
    // box name alone would be ambiguous between the three tiers, so the contents
    // ride along with it.
    const shipList = shippedBox ? prasadBoxContents(shippedBox.tier) : [];
    const boxLabel = shippedBox
        ? `${shippedBox.name}${selectedPkg.freePrasadBox ? " (free)" : ` (paid add-on ${money(PRASAD_BOX_PRICE)})`}: ${shipList.join(", ")}`
        : "";
    // e.g. "Shree Banke Bihari Ji Janmashtami Mahapuja — Shringar Seva [Premium Prasad Box (free): Dry prasad…]"
    const packageLabel = `${puja.poojaNameEng} — ${selectedPkg.name}${boxLabel ? ` [${boxLabel}]` : ""}`;

    // Line-item breakdown reported to Meta alongside `value`. The package price
    // is the base line; extra Sankalp names (beyond the free allowance) are a
    // separate line — without this, every order looks like one anonymous unit in
    // Events Manager and the higher value can't be reconciled against the price.
    // Ids mirror the ones the server CAPI Purchase sends (built off the booking
    // name) so the deduplicated pair reports identically either way.
    const metaContents = () => [
        { id: packageLabel, quantity: 1, item_price: toInr(basePrice) },
        ...(chargedMembers > 0
            ? [{
                id: `${puja.poojaNameEng} — Extra Sankalp Name`,
                quantity: chargedMembers,
                item_price: toInr(EXTRA_FAMILY_MEMBER_PRICE),
            }]
            : []),
        // Only the PAID box is a line item; the free ones are part of the
        // package price and would double-count the order value here.
        ...(prasadCost > 0
            ? [{
                id: `${puja.poojaNameEng} — Prasad Box`,
                quantity: 1,
                item_price: PRASAD_BOX_PRICE,
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
    const { markCartConverted } = useAbandonedCart("banke-bihari-booking", {
        // Country code included, so a lead from abroad is a number the team can
        // actually dial back rather than a stranded national fragment.
        phone: toStoredPhone(form.phone, country),
        name: form.name,
        gotra: form.gotra,
        email: form.email,
        pujaId: puja._id,
        pujaSlug: BANKE_BIHARI_POOJA_ID,
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
            pujaDate: puja.pujaDate,
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
        // it and charging ₹151 more than the total they were just shown.
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

        // Delivery address is only required when the package ships a physical
        // item (prasad box / tulsi mala / mor pankh).
        let addressPayload: any = null;
        if (needsDelivery) {
            if (user && !showNewAddressForm) {
                if (!selectedAddressId) {
                    setError("Please select a delivery address for your prasad & blessings.");
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
                    setError("Please fill out the full delivery address for your prasad & blessings.");
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
                    // server/src/scripts/seedBankeBihariPuja.ts.
                    pujaSlug: BANKE_BIHARI_POOJA_ID,
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
                    // label every booking "RF_BIHARI_01". Carries the chosen
                    // package + perks so the team knows what to courier.
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
                        extraFamilyMemberPrice: EXTRA_FAMILY_MEMBER_PRICE,
                        prasadBox: shippedBox ? {
                            added: true,
                            free: Boolean(selectedPkg.freePrasadBox),
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
                    // package or added as the paid ₹501 option.
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
                theme: { color: "#D63D72" },
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
            console.error("[BankeBihariBooking] booking failed:", err);
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="bbb-page min-h-screen bg-[#FFF9F2] w-full max-w-md mx-auto border-x border-[#F4DFC2] relative pb-28">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .bbb-page { font-family: 'DM Sans', sans-serif; }
                .bbb-serif { font-family: 'Cormorant Garamond', serif; }
            `}</style>
            <Helmet>
                <title>{`Complete your booking — ${puja.poojaNameEng} | Pandit Ji At Request`}</title>
            </Helmet>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#FFF9F2]/95 backdrop-blur-md border-b border-[#F4DFC2] px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => (location.key !== "default" ? navigate(-1) : navigate(`/${BANKE_BIHARI_PUJA_SLUG}`))}
                    aria-label="Go back"
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#F4DFC2] shadow-sm active:scale-90 transition-transform shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 text-[#5C1A34]" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-bold text-[#5C1A34] leading-tight truncate">Complete Your Janmashtami Seva</h1>
                    <p className="text-[11px] text-[#7A3E55] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D63D72] shrink-0" />
                        <span className="truncate">{puja.templeName} · {puja.templeLocation}</span>
                    </p>
                </div>
            </div>

            {/* One-step upgrade toast. Swipe or ✕ to dismiss; upgrading swaps
                the package and every price on the page follows from that. */}
            <PackageUpgradeNudge
                offer={upgradeOffer}
                onUpgrade={() => {
                    if (!upgradeOffer) return;
                    setPackageId(upgradeOffer.id);
                    setUpgradeOffer(null);
                    window.fbq?.("trackCustom", "PujaPackageUpgrade", {
                        to: upgradeOffer.id,
                        value: getPackage(upgradeOffer.id).price,
                        currency: "INR",
                        source: "nudge",
                    });
                }}
                onDismiss={() => setUpgradeOffer(null)}
            />

            {/* Janmashtami occasion ribbon — peacock green & gold */}
            <div className="bg-gradient-to-r from-[#1F7A50] via-[#2E8B57] to-[#1F7A50] text-center py-2 px-4 border-y border-[#E7B63A]/40">
                <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-[#F6D36A]">
                    {puja.occasion} · {puja.pujaDate} · ॐ नमो भगवते वासुदेवाय
                </p>
            </div>

{/* Currency switcher — HIDDEN. The country is resolved automatically from
    the visitor's IP on the server, so there is no manual override on
    screen. Left here, commented, so bringing it back is one uncomment
    (plus its import above).
                <div className="flex items-center justify-between gap-2 px-5 py-2 border-b border-[#F4DFC2] bg-[#FFF2E4]">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7A3E55]">
                        Paying from
                    </span>
                    <CountryPicker
                        className="bg-white border border-[#F4DFC2] text-[#5C1A34] hover:border-[#D63D72]"
                        accentClass="text-[#D63D72]"
                    />
                </div>
*/}

            {/* Content */}
            <div className="px-5 pt-4 space-y-6">
                {step === "details" ? (
                    <div className="space-y-6">
                        {/* Order summary — reflects the chosen package + extras */}
                        <div className="bg-white border border-[#F4DFC2] rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,.07)]">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[13.5px] font-bold text-[#5C1A34] leading-snug">{puja.poojaNameEng}</p>
                                    <p className="text-[11px] text-[#D63D72] font-semibold mt-0.5">{selectedPkg.name} package</p>
                                </div>
                                <span className="flex items-center gap-1 shrink-0 bg-[#FFF2E4] border border-[#E7B63A]/40 text-[#5C1A34] rounded-full px-2 py-0.5 text-[11px] font-bold">
                                    ★ {puja.rating}
                                </span>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-[#F4DFC2] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12.5px] text-[#555555] font-medium">{selectedPkg.name}</span>
                                    <span className="text-[13px] font-bold text-[#5C1A34]">{money(basePrice)}</span>
                                </div>

                                {/* Offerings made in your name — shown as "Included"
                                    so the value of the tier is visible on the bill. */}
                                {offerings.length > 0 && (
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[12px] text-[#555555] font-medium flex items-start gap-1.5 min-w-0">
                                            <Flower2 className="w-3.5 h-3.5 text-[#2E8B57] shrink-0 mt-0.5" />
                                            <span className="leading-snug">{offerings.join(", ")} offered in your name</span>
                                        </span>
                                        <span className="text-[11px] font-bold text-[#2E8B57] shrink-0">Included</span>
                                    </div>
                                )}

                                {/* Prasad box — free with the tier, a priced line
                                    when it was opted into, and explicitly "Not
                                    added" otherwise so its absence is never a
                                    silent surprise at delivery time. Outside
                                    India there is no line at all: the parcel is
                                    not sold there, and a greyed-out row would
                                    only raise a question the bill cannot answer. */}
                                {prasadShippable && (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] text-[#555555] font-medium flex items-center gap-1.5 min-w-0">
                                        <Gift className="w-3.5 h-3.5 text-[#E7B63A] shrink-0" />
                                        <span className="truncate">{shippedBox ? shippedBox.name : "Prasad Box"}</span>
                                    </span>
                                    {selectedPkg.freePrasadBox ? (
                                        <span className="text-[11px] font-bold text-[#2E8B57] shrink-0">Free</span>
                                    ) : prasadCost > 0 ? (
                                        <span className="text-[13px] font-bold text-[#5C1A34] shrink-0">+{money(prasadCost)}</span>
                                    ) : (
                                        <span className="text-[11px] font-semibold text-[#8A8A8A] shrink-0">Not added</span>
                                    )}
                                </div>
                                )}

                                {selectedPkg.freeFamilyMembers > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-[#555555] font-medium flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[#E7B63A]" />
                                            {selectedPkg.freeFamilyMembers} family Sankalp
                                        </span>
                                        <span className="text-[11px] font-bold text-[#2E8B57]">Free</span>
                                    </div>
                                )}

                                {chargedMembers > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#555555] font-medium flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-[#D63D72]" />
                                            Extra Sankalp × {chargedMembers}
                                        </span>
                                        <span className="text-[13px] font-bold text-[#5C1A34]">+{money(familyCost)}</span>
                                    </div>
                                )}

                                <div className="flex items-baseline justify-between pt-2 border-t border-[#F4DFC2]">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8A8A]">Total</span>
                                    <span className="text-xl font-extrabold text-[#D63D72]">{money(totalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* The stack of upgrade cards that stood here — one per
                            package above the chosen one — is now a single toast
                            for the NEXT tier only, rendered near the bottom of
                            this file. Inline, it sat between the devotee and the
                            form they came to fill in, and pitched every higher
                            tier at once. */}

                        {/* Step 1: Devotee Details */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#F4DFC2]">
                                <span className="w-7 h-7 rounded-full bg-[#FFF1F5] border border-[#F8B5CB] text-[#D63D72] flex items-center justify-center font-bold text-sm">01</span>
                                <div>
                                    <h3 className="font-bold text-[#5C1A34] text-[14px]">Devotee Details</h3>
                                    <p className="text-[11px] text-[#8A8A8A]">For the main Sankalp</p>
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
                                        prefixClass="text-[#D63D72]"
                                    />
                                    <p className="text-[10.5px] text-[#8A8A8A] mt-1">
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

                        {/* Step 2: Family Sankalp — free up to the package allowance, then ₹151 each */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#F4DFC2]">
                                <span className="w-7 h-7 rounded-full bg-[#FFF1F5] border border-[#F8B5CB] text-[#D63D72] flex items-center justify-center font-bold text-sm">02</span>
                                <div>
                                    <h3 className="font-bold text-[#5C1A34] text-[14px]">Family Sankalp</h3>
                                    <p className="text-[11px] text-[#8A8A8A]">
                                        {selectedPkg.freeFamilyMembers > 0
                                            ? `${selectedPkg.freeFamilyMembers} free in ${selectedPkg.name} · ${money(EXTRA_FAMILY_MEMBER_PRICE)} each after`
                                            : `Optional · add members at ${money(EXTRA_FAMILY_MEMBER_PRICE)} each`}
                                    </p>
                                </div>
                            </div>

                            {/* Free-allowance meter — reassures the devotee how many
                                of the package's free Sankalps are still available. */}
                            {selectedPkg.freeFamilyMembers > 0 && (
                                <div className="flex items-center gap-1.5 bg-[#EDF9F0] border border-[#A7D8B6] rounded-xl px-3 py-2 text-[11.5px] font-semibold text-[#1F7A50]">
                                    <Sparkles className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />
                                    {Math.max(0, selectedPkg.freeFamilyMembers - form.familyMembers.length) > 0
                                        ? `${Math.max(0, selectedPkg.freeFamilyMembers - form.familyMembers.length)} free family Sankalp${Math.max(0, selectedPkg.freeFamilyMembers - form.familyMembers.length) > 1 ? "s" : ""} left in your package`
                                        : `Free members used — extra names add ${money(EXTRA_FAMILY_MEMBER_PRICE)} each`}
                                </div>
                            )}

                            {/* Name + gotra for the person being added. The row is
                                only committed by the Add button (or Enter), so it is
                                framed as a draft — pink border and an explicit
                                "not added yet" warning — until it is. */}
                            <div
                                className={`rounded-2xl border p-3 space-y-2.5 transition-colors ${
                                    pendingFamilyName ? "border-[#D63D72] bg-[#FFF1F5]" : "border-[#F4DFC2] bg-white"
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
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E63B74] to-[#FF6A88] hover:from-[#D22E65] hover:to-[#F04B73] disabled:from-[#F4DFC2] disabled:to-[#F4DFC2] disabled:text-[#8A8A8A] text-white font-bold text-[13px] py-2.5 transition-all active:scale-95 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    {pendingFamilyName
                                        ? `Add ${pendingFamilyName} · ${form.familyMembers.length < selectedPkg.freeFamilyMembers ? "FREE" : `+${money(EXTRA_FAMILY_MEMBER_PRICE)}`}`
                                        : "Add member"}
                                </button>

                                {/* The whole point of this block: make "typed but not
                                    added" impossible to mistake for "added". */}
                                {pendingFamilyName && (
                                    <p className="flex items-start gap-1.5 text-[11px] font-semibold text-[#D63D72] leading-snug">
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
                                            className="flex items-center gap-2 bg-[#FFF2E4] border border-[#F4DFC2] rounded-xl px-3 py-2"
                                        >
                                            <Check className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" strokeWidth={3} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12.5px] font-bold text-[#5C1A34] truncate">{m.name}</p>
                                                <p className="text-[10.5px] text-[#8A8A8A] truncate">
                                                    Gotra: {m.gotra || "Kashyap (default)"}
                                                </p>
                                            </div>
                                            {idx < selectedPkg.freeFamilyMembers ? (
                                                <span className="text-[11px] font-bold text-[#2E8B57] shrink-0">FREE</span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-[#D63D72] shrink-0">+{money(EXTRA_FAMILY_MEMBER_PRICE)}</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFamilyMember(idx)}
                                                aria-label={`Remove ${m.name}`}
                                                className="text-[#8A8A8A] hover:text-[#D63D72] transition-colors shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {form.familyMembers.length > 0 && (
                                <p className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A]">
                                    <Users className="w-3.5 h-3.5 text-[#D63D72] shrink-0" />
                                    {form.familyMembers.length} member{form.familyMembers.length > 1 ? "s" : ""} added
                                    {chargedMembers > 0 ? ` · +${money(familyCost)}` : " · all free"}
                                </p>
                            )}
                        </div>

                        {/* Step 3: Prasad Box — the paid opt-in on the ₹1100/₹2100
                            packages, and a read-only "already free" confirmation on
                            the two higher ones. Rendered in both cases so the step
                            numbering is stable and nobody has to wonder whether
                            they missed a prasad option.

                            Outside India the whole step is replaced by a single
                            line saying so. Said once, plainly, up front — a
                            devotee in Sydney who read "prasad couriered home" on
                            the detail page must not have to wonder where the
                            option went, and must never be charged for it. */}
                        {!prasadShippable ? (
                            <div className="flex items-start gap-2.5 rounded-2xl border border-[#F4DFC2] bg-[#FFF2E4] px-3.5 py-3">
                                <Gift className="w-4 h-4 text-[#E7B63A] shrink-0 mt-px" />
                                <p className="text-[11.5px] text-[#7A3E55] leading-snug">
                                    <b className="text-[#5C1A34]">Prasad box ships within India only.</b>{" "}
                                    It is not part of your total, and no delivery address is
                                    needed. Your seva, Sankalp and video are unaffected —
                                    the recording reaches you on WhatsApp as usual.
                                </p>
                            </div>
                        ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#F4DFC2]">
                                <span className="w-7 h-7 rounded-full bg-[#FFF1F5] border border-[#F8B5CB] text-[#D63D72] flex items-center justify-center font-bold text-sm">03</span>
                                <div>
                                    <h3 className="font-bold text-[#5C1A34] text-[14px]">Prasad Box</h3>
                                    <p className="text-[11px] text-[#8A8A8A]">
                                        {selectedPkg.freePrasadBox
                                            ? `Included free with ${selectedPkg.name}`
                                            : `${money(PRASAD_BOX_PRICE)} · blessed prasad couriered to your home`}
                                    </p>
                                </div>
                            </div>
                            <PrasadBoxAddon
                                pkg={selectedPkg}
                                added={prasadBoxAdded}
                                onToggle={(next) => {
                                    setAddPrasadBox(next);
                                    if ((window as any).fbq) {
                                        (window as any).fbq("trackCustom", "PujaPrasadBoxToggle", {
                                            added: next,
                                            package: selectedPkg.id,
                                            value: PRASAD_BOX_PRICE,
                                            currency: "INR",
                                        });
                                    }
                                }}
                            />
                        </div>
                        )}

                        {/* Step 4: Delivery Address — only when a box actually ships
                            (bundled free, or the ₹501 add-on opted into). Without a
                            box there is nothing to courier, so this step is hidden. */}
                        {needsDelivery && (
                        <div className="space-y-3 pb-6">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-[#F4DFC2]">
                                <span className="w-7 h-7 rounded-full bg-[#FFF1F5] border border-[#F8B5CB] text-[#D63D72] flex items-center justify-center font-bold text-sm">04</span>
                                <div>
                                    <h3 className="font-bold text-[#5C1A34] text-[14px]">Delivery Address</h3>
                                    <p className="text-[11px] text-[#8A8A8A]">Where we courier your {shippedBox?.name}</p>
                                </div>
                            </div>

                            {/* Exactly what is in the box being shipped, so the
                                address is being given for something concrete. */}
                            {/* <div className="bg-[#EDF9F0] border border-[#A7D8B6] rounded-2xl p-3.5">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#1F7A50] mb-2">
                                    Couriered to your home · {shippedBox?.name}
                                </p>
                                <ItemTileRow items={shipList} tone="green" />
                            </div> */}

                            {user && addresses.length > 0 && !showNewAddressForm && (
                                <div className="space-y-2">
                                    <p className={LABEL}>Select Delivery Address</p>
                                    {addresses.map((addr) => (
                                        <label
                                            key={addr._id}
                                            className={`flex items-start gap-3 bg-white border rounded-2xl p-3.5 shadow-xs cursor-pointer transition-all ${selectedAddressId === addr._id ? "border-[#D63D72] bg-[#FFF1F5]" : "border-[#F4DFC2]"}`}
                                        >
                                            <input
                                                type="radio"
                                                name="addressSelect"
                                                checked={selectedAddressId === addr._id}
                                                onChange={() => setSelectedAddressId(addr._id)}
                                                className="mt-1 text-[#D63D72] focus:ring-[#D63D72] border-[#F4DFC2]"
                                            />
                                            <div className="text-[12.5px] text-[#555555] leading-relaxed">
                                                <span className="font-bold text-[11px] text-[#D63D72] uppercase tracking-wider block mb-0.5">{addr.addressName || addr.saveAs}</span>
                                                {addr.addressLine1 || addr.houseNo}, {addr.addressLine2 || addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                            </div>
                                        </label>
                                    ))}
                                    <button
                                        onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                                        className="text-[#D63D72] hover:text-[#B92C5C] text-xs font-bold pt-1 block cursor-pointer"
                                    >
                                        + Add New Address
                                    </button>
                                </div>
                            )}

                            {(!user || showNewAddressForm) && (
                                <div className="bg-white border border-[#F4DFC2] rounded-2xl p-4 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-[#F4DFC2]">
                                        <span className="text-[12px] font-bold text-[#5C1A34]">Delivery Address Details</span>
                                        {user && addresses.length > 0 && (
                                            <button
                                                onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(addresses[0]._id); }}
                                                className="text-[#8A8A8A] hover:text-[#555555] text-xs font-medium cursor-pointer"
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
                                            aria-describedby="bihari-country-hint"
                                            className={`${INPUT} opacity-70 cursor-not-allowed`}
                                        />
                                        <p id="bihari-country-hint" className="text-[10.5px] text-[#8A8A8A] mt-1">
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
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1F7A50] to-[#2E8B57] border border-[#E7B63A]/50 flex items-center justify-center shadow-xl shadow-[#2E8B57]/25"
                        >
                            <Check className="w-10 h-10 text-[#F6D36A]" strokeWidth={3} />
                        </motion.div>
                        <h3 className="bbb-serif font-bold text-[#5C1A34] mt-5 text-2xl">
                            Booking Confirmed! 🙏
                        </h3>
                        <p className="text-[13px] text-[#555555] mt-2 max-w-[280px] leading-relaxed">
                            Your <span className="font-semibold text-[#5C1A34]">{puja.poojaNameEng}</span> at <span className="font-semibold text-[#5C1A34]">{puja.templeName}</span> is booked for <span className="font-semibold text-[#5C1A34]">{puja.pujaDate}</span>. Our team will WhatsApp you the puja video with your name &amp; gotra shortly.
                        </p>
                        <p className="text-[13px] font-serif font-bold text-[#D63D72] mt-3">ॐ नमो भगवते वासुदेवाय</p>
                        <button onClick={() => navigate("/account?tab=live")} className="mt-6 w-full bg-gradient-to-r from-[#E63B74] to-[#FF6A88] text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform cursor-pointer">
                            Done
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Sticky Footer */}
            {step !== "success" && (
                <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-[#F4DFC2] px-5 py-4">
                    {error && (
                        <p className="text-[#B92C5C] text-[12px] font-semibold mb-3 text-center">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-[#8A8A8A] font-semibold uppercase block">TOTAL TO PAY</span>
                            <span className="text-[20px] font-extrabold text-[#D63D72]">{money(totalPrice)}</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-[#E63B74] to-[#FF6A88] hover:from-[#D22E65] hover:to-[#F04B73] text-white font-bold text-[14px] px-8 py-3.5 rounded-full shadow-lg shadow-[#D63D72]/25 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
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
export { BANKE_BIHARI_PUJA_SLUG };
