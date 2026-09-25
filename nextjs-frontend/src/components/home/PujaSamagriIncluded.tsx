import { ShoppingBag } from "lucide-react";
import SectionHeader from "./SectionHeader";

const SAMAGRI = [
    {
        image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/thali.jpeg",
        title: "Complete Samagri Kit",
        desc: "All essential puja items included",
    },
    {
        image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/kalash.jpeg",
        title: "Sankalp in Your Name",
        desc: "Puja sankalp with your name & gotra",
    },
    {
        image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/book.jpeg",
        title: "Pandit Ji Guidance",
        desc: "Guidance before & after your puja",
    },
];

export default function PujaSamagriIncluded() {
    return (
        <section className="px-4 pt-6">
            <SectionHeader title="Puja Samagri Included" icon={ShoppingBag} subtitle="All essential items provided" />

            <div className="mt-3 grid grid-cols-3 gap-3">
                {SAMAGRI.map(({ image, title, desc }) => (
                    <div key={title} className="bg-[#FFFBF2] border border-orange-100 rounded-2xl p-2.5 text-center">
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-white">
                            <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <h4
                            className="mt-2 text-[11.5px] font-bold text-stone-800 leading-tight"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            {title}
                        </h4>
                        <p className="mt-0.5 text-[9.5px] text-stone-400 leading-snug">{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
