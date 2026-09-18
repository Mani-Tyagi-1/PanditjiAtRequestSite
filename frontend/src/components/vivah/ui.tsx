import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Vedic Vivah — shared design primitives, built to the approved comps.
 * Every Vivah page composes from these so the rhythm, type scale and gold
 * ornamentation stay identical across the landing page, the package spread
 * and the checkout.
 */

/* ── Layout ─────────────────────────────────────────────────────────────── */

/** The page measure — 1180px, with a consistent gutter at every breakpoint. */
export function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`w-full max-w-[1180px] mx-auto px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** A section with the comps' vertical rhythm. */
export function Section({
  children,
  id,
  className = "",
  tight = false,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  tight?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative ${tight ? "py-6 sm:py-8 lg:py-10" : "py-8 sm:py-10 lg:py-16"} ${className}`}
    >
      {children}
    </section>
  );
}

/* ── Type ───────────────────────────────────────────────────────────────── */

/** Centred section heading: serif title + muted sub, as drawn. */
export function Head({
  title,
  sub,
  light = false,
  className = "",
}: {
  title: ReactNode;
  sub?: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <h2
        className={`text-[21px] sm:text-[30px] lg:text-[34px] leading-tight ${
          light ? "text-viv-cream" : "text-viv-ink"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-1.5 sm:mt-2 text-[12px] sm:text-[13.5px] leading-[1.55] sm:leading-[1.6] max-w-[640px] mx-auto ${
            light ? "text-[rgba(255,246,230,0.7)]" : "text-viv-muted"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/** Small gold ornament divider. */
export function Orn({ className = "" }: { className?: string }) {
  return (
    <div className={`viv-orn my-3 ${className}`}>
      <span className="text-viv-gold text-[10px] leading-none">✦</span>
    </div>
  );
}

/* ── Buttons ────────────────────────────────────────────────────────────── */

type Variant = "orange" | "gold" | "maroon" | "ghost" | "outlineLight";

const VARIANT: Record<Variant, string> = {
  orange:
    "text-white bg-gradient-to-b from-viv-orange-lt to-viv-orange border border-viv-orange hover:brightness-[1.06]",
  gold: "text-[#3A2205] bg-gradient-to-b from-viv-gold-lt to-viv-gold border border-viv-gold hover:brightness-[1.06]",
  maroon:
    "text-viv-cream bg-gradient-to-b from-viv-maroon-600 to-viv-maroon border border-viv-maroon hover:brightness-[1.08]",
  ghost:
    "text-viv-maroon bg-white border border-viv-hair hover:border-viv-gold hover:bg-viv-tint",
  outlineLight:
    "text-viv-cream bg-transparent border border-[rgba(210,164,93,0.5)] hover:border-viv-gold-lt hover:bg-[rgba(210,164,93,0.1)]",
};

const SIZE = {
  md: "px-6 py-3 text-[13px]",
  lg: "px-8 py-3.5 text-[14px]",
  sm: "px-4 py-2.5 text-[12px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.99]";

export function Btn({
  children,
  variant = "maroon",
  size = "md",
  to,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof SIZE;
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  [k: string]: any;
}) {
  const cls = `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`;
  if (to)
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */

/** The white/ivory rounded card used throughout the comps. */
export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: any;
}) {
  return (
    <As
      className={`bg-white border border-viv-hair rounded-2xl shadow-[0_2px_14px_-8px_rgba(90,40,10,0.16)] ${className}`}
    >
      {children}
    </As>
  );
}

/** A circular gold-ringed icon medallion, as used on the ritual + trust tiles. */
export function Medallion({
  children,
  size = 46,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-b from-viv-gold-pale to-[#EFD9AE] border border-viv-hair text-viv-maroon shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

export { fmtINR } from "../../data/vivahCatalog";
