import { Schema, Document, Types } from 'mongoose';
import { panditJiAtRequestMongooose } from '../../../config/connectDB';

export interface IPendingPoojaBooking extends Document {
  userId: Types.ObjectId;
  userName: string;
  userPhone: string;
  userEmail?: string;

  // For offline puja
  address?: Record<string, any>;

  // Pooja
  poojaId: Types.ObjectId;
  poojaNameEng: string;
  poojaMode: 'online' | 'offline';
  poojaPrice: number;          // base price stored (derived if dakshina present)
  bookingDate: Date;

  // Online puja devotee fields
  bhaktName?: string;
  gotra?: string;
  contactNumber?: string;
  emailId?: string;

  // Payment / amounts
  amount: number;              // total amount for the booking (charged)
  panditDakshina?: number;     // optional: dakshina component of the total
  razorpayOrderId?: string;    // stored after order creation before user payment

  // Lifecycle
  isConfirmed: boolean;        // becomes true when a pandit accepts
  isPaymentDone: boolean;      // false initially, set to true in complete-booking
  isCompleted: boolean;
  isPoojaStarted: boolean;
  isPanditReached?: boolean | null;

  // Times
  poojaTotalTime?: number | null; // minutes
  poojaStartTime?: Date | null;
  poojaEndTime?: Date | null;

  // Progress (0..4)
  stage: number;               // 0=new, 1=journey_start, 2=arrived, 3=start_puja, 4=complete_puja
  journeyStartTime?: Date | null;
  arrivedAt?: Date | null;

  // Assignment
  assignedPandit: Types.ObjectId[];
}

const PendingPoojaBookingSchema = new Schema<IPendingPoojaBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String },

    address: { type: Object },

    poojaId: { type: Schema.Types.ObjectId, ref: 'Pooja', required: true },
    poojaNameEng: { type: String, required: true },
    poojaMode: { type: String, enum: ['online', 'offline'], required: true },
    poojaPrice: { type: Number, required: true },
    bookingDate: { type: Date, required: true },

    // Amounts
    amount: { type: Number, required: true },
    panditDakshina: { type: Number, default: undefined },

    // Razorpay
    razorpayOrderId: { type: String },

    // Online fields
    bhaktName: { type: String },
    gotra: { type: String },
    contactNumber: { type: String },
    emailId: { type: String },

    // Lifecycle
    isConfirmed: { type: Boolean, default: false },
    isPaymentDone: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isPoojaStarted: { type: Boolean, default: false },
    isPanditReached: { type: Boolean, default: null },

    // Times
    poojaTotalTime: { type: Number, default: null },
    poojaStartTime: { type: Date, default: null },
    poojaEndTime: { type: Date, default: null },

    // Progress
    stage: { type: Number, default: 0 },
    journeyStartTime: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },

    assignedPandit: [{ type: Schema.Types.ObjectId, ref: 'Pandit' }],
  },
  { timestamps: true },
);

// Virtual string id for cleaner client payloads
PendingPoojaBookingSchema.virtual('id').get(function (this: IPendingPoojaBooking) {
  return (this as any)._id.toHexString();
});
PendingPoojaBookingSchema.set('toJSON', { virtuals: true });
PendingPoojaBookingSchema.set('toObject', { virtuals: true });

// Helpful indexes
PendingPoojaBookingSchema.index({ bookingDate: 1 });
PendingPoojaBookingSchema.index({ assignedPandit: 1, bookingDate: 1 });

export default panditJiAtRequestMongooose.model<IPendingPoojaBooking>(
  'PendingPoojaBooking',
  PendingPoojaBookingSchema,
);
