import { Schema, Model, Types } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";
import {
  attributionField,
  IMarketingAttribution,
} from "../analytics/marketingAttribution.schema";

/**
 * Vedic Vivah Booking
 * ------------------------------------------------------------------
 * A guided North-Indian marriage journey booking. A user picks one or
 * more sacred steps (Kundali Milan, Vivah Muhurat, Shagun, Vivah
 * Sanskaar, Mandir Darshan), fills their details on the checkout and
 * either:
 *   - submits a LEAD (our team calls back), or
 *   - pays a 50% advance to instantly CONFIRM the booking (Razorpay).
 *
 * Every selected step carries its own `completed` flag (default false)
 * so the ops/pandit team can tick them off as the journey progresses.
 * Collection: `vedic_vivah_bookings`.
 */

export interface IVivahStep {
  stepId: string;       // e.g. "kundali-milan"
  title: string;        // e.g. "Kundali Milan"
  price: number;        // server-validated base price (INR)
  samagriPrice: number; // server-validated samagri price (INR) for this ritual
  completed: boolean;   // pandit/ops marks true once this ritual is done
  scheduledDate?: string;  // DD/MM/YYYY — set by admin when planning the journey
  scheduledTime?: string;  // HH:mm
  completedAt?: Date | null;
  completedBy?: string;    // panditId (or "admin") who marked it done
}

/** A free gift snapshot frozen into the booking at purchase time. */
export interface IVivahBookingGift {
  title: string;
  image?: string;
  images?: string[];
  description?: string;
  count?: number;
  price?: number;
  forWhom?: string;
  ritualSlug?: string;
  shopifyProductId?: string;
}

/** A cross-sell shop product the family added onto the vivah booking. */
export interface IVivahAddOn {
  shopifyProductId: string;
  title: string;
  image?: string;
  price: number; // server-validated unit price (INR)
  qty: number;
}

/** The after-marriage live temple darshan chosen for this booking. */
export interface IVivahLiveDarshanTemple {
  templeId: string;
  name: string;
  city?: string;
  image?: string;
  price: number;   // charged amount (0 when free/included by the tier)
  isFree: boolean; // included by the package tier (Raj: 1, Maharaja: all)
}

/** "Invite a Pandit Ji from Kashi" selection frozen onto the booking. */
export interface IVivahKashiInvite {
  invited: boolean;
  panditName?: string;   // chosen featured Kashi pandit (optional)
  premiumAmount: number; // premium added to the total
}

/** A real Pandit Ji (from the pandits collection) assigned to this vivah. */
export interface IVivahAssignedPandit {
  panditId?: Types.ObjectId | null;
  name: string;
  phone?: string;
  photo?: string;
  role: "lead" | "support" | "coordinator";
  assignedAt?: Date | null;
  notified?: boolean; // WhatsApp + push delivered to this pandit
}

export interface IKundaliPerson {
  name?: string;
  dob?: string;         // DD/MM/YYYY
  tob?: string;         // HH:mm (time of birth)
  pob?: string;         // place of birth (city)
}

export interface IVedicVivahBooking {
  userId?: Types.ObjectId | null;

  /**
   * Which surface the family booked from.
   *   "app" → the React Native user app (RahulPanditJiAtRequest/userFrontend)
   *   "web" → panditjiatrequest.com (PanditjiAtRequestSite/frontend)
   *
   * Both servers write to the SAME `vedic_vivah_bookings` collection, so this
   * is the ONLY thing that distinguishes the two channels. It is stamped
   * server-side (never trusted from the client) and defaults to "app" so the
   * documents written before this field existed keep reporting correctly.
   */
  platform: "app" | "web";

  // Yajaman / contact
  devoteeName: string;
  whatsapp: string;
  email?: string;

