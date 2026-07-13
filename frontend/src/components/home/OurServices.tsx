import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import SectionHeader from "./SectionHeader";

const SERVICES = [
    { image: "/images/pooja_for_home.jpg", title: "Pooja for Home", path: "/book-puja" },
    { image: "/images/live_pooja.jpg", title: "Live Pooja at Mandir", path: "/book-puja?tab=mandir" },
    { image: "/images/chadhava.jpg", title: "Chadhava at Mandir", path: "/chadhava" },
    { image: "/images/pandit_kashi.jpg", title: "Pandit Ji from Kashi", path: "/kashi" },
];

export default function OurServices() {
    const navigate = useNavigate();

    return (
        <section className="px-4 pt-5 md:w-full md:px-8 lg:px-10 md:pt-12 lg:pt-14">
            <div className="md:[&_h2]:text-3xl lg:[&_h2]:text-4xl md:[&_h2]:tracking-tight">
                <SectionHeader title="Our Services" icon={LayoutGrid} subtitle="Divine offerings & services" />
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3.5 md:mt-6 md:grid-cols-4 md:gap-5 lg:gap-6">
                {SERVICES.map(({ image, title, path }) => (
                    <button
                        key={title}
                        onClick={() => navigate(path)}
                        className="w-full bg-[#FFFDF9] rounded-[24px] overflow-hidden border border-[#FFEFE2] shadow-[0_8px_24px_-8px_rgba(224,90,16,0.08)] hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 text-left flex flex-col cursor-pointer md:hover:shadow-xl md:hover:-translate-y-1 md:duration-300"
                    >
                        <img 
                            src={image} 
                            alt={title} 
                            loading="lazy" 
                            className="w-full h-auto object-cover rounded-[24px]" 
                        />
                    </button>
                ))}
            </div>
        </section>
    );
}
