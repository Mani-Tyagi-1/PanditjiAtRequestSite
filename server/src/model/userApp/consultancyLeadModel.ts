import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";
import {
  attributionField,
  IMarketingAttribution,
} from "../analytics/marketingAttribution.schema";

export interface IConsultancyLead {
  fullName: string;
  mobileNumber: string;
  /** Confirmation-email address. Optional in India, required abroad. */
  email?: string;
  helpWith: string;
  concern: string;
  poojaType: string;
  city: string;
  callbackTime: string;
  timeSlot: string;
  consultationType?: "voice" | "video";
  amount: number;
  isPaymentDone: boolean;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  addedOn: Date;
  /** Which campaign brought this devotee in. See the schema for the shape. */
  attribution?: IMarketingAttribution;
}

const consultancyLeadSchema = new Schema<IConsultancyLead>({
  fullName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  // Confirmation-email address. Optional in India, required abroad — with no
  // international OTP it is the devotee's only record of the booking.
  email: { type: String, trim: true, lowercase: true },
  helpWith: { type: String, trim: true },
  concern: { type: String, trim: true },
  poojaType: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  callbackTime: { type: String, trim: true },
  timeSlot: { type: String, trim: true },
  consultationType: { type: String, enum: ["voice", "video"], default: "voice", trim: true },
  amount: { type: Number, default: 0 },
  isPaymentDone: { type: Boolean, default: false },
  razorpayOrderId: { type: String, trim: true },
  razorpayPaymentId: { type: String, trim: true },
  razorpaySignature: { type: String, trim: true },
  addedOn: { type: Date, default: Date.now },

  attribution: attributionField,
});

const ConsultancyLead: Model<IConsultancyLead> = panditJiAtRequestMongooose.model<IConsultancyLead>(
  "ConsultancyLead",
  consultancyLeadSchema,
  "consultancyLeads"
);

export default ConsultancyLead;
