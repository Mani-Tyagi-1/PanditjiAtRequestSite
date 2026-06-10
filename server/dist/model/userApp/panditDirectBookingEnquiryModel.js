"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const panditDirectBookingEnquirySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    panditId: { type: String, required: true, trim: true },
    panditName: { type: String, default: "" },
    userId: { type: String, required: false },
    status: { type: String, default: "Pending" },
}, { timestamps: true });
exports.default = connectDB_1.panditJiAtRequestMongooose.model("PanditDirectBookingEnquiry", panditDirectBookingEnquirySchema);
