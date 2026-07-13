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
        <section className="px-4 pt-6 md:px-8 lg:px-10 md:pt-12 lg:pt-16 md:w-full">
            <SectionHeader title="Puja Samagri Included" icon={ShoppingBag} subtitle="All essential items provided" />

            <div className="mt-3 grid grid-cols-3 gap-3 md:mt-6 md:gap-5 lg:gap-6">
                {SAMAGRI.map(({ image, title, desc }) => (
                    <div key={title} className="bg-[#FFFBF2] border border-orange-100 rounded-2xl p-2.5 text-center md:rounded-3xl md:p-5 md:transition-all md:duration-300 md:hover:shadow-lg md:hover:-translate-y-1 md:hover:border-orange-200">
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-white md:rounded-2xl">
                            <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <h4
                            className="mt-2 text-[11.5px] font-bold text-stone-800 leading-tight md:mt-4 md:text-xl lg:text-2xl"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            {title}
                        </h4>
                        <p className="mt-0.5 text-[9.5px] text-stone-400 leading-snug md:mt-1.5 md:text-sm">{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
