import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../utils/apiConfig";
import { motion } from "framer-motion";
import {
    ChevronLeft, Search, X, AlertCircle, Loader2,
    Flower2, Package, ShoppingBag,
} from "lucide-react";
import BookingCard, { type BookingCardData, type BookingKind } from "../components/booking/BookingCard";

/**
 * My Bookings.
 *
 * ── The problem this rewrite solves ─────────────────────────────────────────
 * The page had two tabs — "Puja Bookings" and "Live Puja" — which is a split
 * along a distinction devotees do not make. A devotee thinks "my Rudrabhishek",
 * not "my live-mandir-flagged booking", so a temple seva and a home puja living
 * in different tabs meant hunting through both. Meanwhile chadhava bookings and
 * shop orders had no home here at all and were buried in the profile page.
 *
 * So the tabs now follow what was BOUGHT, which is how a devotee remembers it:
 *
 *     Pooja Bookings  ·  Chadhava  ·  Shop Orders
 *
 * Live-mandir and home pujas sit together under Pooja Bookings and are told
 * apart by a type chip on the card — the same chip that makes the list
 * scannable, and searchable.
 */

type Tab = { key: BookingKind; label: string; Icon: typeof Flower2 };

const TABS: Tab[] = [
    { key: "pooja", label: "Pooja Bookings", Icon: Flower2 },
    { key: "chadhava", label: "Chadhava", Icon: Package },
    { key: "shop", label: "Shop Orders", Icon: ShoppingBag },
];

/** Old links used ?tab=live / ?tab=pooja; both now land on Pooja Bookings. */
function tabFromParam(v: string | null): BookingKind {
    if (v === "chadhava") return "chadhava";
    if (v === "shop") return "shop";
    return "pooja";
}

/**
 * The chip that makes a list of pujas scannable.
 *
 * Derived rather than stored, because no single field carries it: a temple seva
 * has `templeName`, a home puja has `poojaMode`, and the puja's own name is the
 * only place the ritual is written down. Longest match first so "Rudrabhishek"
 * is not swallowed by a looser pattern.
 */
const PUJA_TYPES = [
    "Rudrabhishek", "Satyanarayan", "Griha Pravesh", "Havan", "Lakshmi",
    "Ganesh", "Navgraha", "Mahamrityunjay", "Kaal Bhairav", "Hanuman",
    "Sharad Purnima", "Janmashtami", "Chadhava", "Vivah", "Katha", "Puja", "Pooja",
];

function pujaTypeOf(b: any): string {
    const name = String(b?.poojaNameEng || b?.packageName || "");
    const hit = PUJA_TYPES.find((t) => name.toLowerCase().includes(t.toLowerCase()));
    if (hit) return hit;
    return b?.templeName ? "Temple Seva" : "Puja";
}

/** Rupees still owed. Bookings made before advances existed have no amountPaid. */
function balanceDueOf(b: any): number {
    const total = Number(b?.amount) || 0;
    const paid = Number(b?.amountPaid) || 0;
    if (b?.isPaymentDone || b?.paymentStatus === "paid") return 0;
    return Math.max(0, Math.round((total - paid) * 100) / 100);
}

function statusOf(b: any): BookingCardData["status"] {
    if (b?.isCompleted) return "completed";
    if (b?.status === "cancelled" || b?.cancellation) return "cancelled";
    if (b?.isPaymentDone || b?.paymentStatus === "paid") return "confirmed";
    // Something was paid but not everything: an advance booking. It IS confirmed
    // — a Pandit Ji is being dispatched for it — it simply still owes a balance.
    if (Number(b?.amountPaid) > 0) return "balance_due";
    return "pending";
}

const MyBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [tab, setTab] = useState<BookingKind>(tabFromParam(searchParams.get("tab")));
    const [query, setQuery] = useState("");
    const [pujas, setPujas] = useState<any[]>([]);
    const [chadhavas, setChadhavas] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const raw = localStorage.getItem("user_data");
            if (!raw) { navigate("/"); return; }
            const phone = String(JSON.parse(raw)?.phone || "").replace(/\D/g, "");

            // One tab failing must not blank the other two — each request
            // degrades to an empty list of its own.
            const [p, c, s] = await Promise.all([
                axios.get(`${API_URL}/bookings/get-pending-poojabookings/${phone}`).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/chadhava-bookings/user/${phone}`).catch(() => ({ data: { data: [] } })),
                axios.get(`${API_URL}/shopify-orders/user/${phone}`).catch(() => ({ data: { data: [] } })),
            ]);

            // Temple sevas are paid upfront: an abandoned Razorpay popup leaves
            // an unpaid pending row behind. Showing those as bookings is how the
            // old list filled up with things the devotee never actually bought.
            const list: any[] = Array.isArray(p.data) ? p.data : [];
            setPujas(list.filter((b) => b.isPaymentDone || b.isCompleted || !b.templeName));
            setChadhavas(c.data?.data || []);
            setOrders(s.data?.data || []);
            setError(null);
        } catch (err) {
            console.error("[MyBookings] load failed:", err);
            setError("We could not load your bookings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const [payingId, setPayingId] = useState<string | null>(null);

    /**
     * Settle the balance on a puja booked with an advance.
     *
     * The Pandit Ji's QR does the same job in person. Both converge on one
     * idempotent server update, so paying here while he is scanning cannot take
     * the money twice — whichever lands second is told it is already settled.
     */
    const payPoojaBalance = async (bookingId: string) => {
        setPayingId(bookingId);
        try {
            const { data: order } = await axios.post(`${API_URL}/bookings/${bookingId}/balance-order`, {});

            await new Promise<void>((resolve, reject) => {
                const open = () => {
                    const Ctor = (window as any).Razorpay;
                    if (!Ctor) return reject(new Error("Razorpay SDK failed to load."));
                    const rzp = new Ctor({
                        key: order.razorpayKeyId,
                        // The server's figure, in paise — never a locally derived one.
                        amount: Math.round(Number(order.amount) * 100),
                        currency: "INR",
                        name: "Pandit Ji At Request",
                        description: "Balance payment",
                        order_id: order.razorpayOrderId,
                        handler: async (response: any) => {
                            try {
                                await axios.post(`${API_URL}/bookings/${bookingId}/complete-balance-payment`, {
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature,
                                });
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        },
                        modal: { ondismiss: () => reject(new Error("cancelled")) },
                        theme: { color: "#F97316" },
                    });
                    rzp.on("payment.failed", (r: any) =>
                        reject(new Error(r?.error?.description || "Your payment could not be processed.")),
                    );
                    rzp.open();
                };
                if ((window as any).Razorpay) return open();
                const el = document.createElement("script");
                el.src = "https://checkout.razorpay.com/v1/checkout.js";
                el.async = true;
                el.onload = open;
                el.onerror = () => reject(new Error("Razorpay SDK failed to load."));
                document.body.appendChild(el);
            });

            // Re-read rather than patching local state: the pandit's QR may have
            // settled it in the meantime, and the server is the only truth here.
            await fetchAll();
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || "Could not complete the payment.";
            // A dismissed Razorpay sheet is a choice, not an error worth shouting about.
            if (String(msg).toLowerCase() !== "cancelled") setError(msg);
        } finally {
            setPayingId(null);
        }
    };

    // ── Rows, normalised to one card shape per tab ──────────────────────────
    const rows: BookingCardData[] = useMemo(() => {
        if (tab === "pooja") {
            return pujas.map((b) => ({
                id: b._id,
                type: pujaTypeOf(b),
                title: b.poojaNameEng || b.packageName || "Puja",
                subtitle: b.templeName || undefined,
                date: b.bookingDate,
                amount: b.amount,
                currency: b.currency,
                chargedAmount: b.chargedAmount,
                status: statusOf(b),
                balanceDue: balanceDueOf(b),
                mode: b.poojaMode === "offline" ? "offline" : "online",
                reference: b.razorpayOrderId || b._id,
            }));
        }
        if (tab === "chadhava") {
            return chadhavas.map((b) => ({
                id: b._id,
                type: b.deity || "Chadhava",
                title: b.chadhavaName || `${b.deity || "Chadhava"} Chadhava`,
                subtitle: b.templeName,
                date: b.bookingDate || b.createdAt,
                amount: b.totalAmount,
                currency: b.currency,
                chargedAmount: b.chargedAmount,
                status: statusOf(b),
                reference: b.razorpayOrderId || b._id,
            }));
        }
        return orders.map((o) => ({
            id: o._id,
            type: `${o.items?.length || 0} item${(o.items?.length || 0) === 1 ? "" : "s"}`,
            title: o.items?.[0]?.title || o.items?.[0]?.name || "Vedic Shop order",
            subtitle: (o.items?.length || 0) > 1 ? `+ ${o.items.length - 1} more` : undefined,
            date: o.createdAt,
            amount: o.totalAmount,
            currency: o.currency,
            chargedAmount: o.chargedAmount,
            status: statusOf(o),
            reference: o.orderNumber || o.razorpayOrderId || o._id,
        }));
    }, [tab, pujas, chadhavas, orders]);

    // Search across every visible field, not just the title: devotees look for
    // "Kashi" or "Rudrabhishek" as readily as the full booking name.
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            [r.title, r.type, r.subtitle, r.reference].filter(Boolean).join(" ").toLowerCase().includes(q),
        );
    }, [rows, query]);

    const counts = { pooja: pujas.length, chadhava: chadhavas.length, shop: orders.length };

    // ── States ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-[#FFF7F0]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-[#E05A10]" />
                    <p className="text-sm text-stone-500">Loading your bookings…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-[#FFF7F0] px-6">
                <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 text-center">
                    <AlertCircle className="mx-auto mb-3 h-9 w-9 text-red-400" />
                    <h2 className="mb-1 text-lg font-bold text-stone-900">Something went wrong</h2>
                    <p className="mb-5 text-sm text-stone-500">{error}</p>
                    <button
                        onClick={fetchAll}
                        className="w-full rounded-xl bg-[#E05A10] py-3 text-sm font-bold text-white active:scale-[0.98]"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#FFF7F0]">
            {/* max-w-md on phones, wider on desktop — the old fixed rail left
                two thirds of a laptop screen empty. */}
            <div className="mx-auto w-full max-w-md lg:max-w-3xl">

                <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#FFF7F0]/95 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                        <button
                            onClick={() => navigate("/profile")}
                            aria-label="Back to profile"
                            /* h-10 w-10 — the old 36px control was under the 44px
                               minimum touch target. */
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-stone-900">My Bookings</h1>
                    </div>

                    {/* Tabs. Horizontally scrollable so three labels never
                        squeeze to unreadable on a 360px screen. */}
                    <div
                        role="tablist"
                        aria-label="Booking type"
                        className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {TABS.map(({ key, label, Icon }) => {
                            const active = tab === key;
                            return (
                                <button
                                    key={key}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => { setTab(key); setQuery(""); }}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                                        active
                                            ? "border-[#E05A10] bg-[#E05A10] text-white"
                                            : "border-stone-200 bg-white text-stone-600 hover:border-orange-300"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                    {label}
                                    <span className={`rounded-full px-1.5 text-[10.5px] tabular-nums ${active ? "bg-white/25" : "bg-stone-100"}`}>
                                        {counts[key]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search — the actual answer to "I can't find my puja".
                        Shown once there are enough rows for scanning to fail. */}
                    {rows.length > 3 && (
                        <div className="px-4 pb-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by puja, temple or booking id"
                                    aria-label="Search your bookings"
                                    /* text-base, not sm: iOS zooms the page in on
                                       focus for anything under 16px. */
                                    className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-9 text-base text-stone-800 outline-none placeholder:text-stone-400 focus:border-[#E05A10] sm:text-sm"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery("")}
                                        aria-label="Clear search"
                                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main className="px-4 py-4">
                    {visible.length === 0 ? (
                        <div className="mt-14 px-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                                {query
                                    ? <Search className="h-7 w-7 text-[#E05A10]" />
                                    : React.createElement(TABS.find((t) => t.key === tab)!.Icon, { className: "h-7 w-7 text-[#E05A10]" })}
                            </div>
                            <h2 className="mb-1 text-base font-bold text-stone-900">
                                {query ? "No matches" : `No ${TABS.find((t) => t.key === tab)!.label.toLowerCase()} yet`}
                            </h2>
                            <p className="mb-6 text-[13px] leading-relaxed text-stone-500">
                                {query
                                    ? `Nothing matches “${query}”. Try a puja name or temple.`
                                    : "When you book, it will show up here."}
                            </p>
                            {!query && (
                                <button
                                    onClick={() => navigate(tab === "shop" ? "/shop" : tab === "chadhava" ? "/chadhava" : "/")}
                                    className="rounded-full bg-[#E05A10] px-6 py-2.5 text-sm font-bold text-white active:scale-95"
                                >
                                    {tab === "shop" ? "Visit the shop" : tab === "chadhava" ? "Offer a chadhava" : "Book a puja"}
                                </button>
                            )}
                        </div>
                    ) : (
                        // Two columns from `sm` up — one long single-file column
                        // on a wide screen is a lot of scrolling for nothing.
                        <div className="grid gap-3 sm:grid-cols-2">
                            {visible.map((row, i) => (
                                <motion.div
                                    key={row.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    /* Capped so a long list does not make the last
                                       card wait a second to appear. */
                                    transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.2 }}
                                >
                                    <BookingCard
                                        kind={tab}
                                        data={row}
                                        onPayBalance={tab === "pooja" ? payPoojaBalance : undefined}
                                        payingId={payingId}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MyBookingsPage;
