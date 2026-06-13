import { useEffect, useRef, useState } from "react";
import API_URL from "../../utils/apiConfig";

interface Testimonial {
  _id: string;
  user_name: string;
  user_testimonial: string;
  rating: number;
  address: string;
  image: string;
  isActive?: boolean;
}

// ── Star Rating ────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const stars = Math.min(Math.max(Math.floor(rating || 5), 0), 5);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
        i < stars ? (
          <svg key={i} viewBox="0 0 20 20" fill="#FFB93A" className="w-[15px] h-[15px]">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg key={i} viewBox="0 0 20 20" fill="none" stroke="#E2E8F0" strokeWidth={1.5} className="w-[15px] h-[15px]">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      )}
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="shrink-0 w-[280px] rounded-[20px] border border-orange-100 p-[18px] animate-pulse bg-white">
      <div className="flex justify-between items-center mb-3">
        <div className="w-7 h-7 bg-orange-100 rounded" />
        <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-3.5 h-3.5 bg-orange-100 rounded-full" />)}</div>
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="h-3 bg-stone-100 rounded w-full" />
        <div className="h-3 bg-stone-100 rounded w-5/6" />
        <div className="h-3 bg-stone-100 rounded w-4/6" />
        <div className="h-3 bg-stone-100 rounded w-5/6" />
      </div>
      <div className="h-px bg-stone-100 mb-3" />
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-full bg-orange-100 shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="h-3 bg-stone-100 rounded w-24" />
          <div className="h-2.5 bg-stone-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIndex = useRef(0);
  const scrollDirection = useRef(1);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/fetch-all-testimonials`)
      .then((res) => res.json())
      .then((data) => {
        const all: Testimonial[] = data.success ? data.data : [];
        setTestimonials(all.filter((t) => t.isActive !== false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll ping-pong
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const CARD_W = 280 + 16;
    const interval = setInterval(() => {
      if (isUserScrolling.current) return;
      let next = scrollIndex.current + scrollDirection.current;
      if (next >= testimonials.length) { scrollDirection.current = -1; next = testimonials.length - 2; }
      else if (next < 0) { scrollDirection.current = 1; next = 1; }
      scrollIndex.current = next;
      scrollRef.current?.scrollTo({ left: next * CARD_W, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(interval);
  }, [testimonials]);

  if (!loading && testimonials.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        .testi-scroll { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; gap:16px; padding:16px 16px 20px; }
        .testi-scroll::-webkit-scrollbar { display:none; }
        .testi-card { scroll-snap-align:start; }
      `}</style>

      <section className="py-8" style={{ background: "linear-gradient(160deg, #fff7ed 0%, #ffffff 60%, #fef3e2 100%)" }}>

        {/* ── Section Header ── */}
        <div className="text-center px-5 mb-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-px w-8" style={{ background: "linear-gradient(to right, transparent, #FED7AA)" }} />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200">
              <svg className="w-3 h-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Devotee Reviews</span>
            </div>
            <div className="h-px w-8" style={{ background: "linear-gradient(to left, transparent, #FED7AA)" }} />
          </div>

          {/* Heading */}
          <h2 className="text-[22px] leading-tight text-stone-800 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Devotee{" "}
            <span className="italic text-orange-500">Testimonials</span>
          </h2>

          {/* Sub-text */}
          <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto font-light">
            Hear from our community of devotees about their divine and spiritual experiences.
          </p>
        </div>

        {/* ── Horizontal Scroll Cards ── */}
        <div
          ref={scrollRef}
          className="testi-scroll"
          onTouchStart={() => { isUserScrolling.current = true; }}
          onTouchEnd={() => setTimeout(() => { isUserScrolling.current = false; }, 4000)}
          onMouseDown={() => { isUserScrolling.current = true; }}
          onMouseUp={() => setTimeout(() => { isUserScrolling.current = false; }, 4000)}
          style={{ scrollbarWidth: "none" }}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : testimonials.map((t) => {
                // Initials fallback
                const initials = t.user_name
                  ? t.user_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                  : "D";

                return (
                  <div
                    key={t._id}
                    className="testi-card shrink-0 w-[280px] flex flex-col justify-between rounded-[20px] p-[18px] bg-white"
                    style={{
                      border: "1.5px solid rgba(255, 138, 42, 0.15)",
                      boxShadow: "0 4px 16px -4px rgba(255,138,42,0.12)",
                    }}
                  >
                    {/* Top: Quote + Stars */}
                    <div className="flex justify-between items-center mb-2.5">
                      {/* Big decorative quote */}
                      <svg className="w-7 h-7 opacity-15" viewBox="0 0 24 24" fill="#f97316">
                        <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.293 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.293 3.996-5.849h-3.983v-10h9.983z" />
                      </svg>
                      <StarRating rating={t.rating} />
                    </div>

                    {/* Review text */}
                    <p
                      className="text-[13.5px] text-stone-600 leading-[20px] italic flex-1 mb-4"
                      style={{ fontFamily: "'DM Sans', sans-serif", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      "{t.user_testimonial}"
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-stone-100 mb-3" />

                    {/* User footer */}
                    <div className="flex items-center gap-3">
                      {t.image ? (
                        <img
                          src={t.image}
                          alt={t.user_name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          className="w-[38px] h-[38px] rounded-full object-cover shrink-0"
                          style={{ backgroundColor: "#FFEDD5" }}
                        />
                      ) : (
                        <div className="w-[38px] h-[38px] rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <span className="text-[12px] font-bold text-orange-600">{initials}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-stone-800 truncate" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px" }}>
                          {t.user_name}
                        </p>
                        {t.address && (
                          <p className="text-[10.5px] text-stone-500 truncate mt-0.5">{t.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>
    </>
  );
}
