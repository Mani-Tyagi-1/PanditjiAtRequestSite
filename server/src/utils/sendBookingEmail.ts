import { sendBookingConfirmationEmail } from './emailService';

/**
 * Send the confirmation email for any booking, from any module.
 *
 * Six modules take payments — puja, chadhava, live mandir, shop, vivah,
 * consultation — and each shaped its booking document differently as it grew:
 * the devotee's email is `userEmail` in one, `emailId` in another and `email`
 * in a third; the amount is `amount` here and `totalAmount` there. Mapping that
 * at every call site meant six chances to send an email with a blank name, the
 * wrong total, or nothing at all.
 *
 * So the mapping lives here once, reading whichever field name a module
 * happens to use, and each controller passes only what is genuinely its own
 * (the service name, the temple).
 *
 * ── Never throws, never blocks ──────────────────────────────────────────────
 * This runs after a payment has already succeeded. A dead SMTP host must not
 * turn a paid booking into a failed request, so every failure is logged and
 * swallowed and the call is fire-and-forget.
 */

type AnyDoc = Record<string, any>;

const first = (...vals: unknown[]): string => {
  for (const v of vals) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
};

/** Flatten whatever address shape a module stores into one readable line. */
function addressLine(addr: unknown): string | null {
  if (!addr || typeof addr !== 'object') {
    const s = String(addr ?? '').trim();
    return s || null;
  }
  const a = addr as AnyDoc;
  const parts = [
    first(a.addressLine1, a.houseNo, a.line1),
    first(a.addressLine2, a.street, a.line2),
    first(a.city),
    first(a.state),
    first(a.pincode, a.postalCode, a.zip),
    first(a.country),
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export type BookingEmailOverrides = {
  /** What the devotee bought, e.g. "Kaal Bhairav Kalashtami Puja". */
  serviceName?: string;
  templeName?: string;
  /** Defaults to "online" — most of these services are performed remotely. */
  mode?: string;
  /** Force a recipient when the document does not carry one. */
  to?: string;
  /** Label used in the log line, so a failure names its module. */
  label?: string;
};

/**
 * Fire-and-forget. Resolves to true when the mail was accepted by SMTP.
 *
 * Returns false rather than throwing when there is no address: an email is
 * OPTIONAL in India (WhatsApp is the primary channel there) and only required
 * abroad, so "no email" is an ordinary outcome, not an error.
 */
export async function sendBookingEmailFor(
  doc: AnyDoc,
  overrides: BookingEmailOverrides = {},
): Promise<boolean> {
  const label = overrides.label || 'Booking';

  const to = first(
    overrides.to,
    doc.userEmail, doc.emailId, doc.email, doc.customerEmail, doc.devoteeEmail,
  );
  if (!to) return false;

  const amount = Number(
    doc.amount ?? doc.totalAmount ?? doc.amountPaid ?? doc.grandTotal ?? 0,
  );

  const when = doc.bookingDate || doc.eventDate || doc.date || doc.createdAt;
  const bookingDate = when
    ? new Date(when).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
      })
    // Some services (a consultation callback, a shop order) have no ceremony
    // date. Saying so beats printing "Invalid Date".
    : 'To be scheduled';

  try {
    return await sendBookingConfirmationEmail({
      to,
      bhaktName: first(doc.bhaktName, doc.devoteeName, doc.userName, doc.fullName, doc.customerName) || 'Devotee',
      poojaName: first(overrides.serviceName, doc.poojaNameEng, doc.serviceName, doc.chadhavaName, doc.packageName) || 'Your booking',
      bookingDate,
      poojaMode: first(overrides.mode, doc.poojaMode) || 'online',
      amount,
      // Recorded on the booking by the international checkout; absent on a
      // plain INR booking, which the template renders as rupees.
      currency: doc.currency,
      chargedAmount: doc.chargedAmount,
      contactNumber: first(doc.userPhone, doc.contactNumber, doc.phone, doc.mobileNumber),
      // The order id is what a devotee quotes to support and what appears on
      // their card statement, so it beats a Mongo _id where one exists.
      bookingId: first(doc.razorpayOrderId, doc.orderId, doc._id),
      templeName: first(overrides.templeName, doc.templeName) || undefined,
      gotra: first(doc.gotra) || undefined,
      familyMembers: Array.isArray(doc.familyMembers) ? doc.familyMembers : null,
      prasadAdded: Boolean(doc.prasadAdded ?? doc.addPrasadBox),
      deliveryAddress: addressLine(doc.address ?? doc.deliveryAddress),
    });
  } catch (err: any) {
    console.error(`[${label}] Confirmation email failed:`, err?.message || err);
    return false;
  }
}
