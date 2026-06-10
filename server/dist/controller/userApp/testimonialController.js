"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllTestimonials = void 0;
const testimonialModel_1 = __importDefault(require("../../model/userApp/testimonialModel"));
const fetchAllTestimonials = async (req, res) => {
    try {
        const testimonials = await testimonialModel_1.default.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: testimonials,
        });
    }
    catch (error) {
        console.error("Error fetching testimonials:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.fetchAllTestimonials = fetchAllTestimonials;
