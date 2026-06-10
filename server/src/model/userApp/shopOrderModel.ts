import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IShopOrderItem {
  productSlug: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface IShopOrder {
  items: IShopOrderItem[];
  subtotal: number;
  shipping: number;
  totalAmount: number;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  isFromSite: boolean;
  addedOn: Date;
}

const orderItemSchema = new Schema<IShopOrderItem>(
  {
    productSlug: { type: String, required: true },
    name: { type: String, default: "" },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const shopOrderSchema = new Schema<IShopOrder>({
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  customerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  isFromSite: { type: Boolean, default: true },
  addedOn: { type: Date, default: Date.now },
});

const ShopOrder: Model<IShopOrder> = panditJiAtRequestMongooose.model<IShopOrder>(
  "ShopOrder",
  shopOrderSchema,
  "shopOrders"
);

export default ShopOrder;
