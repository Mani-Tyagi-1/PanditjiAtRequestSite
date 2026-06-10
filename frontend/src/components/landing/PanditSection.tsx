import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Languages, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../utils/apiConfig";

interface Pandit {
  _id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  dob: string;
  mobile: string;
  email: string;
  profileImage?: string;
  experienceInYears: number;
  languages: string[];
  rating: number;
  isVerified: boolean;
  isActive: boolean;
  serviceModes: string[];
  location?: {
    city?: string;
    state?: string;
  };
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < full ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-300"
          }`}
        />
      ))}
      <span className="ml-1 font-bold text-stone-600 text-[11px]">
        {(rating ?? 5).toFixed(1)}
      </span>
    </div>
  );
}

function PanditCard({ pandit, index, onClick }: { pandit: Pandit; index: number; onClick: () => void }) {
  const fullName = `${pandit.prefix} ${pandit.firstName} ${pandit.lastName}`.trim();
  const location = [pandit.location?.city, pandit.location?.state].filter(Boolean).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-sm border border-orange-100/70 overflow-hidden cursor-pointer active:scale-95 transition-transform"
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-orange-50 to-amber-50">
        {pandit.profileImage ? (
          <img
            src={pandit.profileImage}
            alt={fullName}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🙏</div>
        )}
        {pandit.isVerified && (
          <div className="absolute top-1.5 right-1.5 bg-white/90 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm border border-orange-100/50">
            <BadgeCheck className="w-3 h-3 text-orange-500" />
            <span className="text-[9px] font-extrabold text-orange-600">Verified</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 space-y-1.5 text-left">
        <p className="font-bold text-stone-850 text-xs leading-tight truncate">{fullName}</p>
        <StarRating rating={pandit.rating ?? 5} />
        <p className="text-[10.5px] text-stone-500">
          <span className="font-bold text-orange-600">{(pandit.experienceInYears || 3)}+ yrs</span> exp
        </p>
        {pandit.languages?.length > 0 && (
          <div className="flex items-center gap-1">
            <Languages className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="text-[9.5px] text-stone-500 truncate">{pandit.languages.join(", ")}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="text-[9.5px] text-stone-500 truncate">{location}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function PanditSection() {
  const navigate = useNavigate();
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/pandits`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Filter only verified and active pandits
          const verifiedActive = data.data.filter(
            (p: Pandit) => p.isActive !== false && p.isVerified === true
          );
          // Pick 10 randomly
          const random10 = [...verifiedActive]
            .sort(() => 0.5 - Math.random())
            .slice(0, 10);
          setPandits(random10);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && pandits.length === 0) return null;

  return (
    <section className="py-6 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-5 text-center"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
            🕉 Our Pandits
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-200" />
        </div>
        <h2 className="text-xl font-bold text-stone-850">
          Meet Our{" "}
          <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Verified PanditJis
          </span>
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Experienced & trusted Pandit Jis for your sacred rituals
        </p>
      </motion.div>

      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 h-60 rounded-2xl bg-orange-50 animate-pulse border border-orange-100" />
            ))
          : pandits.map((pandit, i) => (
              <PanditCard
                key={pandit._id}
                pandit={pandit}
                index={i}
                onClick={() => navigate(`/pandit/${pandit._id}`)}
              />
            ))}
      </div>

      {/* View All Button */}
      {!loading && pandits.length > 0 && (
        <div className="mt-5 text-center">
          <button
            onClick={() => navigate("/all-pandits")}
            className="w-full py-3 rounded-2xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-600 font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>View All Pandit Jis</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
