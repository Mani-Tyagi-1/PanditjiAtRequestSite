import { Request, Response } from 'express';
import axios from 'axios';
import { panditJiAtRequestMongooose } from '../../config/connectDB';

export const getGoogleMapsConfig = (req: Request, res: Response): void => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ message: "Google Maps API Key not configured on the server." });
    return;
  }
  res.status(200).json({ apiKey });
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

// Returns the chadhava catalog shown on the list page: the legacy Vedic Vaibhav
// offerings (external REST API) MERGED with the new-format chadhavas stored in
// our own PJAR `chadhavas` collection. Either source can fail independently
// without breaking the other — we return whatever we could gather.
export const proxyFetchAllNewChadhava = async (req: Request, res: Response) => {
    // ── Legacy source: external Vedic Vaibhav newChadhava API ──
    let externalList: any[] = [];
    try {
        const response = await axios.get("https://vedicvaibhav.com/api/newChadhava/get-all-new-chadhava");
        const d = response.data;
        externalList = Array.isArray(d?.data)
            ? d.data
            : Array.isArray(d?.items)
                ? d.items
                : Array.isArray(d)
                    ? d
                    : [];
    } catch (error: any) {
        console.error("New Chadhava Proxy fetch error:", error.message);
    }

    // ── New source: our own PJAR `chadhavas` collection (admin-managed) ──
    // Read via the native driver so the raw admin-format documents come back
    // untouched (their shape differs from the strict Chadhava mongoose model).
    let localList: any[] = [];
    try {
        localList = await panditJiAtRequestMongooose.connection
            .collection("chadhavas")
            .find({ isActive: { $ne: false } })
            .sort({ createdAt: -1 })
            .toArray();
    } catch (error: any) {
        console.error("Local chadhava fetch error:", error.message);
    }

    // New PJAR offerings first, then the legacy Vedic Vaibhav ones.
    res.status(200).json({ success: true, data: [...localList, ...externalList] });
};
