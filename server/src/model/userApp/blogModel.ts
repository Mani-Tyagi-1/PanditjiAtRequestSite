import mongoose from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

const BlogSchema = new mongoose.Schema(
  {
    blogID: { type: String, required: true, unique: true },
    blogName: { type: String, required: true },
    blogDescription: { type: String, required: true },
    blogImages: [{ type: String }],
    authorName: { type: String },
    addedDate: { type: Date, default: Date.now },
    tags: [{ type: String }],
    pooja: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Pooja" },
      name: { type: String },
      link: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default panditJiAtRequestMongooose.model("Blog", BlogSchema);
