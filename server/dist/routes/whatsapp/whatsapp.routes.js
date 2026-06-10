"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("../../controller/whatsapp/whatsapp.controller");
const router = (0, express_1.Router)();
// ── Public / Pinnacle ─────────────────────────────────────────────────────────
/** GET /api/whatsapp/health */
router.get('/health', whatsapp_controller_1.healthCheck);
/** POST /api/whatsapp/webhook — Pinnacle sends incoming messages here */
router.post('/webhook', whatsapp_controller_1.handleWebhook);
// ── Admin ─────────────────────────────────────────────────────────────────────
// TODO: Protect these with your existing admin auth middleware if needed
/** GET /api/whatsapp/bookings?status=pending&phone=91XXXXXXXXXX */
router.get('/bookings', whatsapp_controller_1.getWhatsappBookings);
/** GET /api/whatsapp/bookings/:id */
router.get('/bookings/:id', whatsapp_controller_1.getWhatsappBookingById);
/** PATCH /api/whatsapp/bookings/:id/status */
router.patch('/bookings/:id/status', whatsapp_controller_1.updateWhatsappBookingStatus);
exports.default = router;
