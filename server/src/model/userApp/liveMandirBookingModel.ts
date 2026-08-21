import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";
import {
  attributionField,
  IMarketingAttribution,
} from "../analytics/marketingAttribution.schema";

export interface ILiveMandirBooking {
  pujaSlug: string;
  pujaName: string;
  templeName: string;
  packageId: string;
  packageName: string;
  amount: number;
  devoteeName: string;
  /** Confirmation-email address. Optional in India, required abroad. */
  email?: string;
  gotra: string;
  members: string;
  phone: string;
  wish: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  isFromSite: boolean;
  addedOn: Date;
  userId?: any;
  normalBookingId?: string;
  /** Which campaign brought this devotee in. See the schema for the shape. */
  attribution?: IMarketingAttribution;
}

const liveMandirBookingSchema = new Schema<ILiveMandirBooking>({
  pujaSlug: { type: String, required: true, trim: true },
  pujaName: { type: String, default: "" },
  templeName: { type: String, default: "" },
  packageId: { type: String, default: "" },
  packageName: { type: String, default: "" },
  amount: { type: Number, required: true },
  devoteeName: { type: String, required: true, trim: true },
  // Confirmation-email address. Optional in India, required abroad — with no
  // international OTP it is the devotee's only record of the booking.
  email: { type: String, trim: true, lowercase: true },
  gotra: { type: String, default: "" },
  members: { type: String, default: "" },
  phone: { type: String, required: true, trim: true },
  wish: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  isFromSite: { type: Boolean, default: true },
  addedOn: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  normalBookingId: { type: String },

  attribution: attributionField,
});

const LiveMandirBooking: Model<ILiveMandirBooking> =
  panditJiAtRequestMongooose.model<ILiveMandirBooking>(
    "LiveMandirBooking",
    liveMandirBookingSchema,
    "liveMandirBookings"
  );

export default LiveMandirBooking;
