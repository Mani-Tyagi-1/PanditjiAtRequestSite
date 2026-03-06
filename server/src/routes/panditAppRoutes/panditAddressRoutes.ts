import { Router } from "express";
import {
  addPanditAddress,
  getPanditAddresses,
  updatePanditSecondary,
  deletePanditSecondary,
} from "../../controller/panditApp/panditAddressController";
import { asyncHandler } from "../../utils/helpers";

const router = Router();

/* NOTE:  if you have JWT auth for pandits, just `router.use(panditAuth)` here. */

/* One-liner style routes ------------------------------------- */
router.post(
  "/api/add-address/:panditId",
  asyncHandler(addPanditAddress)
); // POST   /add-address/:panditId

router.get("/api/pandit-addresses/:panditId",getPanditAddresses);

router.put(
  "/api/update-secondary/:panditId/:addressId",
  asyncHandler(updatePanditSecondary)
); // PUT    /update-secondary/:panditId/:addressId

router.delete(
  "/api/delete-secondary/:panditId/:addressId",
  asyncHandler(deletePanditSecondary)
); // DELETE /delete-secondary/:panditId/:addressId

export default router;
