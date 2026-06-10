"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const encryption_1 = require("../../utils/encryption");
const referralController_1 = require("../../controller/userApp/referralController");
const router = (0, express_1.Router)();
// POST /users/:id/referral-source — save external campaign code once
router.post("/users/:id/referral-source", encryption_1.decryptRequest, referralController_1.setreferralSourcePJAROnce);
// GET /users/:id/my-referral — get user's own referral code + earnings
router.get("/users/:id/my-referral", referralController_1.getMyReferralData);
// GET /users/:id/referral-bookings — list bookings made via this user's code
router.get("/users/:id/referral-bookings", referralController_1.getReferralBookings);
// POST /users/:id/apply-referral — apply a friend's referral code
router.post("/users/:id/apply-referral", encryption_1.decryptRequest, referralController_1.applyUserReferral);
// POST /users/:id/payout-request — request payout of referral earnings
router.post("/users/:id/payout-request", referralController_1.requestReferralPayout);
exports.default = router;
