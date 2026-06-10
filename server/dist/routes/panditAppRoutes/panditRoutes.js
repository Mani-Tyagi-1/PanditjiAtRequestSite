"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const panditController_1 = require("../../controller/panditApp/panditController");
const panditUploadMiddleware_1 = require("../../middlewares/panditUploadMiddleware");
const panditStatsController_1 = require("../../controller/panditApp/panditStatsController");
const router = express_1.default.Router();
/**
 * Multi-file upload:
 * We will accept up to 3 different fields:
 *  - profile_image
 *  - degree_file
 *  - aadhar_file
 */
router.post("/register", (0, panditUploadMiddleware_1.createMultipleFileUpload)([
    { name: "profile_image", maxCount: 1 },
    { name: "degree_file", maxCount: 1 },
    { name: "aadhar_file", maxCount: 1 },
]), (req, res) => {
    (0, panditController_1.createPandit)(req, res);
});
/**
 * GET location suggestions (Mock or real)
 */
router.get("/locations", (req, res) => {
    (0, panditController_1.getLocationSuggestions)(req, res);
});
router.get("/fetch-all-pandit", async (req, res, next) => {
    try {
        await (0, panditController_1.fetchAllPandit)(req, res);
    }
    catch (err) {
        next(err);
    }
});
router.get("/fetch-pandit-by-id/:id", async (req, res, next) => {
    try {
        await (0, panditController_1.fetchPanditById)(req, res);
    }
    catch (err) {
        next(err);
    }
});
router.get("/fetch-pandit-stats/:panditId", async (req, res, next) => {
    try {
        await (0, panditStatsController_1.getPanditStats)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get("/:id/location", async (req, res, next) => {
    try {
        await (0, panditController_1.getPanditLocation)(req, res);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
