// ─────────────────────────────────────────────────────────────
//  Chadhava (Offerings) Booking — Types + Dummy Data
//  NOTE: Hard-coded for now. When the backend is ready, replace
//  `CHADHAVA_LIST` with an API fetch returning the same
//  `Chadhava[]` shape. The prasad-box upsell can also come from
//  the backend later (see `PRASAD_BOX_UPSELL`).
// ─────────────────────────────────────────────────────────────

export interface ChadhavaOffering {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string; // emoji shown in the offering tile
    popular?: boolean;
}

export interface Chadhava {
    id: string;
    deity: string;
    deityHindi: string;
    templeName: string;
    templeLocation: string;
    image: string;
    /** e.g. "Offered every Tuesday & Saturday" */
    offeringDay: string;
    startingPrice: number;
    originalPrice?: number;
    rating: number;
    devoteesOffered: number;
    benefits: string[];
    tags: string[];
    offerings: ChadhavaOffering[];
    /** Deity-specific keepsake (idol / chalisa / rudraksha) upsold at review */
    spiritualProduct: AddOnProduct;
}

// ── Add-on products shown as upsells at the review step ──
export interface AddOnProduct {
    id: string;
    name: string;
    tagline: string;
    image: string;
    price: number;
    originalPrice: number;
    items: string[];
}

// Kept as an alias so existing imports don't break.
export type PrasadBoxProduct = AddOnProduct;

// Global prasad box — same for every chadhava.
export const PRASAD_BOX_UPSELL: AddOnProduct = {
    id: "blessed-prasad-box",
    name: "Blessed Prasad Box",
    tagline: "Temple prasad & sacred items delivered to your home",
    image: "https://images.unsplash.com/photo-1605197161470-5d2a9af0ac7e?w=600&q=80&auto=format&fit=crop",
    price: 251,
    originalPrice: 401,
    items: ["Temple Laddoo & Pedha", "Sacred Chunri / Cloth", "Raksha Kavach Thread", "Vibhuti & Roli Tilak"],
};

const offerings = (base: number): ChadhavaOffering[] => [
    { id: "flowers", name: "Pushp & Mala", description: "Fresh flowers & garland offered in your name.", price: base, icon: "🌺" },
    { id: "chunri", name: "Chunri & Shringar", description: "Sacred chunri with shringar samagri.", price: Math.round(base * 1.6), icon: "🧣", popular: true },
    { id: "bhog", name: "Bhog & Prasad", description: "Sweets & bhog offered, then blessed.", price: Math.round(base * 2.2), icon: "🪔" },
    { id: "maha", name: "Maha Chadhava", description: "Full offering — flowers, chunri, bhog & deepdaan.", price: Math.round(base * 3.4), icon: "👑" },
];

