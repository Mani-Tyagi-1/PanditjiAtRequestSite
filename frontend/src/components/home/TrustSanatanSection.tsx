import { Shield, Calendar, Headphones, CreditCard, User, Lock, Users, Check, Star } from "lucide-react";
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

export default function TrustSanatanSection() {
    return (
        <section className="px-4 pt-6">
            <div className="bg-[#FFFDF9] border border-orange-200/60 rounded-[32px] p-4.5 shadow-[0_4px_20px_rgba(255,109,4,0.03)] space-y-5">

                {/* PART A: Why Devotees Trust Us */}
                <div>
                    <SectionHeader
                        title="Why Devotees Trust Us"
                        icon={Shield}
                        subtitle="Our commitment to authenticity"
                    />

                    {/* Vertical list of Trust items matching screenshot */}
                    <div className="mt-3.5 space-y-2.5">
                        {TRUST_LIST.map((t) => {
                            const IconComp = t.icon;
                            return (
                                <div
                                    key={t.id}
                                    className="bg-white border border-orange-100 rounded-[20px] p-3 flex items-center shadow-sm"
                                >
                                    <span className="w-[42px] h-[42px] rounded-[14px] bg-[#FFFBF6] border border-orange-100/60 flex items-center justify-center text-[#F0780A] shrink-0">
                                        <IconComp className="w-5 h-5 stroke-[2.2]" />
                                    </span>
                                    <div className="flex-1 min-w-0 pl-3 flex flex-col">
                                        <h4 className="text-[13.5px] font-bold text-stone-800 leading-tight">
                                            {t.title}
                                        </h4>
                                        <p className="text-[10.5px] text-stone-400 mt-0.5 leading-normal truncate">
                                            {t.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
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
                    <div className="mt-5 flex items-stretch justify-between gap-1 text-center">

                        {/* Feature 1 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44]">
                                    <User className="w-4.5 h-4.5" />
                                </span>
                                <span className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full bg-orange-600 flex items-center justify-center border border-white">
                                    <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full">
                                Verified Pandits
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full">
                                Experienced & Trusted
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block">☆</span>
                        </div>

                        {/* Vertical Divider 1 */}
                        <div className="flex flex-col items-center justify-between py-1.5 px-0.5 shrink-0 select-none">
                            <div className="w-[1px] h-3 bg-orange-200/70" />
                            <span className="text-[8px] text-orange-300">◆</span>
                            <div className="w-[1px] h-3 bg-orange-200/70" />
                        </div>

                        {/* Feature 2 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44]">
                                    <Lock className="w-4.5 h-4.5" />
                                </span>
                                <span className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full bg-orange-600 flex items-center justify-center border border-white">
                                    <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full">
                                Secure & Safe
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full">
                                100% Privacy
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block">☆</span>
                        </div>

                        {/* Vertical Divider 2 */}
                        <div className="flex flex-col items-center justify-between py-1.5 px-0.5 shrink-0 select-none">
                            <div className="w-[1px] h-3 bg-orange-200/70" />
                            <span className="text-[8px] text-orange-300">◆</span>
                            <div className="w-[1px] h-3 bg-orange-200/70" />
                        </div>

                        {/* Feature 3 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44]">
                                    <Users className="w-4.5 h-4.5" />
                                </span>
                                <span className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full bg-orange-600 flex items-center justify-center border border-white">
                                    <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full">
                                Lakhs of Devotees
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full">
                                Trust & Faith
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block">☆</span>
                        </div>

                        {/* Vertical Divider 3 */}
                        <div className="flex flex-col items-center justify-between py-1.5 px-0.5 shrink-0 select-none">
                            <div className="w-[1px] h-3 bg-orange-200/70" />
                            <span className="text-[8px] text-orange-300">◆</span>
                            <div className="w-[1px] h-3 bg-orange-200/70" />
                        </div>

                        {/* Feature 4 */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <div className="w-[44px] h-[44px] rounded-full border border-orange-200/80 flex items-center justify-center bg-white shadow-sm relative shrink-0">
                                <span className="w-8 h-8 rounded-full bg-orange-50/50 flex items-center justify-center text-[#C07E44]">
                                    <Headphones className="w-4 h-4" />
                                </span>
                                <span className="absolute bottom-0 right-0 bg-[#FF6D04] px-1 py-0.5 rounded-full border border-white text-[7px] font-bold text-white leading-none">
                                    24/7
                                </span>
                            </div>
                            <h5 className="text-[10px] font-bold text-stone-800 leading-tight mt-2.5 truncate w-full">
                                24x7 Support
                            </h5>
                            <p className="text-[8.5px] text-stone-400 mt-0.5 truncate w-full">
                                Always with You
                            </p>
                            <span className="text-[9.5px] text-[#C07E44]/70 mt-2 block">☆</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
