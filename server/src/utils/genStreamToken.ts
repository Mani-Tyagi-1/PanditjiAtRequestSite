import { Request, Response, RequestHandler } from "express";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;
const streamClient = new StreamClient(apiKey, apiSecret);

export const genStreamToken: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).id || req.params.id;
 
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
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Token error" });
  }
};
