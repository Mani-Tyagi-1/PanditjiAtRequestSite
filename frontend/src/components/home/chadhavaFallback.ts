export type Chadhava = {
    id: string;
    deity: string;
    deityHindi?: string;
    templeName: string;
    image: string;
    startingPrice: number;
    originalPrice?: number;
    tags?: string[];
};

export const CHADHAVA_FALLBACK: Chadhava[] = [
    {
        id: "chadhava-kashi",
        deity: "Kashi Vishwanath",
        templeName: "Kashi Vishwanath Dham, Varanasi",
        image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/varanasi.webp",
        startingPrice: 501,
        originalPrice: 1100,
        tags: ["Most Booked"]
    },
    {
        id: "chadhava-ayodhya",
        deity: "Ram Lalla",
        templeName: "Ram Mandir, Ayodhya",
        image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/ayodhya.webp",
        startingPrice: 751,
        originalPrice: 1500,
        tags: ["New Offerings"]
    }
];
