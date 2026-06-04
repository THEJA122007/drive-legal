import express from "express";
import { compareCountries } from "../controllers/compareController.js";
const router = express.Router();

router.post("/", compareCountries);

export default router;