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
