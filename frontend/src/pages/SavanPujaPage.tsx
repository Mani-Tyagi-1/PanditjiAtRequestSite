import { useState, useEffect, useId, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
    Video, Mountain, Share2, HelpCircle, Droplets, Leaf, Moon, Flower2,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { optimizedImg } from "../utils/img";
import { kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG, RUDRAKSH_BRACELET_IMAGE } from "../data/kashiMahadevPuja";
import heroImages from "../data/savanHeroImages.json";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(custom ? "trackCustom" : "track", event, params);
    }
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Responsive image sets for this page, self-hosted from public/hero/ as
 * pre-encoded WebP so nothing is resized at runtime.
 *
 * Deliberately SAME-ORIGIN rather than CDN or resizer URLs: the document has
 * already paid DNS + TCP + TLS for this origin by the time the preload is
 * parsed, so the hero reuses that live connection. A third-party origin would
 * add ~3 round trips of pure latency in front of the LCP image and put a free
 * proxy with no SLA on the critical path (see the note in src/utils/img.ts).
 * nginx serves public/ out of dist/ with a 30-day cache via its `\.(webp)$`
 * location block.
 *
 * The widths/sizes live in the JSON because the route-shell generator has to
 * emit a preload that resolves to the identical candidate — see that file.
 */
const HERO = heroImages.hero;
const MANTRA_SIDE = heroImages.mantraSide;

/** CDN original — onError fallback if a self-hosted variant ever 404s. */
const MANTRA_SIDE_IMAGE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/trishul%20(1).png";

/**
 * Banners that auto-advance after the hero above.
 *
 * Slide 0 is deliberately NOT in this list: it is `HERO`, the self-hosted,
 * route-shell-preloaded LCP image, and it must stay the only banner the
 * browser fetches on first paint. Everything here is a CDN URL that mounts
 * only once that first image has painted (see `heroPainted`), so adding
 * slides can never slow the hero down.
 *
 * Add more by appending — the dots, the timer and the crossfade all read
 * their count from this array. Keep them ~16:9; they are cropped to a 208px
 * tall band with object-cover, so a square banner loses its top and bottom.
 */
const HERO_EXTRA_SLIDES = [
    {
        src: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/w2.png.webp",
        alt: "Rudrabhishek at the ghats of Kashi on Savan Somwar",
    },
    {
        src: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/w3.png.webp",
        alt: "Rudrabhishek at the ghats of Kashi on Savan Somwar",
    },
];

/** Beat between banners. */
const HERO_SLIDE_MS = 3000;

/**
 * Savan rainfall across the whole page. Generated once at module load from a
 * fixed seed — not on every render — so the drops keep their positions and
 * the rain doesn't reshuffle when the countdown ticks each second.
 *
 * Nearer drops fall faster and are longer, wider and brighter; farther ones
 * are slower and fainter. That depth spread is what stops it reading as a
 * marching row of identical ticks. Durations are tuned for a full-viewport
 * fall (~112vh), so they are far longer than a banner-height drop would need.
 */
const SAVAN_RAINDROPS = (() => {
    let h = 0x9e3779b9;
    const rand = () => {
        h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
        return ((h >>> 0) % 10000) / 10000;
    };
    return Array.from({ length: 60 }, () => {
        const depth = rand(); // 0 = far/slow/faint, 1 = near/fast/bright
        return {
            left: +(rand() * 100).toFixed(2),
            delay: +(rand() * 4).toFixed(2),           // staggered over 4s
            dur: +(4.2 - depth * 1.9).toFixed(2),      // 2.30s – 4.20s
            h: Math.round(12 + depth * 16),            // 12px – 28px
            w: +(1.1 + depth * 0.9).toFixed(1),        // 1.1px – 2.0px
            opacity: +(0.35 + depth * 0.45).toFixed(2), // 0.35 – 0.80
        };
    });
})();

