"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const pujaEnquirySchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    astrologerAdvised: { type: String, enum: ["yes", "no"], required: true },
    timing: {
        type: String,
        enum: ["Immediately", "Within 7 Days", "Just Enquiring"],
        required: true,
    },
    city: { type: String, required: true, trim: true },
    pujaId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "Pooja" },
    pujaName: { type: String, trim: true },
    isFromSite: { type: Boolean, default: false },
    addedOn: { type: Date, default: Date.now },
});
const PujaEnquiry = connectDB_1.panditJiAtRequestMongooose.model("PujaEnquiry", pujaEnquirySchema, "pujaEnquiries");
exports.default = PujaEnquiry;
