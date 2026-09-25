import {
    Milk, Feather, Music, Leaf, Cookie, Flame, UtensilsCrossed,
    Gift, Sparkles, Flower, Flower2, CircleDot, Shirt, Crown, Heart, Amphora,
    Grape, Droplet, Candy,
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
 * Prasad, Mishri, Dry Fruits, Jaap Counter, Murli, Tulsi Mala, Mor Pankh" has
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
    Murli: Music,
    "Tulsi Mala": Flower2,
    "Jaap Counter": CircleDot,
    // Heart, not Flower2 — it has to read as distinct from the plain Tulsi Mala
    // sitting two tiles to its left, and Radha naam is the prem association.
    "Radha Naam Tulsi Mala": Heart,
    "Mor Pankh": Feather,
    "Small Handi": Amphora,
    "Brass Laddu Gopal Ji Idol": Crown,
    "3 Laddu Gopal Ji Dress": Shirt,
    "5 Laddu Gopal Ji Dress": Shirt,
    // Offerings
    Makhan: Milk,
    // Candy, not Milk — mishri sits directly beside makhan on every card, so
    // the two tiles have to be tellable apart at 20 px.
    Mishri: Candy,
    "Dry Fruits": Grape,
    // Flower, not Flower2 — the plain Tulsi Mala already holds Flower2 and the
    // two sit next to each other on the ₹5100 card.
    "Phool Mala": Flower,
    Paan: Leaf,
    Laddu: Cookie,
    "Deepak Seva": Flame,
    "Itra Seva": Droplet,
    "Raj Bhog Thali": UtensilsCrossed,
};

export function itemIcon(label: string): LucideIcon {
    return ITEM_ICONS[label] ?? Sparkles;
}

type Tone = "pink" | "green" | "sand" | "onDark";

type ToneSpec = {
    frame: string;
    icon: string;
    label: string;
    /** Applied instead of `frame` when the tile is highlighted. */
    hiFrame: string;
    /** Applied instead of `label` when the tile is highlighted. */
    hiLabel: string;
};

const TONES: Record<Tone, ToneSpec> = {
    pink: {
        frame: "border-[#C9C3ED] bg-white",
        icon: "text-[#4C3F91]",
        label: "text-[#262454]",
        hiFrame: "border-[#E7B63A] bg-white ring-2 ring-[#E7B63A]",
        hiLabel: "text-[#8A5A12]",
    },
    green: {
        frame: "border-[#A7D8B6] bg-white",
        icon: "text-[#2E8B57]",
        label: "text-[#1F7A50]",
        hiFrame: "border-[#E7B63A] bg-white ring-2 ring-[#E7B63A]",
        hiLabel: "text-[#8A5A12]",
    },
    sand: {
        frame: "border-[#D8D2ED] bg-[#F5F3FC]",
        icon: "text-[#8A5A12]",
        label: "text-[#262454]",
        hiFrame: "border-[#E7B63A] bg-white ring-2 ring-[#E7B63A]",
        hiLabel: "text-[#8A5A12]",
    },
    // For the saturated toasts. The tile itself stays white — the photos are cut
    // out on white and need it — but the caption flips, because the page's dark
    // label colour is unreadable on a magenta fill.
    onDark: {
        frame: "border-white/50 bg-white",
        icon: "text-[#4C3F91]",
        label: "text-white",
        hiFrame: "border-[#F7C547] bg-white ring-2 ring-[#F7C547]",
        hiLabel: "text-[#FFD98A]",
    },
};

export function ItemTile({
    label,
    tone = "pink",
    highlighted = false,
}: {
    label: string;
    tone?: Tone;
    /** Rings the tile in gold — "this one is new to you". */
    highlighted?: boolean;
}) {
    const src = ITEM_IMAGES[label] || "";
    const Icon = itemIcon(label);
    const t = TONES[tone];

    return (
        <div className="min-w-0 text-center">
            {/* Square, but sized by the grid column rather than a fixed 56 px —
                see ItemTileRow for why. */}
            <div className={`w-full aspect-square rounded-xl border overflow-hidden flex items-center justify-center ${highlighted ? t.hiFrame : t.frame}`}>
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
                        style={{ background: "linear-gradient(135deg,#F5F3FC 0%,#E9E4F9 55%,#E9E4F9 100%)" }}
                    >
                        <Icon className={`w-5 h-5 ${t.icon}`} />
                    </span>
                )}
            </div>
            <p className={`mt-1 text-[9px] font-semibold leading-tight ${highlighted ? t.hiLabel : t.label}`}>
                {label}
            </p>
        </div>
    );
}

/**
 * A row of tiles. Wraps rather than scrolling horizontally — a hidden scroll
 * track on a phone is the classic way to make the ₹11000 package look like it
 * offers three things when it offers seven.
 *
 * A 5-column GRID, not a flex row of 56 px tiles: fixed widths left a ragged
 * ~30 px gutter down the right-hand side of every card on a phone, because the
 * card is whatever width the viewport gives it and 56 px tiles only ever divide
 * it by luck. The grid spends that gutter on the tiles instead, and columns line
 * up across every row and every card. Five is the count that keeps a tile large
 * enough to read at 360 px while still fitting the label under it.
 *
 * `cols` narrows that for callers who give the row less than the full width —
 * the upgrade toast puts two tiles beside a bonus panel, where five columns
 * would shrink them to thumbnails. Spelled out rather than interpolated because
 * Tailwind only ships classes it can see in the source.
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
    tone = "pink",
    cols = 5,
    highlight,
}: {
    items: string[];
    tone?: Tone;
    cols?: number;
    /** Subset of `items` to ring in gold — used to mark what an upgrade adds. */
    highlight?: string[];
}) {
    return (
        <div className={`grid gap-2 ${COLS[cols] ?? COLS[5]}`}>
            {items.map((item) => (
                <ItemTile
                    key={item}
                    label={item}
                    tone={tone}
                    highlighted={highlight?.includes(item)}
                />
            ))}
        </div>
    );
}
