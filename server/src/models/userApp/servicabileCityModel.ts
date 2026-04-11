import mongoose, { Schema, Document, Model } from 'mongoose';
import { panditJiAtRequestMongooose } from "../../../config/connectDB"; // Using your custom connection

// Interface for a serviceable city document
export interface IServiceableCity extends Document {
  name: string;
  state: string;
  district: string;
  pincodes: string[];
  center: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  bounds: {
    type: 'Polygon';
    coordinates: [[[number, number]]]; // GeoJSON Polygon
  };
}

// Mongoose schema for the ServiceableCity
const ServiceableCitySchema: Schema<IServiceableCity> = new Schema({
  name: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  pincodes: [{ type: String }],
  center: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  bounds: {
    type: { type: String, enum: ['Polygon'], required: true },
    coordinates: { type: [[[Number]]], required: true },
  },
}, { timestamps: true });

// Index for efficient geospatial queries in your main app
ServiceableCitySchema.index({ bounds: '2dsphere' });
// Index to prevent adding the same city in the same state twice
ServiceableCitySchema.index({ name: 1, state: 1 }, { unique: true });

// Create and export the Mongoose model using your custom connection instance
const ServiceableCityModel: Model<IServiceableCity> = panditJiAtRequestMongooose.model<IServiceableCity>('ServiceableCity', ServiceableCitySchema);

export default ServiceableCityModel;
