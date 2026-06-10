"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPoojaCategoryById = exports.fetchAllPoojaCategory = void 0;
// import poojaModel from "../model/poojaModel";
const pujaCategoryModal_1 = __importDefault(require("../../model/userApp/pujaCategoryModal"));
// Get all active poojas
const fetchAllPoojaCategory = async (req, res) => {
    try {
        const poojaCategory = await pujaCategoryModal_1.default.find();
        return res.status(200).json({ poojaCategory });
    }
    catch (error) {
        console.error("Error fetching poojas:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.fetchAllPoojaCategory = fetchAllPoojaCategory;
// Get one pooja by ID — only if it's active
const fetchPoojaCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const poojaCategory = await pujaCategoryModal_1.default.findOne({ _id: id });
        if (!poojaCategory) {
            return res.status(404).json({ message: "Pooja Category not found or inactive" });
        }
        return res.status(200).json({ poojaCategory });
    }
    catch (error) {
        console.error("Error fetching pooja category by id:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.fetchPoojaCategoryById = fetchPoojaCategoryById;
