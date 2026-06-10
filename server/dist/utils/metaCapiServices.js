"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMetaCapiEvent = sendMetaCapiEvent;
exports.sendMetaPurchaseEvent = sendMetaPurchaseEvent;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
function sha256Hex(input) {
    return crypto_1.default.createHash("sha256").update(input).digest("hex");
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
/**
 * Meta expects phone normalized (digits only, ideally with country code) before hashing.
 * For India: if 10-digit mobile, prefix 91.
 */
function normalizePhone(phone, defaultCountryCode = "91") {
    let digits = String(phone || "").replace(/\D/g, "");
    if (!digits)
        return "";
    if (digits.startsWith("00"))
        digits = digits.slice(2);
    if (digits.length === 10)
        digits = `${defaultCountryCode}${digits}`;
    return digits;
}
function normalizeActionSource(input, fallback) {
    const v = String(input || "").trim().toLowerCase();
    if (v === "website")
        return "website";
    if (v === "app")
        return "app";
    if (v === "physical_store")
        return "physical_store";
    if (v === "chat")
        return "chat";
    if (v === "email")
        return "email";
    if (v === "phone_call")
        return "phone_call";
    if (v === "system_generated")
        return "system_generated";
    if (v === "other")
        return "other";
    return fallback;
}
function to01(v, fallback) {
    if (v === 0 || v === "0" || v === false || v === "false")
        return 0;
    if (v === 1 || v === "1" || v === true || v === "true")
        return 1;
    return fallback;
}
function buildUserData(args) {
    const user_data = {};
    if (args.email) {
        const emNorm = normalizeEmail(args.email);
        user_data.em = [sha256Hex(emNorm)];
    }
    if (args.phone) {
        const phNorm = normalizePhone(args.phone);
        if (phNorm)
            user_data.ph = [sha256Hex(phNorm)];
    }
    if (args.externalId) {
        const extNorm = String(args.externalId).trim();
        if (extNorm)
            user_data.external_id = [sha256Hex(extNorm)];
    }
    // NOT hashed:
    if (args.clientIp)
        user_data.client_ip_address = args.clientIp;
    if (args.userAgent)
        user_data.client_user_agent = args.userAgent;
    if (args.fbp)
        user_data.fbp = args.fbp;
    if (args.fbc)
        user_data.fbc = args.fbc;
    return user_data;
}
function sanitizeEventForWebsite(event) {
    // ✅ if website, never allow app_data (prevents extinfo-related rejections)
    if (event.action_source === "website") {
        if (event.app_data)
            delete event.app_data;
    }
    // ✅ Meta expects these for website events
    // (event_source_url + client_user_agent). :contentReference[oaicite:2]{index=2}
    if (event.action_source === "website") {
        const ua = String(event.user_data?.client_user_agent || "").trim();
        const url = String(event.event_source_url || "").trim();
        if (!ua) {
            throw new Error("Meta CAPI: website events require user_data.client_user_agent");
        }
        if (!url) {
            throw new Error("Meta CAPI: website events require event_source_url");
        }
    }
}
/**
 * Sends server event to Meta CAPI.
 * Uses application/x-www-form-urlencoded with `data` as JSON string.
 */
async function sendMetaCapiEvent(params) {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const apiVersion = process.env.META_GRAPH_API_VERSION || "v24.0";
    if (!pixelId || !accessToken) {
        return {
            events_received: 0,
            messages: ["Meta CAPI skipped: META_PIXEL_ID or META_ACCESS_TOKEN missing"],
        };
    }
    // ✅ Final safety sanitize (prevents extinfo errors for website)
    sanitizeEventForWebsite(params.event);
    const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;
    const body = new URLSearchParams();
    body.append("data", JSON.stringify([params.event]));
    body.append("access_token", accessToken);
    if (params.testEventCode) {
        body.append("test_event_code", params.testEventCode);
    }
    const resp = await axios_1.default.post(url, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 12000,
        validateStatus: () => true,
    });
    if (resp.status < 200 || resp.status >= 300) {
        const msg = (resp.data && JSON.stringify(resp.data)) || `HTTP_${resp.status}`;
        throw new Error(`Meta CAPI request failed: ${msg}`);
    }
    return resp.data;
}
async function sendMetaPurchaseEvent(args) {
    const event_time = Math.floor(Date.now() / 1000);
    // ✅ IMPORTANT: fallback is WEBSITE now (because your source is website)
    const action_source = normalizeActionSource(args.actionSource, "website");
    const event_id = `puja_purchase_${String(args.orderID)}`;
    const user_data = buildUserData({
        email: args.email || null,
        phone: args.phone || null,
        externalId: args.externalId || null,
        clientIp: args.clientIp || null,
        userAgent: args.userAgent || null,
        fbp: args.fbp || null,
        fbc: args.fbc || null,
    });
    const event = {
        event_name: "Purchase",
        event_time,
        event_id,
        action_source,
        user_data,
        custom_data: {
            currency: String(args.currency || "INR"),
            value: Number(args.value || 0),
            ...(args.deliveryCategory && { delivery_category: args.deliveryCategory }),
            contents: [
                {
                    id: String(args.contentId || "PUJA"),
                    quantity: 1,
                },
            ],
        },
    };
    // ✅ WEBSITE: event_source_url is required
    if (action_source === "website") {
        const fallbackUrl = process.env.META_DEFAULT_EVENT_SOURCE_URL || "";
        const finalUrl = (args.eventSourceUrl || fallbackUrl || "").trim();
        if (!finalUrl) {
            throw new Error("Meta CAPI: action_source=website requires event_source_url (set META_DEFAULT_EVENT_SOURCE_URL or pass eventSourceUrl)");
        }
        event.event_source_url = finalUrl;
        // ✅ hard-strip any accidental app_data
        if (event.app_data)
            delete event.app_data;
    }
    // ✅ APP: (not used by you right now) keep correct placement in app_data
    if (action_source === "app") {
        const adv = to01(args.advertiserTrackingEnabled, 0);
        const app = to01(args.applicationTrackingEnabled, adv);
        event.app_data = {
            advertiser_tracking_enabled: adv,
            application_tracking_enabled: app,
            // DO NOT send extinfo unless you build it correctly from real device info.
        };
    }
    const testEventCode = (process.env.META_TEST_EVENT_CODE || "").trim() || null;
    return sendMetaCapiEvent({ event, testEventCode });
}
