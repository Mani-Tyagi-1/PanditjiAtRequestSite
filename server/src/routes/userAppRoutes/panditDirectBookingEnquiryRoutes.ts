import express from "express";
import {
  createPanditDirectBookingEnquiry,
  getUserDirectBookings,
} from "../../controller/userApp/panditDirectBookingEnquiryController";

const router = express.Router();

router.post("/pandit-direct-bookings", createPanditDirectBookingEnquiry);
router.get("/pandit-direct-bookings/user/:phone", getUserDirectBookings);

export default router;
