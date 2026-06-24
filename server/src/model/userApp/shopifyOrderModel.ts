import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IShopifyOrderItem {
  shopifyProductId: string;
  variantId?: string;
  title: string;
  handle: string;
  price: number;
  qty: number;
  image?: string;
}

export interface IShopifyOrder {
  user?: Schema.Types.ObjectId;
  items: IShopifyOrderItem[];
  subtotal: number;
  discountAmount: number;
  giftWrap: boolean;
  giftWrapCharge: number;
  giftRecipientName?: string;
  giftMessage?: string;
  totalAmount: number;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  paymentStatus: "pending" | "paid" | "failed";
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  addedOn: Date;
}

const shopifyOrderItemSchema = new Schema<IShopifyOrderItem>(
  {
    shopifyProductId: { type: String, required: true },
    variantId: { type: String },
    title: { type: String, required: true },
    handle: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const shopifyOrderSchema = new Schema<IShopifyOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    items: { type: [shopifyOrderItemSchema], required: true },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    giftWrap: { type: Boolean, default: false },
    giftWrapCharge: { type: Number, default: 0 },
    giftRecipientName: { type: String, trim: true },
    giftMessage: { type: String, trim: true },
    totalAmount: { type: Number, required: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    addedOn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const ShopifyOrder: Model<IShopifyOrder> =
  panditJiAtRequestMongooose.model<IShopifyOrder>(
    "ShopifyOrder",
    shopifyOrderSchema,
    "shopifyOrders"
  );

export default ShopifyOrder;
