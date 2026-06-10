"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPincodeServiceability = exports.checkServiceability = exports.deleteAddress = exports.updateAddress = exports.getAddressById = exports.getAddresses = exports.createAddress = void 0;
const userAddressModel_1 = __importDefault(require("../../model/userApp/userAddressModel"));
const servicabileCityModel_1 = __importDefault(require("../../model/userApp/servicabileCityModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const encryption_1 = require("../../utils/encryption"); // ⬅️ use this for GET
// --- Utility: asyncHandler to wrap async route handlers ---
const asyncHandler = (fn) => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
// --- Helper: extract userId from body / query / headers (tolerant) ---
const extractUserId = (req) => {
    const bodyId = (req.body && req.body.userId) || null;
    const queryId = (req.query && req.query.userId) || null;
    const headerId = req.headers["x-user-id"] || req.headers["x-userid"] || null;
    return bodyId || queryId || headerId;
};
// --- Validate that id is a valid ObjectId ---
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
/* -------------------- POST /addresses (DECRYPTED IN MIDDLEWARE) -------------------- */
exports.createAddress = asyncHandler(async (req, res) => {
    const userId = extractUserId(req);
    if (!userId)
        return res.status(400).json({ message: "User ID is required (body.userId, query.userId or x-user-id header)." });
    if (!isValidObjectId(userId))
        return res.status(400).json({ message: "Invalid user ID." });
    const { addressLine1, addressLine2, street, city, state, pincode, latitude, longitude, addressName, country, isPrimary = false, } = req.body;
    if (!addressLine1 || !street || !state || !pincode || latitude == null || longitude == null || !addressName || !country) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    if (isPrimary) {
        const session = await userAddressModel_1.default.db.startSession();
        session.startTransaction();
        try {
            await userAddressModel_1.default.updateMany({ user: userId }, { $set: { isPrimary: false } }, { session });
            const [created] = await userAddressModel_1.default.create([{
                    user: userId, addressLine1, addressLine2, street, city, state, pincode,
                    latitude, longitude, addressName, country, isPrimary: true,
                }], { session });
            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(created);
        }
        catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
    const address = await userAddressModel_1.default.create({
        user: userId, addressLine1, addressLine2, street, city, state, pincode,
        latitude, longitude, addressName, country, isPrimary,
    });
    res.status(201).json(address);
});
/* -------------------- GET /addresses (ENCRYPT RESPONSE) -------------------- */
exports.getAddresses = asyncHandler(async (req, res) => {
    const userId = extractUserId(req);
    if (!userId)
        return (0, encryption_1.sendEncryptedResponse)(res, 400, { message: "User ID is required (body.userId, query.userId or x-user-id header)." });
    if (!isValidObjectId(userId))
        return (0, encryption_1.sendEncryptedResponse)(res, 400, { message: "Invalid user ID." });
    const addresses = await userAddressModel_1.default.find({ user: userId }).sort({ isPrimary: -1, updatedAt: -1 });
    return (0, encryption_1.sendEncryptedResponse)(res, 200, addresses);
});
/* -------------------- GET /addresses/:id (ENCRYPT RESPONSE) -------------------- */
exports.getAddressById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = extractUserId(req);
    if (!userId)
        return (0, encryption_1.sendEncryptedResponse)(res, 400, { message: "User ID is required (body.userId, query.userId or x-user-id header)." });
    if (!isValidObjectId(userId))
        return (0, encryption_1.sendEncryptedResponse)(res, 400, { message: "Invalid user ID." });
    if (!isValidObjectId(id))
        return (0, encryption_1.sendEncryptedResponse)(res, 400, { message: "Invalid address ID." });
    const address = await userAddressModel_1.default.findOne({ _id: id, user: userId });
    if (!address)
        return (0, encryption_1.sendEncryptedResponse)(res, 404, { message: "Address not found or does not belong to the user." });
    return (0, encryption_1.sendEncryptedResponse)(res, 200, address);
});
/* -------------------- PUT/PATCH /addresses/:id (DECRYPTED IN MIDDLEWARE) -------------------- */
exports.updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = extractUserId(req);
    if (!userId)
        return res.status(400).json({ message: "User ID is required (body.userId, query.userId or x-user-id header)." });
    if (!isValidObjectId(userId))
        return res.status(400).json({ message: "Invalid user ID." });
    if (!isValidObjectId(id))
        return res.status(400).json({ message: "Invalid address ID." });
    const payload = { ...req.body };
    // Prevent changing owner via payload
    delete payload.user;
    delete payload.userId;
    if (payload.isPrimary) {
        const session = await userAddressModel_1.default.db.startSession();
        session.startTransaction();
        try {
            await userAddressModel_1.default.updateMany({ user: userId, _id: { $ne: id } }, { $set: { isPrimary: false } }, { session });
            const updatedAddress = await userAddressModel_1.default.findOneAndUpdate({ _id: id, user: userId }, { $set: payload }, { new: true, runValidators: true, session });
            if (!updatedAddress) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: "Address not found or does not belong to the user." });
            }
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json(updatedAddress);
        }
        catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
    const updatedAddress = await userAddressModel_1.default.findOneAndUpdate({ _id: id, user: userId }, { $set: payload }, { new: true, runValidators: true });
    if (!updatedAddress)
        return res.status(404).json({ message: "Address not found or does not belong to the user." });
    return res.status(200).json(updatedAddress);
});
/* -------------------- DELETE /addresses/:id (PLAIN) -------------------- */
exports.deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = extractUserId(req);
    if (!userId)
        return res.status(400).json({ message: "User ID is required (body.userId, query.userId or x-user-id header)." });
    if (!isValidObjectId(userId))
        return res.status(400).json({ message: "Invalid user ID." });
    if (!isValidObjectId(id))
        return res.status(400).json({ message: "Invalid address ID." });
    const address = await userAddressModel_1.default.findOneAndDelete({ _id: id, user: userId });
    if (!address)
        return res.status(404).json({ message: "Address not found or does not belong to the user." });
    return res.status(200).json({ message: "Address deleted successfully." });
});
/* -------------------- POST /addresses/check (DECRYPTED IN MIDDLEWARE) -------------------- */
exports.checkServiceability = asyncHandler(async (req, res) => {
    const { addressId, latitude, longitude } = req.body; // already decrypted by middleware
    let userLocationPoint;
    if (addressId) {
        if (!isValidObjectId(addressId))
            return res.status(400).json({ message: "Invalid address ID." });
        const userAddress = await userAddressModel_1.default.findById(addressId);
        if (!userAddress)
            return res.status(404).json({ message: "User address not found." });
        // If addressId is provided, we still check ownership if userId is available
        const userId = extractUserId(req);
        if (userId && String(userAddress.user) !== String(userId)) {
            return res.status(403).json({ message: "Forbidden: this address does not belong to the given user." });
        }
        userLocationPoint = { type: "Point", coordinates: [userAddress.longitude, userAddress.latitude] };
    }
    else if (latitude != null && longitude != null) {
        userLocationPoint = { type: "Point", coordinates: [Number(longitude), Number(latitude)] };
    }
    else {
        return res.status(400).json({ message: "Address ID or coordinates (latitude, longitude) are required." });
    }
    const serviceableCity = await servicabileCityModel_1.default.findOne({
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
exports.checkPincodeServiceability = asyncHandler(async (req, res) => {
    const { pincode } = req.body;
    if (!pincode)
        return res.status(400).json({ message: "Pincode is required." });
    const serviceableCity = await servicabileCityModel_1.default.findOne({ pincodes: pincode });
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
