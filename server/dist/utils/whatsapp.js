"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsappTemplateMessage = exports.sendWhatsappMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const PINBOT_API_KEY = process.env.PINBOT_API_KEY;
const PHONE_NUMBER_ID = process.env.PINBOT_PHONE_NUMBER_ID;
const sendWhatsappMessage = async ({ to, message, }) => {
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
        const res = await axios_1.default.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                apikey: PINBOT_API_KEY,
            },
        });
        return res.data;
    }
    catch (error) {
        console.error("WhatsApp send failed:", error?.response?.data || error.message);
        throw error;
    }
};
exports.sendWhatsappMessage = sendWhatsappMessage;
const sendWhatsappTemplateMessage = async ({ to, templateName, parameters, headerImageUrl, buttonUrlParam, languageCode = "en", }) => {
    try {
        const url = `https://partnersv1.pinbot.ai/v3/${PHONE_NUMBER_ID}/messages`;
        const components = [];
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
        const res = await axios_1.default.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                apikey: PINBOT_API_KEY,
            },
        });
        return res.data;
    }
    catch (error) {
        console.error("WhatsApp template send failed:", error?.response?.data || error.message);
        throw error;
    }
};
exports.sendWhatsappTemplateMessage = sendWhatsappTemplateMessage;
