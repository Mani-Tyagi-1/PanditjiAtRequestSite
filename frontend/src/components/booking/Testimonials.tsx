import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import API_URL from "../../utils/apiConfig";
import SectionHeader from "../home/SectionHeader";

interface Testimonial {
  _id: string;
  user_name: string;
  user_testimonial: string;
  rating: number;
  address: string;
  image: string;
  isActive?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.min(Math.max(Math.floor(rating || 5), 0), 5);
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < stars ? "#FFB93A" : "none"}
          stroke={i < stars ? "#FFB93A" : "#E2E8F0"}
          strokeWidth={1.5}
          className="w-3.5 h-3.5"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/fetch-all-testimonials`)
      .then((res) => res.json())
      .then((data) => {
        const all: Testimonial[] = data.success ? data.data : [];
        setTestimonials(all.filter((t) => t.isActive !== false));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll loop
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const CARD_W = 290 + 16;
    let index = 0;
    let direction = 1;
    const interval = setInterval(() => {
      if (isUserScrolling.current) return;
      index += direction;
      if (index >= testimonials.length) {
        direction = -1;
        index = testimonials.length - 2;
      } else if (index < 0) {
        direction = 1;
        index = 1;
      }
      scrollRef.current?.scrollTo({ left: index * CARD_W, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials]);

  if (!loading && testimonials.length === 0) return null;

  return (
    <section className="px-4 pt-6 pb-2">
      <SectionHeader
        title="Devotee Testimonials"
        icon={MessageSquare}
        subtitle="What our devotees say about us"
      />

      <div
        ref={scrollRef}
        className="mt-3 flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 -mx-4"
        onTouchStart={() => { isUserScrolling.current = true; }}
        onTouchEnd={() => setTimeout(() => { isUserScrolling.current = false; }, 4000)}
        onMouseDown={() => { isUserScrolling.current = true; }}
        onMouseUp={() => setTimeout(() => { isUserScrolling.current = false; }, 4000)}
      >
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[290px] h-[168px] bg-white border border-orange-100 rounded-[24px] p-4 flex flex-col justify-between animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 bg-stone-100 rounded w-20" />
                    <div className="h-2.5 bg-stone-100 rounded w-12" />
                  </div>
                </div>
                <div className="w-16 h-3 bg-stone-100 rounded" />
              </div>
              <div className="space-y-1.5 flex-1 mt-3">
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-5/6" />
              </div>
            </div>
          ))
        ) : (
          testimonials.map((t) => {
            const initials = t.user_name
              ? t.user_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              : "D";

            return (
              <div
                key={t._id}
                className="shrink-0 w-[290px] h-[168px] bg-white border border-orange-200/50 rounded-[24px] p-4 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(255,138,42,0.05)] active:scale-[0.98] transition-transform"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {t.image ? (
                      <img
                        src={t.image}
                        alt={t.user_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 animate-fade-in"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-[#FFEAD8] flex items-center justify-center text-[#E25800] font-bold text-[15px] shrink-0">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-[14.5px] font-bold text-[#2E1E12] leading-tight truncate">
                        {t.user_name}
                      </h4>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {t.address}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={t.rating} />
                </div>

                {/* Quote Text */}
                <div className="mt-2 flex-1 flex flex-col justify-start min-h-0 overflow-hidden">
                  <span className="text-[#FF8A2A] text-[20px] font-bold leading-none select-none">"</span>
                  <p className="text-[12.5px] text-stone-600 leading-[17px] font-medium -mt-1 pl-1 line-clamp-3 overflow-hidden">
                    {t.user_testimonial}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
