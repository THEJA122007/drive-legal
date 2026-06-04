import express from "express";
import { violationInfo } from "../controllers/violationController.js";

const router = express.Router();

router.post("/", violationInfo);

export default router;