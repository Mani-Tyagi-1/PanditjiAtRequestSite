import { RequestHandler } from "express";
import ConsultancyLead from "../../model/userApp/consultancyLeadModel";

const createConsultancyLead: RequestHandler = async (req, res) => {
  try {
    const { fullName, mobileNumber, helpWith, concern, poojaType, city, callbackTime } = req.body;

    if (!fullName || !mobileNumber || !concern || !city) {
      res.status(400).json({
        success: false,
        message: "fullName, mobileNumber, concern, and city are required",
      });
      return;
    }

    const lead = await ConsultancyLead.create({
      fullName,
      mobileNumber,
      helpWith,
      concern,
      poojaType,
      city,
      callbackTime,
    });

    res.status(201).json({
      success: true,
      message: "Consultancy lead created successfully",
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create consultancy lead",
    });
  }
};

export default createConsultancyLead;
