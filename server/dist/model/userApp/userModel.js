"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/model/Vedic-Vaibhav/userModel.ts (updated)
const mongoose_1 = require("mongoose");
const vedicVaibhavDB_1 = require("../../config/vedicVaibhavDB");
const AddressSchema = new mongoose_1.Schema({
    latitude: { type: Number, required: true, immutable: true },
    longitude: { type: Number, required: true, immutable: true },
    city: { type: String, required: true, trim: true, immutable: true },
    pincode: { type: String, required: true, trim: true, immutable: true },
    isPrimary: { type: Boolean, default: false, immutable: true },
    addedOn: { type: Date, default: Date.now, immutable: true },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: false, sparse: true },
    email_verified: { type: Boolean, default: false },
    family_name: { type: String },
    given_name: { type: String },
    name: { type: String, default: "Vedic Shop User" },
    // (kept) phone — added index: true (non-breaking addition)
    phone: { type: String, unique: true, sparse: true, index: true },
    gender: { type: String },
    picture: { type: String },
    addedOn: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    isFromApp: { type: Boolean, default: true },
    isNotifyOkay: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    // ✅ Added: schema fields
    addresses: { type: [AddressSchema], default: [] },
    dob: { type: String },
    birthTime: { type: String },
    birthPlace: { type: String },
    gotra: { type: String },
    // ✅ Referral source (external campaigns) — default organic, never overwrite a non-organic code
    referralSourcePJAR: { type: String, default: "organic" },
    // ✅ Internal referral fields
    userReferralCode: { type: String, unique: true, sparse: true },
    referralEarnings: { type: Number, default: 0 },
    totalReferredPujas: { type: Number, default: 0 },
    userReferral: {
        referrerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
        code: { type: String },
        appliedAt: { type: Date },
        expiresAt: { type: Date },
    },
    token: { type: String },
});
const User = vedicVaibhavDB_1.VedicVaibhavMongoose.model("User", userSchema, "users");
exports.default = User;
