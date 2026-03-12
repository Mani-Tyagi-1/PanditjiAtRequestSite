// src/controller/userApp/userAddressController.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import userAddressModel from "../../model/userApp/userAddressModel";
import servicabileCityModel from "../../model/userApp/servicabileCityModel";
import mongoose from "mongoose";
import { sendEncryptedResponse } from "../../utils/encryption"; // ⬅️ use this for GET

// --- Utility: asyncHandler to wrap async route handlers ---
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };

// --- Helper: extract userId from body / query / headers (tolerant) ---
const extractUserId = (req: Request): string | null => {
  const bodyId = (req.body && (req.body as any).userId) || null;
  const queryId = (req.query && (req.query.userId as string | undefined)) || null;
  const headerId = (req.headers["x-user-id"] as string | undefined) || (req.headers["x-userid"] as string | undefined) || null;
  return bodyId || queryId || headerId;
};

// --- Validate that id is a valid ObjectId ---
const isValidObjectId = (id?: string | null) => !!id && mongoose.Types.ObjectId.isValid(id);

/* -------------------- POST /addresses (DECRYPTED IN MIDDLEWARE) -------------------- */
export const createAddress: RequestHandler = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ message: "User ID is required (body.userId, query.userId or x-user-id header)." });
  if (!isValidObjectId(userId)) return res.status(400).json({ message: "Invalid user ID." });

  const {
    addressLine1, addressLine2, street, city, state, pincode,
    latitude, longitude, addressName, country, isPrimary = false,
  } = req.body;

  if (!addressLine1 || !street || !state || !pincode || latitude == null || longitude == null || !addressName || !country) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (isPrimary) {
    const session = await userAddressModel.db.startSession();
    session.startTransaction();
    try {
      await userAddressModel.updateMany({ user: userId }, { $set: { isPrimary: false } }, { session });
      const [created] = await userAddressModel.create([{
        user: userId, addressLine1, addressLine2, street, city, state, pincode,
        latitude, longitude, addressName, country, isPrimary: true,
      }], { session });
      await session.commitTransaction(); session.endSession();
      return res.status(201).json(created);
    } catch (err) {
      await session.abortTransaction(); session.endSession(); throw err;
    }
  }

  const address = await userAddressModel.create({
    user: userId, addressLine1, addressLine2, street, city, state, pincode,
    latitude, longitude, addressName, country, isPrimary,
  });
  res.status(201).json(address);
});

/* -------------------- GET /addresses (ENCRYPT RESPONSE) -------------------- */
export const getAddresses: RequestHandler = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  if (!userId) return sendEncryptedResponse(res, 400, { message: "User ID is required (body.userId, query.userId or x-user-id header)." });
  if (!isValidObjectId(userId)) return sendEncryptedResponse(res, 400, { message: "Invalid user ID." });

  const addresses = await userAddressModel.find({ user: userId }).sort({ isPrimary: -1, updatedAt: -1 });
  return sendEncryptedResponse(res, 200, addresses);
});

/* -------------------- GET /addresses/:id (ENCRYPT RESPONSE) -------------------- */
export const getAddressById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = extractUserId(req);
  if (!userId) return sendEncryptedResponse(res, 400, { message: "User ID is required (body.userId, query.userId or x-user-id header)." });
  if (!isValidObjectId(userId)) return sendEncryptedResponse(res, 400, { message: "Invalid user ID." });
  if (!isValidObjectId(id)) return sendEncryptedResponse(res, 400, { message: "Invalid address ID." });

  const address = await userAddressModel.findOne({ _id: id, user: userId });
  if (!address) return sendEncryptedResponse(res, 404, { message: "Address not found or does not belong to the user." });

  return sendEncryptedResponse(res, 200, address);
});

