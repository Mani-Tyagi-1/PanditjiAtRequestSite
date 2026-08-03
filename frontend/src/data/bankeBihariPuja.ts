// ─────────────────────────────────────────────────────────────────────────
//  Shree Banke Bihari Ji Janmashtami Mahapuja — FRONTEND-ONLY puja detail data.
//
//  This is an ONLINE puja: the puja is performed on the devotee's behalf by
//  verified pandits at Shri Banke Bihari Ji Mandir (Vrindavan, Mathura, Uttar
//  Pradesh) on KRISHNA JANMASHTAMI — Friday, 4 September 2026. The devotee
//  receives the puja video (with their name & gotra) on WhatsApp and can have
//  blessed prasad couriered home. Nobody visits the devotee's home.
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
//  This puja has its OWN catalog row, keyed on `poojaID: "RF_BIHARI_01"` and
//  created by server/src/scripts/seedBankeBihariPuja.ts. The booking page
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
//    • frontend/src/pages/BankeBihari.tsx
//    • frontend/src/pages/BankeBihariBookingPage.tsx
//    • frontend/src/components/bankeBihari/PujaPackages.tsx
//    • server/src/scripts/seedBankeBihariPuja.ts
//    • the BankeBihari routes + lazy imports in App.tsx
// ─────────────────────────────────────────────────────────────────────────

/** Route slug for the dedicated page (matches the route in App.tsx). */
export const BANKE_BIHARI_PUJA_SLUG = "vrindavan-banke-bihari-puja";

/**
 * Stable catalog key for this puja — the `poojaID` field on the backend Pooja
 * document, seeded by server/src/scripts/seedBankeBihariPuja.ts.
 *
 * The booking page sends this as `pujaSlug`, and the server resolves the row
 * via `Pooja.findOne({ poojaID: pujaSlug })`. Keying on this string instead of
 * a Mongo `_id` means one frontend build works against both the dev and
 * production clusters, where the same puja has different `_id`s.
 */
export const BANKE_BIHARI_POOJA_ID = "RF_BIHARI_01";

/**
 * Price (₹) of the OPTIONAL blessed prasad box add-on.
 *
 * The two lower packages (₹1100 / ₹2100) do not ship a box; the devotee may add
 * this one and it is billed on top of the package price. The two higher
 * packages (₹5100 / ₹11000) already include a richer box FREE, so the add-on is
 * never offered there (see `canAddPrasadBox`).
 */
export const PRASAD_BOX_PRICE = 501;

/**
 * Price (₹) of every family-member Sankalp added BEYOND the free allowance
 * bundled in the chosen package. The first N members are free (N depends on
 * the package); each additional name adds this much to the booking total.
 */
export const EXTRA_FAMILY_MEMBER_PRICE = 151;

/**
 * Krishna Janmashtami 2026 — Bhadrapada Krishna Ashtami.
 *
 * ⚠️  Confirm against the panchang before the campaign goes live; if the
 *     tithi resolves to a different day, update this AND the dates written
 *     into `poojaDescription` / `faqs` below, plus `specialDate` in
 *     server/src/scripts/seedBankeBihariPuja.ts.
 */
export const BANKE_BIHARI_PUJA_DATE = "September 4, 2026";

// ── Prasad box ────────────────────────────────────────────────────────────
//
// Three nested boxes. Each tier contains EVERYTHING in the tier below it plus
// its own `adds` — so the contents are declared once and never repeated, and
// the UI can render either "what's new in this box" or the full flattened list
// (`prasadBoxContents`) without the two drifting apart.
//
//   standard — the ₹501 optional add-on (packages ₹1100 & ₹2100)
//   premium  — free with ₹5100
//   royal    — free with ₹11000

export type PrasadBoxTier = "standard" | "premium" | "royal";

export interface PrasadBox {
    tier: PrasadBoxTier;
    /** Name shown on the card / booking summary. */
    name: string;
    /** The cheaper box whose full contents this one also contains. */
    inherits?: PrasadBoxTier;
    /** Items this tier ADDS on top of `inherits`. */
    adds: string[];
}

