import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

// A booking form the devotee started filling but never paid for.
//
// The row is created the moment a valid 10-digit mobile number is typed on any
// booking page — that is the earliest point at which the lead is reachable —
// and is then patched in place as the rest of the form is filled (name, gotra,
// email, package, family Sankalp names, delivery address, amount). One row per
// booking attempt, keyed by the client-generated `sessionId`.
//
// `status` flips to "converted" once the payment succeeds, so the abandoned
// list is `status: "active"` and never contains devotees who actually paid.
export interface IAbandonedCart {
  // Client-generated id for one booking attempt (per tab, per booking page).
  // This is the upsert key — every partial update targets the same row.
  sessionId: string;
  phone: string;

  // Which booking page / flow the lead came from, e.g. "kaal-bhairav-booking".
  source: string;

  // What they were booking.
  pujaId?: string;
  pujaSlug?: string;
  pujaName?: string;
  templeName?: string;
  packageId?: string;
  packageName?: string;
  amount?: number;

  // Devotee details, filled progressively.
  name?: string;
  gotra?: string;
  email?: string;
  wish?: string;
  familyMembers?: any[];
  address?: Record<string, any>;
  // Cart line items (chadhava offerings, shop items, …).
  items?: any[];
  // Anything page-specific that does not deserve a column of its own
  // (chosen time slot, puja mode, coupon code, …).
  extra?: Record<string, any>;

  userId?: string;
  pageUrl?: string;

  status: "active" | "converted";
  bookingId?: string;

  isFromSite: boolean;
  addedOn: Date;
  lastUpdatedOn: Date;
}

const abandonedCartSchema = new Schema<IAbandonedCart>({
  sessionId: { type: String, required: true, unique: true, trim: true },
  phone: { type: String, required: true, trim: true, index: true },
  source: { type: String, required: true, trim: true, index: true },

  pujaId: { type: String, trim: true },
  pujaSlug: { type: String, trim: true },
  pujaName: { type: String, trim: true },
  templeName: { type: String, trim: true },
  packageId: { type: String, trim: true },
  packageName: { type: String, trim: true },
  amount: { type: Number },

  name: { type: String, trim: true },
  gotra: { type: String, trim: true },
  email: { type: String, trim: true },
  wish: { type: String, trim: true },
  familyMembers: { type: Array, default: undefined },
  address: { type: Schema.Types.Mixed },
  items: { type: Array, default: undefined },
  extra: { type: Schema.Types.Mixed },

  userId: { type: String, trim: true },
  pageUrl: { type: String, trim: true },

  status: { type: String, enum: ["active", "converted"], default: "active", index: true },
  bookingId: { type: String, trim: true },

  isFromSite: { type: Boolean, default: true },
  addedOn: { type: Date, default: Date.now },
  lastUpdatedOn: { type: Date, default: Date.now },
});

// The admin list is "newest un-paid leads first".
abandonedCartSchema.index({ status: 1, lastUpdatedOn: -1 });

const AbandonedCart: Model<IAbandonedCart> =
  panditJiAtRequestMongooose.model<IAbandonedCart>(
    "AbandonedCart",
    abandonedCartSchema,
    "abandonedCarts"
  );

export default AbandonedCart;
