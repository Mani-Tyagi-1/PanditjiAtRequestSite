"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const poojaBookingController_1 = require("../../controller/poojaBooking/poojaBookingController");
const createAnyFileUpload_1 = require("../../utils/createAnyFileUpload");
const encryption_1 = require("../../utils/encryption");
const router = (0, express_1.Router)();
/** USER/COMMON */
// ⚠️ Updated to the pre-payment logic
router.post('/bookings/create-pending', encryption_1.decryptRequest, poojaBookingController_1.createPendingBooking);
// ⚠️ New endpoint for payment completion
router.post('/bookings/complete-booking', encryption_1.decryptRequest, poojaBookingController_1.completePoojaBooking);
// This route still works as before (fetches active/confirmed bookings)
router.get('/bookings/get-pending-poojabookings/:userPhone', poojaBookingController_1.getPendingBookingsByUserPhone);
/** LISTS (keep these BEFORE any /:bookingId routes) */
router.get('/bookings/pending', poojaBookingController_1.getAllPendingBookings);
router.get('/bookings/pending/assigned/:panditId', poojaBookingController_1.getPendingBookingsForPandit);
/** ACTIONS */
router.get('/bookings/:bookingId', poojaBookingController_1.getOnePendingBooking);
router.patch('/bookings/:bookingId/progress', poojaBookingController_1.updatePendingBookingProgress);
router.post('/bookings/:bookingId/accept', poojaBookingController_1.acceptPendingBooking);
router.post('/bookings/:bookingId/complete-media', (0, createAnyFileUpload_1.createAnyFileUpload)('PAR_Pooja_Complete', 200), poojaBookingController_1.uploadPoojaCompletionMedia);
exports.default = router;
