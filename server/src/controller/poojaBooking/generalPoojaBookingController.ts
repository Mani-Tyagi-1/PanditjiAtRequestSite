import { RequestHandler } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import GeneralPooja from "../../model/userApp/generalPoojaModel";
import GeneralPoojaPending from "../../model/poojaBooking/generalPoojaPending.model";
import GeneralPoojaBooking from "../../model/poojaBooking/generalPoojaBooking.model";
import { convertFromInr, resolveCurrency, toMinorUnits } from "../../config/currency";
import jwt from "jsonwebtoken";
import User from "../../model/userApp/userModel";
import { sendBookingConfirmationWhatsapp } from "./poojaBookingController";
import mongoose from "mongoose";
import { resolveUser } from "../../utils/resolveUser";

const production = process.env.PAYMENT_MODE === "production";
const keyId = production ? process.env.RAZORPAY_KEY_ID_LIVE : process.env.RAZORPAY_KEY_ID_TEST;
const keySecret = production ? process.env.RAZORPAY_KEY_SECRET_LIVE : process.env.RAZORPAY_KEY_SECRET_TEST;
const razorpay = new Razorpay({ key_id: keyId || "", key_secret: keySecret || "" });

export const createGeneralPoojaPending: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body;
    if (!mongoose.Types.ObjectId.isValid(body.pujaSlug)) {
      res.status(400).json({ message: "Invalid general pooja ID format." }); return;
    }
    const pooja = await GeneralPooja.findById(body.pujaSlug).lean();
    if (!pooja || pooja.status !== "open") { res.status(404).json({ message: "General pooja not found." }); return; }

    const phoneDigits = String(body.phone || "").replace(/\D/g, "");
    const countryCode = String(body.countryCode || "").slice(0, 2).toUpperCase();
    if (countryCode === "IN" && !/^[6-9]\d{9}$/.test(phoneDigits)) {
      res.status(400).json({ message: "Invalid Indian mobile number." }); return;
    }

    if (body.prasadAdded && body.address && body.address.pincode) {
      const pincode = String(body.address.pincode).trim();
      if (countryCode === "IN" && !/^\d{6}$/.test(pincode)) {
        res.status(400).json({ message: "Invalid Indian pincode." }); return;
      }
    }

    // Reject bookings for past-dated pujas
    if (pooja.pujaDate) {
      const pujaDate = new Date(pooja.pujaDate);
      if (!isNaN(pujaDate.getTime()) && pujaDate.getTime() < Date.now()) {
        res.status(400).json({ message: "This puja date has passed. Booking is no longer available." }); return;
      }
    }
    let basePrice = pooja.price;
    let selectedPackage = undefined;

    if (body.packageId && Array.isArray(pooja.packages)) {
      selectedPackage = pooja.packages.find((p: any) => String(p._id) === String(body.packageId) || p.name === body.packageName || p.id === body.packageId);
      if (selectedPackage) {
        basePrice = selectedPackage.price;
      }
    }

    const familyMembers = Array.isArray(body.familyMembers)
      ? [...new Set(body.familyMembers.map(String).map((s: string) => s.trim()).filter(Boolean))].slice(0, 20)
      : [];

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

    const resolved = await resolveUser({
      phone: body.phone,
      dialCode: body.dialCode,
      email: body.emailId,
      name: body.bhaktName,
      gotra: body.gotra,
      countryCode: body.countryCode,
      country: body.country,
    });

    const order = await razorpay.orders.create({ amount: toMinorUnits(chargedAmount, currency), currency, receipt: `GEN_${crypto.randomBytes(8).toString("hex")}` });
    const pending = await GeneralPoojaPending.create({
      userId: resolved?.user?._id || undefined,
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
    if (!mongoose.Types.ObjectId.isValid(pendingBookingId)) {
      res.status(400).json({ message: "Invalid pending booking ID format." }); return;
    }
    const pending = await GeneralPoojaPending.findById(pendingBookingId);
    if (!pending || pending.razorpayOrderId !== razorpayOrderId) { res.status(404).json({ message: "Pending booking not found." }); return; }
    const signature = crypto.createHmac("sha256", keySecret || "").update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
    if (signature !== razorpaySignature) { res.status(400).json({ message: "Payment verification failed." }); return; }
    if (Math.round(Number(pending.amount) * 100) !== Math.round(Number(amountPaid) * 100)) { res.status(400).json({ message: "Amount paid mismatch." }); return; }
    const existing = await GeneralPoojaBooking.findOne({ razorpayOrderId });

    if (existing) {
      const token = existing.userId ? jwt.sign({ id: existing.userId }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "7d" }) : undefined;
      const user = existing.userId ? await User.findById(existing.userId).select("name email phone gotra given_name family_name addedOn") : undefined;
      res.json({ message: "Booking already confirmed.", booking: existing, token, user });
      return;
    }

    let userId = pending.userId;
    if (!userId) {
      const resolved = await resolveUser({
        phone: pending.phone,
        email: pending.email,
        name: pending.devoteeName,
        gotra: pending.gotra,
        countryCode: pending.countryCode,
        country: pending.country,
      });
      userId = resolved?.user?._id;
    }

    const booking = await GeneralPoojaBooking.create({
      userId: userId || undefined,
      generalPoojaId: pending.generalPoojaId, pujaName: pending.pujaName, templeName: pending.templeName,
      devoteeName: pending.devoteeName, gotra: pending.gotra, phone: pending.phone, email: pending.email,
      bookingDate: pending.bookingDate, familyMembers: pending.familyMembers,
      prasadAdded: pending.prasadAdded, ...(pending.address ? { address: pending.address } : {}),
      ...(pending.upsellsAdded ? { upsellsAdded: pending.upsellsAdded } : {}),
      amount: pending.amount, chargedAmount: pending.chargedAmount, currency: pending.currency, countryCode: pending.countryCode, country: pending.country,
      razorpayOrderId, razorpayPaymentId, paidAt: new Date(),
    });
    await pending.deleteOne();

    void sendBookingConfirmationWhatsapp(booking);

    let token, user;
    if (booking.userId) {
      token = jwt.sign({ id: booking.userId }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "7d" });
      user = await User.findById(booking.userId).select("name email phone gotra given_name family_name addedOn");
    }

    res.status(201).json({ message: "General pooja booking confirmed.", booking, token, user });
  } catch (error) { next(error); }
};
