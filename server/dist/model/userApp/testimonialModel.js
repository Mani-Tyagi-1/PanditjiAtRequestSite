"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const TestimonialSchema = new mongoose_1.Schema({
    user_name: { type: String, required: true },
    user_testimonial: { type: String, required: true },
    rating: { type: Number, default: 5 },
    address: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    added_on: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = connectDB_1.panditJiAtRequestMongooose.model("Testimonial", TestimonialSchema);
