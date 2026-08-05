// ─────────────────────────────────────────────────────────────────────────
//  Shree Mahakaleshwar Rudrabhishek Mahapuja — FRONTEND-ONLY puja detail data.
//
//  This is an ONLINE puja: the puja is performed on the devotee's behalf by
//  verified pandits at Shri Mahakaleshwar Jyotirlinga Temple (Ujjain, Madhya
//  Pradesh) on the LAST SAVAN SOMWAR — Monday, 24 August 2026. The devotee
//  receives the puja video (with their name & gotra) on WhatsApp and can
//  optionally have blessed prasad couriered home. Nobody visits the
//  devotee's home.
//
//  ⚠️  FILE NAME. This file is still called kashiMahadevPuja.ts and still
//      exports KASHI_MAHADEV_*. The page it feeds moved from Kashi Vishwanath
//      to Mahakaleshwar; the identifiers were left alone on purpose so the
//      pivot stayed a content diff rather than a rename across eight import
//      sites and the server seed script. Read them as "the Savan Mahadev
//      puja", not as a claim about the temple — the temple is `templeName`
//      below.
//
//  Shaped like a backend pooja document so it can be handed straight to the
//  dedicated page — no fetch-by-id call is made for the CONTENT.
//
//  BACKEND LINK
//  ────────────
//  The page CONTENT is frontend-only, but a booking has to resolve to a real
//  Pooja document — the server stamps that row's `poojaNameEng` onto the
//  booking, the WhatsApp/email confirmation, the pandit notification, the
//  admin record and the referral entry.
//
//  This puja has its OWN catalog row, keyed on `poojaID: "RF_SAVAN_01"` and
//  created by server/src/scripts/seedKashiMahadevPuja.ts. The booking page
//  sends that string as `pujaSlug`; the server resolves it via
//  `Pooja.findOne({ poojaID: pujaSlug })`. No Mongo `_id` is hardcoded, so one
//  build works against both the dev and production clusters.
//
//  ⚠️  Run the seed script once per cluster before taking bookings there.
//      Without the row, the controller's last-resort fallback grabs an
//      arbitrary active pooja and bookings are misreported.
//
//  Remove the feature by deleting:
//    • this file
//    • frontend/src/pages/SavanPujaPage.tsx
//    • frontend/src/pages/SavanPujaBookingPage.tsx
//    • server/src/scripts/seedKashiMahadevPuja.ts
//    • the SavanPujaPage routes + lazy imports in App.tsx
// ─────────────────────────────────────────────────────────────────────────

/**
 * Route slug for the dedicated page (matches the route in App.tsx).
 *
 * This is the CANONICAL url — the sitemap entry, the pre-rendered route shell,
 * `<link rel=canonical>` and `og:url` all read it from here. The page used to
 * live at `/kashi-mahadev-savan-puja` and moved here when the puja moved to
 * Ujjain; that older slug is still routed, as a redirect onto this one, so ad
 * links and WhatsApp shares already in the wild keep landing. Never delete a
 * slug this list has ever held — demote it to a redirect in App.tsx.
 */
export const KASHI_MAHADEV_PUJA_SLUG = "mahakaal-savan-somwar-puja";

/**
 * Stable catalog key for this puja — the `poojaID` field on the backend Pooja
 * document, seeded by server/src/scripts/seedKashiMahadevPuja.ts.
 *
 * The booking page sends this as `pujaSlug`, and the server resolves the row
 * via `Pooja.findOne({ poojaID: pujaSlug })`. Keying on this string instead of
 * a Mongo `_id` means one frontend build works against both the dev and
 * production clusters, where the same puja has different `_id`s.
 */
export const KASHI_MAHADEV_POOJA_ID = "RF_SAVAN_01";

/** Add-on price for the optional blessed prasad box (₹). */
export const PRASAD_BOX_PRICE = 298;

