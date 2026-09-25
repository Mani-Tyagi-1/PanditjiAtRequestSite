import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Languages, BadgeCheck, ArrowLeft, Calendar, Briefcase, Smartphone, Globe, X, User, Phone, Check } from "lucide-react";
import API_URL from "../utils/apiConfig";
import { useAuth } from "../context/AuthContext";

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
          className={`${cls} ${i < full
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-stone-400 font-medium">{label}</p>
        <p className="text-xs text-stone-700 font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function PanditDetailPage() {
  const { panditId } = useParams<{ panditId: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [loading, setLoading] = useState(true);

  // Lead capture modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [bhaktName, setBhaktName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/pandits`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const found = data.data.find((p: Pandit) => p._id === panditId);
          setPandit(found || null);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [panditId]);

  const handleOpenModal = () => {
    if (user) {
      setBhaktName(user.name || "");
      setContactNumber(user.phone || "");
    } else {
      setBhaktName("");
      setContactNumber("");
    }
    setErrorMessage("");
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!bhaktName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    const cleanedPhone = contactNumber.replace(/\D/g, "").slice(-10);
    if (cleanedPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      let activeUser = user;

      if (!activeUser) {
        // Silently register/login the user
        const res = await fetch(`${API_URL}/login-by-phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanedPhone,
            name: bhaktName.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to confirm registration. Please try again.");
        }

        // Save session locally and globally inside context
        login(data.token, data.user);
        activeUser = data.user;
      }

      // Now call the /pandit-direct-bookings API endpoint
      const enquiryRes = await fetch(`${API_URL}/pandit-direct-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bhaktName.trim(),
          phone: cleanedPhone,
          panditId: pandit?._id,
          panditName: fullName,
          userId: activeUser?._id || activeUser?.id || undefined,
        }),
      });

      const enquiryData = await enquiryRes.json();
      if (!enquiryRes.ok) {
        throw new Error(enquiryData.message || "Failed to submit booking enquiry.");
      }

      // Store selected pandit details into localStorage
      localStorage.setItem("selected_pandit", JSON.stringify(pandit));

      // Close the lead modal & open the booking confirmation modal
      setIsBookingModalOpen(false);
      setIsBookingConfirmed(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please check your network or try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center w-full max-w-md mx-auto shadow-xl border-x border-orange-100">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 mt-3 font-medium">Loading Profile...</p>
      </div>
    );
  }

  if (!pandit) {
    return (
      <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center px-6 text-center w-full max-w-md mx-auto shadow-xl border-x border-orange-100">
        <span className="text-5xl block mb-2">🙏</span>
        <h2 className="text-sm font-bold text-stone-700">Profile Not Found</h2>
        <p className="text-xs text-stone-400 mt-1">This Pandit Ji profile could not be loaded or doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-orange-500 text-white font-bold text-xs px-6 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const fullName = `${pandit.prefix} ${pandit.firstName} ${pandit.lastName}`.trim();
  const location = [pandit.location?.city, pandit.location?.state, pandit.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#FFFAF3] pb-28 font-sans w-full max-w-md mx-auto shadow-xl relative border-x border-orange-100">
      {/* Hero */}
      <div className="relative h-80 bg-gradient-to-br from-orange-200 via-amber-100 to-orange-100 overflow-hidden">
        {pandit.profileImage ? (
          <img
            src={pandit.profileImage}
            alt={fullName}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            className="w-full h-full object-fill object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🙏</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>

        {pandit.isVerified && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/95 rounded-full px-3 py-1.5 shadow-md">
            <BadgeCheck className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Verified</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-12">
          <h1 className="text-white font-extrabold text-[26px] leading-tight drop-shadow-lg">{fullName}</h1>
          {location && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-300 shrink-0" />
              <span className="text-orange-50 text-xs font-medium">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative -mt-8 px-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-orange-100 bg-white rounded-2xl py-4 shadow-lg shadow-orange-100/60 border border-orange-100/70">
          <div className="flex flex-col items-center justify-center px-2">
            <p className="text-lg font-black text-stone-800 leading-none">{(pandit.rating ?? 5).toFixed(1)}</p>
            <div className="mt-1.5"><StarRating rating={pandit.rating ?? 5} /></div>
            <p className="text-[9px] text-stone-400 mt-1 font-bold uppercase tracking-wider">Rating</p>
          </div>
          <div className="flex flex-col items-center justify-center px-2">
            <p className="text-lg font-black text-orange-600 leading-none">{pandit.experienceInYears || 3}+</p>
            <p className="text-[9px] text-stone-400 mt-2.5 font-bold uppercase tracking-wider">Yrs Experience</p>
          </div>
          <div className="flex flex-col items-center justify-center px-2">
            <p className="text-lg font-black text-stone-800 leading-none capitalize">{pandit.gender || "—"}</p>
            <p className="text-[9px] text-stone-400 mt-2.5 font-bold uppercase tracking-wider">Gender</p>
          </div>
        </div>

        {/* Availability */}
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold ${pandit.isActive
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-stone-50 border-stone-200 text-stone-500"
          }`}>
          <span className="relative flex h-2.5 w-2.5">
            {pandit.isActive && <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${pandit.isActive ? "bg-green-500" : "bg-stone-400"}`} />
          </span>
          {pandit.isActive ? "Available for Puja right now" : "Currently offline / unavailable"}
        </div>

        {/* Languages & service modes */}
        {(pandit.languages?.length > 0 || pandit.serviceModes?.length > 0) && (
          <div className="bg-white rounded-2xl border border-orange-100/70 shadow-sm p-4 space-y-4">
            {pandit.languages?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-4 h-4 text-orange-500" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Languages</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pandit.languages.map((l) => (
                    <span key={l} className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {pandit.serviceModes?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Service Modes</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pandit.serviceModes.map((mode) => (
                    <span key={mode} className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200/70 capitalize">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details */}
        {(pandit.dob || pandit.mobileType || pandit.location?.address || pandit.location?.pincode) && (
          <div className="bg-white rounded-2xl border border-orange-100/70 shadow-sm divide-y divide-stone-100">
            {pandit.dob && (
              <DetailRow icon={<Calendar className="w-4 h-4 text-orange-500" />} label="Date of Birth" value={formatDate(pandit.dob)} />
            )}
            {pandit.mobileType && (
              <DetailRow icon={<Smartphone className="w-4 h-4 text-orange-500" />} label="Device" value={pandit.mobileType} />
            )}
            {pandit.location?.address && (
              <DetailRow icon={<MapPin className="w-4 h-4 text-orange-500" />} label="Address" value={pandit.location.address} />
            )}
            {pandit.location?.pincode && (
              <DetailRow icon={<Globe className="w-4 h-4 text-orange-500" />} label="Pincode" value={pandit.location.pincode} />
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom booking CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-orange-100 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_rgba(251,146,60,0.15)]">
          <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden border-2 border-orange-300 bg-orange-50 flex items-center justify-center text-lg">
            {pandit.profileImage ? (
              <img src={pandit.profileImage} alt="" className="w-full h-full object-cover object-top" />
            ) : "🙏"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider leading-none">Book directly</p>
            <p className="text-[13px] text-stone-800 font-bold mt-1 truncate">{pandit.prefix} {pandit.firstName}</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.97] transition-transform uppercase tracking-wider whitespace-nowrap"
          >
            Select Pandit Ji
          </button>
        </div>
      </div>

      {/* Lead Capture Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-300"
            onClick={() => setIsBookingModalOpen(false)}
          />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-orange-100 bg-[#FFFAF3] shadow-2xl transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]">

            {/* Top marigold banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#FFEDD5] via-[#FFF7ED] to-[#FEF3C7] px-5 pb-5 pt-6 text-center border-b border-orange-100/50 shrink-0">
              <div className="absolute inset-0 opacity-40">
                <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-orange-200 blur-2xl" />
                <div className="absolute top-8 right-0 h-24 w-24 rounded-full bg-amber-200 blur-2xl" />
              </div>

              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute right-4 top-4 z-20 rounded-full bg-white/80 p-2 text-stone-600 shadow-sm transition hover:bg-white active:scale-90"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="relative z-10 flex flex-col items-center">
                {pandit.profileImage ? (
                  <div className="mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-orange-400 bg-white shadow-md">
                    <img
                      src={pandit.profileImage}
                      alt={fullName}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md text-3xl border border-orange-200">
                    🙏
                  </div>
                )}

                <span className="mb-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                  Secure Reservation
                </span>

                <h3 className="text-lg font-bold text-stone-800">
                  BOOK {pandit.prefix} {pandit.firstName}
                </h3>

                <p className="mt-1 text-xs text-stone-500 leading-snug max-w-[280px]">
                  Fill your contact info below to proceed with reserving Pt. {pandit.firstName} for your ceremony.
                </p>
              </div>
            </div>

            {/* Scrollable Form & Info Area */}
            <div className="overflow-y-auto px-5 py-4 space-y-4">

              {/* Trust highlights card */}
              <div className="rounded-2xl border border-orange-100 bg-[#FFFDF9] p-3.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-50 border border-orange-200 text-orange-600 shrink-0">
                    <Check className="w-3.5 h-3.5 text-orange-600 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-stone-700 leading-none">Gurukul-trained Specialist</h4>
                    <p className="text-[10px] text-stone-500 mt-1 leading-normal">
                      Pt. {pandit.firstName} is highly verified in performing precise Vedic mantra chants.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-50 border border-orange-200 text-orange-600 shrink-0">
                    <Check className="w-3.5 h-3.5 text-orange-600 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-stone-700 leading-none">WhatsApp Confirmation</h4>
                    <p className="text-[10px] text-stone-500 mt-1 leading-normal">
                      Receive assignment confirmation, support details, and the samagri list directly on WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-50 border border-orange-200 text-orange-600 shrink-0">
                    <Check className="w-3.5 h-3.5 text-orange-600 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-stone-700 leading-none">Zero Upfront Charge</h4>
                    <p className="text-[10px] text-stone-500 mt-1 leading-normal">
                      Reserve your preferred date slot with no advance payment. Pay securely after the ritual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleConfirmBooking} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-600">
                    Bhakt Name <span className="text-orange-500">*</span>
                  </label>
                  <div className="flex items-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50/50 shadow-sm transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">
                    <div className="pl-3.5 text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={bhaktName}
                      onChange={(e) => setBhaktName(e.target.value)}
                      className="w-full bg-transparent px-3 py-3 text-xs font-semibold text-stone-700 outline-none placeholder:text-stone-400"
                      placeholder="Enter name for Puja Sankalp"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-600">
                    WhatsApp Mobile Number <span className="text-orange-500">*</span>
                  </label>
                  <div className={`flex items-center overflow-hidden rounded-xl border shadow-sm transition ${user
                    ? "border-stone-200 bg-stone-100/70"
                    : "border-stone-200 bg-stone-50/50 focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100"
                    }`}>
                    <div className="pl-3.5 text-stone-400 flex items-center gap-1 font-semibold text-xs border-r border-stone-200/60 pr-2">
                      <Phone className="w-4 h-4 text-stone-400" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={!!user}
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-transparent px-3 py-3 text-xs font-semibold text-stone-700 outline-none placeholder:text-stone-400 disabled:text-stone-400"
                      placeholder="10-digit WhatsApp number"
                    />
                  </div>
                  {user && (
                    <p className="text-[10px] text-stone-400 mt-1 font-medium italic">
                      ✓ Number verified & linked to your session.
                    </p>
                  )}
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[11px] text-red-600 font-semibold leading-normal">
                    ⚠️ {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl py-3.5 text-xs font-bold text-white uppercase tracking-wider shadow-md transition-all active:scale-[0.98] ${isSubmitting
                    ? "bg-stone-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-100 hover:scale-[1.01]"
                    }`}
                >
                  {isSubmitting ? "Confirming & Logging in..." : "Confirm Pandit Ji"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {isBookingConfirmed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-300"
            onClick={() => setIsBookingConfirmed(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-orange-100 bg-[#FFFAF3] shadow-2xl transition-all duration-300 transform scale-100 flex flex-col p-6 text-center">
            {/* Top marigold success icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-500 shadow-md">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <span className="mb-1 inline-flex items-center gap-1 self-center text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              Enquiry Confirmed
            </span>

            <h3 className="text-xl font-black text-stone-800 mt-2">
              Booking Request Received! 🙏
            </h3>

            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Your direct request for assigning <strong className="text-stone-700">{fullName}</strong> has been successfully submitted.
            </p>

            {/* Request Summary table */}
            <div className="mt-4 rounded-2xl border border-orange-100 bg-[#FFFDF9] p-3.5 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-orange-100/50 pb-2">
                <span className="text-stone-400 font-medium">Bhakt Name:</span>
                <span className="text-stone-700 font-bold">{bhaktName}</span>
              </div>
              <div className="flex justify-between border-b border-orange-100/50 pb-2">
                <span className="text-stone-400 font-medium">Contact:</span>
                <span className="text-stone-700 font-bold">+91 {contactNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-medium">Pandit Assigned:</span>
                <span className="text-stone-700 font-bold truncate max-w-[150px]">{fullName}</span>
              </div>
            </div>

            {/* WhatsApp coordinate info */}
            <div className="mt-4 rounded-xl bg-orange-50/50 border border-orange-100/60 p-3 text-center">
              <p className="text-[11px] font-semibold text-orange-700 leading-normal">
                💬 Our coordination team will contact you on WhatsApp shortly to lock in timings & samagri preferences.
              </p>
            </div>

            <p className="mt-3 text-[10px] text-stone-400 italic text-center">
              * Zero advance fees required. Pay securely on WhatsApp post-ritual coordination.
            </p>

            <button
              onClick={() => setIsBookingConfirmed(false)}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-100 active:scale-[0.98] transition-transform"
            >
              Done
            </button>

            {/* Actions */}
            {/* <div className="mt-5 space-y-2.5 shrink-0">
              <a
                href={`https://wa.me/919310065096?text=Namaste!%20I%20have%20just%20submitted%20a%20direct%20booking%20enquiry%20for%20Pt.%20${pandit?.firstName}%20${pandit?.lastName}.%20My%20name%20is%20${bhaktName}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-orange-100 hover:scale-[1.01] active:scale-[0.98] transition-transform uppercase tracking-wider"
              >
                Chat on WhatsApp
              </a>
              <button
                onClick={() => {
                  setIsBookingConfirmed(false);
                  navigate("/category/685b290c922c7df97c114213");
                }}
                className="w-full bg-white border border-stone-200 text-stone-600 font-bold text-xs py-3 rounded-xl hover:bg-stone-50 active:scale-95 transition-all uppercase tracking-wider"
              >
                Select Puja Category
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

