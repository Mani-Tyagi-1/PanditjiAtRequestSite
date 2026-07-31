import { Reveal } from "./motion";

/* ==========================================================================
   SHLOKA — a mantra set into the page like an inscription.
   --------------------------------------------------------------------------
   The Devanagari line carries the weight (display serif, gold sheen); the
   transliteration and meaning sit beneath it quietly, so a family that reads
   Sanskrit hears the mantra and one that doesn't still receives it. Flanked
   by the same hairline ornaments the section dividers use, so the shlokas
   feel woven into the design rather than pasted on.

   `tone="cream"` is for maroon/dark bands (hero, Kashi, finale);
   `tone="ink"` for ivory sections.
   ========================================================================== */
export default function Shloka({
  deva,
  translit,
  meaning,
  tone = "ink",
  compact = false,
  className = "",
}: {
  deva: string;
  translit?: string;
  meaning?: string;
  tone?: "ink" | "cream";
  compact?: boolean;
  className?: string;
}) {
  const cream = tone === "cream";
  return (
    <Reveal>
      <figure
        className={`text-center mx-auto max-w-[640px] ${
          compact ? "my-2.5 sm:my-3" : "my-4 sm:my-5"
        } ${className}`}
      >
        <div
          aria-hidden="true"
          className={`flex items-center justify-center gap-2.5 mb-2 sm:mb-2.5 ${
            cream ? "opacity-80" : ""
          }`}
        >
          <span className={`h-px w-10 bg-gradient-to-r from-transparent ${cream ? "to-viv-gold-lt" : "to-viv-gold"}`} />
          <span className={`text-[11px] ${cream ? "text-viv-gold-lt" : "text-viv-gold"}`}>❈</span>
          <span className={`h-px w-10 bg-gradient-to-l from-transparent ${cream ? "to-viv-gold-lt" : "to-viv-gold"}`} />
        </div>

        <blockquote
          lang="sa"
          className={`display viv-shloka ${compact ? "text-[14px] sm:text-[18px]" : "text-[16px] sm:text-[21px]"} leading-[1.6] sm:leading-[1.65] ${
            cream ? "viv-shloka-cream" : "viv-shloka-ink"
          }`}
        >
          {deva}
        </blockquote>

        {(translit || meaning) && (
          <figcaption className="mt-1.5 sm:mt-2">
            {/* The transliteration is a reading aid for the Devanagari above it.
                On a phone it is the one line of the three we can spare, so the
                mantra and its meaning still land without a wall of text. */}
            {translit && (
              <p
                className={`hidden sm:block text-[11px] italic tracking-wide ${
                  cream ? "text-viv-cream/60" : "text-viv-muted-2"
                }`}
              >
                {translit}
              </p>
            )}
            {meaning && (
              <p
                className={`text-[11px] sm:text-[11.5px] mt-1 leading-relaxed ${
                  cream ? "text-viv-cream/75" : "text-viv-muted"
                }`}
              >
                {meaning}
              </p>
            )}
          </figcaption>
        )}
      </figure>
    </Reveal>
  );
}

/** The mantras placed across the Vivah pages — authentic and well-known. */
export const VIVAH_SHLOKAS = {
  /** Hero — the Mangalacharan invoked at the start of every shubh karya. */
  mangal: {
    deva: "मङ्गलं भगवान् विष्णुर्मङ्गलं गरुडध्वजः। मङ्गलं पुण्डरीकाक्षो मङ्गलाय तनो हरिः॥",
    translit: "Mangalam Bhagwan Vishnu, mangalam Garudadhwajah, mangalam Pundarikaksho, mangalaya tano Harih.",
    meaning: "May Lord Vishnu bring auspiciousness — may every beginning here be blessed.",
  },
  /** "How would you like to begin?" — Ganesh vandana, remover of obstacles. */
  ganesh: {
    deva: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
    translit: "Vakratunda mahakaya suryakoti samaprabha, nirvighnam kuru me deva sarva-karyeshu sarvada.",
    meaning: "O Ganesha, remove every obstacle from this new beginning.",
  },
  /** Ritual journey — the Saptapadi vow spoken at the seven steps. */
  saptapadi: {
    deva: "धर्मे च अर्थे च कामे च नातिचरामि॥",
    translit: "Dharme cha arthe cha kame cha naticharami.",
    meaning: "In dharma, in prosperity, in love — I shall never forsake you. (The Saptapadi vow)",
  },
  /** Kashi section — Karpuragauram, sung to Shiva at every aarti. */
  shiva: {
    deva: "कर्पूरगौरं करुणावतारं संसारसारम् भुजगेन्द्रहारम्। सदा वसन्तं हृदयारविन्दे भवं भवानीसहितं नमामि॥",
    translit: "Karpura-gauram karunavataram, samsara-saram bhujagendra-haram…",
    meaning: "I bow to Shiva with Bhavani — camphor-white, compassion incarnate — ever dwelling in the heart.",
  },
  /** Finale / blessing band. */
  blessing: {
    deva: "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु मा कश्चिद् दुःखभाग् भवेत्॥",
    translit: "Sarve bhavantu sukhinah, sarve santu niramayah…",
    meaning: "May all be happy, may all be free of illness, may all see what is auspicious.",
  },
} as const;
