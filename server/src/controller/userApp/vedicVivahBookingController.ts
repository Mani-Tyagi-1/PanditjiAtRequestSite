/**
 * Vedic Vivah Sanskar — WEBSITE controller
 * ============================================================================
 * A direct port of the app server's `vedicVivahBookingController.ts`
 * (RahulPanditJiAtRequest/server). Same collection, same admin-managed catalog,
 * same pricing maths, same Razorpay contract — so a booking made on
 * panditjiatrequest.com is indistinguishable, operationally, from one made in
 * the app, and SuperAdmin/the pandit app handle both without any change.
 *
 * The ONLY intentional differences (all of them "where did this come from"):
 *
 *   1. Every document this file writes carries `platform: "web"`. The app
 *      server stamps `platform: "app"`. Nothing else discriminates the two.
 *   2. Meta CAPI purchase events are sent with `actionSource: "website"`
 *      (the app sends "app"), so Events Manager attributes correctly.
 *   3. WhatsApp goes through the site's `sendOrderConfirmationTemplate`
 *      wrapper (same `pjar_booking` template, plus the site's automatic
 *      fallback to `pjar_order` when 132001 fires).
 *   4. Re-engagement nudges are FORWARDED to the app server (which owns the
 *      BullMQ queue + worker) instead of being scheduled here. If
 *      `PJAR_APP_API_URL` isn't configured the endpoints degrade to a quiet
 *      no-op rather than failing the request.
 *
 * Ops/pandit endpoints (assign pandit team, tick a ritual done, schedule the
 * ritual calendar, the pandit-app feed) intentionally live ONLY on the app
 * server — VedicSuperAdmin and the pandit app already point there, and since
 * both servers share this collection those endpoints already operate on
 * website bookings too. Duplicating them here would only create a second,
 * drift-prone ops surface.
 */

import { RequestHandler } from "express";
import crypto from "crypto";
import axios from "axios";
import Razorpay from "razorpay";
import VedicVivahBooking from "../../model/userApp/vedicVivahBookingModel";
import { sanitizeAttribution } from "../../utils/marketingAttribution";
import {
  loadVivahCatalog,
  NormalisedCatalog,
  IVivahPackage,
  effectiveAdvancePercent,
} from "../../model/userApp/vivahCatalogModel";
import ShopifyProduct from "../../model/userApp/shopifyProductModel";
import {
  sendOrderConfirmationTemplate,
  ORDER_TEMPLATE_HEADER_IMAGE,
} from "../../utils/whatsapp";
import { sendPjarOrderToPartnerAffiliate } from "../../utils/partnerAffiliateCommission";
import { sendBookingEmailFor } from "../../utils/sendBookingEmail";

/** Stamped on every document written by this (website) server. */
const PLATFORM = "web" as const;

/* ============================================================================
   Razorpay setup (mirrors the chadhava / paid-consultation controllers)
   ============================================================================ */
const isProduction = process.env.PAYMENT_MODE === "production";
const allowSimulatedPayments = process.env.ALLOW_SIMULATED_PAYMENTS === "true";
const razorpayKeyId = isProduction
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;
const razorpayKeySecret = isProduction
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

// Deliberately tolerant (unlike chadhavaController, which throws at import):
// a missing key must not take the whole website API down at boot — the catalog,
// SEO and callback-request endpoints stay useful without a payment gateway.
let razorpay: any;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
} else {
  console.warn("⚠️ [Vivah] Razorpay credentials missing — paid bookings disabled.");
}

const verifySignature = (orderId: string, paymentId: string, signature: string): boolean => {
  if (
    allowSimulatedPayments &&
    !isProduction &&
    orderId.startsWith("order_simulated_") &&
    signature?.startsWith("sig_simulated_")
  ) {
    return true;
  }
  if (!razorpayKeySecret) return false;
  const hmac = crypto.createHmac("sha256", razorpayKeySecret as string);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};

/* ============================================================================
   WhatsApp — the approved `pjar_booking` template (image header + 4 body params)
   ============================================================================ */
const PJAR_APP_DEEPLINK = "apps/details?id=com.panditJiAtReqapp";

/** Normalise a 10-digit Indian number to "91XXXXXXXXXX". */
const normalisePhone = (raw: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

/**
 * Send the pjar_booking template. Never throws — callers use it
 * fire-and-forget. Returns true when WhatsApp accepted the message, so the
 * caller can flip its "already sent" idempotency flag honestly.
 */
const vivahWhatsapp = async (
  to: string,
  name: string,
  line2: string,
  line3: string,
  line4: string,
  tag = "Vivah"
): Promise<boolean> => {
  try {
    const phone = normalisePhone(to);
    if (phone.replace(/\D/g, "").length < 10) return false;
    await sendOrderConfirmationTemplate({
      to: phone,
      parameters: [name || "Yajaman", line2 || "", line3 || "", line4 || ""],
      headerImageUrl: ORDER_TEMPLATE_HEADER_IMAGE,
      buttonUrlParam: PJAR_APP_DEEPLINK,
      languageCode: "en",
    });
    console.log(`✅ [${tag}] WhatsApp sent to ${phone}`);
    return true;
  } catch (e: any) {
    console.error(`❌ [${tag}] WhatsApp failed:`, e?.response?.data || e?.message || e);
    return false;
  }
};

/* ============================================================================
   Re-engagement nudges — forwarded to the app server (owner of the queue)
   ============================================================================ */
const APP_API_URL = (process.env.PJAR_APP_API_URL || "").replace(/\/+$/, "");

/**
 * Ask the app server to schedule/cancel a nudge. The app server owns the BullMQ
 * queue and the worker that actually sends the WhatsApp; the website just
 * relays the signal. Fire-and-forget: a nudge is a nice-to-have and must never
 * fail a booking. No-ops (quietly) when PJAR_APP_API_URL isn't configured.
 */
const relayNudge = async (body: Record<string, any>): Promise<boolean> => {
  if (!APP_API_URL) return false;
  try {
    await axios.post(`${APP_API_URL}/bookings/vedic-vivah/nudge`, body, { timeout: 5000 });
    return true;
  } catch (e: any) {
    console.error("⚠️ [Vivah] nudge relay failed:", e?.message || e);
    return false;
  }
};

/* ============================================================================
   Pricing — SERVER-SIDE source of truth is the admin-managed catalog
   (collection `vivah_catalog`, edited in VedicSuperAdmin). The client never
   decides the price; we always recompute from the catalog by `slug`.
   ============================================================================ */
type IncomingStep = {
  stepId?: string;
  id?: string;
  /** Date the family chose for THIS ritual (DD/MM/YYYY). "" = we schedule it. */
  scheduledDate?: string;
  /** Time the family chose for THIS ritual (HH:mm). */
  scheduledTime?: string;
};
type IncomingAddOn = { shopifyProductId?: string; id?: string; qty?: number };

type BuiltSteps = {
  steps: {
    stepId: string;
    title: string;
    price: number;
    samagriPrice: number;
    completed: boolean;
    scheduledDate: string;
    scheduledTime: string;
  }[];
  baseAmount: number;
  samagriAmount: number;
  total: number; // rituals/package total (add-ons are layered on separately)
  isSampooranPackage: boolean;
  pkg: IVivahPackage | null; // resolved marriage package tier (₹21k/₹51k/₹1.11L)
};

type BuiltAddOns = {
  addOns: { shopifyProductId: string; title: string; image: string; price: number; qty: number }[];
  addOnAmount: number;
};

/**
 * Normalise the client's request into priced steps.
 * - Marriage package tier → all-inclusive price from the catalog.
 * - Full "Sampooran Vivah" package → price from `sampooranVivah`, steps = all
 *   active catalog rituals (for progress tracking).
 * - Individual rituals → sum the selected catalog rows.
 * Samagri cost is added ONLY when the family asks us to arrange samagri.
 */
/**
 * Per-ritual scheduling
 * ---------------------------------------------------------------------------
 * A Vedic vivah is not one appointment — Kundali Milan happens months before
 * the wedding, Tilak/Shagun a few days before, the Vivah Sanskar on the day
 * itself and Mandir Darshan after. So the family gives us a date PER RITUAL,
 * not one date for the whole booking.
 *
 * These are accepted for every pricing branch (package, sampooran and
 * a-la-carte) because a package's rituals are derived from the catalog rather
 * than from the request body — without a lookup keyed by slug, a family who
 * bought a package could never date their own ceremonies.
 *
 * Blank is legitimate and means "our team will fix this with you", so nothing
 * is rejected here; the values are only sanitised.
 */
const cleanSchedDate = (v: unknown): string => {
  const raw = String(v ?? "").trim();
  // DD/MM/YYYY only — anything else is dropped rather than half-stored.
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = Number(dd), mo = Number(mm), y = Number(yyyy);
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 2000 || y > 2100) return "";
  return raw;
};