/**
 * Free 5 Mukhi Rudraksh bracelet that ships inside the prasad box — the gift
 * teased on the landing page and promised on the booking page's prasad
 * add-on. It has no line of its own in the total: it rides along with
 * PRASAD_BOX_PRICE, so the two are only ever offered together.
 *
 * Same product shot the Kaal Bhairav packages use (see data/kaalBhairavPuja.ts)
 * so the pages can never drift to different bracelets. Both Savan pages import
 * it from here rather than keeping their own copy of the URL.
 */
export const RUDRAKSH_BRACELET_IMAGE =
    "https://vedicshop.store/cdn/shop/files/5_mukhi_rudraksha_bracelet.jpg?v=1774855990&width=1200";

/**
 * Per-person price for adding a family member to the Sankalp (₹).
 * Each name added is taken during the Sankalp alongside the main devotee, and
 * adds this much to the booking total. Matches the Live Mandir flow's rate.
 */
export const FAMILY_MEMBER_PRICE = 101;

/**
 * LAST Savan Somwar of Shravan 2026 — Monday, 24 August 2026.
 *
 * Shravan runs 30 Jul – 28 Aug 2026, so its Mondays are 3, 10, 17 and 24
 * August; the 24th is the final one and the day this puja is performed.
 *
 * The landing page's countdown ticks off `pujaDate`, and the booking stamps it
 * as the booking date, so this string is the single source for both. It is
 * parsed with `new Date(...)` — keep the "Month D, YYYY" shape.
 */
export const LAST_SAVAN_SOMWAR = "August 24, 2026";

// ── Prasad box ────────────────────────────────────────────────────────────
//
// Two nested boxes. The higher tier contains EVERYTHING in the one below it
// plus its own `adds` — so the contents are declared once and never repeated,
// and the UI can render either "what this box adds" or the full flattened list
// (`prasadBoxContents`) without the two drifting apart.
//
//   standard — what ₹851 may add for PRASAD_BOX_PRICE
//   chalisa  — the same box plus the Shiv Chalisa; the ₹1500 add-on, and the
//              box that rides FREE with ₹2100
//
// Which tier applies is a property of the chosen package (`prasadBoxTier`),
// and whether it is free is `prasadBoxFree` — see SAVAN_PACKAGES below.

export type PrasadBoxTier = "standard" | "chalisa";

export interface PrasadBox {
    tier: PrasadBoxTier;
    /** Name shown on the card / booking summary. */
    name: string;
    /** The lower box whose full contents this one also contains. */
    inherits?: PrasadBoxTier;
    /** Items this tier ADDS on top of `inherits`. */
    adds: string[];
}

export const PRASAD_BOXES: Record<PrasadBoxTier, PrasadBox> = {
    standard: {
        tier: "standard",
        name: "Prasad Box",
        // The Rudraksh bracelet has always ridden inside the box rather than
        // carrying a price of its own — see RUDRAKSH_BRACELET_IMAGE above — so
        // it is listed as box contents, not as a separate line on the bill.
        adds: ["Dry Prasad", "Rudraksh Bracelet"],
    },
    chalisa: {
        tier: "chalisa",
        name: "Prasad Box + Shiv Chalisa",
        inherits: "standard",
        adds: ["Shiv Chalisa"],
    },
};

/** Every item inside a box, inherited tiers first. */
export function prasadBoxContents(tier: PrasadBoxTier): string[] {
    const box = PRASAD_BOXES[tier];
    return box.inherits ? [...prasadBoxContents(box.inherits), ...box.adds] : [...box.adds];
}

/**
 * ▶ PASTE PRODUCT PHOTOS HERE ◀
 *
 * Artwork for every physical item named in this file — the prasad-box contents
 * above and the `addedOfferings` on the packages below. Keys must match those
 * strings EXACTLY; a missing or empty entry is not a bug, the tile renders a
 * tinted icon instead, so the page ships fine before the photos land and
 * improves item by item as they arrive.
 *
 * Square crops look best — they are drawn at ~56 px and served through the
 * resizer, so anything above ~200 px wide is wasted bytes.
 */
