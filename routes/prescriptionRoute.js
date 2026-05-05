import express from "express";
import {
  addPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
} from "../controllers/prescriptionController.js";

import authUser from "../middlewares/authUser.js";
import authDoctor from "../middlewares/authDoctor.js";

const router = express.Router();

// Doctor add karega
router.post("/add", authDoctor, addPrescription);

// Patient dekhega
router.get("/my", authUser, getPatientPrescriptions);

// Doctor dekhega apne
router.get("/doctor", authDoctor, getDoctorPrescriptions);



export default router;