const cleanSchedTime = (v: unknown): string => {
  const raw = String(v ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m) return "";
  const h = Number(m[1]), mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return "";
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

/** stepId → {scheduledDate, scheduledTime} taken from whatever the client sent. */
const scheduleFromBody = (
  selectedSteps: IncomingStep[]
): Record<string, { scheduledDate: string; scheduledTime: string }> => {
  const out: Record<string, { scheduledDate: string; scheduledTime: string }> = {};
  for (const s of selectedSteps || []) {
    const id = String(s?.stepId || s?.id || "").trim();
    if (!id) continue;
    out[id] = {
      scheduledDate: cleanSchedDate(s?.scheduledDate),
      scheduledTime: cleanSchedTime(s?.scheduledTime),
    };
  }
  return out;
};

const buildSteps = (
  selectedSteps: IncomingStep[],
  catalog: NormalisedCatalog,
  opts: { samagriNeeded: boolean; isSampooranPackage: boolean; packageId?: string }
): BuiltSteps => {
  const samagriNeeded = opts.samagriNeeded;
  // Built once and applied to EVERY branch below, so a package booking can
  // carry the family's per-ritual dates just as an a-la-carte one does.
  const plan = scheduleFromBody(selectedSteps);
  const planFor = (slug: string) =>
    plan[slug] || { scheduledDate: "", scheduledTime: "" };

  const packageId = String(opts.packageId || "").trim();
  if (packageId) {
    const pkg = catalog.packageMap[packageId];
    if (pkg) {
      const wanted =
        !pkg.includesAllRituals && pkg.ritualSlugs?.length ? new Set(pkg.ritualSlugs) : null;
      const steps = catalog.rituals
        .filter((r) => r.isActive !== false && (!wanted || wanted.has(r.slug)))
        .map((r) => ({
          stepId: r.slug,
          title: r.name,
          price: r.price || 0,
          samagriPrice: r.samagriPrice || 0,
          completed: false,
          ...planFor(r.slug),
        }));
      const baseAmount = pkg.price || 0; // all-inclusive (samagri + pandits + gifts)
      return {
        steps,
        baseAmount,
        samagriAmount: 0,
        total: baseAmount,
        isSampooranPackage: false,
        pkg,
      };
    }
    // Unknown packageId → fall through to steps/sampooran handling below.
  }

  if (opts.isSampooranPackage) {
    const steps = catalog.rituals
      .filter((r) => r.isActive !== false)
      .map((r) => ({
        stepId: r.slug,
        title: r.name,
        price: r.price || 0,
        samagriPrice: r.samagriPrice || 0,
        completed: false,
        ...planFor(r.slug),
      }));
    const baseAmount = catalog.sampooranVivah?.packagePrice || 0;
    const samagriAmount = samagriNeeded ? catalog.sampooranVivah?.samagriPrice || 0 : 0;
    return {
      steps,
      baseAmount,
      samagriAmount,
      total: baseAmount + samagriAmount,
      isSampooranPackage: true,
      pkg: null,
    };
  }

  const seen = new Set<string>();
  const steps: BuiltSteps["steps"] = [];
  for (const s of selectedSteps || []) {
    const stepId = String(s?.stepId || s?.id || "").trim();
    const ritual = catalog.ritualMap[stepId];
    if (!stepId || seen.has(stepId) || !ritual || ritual.isActive === false) continue;
    seen.add(stepId);
    steps.push({
      stepId,
      title: ritual.name,
      price: ritual.price || 0,
      samagriPrice: ritual.samagriPrice || 0,
      completed: false,
      ...planFor(stepId),
    });
  }
  const baseAmount = steps.reduce((sum, s) => sum + s.price, 0);
  const samagriAmount = samagriNeeded ? steps.reduce((sum, s) => sum + s.samagriPrice, 0) : 0;
  return {
    steps,
    baseAmount,
    samagriAmount,
    total: baseAmount + samagriAmount,
    isSampooranPackage: false,
    pkg: null,
  };
};

/**
 * Cross-sell add-ons: re-price every requested shop product SERVER-SIDE from
 * the synced Shopify catalog (never trust client prices). Unknown/inactive
 * products are silently dropped; qty is clamped to 1–9.
 */
const buildAddOns = async (addOnProducts: IncomingAddOn[]): Promise<BuiltAddOns> => {
  const requested = new Map<string, number>();
  for (const a of addOnProducts || []) {
    const id = String(a?.shopifyProductId || a?.id || "").trim();
    if (!id) continue;
    const qty = Math.min(9, Math.max(1, Math.round(Number(a?.qty) || 1)));
    requested.set(id, (requested.get(id) || 0) + qty);
  }
  if (!requested.size) return { addOns: [], addOnAmount: 0 };

  const docs = await ShopifyProduct.find({
    shopifyProductId: { $in: Array.from(requested.keys()) },
    status: { $in: ["active", "ACTIVE"] },
  })
    .select("shopifyProductId title featuredImage priceRangeV2")
    .lean();

  const addOns: BuiltAddOns["addOns"] = [];
  for (const d of docs as any[]) {
    const price = Math.round(Number(d?.priceRangeV2?.minVariantPrice?.amount || 0));
    if (!Number.isFinite(price) || price <= 0) continue;
    addOns.push({
      shopifyProductId: String(d.shopifyProductId),
      title: String(d.title || ""),
      image: String(d?.featuredImage?.url || ""),
      price,
      qty: Math.min(9, requested.get(String(d.shopifyProductId)) || 1),
    });
  }
  const addOnAmount = addOns.reduce((s, a) => s + a.price * a.qty, 0);
  return { addOns, addOnAmount };
};

/** Advance payable now — admin-configurable % (package override → catalog default). */
const advanceOf = (total: number, percent: number) =>
  Math.min(total, Math.max(1, Math.round((total * percent) / 100)));

/**
 * Trust the VERIFIED token over any client-sent userId. `authMiddleware` sets
 * `req.userID` from the signed JWT; that is authoritative. We fall back to the
 * body only for unauthenticated routes (consultation), so nothing breaks.
 */
const resolveUserId = (req: any): string | null =>
  String(req.userID || req.body?.userId || "").trim() || null;

/**
 * Server-side Kundali Milan validation. When à-la-carte Kundali Milan is
 * selected, the family must supply EITHER complete birth details for both
 * Var & Vadhu, OR an uploaded kundali image for both. Prevents paying for a
 * matching service with no data to match (a guaranteed fulfilment failure).
 */
const validateKundali = (
  body: any,
  built: { isSampooranPackage: boolean; pkg?: IVivahPackage | null; steps: { stepId: string }[] }
): string | null => {
  const required =
    !built.isSampooranPackage && !built.pkg && built.steps.some((s) => s.stepId === "kundali-milan");
  if (!required) return null;

  const mode = body.kundaliMode === "upload" ? "upload" : "details";
  if (mode === "upload") {
    if (!String(body.kundaliBoyUrl || "").trim() || !String(body.kundaliGirlUrl || "").trim()) {
      return "Please upload both the Var (groom) and Vadhu (bride) kundali images.";
    }
    return null;
  }
  const ok = (p: any) =>
    p &&
    String(p.name || "").trim() &&
    String(p.dob || "").trim() &&
    String(p.tob || "").trim() &&
    String(p.pob || "").trim();
  if (!ok(body.boy) || !ok(body.girl)) {
    return "Please enter the full birth details (name, date, time and place of birth) for both the Var and Vadhu.";
  }
  return null;
};

/**
 * Cancellation refund policy (backs the "Free Reschedule & Cancellation" badge):
 *   • ≥ 7 days before the event  → 100% of amount paid
 *   • 3–6 days before            → 50%
 *   • < 3 days / no date         → 0% (pandit & samagri already committed)
 * `eventDate` is stored as DD/MM/YYYY (or "" when muhurat help is requested).
 */
const parseEventDate = (s?: string): Date | null => {
  const m = String(s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
};

export const computeRefund = (amountPaid: number, eventDate?: string, now = new Date()) => {
  const evt = parseEventDate(eventDate);
  if (!evt) return { pct: 0, amount: 0, band: "no-date" as const };
  const days = Math.floor((evt.getTime() - now.getTime()) / 86400000);
  let pct = 0;
  if (days >= 7) pct = 100;
  else if (days >= 3) pct = 50;
  const amount = Math.round((amountPaid * pct) / 100);
  return {
    pct,
    amount,
    band: days >= 7 ? ("full" as const) : days >= 3 ? ("half" as const) : ("none" as const),
  };
};

/**
 * Live-darshan temple + Kashi-pandit + muhurat extras, computed SERVER-SIDE
 * from the admin catalog. Temple darshan is PAID for single-ritual bookings and
 * FREE inside the Raj (1) & Maharaja (all) tiers.
 */
type BuiltExtras = {
  liveDarshanTemple: {
    templeId: string;
    name: string;
    city: string;
    image: string;
    price: number;
    isFree: boolean;
  } | null;
  templeAmount: number;
  kashiPandit: { invited: boolean; panditName: string; premiumAmount: number } | null;
  kashiAmount: number;
  selectedMuhurat: { date: string; day: string; tithi: string; nakshatra: string } | null;
  isPreBooking: boolean;
};

const buildExtras = (body: any, catalog: NormalisedCatalog, built: BuiltSteps): BuiltExtras => {
  // ── Live-darshan temple (paid for single rituals; free inside Raj/Maharaja) ──
  let liveDarshanTemple: BuiltExtras["liveDarshanTemple"] = null;
  let templeAmount = 0;
  const templeId = String(body.liveDarshanTempleId || body.templeId || "").trim();
  if (templeId) {
    const t = catalog.templeMap[templeId];
    if (t) {
      const pkg = built.pkg;
      const includedFree =
        !!pkg && (pkg.freeTempleDarshan === true || (pkg.templeDarshanCount || 0) > 0);
      const price = includedFree ? 0 : Math.max(0, Math.round(Number(t.price) || 0));
      liveDarshanTemple = {
        templeId: t.templeId,
        name: t.name,
        city: t.city || "",
        image: t.image || "",
        price,
        isFree: includedFree,
      };
      templeAmount = price;
    }
  }

  // ── Invite a Pandit Ji from Kashi (premium add-on) ──
  let kashiPandit: BuiltExtras["kashiPandit"] = null;
  let kashiAmount = 0;
  const kashiName = String(body.kashiPanditName || "").trim();
  const wantsKashi =
    body.inviteKashiPandit === true || body.kashiInvited === true || kashiName.length > 0;
  if (
    wantsKashi &&
    catalog.kashi &&
    catalog.kashi.enabled !== false &&
    catalog.kashi.isActive !== false
  ) {
    const premium = Math.max(0, Math.round(Number(catalog.kashi.premiumPrice) || 0));
    kashiPandit = { invited: true, panditName: kashiName, premiumAmount: premium };
    kashiAmount = premium;
  }

  // ── Chosen shubh muhurat snapshot ──
  let selectedMuhurat: BuiltExtras["selectedMuhurat"] = null;
  const m = body.selectedMuhurat;
  if (m && typeof m === "object" && m.date) {
    selectedMuhurat = {
      date: String(m.date),
      day: String(m.day || ""),
      tithi: String(m.tithi || ""),
      nakshatra: String(m.nakshatra || ""),
    };
  }

  // ── Instant vs pre-booked (future-dated) marriage ──
  let isPreBooking = body.isPreBooking === true || body.bookingMode === "prebook";
  if (!isPreBooking) {
    const evt = parseEventDate(body.eventDate) || parseEventDate(selectedMuhurat?.date);
    if (evt && evt.getTime() - Date.now() > 45 * 86400000) isPreBooking = true;
  }

  return { liveDarshanTemple, templeAmount, kashiPandit, kashiAmount, selectedMuhurat, isPreBooking };
};

/** Build the booking document from request body (shared by lead + order). */
const buildBookingFields = (
  body: any,
  built: BuiltSteps,
  resolvedUserId: string | null | undefined,
  addOns: BuiltAddOns,
  advancePercent: number,
  catalog: NormalisedCatalog
) => {
  const kundaliRequired = built.steps.some((s) => s.stepId === "kundali-milan");
  const samagriNeeded = body.samagriNeeded === undefined ? true : !!body.samagriNeeded;
  const extras = buildExtras(body, catalog, built);
  const grandTotal = built.total + addOns.addOnAmount + extras.templeAmount + extras.kashiAmount;
  return {
    // Channel stamp — server-side only, never read from the request body.
    platform: PLATFORM,
    // token-derived userId wins over any client-sent value
    userId: resolvedUserId ?? body.userId ?? null,
    referralCode: String(body.referralCode || "").trim().toUpperCase(),
    // Which campaign brought this yajaman in. `referralCode` above is the
    // OFFLINE tie-up (a planner or venue handing out a code); this is the
    // online ad that produced the click. They answer different questions and
    // a booking can carry both.
    ...(sanitizeAttribution(body.attribution)
      ? { attribution: sanitizeAttribution(body.attribution) }
      : {}),
    devoteeName: String(body.devoteeName || "").trim(),
    whatsapp: String(body.whatsapp || "").trim(),
    email: body.email || "",
    eventDate: body.eventDate || "",
    eventTime: body.eventTime || "",
    needMuhuratHelp: !!body.needMuhuratHelp,
    language: body.language || "",
    samagriNeeded,
    notes: body.notes || "",
    address: {
      street: body?.address?.street || "",
      pincode: body?.address?.pincode || "",
      city: body?.address?.city || "",
      state: body?.address?.state || "",
    },
    kundaliRequired,
    kundaliMode: body.kundaliMode === "upload" ? "upload" : "details",
    kundaliUploadUrl: body.kundaliUploadUrl || "", // legacy single upload (back-compat)
    kundaliBoyUrl: body.kundaliBoyUrl || "", // Var (groom) kundali
    kundaliGirlUrl: body.kundaliGirlUrl || "", // Vadhu (bride) kundali
    boy: kundaliRequired ? body.boy || {} : {},
    girl: kundaliRequired ? body.girl || {} : {},
    selectedSteps: built.steps,
    isSampooranPackage: built.isSampooranPackage,

    packageId: built.pkg?.packageId || "",
    packageName: built.pkg?.name || "",
    panditCount: built.pkg?.panditCount || 1,
    hasCoordinator: !!built.pkg?.hasCoordinator,
    packageGifts: (built.pkg?.gifts || []).map((g) => ({
      title: g.title,
      image: g.image || "",
      images: g.images || [],
      description: g.description || "",
      count: g.count || 1,
      price: g.price || 0,
      forWhom: g.forWhom || "",
      ritualSlug: g.ritualSlug || "",
      shopifyProductId: g.shopifyProductId || "",
    })),

    addOnProducts: addOns.addOns,
    addOnAmount: addOns.addOnAmount,

    liveDarshanTemple: extras.liveDarshanTemple,
    templeAmount: extras.templeAmount,
    kashiPandit: extras.kashiPandit,
    kashiAmount: extras.kashiAmount,
    selectedMuhurat: extras.selectedMuhurat,
    isPreBooking: extras.isPreBooking,

    baseAmount: built.baseAmount,
    samagriAmount: built.samagriAmount,
    totalAmount: grandTotal,
    advancePercent,
    advanceAmount: advanceOf(grandTotal, advancePercent),
  };
};

const stepTitles = (steps: any[]) => steps.map((s) => s.title).join(", ");

const selectionLabel = (built: {
  isSampooranPackage: boolean;
  pkg?: IVivahPackage | null;
  steps: any[];
}) =>
  built.pkg
    ? `${built.pkg.name} Package (${built.pkg.panditCount} Pandit Ji${
        built.pkg.panditCount > 1 ? "s" : ""
      }${built.pkg.hasCoordinator ? " + Coordinator" : ""})`
    : built.isSampooranPackage
      ? "Sampooran Vivah (Complete Package)"
      : stepTitles(built.steps);

/* ============================================================================
   0) GET CATALOG  (public — the site renders prices/names/samagri from this)
   ============================================================================ */
export const getVivahCatalog: RequestHandler = async (_req, res) => {
  try {
    const catalog = await loadVivahCatalog();

    // Resolve shop products in ONE query: cross-sell picks + any package gift
    // linked to a live product (so gifts always show real images & worth).
    const giftIds = catalog.packages.flatMap((p) =>
      (p.gifts || []).map((g) => g.shopifyProductId).filter(Boolean)
    ) as string[];
    const wantedIds = Array.from(new Set([...catalog.crossSellProductIds, ...giftIds]));

    const productMap: Record<string, any> = {};
    if (wantedIds.length) {
      const docs = await ShopifyProduct.find({
        shopifyProductId: { $in: wantedIds },
        status: { $in: ["active", "ACTIVE"] },
      })
        .select("shopifyProductId title handle featuredImage priceRangeV2 compareAtPriceRange")
        .lean();
      for (const d of docs as any[]) productMap[String(d.shopifyProductId)] = d;
    }

    const crossSellProducts = catalog.crossSellProductIds
      .map((id) => productMap[id])
      .filter(Boolean)
      .map((d: any) => ({
        shopifyProductId: String(d.shopifyProductId),
        title: String(d.title || ""),
        handle: String(d.handle || ""),
        image: String(d?.featuredImage?.url || ""),
        price: Math.round(Number(d?.priceRangeV2?.minVariantPrice?.amount || 0)),
        compareAtPrice: Math.round(
          Number(d?.compareAtPriceRange?.minVariantCompareAtPrice?.amount || 0)
        ),
      }));

    const packages = catalog.packages.map((p) => ({
      ...p,
      gifts: (p.gifts || []).map((g) => {
        const linked = g.shopifyProductId ? productMap[g.shopifyProductId] : null;
        return {
          ...g,
          image: g.image || String(linked?.featuredImage?.url || ""),
          price: g.price || Math.round(Number(linked?.priceRangeV2?.minVariantPrice?.amount || 0)),
          title: g.title || String(linked?.title || ""),
        };
      }),
    }));

    res.status(200).json({
      success: true,
      catalog: {
        rituals: catalog.rituals,
        sampooranVivah: catalog.sampooranVivah,
        packages,
        muhurats: catalog.muhurats,
        temples: catalog.temples,
        kashi: catalog.kashi,
        advancePercent: catalog.advancePercent,
        crossSellProducts,
        supportedLanguages: catalog.supportedLanguages,
        seo: catalog.seo,
      },
    });
  } catch (error: any) {
    console.error("Error fetching vivah catalog:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch catalog", error: error.message });
  }
};

/* ============================================================================
   0b) GET SEO  (public — meta tags + schema.org JSON-LD for the landing page)
   ============================================================================ */
export const getVivahSeo: RequestHandler = async (req, res) => {
  try {
    const catalog = await loadVivahCatalog();
    const seo = catalog.seo;
    const city = String((req.query.city as string) || "").trim();
    const cityTitle = city ? ` in ${city.charAt(0).toUpperCase()}${city.slice(1)}` : "";
    const base = seo.canonicalUrl || "https://panditjiatrequest.com/vedic-vivah";

    const offers = catalog.packages.map((p) => ({
      "@type": "Offer",
      name: `${p.name} — Vedic Vivah Package`,
      price: p.price,
      priceCurrency: "INR",
      description:
        p.tagline ||
        `${p.panditCount} Pandit Ji${p.panditCount > 1 ? "s" : ""}, all rituals${
          p.hasCoordinator ? " and a dedicated coordinator" : ""
        }${p.liveTempleDarshan ? ", plus after-marriage live temple darshan" : ""}.`,
      availability: "https://schema.org/InStock",
      url: `${base}/${p.packageId}`,
    }));

    const faq = [
      {
        q: `How much does a wedding pandit cost${cityTitle}?`,
        a: `Pandit Ji At Request offers transparent Vedic Vivah packages${cityTitle} starting at ₹${(
          catalog.packages[0]?.price || 21000
        ).toLocaleString(
          "en-IN"
        )} for one verified Pandit Ji and all rituals, up to premium tiers with multiple Pandit Jis, a coordinator, gifts and after-marriage live temple darshan.`,
      },
      {
        q: "Which languages are the marriage rituals performed in?",
        a: `Rituals are performed in ${catalog.supportedLanguages
          .slice(0, 6)
          .join(", ")} and more, so families across India get a Pandit Ji who follows their samaj's tradition.`,
      },
      {
        q: "Is the samagri included in the wedding pandit package?",
        a: "Yes. Every Vedic Vivah package includes the puja samagri, muhurat and kundali guidance, and end-to-end WhatsApp coordination.",
      },
      {
        q: "What is after-marriage live temple darshan?",
        a: "Every package includes a live, streamed darshan at a temple after the wedding, so the newlyweds and family receive the deities' first blessings together.",
      },
    ];

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          serviceType: "Vedic Vivah — Hindu Marriage Pandit Booking",
          name: seo.metaTitle,
          description: seo.metaDescription,
          provider: {
            "@type": "Organization",
            name: "Pandit Ji At Request",
            url: "https://panditjiatrequest.com",
          },
          areaServed: city || "India",
          url: base,
          offers,
        },
        {
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    };

    res.status(200).json({
      success: true,
      seo: {
        title: cityTitle
          ? `${seo.metaTitle.replace(" | Pandit Ji At Request", "")}${cityTitle} | Pandit Ji At Request`
          : seo.metaTitle,
        description: cityTitle ? `${seo.metaDescription} Serving ${city}.` : seo.metaDescription,
        keywords: [
          ...seo.keywords,
          ...(city
            ? [`wedding pandit in ${city}`, `pandit for marriage in ${city}`, `vivah pandit ${city}`]
            : []),
        ],
        canonical: city ? `${base}?city=${encodeURIComponent(city)}` : base,
        ogImage: seo.ogImage,
        slug: seo.slug,
      },
      jsonLd,
      faq,
    });
  } catch (error: any) {
    console.error("Error building vivah SEO:", error);
    res.status(500).json({ success: false, message: "Failed to build SEO", error: error.message });
  }
};

