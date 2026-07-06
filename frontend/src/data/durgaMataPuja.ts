// ─────────────────────────────────────────────────────────────────────────
//  Maa Chintpurni Puja — FRONTEND-ONLY puja detail data.
//
//  This is an ONLINE puja: the puja is performed on the devotee's behalf by
//  verified pandits at Maa Chintpurni Dham (Una, Himachal Pradesh). The
//  devotee receives the puja video (with their name & gotra) on WhatsApp and
//  can optionally have blessed prasad couriered home. Nobody visits the
//  devotee's home.
//
//  This puja exists in the backend catalog (its real _id is used below), but
//  this dedicated page renders ENTIRELY from the data in this file — no
//  fetch-by-id call is made. It matches the standard PujaDetailPage
//  (frontend/src/components/booking/PujaPage.tsx) look exactly.
//
//  Because the real backend `_id` is kept below, the existing booking flow
//  (BookingModal → /bookings/create-pending) and the enquiry flow both keep
//  working unchanged.
//
//  Remove the feature by deleting:
//    • this file
//    • frontend/src/pages/DurgaMataPujaPage.tsx
//    • the DurgaMataPujaPage route + lazy import in App.tsx
// ─────────────────────────────────────────────────────────────────────────

/** Route slug for the dedicated page (matches the route in App.tsx). */
export const DURGA_MATA_PUJA_SLUG = "maa-chintpurni-puja";

/** Old slug kept as a redirect so existing links/ads don't 404. */
export const DURGA_MATA_PUJA_LEGACY_SLUG = "shri-durga-mata-puja-home";

/** Add-on price for the optional blessed prasad box (₹). */
export const PRASAD_BOX_PRICE = 298;

/**
 * The puja shaped exactly like a backend pooja document so it can be handed
 * straight to PujaDetailPage's UI and to BookingModal / the enquiry flow.
 */
