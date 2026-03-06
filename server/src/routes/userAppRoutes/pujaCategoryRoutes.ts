import express, { Request, Response, NextFunction } from "express";
// import { fetchAllPoojas, fetchPoojaById } from "../controller/poojaController";
import { fetchAllPoojaCategory,fetchPoojaCategoryById } from "../../controller/userApp/poojaCategoryController";

const router = express.Router();


// GET - Fetch all poojas
router.get(
    "/fetch-all-pooja-category",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fetchAllPoojaCategory(req, res);
      } catch (err) {
        next(err);
      }
    }
  );


  // GET - Fetch Pooja By Id
router.get(
    "/fetch-pooja-category-by-id/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fetchPoojaCategoryById(req, res);
      } catch (err) {
        next(err);
      }
    }
  );

export default router;
