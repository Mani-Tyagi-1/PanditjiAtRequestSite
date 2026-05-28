import { Document, Schema } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export interface IPanditDirectBookingEnquiry extends Document {
  name: string;
  phone: string;
  panditId: string;
  panditName: string;
  userId?: string;
  status: string;
}

const panditDirectBookingEnquirySchema = new Schema<IPanditDirectBookingEnquiry>(
  {
    name:      { type: String, required: true, trim: true },
    phone:     { type: String, required: true, trim: true },
    panditId:  { type: String, required: true, trim: true },
    panditName:{ type: String, default: "" },
    userId:    { type: String, required: false },
    status:    { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export default panditJiAtRequestMongooose.model<IPanditDirectBookingEnquiry>(
  "PanditDirectBookingEnquiry",
  panditDirectBookingEnquirySchema
);