  // Event logistics
  eventDate?: string;        // DD/MM/YYYY ("" if muhurat help requested)
  eventTime?: string;        // HH:mm or ""
  needMuhuratHelp: boolean;  // "suggest an auspicious muhurat for me"
  language?: string;         // ritual language / samaj preference
  samagriNeeded: boolean;    // include all puja samagri (adds samagri pricing)
  notes?: string;
  consultationMessage?: string; // free consultation: what the family wants help with

  // Venue
  address: {
    street: string;
    pincode: string;
    city: string;
    state: string;
  };

  // Kundali Milan inputs (only when "kundali-milan" is among selectedSteps)
  kundaliRequired: boolean;
  kundaliMode?: "details" | "upload";
  kundaliUploadUrl?: string;   // legacy single upload (back-compat)
  kundaliBoyUrl?: string;      // Var (groom) kundali upload
  kundaliGirlUrl?: string;     // Vadhu (bride) kundali upload
  boy?: IKundaliPerson;
  girl?: IKundaliPerson;

  // Steps + money
  selectedSteps: IVivahStep[];
  isSampooranPackage: boolean; // true when the full "Sampooran Vivah" package is booked

  // Marriage package tier (₹21k Shubh / ₹51k Raj / ₹1.11L Maharaja)
  packageId?: string;          // catalog packageId; "" for à-la-carte/sampooran
  packageName?: string;        // frozen display name at purchase time
  panditCount?: number;        // pandits promised by the tier (1/2/3)
  hasCoordinator?: boolean;    // dedicated coordinator included
  packageGifts?: IVivahBookingGift[]; // free gifts frozen at purchase time

  // Cross-sell add-ons (shop products added as extra gifting)
  addOnProducts?: IVivahAddOn[];
  addOnAmount?: number;        // sum of addOn price × qty

  // After-marriage LIVE temple darshan selection. Paid for single-ritual
  // bookings; complimentary inside the Raj (1) & Maharaja (all) tiers.
  liveDarshanTemple?: IVivahLiveDarshanTemple | null;
  templeAmount?: number;       // temple.price when paid (0 when included/none)

  // "Invite a Pandit Ji from Kashi" — a premium add-on on top of any booking.
  kashiPandit?: IVivahKashiInvite | null;
  kashiAmount?: number;        // kashi premium when invited (0 otherwise)

  // Chosen shubh muhurat (when the family picked a published date)
  selectedMuhurat?: {
    date: string;
    day?: string;
    tithi?: string;
    nakshatra?: string;
  } | null;
  // Instant (near-term) vs pre-booked (future-dated) marriage
  isPreBooking?: boolean;

  baseAmount: number;        // sum of selected ritual base prices (or package price)
  samagriAmount: number;     // samagri cost (0 when the family brings their own / package)
  totalAmount: number;       // baseAmount + samagriAmount + addOnAmount + templeAmount + kashiAmount
  advancePercent?: number;   // admin-configured advance % applied to this booking
  advanceAmount: number;     // advancePercent of total, payable now to confirm
  amountPaid: number;        // amount actually captured

  paymentOption: "advance" | "full" | "lead";
  bookingType: "lead" | "paid" | "consultation";
  status: "lead" | "confirmed" | "in_progress" | "completed" | "cancelled";

  // Payment
  isPaymentDone: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  // Balance payment (the remaining 50% after an advance) — a fresh order is
  // created against the same booking; these track that second leg.
  balanceRazorpayOrderId?: string;
  balancePaidAt?: Date | null;

  // Assigned Pandit Ji (ops/admin fills this after confirmation; surfaced to
  // the family in My Bookings + WhatsApp). This is the report's #1 gap fix.
  panditAssigned?: {
    name?: string;
    photo?: string;
    title?: string;        // e.g. "Vedacharya · Rigvedi"
    experienceYears?: number;
    languages?: string[];
    phone?: string;        // optional coordinator/pandit contact
    assignedAt?: Date | null;
  };
  whatsappPanditAssignedSent?: boolean;

