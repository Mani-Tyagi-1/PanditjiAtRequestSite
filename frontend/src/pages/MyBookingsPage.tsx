import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../utils/apiConfig";
import DesktopHeader from "../components/layout/DesktopHeader";
import TopPromoBar from "../components/layout/TopPromoBar";
import SiteFooter from "../components/layout/SiteFooter";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Calendar,
    Clock,
    User,
    Video,
    MapPin,
    Star,
    Phone,
    // Wifi,
    // WifiOff,
    CheckCircle2,
    AlertCircle,
    Info,
    Loader2,
    Flower2,
    ShoppingBag,
    MessageCircle,
    SlidersHorizontal,
    Search,
    Hourglass,
    Table2,
    ArrowRight,
} from "lucide-react";

// All tab values this page recognises. Anything else in `?tab=` falls back
// to the default "pooja" tab (mirrors the previous pooja/live-only contract).
const TAB_VALUES = ["pooja", "live", "chadhava", "shopOrders", "consultation"] as const;
type TabType = (typeof TAB_VALUES)[number];

// Same real support WhatsApp number/message pattern used in ProfilePage.tsx,
// AppLayout.tsx, SiteFooter.tsx etc.
const WHATSAPP_URL =
    "https://wa.me/919056955311?text=" +
    encodeURIComponent("🙏 Namaste! I need help with my PanditJi At Request bookings.");

// Shared "is this date today / in the past / in the future" helper — the
// exact same day-boundary comparison the pooja-booking cards already do
// inline, lifted out so the new stats/hero/table code can reuse it without
// touching that existing per-card logic.
const getDateFlags = (dateVal: any) => {
    const date = new Date(dateVal);
    const valid = !isNaN(date.getTime());
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return {
        valid,
        date,
        isToday: valid && dateOnly.getTime() === now.getTime(),
        isPast: valid && dateOnly.getTime() < now.getTime(),
        isFuture: valid && dateOnly.getTime() > now.getTime(),
    };
};

const MyBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabParamRaw = searchParams.get("tab");
    const tabParam: TabType = (TAB_VALUES as readonly string[]).includes(tabParamRaw || "")
        ? (tabParamRaw as TabType)
        : "pooja";
    const [bookings, setBookings] = useState<any[]>([]);
    const [liveBookings, setLiveBookings] = useState<any[]>([]);
    const [chadhavaBookings, setChadhavaBookings] = useState<any[]>([]);
    const [shopifyOrders, setShopifyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>(tabParam);

    // ── Desktop-only sub-filter row state (md+). Defaults are true no-ops so
    // mobile — which never renders the controls that change these — is
    // unaffected either way. Only feeds the new "All Bookings" table below.
    const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [searchId, setSearchId] = useState("");
    const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

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

    const fetchBookings = async () => {
        try {
            const userDataString = localStorage.getItem("user_data");
            if (!userDataString) {
                navigate("/");
                return;
            }

            const user = JSON.parse(userDataString);
            const userPhone = user.phone;

            const apiUrl = API_URL;
            const cleanPhone = String(userPhone).replace(/\D/g, "");
            const [poojaRes, chadhavaRes, shopifyRes] = await Promise.all([
                axios.get(`${apiUrl}/bookings/get-pending-poojabookings/${cleanPhone}`),
                axios.get(`${apiUrl}/chadhava-bookings/user/${cleanPhone}`).catch((err) => {
                    console.error("Error fetching Chadhava bookings:", err);
                    return { data: { success: false, data: [] } };
                }),
                axios.get(`${apiUrl}/shopify-orders/user/${cleanPhone}`).catch((err) => {
                    console.error("Error fetching Shopify orders:", err);
                    return { data: { success: false, data: [] } };
                }),
            ]);

            const allBookings: any[] = poojaRes.data || [];
            // Split: regular puja bookings vs live mandir bookings.
            // Primary signals: isLiveMandir flag (old) or poojaType field (new).
            // Fallback signals: templeName / pujaSlug — these are set ONLY on live
            // mandir bookings, so they reliably catch any live booking whose explicit
            // flag didn't persist (e.g. older records) instead of leaking it into the
            // regular tab.
            const isLive = (b: any) =>
                b.isLiveMandir === true ||
                b.poojaType === 'live_puja_at_mandir' ||
                !!b.templeName ||
                !!b.pujaSlug;
            // A live mandir puja is paid upfront: on success a FINAL record
            // (isPaymentDone:true) is created and its pending row deleted. But if
            // the user dismisses the Razorpay popup, the unpaid pending row lingers.
            // Treat only PAID (or already completed) live records as real bookings,
            // so the Live tab shows genuine "Confirmed" bookings instead of leaking
            // abandoned checkout attempts as "pending".
            const isPaid = (b: any) => b.isPaymentDone === true || b.isCompleted === true;
            const regularBookings = allBookings.filter((b: any) => !isLive(b));
            const liveMandirBookings = allBookings.filter((b: any) => isLive(b) && isPaid(b));

            setBookings(regularBookings);
            setLiveBookings(liveMandirBookings);
            setChadhavaBookings(chadhavaRes.data?.data || []);
            setShopifyOrders(shopifyRes.data?.data || []);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching bookings:", err);
            setError("Failed to load bookings. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

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

    // ── Desktop/tablet-only derived data (md+). None of this touches the
    // pooja/live fetch state or the existing per-card rendering below — it
    // only reads the same real arrays to build the stats row, the "Upcoming
    // Booking" hero card, and the "All Bookings" table.
    const totalBookingsCount = bookings.length + liveBookings.length + chadhavaBookings.length + shopifyOrders.length;
    const upcomingCount =
        bookings.filter((b) => !getDateFlags(b.bookingDate).isPast).length +
        liveBookings.filter((b) => !getDateFlags(b.bookingDate).isPast).length +
        chadhavaBookings.filter((b) => b.status !== "completed" && b.status !== "cancelled").length +
        shopifyOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
    const completedCount =
        bookings.filter((b) => getDateFlags(b.bookingDate).isPast).length +
        liveBookings.filter((b) => b.isCompleted === true).length +
        chadhavaBookings.filter((b) => b.status === "completed").length +
        shopifyOrders.filter((o) => o.status === "delivered").length;
    const liveNowCount = liveBookings.length;
    const chadhavaCount = chadhavaBookings.length;
    const shopOrdersCount = shopifyOrders.length;

    // Soonest real future booking across the only two arrays that actually
    // carry a real scheduled `bookingDate` field (pooja + live mandir —
    // verified against the backend schema; Chadhava/Shop orders only carry
    // an order-placed timestamp, not a future appointment date, so they're
    // honestly excluded from the countdown rather than faked).
    const heroBooking = useMemo(() => {
        const candidates = [
            ...bookings.map((b) => ({ ...b, __kind: "pooja" as const })),
            ...liveBookings.map((b) => ({ ...b, __kind: "live" as const })),
        ].filter((b) => {
            const flags = getDateFlags(b.bookingDate);
            return flags.valid && !flags.isPast;
        });
        candidates.sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
        return candidates[0] || null;
    }, [bookings, liveBookings]);

    useEffect(() => {
        if (!heroBooking) {
            setCountdown(null);
            return;
        }
        const targetTime = new Date(heroBooking.bookingDate).getTime();
        const tick = () => {
            const diff = targetTime - Date.now();
            if (diff <= 0) {
                setCountdown({ d: 0, h: 0, m: 0, s: 0 });
                return;
            }
            setCountdown({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [heroBooking?._id, heroBooking?.bookingDate]);

    // Normalized rows for the desktop "All Bookings" table — an additional
    // rendering of the exact same fetched arrays already used above, no new
    // fetch, no fabricated fields.
    type BookingRow = {
        key: string;
        service: string;
        devotee: string;
        dateLabel: string;
        dateVal: Date | null;
        bookingId: string;
        status: string;
        bucket: "upcoming" | "completed" | "cancelled";
        type: "pooja" | "live" | "chadhava" | "shop";
    };

    const formatRowDate = (val: any) => {
        const flags = getDateFlags(val);
        return flags.valid ? flags.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
    };

    const formatRowDateTime = (date: Date | null) => {
        if (!date) return "N/A";
        const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const timePart = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        return `${datePart} · ${timePart}`;
    };

    const allBookingRows: BookingRow[] = useMemo(() => {
        const poojaRows: BookingRow[] = bookings.map((b) => {
            const flags = getDateFlags(b.bookingDate);
            return {
                key: `pooja-${b._id}`,
                service: b.poojaNameEng || "Puja Service",
                devotee: b.bhaktName || b.userName || "Devotee",
                dateLabel: formatRowDate(b.bookingDate),
                dateVal: flags.valid ? flags.date : null,
                bookingId: b._id || "",
                status: flags.isPast ? "Completed" : flags.isToday ? "Today" : "Upcoming",
                bucket: flags.isPast ? "completed" : "upcoming",
                type: "pooja",
            };
        });
        const liveRows: BookingRow[] = liveBookings.map((b) => {
            const flags = getDateFlags(b.bookingDate);
            const bucket: BookingRow["bucket"] = b.isCompleted ? "completed" : b.status === "cancelled" ? "cancelled" : "upcoming";
            return {
                key: `live-${b._id}`,
                service: b.poojaNameEng || b.pujaName || b.packageName || "Live Mandir Puja",
                devotee: b.bhaktName || b.devoteeName || b.userName || "N/A",
                dateLabel: formatRowDate(b.bookingDate),
                dateVal: flags.valid ? flags.date : null,
                bookingId: b._id || "",
                status: b.isCompleted ? "Completed" : b.isPaymentDone ? "Confirmed" : b.status || "Pending",
                bucket,
                type: "live",
            };
        });
        const chadhavaRows: BookingRow[] = chadhavaBookings.map((b) => {
            const flags = getDateFlags(b.addedOn);
            const bucket: BookingRow["bucket"] = b.status === "completed" ? "completed" : b.status === "cancelled" ? "cancelled" : "upcoming";
            return {
                key: `chadhava-${b._id}`,
                service: b.deity || "Chadhava Seva",
                devotee: b.devoteeName || "Devotee",
                dateLabel: formatRowDate(b.addedOn),
                dateVal: flags.valid ? flags.date : null,
                bookingId: b._id || "",
                status: b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : "Pending",
                bucket,
                type: "chadhava",
            };
        });
        const shopRows: BookingRow[] = shopifyOrders.map((o) => {
            const flags = getDateFlags(o.addedOn);
            const bucket: BookingRow["bucket"] = o.status === "delivered" ? "completed" : o.status === "cancelled" ? "cancelled" : "upcoming";
            return {
                key: `shop-${o._id}`,
                service: o.items?.[0]?.title || "Shop Order",
                devotee: o.customerName || "Devotee",
                dateLabel: formatRowDate(o.addedOn),
                dateVal: flags.valid ? flags.date : null,
                bookingId: o._id || "",
                status: o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : "Pending",
                bucket,
                type: "shop",
            };
        });
        return [...poojaRows, ...liveRows, ...chadhavaRows, ...shopRows].sort((a, b) => {
            const at = a.dateVal ? a.dateVal.getTime() : 0;
            const bt = b.dateVal ? b.dateVal.getTime() : 0;
            return bt - at;
        });
    }, [bookings, liveBookings, chadhavaBookings, shopifyOrders]);

    const filteredBookingRows = useMemo(() => {
        return allBookingRows.filter((row) => {
            if (statusFilter !== "all" && row.bucket !== statusFilter) return false;
            if (dateFrom && row.dateVal && row.dateVal.getTime() < new Date(dateFrom).getTime()) return false;
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                if (row.dateVal && row.dateVal.getTime() > end.getTime()) return false;
            }
            if (searchId.trim() && !row.bookingId.toLowerCase().includes(searchId.trim().toLowerCase())) return false;
            return true;
        });
    }, [allBookingRows, statusFilter, dateFrom, dateTo, searchId]);

    const rowTypeMeta: Record<BookingRow["type"], { label: string; icon: string; tab: TabType }> = {
        pooja: { label: "At Home Puja", icon: "🪔", tab: "pooja" },
        live: { label: "Live Mandir Puja", icon: "📺", tab: "live" },
        chadhava: { label: "Chadhava", icon: "🌸", tab: "chadhava" },
        shop: { label: "Shop Order", icon: "🛍️", tab: "shopOrders" },
    };

    const rowStatusColor = (bucket: BookingRow["bucket"]) => {
        switch (bucket) {
            case "completed":
                return "bg-blue-50 text-blue-600 border border-blue-100";
            case "cancelled":
                return "bg-red-50 text-red-600 border border-red-100";
            default:
                return "bg-emerald-50 text-emerald-600 border border-emerald-100";
        }
    };

    const goToRowTab = (type: BookingRow["type"]) => {
        setActiveTab(rowTypeMeta[type].tab);
        document.getElementById("my-bookings-tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (loading) {
        return (
            <>
            <TopPromoBar />
            <DesktopHeader />
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] gap-3">
                <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#FF7000] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full bg-orange-50 flex items-center justify-center">
                        <span className="text-lg">🪔</span>
                    </div>
                </div>
                <p className="text-sm text-orange-400 font-semibold tracking-wide">Loading your bookings…</p>
            </div>
            </>
        );
    }

    if (error) {
        return (
            <>
            <TopPromoBar />
            <DesktopHeader />
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFAF5] p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-7 rounded-3xl shadow-xl border border-orange-50 max-w-sm w-full"
                >
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Something went wrong</h2>
                    <p className="text-gray-500 mb-5 text-sm">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="w-full bg-[#FF7000] text-white font-bold py-3 rounded-2xl shadow-md shadow-orange-100 active:scale-95 transition-all text-sm"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-full mt-2 text-gray-400 font-semibold py-2 text-sm hover:text-gray-600 transition-colors"
                    >
                        Back to Profile
                    </button>
                </motion.div>
            </div>
            </>
        );
    }

    return (
        <>
        <TopPromoBar />
        <DesktopHeader />
        <div className="min-h-screen bg-[#FFF7F0] font-sans flex justify-center ">
            <div className="w-full max-w-md bg-[#FFF7F0] min-h-screen shadow-lg border border-gray-200 relative pb-8 md:max-w-none md:shadow-none md:border-0 md:pb-20">

                {/* ── Sticky Header ── */}
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100/60 shadow-sm md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none">
                    {/* Top row */}
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3 md:px-8 lg:px-10 md:pt-10 md:pb-2 md:gap-4">
                        <button
                            onClick={() => navigate("/profile")}
                            className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF7000] active:scale-90 transition-all cursor-pointer md:w-11 md:h-11 md:hover:bg-orange-100"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-gray-800 leading-tight md:text-3xl lg:text-4xl md:tracking-tight">My Bookings</h1>
                            <p className="text-[10px] text-orange-400 font-medium md:text-sm md:mt-1">
                                {activeTab === "pooja" ? (
                                    `${bookings.length} active ${bookings.length === 1 ? "booking" : "bookings"}`
                                ) : activeTab === "live" ? (
                                    `${liveBookings.length} active ${liveBookings.length === 1 ? "booking" : "bookings"}`
                                ) : activeTab === "chadhava" ? (
                                    `${chadhavaBookings.length} ${chadhavaBookings.length === 1 ? "seva" : "sevas"} offered`
                                ) : activeTab === "shopOrders" ? (
                                    `${shopifyOrders.length} ${shopifyOrders.length === 1 ? "order" : "orders"} placed`
                                ) : (
                                    "Consultation history"
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="px-4 pb-3 flex gap-2 md:px-8 lg:px-10 md:pt-3 md:pb-4 md:gap-3">
                        <button
                            onClick={() => setActiveTab("pooja")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border cursor-pointer md:flex-none md:px-7 md:py-2.5 md:text-sm ${
                                activeTab === "pooja"
                                    ? "bg-[#FF7000] text-white border-[#FF7000] shadow-md shadow-orange-100"
                                    : "bg-orange-50 text-orange-400 border-orange-100"
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Puja Bookings ({bookings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("live")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border cursor-pointer md:flex-none md:px-7 md:py-2.5 md:text-sm ${
                                activeTab === "live"
                                    ? "bg-[#FF7000] text-white border-[#FF7000] shadow-md shadow-orange-100"
                                    : "bg-orange-50 text-orange-400 border-orange-100"
                            }`}
                        >
                            <Video className="w-3.5 h-3.5" />
                            Live Puja ({liveBookings.length})
                        </button>
                        {/* Desktop/tablet-only extra tabs — new booking categories with real
                            fetched data (see fetchBookings above). Hidden on mobile so the
                            original 2-tab switcher stays pixel-identical there. */}
                        <button
                            onClick={() => setActiveTab("chadhava")}
                            className={`hidden md:flex md:flex-none items-center justify-center gap-1.5 md:px-7 md:py-2.5 rounded-full md:text-sm font-bold transition-all active:scale-95 border cursor-pointer ${
                                activeTab === "chadhava"
                                    ? "bg-[#FF7000] text-white border-[#FF7000] shadow-md shadow-orange-100"
                                    : "bg-orange-50 text-orange-400 border-orange-100"
                            }`}
                        >
                            <Flower2 className="w-3.5 h-3.5" />
                            Chadhava ({chadhavaBookings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("shopOrders")}
                            className={`hidden md:flex md:flex-none items-center justify-center gap-1.5 md:px-7 md:py-2.5 rounded-full md:text-sm font-bold transition-all active:scale-95 border cursor-pointer ${
                                activeTab === "shopOrders"
                                    ? "bg-[#FF7000] text-white border-[#FF7000] shadow-md shadow-orange-100"
                                    : "bg-orange-50 text-orange-400 border-orange-100"
                            }`}
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Shop Orders ({shopifyOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("consultation")}
                            className={`hidden md:flex md:flex-none items-center justify-center gap-1.5 md:px-7 md:py-2.5 rounded-full md:text-sm font-bold transition-all active:scale-95 border cursor-pointer ${
                                activeTab === "consultation"
                                    ? "bg-[#FF7000] text-white border-[#FF7000] shadow-md shadow-orange-100"
                                    : "bg-orange-50 text-orange-400 border-orange-100"
                            }`}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Consultation
                        </button>
                    </div>
                </div>

                {/* ── Desktop/tablet-only: Upcoming Booking hero + Stats row + Sub-filters ── */}
                <div className="hidden md:block md:px-8 lg:px-10 md:mt-6 md:space-y-6">
                    {heroBooking && countdown && (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF7000] to-[#FF9A45] p-6 lg:p-8 text-white shadow-lg shadow-orange-200/60">
                            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/10 rounded-full" />
                            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/25 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                                        <Hourglass className="w-3 h-3" />
                                        Upcoming Booking
                                    </span>
                                    <h3 className="text-xl lg:text-2xl font-bold mt-3">
                                        {heroBooking.poojaNameEng || heroBooking.pujaName || heroBooking.packageName || "Puja Service"}
                                    </h3>
                                    <p className="text-white/85 text-sm mt-1">
                                        {heroBooking.__kind === "live" ? "Live Mandir Puja" : "At Home Puja"} · {formatRowDate(heroBooking.bookingDate)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 lg:gap-4">
                                    {[
                                        { label: "Days", value: countdown.d },
                                        { label: "Hrs", value: countdown.h },
                                        { label: "Mins", value: countdown.m },
                                        { label: "Secs", value: countdown.s },
                                    ].map((unit) => (
                                        <div key={unit.label} className="bg-white/15 border border-white/20 rounded-2xl px-4 py-2.5 text-center min-w-[64px]">
                                            <p className="text-xl lg:text-2xl font-black leading-none">{String(unit.value).padStart(2, "0")}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-white/80 mt-1">{unit.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => goToRowTab(heroBooking.__kind === "live" ? "live" : "pooja")}
                                    className="shrink-0 bg-white text-[#FF7000] font-bold px-5 py-2.5 rounded-2xl text-sm shadow-md hover:bg-orange-50 transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stats row — every number is .length / .filter(...).length over real fetched arrays */}
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                        {[
                            { label: "Total Bookings", value: totalBookingsCount, icon: Calendar },
                            { label: "Upcoming", value: upcomingCount, icon: Hourglass },
                            { label: "Completed", value: completedCount, icon: CheckCircle2 },
                            { label: "Live Now", value: liveNowCount, icon: Video },
                            { label: "Chadhava", value: chadhavaCount, icon: Flower2 },
                            { label: "Shop Orders", value: shopOrdersCount, icon: ShoppingBag },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-2xl border border-orange-100/70 p-4 shadow-sm">
                                <stat.icon className="w-4 h-4 text-[#FF7000] mb-2" />
                                <p className="text-xl font-black text-gray-800 leading-none">{stat.value}</p>
                                <p className="text-[11px] text-gray-400 font-semibold mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Sub-filter row — real client-side filters over the fetched arrays, feeding the "All Bookings" table below */}
                    <div className="bg-white rounded-2xl border border-orange-100/70 p-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-orange-50 rounded-full p-1">
                            {(["all", "upcoming", "completed", "cancelled"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                                        statusFilter === s ? "bg-[#FF7000] text-white shadow-sm" : "text-orange-400 hover:bg-orange-100"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="text-xs border border-orange-100 rounded-xl px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                aria-label="From date"
                            />
                            <span className="text-xs text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="text-xs border border-orange-100 rounded-xl px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                aria-label="To date"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-orange-50/60 rounded-xl px-3 py-1.5 flex-1 min-w-[180px]">
                            <Search className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Search by Booking ID…"
                                className="bg-transparent text-xs text-gray-600 placeholder:text-gray-400 focus:outline-none w-full"
                            />
                        </div>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs font-bold text-[#FF7000] border border-orange-200 rounded-xl px-3.5 py-1.5 hover:bg-orange-50 transition-colors cursor-pointer"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div id="my-bookings-tab-content" className="px-4 mt-3 md:px-8 lg:px-10 md:mt-2">
                    <AnimatePresence mode="wait">
                        {activeTab === "pooja" ? (
                            bookings.length === 0 ? (
                                <motion.div
                                    key="empty-pooja"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-16 flex flex-col items-center justify-center text-center px-8 md:mt-24"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-5 shadow-inner md:w-24 md:h-24">
                                        <span className="text-3xl">🪔</span>
                                    </div>
                                    <h2 className="text-base font-bold text-gray-800 mb-1 md:text-2xl md:mb-2">No Puja Bookings Yet</h2>
                                    <p className="text-gray-400 text-xs leading-relaxed mb-6 md:text-sm md:max-w-sm">
                                        You haven't booked any pujas yet. Explore our services to get started!
                                    </p>
                                    <button
                                        onClick={() => navigate("/")}
                                        className="px-7 py-2.5 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm cursor-pointer md:px-9 md:py-3 md:text-base md:hover:bg-[#e56200] md:hover:shadow-xl"
                                    >
                                        Book a Puja
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list-pooja"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start"
                                >
                                    {bookings.map((booking, index) => {
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
                                                key={booking._id}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.07, type: "spring", stiffness: 300, damping: 28 }}
                                                className={`bg-white rounded-3xl overflow-hidden shadow-lg shadow-orange-100/60 border border-orange-100/80 transition-all md:hover:shadow-xl md:hover:shadow-orange-100 ${isPast ? "opacity-75 grayscale-[30%] scale-[0.98]" : ""
                                                    }`}
                                            >
                                                <div className={`relative px-4 py-3 overflow-hidden ${isPast ? "bg-gray-400" : "bg-gradient-to-r from-[#FF7000] to-[#FF9A45]"
                                                    }`}>
                                                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
                                                    <div className="absolute -bottom-5 -left-3 w-12 h-12 bg-white/10 rounded-full" />
                                                    <div className="relative flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                                            <span className="text-lg">{isPast ? "✅" : "🪔"}</span>
                                                            <h3 className="text-white font-bold text-sm leading-tight truncate">
                                                                {booking.poojaNameEng || "Puja Service"}
                                                                {isPast && <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">(Completed)</span>}
                                                            </h3>
                                                        </div>
                                                        <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                                                            {isOnline ? "Online" : "At Home"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-3 space-y-2.5">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="col-span-1 bg-[#FFF8F2] rounded-2xl p-2.5 flex flex-col items-center justify-center border border-orange-50 text-center">
                                                            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                                                                <User className="w-3.5 h-3.5 text-[#FF7000]" />
                                                            </div>
                                                            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">Devotee</p>
                                                            <p className="text-gray-800 font-bold text-xs leading-tight line-clamp-1">
                                                                {booking.bhaktName || booking.userName || "Devotee"}
                                                            </p>
                                                        </div>
                                                        <div className="col-span-1 bg-[#FFF8F2] rounded-2xl p-2.5 flex flex-col items-center justify-center border border-orange-50 text-center">
                                                            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                                                                <Calendar className="w-3.5 h-3.5 text-[#FF7000]" />
                                                            </div>
                                                            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">Date</p>
                                                            <p className="text-gray-800 font-bold text-[11px] leading-tight">{formattedDate}</p>
                                                            {isToday && (
                                                                <span className="text-[9px] bg-orange-500 text-white rounded-full px-1.5 py-0.5 font-bold mt-0.5">Today</span>
                                                            )}
                                                        </div>
                                                        <div className="col-span-1 bg-[#FFF8F2] rounded-2xl p-2.5 flex flex-col items-center justify-center border border-orange-50 text-center">
                                                            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                                                                <Clock className="w-3.5 h-3.5 text-[#FF7000]" />
                                                            </div>
                                                            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">Time</p>
                                                            <p className="text-gray-800 font-bold text-[11px] leading-tight">{formattedTime}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-[#FFF8F2] rounded-2xl px-3 py-2.5 border border-orange-100/70">
                                                        <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                            {booking.assignedPandit?.[0]?.profileImage ? (
                                                                <img
                                                                    src={booking.assignedPandit[0].profileImage}
                                                                    alt="Pandit Ji"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <User className="w-5 h-5 text-[#FF7000]" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                                                                {hasAssignedPandit ? "Pandit Ji Assigned" : "Awaiting Assignment"}
                                                            </p>
                                                            <p className="text-gray-800 font-bold text-sm truncate">
                                                                {hasAssignedPandit
                                                                    ? `Pandit ${booking.assignedPandit[0].firstName} ${booking.assignedPandit[0].lastName}`
                                                                    : "Not assigned yet"}
                                                            </p>
                                                        </div>
                                                        {hasAssignedPandit ? (
                                                            <div className="flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-xl shadow-sm flex-shrink-0">
                                                                <Star className="w-3 h-3 fill-white" />
                                                                <span className="text-[11px] font-bold">{booking.assignedPandit[0].rating?.toFixed(1) || "5.0"}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {hasAssignedPandit && (
                                                        isOnline ? (
                                                            <button
                                                                disabled={!isActionEnabled}
                                                                onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'video')}
                                                                className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] ${isActionEnabled
                                                                        ? "bg-gradient-to-r from-[#FF7000] to-[#FF9A45] text-white shadow-md shadow-orange-200"
                                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    }`}
                                                            >
                                                                <Video className="w-4 h-4" />
                                                                {isActionEnabled ? "Join Video Call" : (isOnline && !isToday ? "Video Call Restricted" : "Video Call — Not Available Yet")}
                                                            </button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    disabled={!isAudioCallEnabled}
                                                                    onClick={() => startCall(booking.assignedPandit?.[0]?._id, 'audio')}
                                                                    className={`w-12 h-11 rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] flex-shrink-0 ${isAudioCallEnabled
                                                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                        }`}
                                                                    title={isAudioCallEnabled ? "Call Panditji" : (isToday ? "Call Panditji — Awaiting Assignment" : "Call Restricted to Booking Date")}
                                                                >
                                                                    <Phone className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    disabled={!isActionEnabled}
                                                                    onClick={() => {
                                                                        if (hasAssignedPandit && booking.address?.coordinates) {
                                                                            const { lat, lng } = booking.address.coordinates;
                                                                            navigate(`/track-pandit/${booking.assignedPandit[0]._id}/${lat}/${lng}`);
                                                                        }
                                                                    }}
                                                                    className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] ${isActionEnabled
                                                                            ? "bg-gradient-to-r from-[#FF7000] to-[#FF9A45] text-white shadow-md shadow-orange-200"
                                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                        }`}
                                                                >
                                                                    <MapPin className="w-4 h-4" />
                                                                    {isActionEnabled ? "Track Panditji" : "Awaiting Departure"}
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )
                        ) : activeTab === "live" ? (
                            liveBookings.length === 0 ? (
                                <motion.div
                                    key="empty-live"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-16 flex flex-col items-center justify-center text-center px-8 md:mt-24"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-5 shadow-inner md:w-24 md:h-24">
                                        <span className="text-3xl">📺</span>
                                    </div>
                                    <h2 className="text-base font-bold text-gray-800 mb-1 md:text-2xl md:mb-2">No Live Pujas Booked</h2>
                                    <p className="text-gray-400 text-xs leading-relaxed mb-6 md:text-sm md:max-w-sm">
                                        You haven't booked any Live Pujas yet. Explore our temple services to participate online!
                                    </p>
                                    <button
                                        onClick={() => navigate("/chadhava")}
                                        className="px-7 py-2.5 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm cursor-pointer md:px-9 md:py-3 md:text-base md:hover:bg-[#e56200] md:hover:shadow-xl"
                                    >
                                        Explore Temples
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list-live"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start"
                                >
                                    {liveBookings.map((booking, index) => (
                                        <LiveBookingCard key={booking._id || index} booking={booking} index={index} />
                                    ))}
                                </motion.div>
                            )
                        ) : activeTab === "chadhava" ? (
                            chadhavaBookings.length === 0 ? (
                                <motion.div
                                    key="empty-chadhava"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-16 flex flex-col items-center justify-center text-center px-8 md:mt-24"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-5 shadow-inner md:w-24 md:h-24">
                                        <span className="text-3xl">🌸</span>
                                    </div>
                                    <h2 className="text-base font-bold text-gray-800 mb-1 md:text-2xl md:mb-2">No Chadhava Sevas Yet</h2>
                                    <p className="text-gray-400 text-xs leading-relaxed mb-6 md:text-sm md:max-w-sm">
                                        You haven't offered any Chadhava yet. Explore our temple sevas to offer one on your behalf.
                                    </p>
                                    <button
                                        onClick={() => navigate("/chadhava")}
                                        className="px-7 py-2.5 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm cursor-pointer md:px-9 md:py-3 md:text-base md:hover:bg-[#e56200] md:hover:shadow-xl"
                                    >
                                        Explore Chadhava
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list-chadhava"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start"
                                >
                                    {chadhavaBookings.map((booking, index) => (
                                        <ChadhavaBookingCard key={booking._id || index} booking={booking} index={index} />
                                    ))}
                                </motion.div>
                            )
                        ) : activeTab === "shopOrders" ? (
                            shopifyOrders.length === 0 ? (
                                <motion.div
                                    key="empty-shop"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-16 flex flex-col items-center justify-center text-center px-8 md:mt-24"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-5 shadow-inner md:w-24 md:h-24">
                                        <span className="text-3xl">🛍️</span>
                                    </div>
                                    <h2 className="text-base font-bold text-gray-800 mb-1 md:text-2xl md:mb-2">No Shop Orders Yet</h2>
                                    <p className="text-gray-400 text-xs leading-relaxed mb-6 md:text-sm md:max-w-sm">
                                        You haven't ordered any Puja Samagri yet. Visit the shop to get authentic, energized items delivered home.
                                    </p>
                                    <button
                                        onClick={() => navigate("/shop")}
                                        className="px-7 py-2.5 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm cursor-pointer md:px-9 md:py-3 md:text-base md:hover:bg-[#e56200] md:hover:shadow-xl"
                                    >
                                        Visit Shop
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="list-shop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:items-start"
                                >
                                    {shopifyOrders.map((order, index) => (
                                        <ShopifyOrderCard key={order._id || index} order={order} index={index} />
                                    ))}
                                </motion.div>
                            )
                        ) : (
                            <motion.div
                                key="empty-consultation"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-16 flex flex-col items-center justify-center text-center px-8 md:mt-24"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-5 shadow-inner md:w-24 md:h-24">
                                    <MessageCircle className="w-8 h-8 text-[#FF7000]" />
                                </div>
                                <h2 className="text-base font-bold text-gray-800 mb-1 md:text-2xl md:mb-2">Consultation History</h2>
                                <p className="text-gray-400 text-xs leading-relaxed mb-6 md:text-sm md:max-w-sm">
                                    Your consultation bookings will appear here. For details of a past consultation, please contact us on WhatsApp.
                                </p>
                                <a
                                    href={WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-7 py-2.5 bg-[#FF7000] text-white rounded-full font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm cursor-pointer md:px-9 md:py-3 md:text-base md:hover:bg-[#e56200] md:hover:shadow-xl inline-block"
                                >
                                    Chat on WhatsApp
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Desktop-only: All Bookings table (alternate rendering of the same fetched arrays) ── */}
                <div className="hidden lg:block lg:px-10 lg:mt-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Table2 className="w-4 h-4 text-[#FF7000]" />
                        <h2 className="text-lg font-bold text-gray-800">All Bookings</h2>
                        <span className="text-xs text-gray-400 font-medium">({filteredBookingRows.length})</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-orange-100/70 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-orange-50/60 text-left text-[11px] uppercase tracking-wider text-orange-400 font-bold">
                                    <th className="px-5 py-3">Service</th>
                                    <th className="px-5 py-3">Devotee</th>
                                    <th className="px-5 py-3">Date &amp; Time</th>
                                    <th className="px-5 py-3">Booking ID</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookingRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                                            No bookings match these filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookingRows.map((row) => (
                                        <tr key={row.key} className="border-t border-orange-50 hover:bg-orange-50/30 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span>{rowTypeMeta[row.type].icon}</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 leading-tight">{row.service}</p>
                                                        <p className="text-[11px] text-gray-400">{rowTypeMeta[row.type].label}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">{row.devotee}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{formatRowDateTime(row.dateVal)}</td>
                                            <td className="px-5 py-3.5 font-mono text-[12px] text-gray-500">
                                                {row.bookingId ? row.bookingId.substring(0, 10) : "N/A"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${rowStatusColor(row.bucket)}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => goToRowTab(row.type)}
                                                    className="text-[#FF7000] font-bold text-xs hover:underline cursor-pointer"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Alert Modal ── */}
            <AnimatePresence>
                {alertConfig.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center p-0 bg-black/50 backdrop-blur-sm md:items-center md:p-6"
                        onClick={() => setAlertConfig({ ...alertConfig, show: false })}
                    >
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 340, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[32px] p-7 w-full max-w-md text-center shadow-2xl md:rounded-[32px] md:max-w-lg md:p-8"
                        >
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${alertConfig.type === 'error' ? 'bg-red-50' :
                                    alertConfig.type === 'success' ? 'bg-emerald-50' :
                                        'bg-orange-50'
                                }`}>
                                {alertConfig.type === 'error' && <AlertCircle className="w-7 h-7 text-red-400" />}
                                {alertConfig.type === 'success' && <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
                                {alertConfig.type === 'info' && <Info className="w-7 h-7 text-orange-400" />}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{alertConfig.title}</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{alertConfig.message}</p>
                            <button
                                onClick={() => {
                                    setAlertConfig({ ...alertConfig, show: false });
                                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                                }}
                                className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 shadow-md cursor-pointer ${alertConfig.type === 'error' ? 'bg-red-500 shadow-red-100' :
                                        alertConfig.type === 'success' ? 'bg-emerald-500 shadow-emerald-100' :
                                            'bg-[#FF7000] shadow-orange-100'
                                    }`}
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        <SiteFooter />
        </>
    );
};

const LiveBookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const dateVal = booking.addedOn || booking.createdAt;
    const formattedDate = dateVal 
        ? new Date(dateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A";

    // Live mandir bookings are paid upfront, so a record that reaches this card
    // is confirmed (or completed). Derive status from the payment/completion
    // flags rather than a non-existent `status` field so it never reads "pending".
    const displayStatus = booking.isCompleted
        ? "completed"
        : booking.isPaymentDone
            ? "confirmed"
            : booking.status || "pending";

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-emerald-50 text-emerald-600 border border-emerald-100";
            case "completed":
                return "bg-blue-50 text-blue-600 border border-blue-100";
            case "cancelled":
                return "bg-red-50 text-red-600 border border-red-100";
            default:
                return "bg-orange-50 text-orange-600 border border-orange-100";
        }
    };

    const displayWish = booking.wish || booking.concern;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/70 relative overflow-hidden md:p-5 md:hover:shadow-md md:transition-shadow"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">📺</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">{booking.poojaNameEng || booking.pujaName || booking.packageName || "Live Mandir Puja"}</h3>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="truncate text-gray-600">{booking.templeName}</span>
                    </p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(displayStatus)}`}>
                    {displayStatus}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-orange-50/50">
                <div>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Devotee</p>
                    <p className="text-xs font-bold text-gray-700">{booking.bhaktName || booking.devoteeName || booking.userName || "N/A"}</p>
                    {booking.gotra && <p className="text-[10px] text-gray-400">Gotra: {booking.gotra}</p>}
                </div>
                <div>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Package Details</p>
                    <p className="text-xs font-bold text-gray-700 truncate">{booking.packageName || "Standard Package"}</p>
                    {booking.members && <p className="text-[10px] text-gray-400">{booking.members} member(s)</p>}
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-orange-50/50">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] text-gray-500">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1 text-[#FF7000]">
                    <span className="text-[10px] font-bold text-gray-400">Paid:</span>
                    <span className="text-sm font-black">₹{booking.amount}</span>
                </div>
            </div>

            {displayWish && (
                <div className="mt-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <p className="text-[9px] text-stone-400 font-semibold uppercase">Your Sankalp Wish</p>
                    <p className="text-xs text-stone-600 italic mt-0.5">"{displayWish}"</p>
                </div>
            )}
        </motion.div>
    );
};

// Field names below mirror pages/ProfilePage.tsx's ChadhavaBookingCard exactly
// (same `/chadhava-bookings/user/:phone` response shape), so no field is guessed.
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

    const selectionsText = booking.selections
        ? booking.selections.map((s: any) => `${s.quantity}x ${s.name}`).join(", ")
        : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/70 relative overflow-hidden md:p-5 md:hover:shadow-md md:transition-shadow"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">🌸</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">{booking.deity || "Chadhava Seva"}</h3>
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

            {selectionsText && (
                <div className="mt-3 bg-orange-50/30 p-2.5 rounded-xl border border-orange-100/30">
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">Offerings</p>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{selectionsText}</p>
                </div>
            )}

            {booking.addPrasadBox && (
                <div className="mt-2 flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-yellow-100">
                    <span>📦</span>
                    <span>Prasad Box Added (Dispatched to Home Address)</span>
                </div>
            )}

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

            <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-orange-50/50">
                <span className="text-[10px] text-gray-400 font-medium">
                    Order ID: <span className="font-mono text-gray-500 font-semibold">{booking.razorpayOrderId ? booking.razorpayOrderId.substring(0, 12) : "N/A"}</span>
                </span>
                <div className="flex items-center gap-1 text-[#FF7000]">
                    <span className="text-[10px] font-bold text-gray-400">Total:</span>
                    <span className="text-sm font-black">₹{booking.totalAmount}</span>
                </div>
            </div>

            {booking.wish && (
                <div className="mt-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <p className="text-[9px] text-stone-400 font-semibold uppercase">Your Prayer / Wish</p>
                    <p className="text-xs text-stone-600 italic mt-0.5">"{booking.wish}"</p>
                </div>
            )}
        </motion.div>
    );
};

// Field names below mirror pages/ProfilePage.tsx's ShopifyOrderCard exactly
// (same `/shopify-orders/user/:phone` response shape), so no field is guessed.
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
            className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/70 relative overflow-hidden md:p-5 md:hover:shadow-md md:transition-shadow"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">🛍️</span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">Shop Order</h3>
                    </div>
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
                            <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.qty} · ₹{item.price?.toLocaleString("en-IN")}</p>
                        </div>
                    </div>
                ))}
            </div>

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

export default MyBookingsPage;