export const ITEM_IMAGES: Record<string, string> = {
    // ── Offered to Mahadev during the Rudrabhishek ──
    Milk: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/milk.png",
    Gangajal:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/Ganga%20jal.webp",
    "Bel Patra":
        "https://png.pngtree.com/png-clipart/20230617/ourmid/pngtree-nature-green-leaf-transparent-image-png-image_7153754.png",
    Panchamrit: "https://www.funfoodfrolic.com/wp-content/uploads/2023/09/Panchamrit-Blog.jpg",
    Flowers: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/flowers.png",
    Bhang: "https://www.planetayurveda.com/pa-wp-images/cannabis-sativa.jpg",
    Dhatura: "https://m.media-amazon.com/images/I/515CXvq2YzL._AC_UF350,350_QL80_.jpg",
    // Same itra shot the Banke Bihari packages use (data/bankeBihariPuja.ts),
    // so the two pujas can never drift to different bottles.
    "Itra Seva":
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/itra.png",
    "1008 Naam Jaap":
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/naam.png",
    "Rudri Path":
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/book.jpeg",
    // ── Prasad box contents ──
    "Dry Prasad":
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Prasad.webp",
    "Rudraksh Bracelet": RUDRAKSH_BRACELET_IMAGE,
    "Shiv Chalisa": "https://vedicshop.store/cdn/shop/files/201.png?v=1774530024&width=1200",
};

// ── Packages ──────────────────────────────────────────────────────────────

export type SavanPackageId = "rudrabhishek" | "somwar" | "rudri";

export interface SavanPackage {
    id: SavanPackageId;
    /** Package name shown on the card. */
    name: string;
    /** One-line positioning under the name. */
    tagline: string;
    /** Package price in ₹ (the booking's base amount). */
    price: number;
    /**
     * The cheaper package this one fully contains. Drives the cumulative
     * offerings list, so each package only ever declares what it ADDS.
     */
    inherits?: SavanPackageId;
    /** The core seva every package includes — declared on the base package only. */
    core?: string[];
    /** Offerings this tier ADDS to the Rudrabhishek, in your name. */
    addedOfferings: string[];
    /** How many family-member Sankalps are included free in this package. */
    freeFamilyMembers: number;
    /** Which prasad box this package offers. */
    prasadBoxTier: PrasadBoxTier;
    /**
     * True when that box costs ₹0 at this tier; false when adding it costs
     * PRASAD_BOX_PRICE.
     *
     * Free does NOT mean automatic. The box is ALWAYS an opt-in on the booking
     * page — a devotee on the top tier who never ticks it is not shipped one,
     * because a parcel nobody asked for still needs an address and still gets
     * packed and couriered.
     */
    prasadBoxFree: boolean;
    /**
     * The one prasad line this package's CARD is allowed to say, or undefined
     * for a card that says nothing about the box at all.
     *
     * The box is chosen on the booking page, so the cards only carry what makes
     * the tiers different — a control here would be a second place to decide the
     * same thing, and the entry tier has nothing to advertise.
     */
    prasadNote?: string;
    /** Optional corner badge, e.g. "Most Popular". */
    badge?: string;
}

/**
 * The three booking packages, cheapest first.
 *
 * Each tier is strictly a superset of the one below it (`inherits`), so it only
 * declares what it ADDS — the UI renders the cumulative list. That keeps the
 * three cards honest by construction: an offering can never appear on ₹1500 and
 * go missing on ₹2100.
 *
 * Two things are billed on top of the package price, and BOTH are chosen on the
 * booking page rather than here:
 *   • family Sankalps beyond `freeFamilyMembers` — FAMILY_MEMBER_PRICE each
 *   • the prasad box — PRASAD_BOX_PRICE, or ₹0 where `prasadBoxFree`
 */