  // Real pandit assignments (area-wise, from SuperAdmin). Multiple pandits for
  // Raj/Maharaja tiers; each gets WhatsApp + in-app push on assignment and is
  // notified again on the day of every scheduled ritual.
  assignedPandits?: IVivahAssignedPandit[];

  // Automation idempotency guards: keys like "pre_<DD-MM-YYYY>", "day_<DD-MM-YYYY>"
  remindersSent?: string[];

  // Cancellation / reschedule (backs the "Free Reschedule & Cancellation" badge)
  cancellation?: {
    isCancelled: boolean;
    reason?: string;
    cancelledAt?: Date | null;
    refundAmount?: number;     // computed per policy
    refundStatus?: "none" | "pending" | "processed";
  };
  rescheduleCount?: number;
  lastRescheduledAt?: Date | null;

  // Referral / partner attribution (offline planner/venue tie-ups)
  referralCode?: string;
  /** Which campaign brought this devotee in. See the schema for the shape. */
  attribution?: IMarketingAttribution;

  // Notifications (idempotency guards)
  whatsappLeadSent?: boolean;
  whatsappConfirmationSent?: boolean;

  createdAt: Date;
}

const kundaliPersonSchema = new Schema<IKundaliPerson>(
  {
    name: { type: String, default: "" },
    dob: { type: String, default: "" },
    tob: { type: String, default: "" },
    pob: { type: String, default: "" },
  },
  { _id: false }
);

const vivahStepSchema = new Schema<IVivahStep>(
  {
    stepId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    samagriPrice: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    scheduledDate: { type: String, default: "" },
    scheduledTime: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: "" },
  },
  { _id: false }
);

const bookingGiftSchema = new Schema<IVivahBookingGift>(
  {
    title: { type: String, required: true },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    count: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    forWhom: { type: String, default: "" },
    ritualSlug: { type: String, default: "" },
    shopifyProductId: { type: String, default: "" },
  },
  { _id: false }
);

const liveDarshanTempleSchema = new Schema<IVivahLiveDarshanTemple>(
  {
    templeId: { type: String, default: "" },
    name: { type: String, default: "" },
    city: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
  },
  { _id: false }
);

