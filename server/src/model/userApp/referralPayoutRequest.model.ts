import { Schema, Model, Types } from "mongoose";
import { VedicVaibhavMongoose } from "../../../config/vedicVaibhavDB";

export interface IReferralPayoutRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userPhone: string;
  amountRequested: number;
  status: "Pending" | "Paid" | "Rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ReferralPayoutRequestSchema = new Schema<IReferralPayoutRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true, trim: true },
    userPhone: { type: String, required: true, trim: true },
    amountRequested: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const ReferralPayoutRequest: Model<IReferralPayoutRequest> =
  VedicVaibhavMongoose.model<IReferralPayoutRequest>(
    "ReferralPayoutRequest",
    ReferralPayoutRequestSchema,
    "referralPayoutRequests"
  );

export default ReferralPayoutRequest;
