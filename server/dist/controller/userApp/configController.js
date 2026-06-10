"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyApplyCoupon = exports.proxyCheckCouponUsage = exports.proxyFetchCoupons = exports.proxyFetchPromos = exports.getGoogleMapsConfig = void 0;
const axios_1 = __importDefault(require("axios"));
const getGoogleMapsConfig = (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        res.status(500).json({ message: "Google Maps API Key not configured on the server." });
        return;
    }
    res.status(200).json({ apiKey });
    return;
};
exports.getGoogleMapsConfig = getGoogleMapsConfig;
const proxyFetchPromos = async (req, res) => {
    try {
        const response = await axios_1.default.get("https://vedicvaibhav.com/api/fetch-promo-vedic");
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error("Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch promotions from external service." });
    }
};
exports.proxyFetchPromos = proxyFetchPromos;
const proxyFetchCoupons = async (req, res) => {
    try {
        const response = await axios_1.default.get("https://ecomapp.vedicvaibhav.com/api/coupons/app/par");
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error("Coupon Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch coupons from external service." });
    }
};
exports.proxyFetchCoupons = proxyFetchCoupons;
const proxyCheckCouponUsage = async (req, res) => {
    try {
        const { userId } = req.params;
        const response = await axios_1.default.get(`https://ecomapp.vedicvaibhav.com/api/coupons/app/par/user/${userId}`);
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error("Coupon Usage Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch coupon usage from external service." });
    }
};
exports.proxyCheckCouponUsage = proxyCheckCouponUsage;
const proxyApplyCoupon = async (req, res) => {
    try {
        const response = await axios_1.default.post("https://ecomapp.vedicvaibhav.com/api/coupons/apply", req.body);
        res.status(response.status).json(response.data);
    }
    catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "Failed to apply coupon through external service.";
        console.error("Apply Coupon Proxy error:", message);
        res.status(status).json({ message });
    }
};
exports.proxyApplyCoupon = proxyApplyCoupon;
