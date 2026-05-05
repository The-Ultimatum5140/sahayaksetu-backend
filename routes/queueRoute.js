import express from "express";
import authUser from "../middlewares/authUser.js";

import {
  getQueue,
  nextPatient,
  markMissed,
  markCompleted,
  getUserQueue,
} from "../controllers/queueController.js";

const router = express.Router();

// get user queue
router.get("/my", authUser, getUserQueue);

// get queue
router.get("/:doctorId", authUser, getQueue);

// next patient
router.post("/next", authUser, nextPatient);

// mark missed
router.post("/missed", authUser, markMissed);

// mark completed
router.post("/completed", authUser, markCompleted);

export default router;
