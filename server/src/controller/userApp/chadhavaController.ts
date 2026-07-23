import { RequestHandler } from "express";
import axios from "axios";
import Razorpay from "razorpay";
import crypto from "crypto";
import Chadhava, { IChadhava } from "../../model/userApp/chadhavaModel";
import { panditJiAtRequestMongooose } from "../../config/connectDB";
import ChadhavaBooking, { IChadhavaSelection } from "../../model/userApp/chadhavaBookingModel";
import { sendWhatsappMessage, sendOrderConfirmationTemplate, ORDER_TEMPLATE_HEADER_IMAGE } from "../../utils/whatsapp";
import { sendMetaPurchaseEvent } from "../../utils/metaCapiServices";
import { sendPjarOrderToPartnerAffiliate } from "../../utils/partnerAffiliateCommission";
// Devshayani Ekadashi combo (frontend-only offering — remove to disable)
import { resolveDevshayaniCombo } from "../../config/devshayaniCombo";

// Shape a DB doc to the frontend `Chadhava` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

// Pull a URL out of a value that may be a plain string or an upload object.
const imgLoc = (v: any): string => (v && typeof v === "object" ? v.location : v) || "";

// Look up a raw document (any shape) from our own PJAR `chadhavas` collection by
// its ObjectId. Used so new admin-format chadhavas (whose `id` is the 24-hex
// `_id`) resolve for detail/quote/order without going through the strict model.
const findLocalChadhavaRawById = async (id: string): Promise<any | null> => {
  try {
    const { ObjectId } = panditJiAtRequestMongooose.Types;
    return await panditJiAtRequestMongooose.connection
      .collection("chadhavas")
      .findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
};

const normalizeExternalChadhava = (raw: any) => {
  const deity = raw.chadhavaName || raw.deity || "";
  // Legacy Vedic Vaibhav docs use `selectedMandirs`; new PJAR docs use `mandirs`.
  const mandir = raw.selectedMandirs?.[0] || raw.mandirs?.[0];
  let templeName = "";
  let templeLocation = "";
  if (mandir) {
    templeName = mandir.nameEnglish || "";
    templeLocation = mandir.city || "";
  }
  const image = imgLoc(raw.chadhavaWebCardImage) || imgLoc(raw.chadhavaAppImage) || raw.image || "";

  const rawSections = raw.chadhavaSections || raw.sections || [];
  let sections = rawSections.map((sec: any) => ({
    sectionName: sec.sectionName || "",
    items: (sec.items || []).map((it: any, index: number) => ({
      code: it.code || it.itemName || `item_${index}`,
      itemName: it.itemName || "",
      itemDesc: it.itemDesc || "",
      itemImage: imgLoc(it.itemImage),
      itemPrice: (it.discountedPrice && it.discountedPrice > 0) ? it.discountedPrice : (it.itemPrice || it.chadhavaPrice || 0),
      maxQuantity: it.maxQuantity || 10,
      popular: it.popular || false,
      isActive: it.isActive !== false
    }))
  }));

  // New PJAR admin format: flat `chadhavaItems` + `chadhavaCombos` (no sections).
  // Build synthetic sections with deterministic `item_N` / `combo_N` codes that
  // MUST match the frontend detail-page mapping so quotes/orders resolve.
  if (sections.length === 0 && (Array.isArray(raw.chadhavaItems) || Array.isArray(raw.chadhavaCombos))) {
    sections = [];
    const itemEntries = (raw.chadhavaItems || []).map((it: any, index: number) => ({
      code: `item_${index}`,
      itemName: it.chadhavaName || it.itemName || "",
      itemDesc: it.chadhavaDescription || it.itemDesc || "",
      itemImage: imgLoc(it.chadhavaImage || it.itemImage),
      itemPrice: it.chadhavaPrice || it.itemPrice || 0,
      maxQuantity: it.maxQuantity || 10,
      popular: false,
      isActive: it.isActive !== false,
    }));
    const comboEntries = (raw.chadhavaCombos || []).map((it: any, index: number) => ({
      code: `combo_${index}`,
      itemName: it.comboName || "",
      itemDesc: it.comboDescription || "",
      itemImage: imgLoc(it.comboImages?.[0]),
      itemPrice: it.comboPrice || 0,
      maxQuantity: it.maxQuantity || 10,
      popular: false,
      isActive: true,
    }));
    if (itemEntries.length) sections.push({ sectionName: "Arpan Seva", items: itemEntries });
    if (comboEntries.length) sections.push({ sectionName: "Combo Offerings", items: comboEntries });
  }

  return {
    slug: raw.slug || raw._id || raw.id || "",
    deity,
    templeName,
    templeLocation,
    image,
    sections,
    prasad: raw.prasad || { enabled: false, price: 0, name: "", desc: "", image: "" }
  };
};

// ── Razorpay setup (mirrors paidConsultationController) ──
const isProduction = process.env.PAYMENT_MODE === "production";
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("Razorpay credentials are missing. Check env vars.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  const hmac = crypto.createHmac("sha256", razorpayKeySecret as string);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};

// ---- WhatsApp Chadhava confirmation (fire-and-forget) ----
// Sent only AFTER a Chadhava payment is verified — a thank-you to the devotee
// who booked the chadhava. Uses the approved `pjar_booking` UTILITY template:
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
const sendChadhavaConfirmationWhatsapp = async (booking: any) => {
  try {
    const rawPhone = String(booking?.phone || "");
    const cleanedPhone = rawPhone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) return;
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const devoteeName = booking?.devoteeName || "Devotee";
    const deity = booking?.deity || "the deity";
    const templeText = booking?.templeName ? ` at *${booking.templeName}*` : "";

    // Summarise the sevas offered, e.g. "Pushp Mala x2, Chunri x1"
    const selections: IChadhavaSelection[] = Array.isArray(booking?.selections) ? booking.selections : [];
    const sevaSummary = selections
      .map((s) => `${s.name}${s.quantity > 1 ? ` x${s.quantity}` : ""}`)
      .join(", ");

    const amount = Number(booking?.totalAmount || 0);
    const bookingId = booking?.razorpayOrderId || String(booking?._id || "");

    // {{2}} — heartfelt thank-you with deity + temple
    const param2 = `Thank you for your sacred Chadhava offering to *${deity}*${templeText}. 🌸 Your offering has been received and will be presented at the temple with your sankalp. 🙏`;
    // {{3}} — the seva details + amount paid
    const param3 = sevaSummary
      ? `Offering: ${sevaSummary} · Amount Paid: ₹${amount.toLocaleString("en-IN")}`
      : `Amount Paid: ₹${amount.toLocaleString("en-IN")}`;
    // {{4}} — booking reference + next step.
    // NOTE: WhatsApp template params must be a SINGLE line — no "\n"/tab or >4 spaces
    // (error #132018), so keep this on one line.
    const param4 = `Booking ID: ${bookingId} — our team will share offering & prasad updates shortly. 🛕`;

    // "Check Now" button → https://play.google.com/store/apps/details?id=com.panditJiAtReqapp
    const buttonParam = "apps/details?id=com.panditJiAtReqapp";

    // Header image = the booked chadhava's image (looked up by slug); fall back
    // to the brand image if unavailable.
    let headerImage = ORDER_TEMPLATE_HEADER_IMAGE;
    try {
      if ((booking as any)?.chadhavaSlug) {
        const chadhavaDoc = await Chadhava.findOne({ slug: (booking as any).chadhavaSlug }).lean();
        if ((chadhavaDoc as any)?.image) headerImage = (chadhavaDoc as any).image;
      }
    } catch (imgErr: any) {
      console.warn("[Chadhava] Could not resolve header image, using fallback:", imgErr?.message);
    }

    let sent = false;
    try {
      await sendOrderConfirmationTemplate({
        to: phone,
        parameters: [devoteeName, param2, param3, param4],
        headerImageUrl: headerImage,
        buttonUrlParam: buttonParam,
      });
      console.log(`[Chadhava] WhatsApp confirmation accepted by API for ${phone} (delivery not guaranteed)`);
      sent = true;
    } catch (err: any) {
      console.warn(`[Chadhava] Template send failed:`, err?.response?.data || err.message);
    }

    // Plain-text fallback if the template send fails
    if (!sent) {
      try {
        const fallbackMsg = `Namaste ${devoteeName} ji 🙏\n\n${param2}\n${param3}\n\n${param4}\n\nFor further assistance, visit Pandit Ji At Request: https://play.google.com/store/${buttonParam}`;
        await sendWhatsappMessage({ to: phone, message: fallbackMsg });
        console.log(`✅ [Chadhava] WhatsApp plain text confirmation sent to ${phone}`);
      } catch (textErr: any) {
        console.error(`❌ [Chadhava] WhatsApp fallback text failed:`, textErr?.response?.data || textErr.message);
      }
    }
  } catch (e: any) {
    console.error("❌ [Chadhava] WhatsApp confirmation flow failed entirely:", e?.response?.data || e?.message || e);
  }
};

// ---- Abandoned-payment nudge ----
// How long after a payment attempt (order creation) to nudge the devotee if they
// never completed payment. Configurable via env, defaults to 15 minutes.
const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const CHADHAVA_NUDGE_DELAY_MINUTES = parsePositiveNumber(
  process.env.CHADHAVA_NUDGE_DELAY_MINUTES,
  15
);

// Sent ONLY if the booking is still unpaid `CHADHAVA_NUDGE_DELAY_MINUTES` after the
// payment attempt — a gentle "complete your Chadhava" reminder (fire-and-forget).
const sendChadhavaPaymentNudge = async (bookingId: string) => {
  try {
    const booking = await ChadhavaBooking.findById(bookingId);
    if (!booking) return;
    // Already paid → nothing to nudge. Already nudged → don't double-send.
    if (booking.paymentStatus === "paid") return;
    if (booking.paymentNudgeSent) return;

    const rawPhone = String(booking.phone || "");
    const cleanedPhone = rawPhone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) return;
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const devoteeName = booking.devoteeName || "Devotee";
    const deity = booking.deity || "the deity";
    const templeText = booking.templeName ? ` at ${booking.templeName}` : "";
    const amount = Number(booking.totalAmount || 0);

    const message =
      `Namaste ${devoteeName} ji 🙏\n\n` +
      `We noticed you started booking a sacred Chadhava offering to *${deity}*${templeText}, but the payment of ₹${amount.toLocaleString("en-IN")} wasn't completed. 🌸\n\n` +
      `Your offering is reserved — complete the payment to have it presented at the temple with your sankalp. 🛕\n\n` +
      `Complete your Chadhava: https://play.google.com/store/apps/details?id=com.panditJiAtReqapp`;

    await sendWhatsappMessage({ to: phone, message });
    console.log(`✅ [Chadhava] Payment nudge sent to ${phone} (bookingId=${bookingId})`);

    // Mark so we never nudge the same booking twice.
    booking.paymentNudgeSent = true;
    await booking.save();
  } catch (e: any) {
    console.error("❌ [Chadhava] Payment nudge failed:", e?.response?.data || e?.message || e);
  }
};