/* -------------------- PUT/PATCH /addresses/:id (DECRYPTED IN MIDDLEWARE) -------------------- */
export const updateAddress: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ message: "User ID is required (body.userId, query.userId or x-user-id header)." });
  if (!isValidObjectId(userId)) return res.status(400).json({ message: "Invalid user ID." });
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid address ID." });

  const payload = { ...req.body };
  // Prevent changing owner via payload
  delete (payload as any).user;
  delete (payload as any).userId;

  if (payload.isPrimary) {
    const session = await userAddressModel.db.startSession();
    session.startTransaction();
    try {
      await userAddressModel.updateMany({ user: userId, _id: { $ne: id } }, { $set: { isPrimary: false } }, { session });
      const updatedAddress = await userAddressModel.findOneAndUpdate(
        { _id: id, user: userId }, { $set: payload }, { new: true, runValidators: true, session }
      );
      if (!updatedAddress) {
        await session.abortTransaction(); session.endSession();
        return res.status(404).json({ message: "Address not found or does not belong to the user." });
      }
      await session.commitTransaction(); session.endSession();
      return res.status(200).json(updatedAddress);
    } catch (err) {
      await session.abortTransaction(); session.endSession(); throw err;
    }
  }

  const updatedAddress = await userAddressModel.findOneAndUpdate(
    { _id: id, user: userId }, { $set: payload }, { new: true, runValidators: true }
  );
  if (!updatedAddress) return res.status(404).json({ message: "Address not found or does not belong to the user." });
  return res.status(200).json(updatedAddress);
});

/* -------------------- DELETE /addresses/:id (PLAIN) -------------------- */
export const deleteAddress: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = extractUserId(req);
  if (!userId) return res.status(400).json({ message: "User ID is required (body.userId, query.userId or x-user-id header)." });
  if (!isValidObjectId(userId)) return res.status(400).json({ message: "Invalid user ID." });
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid address ID." });

  const address = await userAddressModel.findOneAndDelete({ _id: id, user: userId });
  if (!address) return res.status(404).json({ message: "Address not found or does not belong to the user." });

  return res.status(200).json({ message: "Address deleted successfully." });
});

/* -------------------- POST /addresses/check (DECRYPTED IN MIDDLEWARE) -------------------- */
export const checkServiceability: RequestHandler = asyncHandler(async (req, res) => {
  const { addressId, latitude, longitude } = req.body; // already decrypted by middleware

  let userLocationPoint;

  if (addressId) {
    if (!isValidObjectId(addressId)) return res.status(400).json({ message: "Invalid address ID." });

    const userAddress = await userAddressModel.findById(addressId);
    if (!userAddress) return res.status(404).json({ message: "User address not found." });

    // If addressId is provided, we still check ownership if userId is available
    const userId = extractUserId(req);
    if (userId && String(userAddress.user) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden: this address does not belong to the given user." });
    }

    userLocationPoint = { type: "Point" as const, coordinates: [userAddress.longitude, userAddress.latitude] };
  } else if (latitude != null && longitude != null) {
    userLocationPoint = { type: "Point" as const, coordinates: [Number(longitude), Number(latitude)] };
  } else {
    return res.status(400).json({ message: "Address ID or coordinates (latitude, longitude) are required." });
  }

  const serviceableCity = await servicabileCityModel.findOne({
    bounds: { $geoIntersects: { $geometry: userLocationPoint } },
  });

  if (serviceableCity) {
    return res.status(200).json({
      isServiceable: true,
      message: "Service is available in your area.",
      city: { name: serviceableCity.name, state: serviceableCity.state },
    });
  }
  return res.status(200).json({
    isServiceable: false,
    message: "Sorry, service is not yet available in your area.",
  });
});

/* -------------------- POST /addresses/check-pincode (DECRYPTED IN MIDDLEWARE) -------------------- */
export const checkPincodeServiceability: RequestHandler = asyncHandler(async (req, res) => {
  const { pincode } = req.body;
  if (!pincode) return res.status(400).json({ message: "Pincode is required." });

  const serviceableCity = await servicabileCityModel.findOne({ pincodes: pincode });

  if (serviceableCity) {
    return res.status(200).json({
      isServiceable: true,
      message: "Service is available in your area.",
      city: { name: serviceableCity.name, state: serviceableCity.state },
    });
  }
  return res.status(200).json({
    isServiceable: false,
    message: "Sorry, service is not yet available in your area.",
  });
});
