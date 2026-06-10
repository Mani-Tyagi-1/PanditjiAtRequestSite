"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB_1 = require("../../config/connectDB");
const WhatsappSessionSchema = new mongoose_1.Schema({
    phone: { type: String, required: true, unique: true },
    step: { type: String, default: 'START' },
    data: { type: Object, default: {} },
    lastMessage: { type: String, default: '' },
}, { timestamps: true });
exports.default = connectDB_1.panditJiAtRequestMongooose.model('WhatsappSession', WhatsappSessionSchema);
