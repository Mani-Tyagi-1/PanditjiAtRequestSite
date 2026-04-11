import mongoose from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

const CategorySchema = new mongoose.Schema(
  {
    category_id:    { type: String, required: true, unique: true },
    category_name_en:  { type: String, required: true },
    category_name_hin: { type: String, required: true },
    category_image:    { type: String, default: "" },
    sub_categories:   [{ type: String }],
  },
  { timestamps: true }
);

// IMPORTANT: use your custom connection instance
export default panditJiAtRequestMongooose.model("Category", CategorySchema);
