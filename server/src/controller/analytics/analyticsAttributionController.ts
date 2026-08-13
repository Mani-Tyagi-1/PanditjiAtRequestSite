import { RequestHandler } from "express";

import AnalyticsAttribution from "../../model/analytics/analyticsAttribution.model";

/**
 * POST /api/analytics/attribution
 *
 * The browser parks its analytics identity against a Razorpay order id, so the
 * Razorpay webhook can later report the purchase as the RIGHT visitor rather
 * than as an anonymous new one. See the model for the full rationale.
 *
 * Deliberately unauthenticated and deliberately forgiving: this is called from
 * `stashOrderAttribution()` in the checkout path, and nothing it can do may
 * ever interfere with taking a payment. It always answers 200.
 *
 * The worst an abuser can do is write a junk row for an order id they guessed,
 * which at most mis-attributes one of our own conversions. There is nothing to
 * read back and no PII stored — only cookie ids the caller's own browser
 * already holds.
 */
export const upsertAnalyticsAttribution: RequestHandler = async (req, res) => {
  try {
    const { razorpayOrderId, clientId, sessionId, gclid, fbp, fbc, userAgent, eventSourceUrl } =
      req.body || {};

    if (!razorpayOrderId || typeof razorpayOrderId !== "string") {
      res.status(200).json({ success: false, message: "razorpayOrderId required" });
      return;
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp =
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]) ||
      req.ip ||
      "";

    // Truncated to keep a hostile caller from writing unbounded documents.
    const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

    await AnalyticsAttribution.findOneAndUpdate(
      { razorpayOrderId: clip(razorpayOrderId, 100) },
      {
        $set: {
          clientId: clip(clientId, 64),
          sessionId: clip(sessionId, 64),
          gclid: clip(gclid, 200),
          fbp: clip(fbp, 200),
          fbc: clip(fbc, 300),
          userAgent: clip(userAgent || req.headers["user-agent"], 500),
          clientIp: clip(clientIp, 60),
          eventSourceUrl: clip(eventSourceUrl, 500),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    // Logged, never surfaced: a failure here costs attribution quality on one
    // order and must not read as an error to the checkout page.
    console.error("[AnalyticsAttribution] upsert failed:", error?.message || error);
    res.status(200).json({ success: false });
  }
};
