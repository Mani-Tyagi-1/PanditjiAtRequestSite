import { Shield, Calendar, Headphones, CreditCard, User, Lock, Users, Check, Star, BadgeCheck, ShieldCheck, IndianRupee, Video, Gift, Headset } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface TrustItem {
    id: string;
    icon: any;
    title: string;
    desc: string;
}

const TRUST_LIST: TrustItem[] = [
    {
        id: "1",
        icon: Shield,
        title: "Verified Pandit Ji",
        desc: "All Pandit Ji are background verified & experienced"
    },
    {
        id: "2",
        icon: Calendar,
        title: "Easy Booking",
        desc: "Book Puja in just a few taps. Anytime, anywhere"
    },
    {
        id: "3",
        icon: Headphones,
        title: "Live Support",
        desc: "Talk to our expert team for guidance & support"
    },
    {
        id: "4",
        icon: CreditCard,
        title: "Transparent Pricing",
        desc: "No hidden charges. What you see is what you pay"
    }
];

// Desktop-only (md+) trust tiles — six-in-a-row band per the desktop mockup.
const DESKTOP_TRUST_TILES = [
    { icon: BadgeCheck, label: "Authentic Vidhi", sub: "As per Vedic Scriptures" },
    { icon: ShieldCheck, label: "Verified Pandits", sub: "Experienced & Trusted" },
    { icon: IndianRupee, label: "Transparent Pricing", sub: "No Hidden Charges" },
    { icon: Video, label: "Live Video Proof", sub: "Watch or Get Recording" },
    { icon: Gift, label: "Prasad Delivered", sub: "Pure & Blessed Prasad" },
    { icon: Headset, label: "Dedicated Support", sub: "Always Here for You" },
];

