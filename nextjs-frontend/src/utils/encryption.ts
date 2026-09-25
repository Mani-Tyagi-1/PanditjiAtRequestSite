import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY)) ||
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_ENCRYPTION_KEY) ||
  "6b9dec45624b76a35233223264781baf4becc3010bdf5b9655f7edea4aeb102a";

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
