import { useState } from "react";
import { ChevronDown, ChevronRight, Crown, Diamond, Flower2, Check, Users } from "lucide-react";
import {
  advanceOf,
  effectiveAdvancePercent,
  fmtINR,
  type VivahPackage,
} from "../../data/vivahCatalog";
import { Head, Orn, Wrap } from "./ui";
import { AnimatePresence, EASE, motion, useTap } from "./motion";
import { useVivahLang, tfmt } from "../../i18n/vivah";

/**
 * The three marriage tiers, drawn exactly as the approved comps: a coloured
 * gradient header (orange / gold / maroon) carrying the badge, name, tagline,
 * pandit count and pricing, over an ivory body of ticked inclusions.
 *
 * Every value shown comes from the admin catalog — only the tier colouring and
 * the section chrome are local, so an admin edit is reflected here verbatim.
 */

/** How many ticked inclusions a card shows before the "+N more" fold on a phone. */
const PERKS_ON_PHONE = 3;

type Tier = {
  elite: boolean;
  popular: boolean;
  grad: string;
  ring: string;
  btn: string;
  Emblem: typeof Crown;
};

const tierOf = (p: VivahPackage): Tier => {
  const elite = p.packageId.includes("maharaja") || p.badge === "Elite";
  const popular = p.badge === "Most Popular" || p.packageId.includes("raj");
  if (elite) {
    return {
      elite: true,
      popular: false,
      grad: "from-[#6E1A1A] via-[#5A1414] to-[#3E0E0E]",
      ring: "border-[#E2C79B]",
      btn: "bg-gradient-to-b from-[#7A1F1E] to-[#4E1211] text-viv-cream border-[#4E1211]",
      Emblem: Diamond,
    };
  }
  if (popular) {
    return {
      elite: false,
      popular: true,
      grad: "from-[#D2A44B] via-[#C08F2B] to-[#A5761B]",
      ring: "border-[#E8CE93]",
      btn: "bg-gradient-to-b from-[#D2A44B] to-[#A5761B] text-[#3A2205] border-[#A5761B]",
      Emblem: Crown,
    };
  }
  return {
    elite: false,
    popular: false,
    grad: "from-[#E06A0B] via-[#D25400] to-[#A83E00]",
    ring: "border-[#F3CFA6]",
    btn: "bg-gradient-to-b from-[#E8730F] to-[#C04A01] text-white border-[#C04A01]",
    Emblem: Flower2,
  };
};

