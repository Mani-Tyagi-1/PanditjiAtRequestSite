// src/middlewares/jwtMiddleware.ts
//
// Website user auth. Mirrors the app server's middleware of the same name with
// ONE deliberate difference:
//
//   The app server enforces a single active session by comparing the presented
//   token against `user.token` in the DB. The website's OTP controller
//   (controller/userApp/mobileOtpController.ts) signs a JWT but does NOT persist
//   it on the user document — by design, so logging in on the website never
//   kicks a family out of the app (and vice-versa). Enforcing the equality check
//   here would therefore reject every website-issued token.
//
//   So we verify the signature, confirm the user still exists, and stop there.
//
// The secret and payload shape are identical to what mobileOtpController signs
// (`jwt.sign({ id: user._id }, JWT_SECRET)`), so a token minted by the website
// login flow validates here without any extra plumbing.

import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../model/userApp/userModel";

// MUST resolve identically to mobileOtpController's JWT_SECRET — that's what
// signs the tokens this verifies. Do not "harden" only this side: a different
// fallback here would reject every token the website's own login issues.
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

if (!process.env.JWT_SECRET) {
  console.warn(
    "🚨 [auth] JWT_SECRET is not set — falling back to the shared development " +
      "secret. Anyone who knows it can mint a token for any user and read that " +
      "family's Vivah bookings (names, address, birth details, kundali images). " +
      "Set JWT_SECRET before serving real traffic."
  );
}

interface JwtPayload {
  id?: string;
  userID?: string;
  role?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userID?: string;
    }
  }
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, message: "Authorization header missing" });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({ success: false, message: "Invalid authorization format" });
      return;
    }

    const token = parts[1];
    if (!token) {
      res.status(401).json({ success: false, message: "Token missing" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // The OTP controller signs with { id }; accept { userID } too for safety.
    const userId = decoded.id || decoded.userID;
    if (!userId) {
      res.status(401).json({ success: false, message: "Invalid token payload" });
      return;
    }

    const user = await User.findById(userId).select("_id").lean();
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    req.userID = String(userId);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default authMiddleware;
