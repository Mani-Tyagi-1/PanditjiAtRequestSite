"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/model/panditApp/poojaBooking.model.ts
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const PoojaBookingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String },
    address: { type: Object },
    callID: { type: String, default: null, required: false },
    poojaId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Pooja', required: true },
    poojaNameEng: { type: String, required: true },
    poojaMode: { type: String, enum: ['online', 'offline'], required: true },
    poojaPrice: { type: Number, required: true },
    bookingDate: { type: Date, required: true },
    userAvailabilityVC: { type: Boolean, default: true },
    amount: { type: Number, required: true },
    panditDakshina: { type: Number, default: undefined },
    couponCode: { type: String, trim: true },
    bhaktName: { type: String },
    gotra: { type: String },
    contactNumber: { type: String },
    emailId: { type: String },
    razorpayPaymentId: { type: String, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpaySignature: { type: String, required: true },
    isConfirmed: { type: Boolean, default: false },
    isPaymentDone: { type: Boolean, default: true },
    isCompleted: { type: Boolean, default: false },
    isPoojaStarted: { type: Boolean, default: false },
    isReview: { type: Boolean, default: false },
    isPanditReached: { type: Boolean, default: null },
    poojaTotalTime: { type: Number, default: null },
    poojaStartTime: { type: Date, default: null },
    poojaEndTime: { type: Date, default: null },
    stage: { type: Number, default: 0 },
    journeyStartTime: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    assignedPandit: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Pandit' }],
    // ✅ NEW: live location fields
    currentLat: { type: Number, default: null },
    currentLong: { type: Number, default: null },
    completionMedia: [
        {
            url: { type: String, required: true },
            key: { type: String },
            type: { type: String, enum: ['image', 'video'], required: true },
            mime: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now, required: true },
        },
    ],
    isFromApp: { type: Boolean, default: false },
    deceasedPersons: [
        {
            name: { type: String, trim: true },
            gotra: { type: String, trim: true },
            relation: { type: String, trim: true },
        },
    ],
    ritualPerformerName: { type: String, trim: true },
    ritualPerformerGotra: { type: String, trim: true },
    ritualPlace: { type: String, trim: true },
    // geospatial location field (offline bookings only)
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [lng, lat]
    },
}, { timestamps: true });
// Virtual id
PoojaBookingSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
PoojaBookingSchema.set('toJSON', { virtuals: true });
PoojaBookingSchema.set('toObject', { virtuals: true });
// Indexes
PoojaBookingSchema.index({ bookingDate: 1 });
PoojaBookingSchema.index({ assignedPandit: 1, bookingDate: 1 });
PoojaBookingSchema.index({ razorpayOrderId: 1 }, { unique: true });
PoojaBookingSchema.index({ location: '2dsphere' }, { sparse: true });
exports.default = connectDB_1.panditJiAtRequestMongooose.model('PoojaBooking', PoojaBookingSchema);
