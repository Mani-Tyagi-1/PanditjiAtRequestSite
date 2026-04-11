import { Request, Response } from 'express';
import axios from 'axios';

export const getGoogleMapsConfig = (req: Request, res: Response): void => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ message: "Google Maps API Key not configured on the server." });
    return;
  }
  res.status(200).json({ success: true, message: "Google Maps Config fetched.", data: { apiKey } });
  return;
};

export const proxyFetchPromos = async (req: Request, res: Response) => {
    try {
        const response = await axios.get("https://vedicvaibhav.com/api/fetch-promo-vedic");
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch promotions from external service." });
    }
};

export const proxyFetchCoupons = async (req: Request, res: Response) => {
    try {
        const response = await axios.get("https://ecomapp.vedicvaibhav.com/api/coupons/app/par");
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Coupon Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch coupons from external service." });
    }
};

export const proxyCheckCouponUsage = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const response = await axios.get(`https://ecomapp.vedicvaibhav.com/api/coupons/app/par/user/${userId}`);
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Coupon Usage Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch coupon usage from external service." });
    }
};

export const proxyApplyCoupon = async (req: Request, res: Response) => {
    try {
        const response = await axios.post("https://ecomapp.vedicvaibhav.com/api/coupons/apply", req.body);
        res.status(response.status).json(response.data);
    } catch (error: any) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "Failed to apply coupon through external service.";
        console.error("Apply Coupon Proxy error:", message);
        res.status(status).json({ message });
    }
};
