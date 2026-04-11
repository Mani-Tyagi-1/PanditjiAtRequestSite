// src/routes/userApp/addressRoutes.ts
import express, { Router } from "express";
import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  checkServiceability,
  checkPincodeServiceability
} from "../../controllers/userApp/userAddressController";
import { decryptRequest } from "../../utils/encryption";

const router = Router();

// Public routes — user identification must be provided by the caller (OTP layer / frontend)
router.post("/", decryptRequest, createAddress);
router.get("/", getAddresses);
router.get("/:id", getAddressById);
router.put("/:id", decryptRequest, updateAddress);
router.delete("/:id", deleteAddress);
router.post('/check', decryptRequest, checkServiceability);
router.post('/check-pincode', decryptRequest, checkPincodeServiceability);

export default router;
