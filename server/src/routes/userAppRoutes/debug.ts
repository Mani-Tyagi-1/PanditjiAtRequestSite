// routes/debug.ts
import { Router } from 'express';
import { sendPushNotification } from '../../utils/oneSignal';

const router = Router();

/**
 * POST /debug/push/:phone
 * Body (optional): { "title": "Test", "body": "Hello", "data": { ... } }
 *
 * Targets OneSignal by external_id = :phone (e.g. "8219675986").
 */
router.post('/push/:phone', async (req, res) => {
  try {
    const { phone } = req.params as { phone: string };
    const title = (req.body?.title as string) ?? 'Test 🔔';
    const body  = (req.body?.body as string)  ?? 'Hello from server!';
    const data  = (req.body?.data as Record<string, any>) ?? { screen: 'ActivePujaList' };

    const r = await sendPushNotification({
      externalIds: [phone],     // must match OneSignal.login(phone) on device
      heading: title,
      content: body,
      data,
    });

    res.status(200).json(r);
  } catch (e) {
    console.error('[debug/push] error', e);
    res.status(500).json({ error: 'failed' });
  }
});

export default router;
