// ─────────────────────────────────────────────────────────────────────────
//  Devshayani Ekadashi — Tri-Dham Maha Chadhava Combo (BACKEND authoritative)
//
//  Server-side source of truth used ONLY so Razorpay can charge a validated
//  amount for the frontend-only combo offering. It mirrors
//  frontend/src/data/devshayaniCombo.ts — keep the combo bundle price AND the
//  individual seva codes/prices below in sync with that file:
//    DEVSHAYANI_COMBO_PRICE (env)  ⇄  VITE_DEVSHAYANI_COMBO_PRICE (frontend)
//    COMBO_ITEMS (below)           ⇄  COMBO_ITEMS (frontend data file)
//
//  Remove the feature by deleting this file and the guarded
//  `resolveDevshayaniCombo` calls in chadhavaController.ts.
// ─────────────────────────────────────────────────────────────────────────

export const DEVSHAYANI_COMBO_SLUG = "devshayani-ekadashi-combo";
export const DEVSHAYANI_COMBO_CODE = "devshayani_tridham_combo";

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Bundle price charged (INR). Override via DEVSHAYANI_COMBO_PRICE env var. */
const COMBO_PRICE = num(process.env.DEVSHAYANI_COMBO_PRICE, 1100);

// The 14 individually-addable sevas — codes + prices MUST match the frontend.
const COMBO_ITEMS: Array<{ code: string; name: string; price: number }> = [
  { code: "dev_makhan_mishri", name: "Makhan Mishri", price: 301 },
  { code: "dev_paan", name: "Paan Chadhava", price: 401 },
  { code: "dev_deepak", name: "Deepak Seva", price: 121 },
  { code: "dev_laddu", name: "Laddu Seva", price: 151 },
  { code: "dev_tulsi", name: "Tulsi Seva", price: 251 },
  { code: "dev_gangajal", name: "Gangajal Seva", price: 301 },
  { code: "dev_chandan", name: "Chandan Seva", price: 401 },
  { code: "dev_flowers", name: "Flowers", price: 301 },
  { code: "dev_morpankh", name: "Morpankh", price: 301 },
  { code: "dev_gulab_itra", name: "Gulab Itra", price: 451 },
  { code: "dev_nishan", name: "Nishan", price: 251 },
  { code: "dev_churma", name: "Churma", price: 121 },
  { code: "dev_dry_fruits", name: "Dry Fruits", price: 501 },
  { code: "dev_seasonal_fruits", name: "Seasonal Fruits", price: 141 },
];

/**
 * Returns the combo shaped just enough for resolvePricing() + the booking
 * record (needs `.sections[].items[]`, `.deity`, `.templeName`).
 */
export const resolveDevshayaniCombo = (slug: string): any | null => {
  if (slug !== DEVSHAYANI_COMBO_SLUG) return null;

  const items = [
    {
      code: DEVSHAYANI_COMBO_CODE,
      itemName: "Tri-Dham Maha Combo — All 9 Sevas at 3 Temples",
      itemDesc: "All 9 sacred offerings performed at three dhams on Devshayani Ekadashi.",
      itemImage: "",
      itemPrice: COMBO_PRICE,
      maxQuantity: 5,
      popular: true,
      isActive: true,
    },
    ...COMBO_ITEMS.map((it) => ({
      code: it.code,
      itemName: it.name,
      itemDesc: "",
      itemImage: "",
      itemPrice: it.price,
      maxQuantity: 10,
      popular: false,
      isActive: true,
    })),
  ];

  return {
    slug: DEVSHAYANI_COMBO_SLUG,
    deity: "Devshayani Ekadashi Tri-Dham Maha Chadhava",
    templeName: "Khatu Shyam Ji, Banke Bihari Ji & Shri Badrinath Ji",
    templeLocation: "Three Sacred Dhams",
    image: "",
    sections: [{ sectionName: "Devshayani Ekadashi Maha Combo", items }],
    prasad: { enabled: true, price: 298, name: "Tri-Dham Prasad Box", desc: "", image: "" },
  };
};
