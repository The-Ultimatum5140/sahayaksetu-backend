import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/AppointmentModel.js";
import userModel from "../models/userModel.js";
import Queue from "../models/QueueModel.js";

// ================= BOOK APPOINTMENT =================
export const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { docId, slotDate, slotTime } = req.body;

    //  validation
    if (!docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing details" });
    }

    // atomic slot booking (NO RACE CONDITION)
    const doctor = await doctorModel.findOneAndUpdate(
      {
        _id: docId,
        available: true,
        [`slots_booked.${slotDate}`]: { $ne: slotTime },
      },
      {
        $push: { [`slots_booked.${slotDate}`]: slotTime },
      },
      { new: true },
    );

    if (!doctor) {
      return res.json({
        success: false,
        message: "Slot already booked or doctor unavailable",
      });
    }
    const userData = await userModel.findById(userId).select("-password");

    const appointment = await appointmentModel.create({
      userId,
      docId,
      slotDate,
      slotTime,

      userData: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      },

      docData: {
        name: doctor.name,
        image: doctor.image,
        speciality: doctor.speciality,
        fees: doctor.fees,
      },

      amount: doctor.fees,
    });

    const count = await Queue.countDocuments({ doctorId: docId });

    await Queue.create({
      appointmentId: appointment._id,
      patientId: userId,
      doctorId: docId,
      tokenNumber: count + 1,
      status: "waiting",
    });

    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

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

    // validation
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
      return res.status(400).json({
        success: false,
        message: "Missing details",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Weak password",
      });
    }

    // check duplicate
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // upload image (optional)
    let imageUrl = "https://i.pravatar.cc/300";

    if (req.file) {
      try {
        const upload = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
        });
        imageUrl = upload.secure_url;
      } catch {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    // parse address safely
    let parsedAddress = {};
    try {
      parsedAddress =
        typeof address === "string" ? JSON.parse(address) : address;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid address format",
      });
    }

    // create doctor
    const doctor = await doctorModel.create({
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
      speciality,
      degree,
      experience: Number(experience),
      about,
      fees,
      address: parsedAddress,
    });

    const doctorData = doctor.toObject();
    delete doctorData.password;

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      doctor: doctorData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= ADMIN LOGIN =================
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ================= GET ALL DOCTORS =================
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({})
      .select("-password -email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

// ================= GET ALL APPOINTMENTS =================
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({})
      .populate("userId", "name email phone")
      .populate("docId", "name speciality image")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
};
// ================= CANCEL APPOINTMENT (ADMIN) =================
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found",
      });
    }

    // authorization
    if (appointment.userId.toString() !== req.userId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    // already cancelled
    if (appointment.cancelled) {
      return res.json({
        success: false,
        message: "Already cancelled",
      });
    }

    // prevent cancel after completion
    if (appointment.isCompleted) {
      return res.json({
        success: false,
        message: "Cannot cancel completed appointment",
      });
    }

    // mark cancelled
    appointment.cancelled = true;
    await appointment.save();

    // remove slot safely
    await doctorModel.updateOne(
      { _id: appointment.docId },
      {
        $pull: {
          [`slots_booked.${appointment.slotDate}`]:
            appointment.slotTime.toUpperCase(),
        },
      },
    );

    // update queue
    await Queue.findOneAndUpdate({ appointmentId }, { status: "cancelled" });

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Cancel failed",
    });
  }
};
// api to get All Doctors data for amdin panel
const adminDashboard = async (req, res) => {
  try {
    //  fast counts
    const doctorsCount = await doctorModel.countDocuments();
    const usersCount = await userModel.countDocuments();
    const appointmentsCount = await appointmentModel.countDocuments();

    //  latest 5 appointments
    const latestAppointments = await appointmentModel
      .find({})
      .populate("userId", "name")
      .populate("docId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const dashData = {
      doctors: doctorsCount,
      patients: usersCount,
      appointments: appointmentsCount,
      latestAppointments,
    };

    res.json({
      success: true,
      dashData,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
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
