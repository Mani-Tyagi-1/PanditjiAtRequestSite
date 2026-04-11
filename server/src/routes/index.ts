import { Router } from "express";

// Import all routes
import panditRoutes from "./panditAppRoutes/panditRoutes";
import poojaRoutes from "./userAppRoutes/poojaRoutes";
import pujaCategoryRoutes from "./userAppRoutes/pujaCategoryRoutes";
import mobileOtpRoutes from "./userAppRoutes/mobileOtpRoutes";
import userAddressRoutes from "./userAppRoutes/userAddressRoutes";
import userRoutes from "./userAppRoutes/userRoutes";
import configRoutes from "./userAppRoutes/configRoutes";
import testimonialRoutes from "./userAppRoutes/testimonialRoutes";
import poojaBookingRoutes from "./poojaBookingRouts/poojaBookingRoutes";
import callingRoutes from "./pushroutescontroller/callingroutesused";
import pushRoutes from "./pushroutescontroller/pushnotificationfirebaseroutes";
import streamRoutes from "./voiceCallRoutes/genTokenRoutes";
import panditAuthRoutes from "./panditAppRoutes/panditAuthRoutes";
import panditAddressRoutes from "./panditAppRoutes/panditAddressRoutes";

const router = Router();

// Mount routes
router.use("/pandit", panditRoutes);
router.use("/", poojaRoutes);
router.use("/", pujaCategoryRoutes);
router.use("/", mobileOtpRoutes);
router.use("/addresses", userAddressRoutes);
router.use("/config", configRoutes);
router.use("/", testimonialRoutes);
router.use("/", poojaBookingRoutes);
router.use("/", userRoutes);
router.use("/calls", callingRoutes);
router.use("/", pushRoutes);
router.use("/stream", streamRoutes);

// Pandit Auth & Address (these were mounted at / in the original code)
router.use("/", panditAuthRoutes);
router.use("/", panditAddressRoutes);

export default router;
