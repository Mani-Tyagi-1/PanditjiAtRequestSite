// ─────────────────────────────────────────────────────────────────────────
//  Shree Kashi Rudrabhishek Mahapuja — FRONTEND-ONLY puja detail data.
//
//  This is an ONLINE puja: the puja is performed on the devotee's behalf by
//  verified pandits at Shree Kashi Vishwanath Temple (Varanasi, Uttar
//  Pradesh) on the FIRST SAVAN SOMWAR — Monday, 3 August 2026. The devotee
//  receives the puja video (with their name & gotra) on WhatsApp and can
//  optionally have blessed prasad couriered home. Nobody visits the
//  devotee's home.
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

/** Route slug for the dedicated page (matches the route in App.tsx). */
export const KASHI_MAHADEV_PUJA_SLUG = "kashi-mahadev-savan-puja";

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

/** First Savan Somwar of Shravan 2026 (Sawan runs 30 Jul – 28 Aug 2026). */
export const FIRST_SAVAN_SOMWAR = "August 3, 2026";

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
    poojaNameEng: "Shree Kashi Rudrabhishek Mahapuja",
    poojaNameHindi: "श्री काशी रुद्राभिषेक महापूजा",
    poojaMode: "online", // performed at Kashi Vishwanath Temple on your behalf
    poojaPriceOnline: 1100,
    poojaPriceOffline: 1100,
    poojaGods: [] as string[],
    // Kashi banner artwork.
    poojaCardImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kashi%20banner%20(2).png",
    poojaMainImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kashi%20banner%20(2).png",
    poojaImages: [
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kashi%20banner%20(2).png",
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Kashi%20banner%20(2).png",
    ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the Savan-themed detail page) ──
    deity: "Baba Vishwanath",
    /** Temple where the online puja is performed on your behalf. */
    templeName: "Kashi",
    templeLocation: "Varanasi, Uttar Pradesh",
    rating: 4.9,
    devoteesLabel: "75K+",
    /** Scheduled date of this puja — the first Savan Somwar. */
    pujaDate: FIRST_SAVAN_SOMWAR,
    /** Savan-specific framing shown in the hero. */
    occasion: "First Savan Somwar",
    occasionHindi: "प्रथम सावन सोमवार",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Rudrabhishek at Kashi Vishwanath — Mahadev's own eternal city",
        "Gangajal drawn from the Ganga at Varanasi offered in your name",
        "Removes fear, ill health, and untimely misfortune (Mahamrityunjaya blessings)",
        "Kashi is the foremost kshetra for pacifying Pitra, Kaal Sarp and Shani doshas",
        "Brings marital harmony and blessings for an early, suitable match",
        "Grants inner peace, courage, and progress toward moksha",
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
        "Verified pandits perform Rudrabhishek of Baba Vishwanath on your behalf at Kashi on the first Savan Somwar with traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include Gangajal drawn from the Ganga at Varanasi, milk, bel patra, dhatura, bhang, white flowers and chandan, with Rudri path and Mahamrityunjaya mantra chanting.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To seek the blessings of <strong>Baba Vishwanath</strong> — <strong>Mahadev</strong> as the Lord of the Universe, worshipped at <strong>Kashi Vishwanath</strong>, among the most revered of the twelve Jyotirlingas.</p><p><strong>Kashi (Varanasi)</strong> is held to be Shiva's own city, said to rest upon his trishul and to stand untouched even at the dissolution of the world. The month of <strong>Shravan (Savan)</strong> is his most beloved month, and <strong>Savan Somwar</strong> is its most powerful day. This online puja is performed on your behalf at <strong>Shree Kashi Vishwanath Temple</strong> on the <strong>first Savan Somwar</strong> to remove fear, illness and suffering, and to invite peace, courage and prosperity.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Monday, 3 August 2026 — the first Savan Somwar</p><p>Shravan month runs from <strong>30 July to 28 August 2026</strong>. Mondays of this month are considered the single most auspicious time in the year to worship <strong>Mahadev</strong>, and the <em>first</em> Savan Somwar is held to be the most fruitful of them all. In Savan, lakhs of kanwariyas carry Gangajal from Kashi to offer at Shiva temples across India.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• Rudrabhishek at <strong>Kashi Vishwanath</strong>, Mahadev's own eternal city.</p><p> • <strong>Gangajal</strong> drawn from the Ganga at Varanasi offered in your name.</p><p> • Removes fear, ill health, and untimely misfortune through <strong>Mahamrityunjaya</strong> blessings.</p><p> • Kashi is the foremost kshetra for pacifying <strong>Pitra Dosh</strong>, <strong>Kaal Sarp Dosh</strong> and <strong>Shani</strong> afflictions.</p><p> • Brings marital harmony, and blessings for an early and suitable match.</p><p> • Grants inner peace, courage, and progress toward <strong>moksha</strong>.</p>",
        },
        {
            headingId: "4",
            heading: "What is performed",
            description:
                "<p>Verified pandits perform the complete Vedic vidhi at <strong>Shree Kashi Vishwanath Temple</strong> — <strong>Sankalp in your name &amp; gotra</strong>, <strong>Rudrabhishek</strong> of the Jyotirlinga with Gangajal and panchamrit, <strong>Rudri path</strong>, <strong>Mahamrityunjaya mantra</strong> chanting, and Shiv aarti.</p><p>The entire puja is dedicated specifically to you and your family, and is recorded for you.</p>",
        },
        {
            headingId: "5",
            heading: "Offerings made on your behalf",
            description:
                "<p>• <strong>Gangajal</strong> drawn from the Ganga at Varanasi, and raw milk abhishek</p><p> • <strong>Bel patra</strong>, dhatura, bhang and white aak flowers</p><p> • Panchamrit — milk, curd, ghee, honey and sugar</p><p> • Chandan, bhasma, akshata and white flowers</p><p> • Diya, dhoop and camphor for the Shiv aarti</p><p> • <strong>Rudri path</strong> and Mahamrityunjaya mantra chanting</p>",
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
                "<p><strong>White</strong> and <strong>Saffron</strong></p><p>White reflects the purity, bhasma and detachment of <strong>Mahadev</strong>, while saffron marks the devotion of the Savan kanwar tradition that flows out of Kashi — together the most auspicious colours for this puja.</p>",
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
            answer: "On Monday, 3 August 2026 — the first Savan Somwar of Shravan 2026. The exact timing is confirmed with you on WhatsApp before the puja begins.",
        },
        {
            question: "Will I get the puja video?",
            answer: "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
        },
        {
            question: "What is Rudrabhishek?",
            answer: "Rudrabhishek is the ceremonial bathing of the Shivling with Gangajal, milk, panchamrit and sacred offerings while Rudri path and Shiv mantras are chanted. It is the most traditional way of worshipping Mahadev during Savan.",
        },
        {
            question: "Why is Kashi special for Shiva puja?",
            answer: "Kashi (Varanasi) is regarded as Mahadev's own city — said to rest on his trishul and to remain untouched even at the dissolution of the world. Kashi Vishwanath is among the most revered of the twelve Jyotirlingas, and Savan there is the most sacred time of the year.",
        },
        {
            question: "Is prasad included?",
            answer: "Prasad is optional. You can add a blessed prasad box for ₹298 during booking and it will be couriered to your home after the puja.",
        },
        {
            question: "Can I book from outside India?",
            answer: "Yes. You can book from anywhere in the world. The puja is performed at Kashi Vishwanath Temple, Varanasi on your behalf and the video is sent to you on WhatsApp.",
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
