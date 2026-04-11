import mongoose from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

const PoojaSchema = new mongoose.Schema(
  {
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
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
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
    poojaMainImage: { type: String },
    poojaVideoLink: { type: String },
    poojaDescriptionMain: { type: String },
    poojaSubDescription: { type: String },
    poojaBenefitsDescription: { type: String }, 
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isExclusive: { type: Boolean, default: false },
    isUpcoming: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// IMPORTANT: Use your custom connection instance.
export default panditJiAtRequestMongooose.model("Pooja", PoojaSchema);
