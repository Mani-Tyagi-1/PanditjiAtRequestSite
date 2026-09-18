import axios from "axios";

/**
 * Transactional order/booking confirmation template.
 *
 * IMPORTANT: this must be a UTILITY-category template in WhatsApp Manager.
 * If it is MARKETING, Meta's per-user marketing frequency cap silently drops
 * confirmations (error 131049 — "…to maintain healthy ecosystem engagement"):
 * the send API returns 200, but the user never receives the message.
 *
 * Two known templates, switchable via env (NO code change needed):
 *   • pjar_order   — URL button, no image header. Lives on the primary number and
 *                    DELIVERS today (but is MARKETING → subject to the 131049 cap).
 *   • pjar_booking — IMAGE header + 4 body params, NO button. UTILITY (no cap), but
 *                    must be approved on the PRIMARY number's WhatsApp account first.
 *       Body: Namaste {{1}} 🙏 / {{2}} / {{3}} / {{4}} / Thank you for using Pandit Ji At Request
 *
 * Default is pjar_order so confirmations keep delivering. Once pjar_booking is
 * approved on the primary number, switch with:
 *   WHATSAPP_ORDER_TEMPLATE=pjar_booking
 *   WHATSAPP_ORDER_HAS_IMAGE_HEADER=true
 */
export const ORDER_TEMPLATE = (process.env.WHATSAPP_ORDER_TEMPLATE || "pjar_booking").trim();

/**
 * Whether ORDER_TEMPLATE has an IMAGE header (→ send the dynamic product/puja image)
 * instead of a URL button. pjar_booking = image (true); pjar_order = button (false).
 * Defaults to true to match pjar_booking; set WHATSAPP_ORDER_HAS_IMAGE_HEADER=false
 * only if you switch back to pjar_order.
 */
export const ORDER_TEMPLATE_HAS_IMAGE_HEADER =
  (process.env.WHATSAPP_ORDER_HAS_IMAGE_HEADER || "true").toLowerCase() === "true";

/**
 * Fallback template used ONLY if the primary template (pjar_booking) can't be sent
 * because it isn't available on the number yet (error 132001). pjar_order is the
 * known-working template, so this guarantees the user still receives a confirmation
 * (via the button template) instead of getting nothing. Set empty to disable.
 */
export const ORDER_TEMPLATE_FALLBACK = (
  process.env.WHATSAPP_ORDER_TEMPLATE_FALLBACK || "pjar_order"
).trim();

/**
 * Fallback header image used only when a booking has no resolvable item image and
 * the active template uses an image header. Override via WHATSAPP_ORDER_HEADER_IMAGE.
 */
export const ORDER_TEMPLATE_HEADER_IMAGE = (
  process.env.WHATSAPP_ORDER_HEADER_IMAGE ||
  "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png"
).trim();

const getCredentialSets = () => {
  const sets = [];

  // Primary sender: WHATSAPP_PINBOT_* (number 919056955313 / id 1113484901851414).
  // This account owns the pjar_booking template, so confirmations send from here.
  if (process.env.WHATSAPP_PINBOT_API_KEY && process.env.WHATSAPP_PINBOT_PHONE_NUMBER_ID) {
    sets.push({
      apiKey: process.env.WHATSAPP_PINBOT_API_KEY.trim(),
      phoneNumberId: process.env.WHATSAPP_PINBOT_PHONE_NUMBER_ID.trim(),
    });
  }

  // Secondary fallback: PINBOT_* — owns the pjar_order template, used only if the
  // primary template can't be sent on the primary account.
  if (process.env.PINBOT_API_KEY && process.env.PINBOT_PHONE_NUMBER_ID) {
    sets.push({
      apiKey: process.env.PINBOT_API_KEY.trim(),
      phoneNumberId: process.env.PINBOT_PHONE_NUMBER_ID.trim(),
    });
  }

  return sets;
};

