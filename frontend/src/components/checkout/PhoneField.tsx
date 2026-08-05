import { useEffect } from "react";
import { sanitizePhone, type Country } from "../../utils/currency";

type Props = {
    country: Country;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    /** The page's own input class — the field keeps its native look exactly. */
    inputClass: string;
    /** Text class for the dial-code prefix, matched to the page's palette. */
    prefixClass?: string;
};

/**
 * Mobile number with the country's dial code pinned to its left.
 *
 * The dial code is NOT part of `value`: the field holds the national number
 * only, exactly as it did when this was a hardcoded 10-digit Indian input. The
 * country code is joined on at submit time (`toStoredPhone`), so every caller's
 * state shape is unchanged and switching country never mangles a typed number.
 *
 * The prefix is drawn as an overlay and the input is padded past it, rather than
 * the input being wrapped in a bordered box. That way the page's own `INPUT`
 * class still lands on the real <input> and the field is pixel-identical to the
 * ones above and below it.
 *
 * Length is clamped to the country's maximum instead of a fixed 10, so a
 * Singapore number stops at 8 digits and a German one is allowed 11.
 */
export default function PhoneField({
    country,
    value,
    onChange,
    onBlur,
    inputClass,
    prefixClass = "",
}: Props) {
    const [min, max] = country.phone;

    // Switching to a country with shorter numbers (India's 10 → Singapore's 8)
    // would otherwise leave digits on screen that the new country can no longer
    // accept, and a "valid number" error the devotee can't see the cause of.
    // Only ever trims; a value that already fits is left alone, so this cannot
    // clobber a number prefilled from the logged-in user.
    useEffect(() => {
        if (value.length > max) onChange(sanitizePhone(value, country));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [country.iso2]);
    // Flag glyph + "+" + dial digits + the gutter either side. Measured in ch-ish
    // units rather than with a ref: this must be right on first paint, and a
    // layout-effect measurement to place a label that never changes width for a
    // given country would be a re-render for nothing.
    const padLeft = 58 + country.dial.length * 9;

    return (
        <div className="relative">
            <span
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none whitespace-nowrap ${prefixClass}`}
            >
                {country.flag} +{country.dial}
            </span>
            <input
                value={value}
                onChange={(e) => onChange(sanitizePhone(e.target.value, country))}
                onBlur={onBlur}
                placeholder={min === max ? `${min}-digit number` : `${min}–${max} digits`}
                inputMode="numeric"
                autoComplete="tel-national"
                style={{ paddingLeft: padLeft }}
                className={inputClass}
            />
        </div>
    );
}
