import { type ShopifyProduct } from "../components/booking/Shop/shopifyTypes";

// Category rules — products are classified by matching these keywords against
// their productType / category / title / tags. Order here = order of chips.
export const CATEGORY_RULES: { label: string; match: string[] }[] = [
    { label: "Rudraksh", match: ["rudraksh", "rudraksha", "mukhi"] },
    { label: "Plants", match: ["plant", "tulsi", "bonsai", "sapling", "money plant"] },
    { label: "Bracelets", match: ["bracelet", "wristband", "kada", "band"] },
    { label: "Malas", match: ["mala", "rosary", "japa"] },
    { label: "Gemstones", match: ["gemstone", "stone", "ratna", "crystal", "pyrite", "quartz"] },
    { label: "Yantra", match: ["yantra"] },
    { label: "Idols", match: ["idol", "murti", "statue"] },
    { label: "Puja Items", match: ["puja", "pooja", "diya", "incense", "dhoop", "agarbatti"] },
];

export const OTHERS = "Others";
export const ALL = "All";

export const getCategory = (p: ShopifyProduct): string => {
    const haystack = [p.productType, p.category, p.title, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    for (const rule of CATEGORY_RULES) {
        if (rule.match.some((m) => haystack.includes(m))) return rule.label;
    }
    return OTHERS;
};

/** "Puja Items" -> "puja-items" — what shows up in the URL. */
export const categoryToSlug = (label: string): string =>
    label.toLowerCase().replace(/\s+/g, "-");

/** "puja-items" -> "Puja Items". Unknown slugs fall back to "All". */
export const slugToCategory = (slug?: string): string => {
    if (!slug) return "";
    const all = [ALL, ...CATEGORY_RULES.map((r) => r.label), OTHERS];
    return all.find((label) => categoryToSlug(label) === slug.toLowerCase()) || ALL;
};
