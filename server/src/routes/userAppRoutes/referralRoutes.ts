import { Router, RequestHandler } from "express";
import { decryptRequest } from "../../utils/encryption";
import {
  setreferralSourcePJAROnce,
  getMyReferralData,
  getReferralBookings,
  applyUserReferral,
  requestReferralPayout,
} from "../../controller/userApp/referralController";

const router = Router();

// POST /users/:id/referral-source — save external campaign code once
router.post(
  "/users/:id/referral-source",
  decryptRequest as RequestHandler,
  setreferralSourcePJAROnce
);

// GET /users/:id/my-referral — get user's own referral code + earnings
router.get("/users/:id/my-referral", getMyReferralData);

// GET /users/:id/referral-bookings — list bookings made via this user's code
router.get("/users/:id/referral-bookings", getReferralBookings);

// POST /users/:id/apply-referral — apply a friend's referral code
router.post(
  "/users/:id/apply-referral",
  decryptRequest as RequestHandler,
  applyUserReferral
);

// POST /users/:id/payout-request — request payout of referral earnings
router.post("/users/:id/payout-request", requestReferralPayout);

export default router;
