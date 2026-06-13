import mongoose, { Schema, Document } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export interface ITestimonial extends Document {
  user_name: string;
  user_testimonial: string;
  rating: number;
  address: string;
  image: string;
  isActive: boolean;
  added_on: Date;
}

const TestimonialSchema: Schema = new Schema(
  {
    user_name: { type: String, required: true },
    user_testimonial: { type: String, required: true },
    rating: { type: Number, default: 5 },
    address: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    added_on: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default panditJiAtRequestMongooose.model<ITestimonial>("Testimonial", TestimonialSchema);
