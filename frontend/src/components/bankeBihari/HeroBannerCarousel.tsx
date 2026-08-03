import { useEffect, useState, type ReactNode } from "react";
import { motion, type PanInfo } from "framer-motion";
import { optimizedImg } from "../../utils/img";

/**
 * Auto-advancing hero banner carousel.
 *
 * Slides right-to-left on a timer, and can be swiped by hand. Three things it
 * is careful about, because the hero is the page's LCP element:
 *
 *   • ONE image renders as a plain still — no track, no timer, no dots. The
 *     carousel is invisible until there is something to advance to, so the page
 *     is correct before the extra artwork lands.
 *   • Only slide 0 loads eagerly; the rest are lazy. A carousel that eagerly
 *     fetches four banners spends the LCP budget on images nobody has seen yet.
 *   • The timer is keyed on the current index, so a manual swipe restarts the
 *     clock instead of being yanked onward a few hundred ms later.
 *
 * The transform for the slides is exported as `bannerImg` so the page's
 * <link rel="preload"> can request the exact URL slide 0 will ask for — a
 * preload pointing at the origin while the <img> asks the resizer is a
 * double-download, which is the bug this page already had once.
 */

/** The resizer transform every hero slide is served through. */
export const bannerImg = (src: string) => optimizedImg(src, 900, 85, { trim: true });

/** Past this far, or this fast, a drag counts as "go to the next one". */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

export default function HeroBannerCarousel({
    images,
    alt,
    intervalMs = 3000,
    className = "",
    style,
    children,
}: {
    images: string[];
    alt: string;
    /** Dwell time per slide. */
    intervalMs?: number;
    className?: string;
    style?: React.CSSProperties;
    /** Overlays drawn on top of the banner, e.g. the countdown. */
    children?: ReactNode;
}) {
    const [index, setIndex] = useState(0);
    // Set while a finger is down, so the slide doesn't move under it.
    const [dragging, setDragging] = useState(false);
    const count = images.length;

    // Honoured for the slide TRANSITION only — the carousel still advances, it
    // just cuts instead of gliding. Freezing it entirely would leave a devotee
    // who prefers reduced motion looking at one banner forever.
    const [reduceMotion, setReduceMotion] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!mq) return;
        setReduceMotion(mq.matches);
        const onChange = () => setReduceMotion(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        if (count < 2 || dragging) return;
        const timer = setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs);
        return () => clearTimeout(timer);
        // `index` is a dependency on purpose: every arrival restarts the dwell.
    }, [index, count, dragging, intervalMs]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        setDragging(false);
        const far = Math.abs(info.offset.x) > SWIPE_DISTANCE;
        const fast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
        if (!far && !fast) return;
        // Dragging left (negative x) reveals what is to the RIGHT — the next one.
        const dir = info.offset.x < 0 ? 1 : -1;
        setIndex((i) => (i + dir + count) % count);
    };

    // No artwork at all — the themed gradient and the overlays, no broken <img>.
    // The data file documents that blanking the list degrades gracefully.
    if (count === 0) {
        return (
            <div className={`relative overflow-hidden ${className}`} style={style}>
                {children}
            </div>
        );
    }

    // A single banner needs none of the machinery below.
    if (count < 2) {
        return (
            <div className={`relative overflow-hidden ${className}`} style={style}>
                <Slide src={images[0]} alt={alt} eager />
                {children}
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`} style={style}>
            <motion.div
                className="flex h-full w-full"
                animate={{ x: `-${index * 100}%` }}
                transition={
                    reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 260, damping: 32 }
                }
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragStart={() => setDragging(true)}
                onDragEnd={handleDragEnd}
            >
                {images.map((src, i) => (
                    <div key={src} className="w-full h-full shrink-0">
                        <Slide src={src} alt={i === 0 ? alt : ""} eager={i === 0} />
                    </div>
                ))}
            </motion.div>

            {/* Dots. Tappable, because a visible position indicator that does
                nothing when pressed reads as broken. */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {images.map((src, i) => (
                    <button
                        key={src}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Show banner ${i + 1}`}
                        aria-current={i === index}
                        className={`h-1.5 rounded-full transition-all ${
                            i === index
                                ? "w-4 bg-[#D63D72]"
                                : "w-1.5 bg-[#5C1A34]/30 hover:bg-[#5C1A34]/50"
                        }`}
                    />
                ))}
            </div>

            {children}
        </div>
    );
}

function Slide({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
    return (
        <img
            src={bannerImg(src)}
            // The resizer is a free third party; falling back to the origin URL
            // means a proxy hiccup can never leave a blank hero.
            onError={(e) => { e.currentTarget.src = src; }}
            width={432}
            height={224}
            alt={alt}
            aria-hidden={alt ? undefined : true}
            draggable={false}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "low"}
            decoding="async"
            className="w-full h-full object-cover select-none pointer-events-none"
        />
    );
}