/* ============================================================================
   1) CREATE LEAD  (no payment — our team calls back)
   ============================================================================ */
export const createVedicVivahLead: RequestHandler = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { devoteeName, whatsapp } = req.body;
    const catalog = await loadVivahCatalog();
    const built = buildSteps(req.body.selectedSteps, catalog, {
      samagriNeeded: req.body.samagriNeeded === undefined ? true : !!req.body.samagriNeeded,
      isSampooranPackage: !!req.body.isSampooranPackage,
      packageId: req.body.packageId,
    });
    const addOns = await buildAddOns(req.body.addOnProducts);
    const advancePercent = effectiveAdvancePercent(catalog, built.pkg);

    if (!userId || !devoteeName || !whatsapp || built.steps.length === 0) {
      res.status(400).json({ success: false, message: "Missing required details for the request" });
      return;
    }

    const kundaliError = validateKundali(req.body, built);
    if (kundaliError) {
      res.status(400).json({ success: false, message: kundaliError });
      return;
    }

    const booking = await VedicVivahBooking.create({
      ...buildBookingFields(req.body, built, userId, addOns, advancePercent, catalog),
      paymentOption: "lead",
      bookingType: "lead",
      status: "lead",
      isPaymentDone: false,
    });

    // Converting → ask the app server to drop any pending page-dwell nudge.
    void relayNudge({ type: "page_dwell_cancel", userId, whatsapp });

    // 🟢 WhatsApp "request received" (fire-and-forget)
    void (async () => {
      const ok = await vivahWhatsapp(
        booking.whatsapp,
        booking.devoteeName || "Yajaman",
        "Aapki *Vedic Vivah Sanskar* seva ki request humein mil gayi hai. 🌸",
        `Selected: ${selectionLabel(built)}`,
        `Hamare verified Pandit Ji jald hi aapse sampark karenge. 🙏 (Request ID: ${String(
          booking._id
        )})`,
        "Vivah Lead"
      );
      if (ok) {
        booking.whatsappLeadSent = true;
        await booking.save();
      }
    })();

    res.status(201).json({
      success: true,
      message: "Vivah request received",
      bookingId: (booking as any)._id,
    });
  } catch (error: any) {
    console.error("Error creating vivah lead:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit request", error: error.message });
  }
};

