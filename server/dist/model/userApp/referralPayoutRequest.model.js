"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const vedicVaibhavDB_1 = require("../../config/vedicVaibhavDB");
const ReferralPayoutRequestSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    userName: { type: String, required: true, trim: true },
    userPhone: { type: String, required: true, trim: true },
    amountRequested: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Pending", "Paid", "Rejected"],
        default: "Pending",
    },
}, { timestamps: true });
const ReferralPayoutRequest = vedicVaibhavDB_1.VedicVaibhavMongoose.model("ReferralPayoutRequest", ReferralPayoutRequestSchema, "referralPayoutRequests");
exports.default = ReferralPayoutRequest;
