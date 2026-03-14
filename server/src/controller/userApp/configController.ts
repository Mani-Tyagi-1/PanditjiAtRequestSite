import { Request, Response } from 'express';
import axios from 'axios';

export const getGoogleMapsConfig = (req: Request, res: Response): void => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ message: "Google Maps API Key not configured on the server." });
    return;
  }
  res.status(200).json({ apiKey });
  return;
};

export const proxyFetchPromos = async (req: Request, res: Response) => {
    try {
        const response = await axios.get("https://vedicvaibhav.com/api/fetch-promo-vedic");
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Proxy fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch promotions from external service." });
    }
};
