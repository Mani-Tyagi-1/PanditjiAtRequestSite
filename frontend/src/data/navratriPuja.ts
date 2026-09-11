import type { LiveMandirPuja } from "../components/booking/LiveMandirPujas/liveMandirData";
import API_URL from "../utils/apiConfig";

export const NAVRATRI_PUJA_SLUG = "navratri-puja";
export const NAVRATRI_PUJA_HREF = `/live-mandir-puja/${NAVRATRI_PUJA_SLUG}`;
export const NAVRATRI_PUJA_BANNER = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/astro/navratripujaa.png";
export const NAVRATRI_GENERAL_POOJA_ID = "6aa29d9c43d1a1d3d9f28a42";

export const navratriPuja: LiveMandirPuja = {
    id: NAVRATRI_PUJA_SLUG,
    pujaName: "Navratri Maha Puja",
    pujaNameHindi: "नवरात्रि महा पूजा",
    templeName: "Maa Durga Mandir",
    templeLocation: "India",
    deity: "Maa Durga",
    image: NAVRATRI_PUJA_BANNER,
    status: "upcoming",
    scheduledDate: "October 11, 2026",
    scheduledTime: "10:00 AM",
    durationMins: 60,
    price: 1100,
    originalPrice: 1500,
    rating: 4.9,
    devoteesJoined: 1500,
    benefits: ["Divine blessings", "Protection", "Wish fulfilment"],
    tags: ["Most Popular", "Navratri"],
    templeAbout: "Navratri is a nine-night festival dedicated to Maa Durga, celebrating her divine power and the triumph of good over evil. Seek her blessings for a prosperous and happy life.",
    includes: ["Sankalp in your name", "Live Darshan", "Special Archana", "Prasad delivery"],
};

const mapGeneralPooja = (data: any): LiveMandirPuja => {
    const hasDiscountPrice = Number.isFinite(Number(data.discountPrice)) && Number(data.discountPrice) > 0;
    return {
        id: data._id,
        pujaName: data.name,
        pujaNameHindi: data.hindiName || "",
        templeName: data.templeName || "",
        templeLocation: data.templeLocation || "",
        deity: data.deityName || "",
        image: data.images?.[0] || data.templeImage || NAVRATRI_PUJA_BANNER,
        status: data.status === "open" ? "upcoming" : "live",
        scheduledDate: data.pujaDate || "",
        scheduledTime: data.startTime || "",
        durationMins: Number.parseInt(data.duration || "0", 10) || 60,
        price: hasDiscountPrice ? Number(data.discountPrice) : Number(data.price),
        originalPrice: hasDiscountPrice ? Number(data.price) : undefined,
        rating: 5,
        devoteesJoined: 0,
        benefits: data.benefits || [],
        tags: data.category ? [data.category] : [],
        whatIsPerformed: data.whatIsPerformed,
        offeringsSamagri: data.offeringsSamagri,
        templeAbout: data.templeAbout,
        templeHistory: data.templeHistory,
        theme: data.theme,
    };
};

export async function fetchGeneralPooja(id: string): Promise<LiveMandirPuja> {
    const response = await fetch(`${API_URL}/generalpoojas/${id}`);
    if (!response.ok) throw new Error("General pooja not found");
    const { data } = await response.json();
    return mapGeneralPooja(data);
}

export const fetchNavratriPuja = () => fetchGeneralPooja(NAVRATRI_GENERAL_POOJA_ID);

export async function fetchAdminGeneralPoojas(): Promise<LiveMandirPuja[]> {
    const response = await fetch(`${API_URL}/generalpoojas`);
    if (!response.ok) throw new Error("General poojas not found");
    const { data } = await response.json();
    return Array.isArray(data) ? data.map(mapGeneralPooja) : [];
}
