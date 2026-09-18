// ─────────────────────────────────────────────────────────────────────────
//  Devshayani Ekadashi — Tri-Dham Maha Chadhava Combo (FRONTEND-ONLY)
//
//  Campaign / Meta-ads offering that lives entirely on the frontend and is
//  rendered THROUGH the existing ChadhavaDetailPage (so it matches the standard
//  chadhava theme exactly). Remove the feature by deleting:
//    • this file
//    • frontend/src/components/DevshayaniComboCard.tsx
//    • the "Devshayani combo" block in ChadhavaPage.tsx
//    • the "Devshayani combo" block in ChadhavaDetailPage.tsx
//    • server/src/config/devshayaniCombo.ts + its guarded block in
//      chadhavaController.ts  (needed only so Razorpay can charge securely)
//
//  PRICES:
//    • Combo bundle price   → VITE_DEVSHAYANI_COMBO_PRICE  (frontend/.env)
//    • Individual seva prices lives in ITEM_PRICES below.
//  Both MUST match the authoritative copy in
//  server/src/config/devshayaniCombo.ts (that is what actually gets charged).
//
//  IMAGES: All images below are dummy placeholders — swap `COMBO_BANNER`, the
//  per-temple images, and the per-item images when the real art is ready.
// ─────────────────────────────────────────────────────────────────────────

import { type Chadhava } from "../components/booking/ChadhavaBooking/chadhavaData";

/** Slug used in the URL + sent to the backend as `chadhavaSlug`. */
export const DEVSHAYANI_COMBO_SLUG = "devshayani-ekadashi-combo";

/** The combo-bundle seva code (must match the backend combo catalog). */
export const DEVSHAYANI_COMBO_CODE = "devshayani_tridham_combo";

// ── Prices & date ──
const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Bundle price actually charged. Mirror in server/src/config/devshayaniCombo.ts */
export const COMBO_PRICE = num(import.meta.env.VITE_DEVSHAYANI_COMBO_PRICE, 1100);
/** Struck-through "original" price, for the savings badge. */
export const COMBO_ORIGINAL = num(import.meta.env.VITE_DEVSHAYANI_COMBO_ORIGINAL, 2100);
/** Optional prasad-box add-on (fixed at 298 across the whole chadhava flow). */
export const COMBO_PRASAD_PRICE = num(import.meta.env.VITE_DEVSHAYANI_PRASAD_PRICE, 298);
/** Offering date (ISO). Drives the countdown. Devshayani Ekadashi 2026. */
export const COMBO_DATE: string =
    (import.meta.env.VITE_DEVSHAYANI_DATE as string) || "2026-07-25T06:00:00+05:30";

// ── Dummy placeholder images (warm theme; swap when real art is ready) ──
const dummy = (_label: string) =>
    `https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/devs.webp`;

/** Hero banner (detail-page banner + list card). */
export const COMBO_HERO_BANNER = dummy("Devshayani Ekadashi Banner");
/** Second hero banner slide — paste the image link between the quotes below. */
export const COMBO_HERO_BANNER_2 = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Devshani%20ekadashi%20chadhava%20banner.webp";
/** Combo-only image (shown on the combo bundle card only). */
export const COMBO_BANNER = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/plate.webp";