/* ============================================================================
   2) CREATE ORDER  (advance/full payment → Razorpay order + pending booking)
   ============================================================================ */
export const createVedicVivahOrder: RequestHandler = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { devoteeName, whatsapp } = req.body;
    const catalog = await loadVivahCatalog();
    const built = buildSteps(req.body.selectedSteps, catalog, {
      samagriNeeded: req.body.samagriNeeded === undefined ? true : !!req.body.samagriNeeded,
      isSampooranPackage: !!req.body.isSampooranPackage,
      packageId: req.body.packageId,
    });
    const addOns = await buildAddOns(req.body.addOnProducts);
    const advancePercent = effectiveAdvancePercent(catalog, built.pkg);

    if (!userId || !devoteeName || !whatsapp || built.steps.length === 0) {
      res.status(400).json({ success: false, message: "Missing required details for booking" });
      return;
    }

    const kundaliError = validateKundali(req.body, built);
    if (kundaliError) {
      res.status(400).json({ success: false, message: kundaliError });
      return;
    }

    const extras = buildExtras(req.body, catalog, built);
    const grandTotal = built.total + addOns.addOnAmount + extras.templeAmount + extras.kashiAmount;
    const payFull = req.body.paymentOption === "full";
    const payable = payFull ? grandTotal : advanceOf(grandTotal, advancePercent);
    if (!Number.isFinite(payable) || payable <= 0) {
      res.status(400).json({ success: false, message: "Invalid booking amount" });
      return;
    }

    const hexId = crypto.randomBytes(8).toString("hex").toUpperCase();
    const receipt = `VVAH_${hexId}`;

    let orderId = `order_simulated_${hexId}`;
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: payable * 100,
        currency: "INR",
        receipt,
        payment: { capture: "automatic" },
        notes: {
          service: "Vedic Vivah Sanskar",
          devoteeName,
          platform: PLATFORM,
          ...(built.pkg ? { packageId: built.pkg.packageId, packageName: built.pkg.name } : {}),
        },
      });
      orderId = order.id;
    } else if (!allowSimulatedPayments || isProduction) {
      res.status(503).json({
        success: false,
        message: "Payments are temporarily unavailable. Please request a callback instead.",
      });
      return;
    }

    const booking = await VedicVivahBooking.create({
      ...buildBookingFields(req.body, built, userId, addOns, advancePercent, catalog),
      paymentOption: payFull ? "full" : "advance",
      bookingType: "paid",
      status: "lead", // becomes "confirmed" after payment verification
      isPaymentDone: false,
      razorpayOrderId: orderId,
    });

    // Gateway is opening → ask the app server to arm the 15-min "you didn't
    // finish" nudge and drop any page-dwell nudge (they're clearly converting).
    void relayNudge({
      type: "payment_abandoned",
      bookingId: String(booking._id),
      userId,
      name: booking.devoteeName || "Yajaman",
      whatsapp: booking.whatsapp,
    });

    res.status(201).json({
      success: true,
      bookingId: (booking as any)._id,
      razorpayOrderId: orderId,
      razorpayKeyId: razorpayKeyId || "rzp_test_simulated",
      amount: payable,
      currency: "INR",
      baseAmount: built.baseAmount,
      samagriAmount: built.samagriAmount,
      addOnAmount: addOns.addOnAmount,
      templeAmount: extras.templeAmount,
      kashiAmount: extras.kashiAmount,
      totalAmount: grandTotal,
      advancePercent,
      advanceAmount: advanceOf(grandTotal, advancePercent),
    });
  } catch (error: any) {
    console.error("Error creating vivah order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create order", error: error.message });
  }
};

