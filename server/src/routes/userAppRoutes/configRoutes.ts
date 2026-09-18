import { Router } from "express";
import { getCurrencyConfig, getGoogleMapsConfig, proxyFetchPromos, proxyFetchCoupons, proxyCheckCouponUsage, proxyApplyCoupon, proxyFetchAllNewChadhava } from "../../controller/userApp/configController";

const router = Router();

router.get("/maps", getGoogleMapsConfig);
router.get("/currency", getCurrencyConfig);
router.get("/fetch-promo-proxy", proxyFetchPromos);
router.get("/fetch-coupons-proxy", proxyFetchCoupons);
router.get("/check-coupon-usage-proxy/:userId", proxyCheckCouponUsage);
router.post("/apply-coupon-proxy", proxyApplyCoupon);
router.get("/get-all-new-chadhava-proxy", proxyFetchAllNewChadhava);

export default router;
