import { Request, Response } from "express";
import Testimonial from "../../models/userApp/testimonialModel";

export const fetchAllTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
