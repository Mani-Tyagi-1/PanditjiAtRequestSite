import { RequestHandler } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import pendingPoojaBookingModel from '../../model/poojaBooking/pendingPoojaBooking.model';
import poojaBookingModel, { IPoojaBooking } from '../../model/poojaBooking/poojaBooking.model';
import User from '../../model/userApp/userModel';
import Pooja from '../../model/userApp/poojaModel';
import UserReferralBooking from '../../model/userApp/userReferralBooking.model';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendPushNotification, schedulePujaDayReminder } from '../../utils/oneSignal';
import { sendMetaPurchaseEvent } from '../../utils/metaCapiServices';
import { sendWhatsappTemplateMessage } from '../../utils/whatsapp';
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

async function notifyPanditsNewRequest(req: any, opts: {
  heading: string;
  content: string;
  data: Record<string, any>;
}) {
  try {
    const externalIds = getActivePanditExternalIdsFromApp(req);

    await sendPushNotification({
      externalIds: externalIds.length ? externalIds : undefined,
      heading: opts.heading,
      content: opts.content,
      data: opts.data,
      // fallback to tags when no specific IDs (optionally add city/lang)
      tagFilter: { /* city: '...', lang: '...' */ },
    });
  } catch (e) {
    console.error('notifyPanditsNewRequest failed:', e);
  }
}


