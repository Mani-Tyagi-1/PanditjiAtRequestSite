"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const testimonialController_1 = require("../../controller/userApp/testimonialController");
const router = express_1.default.Router();
// GET - Fetch all active testimonials
router.get("/fetch-all-testimonials", async (req, res, next) => {
    try {
        await (0, testimonialController_1.fetchAllTestimonials)(req, res);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
