import express from "express";
import {
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
} from "../controllers/doctorController.js";

import authDoctor from "../middlewares/authDoctor.js";

const doctorRouter = express.Router();

/* ---------- PUBLIC ROUTES ---------- */

// get all doctors (for frontend listing)
doctorRouter.get("/list", doctorList);

// doctor login
doctorRouter.post("/login", loginDoctor);

/* ---------- PROTECTED ROUTES ---------- */

// get doctor appointments
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);

// mark appointment completed
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);

// cancel appointment
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);

// doctor -dashboard
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);

// doctor -profile
doctorRouter.get("/profile", authDoctor, doctorProfile);

// update-profile
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

export default doctorRouter;
