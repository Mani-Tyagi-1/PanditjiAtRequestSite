"use strict";
// src/config/dbConnection.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.panditJiAtRequestMongooose = exports.panditJiAtRequestDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Create a separate Mongoose instance for VedicVaibhavMongoose
const panditJiAtRequestMongooose = new mongoose_1.default.Mongoose();
exports.panditJiAtRequestMongooose = panditJiAtRequestMongooose;
const panditJiAtRequestDB = async () => {
    try {
        const conn = await panditJiAtRequestMongooose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB (panditJiAtRequest) Connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('An unknown error occurred');
        }
        process.exit(1);
    }
};
exports.panditJiAtRequestDB = panditJiAtRequestDB;