export const SAVAN_PACKAGES: SavanPackage[] = [
    {
        id: "rudrabhishek",
        name: "Rudrabhishek Seva",
        tagline: "The essential Savan Somwar abhishek",
        price: 851,
        core: [
            "Rudrabhishek performed in your name at Mahakal, Ujjain",
            "Personalised Sankalp with your name & gotra",
            "Full puja video shared on WhatsApp",
        ],
        // Declared on the BASE package, so every tier inherits them — this is
        // the list "offered in all packages". Abhishek liquids first, then what
        // is laid on the Shivling after.
        addedOfferings: ["Milk", "Gangajal", "Panchamrit", "Bel Patra", "Flowers"],
        freeFamilyMembers: 0,
        prasadBoxTier: "standard",
        prasadBoxFree: false,
        // Names what is IN the box rather than what it costs — the price is
        // stated once under the card list, and the bracelet is the thing worth
        // knowing about here. Matches the "standard" tier's contents above.
        prasadNote: "Prasad box includes a Rudraksh bracelet",
    },
    {
        id: "somwar",
        name: "Savan Somwar Seva",
        tagline: "Most-loved · 2 family Sankalps free",
        price: 1500,
        inherits: "rudrabhishek",
        // Itra Seva is declared here rather than on ₹2100 as well: the top tier
        // inherits this package, so naming it once is what makes it appear in
        // both without any chance of the two lists disagreeing.
        addedOfferings: ["Bhang", "Dhatura", "Itra Seva", "1008 Naam Jaap"],
        freeFamilyMembers: 2,
        // Same ₹298 box as the base package, but the Shiv Chalisa is packed
        // inside it free at this tier and above.
        prasadBoxTier: "chalisa",
        prasadBoxFree: false,
        // The Shiv Chalisa is what this tier's box adds over the one below —
        // see the "chalisa" box above — so it is named alongside the bracelet.
        prasadNote: "FREE Rudraksh bracelet & Shiv Chalisa inside your prasad box",
        badge: "Most Popular",
    },
    {
        id: "rudri",
        name: "Rudri Path Mahaseva",
        tagline: "The complete seva · free prasad box",
        price: 2100,
        inherits: "somwar",
        addedOfferings: ["Rudri Path"],
        freeFamilyMembers: 3,
        prasadBoxTier: "chalisa",
        prasadBoxFree: true,
        prasadNote: `FREE prasad box — no ₹${PRASAD_BOX_PRICE} charge`,
        badge: "Best Value",
    },
];

/**
 * The package pre-selected on first load — the recommended middle tier, the
 * one wearing the "Most Popular" badge.
 *
 * ⚠️  This is what the sticky pay bar quotes the moment the page paints, and
 *     what ViewContent reports. Any ad creative promising a price has to name
 *     THIS one, or the devotee lands on a button that contradicts the ad they
 *     tapped. Set it back to "rudrabhishek" if the campaign goes out on ₹851.
 */
export const DEFAULT_PACKAGE_ID: SavanPackageId = "somwar";

/** Resolve a package by id, falling back to the first (cheapest) package. */
export function getPackage(id: SavanPackageId | undefined): SavanPackage {
    return SAVAN_PACKAGES.find((p) => p.id === id) || SAVAN_PACKAGES[0];
}

/** The core seva shared by every package (declared on the base package). */
export function packageCore(pkg: SavanPackage): string[] {
    return pkg.core ?? (pkg.inherits ? packageCore(getPackage(pkg.inherits)) : []);
}

/** Everything offered to Mahadev in your name at this tier, cheapest tier first. */
export function packageOfferings(pkg: SavanPackage): string[] {
    return pkg.inherits
        ? [...packageOfferings(getPackage(pkg.inherits)), ...pkg.addedOfferings]
        : [...pkg.addedOfferings];
}

/** The box this package offers, whether free or paid. */
export function packagePrasadBox(pkg: SavanPackage): PrasadBox {
    return PRASAD_BOXES[pkg.prasadBoxTier];
}

/** Family members that fall OUTSIDE the package's free allowance (charged). */
export function extraFamilyCount(pkg: SavanPackage, familyCount: number): number {
    return Math.max(0, familyCount - pkg.freeFamilyMembers);
}

/**
 * The prasad-box line on the bill — ₹0 unless a PAID box was added. The top
 * tier's box is free, so ticking it there changes what ships, not the total.
 */
export function prasadBoxCost(pkg: SavanPackage, prasadBoxAdded: boolean): number {
    return prasadBoxAdded && !pkg.prasadBoxFree ? PRASAD_BOX_PRICE : 0;
}

