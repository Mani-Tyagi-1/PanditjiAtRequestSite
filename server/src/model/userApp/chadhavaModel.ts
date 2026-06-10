import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IChadhavaOffering {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  popular?: boolean;
}

export interface IAddOnProduct {
  id: string;
  name: string;
  tagline: string;
  image: string;
  price: number;
  originalPrice: number;
  items: string[];
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
  offerings: IChadhavaOffering[];
  spiritualProduct: IAddOnProduct;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const offeringSchema = new Schema<IChadhavaOffering>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    icon: { type: String, default: "🪔" },
    popular: { type: Boolean, default: false },
  },
  { _id: false }
);

const addOnProductSchema = new Schema<IAddOnProduct>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    items: { type: [String], default: [] },
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
  offerings: { type: [offeringSchema], default: [] },
  spiritualProduct: { type: addOnProductSchema, required: true },
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
