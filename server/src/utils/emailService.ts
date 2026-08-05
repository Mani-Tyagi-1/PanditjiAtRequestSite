import nodemailer from "nodemailer";
import { bookingEmailHtml, bookingEmailText, type BookingEmailData } from "./emailTemplate";

const smtpPort = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Booking confirmation, sent worldwide.
 *
 * For a devotee outside India this is the ONLY record they get — there is no
 * international OTP, so they cannot log in to look the booking up. That is why
 * it carries the full receipt and the booking reference rather than a "view
 * your booking" link behind a login.
 *
 * Never throws at the caller: confirmation mail is a side effect of a payment
 * that has already succeeded, and a bounced SMTP connection must not fail a
 * booking. Failures are logged and swallowed.
 */
export const sendBookingConfirmationEmail = async (
  data: BookingEmailData & { to: string },
): Promise<boolean> => {
  const { to, ...booking } = data;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[email] SMTP credentials not configured (SMTP_USER / SMTP_PASS).");
    return false;
  }
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
    console.warn(`[email] Skipped: invalid recipient "${to}".`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"PanditJi At Request" <${process.env.SMTP_USER}>`,
      to,
      // Replies reach a human rather than the SMTP mailbox — the email invites
      // one, so it has to go somewhere real.
      replyTo: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      subject: `Booking confirmed: ${booking.poojaName} 🙏`,
      // Both parts: a message with no plain-text alternative scores as spam
      // almost everywhere, and this is mail that has to reach the inbox.
      text: bookingEmailText(booking),
      html: bookingEmailHtml(booking),
    });
    console.log(`[email] Booking confirmation sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[email] Failed to send to ${to}:`, err?.message || err);
    return false;
  }
};

/**
 * The sign-in code, for devotees the SMS gateway cannot reach.
 *
 * Deliberately spare: one number, big enough to read at a glance and to select
 * on a phone, with nothing around it to distract from it. Security mail that
 * looks like marketing gets filtered, and filtered mail means a devotee locked
 * out of the booking they just paid for.
 */
export const sendOtpEmail = async ({
  to,
  otp,
  minutes,
}: {
  to: string;
  otp: string;
  minutes: number;
}): Promise<boolean> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[email] SMTP credentials not configured (SMTP_USER / SMTP_PASS).");
    return false;
  }

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3EDE4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your PanditJi At Request sign-in code is ${otp}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3EDE4;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:480px;background:#FFFAF3;border:1px solid #EFE3D2;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#E05A10;padding:20px 28px;">
          <div style="font:700 17px Georgia,'Times New Roman',serif;color:#FFFFFF;">PanditJi At Request</div>
        </td></tr>
        <tr><td align="center" style="padding:32px 28px 8px;">
          <div style="font:700 11px Arial,Helvetica,sans-serif;color:#7A6A58;letter-spacing:1.6px;text-transform:uppercase;">Your sign-in code</div>
          <div style="margin:16px 0;font:700 38px 'Courier New',Courier,monospace;letter-spacing:9px;color:#221A12;">${otp}</div>
          <div style="font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#7A6A58;">
            Valid for ${minutes} minutes. Enter it on the sign-in screen to see your bookings.
          </div>
        </td></tr>
        <tr><td style="padding:18px 28px 28px;">
          <div style="background:#FFF6E9;border:1px solid #EFD9AE;border-radius:10px;padding:13px 15px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#7A5A20;">
            Did not request this? You can ignore this email — nobody can sign in without the code above.
            Never share it with anyone, including someone claiming to be from our team.
          </div>
          <div style="margin-top:18px;text-align:center;font:400 11px/1.7 Arial,Helvetica,sans-serif;color:#A89880;">
            PanditJi At Request · Zirakpur, Punjab, India<br>
            <a href="https://panditjiatrequest.com" style="color:#E05A10;text-decoration:none;">panditjiatrequest.com</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await transporter.sendMail({
      from: `"PanditJi At Request" <${process.env.SMTP_USER}>`,
      to,
      subject: `${otp} is your PanditJi At Request sign-in code`,
      // Plain-text part matters more here than anywhere: security mail without
      // one is far likelier to be filtered, and a filtered code locks a devotee
      // out of the booking they already paid for.
      text: `Your PanditJi At Request sign-in code is ${otp}.\n\n`
        + `It is valid for ${minutes} minutes.\n\n`
        + `If you did not request this, you can ignore this email. Never share this code with anyone.`,
      html,
    });
    console.log(`[email] Sign-in code sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[email] OTP send failed for ${to}:`, err?.message || err);
    return false;
  }
};
