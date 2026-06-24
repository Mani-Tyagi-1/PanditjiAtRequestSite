// ─────────────────────────────────────────────────────────────
//  Chadhava (Seva Offerings) — Types
//  Data is fetched from the backend (`GET /chadhavas`). Each
//  chadhava exposes seva `sections`, each with selectable `items`
//  (qty-based) plus an optional `prasad` add-on.
// ─────────────────────────────────────────────────────────────

export interface ChadhavaItem {
    code: string;
    itemName: string;
    itemDesc: string;
    itemImage: string;
    itemPrice: number;
    /** Original (pre-discount) price, used to show strikethrough + savings. */
    originalPrice?: number;
    maxQuantity: number;
    popular?: boolean;
    isActive?: boolean;
    type?: string;
}

export interface ChadhavaSection {
    sectionName: string;
    items: ChadhavaItem[];
}

export interface ChadhavaPrasad {
    enabled: boolean;
    price: number;
    name: string;
    desc: string;
    image: string;
}

export interface Chadhava {
    id: string;
    slug?: string;
    deity: string;
    deityHindi: string;
    templeName: string;
    templeLocation: string;
    image: string;
    /** All banner images (web-card, app image, gallery…) used by the hero carousel. */
    bannerImages?: string[];
    /** e.g. "Offered every Tuesday & Saturday" */
    offeringDay: string;
    availableDates?: string[];
    startingPrice: number;
    originalPrice?: number;
    rating: number;
    devoteesOffered: number;
    benefits: string[];
    tags: string[];
    sections: ChadhavaSection[];
    prasad?: ChadhavaPrasad;
    description?: string;
    mandirAppImage?: string;
    mandirSectionIntro?: string;
    mandirSectionHistory?: string;
}

/** A chosen seva item with quantity, used by the detail + booking flow. */
export interface ChadhavaSelection {
    code: string;
    name: string;
    unitPrice: number;
    quantity: number;
}
