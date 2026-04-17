import { RequestHandler } from "express";
import PujaEnquiry from "../../model/userApp/pujaEnquiryModel";

export const createPujaEnquiry: RequestHandler = async (req, res) => {
  try {
    const { fullName, phone, astrologerAdvised, timing, city, pujaId, pujaName } = req.body;

    if (!fullName || !phone || !astrologerAdvised || !timing || !city || !pujaId) {
      res.status(400).json({
        success: false,
        message: "fullName, phone, astrologerAdvised, timing, city, and pujaId are required",
      });
      return;
    }

    const enquiry = await PujaEnquiry.create({
      fullName,
      phone,
      astrologerAdvised,
      timing,
      city,
      pujaId,
      pujaName,
      isFromSite: true,
    });

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
    });
  }
};

export const getAllPujaEnquiries: RequestHandler = async (_req, res) => {
  try {
    const enquiries = await PujaEnquiry.find().sort({ addedOn: -1 });
    res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch enquiries" });
  }
};
