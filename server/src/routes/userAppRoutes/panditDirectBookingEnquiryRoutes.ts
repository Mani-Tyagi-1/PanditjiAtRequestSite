import express from "express";
import { createPanditDirectBookingEnquiry } from "../../controller/userApp/panditDirectBookingEnquiryController";

const router = express.Router();

router.post("/pandit-direct-bookings", createPanditDirectBookingEnquiry);

export default router;