/* ============================================================================
   SHARED SETTLEMENT
   Every side effect of a paid Vivah booking lives here so the two paths that
   can confirm a payment behave identically:

     1. POST .../vivah/complete-payment — the browser right after checkout.
     2. POST /api/payments/razorpay/webhook — Razorpay's server-to-server
        `payment.captured`, for when the browser never made that call (popup
        closed, app killed, network drop).

   The atomic claim below matches at most once, so whichever path arrives first
   does the side effects and the second is a no-op (`created: false`).
   ============================================================================ */
export async function settleVedicVivahPayment(
  existing: any,
  payment: { razorpayPaymentId: string; razorpaySignature?: string },
): Promise<{ booking: any; created: boolean }> {
  const { razorpayPaymentId, razorpaySignature } = payment;
  const bookingId = existing._id;

  // ── Claim the unpaid → paid transition ATOMICALLY ────────────────────────
  // The browser callback and the Razorpay server webhook can both land here
  // for the same order. A read-modify-write would let both observe
  // `isPaymentDone === false` and double-fire the affiliate commission, the
  // CAPI Purchase and the confirmation WhatsApp. This conditional update
  // matches at most once, so exactly one caller does the side effects.
  const amountPaid =
    existing.paymentOption === "full" ? existing.totalAmount : existing.advanceAmount;

  const claimed = await VedicVivahBooking.findOneAndUpdate(
    { _id: bookingId, isPaymentDone: false },
    {
      $set: {
        isPaymentDone: true,
        status: "confirmed",
        amountPaid,
        razorpayPaymentId,
        ...(razorpaySignature ? { razorpaySignature } : {}),
      },
    },
    { new: true }
  );

  // Already settled by a concurrent call — report success (the payment IS
  // verified and recorded) but skip every side effect.
  const booking = claimed || (await VedicVivahBooking.findById(bookingId))!;
  const vivahWasUnpaid = !!claimed;
  const shouldSendWhatsapp = !!claimed && !booking.whatsappConfirmationSent;

  // Email confirmation, exactly once. Gated on `claimed` for the same reason
  // the WhatsApp is: the atomic update above matches at most one caller, so a
  // replayed verify or a concurrent webhook cannot send a second receipt.
  if (vivahWasUnpaid) {
    void sendBookingEmailFor(booking, {
      serviceName: (booking as any).packageName
        ? `Vedic Vivah Sanskar — ${(booking as any).packageName}`
        : "Vedic Vivah Sanskar",
      mode: "offline",
      label: "VedicVivah",
    });
  }

  // Partner-affiliate: credit the customer's referrer once, on the first
  // successful payment. Uses amountPaid — the money actually collected here.
  if (vivahWasUnpaid) {
    void sendPjarOrderToPartnerAffiliate({
      userId: booking.userId,
      phone: booking.whatsapp ? String(booking.whatsapp) : null,
      orderId: booking.razorpayOrderId,
      orderPrice: Number(booking.amountPaid),
      productName: "VEDIC_VIVAH",
    });

    // NOTE: Meta CAPI Purchase conversion intentionally NOT sent for Vedic
    // Vivah Sanskar — no purchase conversion is tracked for this flow.
  }

  // Converted → drop the abandonment nudge on the app server.
  void relayNudge({
    type: "payment_abandoned_cancel",
    bookingId: String(booking._id),
    userId: booking.userId ? String(booking.userId) : "",
    whatsapp: booking.whatsapp,
  });

  // 🟢 WhatsApp "booking confirmed" (fire-and-forget)
  if (shouldSendWhatsapp)
    void (async () => {
      const balance = Math.max(0, booking.totalAmount - booking.amountPaid);
      const balanceLine = balance > 0 ? ` Shesh ₹${balance} ceremony ke baad.` : "";
      const selection = booking.packageName
        ? `${booking.packageName} Package — ${booking.panditCount || 1} Pandit Ji${
            (booking.panditCount || 1) > 1 ? "s" : ""
          }${booking.hasCoordinator ? " + Dedicated Coordinator" : ""}, sabhi rituals${
            booking.packageGifts?.length ? ` + ${booking.packageGifts.length} shagun gifts` : ""
          }`
        : `Rituals: ${selectionLabel({
            isSampooranPackage: booking.isSampooranPackage,
            steps: booking.selectedSteps as any,
          })}`;
      const ok = await vivahWhatsapp(
        booking.whatsapp,
        booking.devoteeName || "Yajaman",
        `Aapki *Vedic Vivah Sanskar* booking confirm ho gayi hai! 🌸 Advance ₹${booking.amountPaid} prapt hua.${balanceLine}`,
        selection,
        `Booking ID: ${
          booking.razorpayOrderId || String(booking._id)
        }. Hamari team har kadam par aapke saath hai. 🙏`,
        "Vivah Booking"
      );
      if (ok) {
        booking.whatsappConfirmationSent = true;
        await booking.save();
      }
    })();

  return { booking, created: vivahWasUnpaid };
}

