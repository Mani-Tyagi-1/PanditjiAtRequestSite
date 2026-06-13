import { Schema, Model, Types } from "mongoose";
import { VedicVaibhavMongoose } from "../../../config/vedicVaibhavDB";

/**
 * Tracks every puja booking that was triggered by an internal user referral.
 * One document per referred booking — stored in "userReferralBookings" collection.
 */
export interface IUserReferralBooking {
  _id: Types.ObjectId;

  /** The user who shared their referral code and earns the reward */
  referrerId: Types.ObjectId;

  /** The user who used the referral code and made the booking */
  referredUserId: Types.ObjectId;

  /** Name of the referred user (denormalised for fast reads) */
  referredUserName: string;

  /** The PoojaBooking _id */
  bookingId: Types.ObjectId;

  /** Puja name (denormalised) */
  poojaName: string;

  /** Reward amount credited to the referrer, e.g. 200 */
  amountEarned: number;

  /** Full booking amount, e.g. 4000 */
  totalBookingAmount: number;

  /** Reward percentage used, e.g. 5 */
  rewardPercentage: number;

  createdAt: Date;
  updatedAt: Date;
}

const UserReferralBookingSchema = new Schema<IUserReferralBooking>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredUserName: { type: String, required: true, trim: true },
    bookingId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    poojaName: { type: String, required: true, trim: true },
    amountEarned: { type: Number, required: true },
    totalBookingAmount: { type: Number, required: true },
    rewardPercentage: { type: Number, required: true },
  },
  { timestamps: true }
);

// Fast lookup: all referral bookings for a given referrer, newest first
UserReferralBookingSchema.index({ referrerId: 1, createdAt: -1 });

const UserReferralBooking: Model<IUserReferralBooking> =
  VedicVaibhavMongoose.model<IUserReferralBooking>(
    "UserReferralBooking",
    UserReferralBookingSchema,
    "userReferralBookings"
  );

export default UserReferralBooking;