// Schedules the nudge after the configured delay. In-memory timer (lost on
// server restart) — matches the existing timed-request pattern in the codebase.
const scheduleChadhavaPaymentNudge = (bookingId: string) => {
  const delayMs = CHADHAVA_NUDGE_DELAY_MINUTES * 60 * 1000;
  setTimeout(() => {
    void sendChadhavaPaymentNudge(bookingId);
  }, delayMs);
};

type SelectionInput = { code?: string; quantity?: number };
type QuoteInput = {
  items?: SelectionInput[];
  addPrasadBox?: boolean;
  familyMembers?: string[];
};

type ResolvedPricing = {
  selections: IChadhavaSelection[];
  prasadBoxPrice: number;
  itemsTotal: number;
  prasadTotal: number;
  familyTotal: number;
  grandTotal: number;
};

// Resolve prices from the DB document — never trust client-sent amounts.
const resolvePricing = (
  chadhava: IChadhava,
  { items, addPrasadBox, familyMembers }: QuoteInput
): ResolvedPricing | { error: string } => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Please select at least one seva" };
  }

  // Flatten all active items for code lookup.
  const catalog = new Map<string, IChadhava["sections"][number]["items"][number]>();
  for (const section of chadhava.sections) {
    for (const item of section.items) {
      if (item.isActive) catalog.set(item.code, item);
    }
  }

  const selections: IChadhavaSelection[] = [];
  for (const sel of items) {
    const item = sel.code ? catalog.get(sel.code) : undefined;
    if (!item) return { error: `Seva "${sel.code}" is not available` };

    const qty = Math.floor(Number(sel.quantity) || 0);
    if (qty < 1) continue;
    if (qty > item.maxQuantity) {
      return { error: `Maximum ${item.maxQuantity} allowed for ${item.itemName}` };
    }

    selections.push({
      code: item.code,
      name: item.itemName,
      unitPrice: item.itemPrice,
      quantity: qty,
      lineTotal: item.itemPrice * qty,
    });
  }

  if (selections.length === 0) return { error: "Please select at least one seva" };

  const itemsTotal = selections.reduce((sum, s) => sum + s.lineTotal, 0);
  const prasadBoxPrice = addPrasadBox ? 298 : 0;
  const familyTotal = Array.isArray(familyMembers) ? familyMembers.length * 50 : 0;

  return {
    selections,
    prasadBoxPrice,
    itemsTotal,
    prasadTotal: prasadBoxPrice,
    familyTotal,
    grandTotal: itemsTotal + prasadBoxPrice + familyTotal,
  };
};

