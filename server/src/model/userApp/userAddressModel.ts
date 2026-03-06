// src/model/userApp/userAddressModel.ts

import { Schema, Document, Types, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export interface IAddress extends Document {
  user: Types.ObjectId;         // reference → User collection
  addressLine1: string;           // House No, Building Name
  addressLine2?: string;          // Landmark, etc.
  street: string;                 // Street/Locality details from geocoding
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  addressName: string;            
  isPrimary: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    user:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    street:       { type: String, required: true, trim: true },
    city:         { type: String, required: false, trim: true },
    state:        { type: String, required: true, trim: true },
    country:      { type: String, required: true, trim: true },
    pincode:      { type: String, required: true },
    latitude:     { type: Number, required: true },
    longitude:    { type: Number, required: true },
    addressName:  { type: String, required: true, trim: true },
    isPrimary:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

AddressSchema.index({ user: 1, addressName: 1 }, { unique: true });


const UserAddressModel: Model<IAddress> = panditJiAtRequestMongooose.model<IAddress>(
  "Address",
  AddressSchema
);

export default UserAddressModel;