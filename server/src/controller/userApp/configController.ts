import { Request, Response } from 'express';
import axios from 'axios';
import { panditJiAtRequestMongooose } from '../../config/connectDB';
import { currencyConfig } from '../../config/currency';
import { clientIp, countryFromRequest } from '../../utils/geoip';

/**
 * GET /api/config/currency — the live FX table plus the caller's country.
 *
 * Two jobs, one request, on purpose: the browser needs both before it can price
 * the page, and a second round trip in front of a checkout buys nothing.
 *
 *   • rates    — the browser ships a bootstrap copy so the first paint never
 *                waits on this; pulling the live one is what lets a rate change
 *                (FX_RATES, see config/currency.ts) reach every visitor with no
 *                frontend deploy, and keeps the displayed price equal to the
 *                billed one.
 *   • country  — resolved from the IP, which is the only signal that survives a
 *                VPN. The browser's timezone guess paints first; this corrects
 *                it. Null when it cannot be determined, which the browser reads
 *                as "keep your guess".
 *
 * `no-store` is load-bearing. The old `public, max-age=300` was correct for a
 * rates-only response and would be a privacy bug now: a shared or CDN cache
 * would hand one visitor's country to the next. The payload is a few hundred
 * bytes, so not caching it costs nothing measurable — and it makes a rate
 * change take effect on the very next page load.
 */
export const getCurrencyConfig = async (req: Request, res: Response): Promise<void> => {
  // Never allowed to fail the response: without a country the browser keeps its
  // own detection, which is exactly the behaviour before geo-IP existed.
  const country = await countryFromRequest(req).catch(() => null);

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    ...currencyConfig(),
    country,
    // `?debug=1` echoes the IP this request was resolved from — the one thing
    // you cannot otherwise see, and the first thing to check when detection
    // "doesn't work". If it comes back as the server's own address or null,
    // the proxy in front is not passing X-Forwarded-For and no geo lookup can
    // succeed. It is only the caller's own IP, so echoing it tells them
    // nothing they could not already read off any what-is-my-ip page.
    ...(req.query.debug === '1' && { debugIp: clientIp(req) }),
  });
};

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
