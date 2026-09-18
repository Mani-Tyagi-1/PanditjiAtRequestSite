import { Schema, Model } from "mongoose";
import { panditJiAtRequestMongooose } from "../../config/connectDB";

/**
 * The browser's analytics identity, parked against a Razorpay order id.
 *
 * WHY THIS COLLECTION EXISTS
 * --------------------------
 * A purchase has to be reported server-side, because the browser cannot be
 * trusted to still exist when payment succeeds — the devotee closes the tab,
 * the network drops, the phone locks. The Razorpay webhook is the authoritative
 * signal and it always arrives.
 *
 * But a webhook is a server-to-server POST from Razorpay. It carries no
 * cookies, no user agent, and no idea which visitor it belongs to. Sending GA4
 * a purchase with no client id makes it invent a brand-new user, so the sale is
 * recorded but attributed to "(direct)" — the ad campaign that actually earned
 * it shows zero return, and Smart Bidding optimises against numbers that are
 * wrong in a way nobody notices.
 *
 * So the browser writes its ids here at the moment it creates the order, while
 * it still has them, and the webhook reads them back.
 *
 * Rows are disposable. The TTL index drops them 30 days after creation, which
 * is well past the point any payment for that order could still settle, and
 * keeps this from growing without bound.
 */
export interface IAnalyticsAttribution {
  /** Razorpay order id — the join key to the eventual purchase. */
  razorpayOrderId: string;

  /** GA4 client id from the `_ga` cookie, e.g. "1234567890.1700000000". */
  clientId?: string;
  /** GA4 session id from `_ga_<measurement id>`. */
  sessionId?: string;
  /** Google Ads click id, when the visit came from an ad. */
  gclid?: string;

  /** Meta browser id / click id — the same pair the CAPI calls already use. */
  fbp?: string;
  fbc?: string;

  /** Required by GA4 Measurement Protocol and Meta CAPI for match quality. */
  userAgent?: string;
  clientIp?: string;
  /** The page the order was created from. */
  eventSourceUrl?: string;

  /**
   * Set once a purchase has been reported for this order. The guard that stops
   * the browser path and the webhook path from both counting the same sale.
   */
  purchaseReportedAt?: Date;

  createdAt: Date;
}

const analyticsAttributionSchema = new Schema<IAnalyticsAttribution>({
  // Unique so the stash is naturally idempotent: the page may call the endpoint
  // more than once (React StrictMode double-invokes effects in dev, and a retry
  // after a network blip is normal), and every call must collapse to one row.
  razorpayOrderId: { type: String, required: true, unique: true, index: true, trim: true },

  clientId: { type: String, trim: true },
  sessionId: { type: String, trim: true },
  gclid: { type: String, trim: true },

  fbp: { type: String, trim: true },
  fbc: { type: String, trim: true },

  userAgent: { type: String, trim: true },
  clientIp: { type: String, trim: true },
  eventSourceUrl: { type: String, trim: true },

  purchaseReportedAt: { type: Date },

  // expires is in seconds — 30 days.
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

const AnalyticsAttribution: Model<IAnalyticsAttribution> =
  panditJiAtRequestMongooose.model<IAnalyticsAttribution>(
    "AnalyticsAttribution",
    analyticsAttributionSchema,
    "analyticsAttributions",
  );

export default AnalyticsAttribution;
