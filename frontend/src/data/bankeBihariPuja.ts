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

/** Add-on price for the optional blessed prasad box (₹). */
export const PRASAD_BOX_PRICE = 298;

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
    /** Blessed prasad box (makhan-mishri peda) couriered home. */
    prasadBox: boolean;
    /** Tulsi kanthi mala from Vrindavan couriered home. */
    tulsiMala: boolean;
    /** Mor pankh (peacock feather) offered at Bihari Ji's charan, couriered home. */
    morPankh: boolean;
    /** Optional corner badge, e.g. "Most Popular". */
    badge?: string;
    /** Marks the recommended / default package. */
    highlight?: boolean;
    /** 2–3 short "what you get" lines shown on the card (positives only). */
    highlights: string[];
    /**
     * Physical items shipped with the package, shown as a row of images under
     * the selected card (premium/royal only). Paste the product image URL into
     * each `image`; an empty string renders a placeholder tile.
     */
    includedItems?: { label: string; image: string }[];
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
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/banke%20bihariji%20banner1.webp ";   

    

// TODO: paste the real product image URLs. Empty strings render a graceful
// placeholder tile, so the page is safe to ship before the artwork lands.
const PRASAD_BOX_IMAGE = "";
const TULSI_MALA_IMAGE = "";
const MOR_PANKH_IMAGE = "";

/**
 * The three booking packages. Every package includes the core Janmashtami
 * puja, personalised Sankalp and the puja video; they differ in the number of
 * free family Sankalps and the physical blessings couriered home. Extra family
 * members beyond a package's free allowance cost EXTRA_FAMILY_MEMBER_PRICE each.
 */
export const BANKE_BIHARI_PACKAGES: PujaPackage[] = [
    {
        id: "basic",
        name: "Makhan Bhog",
        tagline: "The essential Janmashtami seva",
        price: 501,
        freeFamilyMembers: 0,
        prasadBox: false,
        tulsiMala: false,
        morPankh: false,
        highlights: [
            "Puja in your name & gotra",
            "Personalised Sankalp + puja video",
        ],
    },
    {
        id: "premium",
        name: "Bihari Kripa",
        tagline: "Most-loved · seva with blessings",
        price: 1100,
        freeFamilyMembers: 2,
        prasadBox: true,
        tulsiMala: true,
        morPankh: false,
        badge: "Most Popular",
        highlight: true,
        highlights: [
            "2 family members added free",
            "Makhan-Mishri Prasad Box couriered home",
            "Free Tulsi Kanthi Mala from Vrindavan",
        ],
        includedItems: [
            { label: "Makhan-Mishri Prasad", image: PRASAD_BOX_IMAGE },
            { label: "Tulsi Kanthi Mala", image: TULSI_MALA_IMAGE },
        ],
    },
    {
        id: "royal",
        name: "Raas Vihari",
        tagline: "Complete seva for the whole family",
        price: 2100,
        freeFamilyMembers: 4,
        prasadBox: true,
        tulsiMala: true,
        morPankh: true,
        badge: "Best Value",
        highlights: [
            "4 family members added free",
            "Premium Prasad Box + Tulsi Kanthi Mala",
            "Free blessed Mor Pankh from Bihari Ji's charan",
        ],
        includedItems: [
            { label: "Makhan-Mishri Prasad", image: PRASAD_BOX_IMAGE },
            { label: "Tulsi Kanthi Mala", image: TULSI_MALA_IMAGE },
            { label: "Blessed Mor Pankh", image: MOR_PANKH_IMAGE },
        ],
    },
];

/** The recommended package, pre-selected on first load. */
export const DEFAULT_PACKAGE_ID: PujaPackageId = "premium";

/** Resolve a package by id, falling back to the first (cheapest) package. */
export function getPackage(id: PujaPackageId | undefined): PujaPackage {
    return BANKE_BIHARI_PACKAGES.find((p) => p.id === id) || BANKE_BIHARI_PACKAGES[0];
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
    return pkg.prasadBox || pkg.tulsiMala || pkg.morPankh;
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
    // Banner / card artwork.
    //
    // NOTE: this asset is the peacock-feather cut-out on a TRANSPARENT
    // background — it carries no deity portrait and no text (no title, temple
    // name or occasion). The hero therefore renders it with `object-contain`
    // over the theme's cream gradient rather than `object-cover`, so the whole
    // feather is visible and nothing is cropped. Swap in a designed Janmashtami
    // banner here if the hero should carry artwork + title instead.
    poojaCardImage: BANNER_IMG ,
    poojaMainImage: BANNER_IMG ,
    poojaImages: [BANNER_IMG ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the Banke Bihari themed page) ──
    deity: "Banke Bihari Ji",
    /** Temple where the online puja is performed on your behalf. */
    templeName: "Shri Banke Bihari Ji Mandir",
    templeLocation: "Vrindavan, Mathura",
    rating: 4.9,
    devoteesLabel: "75K+",
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
                "<p>• Personalised <strong>Sankalp</strong> performed in your name &amp; gotra</p><p> • Full <strong>puja video</strong> shared on WhatsApp</p><p> • Photos of the offerings made in your name</p><p> • Blessed <strong>makhan-mishri prasad</strong> couriered to your home</p><p> • Post-puja guidance from our team</p>",
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
            question: "Is prasad included?",
            answer: "Yes, in the Bihari Kripa and Raas Vihari packages. Blessed makhan-mishri prasad from the mandir is couriered to your home after the seva.",
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
            answer: "Yes. The Bihari Kripa package includes 2 family Sankalps free and Raas Vihari includes 4. Any name beyond your package's free allowance can be added for ₹151 each during booking, and every name is taken by the pandit during the Sankalp.",
        },
    ] as { question: string; answer: string }[],
};

export type BankeBihariPuja = typeof bankeBihariPuja;
