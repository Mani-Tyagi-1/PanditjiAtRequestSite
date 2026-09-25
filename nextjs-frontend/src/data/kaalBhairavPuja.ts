// ─────────────────────────────────────────────────────────────────────────
//  Shree Kashi Kaal Bhairav Mahapuja — FRONTEND-ONLY puja detail data.
//
//  This is an ONLINE puja: the puja is performed on the devotee's behalf by
//  verified pandits at Shri Kaal Bhairav Mandir (Varanasi, Uttar Pradesh) on
//  KALASHTAMI — Tuesday, 11 August 2026. The devotee receives the puja video
//  (with their name & gotra) on WhatsApp and can optionally have blessed
//  prasad couriered home. Nobody visits the devotee's home.
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
//  This puja has its OWN catalog row, keyed on `poojaID: "RF_BHAIRAV_01"` and
//  created by server/src/scripts/seedKaalBhairavPuja.ts. The booking page
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
//    • frontend/src/pages/KaalBhairav.tsx
//    • frontend/src/pages/KaalBhairavBookingPage.tsx
//    • server/src/scripts/seedKaalBhairavPuja.ts
//    • the KaalBhairav routes + lazy imports in App.tsx
// ─────────────────────────────────────────────────────────────────────────

/** Route slug for the dedicated page (matches the route in App.tsx). */
export const KAAL_BHAIRAV_PUJA_SLUG = "kashi-kaal-bhairav-puja";

/**
 * Stable catalog key for this puja — the `poojaID` field on the backend Pooja
 * document, seeded by server/src/scripts/seedKaalBhairavPuja.ts.
 *
 * The booking page sends this as `pujaSlug`, and the server resolves the row
 * via `Pooja.findOne({ poojaID: pujaSlug })`. Keying on this string instead of
 * a Mongo `_id` means one frontend build works against both the dev and
 * production clusters, where the same puja has different `_id`s.
 */
export const KAAL_BHAIRAV_POOJA_ID = "RF_BHAIRAV_01";

/** Add-on price for the optional blessed prasad box (₹). */
export const PRASAD_BOX_PRICE = 298;

/**
 * Per-person price for adding a family member to the Sankalp (₹).
 * Each name added is taken during the Sankalp alongside the main devotee, and
 * adds this much to the booking total. Matches the Live Mandir flow's rate.
 */
export const FAMILY_MEMBER_PRICE = 101;

/** Kalashtami of Shravan 2026 — the Ashtami dedicated to Kaal Bhairav. */
export const KAAL_BHAIRAV_PUJA_DATE = "August 5, 2026";

/**
 * Price (₹) of every family-member Sankalp added BEYOND the free allowance
 * bundled in the chosen package. The first N members are free (N depends on
 * the package); each additional name adds this much to the booking total.
 */
export const EXTRA_FAMILY_MEMBER_PRICE = 151;

export type PujaPackageId = "basic" | "premium" | "royal";

export interface PujaPackage {
    id: PujaPackageId;
    /** Evocative package name shown on the card. */
    name: string;
    /** One-line positioning under the name. */
    tagline: string;
    /** Package price in ₹ (the booking's base amount). */
    price: number;
    /** How many family-member Sankalps are included free in this package. */
    freeFamilyMembers: number;
    /** Blessed prasad box couriered home. */
    prasadBox: boolean;
    /** Free 5 Mukhi Rudraksh pendant couriered home. */
    rudrakshPendant: boolean;
    /** Free 5 Mukhi Rudraksh bracelet couriered home. */
    rudrakshBracelet: boolean;
    /** Optional corner badge, e.g. "Most Popular". */
    badge?: string;
    /** Marks the recommended / default package. */
    highlight?: boolean;
    /** 2–3 short "what you get" lines shown on the card (positives only). */
    highlights: string[];
    /**
     * Physical items shipped with the package, shown as a row of images in the
     * booking page's "What's included" accordion (premium/royal only). Paste the
     * product image URL into each `image`; an empty string renders a placeholder.
     */
    includedItems?: { label: string; image: string }[];
}

