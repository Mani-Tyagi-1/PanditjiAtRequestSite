import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

// ── Dummy Data ────────────────────────────────────────────────
const STATIC_INCLUDES = [
    "Trusted Pandit Ji",
    "Verified Background",
    "Vedic Rituals Followed",
    "Samagri Included",
    "Digital Prasad Kit",
    "Post-Puja Guidance",
];

// ── Sub-components ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-orange-500">
                {children}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-orange-200 to-transparent" />
        </div>
    );
}

function IncludePill({ text }: { text: string }) {
    return (
        <span className="flex items-center gap-1.5 bg-white border border-orange-100 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            <svg
                className="w-3.5 h-3.5 text-orange-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            {text}
        </span>
    );
}

function AccordionRow({
    title,
    content,
    defaultOpen = false,
}: {
    title: string;
    content: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${open ? "border-orange-300 shadow-sm" : "border-orange-100"
                }`}
        >
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
            >
                <span
                    className="text-stone-700 font-semibold"
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "15px",
                    }}
                >
                    {title}
                </span>
                <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${open ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-400"
                        }`}
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""
                            }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </span>
            </button>

            {open && (
                <div className="px-4 pb-4 text-stone-500 text-sm font-light leading-relaxed border-t border-orange-50 pt-3">
                    {content}
                </div>
            )}
        </div>
    );
}

import BookingModal from "./UI/BookingModal";

// ── Main Page ──────────────────────────────────────────────────
export default function PujaDetailPage() {
    const { pujaId } = useParams();
    const navigate = useNavigate();
    const { user, openLoginModal } = useAuth();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [pendingBooking, setPendingBooking] = useState(false);

    useEffect(() => {
        if (user && pendingBooking) {
            setPendingBooking(false);
            setIsBookingModalOpen(true);
        }
    }, [user, pendingBooking]);
    const [pujaData, setPujaData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPooja = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
                const response = await fetch(`${apiUrl}/fetch-pooja-by-id/${pujaId}`);
                const data = await response.json();

                if (data && data.pooja) {
                    setPujaData(data.pooja);
                } else {
                    setPujaData(data);
                }
            } catch (err) {
                console.error("Error fetching puja details:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (pujaId) {
            fetchPooja();
        }
    }, [pujaId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!pujaData) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center text-center px-4">
                <span className="text-4xl mb-3">🕉</span>
                <h2 className="text-xl font-bold text-stone-800 font-serif">
                    Puja Not Found
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                    We couldn't find the requested puja details.
                </p>
            </div>
        );
    }

    const price = pujaData.poojaPriceOnline || pujaData.poojaPriceOffline || 0;
    const title = pujaData.poojaNameEng || "";
    const deity = pujaData.poojaGods?.[0] || "Divine Deity";
    const image = pujaData.poojaMainImage || pujaData.poojaCardImage || "";

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .detail-page { font-family: 'DM Sans', sans-serif; background: #FFFAF3; min-height: 100vh; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .img-zoom { transition: transform 0.5s cubic-bezier(.22,1,.36,1); }
        .img-wrap:hover .img-zoom { transform: scale(1.04); }
      `}</style>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                pooja={pujaData}
            />

            <div className="detail-page flex justify-center">
                <div className="w-full max-w-md bg-[#FFFAF3] min-h-screen relative shadow-sm pb-32">
                {/* ── Header ── */}
                <div className="relative px-4 pt-3 pb-3 text-center bg-gradient-to-br from-red-200 via-orange-200 to-amber-100 rounded-b-[60px] mb-5 shadow-sm">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm"
                    >
                        <svg
                            className="w-4 h-4 text-stone-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>

                    <h1
                        className="text-orange-600 font-extrabold"
                        style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "26px",
                        }}
                    >
                        {title}
                    </h1>
                    <p className="text-orange-900/50 text-xs font-medium mt-0.5">
                        {deity}
                    </p>

                    <div className="flex items-center justify-center gap-3 mt-2">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-orange-400/50" />
                        <span className="text-orange-500">🕉</span>
                        <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-orange-400/50" />
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="px-4 space-y-5 fade-up">
                    {/* Hero Image */}
                    <div className="img-wrap rounded-2xl overflow-hidden shadow-md border border-orange-100 aspect-square bg-gradient-to-b from-amber-100 to-orange-50 flex items-center justify-center">
                        <img
                            src={image}
                            alt={title}
                            className="img-zoom w-full h-full object-contain"
                        />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-orange-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                            {deity}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                            ★ 4.9
                            <span className="text-stone-400 font-light ml-0.5">
                                (312 reviews)
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-400 text-xs ml-auto">
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                            2-3 hrs
                        </div>
                    </div>

                    {/* Includes */}
                    <div>
                        <SectionLabel>What's Included</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {STATIC_INCLUDES.map((inc) => (
                                <IncludePill key={inc} text={inc} />
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Accordions */}
                    <div>
                        <SectionLabel>More Details</SectionLabel>
                        <div className="space-y-2">
                            {pujaData.poojaDescription && pujaData.poojaDescription.length > 0 ? (
                                pujaData.poojaDescription.map((desc: any, index: number) => (
                                    <AccordionRow
                                        key={desc.headingId || desc.heading}
                                        title={desc.heading}
                                        defaultOpen={index < 2}
                                        content={
                                            <div
                                                dangerouslySetInnerHTML={{ __html: desc.description }}
                                            />
                                        }
                                    />
                                ))
                            ) : (
                                <p className="text-sm font-medium text-stone-400">
                                    No additional details available.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Sticky Bottom CTA ── */}
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-orange-100 px-4 py-3 flex items-center gap-3">
                        <div>
                            <p className="text-[10px] text-stone-400 font-light">
                                Starting at
                            </p>
                            <p
                                className="text-orange-600 font-bold text-lg leading-none"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                                ₹{price.toLocaleString("en-IN")}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (window.fbq) {
                                    window.fbq("track", "BookingDetailPageOpened", {
                                        content_ids: [pujaId],
                                        content_name: title,
                                        productname: [title],
                                        content_type: "product",
                                        value: price,
                                        currency: "INR",
                                    });
                                }
                                if (user) {
                                    setIsBookingModalOpen(true);
                                } else {
                                    setPendingBooking(true);
                                    openLoginModal();
                                }
                            }}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            Book Pandit Ji
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 7l5 5-5 5M6 12h12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}