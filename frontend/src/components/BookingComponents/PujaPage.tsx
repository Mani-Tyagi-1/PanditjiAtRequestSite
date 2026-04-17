import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import BookingModal from "./UI/BookingModal";
import PujaEnquiryModal from "./PujaEnquiryModal";
import { decryptData } from "../../utils/encryption";

// ── Dummy Data ────────────────────────────────────────────────
const STATIC_INCLUDES = [
    "Trusted Pandit Ji",
    "Verified Background",
    "Vedic Rituals Followed",
    "Samagri Included",
    "Digital Prasad Kit",
    "Post-Puja Guidance",
];

// ── Sub-components ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-orange-500">
                {children}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-orange-200 to-transparent" />
        </div>
    );
}

function IncludePill({ text }: { text: string }) {
    return (
        <span className="flex items-center gap-1.5 bg-white border border-orange-100 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            <svg
                className="w-3.5 h-3.5 text-orange-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            {text}
        </span>
    );
}

function AccordionRow({
    title,
    content,
    defaultOpen = false,
}: {
    title: string;
    content: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${open ? "border-orange-300 shadow-sm" : "border-orange-100"
                }`}
        >
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
            >
                <span
                    className="text-stone-700 font-semibold"
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "15px",
                    }}
                >
                    {title}
                </span>
                <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${open ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-400"
                        }`}
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""
                            }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </span>
            </button>

            {open && (
                <div className="px-4 pb-4 text-stone-500 text-sm font-light leading-relaxed border-t border-orange-50 pt-3">
                    {content}
                </div>
            )}
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────
const INTREF_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function saveIntrefData(code: string, pujaId: string, bookingUrl: string) {
    const expires = new Date(Date.now() + INTREF_TTL_MS).toUTCString();
    const entry = { code, pujaId, bookingUrl, storedAt: Date.now() };
    document.cookie = `pjar_intref_data=${encodeURIComponent(JSON.stringify(entry))}; expires=${expires}; path=/; SameSite=Lax`;
}

