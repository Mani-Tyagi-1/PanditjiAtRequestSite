import { Request, Response } from "express";
import blogModel from "../../models/userApp/blogModel";

// Get all active blogs
export const fetchAllBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await blogModel.find({ isActive: true }).sort({ addedDate: -1 });
    return res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({ success: false, message: "Server error", error });
  }
};