const kashiInviteSchema = new Schema<IVivahKashiInvite>(
  {
    invited: { type: Boolean, default: false },
    panditName: { type: String, default: "" },
    premiumAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const selectedMuhuratSchema = new Schema(
  {
    date: { type: String, default: "" },
    day: { type: String, default: "" },
    tithi: { type: String, default: "" },
    nakshatra: { type: String, default: "" },
  },
  { _id: false }
);

const addOnSchema = new Schema<IVivahAddOn>(
  {
    shopifyProductId: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 },
  },
  { _id: false }
);

const assignedPanditSchema = new Schema<IVivahAssignedPandit>(
  {
    panditId: { type: Schema.Types.ObjectId, ref: "Pandit", default: null },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    photo: { type: String, default: "" },
    role: { type: String, enum: ["lead", "support", "coordinator"], default: "lead" },
    assignedAt: { type: Date, default: null },
    notified: { type: Boolean, default: false },
  },
  { _id: false }
);

const vedicVivahBookingSchema = new Schema<IVedicVivahBooking>({
  // Required for lead/paid bookings (enforced in the controller). Optional so a
  // frictionless free "consultation" callback can be captured without login.
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },

  // Channel discriminator — see the interface comment. Defaults to "app" so
  // pre-existing documents (all of which came from the app) read correctly.
  platform: { type: String, enum: ["app", "web"], default: "app", index: true },

  devoteeName: { type: String, required: true },
  whatsapp: { type: String, required: true },
  email: { type: String, default: "" },

  eventDate: { type: String, default: "" },
  eventTime: { type: String, default: "" },
  needMuhuratHelp: { type: Boolean, default: false },
  language: { type: String, default: "" },
  samagriNeeded: { type: Boolean, default: true },
  notes: { type: String, default: "" },
  consultationMessage: { type: String, default: "" },

  address: {
    street: { type: String, default: "" },
    pincode: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
  },

  kundaliRequired: { type: Boolean, default: false },
  kundaliMode: { type: String, enum: ["details", "upload"], default: "details" },
  kundaliUploadUrl: { type: String, default: "" },
  kundaliBoyUrl: { type: String, default: "" },
  kundaliGirlUrl: { type: String, default: "" },
  boy: { type: kundaliPersonSchema, default: () => ({}) },
  girl: { type: kundaliPersonSchema, default: () => ({}) },

  selectedSteps: { type: [vivahStepSchema], default: [] },
  isSampooranPackage: { type: Boolean, default: false },

  packageId: { type: String, default: "" },
  packageName: { type: String, default: "" },
  panditCount: { type: Number, default: 1 },
  hasCoordinator: { type: Boolean, default: false },
  packageGifts: { type: [bookingGiftSchema], default: [] },

  addOnProducts: { type: [addOnSchema], default: [] },
  addOnAmount: { type: Number, default: 0 },

  liveDarshanTemple: { type: liveDarshanTempleSchema, default: null },
  templeAmount: { type: Number, default: 0 },
  kashiPandit: { type: kashiInviteSchema, default: null },
  kashiAmount: { type: Number, default: 0 },
  selectedMuhurat: { type: selectedMuhuratSchema, default: null },
  isPreBooking: { type: Boolean, default: false },

  baseAmount: { type: Number, default: 0 },
  samagriAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  advancePercent: { type: Number, default: 50 },
  advanceAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },

  paymentOption: { type: String, enum: ["advance", "full", "lead"], default: "lead" },
  bookingType: { type: String, enum: ["lead", "paid", "consultation"], default: "lead" },
  status: {
    type: String,
    enum: ["lead", "confirmed", "in_progress", "completed", "cancelled"],
    default: "lead",
  },

  isPaymentDone: { type: Boolean, default: false },
  razorpayOrderId: { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  razorpaySignature: { type: String, default: "" },
  balanceRazorpayOrderId: { type: String, default: "" },
  balancePaidAt: { type: Date, default: null },

  panditAssigned: {
    name: { type: String, default: "" },
    photo: { type: String, default: "" },
    title: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    languages: { type: [String], default: [] },
    phone: { type: String, default: "" },
    assignedAt: { type: Date, default: null },
  },
  whatsappPanditAssignedSent: { type: Boolean, default: false },

  assignedPandits: { type: [assignedPanditSchema], default: [] },
  remindersSent: { type: [String], default: [] },

  cancellation: {
    isCancelled: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, enum: ["none", "pending", "processed"], default: "none" },
  },
  rescheduleCount: { type: Number, default: 0 },
  lastRescheduledAt: { type: Date, default: null },

  referralCode: { type: String, default: "" },

  attribution: attributionField,

  whatsappLeadSent: { type: Boolean, default: false },
  whatsappConfirmationSent: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

vedicVivahBookingSchema.index({ userId: 1, createdAt: -1 });
vedicVivahBookingSchema.index({ status: 1, createdAt: -1 });
// Lets SuperAdmin/ops slice the funnel by channel ("how many web vs app").
vedicVivahBookingSchema.index({ platform: 1, createdAt: -1 });
vedicVivahBookingSchema.index({ razorpayOrderId: 1 });
vedicVivahBookingSchema.index({ "assignedPandits.panditId": 1, createdAt: -1 });
// Revenue by campaign. Sparse — bookings from before campaign tracking, and
// any that did not come through the website, carry no attribution at all.
vedicVivahBookingSchema.index({ "attribution.last.campaign": 1, createdAt: -1 }, { sparse: true });

const VedicVivahBooking: Model<IVedicVivahBooking> =
  panditJiAtRequestMongooose.model<IVedicVivahBooking>(
    "VedicVivahBooking",
    vedicVivahBookingSchema,
    "vedic_vivah_bookings"
  );

export default VedicVivahBooking;
