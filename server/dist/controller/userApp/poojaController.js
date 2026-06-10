"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPoojabycategoryId = exports.fetchPoojaById = exports.fetchAllPoojas = void 0;
const poojaModel_1 = __importDefault(require("../../model/userApp/poojaModel"));
// Get all active poojas
const fetchAllPoojas = async (req, res) => {
    try {
        const poojas = await poojaModel_1.default.find({ isActive: true });
        return res.status(200).json({ poojas });
    }
    catch (error) {
        console.error("Error fetching poojas:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.fetchAllPoojas = fetchAllPoojas;
// Get one pooja by ID — only if it's active
const fetchPoojaById = async (req, res) => {
    try {
        const { id } = req.params;
        const pooja = await poojaModel_1.default.findOne({ _id: id, isActive: true });
        if (!pooja) {
            return res.status(404).json({ message: "Pooja not found or inactive" });
        }
        return res.status(200).json({ pooja });
    }
    catch (error) {
        console.error("Error fetching pooja by id:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.fetchPoojaById = fetchPoojaById;
const fetchPoojabycategoryId = async (req, res) => {
    try {
        const { id } = req.params;
        const poojas = await poojaModel_1.default
            .find({
            isActive: true,
            "mainCategories.id": id,
        })
            .select("_id poojaID poojaNameEng poojaNameHindi poojaMode poojaPriceOnline poojaPriceOffline mainCategories subCategories poojaCardImage isFeatured isActive")
            .lean();
        return res.status(200).json({
            message: "Poojas fetched successfully",
            poojas,
        });
    }
    catch (error) {
        console.error("Error fetching poojas by category id:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.fetchPoojabycategoryId = fetchPoojabycategoryId;
