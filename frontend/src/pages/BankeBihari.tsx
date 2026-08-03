import { useState, useEffect, useId } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Check, ShieldCheck, Gift, Calendar, Sparkles,
    Star, Lock, ChevronDown, MessageCircle, Phone, BadgeCheck,
    Video, MapPin, Share2, HelpCircle, Heart, Milk, Droplets,
    Flower2, Feather, Music, Leaf, Cookie, Flame, UtensilsCrossed,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import PujaEnquiryModal from "../components/booking/PujaEnquiryModal";
import API_URL from "../utils/apiConfig";
import { decryptData } from "../utils/encryption";
import { optimizedImg } from "../utils/img";
import {
    bankeBihariPuja, BANKE_BIHARI_PUJA_SLUG, DEFAULT_PACKAGE_ID, getPackage,
    PEACOCK_FEATHER_IMAGE, CTA_BANNER_IMAGE, FLUTE_FEATHER_IMAGE,
    PRASAD_BOX_PRICE, EXTRA_FAMILY_MEMBER_PRICE, PRASAD_BOXES, BANKE_BIHARI_PACKAGES,
    canAddPrasadBox, prasadBoxCost, packageOfferings, packageTotal, shippedPrasadBox,
    type PujaPackageId,
} from "../data/bankeBihariPuja";
import PujaPackages from "../components/bankeBihari/PujaPackages";
import { ItemTileRow } from "../components/bankeBihari/ItemTiles";

// ── analytics (Meta Pixel — the project's existing convention) ──
function track(event: string, params?: Record<string, unknown>, custom = false) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(custom ? "trackCustom" : "track", event, params);
    }
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Decorative image beside the hero value-props card. Paste the image URL here.
 * It is allowed to spill outside the card edges for a premium, layered look.
 * Leave as "" to hide it entirely (the card falls back to full-width text).
 */
const HERO_VALUE_IMAGE = "";

