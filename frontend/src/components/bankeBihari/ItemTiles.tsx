import {
    Milk, Feather, Music, Leaf, Cookie, Flame, UtensilsCrossed,
    Gift, Sparkles, Flower2, CircleDot, Shirt, Crown, Heart, Amphora,
    type LucideIcon,
} from "lucide-react";
import { ITEM_IMAGES } from "../../data/bankeBihariPuja";
import { optimizedImg } from "../../utils/img";

/**
 * Picture tiles for the physical items — prasad-box contents and the offerings
 * made at Bihari Ji's charan.
 *
 * These lists used to be comma-separated prose and pill chips, which is what
 * made the package cards read as a wall of text: a devotee scanning "Dry
 * Prasad, Mishri, Dry Fruits, Jaap Counter, Bansuri, Tulsi Mala, Mor Pankh" has
 * to read seven names to picture one box. Tiles turn the same list into
 * something you take in at a glance, and give the page the festive, tangible
 * feel the offerings deserve.
 *
 * Every tile degrades gracefully: with no photo in ITEM_IMAGES it renders a
 * tinted icon on the theme gradient, so the layout is identical whether the
 * artwork has landed or not and photos can be dropped in one at a time.
 */

/** Fallback art per item, so an image-less tile still reads as that object. */
const ITEM_ICONS: Record<string, LucideIcon> = {
    // Prasad box
    "Dry Prasad": Gift,
    Bansuri: Music,
    "Tulsi Mala": Flower2,
    "Jaap Counter": CircleDot,
    // Heart, not Flower2 — it has to read as distinct from the plain Tulsi Mala
    // sitting two tiles to its left, and Radha naam is the prem association.
    "Radha Naam Tulsi Mala": Heart,
    "Mor Pankh": Feather,
    "Small Dahi Handi": Amphora,
    "Laddu Gopal Idol": Crown,
    "Laddu Gopal Dress": Shirt,
    // Offerings
    "Makhan Mishri": Milk,
    Paan: Leaf,
    Laddu: Cookie,
    "Deepak Seva": Flame,
    "Bade Bhog Thali": UtensilsCrossed,
};

export function itemIcon(label: string): LucideIcon {
    return ITEM_ICONS[label] ?? Sparkles;
}

type Tone = "pink" | "green" | "sand";

const TONES: Record<Tone, { frame: string; icon: string; label: string }> = {
    pink: { frame: "border-[#F8B5CB] bg-white", icon: "text-[#D63D72]", label: "text-[#5C1A34]" },
    green: { frame: "border-[#A7D8B6] bg-white", icon: "text-[#2E8B57]", label: "text-[#1F7A50]" },
    sand: { frame: "border-[#E0CDB4] bg-[#FFF8F0]", icon: "text-[#8A5A12]", label: "text-[#5C1A34]" },
};

export function ItemTile({ label, tone = "pink" }: { label: string; tone?: Tone }) {
    const src = ITEM_IMAGES[label] || "";
    const Icon = itemIcon(label);
    const t = TONES[tone];

    return (
        <div className="w-14 shrink-0 text-center">
            <div className={`w-14 h-14 rounded-xl border overflow-hidden flex items-center justify-center ${t.frame}`}>
                {src ? (
                    // Drawn at 56 px, so 200 px covers 3× density and nothing
                    // more. onError falls back to the origin URL, the convention
                    // `optimizedImg` documents, so a proxy hiccup can never leave
                    // a broken tile behind.
                    <img
                        src={optimizedImg(src, 200)}
                        onError={(e) => { e.currentTarget.src = src; }}
                        alt={label}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#FFF8F0 0%,#FFECCF 55%,#FFE9D8 100%)" }}
                    >
                        <Icon className={`w-5 h-5 ${t.icon}`} />
                    </span>
                )}
            </div>
            <p className={`mt-1 text-[9px] font-semibold leading-tight ${t.label}`}>{label}</p>
        </div>
    );
}

/**
 * A row of tiles. Wraps rather than scrolling horizontally — a hidden scroll
 * track on a phone is the classic way to make the ₹11000 package look like it
 * offers three things when it offers seven.
 */
export function ItemTileRow({ items, tone = "pink" }: { items: string[]; tone?: Tone }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <ItemTile key={item} label={item} tone={tone} />
            ))}
        </div>
    );
}
