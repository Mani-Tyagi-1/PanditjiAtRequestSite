import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Phone,
    Mail,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Calendar,
    Clock,
    MapPin,
    Bookmark,
    Edit3,
    Share2,
    Copy,
    Check,
    Gift,
    X,
    Users,
    IndianRupee,
    Percent,
    Wallet,
    CalendarClock,
    CheckCircle2,
    MailOpen,
    Video,
    Star,
    Loader2,
    RefreshCw,
    MessageCircle,
    Sparkles,
    Landmark,
    Package,
    ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { decryptData, encryptPayload } from "../utils/encryption";
import API_URL from "../utils/apiConfig";
import { loadRazorpay, humanError, humanPaymentError } from "../data/vivahApi";

interface UserData {
    _id: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    phone: string;
    email?: string;
    gender?: string;
    dob?: string;
    birthTime?: string;
    birthPlace?: string;
    gotra?: string;
    picture?: string;
}

interface ReferralData {
    userReferralCode: string;
    referralEarnings: number;
    totalReferredPujas: number;
    referralPercentage: number;
}

interface ReferralBooking {
    bookingId: string;
    referredUserName: string;
    poojaName: string;
    amountEarned: number;
    totalBookingAmount: number;
    rewardPercentage: number;
    bookedAt: string;
}


const ProfileMenuItem = ({ icon: Icon, title, subtitle, onClick }: any) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-white rounded-2xl mb-3 shadow-sm border border-orange-50 active:scale-[0.98] transition-all"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#FF7000]" />
            </div>
            <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
);

const EditInput = ({ icon: Icon, label, value, onChange, disabled, type = "text", placeholder }: any) => (
    <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-2 ml-1">{label}</label>
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${disabled ? 'bg-gray-50 border-gray-100' : 'bg-white border-orange-100 focus-within:border-[#FF7000] shadow-sm'}`}>
            <Icon className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-[#FF7000]'}`} />
            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-300"
            />
        </div>
    </div>
);

/**
 * The signed-in user's id, straight off storage.
 *
 * `fetchUserBookings` runs from `fetchUserProfile` BEFORE `setUser` resolves,
 * so anything inside it that read `user?._id` from React state saw `null` and
 * silently skipped — which is exactly why the Vivah tab came up empty on every
 * cold load. Reading storage removes the ordering dependency entirely.
 */