export const PRASAD_BOXES: Record<PrasadBoxTier, PrasadBox> = {
    standard: {
        tier: "standard",
        name: "Prasad Box",
        adds: ["Dry Prasad", "Bansuri", "Tulsi Mala", "Jaap Counter"],
    },
    premium: {
        tier: "premium",
        name: "Premium Prasad Box",
        inherits: "standard",
        adds: ["Radha Naam Tulsi Mala", "Mor Pankh", "Small Dahi Handi"],
    },
    royal: {
        tier: "royal",
        name: "Royal Prasad Box",
        inherits: "premium",
        adds: ["Laddu Gopal Idol", "Laddu Gopal Dress"],
    },
};

/**
 * ▶ PASTE PRODUCT PHOTOS HERE ◀
 *
 * Artwork for every physical item named anywhere in this file — the prasad-box
 * contents above and the `addedOfferings` on the packages below. Keys must match
 * those strings EXACTLY; a missing or empty entry is not a bug, it renders a
 * tinted icon tile instead, so the page ships fine before the photos land and
 * improves item by item as they arrive.
 *
 * Square crops on a plain/transparent background look best — they are drawn at
 * ~56 px and served through the resizer, so anything above ~200 px wide is
 * wasted bytes.
 */
export const ITEM_IMAGES: Record<string, string> = {
    // ── Prasad box contents ──
    "Dry Prasad": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Prasad.webp",
    Bansuri: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/bansuri.webp",
    "Tulsi Mala": "https://sanatanseva.com/cdn/shop/files/1_0cc0f933-8fad-4077-8587-e010226d80b8.jpg?v=1740658048&width=1946",
    "Jaap Counter": "https://rukminim2.flixcart.com/image/480/640/xif0q/tally-counter/q/w/d/99999-dg11pcs1-degno-original-imahfzeztnjd49f9.jpeg?q=90",
    "Radha Naam Tulsi Mala": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/RADHA_NAAM_MALA.png",
    "Mor Pankh": "https://png.pngtree.com/png-vector/20250310/ourmid/pngtree-3d-realistic-peacock-feather-png-image_15681047.png",
    "Small Dahi Handi": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DAHI_HANDI.png",
    "Laddu Gopal Idol": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/LADDU_GOPAL_IDOL.png",
    "Laddu Gopal Dress": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/LADDU_GOPAL_DRESS.png",
    // ── Offered to Bihari Ji in your name ──
    "Makhan Mishri": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Makhan%20Mishri.webp",
    Paan: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/chadhava-data-images/chadhavaSectionItemImage_0_4_1776952020655.jpg",
    Laddu: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/chadhava-data-images/chadhavaSectionItemImage_0_3_1776952020653.jpg",
    "Deepak Seva": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DEEPAK_SEWA.png",
    "Bade Bhog Thali": "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/BADI_THALI_BHOG.png",
};

/** Every item inside a box, inherited tiers first. */
export function prasadBoxContents(tier: PrasadBoxTier): string[] {
    const box = PRASAD_BOXES[tier];
    return box.inherits ? [...prasadBoxContents(box.inherits), ...box.adds] : [...box.adds];
}

// ── Packages ──────────────────────────────────────────────────────────────

export type PujaPackageId = "makhan" | "kripa" | "shringar" | "rajbhog";

export interface PujaPackage {
    id: PujaPackageId;
    /** Evocative package name shown on the card. */
    name: string;
    /** One-line positioning under the name. */
    tagline: string;
    /** Package price in ₹ (the booking's base amount). */
    price: number;
    /**
     * The cheaper package this one fully contains. Drives the "Everything in
     * <name>" line on the card and the cumulative offerings list, so each
     * package only ever declares what it ADDS.
     */
    inherits?: PujaPackageId;
    /** The core seva every package includes — declared on the base package only. */
    core?: string[];
    /** Offerings this tier ADDS at Bihari Ji's charan, in your name. */
    addedOfferings: string[];
    /** How many family-member Sankalps are included free in this package. */
    freeFamilyMembers: number;
    /**
     * Prasad box shipped FREE with this package, or `null` when the box is the
     * optional ₹501 add-on instead.
     */
    freePrasadBox: PrasadBoxTier | null;
    /** Optional corner badge, e.g. "Most Popular". */
    badge?: string;
    /** Marks the recommended / default package. */
    highlight?: boolean;
}

/**
 * Mor pankh artwork on the CDN — a landscape (3:2) peacock feather with a real
 * alpha channel. Used as this puja's banner / card image, and re-exported so
 * the page can also use it as a decorative motif.
 */
