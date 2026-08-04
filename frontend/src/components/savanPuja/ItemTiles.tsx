import {
    Droplets, Droplet, Leaf, Flower, Flower2, Flame, Sparkles, Milk, BookOpen,
    CircleDot, Gift, Sprout, Amphora,
    type LucideIcon,
} from "lucide-react";
import { ITEM_IMAGES } from "../../data/kashiMahadevPuja";
import { optimizedImg } from "../../utils/img";

/**
 * Picture tiles for the physical things named on this puja — what is poured
 * over the Shivling in the devotee's name, and what is packed into the prasad
 * box.
 *
 * Tiles rather than comma-separated prose: a devotee scanning "Milk, Gangajal,
 * Bel Patra, Bhang, Dhatura, 1008 Naam Jaap, Rudri Path" has to read seven
 * names to picture one seva, and that wall of text is exactly what makes a
 * package card unreadable on a phone.
 *
 * Every tile degrades gracefully: with no photo in ITEM_IMAGES it renders a
 * tinted icon on the Savan gradient, so the layout is identical whether the
 * artwork has landed or not and photos can be dropped in one at a time.
 */

/** Fallback art per item, so an image-less tile still reads as that object. */
const ITEM_ICONS: Record<string, LucideIcon> = {
    // Offerings
    Milk,
    Gangajal: Droplets,
    // Amphora — the kalash the five nectars are poured from. It has to read as
    // distinct from the two liquids either side of it (Milk, Gangajal), which a
    // third droplet glyph would not.
    Panchamrit: Amphora,
    "Bel Patra": Leaf,
    // Flower, not Flower2 — the dhatura holds Flower2 and the two sit on the
    // same card from ₹1500 up.
    Flowers: Flower,
    // Sprout, not Leaf — bhang sits two tiles from the bel patra on the ₹1500
    // card and the two have to be tellable apart at 20 px.
    Bhang: Sprout,
    Dhatura: Flower2,
    // Droplet (singular), so the itra bottle is not mistaken for the Gangajal
    // tile's Droplets at tile size.
    "Itra Seva": Droplet,
    "1008 Naam Jaap": Sparkles,
    "Rudri Path": BookOpen,
    // Prasad box
    "Dry Prasad": Gift,
    Bhasma: Flame,
    "Rudraksh Bracelet": CircleDot,
    "Shiv Chalisa": BookOpen,
};

export function itemIcon(label: string): LucideIcon {
    return ITEM_ICONS[label] ?? Sparkles;
}

type Tone = "emerald" | "gold" | "parchment";

type ToneSpec = { frame: string; icon: string; label: string; fallback: string };

const TONES: Record<Tone, ToneSpec> = {
    emerald: {
        frame: "border-[#DDEBE6] bg-white",
        icon: "text-[#086B50]",
        label: "text-[#17211D]",
        fallback: "bg-gradient-to-br from-[#DFF5EF] to-[#086B50]/20",
    },
    // For anything the devotee gets free — the gold coupon language the rest of
    // the page uses for the bracelet and the countdown card.
    gold: {
        frame: "border-[#E8CF9A] bg-[#FFFDF5]",
        icon: "text-[#C89B3C]",
        label: "text-[#8A6A1F]",
        fallback: "bg-gradient-to-br from-[#FFFDF5] to-[#E8CF9A]/45",
    },
    // The parchment/aged-gold theme worn by the Savan detail page. Added as a
    // THIRD tone rather than by retinting `emerald`, because that tone is still
    // what SavanPujaBookingPage renders — repainting it here would silently
    // restyle a page nobody asked to change.
    parchment: {
        frame: "border-[#D8B66A]/60 bg-[#FCF8F0]",
        icon: "text-[#8E6A25]",
        label: "text-[#23201B]",
        fallback: "bg-gradient-to-br from-[#F3E5BF] to-[#D8B66A]/50",
    },
};

export function ItemTile({ label, tone = "emerald" }: { label: string; tone?: Tone }) {
    const src = ITEM_IMAGES[label] || "";
    const Icon = itemIcon(label);
    const t = TONES[tone];

    return (
        <div className="min-w-0 text-center">
            {/* Square, but sized by the grid column rather than a fixed width —
                see ItemTileRow for why. */}
            <div className={`w-full aspect-square rounded-xl border overflow-hidden flex items-center justify-center ${t.frame}`}>
                {src ? (
                    // Drawn at ~56 px, so 200 px covers 3× density and nothing
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
                    <span className={`w-full h-full flex items-center justify-center ${t.fallback}`}>
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
 * track on a phone is the classic way to make the ₹2100 package look like it
 * offers three things when it offers seven.
 *
 * A GRID, not a flex row of fixed-width tiles: the card is whatever width the
 * viewport gives it, and fixed widths only divide it evenly by luck, leaving a
 * ragged gutter down the right-hand side. The grid spends that gutter on the
 * tiles instead, and columns line up across every row and every card.
 *
 * `cols` is spelled out rather than interpolated because Tailwind only ships
 * classes it can see in the source.
 */
const COLS: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
};

export function ItemTileRow({
    items,
    tone = "emerald",
    cols = 5,
}: {
    items: string[];
    tone?: Tone;
    cols?: number;
}) {
    return (
        <div className={`grid gap-2 ${COLS[cols] ?? COLS[5]}`}>
            {items.map((item) => (
                <ItemTile key={item} label={item} tone={tone} />
            ))}
        </div>
    );
}
