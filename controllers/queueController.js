import Queue from "../models/QueueModel.js";

// ================= GET QUEUE =================
export const getQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const queue = await Queue.find({
      doctorId,
      status: { $in: ["waiting", "in-progress"] },
    })
      .populate("patientId", "name")
      .sort({ tokenNumber: 1 })
      .lean();

    res.json({ success: true, queue });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
// ============get my queue ============

export const getUserQueue = async (req, res) => {
  try {
    const userId = req.userId;

    // validation
    if (!userId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const queue = await Queue.find({
      patientId: userId,
    })
      .populate("doctorId", "name speciality")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      queue,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
};
// next patient
export const nextPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.json({ success: false, message: "Doctor ID required" });
    }

    //  complete current patient first
    await Queue.findOneAndUpdate(
      { doctorId, status: "in-progress" },
      { status: "completed" },
    );

    // get next waiting
    const patient = await Queue.findOneAndUpdate(
      { doctorId, status: "waiting" },
      { status: "in-progress" },
      { new: true, sort: { tokenNumber: 1 } },
    );

    if (!patient) {
      return res.json({
        success: false,
        message: "No patients in queue",
      });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ================= MARK MISSED =================
export const markMissed = async (req, res) => {
  try {
    const { queueId } = req.body;
    const doctorId = req.docId;

    // validation
    if (!queueId) {
      return res.json({
        success: false,
        message: "Queue ID required",
      });
    }

    const patient = await Queue.findById(queueId);

    if (!patient) {
      return res.json({
        success: false,
        message: "Queue entry not found",
      });
    }

    // authorization (doctor only)
    if (patient.doctorId.toString() !== doctorId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    // prevent invalid state change
    if (["completed", "cancelled"].includes(patient.status)) {
      return res.json({
        success: false,
        message: "Cannot mark completed/cancelled patient as missed",
      });
    }

    // update
    patient.status = "missed";
    await patient.save();

    res.json({
      success: true,
      message: "Patient marked as missed",
      patient,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
};
// ================= MARK COMPLETED =================
export const markCompleted = async (req, res) => {
  try {
    const { queueId } = req.body;
    const doctorId = req.docId;

    // validation
    if (!queueId) {
      return res.json({
        success: false,
        message: "Queue ID required",
      });
    }

    const patient = await Queue.findById(queueId);

    if (!patient) {
      return res.json({
        success: false,
        message: "Queue entry not found",
      });
    }

    //  authorization
    if (patient.doctorId.toString() !== doctorId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    //  prevent invalid transitions
    if (["completed", "cancelled"].includes(patient.status)) {
      return res.json({
        success: false,
        message: "Already completed or cancelled",
      });
    }

    //  update queue
    patient.status = "completed";
    await patient.save();

    // sync appointment
    await appointmentModel.findByIdAndUpdate(patient.appointmentId, {
      isCompleted: true,
    });

    res.json({
      success: true,
      message: "Consultation completed",
      patient,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
};
