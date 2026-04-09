import { useEffect, useRef, useState } from "react";

interface Testimonial {
  _id: string;
  user_name: string;
  user_testimonial: string;
  rating: number;
  address: string;
  image: string;
}

const CARD_WIDTH = 250;
const CARD_GAP = 16;
const FALLBACK_IMG =
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/panditJiAtRequest/testm.png";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 mt-2.5">
      {Array.from({ length: rating || 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="#1E7A2E" className="w-[18px] h-[18px]">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 bg-white animate-pulse"
      style={{ width: CARD_WIDTH, borderRadius: 30, overflow: "hidden" }}
    >
      <div className="px-5 pt-2.5 pb-4">
        <div className="h-8 w-8 bg-gray-200 rounded mb-2" />
        <div className="h-3 bg-gray-200 rounded w-full mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-5/6 mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-4/6 mb-3" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>
      <div className="h-px bg-gray-100" />
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex-shrink-0" />
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIndex = useRef(0);
  const scrollDirection = useRef(1);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    fetch(`${apiUrl}/fetch-all-testimonials`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTestimonials(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll ping-pong (matches app behavior)
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      let next = scrollIndex.current + scrollDirection.current;
      if (next >= testimonials.length) {
        scrollDirection.current = -1;
        next = testimonials.length - 2;
      } else if (next < 0) {
        scrollDirection.current = 1;
        next = 1;
      }
      scrollIndex.current = next;
      scrollRef.current?.scrollTo({
        left: next * (CARD_WIDTH + CARD_GAP),
        behavior: "smooth",
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [testimonials]);

  if (!loading && testimonials.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .testi-title-font { font-family: 'Libre Baskerville', serif; }
        .testi-body-font  { font-family: 'DM Sans', sans-serif; }
        .testi-scroll {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-left: 20px;
          padding-right: 10px;
          padding-top: 20px;
          padding-bottom: 20px;
          gap: ${CARD_GAP}px;
        }
        .testi-scroll::-webkit-scrollbar { display: none; }
        .testi-card { scroll-snap-align: start; }
      `}</style>

      {/* Wrapper — matches app container with marginTop:-90 overlap */}
      <div className="relative w-full" style={{ marginTop: -90 }}>

        {/* Large decorative top image */}
        <img
          src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/home/Group%201000005757-optimized.png"
          alt=""
          className="w-full block"
          style={{ height: 600, objectFit: "fill" }}
          draggable={false}
        />

        {/* Testimonials section overlapping the image from below */}
        <div className="testi-body-font w-full" style={{ marginTop: -90 }}>

          {/* Title */}
          <h2
            className="testi-title-font text-center"
            style={{ color: "#BC0814", fontSize: 28, marginBottom: 0 }}
          >
            Testimonials
          </h2>

          {/* Orange bg image containing the cards */}
          <div
            style={{
              width: "100%",
              minHeight: 280,
              marginTop: -10,
              backgroundImage:
                "url('https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/home/Rectangle%2017829.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              display: "flex",
              alignItems: "center",
              paddingLeft: 15,
            }}
          >
            {loading ? (
              <div className="testi-scroll" style={{ paddingLeft: 20 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="testi-scroll w-full" ref={scrollRef} style={{ paddingLeft: 20 }}>
                {testimonials.map((t) => (
                  <div
                    key={t._id}
                    className="testi-card flex-shrink-0 bg-white"
                    style={{
                      width: CARD_WIDTH,
                      borderRadius: 30,
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Card content */}
                    <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 15 }}>
                      <span
                        className="testi-title-font block leading-none select-none"
                        style={{ fontSize: 48, color: "#C4C4C4", marginBottom: -20, lineHeight: "50px" }}
                      >
                        "
                      </span>
                      <p style={{ fontSize: 15, color: "#111", lineHeight: "22px", fontWeight: 500, marginTop: 0 }}>
                        {t.user_testimonial}
                      </p>
                      <StarRating rating={t.rating} />
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", width: "100%" }} />

                    {/* Footer */}
                    <div className="flex items-center" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12, gap: 12 }}>
                      <img
                        src={t.image || FALLBACK_IMG}
                        alt={t.user_name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                        style={{ width: 50, height: 50, borderRadius: 25, objectFit: "cover", backgroundColor: "#eee", flexShrink: 0 }}
                      />
                      <div>
                        <p
                          className="testi-title-font"
                          style={{ fontSize: 20, color: "#BC0814", lineHeight: "22px", margin: 0 }}
                        >
                          {t.user_name}
                        </p>
                        {t.address && (
                          <p className="testi-title-font" style={{ fontSize: 13, color: "#666", margin: 0 }}>
                            {t.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
