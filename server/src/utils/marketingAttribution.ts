import type { Request } from "express";

import type {
  IMarketingAttribution,
  IMarketingTouch,
} from "../model/analytics/marketingAttribution.schema";

/**
 * Turn whatever the browser sent into something safe to persist on a booking.
 *
 * This is the ONLY way an `attribution` value should ever reach a model. The
 * payload is attacker-controlled — it comes from a public, unauthenticated
 * checkout endpoint — so every field is whitelisted by name and every string is
 * clipped. Without that, `attribution` would be an open door to writing
 * arbitrarily large documents into the bookings collection.
 *
 * Forgiving by design: a malformed or missing attribution must never fail a
 * booking. Anything unrecognisable simply becomes `undefined`, and the booking
 * is written exactly as it would have been before campaign tracking existed.
 */

/** Long enough for a real click id (gclid runs ~100 chars) and no longer. */
const MAX_ID = 300;
/** UTM values are human-authored campaign names; 200 is generous. */
const MAX_TAG = 200;
/** URLs, which can carry a long query string of their own. */
const MAX_URL = 600;

const clip = (value: unknown, max: number): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
};

/**
 * A timestamp the browser reported. Clamped to "not in the future" so a device
 * with a badly wrong clock cannot park a touch in 2077 and skew every
 * time-boxed campaign report that ever runs over this collection.
 */
const toDate = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(typeof value === "number" ? value : String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  const now = Date.now();
  return date.getTime() > now ? new Date(now) : date;
};

const sanitizeTouch = (input: any): IMarketingTouch | undefined => {
  if (!input || typeof input !== "object") return undefined;

  const touch: IMarketingTouch = {
    source: clip(input.source ?? input.utm_source, MAX_TAG),
    medium: clip(input.medium ?? input.utm_medium, MAX_TAG),
    campaign: clip(input.campaign ?? input.utm_campaign, MAX_TAG),
    term: clip(input.term ?? input.utm_term, MAX_TAG),
    content: clip(input.content ?? input.utm_content, MAX_TAG),

    gclid: clip(input.gclid, MAX_ID),
    gbraid: clip(input.gbraid, MAX_ID),
    wbraid: clip(input.wbraid, MAX_ID),
    fbclid: clip(input.fbclid, MAX_ID),
    msclkid: clip(input.msclkid, MAX_ID),

    referrer: clip(input.referrer, MAX_URL),
    landingPage: clip(input.landingPage, MAX_URL),
    at: toDate(input.at),
  };

  // Drop the keys that came back undefined, so the stored subdocument holds
  // only what was actually known rather than a dozen empty slots.
  const cleaned = Object.fromEntries(
    Object.entries(touch).filter(([, v]) => v !== undefined),
  ) as IMarketingTouch;

  // A touch carrying nothing but a timestamp says nothing about a campaign.
  const hasSignal = Object.keys(cleaned).some((k) => k !== "at");
  return hasSignal ? cleaned : undefined;
};

/**
 * Sanitize an `attribution` payload.
 *
 * Accepts either the two-touch shape the site sends
 * (`{ first: {...}, last: {...} }`) or a single bare touch — older or
 * third-party callers that only know their current UTMs can post the flat
 * form, and it is treated as the last touch.
 */
export const sanitizeAttribution = (
  input: any,
): IMarketingAttribution | undefined => {
  if (!input || typeof input !== "object") return undefined;

  const first = sanitizeTouch(input.first);
  const last = sanitizeTouch(input.last) ?? sanitizeTouch(input);

  if (!first && !last) return undefined;
  return {
    ...(first && { first }),
    // A devotee who arrived and booked in one visit has one touch. Recording
    // it as both is not padding — it is the truth, and it keeps first-touch
    // reports from silently under-counting single-session conversions.
    ...(last && { last }),
    ...(!first && last ? { first: last } : {}),
  };
};

/**
 * Pull the campaign attribution off an inbound booking request.
 *
 * Call it once at the top of any create-booking controller and spread the
 * result, so a booking that arrived without attribution is written with no
 * `attribution` key at all rather than an empty one:
 *
 *     const attribution = readAttribution(req);
 *     await Booking.create({ ...fields, ...(attribution && { attribution }) });
 */
export const readAttribution = (req: Request): IMarketingAttribution | undefined =>
  sanitizeAttribution((req.body as any)?.attribution);

export default readAttribution;
