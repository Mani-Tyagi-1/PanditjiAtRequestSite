import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IChadhavaSelection {
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IChadhavaBooking {
  chadhavaSlug: string;
  deity: string;
  templeName: string;
  selections: IChadhavaSelection[];
  // Prasad add-on
  addPrasadBox: boolean;
  prasadBoxPrice: number;
  // Totals
  itemsTotal: number;
  totalAmount: number;
  // Devotee
  devoteeName: string;
  gotra: string;
  phone: string;
  wish: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  // Payment (Razorpay)
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  isFromSite: boolean;
  addedOn: Date;
  familyMembers?: string[];
  deliveryAddress?: Record<string, any>;
}

const selectionSchema = new Schema<IChadhavaSelection>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const chadhavaBookingSchema = new Schema<IChadhavaBooking>({
  chadhavaSlug: { type: String, required: true, trim: true },
  deity: { type: String, default: "" },
  templeName: { type: String, default: "" },
  selections: { type: [selectionSchema], required: true },
  addPrasadBox: { type: Boolean, default: false },
  prasadBoxPrice: { type: Number, default: 0 },
  itemsTotal: { type: Number, required: true },
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
  familyMembers: { type: [String], default: [] },
  deliveryAddress: { type: Schema.Types.Mixed },
});

const ChadhavaBooking: Model<IChadhavaBooking> =
  panditJiAtRequestMongooose.model<IChadhavaBooking>(
    "ChadhavaBooking",
    chadhavaBookingSchema,
    "chadhavaBookings"
  );

export default ChadhavaBooking;
