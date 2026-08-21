import { Schema } from "mongoose";

/**
 * Where a devotee came from, stored ON the booking itself.
 *
 * WHY THIS LIVES ON THE BOOKING
 * -----------------------------
 * GA4 and Google Ads already know which campaign earned a sale, but they only
 * ever hand that back as an aggregate: "Savan Puja campaign produced 14
 * conversions". They cannot answer the question ops actually asks — "this
 * booking, the one on the phone right now, which ad brought it in?" — because
 * the report has no booking id in it and never will.
 *
 * `AnalyticsAttribution` (see analyticsAttribution.model.ts) is NOT this. That
 * collection parks cookie ids against a Razorpay order id so the webhook can
 * report a purchase as the right visitor, and it is deliberately disposable —
 * a TTL index drops every row after 30 days. This is the opposite: a permanent
 * record on the booking, queryable forever, so revenue can be grouped by
 * campaign months later with a single aggregation.
 *
 * TWO TOUCHES, NOT ONE
 * --------------------
 * `first` is the campaign that introduced the devotee to the site; `last` is
 * the one they were on when they booked. They are usually different — a Meta
 * video ad brings someone in, they leave, and a branded search brings them
 * back to pay — and crediting only one of them tells a misleading story. Last
 * touch is what matches the ad platforms' own numbers; first touch is what
 * tells you which campaign is actually doing the acquiring.
 *
 * Every field is optional and the whole subdocument is absent on a booking
 * that arrived without one (an app booking, an admin-created booking, a
 * devotee who typed the URL). Nothing downstream may assume it is there.
 */
export interface IMarketingTouch {
  /** utm_source — "google", "facebook", or the referring host. */
  source?: string;
  /** utm_medium — "cpc", "organic", "referral", "(none)" for direct. */
  medium?: string;
  /** utm_campaign — the campaign name as set in the ad platform. */
  campaign?: string;
  /** utm_term — the keyword, on search campaigns. */
  term?: string;
  /** utm_content — the specific ad or creative variant. */
  content?: string;

  /** Google Ads click id. Present on ad clicks even when the UTMs are not. */
  gclid?: string;
  /** Google Ads click ids used when cookies are restricted (iOS/Safari). */
  gbraid?: string;
  wbraid?: string;
  /** Meta click id, from a Facebook or Instagram ad. */
  fbclid?: string;
  /** Microsoft Ads click id. */
  msclkid?: string;

  /** document.referrer at the moment of the touch. */
  referrer?: string;
  /** The page the devotee landed on, full URL including the query string. */
  landingPage?: string;
  /** When the touch happened, per the devotee's browser. */
  at?: Date;
}

export interface IMarketingAttribution {
  /** The campaign that first brought this devotee to the site. */
  first?: IMarketingTouch;
  /** The campaign they were on when they booked. */
  last?: IMarketingTouch;
}

const touchSchema = new Schema<IMarketingTouch>(
  {
    source: { type: String, trim: true },
    medium: { type: String, trim: true },
    campaign: { type: String, trim: true },
    term: { type: String, trim: true },
    content: { type: String, trim: true },

    gclid: { type: String, trim: true },
    gbraid: { type: String, trim: true },
    wbraid: { type: String, trim: true },
    fbclid: { type: String, trim: true },
    msclkid: { type: String, trim: true },

    referrer: { type: String, trim: true },
    landingPage: { type: String, trim: true },
    at: { type: Date },
  },
  // No _id: these are value objects, not documents, and an ObjectId on each
  // one is dead weight on every booking in the collection.
  { _id: false },
);

export const marketingAttributionSchema = new Schema<IMarketingAttribution>(
  {
    first: { type: touchSchema, default: undefined },
    last: { type: touchSchema, default: undefined },
  },
  { _id: false },
);

/**
 * The one field definition every booking model uses, so a new collection picks
 * up campaign tracking by copying a single line rather than 40.
 *
 * `default: undefined` matters: without it Mongoose materialises an empty `{}`
 * on every booking, and `{ "attribution.last.campaign": { $exists: true } }`
 * stops being a clean way to separate tracked bookings from untracked ones.
 */
export const attributionField = {
  type: marketingAttributionSchema,
  default: undefined,
} as const;
