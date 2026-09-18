import { RequestHandler } from "express";
import GeneralPooja from "../../model/userApp/generalPoojaModel";

export const getGeneralPoojas: RequestHandler = async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const poojas = await GeneralPooja.find({
    status: "open",
    $or: [
      { pujaDate: { $gte: today } },
      { pujaDate: null },
      { pujaDate: { $exists: false } }
    ]
  }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: poojas });
};

export const getGeneralPoojaById: RequestHandler = async (req, res) => {
  try {
    const pooja = await GeneralPooja.findById(req.params.id).lean();
    if (!pooja) { res.status(404).json({ success: false, message: "General pooja not found" }); return; }
    res.json({ success: true, data: pooja });
  } catch {
    res.status(400).json({ success: false, message: "Invalid general pooja id" });
  }
};
