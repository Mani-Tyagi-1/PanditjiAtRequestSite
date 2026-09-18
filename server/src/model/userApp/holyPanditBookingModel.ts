import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IHolyPanditBooking {
  panditSlug: string;
  panditName: string;
  panditCity: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  bhaktName: string;
  gotra: string;
  phone: string;
  ritualDate: string;
  address: string;
  city: string;
  wish: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  isFromSite: boolean;
  addedOn: Date;
}

const holyPanditBookingSchema = new Schema<IHolyPanditBooking>({
  panditSlug: { type: String, required: true, trim: true },
  panditName: { type: String, default: "" },
  panditCity: { type: String, default: "" },
  serviceId: { type: String, default: "" },
  serviceName: { type: String, default: "" },
  amount: { type: Number, required: true },
  bhaktName: { type: String, required: true, trim: true },
  gotra: { type: String, default: "" },
  phone: { type: String, required: true, trim: true },
  ritualDate: { type: String, default: "" },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  wish: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  isFromSite: { type: Boolean, default: true },
  addedOn: { type: Date, default: Date.now },
});

const HolyPanditBooking: Model<IHolyPanditBooking> =
  panditJiAtRequestMongooose.model<IHolyPanditBooking>(
    "HolyPanditBooking",
    holyPanditBookingSchema,
    "holyPanditBookings"
  );

export default HolyPanditBooking;
