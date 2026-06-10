"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB_1 = require("../../config/connectDB");
const BlogSchema = new mongoose_1.default.Schema({
    blogID: { type: String, required: true, unique: true },
    blogName: { type: String, required: true },
    blogDescription: { type: String, required: true },
    blogImages: [{ type: String }],
    authorName: { type: String },
    addedDate: { type: Date, default: Date.now },
    tags: [{ type: String }],
    pooja: {
        id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Pooja" },
        name: { type: String },
        link: { type: String },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = connectDB_1.panditJiAtRequestMongooose.model("Blog", BlogSchema);
