import { RequestHandler } from "express";
import Chadhava from "../../model/userApp/chadhavaModel";
import ChadhavaBooking from "../../model/userApp/chadhavaBookingModel";
import { CHADHAVA_SEED, PRASAD_BOX_UPSELL } from "../../data/chadhavaSeed";

// Shape a DB doc to the frontend `Chadhava` interface (id = slug).
const toClientShape = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj.slug };
};

// GET /chadhavas — active catalog for the cards
export const getChadhavas: RequestHandler = async (_req, res) => {
  try {
    const list = await Chadhava.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    res.status(200).json({
      success: true,
      data: list.map(toClientShape),
      prasadBox: PRASAD_BOX_UPSELL,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhavas" });
  }
};

// GET /chadhavas/:slug — fetch single chadhava details
export const getChadhavaBySlug: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const chadhava = await Chadhava.findOne({ slug, isActive: true });
    if (!chadhava) {
      res.status(404).json({ success: false, message: "Chadhava not found" });
      return;
    }
    res.status(200).json({
      success: true,
      data: toClientShape(chadhava),
      prasadBox: PRASAD_BOX_UPSELL,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhava details" });
  }
};

// POST /chadhava-bookings — create a booking (with optional upsells)
export const createChadhavaBooking: RequestHandler = async (req, res) => {
  try {
    const {
      chadhavaSlug,
      deity,
      templeName,
      offeringId,
      offeringName,
      offeringPrice,
      addPrasadBox,
      addSpiritualProduct,
      spiritualProductName,
      spiritualProductPrice,
      devoteeName,
      gotra,
      phone,
      wish,
    } = req.body;

    if (!chadhavaSlug || !devoteeName || !phone || offeringPrice == null) {
      res.status(400).json({
        success: false,
        message: "chadhavaSlug, devoteeName, phone and offeringPrice are required",
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
      return;
    }

    // Compute totals server-side — never trust the client total.
    const prasadBoxPrice = addPrasadBox ? PRASAD_BOX_UPSELL.price : 0;
    const spiritualPrice = addSpiritualProduct ? Number(spiritualProductPrice) || 0 : 0;
    const totalAmount = Number(offeringPrice) + prasadBoxPrice + spiritualPrice;

    const booking = await ChadhavaBooking.create({
      chadhavaSlug,
      deity,
      templeName,
      offeringId,
      offeringName,
      offeringPrice,
      addPrasadBox: !!addPrasadBox,
      prasadBoxPrice,
      addSpiritualProduct: !!addSpiritualProduct,
      spiritualProductName: addSpiritualProduct ? spiritualProductName : "",
      spiritualProductPrice: spiritualPrice,
      totalAmount,
      devoteeName,
      gotra,
      phone: cleanPhone,
      wish,
      isFromSite: true,
    });

    res.status(201).json({
      success: true,
      message: "Chadhava booking created successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create chadhava booking" });
  }
};

// GET /chadhava-bookings — admin list
export const getChadhavaBookings: RequestHandler = async (_req, res) => {
  try {
    const bookings = await ChadhavaBooking.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chadhava bookings" });
  }
};

// POST /chadhavas/seed — idempotent upsert of the catalog
export const seedChadhavas: RequestHandler = async (_req, res) => {
  try {
    await Promise.all(
      CHADHAVA_SEED.map((c) =>
        Chadhava.updateOne({ slug: c.slug }, { $set: c }, { upsert: true })
      )
    );
    const count = await Chadhava.countDocuments();
    res.status(200).json({ success: true, message: `Seeded chadhavas. Total: ${count}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to seed chadhavas" });
  }
};
