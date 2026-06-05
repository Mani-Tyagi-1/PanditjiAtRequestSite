import { Router } from 'express';
import {
  handleWebhook,
  healthCheck,
  getWhatsappBookings,
  getWhatsappBookingById,
  updateWhatsappBookingStatus,
} from '../../controller/whatsapp/whatsapp.controller';

const router = Router();

// ── Public / Pinnacle ─────────────────────────────────────────────────────────

/** GET /api/whatsapp/health */
router.get('/health', healthCheck);

/** POST /api/whatsapp/webhook — Pinnacle sends incoming messages here */
router.post('/webhook', handleWebhook);

// ── Admin ─────────────────────────────────────────────────────────────────────
// TODO: Protect these with your existing admin auth middleware if needed

/** GET /api/whatsapp/bookings?status=pending&phone=91XXXXXXXXXX */
router.get('/bookings', getWhatsappBookings);

/** GET /api/whatsapp/bookings/:id */
router.get('/bookings/:id', getWhatsappBookingById);

/** PATCH /api/whatsapp/bookings/:id/status */
router.patch('/bookings/:id/status', updateWhatsappBookingStatus);

export default router;