/**
 * The booking-confirmation email.
 *
 * ── Why this is hand-written HTML from 2005 ─────────────────────────────────
 * Email clients are not browsers. Outlook renders through Word, Gmail strips
 * <style> blocks on some clients and mangles others, and none of flexbox, grid
 * or CSS custom properties can be relied on. So: nested tables for layout,
 * every style inline, no external assets, fixed 600px shell. It looks archaic
 * and it is the only thing that renders the same in Gmail, Outlook, Apple Mail
 * and a five-year-old Android client.
 *
 * ── Responsive without media queries ────────────────────────────────────────
 * The shell is `width:100%; max-width:600px`, so it shrinks on a phone without
 * needing a media query Gmail might drop. The one media query present only
 * improves things where it is honoured; nothing depends on it.
 *
 * ── What it must say ────────────────────────────────────────────────────────
 * This is the ONLY record of the booking a devotee outside India gets — we have
 * no international OTP, so they cannot log in to look it up. It therefore has
 * to stand alone: what was booked, when, for whom, what was paid, in which
 * currency, the booking reference, and how to reach a human.
 */

export type BookingEmailData = {
  bhaktName: string;
  poojaName: string;
  /** Already formatted for the reader, e.g. "Mon, 4 Aug 2026". */
  bookingDate: string;
  poojaMode: string;
  /** INR value of the sale. */
  amount: number;
  /** ISO-4217 the card was billed in; omit or "INR" for a domestic booking. */
  currency?: string;
  /** `amount` expressed in `currency`. Required when currency is not INR. */
  chargedAmount?: number;
  contactNumber: string;
  bookingId: string;
  /** Temple, for a Live Mandir seva. */
  templeName?: string;
  /** Names taken alongside the main devotee during the Sankalp. */
  familyMembers?: Array<{ name?: string; gotra?: string }> | null;
  gotra?: string;
  /** Set when a prasad box ships (India only). */
  prasadAdded?: boolean;
  deliveryAddress?: string | null;
};

const BRAND = {
  ink: '#221A12',
  muted: '#7A6A58',
  line: '#EFE3D2',
  cream: '#FFFAF3',
  saffron: '#E05A10',
  gold: '#C79A2B',
  green: '#1F7A50',
};

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "USD 73.74 (₹6,300)" abroad, "₹2,100" at home. */
function amountLabel(d: BookingEmailData): string {
  const inr = `₹${Math.round(Number(d.amount) || 0).toLocaleString('en-IN')}`;
  const foreign =
    d.currency && d.currency !== 'INR' && typeof d.chargedAmount === 'number';
  return foreign
    ? `${esc(d.currency)} ${d.chargedAmount!.toFixed(2)}` +
        `<span style="font-size:12px;font-weight:600;color:${BRAND.muted};"> (${inr})</span>`
    : inr;
}

/** One label/value line of the receipt table. */
function row(label: string, value: string, opts: { strong?: boolean; last?: boolean } = {}) {
  const border = opts.last ? 'none' : `1px solid ${BRAND.line}`;
  const size = opts.strong ? '17px' : '14px';
  const weight = opts.strong ? '800' : '600';
  const colour = opts.strong ? BRAND.saffron : BRAND.ink;
  return `
    <tr>
      <td style="padding:11px 0;border-bottom:${border};font-size:13px;color:${BRAND.muted};font-family:Arial,Helvetica,sans-serif;">${label}</td>
      <td align="right" style="padding:11px 0;border-bottom:${border};font-size:${size};font-weight:${weight};color:${colour};font-family:Arial,Helvetica,sans-serif;">${value}</td>
    </tr>`;
}

/**
 * The plain-text alternative.
 *
 * Not optional: a message with no text part scores as spam almost everywhere,
 * and this is transactional mail that has to land in the inbox.
 */
