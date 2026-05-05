import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/AppointmentModel.js";
import Queue from "../models/QueueModel.js";
/* 
   CHANGE DOCTOR AVAILABILITY
*/
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    if (!docId) {
      return res.json({
        success: false,
        message: "Doctor ID missing",
      });
    }

    const doctor = await doctorModel.findById(docId);

    if (!doctor) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.available = !doctor.available;
    await doctor.save();

    res.json({
      success: true,
      message: "Availability updated successfully",
      available: doctor.available,
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
    const doctors = await doctorModel
      .find({})
      .select("-password -email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      doctors,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Error fetching doctors",
    });
  }
};

// doctorlist api
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({})
      .select("-password -email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
// api for doctor login
const loginDoctor = async (req, res) => {
  try {
    let { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // normalize email
    email = email.toLowerCase().trim();

    //  fetch doctor (explicit password)
    const doctor = await doctorModel.findOne({ email }).select("+password");

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //  compare password
    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //  token with role
    const token = jwt.sign(
      {
        id: doctor._id,
        role: "doctor",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// api to get doctor appointments for doctor panel

const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId;

    const appointments = await appointmentModel
      .find({ docId, cancelled: false, isCompleted: false })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

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

    //  validation
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID required",
      });
    }

    const appt = await appointmentModel.findById(appointmentId);

    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // authorization
    if (appt.docId.toString() !== req.docId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // already completed check
    if (appt.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Already completed",
      });
    }

    // update appointment
    appt.isCompleted = true;
    await appt.save();

    // update queue
    await Queue.findOneAndUpdate(
      { appointmentId },
      { status: "completed" },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Appointment completed",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// CANCEL APPOINTMENT
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // validation
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID required",
      });
    }

    const appt = await appointmentModel.findById(appointmentId);

    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    //  authorization
    if (appt.docId.toString() !== req.docId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    //  already cancelled
    if (appt.cancelled) {
      return res.status(400).json({
        success: false,
        message: "Already cancelled",
      });
    }

    //  update appointment
    appt.cancelled = true;
    await appt.save();

    // update queue
    await Queue.findOneAndUpdate({ appointmentId }, { status: "cancelled" });

    //  free slot once cancelled
    await doctorModel.updateOne(
      { _id: appt.docId },
      {
        $pull: {
          [`slots_booked.${appt.slotDate}`]: appt.slotTime,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "Appointment cancelled",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// api to get doctor data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.docId;

    // counts
    const totalAppointments = await appointmentModel.countDocuments({ docId });

    // earnings (only paid)
    const earningsAgg = await appointmentModel.aggregate([
      { $match: { docId: new mongoose.Types.ObjectId(docId), payment: true } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const earnings = earningsAgg[0]?.total || 0;

    // unique patients
    const uniquePatients = await appointmentModel.distinct("userId", { docId });

    // latest 5 appointments
    const latestAppointments = await appointmentModel
      .find({ docId })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const dashData = {
      earnings,
      appointments: totalAppointments,
      patients: uniquePatients.length,
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

// GET DOCTOR PROFILE
const doctorProfile = async (req, res) => {
  try {
    const docId = req.docId;

    const profileData = await doctorModel
      .findById(docId)
      .select("-password -email")
      .lean();

    if (!profileData) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      profileData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE DOCTOR PROFILE
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.docId;
    const { fees, address, available } = req.body;

    const updateData = {};

    //  validation (at least one field)
    if (
      fees === undefined &&
      address === undefined &&
      available === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "No data provided to update",
      });
    }

    //  fees
    if (fees !== undefined) {
      updateData.fees = Number(fees);
    }

    //  address (safe parse)
    if (address !== undefined) {
      try {
        updateData.address =
          typeof address === "string" ? JSON.parse(address) : address;
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid address format",
        });
      }
    }

    //  availability
    if (available !== undefined) {
      updateData.available = available;
    }

    //  update + return new doc
    const updatedDoctor = await doctorModel
      .findByIdAndUpdate(docId, updateData, { new: true })
      .select("-password -email")
      .lean();

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile Updated",
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
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
