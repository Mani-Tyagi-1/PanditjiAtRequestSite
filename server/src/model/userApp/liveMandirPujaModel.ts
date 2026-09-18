import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface ILiveMandirPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  perks: string[];
  popular?: boolean;
}

export interface ILiveMandirPuja {
  slug: string;
  pujaName: string;
  pujaNameHindi: string;
  templeName: string;
  templeLocation: string;
  deity: string;
  image: string;
  status: "live" | "upcoming" | "daily";
  scheduledDate: string;
  scheduledTime: string;
  durationMins: number;
  price: number;
  originalPrice?: number;
  rating: number;
  devoteesJoined: number;
  benefits: string[];
  tags: string[];
  packages: ILiveMandirPackage[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const packageSchema = new Schema<ILiveMandirPackage>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    perks: { type: [String], default: [] },
    popular: { type: Boolean, default: false },
  },
  { _id: false }
);

const liveMandirPujaSchema = new Schema<ILiveMandirPuja>({
  slug: { type: String, required: true, unique: true, trim: true },
  pujaName: { type: String, required: true, trim: true },
  pujaNameHindi: { type: String, default: "" },
  templeName: { type: String, required: true, trim: true },
  templeLocation: { type: String, default: "" },
  deity: { type: String, default: "" },
  image: { type: String, default: "" },
  status: { type: String, enum: ["live", "upcoming", "daily"], default: "upcoming" },
  scheduledDate: { type: String, default: "" },
  scheduledTime: { type: String, default: "" },
  durationMins: { type: Number, default: 30 },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  rating: { type: Number, default: 5 },
  devoteesJoined: { type: Number, default: 0 },
  benefits: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  packages: { type: [packageSchema], default: [] },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const LiveMandirPuja: Model<ILiveMandirPuja> =
  panditJiAtRequestMongooose.model<ILiveMandirPuja>(
    "LiveMandirPuja",
    liveMandirPujaSchema,
    "liveMandirPujas"
  );

export default LiveMandirPuja;
