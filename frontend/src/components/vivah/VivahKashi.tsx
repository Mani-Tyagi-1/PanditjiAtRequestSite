import { useMemo, useRef, useState } from "react";
import Shloka, { VIVAH_SHLOKAS } from "./Shloka";
import { useVivahLang, tfmt } from "../../i18n/vivah";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Landmark,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  advanceOf,
  effectiveAdvancePercent,
  fmtINR,
  type VivahKashi,
  type VivahPackage,
} from "../../data/vivahCatalog";
import { initialsOf } from "../../data/vivahContent";
import { Btn, Head, Orn, Wrap } from "./ui";
import { EASE, Reveal, RevealItem, Stagger, useLift, useTap } from "./motion";

/**
 * "Invite a Pandit Ji from Kashi" — one continuous chain, not a scatter of
 * toggles.
 *
 *   1. Choose your Acharya   (or leave it to us)
 *   2. Choose the package it joins
 *   3. Continue to checkout with both already locked in
 *
 * Each step only unlocks once the one above it is answered, and the running
 * total is visible the whole way down, so "what will this actually cost me"
 * is never a question. Checkout then shows a single confirmation row rather
 * than asking the same question a second time.
 *
 * The Acharya list is built to scale: a responsive grid, a search box once the
 * roster passes a dozen, and a show-all control so 5 or 500 profiles both read
 * the same.
 */

const PAGE = 6;
const SEARCH_AT = 9;

type Step = { n: number; title: string; done: boolean };

