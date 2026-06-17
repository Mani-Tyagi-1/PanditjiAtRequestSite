import axios from "axios";

const getCredentialSets = () => {
  const sets = [];

  // Primary: PINBOT_API_KEY (confirmed working with pjar_order template in 'en')
  if (process.env.PINBOT_API_KEY && process.env.PINBOT_PHONE_NUMBER_ID) {
    sets.push({
      apiKey: process.env.PINBOT_API_KEY.trim(),
      phoneNumberId: process.env.PINBOT_PHONE_NUMBER_ID.trim(),
    });
  }

  // Secondary fallback: WHATSAPP_PINBOT credentials
  if (process.env.WHATSAPP_PINBOT_API_KEY && process.env.WHATSAPP_PINBOT_PHONE_NUMBER_ID) {
    sets.push({
      apiKey: process.env.WHATSAPP_PINBOT_API_KEY.trim(),
      phoneNumberId: process.env.WHATSAPP_PINBOT_PHONE_NUMBER_ID.trim(),
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

  let lastError: any = null;
  for (const creds of credentialSets) {
    try {
      const url = `https://partnersv1.pinbot.ai/v3/${creds.phoneNumberId}/messages`;

      const components: any[] = [];

      // ✅ If template header expects IMAGE, you MUST send this
      if (headerImageUrl) {
        components.push({
          type: "header",
          parameters: [
            {
              type: "image",
              image: { link: headerImageUrl },
            },
          ],
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
          parameters: [
            {
              type: "text",
              text: buttonUrlParam,
            },
          ],
        });
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
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
        `WhatsApp template send failed with credentials ID ${creds.phoneNumberId}:`,
        error?.response?.data || error.message
      );
    }
  }
  throw lastError;
};
