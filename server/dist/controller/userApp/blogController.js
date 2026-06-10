"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllBlogs = void 0;
const blogModel_1 = __importDefault(require("../../model/userApp/blogModel"));
// Get all active blogs
const fetchAllBlogs = async (req, res) => {
    try {
        const blogs = await blogModel_1.default.find({ isActive: true }).sort({ addedDate: -1 });
        return res.status(200).json({ success: true, data: blogs });
    }
    catch (error) {
        console.error("Error fetching blogs:", error);
        return res.status(500).json({ success: false, message: "Server error", error });
    }
};
exports.fetchAllBlogs = fetchAllBlogs;
