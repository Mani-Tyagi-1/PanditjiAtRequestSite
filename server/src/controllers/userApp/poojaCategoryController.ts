import { Request, Response } from "express";
// import poojaModel from "../models/poojaModel";
import pujaCategoryModal from "../../models/userApp/pujaCategoryModal";

// Get all active poojas
export const fetchAllPoojaCategory = async (req: Request, res: Response) => {
  try {
    const poojaCategory = await pujaCategoryModal.find();
    return res.status(200).json({ poojaCategory });
  } catch (error) {
    console.error("Error fetching poojas:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get one pooja by ID — only if it's active
export const fetchPoojaCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poojaCategory = await pujaCategoryModal.findOne({ _id: id});

    if (!poojaCategory) {
      return res.status(404).json({ message: "Pooja Category not found or inactive" });
    }

    return res.status(200).json({ poojaCategory });
  } catch (error) {
    console.error("Error fetching pooja category by id:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
