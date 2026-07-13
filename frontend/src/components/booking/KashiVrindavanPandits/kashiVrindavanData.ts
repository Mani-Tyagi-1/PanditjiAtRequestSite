// ─────────────────────────────────────────────────────────────
//  Book Pandit Ji from Kashi / Vrindavan — Types + Dummy Data
//  Authentic pandits from the holy cities who travel to perform
//  rituals at the devotee's home.
//  NOTE: Hard-coded for now. When the backend is ready, replace
//  `HOLY_PANDITS` with a fetch returning the same `HolyPandit[]`
//  shape (the section already does this with a fallback).
// ─────────────────────────────────────────────────────────────

export type HolyCity = "All" | "Kashi" | "Vrindavan";

export interface PanditService {
    id: string;
    name: string;
    description: string;
    price: number;
    durationHours: number;
    popular?: boolean;
}

export interface HolyPandit {
    id: string;
    name: string;
    city: Exclude<HolyCity, "All">;
    image: string;
    experienceYears: number;
    rating: number;
    pujasPerformed: number;
    languages: string[];
    specializations: string[];
    startingPrice: number;
    verified: boolean;
    about: string;
    services: PanditService[];
}

export const HOLY_CITIES: HolyCity[] = ["All", "Kashi", "Vrindavan"];

const homeRituals = (base: number): PanditService[] => [
    {
        id: "satyanarayan",
        name: "Satyanarayan Katha",
        description: "Complete katha with havan & prasad at your home.",
        price: base,
        durationHours: 3,
    },
    {
        id: "griha-pravesh",
        name: "Griha Pravesh Puja",
        description: "Vastu shanti & housewarming rituals. Most booked.",
        price: Math.round(base * 1.5),
        durationHours: 4,
        popular: true,
    },
    {
        id: "rudrabhishek-havan",
        name: "Rudrabhishek & Havan",
        description: "Shiv abhishek with sacred havan for peace & health.",
        price: Math.round(base * 1.8),
        durationHours: 3,
    },
    {
        id: "custom-ritual",
        name: "Custom Ritual / Consultation",
        description: "Tell us your need — pandit ji will guide the vidhi.",
        price: Math.round(base * 0.8),
        durationHours: 2,
    },
];

export const HOLY_PANDITS: HolyPandit[] = [
    {
        id: "ram-shankar-dwivedi-kashi",
        name: "Pt. Ram Shankar Dwivedi",
        city: "Kashi",
        image: "/images/pandit_kashi.jpg",
        experienceYears: 28,
        rating: 4.9,
        pujasPerformed: 3200,
        languages: ["Hindi", "Sanskrit", "Bhojpuri"],
        specializations: ["Rudrabhishek", "Griha Pravesh", "Satyanarayan"],
        startingPrice: 2100,
        verified: true,
        about: "A Kashi-born Vedic scholar from a lineage of priests at the Kashi Vishwanath temple, with nearly three decades of experience performing authentic Vedic rituals.",
        services: homeRituals(2100),
    },
    {
        id: "mahesh-chandra-mishra-kashi",
        name: "Pt. Mahesh Chandra Mishra",
        city: "Kashi",
        image: "/images/pandit_kashi.jpg",
        experienceYears: 22,
        rating: 4.8,
        pujasPerformed: 2450,
        languages: ["Hindi", "Sanskrit", "English"],
        specializations: ["Pitra Dosh", "Kaal Sarp", "Navagraha Shanti"],
        startingPrice: 2500,
        verified: true,
        about: "Specialist in dosh-nivaran and grah-shanti rituals, trained in the traditional gurukul system of Varanasi.",
        services: homeRituals(2500),
    },
    {
        id: "govind-gopal-sharma-vrindavan",
        name: "Pt. Govind Gopal Sharma",
        city: "Vrindavan",
        image: "/images/pandit_kashi.jpg",
        experienceYears: 25,
        rating: 5.0,
        pujasPerformed: 2900,
        languages: ["Hindi", "Sanskrit", "Braj"],
        specializations: ["Bhagwat Katha", "Satyanarayan", "Mundan Sanskar"],
        startingPrice: 1900,
        verified: true,
        about: "A revered katha-vachak from Vrindavan, known for soulful Bhagwat recitation and authentic Braj-tradition rituals.",
        services: homeRituals(1900),
    },
    {
        id: "radha-mohan-goswami-vrindavan",
        name: "Pt. Radha Mohan Goswami",
        city: "Vrindavan",
        image: "/images/pandit_kashi.jpg",
        experienceYears: 19,
        rating: 4.9,
        pujasPerformed: 1850,
        languages: ["Hindi", "Sanskrit"],
        specializations: ["Vivah Sanskar", "Griha Pravesh", "Janmotsav"],
        startingPrice: 2200,
        verified: true,
        about: "Goswami-lineage priest of Vrindavan, specialising in vivah and sanskar ceremonies performed with full Vedic vidhi.",
        services: homeRituals(2200),
    },
    {
        id: "shiv-kumar-tripathi-kashi",
        name: "Pt. Shiv Kumar Tripathi",
        city: "Kashi",
        image: "/images/pandit_kashi.jpg",
        experienceYears: 16,
        rating: 4.7,
        pujasPerformed: 1420,
        languages: ["Hindi", "Sanskrit"],
        specializations: ["Maha Mrityunjaya", "Havan", "Antim Sanskar"],
        startingPrice: 1800,
        verified: true,
        about: "Young yet deeply learned Kashi pandit, popular for Maha Mrityunjaya jaap and shanti rituals.",
        services: homeRituals(1800),
    },
];
