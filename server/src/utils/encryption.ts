// /src/middleware/encryption.ts (or your preferred location)
import { Request, Response, NextFunction, RequestHandler } from 'express';
import CryptoJS from "crypto-js";
import 'dotenv/config';

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
const encryptPayload = (payload: any): { encrypted: string } => {
  // ✅ STEP 4: Log the raw data BEFORE sending it back to the app
  // console.log(" SERVER: Encrypting Response Data  ", payload);
  
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), ENCRYPTION_KEY).toString();
  return { encrypted: ciphertext };
};

/**
 * Middleware to decrypt the incoming request body.
 * It expects the body to be in the format { encrypted: "..." }.
 * If successful, it replaces `req.body` with the decrypted plaintext object.
 */
export const decryptRequest: RequestHandler = (req, res, next) => {
  const requestBody = req.body;

  if (!requestBody || typeof requestBody.encrypted !== 'string') {
    res.status(400).json({ message: "Invalid encrypted payload: 'encrypted' property missing or not a string." });
    return; // void
  }

  try {
    const bytes = CryptoJS.AES.decrypt(requestBody.encrypted, ENCRYPTION_KEY);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      res.status(400).json({ message: 'Decryption resulted in empty plaintext. Check encryption key.' });
      return;
    }
    req.body = JSON.parse(plaintext);
    next();
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to decrypt payload. Please check your encryption key and data format.' });
  }
};

/**
 * A helper function to send an encrypted JSON response.
 * @param res The Express Response object.
 * @param statusCode The HTTP status code.
 * @param payload The JSON payload to encrypt and send.
 */
// middleware/encryption.ts

export const sendEncryptedResponse = (res: Response, statusCode: number, payload: any) => {
    try {
        const encryptedPayload = encryptPayload(payload);
        return res.status(statusCode).json(encryptedPayload);
    } catch (error: any) {
        console.error("Encryption failed before sending response:", error.message);
        // Send a generic server error if encryption itself fails
        return res.status(500).json({ message: "An internal server error occurred during response encryption." });
    }
}