// Banke Bihari Janmashtami online-puja devotee reviews (auto-scrolling marquee).
type Review = { name: string; rating: number; date: string; text: string; verified: boolean };
const PLACEHOLDER_REVIEWS: Review[] = [
    { name: "Ashok Mishra", rating: 5, date: "1 week ago", text: "Pichli seva ka experience achha tha, is baar Janmashtami bhi yahin se book ki. 🙏", verified: true },
    { name: "Meher Prakash", rating: 5, date: "3 weeks ago", text: "Booking process simple tha aur support bhi achha mila.", verified: true },
    { name: "Ashu Dogra", rating: 4, date: "2 weeks ago", text: "Kashi Rudrabhishek ke baad trust bana, ab Vrindavan ki seva bhi book kar di.", verified: true },
    { name: "Sourav Sahoo", rating: 5, date: "1 month ago", text: "Sab details clearly mil gayi thi, isliye bina soche booking kar di.", verified: true },
    { name: "Amit Beriha", rating: 4, date: "5 days ago", text: "Pehle bhi seva karwayi thi, experience sahi raha tha.", verified: true },
    { name: "Dr. Rahul Singh", rating: 5, date: "2 months ago", text: "Kashi wali puja ka video time par mila tha, isliye Janmashtami seva bhi book ki.", verified: true },
    { name: "Anshul Sharma", rating: 5, date: "3 weeks ago", text: "Team ka response quick tha. Booking karna kaafi easy laga.", verified: true },
    { name: "Shripad Hebbar", rating: 4, date: "1 month ago", text: "Sab kuch transparent laga. Achha experience raha.", verified: true },
    { name: "Deepti Gupta", rating: 5, date: "2 weeks ago", text: "Kashi mein seva achhi lagi thi, ab Banke Bihari ji ke liye bhi booking kar di. 🙏", verified: true },
    { name: "Sapna Saxena", rating: 4, date: "6 days ago", text: "Website use karna easy tha aur booking jaldi ho gayi.", verified: true },
    { name: "Sunita Sharma", rating: 5, date: "1 month ago", text: "Pehle Rudrabhishek karwaya tha, sab sahi raha. Is baar Janmashtami seva bhi book ki.", verified: true },
    { name: "Rekha Sharma", rating: 4, date: "3 weeks ago", text: "Kashi ki puja aur video se bharosa bana, ab Vrindavan ki seva bhi yahin se li.", verified: true },
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

// ── Decorative motifs ──────────────────────────────────────────

/**
 * Peacock feather — Krishna's mukut motif, used throughout the page.
 *
 * The origin file is 1536×1024 / 283 KB, but every placement here renders it
 * between ~90 px and ~130 px wide, so it is served through the project's weserv
 * resizer at a width that covers 3× density and nothing more. Without that a
 * purely decorative motif would cost more bytes than the rest of the page.
 * `onError` falls back to the origin URL so a proxy hiccup can never leave a
 * broken image behind (the convention `optimizedImg` documents).
 *
 * Callers pass a WIDTH-only class (e.g. `w-24`) — the height follows the 3:2
 * aspect automatically, so the artwork can never be squashed.
 */
function PeacockFeather({ className = "", flip = false }: { className?: string; flip?: boolean }) {
    return (
        <img
            src={optimizedImg(PEACOCK_FEATHER_IMAGE, 400)}
            onError={(e) => { e.currentTarget.src = PEACOCK_FEATHER_IMAGE; }}
            alt=""
            aria-hidden="true"
            draggable={false}
            loading="lazy"
            decoding="async"
            className={`h-auto select-none object-contain ${className} ${flip ? "-scale-x-100" : ""}`}
        />
    );
}

/**
 * Bansuri-and-mor-pankh section divider — the page's signature Janmashtami
 * ornament. Purely decorative, so it is `aria-hidden` and contributes no
 * accessible name.
 *
 * The artwork already carries its own flowers and tassels, so it is centred on
 * bare page background with no flanking rules — adding them made the band read
 * as busy. Trimmed through the resizer because the source canvas has a wide
 * transparent margin that would otherwise lay out as dead space.
 */
function FluteDivider({ className = "w-44", opacity = "" }: { className?: string; opacity?: string }) {
    return (
        <div className={`flex justify-center ${opacity}`} aria-hidden="true">
            <img
                src={optimizedImg(FLUTE_FEATHER_IMAGE, 600, 80, { trim: true })}
                onError={(e) => { e.currentTarget.src = FLUTE_FEATHER_IMAGE; }}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                className={`${className} h-auto select-none`}
            />
        </div>
    );
}

// ── Small UI pieces (Janmashtami palette: ivory, Krishna pink, temple gold) ──
function Stars({ value, className = "w-3.5 h-3.5" }: { value: number; className?: string }) {
    const full = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`${className} ${i <= full ? "text-[#E7B63A] fill-[#E7B63A]" : "text-[#F4DFC2]"}`} />
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
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? "border-[#D63D72]/45" : "border-[#F4DFC2]"}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) track("puja_accordion_open", { section: title }, true);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-[#D63D72] outline-none"
            >
                <span className="flex items-center gap-2 text-[14px] font-bold text-[#5C1A34]">
                    {icon}{title}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#D63D72] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={panelId} hidden={!open} className="px-3.5 pb-3.5 pt-1 text-[12.5px] text-[#555555] leading-relaxed border-t border-[#F4DFC2]">
                {children}
            </div>
        </div>
    );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <h3 className="flex items-center gap-1.5 text-[12.5px] font-extrabold uppercase tracking-wider text-[#D63D72] mb-2.5">
            {icon}{children}
        </h3>
    );
}

