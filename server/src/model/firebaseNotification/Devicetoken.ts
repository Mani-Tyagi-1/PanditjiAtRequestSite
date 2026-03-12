import { Schema, InferSchemaType } from "mongoose";
import { panditJiAtRequestMongooose } from "../../../config/connectDB";

export type PushAppType = "user" | "pandit";
export type PushPlatform = "android" | "ios";

const DeviceTokenSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // ✅ NEW: which app generated this token
    appType: {
      type: String,
      enum: ["user", "pandit"],
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["android", "ios"],
      required: true,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
      trim: true,
    },

    fcmToken: {
      type: String,
      default: null,
      index: true,
    },

    voipToken: {
      type: String,
      default: null,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// ✅ Same user can have same deviceId in different apps (user/pandit)
// so include appType in unique key
DeviceTokenSchema.index(
  { userId: 1, deviceId: 1, appType: 1 },
  { unique: true, name: "uniq_user_device_appType" }
);

type DeviceTokenDoc = InferSchemaType<typeof DeviceTokenSchema>;

export default panditJiAtRequestMongooose.model<DeviceTokenDoc>(
  "DeviceToken",
  DeviceTokenSchema
);