// GET /chadhavas — active catalog for the cards
export const getChadhavas: RequestHandler = async (_req, res) => {
  try {
    const list = await Chadhava.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: list.map(toClientShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhavas" });
  }
};

// GET /chadhavas/:slug — fetch single chadhava details
export const getChadhavaBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;

    // Check if slug is a 24-character hex ID (indicating it's from the external newChadhava API)
    if (slug && slug.length === 24 && /^[0-9a-fA-F]{24}$/.test(slug)) {
      try {
        const response = await axios.get("https://vedicvaibhav.com/api/newChadhava/get-all-new-chadhava");
        const list = response.data?.data || response.data?.items || response.data || [];
        const chadhava = list.find((item: any) => item._id === slug);
        if (chadhava) {
          res.status(200).json({ success: true, data: chadhava });
          return;
        }
      } catch (proxyErr: any) {
        console.error("Failed to proxy find chadhava by ID:", proxyErr.message);
      }

      // Not in the legacy external source → try our own PJAR `chadhavas`
      // collection (new admin-format offering keyed by its _id). Returned raw
      // so the detail page gets every field (images, dates, mandirs, benefits…).
      const localRaw = await findLocalChadhavaRawById(slug);
      if (localRaw) {
        res.status(200).json({ success: true, data: localRaw });
        return;
      }
    }

    const chadhava = await Chadhava.findOne({ slug, isActive: true });
    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }
    res.status(200).json({ success: true, data: toClientShape(chadhava) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhava details" });
  }
};

