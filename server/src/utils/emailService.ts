import nodemailer from "nodemailer";

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

export const sendBookingConfirmationEmail = async ({
  to,
  bhaktName,
  poojaName,
  bookingDate,
  poojaMode,
  amount,
  contactNumber,
  bookingId,
}: {
  to: string;
  bhaktName: string;
  poojaName: string;
  bookingDate: string;
  poojaMode: string;
  amount: number;
  contactNumber: string;
  bookingId: string;
}): Promise<void> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials not configured (SMTP_USER / SMTP_PASS missing in .env)");
  }
  if (!to || !to.includes("@")) {
    throw new Error(`Invalid recipient email: "${to}"`);
  }

  const date = new Date(bookingDate);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed — PanditJi At Request</title>
</head>
<body style="margin:0;padding:0;background:#FFF9F0;font-family:Arial,Helvetica,sans-serif;color:#292524;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(251,146,60,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#fed7aa,#fb923c);padding:36px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🙏</div>
            <h1 style="margin:0;color:#7c2d12;font-size:26px;font-weight:800;">Booking Confirmed!</h1>
            <p style="margin:8px 0 0;color:#9a3412;font-size:13px;">PanditJi At Request — Your Trusted Vedic Service</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <p style="font-size:18px;font-weight:700;color:#292524;margin:0 0 12px;">Namaste, ${bhaktName}! 🙏</p>
            <p style="color:#78716c;font-size:14px;line-height:1.7;margin:0 0 24px;">
              Your puja booking has been confirmed. Our Pandit Ji will be in touch shortly to ensure everything is perfectly prepared for your sacred ceremony.
            </p>

            <!-- Booking Details Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #fed7aa;border-radius:14px;overflow:hidden;margin-bottom:24px;">
              <tr><td style="padding:20px 20px 0;">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f97316;">Booking Details</p>
              </td></tr>

              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr style="border-bottom:1px solid #fee2c8;">
                    <td style="font-size:13px;color:#78716c;padding:8px 0;">Puja</td>
                    <td style="font-size:13px;font-weight:700;color:#292524;text-align:right;padding:8px 0;">${poojaName}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #fee2c8;">
                    <td style="font-size:13px;color:#78716c;padding:8px 0;">Date</td>
                    <td style="font-size:13px;font-weight:700;color:#292524;text-align:right;padding:8px 0;">${formattedDate}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #fee2c8;">
                    <td style="font-size:13px;color:#78716c;padding:8px 0;">Time</td>
                    <td style="font-size:13px;font-weight:700;color:#292524;text-align:right;padding:8px 0;">${formattedTime}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #fee2c8;">
                    <td style="font-size:13px;color:#78716c;padding:8px 0;">Mode</td>
                    <td style="font-size:13px;font-weight:700;color:#292524;text-align:right;padding:8px 0;">${poojaMode === "online" ? "Online" : "Offline (at your location)"}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #fee2c8;">
                    <td style="font-size:13px;color:#78716c;padding:8px 0;">Contact</td>
                    <td style="font-size:13px;font-weight:700;color:#292524;text-align:right;padding:8px 0;">${contactNumber}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #fee2c8;">
                    <td style="font-size:13px;color:#78716c;padding:8px 0;">Amount Paid</td>
                    <td style="font-size:18px;font-weight:800;color:#ea580c;text-align:right;padding:8px 0;">₹${amount.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#a8a29e;padding:8px 0;">Booking ID</td>
                    <td style="font-size:11px;color:#a8a29e;text-align:right;padding:8px 0;word-break:break-all;">${bookingId}</td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding:0 20px 20px;"></td></tr>
            </table>

            <p style="color:#78716c;font-size:13px;line-height:1.7;margin:0;">
              For any queries, please reach out to us via WhatsApp. We are always here to serve you with devotion.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#FFF7ED;padding:24px 32px;text-align:center;border-top:1px solid #fed7aa;">
            <div style="font-size:28px;margin-bottom:8px;">🕉️</div>
            <p style="margin:0;font-weight:700;color:#292524;font-size:14px;">PanditJi At Request</p>
            <p style="margin:4px 0;color:#a8a29e;font-size:12px;">Serving devotees with Vedic traditions</p>
            <p style="margin:16px 0 0;color:#d6d3d1;font-size:11px;">© 2025 PanditJi At Request. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"PanditJi At Request" <${process.env.SMTP_USER}>`,
    to,
    subject: `Booking Confirmed: ${poojaName} 🙏 — PanditJi At Request`,
    html,
  });
};
