// routes/userAppRoutes/consultancyLeadRoutes.ts
import express from "express";
import  createConsultancyLead  from "../src/controller/userApp/consultancyLeadController";

const router = express.Router();

router.post("/consultancy-leads", createConsultancyLead);

export default router;
