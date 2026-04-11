import { Request, Response } from "express";
import poojaModel from "../../models/userApp/poojaModel";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { NotFoundError } from "../../utils/errors";
import mongoose from "mongoose";

// Get all active poojas
export const fetchAllPoojas = asyncHandler(async (req: Request, res: Response) => {
  const poojas = await poojaModel.find({ isActive: true });
  return sendSuccess(res, "Poojas fetched successfully", { poojas });
});

// Get one pooja by ID — only if it's active
export const fetchPoojaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotFoundError("Invalid Pooja ID format");
  }

  const pooja = await poojaModel.findOne({ _id: id, isActive: true });

  if (!pooja) {
    throw new NotFoundError("Pooja not found or inactive");
  }

  return sendSuccess(res, "Pooja fetched successfully", { pooja });
});

export const fetchPoojabycategoryId = asyncHandler(async (req: Request, res: Response) => {
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

  return sendSuccess(res, "Poojas fetched successfully", { poojas });
});

