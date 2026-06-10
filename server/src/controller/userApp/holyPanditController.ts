import { RequestHandler } from "express";
import HolyPandit from "../../model/userApp/holyPanditModel";
import HolyPanditBooking from "../../model/userApp/holyPanditBookingModel";
import { HOLY_PANDIT_SEED } from "../../data/holyPanditSeed";

// Shape a DB doc to the frontend `HolyPandit` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

// GET /holy-pandits — active catalog for the cards
export const getHolyPandits: RequestHandler = async (_req, res) => {
  try {
    const pandits = await HolyPandit.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({ success: true, data: pandits.map(toClientShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch pandits" });
  }
};

// GET /holy-pandits/:slug — fetch single holy pandit details
export const getHolyPanditBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const pandit = await HolyPandit.findOne({ slug, isActive: true });
    if (!pandit) {
      res.status(404).json({ success: false, message: "Holy pandit not found" });
      return;
    }
    res.status(200).json({ success: true, data: toClientShape(pandit) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch holy pandit details" });
  }
};

// POST /holy-pandit-bookings — create an at-home ritual booking
export const createHolyPanditBooking: RequestHandler = async (req, res) => {
  try {
    const {
      panditSlug,
      panditName,
      panditCity,
      serviceId,
      serviceName,
      amount,
      bhaktName,
      gotra,
      phone,
      ritualDate,
      address,
      city,
      wish,
    } = req.body;

    if (!panditSlug || !bhaktName || !phone || !address || !city || amount == null) {
      res.status(400).json({
        success: false,
        message: "panditSlug, bhaktName, phone, address, city and amount are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    const booking = await HolyPanditBooking.create({
      panditSlug,
      panditName,
      panditCity,
      serviceId,
      serviceName,
      amount,
      bhaktName,
      gotra,
      phone: cleanPhone,
      ritualDate,
      address,
      city,
      wish,
      isFromSite: true,
    });

    res.status(201).json({
      success: true,
      message: "Pandit booking created successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

// GET /holy-pandit-bookings — admin list
export const getHolyPanditBookings: RequestHandler = async (_req, res) => {
  try {
    const bookings = await HolyPanditBooking.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// POST /holy-pandits/seed — idempotent upsert of the catalog
export const seedHolyPandits: RequestHandler = async (_req, res) => {
  try {
    await Promise.all(
      HOLY_PANDIT_SEED.map((p) =>
        HolyPandit.updateOne({ slug: p.slug }, { $set: p }, { upsert: true })
      )
    );
    const count = await HolyPandit.countDocuments();
    res.status(200).json({ success: true, message: `Seeded holy pandits. Total: ${count}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to seed pandits" });
  }
};
