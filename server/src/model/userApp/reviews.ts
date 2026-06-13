import mongoose, { Schema, Document, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

/**
 * Review Document Interface
 */
export interface IReview extends Document {
  pooja_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  createdAt: Date;
  updatedAt: Date;
  pooja_booking_id:string;
}

/**
 * Review Schema
 */
const ReviewSchema: Schema<IReview> = new mongoose.Schema(
  {
    pooja_id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review_text: {
      type: String,
      required: true,
      trim: true,
    },
    pooja_booking_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent same user reviewing same pooja more than once
 */
ReviewSchema.index({ pooja_id: 1, user_id: 1 }, { unique: true });

/**
 * IMPORTANT: use your custom connection instance
 */
const ReviewModel: Model<IReview> =
  panditJiAtRequestMongooose.model<IReview>("Review", ReviewSchema);

export default ReviewModel;
