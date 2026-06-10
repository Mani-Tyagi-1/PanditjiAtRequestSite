"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB_1 = require("../../config/connectDB");
const CategorySchema = new mongoose_1.default.Schema({
    category_id: { type: String, required: true, unique: true },
    category_name_en: { type: String, required: true },
    category_name_hin: { type: String, required: true },
    category_image: { type: String, default: "" },
    sub_categories: [{ type: String }],
}, { timestamps: true });
// IMPORTANT: use your custom connection instance
exports.default = connectDB_1.panditJiAtRequestMongooose.model("Category", CategorySchema);
