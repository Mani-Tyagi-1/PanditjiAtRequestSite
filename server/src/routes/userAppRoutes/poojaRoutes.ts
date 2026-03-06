import express, { Request, Response, NextFunction } from "express";
import { fetchAllPoojas, fetchPoojaById } from "../../controller/userApp/poojaController";

const router = express.Router();


// GET - Fetch all poojas
router.get(
    "/fetch-all-poojas",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fetchAllPoojas(req, res);
      } catch (err) {
        next(err);
      }
    }
  );


  // GET - Fetch Pooja By Id
router.get(
    "/fetch-pooja-by-id/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fetchPoojaById(req, res);
      } catch (err) {
        next(err);
      }
    }
  );

export default router;
