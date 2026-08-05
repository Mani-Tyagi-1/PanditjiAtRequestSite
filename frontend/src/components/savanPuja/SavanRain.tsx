import { useState, useEffect } from "react";

/**
 * Savan rainfall — the drifting gold drops that fall across the Savan detail
 * page.
 *
 * ONE caller, by choice: SavanPujaPage. The booking page wears the same theme
 * but deliberately has no rain — see the note where it would have gone. This
 * lives in its own file anyway because it is ~90 lines of seeded table, timing
 * and perf reasoning that has nothing to do with the puja page's own logic.
 *
 * Drops are struck in Royal Gold rather than white or a cool blue: the page is
 * parchment, so white vanishes into it and a cool hue is the one thing that
 * would not belong on an aged sheet. Gold reads as both rainfall and the
 * theme's sparkle particles at once, which is why it is one effect and not two
 * — a second always-animating layer would double the cost noted below for no
 * visual gain.
 */

/**
 * Generated once at module load from a fixed seed — not on every render — so
 * the drops keep their positions and the rain doesn't reshuffle when a
 * countdown ticks or a form field changes.
 *
 * Nearer drops fall faster and are longer, wider and brighter; farther ones are
 * slower and fainter. That depth spread is what stops it reading as a marching
 * row of identical ticks. Durations are tuned for a full-viewport fall
 * (~112vh), so they are far longer than a banner-height drop would need.
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
            w: +(0.9 + depth * 0.7).toFixed(1),        // 0.9px – 1.6px
            // Far fainter than the old emerald-on-cream rain. Struck in gold
            // on parchment the drops sit at almost the paper's own value, so
            // anything near the previous 0.35–0.80 stopped reading as rainfall
            // and started reading as scratches ruled down the sheet — right
            // through the body copy they fall over.
            opacity: +(0.14 + depth * 0.22).toFixed(2), // 0.14 – 0.36
        };
    });
})();

export default function SavanRain() {
    /**
     * Purely decorative, so it is mounted only after the page has painted.
     * Measured with Lighthouse (mobile, simulated throttling): the 60
     * always-animating drops cost ~2.1s of style & layout on the main thread
     * (styleLayout 2712ms -> 611ms with them removed), because each drop is a
     * compositing layer running an infinite transform animation. Paying that
     * while the browser is still trying to render the hero delays first paint;
     * paying it a beat later is invisible to the devotee.
     */
    const [show, setShow] = useState(false);
    useEffect(() => {
        const idle = (window as any).requestIdleCallback as
            | ((cb: () => void, o?: { timeout: number }) => number)
            | undefined;
        if (idle) {
            const id = idle(() => setShow(true), { timeout: 2000 });
            return () => (window as any).cancelIdleCallback?.(id);
        }
        const t = setTimeout(() => setShow(true), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <style>{`
              @keyframes savanDrop{0%{transform:translateY(-6vh);opacity:0}10%{opacity:var(--drop-opacity,.7)}88%{opacity:var(--drop-opacity,.7)}100%{transform:translateY(106vh);opacity:0}}
              .savan-rain{position:fixed;top:0;bottom:0;width:100%;max-width:28rem;overflow:hidden;pointer-events:none;z-index:30}
              .savan-drop{position:absolute;top:0;width:var(--drop-w,1.5px);height:var(--drop-h,14px);border-radius:9999px;background:linear-gradient(to bottom,rgba(199,154,43,0),rgba(199,154,43,.62));animation:savanDrop var(--drop-dur,3s) linear infinite;will-change:transform}
              @media (prefers-reduced-motion: reduce){.savan-rain{display:none}}
            `}</style>

            {/* `fixed` so it keeps falling while the devotee scrolls, clipped to
                the max-w-md column, and pointer-events-none so it never
                intercepts a tap. z-30 sits above the cards but below the sticky
                header and bottom CTA (both z-50), which stay fully crisp. */}
            {show && (
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
        </>
    );
}
