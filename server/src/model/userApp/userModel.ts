// src/model/Vedic-Vaibhav/userModel.ts (updated)
import { Schema, Model, Types } from "mongoose";
import { VedicVaibhavMongoose } from "../../../config/vedicVaibhavDB";

// ✅ Added: Address interface + schema
export interface IAddress {
  latitude: number;
  longitude: number;
  city: string;
  pincode: string;
  isPrimary: boolean;
  addedOn: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    latitude: { type: Number, required: true, immutable: true },
    longitude: { type: Number, required: true, immutable: true },
    city: { type: String, required: true, trim: true, immutable: true },
    pincode: { type: String, required: true, trim: true, immutable: true },
    isPrimary: { type: Boolean, default: false, immutable: true },
    addedOn: { type: Date, default: Date.now, immutable: true },
  },
  { _id: false }
);

export interface IUser {
  _id: Types.ObjectId;          // (kept) your original _id field
  email: string;                // (kept)
  email_verified: boolean;      // (kept)
  family_name: string;          // (kept)
  given_name: string;           // (kept)
  name: string;                 // (kept)
  phone: string;                // (kept)
  gender: string;               // (kept)
  picture: string;              // (kept)
  addedOn: Date;                // (kept)
  isActive: boolean;            // (kept)
  isFromApp: boolean;           // (kept)
  isNotifyOkay: boolean;        // (kept)
  otp?: string;                 // (kept)
  otpExpiry?: Date;             // (kept)

  // ✅ Added:
  addresses: IAddress[];
  dob: string;
  birthTime?: string;
  birthPlace?: string;
  gotra?: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: false, sparse: true },
  email_verified: { type: Boolean, default: false },
  family_name: { type: String },
  given_name: { type: String },
  name: { type: String, default: "Vedic Shop User" },
  // (kept) phone — added index: true (non-breaking addition)
  phone: { type: String, unique: true, sparse: true, index: true },
  gender: { type: String },
  picture: { type: String },
  addedOn: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isFromApp: { type: Boolean, default: true },
  isNotifyOkay: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },

  // ✅ Added: schema fields
  addresses: { type: [AddressSchema], default: [] },
  dob: { type: String },
  birthTime: { type: String },
  birthPlace: { type: String },
  gotra: { type: String },
});

const User: Model<IUser> = VedicVaibhavMongoose.model<IUser>(
  "User",
  userSchema,
  "users"
);
export default User;
