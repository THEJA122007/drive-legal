import express from "express";
import { getLocation } from "../controllers/locationController.js";

const router = express.Router();

router.post("/", getLocation);

export default router;