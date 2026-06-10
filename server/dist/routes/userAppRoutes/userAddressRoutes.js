"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userApp/addressRoutes.ts
const express_1 = require("express");
const userAddressController_1 = require("../../controller/userApp/userAddressController");
const encryption_1 = require("../../utils/encryption");
const router = (0, express_1.Router)();
// Public routes — user identification must be provided by the caller (OTP layer / frontend)
router.post("/", encryption_1.decryptRequest, userAddressController_1.createAddress);
router.get("/", userAddressController_1.getAddresses);
router.get("/:id", userAddressController_1.getAddressById);
router.put("/:id", encryption_1.decryptRequest, userAddressController_1.updateAddress);
router.delete("/:id", userAddressController_1.deleteAddress);
router.post('/check', encryption_1.decryptRequest, userAddressController_1.checkServiceability);
router.post('/check-pincode', encryption_1.decryptRequest, userAddressController_1.checkPincodeServiceability);
exports.default = router;
