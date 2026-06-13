import express from "express";
import createConsultancyLead from "../../controller/userApp/consultancyLeadController";

const router = express.Router();

router.post("/consultancy-leads", createConsultancyLead);

export default router;
