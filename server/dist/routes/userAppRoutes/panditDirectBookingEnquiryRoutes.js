"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const panditDirectBookingEnquiryController_1 = require("../../controller/userApp/panditDirectBookingEnquiryController");
const router = express_1.default.Router();
router.post("/pandit-direct-bookings", panditDirectBookingEnquiryController_1.createPanditDirectBookingEnquiry);
exports.default = router;
