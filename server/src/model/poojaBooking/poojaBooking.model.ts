// poojaBooking.model.ts
import { Schema, Document, Types } from 'mongoose';
import { panditJiAtRequestMongooose } from '../../../config/connectDB';
import { IPendingPoojaBooking } from './pendingPoojaBooking.model'; // Use the interface for consistency

// Extends pending model but requires payment/order IDs and ensures confirmation
export interface IPoojaBooking extends Omit<IPendingPoojaBooking, 'razorpayOrderId' | 'isPaymentDone'> {
  _id: Types.ObjectId;
  callID: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  userAvailabilityVC: boolean;
  isReview: boolean;

  isPaymentDone: true;

  // ✅ NEW: live pandit location (ONLY lat/long)
  currentLat?: number | null;
  currentLong?: number | null;

  completionMedia?: Array<{
    url: string;
    key?: string;
    type: 'image' | 'video';
    mime?: string;
    size?: number;
    uploadedAt: Date;
  }>;
}

const PoojaBookingSchema = new Schema<IPoojaBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String },

    address: { type: Object },
    callID: { type: String, default: null, required: false },
    poojaId: { type: Schema.Types.ObjectId, ref: 'Pooja', required: true },
    poojaNameEng: { type: String, required: true },
    poojaMode: { type: String, enum: ['online', 'offline'], required: true },
    poojaPrice: { type: Number, required: true },
    bookingDate: { type: Date, required: true },
    userAvailabilityVC: { type: Boolean, default: true },

    amount: { type: Number, required: true },
    panditDakshina: { type: Number, default: undefined },

    bhaktName: { type: String },
    gotra: { type: String },
    contactNumber: { type: String },
    emailId: { type: String },

    razorpayPaymentId: { type: String, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpaySignature: { type: String, required: true },

    isConfirmed: { type: Boolean, default: false },
    isPaymentDone: { type: Boolean, default: true },
    isCompleted: { type: Boolean, default: false },
    isPoojaStarted: { type: Boolean, default: false },
    isReview: { type: Boolean, default: false },
    isPanditReached: { type: Boolean, default: null },

    poojaTotalTime: { type: Number, default: null },
    poojaStartTime: { type: Date, default: null },
    poojaEndTime: { type: Date, default: null },

    stage: { type: Number, default: 0 },
    journeyStartTime: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },

    assignedPandit: [{ type: Schema.Types.ObjectId, ref: 'Pandit' }],

    // ✅ NEW: live location fields
    currentLat: { type: Number, default: null },
    currentLong: { type: Number, default: null },

    completionMedia: [
      {
        url: { type: String, required: true },
        key: { type: String },
        type: { type: String, enum: ['image', 'video'], required: true },
        mime: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now, required: true },
      },
    ],
  },
  { timestamps: true },
);

// Virtual string id
PoojaBookingSchema.virtual('id').get(function (this: IPoojaBooking) {
  return (this as any)._id.toHexString();
});
PoojaBookingSchema.set('toJSON', { virtuals: true });
PoojaBookingSchema.set('toObject', { virtuals: true });

// Indexes
PoojaBookingSchema.index({ bookingDate: 1 });
PoojaBookingSchema.index({ assignedPandit: 1, bookingDate: 1 });
PoojaBookingSchema.index({ razorpayOrderId: 1 }, { unique: true });

export default panditJiAtRequestMongooose.model<IPoojaBooking>(
  'PoojaBooking',
  PoojaBookingSchema,
);