export const CHADHAVA_LIST: Chadhava[] = [
    {
        id: "khatu-shyam-chola",
        deity: "Khatu Shyam Ji",
        deityHindi: "खाटू श्याम",
        templeName: "Khatu Shyam Mandir",
        templeLocation: "Sikar, Rajasthan",
        image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop",
        offeringDay: "Offered every Phalgun & Ekadashi",
        startingPrice: 251,
        originalPrice: 401,
        rating: 4.9,
        devoteesOffered: 8420,
        benefits: ["Faith rewarded", "Removes hurdles", "Protection"],
        tags: ["Haare Ka Sahara", "Most Popular"],
        offerings: offerings(251),
        spiritualProduct: {
            id: "khatu-shyam-idol-chalisa",
            name: "Khatu Shyam Idol & Chalisa",
            tagline: "Energised brass idol with Shyam Chalisa for your mandir",
            image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=600&q=80&auto=format&fit=crop",
            price: 451,
            originalPrice: 699,
            items: ["Brass Khatu Shyam Idol", "Shyam Chalisa Book", "Mauli Nishan Dhwaj"],
        },
    },
    {
        id: "salasar-balaji-chola",
        deity: "Salasar Balaji",
        deityHindi: "सालासर बालाजी",
        templeName: "Salasar Dham",
        templeLocation: "Churu, Rajasthan",
        image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=800&q=80&auto=format&fit=crop",
        offeringDay: "Offered every Tuesday & Saturday",
        startingPrice: 351,
        originalPrice: 501,
        rating: 4.8,
        devoteesOffered: 5210,
        benefits: ["Courage & strength", "Wish fulfilment", "Removes fear"],
        tags: ["Sankat Mochan"],
        offerings: offerings(351),
        spiritualProduct: {
            id: "salasar-hanuman-chalisa-rudraksha",
            name: "Hanuman Chalisa & Rudraksha",
            tagline: "Sacred Hanuman Chalisa with a certified Rudraksha mala",
            image: "https://images.unsplash.com/photo-1591123720164-de1348028b46?w=600&q=80&auto=format&fit=crop",
            price: 351,
            originalPrice: 551,
            items: ["Hanuman Chalisa Book", "Certified Rudraksha Mala", "Sindoor Chola Pack"],
        },
    },
    {
        id: "vaishno-devi-shringar",
        deity: "Maa Vaishno Devi",
        deityHindi: "माँ वैष्णो देवी",
        templeName: "Vaishno Devi Bhawan",
        templeLocation: "Katra, Jammu & Kashmir",
        image: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=800&q=80&auto=format&fit=crop",
        offeringDay: "Offered every Navratri & Friday",
        startingPrice: 451,
        originalPrice: 651,
        rating: 5.0,
        devoteesOffered: 9630,
        benefits: ["Divine blessings", "Prosperity", "Strength"],
        tags: ["Shakti Peeth", "Most Loved"],
        offerings: offerings(451),
        spiritualProduct: {
            id: "vaishno-devi-idol-chunri",
            name: "Maa Vaishno Idol & Chunri Set",
            tagline: "Blessed Maa idol with red chunri & Durga Chalisa",
            image: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=600&q=80&auto=format&fit=crop",
            price: 551,
            originalPrice: 851,
            items: ["Maa Vaishno Devi Idol", "Red Shringar Chunri", "Durga Chalisa Book"],
        },
    },
    {
        id: "kashi-bel-patra",
        deity: "Kashi Vishwanath",
        deityHindi: "काशी विश्वनाथ",
        templeName: "Kashi Vishwanath",
        templeLocation: "Varanasi, Uttar Pradesh",
        image: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80&auto=format&fit=crop",
        offeringDay: "Offered every Monday & Pradosh",
        startingPrice: 301,
        originalPrice: 451,
        rating: 4.9,
        devoteesOffered: 7180,
        benefits: ["Peace of mind", "Health", "Moksha"],
        tags: ["Jyotirlinga"],
        offerings: offerings(301),
        spiritualProduct: {
            id: "kashi-rudraksha-shiv-chalisa",
            name: "Certified Rudraksha & Shiv Chalisa",
            tagline: "Lab-certified 5-mukhi Rudraksha with Shiv Chalisa",
            image: "https://images.unsplash.com/photo-1591123720164-de1348028b46?w=600&q=80&auto=format&fit=crop",
            price: 401,
            originalPrice: 651,
            items: ["5-Mukhi Certified Rudraksha", "Shiv Chalisa Book", "Bel Patra Mala"],
        },
    },
    {
        id: "tirupati-laddu-seva",
        deity: "Tirupati Balaji",
        deityHindi: "तिरुपति बालाजी",
        templeName: "Tirumala Temple",
        templeLocation: "Tirumala, Andhra Pradesh",
        image: "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800&q=80&auto=format&fit=crop",
        offeringDay: "Offered daily after Suprabhata",
        startingPrice: 551,
        originalPrice: 751,
        rating: 4.9,
        devoteesOffered: 6890,
        benefits: ["Wealth & abundance", "Wish fulfilment", "Harmony"],
        tags: ["Wish Fulfilment"],
        offerings: offerings(551),
        spiritualProduct: {
            id: "tirupati-balaji-idol-tulsi",
            name: "Balaji Idol & Tulsi Mala",
            tagline: "Sacred Balaji idol with a blessed Tulsi mala",
            image: "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=600&q=80&auto=format&fit=crop",
            price: 501,
            originalPrice: 799,
            items: ["Tirupati Balaji Idol", "Blessed Tulsi Mala", "Venkateswara Stotra Book"],
        },
    },
];
