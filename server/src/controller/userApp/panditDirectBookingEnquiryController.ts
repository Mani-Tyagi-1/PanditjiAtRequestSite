import { RequestHandler } from "express";
import PanditDirectBookingEnquiry from "../../model/userApp/panditDirectBookingEnquiryModel";

export const createPanditDirectBookingEnquiry: RequestHandler = async (req, res) => {
  try {
    const { name, phone, panditId, panditName, userId } = req.body;

    if (!name || !phone || !panditId) {
      res.status(400).json({
        success: false,
        message: "name, phone, and panditId are required",
      });
      return;
    }

    const enquiry = await PanditDirectBookingEnquiry.create({
      name,
      phone,
      panditId,
      panditName: panditName || "",
      userId,
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Pandit direct booking enquiry created successfully",
      data: enquiry,
    });
  } catch (error: any) {
    console.error("Failed to create direct booking enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create direct booking enquiry",
      error: error.message || error
    });
  }
};

// GET /pandit-direct-bookings/user/:phone
export const getUserDirectBookings: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }
    const cleanPhone = String(phone).replace(/\D/g, "");
    const alias10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    const enquiries = await PanditDirectBookingEnquiry.find({
      $or: [
        { phone: cleanPhone },
        { phone: alias10 },
        { phone: { $regex: alias10 + "$" } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: enquiries });
  } catch (error: any) {
    console.error("Failed to fetch user direct booking enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user direct booking enquiries",
      error: error.message || error
    });
  }
};

