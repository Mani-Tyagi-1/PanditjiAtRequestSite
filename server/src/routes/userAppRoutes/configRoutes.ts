import { Router } from "express";
import { getGoogleMapsConfig, proxyFetchPromos, proxyFetchCoupons, proxyCheckCouponUsage, proxyApplyCoupon } from "../../controller/userApp/configController";

const router = Router();

router.get("/maps", getGoogleMapsConfig);
router.get("/fetch-promo-proxy", proxyFetchPromos);
router.get("/fetch-coupons-proxy", proxyFetchCoupons);
router.get("/check-coupon-usage-proxy/:userId", proxyCheckCouponUsage);
router.post("/apply-coupon-proxy", proxyApplyCoupon);

export default router;
