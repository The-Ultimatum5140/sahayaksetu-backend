import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/AppointmentModel.js";
/* 
   CHANGE DOCTOR AVAILABILITY
*/

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    // check id exists
    if (!docId) {
      return res.json({
        success: false,
        message: "Doctor ID missing",
      });
    }

    // find doctor
    const doctor = await doctorModel.findById(docId);

    if (!doctor) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    // toggle availability
    doctor.available = !doctor.available;
    await doctor.save();

    res.json({
      success: true,
      message: "Availability updated successfully",
    });
  } catch (err) {
    console.log("Availability error:", err);
    res.json({
      success: false,
      message: "Server error while updating availability",
    });
  }
};

/*
   GET ALL DOCTORS (optional helper)
*/

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    res.json({ success: true, doctors });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error fetching doctors" });
  }
};

// doctorlist api
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);

    //  creating response
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// api for doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    //  find doctor using email id
    const doctor = await doctorModel.findOne({ email });
    // check if doctor is available with this email
    if (!doctor) {
      return res.json({ success: false, message: "Invalid credentials!" });
    }

    // if found check the password
    const isMatch = await bcrypt.compare(password, doctor.password);

    // if true
    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invaid credentials" });
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// api to get doctor appointments for doctor panel

const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId; // from auth middleware

    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};
// COMPLETE APPOINTMENT
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appt = await appointmentModel.findById(appointmentId);

    if (!appt)
      return res.json({ success: false, message: "Appointment not found" });

    //  IMPORTANT FIX → loose comparison
    if (appt.docId != req.docId)
      return res.json({ success: false, message: "Unauthorized" });

    appt.isCompleted = true;
    await appt.save();

    res.json({ success: true, message: "Appointment completed" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// CANCEL APPOINTMENT
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appt = await appointmentModel.findById(appointmentId);

    if (!appt)
      return res.json({ success: false, message: "Appointment not found" });

    //  IMPORTANT FIX → loose comparison
    if (appt.docId != req.docId)
      return res.json({ success: false, message: "Unauthorized" });

    appt.cancelled = true;
    await appt.save();

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// api to get doctor data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.docId;

    const appointments = await appointmentModel.find({ docId });

    // earnings (paid only)
    const earnings = appointments.reduce((sum, item) => {
      if (item.payment) return sum + item.amount;
      return sum;
    }, 0);

    // unique patients
    const patients = new Set(appointments.map((item) => item.userId));

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.size,
      latestAppointments: [...appointments].reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// GET DOCTOR PROFILE
const doctorProfile = async (req, res) => {
  try {
    const docId = req.docId;

    const profileData = await doctorModel.findById(docId).select("-password");

    if (!profileData) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.json({ success: true, profileData });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// UPDATE DOCTOR PROFILE
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.docId; //  SAFE: from middleware
    const { fees, address, available } = req.body;

    const updateData = {};

    if (fees !== undefined) updateData.fees = fees;
    if (address !== undefined) updateData.address = address;
    if (available !== undefined) updateData.available = available;

    await doctorModel.findByIdAndUpdate(docId, updateData);

    res.json({
      success: true,
      message: "Profile Updated",
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

export {
  changeAvailability,
  getAllDoctors,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};
