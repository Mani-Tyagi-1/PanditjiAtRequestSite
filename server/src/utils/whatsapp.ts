import axios from "axios";

const PINBOT_API_KEY = process.env.PINBOT_API_KEY!;
const PHONE_NUMBER_ID = process.env.PINBOT_PHONE_NUMBER_ID!;

export const sendWhatsappMessage = async ({
  to,
  message,
}: {
  to: string;
  message: string;
}) => {
  try {
    const url = `https://partnersv1.pinbot.ai/v3/${PHONE_NUMBER_ID}/messages`;

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
        apikey: PINBOT_API_KEY,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error(
      "WhatsApp send failed:",
      error?.response?.data || error.message
    );
    throw error;
  }
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
  try {
    const url = `https://partnersv1.pinbot.ai/v3/${PHONE_NUMBER_ID}/messages`;

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
        index: "0",
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
        apikey: PINBOT_API_KEY,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error(
      "WhatsApp template send failed:",
      error?.response?.data || error.message
    );
    throw error;
  }
};
