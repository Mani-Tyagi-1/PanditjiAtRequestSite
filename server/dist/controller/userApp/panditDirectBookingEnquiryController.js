"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPanditDirectBookingEnquiry = void 0;
const panditDirectBookingEnquiryModel_1 = __importDefault(require("../../model/userApp/panditDirectBookingEnquiryModel"));
const createPanditDirectBookingEnquiry = async (req, res) => {
    try {
        const { name, phone, panditId, panditName, userId } = req.body;
        if (!name || !phone || !panditId) {
            res.status(400).json({
                success: false,
                message: "name, phone, and panditId are required",
            });
            return;
        }
        const enquiry = await panditDirectBookingEnquiryModel_1.default.create({
            name,
            phone,
            panditId,
            panditName: panditName || "",
            userId,
            status: "Pending"
        });
        res.status(201).json({
            success: true,
            message: "Pandit direct booking enquiry created successfully",
            data: enquiry,
        });
    }
    catch (error) {
        console.error("Failed to create direct booking enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create direct booking enquiry",
            error: error.message || error
        });
    }
};
exports.createPanditDirectBookingEnquiry = createPanditDirectBookingEnquiry;
