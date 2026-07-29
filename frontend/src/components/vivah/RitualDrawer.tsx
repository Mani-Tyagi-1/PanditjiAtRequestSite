import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus } from "lucide-react";
import { fmtINR, VIVAH_IMG, type Ritual } from "../../data/vivahCatalog";
import { getVivahReceive } from "../../data/vivahContent";

/**
 * Full ritual detail — the web equivalent of the app's bottom-sheet
 * `RitualDrawer`. Same sections in the same order: About this Sanskara, the
 * Vedic mantra, the significance quote, what's included, the Seven Vows
 * (Saptapadi, only on the core ceremony), what you receive, and pricing.
 */
export default function RitualDrawer({
  ritual,
  totalSteps,
  selected,
  onToggle,
  onClose,
}: {
  ritual: Ritual | null;
  totalSteps: number;
  selected: boolean;
  onToggle: (slug: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!ritual) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [ritual, onClose]);

  return (
    <AnimatePresence>
      {ritual && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ritual.titleEng}
            className="w-full sm:max-w-2xl bg-[#FFFDF9] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
            style={{
              backgroundImage: `linear-gradient(rgba(255,253,249,0.96), rgba(255,253,249,0.99)), url(${VIVAH_IMG.ritualModalBg})`,
              backgroundSize: "cover",
            }}
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#FFFDF9]/95 backdrop-blur px-5 pt-4 pb-3 border-b border-[#FFEFE2] rounded-t-3xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200 sm:hidden" />
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 bg-white"
                  style={{ borderColor: ritual.color }}
                >
                  {ritual.image ? (
                    <img
                      src={ritual.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[24px]">{ritual.emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-[#B8341C] bg-[#FFF0E2] rounded-full px-2 py-0.5">
                    Step {ritual.step} of {totalSteps}
                  </span>
                  <h2
                    className="text-[21px] font-bold text-stone-800 leading-tight mt-1"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {ritual.titleEng}
                  </h2>
                  {ritual.titleHindi && (
                    <p className="text-[13px] text-[#8E2C3B] font-semibold">{ritual.titleHindi}</p>
                  )}
                  {ritual.subtitle && (
                    <p className="text-[11.5px] text-stone-500 italic mt-0.5">— {ritual.subtitle} —</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* About */}
              <section>
                <h3 className="text-[12px] font-bold tracking-wider uppercase text-stone-400 mb-1.5">
                  About this Sanskara
                </h3>
                <p className="text-[13.5px] leading-relaxed text-stone-700">{ritual.description}</p>
              </section>

              {/* Mantra */}
              {ritual.mantra && (
                <section className="bg-[#FFF6EC] border border-[#FFE3CC] rounded-2xl p-4">
                  <h3 className="text-[12px] font-bold text-[#B8341C] mb-2">
                    वैदिक मन्त्र (Vedic Mantra)
                  </h3>
                  <p className="text-[15px] leading-relaxed text-stone-800 whitespace-pre-line">
                    {ritual.mantra.devanagari}
                  </p>
                  <p className="text-[12.5px] italic text-stone-600 mt-2">
                    {ritual.mantra.transliteration}
                  </p>
                  <p className="text-[12.5px] text-stone-600 mt-2">
                    <span className="font-semibold text-stone-700">Artha (Meaning): </span>
                    {ritual.mantra.meaning}
                  </p>
                </section>
              )}

              {/* Significance */}
              {ritual.significance && (
                <section className="border-l-[3px] border-[#C9962E] pl-3.5">
                  <p className="text-[13px] italic leading-relaxed text-stone-600">
                    “{ritual.significance}”
                  </p>
                </section>
              )}

              {/* Includes */}
              {ritual.rituals?.length > 0 && (
                <section>
                  <h3 className="text-[12px] font-bold tracking-wider uppercase text-stone-400 mb-2">
                    Includes
                  </h3>
                  <ul className="space-y-1.5">
                    {ritual.rituals.map((r, i) => (
                      <li key={`${r}-${i}`} className="flex gap-2 text-[13px] text-stone-700">
                        <span className="text-[#C9962E] mt-0.5">◆</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Saptapadi */}
              {ritual.saptapadi?.length ? (
                <section>
                  <h3 className="text-[12px] font-bold tracking-wider uppercase text-stone-400 mb-2">
                    The Seven Vows (Saptapadi)
                  </h3>
                  <div className="space-y-2">
                    {ritual.saptapadi.map((s) => (
                      <div
                        key={s.step}
                        className="bg-white border border-[#FFEFE2] rounded-2xl p-3 flex gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#FFF0E2] text-[#B8341C] text-[12px] font-bold flex items-center justify-center shrink-0">
                          {s.step}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] text-stone-800">{s.devanagari}</p>
                          <p className="text-[11.5px] italic text-stone-500">{s.transliteration}</p>
                          <p className="text-[12px] text-stone-600 mt-1">{s.blessing}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {ritual.friendshipVow && (
                    <div className="mt-3 bg-[#FFF6EC] border border-[#FFE3CC] rounded-2xl p-4">
                      <h4 className="text-[12px] font-bold text-[#B8341C] mb-2">
                        ॥ सख्य — The Vow of Friendship ॥
                      </h4>
                      <p className="text-[14px] leading-relaxed text-stone-800">
                        {ritual.friendshipVow.devanagari}
                      </p>
                      <p className="text-[12px] italic text-stone-600 mt-1.5">
                        {ritual.friendshipVow.transliteration}
                      </p>
                      <p className="text-[12px] text-stone-600 mt-1.5">
                        {ritual.friendshipVow.meaning}
                      </p>
                    </div>
                  )}
                </section>
              ) : null}

              {/* What you receive */}
              <section>
                <h3 className="text-[12px] font-bold tracking-wider uppercase text-stone-400 mb-2">
                  What you receive
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getVivahReceive(ritual.slug).map((c) => (
                    <span
                      key={c.label}
                      className="text-[11.5px] font-semibold text-stone-700 bg-white border border-[#FFEFE2] rounded-full px-3 py-1.5"
                    >
                      {c.label.replace(/\n/g, " ")}
                    </span>
                  ))}
                </div>
              </section>

              {/* Pricing */}
              {ritual.price != null && (
                <section className="bg-white border border-[#FFEFE2] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wide">
                      Dakshina from
                    </p>
                    <p className="text-[20px] font-bold text-stone-800">{fmtINR(ritual.price)}</p>
                  </div>
                  {ritual.samagriPrice > 0 && (
                    <div className="text-right">
                      <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wide">
                        Samagri (optional)
                      </p>
                      <p className="text-[15px] font-bold text-stone-600">
                        + {fmtINR(ritual.samagriPrice)}
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Sticky CTA */}
            <div className="sticky bottom-0 bg-[#FFFDF9]/95 backdrop-blur border-t border-[#FFEFE2] px-5 py-3.5">
              <button
                onClick={() => {
                  onToggle(ritual.slug);
                  onClose();
                }}
                className={`w-full font-bold text-[14.5px] py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-transform ${
                  selected
                    ? "bg-gradient-to-r from-emerald-500 to-green-600"
                    : "bg-gradient-to-r from-[#E25800] to-[#FF8A2B]"
                }`}
              >
                {selected ? (
                  <>
                    <Check className="w-4 h-4" /> Added — Remove from Vivah
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add this Ritual to my Vivah
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
