import { RequestHandler } from "express";
import KashiRequest from "../../model/userApp/kashiRequestModel";
import { sendWhatsappMessage, sendOrderConfirmationTemplate, ORDER_TEMPLATE_HEADER_IMAGE } from "../../utils/whatsapp";

// ---- WhatsApp Kashi request confirmation (fire-and-forget) ----
// Kashi Ji is a request/lead flow (no payment), so the confirmation is sent the
// moment the request is created. Uses the approved `pjar_booking` UTILITY template:
//
//   Namaste {{1}}
//
//   {{2}}
//   {{3}}
//
//   {{4}}
//
//   For further assistance, visit Pandit Ji At Request
//   [ Check Now ] -> https://play.google.com/store/{{1}}
//
// NOTE: WhatsApp template params must each be a SINGLE line — no "\n"/tab or >4
// consecutive spaces (error #132018).
const sendKashiRequestWhatsapp = async (request: any) => {
  try {
    const rawPhone = String(request?.mobileNumber || "");
    const cleanedPhone = rawPhone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) return;
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const devoteeName = request?.devoteeName || "Devotee";
    const requestId = String(request?._id || "");
    const ritual = request?.ritualDetails ? String(request.ritualDetails).trim() : "";

    // {{2}} — thank-you for the Kashi Ji pooja & pandit request
    const param2 = `Thank you for your Pooja & Pandit Ji request for *Kashi Ji* 🛕. We have received your request and our team will reach out to you shortly to arrange everything. 🙏`;
    // {{3}} — the ritual / request details (kept on one line)
    const param3 = ritual
      ? `Request: ${ritual.replace(/\s+/g, " ").slice(0, 200)}`
      : `Request: Pooja & Pandit Ji at Kashi Ji`;
    // {{4}} — request reference + next step
    const param4 = `Request ID: ${requestId} — our team will contact you on this number soon. 🌸`;

    // "Check Now" button → https://play.google.com/store/apps/details?id=com.panditJiAtReqapp
    const buttonParam = "apps/details?id=com.panditJiAtReqapp";

    let sent = false;
    try {
      await sendOrderConfirmationTemplate({
        to: phone,
        parameters: [devoteeName, param2, param3, param4],
        headerImageUrl: ORDER_TEMPLATE_HEADER_IMAGE,
        buttonUrlParam: buttonParam,
      });
      console.log(`[Kashi] WhatsApp confirmation accepted by API for ${phone} (delivery not guaranteed)`);
      sent = true;
    } catch (err: any) {
      console.warn(`[Kashi] Template send failed:`, err?.response?.data || err.message);
    }

    // Plain-text fallback if the template send fails
    if (!sent) {
      try {
        const fallbackMsg = `Namaste ${devoteeName} ji 🙏\n\n${param2}\n${param3}\n\n${param4}\n\nFor further assistance, visit Pandit Ji At Request: https://play.google.com/store/${buttonParam}`;
        await sendWhatsappMessage({ to: phone, message: fallbackMsg });
        console.log(`✅ [Kashi] WhatsApp plain text confirmation sent to ${phone}`);
      } catch (textErr: any) {
        console.error(`❌ [Kashi] WhatsApp fallback text failed:`, textErr?.response?.data || textErr.message);
      }
    }
  } catch (e: any) {
    console.error("❌ [Kashi] WhatsApp confirmation flow failed entirely:", e?.response?.data || e?.message || e);
  }
};

// POST /kashi-requests — devotee submits a Pooja & Pandit request for Kashi Ji
export const createKashiRequest: RequestHandler = async (req, res) => {
  try {
    const { devoteeName, mobileNumber, email, ritualDetails } = req.body;

    if (!devoteeName || !mobileNumber) {
      res.status(400).json({
        success: false,
        message: "devoteeName and mobileNumber are required",
      });
      return;
    }

    const cleanPhone = String(mobileNumber).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({
        success: false,
        message: "A valid 10-digit mobile number is required",
      });
      return;
    }

    const request = await KashiRequest.create({
      devoteeName: String(devoteeName).trim(),
      mobileNumber: cleanPhone,
      email: email ? String(email).trim() : "",
      ritualDetails: ritualDetails ? String(ritualDetails).trim() : "",
      isFromSite: true,
    });

    // 🟢 WhatsApp confirmation — no payment in this flow, so send on creation (fire-and-forget)
    void sendKashiRequestWhatsapp(request);

    res.status(201).json({
      success: true,
      message: "Your request has been received. Our team will contact you shortly.",
      data: request,
    });
  } catch (error) {
    console.error("Failed to create kashi request:", error);
    res.status(500).json({ success: false, message: "Failed to submit request" });
  }
};

// GET /kashi-requests — admin list
export const getKashiRequests: RequestHandler = async (_req, res) => {
  try {
    const requests = await KashiRequest.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch kashi requests" });
  }
};

// GET /kashi-requests/user/:phone — a single user's Kashi requests (shown under
// the "Direct Pandit" tab on the account page).
export const getUserKashiRequests: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }
    const cleanPhone = String(phone).replace(/\D/g, "");
    const alias10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    const requests = await KashiRequest.find({
      $or: [
        { mobileNumber: cleanPhone },
        { mobileNumber: alias10 },
        { mobileNumber: { $regex: alias10 + "$" } },
      ],
    }).sort({ addedOn: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user kashi requests" });
  }
};
