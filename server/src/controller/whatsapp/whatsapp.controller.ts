import { Request, Response } from 'express';
import { handleIncomingMessage } from '../../utils/whatsappBot.service';
import WhatsappBooking from '../../model/whatsapp/WhatsappBooking.model';

/**
 * Extract phone and message text from incoming Pinnacle webhook payload.
 *
 * TODO: Verify exact Pinnacle payload shape from official docs.
 * Logging the raw body in development will show the actual structure.
 * The extractor below handles several common WhatsApp API payload shapes.
 */
function extractPhoneAndMessage(
  body: any
): { phone: string; text: string } | null {
  // Shape 1: { from, text } — simple flat structure
  if (body?.from && body?.text) {
    const phone = String(body.from).replace(/\D/g, '');
    const text =
      typeof body.text === 'string' ? body.text : (body.text?.body ?? '');
    if (phone && text) return { phone, text };
  }

  // Shape 2: { messages: [{ from, text }] }
  if (Array.isArray(body?.messages) && body.messages.length > 0) {
    const msg = body.messages[0];
    const phone = String(msg?.from ?? msg?.sender ?? '').replace(/\D/g, '');
    const text =
      typeof msg?.text === 'string'
        ? msg.text
        : msg?.text?.body ?? msg?.body ?? '';
    if (phone && text) return { phone, text };
  }

  // Shape 3: WABA-style { entry: [{ changes: [{ value: { messages: [...] } }] }] }
  try {
    const wabaMsgEntry =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (wabaMsgEntry) {
      const phone = String(wabaMsgEntry.from ?? '').replace(/\D/g, '');
      const text = wabaMsgEntry.text?.body ?? '';
      if (phone && text) return { phone, text };
    }
  } catch {
    // ignore parse error
  }

  return null;
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages from Pinnacle and drives the booking bot.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  // Log raw payload to help diagnose Pinnacle payload shape differences
  console.log('[WhatsApp Webhook] Payload:', JSON.stringify(req.body));

  // Always respond 200 immediately to prevent Pinnacle from retrying
  res.status(200).json({ status: 'ok' });

  try {
    const parsed = extractPhoneAndMessage(req.body);

    if (!parsed || !parsed.phone || !parsed.text) {
      console.warn(
        '[WhatsApp Webhook] Could not extract phone/message — check payload structure'
      );
      return;
    }

    const { phone, text } = parsed;
    console.log(`[WhatsApp Webhook] Message from ${phone}: "${text}"`);

    await handleIncomingMessage(phone, text);
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error processing message:', error?.message);
  }
}

/**
 * GET /api/whatsapp/health
 * Simple health check for the WhatsApp bot service.
 */
export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'WhatsApp Booking Bot',
    pinnacleApiConfigured: Boolean(
      process.env.PINBOT_API_KEY && process.env.PINNACLE_API_BASE_URL
    ),
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/whatsapp/bookings
 * Admin: list all WhatsApp bookings. Supports ?status=pending filter.
 */
export async function getWhatsappBookings(req: Request, res: Response): Promise<void> {
  try {
    const filter: Record<string, any> = { source: 'whatsapp' };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.phone) filter.phone = req.query.phone;

    const bookings = await WhatsappBooking.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error: any) {
    console.error('[WhatsApp Admin] Error fetching bookings:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch WhatsApp bookings' });
  }
}

/**
 * GET /api/whatsapp/bookings/:id
 * Admin: get a single WhatsApp booking by ID.
 */
export async function getWhatsappBookingById(req: Request, res: Response): Promise<void> {
  try {
    const booking = await WhatsappBooking.findById(req.params.id).lean();
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    res.status(200).json({ success: true, booking });
  } catch (error: any) {
    console.error('[WhatsApp Admin] Error fetching booking:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
}

/**
 * PATCH /api/whatsapp/bookings/:id/status
 * Admin: update status of a WhatsApp booking.
 */
export async function updateWhatsappBookingStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status, paymentStatus } = req.body;
    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const booking = await WhatsappBooking.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).lean();

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.status(200).json({ success: true, booking });
  } catch (error: any) {
    console.error('[WhatsApp Admin] Error updating booking:', error?.message);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
}