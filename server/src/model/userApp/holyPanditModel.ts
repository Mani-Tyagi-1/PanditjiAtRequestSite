import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

export interface IPanditService {
  id: string;
  name: string;
  description: string;
  price: number;
  durationHours: number;
  popular?: boolean;
}

export interface IHolyPandit {
  slug: string;
  name: string;
  city: "Kashi" | "Vrindavan";
  image: string;
  experienceYears: number;
  rating: number;
  pujasPerformed: number;
  languages: string[];
  specializations: string[];
  startingPrice: number;
  verified: boolean;
  about: string;
  services: IPanditService[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const serviceSchema = new Schema<IPanditService>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    durationHours: { type: Number, default: 2 },
    popular: { type: Boolean, default: false },
  },
  { _id: false }
);

const holyPanditSchema = new Schema<IHolyPandit>({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  city: { type: String, enum: ["Kashi", "Vrindavan"], required: true },
  image: { type: String, default: "" },
  experienceYears: { type: Number, default: 0 },
  rating: { type: Number, default: 5 },
  pujasPerformed: { type: Number, default: 0 },
  languages: { type: [String], default: [] },
  specializations: { type: [String], default: [] },
  startingPrice: { type: Number, required: true },
  verified: { type: Boolean, default: true },
  about: { type: String, default: "" },
  services: { type: [serviceSchema], default: [] },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const HolyPandit: Model<IHolyPandit> =
  panditJiAtRequestMongooose.model<IHolyPandit>(
    "HolyPandit",
    holyPanditSchema,
    "holyPandits"
  );

export default HolyPandit;
