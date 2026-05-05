import prescriptionModel from "../models/prescriptionModel.js";
import appointmentModel from "../models/AppointmentModel.js";
import Queue from "../models/QueueModel.js";

export const addPrescription = async (req, res) => {
  try {
    const {
      appointmentId,
      diagnosis,
      medicines,
      notes,
      tests,
      followUpDate,
    } = req.body;

    const doctorId = req.docId;

    // validation
    if (!appointmentId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // doctor authorization
    if (appointment.docId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // prevent cancelled
    if (appointment.cancelled) {
      return res.status(400).json({
        success: false,
        message: "Appointment cancelled",
      });
    }

    //prevent duplicate prescription
    const existing = await prescriptionModel.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Prescription already exists",
      });
    }

    //create prescription
    const newPrescription = await prescriptionModel.create({
      doctorId: appointment.docId,
      patientId: appointment.userId,
      appointmentId,
      diagnosis,
      medicines,
      notes,
      tests,
      followUpDate,
    });

    // mark appointment complete
    appointment.isCompleted = true;
    await appointment.save();

    // update queue safely
    const queue = await Queue.findOneAndUpdate(
      { appointmentId },
      { status: "completed" }
    );

    res.status(201).json({
      success: true,
      message: "Prescription added",
      prescription: newPrescription,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET PATIENT PRESCRIPTIONS =================
export const getPatientPrescriptions = async (req, res) => {
  try {
    const userId = req.userId;

    // validation
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const prescriptions = await prescriptionModel
      .find({ patientId: userId })
      .populate("doctorId", "name speciality image")
      .populate("appointmentId", "slotDate slotTime")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      prescriptions,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= GET DOCTOR PRESCRIPTIONS =================
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.docId;

    // validation
    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const prescriptions = await prescriptionModel
      .find({ doctorId })
      .populate("patientId", "name phone")
      .populate("appointmentId", "slotDate slotTime")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      prescriptions,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= GET SINGLE PRESCRIPTION =================
export const getPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({
        success: false,
        message: "Prescription ID required",
      });
    }

    const prescription = await prescriptionModel
      .findById(prescriptionId)
      .populate("doctorId", "name speciality image")
      .populate("patientId", "name phone")
      .populate("appointmentId", "slotDate slotTime")
      .lean();

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      prescription,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= UPDATE PRESCRIPTION STATUS =================
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId, status } = req.body;
    const doctorId = req.docId;

    if (!prescriptionId || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing data",
      });
    }

    const prescription = await prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // doctor authorization
    if (prescription.doctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    prescription.status = status;
    await prescription.save();

    res.status(200).json({
      success: true,
      message: "Prescription status updated",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};