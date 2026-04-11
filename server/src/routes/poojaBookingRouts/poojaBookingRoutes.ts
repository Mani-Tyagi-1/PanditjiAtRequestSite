import { Router } from 'express';
import {
  createPendingBooking, // ⚠️ New endpoint for pre-payment
  completePoojaBooking, // ⚠️ New endpoint for post-payment
  getPendingBookingsByUserPhone,
  getAllPendingBookings,
  getPendingBookingsForPandit,
  acceptPendingBooking,
  getOnePendingBooking,
  updatePendingBookingProgress,
  uploadPoojaCompletionMedia
} from '../../controllers/poojaBooking/poojaBookingController';

import { createAnyFileUpload } from '../../utils/createAnyFileUpload';
import { decryptRequest } from '../../utils/encryption';

const router = Router();

/** USER/COMMON */
// ⚠️ Updated to the pre-payment logic
router.post('/bookings/create-pending', decryptRequest ,createPendingBooking); 
// ⚠️ New endpoint for payment completion
router.post('/bookings/complete-booking', decryptRequest,completePoojaBooking); 

// This route still works as before (fetches active/confirmed bookings)
router.get('/bookings/get-pending-poojabookings/:userPhone', getPendingBookingsByUserPhone);

/** LISTS (keep these BEFORE any /:bookingId routes) */
router.get('/bookings/pending', getAllPendingBookings);
router.get('/bookings/pending/assigned/:panditId', getPendingBookingsForPandit);

/** ACTIONS */
router.get('/bookings/:bookingId', getOnePendingBooking);
router.patch('/bookings/:bookingId/progress', updatePendingBookingProgress);
router.post('/bookings/:bookingId/accept', acceptPendingBooking);


router.post(
  '/bookings/:bookingId/complete-media',
  createAnyFileUpload('PAR_Pooja_Complete', 200), 
  uploadPoojaCompletionMedia
);

export default router;
