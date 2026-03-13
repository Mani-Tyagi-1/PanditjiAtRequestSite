import { Schema, Types } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export type CallStatus =
  | "ringing"
  | "call-ringing"
  | "accepted"
  | "rejected"
  | "canceled"
  | "missed";

export type CallPartyAppType = "user" | "pandit";

export interface ICallInvite {
  _id: Types.ObjectId;

  callId: string;

  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;

  // ✅ NEW: Needed for correct Firebase project routing
  fromAppType: CallPartyAppType;
  toAppType: CallPartyAppType;

  callerName: string;
  callerId: string;

  bookingId?: Types.ObjectId | null;

  status: CallStatus;
  callType: "video" | "audio";
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const CallInviteSchema = new Schema<ICallInvite>(
  {
    callId: { type: String, required: true, unique: true, index: true },

    fromUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, required: true, index: true },

    // ✅ NEW
    fromAppType: {
      type: String,
      enum: ["user", "pandit"],
      required: true,
      index: true,
    },
    toAppType: {
      type: String,
      enum: ["user", "pandit"],
      required: true,
      index: true,
    },

    callerName: { type: String, required: true },
    callerId: { type: String, required: true },

    bookingId: { type: Schema.Types.ObjectId, default: null },

    status: {
      type: String,
      enum: ["ringing", "call-ringing", "accepted", "rejected", "canceled", "missed"],
      default: "ringing",
      index: true,
    },

    callType: {
      type: String,
      enum: ["video", "audio"],
      default: "video",
    },

    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

CallInviteSchema.index({ toUserId: 1, status: 1, expiresAt: 1 });

export default panditJiAtRequestMongooose.model<ICallInvite>(
  "CallInvite",
  CallInviteSchema
);