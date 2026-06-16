import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import SectionHeader from "./SectionHeader";

const BASE = "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request";

const SERVICES = [
    { image: `${BASE}/WhatsApp%20Image%202026-06-15%20at%204.04.20%20PM.jpeg`, title: "Pooja for Home", sub: "At Your Place", path: "/book-puja" },
    { image: `${BASE}/WhatsApp%20Image%202026-06-15%20at%204.04.49%20PM.jpeg`, title: "Live Pooja at Mandir", sub: "Real-time Pooja", path: "/book-puja?tab=mandir" },
    { image: `${BASE}/WhatsApp%20Image%202026-06-15%20at%204.05.06%20PM%20(1).jpeg `, title: "Chadhava at Mandir", sub: "Offer with Faith", path: "/chadhava" },
    { image: `${BASE}/WhatsApp%20Image%202026-06-15%20at%204.05.18%20PM.jpeg `, title: "Pandit Ji from Kashi", sub: "Expert & Trusted", path: "/kashi" },
];

export default function OurServices() {
    const navigate = useNavigate();

    return (
        <section className="px-4 pt-5">
            <SectionHeader title="Our Services" icon={LayoutGrid} subtitle="Divine offerings & services" />

            <div className="mt-3 grid grid-cols-4 gap-2">
                {SERVICES.map(({ image, title, path }) => (
                    <button
                        key={title}
                        onClick={() => navigate(path)}
                        className="rounded-2xl flex flex-col items-center text-center active:scale-95 transition-transform"
                    >
                        <span className="w-full h-[94px] rounded-xl overflow-hidden flex items-center justify-center">
                            <img src={image} alt={title} loading="lazy" className="w-full h-full object-contain" />
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