// POST /chadhavas/:slug/quote — authoritative total computed from the DB
export const getChadhavaQuote: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    // Devshayani Ekadashi combo — frontend-only offering resolved here.
    let chadhava: any = resolveDevshayaniCombo(slug);

    if (!chadhava && slug && slug.length === 24 && /^[0-9a-fA-F]{24}$/.test(slug)) {
      try {
        const response = await axios.get("https://vedicvaibhav.com/api/newChadhava/get-all-new-chadhava");
        const list = response.data?.data || response.data?.items || response.data || [];
        const rawChadhava = list.find((item: any) => item._id === slug);
        if (rawChadhava) {
          chadhava = normalizeExternalChadhava(rawChadhava);
        }
      } catch (proxyErr: any) {
        console.error("Failed to proxy fetch external chadhava for quote:", proxyErr.message);
      }
    }

    // New PJAR admin-format offering (keyed by _id) — normalize to sections.
    if (!chadhava && slug && slug.length === 24 && /^[0-9a-fA-F]{24}$/.test(slug)) {
      const localRaw = await findLocalChadhavaRawById(slug);
      if (localRaw) chadhava = normalizeExternalChadhava(localRaw);
    }

    if (!chadhava) {
      chadhava = await Chadhava.findOne({ slug, isActive: true });
    }

    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }

    const pricing = resolvePricing(chadhava, req.body || {});
    if ("error" in pricing) {
      res.status(400).json({ success: false, message: pricing.error });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        selections: pricing.selections,
        itemsTotal: pricing.itemsTotal,
        prasadTotal: pricing.prasadTotal,
        grandTotal: pricing.grandTotal,
        currency: "INR",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to calculate quote" });
  }
};