export default function TrustSanatanSection() {
    return (
        <section className="px-4 pt-6 md:px-8 lg:px-10 md:pt-12 lg:pt-16 md:w-full">
            <div className="bg-[#FFFDF9] border border-orange-200/60 rounded-[32px] p-4.5 shadow-[0_4px_20px_rgba(255,109,4,0.03)] space-y-5 md:rounded-[40px] md:p-8 lg:p-12 md:space-y-8">

                {/* PART A: Why Devotees Trust Us */}
                <div>
                    <SectionHeader
                        title="Why Devotees Trust Us"
                        icon={Shield}
                        subtitle="Our commitment to authenticity"
                    />

                    {/* Grid of Trust items matching screenshot (mobile only) */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2.5 md:hidden">
                        {TRUST_LIST.map((t) => {
                            const IconComp = t.icon;
                            return (
                                <div
                                    key={t.id}
                                    className="bg-white border border-orange-100 rounded-[20px] p-3 flex flex-col items-start gap-2 shadow-sm text-left md:rounded-[24px] md:p-5 md:gap-3 md:transition-all md:duration-300 md:hover:shadow-md md:hover:-translate-y-0.5 md:hover:border-orange-200"
                                >
                                    <span className="w-[36px] h-[36px] rounded-[12px] bg-[#FFFBF6] border border-orange-100/60 flex items-center justify-center text-[#F0780A] shrink-0 md:w-12 md:h-12 md:rounded-[14px]">
                                        <IconComp className="w-4 h-4 stroke-[2.2] md:w-5 md:h-5" />
                                    </span>
                                    <div className="flex flex-col">
                                        <h4 className="text-[12px] font-bold text-stone-800 leading-tight md:text-[15px]">
                                            {t.title}
                                        </h4>
                                        <p className="text-[9px] text-stone-400 mt-0.5 leading-snug md:text-xs md:mt-1">
                                            {t.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop-only six-tile trust band per mockup */}
                    <div className="hidden md:grid md:mt-6 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
                        {DESKTOP_TRUST_TILES.map(({ icon: IconComp, label, sub }) => (
                            <div
                                key={label}
                                className="bg-white border border-orange-100 rounded-2xl p-4 flex flex-col items-start gap-2.5 shadow-sm text-left transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200"
                            >
                                <span className="w-10 h-10 rounded-xl bg-[#FFFBF6] border border-orange-100/60 flex items-center justify-center text-[#F0780A] shrink-0">
                                    <IconComp className="w-5 h-5 stroke-[2.2]" />
                                </span>
                                <div>
                                    <h4 className="text-[13.5px] font-bold text-stone-800 leading-tight">{label}</h4>
                                    <p className="text-[11px] text-stone-400 mt-1 leading-snug">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Puja Samagri Included nested section */}
                    <div className="mt-5 pt-4 border-t border-dashed border-orange-200/50 md:mt-8 md:pt-7">
                        <div className="text-center">
                            <h4 className="text-[14px] font-bold text-stone-800 leading-tight md:text-xl lg:text-2xl md:tracking-tight">
                                Puja Samagri Included
                            </h4>
                            <p className="text-[10px] text-stone-400 mt-0.5 md:text-sm md:mt-1.5">
                                Each booking includes all essential materials & guidance
                            </p>
                        </div>

                        <div className="mt-4.5 grid grid-cols-3 gap-2 md:mt-7 md:gap-4 lg:gap-5 md:max-w-3xl md:mx-auto">
                            {[
                                {
                                    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/thali.jpeg",
                                    title: "Complete Samagri Kit",
                                    desc: "All essential puja items",
                                },
                                {
                                    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/kalash.jpeg",
                                    title: "Sankalp in Your Name",
                                    desc: "With your name & gotra",
                                },
                                {
                                    image: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/book.jpeg",
                                    title: "Pandit Ji Guidance",
                                    desc: "Before & after puja",
                                },
                            ].map(({ image, title, desc }) => (
                                <div key={title} className="bg-white border border-orange-100/60 rounded-[18px] p-2 text-center flex flex-col items-center shadow-xs md:rounded-[24px] md:p-5 md:transition-all md:duration-300 md:hover:shadow-md md:hover:-translate-y-0.5">
                                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[#FFFBF2] flex items-center justify-center shrink-0 md:w-[76px] md:h-[76px]">
                                        <img src={image} alt={title} loading="lazy" className="w-10 h-10 object-contain rounded-full md:w-[60px] md:h-[60px]" />
                                    </div>
                                    <h5 className="mt-2 text-[10px] font-bold text-stone-850 leading-tight min-h-[24px] md:mt-3 md:text-[14px] md:min-h-0">
                                        {title}
                                    </h5>
                                    <p className="mt-0.5 text-[8.5px] text-stone-400 leading-tight md:mt-1 md:text-xs">
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Divider Line in between sections */}
                <div className="flex items-center gap-3 py-1">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-orange-200" />
                    <span className="text-[11px] text-[#F0780A] select-none">✿</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-orange-200" />
                </div>

                {/* PART B: Sanatan Lifestyle App */}
                <div>
                    <SectionHeader
                        title="Sanatan Lifestyle App"
                        icon={Star}
                        subtitle="India's most trusted platforms"
                    />

                    {/* Features columns with vertical dividers */}
                    <div className="mt-5 flex items-stretch justify-between gap-1 text-center md:mt-8 md:gap-4">

                        {/* Feature 1 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0 md:w-16 md:h-16">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44] md:w-11 md:h-11">
                                    <User className="w-4.5 h-4.5 md:w-6 md:h-6" />
                                </span>
                                <span className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full bg-orange-600 flex items-center justify-center border border-white md:w-[18px] md:h-[18px]">
                                    <Check className="w-2 h-2 text-white md:w-2.5 md:h-2.5" strokeWidth={3.5} />
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full md:text-[14px] md:mt-3.5">
                                Verified Pandits
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full md:text-[11.5px] md:mt-1">
                                Experienced & Trusted
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block md:text-xs md:mt-3">☆</span>
                        </div>

                        {/* Vertical Divider 1 */}
                        <div className="flex flex-col items-center justify-between py-1.5 px-0.5 shrink-0 select-none">
                            <div className="w-[1px] h-3 bg-orange-200/70 md:h-6" />
                            <span className="text-[8px] text-orange-300 md:text-[10px]">◆</span>
                            <div className="w-[1px] h-3 bg-orange-200/70 md:h-6" />
                        </div>

                        {/* Feature 2 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0 md:w-16 md:h-16">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44] md:w-11 md:h-11">
                                    <Lock className="w-4.5 h-4.5 md:w-6 md:h-6" />
                                </span>
                                <span className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full bg-orange-600 flex items-center justify-center border border-white md:w-[18px] md:h-[18px]">
                                    <Check className="w-2 h-2 text-white md:w-2.5 md:h-2.5" strokeWidth={3.5} />
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full md:text-[14px] md:mt-3.5">
                                Secure & Safe
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full md:text-[11.5px] md:mt-1">
                                100% Privacy
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block md:text-xs md:mt-3">☆</span>
                        </div>

                        {/* Vertical Divider 2 */}
                        <div className="flex flex-col items-center justify-between py-1.5 px-0.5 shrink-0 select-none">
                            <div className="w-[1px] h-3 bg-orange-200/70 md:h-6" />
                            <span className="text-[8px] text-orange-300 md:text-[10px]">◆</span>
                            <div className="w-[1px] h-3 bg-orange-200/70 md:h-6" />
                        </div>

                        {/* Feature 3 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0 md:w-16 md:h-16">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44] md:w-11 md:h-11">
                                    <Users className="w-4.5 h-4.5 md:w-6 md:h-6" />
                                </span>
                                <span className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full bg-orange-600 flex items-center justify-center border border-white md:w-[18px] md:h-[18px]">
                                    <Check className="w-2 h-2 text-white md:w-2.5 md:h-2.5" strokeWidth={3.5} />
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full md:text-[14px] md:mt-3.5">
                                Lakhs of Devotees
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full md:text-[11.5px] md:mt-1">
                                Trust & Faith
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block md:text-xs md:mt-3">☆</span>
                        </div>

                        {/* Vertical Divider 3 */}
                        <div className="flex flex-col items-center justify-between py-1.5 px-0.5 shrink-0 select-none">
                            <div className="w-[1px] h-3 bg-orange-200/70 md:h-6" />
                            <span className="text-[8px] text-orange-300 md:text-[10px]">◆</span>
                            <div className="w-[1px] h-3 bg-orange-200/70 md:h-6" />
                        </div>

                        {/* Feature 4 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0 md:w-16 md:h-16">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44] md:w-11 md:h-11">
                                    <Headphones className="w-4 h-4 md:w-5.5 md:h-5.5" />
                                </span>
                                <span className="absolute bottom-0 right-0 bg-[#FF6D04] px-1 py-0.5 rounded-full border border-white text-[7px] font-bold text-white leading-none md:text-[9px] md:px-1.5">
                                    24/7
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full md:text-[14px] md:mt-3.5">
                                24x7 Support
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full md:text-[11.5px] md:mt-1">
                                Always with You
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block md:text-xs md:mt-3">☆</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
