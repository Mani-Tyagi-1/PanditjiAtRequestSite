// ─────────────────────────────────────────────────────────────
//  Live Pujas from Mandir — Types + Data
//  NOTE: This data is hard-coded for now. When the backend is
//  ready, replace `LIVE_MANDIR_PUJAS` with an API fetch that
//  returns the same `LiveMandirPuja[]` shape — nothing else in the
//  UI needs to change.
// ─────────────────────────────────────────────────────────────

export interface LiveMandirPuja {
    id: string;
    pujaName: string;
    pujaNameHindi: string;
    templeName: string;
    templeLocation: string;
    deity: string;
    image: string;
    /** "live" = streaming right now, "upcoming" = scheduled, "daily" = performed every day */
    status: "live" | "upcoming" | "daily";
    scheduledDate: string;   // human label e.g. "Tomorrow" / "Mon, 16 Jun"
    scheduledTime: string;   // e.g. "06:00 AM"
    durationMins: number;
    price: number;
    originalPrice?: number;
    rating: number;
    devoteesJoined: number;
    benefits: string[];
    tags: string[];
    // ── Optional, API-ready fields. Rendered when the backend provides them;
    //    the page shows clearly-marked placeholders otherwise. ──
    includes?: string[];
    templeAbout?: string;
    templeHistory?: string;
    videos?: string[];
    ratingCount?: number;
    reviews?: LiveMandirReview[];
}

// (kept exported for typing placeholder + API review data)
export interface LiveMandirReview {
    name: string;
    rating: number;
    date: string;   // ISO or human label
    text: string;
    verified?: boolean;
}

export const LIVE_MANDIR_PUJAS: LiveMandirPuja[] = [
    {
        id: "kashi-vishwanath-rudrabhishek",
        pujaName: "Rudrabhishek",
        pujaNameHindi: "रुद्राभिषेक",
        templeName: "Kashi Vishwanath",
        templeLocation: "Varanasi, Uttar Pradesh",
        deity: "Lord Shiva",
        image: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80&auto=format&fit=crop",
        status: "live",
        scheduledDate: "Today",
        scheduledTime: "06:30 AM",
        durationMins: 45,
        price: 851,
        originalPrice: 1100,
        rating: 4.9,
        devoteesJoined: 2840,
        benefits: ["Removes negativity", "Health & longevity", "Peace at home"],
        tags: ["Most Popular", "Jyotirlinga"],
    },
    {
        id: "mahakaleshwar-bhasma-aarti",
        pujaName: "Bhasma Aarti",
        pujaNameHindi: "भस्म आरती",
        templeName: "Mahakaleshwar",
        templeLocation: "Ujjain, Madhya Pradesh",
        deity: "Lord Mahakal",
        image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=800&q=80&auto=format&fit=crop",
        status: "upcoming",
        scheduledDate: "Tomorrow",
        scheduledTime: "04:00 AM",
        durationMins: 60,
        price: 1100,
        originalPrice: 1500,
        rating: 4.7,
        devoteesJoined: 5120,
        benefits: ["Protection from fear", "Victory over enemies", "Moksha"],
        tags: ["Rare Seva", "Jyotirlinga"],
    },
    {
        id: "siddhivinayak-modak-puja",
        pujaName: "Modak Mahapuja",
        pujaNameHindi: "मोदक महापूजा",
        templeName: "Siddhivinayak",
        templeLocation: "Mumbai, Maharashtra",
        deity: "Lord Ganesha",
        image: "https://images.unsplash.com/photo-1567591414240-e9c1d9c0e0e0?w=800&q=80&auto=format&fit=crop",
        status: "daily",
        scheduledDate: "Every Tuesday",
        scheduledTime: "07:00 AM",
        durationMins: 40,
        price: 551,
        originalPrice: 751,
        rating: 4.8,
        devoteesJoined: 3960,
        benefits: ["Removes obstacles", "New beginnings", "Success in work"],
        tags: ["New Venture", "Prosperity"],
    },
    {
        id: "tirupati-balaji-archana",
        pujaName: "Suprabhata Archana",
        pujaNameHindi: "सुप्रभात अर्चना",
        templeName: "Tirupati Balaji",
        templeLocation: "Tirumala, Andhra Pradesh",
        deity: "Lord Venkateswara",
        image: "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800&q=80&auto=format&fit=crop",
        status: "upcoming",
        scheduledDate: "Mon, 16 Jun",
        scheduledTime: "05:30 AM",
        durationMins: 50,
        price: 999,
        originalPrice: 1299,
        rating: 4.9,
        devoteesJoined: 6740,
        benefits: ["Wealth & abundance", "Wish fulfilment", "Family harmony"],
        tags: ["Wish Fulfilment", "Most Loved"],
    },
    {
        id: "khatu-shyam-nishan-yatra",
        pujaName: "Nishan Aarti",
        pujaNameHindi: "निशान आरती",
        templeName: "Khatu Shyam Ji",
        templeLocation: "Sikar, Rajasthan",
        deity: "Khatu Shyam",
        image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80&auto=format&fit=crop",
        status: "upcoming",
        scheduledDate: "Fri, 13 Jun",
        scheduledTime: "06:00 AM",
        durationMins: 35,
        price: 451,
        originalPrice: 651,
        rating: 4.7,
        devoteesJoined: 2210,
        benefits: ["Faith rewarded", "Courage & strength", "Protection"],
        tags: ["Haare Ka Sahara"],
    },
    {
        id: "vaishno-devi-aarti",
        pujaName: "Maa Vaishno Aarti",
        pujaNameHindi: "माँ वैष्णो आरती",
        templeName: "Vaishno Devi",
        templeLocation: "Katra, Jammu & Kashmir",
        deity: "Maa Vaishnavi",
        image: "https://images.unsplash.com/photo-1590074072786-a66914d668f1?w=800&q=80&auto=format&fit=crop",
        status: "daily",
        scheduledDate: "Every Day",
        scheduledTime: "06:45 PM",
        durationMins: 30,
        price: 651,
        originalPrice: 851,
        rating: 4.9,
        devoteesJoined: 4480,
        benefits: ["Divine blessings", "Wish fulfilment", "Strength & courage"],
        tags: ["Shakti Peeth"],
    },
];
