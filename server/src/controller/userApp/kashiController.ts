import { RequestHandler } from "express";
import KashiRequest from "../../model/userApp/kashiRequestModel";

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
