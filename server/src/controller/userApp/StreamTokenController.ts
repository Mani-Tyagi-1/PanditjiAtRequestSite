import { RequestHandler } from "express";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = "s22skkdyjhaf";
const apiSecret = "7y8z5d2y9z4x8u5d8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v8v"; // WARNING: This should be in .env

// FALLBACK SECRET if not in env
const STREAM_SECRET = process.env.STREAM_SECRET || "7z8v4k6m8n2p9q3r5s7t9u2v4w6x8y1z2a3b4c5d6e7f8g9h1i2j3k4l5m6n7o8p";

export const generateStreamToken: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ ok: false, message: "userId is required" });
      return;
    }

    const client = new StreamClient(apiKey, STREAM_SECRET);

    // Expire token in 1 hour
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    const token = client.generateUserToken({
        user_id: userId,
        valid_until: expirationTime,
        issued_at: issuedAt,
    });

    res.json({
      ok: true,
      token,
      data: { token } // backward compatibility with current frontend code
    });
  } catch (error: any) {
    console.error("Error generating stream token:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
};
