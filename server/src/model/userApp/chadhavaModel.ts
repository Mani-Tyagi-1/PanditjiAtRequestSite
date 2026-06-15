import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IChadhavaItem {
  code: string;
  itemName: string;
  itemDesc: string;
  itemImage: string;
  itemPrice: number;
  maxQuantity: number;
  popular?: boolean;
  isActive: boolean;
}

export interface IChadhavaSection {
  sectionName: string;
  items: IChadhavaItem[];
}

export interface IChadhavaPrasad {
  enabled: boolean;
  price: number;
  name: string;
  desc: string;
  image: string;
}

export interface IChadhava {
  slug: string;
  deity: string;
  deityHindi: string;
  templeName: string;
  templeLocation: string;
  image: string;
  offeringDay: string;
  startingPrice: number;
  originalPrice?: number;
  rating: number;
  devoteesOffered: number;
  benefits: string[];
  tags: string[];
  sections: IChadhavaSection[];
  prasad: IChadhavaPrasad;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const itemSchema = new Schema<IChadhavaItem>(
  {
    code: { type: String, required: true },
    itemName: { type: String, required: true },
    itemDesc: { type: String, default: "" },
    itemImage: { type: String, default: "" },
    itemPrice: { type: Number, required: true, min: 0 },
    maxQuantity: { type: Number, default: 10 },
    popular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const sectionSchema = new Schema<IChadhavaSection>(
  {
    sectionName: { type: String, required: true },
    items: { type: [itemSchema], default: [] },
  },
  { _id: false }
);

const prasadSchema = new Schema<IChadhavaPrasad>(
  {
    enabled: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    name: { type: String, default: "Blessed Prasad Box" },
    desc: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const chadhavaSchema = new Schema<IChadhava>({
  slug: { type: String, required: true, unique: true, trim: true },
  deity: { type: String, required: true, trim: true },
  deityHindi: { type: String, default: "" },
  templeName: { type: String, required: true, trim: true },
  templeLocation: { type: String, default: "" },
  image: { type: String, default: "" },
  offeringDay: { type: String, default: "" },
  startingPrice: { type: Number, required: true },
  originalPrice: { type: Number },
  rating: { type: Number, default: 5 },
  devoteesOffered: { type: Number, default: 0 },
  benefits: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  sections: { type: [sectionSchema], default: [] },
  prasad: { type: prasadSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Chadhava: Model<IChadhava> = panditJiAtRequestMongooose.model<IChadhava>(
  "Chadhava",
  chadhavaSchema,
  "chadhavas"
);

export default Chadhava;
