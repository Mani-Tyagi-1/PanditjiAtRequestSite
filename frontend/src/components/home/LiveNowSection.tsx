import { useNavigate } from "react-router-dom";
import { Users, Radio, CalendarClock, ChevronRight } from "lucide-react";
import { LIVE_MANDIR_PUJAS } from "../booking/LiveMandirPujas/liveMandirData";

/**
 * Desktop/tablet-only "Live Now / Upcoming Live Pujas" strip for the Home
 * page. Sources cards from the same curated `LIVE_MANDIR_PUJAS` dataset the
 * dedicated Live Mandir Puja section already uses — no new/fabricated data.
 * Hidden below `md` (this section does not exist on the mobile page today).
 */
export default function LiveNowSection() {
    const navigate = useNavigate();

    // Live items first, then whatever's left, capped to 3 cards.
    const cards = [...LIVE_MANDIR_PUJAS]
        .sort((a, b) => (a.status === "live" ? -1 : 0) - (b.status === "live" ? -1 : 0))
        .slice(0, 3);

    if (cards.length === 0) return null;

    return (
        <section className="hidden md:block md:w-full md:px-8 lg:px-10 md:pt-12 lg:pt-16">
            <div className="flex items-center gap-3">
                <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight shrink-0">Live Now</h2>
                <Radio className="w-6 h-6 text-orange-500 shrink-0" />
                <span className="h-px w-10 bg-orange-300 shrink-0" />
                <span className="text-sm text-stone-500 font-medium truncate">Upcoming Live Pujas from Mandirs</span>
                <button
                    onClick={() => navigate("/book-puja?tab=mandir")}
                    className="ml-auto flex items-center gap-0.5 text-[15px] font-bold text-orange-600 hover:text-orange-700 transition-colors shrink-0 cursor-pointer"
                >
                    View All Live Pujas <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-5 lg:gap-6">
                {cards.map((puja) => {
                    const isLive = puja.status === "live";
                    return (
                        <div
                            key={puja.id}
                            onClick={() => navigate("/book-puja?tab=mandir")}
                            className="group cursor-pointer bg-[#FFFDF9] rounded-[24px] overflow-hidden border border-[#FFEFE2] shadow-[0_12px_36px_-12px_rgba(224,90,16,0.1)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-orange-200"
                        >
                            <div className="relative h-40 lg:h-44 overflow-hidden">
                                <img
                                    src={puja.image}
                                    alt={`${puja.pujaName} at ${puja.templeName}`}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {isLive ? (
                                    <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                                        </span>
                                        LIVE
                                    </span>
                                ) : (
                                    <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                        <CalendarClock className="w-3 h-3" />
                                        {puja.scheduledDate}
                                    </span>
                                )}

                                <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                    <Users className="w-3 h-3" />
                                    {puja.devoteesJoined.toLocaleString("en-IN")} joined
                                </span>
                            </div>

                            <div className="p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-orange-600 truncate">
                                    {puja.templeName}
                                </p>
                                <h3
                                    className="mt-1 text-[17px] font-bold text-[#2E1F15] leading-tight truncate"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    {puja.pujaName}
                                </h3>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/book-puja?tab=mandir");
                                    }}
                                    className={`mt-3 w-full flex items-center justify-center gap-1 rounded-xl py-2.5 text-[13px] font-bold shadow-sm transition-all cursor-pointer ${
                                        isLive
                                            ? "bg-[#E05A10] hover:bg-[#C94D0C] text-white"
                                            : "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
                                    }`}
                                >
                                    {isLive ? "Watch Live" : "Remind Me"}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
