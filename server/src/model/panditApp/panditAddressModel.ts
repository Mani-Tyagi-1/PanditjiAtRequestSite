// src/model/panditApp/panditAddressModel.ts
import { Schema, Document, Types } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";
import PanditModel, { IPandit } from "./panditModel"; 

/** Mongo document interface for Pandit addresses */
export interface IPanditAddress extends Document {
  pandit: Types.ObjectId;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country?: string;
  latitude: number;
  longitude: number;
  addressName?: string; 
  pincode: string;
  isPrimary: boolean;
}

const PanditAddressSchema = new Schema<IPanditAddress>(
  {
    pandit:       { type: Schema.Types.ObjectId, ref: "Pandit", required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city:         { type: String, required: true },
    state:        { type: String, required: true },
    country:      { type: String },
    latitude:     { type: Number, required: true },
    longitude:    { type: Number, required: true },
    addressName:  { type: String },
    pincode:      { type: String, required: true },
    isPrimary:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Enforce one primary-per-pandit at the database level
PanditAddressSchema.index(
  { pandit: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

// Register the model first
const PanditAddress = panditJiAtRequestMongooose.model<IPanditAddress>(
  "PanditAddress",
  PanditAddressSchema
);

// Now install the post-save hook on the Pandit schema
PanditModel.schema.post<IPandit>("save", async function (doc) {
  try {
    // If the pandit already has any addresses, do nothing
    const existing = await PanditAddress.countDocuments({ pandit: doc._id });
    if (existing > 0) return;

    // If the Pandit has a location object with the required fields, seed it
    const loc = doc.location || {};
    if (
      typeof loc.address !== "string" ||
      loc.latitude === undefined ||
      loc.longitude === undefined
    ) {
      return;
    }

    await PanditAddress.create({
      pandit:      doc._id,
      addressLine1: loc.address,
      city:         loc.city     ?? "",
      state:        loc.state    ?? "",
      country:      loc.country  ?? "",
      latitude:     loc.latitude,
      longitude:    loc.longitude,
      pincode:      loc.pincode  ?? "",
      addressName:  "Primary",
      isPrimary:    true,
    });
  } catch (err) {
    console.error("Error seeding PanditAddress:", err);
  }
});

export default PanditAddress;
