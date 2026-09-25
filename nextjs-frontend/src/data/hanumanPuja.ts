// ─────────────────────────────────────────────────────────────────────────
//  Shree Hanuman Garhi Mahapuja — FRONTEND-ONLY puja detail data.
//
//  This is an ONLINE puja: the puja is performed on the devotee's behalf by
//  verified pandits at Shri Hanuman Garhi Mandir (Ayodhya, Uttar Pradesh) on
//  SAVAN MANGALWAR — Tuesday, 4 August 2026 (a Tuesday of the sacred Shravan
//  month, most beloved to Hanuman Ji). The devotee receives the puja video (with their
//  name & gotra) on WhatsApp and can optionally have blessed prasad couriered
//  home. Nobody visits the devotee's home.
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
//  This puja has its OWN catalog row, keyed on `poojaID: "RF_HANUMAN_01"` and
//  created by server/src/scripts/seedHanumanPuja.ts. The booking page sends
//  that string as `pujaSlug`; the server resolves it via
//  `Pooja.findOne({ poojaID: pujaSlug })`. No Mongo `_id` is hardcoded, so one
//  build works against both the dev and production clusters.
//
//  ⚠️  Run the seed script once per cluster before taking bookings there.
//      Without the row, the controller's last-resort fallback grabs an
//      arbitrary active pooja and bookings are misreported.
//
//  Remove the feature by deleting:
//    • this file
//    • frontend/src/pages/Hanumanjipage.tsx
//    • frontend/src/pages/HanumanBookingPage.tsx
//    • server/src/scripts/seedHanumanPuja.ts
//    • the Hanuman routes + lazy imports in App.tsx
// ─────────────────────────────────────────────────────────────────────────

/** Route slug for the dedicated page (matches the route in App.tsx). */
export const HANUMAN_PUJA_SLUG = "ayodhya-hanuman-garhi-puja";

/**
 * Stable catalog key for this puja — the `poojaID` field on the backend Pooja
 * document, seeded by server/src/scripts/seedHanumanPuja.ts.
 *
 * The booking page sends this as `pujaSlug`, and the server resolves the row
 * via `Pooja.findOne({ poojaID: pujaSlug })`. Keying on this string instead of
 * a Mongo `_id` means one frontend build works against both the dev and
 * production clusters, where the same puja has different `_id`s.
 */
export const HANUMAN_POOJA_ID = "RF_HANUMAN_01";

/** Add-on price for the optional blessed prasad box (₹). */
export const PRASAD_BOX_PRICE = 298;

/**
 * Per-person price for adding a family member to the Sankalp (₹).
 * Each name added is taken during the Sankalp alongside the main devotee, and
 * adds this much to the booking total. Matches the Live Mandir flow's rate.
 */
export const FAMILY_MEMBER_PRICE = 101;

/** Savan Mangalwar of Shravan 2026 — a Tuesday of Savan, beloved to Hanuman Ji. */
export const HANUMAN_PUJA_DATE = "August 4, 2026";

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
    /** Kg of boondi laddoo offered to Hanuman Ji as bhog at the temple (0 = none). */
    laddooKg: number;
    /** Optional corner badge, e.g. "Most Popular". */
    badge?: string;
    /** Marks the recommended / default package. */
    highlight?: boolean;
    /** 2–3 short "what you get" lines shown on the card (positives only). */
    highlights: string[];
    /**
     * Physical blessings couriered to the devotee's home, shown as a row of
     * images in the package card's expandable "what's included" panel and used
     * to decide whether a delivery address is required. An empty array means
     * nothing ships (the basic package). Paste the product image URL into each
     * `image`; an empty string renders a placeholder.
     */
    includedItems?: { label: string; image: string }[];
}

/**
 * The three booking packages. Every package includes the core Hanuman Garhi
 * puja, personalised Sankalp and the puja video; they differ in the laddoo
 * bhog offered, the number of free family Sankalps and the physical blessings
 * couriered home. Extra family members beyond a package's free allowance cost
 * EXTRA_FAMILY_MEMBER_PRICE each.
 */
