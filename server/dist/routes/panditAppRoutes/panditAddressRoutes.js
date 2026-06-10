"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const panditAddressController_1 = require("../../controller/panditApp/panditAddressController");
const helpers_1 = require("../../utils/helpers");
const router = (0, express_1.Router)();
/* NOTE:  if you have JWT auth for pandits, just `router.use(panditAuth)` here. */
/* One-liner style routes ------------------------------------- */
router.post("/api/add-address/:panditId", (0, helpers_1.asyncHandler)(panditAddressController_1.addPanditAddress)); // POST   /add-address/:panditId
router.get("/api/pandit-addresses/:panditId", panditAddressController_1.getPanditAddresses);
router.put("/api/update-secondary/:panditId/:addressId", (0, helpers_1.asyncHandler)(panditAddressController_1.updatePanditSecondary)); // PUT    /update-secondary/:panditId/:addressId
router.delete("/api/delete-secondary/:panditId/:addressId", (0, helpers_1.asyncHandler)(panditAddressController_1.deletePanditSecondary)); // DELETE /delete-secondary/:panditId/:addressId
exports.default = router;
