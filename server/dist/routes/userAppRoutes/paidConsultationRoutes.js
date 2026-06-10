"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paidConsultationController_1 = require("../../controller/userApp/paidConsultationController");
const router = (0, express_1.Router)();
router.post("/paid-consultations/create-order", paidConsultationController_1.createPaidConsultationOrder);
router.post("/paid-consultations/complete-payment", paidConsultationController_1.completePaidConsultationPayment);
exports.default = router;
