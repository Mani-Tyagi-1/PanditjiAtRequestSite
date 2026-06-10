"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB_1 = require("../../config/connectDB");
const PoojaSchema = new mongoose_1.default.Schema({
    poojaID: { type: String, required: true, unique: true },
    poojaNameEng: { type: String, required: true },
    poojaNameHindi: { type: String, required: true },
    poojaMode: {
        type: String,
        enum: ["online", "offline", "both"],
        required: true,
    },
    poojaPriceOnline: { type: Number },
    poojaPriceOffline: { type: Number },
    mainCategories: [
        {
            id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Category" },
            name: { type: String },
        },
    ],
    subCategories: [
        {
            id: { type: String },
            name: { type: String },
        },
    ],
    benefits: [{ type: String }],
    poojaGods: [{ type: String }],
    poojaCardImage: { type: String },
    poojaMainImage: [{ type: String }],
    poojaVideoLink: { type: String },
    poojaVideos: [{ type: String }],
    poojaDescriptionMain: { type: String },
    poojaSubDescription: { type: String },
    poojaBenefitsDescription: { type: String },
    poojaDescription: [
        {
            headingId: { type: String },
            heading: { type: String },
            description: { type: String },
        },
    ],
    tags: [{ type: String }],
    panditDakshina: { type: Number, default: 0 },
    samagriDetails: [{ type: mongoose_1.default.Schema.Types.Mixed }],
    samagriPrice: { type: Number, default: 0 },
    specialDate: { type: Date, default: null },
    faqs: [
        {
            question: { type: String },
            answer: { type: String },
        },
    ],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isExclusive: { type: Boolean, default: false },
    isUpcoming: { type: Boolean, default: false },
}, { timestamps: true });
// IMPORTANT: Use your custom connection instance.
exports.default = connectDB_1.panditJiAtRequestMongooose.model("Pooja", PoojaSchema);
