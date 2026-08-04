import { Globe, ChevronDown } from "lucide-react";
import { clearCountryPin, COUNTRIES, useMoney } from "../../utils/currency";

/** Sentinel for the "let the site work it out" row, which is not a country. */
const AUTO = "__auto__";

type Props = {
    /** Tailwind classes for the pill — each puja page passes its own palette. */
    className?: string;
    /** Colour of the caret + globe, matched to the page's accent. */
    accentClass?: string;
};

/**
 * "Paying from 🇺🇸 United States · USD" — the one control that switches the
 * whole funnel's currency, phone format and address form.
 *
 * The country is auto-detected, so this is a correction, not a required step.
 * It is still shown to everyone (India included) because a silently applied
 * currency the devotee cannot see or change is worse than a visible one: the
 * NRI on a Delhi timezone and the tourist in Rishikesh both need a way out.
 *
 * A native <select> layered invisibly over the pill does the work. That is
 * deliberate — it gives the OS's own picker on mobile, keyboard and screen
 * reader support for free, and adds no dropdown state, no portal and no
 * outside-click listener to a page whose job is to take a payment quickly.
 */
export default function CountryPicker({ className = "", accentClass = "" }: Props) {
    const { country, currency, setCountry } = useMoney();

    return (
        <label
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 cursor-pointer select-none transition-colors ${className}`}
        >
            <Globe className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} />
            <span className="text-[11px] font-bold leading-none whitespace-nowrap">
                {country.flag} {country.name} · {currency}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} />
            <select
                aria-label="Country you are paying from"
                value={country.iso2}
                onChange={(e) =>
                    e.target.value === AUTO ? clearCountryPin() : setCountry(e.target.value)
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
                {/* First row, because picking a country here is sticky: it
                    outranks detection from then on. This is the way back — for a
                    devotee who chose wrong, and for anyone checking that
                    detection works at all. */}
                <option value={AUTO}>🌐 Detect automatically</option>
                {COUNTRIES.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                        {c.flag} {c.name} ({c.currency})
                    </option>
                ))}
            </select>
        </label>
    );
}
