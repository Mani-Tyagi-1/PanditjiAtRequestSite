"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const consultancyLeadSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    helpWith: { type: String, trim: true },
    concern: { type: String, trim: true },
    poojaType: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    callbackTime: { type: String, trim: true },
    timeSlot: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    isPaymentDone: { type: Boolean, default: false },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    addedOn: { type: Date, default: Date.now },
});
const ConsultancyLead = connectDB_1.panditJiAtRequestMongooose.model("ConsultancyLead", consultancyLeadSchema, "consultancyLeads");
exports.default = ConsultancyLead;
