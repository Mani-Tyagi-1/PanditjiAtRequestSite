import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Award,
  BadgeCheck,
  Sparkles,
  Shield,
  ChevronRight,
  Star,
} from "lucide-react";

const ACCENT = "#f97316";

const PILLARS = [
  {
    icon: GraduationCap,
    badge: "Heritage",
    title: "Gurukul & Sanskrit University Aligned",
    desc: "All Pandit Jis are trained at esteemed Gurukuls (Kashi Gurukul, Haridwar Vidyapeeth) and Sanskrit universities, preserving pristine scriptural heritage.",
  },
  {
    icon: Award,
    badge: "Credentials",
    title: "Jyotish & Vedic Credentials",
    desc: "Holders of certified titles including Shastri, Acharya, and Jyotishacharya with deep mastery over traditional Hindu astrological and ritual vidhis.",
  },
  {
    icon: Shield,
    badge: "Verified",
    title: "Rigorous Background Verification",
    desc: "Each Pandit Ji undergoes comprehensive identity validation, background checks, and ritual skill assessments before performing your sacred ceremonies.",
  },
  {
    icon: Sparkles,
    badge: "Matched",
    title: "Perfect Specialist Alignment",
    desc: "We match your specific puja requirements (Griha Pravesh, Rudrabhishek, or Pitra Shanti) with a pandit who specializes specifically in that ritual line.",
  },
];

const METRICS = [
  { value: "100%", label: "Gurukul Certified" },
  { value: "15+ Yrs", label: "Avg. Experience" },
  { value: "5000+", label: "Pujas Completed" },
];

export function PanditTrustSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    if (isUserInteracting) return;
    const interval = setInterval(() => {
      const nextCard = (activeCard + 1) % PILLARS.length;
      scrollToCard(nextCard);
    }, 4200);
    return () => clearInterval(interval);
  }, [activeCard, isUserInteracting]);

  const scrollToCard = (index: number) => {
    setActiveCard(index);
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.children[index] as HTMLElement;
      if (card) {
        container.scrollTo({
          left: card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2,
          behavior: "smooth",
        });
      }
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.offsetWidth;
    let minDiff = Infinity;
    let closestIndex = 0;
    Array.from(container.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const containerCenter = scrollLeft + containerWidth / 2;
      const diff = Math.abs(cardCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    setActiveCard(closestIndex);
  };

  // const activePillar = PILLARS[activeCard];

  return (
    <section className="py-10 overflow-hidden" style={{ background: "linear-gradient(160deg, #fff7ed 0%, #ffffff 50%, #fef3e2 100%)" }}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&display=swap');
        .scrollbar-none-trust::-webkit-scrollbar { display: none; }
        .pillar-card-active { box-shadow: 0 8px 32px -8px rgba(249,115,22,0.25); }
        @keyframes trustFadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .trust-fade { animation: trustFadeUp 0.4s ease both; }
      `}</style>

      {/* ── Section Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center px-5 mb-7"
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-px w-6 bg-orange-200" />
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
            <BadgeCheck className="w-3 h-3" /> 100% Verified Pandit Jis
          </span>
          <div className="h-px w-6 bg-orange-200" />
        </div>

        {/* Heading */}
        <h2
          className="text-[22px] leading-tight text-stone-800 mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Our Sacred{" "}
          <span className="italic text-orange-500">
            Pandit Trust
          </span>
        </h2>

        {/* Sub-text */}
        <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto font-light">
          We bridge the gap between traditional Vedic wisdom and modern convenience — matching you only with highly trained, verified Pandit Jis.
        </p>
      </motion.div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-3 gap-2.5 mb-7 px-5 max-w-sm mx-auto">
        {METRICS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl py-4 px-2 text-center border border-orange-100 bg-white"
          >
            <p className="text-[17px] font-bold leading-none" style={{ color: ACCENT }}>
              {m.value}
            </p>
            <p className="text-[11px] text-stone-500 mt-1.5 leading-tight">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Pillar Carousel ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={() => setIsUserInteracting(true)}
        onTouchEnd={() => setTimeout(() => setIsUserInteracting(false), 5000)}
        onMouseDown={() => setIsUserInteracting(true)}
        onMouseUp={() => setTimeout(() => setIsUserInteracting(false), 5000)}
        className="flex overflow-x-auto gap-3.5 pb-4 px-5 snap-x snap-mandatory scrollbar-none-trust w-full scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          const isActive = i === activeCard;
          return (
            <div
              key={i}
              onClick={() => {
                setIsUserInteracting(true);
                scrollToCard(i);
                setTimeout(() => setIsUserInteracting(false), 5000);
              }}
              className={`w-[268px] shrink-0 snap-center rounded-2xl p-5 border flex flex-col gap-4 transition-all duration-300 cursor-pointer ${
                isActive
                  ? "border-orange-300 shadow-md shadow-orange-50 scale-100 opacity-100 bg-orange-50/30"
                  : "border-orange-100 scale-[0.97] opacity-70 bg-white"
              }`}
            >
              {/* Icon container + badge */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 border border-orange-100">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                  {p.badge}
                </span>
              </div>

              {/* Text content */}
              <div className="space-y-1.5">
                <h3
                  className="font-bold text-stone-800 leading-snug"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px" }}
                >
                  {p.title}
                </h3>
                <p className="text-[11px] text-stone-500 leading-relaxed font-light">
                  {p.desc}
                </p>
              </div>

              {/* Active bar */}
              {isActive && (
                <div className="mt-auto flex items-center gap-1.5">
                  <div className="h-0.5 rounded-full flex-1 bg-orange-300 opacity-70" />
                  <ChevronRight className="w-3 h-3 text-orange-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dot Indicators ── */}
      <div className="flex justify-center gap-1.5 mt-3 mb-5">
        {PILLARS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIsUserInteracting(true);
              scrollToCard(i);
              setTimeout(() => setIsUserInteracting(false), 5000);
            }}
            className={`rounded-full transition-all duration-300 ${
              i === activeCard ? "w-5 h-1.5 bg-orange-400" : "w-1.5 h-1.5 bg-stone-300"
            }`}
          />
        ))}
      </div>

      {/* ── Bottom Guarantee Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-5 rounded-2xl p-5 bg-white border-[1.5px] border-orange-300"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 mt-0.5">
            <Star className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-stone-800 mb-1">
              Shastrik Vidhi Guarantee
            </h4>
            <p className="text-[13px] text-stone-500 leading-relaxed font-light">
              Every chanting, havan, and ritual is fully aligned with authentic scriptures to channel maximum spiritual blessings and peace.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}