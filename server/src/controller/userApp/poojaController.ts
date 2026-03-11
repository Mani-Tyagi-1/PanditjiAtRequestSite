import { Request, Response } from "express";
import poojaModel from "../../model/userApp/poojaModel";

// Get all active poojas
export const fetchAllPoojas = async (req: Request, res: Response) => {
  try {
    const poojas = await poojaModel.find({ isActive: true });
    return res.status(200).json({ poojas });
  } catch (error) {
    console.error("Error fetching poojas:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get one pooja by ID — only if it's active
export const fetchPoojaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pooja = await poojaModel.findOne({ _id: id, isActive: true });

    if (!pooja) {
      return res.status(404).json({ message: "Pooja not found or inactive" });
    }

    return res.status(200).json({ pooja });
  } catch (error) {
    console.error("Error fetching pooja by id:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const fetchPoojabycategoryId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const poojas = await poojaModel
      .find({
        isActive: true,
        "mainCategories.id": id,
      })
      .select(
        "_id poojaID poojaNameEng poojaNameHindi poojaMode poojaPriceOnline poojaPriceOffline mainCategories subCategories poojaCardImage isFeatured isActive"
      )
      .lean();

    return res.status(200).json({
      message: "Poojas fetched successfully",
      poojas,
    });
  } catch (error) {
    console.error("Error fetching poojas by category id:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
