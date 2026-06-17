import express, { Request, Response, NextFunction } from "express";
import { createKashiRequest, getKashiRequests, getUserKashiRequests } from "../../controller/userApp/kashiController";

const router = express.Router();

const wrap =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };

router.post("/kashi-requests", wrap(createKashiRequest));
router.get("/kashi-requests", wrap(getKashiRequests));
router.get("/kashi-requests/user/:phone", wrap(getUserKashiRequests));

export default router;
