"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genStreamToken = void 0;
const node_sdk_1 = require("@stream-io/node-sdk");
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const streamClient = new node_sdk_1.StreamClient(apiKey, apiSecret);
const genStreamToken = async (req, res) => {
    try {
        const userId = req.id || req.params.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const validity = 60 * 600; // 1 hour
        const token = streamClient.generateUserToken({
            user_id: userId,
            validity_in_seconds: validity,
        });
        res.status(200).json({ token, userId });
    }
    catch (e) {
        res.status(500).json({ message: e?.message ?? "Token error" });
    }
};
exports.genStreamToken = genStreamToken;
