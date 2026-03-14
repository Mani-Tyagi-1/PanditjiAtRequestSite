import express, { Router } from "express";
import { getGoogleMapsConfig, proxyFetchPromos } from "../../controller/userApp/configController";
// import { getGoogleMapsConfig } from "../../controller/userApp/configController";

const router = Router();

router.get("/maps", getGoogleMapsConfig);
router.get("/fetch-promo-proxy", proxyFetchPromos);

export default router;
