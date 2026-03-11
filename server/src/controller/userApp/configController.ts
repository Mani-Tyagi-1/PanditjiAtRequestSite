import { Request, Response } from 'express';

export const getGoogleMapsConfig = (req: Request, res: Response): void => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ message: "Google Maps API Key not configured on the server." });
    return;
  }
  res.status(200).json({ apiKey });
  return;
};