export const sendWhatsappMessage = async ({
  to,
  message,
}: {
  to: string;
  message: string;
}) => {
  const credentialSets = getCredentialSets();
  if (credentialSets.length === 0) {
    const err = new Error("No Pinbot/WhatsApp credentials found in environment variables");
    console.error(err.message);
    throw err;
  }
  
  let lastError: any = null;
  for (const creds of credentialSets) {
    try {
      const url = `https://partnersv1.pinbot.ai/v3/${creds.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        preview_url: false,
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          body: message,
        },
      };

      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          apikey: creds.apiKey,
        },
      });

      return res.data;
    } catch (error: any) {
      lastError = error;
      console.error(
        `WhatsApp send failed with credentials ID ${creds.phoneNumberId}:`,
        error?.response?.data || error.message
      );
    }
  }
  throw lastError;
};

type SendTemplateArgs = {
  to: string;
  templateName: string;
  templateId?: string; // not used in payload (kept optional)
  parameters: string[]; // body params
  headerImageUrl?: string; // ✅ add this
  buttonUrlParam?: string; // ✅ dynamic button suffix
  languageCode?: string; // default "en"
};

export const sendWhatsappTemplateMessage = async ({
  to,
  templateName,
  parameters,
  headerImageUrl,
  buttonUrlParam,
  languageCode = "en",
}: SendTemplateArgs) => {
  const credentialSets = getCredentialSets();
  if (credentialSets.length === 0) {
    const err = new Error("No Pinbot/WhatsApp credentials found in environment variables");
    console.error(err.message);
    throw err;
  }

  // Build the template components once (same for every attempt).
  const components: any[] = [];

  // ✅ If template header expects IMAGE, you MUST send this.
  // WhatsApp header media supports JPG/PNG only and must be publicly fetchable.
  // A WebP (or any other format / unreachable URL) is accepted by the API but then
  // dropped — the message never arrives. So ONLY use the dynamic image if it is
  // clearly a .jpg/.jpeg/.png URL; otherwise fall back to the brand PNG so the
  // message always delivers with a valid header image.
  if (headerImageUrl) {
    // Final cheap net for direct callers: reject obviously-unsupported formats by
    // extension. (Order confirmations already deep-validate via resolveDeliverableImage.)
    const isBadFormat = /\.(webp|gif|svg|bmp|tiff?)(\?|#|$)/i.test(headerImageUrl);
    const safeImage = isBadFormat ? ORDER_TEMPLATE_HEADER_IMAGE : headerImageUrl;
    if (isBadFormat) {
      console.warn(
        `[WhatsApp] Header image '${headerImageUrl}' is a non-JPG/PNG format → using default brand image.`
      );
    }
    components.push({
      type: "header",
      parameters: [{ type: "image", image: { link: safeImage } }],
    });
  }

  // ✅ Body params
  if (parameters?.length) {
    components.push({
      type: "body",
      parameters: parameters.map((text) => ({
        type: "text",
        text: String(text ?? ""),
      })),
    });
  }

  // ✅ Dynamic Button parameter
  if (buttonUrlParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [{ type: "text", text: buttonUrlParam }],
    });
  }

  // Locale candidates: a template is approved under ONE language code. WhatsApp
  // Manager's "English" is `en`, "English (US)" is `en_US`, etc. Sending the wrong
  // code fails with 132001 ("does not exist in <lang>"), so we try the configured
  // code first, then the other common English locales until one is found.
  const langCandidates = Array.from(
    new Set(
      [process.env.WHATSAPP_ORDER_LANG, languageCode, "en", "en_US", "en_GB"]
        .filter(Boolean)
        .map((l) => (l as string).trim())
    )
  );

  const buildPayload = (lang: string) => ({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: { name: templateName, language: { code: lang }, components },
  });

  let lastError: any = null;
  for (const creds of credentialSets) {
    const url = `https://partnersv1.pinbot.ai/v3/${creds.phoneNumberId}/messages`;
    for (const lang of langCandidates) {
      try {
        const res = await axios.post(url, buildPayload(lang), {
          headers: { "Content-Type": "application/json", apikey: creds.apiKey },
        });
        console.log(
          `[WhatsApp] Template '${templateName}' sent via number ${creds.phoneNumberId} (locale '${lang}')`
        );
        return res.data;
      } catch (error: any) {
        lastError = error;
        const code = error?.response?.data?.error?.code;
        console.error(
          `WhatsApp template send failed (number ${creds.phoneNumberId}, lang ${lang}):`,
          error?.response?.data || error.message
        );
        // 132001 = template not in THIS locale → try the next locale.
        // Any other error won't be fixed by the locale → stop trying this number.
        if (code !== 132001) break;
      }
    }
  }
  throw lastError;
};

/**
 * Verify a header image is actually DELIVERABLE by WhatsApp (reachable + real
 * content-type image/jpeg or image/png + under 5 MB). WhatsApp silently drops a
 * message whose header image is WebP/oversized/unreachable — and a URL ending in
 * ".png" can still SERVE WebP (our CDN does), which the URL text can't reveal.
 * So we check the real Content-Type via a HEAD request; if it isn't a usable
 * JPG/PNG, return the verified default brand image so the message still delivers.
 */
async function resolveDeliverableImage(url?: string): Promise<string> {
  if (!url) return ORDER_TEMPLATE_HEADER_IMAGE;
  try {
    const res = await axios.head(url, { timeout: 4000, maxRedirects: 3 });
    const type = String(res.headers["content-type"] || "").toLowerCase();
    const len = Number(res.headers["content-length"] || 0);
    const okType =
      type.includes("image/jpeg") || type.includes("image/jpg") || type.includes("image/png");
    const okSize = !len || len < 5 * 1024 * 1024; // WhatsApp media header limit
    if (okType && okSize) return url;
    console.warn(
      `[WhatsApp] Header image not WhatsApp-usable (content-type='${type}', bytes=${len}) → using default brand image. ${url}`
    );
  } catch (e: any) {
    console.warn(
      `[WhatsApp] Header image HEAD check failed (${e?.message}) → using default brand image. ${url}`
    );
  }
  return ORDER_TEMPLATE_HEADER_IMAGE;
}

/**
 * Send an order/booking confirmation using the configured ORDER_TEMPLATE
 * (pjar_booking, image header + dynamic image). If that template isn't available
 * on the number yet (error 132001), automatically retry with ORDER_TEMPLATE_FALLBACK
 * (pjar_order, button) so the user still receives a confirmation.
 *
 * Pass BOTH `headerImageUrl` (used by the image template) and `buttonUrlParam`
 * (used by the button fallback) — the right one is applied per template.
 */
export const sendOrderConfirmationTemplate = async ({
  to,
  parameters,
  headerImageUrl,
  buttonUrlParam,
  languageCode = "en",
}: {
  to: string;
  parameters: string[];
  headerImageUrl?: string;
  buttonUrlParam?: string;
  languageCode?: string;
}) => {
  // For the image template, confirm the image is actually deliverable; otherwise
  // use the verified default so the message is never dropped over a bad image.
  const safeHeaderImage = ORDER_TEMPLATE_HAS_IMAGE_HEADER
    ? await resolveDeliverableImage(headerImageUrl)
    : undefined;
  try {
    return await sendWhatsappTemplateMessage({
      to,
      templateName: ORDER_TEMPLATE,
      parameters,
      languageCode,
      ...(ORDER_TEMPLATE_HAS_IMAGE_HEADER
        ? { headerImageUrl: safeHeaderImage }
        : { buttonUrlParam }),
    });
  } catch (err: any) {
    const code = err?.response?.data?.error?.code;
    const canFallback =
      code === 132001 &&
      ORDER_TEMPLATE_FALLBACK &&
      ORDER_TEMPLATE_FALLBACK !== ORDER_TEMPLATE;
    if (!canFallback) throw err;
    console.warn(
      `[WhatsApp] Primary template '${ORDER_TEMPLATE}' unavailable (132001) → falling back to '${ORDER_TEMPLATE_FALLBACK}'`
    );
    return await sendWhatsappTemplateMessage({
      to,
      templateName: ORDER_TEMPLATE_FALLBACK,
      parameters,
      languageCode,
      buttonUrlParam,
    });
  }
};