export const PEACOCK_FEATHER_IMAGE =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/peacock%20feather%20(2).webp";

/**
 * Mid-page CTA artwork — a fully designed strip (Laddu Gopal, the headline
 * "Seek the blessings of Banke Bihari Ji on this Janmashtami", a gold "Proceed
 * to Payment" button and a trust line), so the page renders it on its own with
 * no overlaid copy or container chrome.
 *
 * Exported on an oversized 1536×1024 canvas with a wide transparent margin, so
 * it must be requested through `optimizedImg(..., { trim: true })` — untrimmed,
 * the empty margin lays out as ~40% dead vertical space. Trimmed it is 2.49:1.
 */
export const CTA_BANNER_IMAGE =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/banke%20bihari%20ji%20cta.webp";

/**
 * Bansuri-and-mor-pankh motif — Krishna's flute laid across a peacock feather
 * with plumeria and gold tassels. The page's signature Janmashtami ornament,
 * used as a centred section divider.
 *
 * Same oversized 1536×1024 canvas as the other artwork, so it also wants
 * `optimizedImg(..., { trim: true })`; trimmed it is 1.67:1. Verified to have a
 * genuine alpha channel (not a baked-in white box), so it sits directly on the
 * ivory page background with nothing behind it.
 */
export const FLUTE_FEATHER_IMAGE =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/FEATHER%20WITH%20FLUTE.webp";

/**
 * Bansuri, mor pankh and the makhan matki — the makhan-chori motif. Fills the
 * empty right-hand column beside the puja's title / meta block.
 *
 * Same oversized 1536×1024 canvas with a transparent margin as the rest of the
 * artwork, so it also wants `optimizedImg(..., { trim: true })`; trimmed it is
 * 1.75:1, and its alpha channel is genuine (verified against a magenta matte).
 */
export const MAKHAN_MATKI_IMAGE =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/With%20makhan.webp";

 export const BANNER_IMG =
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/banke%20bihariji%20banner1.webp";
    

/**
 * The four booking packages, cheapest first.
 *
 * Each tier is strictly a superset of the one below it (`inherits`), so it only
 * declares what it ADDS — the UI renders "Everything in <cheaper package>" and
 * then the new lines. That keeps the four cards honest by construction: a perk
 * can never appear on ₹2100 and go missing on ₹5100.
 *
 * Two things are billed on top of the package price:
 *   • family Sankalps beyond `freeFamilyMembers` — EXTRA_FAMILY_MEMBER_PRICE each
 *   • the optional prasad box — PRASAD_BOX_PRICE, and only on the two packages
 *     that don't already include a box free (`freePrasadBox === null`)
 */
export const BANKE_BIHARI_PACKAGES: PujaPackage[] = [
    {
        id: "makhan",
        name: "Makhan Bhog Seva",
        tagline: "The essential Janmashtami seva",
        price: 1100,
        core: [
            "Janmashtami Mahapuja performed in your name",
            "Personalised Sankalp with your name & gotra",
            "Full puja video shared on WhatsApp",
        ],
        addedOfferings: [],
        freeFamilyMembers: 0,
        freePrasadBox: null,
    },
    {
        id: "kripa",
        name: "Bihari Kripa Seva",
        tagline: "Most-loved · offerings in your name",
        price: 2100,
        inherits: "makhan",
        addedOfferings: ["Makhan Mishri", "Mor Pankh"],
        freeFamilyMembers: 1,
        freePrasadBox: null,
        badge: "Most Popular",
        highlight: true,
    },
    {
        id: "shringar",
        name: "Shringar Seva",
        tagline: "Free prasad box + fuller offerings",
        price: 5100,
        inherits: "kripa",
        addedOfferings: ["Paan", "Bansuri", "Laddu"],
        freeFamilyMembers: 2,
        freePrasadBox: "premium",
        badge: "Best Value",
    },
    {
        id: "rajbhog",
        name: "Raj Bhog Seva",
        tagline: "The complete seva for the whole family",
        price: 11000,
        inherits: "shringar",
        addedOfferings: ["Deepak Seva", "Bade Bhog Thali"],
        freeFamilyMembers: 3,
        freePrasadBox: "royal",
    },
];

/** The recommended package, pre-selected on first load. */
export const DEFAULT_PACKAGE_ID: PujaPackageId = "kripa";

