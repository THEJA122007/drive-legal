import express from "express";
import { checklist } from "../controllers/checklistController.js";

const router = express.Router();

router.post("/", checklist);

export default router;