// POST /chadhava-bookings/create-order — pending booking + Razorpay order
export const createChadhavaOrder: RequestHandler = async (req, res) => {
  try {
    const { chadhavaSlug, items, addPrasadBox, devoteeName, gotra, phone, wish, familyMembers, deliveryAddress } = req.body;

    if (!chadhavaSlug || !devoteeName || !phone) {
      res.status(400).json({
        success: false,
        message: "chadhavaSlug, devoteeName and phone are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    // Devshayani Ekadashi combo — frontend-only offering resolved here.
    let chadhava: any = resolveDevshayaniCombo(chadhavaSlug);

    if (!chadhava && chadhavaSlug && chadhavaSlug.length === 24 && /^[0-9a-fA-F]{24}$/.test(chadhavaSlug)) {
      try {
        const response = await axios.get("https://vedicvaibhav.com/api/newChadhava/get-all-new-chadhava");
        const list = response.data?.data || response.data?.items || response.data || [];
        const rawChadhava = list.find((item: any) => item._id === chadhavaSlug);
        if (rawChadhava) {
          chadhava = normalizeExternalChadhava(rawChadhava);
        }
      } catch (proxyErr: any) {
        console.error("Failed to proxy fetch external chadhava for order:", proxyErr.message);
      }
    }

    // New PJAR admin-format offering (keyed by _id) — normalize to sections.
    if (!chadhava && chadhavaSlug && chadhavaSlug.length === 24 && /^[0-9a-fA-F]{24}$/.test(chadhavaSlug)) {
      const localRaw = await findLocalChadhavaRawById(chadhavaSlug);
      if (localRaw) chadhava = normalizeExternalChadhava(localRaw);
    }

    if (!chadhava) {
      chadhava = await Chadhava.findOne({ slug: chadhavaSlug, isActive: true });
    }

    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }

    const pricing = resolvePricing(chadhava, { items, addPrasadBox, familyMembers });
    if ("error" in pricing) {
      res.status(400).json({ success: false, message: pricing.error });
      return;
    }

    const orderOptions: any = {
      amount: pricing.grandTotal * 100,
      currency: "INR",
      receipt: `chadhava_${Date.now()}`,
      payment_capture: 1,
      notes: {
        chadhavaSlug,
        deity: chadhava.deity,
        devoteeName,
        service: "Chadhava",
      },
    };

    const order: any = await razorpay.orders.create(orderOptions);

    const booking = await ChadhavaBooking.create({
      chadhavaSlug,
      deity: chadhava.deity,
      templeName: chadhava.templeName,
      selections: pricing.selections,
      addPrasadBox: !!addPrasadBox,
      prasadBoxPrice: pricing.prasadBoxPrice,
      itemsTotal: pricing.itemsTotal,
      totalAmount: pricing.grandTotal,
      devoteeName,
      gotra,
      phone: cleanPhone,
      wish,
      status: "pending",
      paymentStatus: "pending",
      razorpayOrderId: order.id,
      isFromSite: true,
      familyMembers: Array.isArray(familyMembers) ? familyMembers : [],
      deliveryAddress: addPrasadBox ? deliveryAddress : undefined,
    });

    // Payment attempt started → booking is now pending. If it isn't completed
    // within CHADHAVA_NUDGE_DELAY_MINUTES, send a WhatsApp nudge to finish paying.
    scheduleChadhavaPaymentNudge(String(booking._id));

    res.status(201).json({
      success: true,
      message: "Chadhava order created",
      bookingId: booking._id,
      razorpayOrderId: order.id,
      razorpayKeyId,
      amount: pricing.grandTotal,
      currency: "INR",
    });
  } catch (error) {
    console.error("Failed to create chadhava order:", error);
    res.status(500).json({ success: false, message: "Failed to create chadhava order" });
  }
};

// POST /chadhava-bookings/complete-payment — verify signature & confirm
export const completeChadhavaPayment: RequestHandler = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "Payment verification fields are required",
      });
      return;
    }

    const booking = await ChadhavaBooking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    // Idempotent: a verified booking returns success without re-charging state.
    if (booking.paymentStatus === "paid") {
      res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: booking,
      });
      return;
    }

    if (booking.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({ success: false, message: "Razorpay order mismatch" });
      return;
    }

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      booking.paymentStatus = "failed";
      await booking.save();
      res.status(400).json({ success: false, message: "Invalid payment signature" });
      return;
    }

    const chadhavaWasUnpaid = (booking as any).paymentStatus !== "paid";
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    await booking.save();

    // Partner-affiliate: credit the customer's referrer once, on the first successful payment.
    if (chadhavaWasUnpaid) {
      void sendPjarOrderToPartnerAffiliate({
        phone: (booking as any).phone,
        orderId: booking.razorpayOrderId,
        orderPrice: Number((booking as any).totalAmount),
        productName: (booking as any).chadhavaName || "CHADHAVA",
      });
    }

    // 🟢 Thank-you WhatsApp — only now that payment is verified (fire-and-forget)
    void sendChadhavaConfirmationWhatsapp(booking);

    // META CAPI Purchase (fire-and-forget) — dedup with browser pixel via eventId.
    void (async () => {
      if (!isProduction) {
        console.log(`[MetaCAPI][Chadhava] Skipped (PAYMENT_MODE != production) for orderID=${razorpayOrderId}`);
        return;
      }
      try {
        const forwardedFor = req.headers["x-forwarded-for"];
        const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]) || req.ip || null;

        await sendMetaPurchaseEvent({
          orderID: String(razorpayOrderId),
          eventId: `chadhava_purchase_${razorpayOrderId}`,
          value: Number((booking as any).totalAmount || 0),
          currency: "INR",
          contentId: String((booking as any).deity || "CHADHAVA").trim(),
          actionSource: "website",
          phone: String((booking as any).phone || ""),
          externalId: String((booking as any)._id || ""),
          clientIp,
          userAgent: String(req.headers["user-agent"] || ""),
          fbp: String(req.headers["x-fbp"] || (req as any).cookies?._fbp || ""),
          fbc: String(req.headers["x-fbc"] || (req as any).cookies?._fbc || ""),
          eventSourceUrl:
            String(req.headers["x-event-source-url"] || "") ||
            process.env.META_DEFAULT_EVENT_SOURCE_URL ||
            null,
        });
        console.log(`[MetaCAPI][Chadhava] Purchase sent for orderID=${razorpayOrderId}`);
      } catch (e: any) {
        console.error(`[MetaCAPI][Chadhava] Purchase failed for orderID=${razorpayOrderId}:`, e?.response?.data || e?.message || e);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Chadhava payment verified",
      data: booking,
    });
  } catch (error) {
    console.error("Failed to complete chadhava payment:", error);
    res.status(500).json({ success: false, message: "Failed to verify chadhava payment" });
  }
};

