import { Schema } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

const GeneralPoojaSchema = new Schema({
  name: { type: String, required: true }, hindiName: String, category: String,
  images: [String], shortDescription: String, deityName: String, pujaDate: Date,
  startTime: String, duration: String, status: String, price: { type: Number, required: true },
  discountPrice: Number, whatIsPerformed: String, vidhi: String, offeringsSamagri: String,
  benefits: [String], templeName: String, templeLocation: String, templeAddress: String,
  templeImage: String, templeAbout: String, templeHistory: String, theme: String,
}, { timestamps: true, collection: "generalpoojas" });

export default panditJiAtRequestMongooose.model("GeneralPooja", GeneralPoojaSchema);
