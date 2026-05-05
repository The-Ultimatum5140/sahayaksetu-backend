import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
      unique: true, // one prescription per appointment
    },

    diagnosis: String,

    medicines: {
      type: [
        {
          name: { type: String, required: true },
          dosage: { type: String, required: true },
          frequency: { type: String, required: true },
          timing: {
            type: String,
            enum: ["Before Food", "After Food", "Anytime"],
            default: "After Food",
          },
          duration: { type: Number, required: true },
        },
      ],
      validate: [(arr) => arr.length > 0, "At least one medicine required"],
    },

    tests: [
      {
        name: String,
      },
    ],

    notes: String,

    followUpDate: Date,

    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

// indexes
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ appointmentId: 1 });

export default mongoose.model("Prescription", prescriptionSchema);
