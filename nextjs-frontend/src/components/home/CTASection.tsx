import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function CTASection() {
    const navigate = useNavigate();

    return (
        <section className="px-4 pt-6 pb-4">
            <div
                className="relative overflow-hidden rounded-[28px] border border-orange-200/60 p-5 flex items-center justify-end shadow-sm bg-cover bg-center min-h-[140px]"
                style={{
                    backgroundImage: "url('https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/WhatsApp%20Image%202026-06-15%20at%205.28.13%20PM.jpeg'), linear-gradient(135deg, #FFF6E7 0%, #FFEED4 50%, #FFDFB3 100%)"
                }}
            >
                {/* Background decorative glowing element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-300/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/40 rounded-full blur-xl pointer-events-none" />

                {/* Right side: content, width constrained to sit alongside left bg graphics */}
                <div className="w-[62%] z-10 flex flex-col justify-center pl-2">
                    <h3 className="text-[17px] font-bold text-[#2E1E12] leading-tight">
                        Ready to Book a Pandit or Pooja?
                    </h3>
                    <p className="text-[11px] text-[#5C4D40] leading-snug mt-1 font-semibold">
                        Get blessings, guidance & peace of mind, right at your doorstep.
                    </p>
                    <button
                        onClick={() => navigate("/book-puja")}
                        className="mt-3 self-start inline-flex items-center gap-1.5 bg-[#FF6D04] hover:bg-[#E25800] text-white font-bold text-[12px] px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
                    >
                        Book Now <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
