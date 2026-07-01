// ─────────────────────────────────────────────────────────────────────────
//  Shri Durga Mata Puja — FRONTEND-ONLY puja detail data.
//
//  This puja exists in the backend catalog (its real _id is used below), but
//  this dedicated page renders ENTIRELY from the data in this file — no
//  fetch-by-id call is made. It matches the standard PujaDetailPage
//  (frontend/src/components/booking/PujaPage.tsx) look exactly, the same way
//  the Devshayani Ekadashi combo re-used ChadhavaDetailPage.
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
export const DURGA_MATA_PUJA_SLUG = "shri-durga-mata-puja-home";

/**
 * The puja shaped exactly like a backend pooja document so it can be handed
 * straight to PujaDetailPage's UI and to BookingModal / the enquiry flow.
 */
export const durgaMataPuja = {
    _id: "68618904380dcc9b941760f7",
    poojaID: "RF_18",
    poojaNameEng: "Shri Durga Mata Puja",
    poojaNameHindi: "श्री दुर्गा माता पूजा",
    poojaMode: "offline", // home-only puja (pandit ji visits your home)
    poojaPriceOnline: 2101,
    poojaPriceOffline: 2100,
    poojaGods: [] as string[],
    poojaCardImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/maa%20durga.webp",
    poojaMainImage:
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/maa%20durga.webp",
    poojaImages: [
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/maa%20durga.webp",
        "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/maa%20durga.webp",
    ],
    poojaVideoLink: "",

    // ── Presentation-only fields (used by the LiveMandir-style detail page) ──
    deity: "Maa Durga",
    rating: 4.9,
    devoteesLabel: "50K+",
    /** Scheduled date of this puja. */
    pujaDate: "July 15, 2026",
    /** Short outcome bullets shown in the "Why perform this puja" card. */
    benefits: [
        "Invokes the protective blessings of Maa Durga",
        "Removes negative energies and obstacles from life",
        "Brings courage, strength, and confidence",
        "Promotes prosperity, success, and well-being",
        "Protects the home and family from harmful influences",
        "Creates a spiritually positive and peaceful environment",
    ],

    isActive: true,
    isFeatured: true,
    isExclusive: true,
    panditDakshina: 1100,
    samagriDetails: [] as any[],
    samagriPrice: 0,
    poojaBenefitsDescription:
        "The pandit will visit your home to conduct Shri Durga Mata Puja with devotion and traditional rituals.<br>\r\nOfferings include red flowers, kumkum, coconut, sweets, and incense.<br>\r\nDurga Saptashati mantras and aarti will be recited for invoking the Divine Mother’s energy.<br>\r\nThe ritual is aimed at removing negative energies and empowering spiritual strength.<br>",
    poojaDescription: [
        {
            headingId: "1",
            heading: "Purpose of Puja",
            description:
                "<p>To invoke the divine blessings of <strong>Maa Durga</strong>, the goddess of strength, protection, and divine power.</p><p>This puja is performed to remove obstacles, protect the family from negative energies, and bring courage, prosperity, and spiritual strength into life.</p>",
        },
        {
            headingId: "2",
            heading: "Best Time to Perform",
            description:
                "<p><strong>Day:</strong> Tuesday or Friday</p><p>These days are considered highly auspicious for worshipping <strong>Maa Durga</strong> and seeking her blessings for protection, strength, and prosperity.</p>",
        },
        {
            headingId: "3",
            heading: "Benefits of Puja",
            description:
                "<p>• Invokes the protective blessings of <strong>Maa Durga</strong>.</p><p> • Removes negative energies and obstacles from life.</p><p> • Brings courage, strength, and confidence.</p><p> • Promotes prosperity, success, and well-being.</p><p> • Protects the home and family from harmful influences.</p><p> • Creates a spiritually positive and peaceful environment.</p>",
        },
        {
            headingId: "4",
            heading: "Setup to be made",
            description:
                "<p>Prepare a clean altar by spreading a <strong>red cloth</strong> on a table or floor.</p><p>Place a <strong>photo or idol of Maa Durga</strong> along with a kalash, diya, and incense.</p><p>Arrange red flowers, kumkum, turmeric, coconut, fruits, and prasad neatly on the altar before beginning the puja.</p>",
        },
        {
            headingId: "5",
            heading: "Things Pandit ji will bring",
            description:
                "<p>• Complete puja samagri (kumkum, turmeric, akshata)</p><p> • Durga yantra or sacred symbols</p><p> • Kalash with sacred water</p><p> • Incense sticks, camphor, and diya</p><p> • Items required for Durga mantra chanting and rituals</p><p> • Mantras and guidance for Durga Puja</p>",
        },
        {
            headingId: "6",
            heading: "Things you have to arrange",
            description:
                "<p>• Red cloth for the altar</p><p> • Photo or idol of <strong>Maa Durga</strong></p><p> • Red flowers for offerings</p><p> • Kumkum, turmeric, and rice (akshata)</p><p> • Coconut and fruits for prasad</p><p> • Sweets or simple prasad</p><p> • A diya with ghee or oil</p><p> • Clean water in a vessel</p>",
        },
        {
            headingId: "7",
            heading: "Colours Preferred",
            description:
                "<p><strong>Red</strong></p><p>Red symbolizes the divine energy, power, and strength of <strong>Maa Durga</strong>, making it the most auspicious color for this puja.</p>",
        },
        {
            headingId: "8",
            heading: "Things to remember",
            description:
                "<p>• Take a bath and wear clean clothes before the puja.</p><p> • Maintain devotion and focus throughout the ritual.</p><p> • Follow Pandit Ji’s instructions carefully.</p><p> • Offer prayers with sincerity and faith to Maa Durga.</p><p> • Share prasad with family members after the puja.</p>",
        },
    ],
    faqs: [] as { question: string; answer: string }[],
};

export type DurgaMataPuja = typeof durgaMataPuja;
