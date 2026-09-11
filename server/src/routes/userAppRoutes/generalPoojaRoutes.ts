import { Router } from "express";
import { getGeneralPoojaById, getGeneralPoojas } from "../../controller/userApp/generalPoojaController";

const router = Router();
router.get("/generalpoojas", getGeneralPoojas);
router.get("/generalpoojas/:id", getGeneralPoojaById);
export default router;