export const durgaMataPuja = {
    _id: "68618904380dcc9b941760f7",
    poojaID: "RF_18",
    poojaNameEng: "Maa Chintpurni Puja",
    poojaNameHindi: "श्री माँ चिंतपूर्णी पूजा",
    poojaMode: "online", // online puja performed at Maa Chintpurni Dham on your behalf
    poojaPriceOnline: 501,
    poojaPriceOffline: 501,
    poojaGods: [] as string[],
    poojaCardImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/chinpurni%20maa.webp",
    poojaMainImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/chinpurni%20maa.webp",
    poojaImages: [
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/chinpurni%20maa.webp",
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/chinpurni%20maa.webp",
    ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the LiveMandir-style detail page) ──
    deity: "Maa Chintpurni",
    /** Temple where the online puja is performed on your behalf. */
    templeName: "Maa Chintpurni Dham",
    templeLocation: "Una, Himachal Pradesh",
    rating: 4.9,
    devoteesLabel: "50K+",
    /** Scheduled date of this puja. */
    pujaDate: "July 22, 2026",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Fulfils heartfelt wishes at the sacred Chintpurni Shakti Peeth",
        "Removes worries (chinta), fear, and mental unrest",
        "Invokes the protective blessings of Maa Chintpurni",
        "Clears obstacles and negative energies from life",
        "Brings courage, prosperity, and family well-being",
        "Creates a spiritually positive and peaceful environment",
    ],

    isActive: true,
    isFeatured: true,
    isExclusive: true,
    // Dakshina must stay ≤ the price: the backend derives the stored pooja
    // price as (amount − panditDakshina). ₹251 dakshina → ₹250 pooja price.
    panditDakshina: 251,
    samagriDetails: [] as any[],
    samagriPrice: 0,
    poojaBenefitsDescription:
        "Verified pandits perform Maa Chintpurni Puja on your behalf at Maa Chintpurni Dham with devotion and traditional Vedic rituals.<br>\r\nA personalised Sankalp is done in your name and gotra so the puja is dedicated to you and your family.<br>\r\nOfferings include red chunri, red flowers, coconut, sweets, and incense, with Durga Saptashati mantras and aarti.<br>\r\nYou receive the puja video with your name &amp; gotra on WhatsApp, and can have blessed prasad couriered to your home.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To seek the divine blessings of <strong>Maa Chintpurni</strong>, worshipped at the revered <strong>Chintpurni Shakti Peeth</strong> for fulfilling wishes and removing worries.</p><p>This online puja is performed on your behalf at <strong>Maa Chintpurni Dham</strong> to remove obstacles, dispel fear and mental unrest, and bring courage, prosperity, and spiritual strength into life.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Tuesday or Friday</p><p>These days are considered highly auspicious for worshipping <strong>Maa Chintpurni</strong> and seeking her blessings for protection, strength, and fulfilment of wishes.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• Fulfils heartfelt wishes at the sacred <strong>Chintpurni Shakti Peeth</strong>.</p><p> • Removes worries (chinta), fear, and mental unrest.</p><p> • Invokes the protective blessings of <strong>Maa Chintpurni</strong>.</p><p> • Clears obstacles and negative energies from life.</p><p> • Brings courage, prosperity, and family well-being.</p><p> • Creates a spiritually positive and peaceful environment.</p>",
        },
        {
            headingId: "4",
            heading: "What is performed",
            description:
                "<p>Verified pandits perform the complete Vedic vidhi at <strong>Maa Chintpurni Dham</strong> — <strong>Sankalp in your name &amp; gotra</strong>, invocation of <strong>Maa Chintpurni</strong>, Durga Saptashati mantra chanting, and aarti.</p><p>The entire puja is dedicated specifically to you and your family, and is recorded for you.</p>",
        },
        {
            headingId: "5",
            heading: "Offerings made on your behalf",
            description:
                "<p>• Red chunri and red flowers offered to <strong>Maa Chintpurni</strong></p><p> • Kumkum, turmeric, and akshata (rice)</p><p> • Coconut, fruits, and sweets as prasad</p><p> • Diya, incense, and camphor for aarti</p><p> • Durga Saptashati path and sacred mantra chanting</p>",
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
                "<p><strong>Red</strong></p><p>Red symbolizes the divine energy, power, and strength of <strong>Maa Chintpurni</strong>, making it the most auspicious color for this puja.</p>",
        },
        {
            headingId: "8",
            heading: "Things to remember",
            description:
                "<p>• Share the correct name &amp; gotra for an accurate Sankalp.</p><p> • Keep a devotional and positive frame of mind on the puja day.</p><p> • You can join the puja in spirit and pray with faith from home.</p><p> • Watch the puja video shared with you and offer prayers sincerely.</p><p> • Share the prasad with family members after it arrives.</p>",
        },
    ],
    faqs: [
        {
            question: "Will I get the puja video?",
            answer: "Yes. The full puja video, with your name and gotra taken during the Sankalp, is shared with you on WhatsApp after the puja.",
        },
        {
            question: "Is prasad included?",
            answer: "Prasad is optional. You can add a blessed prasad box for ₹298 during booking and it will be couriered to your home after the puja.",
        },
        {
            question: "Can I book from outside India?",
            answer: "Yes. You can book from anywhere in the world. The puja is performed at Maa Chintpurni Dham on your behalf and the video is sent to you on WhatsApp.",
        },
        {
            question: "What if I don't know my gotra?",
            answer: "No problem. Gotra is optional. If you leave it blank, the Sankalp is performed in your name (with 'Kashyap' gotra used by tradition).",
        },
        {
            question: "When will the puja happen?",
            answer: "The puja is scheduled for July 22, 2026. The exact timing is confirmed with you on WhatsApp before the puja begins.",
        },
    ] as { question: string; answer: string }[],
};

export type DurgaMataPuja = typeof durgaMataPuja;
