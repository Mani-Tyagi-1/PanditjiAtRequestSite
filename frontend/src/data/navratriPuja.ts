import type { LiveMandirPuja } from "../components/booking/LiveMandirPujas/liveMandirData";
import API_URL from "../utils/apiConfig";

const mapGeneralPooja = (data: any): LiveMandirPuja => {
    const hasDiscountPrice = Number.isFinite(Number(data.discountPrice)) && Number(data.discountPrice) > 0;
    return {
        id: data._id,
        pujaName: data.name,
        pujaNameHindi: data.hindiName || "",
        templeName: data.templeName || "",
        templeLocation: data.templeLocation || "",
        deity: data.deityName || "",
        image: data.images?.[0] || data.templeImage || "",
        status: data.status === "open" ? "upcoming" : "live",
        scheduledDate: data.pujaDate || "",
        scheduledTime: data.startTime || "",
        durationMins: Number.parseInt(data.duration || "0", 10) || 60,
        durationString: data.duration,
        price: hasDiscountPrice ? Number(data.discountPrice) : Number(data.price),
        originalPrice: hasDiscountPrice ? Number(data.price) : undefined,
        rating: 4.6,
        devoteesJoined: 0,
        benefits: data.benefits || [],
        tags: data.category ? [data.category] : [],
        whatIsPerformed: data.whatIsPerformed,
        vidhi: data.vidhi,
        offeringsSamagri: data.offeringsSamagri,
        templeAbout: data.templeAbout,
        templeHistory: data.templeHistory,
        theme: data.theme,
        prasadBoxEnabled: data.prasadBoxEnabled,
        packages: Array.isArray(data.packages) ? data.packages.map((pkg: any) => ({
            id: pkg._id,
            name: pkg.name,
            price: Number(pkg.price) || 0,
            strikePrice: pkg.strikePrice ? Number(pkg.strikePrice) : undefined,
            description: pkg.description,
            bulletPoints: pkg.bulletPoints || [],
            images: pkg.images || [],
            freePersons: pkg.freePersons,
            freePrasad: pkg.freePrasad,
        })) : undefined,
    };
};

export async function fetchGeneralPooja(id: string): Promise<LiveMandirPuja> {
    const response = await fetch(`${API_URL}/generalpoojas/${id}`);
    if (!response.ok) throw new Error("General pooja not found");
    const { data } = await response.json();
    return mapGeneralPooja(data);
}

export async function fetchAdminGeneralPoojas(): Promise<LiveMandirPuja[]> {
    const response = await fetch(`${API_URL}/generalpoojas`);
    if (!response.ok) throw new Error("General poojas not found");
    const { data } = await response.json();
    return Array.isArray(data) ? data.map(mapGeneralPooja) : [];
}