/** Booking total = package price + chargeable extra Sankalps + optional prasad box. */
export function packageTotal(
    pkg: SavanPackage,
    familyCount: number,
    prasadBoxAdded = false,
): number {
    return (
        pkg.price +
        extraFamilyCount(pkg, familyCount) * FAMILY_MEMBER_PRICE +
        prasadBoxCost(pkg, prasadBoxAdded)
    );
}

/**
 * The box actually being shipped for this booking, if any.
 *
 * Opt-in at EVERY tier, free ones included: a devotee who never ticks the box
 * is not shipped one and is never asked for a delivery address. That is why the
 * top tier's free box is worded as "no ₹298 charge" rather than "included".
 */
export function shippedPrasadBox(
    pkg: SavanPackage,
    prasadBoxAdded: boolean,
): PrasadBox | null {
    return prasadBoxAdded ? packagePrasadBox(pkg) : null;
}

/** Whether this booking ships something and therefore needs a delivery address. */
export function packageNeedsDelivery(pkg: SavanPackage, prasadBoxAdded = false): boolean {
    return shippedPrasadBox(pkg, prasadBoxAdded) !== null;
}

/**
 * The puja shaped exactly like a backend pooja document so it can be handed
 * straight to the detail page UI and to the booking / enquiry flows.
 */
