import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface ILiveMandirBooking {
  pujaSlug: string;
  pujaName: string;
  templeName: string;
  packageId: string;
  packageName: string;
  amount: number;
  devoteeName: string;
  gotra: string;
  members: string;
  phone: string;
  wish: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  isFromSite: boolean;
  addedOn: Date;
}

const liveMandirBookingSchema = new Schema<ILiveMandirBooking>({
  pujaSlug: { type: String, required: true, trim: true },
  pujaName: { type: String, default: "" },
  templeName: { type: String, default: "" },
  packageId: { type: String, default: "" },
  packageName: { type: String, default: "" },
  amount: { type: Number, required: true },
  devoteeName: { type: String, required: true, trim: true },
  gotra: { type: String, default: "" },
  members: { type: String, default: "" },
  phone: { type: String, required: true, trim: true },
  wish: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  isFromSite: { type: Boolean, default: true },
  addedOn: { type: Date, default: Date.now },
});

const LiveMandirBooking: Model<ILiveMandirBooking> =
  panditJiAtRequestMongooose.model<ILiveMandirBooking>(
    "LiveMandirBooking",
    liveMandirBookingSchema,
    "liveMandirBookings"
  );

export default LiveMandirBooking;
