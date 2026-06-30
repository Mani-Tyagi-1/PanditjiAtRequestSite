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
 * Extract message delivery statuses from a Pinnacle/WABA webhook payload.
 * Status callbacks arrive as { entry: [{ changes: [{ value: { statuses: [...] } }] }] }
 * (and some providers post a flat { statuses: [...] }). Each status carries
 * status ('sent' | 'delivered' | 'read' | 'failed') and, on failure, an errors[]
 * array with the code — e.g. 131049 when Meta drops a MARKETING template.
 */
function extractStatuses(body: any): any[] {
  const fromWaba = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (Array.isArray(fromWaba)) return fromWaba;
  if (Array.isArray(body?.statuses)) return body.statuses;
  return [];
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages AND delivery-status callbacks from Pinnacle.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  // Log raw payload to help diagnose Pinnacle payload shape differences
  console.log('[WhatsApp Webhook] Payload:', JSON.stringify(req.body));

  // Always respond 200 immediately to prevent Pinnacle from retrying
  res.status(200).json({ status: 'ok' });

  // ── Delivery-status callbacks (sent / delivered / read / failed) ──────────────
  // This is where a real delivery failure surfaces. Without this, a 131049 drop is
  // invisible server-side because the original send API returned 200.
  try {
    for (const s of extractStatuses(req.body)) {
      const recipient = s?.recipient_id ?? s?.to ?? 'unknown';
      if (s?.status === 'failed') {
        const err = Array.isArray(s?.errors) ? s.errors[0] : s?.error;
        const code = err?.code ?? err?.error_code ?? 'n/a';
        const title = err?.title ?? err?.message ?? 'unknown error';
        console.error(
          `❌ [WhatsApp Delivery] FAILED to ${recipient} — code ${code}: ${title}` +
            (String(code) === '131049'
              ? ' (marketing frequency cap — template must be UTILITY category)'
              : '')
        );
      } else if (s?.status) {
        console.log(`[WhatsApp Delivery] ${s.status} → ${recipient}`);
      }
    }
  } catch (statusErr: any) {
    console.error('[WhatsApp Webhook] Error parsing statuses:', statusErr?.message);
  }

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