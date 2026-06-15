import { RequestHandler } from "express";
import LiveMandirPuja from "../../model/userApp/liveMandirPujaModel";
import LiveMandirBooking from "../../model/userApp/liveMandirBookingModel";

// Shape a DB doc to the frontend `LiveMandirPuja` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

// GET /live-mandir-pujas — active catalog for the cards
export const getLivePujas: RequestHandler = async (_req, res) => {
  try {
    const pujas = await LiveMandirPuja.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: pujas.map(toClientShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch live pujas" });
  }
};

// GET /live-mandir-pujas/:slug — fetch single live puja details
export const getLivePujaBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const puja = await LiveMandirPuja.findOne({ slug, isActive: true });
    if (!puja) {
      res.status(404).json({ success: false, message: "Live puja not found" });
      return;
    }
    res.status(200).json({ success: true, data: toClientShape(puja) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch live puja details" });
  }
};

// POST /live-mandir-bookings — create a booking
export const createLiveBooking: RequestHandler = async (req, res) => {
  try {
    const {
      pujaSlug,
      pujaName,
      templeName,
      packageId,
      packageName,
      amount,
      devoteeName,
      gotra,
      members,
      phone,
      wish,
    } = req.body;

    if (!pujaSlug || !devoteeName || !phone || amount == null) {
      res.status(400).json({
        success: false,
        message: "pujaSlug, devoteeName, phone and amount are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    const booking = await LiveMandirBooking.create({
      pujaSlug,
      pujaName,
      templeName,
      packageId,
      packageName,
      amount,
      devoteeName,
      gotra,
      members,
      phone: cleanPhone,
      wish,
      isFromSite: true,
    });

    res.status(201).json({
      success: true,
      message: "Live puja booking created successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

// GET /live-mandir-bookings — admin list
export const getLiveBookings: RequestHandler = async (_req, res) => {
  try {
    const bookings = await LiveMandirBooking.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};
