import { RequestHandler } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import pendingPoojaBookingModel from '../../model/poojaBooking/pendingPoojaBooking.model';
import poojaBookingModel, { IPoojaBooking } from '../../model/poojaBooking/poojaBooking.model';
import User from '../../model/userApp/userModel';
import Pooja from '../../model/userApp/poojaModel';
import LiveMandirPuja from '../../model/userApp/liveMandirPujaModel';
import Pandit from '../../model/panditApp/panditModel';
import UserReferralBooking from '../../model/userApp/userReferralBooking.model';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendPushNotification, schedulePujaDayReminder } from '../../utils/oneSignal';
import { sendMetaPurchaseEvent } from '../../utils/metaCapiServices';
import { tryConsumeAppReferralOrder } from '../../utils/partnerAffiliateReferralCap';
import { sendWhatsappMessage, sendOrderConfirmationTemplate, ORDER_TEMPLATE_HEADER_IMAGE } from '../../utils/whatsapp';
import { sendBookingConfirmationEmail } from '../../utils/emailService';
import type { Document } from "mongoose";

// --- helpers ---
const toAlias10 = (v?: string | number) =>
  String(v ?? '')
    .replace(/\D/g, '')
    .replace(/^91/, '')
    .slice(-10);

// --- Feature flags for pandit notifications ---
const NOTIFY_PANDITS_ON_PENDING = (process.env.NOTIFY_PANDITS_ON_PENDING ?? 'false').toLowerCase() === 'true';
const NOTIFY_PANDITS_ON_FINAL = (process.env.NOTIFY_PANDITS_ON_FINAL ?? 'true').toLowerCase() === 'true';

// --- Razorpay Instance (from your environment variables) ---
const isProduction = process.env.PAYMENT_MODE === 'production';
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error('Razorpay credentials are missing. Check env vars.');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// -------------------------------------------------------------

// Utility function to verify Razorpay signature
const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string,
): boolean => {
  const hmac = crypto.createHmac('sha256', razorpayKeySecret as string);
  hmac.update(`${orderId}|${paymentId}`);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === signature;
};

// ⏱️ Server-side timers to close the timed modal after 60s
const timedRequestTimers = new Map<string, NodeJS.Timeout>();

// Builds the minimal payload the app expects for the timed modal
const buildTimedRequestPayload = (booking: Document & IPoojaBooking) => ({
  bookingId: booking.id,
  userName: booking.userName,
  userPhone: booking.userPhone,
  poojaName: booking.poojaNameEng,
  poojaNameEng: booking.poojaNameEng,
  bookingDate: booking.bookingDate,
  mode: booking.poojaMode,
  poojaMode: booking.poojaMode,
  poojaPrice: (booking as any).poojaPrice,
  panditDakshina: (booking as any).panditDakshina,
  address: (booking as any).address,
  bhaktName: (booking as any).bhaktName,
});

// ---- Pandit notification helpers ----

// We’ll try to read a list of active pandit external IDs from app state.
// Wire this up once in your app boot (e.g., when a pandit comes online in your socket or logs in to the app):
//   app.set('activePanditExternalIds', new Set<string>());
//   // When pandit goes online/login: set.add(externalId)
//   // When offline/logout: set.delete(externalId)
function getActivePanditExternalIdsFromApp(req: any): string[] {
  const val = req.app?.get('activePanditExternalIds');
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (val instanceof Set) return Array.from(val).filter(Boolean);
  return [];
}

// Push to the given pandits. Split out from notifyPanditsNewRequest so the
// finalize pipeline (which also runs from the Razorpay webhook) can notify
// without holding an Express request.
async function notifyPanditsForBooking(opts: {
  heading: string;
  content: string;
  data: Record<string, any>;
}, externalIds: string[] = []) {
  try {
    await sendPushNotification({
      externalIds: externalIds.length ? externalIds : undefined,
      heading: opts.heading,
      content: opts.content,
      data: opts.data,
      // fallback to tags when no specific IDs (optionally add city/lang)
      tagFilter: { /* city: '...', lang: '...' */ },
    });
  } catch (e) {
    console.error('notifyPanditsForBooking failed:', e);
  }
}

// Request-scoped wrapper: resolves the active pandit list off app state.
async function notifyPanditsNewRequest(req: any, opts: {
  heading: string;
  content: string;
  data: Record<string, any>;
}) {
  await notifyPanditsForBooking(opts, getActivePanditExternalIdsFromApp(req));
}

