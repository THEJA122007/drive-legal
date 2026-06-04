import express from "express";
import { countryInfo } from "../controllers/countryController.js";

const router = express.Router();

router.post("/", countryInfo);

export default router;