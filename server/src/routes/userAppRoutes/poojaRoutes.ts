import express, { Request, Response, NextFunction } from "express";
import { fetchAllPoojas, fetchPoojabycategoryId, fetchPoojaById } from "../../controller/userApp/poojaController";
import { fetchAllBlogs } from "../../controller/userApp/blogController";

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

router.get(
    "/fetch-pooja-by-cat-id/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fetchPoojabycategoryId(req, res);
      } catch (err) {
        next(err);
      }
    }
  );


router.get(
  "/fetch-all-blogs",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fetchAllBlogs(req, res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
