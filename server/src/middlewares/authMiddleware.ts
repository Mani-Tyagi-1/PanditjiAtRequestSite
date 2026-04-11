import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/userApp/userModel"; // Adjust path as needed

const JWT_SECRET = process.env.JWT_SECRET ?? "d73379f59c7be52848105a5fb83fb0e67770bdd8a03ac5fea96903daaf4977ee";

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export default async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authorized, token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        res.status(401).json({ message: "Not authorized, user not found" });
        return;
    }

    req.user = user; 
    
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
}