/**
 * Confirms a Vivah booking when Razorpay reports the money was captured.
 *
 * Called by the shared webhook fan-out. Returns false when the order is not a
 * Vivah booking (so the fan-out can try the next service), true once it has
 * been dealt with. Idempotent on razorpayOrderId.
 */
export async function reconcileVedicVivahPayment(opts: {
  orderId: string;
  paymentId?: string;
  event: string;
  amountPaise?: number;
}): Promise<boolean> {
  const { orderId, paymentId, event, amountPaise } = opts;

  const booking = await VedicVivahBooking.findOne({ razorpayOrderId: orderId });
  if (!booking) return false; // not a vivah order

  // Already settled by the browser path (or an earlier webhook delivery).
  if (booking.isPaymentDone) return true;

  if (event === "payment.failed") {
    // Keep the booking unpaid — the devotee can still retry, and the
    // abandonment nudge relies on it staying in this state.
    console.log(
      `[RazorpayWebhook][Vivah] payment.failed for order=${orderId}; booking kept for retry.`,
    );
    return true;
  }

  if (!paymentId) {
    console.warn(
      `[RazorpayWebhook][Vivah] No payment id on ${event} for order=${orderId}; skipping.`,
    );
    return true;
  }

  // Amount sanity check. Vivah orders are raised in INR only, and what was owed
  // at checkout is the UPFRONT figure — the advance on an advance booking, the
  // grand total on a full one. Comparing the captured advance against the total
  // would strand every advance booking the devotee has already paid for.
  const expectedInr =
    booking.paymentOption === "full" ? booking.totalAmount : booking.advanceAmount;
  if (typeof amountPaise === "number" && Number.isFinite(amountPaise)) {
    const expectedPaise = Math.round(Number(expectedInr) * 100);
    if (amountPaise < expectedPaise) {
      console.error(
        `[RazorpayWebhook][Vivah] Amount mismatch for order=${orderId}: paid=${amountPaise} expected=${expectedPaise} INR. Not confirming.`,
      );
      return true;
    }
  }

  const { created } = await settleVedicVivahPayment(booking, {
    razorpayPaymentId: paymentId,
  });

  console.log(
    `[RazorpayWebhook][Vivah] order=${orderId} → ${created ? "booking confirmed" : "already confirmed (no-op)"}`,
  );
  return true;
}

/* ============================================================================
   3) COMPLETE PAYMENT  (verify signature → confirm booking → WhatsApp)
   ============================================================================ */
export const completeVedicVivahPayment: RequestHandler = async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayPaymentId || !razorpayOrderId) {
      res.status(400).json({ success: false, message: "Missing payment completion details" });
      return;
    }

    const existing = await VedicVivahBooking.findById(bookingId);
    if (!existing) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    // The token owns the booking, or nobody does. Without this a leaked
    // Razorpay success payload (shared browser, forwarded link) would return a
    // stranger's full document — names, address, birth details, kundali URLs.
    const tokenUserId = String((req as any).userID || "").trim();
    if (tokenUserId && String(existing.userId || "") !== tokenUserId) {
      res.status(403).json({ success: false, message: "Not authorized for this booking" });
      return;
    }
    if (existing.razorpayOrderId !== razorpayOrderId) {
      res.status(400).json({ success: false, message: "Order ID mismatch" });
      return;
    }
    if (
      !razorpaySignature ||
      !verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    ) {
      res.status(400).json({ success: false, message: "Payment verification failed" });
      return;
    }

    // Claim the payment and fire every confirmation side effect. Shared with
    // the Razorpay webhook path, and idempotent on the isPaymentDone flag so
    // whichever of the two arrives second is a no-op.
    const { booking } = await settleVedicVivahPayment(existing, {
      razorpayPaymentId,
      razorpaySignature,
    });

    res.status(200).json({
      success: true,
      message: "Vedic Vivah booked successfully",
      booking,
    });
  } catch (error: any) {
    console.error("Error completing vivah payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to complete payment", error: error.message });
  }
};

