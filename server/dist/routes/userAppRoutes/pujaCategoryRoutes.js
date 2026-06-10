"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import { fetchAllPoojas, fetchPoojaById } from "../controller/poojaController";
const poojaCategoryController_1 = require("../../controller/userApp/poojaCategoryController");
const router = express_1.default.Router();
// GET - Fetch all poojas
router.get("/fetch-all-pooja-category", async (req, res, next) => {
    try {
        await (0, poojaCategoryController_1.fetchAllPoojaCategory)(req, res);
    }
    catch (err) {
        next(err);
    }
});
// GET - Fetch Pooja By Id
router.get("/fetch-pooja-category-by-id/:id", async (req, res, next) => {
    try {
        await (0, poojaCategoryController_1.fetchPoojaCategoryById)(req, res);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
