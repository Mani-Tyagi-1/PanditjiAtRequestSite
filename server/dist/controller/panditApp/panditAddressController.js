"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.deletePanditSecondary = exports.updatePanditSecondary = exports.getPanditAddresses = exports.addPanditAddress = void 0;
const panditAddressModel_1 = __importDefault(require("../../model/panditApp/panditAddressModel"));
/* ------------------------------------------------------------ */
/*  Utility: async wrapper                                      */
/* ------------------------------------------------------------ */
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
exports.asyncHandler = asyncHandler;
/* Helper to count addresses for a pandit */
const countByPandit = (panditId) => panditAddressModel_1.default.countDocuments({ pandit: panditId });
/* ------------------------------------------------------------ */
/*  CREATE                                                      */
/* ------------------------------------------------------------ */
exports.addPanditAddress = asyncHandler(async (req, res) => {
    const { panditId } = req.params; // path param
    const { addressLine1, addressLine2, city, state, country, latitude, longitude, addressName, pincode, } = req.body;
    /* basic validation */
    if (!addressLine1 ||
        !city ||
        !state ||
        latitude === undefined ||
        longitude === undefined ||
        !pincode) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    const total = await countByPandit(panditId);
    if (total >= 2) {
        return res
            .status(400)
            .json({ message: "Maximum of two addresses reached." });
    }
    const isPrimary = total === 0; // first address => primary
    const address = await panditAddressModel_1.default.create({
        pandit: panditId,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        latitude,
        longitude,
        addressName,
        pincode,
        isPrimary,
    });
    res.status(201).json(address);
});
/* ------------------------------------------------------------ */
/*  READ                                                        */
/* ------------------------------------------------------------ */
exports.getPanditAddresses = asyncHandler(async (req, res) => {
    const { panditId } = req.params;
    const addressPandit = await panditAddressModel_1.default.find({ pandit: panditId }).sort({
        isPrimary: -1,
        updatedAt: -1,
    });
    res.status(200).json(addressPandit);
});
/* ------------------------------------------------------------ */
/*  UPDATE (secondary only)                                     */
/* ------------------------------------------------------------ */
exports.updatePanditSecondary = asyncHandler(async (req, res) => {
    const { panditId, addressId } = req.params;
    const payload = req.body;
    const address = await panditAddressModel_1.default.findOne({
        _id: addressId,
        pandit: panditId,
    });
    if (!address) {
        return res.status(404).json({ message: "Address not found." });
    }
    if (address.isPrimary) {
        return res
            .status(403)
            .json({ message: "Primary address cannot be modified." });
    }
    Object.assign(address, payload);
    await address.save();
    res.status(200).json(address);
});
/* ------------------------------------------------------------ */
/*  DELETE (secondary only)                                     */
/* ------------------------------------------------------------ */
exports.deletePanditSecondary = asyncHandler(async (req, res) => {
    const { panditId, addressId } = req.params;
    const address = await panditAddressModel_1.default.findOneAndDelete({
        _id: addressId,
        pandit: panditId,
        isPrimary: false, // ensure secondary
    });
    if (!address) {
        return res
            .status(404)
            .json({ message: "Secondary address not found or already removed." });
    }
    res.status(200).json({ message: "Secondary address deleted." });
});
