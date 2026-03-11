import CryptoJS from "crypto-js";

// Make sure to set VITE_ENCRYPTION_KEY in your frontend .env file!
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.warn("VITE_ENCRYPTION_KEY is not defined in environment variables. Encryption will fail.");
}

/**
 * Encrypts a JSON payload using AES, matching the backend's logic.
 * @param payload The data object to encrypt
 * @returns { encrypted: string } The encrypted payload ready to be sent to backend
 */
export const encryptPayload = (payload: any): { encrypted: string } => {
    if (!ENCRYPTION_KEY) return { encrypted: '' };
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), ENCRYPTION_KEY).toString();
    return { encrypted: ciphertext };
};

/**
 * Decrypts an AES encrypted payload coming from the backend.
 * Expects the raw encrypted string.
 * @param encryptedData The ciphertext string
 * @returns The parsed JSON object, or null if failed
 */
export const decryptData = (encryptedData: string): any => {
    if (!ENCRYPTION_KEY) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedText);
    } catch (err) {
        console.error("Decryption failed:", err);
        return null;
    }
};
