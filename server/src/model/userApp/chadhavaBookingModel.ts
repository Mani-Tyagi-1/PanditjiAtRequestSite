import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IChadhavaBooking {
  chadhavaSlug: string;
  deity: string;
  templeName: string;
  offeringId: string;
  offeringName: string;
  offeringPrice: number;
  // Upsells
  addPrasadBox: boolean;
  prasadBoxPrice: number;
  addSpiritualProduct: boolean;
  spiritualProductName: string;
  spiritualProductPrice: number;
  totalAmount: number;
  // Devotee
  devoteeName: string;
  gotra: string;
  phone: string;
  wish: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  isFromSite: boolean;
  addedOn: Date;
}

const chadhavaBookingSchema = new Schema<IChadhavaBooking>({
  chadhavaSlug: { type: String, required: true, trim: true },
  deity: { type: String, default: "" },
  templeName: { type: String, default: "" },
  offeringId: { type: String, default: "" },
  offeringName: { type: String, default: "" },
  offeringPrice: { type: Number, required: true },
  addPrasadBox: { type: Boolean, default: false },
  prasadBoxPrice: { type: Number, default: 0 },
  addSpiritualProduct: { type: Boolean, default: false },
  spiritualProductName: { type: String, default: "" },
  spiritualProductPrice: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  devoteeName: { type: String, required: true, trim: true },
  gotra: { type: String, default: "" },
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

const ChadhavaBooking: Model<IChadhavaBooking> =
  panditJiAtRequestMongooose.model<IChadhavaBooking>(
    "ChadhavaBooking",
    chadhavaBookingSchema,
    "chadhavaBookings"
  );

export default ChadhavaBooking;
