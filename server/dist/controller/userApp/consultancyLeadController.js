"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const consultancyLeadModel_1 = __importDefault(require("../../model/userApp/consultancyLeadModel"));
const createConsultancyLead = async (req, res) => {
    try {
        const { fullName, mobileNumber, helpWith, concern, poojaType, otherPoojaText, city, callbackTime, isFromSite } = req.body;
        if (!fullName || !mobileNumber || !concern || !city) {
            res.status(400).json({
                success: false,
                message: "fullName, mobileNumber, concern, and city are required",
            });
            return;
        }
        const lead = await consultancyLeadModel_1.default.create({
            fullName,
            mobileNumber,
            helpWith,
            concern,
            poojaType,
            otherPoojaText,
            city,
            callbackTime,
            isFromSite
        });
        res.status(201).json({
            success: true,
            message: "Consultancy lead created successfully",
            data: lead,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create consultancy lead",
        });
    }
};
exports.default = createConsultancyLead;
