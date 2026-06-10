"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB"); // Using your custom connection
// Mongoose schema for the ServiceableCity
const ServiceableCitySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    pincodes: [{ type: String }],
    center: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
    bounds: {
        type: { type: String, enum: ['Polygon'], required: true },
        coordinates: { type: [[[Number]]], required: true },
    },
}, { timestamps: true });
// Index for efficient geospatial queries in your main app
ServiceableCitySchema.index({ bounds: '2dsphere' });
// Index to prevent adding the same city in the same state twice
ServiceableCitySchema.index({ name: 1, state: 1 }, { unique: true });
// Create and export the Mongoose model using your custom connection instance
const ServiceableCityModel = connectDB_1.panditJiAtRequestMongooose.model('ServiceableCity', ServiceableCitySchema);
exports.default = ServiceableCityModel;