export const HANUMAN_PACKAGES: PujaPackage[] = [
    {
        id: "basic",
        name: "Charan Vandana",
        tagline: "The essential Hanuman puja",
        price: 1100,
        freeFamilyMembers: 0,
        laddooKg: 0,
        highlights: [
            "Puja in your name & gotra",
            "Personalised Sankalp + puja video",
        ],
    },
    {
        id: "premium",
        name: "Sankat Mochan",
        tagline: "Most-loved · puja with blessings",
        price: 2100,
        freeFamilyMembers: 2,
        laddooKg: 1,
        badge: "Most Popular",
        highlight: true,
        highlights: [
            "1 Kg laddoo offered to Hanuman Ji",
            "2 family members added free",
            "Prasad Box, Hanuman Chalisa & Tulsi Mala couriered home",
        ],
        // TODO: paste the product image URLs here.
        includedItems: [
            { label: "Sacred Prasad Box", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Prasad%20box.webp" },
            { label: "Hanuman Chalisa", image: "https://vedicshop.store/cdn/shop/files/1751099373270_hanumanchalisa4_edd04a8e-8169-43f0-9342-b3607149bcf2.webp?v=1776335755&width=1200" },
            { label: "Hanuman Ji Tulsi Mala", image: "https://vedicshop.store/cdn/shop/files/hanumantulsimala_98aef5c8-1154-46f7-a670-e6cffaee6989.png?v=1782729283&width=1200" },
        ],
    },
    {
        id: "royal",
        name: "Bajrang Kavach",
        tagline: "Complete raksha for the family",
        price: 3100,
        freeFamilyMembers: 4,
        laddooKg: 3,
        badge: "Best Value",
        highlights: [
            "3 Kg laddoo offered to Hanuman Ji",
            "4 family members added free",
            "Prasad Box, Chalisa, Tulsi Mala, Brass Gada + 5-Mukhi Raksha Kavach",
        ],
        // TODO: paste the product image URLs here.
        includedItems: [
            { label: "Sacred Prasad Box", image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Prasad%20box.webp" },
            { label: "Hanuman Chalisa", image: "https://vedicshop.store/cdn/shop/files/1751099373270_hanumanchalisa4_edd04a8e-8169-43f0-9342-b3607149bcf2.webp?v=1776335755&width=1200" },
            { label: "Hanuman Ji Tulsi Mala", image: "https://vedicshop.store/cdn/shop/files/hanumantulsimala_98aef5c8-1154-46f7-a670-e6cffaee6989.png?v=1782729283&width=1200" },
            { label: "Brass Gada", image: "https://vedicshop.store/cdn/shop/files/246.jpg?v=1775563081&width=1200" },
            { label: "5 Mukhi Raksha Kavach", image: "https://vedicshop.store/cdn/shop/files/panchmukhi.jpg?v=1776335867&width=1200" },
        ],
    },
];

/** The recommended package, pre-selected on first load. */
export const DEFAULT_PACKAGE_ID: PujaPackageId = "premium";

/** Resolve a package by id, falling back to the first (cheapest) package. */
export function getPackage(id: PujaPackageId | undefined): PujaPackage {
    return HANUMAN_PACKAGES.find((p) => p.id === id) || HANUMAN_PACKAGES[0];
}

/** Family members that fall OUTSIDE the package's free allowance (charged). */
export function extraFamilyCount(pkg: PujaPackage, familyCount: number): number {
    return Math.max(0, familyCount - pkg.freeFamilyMembers);
}

/** Booking total = package price + chargeable extra family members. */
export function packageTotal(pkg: PujaPackage, familyCount: number): number {
    return pkg.price + extraFamilyCount(pkg, familyCount) * EXTRA_FAMILY_MEMBER_PRICE;
}

/** Whether a package ships a physical blessing and therefore needs a delivery address. */
export function packageNeedsDelivery(pkg: PujaPackage): boolean {
    return (pkg.includedItems?.length ?? 0) > 0;
}

/**
 * The puja shaped exactly like a backend pooja document so it can be handed
 * straight to the detail page UI and to the booking / enquiry flows.
 */
export const hanumanPuja = {
    // Not a Mongo _id — the booking resolves the catalog row by `pujaSlug`
    // instead (see HANUMAN_POOJA_ID). This value is only used as an analytics
    // content id and as the enquiry-form reference, both of which also carry
    // the puja name, so a stable string is fine here.
    _id: HANUMAN_POOJA_ID,
    poojaID: HANUMAN_POOJA_ID,
    poojaNameEng: "Shree Hanuman Garhi Mahapuja",
    poojaNameHindi: "श्री हनुमान गढ़ी महापूजा",
    poojaMode: "online", // performed at Shri Hanuman Garhi Mandir on your behalf
    poojaPriceOnline: 1100,
    poojaPriceOffline: 1100,
    poojaGods: [] as string[],
    // NOTE: placeholder banner — reusing existing Kashi artwork for now.
    // TODO: swap these URLs for the Hanuman Garhi banner when it is ready.
    poojaCardImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Hanuman%20gari%20ji%20banner.webp",
    poojaMainImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Hanuman%20gari%20ji%20banner.webp",
    poojaImages: [
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Hanuman%20gari%20ji%20banner.webp",
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Hanuman%20gari%20ji%20banner.webp",
    ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the Royal Hanuman Bhakti page) ──
    deity: "Hanuman Ji",
    /** Temple where the online puja is performed on your behalf. */
    templeName: "Shri Hanuman Garhi Mandir",
    templeLocation: "Ayodhya, Uttar Pradesh",
    rating: 4.9,
    devoteesLabel: "80K+",
    /** Scheduled date of this puja — Savan Mangalwar of Shravan 2026. */
    pujaDate: HANUMAN_PUJA_DATE,
    /** Hanuman-specific framing shown in the hero. */
    occasion: "Savan Mangalwar",
    occasionHindi: "सावन मंगलवार",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Hanuman Garhi is the seat of Bajrangbali in Ram's own Ayodhya — his kripa shields you from every fear",
        "Removes Shani sade-sati, dhaiya and the malefic effects of Mangal (Mars) dosha",
        "Destroys evil eye (nazar), black magic and negative energy around you and your home",
        "Grants courage, strength, victory over enemies and success in stuck work",
        "Bhakti of Hanuman brings the grace of Shree Ram — protection, prosperity and peace",
        "Wards off bhoot-pret badha and fills the mind with confidence, health and devotion",
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
        "Verified pandits perform the Hanuman Garhi Mahapuja on your behalf at Shri Hanuman Garhi Mandir in Ayodhya on Savan Mangalwar with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include a sindoor-and-chameli-oil chola, boondi laddoo and paan bhog, a red dhwaja, with the Hanuman Chalisa, Sundarkand paath and Bajrang Baan chanting.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To seek the <strong>kripa</strong> (grace) of <strong>Shri Hanuman</strong> — <strong>Bajrangbali</strong>, the greatest devotee of <strong>Shree Ram</strong> and the remover of all fear, sorrow and obstacles (<em>Sankat Mochan</em>).</p><p><strong>Hanuman Garhi</strong> in <strong>Ayodhya</strong> — Ram Janmabhoomi itself — is among the most powerful seats of Hanuman, where he is believed to reside as the guardian of the holy city. This online puja is performed on your behalf there on <strong>Savan Mangalwar</strong> — a Tuesday of the sacred Shravan month — to burn away fear, negativity and doshas, and to grant courage, strength and swift success.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Tuesday, 4 August 2026 — <strong>Savan Mangalwar</strong>, a Tuesday of the sacred month of Shravan (Savan).</p><p><strong>Tuesdays (Mangalwar)</strong> and <strong>Saturdays</strong> are held to be the most powerful days to invoke <strong>Hanuman Ji</strong>. A Mangalwar that falls in <strong>Savan</strong> — Mahadev's own month — is the most auspicious of all, and on it his blessings and protection are believed to flow most freely to his devotees.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• <strong>Kripa</strong> of Bajrangbali at Hanuman Garhi — shields you from every fear and danger.</p><p> • Removes <strong>Shani</strong> sade-sati, dhaiya and the malefic effects of <strong>Mangal (Mars)</strong> dosha.</p><p> • Destroys <strong>evil eye</strong> (nazar), black magic and negative energy.</p><p> • Grants <strong>courage</strong>, strength and victory over enemies and obstacles.</p><p> • Brings the grace of <strong>Shree Ram</strong> — protection, prosperity and peace.</p><p> • Wards off <strong>bhoot-pret badha</strong> and fills the mind with confidence and health.</p>",
        },
        {
            headingId: "4",
            heading: "What is performed",
            description:
                "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shri Hanuman Garhi Mandir in Ayodhya</strong> — <strong>Sankalp in your name &amp; gotra</strong>, the <strong>Hanuman Chalisa</strong>, <strong>Sundarkand</strong> and Bajrang Baan chanting, a <strong>sindoor chola</strong> offering, ceremonial bhog, and the <strong>Hanuman aarti</strong>.</p><p>The entire puja is dedicated specifically to you and your family, and is recorded for you.</p>",
        },
        {
            headingId: "5",
            heading: "Offerings made on your behalf",
            description:
                "<p>• <strong>Sindoor chola</strong> in chameli (jasmine) oil, dear to Hanuman</p><p> • <strong>Boondi laddoo</strong> and paan bhog</p><p> • A red <strong>dhwaja</strong> (victory flag) offered at his feet</p><p> • Ghee deepam, dhoop, chandan and red flowers</p><p> • Seva remembering <strong>Shree Ram, Sita and Lakshman</strong></p><p> • <strong>Hanuman Chalisa</strong>, Sundarkand and Bajrang Baan paath</p>",
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
                "<p><strong>Saffron</strong> and <strong>Sindoori Red</strong></p><p>Saffron (bhagwa) reflects the tej, brahmacharya and boundless devotion of <strong>Hanuman Ji</strong>, while sindoori red marks his strength and raksha — together the most auspicious colours for his worship.</p>",
        },
        {
            headingId: "8",
            heading: "Things to remember",
            description:
                "<p>• Share the correct name &amp; gotra for an accurate Sankalp.</p><p> • Many devotees keep the <strong>Mangalwar vrat</strong> (fast) on this day — you may observe it from home.</p><p> • Chant the <strong>Hanuman Chalisa</strong> or <strong>ॐ हं हनुमते नमः</strong> through the day if you can.</p><p> • Feeding monkeys and offering water to a Peepal tree on this day is considered meritorious.</p><p> • Watch the puja video shared with you and offer prayers sincerely.</p>",
        },
    ],
    faqs: [
        {
            question: "When exactly is this puja performed?",
            answer: "On Tuesday, 4 August 2026 — Savan Mangalwar, a Tuesday of the sacred Shravan month dedicated to Hanuman Ji. The exact timing is confirmed with you on WhatsApp before the puja begins.",
        },
        {
            question: "Will I get the puja video?",
            answer: "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
        },
        {
            question: "Who is Hanuman Ji?",
            answer: "Hanuman Ji, also called Bajrangbali and Sankat Mochan, is the greatest devotee of Shree Ram and the remover of all fear, sorrow and obstacles. His worship grants strength, courage, protection and swift removal of troubles.",
        },
        {
            question: "Why is Hanuman Garhi in Ayodhya special?",
            answer: "Hanuman Garhi in Ayodhya — Ram Janmabhoomi itself — is among the most powerful seats of Hanuman, where he is believed to reside as the guardian of the holy city. Worship offered there is held to be especially effective for raksha and removal of doshas.",
        },
        {
            question: "Is prasad included?",
            answer: "Prasad is optional. You can add a blessed prasad box for ₹298 during booking and it will be couriered to your home after the puja.",
        },
        {
            question: "Can I book from outside India?",
            answer: "Yes. You can book from anywhere in the world. The puja is performed at Shri Hanuman Garhi Mandir, Ayodhya on your behalf and the video is sent to you on WhatsApp.",
        },
        {
            question: "What if I don't know my gotra?",
            answer: "No problem. Gotra is optional. If you leave it blank, the Sankalp is performed in your name (with 'Kashyap' gotra used by tradition).",
        },
        {
            question: "Do I need to keep the Mangalwar vrat?",
            answer: "It is not required. The puja is complete on its own. If you wish to observe the vrat at home, it is considered highly meritorious — but your booking and Sankalp are unaffected either way.",
        },
    ] as { question: string; answer: string }[],
};

export type HanumanPuja = typeof hanumanPuja;
