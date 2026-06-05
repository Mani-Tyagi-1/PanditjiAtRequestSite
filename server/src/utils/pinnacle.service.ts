import { sendWhatsappMessage, sendWhatsappTemplateMessage } from './whatsapp';

function hasCredentials(): boolean {
  return Boolean(process.env.PINBOT_API_KEY && process.env.PINBOT_PHONE_NUMBER_ID);
}

/**
 * Send a plain text message via Pinnacle WhatsApp API.
 * Delegates to the existing sendWhatsappMessage utility (src/utils/whatsapp.ts).
 * API: https://partnersv1.pinbot.ai/v3/<phone_number_id>/messages
 */
export async function sendTextMessage(phone: string, message: string): Promise<void> {
  if (!hasCredentials()) {
    console.warn('[Pinnacle] Missing PINBOT_API_KEY or PINBOT_PHONE_NUMBER_ID — skipping send');
    return;
  }

  try {
    await sendWhatsappMessage({ to: phone, message });
    console.log(`[Pinnacle] Text message sent to ${phone}`);
  } catch (error: any) {
    console.error(
      `[Pinnacle] Failed to send message to ${phone}:`,
      error?.response?.data || error?.message
    );
    throw error;
  }
}

/**
 * Send a template message via Pinnacle WhatsApp API.
 * Delegates to the existing sendWhatsappTemplateMessage utility.
 */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  params: string[],
  options?: { headerImageUrl?: string; buttonUrlParam?: string; languageCode?: string }
): Promise<void> {
  if (!hasCredentials()) {
    console.warn('[Pinnacle] Missing PINBOT_API_KEY or PINBOT_PHONE_NUMBER_ID — skipping template send');
    return;
  }

  try {
    await sendWhatsappTemplateMessage({
      to: phone,
      templateName,
      parameters: params,
      headerImageUrl: options?.headerImageUrl,
      buttonUrlParam: options?.buttonUrlParam,
      languageCode: options?.languageCode,
    });
    console.log(`[Pinnacle] Template '${templateName}' sent to ${phone}`);
  } catch (error: any) {
    console.error(
      `[Pinnacle] Failed to send template to ${phone}:`,
      error?.response?.data || error?.message
    );
    throw error;
  }
}
