import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import SectionHeader from "./SectionHeader";

/**
 * The six services, in the SAME order the app's home screen shows them, so a
 * family sees an identical menu whichever surface they're on:
 *   row 1 — Pooja for Home · Live Pooja at Mandir · Chadhava at Mandir
 *   row 2 — Vivah Sanskar  · Pandit Ji from Kashi · Shop
 *
 * Every tile is a real <a href>, so middle-click, ⌘-click and crawlers all
 * behave. Same-tab tiles intercept the click and hand it to the router (no full
 * reload); `newTab: true` tiles are left alone and open natively.
 */
const SERVICES: { image: string; title: string; path: string; newTab?: boolean }[] = [
    { image: "/images/pooja_for_home.jpg", title: "Pooja for Home", path: "/book-puja" },
    { image: "/images/live_pooja.jpg", title: "Live Pooja at Mandir", path: "/book-puja?tab=mandir" },
    { image: "/images/chadhava.jpg", title: "Chadhava at Mandir", path: "/chadhava" },
    // Vedic Vivah is a full standalone experience with its own header, footer
    // and checkout — it opens in its own tab so a family planning a wedding
    // never loses the page they came from.
    { image: "/images/vivah_sanskar_service.jpg", title: "Vivah Sanskar", path: "/vedic-vivah", newTab: true },
    { image: "/images/pandit_kashi.jpg", title: "Pandit Ji from Kashi", path: "/kashi" },
    { image: "/images/shop_service.jpg", title: "Shop", path: "/shop" },
];

export default function OurServices() {
    const navigate = useNavigate();

    return (
        <section className="px-4 pt-5">
            <SectionHeader title="Our Services" icon={LayoutGrid} subtitle="Divine offerings & services" />

            <div className="mt-3.5 grid grid-cols-2 gap-3.5">
                {SERVICES.map(({ image, title, path, newTab }) => (
                    <a
                        key={title}
                        href={path}
                        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        onClick={(e) => {
                            if (newTab) return; // let the browser open the new tab
                            // Preserve ⌘/Ctrl/middle-click "open in new tab".
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                            e.preventDefault();
                            navigate(path);
                        }}
                        aria-label={newTab ? `${title} (opens in a new tab)` : title}
                        className="w-full bg-[#FFFDF9] rounded-[24px] overflow-hidden border border-[#FFEFE2] shadow-[0_8px_24px_-8px_rgba(224,90,16,0.08)] hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 text-left flex flex-col cursor-pointer"
                    >
                        <img
                            src={image}
                            alt={title}
                            loading="lazy"
                            className="w-full h-auto object-cover rounded-[24px]"
                        />
                    </a>
                ))}
            </div>
        </section>
    );
}