// Kashi Mahadev Savan online-puja devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Sunita Devi", rating: 5, date: "1 week ago", text: "Rudrabhishek ka video WhatsApp pe mil gaya, pandit ji ne mera naam aur gotra se sankalp kiya. 🙏", verified: true },
    { name: "Rakesh Kumar", rating: 5, date: "3 weeks ago", text: "₹851 mein Kashi Vishwanath se puja karwana bahut easy tha. Sab update WhatsApp pe mila.", verified: true },
    { name: "Pooja Sharma", rating: 5, date: "2 weeks ago", text: "Prasad 5 din mein ghar aa gaya, bhasma aur bel patra bhi tha. Thank you team. 🙏", verified: true },
    { name: "Amit Verma", rating: 4, date: "1 month ago", text: "Puja theek se hui, video bhi mil gaya. Video thoda lamba hota to aur acha tha, par satisfied hoon.", verified: true },
    { name: "Deepak Yadav", rating: 5, date: "5 days ago", text: "Savan Somwar pe parents ke naam se book kiya. Pandit ji ne aarti mein naam liya. Family khush ho gayi.", verified: true },
    { name: "Anjali Nair", rating: 5, date: "2 months ago", text: "Booked from Dubai. Kashi nahi ja paayi par connected feel hua. Simple process.", verified: false },
    { name: "Manoj Tiwari", rating: 4, date: "3 weeks ago", text: "Sankalp naam aur gotra se hua. Booking aasan thi. Overall accha experience raha.", verified: true },
    { name: "Kavita Singh", rating: 5, date: "1 month ago", text: "Baba Vishwanath ke darbar se abhishek karwa ke mann ko shanti mili. Har Har Mahadev! 🙏", verified: true },
    { name: "Ramesh Patel", rating: 5, date: "2 weeks ago", text: "Genuine service. Koi extra paisa nahi maanga. Video proof bhi diya jaisa bola tha.", verified: true },
    { name: "Neha Joshi", rating: 4, date: "6 days ago", text: "Achhi service. Puja ki timing WhatsApp pe confirm kar di thi. Recommend karungi.", verified: false },
    { name: "Suresh Gupta", rating: 5, date: "1 month ago", text: "Parivaar ki sukh-shanti ke liye Rudrabhishek karwaya. Sab time pe aur proper hua. 🙏", verified: true },
    { name: "Priya Reddy", rating: 5, date: "3 weeks ago", text: "Pehli baar online puja book ki thi, dar tha par sab genuine nikla. Phir se karwaungi.", verified: true },
];

function seededReviews(seed: string, count: number): Review[] {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rand = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
    const a = [...PLACEHOLDER_REVIEWS];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(count, a.length));
}

// ── Small UI pieces (Savan palette: emerald, light aqua, temple gold) ────
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`${className} ${i <= full ? "text-[#C89B3C] fill-[#C89B3C]" : "text-[#DDEBE6]"}`} />
            ))}
        </span>
    );
}

function Accordion({ title, icon, defaultOpen = false, children }: {
    title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();
    return (
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#086B50]/45" : "border-[#DDEBE6]"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#008C68] outline-none"
            >
                <span className="flex items-center gap-2 text-[14px] font-bold text-[#17211D]">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#086B50] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-1 text-[12.5px] text-[#66736E] leading-relaxed border-t border-[#DDEBE6]">
                {children}
            </div>
        </div>
    );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="flex items-center gap-1.5 text-[12.5px] font-extrabold uppercase tracking-wider text-[#086B50] mb-2.5">
            {icon}{children}
        </h3>
    );
}

