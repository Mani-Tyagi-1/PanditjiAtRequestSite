import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export type ShopCategory =
  | "Rudraksha"
  | "Idols"
  | "Mala"
  | "Yantra"
  | "Puja Samagri"
  | "Books";

export interface IShopProduct {
  slug: string;
  name: string;
  category: ShopCategory;
  image: string;
  shortDesc: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  badge?: string;
  highlights: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const shopProductSchema = new Schema<IShopProduct>({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ["Rudraksha", "Idols", "Mala", "Yantra", "Puja Samagri", "Books"],
    required: true,
  },
  image: { type: String, default: "" },
  shortDesc: { type: String, default: "" },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  rating: { type: Number, default: 5 },
  reviews: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  badge: { type: String, default: "" },
  highlights: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const ShopProduct: Model<IShopProduct> =
  panditJiAtRequestMongooose.model<IShopProduct>(
    "ShopProduct",
    shopProductSchema,
    "shopProducts"
  );

export default ShopProduct;