export const kashiMahadevPuja = {
    // Not a Mongo _id — the booking resolves the catalog row by `pujaSlug`
    // instead (see KASHI_MAHADEV_POOJA_ID). This value is only used as an
    // analytics content id and as the enquiry-form reference, both of which
    // also carry the puja name, so a stable string is fine here.
    _id: KASHI_MAHADEV_POOJA_ID,
    poojaID: KASHI_MAHADEV_POOJA_ID,
    poojaNameEng: "Shree Mahakaleshwar Rudrabhishek Mahapuja",
    poojaNameHindi: "श्री महाकालेश्वर रुद्राभिषेक महापूजा",
    poojaMode: "online", // performed at Shri Mahakaleshwar Temple on your behalf
    poojaPriceOnline: 851,
    poojaPriceOffline: 851,
    poojaGods: [] as string[],
    // Ujjain banner artwork — the same file the hero was cut from, so the
    // social card and the banner a devotee lands on are the one picture.
    poojaCardImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Ujjain-banner.png.webp",
    poojaMainImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Ujjain-banner.png.webp",
    // [0] is the og:image and the hero's onError fallback. The hero carousel
    // itself renders the self-hosted set in data/savanHeroImages.json, not this
    // list, so a second entry here bought nothing — it was the same banner
    // twice.
    poojaImages: [
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Ujjain-banner.png.webp",
    ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the Savan-themed detail page) ──
    deity: "Mahadev",
    /**
     * Temple where the online puja is performed on your behalf.
     *
     * "Mahakal" rather than the full "Shri Mahakaleshwar Jyotirlinga Temple":
     * the page drops this straight into running sentences ("Puja performed at
     * {templeName}", "Pandit ji performs the Rudrabhishek at {templeName}"),
     * where the formal name reads as signage rather than speech. The full name
     * is spelt out in the accordions, where there is room for it.
     *
     * `templeLocation` is split on the first comma for the meta line, so the
     * CITY must come first here.
     */
    templeName: "Mahakal",
    templeLocation: "Ujjain, Madhya Pradesh",
    rating: 4.9,
    devoteesLabel: "75K+",
    /** Scheduled date of this puja — the last Savan Somwar. */
    pujaDate: LAST_SAVAN_SOMWAR,
    /** Savan-specific framing shown in the hero. */
    occasion: "Last Savan Somwar",
    occasionHindi: "अंतिम सावन सोमवार",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Rudrabhishek at Mahakal — the only south-facing Jyotirlinga on earth",
        "Shipra jal from Ujjain's sacred river offered in your name",
        "Removes fear, ill health, and untimely misfortune (Mahamrityunjaya blessings)",
        "Ujjain is the foremost kshetra for pacifying Kaal Sarp, Pitra and Shani doshas",
        "Brings marital harmony and blessings for an early, suitable match",
        "Grants inner peace, courage, and progress toward moksha",
    ],

    isActive: true,
    isFeatured: true,
    isExclusive: true,
    packageIncluded: true,
    // Dakshina must stay ≤ the price: the backend derives the stored pooja
    // price as (amount − panditDakshina). ₹851 − ₹251 dakshina → ₹600 pooja price.
    panditDakshina: 251,
    samagriDetails: [] as any[],
    samagriPrice: 0,
    poojaBenefitsDescription:
        "Verified pandits perform Rudrabhishek of Baba Mahakal on your behalf at Ujjain on the last Savan Somwar with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include Shipra jal from Ujjain's sacred river, Gangajal, milk, bel patra, dhatura, bhang, white flowers and chandan, with Rudri path and Mahamrityunjaya mantra chanting.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To seek the blessings of <strong>Baba Mahakal</strong> — <strong>Mahadev</strong> as the Lord of Time itself, worshipped at <strong>Shri Mahakaleshwar</strong>, among the most revered of the twelve Jyotirlingas and the only one that faces <strong>south</strong> (dakshinamukhi), the direction of Kaal.</p><p><strong>Ujjain</strong> is <strong>Mahakal Nagri</strong> — the city where Mahakal himself is held to be the king, and one of the seven <em>moksha-puris</em>. The month of <strong>Shravan (Savan)</strong> is Mahadev's most beloved month, and <strong>Savan Somwar</strong> is its most powerful day. This online puja is performed on your behalf at <strong>Mahakal's own darbar in Ujjain</strong> on the <strong>last Savan Somwar</strong> to remove fear, illness and suffering, and to invite peace, courage and prosperity.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Monday, 24 August 2026 — the last Savan Somwar</p><p>Shravan month runs from <strong>30 July to 28 August 2026</strong>. Mondays of this month are considered the single most auspicious time in the year to worship <strong>Mahadev</strong>, and the <em>last</em> Savan Somwar is the final and most sought-after of them — the closing offering of Shiva's own month, believed to seal the merit of the entire Shravan. In Savan, Ujjain sees Mahakal's grand <strong>sawari</strong> carried through the city and lakhs of devotees queue at the Jyotirlinga with jal.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• Rudrabhishek at <strong>Mahakal</strong> — the only south-facing Jyotirlinga on earth.</p><p> • <strong>Shipra jal</strong> from Ujjain's sacred river offered in your name.</p><p> • Removes fear, ill health, and untimely misfortune through <strong>Mahamrityunjaya</strong> blessings — Mahakal is the lord of Kaal itself.</p><p> • Ujjain is the foremost kshetra for pacifying <strong>Kaal Sarp Dosh</strong>, <strong>Pitra Dosh</strong> and <strong>Shani</strong> afflictions.</p><p> • Brings marital harmony, and blessings for an early and suitable match.</p><p> • Grants inner peace, courage, and progress toward <strong>moksha</strong>.</p>",
        },
        {
            headingId: "4",
            heading: "What is performed",
            description:
                "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Mahakaleshwar Jyotirlinga Temple, Ujjain</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Rudrabhishek</strong> of the Jyotirlinga with Shipra jal, Gangajal and panchamrit, <strong>Rudri path</strong>, <strong>Mahamrityunjaya mantra</strong> chanting, and Shiv aarti.</p><p>The entire puja is dedicated specifically to you and your family, and is recorded for you.</p>",
        },
        {
            headingId: "5",
            heading: "Offerings made on your behalf",
            description:
                "<p>• <strong>Shipra jal</strong> from Ujjain's sacred river and <strong>Gangajal</strong>, with raw milk abhishek</p><p> • <strong>Bel patra</strong>, dhatura, bhang and white aak flowers</p><p> • Panchamrit — milk, curd, ghee, honey and sugar</p><p> • Chandan, bhasma, akshata and white flowers</p><p> • Diya, dhoop and camphor for the Shiv aarti</p><p> • <strong>Rudri path</strong> and Mahamrityunjaya mantra chanting</p>",
        },
        {
            headingId: "6",
            heading: "What you will receive",
            description:
                "<p>• Personalised <strong>Sankalp</strong> performed in your name &amp; gotra</p><p> • Full <strong>puja video</strong> shared on WhatsApp</p><p> • Photos of the offerings made in your name</p><p> • Blessed <strong>prasad couriered to your home</strong> if you add the prasad box while booking — <strong>free</strong> in the ₹2100 package, ₹298 in the ₹851 &amp; ₹1500 packages</p><p> • Post-puja guidance from our team</p>",
        },
        {
            headingId: "7",
            heading: "Colours Preferred",
            description:
                "<p><strong>White</strong> and <strong>Saffron</strong></p><p>White reflects the purity, bhasma and detachment of <strong>Mahakal</strong>, while saffron marks the devotion of the Savan sawari that is carried through Ujjain in Shravan — together the most auspicious colours for this puja.</p>",
        },
        {
            headingId: "8",
            heading: "Things to remember",
            description:
                "<p>• Share the correct name &amp; gotra for an accurate Sankalp.</p><p> • Many devotees keep the <strong>Savan Somwar vrat</strong> (fast) on this day — you may observe it from home.</p><p> • Chant <strong>ॐ नमः शिवाय</strong> or <strong>हर हर महादेव</strong> through the day if you can.</p><p> • Watch the puja video shared with you and offer prayers sincerely.</p><p> • Share the prasad with family members after it arrives.</p>",
        },
    ],
    faqs: [
        {
            question: "When exactly is this puja performed?",
            answer: "On Monday, 24 August 2026 — the last Savan Somwar of Shravan 2026. The exact timing is confirmed with you on WhatsApp before the puja begins.",
        },
        {
            question: "Will I get the puja video?",
            answer: "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
        },
        {
            question: "What is Rudrabhishek?",
            answer: "Rudrabhishek is the ceremonial bathing of the Shivling with sacred jal, milk, panchamrit and sacred offerings while Rudri path and Shiv mantras are chanted. It is the most traditional way of worshipping Mahadev during Savan.",
        },
        {
            question: "Why is Ujjain special for Shiva puja?",
            answer: "Ujjain is Mahakal Nagri — the city where Mahadev, as Mahakal, is held to be the king himself, and one of the seven moksha-puris. Shri Mahakaleshwar is among the most revered of the twelve Jyotirlingas and the only one that faces south, the direction of Kaal, which is why it is the foremost place to seek Mahamrityunjaya blessings and relief from Kaal Sarp and Shani afflictions.",
        },
        {
            question: "Is prasad included?",
            answer: "The prasad box is always your choice — add it during booking and it is couriered to your home after the puja. It costs ₹298 in the ₹851 and ₹1500 packages and is FREE in the ₹2100 Rudri Path Mahaseva, but it is only sent if you add it at booking. The box carries dry prasad and a Rudraksh bracelet, plus the Shiv Chalisa from the ₹1500 package upwards.",
        },
        {
            question: "Can I add my family members to the Sankalp?",
            answer: "Yes. Savan Somwar Seva (₹1500) includes 2 family Sankalps free and Rudri Path Mahaseva (₹2100) includes 3. Any name beyond your package's free allowance can be added for ₹101 each during booking, and every name is taken by the pandit during the Sankalp.",
        },
        {
            question: "Can I book from outside India?",
            answer: "Yes. You can book from anywhere in the world. The puja is performed at Shri Mahakaleshwar Jyotirlinga Temple, Ujjain on your behalf and the video is sent to you on WhatsApp.",
        },
        {
            question: "What if I don't know my gotra?",
            answer: "No problem. Gotra is optional. If you leave it blank, the Sankalp is performed in your name (with 'Kashyap' gotra used by tradition).",
        },
        {
            question: "Do I need to keep the Savan Somwar vrat?",
            answer: "It is not required. The puja is complete on its own. If you wish to observe the vrat at home, it is considered highly meritorious — but your booking and Sankalp are unaffected either way.",
        },
    ] as { question: string; answer: string }[],
};

export type KashiMahadevPuja = typeof kashiMahadevPuja;
