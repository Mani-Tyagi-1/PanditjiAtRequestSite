import express, { NextFunction, Request, Response } from "express";
import { createPandit, fetchAllPandit, fetchPanditById, getLocationSuggestions } from "../../controller/panditApp/panditController";
import { createMultipleFileUpload } from "../../middlewares/panditUploadMiddleware";
import { getPanditStats } from "../../controller/panditApp/panditStatsController";

const router = express.Router();

/**
 * Multi-file upload:
 * We will accept up to 3 different fields:
 *  - profile_image
 *  - degree_file
 *  - aadhar_file
 */
router.post(
  "/register",
  createMultipleFileUpload([
    { name: "profile_image", maxCount: 1 },
    { name: "degree_file", maxCount: 1 },
    { name: "aadhar_file", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    createPandit(req, res);
  }
);

/**
 * GET location suggestions (Mock or real)
 */
router.get("/locations", (req: Request, res: Response) => {
  getLocationSuggestions(req, res);
});

router.get(
    "/fetch-all-pandit",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fetchAllPandit(req, res);
      } catch (err) {
        next(err);
      }
    }
  );
  router.get(
      "/fetch-pandit-by-id/:id",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await fetchPanditById(req, res);
        } catch (err) {
          next(err);
        }
      }
    );

    router.get(
  "/fetch-pandit-stats/:panditId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getPanditStats(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
