import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, Languages, BadgeCheck, ArrowLeft, Search } from "lucide-react";
import API_URL from "../utils/apiConfig";

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

export default function AllPanditsPage() {
  const navigate = useNavigate();
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/pandits`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Only show active and verified pandits
          const filtered = data.data.filter(
            (p: Pandit) => p.isActive !== false && p.isVerified === true
          );
          setPandits(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPandits = pandits.filter((p) => {
    const fullName = `${p.prefix} ${p.firstName} ${p.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const city = (p.location?.city || "").toLowerCase();
    const lang = p.languages.join(" ").toLowerCase();
    return fullName.includes(query) || city.includes(query) || lang.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#FFFAF3] pb-12 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#FFFAF3]/90 backdrop-blur-md border-b border-orange-100 px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-orange-200/50 shadow-sm active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-stone-700" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-stone-850">Our Verified Pandit Jis</h1>
          <p className="text-[10px] text-stone-500 font-medium">Experienced & Shastrik Ritual Experts</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, city, or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors shadow-sm"
          />
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl bg-orange-50/60 animate-pulse border border-orange-100/50" />
            ))}
          </div>
        ) : filteredPandits.length === 0 ? (
          <div className="text-center py-16 px-4">
            <span className="text-4xl block mb-2">🙏</span>
            <p className="text-sm font-bold text-stone-600">No Pandit Jis Found</p>
            <p className="text-xs text-stone-400 mt-1">Try searching with a different name, city, or language.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPandits.map((pandit, index) => {
              const fullName = `${pandit.prefix} ${pandit.firstName} ${pandit.lastName}`.trim();
              const location = [pandit.location?.city, pandit.location?.state].filter(Boolean).join(", ");
              return (
                <motion.div
                  key={pandit._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/pandit/${pandit._id}`)}
                  className="bg-white rounded-2xl shadow-sm border border-orange-100/70 overflow-hidden cursor-pointer active:scale-98 transition-transform flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-36 bg-gradient-to-br from-orange-50 to-amber-50">
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
                        <div className="absolute top-2 right-2 bg-white/90 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm border border-orange-100/50">
                          <BadgeCheck className="w-3 h-3 text-orange-500" />
                          <span className="text-[8.5px] font-extrabold text-orange-600">Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5 space-y-1.5">
                      <p className="font-bold text-stone-800 text-xs leading-tight truncate">{fullName}</p>
                      <StarRating rating={pandit.rating ?? 5} />
                      <p className="text-[10px] text-stone-500 font-medium">
                        <span className="font-bold text-orange-600">{(pandit.experienceInYears || 3)}+ yrs</span> exp
                      </p>
                      {pandit.languages?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Languages className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="text-[9.5px] text-stone-500 truncate font-light">{pandit.languages.join(", ")}</span>
                        </div>
                      )}
                      {location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="text-[9.5px] text-stone-500 truncate font-light">{location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {pandit.serviceModes?.length > 0 && (
                    <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1">
                      {pandit.serviceModes.slice(0, 2).map((mode) => (
                        <span key={mode} className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100/50">
                          {mode}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