// -------------------------------------------------------------
// TYPES
type CreatePendingBookingBody = {
  userId: string;
  poojaId: string;
  poojaMode: 'online' | 'offline';
  bookingDate: string;
  amount: number;              // total to charge
  panditDakshina?: number;     // optional dakshina portion
  address?: any;
  bhaktName?: string;
  gotra?: string;
  contactNumber?: string;
  emailId?: string;
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
      emailId,
    } = req.body as CreatePendingBookingBody;

    const [userExists, poojaExists] = await Promise.all([
      User.findById(userId),
      Pooja.findById(poojaId),
    ]);
    if (!userExists) { res.status(404).json({ message: 'User not found.' }); return; }
    if (!poojaExists) { res.status(404).json({ message: 'Pooja not found.' }); return; }

    // short, unique receipt ID (<= 40 chars)
    const hexId = crypto.randomBytes(8).toString('hex').toUpperCase();
    const receiptId = `PARPUJA_${hexId}`;

    // If dakshina is present and amount is total, derive base pooja price safely
    const poojaPrice =
      typeof panditDakshina === 'number'
        ? Math.max(0, Number(amount) - Number(panditDakshina))
        : amount;

    // --- Razorpay Order Creation ---
    const orderOptions = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1,
      notes: {
        userId,
        poojaId,
        mode: poojaMode,
        amount,
        ...(panditDakshina != null && { panditDakshina: String(panditDakshina) }),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // --- Create Pending Booking Record ---
    const poojaNameEng = (poojaExists as any).poojaNameEng ?? '';

    const newBooking = await pendingPoojaBookingModel.create({
      userId,
      userName: (userExists as any).name,
      userPhone: (userExists as any).phone,
      userEmail: (userExists as any).email,

      poojaId,
      poojaNameEng,
      poojaMode,
      bookingDate: new Date(bookingDate),

      // store both total + base (derived)
      amount,
      poojaPrice,

      // store dakshina if present
      panditDakshina,

      isPaymentDone: false,
      razorpayOrderId: order.id,

      ...(poojaMode === 'offline' && { address }),
      bhaktName,
      gotra,
      contactNumber,
      emailId,
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

    // 5) Create FINAL booking
    const finalBooking = (await poojaBookingModel.create({
      ...pendingDoc.toObject(),
      _id: undefined, // new id
      isPaymentDone: true,
      isConfirmed: false, // still needs Pandit confirmation
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as unknown as (Document & IPoojaBooking);

    // 6) Remove pending doc
    await pendingPoojaBookingModel.findByIdAndDelete(pendingBookingId);

    // 6a) META CAPI Purchase (fire-and-forget) — skipped in test/dev mode
    void (async () => {
      if (!isProduction) {
        console.log(`[MetaCAPI][Puja] Skipped (PAYMENT_MODE != production) for orderID=${razorpayOrderId}`);
        return;
      }
      try {
        const forwardedFor = req.headers['x-forwarded-for'];
        const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]) || req.ip || null;

        await sendMetaPurchaseEvent({
          orderID: String(finalBooking.razorpayOrderId || razorpayOrderId),
          value: Number((finalBooking as any).amount || amountPaid || 0),
          currency: 'INR',
          contentId: String((finalBooking as any).poojaNameEng || 'PUJA').trim(),
          deliveryCategory: (finalBooking as any).address ? 'home_delivery' : 'in_store',
          actionSource: 'website',
          phone: String((finalBooking as any).userPhone || ''),
          email: (finalBooking as any).userEmail || null,
          externalId: String((finalBooking as any).userId || ''),
          clientIp,
          userAgent: String(req.headers['user-agent'] || ''),
          fbp: String(req.headers['x-fbp'] || (req as any).cookies?._fbp || ''),
          fbc: String(req.headers['x-fbc'] || (req as any).cookies?._fbc || ''),
          eventSourceUrl:
            String(req.headers['x-event-source-url'] || '') ||
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

    // 7) Notify dashboard (socket)
    const io = req.app.get('io') as SocketIOServer | undefined;
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

    // 7a) 🔔 NEW: Fire the 60s timed modal for all "active" pandits (can be narrowed by area later)
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

      // (Pandits) 🛎️ NEW: Notify pandits on FINAL creation (default enabled; env flag)
      if (NOTIFY_PANDITS_ON_FINAL) {
        const when = new Date(finalBooking.bookingDate);
        await notifyPanditsNewRequest(req, {
          heading: 'New Puja Request',
          content: `${finalBooking.poojaNameEng} on ${when.toDateString()}`,
          data: {
            screen: 'PujaRequestDetail', // product-side route
            bookingId: String((finalBooking as any)._id),
          },
        });
      }
    } catch (pushErr) {
      console.error('Push send/schedule failed:', pushErr);
    }
    // ----------------------------------------------------------

    // 🟢 WhatsApp booking confirmation (fire-and-forget)
    void (async () => {
      try {
        const rawPhone = String((finalBooking as any).userPhone || '');
        const phone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

        if (rawPhone.length < 10) return;

        const poojaName = finalBooking.poojaNameEng || 'Puja';
        const poojaMode = finalBooking.poojaMode   || 'offline';

        await sendWhatsappTemplateMessage({
          to: phone,
          templateName: 'bookingconfirmed_pjar',
          headerImageUrl: 'https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/THANYOU%20(1).png',
          parameters: [poojaName, poojaMode],
        });
        console.log(`✅ [PujaBooking] WhatsApp confirmation sent to ${phone}`);
      } catch (e: any) {
        console.error('❌ [PujaBooking] WhatsApp failed:', e?.response?.data || e?.message || e);
      }
    })();
    // ----------------------------------------------------------

    // ── Internal Referral Credit (fire-and-forget) ──────────────
    void (async () => {
      try {
        const bookedUserId = String((finalBooking as any).userId || '');
        if (!bookedUserId) return;

        const bookedUser = await User.findById(bookedUserId).select(
          'userReferral name given_name family_name'
        );
        if (!bookedUser?.userReferral?.referrerId) return;

        const { referrerId, expiresAt, code } = bookedUser.userReferral;

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

    res.status(201).json({
      message: 'Pooja booking confirmed and payment verified.',
      booking: finalBooking,
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
    const bookings = await poojaBookingModel
      .find({ userPhone: alias10, isCompleted: false })
      .sort({ bookingDate: -1 })
      .populate('poojaId', 'poojaNameEng poojaCardImage')
      .populate('assignedPandit', 'firstName lastName rating profileImage')
      .lean();

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
