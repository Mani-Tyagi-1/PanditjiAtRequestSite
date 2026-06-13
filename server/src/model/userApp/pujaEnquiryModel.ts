import { Schema, Model, Types } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export interface IPujaEnquiry {
  fullName: string;
  phone: string;
  astrologerAdvised: "yes" | "no";
  timing: "Immediately" | "Within 7 Days" | "Just Enquiring";
  city: string;
  pujaId: Types.ObjectId;
  pujaName: string;
  isFromSite: boolean;
  addedOn: Date;
}

const pujaEnquirySchema = new Schema<IPujaEnquiry>({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  astrologerAdvised: { type: String, enum: ["yes", "no"], required: true },
  timing: {
    type: String,
    enum: ["Immediately", "Within 7 Days", "Just Enquiring"],
    required: true,
  },
  city: { type: String, required: true, trim: true },
  pujaId: { type: Schema.Types.ObjectId, required: true, ref: "Pooja" },
  pujaName: { type: String, trim: true },
  isFromSite: { type: Boolean, default: false },
  addedOn: { type: Date, default: Date.now },
});

const PujaEnquiry: Model<IPujaEnquiry> =
  panditJiAtRequestMongooose.model<IPujaEnquiry>(
    "PujaEnquiry",
    pujaEnquirySchema,
    "pujaEnquiries"
  );

export default PujaEnquiry;