function ReviewMarquee({ reviews }: { reviews: Review[] }) {
    const items = [...reviews, ...reviews]; // duplicated for a seamless loop
    return (
        <div className="overflow-hidden -mx-4 px-4">
            <style>{`@keyframes reviewMarquee{from{transform:translateX(-50%)}to{transform:translateX(0)}}.review-track{animation:reviewMarquee 32s linear infinite;width:max-content}.review-track:hover{animation-play-state:paused}`}</style>
            <div className="review-track flex gap-2.5">
                {items.map((r, i) => (
                    <div key={i} className="shrink-0 w-56 bg-white border border-[#F4DFC2] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#5C1A34] text-[12px]">{r.name}</span>
                            {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />}
                            <span className="ml-auto text-[9px] text-[#8A8A8A]">{r.date}</span>
                        </div>
                        <Stars value={r.rating} className="w-3 h-3" />
                        <p className="text-[11.5px] text-[#555555] mt-1 leading-snug line-clamp-3">{r.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Live countdown pill for the hero's bottom-right corner.
 *
 * Deliberately its OWN component with its OWN interval + state, so the 1-second
 * tick re-renders only this tiny pill — not the whole (large) page. Ticking the
 * parent every second was re-reconciling the entire tree (packages, reviews,
 * accordions, FAQ…) and stalling the auto-scroll animation each second.
 */
function HeroCountdown({ target }: { target: number }) {
    const [remaining, setRemaining] = useState(() =>
        Number.isNaN(target) ? 0 : Math.max(0, target - Date.now())
    );
    useEffect(() => {
        if (Number.isNaN(target)) return;
        const tick = () => setRemaining(Math.max(0, target - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);

    if (remaining <= 0) return null;
    const days = Math.floor(remaining / 86400000);
    const hrs = Math.floor((remaining % 86400000) / 3600000);
    const min = Math.floor((remaining % 3600000) / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    return (
        <div className="absolute bottom-2 right-2 z-10 rounded-lg bg-[#FFF1F5]/95 backdrop-blur-sm border border-[#F8B5CB] px-2.5 py-1.5 shadow-lg text-right">
            <p className="text-[7.5px] font-bold uppercase tracking-wider text-[#7A3E55] leading-none mb-0.5">
                Janmashtami seva closes in
            </p>
            <p className="text-[12px] font-bold text-[#D63D72] tabular-nums leading-none">
                {days}d {pad2(hrs)}h {pad2(min)}m {pad2(sec)}s
            </p>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────
// FRONTEND-ONLY Shree Banke Bihari Ji Janmashtami Mahapuja — an online puja
// performed on the devotee's behalf at Shri Banke Bihari Ji Mandir, Vrindavan
// on Krishna Janmashtami. Renders entirely from frontend data but carries a
// distinct festive-temple theme (ivory / Krishna-pink / temple-gold palette,
// peacock-feather and lotus motifs, Janmashtami offerings).
// All data comes from src/data/bankeBihariPuja.ts.
export default function BankeBihariPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const puja = bankeBihariPuja;
    const pujaId = bankeBihariPuja._id;

    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    // Chosen booking package — drives the sticky-CTA price and is handed to the
    // booking page as navigation state so it opens pre-selected.
    const [packageId, setPackageId] = useState<PujaPackageId>(DEFAULT_PACKAGE_ID);
    const selectedPkg = getPackage(packageId);

    // The optional ₹501 prasad box. OFF by default — it may only ever be added
    // by a deliberate tap, never pre-ticked into someone's bill. Carried to the
    // booking page alongside the package so the choice survives the hop.
    const [addPrasadBox, setAddPrasadBox] = useState(false);

    // Higher packages already ship a richer box free, so the paid add-on is not
    // offered there. Switching up to one must therefore also clear the flag —
    // otherwise a devotee who ticked it on ₹2100 would keep paying ₹501 for a
    // box that is now free, with no visible control left to untick.
    const prasadBoxAdded = canAddPrasadBox(selectedPkg) && addPrasadBox;

    // Nothing above this tier to upsell to (drives the "higher packages offer
    // more" hint), read off the list so adding a fifth package needs no edit.
    const isTopPackage = selectedPkg.id === BANKE_BIHARI_PACKAGES[BANKE_BIHARI_PACKAGES.length - 1].id;

    // The box this booking would actually ship (free tier, opted-in ₹501 box,
    // or none) — null when nothing is couriered at all.
    const shippedBox = shippedPrasadBox(selectedPkg, prasadBoxAdded);

    // The sticky CTA quotes the package + prasad box. Extra family Sankalps are
    // chosen on the booking page, so they can't be priced in yet.
    const price = packageTotal(selectedPkg, 0, prasadBoxAdded);

    // ViewContent on load
    useEffect(() => {
        track("ViewContent", {
            content_name: puja.poojaNameEng,
            content_ids: [pujaId],
            content_type: "product",
            value: getPackage(DEFAULT_PACKAGE_ID).price,
            currency: "INR",
        });
    }, []);

    // Banner / card artwork. The `&&` guards on the OG + preload tags below stay
    // in place so that blanking this in the data file degrades gracefully rather
    // than emitting an empty og:image.
    const image = puja.poojaImages?.[0] || puja.poojaMainImage || puja.poojaCardImage;
    const reviews = seededReviews(pujaId, 9);
    const mandirName = `${puja.templeName}, ${puja.templeLocation}`;

    // ── Countdown to the puja date ── (rendered by the isolated HeroCountdown
    // component so its 1s tick never re-renders this whole page).
    const targetTs = new Date(puja.pujaDate).getTime();

    // Gentle one-time nudge: ~2s after landing, if the devotee hasn't scrolled
    // yet, glide the page down so the package comparison is on screen. We run our
    // own eased rAF tween (easeInOutCubic over ~1.4s) rather than native smooth
    // scroll for a buttery, consistent glide — and bail the instant they
    // interact, so it never fights a user who's already reading.
    useEffect(() => {
        let interacted = false;
        let rafId = 0;
        const mark = () => { interacted = true; cancelAnimationFrame(rafId); };
        window.addEventListener("wheel", mark, { passive: true });
        window.addEventListener("touchmove", mark, { passive: true });
        window.addEventListener("keydown", mark);

        const timeoutId = setTimeout(() => {
            if (interacted || window.scrollY > 40) return;
            const el = document.getElementById("packages");
            if (!el) return;

            const startY = window.scrollY;
            // Offset for the sticky header so the "Choose your seva" title
            // isn't tucked underneath it.
            const targetY = Math.max(0, el.getBoundingClientRect().top + startY - 68);
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
        }, 2000);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
            window.removeEventListener("wheel", mark);
            window.removeEventListener("touchmove", mark);
            window.removeEventListener("keydown", mark);
        };
    }, []);

    const whatYouGet = [
        { icon: BadgeCheck, title: "Personalized seva", sub: "Performed in your name & gotra" },
        { icon: Video, title: "Puja video on WhatsApp", sub: "Full recording delivered to you" },
        { icon: Gift, title: "Prasad at your home", sub: "Free in ₹5100 & ₹11000, else ₹501" },
    ];

    // The sacred offerings made during the Janmashtami seva.
    //
    // Panchamrit and tulsi archana are part of the Vedic vidhi itself, so they
    // are offered in EVERY package; everything after them is unlocked by the
    // chosen package and comes straight from the package data, so this grid can
    // never quietly promise an offering the selected tier doesn't include.
    const OFFERING_META: Record<string, { icon: typeof Milk; sub: string }> = {
        "Makhan Mishri": { icon: Milk, sub: "His dearest bhog" },
        "Mor Pankh": { icon: Feather, sub: "At his charan" },
        Paan: { icon: Leaf, sub: "Offered after bhog" },
        Bansuri: { icon: Music, sub: "Krishna's flute" },
        Laddu: { icon: Cookie, sub: "Bhog of laddu" },
        "Deepak Seva": { icon: Flame, sub: "Ghee deepak lit" },
        "Bade Bhog Thali": { icon: UtensilsCrossed, sub: "Grand bhog thali" },
    };
    const offerings = [
        { icon: Droplets, label: "Panchamrit", sub: "Abhishek of Kanha" },
        { icon: Flower2, label: "Tulsi Archana", sub: "Tulsi dal offering" },
        ...packageOfferings(selectedPkg).map((label) => ({
            label,
            icon: OFFERING_META[label]?.icon ?? Flower2,
            sub: OFFERING_META[label]?.sub ?? "Offered in your name",
        })),
    ];

    // Main CTA goes straight to the booking page.
    // AddToCart marks intent at the CTA tap (same convention as PujaPage.tsx);
    // InitiateCheckout / Purchase then fire on the booking page itself, so the
    // three funnel steps stay distinct instead of collapsing onto one trigger.
    //
    // AddToCart here reports package + prasad box, the only two choices this
    // page can make; extra Sankalp names are chosen on the booking page, so
    // they cannot be priced in yet. The booking's real value (base + extras)
    // is reported by InitiateCheckout / Purchase from BankeBihariBookingPage and
    // by the server CAPI Purchase — read those, not these, when reconciling
    // revenue in Events Manager.
    // `source` names which CTA was tapped. It rides on a separate custom event
    // rather than on AddToCart, so the standard event's shape stays identical
    // across both entry points and only the placement breakdown is extra.
    // NOTE: takes an argument, so every call site must wrap it in an arrow —
    // passing it bare as onClick would hand it the click event as `source`.
    const openBooking = (source: "sticky_cta" | "mid_page_cta_banner") => {
        track("AddToCart", {
            content_name: `${puja.poojaNameEng} — ${selectedPkg.name}`,
            content_ids: [pujaId],
            content_type: "product",
            value: price,
            currency: "INR",
        });
        track("puja_cta_click", { source, package: selectedPkg.id, prasadBox: prasadBoxAdded, value: price }, true);
        // Hand the chosen package AND the prasad-box choice to the booking page
        // so it opens exactly as the devotee left this one.
        navigate(`/${BANKE_BIHARI_PUJA_SLUG}/booking`, { state: { packageId, addPrasadBox: prasadBoxAdded } });
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
      <div className="min-h-screen bg-[#FFF9F2] pb-24 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-[#F4DFC2]">
        <style>{`@media (prefers-reduced-motion: reduce){.review-track{animation:none}}`}</style>

        <Helmet>
          <title>{`${puja.poojaNameEng} at ${puja.templeName}, Vrindavan | Pandit Ji At Request`}</title>
          <meta
            name="description"
            content={`Book online ${puja.poojaNameEng} (${puja.poojaNameHindi}) — Janmashtami seva performed on your behalf at ${mandirName} on ${puja.pujaDate}. ${puja.benefits.slice(0, 2).join(", ")}. Verified pandits, puja video on WhatsApp.`}
          />
          <link rel="canonical" href={`https://panditjiatrequest.com/${BANKE_BIHARI_PUJA_SLUG}`} />
          {/* Social share preview (WhatsApp / Facebook / X) for ad & organic shares. */}
          <meta property="og:type" content="product" />
          <meta property="og:site_name" content="Pandit Ji At Request" />
          <meta property="og:title" content={`${puja.poojaNameEng} — Janmashtami Puja at ${puja.templeName}, Vrindavan`} />
          <meta property="og:description" content={`Krishna Janmashtami seva performed on your behalf at ${mandirName}. Sankalp in your name & gotra, puja video on WhatsApp. Packages from ₹1100.`} />
          <meta property="og:url" content={`https://panditjiatrequest.com/${BANKE_BIHARI_PUJA_SLUG}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${puja.poojaNameEng} — Janmashtami Puja at Vrindavan`} />
          <meta name="twitter:description" content={`Janmashtami seva at ${mandirName}. Packages from ₹1100, puja video on WhatsApp.`} />
          {/* Image tags & the LCP preload are only emitted once the banner
              artwork exists — an empty og:image is worse than none. */}
          {image && <meta property="og:image" content={image} />}
          {image && <meta name="twitter:image" content={image} />}
          {image && <link rel="preload" as="image" href={image} fetchPriority="high" />}
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
        <div className="sticky top-0 z-50 bg-[#FFF9F2]/90 backdrop-blur-md border-b border-[#F4DFC2] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate("/")
            }
            aria-label="Go back"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#F4DFC2] shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#5C1A34]" />
          </button>
          <h1 className="text-sm font-bold text-[#5C1A34] truncate flex-1">
            {puja.poojaNameEng}
          </h1>
          <button
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#F4DFC2] shadow-sm active:scale-90 transition-transform disabled:opacity-60"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-[#2E8B57]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#5C1A34]" />
            )}
          </button>
        </div>

        {/* ── Hero banner ── artwork only, no overlaid copy. */}
        <div
          className="relative h-56 overflow-hidden border-b border-[#E7B63A]/40"
          style={{ background: "linear-gradient(135deg,#FFF8F0 0%,#FFECCF 35%,#FFF3E4 100%)" }}
        >
          {/* The banner is the artwork alone — no overlaid title, occasion or
              temple line. `object-contain` (not cover) because the asset is a
              3:2 cut-out on transparency: cover would fill the 16:9-ish band by
              cropping the eye and the tail off. Contain shows the whole feather
              and lets the theme gradient behind it read as the backdrop.
              Trimmed via the resizer because the source canvas carries a wide
              transparent margin — without it that margin shows as empty space
              on both sides. */}
          <img
            src={optimizedImg(image, 900, 85, { trim: true })}
            onError={(e) => { e.currentTarget.src = image; }}
            width={432}
            height={224}
            alt={puja.poojaNameEng}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-fit"
          />
          {/* Compact live countdown, tucked into the hero's bottom-right. */}
          <HeroCountdown target={targetTs} />
        </div>

        <div className="px-4 pt-3 pb-4 space-y-4">
          {/* ── Puja name + meta ── */}
          <div>
            <h2 className="text-xl font-bold font-serif text-[#5C1A34] leading-tight">
              {puja.poojaNameEng}
            </h2>
            <p className="text-[13px] text-[#D63D72] font-medium mt-0.5">
              {puja.poojaNameHindi}
            </p>
            {/* Meta on two tight rows. The deity chip is gone — the title
                already opens with "Shree Banke Bihari Ji", so it only repeated
                itself — and the date no longer re-states the occasion that the
                green chip beside it carries. */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="bg-[#EDF9F0] border border-[#A7D8B6] text-[#1F7A50] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {puja.occasion}
              </span>
              <span className="flex items-center gap-1 text-[12px]">
                <Stars value={puja.rating} />
                <span className="font-bold text-[#5C1A34]">{puja.rating}</span>
                <span className="text-[#8A8A8A]">
                  · {puja.devoteesLabel} devotees
                </span>
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[12px] text-[#555555]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D63D72] shrink-0" />
                {puja.templeName}, Vrindavan
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D63D72] shrink-0" />
                {puja.pujaDate}
              </span>
            </div>
          </div>

          {/* ── Choose your seva (comparison) ── */}
          <div id="packages">
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              Choose your seva
            </SectionTitle>
            {/* One line only — every card already carries its own "Tap to see
                everything included" prompt, so spelling that out here twice was
                the bulk of the copy in this block. */}
            {/* No "each package includes the one before it" line any more: the
                cards no longer lean on that shorthand, they each list their own
                contents in full. */}
            {/* The prasad box is chosen inside the cards themselves — the package
                and its box are one decision, so splitting them across two
                sections made devotees scroll back up to check what they'd
                picked. */}
            <PujaPackages
              selectedId={packageId}
              onSelect={setPackageId}
              prasadBoxAdded={prasadBoxAdded}
              onTogglePrasadBox={(next) => {
                setAddPrasadBox(next);
                track(
                  "puja_prasad_box_toggle",
                  { added: next, package: selectedPkg.id, value: PRASAD_BOX_PRICE },
                  true,
                );
              }}
            />

            {/* Running total, so the two price-changing choices on this page
                (package + prasad box) always add up in front of the devotee
                rather than only in the sticky bar. */}
            <div className="mt-3 rounded-2xl border border-[#F4DFC2] bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-[12.5px] text-[#555555]">
                <span>{selectedPkg.name}</span>
                <span className="font-bold text-[#5C1A34]">
                  ₹{selectedPkg.price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[12.5px] text-[#555555]">
                <span className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#E7B63A]" />
                  {selectedPkg.freePrasadBox
                    ? PRASAD_BOXES[selectedPkg.freePrasadBox].name
                    : "Prasad Box (optional)"}
                </span>
                {selectedPkg.freePrasadBox ? (
                  <span className="text-[11px] font-bold text-[#2E8B57]">FREE</span>
                ) : prasadBoxAdded ? (
                  <span className="font-bold text-[#5C1A34]">
                    +₹{prasadBoxCost(selectedPkg, true).toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#8A8A8A]">Not added</span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-[#F4DFC2] flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8A8A]">
                  Total today
                </span>
                <span className="text-[19px] font-extrabold text-[#D63D72]">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <p className="mt-2 text-[10.5px] text-[#8A8A8A] leading-snug text-center">
              {selectedPkg.freeFamilyMembers > 0
                ? `${selectedPkg.freeFamilyMembers} family Sankalp${selectedPkg.freeFamilyMembers > 1 ? "s" : ""} free in this package · extra names ₹${EXTRA_FAMILY_MEMBER_PRICE} each on the next step.`
                : `Family members can be added at ₹${EXTRA_FAMILY_MEMBER_PRICE} each on the next step.`}
            </p>
          </div>

          {/* ── Hero value props ──
              `relative` + `overflow-visible` so the decorative image is free to
              spill past the card's top/right edges for a layered, premium look.
              When HERO_VALUE_IMAGE is empty a peacock feather takes its place. */}
          <div
            className="relative overflow-visible rounded-2xl border border-[#F4DFC2] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,.07)]"
            style={{ background: "linear-gradient(135deg,#FFF8F0 0%,#FFECCF 55%,#FFF3E4 100%)" }}
          >
            {HERO_VALUE_IMAGE ? (
              <img
                src={HERO_VALUE_IMAGE}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute -top-5 -right-6 w-40 h-40 object-contain drop-shadow-xl z-10"
              />
            ) : (
              // Sits mostly ABOVE the card's top-right corner: the dense eye
              // clears the card entirely and only the thin gold filigree grazes
              // the corner, so no text ever reads through the artwork.
              <PeacockFeather className="pointer-events-none absolute -top-9 -right-3 w-28 drop-shadow-md" flip />
            )}

            
            <div className={`space-y-1.5 ${HERO_VALUE_IMAGE ? "pr-24" : "pr-14"}`}>
              {[
                "Janmashtami seva at Banke Bihari Ji Mandir, Vrindavan",
                "Personalised Sankalp in your name & gotra",
                "Puja video shared on WhatsApp",
                "Prasad box free in ₹5100 & ₹11000 — optional ₹501 otherwise",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12.5px] text-[#555555]">
                  <Check className="w-3.5 h-3.5 text-[#2E8B57] shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mid-page CTA banner ──
              The artwork carries its own bar, copy, button and trust line, so it
              gets no container chrome of its own — no card, border or padding.
              It reads "Proceed to Payment", so it MUST act like the CTA it
              depicts: the whole strip is one button into the booking flow.
              `alt` repeats the baked-in copy, which is the only way a screen
              reader can reach it. Trimmed via the resizer because the source
              canvas carries a wide transparent margin. */}
          <button
            type="button"
            onClick={() => openBooking("mid_page_cta_banner")}
            className="block w-full active:scale-[0.99] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#D63D72] rounded-2xl"
          >
            <img
              src={optimizedImg(CTA_BANNER_IMAGE, 900, 80, { trim: true })}
              onError={(e) => { e.currentTarget.src = CTA_BANNER_IMAGE; }}
              alt="Seek the blessings of Banke Bihari Ji on this Janmashtami — proceed to payment"
              width={900}
              height={361}
              loading="lazy"
              decoding="async"
              className="w-full h-auto"
            />
          </button>


          {/* ── Auto-scrolling devotee reviews ── */}
          <div>
            <SectionTitle icon={<Star className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              Loved by devotees
            </SectionTitle>
            <ReviewMarquee reviews={reviews} />
          </div>

          {/* ── Online-puja reassurance line ── */}
          <div className="flex items-center justify-center gap-1.5 bg-[#EDF9F0] border border-[#A7D8B6] text-[#1F7A50] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-center">
            <MessageCircle className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />
            Seva performed at {puja.templeName} · receive the video with your
            name &amp; gotra on WhatsApp
          </div>

          {/* ── Janmashtami offerings ── */}
          <div>
            <SectionTitle icon={<Flower2 className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              What is offered in your name
            </SectionTitle>
            <p className="-mt-1.5 mb-2 text-[11px] text-[#7A3E55]">
              With your selected <b className="text-[#5C1A34]">{selectedPkg.name}</b>
              {isTopPackage ? " — the fullest set of offerings" : " — higher packages offer more"}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {offerings.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="bg-white border border-[#F4DFC2] rounded-xl p-2 text-center shadow-sm"
                >
                  <div className="w-7 h-7 mx-auto rounded-full bg-gradient-to-br from-[#FFE9D8] to-[#F8A9C4]/60 flex items-center justify-center mb-1">
                    <Icon className="w-3.5 h-3.5 text-[#D63D72]" />
                  </div>
                  <p className="text-[10.5px] font-bold text-[#5C1A34] leading-tight">{label}</p>
                  <p className="text-[8.5px] text-[#8A8A8A] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── The three prasad boxes, side by side ──
              The packages section shows the ONE box that applies to the current
              selection; this shows all three at once, so a devotee can see what
              upgrading actually buys before they commit. Each tier lists only
              what it adds, under an explicit "everything in the box above" line,
              which is also how the data itself is modelled. */}
          <div>
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              What's in each prasad box
            </SectionTitle>
            <div className="space-y-2">
              {([
                { tier: "standard", how: `Optional add-on · ₹${PRASAD_BOX_PRICE}`, free: false },
                { tier: "premium", how: "FREE with ₹5,100 Shringar Seva", free: true },
                { tier: "royal", how: "FREE with ₹11,000 Raj Bhog Seva", free: true },
              ] as const).map(({ tier, how, free }) => {
                const box = PRASAD_BOXES[tier];
                const parent = box.inherits ? PRASAD_BOXES[box.inherits] : null;
                return (
                  <div
                    key={tier}
                    className={`rounded-2xl border p-3 shadow-sm ${
                      free ? "border-[#A7D8B6] bg-[#EDF9F0]" : "border-[#E0CDB4] bg-white"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12.5px] font-bold text-[#5C1A34]">{box.name}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${free ? "text-[#1F7A50]" : "text-[#8A5A12]"}`}>
                        {how}
                      </p>
                    </div>
                    {parent && (
                      <p className="mt-1.5 text-[11px] font-semibold text-[#7A3E55]">
                        Everything in the {parent.name}, plus:
                      </p>
                    )}
                    <div className="mt-1.5">
                      <ItemTileRow items={box.adds} tone={free ? "green" : "sand"} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10.5px] text-[#8A8A8A] leading-snug text-center">
              The ₹{PRASAD_BOX_PRICE} box is entirely optional — the ₹1,100 and ₹2,100
              packages are complete sevas without it.
            </p>
          </div>

          <FluteDivider />

          {/* ── How it works ── */}
          <div
            className="rounded-2xl border border-[#F4DFC2] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,.07)]"
            style={{ background: "linear-gradient(135deg,#FFF8F0 0%,#FFF2E4 55%,#FFE9D8 100%)" }}
          >
            <SectionTitle icon={<Sparkles className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              How your seva will happen
            </SectionTitle>
            <div className="space-y-2.5">
              {[
                "Enter your name, gotra and phone number",
                `Pandit ji performs the Janmashtami seva at ${puja.templeName}`,
                "Sankalp is taken in your name & gotra",
                "Puja video is shared with you on WhatsApp",
                shippedBox
                  ? `Your ${shippedBox.name} is couriered to your home`
                  : "Add the prasad box if you'd like blessed prasad couriered home",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#FFF1F5] border border-[#F8B5CB] text-[#D63D72] flex items-center justify-center text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] text-[#555555] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why perform this puja ── */}
          <div
            className="rounded-2xl border border-[#F4DFC2] p-3 shadow-[0_10px_30px_rgba(0,0,0,.07)]"
            style={{ background: "linear-gradient(135deg,#FFF8F0 0%,#FFF2E4 55%,#FFE9D8 100%)" }}
          >
            <SectionTitle icon={<Heart className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              Why perform this seva
            </SectionTitle>
            <div className="grid grid-cols-1 gap-1.5">
              {puja.benefits.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-[#555555]">
                  <Check className="w-3.5 h-3.5 text-[#2E8B57] shrink-0 mt-0.5" strokeWidth={3} />
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
            className="w-full flex items-center justify-center gap-1.5 text-[#8A8A8A] hover:text-[#D63D72] font-semibold text-[12.5px] py-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Need help? Chat on WhatsApp
          </button>

          {/* ── Puja details (accordions from poojaDescription) ── */}
          <div>
            <SectionTitle icon={<Music className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              Seva details
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
            <SectionTitle icon={<Gift className="w-3.5 h-3.5 text-[#E7B63A]" />}>
              What you'll get
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {whatYouGet.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="bg-white border border-[#F4DFC2] rounded-xl p-2.5 text-center shadow-sm"
                >
                  <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#FFE9D8] to-[#F8A9C4]/60 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4 text-[#D63D72]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#5C1A34] leading-tight">{title}</p>
                  <p className="text-[9.5px] text-[#8A8A8A] leading-tight mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          {puja.faqs.length > 0 && (
            <div>
              <SectionTitle icon={<HelpCircle className="w-3.5 h-3.5 text-[#E7B63A]" />}>
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
                className="bg-[#EDF9F0] border border-[#A7D8B6] rounded-xl py-2.5 flex flex-col items-center gap-1 shadow-sm"
              >
                <Icon className="w-4 h-4 text-[#2E8B57]" />
                <span className="text-[9.5px] font-semibold text-[#1F7A50] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Closing flourish — bookends the mid-page divider so the motif reads
              as a deliberate rhythm rather than a one-off. Smaller and softened
              so it recedes behind the footer links. */}
          <FluteDivider className="w-32" opacity="opacity-70" />

          {/* ── Footer / ecosystem ── */}
          <footer className="pt-3 mt-2 border-t border-[#F4DFC2] text-[11px] text-[#8A8A8A] space-y-2">
            <p className="font-bold text-[#5C1A34]">PanditJiAtRequest</p>
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

        {/* ── Sticky bottom CTA (the theme's "payment bar") ── */}
        <div
          className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto shadow-[0_-6px_24px_rgba(0,0,0,.14)]"
          style={{ background: "linear-gradient(90deg,#D63D72,#F05C83,#F4B03E)" }}
        >
          <div className="px-4 pt-2 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <span className="text-[9.5px] text-white/85 font-semibold uppercase block leading-none">
                  {selectedPkg.name}
                </span>
                <span className="text-[19px] font-extrabold text-white drop-shadow-sm">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() => openBooking("sticky_cta")}
                className="flex-1 bg-[#F7C547] hover:bg-[#FFD86A] text-[#5A3600] font-bold text-[15px] py-3 rounded-xl shadow-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-white outline-none"
              >
                Book for ₹{price.toLocaleString("en-IN")}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] font-medium text-white/90">
              <Lock className="w-3 h-3" />
              100% secure payment
            </div>
          </div>
        </div>
      </div>
    );
}
