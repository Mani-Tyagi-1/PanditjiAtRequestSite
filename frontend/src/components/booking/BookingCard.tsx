import {
    Calendar, MapPin, Video, Home, Package, Flower2, ShoppingBag,
    CheckCircle2, Clock3, XCircle, ChevronRight, Hash,
} from "lucide-react";
import { paidMoney } from "../../utils/currency";

/**
 * One booking, in one card, across all three tabs.
 *
 * ── What changed and why ────────────────────────────────────────────────────
 * The old card led with a saffron gradient banner, two decorative circles and
 * an emoji, then split three facts across a three-column icon grid. Devotees
 * still could not find a booking in the list, because none of that chrome was
 * the thing they scan for: WHICH puja, WHEN, and IS IT DONE.
 *
 * So the hierarchy is now literal — type chip, name, date, status — with the
 * decoration removed rather than restyled. A card that reads at a glance beats
 * a card that looks impressive and has to be studied.
 *
 * Emoji are gone as structural icons: they render differently on every
 * platform, ignore the type scale and cannot be themed. Lucide throughout.
 */

export type BookingKind = "pooja" | "chadhava" | "shop";

export type BookingCardData = {
    id: string;
    /** "Rudrabhishek", "Griha Pravesh" — the chip that makes scanning possible. */
    type?: string;
    title: string;
    /** Temple, city, or the shop order's item summary. */
    subtitle?: string;
    date?: string | Date | null;
    /** INR value; rendered in the currency it was PAID in. */
    amount?: number;
    currency?: string;
    chargedAmount?: number;
    status: "confirmed" | "pending" | "completed" | "cancelled";
    /** Online / at-home, for pooja bookings. */
    mode?: "online" | "offline";
    reference?: string;
};

const STATUS = {
    completed: { label: "Completed", Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    confirmed: { label: "Confirmed", Icon: CheckCircle2, cls: "bg-blue-50 text-blue-700 border-blue-200" },
    pending: { label: "Payment pending", Icon: Clock3, cls: "bg-amber-50 text-amber-800 border-amber-200" },
    cancelled: { label: "Cancelled", Icon: XCircle, cls: "bg-stone-100 text-stone-600 border-stone-200" },
} as const;

const KIND_ICON = { pooja: Flower2, chadhava: Package, shop: ShoppingBag } as const;

/** "Tomorrow" / "In 3 days" / "12 Aug 2026" — relative where it helps, absolute otherwise. */
function formatWhen(value?: string | Date | null): { text: string; soon: boolean } | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;

    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((day.getTime() - today.getTime()) / 86_400_000);

    const abs = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    // Relative only inside the window where it is genuinely easier to parse
    // than a date; past and far-future read better as the date itself.
    if (days === 0) return { text: `Today · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`, soon: true };
    if (days === 1) return { text: "Tomorrow", soon: true };
    if (days > 1 && days <= 7) return { text: `In ${days} days · ${abs}`, soon: true };
    return { text: abs, soon: false };
}

export default function BookingCard({
    kind,
    data,
    onClick,
}: {
    kind: BookingKind;
    data: BookingCardData;
    onClick?: () => void;
}) {
    const status = STATUS[data.status] ?? STATUS.confirmed;
    const KindIcon = KIND_ICON[kind];
    const when = formatWhen(data.date);
    const ModeIcon = data.mode === "offline" ? Home : Video;

    // A whole-card button only when there is somewhere to go — a card that
    // depresses on tap and then does nothing reads as broken.
    const Tag = onClick ? "button" : "div";

    return (
        <Tag
            {...(onClick ? { type: "button" as const, onClick } : {})}
            className={`w-full text-left bg-white rounded-2xl border border-stone-200 p-3.5 transition-colors ${
                onClick ? "hover:border-orange-300 active:bg-stone-50 cursor-pointer" : ""
            }`}
        >
            {/* Row 1 — the two things a devotee scans for. The type chip is
                first because it is what distinguishes one booking from the
                nine others on the screen. */}
            <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#E05A10]">
                    <KindIcon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                    {data.type && (
                        <span className="mb-1 inline-block rounded-md bg-orange-100/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9A3A0A]">
                            {data.type}
                        </span>
                    )}
                    <h3 className="truncate text-[14.5px] font-bold leading-snug text-stone-900">
                        {data.title}
                    </h3>
                    {data.subtitle && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-stone-500">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{data.subtitle}</span>
                        </p>
                    )}
                </div>

                {onClick && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-300" aria-hidden="true" />}
            </div>

            {/* Row 2 — when, how, how much. One line, aligned, no icon grid. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-stone-100 pt-2.5">
                {when && (
                    <span className={`flex items-center gap-1 text-[12px] font-semibold ${when.soon ? "text-[#E05A10]" : "text-stone-600"}`}>
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {when.text}
                    </span>
                )}

                {data.mode && (
                    <span className="flex items-center gap-1 text-[12px] text-stone-500">
                        <ModeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {data.mode === "offline" ? "At your home" : "Online"}
                    </span>
                )}

                {typeof data.amount === "number" && data.amount > 0 && (
                    // Tabular figures so amounts line up down the list instead
                    // of jittering with each digit width.
                    <span className="ml-auto text-[13px] font-extrabold tabular-nums text-stone-900">
                        {paidMoney(data)}
                    </span>
                )}
            </div>

            {/* Row 3 — status and reference. Status carries an ICON as well as a
                colour: colour alone is unreadable for a colourblind devotee. */}
            <div className="mt-2.5 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${status.cls}`}>
                    <status.Icon className="h-3 w-3" aria-hidden="true" />
                    {status.label}
                </span>

                {data.reference && (
                    <span className="ml-auto flex items-center gap-0.5 truncate font-mono text-[10.5px] text-stone-400">
                        <Hash className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                        {data.reference.slice(-12)}
                    </span>
                )}
            </div>
        </Tag>
    );
}
