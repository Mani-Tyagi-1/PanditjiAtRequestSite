import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Languages, BadgeCheck, X, Calendar, User, Briefcase, Smartphone, Globe } from "lucide-react";
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
  mobileType?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const cls = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
              ? "fill-amber-200 text-amber-400"
              : "fill-stone-200 text-stone-300"
          }`}
        />
      ))}
      <span className={`ml-1 font-semibold text-stone-600 ${size === "md" ? "text-sm" : "text-[11px]"}`}>
        {(rating ?? 5).toFixed(1)}
      </span>
    </div>
  );
}

function ProfileModal({ pandit, onClose }: { pandit: Pandit; onClose: () => void }) {
  const fullName = `${pandit.prefix} ${pandit.firstName} ${pandit.lastName}`.trim();
  const location = [pandit.location?.city, pandit.location?.state, pandit.location?.country]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#FFFAF3] rounded-t-3xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close pill */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-stone-300 rounded-full z-10" />

        {/* Hero image */}
        <div className="relative h-56 bg-gradient-to-br from-orange-100 to-amber-100 shrink-0">
          {pandit.profileImage ? (
            <img
              src={pandit.profileImage}
              alt={fullName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🙏</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
          >
            <X className="w-4 h-4 text-stone-700" />
          </button>

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-white font-bold text-xl leading-tight drop-shadow">{fullName}</h2>
                {location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-orange-300" />
                    <span className="text-orange-100 text-xs">{location}</span>
                  </div>
                )}
              </div>
              {pandit.isVerified && (
                <div className="flex items-center gap-1 bg-white/90 rounded-full px-2.5 py-1 shadow">
                  <BadgeCheck className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold text-orange-600">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Rating + experience row */}
          <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-orange-100">
            <div className="text-center">
              <StarRating rating={pandit.rating ?? 5} size="md" />
              <p className="text-[10px] text-stone-400 mt-0.5">Rating</p>
            </div>
            <div className="w-px h-8 bg-stone-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{pandit.experienceInYears}+</p>
              <p className="text-[10px] text-stone-400">Yrs Exp</p>
            </div>
            <div className="w-px h-8 bg-stone-100" />
            <div className="text-center">
              <p className="text-sm font-bold text-stone-700">{pandit.age || "—"}</p>
              <p className="text-[10px] text-stone-400">Age</p>
            </div>
            <div className="w-px h-8 bg-stone-100" />
            <div className="text-center">
              <p className="text-sm font-bold text-stone-700 capitalize">{pandit.gender || "—"}</p>
              <p className="text-[10px] text-stone-400">Gender</p>
            </div>
          </div>

          {/* Details list */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm divide-y divide-stone-100">

            {pandit.dob && (
              <DetailRow icon={<Calendar className="w-4 h-4 text-orange-400" />} label="Date of Birth" value={pandit.dob} />
            )}

            {pandit.languages?.length > 0 && (
              <DetailRow
                icon={<Languages className="w-4 h-4 text-orange-400" />}
                label="Languages"
                value={pandit.languages.join(", ")}
              />
            )}

            {pandit.serviceModes?.length > 0 && (
              <div className="px-4 py-3 flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-stone-400 font-medium mb-1.5">Service Modes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pandit.serviceModes.map((mode) => (
                      <span
                        key={mode}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {pandit.mobileType && (
              <DetailRow icon={<Smartphone className="w-4 h-4 text-orange-400" />} label="Device" value={pandit.mobileType} />
            )}

            {pandit.location?.address && (
              <DetailRow icon={<MapPin className="w-4 h-4 text-orange-400" />} label="Address" value={pandit.location.address} />
            )}

            {pandit.location?.pincode && (
              <DetailRow icon={<Globe className="w-4 h-4 text-orange-400" />} label="Pincode" value={pandit.location.pincode} />
            )}

            {pandit.location?.country && (
              <DetailRow icon={<Globe className="w-4 h-4 text-orange-400" />} label="Country" value={pandit.location.country} />
            )}

            {pandit.email && (
              <DetailRow icon={<User className="w-4 h-4 text-orange-400" />} label="Email" value={pandit.email} />
            )}
          </div>

          {/* Active status badge */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${
            pandit.isActive
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-stone-50 border-stone-200 text-stone-500"
          }`}>
            <span className={`w-2 h-2 rounded-full ${pandit.isActive ? "bg-green-500" : "bg-stone-400"}`} />
            {pandit.isActive ? "Currently Active & Available" : "Currently Unavailable"}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-stone-400 font-medium">{label}</p>
        <p className="text-sm text-stone-700 font-medium leading-snug">{value}</p>
      </div>
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
      transition={{ delay: index * 0.07 }}
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden cursor-pointer active:scale-95 transition-transform"
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
          <div className="absolute top-1.5 right-1.5 bg-white/90 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
            <BadgeCheck className="w-3 h-3 text-orange-500" />
            <span className="text-[9px] font-bold text-orange-600">Verified</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 space-y-1.5">
        <p className="font-bold text-stone-800 text-xs leading-tight truncate">{fullName}</p>
        <StarRating rating={pandit.rating ?? 5} />
        <p className="text-[11px] text-stone-500">
          <span className="font-semibold text-orange-600">{pandit.experienceInYears}+ yrs</span> exp
        </p>
        {pandit.languages?.length > 0 && (
          <div className="flex items-center gap-1">
            <Languages className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="text-[10px] text-stone-500 truncate">{pandit.languages.join(", ")}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="text-[10px] text-stone-500 truncate">{location}</span>
          </div>
        )}
        {pandit.serviceModes?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {pandit.serviceModes.slice(0, 2).map((mode) => (
              <span key={mode} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                {mode}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function PanditSection() {
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Pandit | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/pandits`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPandits(data.data.filter((p: Pandit) => p.isActive !== false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && pandits.length === 0) return null;

  return (
    <>
      <section className="py-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              🕉 Our Pandits
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-200" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 text-center">
            Meet Our{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
              Verified Pandit Jis
            </span>
          </h2>
          <p className="text-xs text-stone-500 text-center mt-1">
            Experienced & trusted Pandit Jis for your sacred rituals
          </p>
        </motion.div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 h-60 rounded-2xl bg-orange-50 animate-pulse border border-orange-100" />
              ))
            : pandits.map((pandit, i) => (
                <PanditCard
                  key={pandit._id}
                  pandit={pandit}
                  index={i}
                  onClick={() => setSelected(pandit)}
                />
              ))}
        </div>
      </section>

      {/* Profile modal */}
      <AnimatePresence>
        {selected && (
          <ProfileModal pandit={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