export function bookingEmailText(d: BookingEmailData): string {
  const inr = `INR ${Math.round(Number(d.amount) || 0).toLocaleString('en-IN')}`;
  const paid =
    d.currency && d.currency !== 'INR' && typeof d.chargedAmount === 'number'
      ? `${d.currency} ${d.chargedAmount.toFixed(2)} (${inr})`
      : inr;
  const names = (d.familyMembers || [])
    .map((m) => m?.name)
    .filter(Boolean)
    .join(', ');

  return [
    `Namaste ${d.bhaktName},`,
    ``,
    `Your booking is confirmed. 🙏`,
    ``,
    `Puja        : ${d.poojaName}`,
    d.templeName ? `Temple      : ${d.templeName}` : '',
    `Date        : ${d.bookingDate}`,
    d.gotra ? `Gotra       : ${d.gotra}` : '',
    names ? `Sankalp for : ${d.bhaktName}, ${names}` : '',
    `Amount paid : ${paid}`,
    `Booking ID  : ${d.bookingId}`,
    d.prasadAdded && d.deliveryAddress ? `Prasad to   : ${d.deliveryAddress}` : '',
    ``,
    `Our team will share the puja video and photos with you once the seva is`,
    `performed. Keep this email — it is your record of the booking.`,
    ``,
    `Questions? Reply to this email or WhatsApp us on +91 90569 55311.`,
    ``,
    `PanditJi At Request`,
    `1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India`,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

export function bookingEmailHtml(d: BookingEmailData): string {
  const names = (d.familyMembers || []).map((m) => m?.name).filter(Boolean) as string[];
  const sankalp = [d.bhaktName, ...names].filter(Boolean).map(esc).join(', ');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Booking Confirmed</title>
<style>
  /* Only ever an improvement — nothing below is required for the layout to
     work, because clients that strip <style> still get the inline styles. */
  @media only screen and (max-width:600px){
    .px{padding-left:20px!important;padding-right:20px!important}
    .h1{font-size:24px!important}
  }
  @media (prefers-color-scheme:dark){
    .shell{background:${BRAND.cream}!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F3EDE4;">
  <!-- Inbox preview line: without it clients show the first words of the
       header, which is the brand name repeated. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${esc(d.poojaName)} is confirmed for ${esc(d.bookingDate)}. Booking ${esc(d.bookingId)}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3EDE4;">
    <tr><td align="center" style="padding:24px 12px;">

      <table role="presentation" class="shell" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;background:${BRAND.cream};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.line};">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#E05A10 0%,#C79A2B 100%);background-color:${BRAND.saffron};padding:26px 32px;">
          <div style="font:700 19px Georgia,'Times New Roman',serif;color:#FFFFFF;letter-spacing:.3px;">PanditJi At Request</div>
          <div style="font:600 12px Arial,Helvetica,sans-serif;color:#FFF0E0;margin-top:3px;letter-spacing:1.2px;text-transform:uppercase;">Vedic rituals, performed with devotion</div>
        </td></tr>

        <!-- Confirmation -->
        <tr><td class="px" align="center" style="padding:34px 32px 10px;">
          <div style="font-size:42px;line-height:1;">🙏</div>
          <h1 class="h1" style="margin:14px 0 6px;font:700 27px Georgia,'Times New Roman',serif;color:${BRAND.ink};">Booking Confirmed</h1>
          <p style="margin:0;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted};">
            Namaste <strong style="color:${BRAND.ink};">${esc(d.bhaktName)}</strong>, your seva is booked.
          </p>
        </td></tr>

        <!-- Receipt -->
        <tr><td class="px" style="padding:22px 32px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background:#FFFFFF;border:1px solid ${BRAND.line};border-radius:12px;">
            <tr><td style="padding:6px 18px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('Puja', `<span style="color:${BRAND.ink}">${esc(d.poojaName)}</span>`)}
                ${d.templeName ? row('Temple', esc(d.templeName)) : ''}
                ${row('Date', esc(d.bookingDate))}
                ${row('Mode', d.poojaMode === 'online' ? 'Online (video shared with you)' : 'At your location')}
                ${d.gotra ? row('Gotra', esc(d.gotra)) : ''}
                ${sankalp ? row('Sankalp in the name of', sankalp) : ''}
                ${row('Contact', esc(d.contactNumber))}
                ${row('Amount paid', amountLabel(d), { strong: true, last: true })}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Booking reference. Its own block because this is the number a
             devotee abroad quotes to support — they cannot log in to find it. -->
        <tr><td class="px" style="padding:14px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background:#FFF6E9;border:1px dashed ${BRAND.gold};border-radius:10px;">
            <tr><td align="center" style="padding:13px 16px;">
              <div style="font:700 10px Arial,Helvetica,sans-serif;color:${BRAND.muted};letter-spacing:1.4px;text-transform:uppercase;">Booking reference</div>
              <div style="font:700 15px 'Courier New',Courier,monospace;color:${BRAND.ink};margin-top:5px;word-break:break-all;">${esc(d.bookingId)}</div>
            </td></tr>
          </table>
        </td></tr>

        ${
          d.prasadAdded && d.deliveryAddress
            ? `<tr><td class="px" style="padding:14px 32px 0;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                        style="background:#EFF9F2;border:1px solid #BFE3CE;border-radius:10px;">
                   <tr><td style="padding:13px 16px;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#14603E;">
                     <strong style="color:${BRAND.green};">🎁 Prasad on its way</strong><br>
                     Blessed prasad will be couriered to:<br>
                     <span style="color:${BRAND.ink};">${esc(d.deliveryAddress)}</span>
                   </td></tr>
                 </table>
               </td></tr>`
            : ''
        }

        <!-- What happens next -->
        <tr><td class="px" style="padding:22px 32px 0;">
          <div style="font:700 11px Arial,Helvetica,sans-serif;color:${BRAND.muted};letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px;">What happens next</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font:400 14px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.ink};">
            <tr><td width="26" valign="top" style="padding:5px 0;">1.</td><td style="padding:5px 0;">Our pandit ji prepares the sankalp in your name and gotra.</td></tr>
            <tr><td width="26" valign="top" style="padding:5px 0;">2.</td><td style="padding:5px 0;">The seva is performed on <strong>${esc(d.bookingDate)}</strong>.</td></tr>
            <tr><td width="26" valign="top" style="padding:5px 0;">3.</td><td style="padding:5px 0;">We share the full puja video and photos with you.</td></tr>
          </table>
        </td></tr>

        <!-- Support -->
        <tr><td class="px" style="padding:22px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background:#FFFFFF;border:1px solid ${BRAND.line};border-radius:12px;">
            <tr><td align="center" style="padding:18px;">
              <div style="font:400 13px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted};">
                Need help, or want to change something?
              </div>
              <div style="margin-top:10px;">
                <a href="https://wa.me/919056955311" style="display:inline-block;background:${BRAND.green};color:#FFFFFF;text-decoration:none;font:700 13px Arial,Helvetica,sans-serif;padding:11px 20px;border-radius:8px;">WhatsApp us</a>
                <a href="mailto:support@panditjiatrequest.com" style="display:inline-block;background:#FFFFFF;color:${BRAND.ink};text-decoration:none;font:700 13px Arial,Helvetica,sans-serif;padding:10px 19px;border-radius:8px;border:1px solid ${BRAND.line};margin-left:6px;">Email us</a>
              </div>
              <div style="margin-top:11px;font:400 12px Arial,Helvetica,sans-serif;color:${BRAND.muted};">
                Or just reply to this email — it reaches our team.
              </div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td class="px" align="center" style="padding:26px 32px 30px;">
          <div style="font:400 12px/1.7 Arial,Helvetica,sans-serif;color:${BRAND.muted};">
            <strong style="color:${BRAND.ink};">PanditJi At Request</strong><br>
            1031, Tricity Trade Tower, Zirakpur, Punjab 140603, India<br>
            <a href="https://panditjiatrequest.com" style="color:${BRAND.saffron};text-decoration:none;">panditjiatrequest.com</a>
          </div>
          <div style="margin-top:12px;font:400 11px Arial,Helvetica,sans-serif;color:#A89880;">
            You are receiving this because you booked a seva with us.<br>
            This is a transactional receipt — please keep it for your records.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
