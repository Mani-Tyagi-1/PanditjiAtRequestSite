import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export interface IConsultancyLead {
  fullName: string;
  mobileNumber: string;
  helpWith: string;
  concern: string;
  poojaType: string;
  otherPoojaText?: string;
  city: string;
  callbackTime: string;
  isFromSite: boolean;
  addedOn: Date;
}

const consultancyLeadSchema = new Schema<IConsultancyLead>({
  fullName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  helpWith: { type: String, trim: true },
  concern: { type: String, required: true, trim: true },
  poojaType: { type: String, trim: true },
  otherPoojaText: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  callbackTime: { type: String, trim: true },
  isFromSite: { type: Boolean, default: false },
  addedOn: { type: Date, default: Date.now },
});

const ConsultancyLead: Model<IConsultancyLead> = panditJiAtRequestMongooose.model<IConsultancyLead>(
  "ConsultancyLead",
  consultancyLeadSchema,
  "consultancyLeads"
);

export default ConsultancyLead;
