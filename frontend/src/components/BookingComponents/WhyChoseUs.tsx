import { useState } from "react";

const REASONS = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        title: "Verified Panditji",
        desc: "Every panditji is background-checked, trained, and reviewed by our team.",
        accent: "text-orange-500",
        bg: "bg-orange-50",
        border: "border-orange-100",
        glow: "shadow-orange-100",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
            </svg>
        ),
        title: "Transparent Pricing",
        desc: "No hidden costs. Know exactly what you pay before you book.",
        accent: "text-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-100",
        glow: "shadow-amber-100",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
        ),
        title: "Experienced Panditji",
        desc: "Pandits with deep knowledge of Vedic traditions and regional customs.",
        accent: "text-rose-500",
        bg: "bg-rose-50",
        border: "border-rose-100",
        glow: "shadow-rose-100",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: "24/7 Support",
        desc: "Round-the-clock assistance for scheduling, queries, and last-minute changes.",
        accent: "text-violet-500",
        bg: "bg-violet-50",
        border: "border-violet-100",
        glow: "shadow-violet-100",
    },
];

export default function WhyChooseUs() {
    const [_hovered] = useState(null);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        .wcu-wrap  { font-family: 'DM Sans', sans-serif; }
        .wcu-title { font-family: 'Cormorant Garamond', serif; }
        .reason-card {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1),
                      box-shadow 0.3s ease,
                      border-color 0.3s ease;
        }
        .reason-card:hover { transform: translateY(-5px); }
        .icon-ring {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1);
        }
        .reason-card:hover .icon-ring { transform: scale(1.12) rotate(-5deg); }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .wcu-card-anim { animation: fadeUp 0.5s ease both; }
      `}</style>

            <section className="wcu-wrap bg-[#FFFAF3] px-4 py-2 sm:px-6 lg:px-10">
                <div className="max-w-3xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-3 py-1 mb-3 shadow-sm">
                            🕉 Why Choose Us
                        </span>
                        <h2
                            className="text-[15px] text-stone-700 leading-snug"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            We make every ritual seamless, sacred, and stress-free.
                        </h2>
                    </div>

                    {/* 2×2 grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
                        {REASONS.map((r, i) => (
                            <div
                                key={i}
                                className={`wcu-card-anim reason-card bg-white rounded-2xl border ${r.border} p-2 flex items-start gap-4 hover:shadow-lg ${r.glow} cursor-default`}
                                style={{ animationDelay: `${i * 70}ms` }}
                                // onMouseEnter={() => setHovered(i)}
                                // onMouseLeave={() => setHovered(null)}
                            >
                                {/* Icon */}
                                <div className={`icon-ring shrink-0 w-11 h-11 rounded-xl ${r.bg} ${r.accent} flex items-center justify-center mt-2`}>
                                    {r.icon}
                                </div>

                                {/* Text */}
                                <div>
                                    <h3 className="wcu-title text-stone-800 font-semibold leading-snug mb-0.5" style={{ fontSize: "16px" }}>
                                        {r.title}
                                    </h3>
                                    <p className="text-stone-600 text-xs font-normal leading-relaxed">{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom trust strip */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {["5000+ Verified Panditji", "10,000+ Bookings", "4.9 ★ Rated"].map((t) => (
                            <span key={t} className="flex items-center gap-1.5 text-xs text-stone-500 font-normal">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                                {t}
                            </span>
                        ))}
                    </div>

                </div>
            </section>
        </>
    );
}