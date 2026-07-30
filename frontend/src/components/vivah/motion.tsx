import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Vedic Vivah — shared motion primitives.
 *
 * One module so the whole section moves with the same rhythm: a soft rise on
 * scroll, a gentle lift on hover, a spring on anything the family toggles.
 * Every helper reads `prefers-reduced-motion` and degrades to a plain fade (or
 * to nothing at all), because a wedding page that lurches is worse than a still
 * one — and some people get motion sick.
 */

export const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ── Scroll reveal ────────────────────────────────────────────────────────── */

/**
 * Rises into view once, the first time it crosses the viewport.
 * `delay` staggers siblings that aren't in a <Stagger>.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const still = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      initial={still ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={still ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

/** Parent that reveals its <RevealItem> children one after another. */
export function Stagger({
  children,
  className = "",
  gap = 0.07,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -60px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

const ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const ITEM_STILL: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export function RevealItem({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  [k: string]: any;
}) {
  const still = useReducedMotion();
  return (
    <motion.div variants={still ? ITEM_STILL : ITEM} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/* ── Interaction ──────────────────────────────────────────────────────────── */

/**
 * Card-sized hover lift + press. Spread onto any motion component.
 * Disabled entirely under reduced motion.
 */
export function useLift(enabled = true) {
  const still = useReducedMotion();
  if (still || !enabled) return {};
  return {
    whileHover: { y: -4, transition: { duration: 0.22, ease: EASE } },
    whileTap: { scale: 0.985 },
  };
}

/** Softer version for buttons and chips. */
export function useTap(enabled = true) {
  const still = useReducedMotion();
  if (still || !enabled) return {};
  return { whileTap: { scale: 0.97 } };
}

/* ── Collapse ─────────────────────────────────────────────────────────────── */

/** Height-animated disclosure body. Wrap in <AnimatePresence>. */
export const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: EASE },
  style: { overflow: "hidden" as const },
};

/* ── Sheets & bars ────────────────────────────────────────────────────────── */

export const sheetUp = {
  initial: { y: 28, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 28, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 320, damping: 32 },
};

export const barUp = {
  initial: { y: 90, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 90, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22 },
};

/** A number that counts to its new value — used on running totals. */
export function AnimatedTotal({
  value,
  format,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const still = useReducedMotion();
  if (still) return <span className={className}>{format(value)}</span>;
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {format(value)}
    </motion.span>
  );
}

export { motion, AnimatePresence } from "framer-motion";
