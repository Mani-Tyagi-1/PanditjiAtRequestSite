import mongoose from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

const PoojaBookingSchema = new mongoose.Schema(
  {
    // Reference to the original Pooja service being booked
    pooja: {
      id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "PoojaBooked", // This links to your original schema model
        required: true 
      },
      nameEng: { type: String, required: true },
    },

    // Details of the Pandit assigned to the booking
    pandit: {
      id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Pandit", // Assumes you have a "Pandit" model
        required: true 
      },
      name: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      }
    },

    // Details of the user who made the booking
    user: {
       id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", // Assumes you have a "User" model
        required: true 
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      }
    },
    
    // Date and time for the pooja ceremony
    poojaDate: { type: Date, required: true },
    poojaTime: { type: String, required: true }, // e.g., "10:30 AM"

    // Booking status
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Optional: Create a 2dsphere index for geospatial queries
PoojaBookingSchema.index({ "pandit.location": "2dsphere" });
PoojaBookingSchema.index({ "user.location": "2dsphere" });


// IMPORTANT: Use your custom connection instance.
export default panditJiAtRequestMongooose.model("PoojaBooking", PoojaBookingSchema);