/**
 * The three booking packages. Every package includes the core Kaal Bhairav
 * puja, personalised Sankalp and the puja video; they differ in the number of
 * free family Sankalps and the physical blessings couriered home. Extra family
 * members beyond a package's free allowance cost EXTRA_FAMILY_MEMBER_PRICE each.
 */
export const KAAL_BHAIRAV_PACKAGES: PujaPackage[] = [
    {
        id: "basic",
        name: "Charan Seva",
        tagline: "The essential Kaal Bhairav puja",
        price: 501,
        freeFamilyMembers: 0,
        prasadBox: false,
        rudrakshPendant: false,
        rudrakshBracelet: false,
        highlights: [
            "Puja in your name & gotra",
            "Personalised Sankalp + puja video",
        ],
    },
    {
        id: "premium",
        name: "Raksha Kavach",
        tagline: "Most-loved · puja with blessings",
        price: 1100,
        freeFamilyMembers: 2,
        prasadBox: true,
        rudrakshPendant: true,
        rudrakshBracelet: false,
        badge: "Most Popular",
        highlight: true,
        highlights: [
            "2 family members added free",
            "Sacred Prasad Box couriered home",
            "Free 5 Mukhi Rudraksh Pendant",
        ],
        // TODO: paste the product image URLs here.
        includedItems: [
            { label: "Sacred Prasad Box", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Prasad%20box.webp" },
            { label: "5 Mukhi Rudraksh Pendant", image: "https://vedicshop.store/cdn/shop/files/ChatGPT_Image_Jun_28_2026_06_32_52_PM.png?v=1782651941&width=1200" },
        ],
    },
    {
        id: "royal",
        name: "Kotwal Kripa",
        tagline: "Complete raksha for the family",
        price: 2100,
        freeFamilyMembers: 4,
        prasadBox: true,
        rudrakshPendant: true,
        rudrakshBracelet: true,
        badge: "Best Value",
        highlights: [
            "4 family members added free",
            "Premium Prasad Box + Rudraksh Pendant",
            "Free 5 Mukhi Rudraksh Bracelet",
        ],
        // TODO: paste the product image URLs here.
        includedItems: [
            { label: "Sacred Prasad Box", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Prasad%20box.webp" },
            { label: "5 Mukhi Rudraksh Pendant", image: "https://vedicshop.store/cdn/shop/files/ChatGPT_Image_Jun_28_2026_06_32_52_PM.png?v=1782651941&width=1200" },
            { label: "5 Mukhi Rudraksh Bracelet", image: "https://vedicshop.store/cdn/shop/files/5_mukhi_rudraksha_bracelet.jpg?v=1774855990&width=1200" },
        ],
    },
];

/** The recommended package, pre-selected on first load. */
export const DEFAULT_PACKAGE_ID: PujaPackageId = "premium";

/** Resolve a package by id, falling back to the first (cheapest) package. */
export function getPackage(id: PujaPackageId | undefined): PujaPackage {
    return KAAL_BHAIRAV_PACKAGES.find((p) => p.id === id) || KAAL_BHAIRAV_PACKAGES[0];
}

/** Family members that fall OUTSIDE the package's free allowance (charged). */
export function extraFamilyCount(pkg: PujaPackage, familyCount: number): number {
    return Math.max(0, familyCount - pkg.freeFamilyMembers);
}

/** Booking total = package price + chargeable extra family members. */
export function packageTotal(pkg: PujaPackage, familyCount: number): number {
    return pkg.price + extraFamilyCount(pkg, familyCount) * EXTRA_FAMILY_MEMBER_PRICE;
}

/** Whether a package ships a physical item and therefore needs a delivery address. */
export function packageNeedsDelivery(pkg: PujaPackage): boolean {
    return pkg.prasadBox || pkg.rudrakshPendant || pkg.rudrakshBracelet;
}

/**
 * The puja shaped exactly like a backend pooja document so it can be handed
 * straight to the detail page UI and to the booking / enquiry flows.
 */
export const kaalBhairavPuja = {
    // Not a Mongo _id — the booking resolves the catalog row by `pujaSlug`
    // instead (see KAAL_BHAIRAV_POOJA_ID). This value is only used as an
    // analytics content id and as the enquiry-form reference, both of which
    // also carry the puja name, so a stable string is fine here.
    _id: KAAL_BHAIRAV_POOJA_ID,
    poojaID: KAAL_BHAIRAV_POOJA_ID,
    poojaNameEng: "Shree Kashi Kaal Bhairav Mahapuja",
    poojaNameHindi: "श्री काशी काल भैरव महापूजा",
    poojaMode: "online", // performed at Shri Kaal Bhairav Mandir on your behalf
    poojaPriceOnline: 1100,
    poojaPriceOffline: 1100,
    poojaGods: [] as string[],
    // NOTE: placeholder banner — reusing the Savan/Kashi artwork for now.
    // Swap these URLs for the Kaal Bhairav banner when it is ready.
    poojaCardImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kaal%20Bhairava%20Banner.webp",
    poojaMainImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kaal%20Bhairava%20Banner.webp",
    poojaImages: [
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kaal%20Bhairava%20Banner.webp",
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kaal%20Bhairava%20Banner.webp",
    ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the Kaal Bhairav themed page) ──
    deity: "Kaal Bhairav",
    /** Temple where the online puja is performed on your behalf. */
    templeName: "Shri Kaal Bhairav Mandir",
    templeLocation: "Kashi, Varanasi",
    rating: 4.9,
    devoteesLabel: "60K+",
    /** Scheduled date of this puja — Kalashtami of Shravan 2026. */
    pujaDate: KAAL_BHAIRAV_PUJA_DATE,
    /** Bhairav-specific framing shown in the hero. */
    // occasion: "Kalashtami · Bhairav Din",
    occasionHindi: "कालाष्टमी",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Kaal Bhairav is the Kotwal (guardian) of Kashi — his raksha shields you from every fear",
        "Removes black magic, evil eye (nazar) and negative energy from your life",
        "Pacifies Shani, Rahu and Kaal Sarp Dosh — Bhairav is their overlord",
        "Grants fearlessness, courage and victory over hidden enemies and obstacles",
        "As Mahakaal Bhairav, lord of time, he removes fear of untimely misfortune",
        "Clears debts, delays and stuck work — brings discipline and swift success",
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
        "Verified pandits perform the Kaal Bhairav Mahapuja on your behalf at Shri Kaal Bhairav Mandir in Kashi on Kalashtami with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include a mustard-oil deepam, black til, coconut, imarti bhog, sindoor and black-red flowers, with Kaal Bhairav Ashtakam and Bhairav mantra chanting, and seva of the shvan (his vahana).<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To seek the <strong>raksha</strong> (protection) of <strong>Shri Kaal Bhairav</strong> — the fierce swaroop of <strong>Mahadev</strong> who guards <strong>Kashi</strong> as its <strong>Kotwal</strong>. It is said that no soul finds peace in Kashi without his darshan.</p><p>This online puja is performed on your behalf at his temple in <strong>Kashi (Varanasi)</strong> on <strong>Kalashtami</strong> to burn away fear, negative energy, doshas and hidden enemies — and to grant courage, discipline and swift success.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Tuesday, 11 August 2026 — <strong>Kalashtami</strong>, the Ashtami of Krishna Paksha dedicated to Kaal Bhairav.</p><p><strong>Kalashtami</strong>, and <strong>Tuesdays and Sundays</strong>, are held to be the most powerful days to invoke <strong>Bhairav Baba</strong>. On these days his raksha and blessings are believed to flow most freely to his devotees.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• <strong>Raksha</strong> of the Kotwal of Kashi — shields you from every fear and danger.</p><p> • Removes <strong>black magic</strong>, evil eye (nazar) and negative energy.</p><p> • Pacifies <strong>Shani</strong>, <strong>Rahu</strong> and <strong>Kaal Sarp Dosh</strong> — Bhairav is their overlord.</p><p> • Grants <strong>fearlessness</strong>, courage and victory over enemies and obstacles.</p><p> • As <strong>Mahakaal Bhairav</strong>, lord of time, removes fear of untimely misfortune.</p><p> • Clears <strong>debts</strong>, delays and stuck work; brings discipline and success.</p>",
        },
        {
            headingId: "4",
            heading: "What is performed",
            description:
                "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Kaal Bhairav Mandir in Kashi</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Kaal Bhairav Ashtakam</strong> and Bhairav mantra chanting, a <strong>mustard-oil deepam</strong>, ceremonial bhog, and the <strong>Bhairav aarti</strong>.</p><p>The entire puja is dedicated specifically to you and your family, and is recorded for you.</p>",
        },
        {
            headingId: "5",
            heading: "Offerings made on your behalf",
            description:
                "<p>• <strong>Mustard-oil deepam</strong> and dhoop lit before Bhairav Baba</p><p> • <strong>Black til</strong>, urad and coconut</p><p> • <strong>Imarti / jalebi</strong> bhog, the offering dear to Bhairav</p><p> • Sindoor, chandan and black-red flowers</p><p> • Seva of the <strong>shvan</strong> (black dog), his vahana</p><p> • <strong>Kaal Bhairav Ashtakam</strong> and Bhairav mantra chanting</p>",
        },
        {
            headingId: "6",
            heading: "What you will receive",
            description:
                "<p>• Personalised <strong>Sankalp</strong> performed in your name &amp; gotra</p><p> • Full <strong>puja video</strong> shared on WhatsApp</p><p> • Photos of the offerings made in your name</p><p> • Blessed <strong>prasad couriered to your home</strong> (optional)</p><p> • Post-puja guidance from our team</p>",
        },
        {
            headingId: "7",
            heading: "Colours Preferred",
            description:
                "<p><strong>Black</strong> and <strong>Deep Red</strong></p><p>Black reflects the fierce, fearless and boundless nature of <strong>Kaal Bhairav</strong> — lord of time itself — while deep red marks his power and raksha. Together they are the most auspicious colours for his worship.</p>",
        },
        {
            headingId: "8",
            heading: "Things to remember",
            description:
                "<p>• Share the correct name &amp; gotra for an accurate Sankalp.</p><p> • Worship Bhairav with humility and respect — he is a stern but deeply protective deity.</p><p> • Chant <strong>ॐ कालभैरवाय नमः</strong> through the day if you can.</p><p> • Feeding a dog on this day is considered highly meritorious.</p><p> • Watch the puja video shared with you and offer prayers sincerely.</p>",
        },
    ],
    faqs: [
        {
            question: "When exactly is this puja performed?",
            answer: "On Tuesday, 11 August 2026 — Kalashtami, the Ashtami dedicated to Kaal Bhairav. The exact timing is confirmed with you on WhatsApp before the puja begins.",
        },
        {
            question: "Will I get the puja video?",
            answer: "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
        },
        {
            question: "Who is Kaal Bhairav?",
            answer: "Kaal Bhairav is the fierce swaroop of Lord Shiva and the Kotwal (guardian) of Kashi. He is the remover of fear, negativity and doshas, and the overlord of Shani, Rahu and time itself. His worship grants protection, courage and swift removal of obstacles.",
        },
        {
            question: "Why is Kashi special for Kaal Bhairav puja?",
            answer: "Kaal Bhairav is regarded as the Kotwal of Kashi (Varanasi) — the divine guardian of the city. His temple in Kashi is among the most powerful Bhairav sthals, and worship offered there is held to be especially effective for raksha and removal of doshas.",
        },
        {
            question: "Is prasad included?",
            answer: "Prasad is optional. You can add a blessed prasad box for ₹298 during booking and it will be couriered to your home after the puja.",
        },
        {
            question: "Can I book from outside India?",
            answer: "Yes. You can book from anywhere in the world. The puja is performed at Shri Kaal Bhairav Mandir, Kashi on your behalf and the video is sent to you on WhatsApp.",
        },
        {
            question: "What if I don't know my gotra?",
            answer: "No problem. Gotra is optional. If you leave it blank, the Sankalp is performed in your name (with 'Kashyap' gotra used by tradition).",
        },
        {
            question: "Is Kaal Bhairav puja safe to do for anyone?",
            answer: "Yes. Though Bhairav is a fierce deity, he is deeply protective of his devotees. The puja is performed with full Vedic vidhi by verified pandits, and is meant only to bring you raksha, courage and blessings.",
        },
    ] as { question: string; answer: string }[],
};

export type KaalBhairavPuja = typeof kaalBhairavPuja;
