"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const CallInviteSchema = new mongoose_1.Schema({
    callId: { type: String, required: true, unique: true, index: true },
    fromUserId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    toUserId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    // ✅ NEW
    fromAppType: {
        type: String,
        enum: ["user", "pandit"],
        required: true,
        index: true,
    },
    toAppType: {
        type: String,
        enum: ["user", "pandit"],
        required: true,
        index: true,
    },
    callerName: { type: String, required: true },
    callerId: { type: String, required: true },
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, default: null },
    status: {
        type: String,
        enum: ["ringing", "call-ringing", "accepted", "rejected", "canceled", "missed"],
        default: "ringing",
        index: true,
    },
    callType: {
        type: String,
        enum: ["video", "audio"],
        default: "video",
    },
    expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });
CallInviteSchema.index({ toUserId: 1, status: 1, expiresAt: 1 });
exports.default = connectDB_1.panditJiAtRequestMongooose.model("CallInvite", CallInviteSchema);