function StepHead({ n, title, hint, done }: { n: number; title: string; hint?: string; done: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold transition-colors ${
          done ? "bg-viv-orange text-white" : "bg-viv-gold-pale text-viv-maroon border border-viv-hair"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={done ? "done" : "n"}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            {done ? <Check className="w-3.5 h-3.5" /> : n}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="min-w-0">
        <span className="display block text-[17px] text-viv-ink leading-snug">{title}</span>
        {hint && <span className="block text-[11.5px] text-viv-muted mt-0.5">{hint}</span>}
      </span>
    </div>
  );
}

export default function VivahKashi({
  kashi,
  packages,
  advancePercent,
  panditName,
  onPanditNameChange,
  packageId,
  onPackageIdChange,
  onContinue,
}: {
  kashi: VivahKashi;
  packages: VivahPackage[];
  advancePercent?: number;
  /** "" = nothing chosen yet, ANY = we assign one. */
  panditName: string;
  onPanditNameChange: (v: string) => void;
  packageId: string;
  onPackageIdChange: (v: string) => void;
  /** Fires only once both steps are answered. */
  onContinue: (pkg: VivahPackage, acharya: string) => void;
}) {
  const lift = useLift();
  const tap = useTap();
  const { t, tc } = useVivahLang();
  const premium = kashi.premiumPrice || 0;
  const pandits = kashi.pandits || [];

  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  /* Step 3 stays live even before steps 1 and 2 are answered: a dead button
     tells the family nothing about WHY it is dead. Pressing it walks them back
     to the first unanswered step and pulses it — the same scroll-and-flash the
     checkout uses for a missed field. */
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const [flashStep, setFlashStep] = useState<1 | 2 | null>(null);

  const scrollFlash = (n: 1 | 2) => {
    const el = (n === 1 ? step1Ref : step2Ref).current;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashStep(n);
    window.setTimeout(() => setFlashStep(null), 2600);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pandits;
    return pandits.filter((p) =>
      `${p.name} ${p.temple || ""} ${p.experienceYears || ""}`.toLowerCase().includes(q)
    );
  }, [pandits, query]);

  const visible = showAll ? filtered : filtered.slice(0, PAGE);
  const hiddenCount = Math.max(0, filtered.length - visible.length);

  const chosenPkg = packages.find((p) => p.packageId === packageId) || null;
  const acharyaDone = panditName.length > 0;
  const total = (chosenPkg?.price || 0) + premium;
  const pct = effectiveAdvancePercent(advancePercent, chosenPkg);
  const advance = chosenPkg ? advanceOf(total, pct) : 0;

  const steps: Step[] = [
    { n: 1, title: t("kashi.step1"), done: acharyaDone },
    { n: 2, title: t("kashi.step2"), done: !!chosenPkg },
    { n: 3, title: t("kashi.step3"), done: false },
  ];

  return (
    <Wrap>
      <Reveal>
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.16em] uppercase text-viv-orange bg-viv-tint border border-viv-hair rounded-full px-3 py-1.5">
            <Sparkles className="w-3 h-3" /> {t("kashi.addon")}
          </span>
        </div>
        <Head
          className="mt-3"
          title={kashi.title ? tc(kashi.title) : t("kashi.title")}
          sub={kashi.description ? tc(kashi.description) : t("kashi.sub")}
        />
        {kashi.hindiName && (
          <p className="text-center text-[14px] text-viv-maroon mt-1.5">{kashi.hindiName}</p>
        )}
        <p className="text-center text-[12.5px] text-viv-muted mt-2 max-w-[560px] mx-auto leading-relaxed">
          {(() => {
            const [pre, post] = t("kashi.addonLine").split("{amt}");
            return (
              <>
                {pre}
                <span className="font-semibold text-viv-orange">+{fmtINR(premium)}</span>
                {post}
              </>
            );
          })()}
        </p>
        <Shloka
          compact
          deva={VIVAH_SHLOKAS.shiva.deva}
          translit={VIVAH_SHLOKAS.shiva.translit}
          meaning={VIVAH_SHLOKAS.shiva.meaning}
        />
        <Orn className="mb-6" />
      </Reveal>

      <Reveal>
        <div className="viv-art-kashi relative rounded-2xl overflow-hidden bg-viv-maroon-900 bg-cover bg-center mb-5">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,9,6,0.9)_0%,rgba(28,9,6,0.6)_50%,rgba(28,9,6,0.88)_100%)] sm:bg-[linear-gradient(95deg,rgba(28,9,6,0.95)_0%,rgba(28,9,6,0.84)_36%,rgba(28,9,6,0.25)_60%,rgba(28,9,6,0.08)_80%,rgba(28,9,6,0.5)_100%)]" />
          <div className="relative p-5 sm:p-6 max-w-[440px]">
            <p className="display text-[20px] sm:text-[22px] text-viv-cream leading-snug">
              {t("kashi.blessTitle")}
            </p>
            <p className="text-[12px] text-viv-cream/70 mt-2 leading-relaxed">
              {t("kashi.blessText")}
            </p>
            <div className="flex flex-wrap gap-2 mt-3.5">
              {[t("kashi.chip1"), t("kashi.chip2"), t("kashi.chip3")].map((c) => (
                <span
                  key={c}
                  className="text-[10.5px] text-viv-cream/80 border border-viv-gold/30 bg-black/30 rounded-full px-3 py-1.5"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-[1fr_330px] gap-5 items-start">
        {/* ══ The chain ══ */}
        <div className="space-y-4">
          {/* ── Step 1 — the Acharya ── */}
          <Reveal>
            <div
              ref={step1Ref}
              /* .viv-flash carries a 12px radius for the checkout's square
                 sections; these cards are rounded-2xl, so hold that. */
              className={`rounded-2xl border border-viv-hair bg-white p-5 ${
                flashStep === 1 ? "viv-flash !rounded-2xl" : ""
              }`}
            >
              <StepHead
                n={1}
                title={steps[0].title}
                hint={tfmt(t("kashi.acharyasAvail"), { n: pandits.length })}
                done={steps[0].done}
              />

              {pandits.length >= SEARCH_AT && (
                <label className="mt-4 flex items-center gap-2.5 bg-viv-sheet border border-viv-hair rounded-xl px-3.5 py-2.5 focus-within:border-viv-gold transition-colors">
                  <Search className="w-4 h-4 text-viv-muted-2 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowAll(true);
                    }}
                    placeholder={t("kashi.search")}
                    className="flex-1 bg-transparent text-[13px] text-viv-ink placeholder-viv-muted-2 focus:outline-none"
                  />
                </label>
              )}

              {/* Scales cleanly: 1 → 2 → 3 columns, any roster size. */}
              <Stagger
                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5 mt-4"
                gap={0.04}
                dep={`${query}|${showAll}|${pandits.length}`}
              >
                {visible.map((p) => {
                  const on = panditName === p.name;
                  return (
                    <RevealItem key={p.name} className="h-full">
                      <motion.button
                        type="button"
                        {...lift}
                        onClick={() => onPanditNameChange(on ? "" : p.name)}
                        aria-pressed={on}
                        className={`w-full h-full text-left rounded-xl border p-3.5 flex gap-3 transition-colors ${
                          on
                            ? "border-viv-orange bg-gradient-to-br from-viv-tint to-viv-tint-2 shadow-[0_10px_26px_-18px_rgba(192,74,1,0.8)]"
                            : "border-viv-hair bg-viv-sheet hover:border-viv-gold"
                        }`}
                      >
                        <span className="relative shrink-0">
                          <span
                            className={`w-11 h-11 rounded-full flex items-center justify-center display text-[14px] border ${
                              on
                                ? "bg-viv-maroon text-viv-gold-lt border-viv-maroon"
                                : "bg-viv-gold-pale text-viv-maroon border-viv-hair"
                            }`}
                          >
                            {initialsOf(p.name)}
                          </span>
                          <AnimatePresence>
                            {on && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                                className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-viv-orange flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="display block text-[14px] text-viv-ink leading-snug">
                            {p.name}
                          </span>
                          {!!p.experienceYears && (
                            <span className="block text-[11px] text-viv-orange mt-0.5">
                              {p.experienceYears}+ years of seva
                            </span>
                          )}
                          {p.temple && (
                            <span className="flex items-start gap-1.5 text-[10.5px] text-viv-muted mt-1 leading-snug">
                              <Landmark className="w-3 h-3 mt-0.5 shrink-0 text-viv-gold" />
                              {p.temple}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-viv-gold mt-1.5">
                            <BadgeCheck className="w-3 h-3" /> Verified
                          </span>
                        </span>
                      </motion.button>
                    </RevealItem>
                  );
                })}
              </Stagger>

              {filtered.length === 0 && (
                <p className="text-[12.5px] text-viv-muted text-center py-6">
                  {tfmt(t("kashi.noMatch"), { q: query, n: pandits.length })}
                </p>
              )}

              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-3 w-full text-[12.5px] font-semibold text-viv-maroon border border-viv-hair rounded-xl py-2.5 inline-flex items-center justify-center gap-1.5 hover:border-viv-gold transition-colors"
                >
                  {tfmt(t("kashi.showAll"), { n: filtered.length })}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Always an escape hatch — nobody should be stuck choosing. */}
              <motion.button
                type="button"
                {...tap}
                onClick={() => onPanditNameChange(panditName === "ANY" ? "" : "ANY")}
                aria-pressed={panditName === "ANY"}
                className={`mt-2.5 w-full rounded-xl border px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                  panditName === "ANY"
                    ? "border-viv-orange bg-gradient-to-r from-viv-tint to-viv-tint-2"
                    : "border-viv-hair bg-viv-sheet hover:border-viv-gold"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    panditName === "ANY"
                      ? "bg-viv-orange text-white"
                      : "bg-viv-gold-pale text-viv-maroon"
                  }`}
                >
                  <Users className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-viv-ink">
                    {t("kashi.assignAny")}
                  </span>
                  <span className="block text-[11px] text-viv-muted mt-0.5">
                    {t("kashi.assignAnySub")}
                  </span>
                </span>
              </motion.button>
            </div>
          </Reveal>

          {/* ── Step 2 — the package ── */}
          <Reveal>
            <div
              ref={step2Ref}
              className={`rounded-2xl border bg-white p-5 transition-opacity ${
                acharyaDone ? "border-viv-hair" : "border-viv-hair/60 opacity-55"
              } ${flashStep === 2 ? "viv-flash !rounded-2xl" : ""}`}
            >
              <StepHead
                n={2}
                title={steps[1].title}
                hint={acharyaDone ? t("kashi.joins") : t("kashi.chooseFirst")}
                done={steps[1].done}
              />

              <AnimatePresence initial={false}>
                {acharyaDone && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="grid sm:grid-cols-3 gap-2.5 mt-4">
                      {packages.map((p) => {
                        const on = p.packageId === packageId;
                        return (
                          <motion.button
                            key={p.packageId}
                            type="button"
                            {...tap}
                            onClick={() => onPackageIdChange(on ? "" : p.packageId)}
                            aria-pressed={on}
                            className={`text-left rounded-xl border p-3.5 transition-colors ${
                              on
                                ? "border-viv-orange bg-gradient-to-br from-viv-tint to-viv-tint-2"
                                : "border-viv-hair bg-viv-sheet hover:border-viv-gold"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="display text-[15px] text-viv-ink leading-snug">
                                {p.name}
                              </span>
                              {on && (
                                <Check className="w-4 h-4 text-viv-orange shrink-0" />
                              )}
                            </span>
                            <span className="block text-[10.5px] text-viv-muted mt-0.5">
                              {p.panditCount} Pandit Ji{(p.panditCount || 1) > 1 ? "s" : ""} · all
                              rituals
                            </span>
                            <span className="block text-[16px] font-semibold text-viv-ink mt-1.5">
                              {fmtINR(p.price)}
                            </span>
                            <span className="block text-[11px] text-viv-orange font-semibold mt-0.5">
                              + {fmtINR(premium)} Kashi = {fmtINR(p.price + premium)}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

        {/* ══ Running total, visible the whole way down ══ */}
        <Reveal delay={0.08}>
          <div className="lg:sticky lg:top-24 rounded-2xl border border-viv-hair bg-white overflow-hidden shadow-[0_14px_36px_-24px_rgba(90,40,10,0.5)]">
            <div className="bg-gradient-to-br from-viv-maroon-600 to-viv-maroon px-5 py-4 text-viv-cream">
              <p className="display text-[18px] leading-snug">Your Kashi Vivah</p>
              <p className="text-[11.5px] text-viv-cream/70 mt-0.5">Updates as you choose</p>
            </div>

            <div className="p-5">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[12px] text-viv-muted">{t("kashi.acharya")}</span>
                  <span className="text-[12.5px] font-semibold text-viv-ink text-right">
                    {panditName === "ANY"
                      ? t("kashi.anyAcharya")
                      : panditName || <span className="text-viv-muted-2">{t("kashi.notChosen")}</span>}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[12px] text-viv-muted">{t("kashi.package")}</span>
                  <span className="text-[12.5px] font-semibold text-viv-ink text-right">
                    {chosenPkg ? tc(chosenPkg.name) : <span className="text-viv-muted-2">{t("kashi.notChosen")}</span>}
                  </span>
                </div>
              </div>

              <div className="h-px bg-viv-hair my-3.5" />

              <div className="flex items-center justify-between text-[12.5px] py-1">
                <span className="text-viv-muted">
                  {chosenPkg ? tfmt(t("kashi.pkgOf"), { name: tc(chosenPkg.name) }) : t("kashi.pkgPrice")}
                </span>
                <span className="font-semibold text-viv-ink">
                  {chosenPkg ? fmtINR(chosenPkg.price) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px] py-1">
                <span className="text-viv-muted inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-viv-gold" /> {t("kashi.premiumRow")}
                </span>
                <span className="font-semibold text-viv-orange">+{fmtINR(premium)}</span>
              </div>

              <div className="h-px bg-viv-hair my-3" />
              <div className="flex items-center justify-between">
                <span className="display text-[17px] text-viv-ink">{t("kashi.total")}</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="text-[22px] font-semibold text-viv-ink"
                  >
                    {chosenPkg ? fmtINR(total) : "—"}
                  </motion.span>
                </AnimatePresence>
              </div>
              {chosenPkg && (
                <p className="text-[11.5px] text-viv-muted mt-1 text-right">
                  {tfmt(t("kashi.reserveWith"), { amt: fmtINR(advance), pct })}
                </p>
              )}

              {/* ── Step 3 ── */}
              <div className="mt-4">
                <StepHead
                  n={3}
                  title={t("kashi.step3")}
                  hint={chosenPkg && acharyaDone ? t("kashi.carried") : t("kashi.finishSteps")}
                  done={false}
                />
                <motion.div {...tap} className="mt-3">
                  <Btn
                    variant="orange"
                    size="lg"
                    onClick={() => {
                      if (!acharyaDone) return scrollFlash(1);
                      if (!chosenPkg) return scrollFlash(2);
                      onContinue(chosenPkg, panditName);
                    }}
                    className="w-full"
                  >
                    {t("kashi.step3")} <ArrowRight className="w-4 h-4" />
                  </Btn>
                </motion.div>
              </div>

              {kashi.note && (
                <p className="text-[10.5px] italic text-viv-muted-2 mt-3 leading-snug">
                  {tc(kashi.note)}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </Wrap>
  );
}
