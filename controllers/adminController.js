import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/AppointmentModel.js";
import userModel from "../models/userModel.js";

// ================= ADD DOCTOR =================
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !fees ||
      !about ||
      !address
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing details" });
    }

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Image required" });

    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: "Invalid email" });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: "Weak password" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const upload = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
    });

    const doctor = await doctorModel.create({
      name,
      email,
      password: hashedPassword,
      image: upload.secure_url,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: typeof address === "string" ? JSON.parse(address) : address,
      date: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      doctor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= ADMIN LOGIN =================
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ================= GET ALL DOCTORS =================
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.status(200).json({ success: true, doctors });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
};

// ================= GET ALL APPOINTMENTS =================
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({}).sort({ date: -1 });

    res.status(200).json({ success: true, appointments });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointments" });
  }
};

// ================= CANCEL APPOINTMENT (ADMIN) =================
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });

    if (appointment.cancelled)
      return res.status(400).json({
        success: false,
        message: "Already cancelled",
      });

    appointment.cancelled = true;
    await appointment.save();

    const doctor = await doctorModel.findById(appointment.docId);

    if (doctor?.slots_booked?.[appointment.slotDate]) {
      doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[
        appointment.slotDate
      ].filter((t) => t !== appointment.slotTime);

      if (!doctor.slots_booked[appointment.slotDate].length)
        delete doctor.slots_booked[appointment.slotDate];

      await doctor.save();
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cancel failed" });
  }
};

// api to get All Doctors data for amdin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});
    // finding no of doctors users and appointments
    const dashData = {
      doctors: doctors.length,
      patients: users.length,
      appointments: appointments.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };
    res.json({ success: true, dashData });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
};