/* ============================================================================
   4) CREATE CONSULTATION  (free callback — no payment, no ritual selection)
   The inline "Talk to a Pandit Ji first" form on the Vivah page.
   ============================================================================ */
export const createVedicVivahConsultation: RequestHandler = async (req, res) => {
  try {
    const devoteeName = String(req.body.devoteeName || req.body.name || "").trim();
    const whatsapp = String(req.body.whatsapp || req.body.phone || "").trim();
    const message = String(req.body.consultationMessage || req.body.message || "").trim();

    if (!devoteeName || whatsapp.replace(/\D/g, "").length < 10) {
      res
        .status(400)
        .json({ success: false, message: "Name and a valid WhatsApp number are required" });
      return;
    }

    const booking = await VedicVivahBooking.create({
      platform: PLATFORM,
      userId: req.userID || req.body.userId || null,
      ...(sanitizeAttribution(req.body.attribution)
        ? { attribution: sanitizeAttribution(req.body.attribution) }
        : {}),
      devoteeName,
      whatsapp,
      email: req.body.email || "",
      language: req.body.language || "",
      consultationMessage: message,
      address: {
        street: req.body?.address?.street || "",
        pincode: req.body?.address?.pincode || "",
        city: req.body?.address?.city || "",
        state: req.body?.address?.state || "",
      },
      selectedSteps: [],
      isSampooranPackage: false,
      baseAmount: 0,
      samagriAmount: 0,
      totalAmount: 0,
      advanceAmount: 0,
      samagriNeeded: false,
      paymentOption: "lead",
      bookingType: "consultation",
      status: "lead",
      isPaymentDone: false,
    });

    // They asked to talk to us → drop any pending page-dwell nudge.
    void relayNudge({ type: "page_dwell_cancel", userId: req.body.userId, whatsapp });

    // 🟢 WhatsApp "consultation received" (fire-and-forget)
    void (async () => {
      const ok = await vivahWhatsapp(
        whatsapp,
        devoteeName,
        "Dhanyavaad! Aapki *free Vivah consultation* request mil gayi hai. 🌸",
        "Hamare Vivah-expert Pandit Ji jald hi aapko call karenge — muhurat, vidhi aur samagri ki poori jaankari ke saath.",
        "Aap kabhi bhi humse WhatsApp par baat kar sakte hain. Hum shuru se ant tak aapke saath hain. 🙏",
        "Vivah Consultation"
      );
      if (ok) {
        booking.whatsappLeadSent = true;
        await booking.save();
      }
    })();

    res.status(201).json({
      success: true,
      message: "Consultation request received",
      bookingId: (booking as any)._id,
    });
  } catch (error: any) {
    console.error("Error creating vivah consultation:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit consultation", error: error.message });
  }
};

/* ============================================================================
   Abuse guard for the PUBLIC nudge endpoint
   ----------------------------------------------------------------------------
   The nudge endpoint has to be unauthenticated (the dwell signal fires before a
   family ever logs in), and it ultimately causes a real, paid WhatsApp template
   to be sent to a caller-supplied number. Unthrottled, that's a spam cannon
   pointed at arbitrary Indian numbers from PJAR's verified sender.

   So: at most one nudge per phone per hour, and a modest per-IP hourly cap.
   In-memory is the right shape here — a nudge is best-effort, the window is
   short, and the cost of a miss after a restart is one extra WhatsApp.
   ============================================================================ */
const NUDGE_WINDOW_MS = 60 * 60 * 1000;
const NUDGE_MAX_PER_IP = 20;
const nudgeSeen = new Map<string, number[]>();

const nudgeAllowed = (key: string, limit: number): boolean => {
  const now = Date.now();
  const hits = (nudgeSeen.get(key) || []).filter((t) => now - t < NUDGE_WINDOW_MS);
  if (hits.length >= limit) {
    nudgeSeen.set(key, hits);
    return false;
  }
  hits.push(now);
  nudgeSeen.set(key, hits);
  // Opportunistic sweep so the map can't grow without bound.
  if (nudgeSeen.size > 5000) {
    for (const [k, v] of nudgeSeen) {
      if (!v.some((t) => now - t < NUDGE_WINDOW_MS)) nudgeSeen.delete(k);
    }
  }
  return true;
};

/* ============================================================================
   5) TRACK NUDGE TRIGGER  (client-side signals for WhatsApp re-engagement)
   Relayed to the app server, which owns the delayed-job queue and worker.
   Always answers 200 — a nudge must never surface as an error on the page.
   ============================================================================ */
export const trackVivahNudge: RequestHandler = async (req, res) => {
  try {
    const type = String(req.body.type || "").trim();
    const name = String(req.body.name || req.body.devoteeName || "Yajaman").trim();
    const whatsapp = String(req.body.whatsapp || req.body.phone || "").trim();

    if (whatsapp.replace(/\D/g, "").length < 10) {
      // Nothing we can do without a reachable number — succeed quietly.
      res.status(200).json({ success: true, scheduled: false });
      return;
    }
    if (type !== "page_dwell" && type !== "payment_abandoned") {
      res.status(200).json({ success: true, scheduled: false });
      return;
    }

    const phoneKey = `p:${normalisePhone(whatsapp)}`;
    const ipKey = `i:${req.ip || "unknown"}`;
    if (!nudgeAllowed(phoneKey, 1) || !nudgeAllowed(ipKey, NUDGE_MAX_PER_IP)) {
      res.status(200).json({ success: true, scheduled: false });
      return;
    }

    const scheduled = await relayNudge({
      type,
      name,
      whatsapp,
      userId: req.body.userId,
      ...(req.body.bookingId ? { bookingId: String(req.body.bookingId) } : {}),
    });

    res.status(200).json({ success: true, scheduled });
  } catch (error: any) {
    console.error("Error tracking vivah nudge:", error);
    res.status(200).json({ success: false, scheduled: false });
  }
};

/* ============================================================================
   6) GET USER BOOKINGS
   ============================================================================ */
export const getUserVedicVivahBookings: RequestHandler = async (req, res) => {
  try {
    // ALWAYS scope to the authenticated user — never trust the :userId param.
    // This closes the leak where any id returned any family's booking (names,
    // address, birth details, kundali images).
    const tokenUserId = String((req as any).userID || "").trim();
    if (!tokenUserId) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }
    // NOT filtered by platform on purpose: a family that booked in the app must
    // still see that booking when they log in on the website, and vice-versa.
    const bookings = await VedicVivahBooking.find({ userId: tokenUserId })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, bookings });
  } catch (error: any) {
    console.error("Error fetching vivah bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings", error: error.message });
  }
};

/* ============================================================================
   7) UPLOAD KUNDALI  (image → returns a public CDN URL)
   The route wires `createAnyFileUpload(...)` before this handler.
   ============================================================================ */
export const uploadVedicVivahKundali: RequestHandler = async (req, res) => {
  try {
    const files = (req as any).files as Array<{ location?: string }> | undefined;
    const url = files?.[0]?.location;
    if (!url) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    res.status(200).json({ success: true, url });
  } catch (error: any) {
    console.error("Error uploading kundali:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload kundali", error: error.message });
  }
};