/** The three sacred dhams this combo is offered at. */
export interface ComboTemple {
    name: string;
    location: string;
    image: string;
}
export const COMBO_TEMPLES: ComboTemple[] = [
    { name: "Khatu Shyam Ji", location: "Sikar, Rajasthan", image: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/mandir-images/mandir-images_1767187984681.webp" },
    { name: "Banke Bihari Ji", location: "Vrindavan, Mathura", image: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/mandir-images/mandir-images_1727172522731.png" },
    { name: "Shri Badrinath Ji", location: "Chamoli, Uttarakhand", image: "https://vedic-vaibhav.blr1.digitaloceanspaces.com/vedic-vaibhav/mandir-images/mandir-images_1760422975226.jpg" },
];

// ── What the prasad box includes (shown in the booking page accordion). ──
// Add the image URLs when the real art is ready.
export interface PrasadBoxItem {
    name: string;
    image: string;
}
export const COMBO_PRASAD_BOX_ITEMS: PrasadBoxItem[] = [
    { name: "Mix Dry Fruits Prasad", image: "" },
    { name: "Tulsi Mala", image: "" },
    { name: "Jaap Counter", image: "" },
    { name: "Evil Eye Bracelet", image: "" },
    { name: "Khatu Shyam Ji Tulsi Locket", image: "" },
];

// ── The 14 individual sevas (also addable on their own). ──
// NOTE: `code` + `price` MUST stay in sync with the backend catalog in
// server/src/config/devshayaniCombo.ts.
interface ComboItem {
    code: string;
    name: string;
    desc: string;
    price: number;
    image: string;
    popular?: boolean;
}
export const COMBO_ITEMS: ComboItem[] = [
    { code: "dev_makhan_mishri", name: "Makhan Mishri", desc: "Fresh butter & rock-sugar offered to the Lord.", price: 301, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/Makhan%20mishri.webp" },
    { code: "dev_paan", name: "Paan Chadhava", desc: "Sacred betel-leaf offering.", price: 401, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/paan%20seva.webp" },
    // { code: "dev_deepak", name: "Deepak Seva", desc: "Pure ghee lamp lit in your name.", price: 121, image: dummy("Deepak") },
    // { code: "dev_laddu", name: "Laddu Seva", desc: "Bhog of desi-ghee laddus.", price: 151, image: dummy("Laddu"), popular: true },
    { code: "dev_tulsi", name: "Tulsi Seva", desc: "Holy Tulsi dal, dear to Bhagwan Vishnu.", price: 251, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/Tulsi.webp" },
    { code: "dev_gangajal", name: "Gangajal Seva", desc: "Abhishek with sacred Gangajal.", price: 301, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/Ganga%20jal.webp" },
    { code: "dev_chandan", name: "Chandan Seva", desc: "Fragrant sandalwood tilak & offering.", price: 401, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/Chandan.webp" },
    { code: "dev_flowers", name: "Flowers", desc: "Fresh flower garland & petals.", price: 301, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/flower.webp" },
    { code: "dev_morpankh", name: "Morpankh", desc: "Peacock feather, adornment of Shri Krishna.", price: 301, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/morpankh.webp" },
    { code: "dev_gulab_itra", name: "Gulab Itra", desc: "Rose attar offered to the deity.", price: 451, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/itra.webp" },
    // { code: "dev_nishan", name: "Nishan", desc: "The sacred Nishan flag offered at the dham.", price: 251, image: dummy("Nishan") },
    // { code: "dev_churma", name: "Churma", desc: "Traditional churma bhog.", price: 121, image: dummy("Churma") },
    { code: "dev_dry_fruits", name: "Dry Fruits", desc: "Assorted dry-fruit offering.", price: 501, image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/dry.webp" },
    // { code: "dev_seasonal_fruits", name: "Seasonal Fruits", desc: "Fresh seasonal fruit bhog.", price: 141, image: dummy("Seasonal Fruits") },
];

/** Map the seva list into ChadhavaDetailPage's item shape. */
const toSevaItems = (items: ComboItem[]) =>
    items.map((it) => ({
        code: it.code,
        itemName: it.name,
        itemDesc: it.desc,
        itemImage: it.image,
        itemPrice: it.price,
        maxQuantity: 10,
        popular: it.popular || false,
        isActive: true,
        type: "item",
    }));

/**
 * The combo shaped as a `Chadhava` so it renders through the existing
 * ChadhavaDetailPage. Layout: first row of 3 sevas → the combo bundle →
 * the remaining sevas (continuation section, no title bar).
 */
export const devshayaniCombo: Chadhava = {
    id: DEVSHAYANI_COMBO_SLUG,
    slug: DEVSHAYANI_COMBO_SLUG,
    deity: "Devshayani Ekadashi Tri-Dham Maha Chadhava",
    deityHindi: "देवशयनी एकादशी त्रि-धाम महा चढ़ावा",
    templeName: "Khatu Shyam Ji, Banke Bihari Ji & Shri Badrinath Ji",
    templeLocation: "Three Sacred Dhams",
    image: COMBO_HERO_BANNER,
    bannerImages: [COMBO_HERO_BANNER, COMBO_HERO_BANNER_2].filter(Boolean),
    offeringDay: "Offered on Devshayani Ekadashi",
    availableDates: [COMBO_DATE],
    startingPrice: COMBO_PRICE,
    originalPrice: COMBO_ORIGINAL,
    rating: 4.7,
    devoteesOffered: 21008,
    benefits: [
        "Combined blessings of three powerful dhams in a single sankalp",
        "The most auspicious day to please Bhagwan Vishnu before Chaturmas",
        "Believed to relieve obstacles, debt and doshas as the Lord enters Yoga Nidra",
        "Photo & video proof of every offering delivered on WhatsApp",
    ],
    tags: ["Devshayani Ekadashi Special"],
    sections: [
        // First row — 3 sevas
        {
            sectionName: "Select Your Sevas",
            items: toSevaItems(COMBO_ITEMS.slice(0, 3)),
        },
        // The recommended combo bundle
        {
            sectionName: "Devshayani Ekadashi Maha Combo",
            items: [
                {
                    code: DEVSHAYANI_COMBO_CODE,
                    itemName: "Tri-Dham Maha Combo",
                    itemDesc:
                        "One sankalp — all 9 sacred offerings performed in your name at Khatu Shyam Ji, Banke Bihari Ji and Shri Badrinath Ji on Devshayani Ekadashi.",
                    itemImage: COMBO_BANNER,
                    itemPrice: COMBO_PRICE,
                    originalPrice: COMBO_ORIGINAL,
                    maxQuantity: 5,
                    popular: true,
                    isActive: true,
                    type: "combo",
                },
            ],
        },
        // Remaining sevas (continuation — no title bar)
        {
            sectionName: "",
            items: toSevaItems(COMBO_ITEMS.slice(3)),
        },
    ],
    prasad: {
        enabled: true,
        price: COMBO_PRASAD_PRICE,
        name: "Tri-Dham Prasad Box",
        desc: "Blessed prasad from all three temples, delivered to your home.",
        image: dummy("Prasad Box"),
    },
    description:
        "Devshayani Ekadashi marks the day Bhagwan Vishnu enters Yoga Nidra — the cosmic sleep of the four holy months of Chaturmas. Offerings made on this day are believed to reach the Lord manifold. This Tri-Dham Maha Combo unites the grace of Khatu Shyam Ji, Banke Bihari Ji and Shri Badrinath Ji, with all 9 sacred sevas performed in your name across the three dhams in a single sankalp.",
    mandirSectionIntro:
        "This special Devshayani Ekadashi combo lets you offer chadhava simultaneously at three of the most revered abodes of the Lord — Khatu Shyam Ji in Sikar, Banke Bihari Ji in Vrindavan and Shri Badrinath Ji in the Himalayas. Each seva is performed by temple priests in your name and gotra, with photo and video proof shared on WhatsApp.",
    mandirSectionHistory:
        "Devshayani Ekadashi, also known as Padma or Ashadhi Ekadashi, falls on the eleventh day of the bright fortnight of Ashadha. It begins Chaturmas, the four sacred months when devotees intensify their worship of Bhagwan Vishnu. Chadhava offered across these three dhams on this day is considered especially meritorious.",
};
