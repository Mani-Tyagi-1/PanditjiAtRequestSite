"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEncryptedResponse = exports.decryptRequest = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
require("dotenv/config");
// --- Centralized Encryption Setup ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    console.error("FATAL ERROR: ENCRYPTION_KEY is not defined in environment variables.");
    process.exit(1);
}
/**
 * Encrypts a JSON payload.
 * @param payload The data to encrypt.
 * @returns An object with the encrypted string.
 */
const encryptPayload = (payload) => {
    // ✅ STEP 4: Log the raw data BEFORE sending it back to the app
    // console.log(" SERVER: Encrypting Response Data  ", payload);
    const ciphertext = crypto_js_1.default.AES.encrypt(JSON.stringify(payload), ENCRYPTION_KEY).toString();
    return { encrypted: ciphertext };
};
/**
 * Middleware to decrypt the incoming request body.
 * It expects the body to be in the format { encrypted: "..." }.
 * If successful, it replaces `req.body` with the decrypted plaintext object.
 */
const decryptRequest = (req, res, next) => {
    const requestBody = req.body;
    if (!requestBody || typeof requestBody.encrypted !== 'string') {
        res.status(400).json({ message: "Invalid encrypted payload: 'encrypted' property missing or not a string." });
        return; // void
    }
    try {
        const bytes = crypto_js_1.default.AES.decrypt(requestBody.encrypted, ENCRYPTION_KEY);
        const plaintext = bytes.toString(crypto_js_1.default.enc.Utf8);
        if (!plaintext) {
            res.status(400).json({ message: 'Decryption resulted in empty plaintext. Check encryption key.' });
            return;
        }
        req.body = JSON.parse(plaintext);
        next();
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to decrypt payload. Please check your encryption key and data format.' });
    }
};
exports.decryptRequest = decryptRequest;
/**
 * A helper function to send an encrypted JSON response.
 * @param res The Express Response object.
 * @param statusCode The HTTP status code.
 * @param payload The JSON payload to encrypt and send.
 */
// middleware/encryption.ts
const sendEncryptedResponse = (res, statusCode, payload) => {
    try {
        const encryptedPayload = encryptPayload(payload);
        return res.status(statusCode).json(encryptedPayload);
    }
    catch (error) {
        console.error("Encryption failed before sending response:", error.message);
        // Send a generic server error if encryption itself fails
        return res.status(500).json({ message: "An internal server error occurred during response encryption." });
    }
};
exports.sendEncryptedResponse = sendEncryptedResponse;