/* ============================================================================
   8) CREATE BALANCE ORDER  (pay the remaining balance after an advance)
   Only for bookings already confirmed on an advance with a positive balance.
   Amount is recomputed server-side (never trusts the client).
   ============================================================================ */
export const createVedicVivahBalanceOrder: RequestHandler = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { bookingId } = req.body;
    if (!userId || !bookingId) {
      res.status(400).json({ success: false, message: "bookingId is required" });
      return;
    }

    const booking = await VedicVivahBooking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    if (String(booking.userId || "") !== String(userId)) {
      res.status(403).json({ success: false, message: "Not authorized for this booking" });
      return;
    }
    if (booking.status === "cancelled") {
      res.status(400).json({ success: false, message: "This booking is cancelled" });
      return;
    }
    // A "balance" only exists once the advance has actually been paid. Without
    // this, an abandoned unpaid booking (status "lead", amountPaid 0) reports a
    // balance equal to the full amount and could be settled through this
    // endpoint — which never sets isPaymentDone/status, so the family would pay
    // in full and still show as an unconfirmed lead with no confirmation sent.
    if (!booking.isPaymentDone) {
      res.status(400).json({
        success: false,
        message: "This booking hasn't been confirmed yet. Please complete the advance payment first.",
      });
      return;
    }
    const balance = Math.max(
      0,
      Number(booking.totalAmount || 0) - Number(booking.amountPaid || 0)
    );
    if (balance <= 0) {
      res.status(400).json({ success: false, message: "No balance is pending on this booking" });
      return;
    }

    const hexId = crypto.randomBytes(8).toString("hex").toUpperCase();
    let orderId = `order_simulated_${hexId}`;
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: balance * 100,
        currency: "INR",
        receipt: `VVAHBAL_${hexId}`,
        payment: { capture: "automatic" },
        notes: {
          service: "Vedic Vivah Sanskar — balance",
          bookingId: String(booking._id),
          platform: PLATFORM,
        },
      });
      orderId = order.id;
    } else if (!allowSimulatedPayments || isProduction) {
      res
        .status(503)
        .json({ success: false, message: "Payments are temporarily unavailable." });
      return;
    }

    booking.balanceRazorpayOrderId = orderId;
    await booking.save();

    res.status(200).json({
      success: true,
      bookingId: String(booking._id),
      razorpayOrderId: orderId,
      razorpayKeyId: razorpayKeyId || "rzp_test_simulated",
      amount: balance,
      currency: "INR",
    });
  } catch (error: any) {
    console.error("Error creating vivah balance order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create balance order", error: error.message });
  }
};

/* ============================================================================
   9) COMPLETE BALANCE PAYMENT  (verify signature → mark fully paid)
   ============================================================================ */
export const completeVedicVivahBalancePayment: RequestHandler = async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!bookingId || !razorpayPaymentId || !razorpayOrderId) {
      res.status(400).json({ success: false, message: "Missing payment completion details" });
      return;
    }

    const booking = await VedicVivahBooking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    const tokenUserId = String((req as any).userID || "").trim();
    if (tokenUserId && String(booking.userId || "") !== tokenUserId) {
      res.status(403).json({ success: false, message: "Not authorized for this booking" });
      return;
    }
    if (booking.balanceRazorpayOrderId !== razorpayOrderId) {
      res.status(400).json({ success: false, message: "Order ID mismatch" });
      return;
    }
    if (
      !razorpaySignature ||
      !verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    ) {
      res.status(400).json({ success: false, message: "Payment verification failed" });
      return;
    }

    const balancePaidNow = Math.max(
      0,
      Number(booking.totalAmount || 0) - Number(booking.amountPaid || 0)
    );
    // Idempotency: a replayed callback must not re-fire CAPI or WhatsApp.
    const alreadySettled = balancePaidNow <= 0;
    booking.amountPaid = booking.totalAmount;
    booking.paymentOption = "full";
    booking.balancePaidAt = new Date();
    // Defensive: the balance endpoint requires isPaymentDone, but if a booking
    // ever reaches "fully paid" while still flagged as a lead, don't leave it
    // stranded there — ops filters on status and would never see it.
    booking.isPaymentDone = true;
    if (booking.status === "lead") booking.status = "confirmed";
    await booking.save();

    if (!alreadySettled) {
      // NOTE: Meta CAPI Purchase conversion intentionally NOT sent for Vedic
      // Vivah Sanskar balance payments — no purchase conversion is tracked here.

      // 🟢 WhatsApp "balance received" (fire-and-forget)
      void vivahWhatsapp(
        booking.whatsapp,
        booking.devoteeName || "Yajaman",
        "Dhanyavaad! 🌸 Aapki *Vedic Vivah Sanskar* ki poori rashi prapt ho gayi hai.",
        `Total ₹${booking.totalAmount} — sampoorna bhugtan safal.`,
        `Booking ID: ${
          booking.razorpayOrderId || String(booking._id)
        }. Aapke shubh vivah ki hardik shubhkamnaayein! 🙏`,
        "Vivah Balance"
      );
    }

    res.status(200).json({ success: true, message: "Balance paid successfully", booking });
  } catch (error: any) {
    console.error("Error completing vivah balance payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete balance payment",
      error: error.message,
    });
  }
};

/* ============================================================================
   10) CANCEL BOOKING  (family-initiated; computes refund per published policy)
   ≥7d = 100%, 3–6d = 50%, <3d/no date = 0%.
   ============================================================================ */
export const cancelVedicVivahBooking: RequestHandler = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { bookingId } = req.params;
    const reason = String(req.body?.reason || "").trim();
    if (!userId || !bookingId) {
      res.status(400).json({ success: false, message: "bookingId is required" });
      return;
    }

    const booking = await VedicVivahBooking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    if (String(booking.userId || "") !== String(userId)) {
      res.status(403).json({ success: false, message: "Not authorized for this booking" });
      return;
    }
    if (booking.status === "cancelled") {
      res.status(400).json({ success: false, message: "This booking is already cancelled" });
      return;
    }
    if (booking.status === "completed") {
      res.status(400).json({ success: false, message: "A completed ceremony cannot be cancelled" });
      return;
    }

    const refund = computeRefund(Number(booking.amountPaid || 0), booking.eventDate);
    booking.status = "cancelled";
    booking.cancellation = {
      isCancelled: true,
      reason,
      cancelledAt: new Date(),
      refundAmount: refund.amount,
      refundStatus: refund.amount > 0 ? "pending" : "none",
    };
    await booking.save();

    // Drop any pending nudges tied to this booking/user.
    void relayNudge({
      type: "payment_abandoned_cancel",
      bookingId: String(booking._id),
      userId: String(userId),
      whatsapp: booking.whatsapp,
    });

    // 🟢 WhatsApp "cancellation confirmed" (fire-and-forget)
    void vivahWhatsapp(
      booking.whatsapp,
      booking.devoteeName || "Yajaman",
      "Aapki *Vedic Vivah Sanskar* booking cancel kar di gayi hai.",
      refund.amount > 0
        ? `Aapka refund ₹${refund.amount} (${refund.pct}%) 5–7 din mein process ho jayega.`
        : "Niyam ke anusaar is samay par refund uplabdh nahi hai.",
      "Kisi bhi sahayata ke liye hum WhatsApp par uplabdh hain. 🙏",
      "Vivah Cancel"
    );

    res.status(200).json({ success: true, message: "Booking cancelled", refund, booking });
  } catch (error: any) {
    console.error("Error cancelling vivah booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel booking", error: error.message });
  }
};