/** Resolve a package by id, falling back to the first (cheapest) package. */
export function getPackage(id: PujaPackageId | undefined): PujaPackage {
    return BANKE_BIHARI_PACKAGES.find((p) => p.id === id) || BANKE_BIHARI_PACKAGES[0];
}

/** The core seva shared by every package (declared on the base package). */
export function packageCore(pkg: PujaPackage): string[] {
    return pkg.core ?? (pkg.inherits ? packageCore(getPackage(pkg.inherits)) : []);
}

/** Everything offered to Bihari Ji in your name at this tier, cheapest tier first. */
export function packageOfferings(pkg: PujaPackage): string[] {
    return pkg.inherits
        ? [...packageOfferings(getPackage(pkg.inherits)), ...pkg.addedOfferings]
        : [...pkg.addedOfferings];
}

/**
 * Whether the ₹501 prasad box may be added to this package. False for the two
 * higher packages — they already ship a richer box free, so offering a paid one
 * would read as charging twice for the same thing.
 */
export function canAddPrasadBox(pkg: PujaPackage): boolean {
    return pkg.freePrasadBox === null;
}

/** Family members that fall OUTSIDE the package's free allowance (charged). */
export function extraFamilyCount(pkg: PujaPackage, familyCount: number): number {
    return Math.max(0, familyCount - pkg.freeFamilyMembers);
}

/** The prasad-box line on the bill — ₹0 unless the optional box was added. */
export function prasadBoxCost(pkg: PujaPackage, prasadBoxAdded: boolean): number {
    return canAddPrasadBox(pkg) && prasadBoxAdded ? PRASAD_BOX_PRICE : 0;
}

/** Booking total = package price + chargeable extra Sankalps + optional prasad box. */
export function packageTotal(
    pkg: PujaPackage,
    familyCount: number,
    prasadBoxAdded = false,
): number {
    return (
        pkg.price +
        extraFamilyCount(pkg, familyCount) * EXTRA_FAMILY_MEMBER_PRICE +
        prasadBoxCost(pkg, prasadBoxAdded)
    );
}

/** The box actually being shipped for this booking, if any. */
export function shippedPrasadBox(
    pkg: PujaPackage,
    prasadBoxAdded: boolean,
): PrasadBox | null {
    if (pkg.freePrasadBox) return PRASAD_BOXES[pkg.freePrasadBox];
    return canAddPrasadBox(pkg) && prasadBoxAdded ? PRASAD_BOXES.standard : null;
}

/** Whether this booking ships a physical item and therefore needs a delivery address. */
export function packageNeedsDelivery(pkg: PujaPackage, prasadBoxAdded = false): boolean {
    return shippedPrasadBox(pkg, prasadBoxAdded) !== null;
}

/**
 * The puja shaped exactly like a backend pooja document so it can be handed
 * straight to the detail page UI and to the booking / enquiry flows.
 */
