import axios from "axios";
import User from "../model/userApp/userModel";

/**
 * Push a PANDIT_JI_AT_REQUEST order to the partner-affiliate engine, crediting whoever referred
 * the customer — the `?ref=` code stored on the order, else User.referralSourcePJAR. Mirrors
 * poojaBookingController's partner-affiliate push so every website module (chadhava, live mandir,
 * shopify, vivah, pooja) attributes commission identically.
 *
 * - Prefer the code captured on the ORDER itself (`?ref=` at checkout, stored on the booking),
 *   then fall back to the referrer on the customer's profile. A visitor who arrives on an invite
 *   link and buys as a guest has no profile code, so order-first is what makes them attributable.
 * - Resolve the profile referrer by `userId` when present, else by `phone` (last-10-digit match)
 *   for account-less flows.
 * - No-op when there's no referrer / no orderId / no price / no API configured.
 * - Never throws (called with `void`); idempotent on the partner-affiliate side (unique orderId).
 */

/**
 * `referralSourcePJAR` defaults to this for every user, so it means "no partner referred this
 * customer" — NOT a partner id. Forwarding it would ask the engine to credit a partner called
 * "organic" on essentially every order.
 */
const ORGANIC = "organic";

const cleanCode = (value: unknown): string => {
  const code = value == null ? "" : String(value).trim();
  if (!code || code.toLowerCase() === ORGANIC) return "";
  return code;
};

export async function sendPjarOrderToPartnerAffiliate(args: {
  userId?: any;
  phone?: string | null;
  /** Partner code captured at checkout from `?ref=` and stored on the order. Wins over the profile. */
  referralCode?: string | null;
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

    const orderId = args.orderId ? String(args.orderId).trim() : "";
    if (!orderId) return;

    const orderPrice = Number(args.orderPrice) || 0;
    if (!(orderPrice > 0)) return;

    // 1) The code the devotee actually arrived on, stored on this order at checkout.
    let referralValue = cleanCode(args.referralCode);

    // 2) Otherwise the referrer recorded on their profile. Only worth a lookup when we have
    //    something to look up by — a guest order with no code and no identity is organic.
    if (!referralValue && (actualUserId || phoneDigits.length >= 10)) {
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
        referralValue = cleanCode((u as any)?.referralSourcePJAR);
      } catch (e) {
        referralValue = "";
      }
    }

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
