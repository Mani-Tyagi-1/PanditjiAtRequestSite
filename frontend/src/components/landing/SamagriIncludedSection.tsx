import { motion } from "framer-motion";
import { CheckCircle2, Package } from "lucide-react";

const INCLUDED = [
  "No last-minute shopping stress",
  "Pandit Ji arranges all samagri",
  "Items as per traditional vidhi",
  "Ritual-specific customization",
];

export function SamagriIncludedSection() {
  return (
    <section className="py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">
            <Package className="w-3 h-3 inline mr-1" />Samagri Included
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-200" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 text-center">
          Puja{" "}
          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            Samagri Included
          </span>
        </h2>
        <p className="text-xs text-stone-500 text-center mt-1 px-2">
          No confusion, no last-minute shopping. Required puja samagri is arranged as per the ritual.
        </p>
      </motion.div>

      {/* Included badges */}
      <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
        {INCLUDED.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"
          >
            <CheckCircle2 className="w-3 h-3" />
            {item}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-stone-400 text-center mt-3 px-4 italic">
        * Final samagri list may vary based on puja type, city, and Pandit Ji's guidance.
      </p>
    </section>
  );
}
