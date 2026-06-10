"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const DeviceTokenSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    // ✅ NEW: which app generated this token
    appType: {
        type: String,
        enum: ["user", "pandit"],
        required: true,
        index: true,
    },
    platform: {
        type: String,
        enum: ["android", "ios"],
        required: true,
        index: true,
    },
    deviceId: {
        type: String,
        required: true,
        trim: true,
    },
    fcmToken: {
        type: String,
        default: null,
        index: true,
    },
    voipToken: {
        type: String,
        default: null,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, { timestamps: true });
// ✅ Same user can have same deviceId in different apps (user/pandit)
// so include appType in unique key
DeviceTokenSchema.index({ userId: 1, deviceId: 1, appType: 1 }, { unique: true, name: "uniq_user_device_appType" });
exports.default = connectDB_1.panditJiAtRequestMongooose.model("DeviceToken", DeviceTokenSchema);
