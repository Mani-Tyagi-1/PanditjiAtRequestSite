import { useState } from "react";

// ── Dummy Data ────────────────────────────────────────────────
const PUJA = {
    title: "Shri Lakshmi Pooja",
    deity: "Shri Mahalakshmi",
    image: "https://as2.ftcdn.net/v2/jpg/15/88/14/57/1000_F_1588145769_qpwIIJPLJkcK4066174NlWblD9cLHPi4.jpg",
    price: 2100,
    duration: "2–3 hrs",
    rating: 4.9,
    reviews: 312,
    includes: [
        "Trusted Pandit Ji",
        "Verified Background",
        "Vedic Rituals Followed",
        "Samagri Included",
        "Digital Prasad Kit",
        "Post-Puja Guidance",
    ],
};

const ACCORDIONS = [
    { key: "purpose", title: "Purpose of Puja" },
    { key: "process", title: "Puja Process" },
    { key: "samagri", title: "Samagri Required" },
    { key: "duration", title: "Duration & Timing" },
    { key: "pandit", title: "About Pandit Ji" },
    { key: "preparation", title: "How to Prepare" },
    { key: "post", title: "Post Puja Guidelines" },
    { key: "faq", title: "FAQs" },
];

const ACCORDION_CONTENT =
    "Invoke the blessings of Goddess Lakshmi for wealth, prosperity, and abundance. This puja removes financial obstacles and invites divine grace into your home and family.";

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

function AccordionRow({ title, content }: { title: string; content: React.ReactNode }) {
    const [open, setOpen] = useState(false);
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
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px" }}
                >
                    {title}
                </span>
                <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${open ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-400"
                        }`}
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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
                pujaTitle={PUJA.title}
                price={(PUJA.price + 350 + 501)}
            />

            <div className="detail-page max-w-[500px] mx-auto pb-32">

                {/* ── Header ── */}
                <div className="relative px-4 pt-3 pb-3 text-center bg-gradient-to-br from-red-200 via-orange-200 to-amber-100 rounded-b-[60px] mb-5 shadow-sm">
                    <button className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm">
                        <svg
                            className="w-4 h-4 text-stone-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h1
                        className="text-orange-600 font-extrabold"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px" }}
                    >
                        {PUJA.title}
                    </h1>
                    <p className="text-orange-900/50 text-xs font-medium mt-0.5">{PUJA.deity}</p>

                    <div className="flex items-center justify-center gap-3 mt-2">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-orange-400/50" />
                        <span className="text-orange-500">🕉</span>
                        <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-orange-400/50" />
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="px-4 space-y-5 fade-up">

                    {/* Hero Image */}
                    <div className="img-wrap rounded-2xl overflow-hidden shadow-md border border-orange-100 h-56 bg-gradient-to-b from-amber-100 to-orange-50">
                        <img
                            src={PUJA.image}
                            alt={PUJA.title}
                            className="img-zoom w-full h-full object-cover"
                        />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-orange-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                            {PUJA.deity}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                            ★ {PUJA.rating}
                            <span className="text-stone-400 font-light ml-0.5">({PUJA.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-400 text-xs ml-auto">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                            {PUJA.duration}
                        </div>
                    </div>

                    {/* Price Breakdown Card */}
                    {/* <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-orange-400 mb-3">
                            Pricing Details
                        </p>

                        <div className="space-y-2.5">
                            {[
                                { label: "Base Puja Price", amount: PUJA.price },
                                { label: "Samagri Kit", amount: 350 },
                                { label: "Pandit Dakshina", amount: 501 },
                            ].map(({ label, amount }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-stone-500 text-sm font-light">{label}</span>
                                    <span className="text-stone-700 font-medium text-sm">
                                        ₹{amount.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-orange-200 my-3" />

                        <div className="flex items-center justify-between">
                            <span className="text-stone-700 text-sm font-semibold">Total Payable</span>
                            <span className="text-orange-600 font-bold text-base">
                                ₹{(PUJA.price + 350 + 501).toLocaleString("en-IN")}
                            </span>
                        </div>

                        <p className="text-[10px] text-stone-400 font-light mt-2 text-right">
                            EMI available from ₹199/month
                        </p>
                    </div> */}

                    {/* Includes */}
                    <div>
                        <SectionLabel>What's Included</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {PUJA.includes.map((inc) => (
                                <IncludePill key={inc} text={inc} />
                            ))}
                        </div>
                    </div>

                    {/* 8 Accordions */}
                    <div>
                        <SectionLabel>More Details</SectionLabel>
                        <div className="space-y-2">
                            {ACCORDIONS.map(({ key, title }) => (
                                <AccordionRow key={key} title={title} content={ACCORDION_CONTENT} />
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Sticky Bottom CTA ── */}
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <div className="max-w-[500px] mx-auto bg-white/90 backdrop-blur-md border-t border-orange-100 px-4 py-3 flex items-center gap-3">
                        <div>
                            <p className="text-[10px] text-stone-400 font-light">Starting at</p>
                            <p
                                className="text-orange-600 font-bold text-lg leading-none"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                                ₹{PUJA.price.toLocaleString("en-IN")}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsBookingModalOpen(true)}
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}