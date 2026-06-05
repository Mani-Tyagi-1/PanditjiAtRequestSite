import { Schema, Document } from 'mongoose';
import { panditJiAtRequestMongooose } from '../../../config/connectDB';

export interface IWhatsappSession extends Document {
  phone: string;
  step: string;
  data: Record<string, any>;
  lastMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsappSessionSchema = new Schema<IWhatsappSession>(
  {
    phone: { type: String, required: true, unique: true },
    step: { type: String, default: 'START' },
    data: { type: Object, default: {} },
    lastMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

export default panditJiAtRequestMongooose.model<IWhatsappSession>(
  'WhatsappSession',
  WhatsappSessionSchema
);