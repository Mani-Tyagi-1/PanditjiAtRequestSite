import { Schema, model, Document } from "mongoose";

interface IPandit extends Document {
  prefix: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  languages: string[];
  introduction: string;
  skills: string[];
  systemKnown: string[];
  selectedSystemKnown: string;
  pujaCategory: string[];
  pujaGods: string[];
  astroCategory: string[];
  experience: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  country: string;
  profileImage: string;
  degreeCard: string;
  aadharCard: string;
  panCard: string;
  isVerified: boolean;
  otp: string; // OTP for verification
  otpExpiry: Date; // OTP expiry time
}

const PanditSchema = new Schema<IPandit>(
  {
    prefix: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    languages: { type: [String], required: true },
    introduction: { type: String, required: true },
    skills: { type: [String], required: true },
    systemKnown: { type: [String], required: true },
    selectedSystemKnown: { type: String, default: "" },
    pujaCategory: { type: [String], required: true },
    pujaGods: { type: [String], required: true },
    astroCategory: { type: [String], default: [] },
    experience: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    profileImage: { type: String, required: true },
    degreeCard: { type: String, required: true },
    aadharCard: { type: String, required: true },
    panCard: { type: String, required: true },
    isVerified: { type: Boolean, required: true },
    otp: { type: String }, // Store OTP for verification
    otpExpiry: { type: Date }, // Store OTP expiry time
  },
  {
    timestamps: true,
  }
);

const Pandit = model<IPandit>("Pandit", PanditSchema);
export default Pandit;
