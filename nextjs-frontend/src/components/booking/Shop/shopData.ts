// ─────────────────────────────────────────────────────────────
//  Spiritual Shop — Types + Dummy Data
//  NOTE: Hard-coded for now. When the backend is ready, replace
//  `SHOP_PRODUCTS` with a fetch returning the same `ShopProduct[]`
//  shape (the ShopSection already does this with a fallback).
// ─────────────────────────────────────────────────────────────

export type ShopCategory =
    | "All"
    | "Rudraksha"
    | "Idols"
    | "Mala"
    | "Yantra"
    | "Puja Samagri"
    | "Books";

export interface ShopProduct {
    id: string;
    name: string;
    category: Exclude<ShopCategory, "All">;
    image: string;
    shortDesc: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    inStock: boolean;
    badge?: string;
    highlights: string[];
}

export interface CartLine {
    product: ShopProduct;
    qty: number;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
    "All", "Rudraksha", "Idols", "Mala", "Yantra", "Puja Samagri", "Books",
];

export const SHOP_PRODUCTS: ShopProduct[] = [
    {
        id: "5-mukhi-rudraksha",
        name: "Certified 5-Mukhi Rudraksha",
        category: "Rudraksha",
        image: "https://images.unsplash.com/photo-1591123720164-de1348028b46?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Lab-certified, energised Nepali bead",
        price: 451,
        originalPrice: 699,
        rating: 4.8,
        reviews: 1240,
        inStock: true,
        badge: "Bestseller",
        highlights: ["Lab certificate included", "Energised by pandit", "Original Nepali bead"],
    },
    {
        id: "panchmukhi-hanuman-idol",
        name: "Panchmukhi Hanuman Idol",
        category: "Idols",
        image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Solid brass, hand-finished 5\" idol",
        price: 1299,
        originalPrice: 1899,
        rating: 4.9,
        reviews: 540,
        inStock: true,
        badge: "Premium",
        highlights: ["Pure brass", "Hand-engraved detailing", "Temple-grade finish"],
    },
    {
        id: "sphatik-crystal-mala",
        name: "Sphatik (Crystal) Mala",
        category: "Mala",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80&auto=format&fit=crop",
        shortDesc: "108 + 1 beads natural quartz",
        price: 351,
        originalPrice: 551,
        rating: 4.7,
        reviews: 820,
        inStock: true,
        highlights: ["Natural quartz", "108 + 1 beads", "Cooling & calming"],
    },
    {
        id: "shree-yantra-gold",
        name: "Shree Yantra (Gold Plated)",
        category: "Yantra",
        image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&auto=format&fit=crop",
        shortDesc: "For wealth & prosperity",
        price: 799,
        originalPrice: 1199,
        rating: 4.8,
        reviews: 410,
        inStock: true,
        badge: "Most Loved",
        highlights: ["24k gold plated", "Energised & ready to place", "Attracts abundance"],
    },
    {
        id: "hanuman-chalisa-hardcover",
        name: "Hanuman Chalisa (Hardcover)",
        category: "Books",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Illustrated, with meaning",
        price: 149,
        originalPrice: 249,
        rating: 4.9,
        reviews: 2100,
        inStock: true,
        highlights: ["Hindi + meaning", "Premium hardcover", "Pocket-friendly size"],
    },
    {
        id: "brass-puja-thali-set",
        name: "Brass Puja Thali Set",
        category: "Puja Samagri",
        image: "https://images.unsplash.com/photo-1567591414240-e9c1d9c0e0e0?w=600&q=80&auto=format&fit=crop",
        shortDesc: "7-piece complete aarti set",
        price: 649,
        originalPrice: 999,
        rating: 4.7,
        reviews: 360,
        inStock: true,
        highlights: ["7-piece set", "Pure brass", "Includes diya, bell & incense holder"],
    },
    {
        id: "tulsi-mala",
        name: "Tulsi Mala",
        category: "Mala",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Sacred basil wood, 108 beads",
        price: 199,
        originalPrice: 299,
        rating: 4.6,
        reviews: 980,
        inStock: true,
        highlights: ["Original Tulsi wood", "108 beads", "For daily jaap"],
    },
    {
        id: "lakshmi-idol-marble",
        name: "Maa Lakshmi Idol",
        category: "Idols",
        image: "https://images.unsplash.com/photo-1605197161470-5d2a9af0ac7e?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Marble-dust, hand-painted",
        price: 999,
        originalPrice: 1499,
        rating: 4.8,
        reviews: 290,
        inStock: true,
        highlights: ["Marble dust finish", "Hand-painted", "Ideal for home mandir"],
    },
    {
        id: "gomti-chakra-set",
        name: "Gomti Chakra Set (11 pcs)",
        category: "Puja Samagri",
        image: "https://images.unsplash.com/photo-1591123720164-de1348028b46?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Natural, for vastu & prosperity",
        price: 251,
        originalPrice: 401,
        rating: 4.5,
        reviews: 510,
        inStock: true,
        highlights: ["11 natural chakras", "For vastu remedies", "Energised"],
    },
    {
        id: "parad-shivling",
        name: "Parad Shivling",
        category: "Idols",
        image: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Mercury (parad) — highly auspicious",
        price: 1599,
        originalPrice: 2299,
        rating: 4.9,
        reviews: 175,
        inStock: false,
        badge: "Rare",
        highlights: ["Solidified mercury", "Highly auspicious", "With wooden base"],
    },
    {
        id: "navgrah-shanti-yantra",
        name: "Navgrah Shanti Yantra",
        category: "Yantra",
        image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Balances all 9 planets",
        price: 551,
        originalPrice: 851,
        rating: 4.7,
        reviews: 230,
        inStock: true,
        highlights: ["Copper finish", "For graha dosha", "Energised & ready"],
    },
    {
        id: "bhagavad-gita-illustrated",
        name: "Bhagavad Gita (Illustrated)",
        category: "Books",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80&auto=format&fit=crop",
        shortDesc: "Hindi + English with art",
        price: 299,
        originalPrice: 499,
        rating: 4.9,
        reviews: 1450,
        inStock: true,
        highlights: ["Hindi + English", "Full-colour illustrations", "Premium binding"],
    },
];

// Flat shipping rule used by the cart (also enforced on the server).
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 49;

export const calcShipping = (subtotal: number) =>
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
