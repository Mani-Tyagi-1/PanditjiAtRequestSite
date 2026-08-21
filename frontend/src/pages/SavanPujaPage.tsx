import { useState, useEffect, useId, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Lock, ChevronDown, MessageCircle, Phone, Flame, BadgeCheck,
    Video, Mountain, Share2, HelpCircle, Users,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { optimizedImg } from "../utils/img";
import analytics from "../utils/analytics";
import {
    kashiMahadevPuja, KASHI_MAHADEV_PUJA_SLUG,
    SAVAN_PACKAGES, DEFAULT_PACKAGE_ID, getPackage,
    PRASAD_BOX_PRICE, FAMILY_MEMBER_PRICE,
    type SavanPackageId,
} from "../data/kashiMahadevPuja";
import SavanPackages, { PACKAGE_CARDS_ANCHOR_ID } from "../components/savanPuja/SavanPackages";
import SavanRain from "../components/savanPuja/SavanRain";
import { useMoney, shipsPrasad } from "../utils/currency";
// import CountryPicker from "../components/checkout/CountryPicker";  // hidden — see the commented block below
import heroImages from "../data/savanHeroImages.json";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    // Delegates to utils/analytics: Meta receives exactly what this helper
    // always sent, and GA4 / Google Ads receive a mapped equivalent. The
    // signature is unchanged, so every call site on this page still works.
    analytics.metaBridge(event, params, custom);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Cheapest seva whose prasad box is free — read from the packages rather than
 * written into the copy, so a repriced tier can never leave this line quoting a
 * price that no longer exists.
 */
const FREE_BOX_FROM = SAVAN_PACKAGES.find((p) => p.prasadBoxFree)?.price ?? 0;

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
 * The hero's own CDN original, for the same reason: if a self-hosted variant
 * 404s the banner falls back to the artwork it was cut from.
 *
 * It must be THIS url and not `puja.poojaImages[0]` (which the fallback used
 * to be): that field is the product's card/social artwork, a different
 * picture, so a missing hero file would have silently swapped in unrelated
 * art rather than a lower-fidelity copy of the same banner.
 */
const HERO_ORIGIN_IMAGE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/banne1.webp";

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
 * their count from this array. Cut them 16:9: the band is `aspect-[16/9]`, so
 * a banner at that ratio is shown WHOLE and anything else loses its edges to
 * object-cover.
 */
const HERO_EXTRA_SLIDES: { src: string; alt: string }[] = [
    {
        src: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Banner2.png.webp",
        alt: "Why Rudrabhishek in Ujjain? Ujjain is the sacred city of Mahakal and home to the revered Shri Mahakaleshwar Jyotirlinga. Performing Rudrabhishek here is believed to invite Lord Shiva's blessings for peace, protection, spiritual strength and removal of obstacles.",
    },
    {
        src: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Banner3.png.webp",
        alt: "Puja process: 1. Choose the Rudrabhishek Puja. 2. Enter your name and gotra during booking. 3. Pandit ji performs your Sankalp and puja in Ujjain. 4. Receive the puja video on WhatsApp, and prasad if chosen.",
    },
];

/** Beat between banners. */
const HERO_SLIDE_MS = 3000;

/**
 * How long the page waits before gliding down to the package cards.
 *
 * Long enough that a devotee gets to take in the hero, the puja name and the
 * countdown first — a page that moves the instant it paints feels broken — and
 * short enough that someone who is still deciding whether to read on is shown
 * the thing they came to choose between.
 */
const PACKAGES_SCROLL_DELAY_MS = 2000;

/**
 * Where that glide parks the FIRST PACKAGE CARD — how far below the viewport
 * top its top edge lands.
 *
 * It deliberately overshoots the "Choose your seva" heading and the "In every
 * package" strip: both are read-once context, and ending on them leaves the
 * cards a devotee has to actually choose from half off the bottom of the
 * screen. 70 clears the ~56px sticky header with a small breathing gap.
 */
const PACKAGES_SCROLL_OFFSET = 70;

// Mahakal Savan online-puja devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Sunita Devi", rating: 5, date: "1 week ago", text: "Rudrabhishek ka video WhatsApp pe mil gaya, pandit ji ne mera naam aur gotra se sankalp kiya. 🙏", verified: true },
    { name: "Rakesh Kumar", rating: 5, date: "3 weeks ago", text: "₹851 mein Mahakaleshwar se puja karwana bahut easy tha. Sab update WhatsApp pe mila.", verified: true },
    { name: "Pooja Sharma", rating: 5, date: "2 weeks ago", text: "Prasad 5 din mein ghar aa gaya, bhasma aur bel patra bhi tha. Thank you team. 🙏", verified: true },
    { name: "Amit Verma", rating: 4, date: "1 month ago", text: "Puja theek se hui, video bhi mil gaya. Video thoda lamba hota to aur acha tha, par satisfied hoon.", verified: true },
    { name: "Deepak Yadav", rating: 5, date: "5 days ago", text: "Savan Somwar pe parents ke naam se book kiya. Pandit ji ne aarti mein naam liya. Family khush ho gayi.", verified: true },
    { name: "Anjali Nair", rating: 5, date: "2 months ago", text: "Booked from Dubai. Ujjain nahi ja paayi par connected feel hua. Simple process.", verified: false },
    { name: "Manoj Tiwari", rating: 4, date: "3 weeks ago", text: "Sankalp naam aur gotra se hua. Booking aasan thi. Overall accha experience raha.", verified: true },
    { name: "Kavita Singh", rating: 5, date: "1 month ago", text: "Baba Mahakal ke darbar se abhishek karwa ke mann ko shanti mili. Jai Mahakal! 🙏", verified: true },
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

// ── Small UI pieces ──────────────────────────────────────────────────────
// Palette: antique parchment + aged gold + deep crimson (the theme tokens and
// the decorative `svn-*` classes live in src/index.css). Colours are written
// as literal hexes here rather than theme utilities because that is how every
// hue on this page has always been written — one convention beats two.
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                // Unlit stars take the border gold at low alpha, not a grey:
                // on parchment a neutral grey reads as dirt, while a faded
                // gold reads as an unstruck star.
                <Star key={i} className={`${className} ${i <= full ? "text-[#C79A2B] fill-[#C79A2B]" : "text-[#D8B66A]/45"}`} />
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
        <div className={`bg-[#FCF8F0] border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#C79A2B] shadow-[0_2px_10px_-6px_rgba(40,25,10,0.5)]" : "border-[#D8B66A]/60"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#C79A2B] outline-none"
            >
                <span className="flex items-center gap-2 font-svn-sub text-[13px] font-semibold text-[#23201B]">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#C79A2B] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {/* The panel is divided from its own heading by the theme's engraved
                gold hairline rather than a solid border, so an open accordion
                reads as a ruled manuscript entry. */}
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-2.5 text-[12.5px] text-[#665C50] leading-relaxed border-t border-[#D8B66A]/45">
                {children}
            </div>
        </div>
    );
}

/**
 * Section heading — Cinzel small caps in crimson, with the theme's engraved
 * gold rule running out to the right margin (`svn-rule`). The rule is what
 * makes a bare heading read as a manuscript section head; it fills whatever
 * width the title leaves, so headings of any length still line up.
 */
function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="svn-rule flex items-center gap-1.5 font-svn-sub text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#7A1622] mb-2.5">
            {icon}{children}
        </h3>
    );
}

/** Centred lozenge-and-hairline separator — the manuscript section break. */
function Ornament() {
    return (
        <div className="svn-orn py-0.5" aria-hidden="true">
            <span className="w-1.5 h-1.5 rotate-45 bg-[#C79A2B]" />
        </div>
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
            {/* The reduced-motion rule lives here, alongside the animation it
                switches off. It used to ride in the page root's rain <style>,
                which went with the rain when that moved to its own component. */}
            <style>{`@keyframes reviewMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}.review-track{animation:reviewMarquee 32s linear infinite;width:max-content}.review-track.is-paused{animation-play-state:paused}.review-track:hover{animation-play-state:paused}@media (prefers-reduced-motion: reduce){.review-track{animation:none}}`}</style>
            <div ref={trackRef} className={`review-track flex gap-2.5${inView ? "" : " is-paused"}`}>
                {items.map((r, i) => (
                    <div key={i} className="shrink-0 w-56 bg-[#FCF8F0] border border-[#D8B66A]/60 rounded-xl p-3 shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)]">
                        <div className="flex items-center gap-1.5">
                            <span className="font-svn-sub font-semibold text-[#23201B] text-[11.5px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#7A1622] shrink-0" />}
                            <span className="ml-auto text-[9px] text-[#8C8274]">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-[#665C50] mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// The auto-scrolling "What is offered in your name" row stood here, together
// with its Offering type and tile-width constants. The section that rendered it
// is switched off, and `tsc -b` fails the build on an unused component, so it
// went with the section. The package cards still show every offering as picture
// tiles (components/savanPuja/ItemTiles.tsx), which is where a devotee compares
// them anyway; restore this from git if the standalone row is ever wanted back.

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Shree Ujjain Rudrabhishek Mahapuja — an online
// Rudrabhishek performed on the devotee's behalf at Shri Mahakaleshwar
// Jyotirlinga Temple, Ujjain on the last Savan Somwar. Renders entirely from frontend data
// but carries a distinct Savan/Shiv theme (the emerald / light-aqua / temple-gold palette, abhishek
// droplets, bel patra, the four-Somwar calendar).
// All data comes from src/data/kashiMahadevPuja.ts.
export default function SavanPujaPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Every price on this page is written through `money()`. The package data
    // stays in rupees — this only decides how those rupees are rendered, and
    // the booking page picks up the same detected country.
    const { country, money } = useMoney();
    // Blessed prasad is couriered within India only, so nothing on this page may
    // promise a parcel abroad — see `shipsPrasad`.
    const prasadShippable = shipsPrasad(country);

    const puja = kashiMahadevPuja;
    const pujaId = kashiMahadevPuja._id;

    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    // Chosen booking package — the ONLY choice this page makes. It drives the
    // sticky-CTA price and the offerings row, and is handed to the booking page
    // as navigation state so that page opens pre-selected.
    //
    // The prasad box is deliberately NOT decided here: it is an opt-in on the
    // booking page at every tier (free on the top one), so this page never
    // prices it and the cards only say what it will cost there.
    const [packageId, setPackageId] = useState<SavanPackageId>(DEFAULT_PACKAGE_ID);
    const selectedPkg = getPackage(packageId);

    // The rainfall's own deferred mount and perf notes moved with it into
    // components/savanPuja/SavanRain.tsx.

    // ViewContent on load — reports the package the page opens on, not the
    // one the devotee may later switch to (that is AddToCart's job below).
    useEffect(() => {
        track("ViewContent", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: getPackage(DEFAULT_PACKAGE_ID).price,
            currency: "INR",
        });
    }, []);

    // The product's own CDN artwork — now used for og:image ONLY. The hero's
    // onError fallback used to point here too; it points at HERO_ORIGIN_IMAGE
    // instead, so a missing hero variant degrades to the same banner rather
    // than to a different picture. HERO holds the self-hosted, display-sized
    // variants actually shown.
    const image = puja.poojaImages?.[0] || puja.poojaMainImage || puja.poojaCardImage;
    // The sticky CTA quotes the package alone. The prasad box and extra family
    // Sankalps are both chosen on the booking page, so neither can be priced in
    // yet — and quoting a total the devotee hasn't agreed to would be worse
    // than quoting the seva they just picked.
    const price = selectedPkg.price;
    const reviews = seededReviews(pujaId, 9);
    // The city on its own ("Ujjain"). `templeLocation` is written city-first
    // for exactly this reason — see the note on that field.
    const templeCity = puja.templeLocation.split(",")[0].trim();
    // City only ("Mahakal, Ujjain") for the meta line — the state adds length
    // without telling a devotee anything they don't already know.
    const mandirShort = `${puja.templeName}, ${templeCity}`;
    // How the seva itself is described — "Rudrabhishek in Mahakal Nagri
    // Ujjain", never "Rudrabhishek at Mahakal". `mandirShort` stays as it is:
    // it labels the place, this phrases the puja.
    const pujaPlace = "Mahakal Nagri Ujjain";

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

    // ── One-time glide down to the packages ───────────────────────────────
    //
    // The hero, the title block and the countdown fill the first screen, so the
    // choice this page is actually asking a devotee to make starts below the
    // fold. A couple of seconds after landing — and ONLY if they haven't
    // touched the page yet — we scroll the first package card up under the
    // header so the comparison is on screen.
    //
    // Our own eased rAF tween rather than native smooth scroll, for a
    // consistent glide across browsers, and it bails the instant they interact
    // so it can never fight someone who is already reading.
    useEffect(() => {
        let interacted = false;
        let rafId = 0;
        const mark = () => { interacted = true; cancelAnimationFrame(rafId); };
        window.addEventListener("wheel", mark, { passive: true });
        window.addEventListener("touchmove", mark, { passive: true });
        window.addEventListener("keydown", mark);

        const timeoutId = setTimeout(() => {
            // Already scrolling under their own steam — leave them alone.
            if (interacted || window.scrollY > 40) return;
            // The card list, not the "#packages" section: the glide should end
            // on the first card, past the heading and the shared-core strip.
            // Falls back to the section if the anchor ever goes missing.
            const el =
                document.getElementById(PACKAGE_CARDS_ANCHOR_ID) ??
                document.getElementById("packages");
            if (!el) return;

            const startY = window.scrollY;
            const targetY = Math.max(0, el.getBoundingClientRect().top + startY - PACKAGES_SCROLL_OFFSET);
            const distance = targetY - startY;
            if (Math.abs(distance) < 4) return;

            // Respect reduced-motion: jump straight there, no animation.
            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
                window.scrollTo(0, targetY);
                return;
            }

            const duration = 1400;
            const startT = performance.now();
            const easeInOutCubic = (t: number) =>
                t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const step = (now: number) => {
                if (interacted) return;
                const t = Math.min(1, (now - startT) / duration);
                window.scrollTo(0, startY + distance * easeInOutCubic(t));
                if (t < 1) rafId = requestAnimationFrame(step);
            };
            rafId = requestAnimationFrame(step);
            track("puja_packages_autoscroll", {}, true);
        }, PACKAGES_SCROLL_DELAY_MS);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
            window.removeEventListener("wheel", mark);
            window.removeEventListener("touchmove", mark);
            window.removeEventListener("keydown", mark);
        };
    }, []);

    const whatYouGet = [
        { icon: BadgeCheck, title: "Personalized offering", sub: "Performed in your name & gotra" },
        { icon: Video, title: "Puja video on WhatsApp", sub: "Full recording delivered to you" },
        prasadShippable
            ? { icon: Gift, title: "Prasad at your home", sub: `Free in ${money(FREE_BOX_FROM)}, else ${money(PRASAD_BOX_PRICE)}` }
            // The seva reaches a devotee abroad exactly as it does at home; only
            // the parcel cannot follow. Naming what they DO get keeps the strip
            // at three tiles instead of leaving a gap where the box was.
            : { icon: Mountain, title: "Kashi Sankalp for you", sub: "Wherever in the world you are" },
    ];

    /**
     * Packages that have already reported an AddToCart, so none reports twice.
     *
     * Two things on this page mark intent — picking a seva card, and tapping
     * the CTA on whichever seva is showing — and each used to report its own
     * way: the card fired a CUSTOM `puja_package_select`, the CTA fired the
     * standard AddToCart. That was wrong twice over. A custom event is invisible
     * to everything Meta does with a cart-add (delivery optimisation, dynamic
     * ads, AddToCart-based audiences), so the card's signal never counted where
     * it mattered; and the card's handler runs on EVERY tap, re-selecting the
     * same tier included, so a devotee comparing sevas emitted a burst of
     * "cart adds" that would inflate the count and pollute any audience built
     * on it.
     *
     * A ref rather than state: this must not re-render anything, and it must
     * hold its value across the renders a selection causes.
     */
    const addedToCart = useRef(new Set<SavanPackageId>());

    /**
     * One AddToCart per seva the devotee actually settles on.
     *
     * Re-tapping the selected card is silent, switching tier reports the new
     * tier, and the CTA reports only when it is the first thing to mark intent
     * — the common case, since the page opens on DEFAULT_PACKAGE_ID and most
     * devotees tap straight through without touching a card.
     *
     * Reports the package alone: the prasad box and extra Sankalp names are
     * both chosen on the booking page, so they cannot be priced in yet. The
     * booking's real value (package + extras) is reported by InitiateCheckout /
     * Purchase from SavanPujaBookingPage and by the server CAPI Purchase — read
     * those, not this, when reconciling revenue in Events Manager.
     */
    const reportAddToCart = (id: SavanPackageId) => {
        if (addedToCart.current.has(id)) return;
        addedToCart.current.add(id);

        const pkg = getPackage(id);
        // Same id/category/brand the booking page reports, so one seva reads as
        // one product across add_to_cart → begin_checkout → purchase instead of
        // three unrelated rows. `analytics.addToCart` builds the Meta payload
        // (content_ids, content_type, contents, num_items, value, currency) and
        // the GA4 `ecommerce` envelope from this one item.
        analytics.addToCart({
            items: [{
                id: pujaId,
                name: `${puja.poojaNameEng} — ${pkg.name}`,
                price: pkg.price,
                quantity: 1,
                category: "Puja",
                variant: pkg.name,
                brand: "Savan",
            }],
            value: pkg.price,
            currency: "INR",
        });
    };

    // Main CTA goes straight to the booking page.
    // AddToCart marks intent at the CTA tap (same convention as PujaPage.tsx)
    // unless the card tap already reported this seva; InitiateCheckout /
    // Purchase then fire on the booking page itself, so the three funnel steps
    // stay distinct instead of collapsing onto one trigger.
    const openBooking = () => {
        reportAddToCart(packageId);
        track("puja_cta_click", { package: selectedPkg.id, value: price }, true);
        // Hand the chosen package to the booking page so it opens on the seva
        // the devotee picked here.
        navigate(`/${KASHI_MAHADEV_PUJA_SLUG}/booking`, { state: { packageId } });
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

    // No bottom padding on the root any more: the wood footer now owns the
    // clearance for the fixed pay bar (its own `pb-28`), so the wood runs all
    // the way to the foot of the page instead of stopping short and leaving a
    // strip of parchment under it.
    return (
      <div className="svn svn-parchment min-h-screen font-svn-body w-full max-w-md mx-auto shadow-xl relative border-x border-[#D8B66A]">
        {/* Savan rain — falls across the entire page, not just the hero. This
            page only: the booking page shares the theme but stays still, so
            nothing drifts behind a devotee filling in a form. */}
        <SavanRain />

        <Helmet>
          {/* City, not `mandirShort` — the puja name already carries the
              temple ("Mahakaleshwar"), so the pair would repeat it. Every
              other tag below is free to name both. */}
          <title>{`${puja.poojaNameEng} at ${templeCity} | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book online ${puja.poojaNameEng} (${puja.poojaNameHindi}) — Rudrabhishek performed on your behalf in ${pujaPlace} on the last Savan Somwar, ${puja.pujaDate}. ${puja.benefits.slice(0, 2).join(", ")}. Verified pandits, puja video on WhatsApp.`}
          />
          <link rel="canonical" href={`https://panditjiatrequest.com/${KASHI_MAHADEV_PUJA_SLUG}`} />
          {/* Social share preview (WhatsApp / Facebook / X). This page has a
              Share button whose whole purpose is sending the link to family, so
              without these every share renders as a bare URL with no card. */}
          <meta property="og:type" content="product" />
          <meta property="og:site_name" content="Pandit Ji At Request" />
          <meta property="og:title" content={`${puja.poojaNameEng} — ${puja.occasion} in ${pujaPlace}`} />
          <meta property="og:description" content={`Rudrabhishek performed on your behalf in ${pujaPlace} on ${puja.pujaDate}. Sankalp in your name & gotra, puja video on WhatsApp. Packages from ₹${SAVAN_PACKAGES[0].price.toLocaleString("en-IN")}.`} />
          <meta property="og:url" content={`https://panditjiatrequest.com/${KASHI_MAHADEV_PUJA_SLUG}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${puja.poojaNameEng} — ${puja.occasion} in ${pujaPlace}`} />
          <meta name="twitter:description" content={`Rudrabhishek in ${pujaPlace} on ${puja.pujaDate}. Packages from ₹${SAVAN_PACKAGES[0].price.toLocaleString("en-IN")}, puja video on WhatsApp.`} />
          {/* Only emitted once the banner artwork exists — an empty og:image is
              worse than none. Deliberately the ORIGIN CDN url, not a resized
              one: social scrapers should fetch the original. */}
          {image && <meta property="og:image" content={image} />}
          {image && <meta name="twitter:image" content={image} />}
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

        {/* ── Sticky header ──
            Parchment rather than white, with the theme's gold rule along its
            bottom edge, so the bar reads as the head of the sheet rather than
            chrome laid over it. */}
        <div className="sticky top-0 z-50 bg-[#F6F0E3]/92 backdrop-blur-md border-b border-[#D8B66A] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-[#FFFDF8] flex items-center justify-center border border-[#C79A2B] shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#7A1622]" />
          </button>
          <h1 className="font-svn-head text-[17px] font-semibold text-[#23201B] truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-[#FFFDF8] flex items-center justify-center border border-[#C79A2B] shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {/* Forest Green is the theme's only success hue — the copied tick
                is the page's one confirmation, so it is the one place it is
                allowed to appear. */}
            {shareCopied ? (
              <Check className="w-4 h-4 text-[#3E6B4A]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#7A1622]" />
            )}
          </button>
        </div>

        {/* ── Savan occasion ribbon ──
            Deep crimson, gold-ruled top and bottom, occasion set in Cinzel
            caps. This is the one saturated band above the fold, which is why
            the hero below it carries no overlaid type at all. */}
        <div className="svn-crimson border-y border-[#C79A2B]/70 text-center py-1.5 px-4">
          <p className="font-svn-sub text-[10px] font-semibold tracking-[0.18em] uppercase text-[#E2BF62]">
            सावन 2026 · {puja.occasion} · जय श्री महाकाल
          </p>
        </div>

        {/* ── Hero banners, auto-advancing (the page-wide rain falls over these
            too). Crossfade rather than a sliding track: the slides are stacked
            in one box, so nothing can shift the layout as they change, and the
            hero keeps its exact painted position. The rating chip is the ONLY
            thing overlaid on the artwork — it already carries the puja name,
            location and value props, and repeating those just covered its own
            icons. */}
        {/* The frame is dark wood and gold-ruled along its foot: where the
            artwork does not quite fill the box the devotee sees the panel the
            picture is mounted on rather than a bare letterbox bar. `svn-wood`
            is set on the CONTAINER, not an inset child — an absolutely
            positioned sibling paints over static ones, so a child would cover
            the hero image itself.

            ── Why `aspect-[16/9]` and not the old fixed `h-52` ──
            This band used to be a flat 208px, which in the 448px column is
            2.15:1. The banners are 16:9 (1.78:1), so object-cover scaled them
            to 252px and clipped 22px off the top AND bottom — 8.7% at each
            end. That was survivable when the artwork was atmospheric.

            It is not survivable now: all three banners are INFORMATION panels
            with a title badge along the top edge and the "Mahakal Nagri Ujjain
            · Shri Mahakaleshwar Dham" strip along the bottom. At 208px that
            strip was sliced in half on every slide and slide 3 lost the trishul
            above its "Puja Process" heading.

            Matching the band to the artwork's own ratio shows all three whole.
            It costs ~44px above the fold, which is the trade this deliberately
            makes: a banner whose words are cut off is not worth the pixels it
            saves. If the artwork ever goes back to atmospheric photography,
            `h-52` is the tighter choice again. */}
        <div
          className="svn-wood relative aspect-[16/9] overflow-hidden border-b border-[#C79A2B]/70"
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
            onError={(e) => { e.currentTarget.srcset = ""; e.currentTarget.src = HERO_ORIGIN_IMAGE; setHeroPainted(true); }}
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
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-[#FCF8F0]/92 backdrop-blur-sm border border-[#C79A2B]/80 px-2 py-1 shadow-[0_2px_8px_-3px_rgba(40,25,10,0.6)]">
            <Stars value={puja.rating} className="w-3 h-3" />
            <span className="font-svn-sub text-[11px] font-bold text-[#23201B] leading-none">
              {puja.rating}
            </span>
            <span className="text-[10px] text-[#665C50] leading-none">
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
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-4 bg-[#E2BF62]" : "w-1.5 bg-[#F3E5BF]/50"}`}
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
              reach: the ribbon directly above carries the occasion ("Last
              Savan Somwar"), and the highlighted countdown below repeats the
              date. */}
          <div>
            {/* Cormorant Garamond at 24px — the display face, and the largest
                type on the page. It carries the whole heading weight for this
                block, which is why the two lines under it stay small. */}
            <h2 className="font-svn-head text-[24px] font-semibold text-[#23201B] leading-[1.15]">
              {puja.poojaNameEng}
            </h2>
            {/* The Hindi name is ~170px at this size and the date chip ~105px,
                so they seat together down to a 320px screen. `min-w-0` on the
                name means a longer one wraps to a second line rather than
                shoving the date off the row.

                The date keeps its gold chip, now on the theme's Warm Beige
                with an Aged Gold rim — a quiet engraved label. The lacquered
                countdown plate directly below carries the same date, and that
                is the loud one, so this must not compete with it. Type stays
                10.5px to keep the chip inside that width budget once the
                padding and border are added. */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="min-w-0 font-svn-head text-[14px] text-[#7A1622] font-medium">
                {puja.poojaNameHindi}
              </p>
              <span className="shrink-0 flex items-center gap-1 text-[10.5px] font-semibold text-[#23201B] bg-gradient-to-br from-[#F3E5BF] to-[#EFE3CC] border border-[#D8B66A] rounded-full px-1.5 py-0.5">
                <Calendar className="w-3 h-3 text-[#8E6A25] shrink-0" />
                {puja.pujaDate}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[11.5px]">
              <span className="font-svn-sub text-[10px] uppercase tracking-[0.1em] bg-[#F3E5BF] border border-[#D8B66A]/70 text-[#7A1622] font-semibold px-2 py-0.5 rounded-full">
                {puja.deity}
              </span>
              <span className="flex items-center gap-1 text-[#665C50]">
                <Mountain className="w-3.5 h-3.5 text-[#8E6A25] shrink-0" />
                {mandirShort}
              </span>
            </div>
          </div>

          {/* ── Countdown to the puja date ───────────────────────────────────
              The theme's lacquered dark plate (`svn-plate`: Midnight ink on a
              Royal Gold rim with an engraved inner hairline) — the same surface
              the palette reserves for pricing. The one time-sensitive thing on
              the page therefore lifts off the parchment as the darkest object
              in the column, which no amount of gold on gold could achieve.

              On that plate the tiles are translucent gold rather than the
              page's #F3E5BF fill, which would go muddy against near-black, and
              the numerals take Bright Gold (#F2C94C) — the palette's price
              colour, and the only place it appears above the fold.

              The free-bracelet coupon that shared this strip is gone: the
              bracelet ships inside the prasad box, and the box is now an opt-in
              on the booking page, so an unconditional "FREE" here promised a
              gift a devotee could finish checkout without ever claiming. It is
              still offered where it can actually be taken — on the box itself.

              With the rail gone the timer has the full 28rem column, so the
              tiles can breathe instead of being squeezed to the ~145px the
              coupon left them. */}
          {/* Same treatment as the mantra strip further down the page: the
              trishuls are absolutely positioned and vertically centred, so they
              can be taller than the strip itself and SPILL over its top and
              bottom edges without pushing it taller.

              Two things make that work, and both are load-bearing:
                • `relative` — without it they anchor to the page root, the
                  nearest positioned ancestor, and end up pinned halfway down
                  the whole page instead of inside this card.
                • NO `overflow-hidden` — clipping is exactly what would flatten
                  the spill back into two images parked in the corners.

              `px-14` is the rail they stand in. Unlike the mantra strip's one
              line of text, the content here is four countdown tiles, so the
              tiles are sized to what is left: 4 × 40px + gaps fits inside the
              rail down to a 320px phone. Widening the rail past px-14, or the
              tiles past 40px, is what starts pushing them into each other. */}
          <div className="svn-plate relative rounded-xl px-14 py-3">
            {/* The right one is the artwork as drawn; the left is mirrored with
                -scale-x-100 so the pair faces outward. */}
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
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 object-contain -scale-x-100 drop-shadow-lg"
              />
            )}

            {/* z-10 keeps the countdown above the motif. Absolutely positioned
                siblings paint over static ones, so without it the trishuls
                would sit on top of the digits wherever the two meet on a
                narrow screen. */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <span className="font-svn-sub text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#E2BF62] leading-tight text-center">
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
                      className="min-w-[40px] bg-[#C79A2B]/12 border border-[#C79A2B]/45 rounded-lg px-1 py-1 text-center"
                    >
                      <div className="text-[16px] leading-none font-bold text-[#F2C94C] tabular-nums">
                        {pad2(u.v)}
                      </div>
                      <div className="font-svn-sub text-[7px] uppercase tracking-[0.12em] text-[#D8B66A] mt-0.5">
                        {u.l}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-[#F3E5BF]">Booking open</span>
              )}
            </div>

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
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-20 h-20 object-contain drop-shadow-lg"
              />
            )}
          </div>

          {/* ── Choose your package (comparison) ──
              The one decision that changes the price, so it sits directly under
              the countdown that gives it urgency and above everything the page
              says about the seva itself. */}
          <div id="packages">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C79A2B]" />}>
              Choose your seva
            </SectionTitle>

