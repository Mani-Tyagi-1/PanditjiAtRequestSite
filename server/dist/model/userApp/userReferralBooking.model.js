"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const vedicVaibhavDB_1 = require("../../config/vedicVaibhavDB");
const UserReferralBookingSchema = new mongoose_1.Schema({
    referrerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    referredUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    referredUserName: { type: String, required: true, trim: true },
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    poojaName: { type: String, required: true, trim: true },
    amountEarned: { type: Number, required: true },
    totalBookingAmount: { type: Number, required: true },
    rewardPercentage: { type: Number, required: true },
}, { timestamps: true });
// Fast lookup: all referral bookings for a given referrer, newest first
UserReferralBookingSchema.index({ referrerId: 1, createdAt: -1 });
const UserReferralBooking = vedicVaibhavDB_1.VedicVaibhavMongoose.model("UserReferralBooking", UserReferralBookingSchema, "userReferralBookings");
exports.default = UserReferralBooking;
