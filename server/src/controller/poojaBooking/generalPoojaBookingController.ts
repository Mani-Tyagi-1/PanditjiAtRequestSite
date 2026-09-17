import { RequestHandler } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import GeneralPooja from "../../model/userApp/generalPoojaModel";
import GeneralPoojaPending from "../../model/poojaBooking/generalPoojaPending.model";
import GeneralPoojaBooking from "../../model/poojaBooking/generalPoojaBooking.model";
import { convertFromInr, resolveCurrency, toMinorUnits } from "../../config/currency";

const production = process.env.PAYMENT_MODE === "production";
const keyId = production ? process.env.RAZORPAY_KEY_ID_LIVE : process.env.RAZORPAY_KEY_ID_TEST;
const keySecret = production ? process.env.RAZORPAY_KEY_SECRET_LIVE : process.env.RAZORPAY_KEY_SECRET_TEST;
const razorpay = new Razorpay({ key_id: keyId || "", key_secret: keySecret || "" });

export const createGeneralPoojaPending: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body;
    const pooja = await GeneralPooja.findById(body.pujaSlug).lean();
    if (!pooja || pooja.status !== "open") { res.status(404).json({ message: "General pooja not found." }); return; }
    let basePrice = pooja.price;
    let selectedPackage = undefined;

    if (body.packageId && Array.isArray(pooja.packages)) {
      selectedPackage = pooja.packages.find((p: any) => String(p._id) === String(body.packageId) || p.name === body.packageName || p.id === body.packageId);
      if (selectedPackage) {
        basePrice = selectedPackage.price;
      }
    }

    const familyMembers = Array.isArray(body.familyMembers) ? body.familyMembers.map(String).slice(0, 20) : [];
    
    // Member cost logic (some packages might include free members)
    const freePersons = selectedPackage?.freePersons || 0;
    const membersToCharge = Math.max(0, familyMembers.length - freePersons);
    const familyCost = membersToCharge * 101;

    // Prasad logic
    const freePrasad = selectedPackage?.freePrasad || false;
    const prasadCost = (body.prasadAdded && !freePrasad) ? 501 : 0;

    // Upsell logic
    let upsellCost = 0;
    if (Array.isArray(body.upsellsAdded)) {
      upsellCost = body.upsellsAdded.reduce((sum: number, u: any) => sum + Number(u.price || 0), 0);
    }

    const amount = basePrice + familyCost + prasadCost + upsellCost;
    if (!Number.isFinite(amount) || amount <= 0) { res.status(400).json({ message: "Invalid amount." }); return; }
    const currency = resolveCurrency(body.currency);
    const chargedAmount = convertFromInr(amount, currency);
    const order = await razorpay.orders.create({ amount: toMinorUnits(chargedAmount, currency), currency, receipt: `GEN_${crypto.randomBytes(8).toString("hex")}` });
    const pending = await GeneralPoojaPending.create({
      generalPoojaId: pooja._id, pujaName: pooja.name, templeName: pooja.templeName,
      devoteeName: String(body.bhaktName || "").trim(), gotra: String(body.gotra || "").trim(),
      phone: String(body.phone || "").replace(/\D/g, ""), email: String(body.emailId || "").trim(),
      bookingDate: new Date(body.bookingDate),
      familyMembers: Array.isArray(body.familyMembers) ? body.familyMembers.map(String).slice(0, 20) : [],
      prasadAdded: body.prasadAdded === true,
      ...(body.prasadAdded === true && body.address ? { address: body.address } : {}),
      ...(Array.isArray(body.upsellsAdded) ? { upsellsAdded: body.upsellsAdded } : {}),
      amount, chargedAmount, currency, countryCode: String(body.countryCode || "").slice(0, 2),
      country: String(body.country || "").slice(0, 64), razorpayOrderId: order.id,
    });
    res.status(201).json({ bookingId: pending.id, razorpayOrderId: order.id, razorpayKeyId: keyId, currency, amount, chargedAmount, amountMinor: toMinorUnits(chargedAmount, currency) });
  } catch (error) { next(error); }
};

export const completeGeneralPoojaBooking: RequestHandler = async (req, res, next) => {
  try {
    const { pendingBookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, amountPaid } = req.body;
    const pending = await GeneralPoojaPending.findById(pendingBookingId);
    if (!pending || pending.razorpayOrderId !== razorpayOrderId) { res.status(404).json({ message: "Pending booking not found." }); return; }
    const signature = crypto.createHmac("sha256", keySecret || "").update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
    if (signature !== razorpaySignature) { res.status(400).json({ message: "Payment verification failed." }); return; }
    if (Math.round(Number(pending.amount) * 100) !== Math.round(Number(amountPaid) * 100)) { res.status(400).json({ message: "Amount paid mismatch." }); return; }
    const existing = await GeneralPoojaBooking.findOne({ razorpayOrderId });
    if (existing) { res.json({ message: "Booking already confirmed.", booking: existing }); return; }
    const booking = await GeneralPoojaBooking.create({
      generalPoojaId: pending.generalPoojaId, pujaName: pending.pujaName, templeName: pending.templeName,
      devoteeName: pending.devoteeName, gotra: pending.gotra, phone: pending.phone, email: pending.email,
      bookingDate: pending.bookingDate, familyMembers: pending.familyMembers,
      prasadAdded: pending.prasadAdded, ...(pending.address ? { address: pending.address } : {}),
      ...(pending.upsellsAdded ? { upsellsAdded: pending.upsellsAdded } : {}),
      amount: pending.amount, chargedAmount: pending.chargedAmount, currency: pending.currency, countryCode: pending.countryCode, country: pending.country,
      razorpayOrderId, razorpayPaymentId, paidAt: new Date(),
    });
    await pending.deleteOne();
    res.status(201).json({ message: "General pooja booking confirmed.", booking });
  } catch (error) { next(error); }
};
