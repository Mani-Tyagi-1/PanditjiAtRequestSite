import { Schema, Document } from 'mongoose';
import { panditJiAtRequestMongooose } from '../../../config/connectDB';

export interface IWhatsappBooking extends Document {
  source: 'whatsapp';
  phone: string;
  name: string;
  gotra?: string;
  pujaName: string;
  city: string;
  preferredDate: string;
  mode: 'Home' | 'Temple' | 'Online';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const WhatsappBookingSchema = new Schema<IWhatsappBooking>(
  {
    source: { type: String, default: 'whatsapp', immutable: true },
    phone: { type: String, required: true },
    name: { type: String, required: true },
    gotra: { type: String, default: '' },
    pujaName: { type: String, required: true },
    city: { type: String, required: true },
    preferredDate: { type: String, required: true },
    mode: { type: String, enum: ['Home', 'Temple', 'Online'], required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

WhatsappBookingSchema.index({ phone: 1 });
WhatsappBookingSchema.index({ status: 1 });
WhatsappBookingSchema.index({ createdAt: -1 });

export default panditJiAtRequestMongooose.model<IWhatsappBooking>(
  'WhatsappBooking',
  WhatsappBookingSchema
);