// ── Main Page ──────────────────────────────────────────────────
export default function PujaDetailPage() {
    const { pujaId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, openLoginModal } = useAuth();

    const handleBack = () => {
        if (location.key !== "default") {
            navigate(-1);
        } else {
            navigate("/");
        }
    };
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [pendingBooking, setPendingBooking] = useState(false);
    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

    // Share state
    const [isSharingCode, setIsSharingCode] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);

    // ── Read ?intref=CODE from URL → store in cookie → clean URL ─
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const intref = params.get("intref");
        if (!intref) return;

        if (/^[A-Z0-9]{3,20}$/.test(intref)) {
            const bookingUrl = `${window.location.origin}/puja/${pujaId}`;
            saveIntrefData(intref, pujaId ?? "", bookingUrl);
        }

        // Remove intref from URL without adding a history entry
        params.delete("intref");
        const cleanSearch = params.toString();
        const cleanPath = location.pathname + (cleanSearch ? `?${cleanSearch}` : "");
        navigate(cleanPath, { replace: true });
    }, []); // run only once on mount — the param is in the initial URL

    // ── Share handler ─────────────────────────────────────────
    const handleShare = async () => {
        if (isSharingCode) return;
        const baseUrl = `${window.location.origin}/puja/${pujaId}`;

        // If not logged in, share plain URL
        if (!user) {
            try {
                if (navigator.share) {
                    await navigator.share({ title: pujaData?.poojaNameEng || "Puja", url: baseUrl });
                } else {
                    await navigator.clipboard.writeText(baseUrl);
                    setShareLinkCopied(true);
                    setTimeout(() => setShareLinkCopied(false), 2500);
                }
            } catch { /* user cancelled */ }
            return;
        }

        setIsSharingCode(true);
        try {
            const token = localStorage.getItem("user_token");
            const stored = localStorage.getItem("user_data");
            if (!token || !stored) throw new Error("not logged in");

            const userId = JSON.parse(stored)._id;
            const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";
            const res = await fetch(`${apiUrl}/users/${userId}/my-referral`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const decrypted = json?.encrypted ? decryptData(json.encrypted) : null;
            const code: string | undefined = decrypted?.userReferralCode;

            const shareUrl = code ? `${baseUrl}?intref=${code}` : baseUrl;
            const shareText = `Book ${pujaData?.poojaNameEng || "this Puja"} with PanditJi At Request!\n${shareUrl}`;

            if (navigator.share) {
                await navigator.share({ title: pujaData?.poojaNameEng || "Puja", text: shareText, url: shareUrl });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setShareLinkCopied(true);
                setTimeout(() => setShareLinkCopied(false), 2500);
            }
        } catch { /* user cancelled or error */ }
        finally {
            setIsSharingCode(false);
        }
    };

    useEffect(() => {
        if (user && pendingBooking) {
            setPendingBooking(false);
            setIsBookingModalOpen(true);
        }
    }, [user, pendingBooking]);

    useEffect(() => {
        const timer = setTimeout(() => setIsEnquiryOpen(true), 5000);
        return () => clearTimeout(timer);
    }, []);
    const [pujaData, setPujaData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPooja = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";
                const response = await fetch(`${apiUrl}/fetch-pooja-by-id/${pujaId}`);
                const data = await response.json();

                if (data && data.pooja) {
                    setPujaData(data.pooja);
                } else {
                    setPujaData(data);
                }
            } catch (err) {
                console.error("Error fetching puja details:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (pujaId) {
            fetchPooja();
        }
    }, [pujaId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!pujaData) {
        return (
            <div className="min-h-screen bg-[#FFFAF3] flex flex-col items-center justify-center text-center px-4">
                <span className="text-4xl mb-3">🕉</span>
                <h2 className="text-xl font-bold text-stone-800 font-serif">
                    Puja Not Found
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                    We couldn't find the requested puja details.
                </p>
            </div>
        );
    }

    const price = pujaData.poojaPriceOnline || pujaData.poojaPriceOffline || 0;
    const title = pujaData.poojaNameEng || "";
    const deity = pujaData.poojaGods?.[0] || "Divine Deity";
    const image = pujaData.poojaMainImage || pujaData.poojaCardImage || "";

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .detail-page { font-family: 'DM Sans', sans-serif; background: #FFFAF3; min-height: 100vh; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .img-zoom { transition: transform 0.5s cubic-bezier(.22,1,.36,1); }
        .img-wrap:hover .img-zoom { transform: scale(1.04); }
        @keyframes enquiryPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.7), 0 2px 14px rgba(22,163,74,0.4); transform: scale(1); }
          50%       { box-shadow: 0 0 0 8px rgba(22,163,74,0), 0 2px 20px rgba(22,163,74,0.6); transform: scale(1.04); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .enquiry-btn {
          animation: enquiryPulse 1.8s ease-in-out infinite;
          background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a);
          background-size: 200% auto;
        }
        .enquiry-btn:hover {
          animation: enquiryPulse 1.8s ease-in-out infinite, shimmer 1.2s linear infinite;
        }
      `}</style>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                pooja={pujaData}
            />

            <PujaEnquiryModal
                isOpen={isEnquiryOpen}
                onClose={() => setIsEnquiryOpen(false)}
                pujaId={pujaId || ""}
                pujaName={pujaData?.poojaNameEng || ""}
                prefillName={user?.name || user?.fullName || ""}
                prefillPhone={user?.phone || user?.mobileNumber || ""}
                prefillCity={user?.city || ""}
            />

            <div className="detail-page flex justify-center">
                <div className="w-full max-w-md bg-[#FFFAF3] min-h-screen relative shadow-sm pb-32">
                    {/* ── Header ── */}
                    <div className="relative px-4 pt-3 pb-3 text-center bg-gradient-to-br from-red-200 via-orange-200 to-amber-100 rounded-b-[60px] mb-5 shadow-sm">
                        <button
                            onClick={handleBack}
                            className="absolute left-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm"
                        >
                            <svg
                                className="w-4 h-4 text-stone-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        {/* Share button — top right */}
                        <button
                            onClick={handleShare}
                            disabled={isSharingCode}
                            className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm active:scale-90 transition-all disabled:opacity-60"
                            title="Share this puja"
                        >
                            {isSharingCode ? (
                                <svg className="w-4 h-4 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            ) : shareLinkCopied ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            )}
                        </button>

                        {/* "Link copied" toast */}
                        {shareLinkCopied && (
                            <div className="absolute right-2 top-14 bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg z-50 animate-fade-in">
                                Link copied!
                            </div>
                        )}

                        <h1
                            className="text-orange-600 font-extrabold"
                            style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "26px",
                            }}
                        >
                            {title}
                        </h1>
                        <p className="text-orange-900/50 text-xs font-medium mt-0.5">
                            {deity}
                        </p>

                        {/* Enquiry CTA */}
                        <button
                            onClick={() => setIsEnquiryOpen(true)}
                            className="enquiry-btn mt-3 inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 rounded-full active:scale-95"
                        >
                            {/* <span className="text-base">🙏</span> */}
                            Enquire Now for {title}
                            
                        </button>
                    </div>

                    {/* ── Content ── */}
                    <div className="px-4 space-y-5 fade-up">
                        {/* Hero Image */}
                        <div className="img-wrap rounded-2xl overflow-hidden shadow-md border border-orange-100 aspect-square bg-gradient-to-b from-amber-100 to-orange-50 flex items-center justify-center">
                            <img
                                src={image}
                                alt={title}
                                className="img-zoom w-full h-full object-contain"
                            />
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-orange-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                                {deity}
                            </span>
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                                ★ 4.9
                                <span className="text-stone-400 font-light ml-0.5">
                                    (312 reviews)
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-stone-400 text-xs ml-auto">
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                                2-3 hrs
                            </div>
                        </div>

                        {/* Includes */}
                        <div>
                            <SectionLabel>What's Included</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                                {STATIC_INCLUDES.map((inc) => (
                                    <IncludePill key={inc} text={inc} />
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Accordions */}
                        <div>
                            <SectionLabel>More Details</SectionLabel>
                            <div className="space-y-2">
                                {pujaData.poojaDescription && pujaData.poojaDescription.length > 0 ? (
                                    pujaData.poojaDescription.map((desc: any, index: number) => (
                                        <AccordionRow
                                            key={desc.headingId || desc.heading}
                                            title={desc.heading}
                                            defaultOpen={index < 2}
                                            content={
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: desc.description }}
                                                />
                                            }
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm font-medium text-stone-400">
                                        No additional details available.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Sticky Bottom CTA ── */}
                    <div className="fixed bottom-0 left-0 right-0 z-50">
                        <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-orange-100 px-4 py-3 flex items-center gap-3">
                            <div>
                                <p className="text-[10px] text-stone-400 font-light">
                                    Starting at
                                </p>
                                <p
                                    className="text-orange-600 font-bold text-lg leading-none"
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                >
                                    ₹{price.toLocaleString("en-IN")}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (window.fbq) {
                                        window.fbq("track", "AddToCart", {
                                            content_ids: [pujaId],
                                            content_name: title,
                                            content_type: "product",
                                            value: price,
                                            currency: "INR",
                                        });
                                    }
                                    if (user) {
                                        setIsBookingModalOpen(true);
                                    } else {
                                        setPendingBooking(true);
                                        openLoginModal();
                                    }
                                }}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Book Pandit Ji
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13 7l5 5-5 5M6 12h12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}