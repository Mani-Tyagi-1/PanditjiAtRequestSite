"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const poojaController_1 = require("../../controller/userApp/poojaController");
const blogController_1 = require("../../controller/userApp/blogController");
const router = express_1.default.Router();
// GET - Fetch all poojas
router.get("/fetch-all-poojas", async (req, res, next) => {
    try {
        await (0, poojaController_1.fetchAllPoojas)(req, res);
    }
    catch (err) {
        next(err);
    }
});
// GET - Fetch Pooja By Id
router.get("/fetch-pooja-by-id/:id", async (req, res, next) => {
    try {
        await (0, poojaController_1.fetchPoojaById)(req, res);
    }
    catch (err) {
        next(err);
    }
});
router.get("/fetch-pooja-by-cat-id/:id", async (req, res, next) => {
    try {
        await (0, poojaController_1.fetchPoojabycategoryId)(req, res);
    }
    catch (err) {
        next(err);
    }
});
router.get("/fetch-all-blogs", async (req, res, next) => {
    try {
        await (0, blogController_1.fetchAllBlogs)(req, res);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
