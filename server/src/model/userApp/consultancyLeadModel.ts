import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export interface IConsultancyLead {
  fullName: string;
  mobileNumber: string;
  helpWith: string;
  concern: string;
  poojaType: string;
  city: string;
  callbackTime: string;
  timeSlot: string;
  amount: number;
  isPaymentDone: boolean;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  addedOn: Date;
}

const consultancyLeadSchema = new Schema<IConsultancyLead>({
  fullName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  helpWith: { type: String, trim: true },
  concern: { type: String, trim: true },
  poojaType: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  callbackTime: { type: String, trim: true },
  timeSlot: { type: String, trim: true },
  amount: { type: Number, default: 0 },
  isPaymentDone: { type: Boolean, default: false },
  razorpayOrderId: { type: String, trim: true },
  razorpayPaymentId: { type: String, trim: true },
  razorpaySignature: { type: String, trim: true },
  addedOn: { type: Date, default: Date.now },
});

const ConsultancyLead: Model<IConsultancyLead> = panditJiAtRequestMongooose.model<IConsultancyLead>(
  "ConsultancyLead",
  consultancyLeadSchema,
  "consultancyLeads"
);

export default ConsultancyLead;
