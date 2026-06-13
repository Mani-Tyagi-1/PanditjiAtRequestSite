import { Router } from "express";
import {
  completePaidConsultationPayment,
  createPaidConsultationOrder,
} from "../../controller/userApp/paidConsultationController";

const router = Router();

router.post("/paid-consultations/create-order", createPaidConsultationOrder);
router.post("/paid-consultations/complete-payment", completePaidConsultationPayment);

export default router;