const storedUserId = (): string => {
    try {
        return JSON.parse(localStorage.getItem("user_data") || "{}")?._id || "";
    } catch {
        return "";
    }
};

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { logout } = useAuth();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"view" | "edit" | "referral-bookings" | "bookings">("view");
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Referral state
    const [referralData, setReferralData] = useState<ReferralData | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Referral bookings state
    const [referralBookings, setReferralBookings] = useState<ReferralBooking[]>([]);
    const [referralBookingsLoading, setReferralBookingsLoading] = useState(false);

    // User bookings state
    const [poojaBookings, setPoojaBookings] = useState<any[]>([]);
    const [liveBookings, setLiveBookings] = useState<any[]>([]);
    const [chadhavaBookings, setChadhavaBookings] = useState<any[]>([]);
    const [directBookings, setDirectBookings] = useState<any[]>([]);
    const [shopifyOrders, setShopifyOrders] = useState<any[]>([]);
    const [vivahBookings, setVivahBookings] = useState<any[]>([]);
    // Vivah bookings move under the family's feet — ops assign a Pandit Ji,
    // tick rituals off and shift dates hours after booking. These back a quiet
    // re-read so the card is never a stale snapshot.
    const [vivahSyncedAt, setVivahSyncedAt] = useState<number>(0);
    const [vivahRefreshing, setVivahRefreshing] = useState(false);
    const vivahInFlight = useRef(false);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [activeBookingTab, setActiveBookingTab] = useState<"pooja" | "direct" | "live" | "chadhava" | "shopify" | "vivah">("pooja");

    // Payout state
    const [payoutModal, setPayoutModal] = useState<"confirm" | "not-allowed" | null>(null);
    const [payoutDone, setPayoutDone] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<UserData>>({});
    const [isSaving, setIsSaving] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: "error" | "info" | "success";
        onConfirm?: () => void;
    }>({
        show: false,
        title: "",
        message: "",
        type: "info",
    });

    const triggerAlert = (
        title: string,
        message: string,
        type: "error" | "info" | "success" = "info",
        onConfirm?: () => void
    ) => {
        setAlertConfig({ show: true, title, message, type, onConfirm });
    };

    const fetchReferralData = async (userId: string) => {
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = API_URL;
            const response = await axios.get(`${apiUrl}/users/${userId}/my-referral`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data?.encrypted) {
                const decrypted = decryptData(response.data.encrypted);
                if (decrypted?.success) {
                    setReferralData({
                        userReferralCode: decrypted.userReferralCode,
                        referralEarnings: decrypted.referralEarnings ?? 0,
                        totalReferredPujas: decrypted.totalReferredPujas ?? 0,
                        referralPercentage: decrypted.referralPercentage ?? 5,
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching referral data:", err);
        }
    };

    const handlePayoutRequest = () => {
        const today = new Date().getDate();
        if (today >= 1 && today <= 17) {
            setPayoutModal("confirm");
        } else {
            setPayoutModal("not-allowed");
        }
    };

    const openGmailPayout = () => {
        const stored = localStorage.getItem("user_data");
        const parsedUser = stored ? JSON.parse(stored) : null;

        const name = user
            ? `${user.given_name || ""} ${user.family_name || ""}`.trim() || user.name || "User"
            : parsedUser?.name || "User";
        const phone = user?.phone || parsedUser?.phone || "N/A";
        const userId = parsedUser?._id || "N/A";
        const code = referralData?.userReferralCode || "N/A";
        const amount = referralData?.referralEarnings ?? 0;

        const subject = encodeURIComponent(`Referral Payout Request – ${name}`);
        const body = encodeURIComponent(
            `Hello PanditJi At Request Team,\n\n` +
            `I would like to request a payout of my referral earnings.\n\n` +
            `Details:\n` +
            `  Name        : ${name}\n` +
            `  Phone       : ${phone}\n` +
            `  User ID     : ${userId}\n` +
            `  Referral Code : ${code}\n` +
            `  Amount      : ₹${amount}\n\n` +
            `Please process the payout at the earliest convenience.\n\n` +
            `Thank you.`
        );

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=vedicvaibhav92%40gmail.com&su=${subject}&body=${body}`;
        window.open(gmailUrl, "_blank", "noopener,noreferrer");

        setPayoutModal(null);
        setPayoutDone(true);
        setTimeout(() => setPayoutDone(false), 4000);
    };

    const fetchReferralBookings = async (userId: string) => {
        setReferralBookingsLoading(true);
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = API_URL;
            const response = await axios.get(`${apiUrl}/users/${userId}/referral-bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data?.encrypted) {
                const decrypted = decryptData(response.data.encrypted);
                if (decrypted?.success) {
                    setReferralBookings(decrypted.referralBookings || []);
                }
            }
        } catch (err) {
            console.error("Error fetching referral bookings:", err);
        } finally {
            setReferralBookingsLoading(false);
        }
    };

    /**
     * Re-read ONLY the vivah bookings.
     *
     * Deliberately narrow: refetching all six booking types every 45 seconds
     * to watch one tab would hammer five endpoints nobody is looking at. It is
     * also silent — no spinner over the list, no error banner — because this
     * runs unprompted and a failed background poll is not the family's problem.
     * The card keeps showing the last good data and the "Updated N min ago"
     * label tells the truth about how fresh it is.
     */
    const refreshVivahBookings = async () => {
        if (vivahInFlight.current) return;
        const token = localStorage.getItem("user_token");
        const uid = user?._id || storedUserId();
        if (!token || !uid) return;
        vivahInFlight.current = true;
        setVivahRefreshing(true);
        try {
            const { data } = await axios.get(
                `${API_URL}/bookings/vedic-vivah/user/${uid}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data?.bookings) {
                setVivahBookings(data.bookings);
                setVivahSyncedAt(Date.now());
            }
        } catch (err) {
            // Silent by design — see the note above.
            console.error("[Vivah] background refresh failed", err);
        } finally {
            vivahInFlight.current = false;
            setVivahRefreshing(false);
        }
    };

    /**
     * Poll while the Vivah tab is actually on screen, and catch up the moment
     * the family comes back to the tab. Paused when the document is hidden so
     * a backgrounded phone isn't spending someone's data all afternoon.
     */
    useEffect(() => {
        if (activeBookingTab !== "vivah" || !(user?._id || storedUserId())) return;
        if (!vivahSyncedAt) void refreshVivahBookings();

        const tick = () => {
            if (document.visibilityState === "visible") void refreshVivahBookings();
        };
        const id = window.setInterval(tick, 45_000);
        window.addEventListener("focus", tick);
        document.addEventListener("visibilitychange", tick);
        return () => {
            window.clearInterval(id);
            window.removeEventListener("focus", tick);
            document.removeEventListener("visibilitychange", tick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBookingTab, user?._id]);

    const fetchUserBookings = async (phone: string, userIdArg?: string) => {
        setBookingsLoading(true);
        try {
            const apiUrl = API_URL;
            const cleanPhone = String(phone).replace(/\D/g, "");

            const [poojaRes, chadhavaRes, directRes, kashiRes, shopifyRes] = await Promise.all([
                axios.get(`${apiUrl}/bookings/get-pending-poojabookings/${cleanPhone}`),
                axios.get(`${apiUrl}/chadhava-bookings/user/${cleanPhone}`),
                axios.get(`${apiUrl}/pandit-direct-bookings/user/${cleanPhone}`),
                axios.get(`${apiUrl}/kashi-requests/user/${cleanPhone}`),
                axios.get(`${apiUrl}/shopify-orders/user/${cleanPhone}`).catch((err) => {
                    console.error("Error fetching Shopify orders:", err);
                    return { data: { success: true, data: [] } };
                })
            ]);

            // Vedic Vivah bookings are scoped to the AUTHENTICATED user (they
            // carry birth details and kundali images, so the server ignores any
            // id in the URL and reads it off the token). Fetched separately —
            // and tolerantly — so a signed-out or expired session degrades to an
            // empty Vivah tab instead of blanking every other tab.
            let vivahList: any[] = [];
            try {
                const vivahToken = localStorage.getItem("user_token");
                // NOT `user?._id` — see storedUserId(). This runs before the
                // profile response lands, so React state is still null here.
                const vivahUserId = userIdArg || user?._id || storedUserId();
                if (vivahToken && vivahUserId) {
                    const vivahRes = await axios.get(
                        `${apiUrl}/bookings/vedic-vivah/user/${vivahUserId}`,
                        { headers: { Authorization: `Bearer ${vivahToken}` } }
                    );
                    vivahList = vivahRes.data?.bookings || [];
                }
            } catch (err) {
                console.error("Error fetching Vivah bookings:", err);
            }

            const allPoojaBookings: any[] = poojaRes.data || [];
            // Split: regular puja bookings vs live mandir bookings (isLiveMandir: true)
            const regularBookings = allPoojaBookings.filter((b: any) => !b.isLiveMandir);
            const liveMandirBookings = allPoojaBookings.filter((b: any) => b.isLiveMandir === true);

            // Kashi Ji requests are shown alongside Direct Pandit bookings. Map them
            // into the same shape the DirectBookingCard expects.
            const kashiRequests = (kashiRes.data?.data || []).map((k: any) => ({
                _id: k._id,
                name: k.devoteeName,
                phone: k.mobileNumber,
                panditName: "Kashi Ji Pandit",
                status: k.status,
                createdAt: k.addedOn || k.createdAt,
                ritualDetails: k.ritualDetails,
                isKashi: true,
            }));
            const mergedDirect = [...(directRes.data?.data || []), ...kashiRequests].sort(
                (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );

            setPoojaBookings(regularBookings);
            setLiveBookings(liveMandirBookings);
            setChadhavaBookings(chadhavaRes.data?.data || []);
            setDirectBookings(mergedDirect);
            setShopifyOrders(shopifyRes.data?.data || []);
            setVivahBookings(vivahList);
            setVivahSyncedAt(Date.now());
        } catch (err) {
            console.error("Error fetching user bookings:", err);
        } finally {
            setBookingsLoading(false);
        }
    };

    const startCall = async (panditId: string, type: 'video' | 'audio' = 'video') => {
        try {
            const userDataString = localStorage.getItem("user_data");
            if (!userDataString) return;
            const user = JSON.parse(userDataString);

            const baseCallId = crypto.randomUUID();
            const callId = type === "audio" ? `${baseCallId}_AC` : `${baseCallId}_VC`;
            const apiUrl = API_URL;
            const status = type === "video" ? "ringing" : "call-ringing";

            await axios.post(`${apiUrl}/calls/invite`, {
                fromUserId: user._id,
                toUserId: panditId,
                callId,
                callerName: user.name || user.userName || "User",
                callerId: user._id,
                fromAppType: "user",
                toAppType: "pandit",
                callType: type,
                status: status,
            });

            if (type === 'video') {
                navigate(`/video-call/${callId}/${panditId}`, { replace: true });
            } else {
                navigate(`/audio-call/${callId}/${panditId}`, { replace: true });
            }
        } catch (err) {
            console.error("Error starting call:", err);
            triggerAlert("Call Error", "Failed to start call. Please try again.", "error");
        }
    };

    const handleCopyCode = async () => {
        if (!referralData?.userReferralCode) return;
        try {
            await navigator.clipboard.writeText(referralData.userReferralCode);
        } catch {
            // clipboard API unavailable — silently ignore
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (!referralData?.userReferralCode) return;
        const shareText = `Book a Pandit easily with PanditJi At Request! Use my referral code *${referralData.userReferralCode}* and earn ${referralData.referralPercentage}% rewards. Download now: https://panditjiatrequest.com`;
        if (navigator.share) {
            try {
                await navigator.share({ title: "PanditJi At Request", text: shareText });
                return;
            } catch {
                // user cancelled — fall through to modal
            }
        }
        setShowShareModal(true);
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("user_token");
            const userDataString = localStorage.getItem("user_data");

            if (!token || !userDataString) {
                navigate("/");
                return;
            }

            const storedUser = JSON.parse(userDataString);
            const userId = storedUser._id;
            const phone = storedUser.phone;

            // Fetch referral data in parallel (non-blocking)
            fetchReferralData(userId);
            if (phone) {
                fetchUserBookings(phone, userId);
            }

            const apiUrl = API_URL;
            const response = await axios.get(`${apiUrl}/profile/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.encrypted) {
                const decrypted = decryptData(response.data.encrypted);
                if (decrypted && decrypted.user) {
                    setUser(decrypted.user);
                    setFormData(decrypted.user);
                } else {
                    setError("Failed to process user data.");
                }
            }
        } catch (err: any) {
            console.error("Error fetching profile:", err);
            setError(err.response?.data?.message || "Failed to fetch profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Razorpay checkout script — needed by the Vivah "pay balance" action on a
    // booking card. Injected once; harmless when the family never uses it.
    useEffect(() => {
        const SRC = "https://checkout.razorpay.com/v1/checkout.js";
        if (document.querySelector(`script[src="${SRC}"]`)) return;
        const script = document.createElement("script");
        script.src = SRC;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Open the "My Bookings" view on the right tab when the URL has ?tab=...
    // e.g. /account?tab=live → Live Puja tab, /account?tab=chadhava → Chadhava tab.
    // Any tab value (including "bookings") opens the bookings view; unknown values
    // fall back to the Puja tab.
    useEffect(() => {
        const tab = (searchParams.get("tab") || "").toLowerCase();
        if (!tab) return;
        const map: Record<string, "pooja" | "direct" | "live" | "chadhava" | "shopify" | "vivah"> = {
            pooja: "pooja",
            puja: "pooja",
            direct: "direct",
            live: "live",
            chadhava: "chadhava",
            shopify: "shopify",
            shop: "shopify",
            vivah: "vivah",
            marriage: "vivah",
        };
        setMode("bookings");
        if (map[tab]) setActiveBookingTab(map[tab]);
    }, [searchParams]);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate("/");
        setIsLogoutModalOpen(false);
    };

    const handleSave = async () => {
        if (!user?._id) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("user_token");
            const apiUrl = API_URL;

            // Prepare payload
            const payload = {
                firstname: formData.given_name,
                lastname: formData.family_name,
                phone: formData.phone,
                gender: formData.gender,
                dob: formData.dob,
                email: formData.email,
                birthTime: formData.birthTime,
                birthPlace: formData.birthPlace,
                gotra: formData.gotra
            };

            // Use the standard encryptPayload helper
            const encryptedPayload = encryptPayload(payload);

            await axios.put(`${apiUrl}/updateProfile/${user._id}`,
                encryptedPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local state
            await fetchUserProfile();
            setMode("view");
        } catch (err: any) {
            console.error("Error updating profile:", err);
            triggerAlert("Update Failed", err.response?.data?.message || "Failed to update profile.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FFFAF5]">
                <div className="w-10 h-10 border-4 border-[#FF7000] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] p-6 text-center">
                <div className="bg-white p-8 rounded-[32px] shadow-lg border border-orange-50 max-w-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6 text-sm">{error}</p>
                    <button
                        onClick={() => { setError(null); fetchUserProfile(); }}
                        className="w-full bg-[#FF7000] text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-600 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const isLockedView = mode === "referral-bookings" || mode === "bookings";

    return (
        <div className={`font-sans flex justify-center ${isLockedView ? "h-screen overflow-hidden" : "min-h-screen"}`}>
            <div className={`w-full max-w-md bg-white shadow-sm relative ${isLockedView ? "h-screen overflow-hidden" : "min-h-screen pb-24"}`}>
                <AnimatePresence mode="wait">
                    {mode === "view" && (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="px-4"
                        >
                            {/* Navigation Header */}
                            <div className="flex items-center gap-4 pt-6 pb-2">
                                <button
                                    onClick={() => navigate("/home")}
                                    className="p-2 rounded-full bg-white shadow-sm border border-orange-50 active:scale-90 transition-all text-[#FF7000]"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <h1 className="text-xl font-bold text-gray-800">Profile</h1>
                            </div>

                            {/* Header Profile Card */}
                            <div className="mt-4 mb-8">
                                <div className="relative bg-[#FFEDE0] rounded-[32px] p-6 pt-10 overflow-hidden border border-orange-100 shadow-sm">
                                    {/* Decorative circles */}
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-orange-200/30 rounded-full -translate-x-12 -translate-y-12" />

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-orange-100">
                                            <img
                                                src={user?.picture || "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png"}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                                                {user?.given_name} {user?.family_name}
                                            </h2>
                                            <div className="flex items-center gap-1 mt-1 text-gray-500 mb-4">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span className="text-sm">+91 {user?.phone}</span>
                                            </div>
                                            <button
                                                onClick={() => setMode("edit")}
                                                className="flex items-center gap-2 bg-[#FF7000] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Referral Rewards Card */}
                            {referralData && (
                                <div className="mb-4 bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
                                    {/* Top row */}
                                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <Gift className="w-5 h-5 text-[#FF7000]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-gray-800 text-sm">Referral Rewards</span>
                                                    <span className="bg-[#FF7000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {referralData.referralPercentage}% Reward
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">Share PanditJi links to earn rewards</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center border-t border-orange-50">
                                        <div className="flex-1 flex flex-col items-center py-3">
                                            <span className="text-lg font-bold text-[#FF7000]">₹{referralData.referralEarnings}</span>
                                            <span className="text-[11px] text-gray-400 mt-0.5">Total Earned</span>
                                        </div>
                                        <div className="w-px h-10 bg-orange-100" />
                                        <div className="flex-1 flex flex-col items-center py-3">
                                            <span className="text-lg font-bold text-[#FF7000]">{referralData.totalReferredPujas}</span>
                                            <span className="text-[11px] text-gray-400 mt-0.5">Pujas Referred</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="space-y-1">
                                <ProfileMenuItem
                                    icon={User}
                                    title="My Profile"
                                    subtitle="Tap to open"
                                    onClick={() => setMode("edit")}
                                />
                                {/* <ProfileMenuItem
                                icon={Users}
                                title="Family"
                                subtitle="Tap to open"
                                onClick={() => { }}
                            /> */}
                                <ProfileMenuItem
                                    icon={Calendar}
                                    title="My Bookings"
                                    subtitle="Pujas, Live Mandir & Chadhavas"
                                    onClick={() => {
                                        setMode("bookings");
                                        const stored = localStorage.getItem("user_data");
                                        if (stored) {
                                            fetchUserBookings(JSON.parse(stored).phone);
                                        }
                                    }}
                                />
                                <ProfileMenuItem
                                    icon={Users}
                                    title="Referral Bookings"
                                    subtitle="Pujas booked via your referral"
                                    onClick={() => {
                                        const stored = localStorage.getItem("user_data");
                                        if (stored) fetchReferralBookings(JSON.parse(stored)._id);
                                        setMode("referral-bookings");
                                    }}
                                />
                                {/* <ProfileMenuItem
                                icon={Info}
                                title="About Us"
                                subtitle="Tap to open"
                                onClick={() => navigate("/about")}
                            /> */}
                                {/* <ProfileMenuItem
                                icon={HelpCircle}
                                title="FAQs & Help Center"
                                subtitle="Tap to open"
                                onClick={() => navigate("/help")}
                            /> */}
                            </div>

                            {/* Logout Section */}
                            <div className="mt-12 flex flex-col items-center gap-6">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-red-100 text-red-500 font-bold bg-white shadow-sm active:scale-95 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Log Out
                                </button>

                                <div className="flex flex-col items-center opacity-50 pointer-events-none scale-90">
                                    <img src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png" alt="Emblem" className="w-20 h-20 object-contain mb-2" />
                                    <span className="text-xs font-semibold text-gray-400">ver 2.41</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mode === "edit" && (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="min-h-screen bg-[#FFF8F3]"
                        >
                            {/* Compact Header */}
                            <div className="bg-gradient-to-br from-[#FF7000] to-[#FF9A45] px-4 pt-5 pb-14 relative">
                                <div className="flex items-center gap-3 text-white mb-0">
                                    <button
                                        onClick={() => setMode("view")}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all border border-white/20"
                                        aria-label="Back to Profile"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold leading-tight">Edit Profile</h1>
                                        <p className="text-white/75 text-[10px]">Personal & astro details for accurate Pooja</p>
                                    </div>
                                </div>

                                {/* Profile card overlap */}
                                <div className="absolute left-4 right-4 -bottom-10">
                                    <div className="bg-white rounded-2xl px-5 py-3 flex items-center gap-4 shadow-lg border border-orange-100">
                                        <div className="w-14 h-14 rounded-full border-2 border-orange-200 overflow-hidden bg-orange-50 flex-shrink-0">
                                            <img
                                                src={user?.picture || "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png"}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-800 font-bold text-sm leading-tight">{user?.given_name} {user?.family_name}</h3>
                                            <p className="text-orange-400 text-xs">{user?.phone ? `+91 ${user.phone}` : ""}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form — desktop gets 2-col grid */}
                            <div className="px-4 mt-12 pb-6 mx-auto">
                                <div className="grid grid-cols-1 gap-3">

                                    {/* Basic Details */}
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <User className="w-3.5 h-3.5 text-[#FF7000]" />
                                            </div>
                                            <h2 className="font-bold text-gray-800 text-sm">Basic Details</h2>
                                        </div>

                                        <EditInput
                                            label="First Name"
                                            icon={Edit3}
                                            value={formData.given_name}
                                            onChange={(v: string) => setFormData({ ...formData, given_name: v })}
                                        />
                                        <EditInput
                                            label="Last Name"
                                            icon={Edit3}
                                            value={formData.family_name}
                                            onChange={(v: string) => setFormData({ ...formData, family_name: v })}
                                        />
                                        <EditInput
                                            label="Mobile Number"
                                            icon={Phone}
                                            value={formData.phone}
                                            disabled={true}
                                        />
                                        <p className="text-[10px] text-gray-400 -mt-2 mb-3 ml-1">Mobile number cannot be changed</p>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-semibold text-gray-700 ml-1">Gender</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Male", "Female", "Other"].map((g) => (
                                                    <button
                                                        key={g}
                                                        onClick={() => setFormData({ ...formData, gender: g })}
                                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all text-xs font-medium ${formData.gender === g ? 'bg-[#FF7000] border-[#FF7000] text-white shadow-md shadow-orange-100' : 'bg-orange-50/60 border-orange-100 text-gray-500 hover:border-orange-200'}`}
                                                    >
                                                        <User className="w-3 h-3" />
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Astro Details */}
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <Bookmark className="w-3.5 h-3.5 text-[#FF7000]" />
                                            </div>
                                            <h2 className="font-bold text-gray-800 text-sm">Astro Details</h2>
                                        </div>

                                        <EditInput
                                            label="Date of Birth"
                                            icon={Calendar}
                                            type="date"
                                            value={formData.dob}
                                            onChange={(v: string) => setFormData({ ...formData, dob: v })}
                                        />
                                        <EditInput
                                            label="Birth Time"
                                            icon={Clock}
                                            type="time"
                                            value={formData.birthTime}
                                            onChange={(v: string) => setFormData({ ...formData, birthTime: v })}
                                        />
                                        <EditInput
                                            label="Birth Place"
                                            icon={MapPin}
                                            placeholder="Enter birth city"
                                            value={formData.birthPlace}
                                            onChange={(v: string) => setFormData({ ...formData, birthPlace: v })}
                                        />
                                        <EditInput
                                            label="Gotra"
                                            icon={Bookmark}
                                            placeholder="Enter your gotra"
                                            value={formData.gotra}
                                            onChange={(v: string) => setFormData({ ...formData, gotra: v })}
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Helps Purohit perform Sankalp correctly.</p>
                                    </div>

                                    {/* Contact */}
                                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <Mail className="w-3.5 h-3.5 text-[#FF7000]" />
                                            </div>
                                            <h2 className="font-bold text-gray-800 text-sm">Contact</h2>
                                        </div>
                                        <div>
                                            <EditInput
                                                label="Email"
                                                icon={Mail}
                                                type="email"
                                                value={formData.email}
                                                onChange={(v: string) => setFormData({ ...formData, email: v })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button + note */}
                                <div className="mt-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full bg-[#FF7000] hover:bg-[#e56200] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 transition-all active:scale-[0.98] text-sm"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <p className="text-center text-[10px] text-gray-400 mt-2">
                                        Your details are used only to perform Pooja correctly and securely.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mode === "referral-bookings" && (
                        <motion.div
                            key="referral-bookings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-screen bg-[#FFF8F3] relative flex flex-col overflow-hidden"
                        >
                            {/* Background watermark emblem */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <img
                                    src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="w-72 h-72 object-contain opacity-[0.2] select-none"
                                />
                            </div>

                            {/* Header — fixed height, never scrolls */}
                            <div className="relative z-10 flex-shrink-0 bg-gradient-to-br from-[#FF7000] to-[#FF9A45] px-4 pt-5 pb-6">
                                <div className="flex items-center gap-3 text-white">
                                    <button
                                        onClick={() => setMode("view")}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all border border-white/20"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold leading-tight">Referral Bookings</h1>
                                        <p className="text-white/75 text-[10px]">Pujas booked via your referral code</p>
                                    </div>
                                </div>

                                {/* Summary pills */}
                                {referralData && (
                                    <div className="flex gap-3 mt-4">
                                        <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2.5">
                                            <IndianRupee className="w-4 h-4 text-white/80 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold text-base leading-none">₹{referralData.referralEarnings}</p>
                                                <p className="text-white/70 text-[10px] mt-0.5">Total Earned</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2.5">
                                            <Users className="w-4 h-4 text-white/80 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold text-base leading-none">{referralData.totalReferredPujas}</p>
                                                <p className="text-white/70 text-[10px] mt-0.5">Pujas Referred</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-2xl px-3 py-2.5">
                                            <Percent className="w-4 h-4 text-white/80 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold text-base leading-none">{referralData.referralPercentage}%</p>
                                                <p className="text-white/70 text-[10px] mt-0.5">Reward Rate</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* List — scrolls independently, header stays fixed */}
                            <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3 scrollbar-hide">
                                {referralBookingsLoading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="w-9 h-9 border-4 border-[#FF7000] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : referralBookings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                            <Gift className="w-8 h-8 text-orange-300" />
                                        </div>
                                        <p className="text-gray-700 font-semibold text-sm">No referral bookings yet</p>
                                        <p className="text-gray-400 text-xs mt-1 max-w-[220px]">
                                            Share your referral code with friends. When they book a puja, it shows here.
                                        </p>
                                    </div>
                                ) : (
                                    referralBookings.map((booking) => (
                                        <div
                                            key={booking.bookingId}
                                            className="bg-white rounded-2xl border border-orange-50 shadow-sm overflow-hidden"
                                        >
                                            {/* Top row */}
                                            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate">{booking.poojaName}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Users className="w-3 h-3 shrink-0" />
                                                        {booking.referredUserName}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">
                                                    +₹{booking.amountEarned}
                                                </span>
                                            </div>

                                            {/* Divider + meta */}
                                            <div className="flex items-center border-t border-orange-50">
                                                <div className="flex-1 px-4 py-2">
                                                    <p className="text-[10px] text-gray-400">Booking Value</p>
                                                    <p className="text-xs font-semibold text-gray-700">₹{booking.totalBookingAmount}</p>
                                                </div>
                                                <div className="w-px h-8 bg-orange-50" />
                                                <div className="flex-1 px-4 py-2">
                                                    <p className="text-[10px] text-gray-400">Reward</p>
                                                    <p className="text-xs font-semibold text-gray-700">{booking.rewardPercentage}%</p>
                                                </div>
                                                <div className="w-px h-8 bg-orange-50" />
                                                <div className="flex-1 px-4 py-2">
                                                    <p className="text-[10px] text-gray-400">Date</p>
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        {new Date(booking.bookedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sticky payout button */}
                            {referralData && referralData.referralEarnings > 0 && (
                                <div className="fixed bottom-0 left-0 right-0 z-40">
                                    <div className="w-full max-w-md mx-auto px-4 py-3 bg-white/90 backdrop-blur-md border-t border-orange-100">
                                        {payoutDone ? (
                                            <div className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-green-50 border border-green-100 text-green-600 font-bold text-sm">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Payout request submitted!
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handlePayoutRequest}
                                                className="w-full flex items-center justify-center gap-2 bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all text-sm"
                                            >
                                                <Wallet className="w-4 h-4" />
                                                Request Payout  •  ₹{referralData.referralEarnings}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {mode === "bookings" && (
                        <motion.div
                            key="bookings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-screen bg-[#FFF8F3] relative flex flex-col overflow-hidden"
                        >
                            {/* Background watermark emblem */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <img
                                    src="https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="w-72 h-72 object-contain opacity-[0.2] select-none"
                                />
                            </div>

                            {/* Header */}
                            <div className="relative z-10 flex-shrink-0 bg-gradient-to-br from-[#FF7000] to-[#FF9A45] px-4 pt-5 pb-5">
                                <div className="flex items-center gap-3 text-white">
                                    <button
                                        onClick={() => setMode("view")}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all border border-white/20"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold leading-tight">My Bookings</h1>
                                        <p className="text-white/75 text-[10px]">Track and view all your sacred bookings</p>
                                    </div>
                                </div>

                                {/* Custom Tab Switcher */}
                                <div className="flex bg-white/10 p-1 rounded-2xl mt-4 border border-white/10 overflow-x-auto scrollbar-hide">
                                    <button
                                        onClick={() => setActiveBookingTab("pooja")}
                                        className={`flex-grow py-2 px-1.5 rounded-xl text-[10px] font-bold text-center transition-all shrink-0 ${
                                            activeBookingTab === "pooja"
                                                ? "bg-white text-[#FF7000] shadow-sm"
                                                : "text-white hover:bg-white/5"
                                        }`}
                                    >
                                        Puja ({poojaBookings.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveBookingTab("direct")}
                                        className={`flex-grow py-2 px-1.5 rounded-xl text-[10px] font-bold text-center transition-all shrink-0 ${
                                            activeBookingTab === "direct"
                                                ? "bg-white text-[#FF7000] shadow-sm"
                                                : "text-white hover:bg-white/5"
                                        }`}
                                    >
                                        Direct Pandit ({directBookings.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveBookingTab("live")}
                                        className={`flex-grow py-2 px-1.5 rounded-xl text-[10px] font-bold text-center transition-all shrink-0 ${
                                            activeBookingTab === "live"
                                                ? "bg-white text-[#FF7000] shadow-sm"
                                                : "text-white hover:bg-white/5"
                                        }`}
                                    >
                                        Live Puja ({liveBookings.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveBookingTab("chadhava")}
                                        className={`flex-grow py-2 px-1.5 rounded-xl text-[10px] font-bold text-center transition-all shrink-0 ${
                                            activeBookingTab === "chadhava"
                                                ? "bg-white text-[#FF7000] shadow-sm"
                                                : "text-white hover:bg-white/5"
                                        }`}
                                    >
                                        Chadhava ({chadhavaBookings.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveBookingTab("shopify")}
                                        className={`flex-grow py-2 px-1.5 rounded-xl text-[10px] font-bold text-center transition-all shrink-0 ${
                                            activeBookingTab === "shopify"
                                                ? "bg-white text-[#FF7000] shadow-sm"
                                                : "text-white hover:bg-white/5"
                                        }`}
                                    >
                                        Shop Orders ({shopifyOrders.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveBookingTab("vivah")}
                                        className={`flex-grow py-2 px-1.5 rounded-xl text-[10px] font-bold text-center transition-all shrink-0 ${
                                            activeBookingTab === "vivah"
                                                ? "bg-white text-[#FF7000] shadow-sm"
                                                : "text-white hover:bg-white/5"
                                        }`}
                                    >
                                        Vivah ({vivahBookings.length})
                                    </button>
                                </div>
                            </div>

                            {/* Bookings List Container */}
                            <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3.5 scrollbar-hide">
                                {bookingsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <Loader2 className="w-9 h-9 text-[#FF7000] animate-spin" />
                                        <p className="text-xs text-orange-400 font-semibold">Loading bookings...</p>
                                    </div>
                                ) : activeBookingTab === "pooja" ? (
                                    poojaBookings.length === 0 ? (
                                        <EmptyBookingsState type="Puja" />
                                    ) : (
                                        poojaBookings.map((booking, idx) => (
                                            <PoojaBookingCard key={booking._id || idx} booking={booking} index={idx} startCall={startCall} navigate={navigate} />
                                        ))
                                    )
                                ) : activeBookingTab === "direct" ? (
                                    directBookings.length === 0 ? (
                                        <EmptyBookingsState type="Direct Pandit" />
                                    ) : (
                                        directBookings.map((booking, idx) => (
                                            <DirectBookingCard key={booking._id || idx} booking={booking} index={idx} />
                                        ))
                                    )
                                ) : activeBookingTab === "live" ? (
                                    liveBookings.length === 0 ? (
                                        <EmptyBookingsState type="Live Puja" />
                                    ) : (
                                        liveBookings.map((booking, idx) => (
                                            <LiveBookingCard key={booking._id || idx} booking={booking} index={idx} />
                                        ))
                                    )
                                ) : activeBookingTab === "shopify" ? (
                                    shopifyOrders.length === 0 ? (
                                        <EmptyBookingsState type="Shop" />
                                    ) : (
                                        shopifyOrders.map((order, idx) => (
                                            <ShopifyOrderCard key={order._id || idx} order={order} index={idx} />
                                        ))
                                    )
                                ) : activeBookingTab === "vivah" ? (
                                    vivahBookings.length === 0 ? (
                                        <EmptyBookingsState type="Vivah" />
                                    ) : (
                                        vivahBookings.map((booking, idx) => (
                                            <VivahBookingCard
                                                key={booking._id || idx}
                                                booking={booking}
                                                index={idx}
                                                onRefresh={refreshVivahBookings}
                                                refreshing={vivahRefreshing}
                                                lastSyncedAt={vivahSyncedAt}
                                            />
                                        ))
                                    )
                                ) : (
                                    chadhavaBookings.length === 0 ? (
                                        <EmptyBookingsState type="Chadhava" />
                                    ) : (
                                        chadhavaBookings.map((booking, idx) => (
                                            <ChadhavaBookingCard key={booking._id || idx} booking={booking} index={idx} />
                                        ))
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Share Referral Modal */}
                <AnimatePresence>
                    {showShareModal && referralData && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowShareModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-6 shadow-2xl"
                            >
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex flex-col items-center text-center pt-2">
                                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
                                        <Gift className="w-7 h-7 text-[#FF7000]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Your Referral Code</h2>
                                    <p className="text-xs text-gray-400 mt-1 mb-5">
                                        Share this code with friends. You earn{" "}
                                        <span className="text-[#FF7000] font-semibold">{referralData.referralPercentage}%</span> when they book a Puja.
                                    </p>

                                    {/* Code display */}
                                    <div className="flex items-center gap-3 w-full bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-4">
                                        <span className="flex-1 text-center text-xl font-bold tracking-widest text-[#FF7000]">
                                            {referralData.userReferralCode}
                                        </span>
                                        <button
                                            onClick={handleCopyCode}
                                            className="flex items-center gap-1.5 bg-[#FF7000] text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-90 transition-all shadow-md shadow-orange-100"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleNativeShare}
                                        className="w-full flex items-center justify-center gap-2 bg-[#FF7000] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share with Friends
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Payout Confirm Modal (date 1–6) ── */}
                <AnimatePresence>
                    {payoutModal === "confirm" && referralData && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setPayoutModal(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-7 shadow-2xl"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                        <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-[#FF7000]" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-1">Request Payout</h2>
                                    <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                                        This will open Gmail with a pre-filled request to our team.
                                        Just hit <span className="font-bold text-gray-600">Send</span> and we'll process
                                        your payout within 3–5 business days.
                                    </p>

                                    {/* Amount + recipient pill */}
                                    <div className="w-full bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 mb-6 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400 font-medium">Amount</span>
                                            <span className="text-base font-bold text-[#FF7000]">₹{referralData.referralEarnings}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400 font-medium">To</span>
                                            <span className="text-xs font-semibold text-gray-600">vedicvaibhav92@gmail.com</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col w-full gap-3">
                                        <button
                                            onClick={openGmailPayout}
                                            className="w-full py-3.5 bg-[#FF7000] text-white font-bold rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            <MailOpen className="w-4 h-4" />
                                            Open Gmail to Request
                                        </button>
                                        <button
                                            onClick={() => setPayoutModal(null)}
                                            className="w-full py-3.5 bg-gray-50 text-gray-500 font-bold rounded-2xl active:scale-[0.98] transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Payout Not-Allowed Modal (outside 1–6) ── */}
                <AnimatePresence>
                    {payoutModal === "not-allowed" && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setPayoutModal(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-7 shadow-2xl"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                        <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center">
                                            <CalendarClock className="w-6 h-6 text-[#FF7000]" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Not Available Yet</h2>
                                    <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                                        Payout requests are only allowed between the{" "}
                                        <span className="font-bold text-gray-700">1st and 6th</span> of each month.
                                    </p>

                                    {/* Next window pill */}
                                    <div className="w-full flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-6">
                                        <CalendarClock className="w-5 h-5 text-[#FF7000] shrink-0" />
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 font-medium">Next payout window opens</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                1st {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                                    .toLocaleString("en-IN", { month: "long", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setPayoutModal(null)}
                                        className="w-full py-3.5 bg-[#FF7000] text-white font-bold rounded-2xl shadow-md shadow-orange-200 active:scale-[0.98] transition-all"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Logout Confirmation Modal */}
                <AnimatePresence>
                    {isLogoutModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full translate-x-16 -translate-y-16" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                            <LogOut className="w-7 h-7 text-red-500" />
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Logout</h2>
                                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                        Are you sure you want to log out from <br />
                                        <span className="font-bold text-gray-700">Panditji At Request?</span>
                                    </p>

                                    <div className="flex flex-col w-full gap-3">
                                        <button
                                            onClick={confirmLogout}
                                            className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-[0.98] transition-all"
                                        >
                                            Yes, Log Me Out
                                        </button>
                                        <button
                                            onClick={() => setIsLogoutModalOpen(false)}
                                            className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl active:scale-[0.98] transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Notification Modal */}
            {alertConfig.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative border border-stone-100 animate-in fade-in zoom-in duration-300">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${alertConfig.type === 'error' ? 'bg-red-50 text-red-500' :
                            alertConfig.type === 'success' ? 'bg-green-50 text-green-500' :
                                'bg-blue-50 text-blue-500'
                            }`}>
                            {alertConfig.type === 'error' && (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                            {alertConfig.type === 'success' && (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {alertConfig.type === 'info' && (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {alertConfig.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            {alertConfig.message}
                        </p>

                        <button
                            onClick={() => {
                                setAlertConfig({ ...alertConfig, show: false });
                                if (alertConfig.onConfirm) alertConfig.onConfirm();
                            }}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all shadow-md active:scale-95 ${alertConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' :
                                alertConfig.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-100' :
                                    'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
                                }`}
                        >
                            Understand
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;

// Helper component for Empty Bookings
const EmptyBookingsState = ({ type }: { type: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-orange-50/50 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-orange-300" />
        </div>
        <p className="text-gray-700 font-bold text-sm">No {type} bookings found</p>
        <p className="text-gray-400 text-xs mt-1 max-w-[240px] leading-relaxed">
            You haven't placed any bookings for {type} yet. Explore our services to book!
        </p>
    </div>
);

// Helper component for Pooja Booking Card
const PoojaBookingCard = ({
    booking,
    index,
    startCall,
    navigate
}: {
    booking: any;
    index: number;
    startCall: (panditId: string, type: 'video' | 'audio') => void;
    navigate: any;
}) => {
    const date = new Date(booking.bookingDate);
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const bookingDateOnly = new Date(date);
    bookingDateOnly.setHours(0, 0, 0, 0);

    const isToday = bookingDateOnly.getTime() === now.getTime();
    const isPast = bookingDateOnly.getTime() < now.getTime();

    const isOnline = booking.poojaMode === 'online';
    const isOffline = booking.poojaMode === 'offline';
    const hasStartedJourney = !!booking.journeyStartTime;
    const hasAssignedPandit = booking.assignedPandit && booking.assignedPandit.length > 0;

    const isActionEnabled = isOnline ? (isToday && hasAssignedPandit) : (isOffline && isToday && hasStartedJourney && hasAssignedPandit);
    const isAudioCallEnabled = isOffline && hasAssignedPandit && isToday;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-orange-50/70 transition-all ${
                isPast ? "opacity-75 grayscale-[20%] scale-[0.99]" : ""
            }`}
        >
            {/* Header band */}
            <div className={`relative px-4 py-3 overflow-hidden ${isPast ? "bg-gray-400" : "bg-gradient-to-r from-[#FF7000] to-[#FF9A45]"}`}>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <span className="text-base">{isPast ? "✅" : "🪔"}</span>
                        <h3 className="text-white font-bold text-sm leading-tight truncate">
                            {booking.poojaNameEng || "Puja Service"}
                            {isPast && <span className="ml-2 text-[10px] uppercase tracking-wider opacity-90">(Completed)</span>}
                        </h3>
                    </div>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                        {isOnline ? "Online" : "At Home"}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                    {/* Devotee */}
                    <div className="bg-[#FFF8F2] rounded-2xl p-2 flex flex-col items-center justify-center border border-orange-50/50 text-center">
                        <User className="w-4 h-4 text-[#FF7000] mb-0.5" />
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider">Devotee</p>
                        <p className="text-gray-800 font-bold text-xs truncate w-full">
                            {booking.bhaktName || booking.userName || "Devotee"}
                        </p>
                    </div>

                    {/* Date */}
                    <div className="bg-[#FFF8F2] rounded-2xl p-2 flex flex-col items-center justify-center border border-orange-50/50 text-center">
                        <Calendar className="w-4 h-4 text-[#FF7000] mb-0.5" />
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider">Date</p>
                        <p className="text-gray-800 font-bold text-[10px] whitespace-nowrap">{formattedDate}</p>
                    </div>

                    {/* Time */}
                    <div className="bg-[#FFF8F2] rounded-2xl p-2 flex flex-col items-center justify-center border border-orange-50/50 text-center">
                        <Clock className="w-4 h-4 text-[#FF7000] mb-0.5" />
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider">Time</p>
                        <p className="text-gray-800 font-bold text-[10px] whitespace-nowrap">{formattedTime}</p>
                    </div>
                </div>

                {/* Pandit assignment */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50/50 to-[#FFF8F2]/50 rounded-2xl px-3 py-2 border border-orange-100/50">
                    <div className="w-9 h-9 rounded-full bg-orange-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {booking.assignedPandit?.[0]?.profileImage ? (
                            <img
                                src={booking.assignedPandit[0].profileImage}
                                alt="Pandit Ji"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-4 h-4 text-[#FF7000]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                            {hasAssignedPandit ? "Pandit Ji Assigned" : "Awaiting Assignment"}
                        </p>
                        <p className="text-gray-800 font-bold text-xs truncate">
                            {hasAssignedPandit
                                ? `Pandit ${booking.assignedPandit[0].firstName} ${booking.assignedPandit[0].lastName}`
                                : "Not assigned yet"}
                        </p>
                    </div>
                    {hasAssignedPandit && (
                        <div className="flex items-center gap-0.5 bg-emerald-500 text-white px-2 py-0.5 rounded-lg flex-shrink-0">
                            <Star className="w-2.5 h-2.5 fill-white text-white" />
                            <span className="text-[10px] font-bold">{booking.assignedPandit[0].rating?.toFixed(1) || "5.0"}</span>
                        </div>
                    )}
                </div>

                {/* Call/Track buttons */}
                {hasAssignedPandit && (
                    isOnline ? (
                        <button
                            disabled={!isActionEnabled}
                            onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'video')}
                            className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.98] ${
                                isActionEnabled
                                    ? "bg-gradient-to-r from-[#FF7000] to-[#FF9A45] text-white shadow-md shadow-orange-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            <Video className="w-3.5 h-3.5" />
                            {isActionEnabled ? "Join Video Call" : "Video Call — Not Available Yet"}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                disabled={!isAudioCallEnabled}
                                onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'audio')}
                                className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all active:scale-[0.98] flex-shrink-0 ${
                                    isAudioCallEnabled
                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button
                                disabled={!isActionEnabled}
                                onClick={() => {
                                    if (hasAssignedPandit && booking.address?.coordinates) {
                                        const { lat, lng } = booking.address.coordinates;
                                        navigate(`/track-pandit/${booking.assignedPandit[0]._id}/${lat}/${lng}`);
                                    }
                                }}
                                className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.98] ${
                                    isActionEnabled
                                        ? "bg-gradient-to-r from-[#FF7000] to-[#FF9A45] text-white shadow-md shadow-orange-200"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                            {isActionEnabled ? "Track Panditji" : "Awaiting Departure"}
                            </button>
                        </div>
                    )
                )}
            </div>
        </motion.div>
    );
};

// Helper component for Live Booking Card
const LiveBookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const dateVal = booking.bookingDate || booking.addedOn || booking.createdAt;
    const formattedDate = dateVal
        ? new Date(dateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A";

    // Unified field resolution: PoojaBooking (new) vs old LiveMandirBooking
    const pujaName = booking.poojaNameEng || booking.pujaName || "Live Mandir Puja";
    const temple = booking.templeName || "";
    const devoteeName = booking.bhaktName || booking.devoteeName || booking.userName || "—";
    const gotra = booking.gotra || "";
    const members = booking.members || "";
    const wish = booking.wish || booking.concern || "";
    const amount = booking.amount || booking.poojaPrice || 0;

    const rawStatus = booking.status || (booking.isPaymentDone ? "confirmed" : "pending");
    const displayStatus = rawStatus === "confirmed" ? "Confirmed" : rawStatus === "completed" ? "Completed" : rawStatus === "cancelled" ? "Cancelled" : "Pending";

    const statusStyle =
        rawStatus === "confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
        rawStatus === "completed" ? "bg-blue-50 text-blue-600 border border-blue-100" :
        rawStatus === "cancelled" ? "bg-red-50 text-red-600 border border-red-100" :
        "bg-orange-50 text-orange-500 border border-orange-100";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl shadow-sm border border-orange-50/70 relative overflow-hidden"
        >
            {/* Decorative gradient accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-red-400 to-amber-400" />

            <div className="p-4">
                {/* Top row: puja name + status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-base">📺</span>
                            <h3 className="font-bold text-gray-800 text-sm truncate">{pujaName}</h3>
                        </div>
                        {temple && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                                <span className="truncate">{temple}</span>
                            </p>
                        )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusStyle}`}>
                        {displayStatus}
                    </span>
                </div>

                {/* Devotee details */}
                <div className="mt-3.5 pt-3 border-t border-orange-50/60 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">Devotee</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{devoteeName}</p>
                        {gotra && <p className="text-[10px] text-gray-400">Gotra: {gotra}</p>}
                        {members && <p className="text-[10px] text-gray-400">{members} member(s)</p>}
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">Date</p>
                        <p className="text-xs font-bold text-gray-700">{formattedDate}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-400 font-semibold">Paid:</span>
                            <span className="text-xs font-black text-[#FF7000]">₹{Number(amount).toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>

                {/* Wish */}
                {wish && (
                    <div className="mt-3 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                        <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wide">🙏 Sankalp Wish</p>
                        <p className="text-xs text-stone-600 italic mt-0.5">"{wish}"</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Helper component for Chadhava Booking Card
const ChadhavaBookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const formattedDate = booking.addedOn 
        ? new Date(booking.addedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A";

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-emerald-50 text-emerald-600 border border-emerald-100";
            case "failed":
                return "bg-red-50 text-red-600 border border-red-100";
            default:
                return "bg-orange-50 text-orange-600 border border-orange-100";
        }
    };

    // Construct selections text
    const selectionsText = booking.selections 
        ? booking.selections.map((s: any) => `${s.quantity}x ${s.name}`).join(", ")
        : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50 relative overflow-hidden"
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">🌸</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">{booking.deity}</h3>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="truncate text-gray-600">{booking.templeName}</span>
                    </p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getPaymentBadge(booking.paymentStatus)}`}>
                    {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus || "Pending"}
                </span>
            </div>

            {/* Selections / Offerings list */}
            {selectionsText && (
                <div className="mt-3 bg-orange-50/30 p-2.5 rounded-xl border border-orange-100/30">
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">Offerings</p>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{selectionsText}</p>
                </div>
            )}

            {/* Prasad Box indicator if true */}
            {booking.addPrasadBox && (
                <div className="mt-2 flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-yellow-100">
                    <span>📦</span>
                    <span>Prasad Box Added (Dispatched to Home Address)</span>
                </div>
            )}

            {/* Middle Details Grid */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-orange-50/50">
                <div>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Devotee</p>
                    <p className="text-xs font-bold text-gray-700">{booking.devoteeName}</p>
                    {booking.gotra && <p className="text-[10px] text-gray-400">Gotra: {booking.gotra}</p>}
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Booking Date</p>
                    <p className="text-xs font-bold text-gray-700">{formattedDate}</p>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-orange-50/50">
                <span className="text-[10px] text-gray-400 font-medium">
                    Order ID: <span className="font-mono text-gray-500 font-semibold">{booking.razorpayOrderId ? booking.razorpayOrderId.substring(0, 12) : "N/A"}</span>
                </span>
                <div className="flex items-center gap-1 text-[#FF7000]">
                    <span className="text-[10px] font-bold text-gray-400">Total:</span>
                    <span className="text-sm font-black">₹{booking.totalAmount}</span>
                </div>
            </div>

            {/* Wish / Prayer */}
            {booking.wish && (
                <div className="mt-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <p className="text-[9px] text-stone-400 font-semibold uppercase">Your Prayer / Wish</p>
                    <p className="text-xs text-stone-600 italic mt-0.5">"{booking.wish}"</p>
                </div>
            )}
        </motion.div>
    );
};

// Helper component for Direct Pandit Booking Card
const DirectBookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const formattedDate = booking.createdAt 
        ? new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A";
    const formattedTime = booking.createdAt 
        ? new Date(booking.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
        : "";

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "confirmed":
            case "approved":
                return "bg-emerald-50 text-emerald-600 border border-emerald-100";
            case "completed":
                return "bg-blue-50 text-blue-600 border border-blue-100";
            case "cancelled":
            case "rejected":
                return "bg-red-50 text-red-600 border border-red-100";
            default:
                return "bg-orange-50 text-orange-600 border border-orange-100";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50 relative overflow-hidden"
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">{booking.isKashi ? "🛕" : "🪔"}</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">
                            {booking.isKashi ? "Kashi Ji Pandit Request" : "Pandit Direct Booking"}
                        </h3>
                      </div>
                      <p className="text-xs text-[#FF7000] font-bold flex items-center gap-1">
                          <span>{booking.isKashi ? "From:" : "Acharya:"}</span>
                          <span className="truncate">{booking.isKashi ? "Kashi Vishwanath Dham" : (booking.panditName || "Assigned Pandit")}</span>
                      </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                      {booking.status || "Pending"}
                  </span>
              </div>

              {/* Middle Details Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-orange-50/50">
                  <div>
                      <p className="text-[9px] text-gray-400 uppercase font-semibold">Devotee</p>
                      <p className="text-xs font-bold text-gray-700">{booking.name}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase font-semibold">Requested On</p>
                      <p className="text-xs font-bold text-gray-700">{formattedDate}</p>
                      <p className="text-[10px] text-gray-400">{formattedTime}</p>
                  </div>
              </div>

              {/* Contact info / reference */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-orange-50/50">
                  <div className="flex items-center gap-1 text-gray-500">
                      <Phone className="w-3 h-3" />
                      <span className="text-[11px] font-medium">+91 {booking.phone}</span>
                  </div>
                  <span className="text-[10px] bg-stone-50 text-stone-500 border border-stone-100 rounded-lg px-2 py-0.5 font-mono">
                      Ref: {booking._id ? booking._id.substring(0, 8) : "N/A"}
                  </span>
              </div>
          </motion.div>
      );
  };

// Helper component for Shopify Order Card
const ShopifyOrderCard = ({ order, index }: { order: any; index: number }) => {
    const dateVal = order.addedOn || order.createdAt;
    const formattedDate = dateVal
        ? new Date(dateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A";

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "bg-emerald-50 text-emerald-600 border border-emerald-100";
            case "shipped":
                return "bg-blue-50 text-blue-600 border border-blue-100";
            case "confirmed":
                return "bg-amber-50 text-amber-600 border border-amber-100";
            case "cancelled":
                return "bg-red-50 text-red-600 border border-red-100";
            default:
                return "bg-orange-50 text-orange-600 border border-orange-100";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50 relative overflow-hidden"
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">🛍️</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">
                            Shop Order
                        </h3>
                    </div>
                    <p className="text-xs text-[#FF7000] font-bold">
                        Status: <span className="capitalize text-xs">{order.status || "Pending"}</span>
                    </p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        order.paymentMethod === "cod"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                        {order.paymentMethod === "cod" ? "🚚 Cash on Delivery" : "💳 Paid Online"}
                    </span>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status || "Pending"}
                </span>
            </div>

            {/* Items list */}
            <div className="mt-3 space-y-2">
                {order.items?.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className="flex items-center gap-3 bg-stone-50/50 p-2 rounded-xl border border-stone-100/50">
                        {item.image ? (
                            <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded-lg border border-orange-100 shrink-0" />
                        ) : (
                            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 shrink-0">
                                🛍️
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-850 truncate">{item.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.qty} · ₹{item.price?.toLocaleString("en-IN")}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery address */}
            <div className="mt-3 bg-orange-50/20 p-2.5 rounded-xl border border-orange-100/30">
                <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">Delivery Address</p>
                <p className="text-xs font-bold text-gray-700 leading-tight">{order.customerName}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                    {order.addressLine}, {order.city}, {order.state} - {order.pincode}
                </p>
            </div>

            {/* Middle Details Grid */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-orange-50/50">
                <div>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Payment Status</p>
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                        order.paymentStatus === "paid" ? "text-emerald-600" : "text-orange-500"
                    }`}>
                        {order.paymentStatus || "Pending"}
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Ordered On</p>
                    <p className="text-xs font-bold text-gray-700">{formattedDate}</p>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-orange-50/50">
                <span className="text-[10px] text-gray-400 font-medium">
                    Order ID: <span className="font-mono text-gray-500 font-semibold">{(order.razorpayOrderId || order._id || "").toString().substring(0, 12) || "N/A"}</span>
                </span>
                <div className="flex items-center gap-1 text-[#FF7000]">
                    <span className="text-[10px] font-bold text-gray-400">{order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? "Amount Due:" : "Total Paid:"}</span>
                    <span className="text-sm font-black">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                </div>
            </div>
        </motion.div>
    );
};

/* ============================================================================
   Vedic Vivah booking card
   ----------------------------------------------------------------------------
   Shows a family's marriage booking and gives them the two actions the app
   also offers from My Bookings: pay the remaining balance on an advance-paid
   booking, and cancel (the server computes the refund from the published
   policy — 100% at 7+ days, 50% at 3–6 days, none inside 3 days).

   `platform` is surfaced as a small chip so a family (and support, reading a
   screenshot) can see whether a booking came from the app or the website.
   ========================================================================== */
const VIVAH_STATUS_STYLE: Record<string, string> = {
    lead: "bg-orange-50 text-orange-600 border border-orange-100",
    confirmed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    in_progress: "bg-blue-50 text-blue-600 border border-blue-100",
    completed: "bg-violet-50 text-violet-600 border border-violet-100",
    cancelled: "bg-red-50 text-red-600 border border-red-100",
};

const VIVAH_STATUS_LABEL: Record<string, string> = {
    lead: "Requested",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
};

/* ==========================================================================
   VEDIC VIVAH — the family's booking, in full
   --------------------------------------------------------------------------
   A vivah is not one appointment, so this card is not one line. It shows the
   whole journey: every ceremony with its own date, who is performing it, what
   is already done, what is still to come, and exactly what has been paid.

   It also keeps itself current. Ops assign a Pandit Ji, tick rituals off and
   move dates hours after a family books — if the card only rendered whatever
   the page happened to fetch on load, the family would be reading a snapshot
   and calling us to ask what changed. So it re-reads while the tab is open.
   ========================================================================== */

/** "12/03/2027" → "12 Mar 2027". Anything unparseable comes back untouched. */
const prettyVivahDate = (ddmmyyyy?: string): string => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(ddmmyyyy || "").trim());
    if (!m) return String(ddmmyyyy || "");
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (Number.isNaN(d.getTime())) return ddmmyyyy as string;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** "19:30" → "7:30 PM". Empty in, empty out. */
const prettyVivahTime = (hhmm?: string): string => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
    if (!m) return "";
    const h = Number(m[1]);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m[2]} ${suffix}`;
};

const vivahDateValue = (ddmmyyyy?: string): number => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(ddmmyyyy || "").trim());
    if (!m) return Number.POSITIVE_INFINITY; // undated rituals sort last
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
};

/**
 * One plain sentence telling the family what is happening right now. This is
 * the "constant update" a booking screen owes someone who has paid us to run
 * their wedding — not just a coloured status pill.
 */
const vivahNarrative = (b: any): string => {
    if (b?.status === "cancelled") return "This booking is cancelled. Any refund due is being processed.";
    if (b?.status === "completed") return "Every ritual is complete. Thank you for letting us be part of it 🙏";
    const total = Number(b?.totalAmount || 0);
    const paid = Number(b?.amountPaid || 0);
    const steps: any[] = b?.selectedSteps || [];
    const done = steps.filter((s) => s?.completed).length;
    if (b?.status === "lead" || !b?.isPaymentDone)
        return "Our Vivah desk will call you on WhatsApp to confirm the details and the muhurat.";
    if (!b?.panditAssigned?.name && !(b?.assignedPandits || []).length)
        return "Payment received. We're matching a verified Pandit Ji for your dates — you'll see them here.";
    if (done > 0 && done < steps.length)
        return `${done} of ${steps.length} ceremonies are done. Your Pandit Ji marks each one as it completes.`;
    if (paid < total)
        return "Your Pandit Ji is assigned. The balance is due before the ceremony — you can pay it here any time.";
    return "Everything is confirmed and fully paid. Your Pandit Ji will reach out before each ritual.";
};

const VivahBookingCard = ({
    booking: initial,
    index,
    onRefresh,
    refreshing,
    lastSyncedAt,
}: {
    booking: any;
    index: number;
    onRefresh?: () => void;
    refreshing?: boolean;
    lastSyncedAt?: number;
}) => {
    const [booking, setBooking] = useState<any>(initial);
    const [busy, setBusy] = useState<null | "balance" | "cancel">(null);
    const [note, setNote] = useState("");
    const [noteTone, setNoteTone] = useState<"good" | "bad">("good");
    const [showAll, setShowAll] = useState(false);

    /**
     * Adopt whatever the poller brought in — unless this card is mid-payment,
     * where replacing state under an open Razorpay sheet would strand the
     * handler on a stale booking id.
     */
    useEffect(() => {
        if (busy) return;
        setBooking((prev: any) =>
            prev?.updatedAt === initial?.updatedAt && prev?.status === initial?.status
                ? prev
                : initial
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    const total = Number(booking.totalAmount || 0);
    const paid = Number(booking.amountPaid || 0);
    const balance = Math.max(0, total - paid);
    const isCancelled = booking.status === "cancelled";
    const isCompleted = booking.status === "completed";
    const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    const ceremony = booking.needMuhuratHelp && !booking.eventDate
        ? "Pandit Ji will suggest"
        : `${prettyVivahDate(booking.eventDate) || "—"}${
              booking.eventTime ? `, ${prettyVivahTime(booking.eventTime)}` : ""
          }`;

    const createdOn = booking.createdAt
        ? new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A";

    const selection = booking.packageName
        ? `${booking.packageName} Package`
        : booking.isSampooranPackage
            ? "Sampooran Vivah (Complete Package)"
            : (booking.selectedSteps || []).map((s: any) => s.title).join(", ") || "Vedic Vivah";

    /** Rituals in the order they will actually happen — dated ones first. */
    const steps: any[] = useMemo(() => {
        const list = [...(booking.selectedSteps || [])];
        return list.sort((a, b) => vivahDateValue(a?.scheduledDate) - vivahDateValue(b?.scheduledDate));
    }, [booking.selectedSteps]);

    const doneCount = steps.filter((s) => s.completed).length;
    /** The next ceremony coming up — the one thing a family looks for first. */
    const nextIdx = steps.findIndex((s) => !s.completed);
    const visibleSteps = showAll ? steps : steps.slice(0, 4);

    const pandits: any[] = (booking.assignedPandits || []).filter((p: any) => p?.name);
    const gifts: any[] = (booking.packageGifts || []).filter((g: any) => g?.title);
    const venue = [booking.address?.street, booking.address?.city, booking.address?.state, booking.address?.pincode]
        .filter(Boolean)
        .join(", ");
    const ref = String(booking._id || "").slice(-6).toUpperCase();

    const say = (text: string, tone: "good" | "bad" = "good") => {
        setNoteTone(tone);
        setNote(text);
    };

    const whatsappUs = () => {
        const msg =
            `Namaste 🙏 I'd like an update on my Vedic Vivah booking.\n\n` +
            `Booking: ${ref}\n` +
            `Name: ${booking.devoteeName || ""}\n` +
            `Selection: ${selection}\n` +
            `Ceremony: ${ceremony}`;
        window.open(`https://wa.me/919056955311?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    };

    const payBalance = async () => {
        setNote("");
        setBusy("balance");
        try {
            const token = localStorage.getItem("user_token");

            // Wait for the gateway BEFORE creating the order. Creating it first
            // rotates `balanceRazorpayOrderId` on the booking; if the SDK then
            // isn't ready we've orphaned that order, and a late payment against
            // it would be rejected as "Order ID mismatch" with the money gone.
            const Ctor = await loadRazorpay();

            const { data: order } = await axios.post(
                `${API_URL}/bookings/vedic-vivah/balance-order`,
                { bookingId: booking._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!order?.success) throw new Error(order?.message || "Could not start the payment.");

            const rzp = new Ctor({
                key: order.razorpayKeyId,
                amount: Number(order.amount) * 100,
                currency: order.currency || "INR",
                name: "Pandit Ji At Request",
                description: "Vedic Vivah Sanskar — balance payment",
                order_id: order.razorpayOrderId,
                prefill: { name: booking.devoteeName, contact: booking.whatsapp },
                theme: { color: "#FF7000" },
                handler: async (resp: any) => {
                    try {
                        const { data } = await axios.post(
                            `${API_URL}/bookings/vedic-vivah/complete-balance-payment`,
                            {
                                bookingId: booking._id,
                                razorpayOrderId: resp.razorpay_order_id,
                                razorpayPaymentId: resp.razorpay_payment_id,
                                razorpaySignature: resp.razorpay_signature,
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (!data?.success) throw new Error(data?.message || "");
                        setBooking(data.booking || { ...booking, amountPaid: total, paymentOption: "full" });
                        say("Payment complete 🙏 Your Vivah booking is fully settled.");
                        onRefresh?.();
                    } catch (e: any) {
                        // The money is already captured on this path, so lead
                        // with that before explaining anything else.
                        say(
                            `Your payment went through — we just couldn't record it yet. Your money is safe and ` +
                            `our team will confirm it shortly. (${humanError(
                                e?.response?.data?.message || e,
                                "balance-complete"
                            )})`,
                            "bad"
                        );
                    } finally {
                        setBusy(null);
                    }
                },
                modal: { ondismiss: () => setBusy(null) },
            });
            rzp.on("payment.failed", (r: any) => {
                say(humanPaymentError(r), "bad");
                setBusy(null);
            });
            rzp.open();
        } catch (e: any) {
            // Nothing charged here — the gateway never opened.
            say(humanError(e?.response?.data?.message || e, "balance-order"), "bad");
            setBusy(null);
        }
    };

    const cancelBooking = async () => {
        if (!window.confirm("Cancel this Vivah booking? The refund is calculated from our published policy.")) return;
        setNote("");
        setBusy("cancel");
        try {
            const token = localStorage.getItem("user_token");
            const { data } = await axios.post(
                `${API_URL}/bookings/vedic-vivah/${booking._id}/cancel`,
                { reason: "Cancelled by the family from My Bookings" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!data?.success) throw new Error(data?.message || "");
            setBooking(data.booking || { ...booking, status: "cancelled" });
            say(
                Number(data?.refund?.amount) > 0
                    ? `Cancelled. A refund of ₹${Number(data.refund.amount).toLocaleString("en-IN")} (${data.refund.pct}%) will reach you in 5–7 days.`
                    : "Cancelled. As per the policy no refund is available at this stage."
            );
            onRefresh?.();
        } catch (e: any) {
            say(humanError(e?.response?.data?.message || e, "cancel"), "bad");
        } finally {
            setBusy(null);
        }
    };

    const syncedLabel = (() => {
        if (refreshing) return "Updating…";
        if (!lastSyncedAt) return "";
        const secs = Math.max(0, Math.round((Date.now() - lastSyncedAt) / 1000));
        if (secs < 60) return "Updated just now";
        const mins = Math.round(secs / 60);
        return `Updated ${mins} min${mins > 1 ? "s" : ""} ago`;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50 relative overflow-hidden"
        >
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">💍</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">Vedic Vivah Sanskar</h3>
                        {ref && (
                            <span className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-1.5 py-0.5">
                                #{ref}
                            </span>
                        )}
                        {booking.platform === "web" && (
                            <span className="text-[8.5px] font-bold uppercase tracking-wider text-stone-400 border border-stone-200 rounded-full px-1.5 py-0.5">
                                Web
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{selection}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${VIVAH_STATUS_STYLE[booking.status] || VIVAH_STATUS_STYLE.lead}`}>
                    {VIVAH_STATUS_LABEL[booking.status] || booking.status}
                </span>
            </div>

            {/* ── What's happening right now ── */}
            <div className="mt-3 flex items-start gap-2 bg-orange-50/50 border border-orange-100/50 rounded-xl px-3 py-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7000] shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-gray-600 leading-relaxed flex-1">{vivahNarrative(booking)}</p>
            </div>

            {/* ── Muhurat ── */}
            {booking.selectedMuhurat?.date && (
                <div className="mt-3 flex items-center gap-2 flex-wrap text-[10.5px]">
                    <span className="font-bold text-[#FF7000] bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
                        Shubh Muhurat
                    </span>
                    <span className="text-gray-500">
                        {prettyVivahDate(booking.selectedMuhurat.date)}
                        {booking.selectedMuhurat.day ? ` · ${booking.selectedMuhurat.day}` : ""}
                        {booking.selectedMuhurat.tithi ? ` · ${booking.selectedMuhurat.tithi}` : ""}
                        {booking.selectedMuhurat.nakshatra ? ` · ${booking.selectedMuhurat.nakshatra}` : ""}
                    </span>
                </div>
            )}

            {/* ── Pandit Ji (single legacy field + the real area-wise team) ── */}
            {(booking.panditAssigned?.name || pandits.length > 0) && (
                <div className="mt-3 bg-orange-50/40 p-2.5 rounded-xl border border-orange-100/40 space-y-2">
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">
                        {pandits.length > 1 ? "Your Pandit Ji team" : "Your Pandit Ji"}
                    </p>
                    {booking.panditAssigned?.name && (
                        <div className="flex items-center gap-2.5">
                            {booking.panditAssigned.photo ? (
                                <img src={booking.panditAssigned.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[13px]">🙏</div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-700 truncate">{booking.panditAssigned.name}</p>
                                {(booking.panditAssigned.title || booking.panditAssigned.experienceYears) && (
                                    <p className="text-[10px] text-gray-400 truncate">
                                        {[
                                            booking.panditAssigned.title,
                                            booking.panditAssigned.experienceYears
                                                ? `${booking.panditAssigned.experienceYears} yrs`
                                                : "",
                                        ].filter(Boolean).join(" · ")}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {pandits.map((p: any, i: number) => (
                        <div key={p.panditId || i} className="flex items-center gap-2.5">
                            {p.photo ? (
                                <img src={p.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[13px]">🙏</div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-700 truncate">{p.name}</p>
                                <p className="text-[10px] text-gray-400 capitalize">{p.role || "lead"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── The journey: every ceremony on its own date ── */}
            {steps.length > 0 && (
                <div className="mt-3.5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] text-gray-400 uppercase font-semibold">Ritual schedule</p>
                        <p className="text-[10px] font-bold text-gray-600">{doneCount} / {steps.length} done</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-orange-50 overflow-hidden mb-2.5">
                        <div
                            className="h-full bg-gradient-to-r from-[#E25800] to-[#FF8A2B] rounded-full transition-all"
                            style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        {visibleSteps.map((s: any, i: number) => {
                            const isNext = !isCancelled && steps.indexOf(s) === nextIdx;
                            return (
                                <div
                                    key={s.stepId || i}
                                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 border ${
                                        s.completed
                                            ? "bg-emerald-50/50 border-emerald-100/60"
                                            : isNext
                                                ? "bg-orange-50/60 border-orange-200/70"
                                                : "bg-gray-50/60 border-gray-100"
                                    }`}
                                >
                                    <span
                                        className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
                                            s.completed ? "bg-emerald-500" : isNext ? "bg-[#FF7000]" : "bg-gray-200"
                                        }`}
                                    >
                                        {s.completed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11.5px] font-semibold text-gray-700 truncate">{s.title}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {s.scheduledDate
                                                ? `${prettyVivahDate(s.scheduledDate)}${
                                                      s.scheduledTime ? `, ${prettyVivahTime(s.scheduledTime)}` : ""
                                                  }`
                                                : "Date to be planned with you"}
                                        </p>
                                    </div>
                                    {s.completed ? (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">
                                            Done
                                        </span>
                                    ) : isNext ? (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF7000] shrink-0">
                                            Next
                                        </span>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    {steps.length > 4 && (
                        <button
                            onClick={() => setShowAll((v) => !v)}
                            className="mt-2 text-[10.5px] font-bold text-[#FF7000]"
                        >
                            {showAll ? "Show less" : `Show all ${steps.length} rituals`}
                        </button>
                    )}
                </div>
            )}

            {/* ── Inclusions ── */}
            {(booking.kashiPandit?.invited || booking.liveDarshanTemple?.name || booking.language || booking.samagriNeeded) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {booking.kashiPandit?.invited && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                            <ShieldCheck className="w-3 h-3" /> Kashi Acharya
                        </span>
                    )}
                    {booking.liveDarshanTemple?.name && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">
                            <Landmark className="w-3 h-3" /> {booking.liveDarshanTemple.name}
                        </span>
                    )}
                    {booking.samagriNeeded && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                            <Package className="w-3 h-3" /> Samagri included
                        </span>
                    )}
                    {booking.language && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                            {booking.language}
                        </span>
                    )}
                </div>
            )}

            {/* ── Free gifts ── */}
            {gifts.length > 0 && (
                <div className="mt-3">
                    <p className="text-[9px] text-gray-400 uppercase font-semibold mb-1.5">
                        Gifts included ({gifts.length})
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                        {gifts.map((g: any, i: number) => (
                            <div key={i} className="shrink-0 w-[64px]">
                                {g.image ? (
                                    <img
                                        src={g.image}
                                        alt={g.title}
                                        loading="lazy"
                                        className="w-[64px] h-[64px] rounded-xl object-cover border border-orange-100"
                                    />
                                ) : (
                                    <div className="w-[64px] h-[64px] rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-[#FF7000]" />
                                    </div>
                                )}
                                <p className="text-[8.5px] text-gray-500 mt-1 leading-tight line-clamp-2">{g.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Where and when ── */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-orange-50/50">
                <div>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Ceremony</p>
                    <p className="text-xs font-bold text-gray-700">{ceremony}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Requested On</p>
                    <p className="text-xs font-bold text-gray-700">{createdOn}</p>
                </div>
            </div>

            {venue && (
                <div className="mt-2 flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-gray-500 leading-snug">{venue}</p>
                </div>
            )}

            {/* ── Money ── */}
            <div className="mt-3.5 pt-3 border-t border-orange-50/50">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">
                        Paid: <span className="text-gray-600 font-bold">₹{paid.toLocaleString("en-IN")}</span>
                        {balance > 0 && !isCancelled && (
                            <> · Balance: <span className="text-[#FF7000] font-bold">₹{balance.toLocaleString("en-IN")}</span></>
                        )}
                    </span>
                    <div className="flex items-center gap-1 text-[#FF7000]">
                        <span className="text-[10px] font-bold text-gray-400">Total:</span>
                        <span className="text-sm font-black">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                </div>
                {total > 0 && !isCancelled && (
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-2">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all"
                            style={{ width: `${paidPct}%` }}
                        />
                    </div>
                )}
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-2 mt-3">
                {!isCancelled && !isCompleted && balance > 0 && booking.isPaymentDone && (
                    <button
                        onClick={payBalance}
                        disabled={busy !== null}
                        className="flex-1 bg-gradient-to-r from-[#E25800] to-[#FF8A2B] text-white text-[11.5px] font-bold py-2.5 rounded-xl disabled:opacity-60 active:scale-95 transition-transform"
                    >
                        {busy === "balance" ? "Opening…" : `Pay balance ₹${balance.toLocaleString("en-IN")}`}
                    </button>
                )}
                <button
                    onClick={whatsappUs}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-200 text-emerald-700 text-[11.5px] font-bold py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Ask for an update
                </button>
                {!isCancelled && !isCompleted && (
                    <button
                        onClick={cancelBooking}
                        disabled={busy !== null}
                        className="flex-1 border border-red-200 text-red-600 text-[11.5px] font-bold py-2.5 rounded-xl disabled:opacity-60 active:scale-95 transition-transform"
                    >
                        {busy === "cancel" ? "Cancelling…" : "Cancel booking"}
                    </button>
                )}
            </div>

            {isCancelled && Number(booking.cancellation?.refundAmount) > 0 && (
                <p className="mt-3 text-[11px] text-stone-500">
                    Refund of ₹{Number(booking.cancellation.refundAmount).toLocaleString("en-IN")} is{" "}
                    {booking.cancellation.refundStatus === "processed" ? "processed" : "being processed"}.
                </p>
            )}

            {note && (
                <p
                    role="alert"
                    className={`mt-3 text-[11.5px] rounded-xl px-3 py-2 border ${
                        noteTone === "bad"
                            ? "text-red-700 bg-red-50 border-red-100"
                            : "text-emerald-700 bg-emerald-50 border-emerald-100"
                    }`}
                >
                    {note}
                </p>
            )}

            {/* ── Freshness ── */}
            {(syncedLabel || onRefresh) && (
                <div className="mt-3 pt-2.5 border-t border-orange-50/50 flex items-center justify-between">
                    <span className="text-[9.5px] text-gray-300">{syncedLabel}</span>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={!!refreshing}
                            className="inline-flex items-center gap-1 text-[9.5px] font-bold text-gray-400 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};
