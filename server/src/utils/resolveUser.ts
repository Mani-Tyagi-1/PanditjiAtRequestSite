import User from '../model/userApp/userModel';
import { normalizePhone } from '../config/currency';

/**
 * The one way a booking finds or creates the devotee it belongs to.
 *
 * Every checkout flow used to do this itself, and they disagreed: the puja
 * controller understood international numbers, `findOrRegisterGuest` rejected
 * anything that was not exactly 10 digits, and nothing anywhere looked a
 * devotee up by email. The result was a foreign booking either failing outright
 * or minting a second account for someone who already had one.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 * ALWAYS search the whole users collection before creating anything:
 *
 *   1. by phone  — the historic identity, and still the primary one in India
 *   2. by email  — the only handle we have for a devotee abroad, where there
 *                  is no OTP to verify a number with
 *   3. create    — only once both have missed
 *
 * A match on either handle wins, and the account is then TOPPED UP rather than
 * duplicated: a devotee who booked with a phone in March and comes back with an
 * email in July ends up with one account carrying both, not two carrying one
 * each. Existing values are never overwritten — a stored name or email is the
 * one the devotee gave us, and a half-filled checkout must not clobber it.
 */

export type ResolveUserInput = {
  /** As typed, with or without a country code. */
  phone?: unknown;
  /** Country calling code, no "+". Absent or "91" ⇒ the India flow. */
  dialCode?: unknown;
  email?: unknown;
  name?: unknown;
  gotra?: unknown;
  /** ISO-3166 alpha-2 + readable name, stored when creating from abroad. */
  countryCode?: unknown;
  country?: unknown;
  isFromApp?: boolean;
};

export type ResolvedUser = {
  user: any;
  /** False when this call created the account — useful for analytics/logging. */
  existed: boolean;
  /** Normalised phone actually used (bare 10 digits in India, prefixed abroad). */
  phone: string;
  email: string;
};

const clean = (v: unknown) => String(v ?? '').trim();

/** Lowercased and trimmed, or "" — the form a lookup can rely on. */
export function normalizeEmail(v: unknown): string {
  const e = clean(v).toLowerCase();
  return /^\S+@\S+\.\S+$/.test(e) ? e : '';
}

/**
 * Is this a usable handle at all?
 *
 * India keeps the exact 10-digit rule every existing account, OneSignal alias
 * and WhatsApp template assumes. Abroad the length varies by country (8 in
 * Singapore, 11 in Germany), so the floor is "long enough to dial".
 */
function usablePhone(phone: string, isIndia: boolean): boolean {
  return isIndia ? phone.length === 10 : phone.length >= 8;
}

export async function resolveUser(input: ResolveUserInput): Promise<ResolvedUser | null> {
  const dial = clean(input.dialCode).replace(/\D/g, '');
  const isIndia = !dial || dial === '91';
  const phone = normalizePhone(input.phone, input.dialCode);
  const email = normalizeEmail(input.email);
  const hasPhone = usablePhone(phone, isIndia);

  // Nothing to identify them by. The caller decides whether that is fatal —
  // it is for a booking, it is not for a newsletter signup.
  if (!hasPhone && !email) return null;

  let user: any = null;

  // ── 1. By phone ──────────────────────────────────────────────────────────
  if (hasPhone) {
    user = await User.findOne(
      isIndia
        ? {
            // The same number has been stored three ways over the years:
            // bare, 91-prefixed, and with punctuation. Match all of them.
            $or: [
              { phone },
              { phone: `91${phone}` },
              { phone: { $regex: `${phone}$` } },
            ],
          }
        : { $or: [{ phone }, { phone: `+${phone}` }] },
    );
  }

  // ── 2. By email ──────────────────────────────────────────────────────────
  // Case-insensitively, because "Ravi@Gmail.com" and "ravi@gmail.com" are one
  // devotee. Oldest first: if this collection already holds duplicates, the
  // first account is the one with the booking history worth attaching to.
  if (!user && email) {
    user = await User.findOne({
      email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    }).sort({ addedOn: 1, _id: 1 });
  }

  // ── 3. Create ────────────────────────────────────────────────────────────
  if (!user) {
    user = await User.create({
      ...(hasPhone && { phone }),
      ...(email && { email }),
      name: clean(input.name) || 'Guest User',
      ...(clean(input.gotra) && { gotra: clean(input.gotra) }),
      // Only meaningful when there is no number to fall back on; it is what
      // tells support this devotee can only be reached by email.
      isEmailOnly: !hasPhone,
      ...(clean(input.countryCode) && {
        countryCode: clean(input.countryCode).toUpperCase().slice(0, 2),
      }),
      ...(clean(input.country) && { country: clean(input.country).slice(0, 64) }),
      isFromApp: input.isFromApp === true,
      isNotifyOkay: true,
      email_verified: false,
      isActive: true,
      addedOn: new Date(),
    });
    return { user, existed: false, phone, email };
  }

  // ── Top up an existing account, never overwrite ──────────────────────────
  // Only fills blanks. A devotee who books from abroad this time has not
  // stopped being reachable on the number they gave us last time.
  const patch: Record<string, any> = {};
  if (hasPhone && !clean(user.phone)) patch.phone = phone;
  if (email && !normalizeEmail(user.email)) patch.email = email;
  if (clean(input.name) && !clean(user.name)) patch.name = clean(input.name);
  if (clean(input.gotra) && !clean(user.gotra)) patch.gotra = clean(input.gotra);
  if (clean(input.countryCode) && !clean(user.countryCode)) {
    patch.countryCode = clean(input.countryCode).toUpperCase().slice(0, 2);
    if (clean(input.country)) patch.country = clean(input.country).slice(0, 64);
  }
  if (user.isEmailOnly && (hasPhone || clean(user.phone))) patch.isEmailOnly = false;

  if (Object.keys(patch).length) {
    // A duplicate-key race on `phone` (two tabs, same instant) must not fail a
    // paid booking — the account is already found and usable either way.
    try {
      Object.assign(user, patch);
      await user.save();
    } catch (err: any) {
      console.warn(`[resolveUser] Could not top up user ${user._id}:`, err?.message || err);
    }
  }

  return { user, existed: true, phone, email };
}