// ---- WhatsApp booking confirmation ----
// Sends the "booking confirmed" WhatsApp for a booking doc (pending or final).
// Works for both normal pujas and Live Mandir pujas — the message text adapts
// based on the booking's isLiveMandir flag.
//
// Timing note:
//   • Normal puja  → no payment is taken, so this is called at create-pending.
//   • Live Mandir  → payment is taken AFTER create-pending, so this is called
//                    in complete-booking (only once payment is verified) to avoid
//                    confirming a puja the devotee never actually paid for.
async function sendBookingConfirmationWhatsapp(booking: any) {
  try {
    const rawPhone = String(booking?.userPhone || '');
    const cleanedPhone = rawPhone.replace(/\D/g, ''); // keep only digits
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    if (cleanedPhone.length < 10) return;

    const isLiveMandir = Boolean(booking?.isLiveMandir);
    const address = booking?.address;

    // Use form-submitted name (bhaktName) for greeting — NOT the potentially-stale DB name
    const userName = booking?.bhaktName || booking?.userName || 'Devotee';
    const poojaName = booking?.poojaNameEng || 'Puja';
    const poojaMode = booking?.poojaMode || 'offline';
    const bookingDateStr = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const bookingId = booking?.razorpayOrderId || booking?.id;

    // Fetch nearby pandit or use default
    let assignedPanditName = "";

    // Live Mandir pujas are performed by temple priests — skip proximity logic
    if (isLiveMandir) {
      assignedPanditName = "Temple Priest";
    } else {
      try {
        const pandits = await Pandit.find({}).lean();

        if (poojaMode === 'offline' && address) {
          let userLat = Number(address.lat || address.latitude || address.location?.lat);
          let userLng = Number(address.lng || address.longitude || address.location?.lng);

          if (userLat && userLng) {
            let nearestPandit = null;
            let minDistance = Infinity;

            for (const p of pandits) {
              if (p.location?.latitude && p.location?.longitude) {
                const plat = p.location.latitude;
                const plng = p.location.longitude;
                const dLat = (plat - userLat) * Math.PI / 180;
                const dLng = (plng - userLng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(userLat * Math.PI / 180) * Math.cos(plat * Math.PI / 180) *
                          Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = 6371 * c; // km

                if (distance < minDistance && distance <= 50) { // within 50km
                  minDistance = distance;
                  nearestPandit = p;
                }
              }
            }
            if (nearestPandit) {
              assignedPanditName = `${nearestPandit.prefix || ''} ${nearestPandit.firstName || ''} ${nearestPandit.lastName || ''}`.trim();
            }
          }
        }

        if (!assignedPanditName && pandits.length > 0) {
          // Pick a random pandit from active pandits
          const randomPandit = pandits[Math.floor(Math.random() * pandits.length)];
          assignedPanditName = `${randomPandit.prefix || ''} ${randomPandit.firstName || ''} ${randomPandit.lastName || ''}`.trim();
        }
      } catch(err) {
        console.error('Error fetching nearby pandit for whatsapp msg:', err);
      }
    }

    if (!assignedPanditName) {
       assignedPanditName = "Acharya Ramlok Sharma ji"; // Ultimate fallback if DB is empty
    }

    // For Live Mandir: include mandir name in param2, selected date in param3
    const liveMandirTemple = booking?.templeName ? ` at *${booking.templeName}*` : '';
    // NOTE: this promises the puja VIDEO on WhatsApp, not a live stream link.
    // No live-stream URL is captured anywhere — LiveMandirPuja has no such field
    // — and every Live Mandir detail page advertises "Puja video on WhatsApp /
    // Full recording delivered to you". The old "live stream link" wording
    // promised devotees something that never arrives.
    const param2 = isLiveMandir
      ? `Thank you for booking your Live Mandir Puja — *${poojaName}*${liveMandirTemple}. 🛕 Your sacred booking is confirmed and the puja will be performed with your sankalp. 🌸 The puja video will be shared with you on WhatsApp after the puja is performed. 🙏`
      : `Your booking for *${poojaName}* has been successfully placed. 🌸 Your booking is confirmed, and *${assignedPanditName}* has been assigned to you. Our team will contact you shortly. 🙏`;
    const param3 = `Date: ${bookingDateStr}`;
    const param4 = `Booking ID: ${bookingId}`;

    let sent = false;
    // "Check Now" button → https://play.google.com/store/apps/details?id=com.panditJiAtReqapp
    const buttonParam = 'apps/details?id=com.panditJiAtReqapp';

    // Header image = the actual booked puja's image (live mandir → temple/puja image,
    // normal puja → pooja card image). Falls back to the brand image if unavailable.
    let headerImage = ORDER_TEMPLATE_HEADER_IMAGE;
    try {
      // 1) A genuine Live Mandir puja carries its own artwork on the
      //    LiveMandirPuja row, keyed by slug.
      if (isLiveMandir && booking?.pujaSlug) {
        const lm = await LiveMandirPuja.findOne({ slug: booking.pujaSlug }).lean();
        if ((lm as any)?.image) headerImage = (lm as any).image;
      }

      // 2) Fall through to the catalog row when step 1 found nothing. Campaign
      //    pujas are booked with isLiveMandir:true but live in the Pooja
      //    collection, not LiveMandirPuja (e.g. RF_SAVAN_01), so step 1 never
      //    resolves for them. This was previously an `else if`, which made the
      //    branch unreachable for those bookings and sent the generic brand
      //    image instead of the puja's own banner.
      //
      //    Guard: on the live-mandir path `poojaId` can be an arbitrary fallback
      //    row (see the resolution chain in create-pending), so only trust its
      //    image when the row really is the puja that was booked.
      if (headerImage === ORDER_TEMPLATE_HEADER_IMAGE && booking?.poojaId) {
        const pooja: any = await Pooja.findById(booking.poojaId).lean();
        const isRealMatch =
          !isLiveMandir || (pooja?.poojaID && pooja.poojaID === booking.pujaSlug);
        if (isRealMatch && pooja?.poojaCardImage) headerImage = pooja.poojaCardImage;
      }
    } catch (imgErr: any) {
      console.warn('[PujaBooking] Could not resolve header image, using fallback:', imgErr?.message);
    }

    // Sends pjar_booking (image header) and auto-falls back to pjar_order (button)
    // if pjar_booking isn't available on the number yet.
    try {
      await sendOrderConfirmationTemplate({
        to: phone,
        parameters: [userName, param2, param3, param4],
        headerImageUrl: headerImage,
        buttonUrlParam: buttonParam,
      });
      console.log(`[PujaBooking] WhatsApp confirmation accepted by API for ${phone} (delivery not guaranteed)`);
      sent = true;
    } catch (err: any) {
      console.warn(`[PujaBooking] Template send failed:`, err?.response?.data || err.message);
    }

    // Ultimate fallback to sending a plain text message if templates fail
    if (!sent) {
      try {
        const fallbackMsg = `Namaste ${userName} ji 🙏\n\n${param2}\n\nDate: ${bookingDateStr}\nBooking ID: ${bookingId}\n\nTrack booking details: https://play.google.com/store/${buttonParam}`;
        await sendWhatsappMessage({
          to: phone,
          message: fallbackMsg,
        });
        console.log(`✅ [PujaBooking] WhatsApp plain text confirmation sent to ${phone}`);
        sent = true;
      } catch (textErr: any) {
        console.error(`❌ [PujaBooking] WhatsApp fallback text message failed:`, textErr?.response?.data || textErr.message);
      }
    }
  } catch (e: any) {
    console.error('❌ [PujaBooking] WhatsApp confirmation flow failed entirely:', e?.response?.data || e?.message || e);
  }
}


// -------------------------------------------------------------
// PARTNER AFFILIATE – fire-and-forget after a puja booking is confirmed
// Reads referralSourcePJAR from the user's profile (set once at signup/first visit).
// This fires on every booking; "organic" is sent when no partner referral exists.
// -------------------------------------------------------------
// ---- Live Mandir abandoned-payment nudge ----
// How long after a Live Mandir payment attempt to nudge the devotee if payment
// is not completed. Configurable via env, defaults to 15 minutes.
const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const LIVE_MANDIR_NUDGE_DELAY_MINUTES = parsePositiveNumber(
  process.env.LIVE_MANDIR_NUDGE_DELAY_MINUTES,
  15,
);

const sendLiveMandirPaymentNudge = async (pendingBookingId: string) => {
  try {
    const booking = await pendingPoojaBookingModel.findById(pendingBookingId);
    if (!booking) return;
    if (!booking.isLiveMandir) return;
    if (booking.isPaymentDone) return;
    if (booking.livePaymentNudgeSent) return;

    if (booking.razorpayOrderId) {
      const paidBooking = await poojaBookingModel.exists({
        razorpayOrderId: booking.razorpayOrderId,
      });
      if (paidBooking) return;
    }

    const rawPhone = String(booking.contactNumber || booking.userPhone || '');
    const cleanedPhone = rawPhone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) return;
    const phone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const devoteeName = booking.bhaktName || booking.userName || 'Devotee';
    const poojaName = booking.packageName || booking.poojaNameEng || 'Live Mandir Puja';
    const templeText = booking.templeName ? ` at ${booking.templeName}` : '';
    const amount = Number(booking.amount || 0);
    const bookingDateStr = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const message =
      `Namaste ${devoteeName} ji 🙏\n\n` +
      `We noticed you started booking *${poojaName}*${templeText}, but the payment of ₹${amount.toLocaleString('en-IN')} wasn't completed. 🛕\n\n` +
      `Your Live Mandir Puja request is still pending for ${bookingDateStr}. Complete the payment to confirm your sankalp and receive the puja video on WhatsApp. 🌸\n\n` +
      `Complete your booking: https://play.google.com/store/apps/details?id=com.panditJiAtReqapp`;

    await sendWhatsappMessage({ to: phone, message });
    console.log(`✅ [LiveMandir] Payment nudge sent to ${phone} (pendingBookingId=${pendingBookingId})`);

    booking.livePaymentNudgeSent = true;
    await booking.save();
  } catch (e: any) {
    console.error('❌ [LiveMandir] Payment nudge failed:', e?.response?.data || e?.message || e);
  }
};

