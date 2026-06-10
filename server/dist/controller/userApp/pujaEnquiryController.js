"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPujaEnquiries = exports.createPujaEnquiry = void 0;
const pujaEnquiryModel_1 = __importDefault(require("../../model/userApp/pujaEnquiryModel"));
const createPujaEnquiry = async (req, res) => {
    try {
        const { fullName, phone, astrologerAdvised, timing, city, pujaId, pujaName } = req.body;
        if (!fullName || !phone || !astrologerAdvised || !timing || !city || !pujaId) {
            res.status(400).json({
                success: false,
                message: "fullName, phone, astrologerAdvised, timing, city, and pujaId are required",
            });
            return;
        }
        const enquiry = await pujaEnquiryModel_1.default.create({
            fullName,
            phone,
            astrologerAdvised,
            timing,
            city,
            pujaId,
            pujaName,
            isFromSite: true,
        });
        res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully",
            data: enquiry,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to submit enquiry",
        });
    }
};
exports.createPujaEnquiry = createPujaEnquiry;
const getAllPujaEnquiries = async (_req, res) => {
    try {
        const enquiries = await pujaEnquiryModel_1.default.find().sort({ addedOn: -1 });
        res.status(200).json({ success: true, data: enquiries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch enquiries" });
    }
};
exports.getAllPujaEnquiries = getAllPujaEnquiries;
