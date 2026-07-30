import { ArrowRight, Check, Eye, Leaf, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { fmtINR, type Ritual } from "../../data/vivahCatalog";
import { Head, Orn, Wrap } from "./ui";
import { EASE, RevealItem, Stagger, useLift, useTap, Reveal } from "./motion";

/**
 * The Vivah Ritual Journey — every ritual individually bookable.
 *
 * Each card carries the step, the name in English and Devanagari, a one-line
 * description, its dakshina and its samagri, and two distinct actions:
 *   • View — opens the full detail drawer (mantra, significance, Saptapadi…)
 *   • Add  — toggles the ritual into the family's own selection
 * The selected state is loud on purpose: gold ring, filled tick, orange price,
 * because "did that actually get added?" is the question this screen has to
 * answer at a glance.
 */

export default function VivahRitualCards({
  rituals,
  selected,
  onView,
  onToggle,
  samagriIncluded,
}: {
  rituals: Ritual[];
  selected: Set<string>;
  onView: (r: Ritual) => void;
  onToggle: (slug: string) => void;
  /** When true the family already has a package, so à-la-carte adds are hidden. */
  samagriIncluded?: boolean;
}) {
  const lift = useLift();
  const tap = useTap();

  return (
    <Wrap>
      <Reveal>
        <Head
          title="Your Vivah Ritual Journey"
          sub="A harmonious flow of sacred rituals, from start to finish. Book the whole journey as a package — or choose only the rituals your family needs."
        />
        <Orn className="mb-6" />
      </Reveal>

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {rituals.map((r) => {
          const on = selected.has(r.slug);
          return (
            <RevealItem key={r.slug} className="h-full">
              <motion.article
                {...lift}
                className={`relative h-full flex flex-col rounded-2xl border overflow-hidden transition-colors ${
                  on
                    ? "border-viv-orange bg-gradient-to-b from-viv-tint to-white shadow-[0_14px_32px_-20px_rgba(192,74,1,0.8)]"
                    : "border-viv-hair bg-white hover:border-viv-gold shadow-[0_10px_26px_-22px_rgba(90,40,10,0.6)]"
                }`}
              >
                {/* Added ribbon */}
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 460, damping: 26 }}
                      className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 text-[9.5px] font-bold tracking-[0.12em] uppercase bg-viv-orange text-white rounded-full px-2.5 py-1"
                    >
                      <Check className="w-3 h-3" /> Added
                    </motion.span>
                  )}
                </AnimatePresence>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start gap-3">
                    <span className="relative shrink-0">
                      <span
                        className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border ${
                          on
                            ? "border-viv-orange bg-white"
                            : "border-viv-hair bg-gradient-to-b from-viv-gold-pale to-[#EFD9AE]"
                        }`}
                      >
                        {r.image ? (
                          <img
                            src={r.image}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[24px] leading-none">{r.emoji}</span>
                        )}
                      </span>
                      <span className="absolute -left-1 -top-1 w-5 h-5 rounded-full bg-viv-maroon text-viv-gold-lt text-[10px] font-bold flex items-center justify-center">
                        {r.step}
                      </span>
                    </span>

                    <div className="min-w-0 flex-1 pr-12">
                      <h3 className="display text-[16px] text-viv-ink leading-snug">
                        {r.titleEng}
                      </h3>
                      {r.titleHindi && (
                        <p className="text-[12px] text-viv-maroon/80 mt-0.5">{r.titleHindi}</p>
                      )}
                    </div>
                  </div>

                  {/* Fixed two-line measure: `flex-1` on the clamped element
                      itself lets the box grow past the clamp and leak a sliver
                      of the third line, so the spacer is kept separate. */}
                  <p className="text-[11.5px] text-viv-muted leading-relaxed mt-3 line-clamp-2 overflow-hidden h-[34px]">
                    {r.journeyDesc || r.shortDesc}
                  </p>
                  <span className="flex-1" aria-hidden="true" />

                  {/* Pricing */}
                  <div className="mt-3 pt-3 border-t border-viv-hair/70">
                    {r.price != null ? (
                      <div className="flex items-end justify-between gap-2">
                        <span>
                          <span className="block text-[9.5px] font-bold tracking-[0.12em] uppercase text-viv-muted-2">
                            Dakshina
                          </span>
                          <span
                            className={`block text-[19px] font-semibold leading-none mt-0.5 ${
                              on ? "text-viv-orange" : "text-viv-ink"
                            }`}
                          >
                            {fmtINR(r.price)}
                          </span>
                        </span>
                        {r.samagriPrice > 0 && (
                          <span className="text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] text-viv-muted">
                              <Leaf className="w-3 h-3 text-viv-gold" />
                              samagri
                            </span>
                            <span className="block text-[12px] font-semibold text-viv-muted">
                              + {fmtINR(r.samagriPrice)}
                            </span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-viv-muted">
                        Included in every marriage package
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-px bg-viv-hair/70 border-t border-viv-hair/70">
                  <motion.button
                    type="button"
                    {...tap}
                    onClick={() => onView(r)}
                    className="bg-white/90 hover:bg-viv-tint text-viv-maroon text-[12.5px] font-semibold py-3 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </motion.button>

                  {r.price != null ? (
                    <motion.button
                      type="button"
                      {...tap}
                      onClick={() => onToggle(r.slug)}
                      aria-pressed={on}
                      className={`text-[12.5px] font-semibold py-3 inline-flex items-center justify-center gap-1.5 transition-colors ${
                        on
                          ? "bg-viv-orange text-white hover:brightness-105"
                          : "bg-white/90 text-viv-orange hover:bg-viv-tint"
                      }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={on ? "on" : "off"}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.16, ease: EASE }}
                          className="inline-flex items-center gap-1.5"
                        >
                          {on ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Add
                            </>
                          )}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                  ) : (
                    <span className="bg-white/60 text-viv-muted-2 text-[12px] py-3 inline-flex items-center justify-center">
                      In packages
                    </span>
                  )}
                </div>
              </motion.article>
            </RevealItem>
          );
        })}
      </Stagger>

      {!samagriIncluded && (
        <Reveal>
          <p className="text-center text-[11.5px] text-viv-muted-2 mt-5 italic">
            Add the rituals you need and continue — or take a complete package above and every
            ritual is included.{" "}
            <span className="inline-flex items-center gap-1 not-italic font-semibold text-viv-orange">
              <ArrowRight className="w-3 h-3" />
            </span>
          </p>
        </Reveal>
      )}
    </Wrap>
  );
}
