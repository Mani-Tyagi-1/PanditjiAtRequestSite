import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Check, ChevronDown, Sparkles, Clock } from "lucide-react";
import { formatMuhuratDate } from "../../data/vivahContent";
import { prettyTime, toDDMMYYYY } from "./MuhuratPicker";

/* ==========================================================================
   PER-RITUAL SCHEDULING
   --------------------------------------------------------------------------
   A Vedic vivah is not one appointment. Kundali Milan is done months ahead,
   Tilak and Shagun in the days before, the Vivah Sanskar on the muhurat itself
   and Mandir Darshan after the wedding. Asking a family for one date and then
   quietly performing five ceremonies on it is wrong — so once more than one
   ritual is booked we ask for a date per ritual.

   Two things keep this from becoming a chore:
     1. Every row is PREFILLED from the main vivah date using the customary
        offset for that ritual, so a family that agrees with the tradition can
        simply leave it alone.
     2. Every row is OPTIONAL. Blank means "our team will fix this with you",
        which is genuinely how many families work, and is stored as "" rather
        than being guessed at.
   ========================================================================== */

export type ScheduleEntry = { date: string; time: string };
export type SchedulePlan = Record<string, ScheduleEntry>;

export type ScheduleRitual = {
  slug: string;
  name: string;
  /** Set when this card folds several catalog rituals (the Core Ceremony). */
  componentSlugs?: string[];
};

/**
 * Customary offset in days from the wedding day, and the hour the ritual is
 * usually performed. Negative = before the vivah. These are defaults a family
 * can overrule, never rules we enforce.
 */
const CUSTOM: Record<string, { offset: number; time: string }> = {
  // Keys are the catalog's real slugs (see VIVAH_RITUAL_ORDER). Anything not
  // listed falls back to the wedding day itself, which is the safe guess.
  "kundali-milan": { offset: -45, time: "10:00" },
  "vivah-muhoorat": { offset: -30, time: "10:00" },
  shagun: { offset: -7, time: "11:00" },
  "ganesh-gauri-puja": { offset: -2, time: "09:00" },
  "haldi-ceremony": { offset: -1, time: "10:00" },
  "mandap-sthapana": { offset: -1, time: "16:00" },
  "vivah-sanskar": { offset: 0, time: "19:30" },
  "mandir-darshan": { offset: 2, time: "09:00" },
  "post-vivah-live-darshan": { offset: 3, time: "09:00" },
  // Regional ceremonies an admin may add to the catalog later.
  "sagai-roka": { offset: -21, time: "11:00" },
  roka: { offset: -21, time: "11:00" },
  tilak: { offset: -7, time: "11:00" },
  mehndi: { offset: -2, time: "16:00" },
  sangeet: { offset: -1, time: "19:00" },
  saptapadi: { offset: 0, time: "20:30" },
  kanyadaan: { offset: 0, time: "20:00" },
  vidaai: { offset: 1, time: "10:00" },
  "griha-pravesh": { offset: 1, time: "11:00" },
  "satyanarayan-katha": { offset: 5, time: "10:00" },
};

const DEFAULT_RULE = { offset: 0, time: "10:00" };
export const customFor = (slug: string) => CUSTOM[slug] || DEFAULT_RULE;

/** DD/MM/YYYY → Date (local midnight). Returns null on anything malformed. */
const parseDDMMYYYY = (s: string): Date | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || "").trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const shift = (base: Date, days: number): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Build the suggested plan for a set of rituals around a wedding day.
 * A suggestion that would land in the past is pulled forward to today — we
 * would rather propose something bookable than something impossible.
 */
export const suggestPlan = (rituals: ScheduleRitual[], vivahDate: string): SchedulePlan => {
  const base = parseDDMMYYYY(vivahDate);
  if (!base) return {};
  const floor = startOfToday();
  const plan: SchedulePlan = {};
  for (const r of rituals) {
    const rule = customFor(r.slug);
    const when = shift(base, rule.offset);
    plan[r.slug] = {
      date: toDDMMYYYY(when < floor ? floor : when),
      time: rule.time,
    };
  }
  return plan;
};

/**
 * Flatten a display plan onto the slugs the SERVER bills.
 *
 * The landing page folds everything from the 7th ritual onward into one
 * "Vivah Sanskar — Core Ceremony" card, so the family dates that card rather
 * than each ceremony inside it. But those ceremonies are NOT all on the same
 * day — Mandir Darshan is two days after the pheras — and they are billed and
 * tracked individually. So a folded card's date becomes the anchor, and each
 * slug underneath keeps its own customary spacing relative to it.
 *
 * Move the card and the whole fold moves with it, keeping its internal shape.
 */