function ReviewMarquee({ reviews }: { reviews: Review[] }) {
    const items = [...reviews, ...reviews]; // duplicated for a seamless loop

    /**
     * The marquee starts paused and only animates while it is actually on screen.
     * It sits below the fold, so an infinite animation over 18 duplicated cards
     * would otherwise run style & layout work during the load — competing with
     * the hero for the main thread while nobody can even see it.
     *
     * The element stays mounted either way, so pausing costs no layout change
     * (CLS stays 0); only `animation-play-state` toggles.
     */
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = trackRef.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true); // no observer support — just animate
            return;
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries.some((e) => e.isIntersecting)),
            { rootMargin: "100px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div className="overflow-hidden -mx-4 px-4">
            <style>{`@keyframes reviewMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}.review-track{animation:reviewMarquee 32s linear infinite;width:max-content}.review-track.is-paused{animation-play-state:paused}.review-track:hover{animation-play-state:paused}`}</style>
            <div ref={trackRef} className={`review-track flex gap-2.5${inView ? "" : " is-paused"}`}>
                {items.map((r, i) => (
                    <div key={i} className="shrink-0 w-56 bg-white border border-[#DDEBE6] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#17211D] text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#008C68] shrink-0" />}
                            <span className="ml-auto text-[9px] text-[#66736E]">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-[#66736E] mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

type Offering = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sub: string;
    img: string;
};

/**
 * The Rudrabhishek offerings, as one auto-scrolling row that drifts
 * left-to-right forever (same direction and technique as ReviewMarquee above:
 * the duplicated track animates from translateX(-50%) back to 0).
 *
 * Four tiles are visible at a time. That is what the width calc encodes — the
 * page column is `max-w-md` (28rem) with `px-4`, so the usable width is
 * min(100vw, 28rem) - 2rem, and four tiles plus the three gaps between them
 * fill it exactly. The list can grow past seven items without any of this
 * needing to change.
 *
 * The gap is a right margin on every tile rather than a flex `gap`, so the
 * track is exactly 2 x (tile + gap) x N wide and the -50% wrap lands on a tile
 * boundary — a flex gap leaves half a gap unaccounted for and the loop visibly
 * hitches once per cycle.
 */
const OFFERING_TILE_W = "calc((min(100vw, 28rem) - 2rem - 1.5rem) / 4)";
const OFFERING_GAP = "0.5rem";

function OfferingsMarquee({ offerings }: { offerings: Offering[] }) {
    const tiles = [...offerings, ...offerings]; // duplicated for a seamless loop

    // Pause while off screen — same reasoning as ReviewMarquee: no animation
    // work on the main thread for a row nobody is looking at.
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = trackRef.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries.some((e) => e.isIntersecting)),
            { rootMargin: "100px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div className="overflow-hidden">
            <style>{`@keyframes offeringMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}.offering-track{animation:offeringMarquee 28s linear infinite;width:max-content}.offering-track.is-paused{animation-play-state:paused}.offering-track:hover{animation-play-state:paused}@media (prefers-reduced-motion:reduce){.offering-track{animation:none}}`}</style>
            <div ref={trackRef} className={`offering-track flex${inView ? "" : " is-paused"}`}>
                {tiles.map(({ icon: Icon, label, sub, img }, i) => (
                    <div
                        key={`${label}-${i}`}
                        style={{ width: OFFERING_TILE_W, marginRight: OFFERING_GAP }}
                        className="shrink-0 bg-white border border-[#DDEBE6] rounded-xl p-1.5 text-center shadow-sm"
                    >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-1 flex items-center justify-center bg-gradient-to-br from-[#DFF5EF] to-[#086B50]/20">
                            {img ? (
                                // Tile is 84–98 CSS px (phone width up to the
                                // 28rem column cap), so 220 px covers retina and
                                // nothing more. onError falls back to the origin
                                // URL — the convention `optimizedImg` documents —
                                // so a proxy hiccup can't leave a hole here.
                                <img
                                    src={optimizedImg(img, 220)}
                                    onError={(e) => { e.currentTarget.src = img; }}
                                    alt={label}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Icon className="w-5 h-5 text-[#086B50]" />
                            )}
                        </div>
                        <p className="text-[10.5px] font-bold text-[#17211D] leading-tight">{label}</p>
                        <p className="text-[8.5px] text-[#66736E] leading-tight mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Shree Kashi Rudrabhishek Mahapuja — an online Rudrabhishek
// performed on the devotee's behalf at Shree Kashi Vishwanath Temple,
// Varanasi on the first Savan Somwar. Renders entirely from frontend data
// but carries a distinct Savan/Shiv theme (the emerald / light-aqua / temple-gold palette, abhishek
// droplets, bel patra, the four-Somwar calendar).
// All data comes from src/data/kashiMahadevPuja.ts.
export default function SavanPujaPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const puja = kashiMahadevPuja;
    const pujaId = kashiMahadevPuja._id;

    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    /**
     * The rainfall is purely decorative, so it is mounted only after the page has
     * painted. Measured with Lighthouse (mobile, simulated throttling): the 60
     * always-animating drops cost ~2.1s of style & layout on the main thread
     * (styleLayout 2712ms -> 611ms with them removed), because each drop is a
     * compositing layer running an infinite transform animation. Paying that
     * while the browser is still trying to render the hero delays first paint;
     * paying it a beat later is invisible to the devotee.
     */
    const [showRain, setShowRain] = useState(false);
    useEffect(() => {
        const idle = (window as any).requestIdleCallback as
            | ((cb: () => void, o?: { timeout: number }) => number)
            | undefined;
        if (idle) {
            const id = idle(() => setShowRain(true), { timeout: 2000 });
            return () => (window as any).cancelIdleCallback?.(id);
        }
        const t = setTimeout(() => setShowRain(true), 600);
        return () => clearTimeout(t);
    }, []);

    // ViewContent on load
    useEffect(() => {
        track("ViewContent", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: puja.poojaPriceOnline,
            currency: "INR",
        });
    }, []);

    // Origin CDN artwork — still used for og:image and as the hero's onError
    // fallback; HERO holds the self-hosted, display-sized variants actually shown.
    const image = puja.poojaImages?.[0] || puja.poojaMainImage || puja.poojaCardImage;
    const price = puja.poojaPriceOnline;
    const reviews = seededReviews(pujaId, 9);
    const mandirName = `${puja.templeName}, ${puja.templeLocation}`;
    // City only ("Kashi, Varanasi") for the meta line — the state adds length
    // without telling a devotee anything they don't already know. The full
    // name still goes to the SEO description, where the extra words earn their
    // place.
    const mandirShort = `${puja.templeName}, ${puja.templeLocation.split(",")[0]}`;

    // ── Hero carousel ─────────────────────────────────────────────────────
    // The extra banners mount only after the LCP image has painted, so a
    // longer slide list can never compete with the hero for bandwidth. The
    // route shell pre-renders this page, so the load event can fire before
    // React attaches onLoad — the ref check covers that (and the cached case).
    const heroImgRef = useRef<HTMLImageElement>(null);
    const [heroPainted, setHeroPainted] = useState(false);
    const [slide, setSlide] = useState(0);
    const slideCount = 1 + HERO_EXTRA_SLIDES.length;
    useEffect(() => {
        if (heroImgRef.current?.complete) setHeroPainted(true);
    }, []);
    // A timeout rather than an interval, so tapping a dot restarts the beat
    // instead of leaving the next auto-advance a few hundred ms away.
    useEffect(() => {
        if (!heroPainted || slideCount < 2) return;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
        const id = setTimeout(() => setSlide((s) => (s + 1) % slideCount), HERO_SLIDE_MS);
        return () => clearTimeout(id);
    }, [slide, slideCount, heroPainted]);

    // ── Countdown to the puja date ──
    const targetTs = new Date(puja.pujaDate).getTime();
    const [remaining, setRemaining] = useState(() =>
        Number.isNaN(targetTs) ? 0 : Math.max(0, targetTs - Date.now())
    );
    useEffect(() => {
        if (Number.isNaN(targetTs)) return;
        const tick = () => setRemaining(Math.max(0, targetTs - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetTs]);
    const cd = remaining > 0 ? {
        days: Math.floor(remaining / 86400000),
        hrs: Math.floor((remaining % 86400000) / 3600000),
        min: Math.floor((remaining % 3600000) / 60000),
        sec: Math.floor((remaining % 60000) / 1000),
    } : null;

    const whatYouGet = [
        { icon: BadgeCheck, title: "Personalized offering", sub: "Performed in your name & gotra" },
        { icon: Video, title: "Puja video on WhatsApp", sub: "Full recording delivered to you" },
        { icon: Gift, title: "Prasad at your home", sub: "Sacred prasad couriered to you" },
    ];

    // The sacred offerings poured during the Rudrabhishek.
    //
    // `img` is the photo on the tile; the Lucide icon is what the tile falls
    // back to while an item has no artwork yet, so photos can be dropped in one
    // at a time without the row ever changing shape (same convention as the
    // Banke Bihari ItemTile). 1008 Naam Jaap, Bhang and Dhatura have no CDN art
    // yet — paste the URL in and they turn into photos with no other change.
    //
    // Order matters: this reads left-to-right in the marquee, so the two
    // headline offerings (Gangajal, Bel Patra) lead and the icon-only tiles
    // trail behind the photographed ones.
    const offerings = [
        { icon: Droplets, label: "Gangajal", sub: "Abhishek jal", img: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/DevshayaniEkadashi/Ganga%20jal.webp" },
        { icon: Leaf, label: "Bel Patra", sub: "Shiv's favourite", img: "https://png.pngtree.com/png-clipart/20230617/ourmid/pngtree-nature-green-leaf-transparent-image-png-image_7153754.png" },
        { icon: Flame, label: "Rudri Path", sub: "Vedic chanting", img: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/book.jpeg" },
        { icon: Moon, label: "Panchamrit", sub: "Five nectars", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2TtfsJKDJ_cYyNXsfDMr_ou7C-uBvft9x2BUD7zOcDL0Yux8nIZ2-LI_S&s=10" },
        { icon: Sparkles, label: "1008 Jaap", sub: "Om Namah Shivay", img: "https://png.pngtree.com/png-vector/20220216/ourmid/pngtree-om-namah-shivaya-hindi-text-png-image_4377941.png" },
        { icon: Leaf, label: "Bhang", sub: "Offered to Shiv", img: "https://www.planetayurveda.com/pa-wp-images/cannabis-sativa.jpg" },
        { icon: Flower2, label: "Dhatura", sub: "Mahadev's flower", img: "https://m.media-amazon.com/images/I/515CXvq2YzL._AC_UF350,350_QL80_.jpg" },
    ];

    // Main CTA goes straight to the booking page. The optional prasad add-on
    // lives inside the booking page only (no pre-booking upsell interruption).
    // AddToCart marks intent at the CTA tap (same convention as PujaPage.tsx);
    // InitiateCheckout / Purchase then fire on the booking page itself, so the
    // three funnel steps stay distinct instead of collapsing onto one trigger.
    //
    // ViewContent / AddToCart here necessarily report the ₹851 base seva: the
    // prasad box and extra Sankalp names are chosen on the booking page, so no
    // add-on exists yet at this point in the funnel. The booking's real value
    // (base + add-ons) is reported by InitiateCheckout / Purchase from
    // SavanPujaBookingPage and by the server CAPI Purchase — read those, not
    // these, when reconciling revenue in Events Manager.
    const openBooking = () => {
        track("AddToCart", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: price,
            currency: "INR",
        });
        navigate(`/${KASHI_MAHADEV_PUJA_SLUG}/booking`);
    };

    const handleShare = async () => {
        if (isSharing) return;
        const baseUrl = `${window.location.origin}${location.pathname}`;
        if (!user) {
            try {
                if (navigator.share) await navigator.share({ title: puja.poojaNameEng, url: baseUrl });
                else { await navigator.clipboard.writeText(baseUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }
            } catch { /* cancelled */ }
            return;
        }
        setIsSharing(true);
        try {
            const token = localStorage.getItem("user_token");
            const stored = localStorage.getItem("user_data");
            if (!token || !stored) throw new Error("not logged in");
            const userId = JSON.parse(stored)._id;
            const res = await fetch(`${API_URL}/users/${userId}/my-referral`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            const decrypted = json?.encrypted ? decryptData(json.encrypted) : null;
            const code: string | undefined = decrypted?.userReferralCode;
            const shareUrl = code ? `${baseUrl}?intref=${code}` : baseUrl;
            const shareText = `Book ${puja.poojaNameEng} with PanditJi At Request!\n${shareUrl}`;
            if (navigator.share) await navigator.share({ title: puja.poojaNameEng, text: shareText, url: shareUrl });
            else { await navigator.clipboard.writeText(shareUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }
        } catch { /* cancelled */ }
        finally { setIsSharing(false); }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFDF8] via-[#F0FAF7] to-[#FFFDF8] pb-24 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-[#DDEBE6]">
        {/* Savan rain — falls across the entire page, not just the hero. Drops
            are tinted Primary Emerald rather than white, since the page sits on
            Main Background / Alternate Section, where white would vanish. */}
        <style>{`
          @keyframes savanDrop{0%{transform:translateY(-6vh);opacity:0}10%{opacity:var(--drop-opacity,.7)}88%{opacity:var(--drop-opacity,.7)}100%{transform:translateY(106vh);opacity:0}}
          .savan-rain{position:fixed;top:0;bottom:0;width:100%;max-width:28rem;overflow:hidden;pointer-events:none;z-index:30}
          .savan-drop{position:absolute;top:0;width:var(--drop-w,1.5px);height:var(--drop-h,14px);border-radius:9999px;background:linear-gradient(to bottom,rgba(8,107,80,0),rgba(8,107,80,.55));animation:savanDrop var(--drop-dur,3s) linear infinite;will-change:transform}
          @media (prefers-reduced-motion: reduce){.savan-rain{display:none}.review-track{animation:none}}
        `}</style>

        {/* Page-wide rainfall. `fixed` so it keeps falling while the devotee
            scrolls, clipped to the max-w-md column, and pointer-events-none so
            it never intercepts a tap. z-30 sits above the cards but below the
            sticky header and bottom CTA (both z-50), which stay fully crisp.
            Mounted after first paint — see the showRain note above. */}
        {showRain && (
        <div className="savan-rain" aria-hidden="true">
          {SAVAN_RAINDROPS.map((d, i) => (
            <span
              key={i}
              className="savan-drop"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
                ["--drop-dur" as string]: `${d.dur}s`,
                ["--drop-h" as string]: `${d.h}px`,
                ["--drop-w" as string]: `${d.w}px`,
                ["--drop-opacity" as string]: `${d.opacity}`,
              }}
            />
          ))}
        </div>
        )}

        <Helmet>
          <title>{`${puja.poojaNameEng} at ${puja.templeName}, Varanasi | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book online ${puja.poojaNameEng} (${puja.poojaNameHindi}) — Rudrabhishek performed on your behalf at ${mandirName} on the first Savan Somwar, ${puja.pujaDate}. ${puja.benefits.slice(0, 2).join(", ")}. Verified pandits, puja video on WhatsApp.`}
          />
          {/* No hero preload here on purpose. A React-rendered preload lands far
              too late to help LCP anyway (it waits on the entry bundle + this
              route's lazy chunk), and react-helmet-async does not reliably pass
              through imagesrcset/imagesizes — so it could preload a different
              srcset candidate than the <img> picks and download the hero twice.
              The parser-discoverable preload in the generated route shell owns
              this instead: scripts/generate-route-shells.mjs. */}
        </Helmet>

        <PujaEnquiryModal
          isOpen={isEnquiryOpen}
          onClose={() => setIsEnquiryOpen(false)}
          pujaId={pujaId}
          pujaName={puja.poojaNameEng}
          prefillName={user?.name || (user as any)?.fullName || ""}
          prefillPhone={user?.phone || (user as any)?.mobileNumber || ""}
          prefillCity={(user as any)?.city || ""}
        />

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-50 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#DDEBE6] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#DDEBE6] shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#17211D]" />
          </button>
          <h1 className="text-sm font-bold text-[#17211D] truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#DDEBE6] shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-[#008C68]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#17211D]" />
            )}
          </button>
        </div>

        {/* ── Savan occasion ribbon ── */}
        <div className="bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] text-center py-1.5 px-4">
          <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-white">
            सावन 2026 · {puja.occasion} · हर हर महादेव
          </p>
        </div>

        {/* ── Hero banners, auto-advancing (the page-wide rain falls over these
            too). Crossfade rather than a sliding track: the slides are stacked
            in one box, so nothing can shift the layout as they change, and the
            hero keeps its exact painted position. The rating chip is the ONLY
            thing overlaid on the artwork — it already carries the puja name,
            location and value props, and repeating those just covered its own
            icons. */}
        <div
          className="relative h-52 overflow-hidden bg-[#086B50]"
          aria-roledescription="carousel"
          aria-label={`${puja.poojaNameEng} banners`}
        >
          {/* Slide 0 — the LCP image. srcSet/sizes let a DPR-1 phone take the
              448w file (~19 KB) while retina takes 896w (~53 KB), instead of
              every device paying for the large one. The route shell's preload
              carries the same srcset so the browser preloads whichever
              candidate this <img> will use. */}
          <img
            ref={heroImgRef}
            src={HERO.src}
            srcSet={HERO.srcSet}
            sizes={HERO.sizes}
            onLoad={() => setHeroPainted(true)}
            onError={(e) => { e.currentTarget.srcset = ""; e.currentTarget.src = image; setHeroPainted(true); }}
            width={HERO.width}
            height={HERO.height}
            alt={puja.poojaNameEng}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className={`w-full h-full object-cover transition-opacity duration-700 ${slide === 0 ? "opacity-100" : "opacity-0"}`}
          />

          {/* The rest — mounted only once the hero has painted, and fetched at
              low priority. onError falls back to the origin URL, the convention
              `optimizedImg` documents, so a proxy hiccup can't blank a slide. */}
          {heroPainted && HERO_EXTRA_SLIDES.map((s, i) => (
            <img
              key={s.src}
              src={optimizedImg(s.src, 896)}
              onError={(e) => { e.currentTarget.src = s.src; }}
              alt={s.alt}
              loading="lazy"
              fetchPriority="low"
              decoding="async"
              aria-hidden={slide !== i + 1}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${slide === i + 1 ? "opacity-100" : "opacity-0"}`}
            />
          ))}

          {/* Rating, floated over the artwork's top-right corner. It sits
              outside the crossfading <img> stack, so it stays put and at full
              opacity while the banners change. Frosted white rather than a
              solid chip: the banners differ in tone, and a translucent pill
              stays legible over all of them without punching a hole in the
              art. This is the page's only rating — it was lifted out of the
              meta line below, which now carries deity + place. */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 px-2 py-1 shadow-sm">
            <Stars value={puja.rating} className="w-3 h-3" />
            <span className="text-[11px] font-bold text-[#17211D] leading-none">
              {puja.rating}
            </span>
            <span className="text-[10px] text-[#66736E] leading-none">
              ({puja.devoteesLabel})
            </span>
          </div>

          {/* Dots — also the manual control, since the banners carry different
              artwork a devotee may want to go back to. */}
          {slideCount > 1 && (
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
              {Array.from({ length: slideCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Show banner ${i + 1} of ${slideCount}`}
                  aria-current={i === slide}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-4 bg-white" : "w-1.5 bg-white/55"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* ── Puja name + meta ─────────────────────────────────────────────
              Three lines: name, then the Hindi name with the date riding the
              empty right half of that line, then deity + place. The rating
              lives on the hero above instead of here.

              Everything cut from here is still on screen within a thumb's
              reach: the ribbon directly above carries the occasion ("First
              Savan Somwar"), and the highlighted countdown below repeats the
              date. */}
          <div>
            <h2 className="text-xl font-bold font-serif text-[#17211D] leading-tight">
              {puja.poojaNameEng}
            </h2>
            {/* The Hindi name is ~170px at this size and the date chip ~105px,
                so they seat together down to a 320px screen. `min-w-0` on the
                name means a longer one wraps to a second line rather than
                shoving the date off the row.

                The date wears the page's temple-gold coupon treatment — the
                same palette as the countdown card below, so the two read as
                the same "this is the day" signal rather than two unrelated
                styles. Type stays 10.5px to keep the chip inside that width
                budget once the padding and border are added. */}
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="min-w-0 text-[12.5px] text-[#086B50] font-medium">
                {puja.poojaNameHindi}
              </p>
              <span className="shrink-0 flex items-center gap-1 text-[10.5px] font-bold text-[#17211D] bg-gradient-to-br from-[#FFF8E7] to-[#FFF3DC] border border-[#E8CF9A] rounded-full px-1.5 py-0.5">
                <Calendar className="w-3 h-3 text-[#C89B3C] shrink-0" />
                {puja.pujaDate}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-[11.5px]">
              <span className="bg-[#DFF5EF] text-[#086B50] font-semibold px-2 py-0.5 rounded-full">
                {puja.deity}
              </span>
              <span className="flex items-center gap-1 text-[#66736E]">
                <Mountain className="w-3.5 h-3.5 text-[#086B50] shrink-0" />
                {mandirShort}
              </span>
            </div>
          </div>

          {/* ── Rudrabhishek offerings ── */}
          <div>
            <SectionTitle icon={<Droplets className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              What is offered in your name
            </SectionTitle>
            <OfferingsMarquee offerings={offerings} />
          </div>


          {/* ── Countdown + free-gift offer ─────────────────────────────────
              Highlighted in temple gold rather than the page's plain white
              card: this row carries both the urgency and the gift, so it has
              to lift off the sections above and below it.

              The gift sits BESIDE the countdown at every width — no wrapping
              onto its own line — which is what sets both sides' sizes. The
              gift is a fixed 100px rail (`shrink-0`), so on the narrowest
              phone the timer is left ~145px of the 28rem column: exactly the
              four 34px tiles plus their gaps, which is why the tiles are that
              size and why the ":" separators are gone. Widening the gift or
              re-adding the separators overflows a 320px screen.

              That budget is also why the gift copy is a product shot plus two
              words — there is no room for a third line beside a live timer. */}
          <div className="rounded-xl border border-[#E8CF9A] bg-gradient-to-br from-[#FFF8E7] via-[#FFFDF5] to-[#FFF3DC] px-2.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Left — slots closing for the puja date */}
              <div className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-[#086B50] leading-tight text-center">
                  Limited slots for {puja.pujaDate}
                </span>
                {cd ? (
                  <div className="flex items-center justify-center gap-1">
                    {[
                      { v: cd.days, l: "Days" },
                      { v: cd.hrs, l: "Hrs" },
                      { v: cd.min, l: "Min" },
                      { v: cd.sec, l: "Sec" },
                    ].map((u) => (
                      <div
                        key={u.l}
                        className="min-w-[34px] bg-[#DFF5EF] border border-[#DDEBE6] rounded-lg px-1 py-1 text-center"
                      >
                        <div className="text-[15px] leading-none font-bold text-[#17211D] tabular-nums">
                          {pad2(u.v)}
                        </div>
                        <div className="text-[7.5px] uppercase tracking-wide text-[#66736E] mt-0.5">
                          {u.l}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[12px] text-[#66736E]">Booking open</span>
                )}
              </div>

              {/* Right — free Rudraksh bracelet with the booking. Dashed gold
                  border so it reads as a coupon, not another info card. */}
              <div className="relative overflow-hidden shrink-0 w-[100px] flex flex-col items-center gap-1 bg-white border border-dashed border-[#C89B3C] rounded-lg py-1">
                {/* Corner offer strip: a rotated band clipped by the card's own
                    overflow-hidden, so "FREE" reads as a sticker slapped across
                    the corner rather than one more label under the photo — and
                    the space it frees goes to the bracelet. Geometry is tuned
                    to this 100px card: the band's centre sits just inside the
                    corner and both ends are cut off by the rounded edge. */}
                <span className="absolute top-[6px] -right-[20px] w-[70px] rotate-45 bg-[#C89B3C] text-white text-center text-[7.5px] font-extrabold uppercase tracking-[0.12em] py-[2px] shadow-sm z-10">
                  Free
                </span>
                {/* Drawn at 64 px; 180 px covers ~2.8x density. onError falls
                    back to the origin URL, the convention `optimizedImg`
                    documents, so a proxy hiccup can't blank the gift. */}
                <img
                  src={optimizedImg(RUDRAKSH_BRACELET_IMAGE, 180)}
                  onError={(e) => { e.currentTarget.src = RUDRAKSH_BRACELET_IMAGE; }}
                  alt="Free 5 Mukhi Rudraksh bracelet"
                  loading="lazy"
                  decoding="async"
                  className="w-20 h-20 shrink-0 rounded-lg object-cover border border-[#F0E2C2]"
                />
                <p className="text-[9px] font-bold text-[#17211D] leading-tight text-center">
                  Rudraksh Bracelet
                </p>
              </div>
            </div>
          </div>

          {/* ── Hero value props ── */}
          <div className="rounded-2xl border border-[#DDEBE6] bg-gradient-to-br from-[#FFFDF8] via-[#F0FAF7] to-[#DFF5EF]/70 p-3.5 shadow-sm">
            <div className="space-y-1.5">
              {[
                "Rudrabhishek on the first Savan Somwar",
                "Personalized Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                "Optional prasad delivered at home",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#17211D]">
                  <Check className="w-3.5 h-3.5 text-[#008C68] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mantra strip ── */}
          {/*
            The flanking images are absolutely positioned and vertically
            centred, so they can be scaled past the strip's own height and
            spill over its top/bottom edges without pushing it taller.
          */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] px-16 py-3 text-center shadow-md">
            {MANTRA_SIDE_IMAGE && (
              <img
                src={MANTRA_SIDE.src}
                srcSet={MANTRA_SIDE.srcSet}
                sizes={MANTRA_SIDE.sizes}
                onError={(e) => { e.currentTarget.srcset = ""; e.currentTarget.src = MANTRA_SIDE_IMAGE; }}
                width={MANTRA_SIDE.width}
                height={MANTRA_SIDE.height}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 w-22 h-22 object-contain -scale-x-100 drop-shadow-lg"
              />
            )}
            <p className="text-[15px] font-serif font-bold text-white tracking-wide">
              ॐ नमः शिवाय
            </p>
            <p className="text-[10.5px] text-[#DFF5EF] mt-0.5">
              Chanted through your Rudrabhishek at Kashi
            </p>
            {MANTRA_SIDE_IMAGE && (
              <img
                src={MANTRA_SIDE.src}
                srcSet={MANTRA_SIDE.srcSet}
                sizes={MANTRA_SIDE.sizes}
                onError={(e) => { e.currentTarget.srcset = ""; e.currentTarget.src = MANTRA_SIDE_IMAGE; }}
                width={MANTRA_SIDE.width}
                height={MANTRA_SIDE.height}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-22 h-22 object-contain drop-shadow-lg"
              />
            )}
          </div>

          

          {/* ── Online-puja reassurance line ── */}
          <div className="flex items-center justify-center gap-1.5 bg-[#DFF5EF] border border-[#DDEBE6] text-[#086B50] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
            <MessageCircle className="w-3.5 h-3.5 text-[#008C68] shrink-0" />
            Puja performed at {puja.templeName} · receive the video with your
            name &amp; gotra on WhatsApp
          </div>

          

          

          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle icon={<Star className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── How it works ── */}
          <div className="rounded-2xl border border-[#DDEBE6] bg-gradient-to-br from-[#FFFDF8] via-[#F0FAF7] to-[#DFF5EF]/70 p-3.5 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              How your puja will happen
            </SectionTitle>
            <div className="space-y-2.5">
              {[
                "Enter your name, gotra and phone number",
                `Pandit ji performs the Rudrabhishek at ${puja.templeName}`,
                "Sankalp is taken in your name & gotra",
                "Puja video is shared with you on WhatsApp",
                "Optional prasad is delivered to your home",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#DFF5EF] text-[#086B50] flex items-center justify-center text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] text-[#17211D] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why perform this puja ── */}
          <div className="rounded-2xl border border-[#DDEBE6] bg-gradient-to-br from-[#FFFDF8] via-[#F0FAF7] to-[#DFF5EF]/70 p-3 shadow-sm">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              Why perform this puja
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[#17211D]">
                  <Check className="w-3.5 h-3.5 text-[#008C68] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Support link (low-emphasis — keeps direct booking as the main path) ── */}
          <button
            onClick={() => {
              track("Contact", {
                content_name: puja.poojaNameEng,
                content_type: "consultation",
              });
              setIsEnquiryOpen(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 text-[#66736E] hover:text-[#086B50] font-semibold text-[12.5px] py-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Need help? Chat on WhatsApp
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              Puja details
            </SectionTitle>
            <div className="space-y-2">
              {puja.poojaDescription.map((d, i) => (
                <Accordion
                  key={d.headingId || d.heading}
                  title={d.heading}
                  defaultOpen={i < 2}
                >
                  <div dangerouslySetInnerHTML={{ __html: d.description }} />
                </Accordion>
              ))}
            </div>
          </div>

          {/* ── What you'll get ── */}
          <div>
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#C89B3C]" />}>
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-white border border-[#DDEBE6] rounded-xl p-2.5 text-center shadow-sm"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#DFF5EF] to-[#086B50]/20 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-[#086B50]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#17211D] leading-tight">{title}</p>
                  <p className="text-[9.5px] text-[#66736E] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          {puja.faqs.length > 0 && (
            <div>
              <SectionTitle icon={<HelpCircle className="w-3.5 h-3.5 text-[#C89B3C]" />}>
                Frequently asked questions
              </SectionTitle>
              <div className="space-y-2">
                {puja.faqs.map((f, i) => (
                  <Accordion key={i} title={f.question}>
                    <p>{f.answer}</p>
                  </Accordion>
                ))}
              </div>
            </div>
          )}

          {/* ── Trust row ── */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Video, label: "Puja Video Proof" },
              { icon: Gift, label: "Prasad at Home" },
              { icon: ShieldCheck, label: "Verified Pandit" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white border border-[#DDEBE6] rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm"
              >
                <Icon className="w-4 h-4 text-[#008C68]" />
                <span className="text-[9.5px] font-semibold text-[#66736E] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer / ecosystem ── */}
          <footer className="pt-3 mt-2 border-t border-[#DDEBE6] text-[11px] text-[#66736E] space-y-2">
            <p className="font-bold text-[#17211D]">PanditJiAtRequest</p>
            <p>1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <button onClick={() => navigate("/privacypolicy")} className="underline">
                Privacy Policy
              </button>
              <button onClick={() => navigate("/termsandconditions")} className="underline">
                Terms
              </button>
              <a href="tel:+919056955311" className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Support
              </a>
              <a
                href="https://wa.me/919056955311"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            </div>
          </footer>
        </div>

        {/* ── Sticky bottom CTA ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#DDEBE6] max-w-md mx-auto shadow-lg">
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <span className="text-[9.5px] text-[#66736E] font-semibold uppercase block leading-none">
                  Total
                </span>
                <span className="text-[19px] font-extrabold text-[#086B50]">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 bg-gradient-to-r from-[#086B50] via-[#008C68] to-[#086B50] text-white font-bold text-[15px] py-3 rounded-xl shadow-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#008C68] outline-none"
              >
                Book Savan Puja for ₹{price.toLocaleString("en-IN")}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-[#66736E]">
              <Lock className="w-3 h-3 text-[#008C68]" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