/**
 * Razorpay reconciliation for a Chadhava booking. Called by the shared webhook
 * dispatcher (and by the legacy per-service webhook below). Idempotent: only
 * the path that first flips the booking to "paid" sends the WhatsApp.
 *
 * Returns true when the order belonged to a Chadhava booking.
 */
export async function reconcileChadhavaPayment(opts: {
  orderId: string;
  paymentId?: string;
  event: string;
}): Promise<boolean> {
  const { orderId, paymentId, event } = opts;

  const booking = await ChadhavaBooking.findOne({ razorpayOrderId: orderId });
  if (!booking) return false;

  if (booking.paymentStatus === "paid") return true; // already reconciled

  if (event === "payment.captured" || event === "order.paid") {
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    if (paymentId) booking.razorpayPaymentId = paymentId;
    await booking.save();

    // Partner-affiliate credit — the client-verify path does this too, but only
    // one of the two ever flips the booking to "paid", so it fires exactly once.
    void sendPjarOrderToPartnerAffiliate({
      phone: (booking as any).phone,
      orderId: booking.razorpayOrderId,
      orderPrice: Number((booking as any).totalAmount),
      productName: (booking as any).chadhavaName || "CHADHAVA",
    });

    void sendChadhavaConfirmationWhatsapp(booking);
    console.log(`[RazorpayWebhook][Chadhava] order=${orderId} → confirmed`);
  } else if (event === "payment.failed") {
    booking.paymentStatus = "failed";
    await booking.save();
  }

  return true;
}

// NOTE: the Razorpay webhook endpoint now lives in
// controller/payments/razorpayWebhookController.ts — one signed endpoint that
// reconciles every service. reconcileChadhavaPayment above is what it calls.

// GET /chadhava-bookings — admin list
export const getChadhavaBookings: RequestHandler = async (_req, res) => {
  try {
    const bookings = await ChadhavaBooking.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhava bookings" });
  }
};

// GET /chadhava-bookings/user/:phone
export const getUserChadhavaBookings: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }
    const cleanPhone = String(phone).replace(/\D/g, "");
    const alias10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    const bookings = await ChadhavaBooking.find({
      $or: [
        { phone: cleanPhone },
        { phone: alias10 },
        { phone: { $regex: alias10 + "$" } }
      ]
    }).sort({ addedOn: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user chadhava bookings" });
  }
};