export const expandPlan = (rituals: ScheduleRitual[], plan: SchedulePlan): SchedulePlan => {
  const out: SchedulePlan = {};
  for (const r of rituals) {
    const entry = plan[r.slug] || { date: "", time: "" };
    const targets = r.componentSlugs?.length ? r.componentSlugs : [r.slug];

    if (targets.length === 1) {
      out[targets[0]] = entry;
      continue;
    }

    const anchor = parseDDMMYYYY(entry.date);
    const anchorRule = customFor(r.slug);
    const floor = startOfToday();
    for (const slug of targets) {
      if (!anchor) {
        // Undated fold — leave every ceremony under it undated too.
        out[slug] = { date: "", time: customFor(slug).time };
        continue;
      }
      const rule = customFor(slug);
      const when = shift(anchor, rule.offset - anchorRule.offset);
      out[slug] = {
        date: toDDMMYYYY(when < floor ? floor : when),
        // The card's own slug keeps the time the family actually set.
        time: slug === r.slug ? entry.time : rule.time,
      };
    }
  }
  return out;
};

/** DD/MM/YYYY → the yyyy-mm-dd an <input type="date"> speaks, and back. */
const toISO = (ddmmyyyy: string): string => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(ddmmyyyy || "").trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
const fromISO = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

const todayISO = () => toISO(toDDMMYYYY(startOfToday()));

/** Human label for how a ritual sits relative to the wedding day. */
const relLabel = (slug: string): string => {
  const { offset } = customFor(slug);
  if (offset === 0) return "On the vivah day";
  if (offset < 0) return `${Math.abs(offset)} day${Math.abs(offset) > 1 ? "s" : ""} before`;
  return `${offset} day${offset > 1 ? "s" : ""} after`;
};

export default function RitualSchedule({
  rituals,
  plan,
  onChange,
  vivahDate,
  onReset,
}: {
  rituals: ScheduleRitual[];
  plan: SchedulePlan;
  onChange: (slug: string, entry: ScheduleEntry) => void;
  /** The main vivah date; drives the "reset to customary" affordance. */
  vivahDate: string;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);

  const filled = useMemo(
    () => rituals.filter((r) => plan[r.slug]?.date).length,
    [rituals, plan]
  );

  if (rituals.length < 2) return null;

  return (
    <div className="mt-5 rounded-2xl border border-viv-hair bg-white/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <span className="w-8 h-8 rounded-xl bg-viv-tint border border-viv-hair flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4 text-viv-orange" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold text-viv-ink">
            Dates for each ritual
          </span>
          <span className="block text-[11px] text-viv-muted mt-0.5">
            {filled} of {rituals.length} scheduled · the rest we'll plan with you
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-viv-muted shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-3.5 pb-3 sm:pb-3.5">
              <p className="text-[11.5px] text-viv-muted leading-relaxed mb-3">
                Every ceremony has its own day. We've filled in the customary dates around your
                vivah — change any of them, or leave one blank and our team will fix it with you.
              </p>

              {vivahDate && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-viv-maroon border border-viv-hair rounded-full px-3 py-1.5 mb-3 hover:border-viv-gold transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-viv-gold" />
                  Reset to customary dates
                </button>
              )}

              <div className="space-y-2 sm:space-y-2.5">
                {rituals.map((r, i) => {
                  const entry = plan[r.slug] || { date: "", time: "" };
                  const set = !!entry.date;
                  return (
                    <motion.div
                      key={r.slug}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.24) }}
                      className={`rounded-xl border px-2.5 sm:px-3 py-2.5 transition-colors ${
                        set
                          ? "border-viv-gold/45 bg-viv-tint/45"
                          : "border-viv-hair bg-white/70"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
                            set ? "bg-viv-orange" : "border border-viv-hair bg-white"
                          }`}
                        >
                          {set && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-viv-ink leading-tight">
                            {r.name}
                          </p>
                          <p className="text-[10.5px] text-viv-muted mt-0.5">
                            {relLabel(r.slug)}
                            {set && (
                              <>
                                {" · "}
                                <span className="text-viv-maroon font-semibold">
                                  {formatMuhuratDate(entry.date) || entry.date}
                                  {entry.time ? `, ${prettyTime(entry.time)}` : ""}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* A native date and a native time field will not fit
                          side by side on a phone: each has an intrinsic min
                          width it refuses to shrink below, so the pair used to
                          overflow the card. Stacked below sm, paired above. */}
                      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_104px] gap-2 mt-2 pl-6">
                        <label className="min-w-0 flex items-center gap-1.5 bg-white border border-viv-hair rounded-lg px-2.5 py-2 sm:py-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-viv-gold shrink-0" />
                          <input
                            type="date"
                            aria-label={`Date for ${r.name}`}
                            min={todayISO()}
                            value={toISO(entry.date)}
                            onChange={(e) =>
                              onChange(r.slug, { ...entry, date: fromISO(e.target.value) })
                            }
                            className="w-full min-w-0 bg-transparent text-[12px] text-viv-ink focus:outline-none"
                          />
                        </label>
                        <label className="min-w-0 flex items-center gap-1.5 bg-white border border-viv-hair rounded-lg px-2.5 py-2 sm:py-1.5">
                          <Clock className="w-3.5 h-3.5 text-viv-gold shrink-0" />
                          <input
                            type="time"
                            aria-label={`Time for ${r.name}`}
                            value={entry.time}
                            onChange={(e) =>
                              onChange(r.slug, { ...entry, time: e.target.value })
                            }
                            className="w-full min-w-0 bg-transparent text-[12px] text-viv-ink focus:outline-none"
                          />
                        </label>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
