// src/model/panditApp/poojaBooking.model.ts
import { Schema, Document, Types } from 'mongoose';
import { panditJiAtRequestMongooose } from '../../config/connectDB';
import { IPendingPoojaBooking } from './pendingPoojaBooking.model';

// Extends pending model but requires payment/order IDs
export interface IPoojaBooking
  extends Omit<IPendingPoojaBooking, 'razorpayOrderId' | 'isPaymentDone'> {
  _id: Types.ObjectId;
  callID : string;
  // Optional on an advance booking until the balance settles — the app server
  // uses the same conditional rule, and both write this one collection.
  razorpayPaymentId?: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  userAvailabilityVC: boolean;

  isPaymentDone: boolean;

  /**
   * How the devotee chose to pay at checkout.
   *   "full"    -> whole amount captured before the puja.
   *   "advance" -> ADVANCE_PERCENT captured before, balance collected after.
   * `paymentTiming` is the internal "is money still owed afterwards?" axis that
   * the pandit app's QR collection keys on.
   */
  paymentTiming?: 'prepaid' | 'postpaid';
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'failed';
  paidAt?: Date | null;
  paymentOption?: 'full' | 'advance';
  advancePercent?: number;
  advanceAmount?: number;
  /** Rupees actually captured so far. Balance due = amount - amountPaid. */
  amountPaid?: number;
  /** razorpayOrderId is unique and holds the FIRST leg; the balance needs its own. */
  balanceRazorpayOrderId?: string;
  balancePaymentId?: string;
  balancePaidAt?: Date | null;
  /** Claimed once, atomically, the first time money is captured. */
  settlementRunAt?: Date | null;

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

  // ✅ NEW: geospatial location
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

const PoojaBookingSchema = new Schema<IPoojaBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String },

    address: { type: Object },
    callID : {type : String  ,  default: null ,required : false},
    poojaId: { type: Schema.Types.ObjectId, ref: 'Pooja', required: true },
    poojaNameEng: { type: String, required: true },
    poojaMode: { type: String, enum: ['online', 'offline'], required: true },
    poojaType: { type: String, default: 'normal_pooja' },
    poojaPrice: { type: Number, required: true },
    bookingDate: { type: Date, required: true },
    userAvailabilityVC: { type: Boolean, default: true },

    // `amount` is INR; the currency fields carry over from the pending row and
    // record what a foreign card was actually billed. See the pending model.
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    chargedAmount: { type: Number },
    fxRate: { type: Number },
    country: { type: String },
    countryCode: { type: String, index: true },
    priceMultiplier: { type: Number },
    panditDakshina: { type: Number, default: undefined },
    couponCode: { type: String, trim: true },

    bhaktName: { type: String },
    gotra: { type: String },
    contactNumber: { type: String },
    emailId: { type: String },

    // Required only when the whole amount was taken up front. An advance
    // booking has a real payment id too, but a legacy pay-after row created by
    // the app server does not — and both servers share this collection.
    razorpayPaymentId: {
      type: String,
      required: function (this: any) { return this.paymentTiming !== 'postpaid'; },
    },
    razorpayOrderId: { type: String, required: true },
    razorpaySignature: {
      type: String,
      required: function (this: any) { return this.paymentTiming !== 'postpaid'; },
    },

    paymentTiming: { type: String, enum: ['prepaid', 'postpaid'], default: 'prepaid' },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'failed'], default: 'paid' },
    paidAt: { type: Date, default: null },
    paymentOption: { type: String, enum: ['full', 'advance'], default: 'full' },
    advancePercent: { type: Number },
    advanceAmount: { type: Number },
    amountPaid: { type: Number, default: 0 },
    balanceRazorpayOrderId: { type: String },
    balancePaymentId: { type: String },
    balancePaidAt: { type: Date, default: null },
    // Claimed once so a referral reward is never paid twice on a booking that
    // settles in two legs.
    settlementRunAt: { type: Date, default: null },

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
    isFromApp: { type: Boolean, default: false },

    deceasedPersons: [
      {
        name: { type: String, trim: true },
        gotra: { type: String, trim: true },
        relation: { type: String, trim: true },
      },
    ],
    ritualPerformerName: { type: String, trim: true },
    ritualPerformerGotra: { type: String, trim: true },
    ritualPlace: { type: String, trim: true },

    // geospatial location field (offline bookings only)
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }, // [lng, lat]
    },

    pujaSlug: { type: String, trim: true },
    templeName: { type: String, trim: true },
    packageId: { type: String, trim: true },
    packageName: { type: String, trim: true },
    packageIncluded: { type: Boolean, default: false },
    packageDetails: { type: Schema.Types.Mixed, default: undefined },
    members: { type: String, trim: true },
    wish: { type: String, trim: true },
    isLiveMandir: { type: Boolean, default: false },
    concern: { type: String, trim: true },
    familyMembers: { type: Array, default: undefined },
    prasadAdded: { type: Boolean, default: undefined },

    // Opt OUT of the Meta CAPI Purchase event for this booking. Carried over
    // from the pending row, which carries it from the create-pending request.
    // Defaults false, so a booking that never asked for it reports exactly as
    // it always has — see the note on `skipMetaCapi` in
    // controller/poojaBooking/poojaBookingController.ts.
    skipMetaCapi: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Virtual id
PoojaBookingSchema.virtual('id').get(function (this: IPoojaBooking) {
  return (this as any)._id.toHexString();
});
PoojaBookingSchema.set('toJSON', { virtuals: true });
PoojaBookingSchema.set('toObject', { virtuals: true });

// Indexes
PoojaBookingSchema.index({ bookingDate: 1 });
PoojaBookingSchema.index({ userPhone: 1, bookingDate: -1 });
PoojaBookingSchema.index({ userId: 1, bookingDate: -1 });
PoojaBookingSchema.index({ poojaType: 1, userPhone: 1, bookingDate: -1 });
PoojaBookingSchema.index({ assignedPandit: 1, bookingDate: 1 });
PoojaBookingSchema.index({ razorpayOrderId: 1 }, { unique: true });
PoojaBookingSchema.index({ location: '2dsphere' }, { sparse: true });
// Admin: at-home pujas awaiting balance / awaiting a pandit.
PoojaBookingSchema.index({ paymentOption: 1, isPaymentDone: 1, createdAt: -1 });
PoojaBookingSchema.index({ balanceRazorpayOrderId: 1 }, { sparse: true });

export default panditJiAtRequestMongooose.model<IPoojaBooking>(
  'PoojaBooking',
  PoojaBookingSchema,
);