export default function VivahPackageCards({
  packages,
  onSelect,
  onDetails,
  showHeader = true,
  advancePercent,
  ritualNames = [],
  footerNote = null,
}: {
  packages: VivahPackage[];
  onSelect: (pkg: VivahPackage) => void;
  onDetails?: (pkg: VivahPackage) => void;
  showHeader?: boolean;
  /** Catalog-level advance %, so the "reserve now" line matches checkout. */
  advancePercent?: number;
  /** Every ritual in the journey — shown on each card as its coverage. */
  ritualNames?: string[];
  footerNote?: string | null;
}) {
  const tap = useTap();
  const { t: tr, tc } = useVivahLang();
  const [openRituals, setOpenRituals] = useState<string | null>(null);
  /** Phone-only: the tiers run 5–7 perks each and three of them stacked is a
      wall. We show the first few and let the family open the rest in place. */
  const [openPerks, setOpenPerks] = useState<string | null>(null);

  return (
    <Wrap>
      {showHeader && (
        <>
          <Head title={tr("packages.title")} sub={tr("packages.sub")} />
          <Orn className="mb-6" />
        </>
      )}

      <div className={`grid gap-4 sm:gap-5 lg:gap-6 md:grid-cols-3 ${showHeader ? "" : "mt-1"}`}>
        {packages.map((p) => {
          const t = tierOf(p);
          const save = Math.max(0, (p.strikePrice || 0) - p.price);
          const pct = effectiveAdvancePercent(advancePercent, p);
          const adv = advanceOf(p.price, pct);
          const perks = p.perks || [];
          const perksOpen = openPerks === p.packageId;
          const extraPerks = Math.max(0, perks.length - PERKS_ON_PHONE);

          return (
            <article
              key={p.packageId}
              className={`bg-white rounded-[20px] overflow-hidden border ${t.ring} shadow-[0_14px_36px_-22px_rgba(90,40,10,0.5)] flex flex-col h-full`}
            >
              {/* Coloured header — a fixed measure so the three price rows line
                  up across the row however long each tagline runs. */}
              <div
                className={`relative bg-gradient-to-br ${t.grad} px-3.5 sm:px-5 pt-3 sm:pt-4 pb-3.5 sm:pb-4 text-white flex flex-col md:min-h-[236px]`}
              >
                <t.Emblem
                  className="absolute -right-5 -top-5 w-20 h-20 sm:w-28 sm:h-28 opacity-[0.13]"
                  aria-hidden="true"
                />
                {p.badge && (
                  <span className="relative inline-flex self-start items-center gap-1.5 text-[9px] sm:text-[9.5px] font-bold tracking-[0.12em] sm:tracking-[0.14em] uppercase bg-white/22 border border-white/25 backdrop-blur rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1">
                    <span aria-hidden="true">★</span>
                    {tc(p.badge)}
                  </span>
                )}
                <h3 className="relative display text-[19px] sm:text-[26px] lg:text-[28px] leading-tight mt-1.5 sm:mt-2">
                  {tc(p.name)}
                </h3>
                {p.tagline && (
                  <p className="relative text-[11px] sm:text-[12px] text-white/85 mt-0.5 sm:mt-1 leading-snug">
                    {tc(p.tagline)}
                  </p>
                )}

                <span className="relative mt-2 sm:mt-3 mb-auto inline-flex self-start items-center gap-1.5 text-[10.5px] sm:text-[11px] font-semibold bg-black/18 border border-white/20 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1">
                  <Users className="w-3 h-3" />
                  {tfmt(tr((p.panditCount || 1) > 1 ? "packages.panditN" : "packages.pandit1"), { n: p.panditCount || 1 })}
                </span>

                <div className="relative flex flex-wrap items-end gap-x-2 sm:gap-x-2.5 gap-y-1 sm:gap-y-1.5 mt-2 sm:mt-3">
                  {!!p.strikePrice && p.strikePrice > p.price && (
                    <span className="text-[12px] sm:text-[13.5px] text-white/60 line-through">
                      {fmtINR(p.strikePrice)}
                    </span>
                  )}
                  <span className="text-[21px] sm:text-[27px] font-bold leading-none">{fmtINR(p.price)}</span>
                  <span className="text-[10.5px] sm:text-[11.5px] text-white/75 pb-0.5">
                    {tr("packages.allInclusive")}
                  </span>
                  {save > 0 && (
                    <span className="text-[9px] sm:text-[9.5px] font-bold tracking-wide uppercase bg-white text-viv-orange rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 whitespace-nowrap">
                      {tfmt(tr("packages.youSave"), { amt: fmtINR(save) })}
                    </span>
                  )}
                </div>
              </div>

              {/* Ivory body */}
              <div className="px-3.5 sm:px-5 py-3.5 sm:py-4 flex-1 flex flex-col bg-viv-sheet">
                <ul className="space-y-1.5 sm:space-y-2 flex-1">
                  {perks.map((perk, i) => (
                    <li
                      key={`${perk.title}-${i}`}
                      className={`gap-2 sm:gap-2.5 ${
                        i < PERKS_ON_PHONE || perksOpen ? "flex" : "hidden sm:flex"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-viv-gold shrink-0 mt-[2px] sm:mt-[3px]" />
                      <span className="text-[12px] sm:text-[12.5px] text-viv-ink/90 leading-snug">
                        {tc(perk.title)}
                      </span>
                    </li>
                  ))}
                </ul>

                {extraPerks > 0 && (
                  <button
                    onClick={() => setOpenPerks(perksOpen ? null : p.packageId)}
                    aria-expanded={perksOpen}
                    className="sm:hidden mt-2 self-start text-[11.5px] font-semibold text-viv-orange inline-flex items-center gap-1"
                  >
                    {perksOpen
                      ? tr("packages.fewerPerks")
                      : tfmt(tr("packages.morePerks"), { n: extraPerks })}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${perksOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                )}

                {/* What the family is actually buying: the whole journey. */}
                {p.includesAllRituals !== false && ritualNames.length > 0 && (
                  <div className="mt-3 sm:mt-3.5 rounded-xl border border-viv-hair bg-white overflow-hidden">
                    <button
                      onClick={() =>
                        setOpenRituals(openRituals === p.packageId ? null : p.packageId)
                      }
                      aria-expanded={openRituals === p.packageId}
                      className="w-full flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-left"
                    >
                      <Check className="w-3.5 h-3.5 text-viv-orange shrink-0" />
                      <span className="flex-1 min-w-0 text-[11.5px] sm:text-[12px] font-semibold text-viv-ink">
                        {tfmt(tr("packages.covers"), { n: ritualNames.length })}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-viv-gold shrink-0 transition-transform ${
                          openRituals === p.packageId ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {openRituals === p.packageId && (
                        <motion.div
                          key="r"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: EASE }}
                          style={{ overflow: "hidden" }}
                        >
                          <ul className="px-3.5 pb-3 space-y-1.5">
                            {ritualNames.map((n, i) => (
                              <li
                                key={n}
                                className="flex gap-2 text-[11.5px] text-viv-muted leading-snug"
                              >
                                <span className="text-viv-gold shrink-0">{i + 1}.</span>
                                {tc(n)}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <motion.button
                  {...tap}
                  onClick={() => (onDetails ? onDetails(p) : onSelect(p))}
                  className={`mt-3 sm:mt-3.5 w-full font-semibold text-[12.5px] sm:text-[13.5px] py-2.5 sm:py-3 rounded-lg border transition-all hover:brightness-[1.06] ${t.btn}`}
                >
                  {tfmt(tr("packages.viewDetails"), { name: tc(p.name) })}
                </motion.button>

                <p className="text-[10.5px] sm:text-[11px] text-center text-viv-muted mt-2 sm:mt-2.5">
                  {tfmt(tr("packages.reserve"), { amt: fmtINR(adv) })}
                </p>

                <button
                  onClick={() => onSelect(p)}
                  className="mt-0.5 sm:mt-1 w-full text-[12px] font-semibold text-viv-orange py-1.5 inline-flex items-center justify-center gap-1 hover:underline"
                >
                  {tr("common.bookNow")} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {footerNote && (
        <p className="text-center text-[12px] text-viv-muted-2 mt-5 italic">{footerNote}</p>
      )}
    </Wrap>
  );
}
