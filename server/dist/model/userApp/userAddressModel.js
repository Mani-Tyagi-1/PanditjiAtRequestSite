"use strict";
// src/model/userApp/userAddressModel.ts
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const AddressSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: false, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    addressName: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
}, { timestamps: true });
AddressSchema.index({ user: 1, addressName: 1 });
const UserAddressModel = connectDB_1.panditJiAtRequestMongooose.model("Address", AddressSchema);
exports.default = UserAddressModel;
