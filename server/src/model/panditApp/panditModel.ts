import { Schema, Document } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

/** Mongo document interface */
export interface IPandit extends Document {
  prefix: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  dob: string;                  // "DD/MM/YYYY"
  mobile: string;               // unique phone number
  email: string;
  languages: string[];
  experienceInYears: number;
  serviceModes: string[];
  mobileType?: string;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  profileImage?: string;
  degreeFile?: string;
  aadharFile?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number; // ⬅️ NEW: Rating for pandit ji

  otp?: string;
  otpExpiry?: Date;
}

const PanditSchema = new Schema<IPandit>(
  {
    prefix: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    languages: [{ type: String, required: true }],
    experienceInYears: { type: Number, required: true },
    serviceModes: [{ type: String, required: true }],
    mobileType: { type: String },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    profileImage: { type: String, default: "" },
    degreeFile: { type: String, default: "" },
    aadharFile: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 }, // ⬅️ NEW: Default rating

    otp: String,
    otpExpiry: Date,
  },
  { timestamps: true }
);

export default panditJiAtRequestMongooose.model<IPandit>(
  "Pandit",
  PanditSchema
);
