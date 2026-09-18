import { useState, useEffect } from "react";
import { Flame, CalendarCheck, Wallet, Sparkles } from "lucide-react";

const steps = [
    {
        number: "01",
        icon: Flame,
        title: "Select Puja",
        desc: "Choose from 300+ highly customized Vedic pujas curated for every sacred occasion.",
    },
    {
        number: "02",
        icon: CalendarCheck,
        title: "Reserve Slot",
        desc: "Fill in your preferred date and time instantly. No upfront payment required.",
    },
    {
        number: "03",
        icon: Wallet,
        title: "Pandit Assigned",
        desc: "Once a verified Gurukul Pandit Ji is assigned, we send the payment link directly to your WhatsApp. Complete the secure payment after assignment.",
    },
    {
        number: "04",
        icon: Sparkles,
        title: "Puja Performed",
        desc: "Pandit Ji arrives at your home with pure, fresh samagri and performs the sacred Vedic ritual.",
    },
];

export default function HowItWorks() {
    const [active, setActive] = useState(0);

    // Auto-cycle
    useEffect(() => {
        const t = setInterval(() => setActive((p) => (p + 1) % steps.length), 2800);
        return () => clearInterval(t);
    }, []);

    const s = steps[active];

    return (
        <div
            className="w-full mx-auto px-4 py-8 font-sans"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Google font */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');`}</style>

            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex items-center gap-2 justify-center mb-2">
                    <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-transparent to-orange-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                        <Sparkles className="w-3 h-3" /> How It Works
                    </span>
                    <div className="h-px flex-1 max-w-[40px] bg-gradient-to-l from-transparent to-orange-200" />
                </div>
                <h2
                    className="text-xl font-bold text-stone-800"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    Book your puja in{" "}
                    <span className="italic bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                        4 simple steps
                    </span>
                </h2>
                <p className="text-[12px] text-stone-500 text-center mt-1 font-light">
                    See how it works and simplify your puja booking experience.
                </p>
            </div>

            {/* Stepper row */}
            <div className="relative flex items-center justify-between mb-6 px-2">
                {/* Track line */}
                <div className="absolute top-4 left-6 right-6 h-px bg-stone-200 z-0" />
                {/* Filled progress — orange-to-red gradient line */}
                <div
                    className="absolute top-4 left-6 h-[2px] z-0 transition-all duration-500 rounded-full"
                    style={{
                        width: `${(active / (steps.length - 1)) * (100 - 12)}%`,
                        background: "linear-gradient(to right, #f97316, #ef4444)",
                    }}
                />

                {steps.map((step, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className="relative z-10 flex flex-col items-center gap-1 group focus:outline-none"
                    >
                        {/* Circle */}
                        <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300 ${i <= active
                                ? "border-transparent text-white scale-110 shadow-md"
                                : "bg-white border-stone-200 text-stone-400"
                                }`}
                            style={
                                i <= active
                                    ? { background: "linear-gradient(to right, #f97316, #ef4444)" }
                                    : undefined
                            }
                        >
                            {i < active ? (
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                step.number
                            )}
                        </div>
                        {/* Label */}
                        <span
                            className={`text-[10px] font-medium transition-colors duration-200 whitespace-nowrap ${i === active ? "text-stone-700" : "text-stone-400"
                                }`}
                        >
                            {step.title}
                        </span>
                    </button>
                ))}
            </div>

            {/* Detail panel */}
            <div
                key={active}
                className="rounded-2xl p-2 flex items-start gap-4 border border-orange-100 shadow-sm"
                style={{
                    background: "linear-gradient(135deg, #fff7ed, #fef3e2, #ffecd2)",
                    animation: "fadeIn 0.35s ease",
                }}
            >
                <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
                <div className="mt-4 ml-2 select-none"><s.icon className="w-7 h-7 text-orange-500" /></div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold tracking-widest uppercase bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                            Step {s.number}
                        </span>
                    </div>
                    <h3
                        className="text-base font-semibold text-stone-800 mb-1"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px" }}
                    >
                        {s.title}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-light">{s.desc}</p>
                </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
                {steps.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`rounded-full transition-all duration-300 ${i === active ? "w-4 h-1.5" : "w-1.5 h-1.5 bg-stone-300"
                            }`}
                        style={
                            i === active
                                ? { background: "linear-gradient(to right, #f97316, #ef4444)" }
                                : undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
}