{/* Currency switcher — HIDDEN. The country is resolved automatically from
    the visitor's IP on the server, so there is no manual override on
    screen. Left here, commented, so bringing it back is one uncomment
    (plus its import above).
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#66736E]">
                    Prices in
                  </span>
                  <CountryPicker
                    className="bg-white border border-[#DDEBE6] text-[#17211D] hover:border-[#008C68]"
                    accentClass="text-[#086B50]"
                  />
                </div>
*/}
            <SavanPackages
              selectedId={packageId}
              onSelect={(id) => {
                // The card calls back on every tap, re-selecting included, so
                // the guard is here as well as inside reportAddToCart: nothing
                // downstream should treat "tapped the seva already showing" as
                // a fresh choice.
                if (id === packageId) return;
                setPackageId(id);
                reportAddToCart(id);
              }}
            />

            {/* What still gets decided AFTER this page. Both lines are here so
                the cards can stay about the sevas themselves: neither the box
                nor the extra Sankalps change the price shown in the bar below,
                and a devotee should know that before they tap it. */}
            <div className="mt-2.5 rounded-2xl border border-[#D8B66A]/70 bg-[#FCF8F0] px-3 py-2.5 space-y-1.5">
              <p className="flex items-start gap-1.5 text-[10.5px] text-[#665C50] leading-snug">
                <Gift className="w-3.5 h-3.5 text-[#C79A2B] shrink-0 mt-px" />
                <span>
                  {!prasadShippable
                    ? `Prasad box ships within India only, so it is not part of this price.`
                    : selectedPkg.prasadBoxFree
                      ? `Prasad box is FREE with this seva — add it on the next step to have it couriered home.`
                      : `Prasad box can be added on the next step for ${money(PRASAD_BOX_PRICE)}.`}
                </span>
              </p>
              <p className="flex items-start gap-1.5 text-[10.5px] text-[#665C50] leading-snug">
                <Users className="w-3.5 h-3.5 text-[#8E6A25] shrink-0 mt-px" />
                <span>
                  {selectedPkg.freeFamilyMembers > 0
                    ? `${selectedPkg.freeFamilyMembers} family Sankalp${selectedPkg.freeFamilyMembers > 1 ? "s" : ""} free in this seva · extra names ${money(FAMILY_MEMBER_PRICE)} each on the next step.`
                    : `Family members can be added at ${money(FAMILY_MEMBER_PRICE)} each on the next step.`}
                </span>
              </p>
            </div>
          </div>

          {/* The standalone "What is offered in your name" row stood here. It
              is off, and its marquee component went with it — see the note
              where that component used to live, near the top of this file. */}

          {/* ── Hero value props ── */}
          {/* <div className="rounded-2xl border border-[#D8B66A]/70 bg-gradient-to-br from-[#FCF8F0] via-[#FCF8F0] to-[#EFE3CC] p-3.5 shadow-[0_3px_14px_-8px_rgba(40,25,10,0.35)]">
            <div className="space-y-1.5">
              {[
                "Rudrabhishek on the last Savan Somwar",
                "Personalized Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                selectedPkg.prasadBoxFree
                  ? "Free prasad box, if you add it while booking"
                  : "Optional prasad box delivered at home",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#23201B]">
                  <Check className="w-3.5 h-3.5 text-[#3E6B4A] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div> */}

          {/* ── Mantra strip ── */}
          {/*
            The flanking images are absolutely positioned and vertically
            centred, so they can be scaled past the strip's own height and
            spill over its top/bottom edges without pushing it taller.
          */}
          <div className="svn-crimson relative rounded-2xl border border-[#C79A2B]/75 px-16 py-3 text-center shadow-[0_10px_24px_-16px_rgba(40,25,10,0.9)]">
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
            {/* Gold leaf on the mantra — the page's one use of `svn-foil`.
                Reserved for this line precisely because a sweep everywhere is
                a sweep nowhere; here it is the sacred line the whole seva is
                built on. */}
            <p className="svn-foil font-svn-head text-[19px] font-semibold tracking-wide">
              ॐ नमः शिवाय
            </p>
            <p className="font-svn-sub text-[9px] uppercase tracking-[0.14em] text-[#E2BF62]/85 mt-1">
              Chanted through your Rudrabhishek in {pujaPlace}
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
          <div className="flex items-center justify-center gap-1.5 bg-[#F3E5BF] border border-[#D8B66A] text-[#7A1622] rounded-lg px-3 py-2 text-[11.5px] font-medium text-center">
            <MessageCircle className="w-3.5 h-3.5 text-[#8E6A25] shrink-0" />
            Rudrabhishek performed in {pujaPlace} · receive the video with your
            name &amp; gotra on WhatsApp
          </div>

          {/* The offer ends here and the proof begins. A manuscript break marks
              the turn — the page's sections are otherwise only separated by
              whitespace, which on a long scroll reads as one continuous column. */}
          <Ornament />

          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle icon={<Star className="w-3.5 h-3.5 text-[#C79A2B]" />}>
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── How it works ── */}
          <div className="rounded-2xl border border-[#D8B66A]/70 bg-gradient-to-br from-[#FCF8F0] via-[#FCF8F0] to-[#EFE3CC] p-3.5 shadow-[0_3px_14px_-8px_rgba(40,25,10,0.35)]">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C79A2B]" />}>
              How your puja will happen
            </SectionTitle>
            <div className="space-y-2.5">
              {[
                "Enter your name, gotra and phone number",
                `Pandit ji performs the Rudrabhishek in ${pujaPlace}`,
                "Sankalp is taken in your name & gotra",
                "Puja video is shared with you on WhatsApp",
                "Add the prasad box while booking to have blessed prasad couriered home",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="svn-seal shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-svn-sub text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] text-[#23201B] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why perform this puja ── */}
          <div className="rounded-2xl border border-[#D8B66A]/70 bg-gradient-to-br from-[#FCF8F0] via-[#FCF8F0] to-[#EFE3CC] p-3 shadow-[0_3px_14px_-8px_rgba(40,25,10,0.35)]">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#C79A2B]" />}>
              Why perform this puja
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[#23201B]">
                  <Check className="w-3.5 h-3.5 text-[#3E6B4A] shrink-0 mt-0.5" strokeWidth={3} />
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
            className="w-full font-svn-ui flex items-center justify-center gap-1.5 rounded-xl border border-[#C79A2B] bg-transparent hover:bg-[#F3E5BF] text-[#7A1622] font-semibold text-[12.5px] py-2 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Need help? Chat on WhatsApp
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle icon={<Flame className="w-3.5 h-3.5 text-[#C79A2B]" />}>
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
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#C79A2B]" />}>
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-[#FCF8F0] border border-[#D8B66A]/70 rounded-xl p-2.5 text-center shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)]"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#F3E5BF] to-[#D8B66A]/55 border border-[#D8B66A]/60 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-[#8E6A25]" />
                  </div>
                  <p className="font-svn-sub text-[10.5px] font-semibold text-[#23201B] leading-tight">{title}</p>
                  <p className="text-[9.5px] text-[#665C50] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          {puja.faqs.length > 0 && (
            <div>
              <SectionTitle icon={<HelpCircle className="w-3.5 h-3.5 text-[#C79A2B]" />}>
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
                className="bg-[#FCF8F0] border border-[#D8B66A]/70 rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-[0_2px_10px_-6px_rgba(40,25,10,0.4)]"
              >
                <Icon className="w-4 h-4 text-[#8E6A25]" />
                <span className="font-svn-sub text-[9px] font-semibold uppercase tracking-wide text-[#665C50] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <Ornament />

          {/* ── Footer / ecosystem ──
              Dark wood, bookending the wood frame the hero sits in at the top
              of the page. Full-bleed via the negative margins, because a wood
              panel inset inside parchment reads as a plank lying on the sheet
              rather than the board the sheet is pinned to. The `pb` clears the
              sticky pay bar so the last link is never trapped under it. */}
          <footer className="svn-wood -mx-4 -mb-4 mt-1 px-4 pt-4 pb-28 border-t border-[#C79A2B]/70 text-[11px] text-[#C6B49A] space-y-2">
            <p className="font-svn-sub text-[13px] font-semibold tracking-[0.08em] text-[#E2BF62]">
              PanditJiAtRequest
            </p>
            <p>1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#D8B66A]">
              <button onClick={() => navigate("/privacypolicy")} className="underline underline-offset-2">
                Privacy Policy
              </button>
              <button onClick={() => navigate("/termsandconditions")} className="underline underline-offset-2">
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

        {/* ── Sticky bottom CTA ──
            Ivory rather than white, gold-ruled along its top edge, and the
            button is the palette's flat Primary (#A41F2E, hover #87121E) —
            NOT a gradient. The one thing a devotee must be able to find
            without looking should be the single most solid block of colour on
            the page; the two crimson gradients above it (ribbon, mantra) are
            decoration, and a third would make this read as more of the same. */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FCF8F0]/96 backdrop-blur-md border-t border-[#C79A2B] max-w-md mx-auto shadow-[0_-6px_20px_-10px_rgba(40,25,10,0.5)]">
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              {/* Names the chosen package rather than a bare "Total", so the
                  bar always says WHICH seva the price belongs to. */}
              <div className="shrink-0 max-w-[38%]">
                <span className="font-svn-sub text-[8.5px] text-[#8E6A25] font-semibold uppercase tracking-[0.1em] block leading-none truncate">
                  {selectedPkg.name}
                </span>
                {/* `lining-nums` because Cormorant Garamond defaults to
                    oldstyle figures, which drop the 1, 4, 7 and 9 below the
                    baseline. Charming in a heading, wrong in a price — a
                    devotee should not have to re-read what they are paying.
                    The package cards' prices carry the same override. */}
                <span className="font-svn-head lining-nums text-[22px] font-bold text-[#7A1622] leading-tight">
                  {money(price)}
                </span>
              </div>
              <button
                onClick={openBooking}
                className="flex-1 font-svn-ui bg-[#A41F2E] hover:bg-[#87121E] text-[#FFF8F0] font-bold text-[15px] py-3 rounded-xl border border-[#C79A2B]/60 shadow-[0_6px_16px_-8px_rgba(122,22,34,0.9)] active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#C79A2B] outline-none"
              >
                Book for {money(price)}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-[#665C50]">
              <Lock className="w-3 h-3 text-[#8E6A25]" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
