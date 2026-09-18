import axios from "axios";
import User from "../model/userApp/userModel";

/**
 * Push a PANDIT_JI_AT_REQUEST order to the partner-affiliate engine, crediting the customer's
 * referrer (User.referralSourcePJAR). Mirrors poojaBookingController's partner-affiliate push so
 * every website module (chadhava, live mandir, shopify, pooja) attributes commission identically.
 *
 * - Resolve the referrer by `userId` when present, else by `phone` (last-10-digit match) for
 *   account-less flows.
 * - No-op when there's no referrer / no orderId / no price / no API configured.
 * - Never throws (called with `void`); idempotent on the partner-affiliate side (unique orderId).
 */
export async function sendPjarOrderToPartnerAffiliate(args: {
  userId?: any;
  phone?: string | null;
  orderId: string | null | undefined;
  orderPrice: number;
  productName?: string | null;
  time?: any;
}): Promise<void> {
  try {
    const apiUrl = process.env.PARTNER_AFFILIATE_ORDER_API;
    if (!apiUrl) {
      console.warn("[PartnerAffiliate][PJAR] PARTNER_AFFILIATE_ORDER_API not set. Skipping.");
      return;
    }

    const actualUserId = args.userId ? String(args.userId) : null;
    const phoneDigits = args.phone ? String(args.phone).replace(/\D/g, "") : "";
    if (!actualUserId && phoneDigits.length < 10) return;

    const orderId = args.orderId ? String(args.orderId).trim() : "";
    if (!orderId) return;

    const orderPrice = Number(args.orderPrice) || 0;
    if (!(orderPrice > 0)) return;

    let referralSourcePJAR: string | null = null;
    try {
      let u: any = null;
      if (actualUserId) {
        u = await User.findById(actualUserId).select("referralSourcePJAR").lean();
      } else {
        const last10 = phoneDigits.slice(-10);
        u = await User.findOne({ phone: { $regex: `${last10}$` } })
          .select("referralSourcePJAR")
          .lean();
      }
      referralSourcePJAR = (u as any)?.referralSourcePJAR ?? null;
    } catch (e) {
      referralSourcePJAR = null;
    }

    const referralValue =
      referralSourcePJAR && String(referralSourcePJAR).trim() ? String(referralSourcePJAR).trim() : "";
    if (!referralValue) return;

    const payload = {
      userId: referralValue,
      refferal_user_id: referralValue,
      orderId,
      orderPrice,
      time: args.time || new Date().toISOString(),
      department: "PANDIT_JI_AT_REQUEST",
      products: [
        {
          productName: String(args.productName || "PANDIT_JI_AT_REQUEST"),
          productPrice: orderPrice,
          commissionPercent: [0, 0, 0],
        },
      ],
      // This repo is the PJAR WEBSITE backend — explicit marker so the engine never applies the
      // per-role APP commission caps to website orders (and analytics can split app vs web).
      orderSource: "WEBSITE",
    };

    await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
  } catch (error: any) {
    console.error("[PartnerAffiliate][PJAR] failed:", error?.response?.data || error?.message || error);
  }
}
