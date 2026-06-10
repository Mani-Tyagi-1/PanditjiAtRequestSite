"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const WhatsappBookingSchema = new mongoose_1.Schema({
    source: { type: String, default: 'whatsapp', immutable: true },
    phone: { type: String, required: true },
    name: { type: String, required: true },
    gotra: { type: String, default: '' },
    pujaName: { type: String, required: true },
    city: { type: String, required: true },
    preferredDate: { type: String, required: true },
    mode: { type: String, enum: ['Home', 'Temple', 'Online'], required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
    },
}, { timestamps: true });
WhatsappBookingSchema.index({ phone: 1 });
WhatsappBookingSchema.index({ status: 1 });
WhatsappBookingSchema.index({ createdAt: -1 });
exports.default = connectDB_1.panditJiAtRequestMongooose.model('WhatsappBooking', WhatsappBookingSchema);
