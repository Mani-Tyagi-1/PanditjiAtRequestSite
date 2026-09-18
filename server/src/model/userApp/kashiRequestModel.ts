import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IKashiRequest {
  devoteeName: string;
  mobileNumber: string;
  email?: string;
  ritualDetails: string;
  status: "submitted" | "contacted" | "completed" | "cancelled";
  isFromSite: boolean;
  addedOn: Date;
}

const kashiRequestSchema = new Schema<IKashiRequest>({
  devoteeName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  email: { type: String, trim: true, default: "" },
  ritualDetails: { type: String, trim: true, default: "" },
  status: {
    type: String,
    enum: ["submitted", "contacted", "completed", "cancelled"],
    default: "submitted",
  },
  isFromSite: { type: Boolean, default: true },
  addedOn: { type: Date, default: Date.now },
});

const KashiRequest: Model<IKashiRequest> =
  panditJiAtRequestMongooose.model<IKashiRequest>(
    "KashiRequest",
    kashiRequestSchema,
    "kashiRequests"
  );

export default KashiRequest;
