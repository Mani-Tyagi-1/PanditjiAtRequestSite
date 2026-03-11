import express, { Router } from "express";
import { getGoogleMapsConfig } from "../../controller/userApp/configController";
// import { getGoogleMapsConfig } from "../../controller/userApp/configController";

const router = Router();

router.get("/maps", getGoogleMapsConfig);

export default router;
