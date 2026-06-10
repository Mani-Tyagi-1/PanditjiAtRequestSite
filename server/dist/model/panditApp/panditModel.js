"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByIdAndUpdate = findByIdAndUpdate;
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const PanditSchema = new mongoose_1.Schema({
    prefix: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    languages: [{ type: String, required: true }],
    experienceInYears: { type: Number, required: true },
    serviceModes: [{ type: String, required: true }],
    mobileType: { type: String },
    location: {
        latitude: Number,
        longitude: Number,
        address: String,
        city: String,
        state: String,
        country: String,
        pincode: String,
    },
    profileImage: { type: String, default: "" },
    degreeFile: { type: String, default: "" },
    aadharFile: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 }, // ⬅️ NEW: Default rating
    otp: String,
    otpExpiry: Date,
}, { timestamps: true });
exports.default = connectDB_1.panditJiAtRequestMongooose.model("Pandit", PanditSchema);
function findByIdAndUpdate(panditId, arg1) {
    throw new Error("Function not implemented.");
}
