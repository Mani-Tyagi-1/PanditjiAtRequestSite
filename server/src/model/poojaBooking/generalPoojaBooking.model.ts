import { Schema } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

const AddressSchema = new Schema({
  houseNo: String, street: String, city: String, state: String, pincode: String, addressName: String,
}, { _id: false, strict: true });

const schema = new Schema({
  generalPoojaId: { type: Schema.Types.ObjectId, required: true, ref: "GeneralPooja" },
  pujaName: { type: String, required: true }, templeName: String,
  devoteeName: { type: String, required: true }, gotra: String,
  phone: { type: String, required: true }, email: String,
  bookingDate: { type: Date, required: true }, familyMembers: [String],
  prasadAdded: { type: Boolean, default: false }, address: AddressSchema,
  amount: { type: Number, required: true }, chargedAmount: { type: Number, required: true }, currency: { type: String, default: "INR" },
  countryCode: String, country: String,
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, required: true, unique: true },
  paidAt: { type: Date, required: true },
}, { timestamps: true, strict: true, collection: "generalpoojabooking" });

export default panditJiAtRequestMongooose.model("GeneralPoojaBooking", schema);
