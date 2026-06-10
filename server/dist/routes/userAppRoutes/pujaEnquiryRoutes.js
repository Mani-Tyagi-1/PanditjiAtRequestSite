"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pujaEnquiryController_1 = require("../../controller/userApp/pujaEnquiryController");
const router = express_1.default.Router();
router.post("/puja-enquiries", async (req, res, next) => {
    try {
        await (0, pujaEnquiryController_1.createPujaEnquiry)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get("/puja-enquiries", async (req, res, next) => {
    try {
        await (0, pujaEnquiryController_1.getAllPujaEnquiries)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
