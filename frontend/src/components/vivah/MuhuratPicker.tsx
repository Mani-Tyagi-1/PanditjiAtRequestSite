import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  DEFAULT_VIVAH_MUHURATS,
  ddmmyyyyToIso,
  type CatalogMuhurat,
} from "../../data/vivahCatalog";
import { formatMuhuratDate } from "../../data/vivahContent";
import { EASE, useTap } from "./motion";

/**
 * Marriage-themed date + time picker.
 *
 * One control replaces the three the checkout used to have (a native date
 * input, a native time input and a separate horizontal muhurat strip). The
 * family can pick ANY date — the auspicious dates the admin publishes are
 * simply marked with a marigold dot and, when chosen, register as a pre-booking
 * exactly as the old strip did.
 *
 * Deliberately dependency-free: plain Date maths, no calendar library.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => String(n).padStart(2, "0");
const toDDMMYYYY = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "14:30" → "2:30 PM". Empty in, empty out. */
export const prettyTime = (hhmm: string): string => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
  if (!m) return "";
  const h = Number(m[1]);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${period}`;
};

/** Auspicious windows a Vivah usually falls in — a shortcut, never a limit. */
const TIME_PRESETS = [
  { label: "Brahma Muhurat", sub: "04:30", value: "04:30" },
  { label: "Morning", sub: "09:00", value: "09:00" },
  { label: "Abhijit", sub: "12:00", value: "12:00" },
  { label: "Evening", sub: "18:30", value: "18:30" },
  { label: "Night lagna", sub: "21:00", value: "21:00" },
];

export default function MuhuratPicker({
  /** DD/MM/YYYY */
  date,
  onDateChange,
  /** HH:mm (24h) */
  time,
  onTimeChange,
  muhurats,
  onMuhuratChange,
  needMuhuratHelp,
  onNeedMuhuratHelpChange,
}: {
  date: string;
  onDateChange: (ddmmyyyy: string) => void;
  time: string;
  onTimeChange: (hhmm: string) => void;
  muhurats: CatalogMuhurat[];
  onMuhuratChange: (m: CatalogMuhurat | null) => void;
  needMuhuratHelp: boolean;
  onNeedMuhuratHelpChange: (v: boolean) => void;
}) {
  const still = useReducedMotion();
  const tap = useTap();

  const today = useMemo(() => startOfDay(new Date()), []);

  /**
   * The shubh dates the calendar marks = the admin catalog UNION the bundled
   * full-season panchang list. An admin who has only entered November must not
   * empty every other month — the bundled 2026–27 season fills the gaps, the
   * catalog wins on any date both carry, and anything already past is dropped.
   * Sorted chronologically so "upcoming" chips read in order.
   */
  const upcoming = useMemo(() => {
    const t = startOfDay(new Date()).getTime();
    const byDate = new Map<string, CatalogMuhurat>();
    DEFAULT_VIVAH_MUHURATS.forEach((m) => byDate.set(m.date, m));
    muhurats.forEach((m) => byDate.set(m.date, m)); // catalog overrides
    return [...byDate.values()]
      .map((m) => ({ m, ts: (() => {
        const iso = ddmmyyyyToIso(m.date);
        const d = iso ? new Date(iso) : null;
        return d && !isNaN(d.getTime()) ? startOfDay(d).getTime() : NaN;
      })() }))
      .filter((x) => Number.isFinite(x.ts) && x.ts >= t)
      .sort((a, b) => a.ts - b.ts)
      .map((x) => x.m);
  }, [muhurats]);

  /** Keyed DD/MM/YYYY for O(1) lookup while painting the grid. */
  const shubh = useMemo(() => {
    const map = new Map<string, CatalogMuhurat>();
    upcoming.forEach((m) => map.set(m.date, m));
    return map;
  }, [upcoming]);

  /** Open on the chosen date, else the first published muhurat, else today. */
  const initialCursor = useMemo(() => {
    const iso = ddmmyyyyToIso(date);
    if (iso) return new Date(iso);
    const first = upcoming[0]?.date;
    const firstIso = first ? ddmmyyyyToIso(first) : "";
    if (firstIso) {
      const d = new Date(firstIso);
      if (d >= today) return d;
    }
    return today;
    // Mount-only: after that the family drives the cursor with the arrows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cursor, setCursor] = useState(
    () => new Date(initialCursor.getFullYear(), initialCursor.getMonth(), 1)
  );
  const [dir, setDir] = useState(1);

  const grid = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const lead = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= days; i++) cells.push(new Date(y, m, i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const move = (delta: number) => {
    setDir(delta);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const selectDay = (d: Date) => {
    const key = toDDMMYYYY(d);
    if (key === date) {
      // Tapping the chosen day again clears it.
      onDateChange("");
      onMuhuratChange(null);
      return;
    }
    onDateChange(key);
    onMuhuratChange(shubh.get(key) || null);
    // Choosing a date is an explicit answer — stop asking the Pandit Ji to pick.
    if (needMuhuratHelp) onNeedMuhuratHelpChange(false);
  };

  const canGoBack =
    cursor.getFullYear() > today.getFullYear() ||
    (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() > today.getMonth());

  const chosenMuhurat = date ? shubh.get(date) : undefined;

  return (
    <div className="rounded-2xl border border-viv-hair bg-white/70 overflow-hidden">
      {/* ── Let the Pandit Ji decide ── */}
      <button
        type="button"
        onClick={() => {
          const next = !needMuhuratHelp;
          onNeedMuhuratHelpChange(next);
          if (next) {
            onTimeChange("");
            onDateChange("");
            onMuhuratChange(null);
          }
        }}
        aria-pressed={needMuhuratHelp}
        className={`w-full flex items-center gap-3 text-left px-4 py-3.5 transition-colors ${
          needMuhuratHelp ? "bg-gradient-to-r from-viv-tint to-viv-tint-2" : "bg-transparent"
        }`}
      >
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            needMuhuratHelp
              ? "bg-viv-maroon text-viv-gold-lt"
              : "bg-viv-gold-pale text-viv-maroon border border-viv-hair"
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-semibold text-viv-ink">
            Let our Pandit Ji choose the shubh muhurat
          </span>
          <span className="block text-[11.5px] text-viv-muted mt-0.5 leading-snug">
            Panchang Shuddhi — we find the most auspicious tithi, nakshatra and lagna for you.
          </span>
        </span>
        <span
          className={`w-12 h-6.5 rounded-full p-0.5 shrink-0 transition-colors ${
            needMuhuratHelp ? "bg-viv-maroon" : "bg-viv-muted-2/45"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className={`block w-5.5 h-5.5 rounded-full bg-white shadow ${
              needMuhuratHelp ? "ml-auto" : ""
            }`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!needMuhuratHelp && (
          <motion.div
            key="cal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-viv-hair px-3 sm:px-4 pt-3.5 pb-4">
              <div className="max-w-[430px] mx-auto">
              {/* ── Month header ── */}
              <div className="flex items-center justify-between gap-2 px-1">
                <motion.button
                  type="button"
                  onClick={() => canGoBack && move(-1)}
                  disabled={!canGoBack}
                  aria-label="Previous month"
                  {...tap}
                  className="w-8 h-8 rounded-full border border-viv-hair bg-white flex items-center justify-center text-viv-maroon disabled:opacity-35 disabled:cursor-not-allowed hover:border-viv-gold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>

                <div className="text-center overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={`${cursor.getFullYear()}-${cursor.getMonth()}`}
                      initial={still ? { opacity: 0 } : { opacity: 0, x: dir * 18 }}
                      animate={still ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      exit={still ? { opacity: 0 } : { opacity: 0, x: dir * -18 }}
                      transition={{ duration: 0.24, ease: EASE }}
                      className="display text-[17px] text-viv-maroon leading-none"
                    >
                      {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                    </motion.p>
                  </AnimatePresence>
                  <span className="viv-orn mt-1.5 scale-75">
                    <span className="text-viv-gold text-[8px] leading-none">✦</span>
                  </span>
                </div>

                <motion.button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next month"
                  {...tap}
                  className="w-8 h-8 rounded-full border border-viv-hair bg-white flex items-center justify-center text-viv-maroon hover:border-viv-gold transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

              {/* ── Weekday rail ── */}
              <div className="grid grid-cols-7 mt-3 mb-1">
                {WEEK.map((w, i) => (
                  <span
                    key={`${w}-${i}`}
                    className="text-center text-[10px] font-semibold tracking-[0.12em] uppercase text-viv-muted-2"
                  >
                    {w}
                  </span>
                ))}
              </div>

              {/* ── Day grid ── */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`g-${cursor.getFullYear()}-${cursor.getMonth()}`}
                    initial={still ? { opacity: 0 } : { opacity: 0, x: dir * 26 }}
                    animate={still ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    exit={still ? { opacity: 0 } : { opacity: 0, x: dir * -26 }}
                    transition={{ duration: 0.26, ease: EASE }}
                    className="grid grid-cols-7 gap-1"
                  >
                    {grid.map((d, i) => {
                      if (!d) return <span key={`e${i}`} />;
                      const key = toDDMMYYYY(d);
                      const past = d < today;
                      const isToday = d.getTime() === today.getTime();
                      const on = key === date;
                      const auspicious = shubh.has(key);
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          disabled={past}
                          onClick={() => selectDay(d)}
                          aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${
                            auspicious ? " — shubh muhurat" : ""
                          }`}
                          aria-pressed={on}
                          whileTap={still || past ? undefined : { scale: 0.9 }}
                          className={`relative h-11 rounded-lg flex flex-col items-center justify-center text-[13px] transition-colors ${
                            past
                              ? "text-viv-muted-2/45 cursor-not-allowed"
                              : on
                                ? "bg-viv-maroon text-viv-cream font-semibold shadow-[0_6px_16px_-8px_rgba(97,26,27,0.9)]"
                                : auspicious
                                  ? "bg-viv-gold-pale/70 text-viv-maroon font-semibold hover:bg-viv-gold-pale border border-viv-hair"
                                  : "text-viv-ink hover:bg-viv-tint"
                          } ${isToday && !on ? "ring-1 ring-viv-gold" : ""}`}
                        >
                          {on && !still && (
                            <motion.span
                              layoutId="viv-day-ring"
                              className="absolute inset-0 rounded-lg ring-2 ring-viv-gold"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                          <span className="relative">{d.getDate()}</span>
                          {auspicious && !past && (
                            <span
                              className={`relative mt-0.5 w-1 h-1 rounded-full ${
                                on ? "bg-viv-gold-lt" : "bg-viv-orange"
                              }`}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── Legend ── */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 px-1">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-viv-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-viv-orange" /> Shubh muhurat
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-viv-muted">
                  <span className="w-3 h-3 rounded ring-1 ring-viv-gold" /> Today
                </span>
                <span className="text-[10.5px] text-viv-muted-2">
                  Any date can be chosen — the marked ones are already verified as auspicious.
                </span>
              </div>

              {/* ── Chosen date + pre-booking note ── */}
              <AnimatePresence initial={false}>
                {!!date && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="mt-3 rounded-xl bg-viv-tint border border-viv-hair px-3.5 py-3"
                  >
                    <p className="text-[12.5px] text-viv-ink flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-viv-gold shrink-0" />
                      <span className="font-semibold">{formatMuhuratDate(date)}</span>
                      {chosenMuhurat && (
                        <span className="text-[10.5px] font-bold tracking-wide uppercase text-viv-orange bg-white border border-viv-hair rounded-full px-2 py-0.5">
                          Shubh
                        </span>
                      )}
                    </p>
                    {chosenMuhurat && (
                      <p className="text-[11.5px] text-viv-muted mt-1 leading-snug">
                        {[chosenMuhurat.day, chosenMuhurat.tithi, chosenMuhurat.nakshatra]
                          .filter(Boolean)
                          .join(" · ")}
                        {" — pre-booking this date reserves it with an advance."}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Time ── */}
              <div className="mt-4">
                <p className="text-[12.5px] font-semibold text-viv-ink flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-viv-gold" />
                  Ceremony time
                  <span className="font-normal text-viv-muted-2">(optional)</span>
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {TIME_PRESETS.map((t) => {
                    const on = time === t.value;
                    return (
                      <motion.button
                        key={t.value}
                        type="button"
                        {...tap}
                        onClick={() => onTimeChange(on ? "" : t.value)}
                        className={`rounded-full px-3 py-1.5 border text-left transition-colors ${
                          on
                            ? "bg-viv-maroon text-viv-cream border-viv-maroon"
                            : "bg-white text-viv-ink/85 border-viv-hair hover:border-viv-gold"
                        }`}
                      >
                        <span className="block text-[11.5px] font-semibold leading-tight">
                          {t.label}
                        </span>
                        <span
                          className={`block text-[9.5px] leading-tight ${
                            on ? "text-viv-cream/70" : "text-viv-muted-2"
                          }`}
                        >
                          {prettyTime(t.sub)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <label className="mt-2.5 flex items-center gap-3 bg-white border border-viv-hair rounded-xl px-3.5 py-2.5 focus-within:border-viv-gold focus-within:ring-2 focus-within:ring-viv-gold/15 transition-all">
                  <span className="text-[11px] text-viv-muted-2 shrink-0">Or set any time</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="flex-1 bg-transparent text-[14px] text-viv-ink focus:outline-none"
                  />
                </label>
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reassurance when the Pandit Ji is choosing ── */}
      <AnimatePresence initial={false}>
        {needMuhuratHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-viv-hair px-4 py-3.5">
              <p className="text-[12px] text-viv-muted leading-relaxed">
                Our Pandit Ji will study the Panchang and call you with two or three auspicious
                dates before anything is fixed. Prefer to choose yourself? Turn this off and the
                calendar opens.
              </p>
              {upcoming.length > 0 && (
                <>
                  <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-viv-muted-2 mt-3 mb-1.5">
                    Upcoming shubh dates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {upcoming.slice(0, 6).map((m) => (
                      <motion.button
                        key={m.date}
                        type="button"
                        {...tap}
                        onClick={() => {
                          onNeedMuhuratHelpChange(false);
                          onDateChange(m.date);
                          onMuhuratChange(m);
                          const iso = ddmmyyyyToIso(m.date);
                          if (iso) {
                            const d = new Date(iso);
                            setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                          }
                        }}
                        className="text-[11.5px] font-medium text-viv-maroon bg-white border border-viv-hair rounded-full px-3 py-1.5 hover:border-viv-gold transition-colors"
                      >
                        {formatMuhuratDate(m.date)}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { toDDMMYYYY };