const scheduleLiveMandirPaymentNudge = (pendingBookingId: string) => {
  const delayMs = LIVE_MANDIR_NUDGE_DELAY_MINUTES * 60 * 1000;
  setTimeout(() => {
    void sendLiveMandirPaymentNudge(pendingBookingId);
  }, delayMs);
};

const sendOrderToPartnerAffiliate = async (booking: any): Promise<void> => {
  try {
    const apiUrl = process.env.PARTNER_AFFILIATE_ORDER_API;
    if (!apiUrl) {
      console.warn('[PartnerAffiliate] PARTNER_AFFILIATE_ORDER_API env not set. Skipping.');
      return;
    }

    const actualUserId = booking?.userId ? String(booking.userId) : null;
    if (!actualUserId) {
      console.warn('[PartnerAffiliate] booking.userId missing. Skipping.');
      return;
    }

    // 1️⃣ Prefer the ref code captured from ?ref= URL (stored on the booking itself)
    // 2️⃣ Fall back to referralSourcePJAR on the user's profile (set at signup/first visit)
    let referralValue: string | null = null;

    const bookingRefCode = (booking as any).referralCode
      ? String((booking as any).referralCode).trim()
      : null;

    if (bookingRefCode) {
      referralValue = bookingRefCode;
    } else {
      try {
        const u = await User.findById(actualUserId).select('referralSourcePJAR').lean();
        const src = (u as any)?.referralSourcePJAR ?? null;
        if (src && String(src).trim() && String(src).trim() !== 'organic') {
          referralValue = String(src).trim();
        }
      } catch (e) {
        console.warn('[PartnerAffiliate] Failed to fetch user referralSourcePJAR:', e);
      }
    }

    // No partner referral — nothing to credit, skip
    if (!referralValue) {
      console.log(`[PartnerAffiliate] No partner referral for booking ${booking._id}. Skipping.`);
      return;
    }

    // App orders only earn commission for a referred customer's first N orders (admin-editable
    // via the Commission Structure page, default 15) — website orders have no such cap. Atomic
    // check-and-increment against our own local User record (see
    // utils/partnerAffiliateReferralCap.ts for why it lives here, not on the partner-affiliate side).
    if ((booking as any).isFromApp === true) {
      const withinCap = await tryConsumeAppReferralOrder(
        (booking as any).userPhone || (booking as any).contactNumber
      );
      if (!withinCap) {
        console.log(
          `[PartnerAffiliate] Skipping commission for booking ${booking._id}: app referral order cap reached for this customer.`
        );
        return;
      }
    }

    // Always use total booking amount (panditDakshina may be undefined on online bookings)
    const orderAmount = Number(booking.amount ?? booking.panditDakshina ?? 0);
    if (orderAmount <= 0) {
      console.warn(`[PartnerAffiliate] orderAmount is 0 for booking ${booking._id}. Skipping.`);
      return;
    }

    const payload = {
      userId: referralValue ,
      refferal_user_id: actualUserId,
      orderId: booking.razorpayOrderId,
      orderPrice: orderAmount,
      time: new Date(booking.bookingDate).toISOString(),
      department: 'PANDIT_JI_AT_REQUEST',
      products: [
        {
          productName: booking.poojaNameEng || 'PUJA',
          productPrice: orderAmount,
          commissionPercent: [0, 0, 0],
        },
      ],
    };

    console.log(`[PartnerAffiliate] Sending payload for booking ${booking._id}:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`[PartnerAffiliate] ✅ Order sent for booking ${booking._id}. Response:`, response.status, response.data);
  } catch (error: any) {
    const httpStatus = error?.response?.status;
    const responseBody = error?.response?.data;
    const errMsg = error?.message;
    console.error(
      `[PartnerAffiliate] ❌ Failed for booking ${booking?._id}:`,
      `HTTP ${httpStatus ?? 'N/A'} |`,
      responseBody ? JSON.stringify(responseBody) : errMsg,
    );
  }
};

// -------------------------------------------------------------
// TYPES
type CreatePendingBookingBody = {
  userId?: string;             // optional – resolved from phone for Live Mandir
  poojaId?: string;            // optional – resolved from pujaSlug for Live Mandir
  poojaMode: 'online' | 'offline';
  bookingDate: string;
  amount: number;              // total to charge
  panditDakshina?: number;     // optional dakshina portion
  address?: any;
  bhaktName?: string;
  gotra?: string;
  contactNumber?: string;      // used as fallback phone for user lookup
  phone?: string;              // Live Mandir: raw phone field (10-digit)
  emailId?: string;
  deceasedPersons?: Array<{
    name: string;
    gotra: string;
    relation: string;
  }>;
  ritualPerformerName?: string;
  ritualPerformerGotra?: string;
  ritualPlace?: string;
  referralCode?: string;       // partner affiliate ref code (from ?ref= URL param)
  // Whether this booking was placed from the app (vs website). No separate app-specific route
  // exists for this flow today, so this is only ever true if the client explicitly sends it —
  // defaults to false (website-safe) otherwise. Drives the partner-affiliate "first N app
  // orders only" referral cap (see utils/partnerAffiliateReferralCap.ts) — website referrals
  // have no such cap.
  isFromApp?: boolean;
  // ── Live Mandir fields ──
  isLiveMandir?: boolean;
  pujaSlug?: string;
  templeName?: string;
  packageId?: string;
  packageName?: string;
  members?: string;
  wish?: string;
  concern?: string;
  familyMembers?: any[];
  prasadAdded?: boolean;
};

type CompleteBookingBody = {
  pendingBookingId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amountPaid: number;
};

type ProgressAction = 'journey_start' | 'arrived' | 'start_puja' | 'complete_puja';

// -------------------------------------------------------------
// FINALIZE PENDING → FINAL BOOKING (shared by client verify + Razorpay webhook)
// -------------------------------------------------------------
// Every side effect of a confirmed puja booking lives here so the two paths that
// can confirm a payment behave identically:
//
//   1. POST /api/bookings/complete-booking — the browser/app calls this right
//      after the Razorpay checkout handler fires.
//   2. POST /api/payments/razorpay/webhook — Razorpay's server-to-server
//      `payment.captured`. This is the safety net for the exact case this
//      module was written for: the money left the devotee's account but the
//      browser never made the verify call (popup closed, app killed, network
//      drop), so the booking was stranded in PendingPoojaBooking forever.
//
// Whichever path arrives FIRST creates the PoojaBooking, deletes the pending
// doc and fires the notifications; the second one is a no-op (`created: false`).
// The idempotency key is razorpayOrderId, which is unique per booking attempt.
type FinalizeContext = {
  io?: SocketIOServer;
  /** Request-derived attribution — only available on the client path. */
  http?: {
    clientIp?: string | null;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    eventSourceUrl?: string | null;
  };
  amountPaid?: number;
  /** Pandits currently online (app state); empty falls back to tag targeting. */
  activePanditExternalIds?: string[];
};

export async function finalizePendingPoojaBooking(
  pendingDoc: any,
  payment: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature?: string;
  },
  ctx: FinalizeContext = {},
): Promise<{ booking: Document & IPoojaBooking; created: boolean }> {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = payment;

  // Fast path — the other path already promoted this order.
  const existing = (await poojaBookingModel.findOne({ razorpayOrderId })) as
    | (Document & IPoojaBooking)
    | null;
  if (existing) {
    // The pending row may still be around if the first path crashed midway.
    if (pendingDoc?._id) {
      await pendingPoojaBookingModel.findByIdAndDelete(pendingDoc._id);
    }
    return { booking: existing, created: false };
  }

  // ── Atomic claim ──────────────────────────────────────────────────────────
  // The check above is not enough on its own: the browser's verify call and the
  // Razorpay webhook can land at the same instant, both see "no final booking
  // yet", and both create one — a duplicate booking AND a duplicate WhatsApp.
  // Deleting the pending row is the claim: MongoDB guarantees exactly one
  // caller gets the document back, and only that caller creates the booking.
  const claimed = await pendingPoojaBookingModel.findOneAndDelete({ _id: pendingDoc._id });
  if (!claimed) {
    // Someone else claimed it. If they've finished, hand back their booking.
    const winner = (await poojaBookingModel.findOne({ razorpayOrderId })) as
      | (Document & IPoojaBooking)
      | null;
    if (winner) return { booking: winner, created: false };
    // They claimed it but haven't created the booking yet. Throwing is correct:
    // the client gets a 500 it can retry, and Razorpay redelivers the webhook —
    // by then the winner's booking exists and the retry resolves to it.
    throw new Error(
      `Booking for order ${razorpayOrderId} is being finalized by a concurrent request; retry.`,
    );
  }

  const pendingObject = claimed.toObject ? claimed.toObject() : claimed;

  // Create the FINAL booking. If this throws, the pending row is already gone,
  // so restore it — otherwise a paid booking would vanish entirely.
  let finalBooking: Document & IPoojaBooking;
  try {
    finalBooking = (await poojaBookingModel.create({
      ...pendingObject,
      _id: undefined, // new id
      isPaymentDone: true,
      isConfirmed: false, // still needs Pandit confirmation
      razorpayPaymentId,
      razorpayOrderId,
      ...(razorpaySignature && { razorpaySignature }),
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as unknown as (Document & IPoojaBooking);
  } catch (createErr) {
    try {
      await pendingPoojaBookingModel.create(pendingObject);
      console.error(
        `[PujaBooking] Final booking creation failed for order=${razorpayOrderId}; pending row restored for retry.`,
      );
    } catch (restoreErr: any) {
      console.error(
        `[PujaBooking] 🚨 CRITICAL: order=${razorpayOrderId} paid but pending row could not be restored:`,
        restoreErr?.message || restoreErr,
        JSON.stringify(pendingObject),
      );
    }
    throw createErr;
  }

  const amountPaid = ctx.amountPaid;

  // 3) Partner Affiliate notification (fire-and-forget)
  void sendOrderToPartnerAffiliate(finalBooking);

  // 4) META CAPI Purchase (fire-and-forget) — skipped in test/dev mode
  void (async () => {
    if (!isProduction) {
      console.log(`[MetaCAPI][Puja] Skipped (PAYMENT_MODE != production) for orderID=${razorpayOrderId}`);
      return;
    }
    try {
      // `value` is the full amount charged (base seva + prasad box + extra
      // Sankalp names), so a booking with add-ons must not report the base
      // catalog price. The breakdown below is what makes that visible in
      // Events Manager — without it every order looks like one anonymous unit
      // and an inflated value reads as a tracking bug.
      const capiContentId = String((finalBooking as any).poojaNameEng || 'PUJA').trim();
      const extraSankalpNames = Array.isArray((finalBooking as any).familyMembers)
        ? (finalBooking as any).familyMembers.length
        : 0;
      const capiContents = [
        { id: capiContentId, quantity: 1 },
        ...((finalBooking as any).prasadAdded ? [{ id: `${capiContentId} — Prasad Box`, quantity: 1 }] : []),
        ...(extraSankalpNames > 0
          ? [{ id: `${capiContentId} — Sankalp Name`, quantity: extraSankalpNames }]
          : []),
      ];

      await sendMetaPurchaseEvent({
        orderID: String(finalBooking.razorpayOrderId || razorpayOrderId),
        // Dedup key — the webhook and the browser path must not double-count
        // the same purchase in Events Manager.
        eventId: `puja_purchase_${razorpayOrderId}`,
        value: Number((finalBooking as any).amount || amountPaid || 0),
        currency: 'INR',
        contentId: capiContentId,
        contents: capiContents,
        deliveryCategory: (finalBooking as any).address ? 'home_delivery' : 'in_store',
        actionSource: 'website',
        phone: String((finalBooking as any).userPhone || ''),
        email: (finalBooking as any).userEmail || null,
        externalId: String((finalBooking as any).userId || ''),
        clientIp: ctx.http?.clientIp ?? null,
        userAgent: ctx.http?.userAgent || '',
        fbp: ctx.http?.fbp || '',
        fbc: ctx.http?.fbc || '',
        eventSourceUrl:
          ctx.http?.eventSourceUrl ||
          process.env.META_DEFAULT_EVENT_SOURCE_URL ||
          null,
      });

      console.log(`[MetaCAPI][Puja] Purchase sent for orderID=${razorpayOrderId}`);
    } catch (e: any) {
      console.error(
        `[MetaCAPI][Puja] Purchase failed for orderID=${razorpayOrderId}:`,
        e?.response?.data || e?.message || e,
      );
    }
  })();

  // 5) Notify dashboard (socket)
  const io = ctx.io;
  io?.emit('booking:new:all', {
    bookingId: finalBooking.id,
    userName: finalBooking.userName,
    userPhone: finalBooking.userPhone,
    poojaName: finalBooking.poojaNameEng,
    bookingDate: finalBooking.bookingDate,
    mode: finalBooking.poojaMode,
    bhaktName: finalBooking.bhaktName,
    panditDakshina: (finalBooking as any).panditDakshina ?? 0,
  });

  // 5a) 🔔 Fire the 60s timed modal for all "active" pandits
  if (io) {
    const payload = buildTimedRequestPayload(finalBooking);
    io.to('active_pandits').emit('booking:new:timed_request', payload);

    // set a 60s timer to auto-cancel modal if nobody accepted
    const timer = setTimeout(() => {
      io.emit('booking:request:cancelled', { bookingId: finalBooking.id });
      timedRequestTimers.delete(finalBooking.id);
    }, 60_000);
    timedRequestTimers.set(finalBooking.id, timer);
  }

  // ------------------- PUSH NOTIFICATIONS -------------------
  try {
    // (User) Normalize to the exact 10-digit alias you use with OneSignal.login()
    const phone10 = toAlias10((finalBooking as any).userPhone);
    if (phone10 && phone10.length === 10) {
      // (A) ONE immediate push at time of booking
      await sendPushNotification({
        externalIds: [phone10],
        heading: 'Booked Successfully 🙏',
        content: `You have booked a puja: ${finalBooking.poojaNameEng}.`,
        data: {
          screen: 'ActivePujaList',
          bookingId: String((finalBooking as any)._id),
        },
      });

      // (B) ONE scheduled reminder at 00:00 IST on puja day
      await schedulePujaDayReminder({
        externalIds: [phone10],
        heading: 'Your Puja is Today 🙏',
        content: `Reminder: ${finalBooking.poojaNameEng} is today.`,
        data: {
          screen: 'ActivePujaList',
          bookingId: String((finalBooking as any)._id),
        },
        bookingDate: finalBooking.bookingDate,
      });
    } else {
      console.warn('[push] Skipped user push: invalid phone alias:', (finalBooking as any).userPhone);
    }

    // (Pandits) 🛎️ Notify pandits on FINAL creation (default enabled; env flag)
    if (NOTIFY_PANDITS_ON_FINAL) {
      const when = new Date(finalBooking.bookingDate);
      await notifyPanditsForBooking(
        {
          heading: 'New Puja Request',
          content: `${finalBooking.poojaNameEng} on ${when.toDateString()}`,
          data: {
            screen: 'PujaRequestDetail', // product-side route
            bookingId: String((finalBooking as any)._id),
          },
        },
        ctx.activePanditExternalIds ?? [],
      );
    }
  } catch (pushErr) {
    console.error('Push send/schedule failed:', pushErr);
  }

  // 🟢 WhatsApp booking confirmation (fire-and-forget) — for ALL bookings.
  // Sent here (not at create-pending) so it goes out only once the payment
  // is verified. Covers home pujas AND live mandir pujas alike.
  void sendBookingConfirmationWhatsapp(finalBooking);

  // 🟢 Email booking confirmation (fire-and-forget)
  void (async () => {
    try {
      const email = (finalBooking as any).userEmail;
      if (!email) return;
      await sendBookingConfirmationEmail({
        to: email,
        bhaktName: (finalBooking as any).bhaktName || (finalBooking as any).userName || "Devotee",
        poojaName: finalBooking.poojaNameEng || "Puja",
        bookingDate: String(finalBooking.bookingDate),
        poojaMode: finalBooking.poojaMode || "online",
        amount: Number((finalBooking as any).amount || amountPaid || 0),
        contactNumber: String((finalBooking as any).userPhone || ""),
        bookingId: String((finalBooking as any)._id),
      });
      console.log(`✅ [PujaBooking] Email confirmation sent to ${email}`);
    } catch (e: any) {
      console.error("❌ [PujaBooking] Email failed:", e?.message || e);
    }
  })();

  // ── Internal Referral Credit (fire-and-forget) ──────────────
  void (async () => {
    try {
      const bookedUserId = String((finalBooking as any).userId || '');
      if (!bookedUserId) return;

      const bookedUser = await User.findById(bookedUserId).select(
        'userReferral name given_name family_name'
      );
      if (!bookedUser?.userReferral?.referrerId) return;

      const { referrerId, expiresAt } = bookedUser.userReferral;

      // Only honour if the referral window hasn't expired
      if (!expiresAt || new Date() > new Date(expiresAt)) return;

      const totalAmount = Number((finalBooking as any).amount || amountPaid || 0);
      const rewardPct = parseFloat(process.env.INTERNAL_REFERRAL_PCT ?? '5');
      const amountEarned = Math.round((totalAmount * rewardPct) / 100);

      const poojaName = finalBooking.poojaNameEng || 'Puja';
      const referredUserName =
        `${bookedUser.given_name || ''} ${bookedUser.family_name || ''}`.trim() ||
        bookedUser.name ||
        'User';

      // 1) Record the referral booking
      await UserReferralBooking.create({
        referrerId,
        referredUserId: bookedUser._id,
        referredUserName,
        bookingId: (finalBooking as any)._id,
        poojaName,
        amountEarned,
        totalBookingAmount: totalAmount,
        rewardPercentage: rewardPct,
      });

      // 2) Credit referrer + increment counter
      await User.findByIdAndUpdate(referrerId, {
        $inc: { referralEarnings: amountEarned, totalReferredPujas: 1 },
      });

      // 3) Clear referral from the referred user so it isn't applied again
      await User.findByIdAndUpdate(bookedUser._id, {
        $unset: { userReferral: '' },
      });

      console.log(
        `[Referral] ✅ ₹${amountEarned} credited to referrer ${referrerId} for booking ${(finalBooking as any)._id}`
      );
    } catch (refErr: any) {
      console.error('[Referral] ❌ credit failed:', refErr?.message || refErr);
    }
  })();
  // ────────────────────────────────────────────────────────────

  return { booking: finalBooking, created: true };
}

// -------------------------------------------------------------
// RAZORPAY WEBHOOK RECONCILER (called by the shared webhook controller)
// -------------------------------------------------------------
/**
 * Promotes a PendingPoojaBooking to a PoojaBooking when Razorpay reports the
 * payment as captured. This covers BOTH normal pujas and Live Mandir pujas —
 * both use the same pending → final pipeline (see liveMandirRoutes.ts).
 *
 * Returns true when this webhook event belonged to a puja booking, so the
 * dispatcher can log which service handled it.
 */
export async function reconcilePoojaBookingPayment(opts: {
  orderId: string;
  paymentId?: string;
  event: string;
  amountPaise?: number;
  io?: SocketIOServer;
  activePanditExternalIds?: string[];
}): Promise<boolean> {
  const { orderId, paymentId, event, amountPaise, io, activePanditExternalIds } = opts;

  // Already promoted by the client path (or an earlier webhook delivery).
  const alreadyFinal = await poojaBookingModel.exists({ razorpayOrderId: orderId });
  if (alreadyFinal) return true;

  const pendingDoc = await pendingPoojaBookingModel.findOne({ razorpayOrderId: orderId });
  if (!pendingDoc) return false; // not a puja booking order

  if (event === 'payment.failed') {
    // Keep the pending row — the devotee can still retry the payment, and the
    // abandoned-payment nudge relies on it existing.
    console.log(`[RazorpayWebhook][Puja] payment.failed for order=${orderId}; pending booking kept for retry.`);
    return true;
  }

  if (!paymentId) {
    console.warn(`[RazorpayWebhook][Puja] No payment id on ${event} for order=${orderId}; skipping.`);
    return true;
  }

  // Amount sanity check — never confirm a booking for less than it costs.
  if (typeof amountPaise === 'number' && Number.isFinite(amountPaise)) {
    const expectedPaise = Math.round(Number(pendingDoc.amount) * 100);
    if (amountPaise < expectedPaise) {
      console.error(
        `[RazorpayWebhook][Puja] Amount mismatch for order=${orderId}: paid=${amountPaise} expected=${expectedPaise}. Not confirming.`,
      );
      return true;
    }
  }

  const { created } = await finalizePendingPoojaBooking(
    pendingDoc,
    { razorpayPaymentId: paymentId, razorpayOrderId: orderId },
    {
      io,
      amountPaid: typeof amountPaise === 'number' ? amountPaise / 100 : undefined,
      activePanditExternalIds,
    },
  );

  console.log(
    `[RazorpayWebhook][Puja] order=${orderId} → ${created ? 'booking confirmed & pending removed' : 'already confirmed (no-op)'}`,
  );
  return true;
}

// -------------------------------------------------------------
// CREATE PENDING (Pre-payment)
// -------------------------------------------------------------
/** POST /api/bookings/create-pending (Pre-payment) */
export const createPendingBooking: RequestHandler = async (req, res, next) => {
  try {
    const {
      userId,
      poojaId,
      poojaMode,
      bookingDate,
      amount,
      panditDakshina,
      address,
      bhaktName,
      gotra,
      contactNumber,
      phone,
      emailId,
      deceasedPersons,
      ritualPerformerName,
      ritualPerformerGotra,
      ritualPlace,
      referralCode,
      isFromApp,
      isLiveMandir,
      pujaSlug,
      templeName,
      packageId,
      packageName,
      members,
      wish,
      concern,
      familyMembers,
      prasadAdded,
    } = req.body as CreatePendingBookingBody;

    // ── User resolution ──────────────────────────────────────────────────────
    let userExists: any = null;
    if (userId) {
      userExists = await User.findById(userId);
    }
    if (!userExists) {
      // Fallback: resolve by phone (strips country code prefix)
      const rawPhone = String(phone || contactNumber || '').replace(/\D/g, '');
      const alias10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
      if (alias10.length === 10) {
        userExists = await User.findOne({
          $or: [
            { phone: alias10 },
            { phone: `91${alias10}` },
            { phone: { $regex: alias10 + '$' } },
          ],
        });

        if (!userExists) {
          // Auto-register user
          userExists = new User({
            phone: alias10,
            name: bhaktName || 'Guest User',
            isFromApp: false,
            isNotifyOkay: true,
            email_verified: false,
            isActive: true,
            addedOn: new Date(),
          });
          await userExists.save();
        }
      }
    }
    if (!userExists) {
      res.status(400).json({ message: 'A valid 10-digit phone number is required.' });
      return;
    }

    // ── Pooja resolution ─────────────────────────────────────────────────────
    let poojaExists: any = null;
    if (poojaId) {
      poojaExists = await Pooja.findById(poojaId);
    }
    if (!poojaExists && pujaSlug) {
      poojaExists = await Pooja.findOne({ poojaID: pujaSlug });
    }
    if (!poojaExists && (pujaSlug || packageName)) {
      const nameFallback = packageName || pujaSlug || '';
      poojaExists = await Pooja.findOne({ poojaNameEng: new RegExp(nameFallback, 'i') });
    }
    if (!poojaExists) {
      // Last resort: grab any active pooja
      poojaExists = await Pooja.findOne();
    }
    if (!poojaExists) {
      res.status(404).json({ message: 'Pooja not found.' });
      return;
    }

    // short, unique receipt ID (<= 40 chars)
    const hexId = crypto.randomBytes(8).toString('hex').toUpperCase();
    const receiptId = `PARPUJA_${hexId}`;

    // If dakshina is present and amount is total, derive base pooja price safely
    const poojaPrice =
      typeof panditDakshina === 'number'
        ? Math.max(0, Number(amount) - Number(panditDakshina))
        : amount;

    // --- Razorpay Order Creation ---
    const orderOptions: any = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
      notes: {
        userId: String(userId ?? ''),
        poojaId: String(poojaId ?? pujaSlug ?? ''),
        mode: poojaMode,
        amount,
        ...(panditDakshina != null && { panditDakshina: String(panditDakshina) }),
        ...(isLiveMandir && { isLiveMandir: 'true', pujaSlug, templeName }),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // --- Create Pending Booking Record ---
    // For Live Mandir, the pujaSlug is NOT in the Pooja collection, so poojaExists
    // is a fallback (often the first pooja in the DB). Trust the client-sent puja
    // name (packageName) instead so the WhatsApp/booking shows the actual puja booked.
    const poojaNameEng = isLiveMandir
      ? (packageName || pujaSlug || (poojaExists as any).poojaNameEng || 'Live Mandir Puja')
      : ((poojaExists as any).poojaNameEng ?? (packageName ?? pujaSlug ?? ''));
    // For live mandir, use a friendly label if no poojaNameEng
    const resolvedPoojaId = (poojaExists as any)._id;
    const resolvedUserId = (userExists as any)._id;

    const newBooking = await pendingPoojaBookingModel.create({
      userId: resolvedUserId,
      userName: (userExists as any).name,
      userPhone: (userExists as any).phone,
      userEmail: emailId || (userExists as any).email,

      poojaId: resolvedPoojaId,
      poojaNameEng,
      poojaMode,
      bookingDate: new Date(bookingDate),

      // poojaType: live mandir vs normal
      poojaType: isLiveMandir ? 'live_puja_at_mandir' : 'normal_pooja',

      // store both total + base (derived)
      amount,
      poojaPrice,

      // store dakshina if present
      panditDakshina,

      isPaymentDone: false,
      razorpayOrderId: order.id,

      ...((poojaMode === 'offline' || prasadAdded) && { address }),
      bhaktName: bhaktName || (userExists as any).name,
      gotra,
      contactNumber: contactNumber || phone,
      emailId,
      ...(Array.isArray(deceasedPersons) && { deceasedPersons }),
      ...(ritualPerformerName && { ritualPerformerName }),
      ...(ritualPerformerGotra && { ritualPerformerGotra }),
      ...(ritualPlace && { ritualPlace }),
      ...(referralCode && { referralCode }),
      isFromApp: isFromApp === true,
      // ── Live Mandir specific fields ──
      ...(isLiveMandir && {
        isLiveMandir: true,
        pujaSlug,
        templeName,
        packageId,
        packageName,
        members,
        wish,
        concern,
        ...(Array.isArray(familyMembers) && { familyMembers }),
        ...(prasadAdded !== undefined && { prasadAdded }),
      }),
    });

    // 🛎️ NEW: Notify pandits on PENDING creation (optional; controlled via env)
    if (NOTIFY_PANDITS_ON_PENDING) {
      const when = new Date(bookingDate);
      await notifyPanditsNewRequest(req, {
        heading: 'New Puja Request (Pending Payment)',
        content: `${poojaNameEng} requested for ${when.toDateString()}`,
        data: {
          screen: 'PujaRequestList',       // product-side screen route
          pendingId: String((newBooking as any)._id),
        },
      });
    }

    // NOTE: the WhatsApp booking confirmation is intentionally NOT sent here.
    // All bookings (normal + live mandir) take payment via Razorpay, so the
    // confirmation is sent from complete-booking once payment is verified — this
    // avoids confirming a puja the devotee never actually paid for, and keeps the
    // home-puja flow consistent with live mandir / chadhava / shop.

    // Live Mandir payment attempt started -> booking stays pending until payment
    // is verified. If still unpaid after the configured delay, nudge the devotee.
    if (isLiveMandir) {
      scheduleLiveMandirPaymentNudge(String((newBooking as any)._id));
    }

    res.status(201).json({
      message: 'Pre-booking created. Proceed to payment.',
      bookingId: (newBooking as any).id,
      razorpayOrderId: order.id,
      razorpayKeyId: razorpayKeyId,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// COMPLETE (Post-payment)
// -------------------------------------------------------------
/** POST /api/bookings/complete-booking (Post-payment) */
export const completePoojaBooking: RequestHandler = async (req, res, next) => {
  try {
    const {
      pendingBookingId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amountPaid,
    } = req.body as CompleteBookingBody;

    // 1) Fetch Pending Booking
    const pendingDoc = await pendingPoojaBookingModel.findById(pendingBookingId);
    if (!pendingDoc) {
      // The Razorpay webhook may have won the race: it already promoted this
      // order and deleted the pending row. That's a success, not a 404 — return
      // the confirmed booking so the app lands on the right screen.
      const alreadyFinal = razorpayOrderId
        ? await poojaBookingModel.findOne({ razorpayOrderId })
        : null;
      if (alreadyFinal) {
        const tokenForFinal = jwt.sign(
          { id: alreadyFinal.userId },
          process.env.JWT_SECRET || 'supersecretkey',
          { expiresIn: '7d' },
        );
        const userForFinal = await User.findById(alreadyFinal.userId).select(
          'name email phone gotra given_name family_name addedOn'
        );
        res.status(200).json({
          message: 'Pooja booking already confirmed.',
          booking: alreadyFinal,
          token: tokenForFinal,
          user: userForFinal,
        });
        return;
      }
      res.status(404).json({ message: 'Pending booking not found.' });
      return;
    }

    // 2) Cross-check order id
    if (pendingDoc.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({ message: 'Order ID mismatch.' });
      return;
    }

    // 3) Verify Razorpay signature
    const isVerified = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!isVerified) {
      res.status(400).json({ message: 'Payment verification failed (Invalid signature).' });
      return;
    }

    // 4) Verify amount
    if (pendingDoc.amount !== amountPaid) {
      res.status(400).json({ message: 'Amount paid mismatch. Potential fraud or error.' });
      return;
    }

    // 5) Finalize — creates the PoojaBooking, deletes the pending row and fires
    //    every confirmation side effect. Shared with the Razorpay webhook path,
    //    and idempotent on razorpayOrderId so whichever arrives second no-ops.
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]) || req.ip || null;

    const { booking: finalBooking, created } = await finalizePendingPoojaBooking(
      pendingDoc,
      { razorpayPaymentId, razorpayOrderId, razorpaySignature },
      {
        io: req.app.get('io') as SocketIOServer | undefined,
        amountPaid,
        activePanditExternalIds: getActivePanditExternalIdsFromApp(req),
        http: {
          clientIp,
          userAgent: String(req.headers['user-agent'] || ''),
          fbp: String(req.headers['x-fbp'] || (req as any).cookies?._fbp || ''),
          fbc: String(req.headers['x-fbc'] || (req as any).cookies?._fbc || ''),
          eventSourceUrl: String(req.headers['x-event-source-url'] || '') || null,
        },
      },
    );

    const token = jwt.sign({ id: finalBooking.userId }, process.env.JWT_SECRET || "supersecretkey", {
      expiresIn: "7d",
    });
    const user = await User.findById(finalBooking.userId).select(
      "name email phone gotra given_name family_name addedOn"
    );

    res.status(201).json({
      message: created
        ? 'Pooja booking confirmed and payment verified.'
        : 'Pooja booking already confirmed.',
      booking: finalBooking,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// READ / LIST APIS
// -------------------------------------------------------------

/** GET /api/bookings/get-pending-poojabookings/:userPhone */
export const getPendingBookingsByUserPhone: RequestHandler = async (req, res, next) => {
  try {
    const { userPhone } = req.params as { userPhone?: string };
    if (!userPhone) {
      res.status(400).json({ message: 'User phone number is required.' });
      return;
    }

    const alias10 = toAlias10(userPhone);
    if (alias10.length !== 10) {
      res.status(400).json({ message: 'A valid 10-digit phone number is required.' });
      return;
    }
    // Match by the trailing 10 digits so any stored format works:
    // "9876543210", "919876543210", "+91 98765 43210", etc.
    const phoneRegex = new RegExp(`${alias10}$`);

    const [pendingBookings, finalBookings] = await Promise.all([
      pendingPoojaBookingModel
        .find({ userPhone: { $regex: phoneRegex }, isCompleted: false })
        .populate('poojaId', 'poojaNameEng poojaCardImage')
        .populate('assignedPandit', 'firstName lastName rating profileImage')
        .lean(),
      // Return ALL PoojaBookings (no isCompleted filter) so live mandir confirmed bookings appear
      poojaBookingModel
        .find({ userPhone: { $regex: phoneRegex } })
        .populate('poojaId', 'poojaNameEng poojaCardImage')
        .populate('assignedPandit', 'firstName lastName rating profileImage')
        .lean()
    ]);

    const bookings = [...pendingBookings, ...finalBookings].sort(
      (a: any, b: any) => new Date(b.bookingDate ?? b.createdAt).getTime() - new Date(a.bookingDate ?? a.createdAt).getTime()
    );

    console.log(
      `[get-pending-poojabookings] phone=${alias10} → pending=${pendingBookings.length}, final(poojabookings)=${finalBookings.length}, total=${bookings.length}`
    );

    res.status(200).json(bookings || []);
  } catch (error) {
    next(error);
  }
};

/** GET /api/bookings/pending (Admin/Pandit View of active bookings) */
export const getAllPendingBookings: RequestHandler = async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      mode,
      from,
      to,
      onlyUnassigned,
      includeConfirmed,
      assignedPandit,
      sort = '-bookingDate',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { isCompleted: false };
    if (!includeConfirmed) filter.isConfirmed = false;
    if (mode === 'online' || mode === 'offline') filter.poojaMode = mode;

    if (from || to) {
      filter.bookingDate = {};
      if (from) filter.bookingDate.$gte = new Date(from);
      if (to) filter.bookingDate.$lte = new Date(to);
    }

    if (onlyUnassigned === 'true') {
      filter.$or = [{ assignedPandit: { $exists: false } }, { assignedPandit: { $size: 0 } }];
    }

    if (assignedPandit) filter.assignedPandit = assignedPandit;

    if (search && search.trim()) {
      const s = String(search).trim();
      const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        ...(filter.$or || []),
        { userName: rx },
        { userPhone: rx },
        { userEmail: rx },
        { poojaNameEng: rx },
        { bhaktName: rx },
        { gotra: rx },
      ];
    }

    const [items, total] = await Promise.all([
      poojaBookingModel
        .find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limitNum)
        .populate('poojaId', 'poojaNameEng poojaCardImage')
        .populate('assignedPandit', 'firstName lastName rating phone')
        .lean(),
      poojaBookingModel.countDocuments(filter),
    ]);

    res.status(200).json({
      page: pageNum,
      limit: limitNum,
      total,
      hasNext: skip + items.length < total,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/bookings/pending/assigned/:panditId */
export const getPendingBookingsForPandit: RequestHandler = async (req, res, next) => {
  try {
    const { panditId } = req.params as { panditId?: string };
    if (!panditId) { res.status(400).json({ message: 'panditId is required.' }); return; }

    const {
      page = '1',
      limit = '20',
      includeConfirmed,
      from,
      to,
      sort = '-bookingDate',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {
      isCompleted: false,
      assignedPandit: panditId,
    };
    if (!includeConfirmed) filter.isConfirmed = false;

    if (from || to) {
      filter.bookingDate = {};
      if (from) filter.bookingDate.$gte = new Date(from);
      if (to) filter.bookingDate.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      poojaBookingModel
        .find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limitNum)
        .populate('poojaId', 'poojaNameEng poojaCardImage')
        .populate('assignedPandit', 'firstName lastName rating phone')
        .lean(),
      poojaBookingModel.countDocuments(filter),
    ]);

    res.status(200).json({
      page: pageNum,
      limit: limitNum,
      total,
      hasNext: skip + items.length < total,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/bookings/:bookingId */
export const getOnePendingBooking: RequestHandler = async (req, res, next) => {
  try {
    const { bookingId } = req.params as { bookingId?: string };
    if (!bookingId) { res.status(400).json({ message: 'bookingId required' }); return; }

    const doc = await poojaBookingModel
      .findById(bookingId)
      .populate('poojaId', 'poojaNameEng poojaCardImage')
      .lean();

    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/bookings/:bookingId/progress */
export const updatePendingBookingProgress: RequestHandler = async (req, res, next) => {
  try {
    const { bookingId } = req.params as { bookingId?: string };
    const { panditId, action } = req.body as { panditId?: string; action?: ProgressAction };

    if (!bookingId) { res.status(400).json({ message: 'bookingId required' }); return; }
    if (!panditId) { res.status(400).json({ message: 'panditId required' }); return; }
    if (!action) { res.status(400).json({ message: 'action required' }); return; }

    const doc = await poojaBookingModel.findById(bookingId);
    if (!doc) { res.status(404).json({ message: 'Not found' }); return; }

    if (!doc.assignedPandit?.map(String).includes(String(panditId))) {
      res.status(403).json({ message: 'Not your booking' }); return;
    }

    const now = new Date();
    let stage = doc.stage ?? 0;

    switch (action) {
      case 'journey_start':
        stage = Math.max(stage, 1);
        doc.stage = stage;
        doc.journeyStartTime = doc.journeyStartTime || now;
        (doc as any).isPanditReached = false;
        break;
      case 'arrived':
        stage = Math.max(stage, 2);
        doc.stage = stage;
        (doc as any).isPanditReached = true;
        doc.arrivedAt = doc.arrivedAt || now;
        break;
      case 'start_puja':
        stage = Math.max(stage, 3);
        doc.stage = stage;
        (doc as any).isPoojaStarted = true;
        doc.poojaStartTime = doc.poojaStartTime || now;
        (doc as any).isConfirmed = true;
        break;
      case 'complete_puja':
        stage = 4;
        doc.stage = stage;
        (doc as any).isCompleted = true;
        if (!doc.poojaEndTime) doc.poojaEndTime = now;
        if (doc.poojaStartTime && doc.poojaEndTime) {
          const ms = doc.poojaEndTime.getTime() - doc.poojaStartTime.getTime();
          doc.poojaTotalTime = Math.max(0, Math.round(ms / 60000));
        }
        break;
    }

    await doc.save();

    const io = req.app.get('io') as SocketIOServer | undefined;
    io?.emit('booking:progress', {
      bookingId,
      stage: doc.stage,
      isPanditReached: (doc as any).isPanditReached,
      isPoojaStarted: (doc as any).isPoojaStarted,
      isCompleted: (doc as any).isCompleted,
    });

    res.json({ message: 'OK', stage: doc.stage });
  } catch (error) {
    next(error);
  }
};

/** POST /api/bookings/:bookingId/accept */
export const acceptPendingBooking: RequestHandler = async (req, res, next) => {
  try {
    const { bookingId } = req.params as { bookingId?: string };
    const { panditId } = req.body as { panditId?: string };

    if (!bookingId) { res.status(400).json({ message: 'bookingId required' }); return; }
    if (!panditId) { res.status(400).json({ message: 'panditId required' }); return; }

    const target = await poojaBookingModel
      .findById(bookingId)
      .select('_id bookingDate isCompleted')
      .lean();

    if (!target) { res.status(404).json({ message: 'Booking not found' }); return; }
    if (target.isCompleted) { res.status(409).json({ message: 'Booking already completed' }); return; }
    if (!target.bookingDate) { res.status(400).json({ message: 'Booking date missing' }); return; }

    const d = new Date(target.bookingDate);
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);

    const alreadyHasOne = await poojaBookingModel.exists({
      isCompleted: false,
      isConfirmed: true,
      assignedPandit: panditId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
    });
    if (alreadyHasOne) {
      res.status(409).json({ message: 'You already accepted a booking on this date.' });
      return;
    }

    const doc = await poojaBookingModel.findOneAndUpdate(
      {
        _id: bookingId,
        isCompleted: false,
        isConfirmed: false,
        $or: [{ assignedPandit: { $exists: false } }, { assignedPandit: { $size: 0 } }],
      },
      {
        $addToSet: { assignedPandit: panditId },
        $set: { isConfirmed: true },
      },
      { new: true }
    );

    if (!doc) { res.status(409).json({ message: 'Already assigned or confirmed' }); return; }

    const io = req.app.get('io') as SocketIOServer | undefined;
    io?.emit('booking:accepted', { bookingId, assignedPandit: panditId });

    // ⛔ Close any open timed modals everywhere immediately
    const t = timedRequestTimers.get(bookingId);
    if (t) {
      clearTimeout(t);
      timedRequestTimers.delete(bookingId);
    }
    io?.emit('booking:request:cancelled', { bookingId });

    res.status(200).json({ message: 'Accepted', booking: doc });
  } catch (error) {
    next(error);
  }
};

// controller snippet (same file where other handlers live)
export const uploadPoojaCompletionMedia: RequestHandler = async (req, res, next) => {
  try {
    const { bookingId } = req.params as { bookingId?: string };
    const { panditId } = req.body as { panditId?: string };

    if (!bookingId) {
      res.status(400).json({ message: 'bookingId required' });
      return;
    }
    if (!panditId) {
      res.status(400).json({ message: 'panditId required' });
      return;
    }

    const doc = await poojaBookingModel.findById(bookingId);
    if (!doc) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Ensure this pandit is assigned to the booking
    if (!doc.assignedPandit?.map(String).includes(String(panditId))) {
      res.status(403).json({ message: 'Not your booking' });
      return;
    }

    const files = (req.files as any as Array<any>) || [];
    if (!files.length) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }

    // Map uploaded files to media entries
    const uploads = files.map((f: any) => {
      const isImage = String(f.mimetype || '').startsWith('image/');
      const isVideo = String(f.mimetype || '').startsWith('video/');
      const type: 'image' | 'video' = isVideo ? 'video' : 'image';
      return {
        url: f.location,        // public URL from Spaces
        key: f.key,             // object key in bucket
        type,
        mime: f.mimetype,
        size: typeof f.size === 'number' ? f.size : undefined,
        uploadedAt: new Date(),
      };
    });

    // Append to existing media
    const existing = Array.isArray((doc as any).completionMedia)
      ? (doc as any).completionMedia
      : [];
    (doc as any).completionMedia = existing.concat(uploads);

    // Mark completed & stamp timings
    const now = new Date();
    if (!doc.poojaEndTime) doc.poojaEndTime = now;
    if (doc.poojaStartTime && doc.poojaEndTime) {
      const ms = doc.poojaEndTime.getTime() - doc.poojaStartTime.getTime();
      doc.poojaTotalTime = Math.max(0, Math.round(ms / 60000));
    }
    (doc as any).isCompleted = true;
    doc.stage = 4;

    await doc.save();

    // Broadcast completion (optional)
    const io = req.app.get('io') as SocketIOServer | undefined;
    io?.emit('booking:completed', { bookingId: doc._id.toString() });

    res.status(200).json({
      message: 'Puja media uploaded and booking marked completed.',
      uploaded: uploads,
      booking: doc.toObject(),
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
};