export const bankeBihariPuja = {
    // Not a Mongo _id — the booking resolves the catalog row by `pujaSlug`
    // instead (see BANKE_BIHARI_POOJA_ID). This value is only used as an
    // analytics content id and as the enquiry-form reference, both of which
    // also carry the puja name, so a stable string is fine here.
    _id: BANKE_BIHARI_POOJA_ID,
    poojaID: BANKE_BIHARI_POOJA_ID,
    poojaNameEng: "Shree Banke Bihari Ji Janmashtami Mahapuja",
    poojaNameHindi: "श्री बांके बिहारी जी जन्माष्टमी महापूजा",
    poojaMode: "online", // performed at Shri Banke Bihari Ji Mandir on your behalf
    poojaPriceOnline: 1100,
    poojaPriceOffline: 1100,
    poojaGods: [] as string[],
    // Banner / card artwork — the designed Janmashtami banner (opaque, no
    // transparent margin). The hero renders it with `object-cover`.
    poojaCardImage: BANNER_IMG,
    poojaMainImage: BANNER_IMG,
    poojaImages: [BANNER_IMG],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the Banke Bihari themed page) ──
    deity: "Banke Bihari Ji",
    /** Temple where the online puja is performed on your behalf. */
    templeName: "Shri Banke Bihari Ji Mandir",
    templeLocation: "Vrindavan, Mathura",
    rating: 4.6,
    devoteesLabel: "13K+",
    /** Scheduled date of this puja — Krishna Janmashtami 2026. */
    pujaDate: BANKE_BIHARI_PUJA_DATE,
    /** Janmashtami framing shown in the hero. */
    occasion: "Krishna Janmashtami",
    occasionHindi: "जन्माष्टमी",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Banke Bihari Ji is the most loving swaroop of Shri Krishna — his kripa fulfils every heartfelt wish",
        "Janmashtami seva at Vrindavan brings prem, shanti and happiness into the home",
        "Removes rukawat in marriage, love and family relationships",
        "Blesses children with good health, buddhi, sanskaar and a bright future",
        "As Yogeshwar Krishna, brings abundance, growth and success in business",
        "Frees the mind from chinta and grants bhakti, contentment and inner peace",
    ],

    isActive: true,
    isFeatured: true,
    isExclusive: true,
    // Dakshina must stay ≤ the price: the backend derives the stored pooja
    // price as (amount − panditDakshina). ₹1100 − ₹251 dakshina → ₹849 pooja price.
    panditDakshina: 251,
    samagriDetails: [] as any[],
    samagriPrice: 0,
    poojaBenefitsDescription:
        "Verified pandits perform the Janmashtami Mahapuja on your behalf at Shri Banke Bihari Ji Mandir in Vrindavan with traditional Vedic vidhi.<br>\r\nA personalised Sankalp is done in your name and gotra so the seva is dedicated to you and your family.<br>\r\nOfferings include Panchamrit abhishek, makhan-mishri bhog, peetambar vastra, tulsi archana, vaijayanti mala and mor pankh, with Krishna mantra japa and the midnight Janmashtami aarti.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and blessed prasad couriered to your home.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To seek the <strong>kripa</strong> of <strong>Shri Banke Bihari Ji</strong> — the enchanting swaroop of <strong>Shri Krishna</strong> who resides in <strong>Vrindavan</strong> and is worshipped as the deity who never refuses a devotee who comes with love.</p><p>This online seva is performed on your behalf at his mandir in <strong>Vrindavan</strong> on <strong>Krishna Janmashtami</strong> — the night of his avataran — to invite prem, prosperity, family harmony and the fulfilment of your heart's wish.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Friday, 4 September 2026 — <strong>Krishna Janmashtami</strong>, the Ashtami of Bhadrapada Krishna Paksha.</p><p>The <strong>Nishith Kaal</strong> (midnight muhurat) of Janmashtami — the very moment of Kanha's birth — is held to be the most powerful time of the entire year to invoke Shri Krishna. Seva offered at <strong>Vrindavan</strong> on this night is believed to carry manifold merit.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• <strong>Kripa</strong> of Banke Bihari Ji — the fulfilment of your heartfelt wish.</p><p> • Brings <strong>prem, shanti</strong> and happiness into the home.</p><p> • Removes <strong>rukawat</strong> in marriage, love and family relationships.</p><p> • Blesses <strong>children</strong> with health, buddhi and sanskaar.</p><p> • As <strong>Yogeshwar Krishna</strong>, brings growth and success in business.</p><p> • Frees the mind from chinta and grants <strong>bhakti</strong> and contentment.</p>",
        },
        {
            headingId: "4",
            heading: "What is performed",
            description:
                "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Banke Bihari Ji Mandir, Vrindavan</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Panchamrit abhishek</strong> of Laddu Gopal, <strong>makhan-mishri bhog</strong>, tulsi archana, <strong>Krishna mantra japa</strong> and the midnight <strong>Janmashtami aarti</strong>.</p><p>The entire seva is dedicated specifically to you and your family, and is recorded for you.</p>",
        },
        {
            headingId: "5",
            heading: "Offerings made on your behalf",
            description:
                "<p>• <strong>Panchamrit abhishek</strong> — milk, dahi, ghee, honey and sugar</p><p> • <strong>Makhan-mishri</strong> bhog, the offering dearest to Kanha</p><p> • <strong>Peetambar vastra</strong> and chandan shringar</p><p> • <strong>Tulsi dal</strong> archana and vaijayanti mala</p><p> • <strong>Mor pankh</strong> and bansuri offered at his charan</p><p> • <strong>Krishna mantra japa</strong> and the midnight Janmashtami aarti</p>",
        },
        {
            headingId: "6",
            heading: "What you will receive",
            description:
                "<p>• Personalised <strong>Sankalp</strong> performed in your name &amp; gotra</p><p> • Full <strong>puja video</strong> shared on WhatsApp</p><p> • Photos of the offerings made in your name</p><p> • A blessed <strong>prasad box</strong> couriered home — <strong>free</strong> in the ₹5100 &amp; ₹11000 packages, or added for ₹501 in the ₹1100 &amp; ₹2100 packages</p><p> • Post-puja guidance from our team</p>",
        },
        {
            headingId: "7",
            heading: "Colours Preferred",
            description:
                "<p><strong>Peela (yellow)</strong> and <strong>Mor-pankhi (peacock green-blue)</strong></p><p>Yellow is the colour of Krishna's <strong>peetambar</strong>, marking joy, auspiciousness and abundance, while peacock green-blue reflects the <strong>mor pankh</strong> he wears in his crown. Together they are the most auspicious colours for his worship.</p>",
        },
        {
            headingId: "8",
            heading: "Things to remember",
            description:
                "<p>• Share the correct name &amp; gotra for an accurate Sankalp.</p><p> • Keep a vrat on Janmashtami if your health allows, and break it after midnight.</p><p> • Chant <strong>ॐ नमो भगवते वासुदेवाय</strong> through the day if you can.</p><p> • Offering makhan-mishri and tulsi dal at home multiplies the merit.</p><p> • Watch the puja video shared with you and offer prayers sincerely.</p>",
        },
    ],
    faqs: [
        {
            question: "When exactly is this puja performed?",
            answer: "On Friday, 4 September 2026 — Krishna Janmashtami. The main seva is performed around the Nishith Kaal (midnight muhurat), and the exact timing is confirmed with you on WhatsApp before the puja begins.",
        },
        {
            question: "Will I get the puja video?",
            answer: "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the seva.",
        },
        {
            question: "Who is Banke Bihari Ji?",
            answer: "Banke Bihari Ji is the beloved swaroop of Shri Krishna worshipped at Vrindavan. 'Banke' means bent in three places (tribhanga) and 'Bihari' means the supreme enjoyer. He is known as the deity of prem and kripa, who fulfils the wishes of anyone who comes to him with love.",
        },
        {
            question: "Why is Vrindavan special for Janmashtami puja?",
            answer: "Vrindavan is Krishna's own leela bhoomi — the land of his childhood, his raas and his makhan chori. Seva offered here on Janmashtami, the night of his avataran, is held to be among the most meritorious worship a devotee can offer.",
        },
        {
            question: "Is the prasad box included?",
            answer: "In the ₹5100 Shringar Seva and the ₹11000 Raj Bhog Seva the prasad box is FREE — Shringar ships the Premium box (dry prasad, bansuri, tulsi mala, jaap counter, Radha naam tulsi mala, mor pankh and a small dahi handi) and Raj Bhog ships the Royal box, which adds a brass Laddu Gopal ji idol and a Laddu Gopal ji dress. In the ₹1100 and ₹2100 packages the prasad box is optional: add it for ₹501 during booking and it is couriered to your home.",
        },
        {
            question: "What is inside the ₹501 prasad box?",
            answer: "Dry prasad from the mandir, a bansuri, a tulsi mala and a jaap counter — blessed at Shri Banke Bihari Ji Mandir and couriered to your home. It is completely optional; skip it and you pay only the package price.",
        },
        {
            question: "Can I book from outside India?",
            answer: "Yes. You can book from anywhere in the world. The seva is performed at Shri Banke Bihari Ji Mandir, Vrindavan on your behalf and the video is sent to you on WhatsApp.",
        },
        {
            question: "What if I don't know my gotra?",
            answer: "No problem. Gotra is optional. If you leave it blank, the Sankalp is performed in your name (with 'Kashyap' gotra used by tradition).",
        },
        {
            question: "Can I add my family members to the Sankalp?",
            answer: "Yes. Bihari Kripa (₹2100) includes 1 family Sankalp free, Shringar Seva (₹5100) includes 2 and Raj Bhog Seva (₹11000) includes 3. Any name beyond your package's free allowance can be added for ₹151 each during booking, and every name is taken by the pandit during the Sankalp.",
        },
    ] as { question: string; answer: string }[],
};

export type BankeBihariPuja = typeof bankeBihariPuja;
