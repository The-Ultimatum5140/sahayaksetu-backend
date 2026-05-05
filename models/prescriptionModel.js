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
    isLocked: {
      type: Boolean,
      default: false,
    },
    signature: {
      type: String,
      default: "",
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
      unique: true,
    },

    diagnosis: {
      type: String,
      required: true,
    },

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
      validate: [
        {
          validator: function (arr) {
            return Array.isArray(arr) && arr.length > 0;
          },
          message: "At least one medicine required",
        },
      ],
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
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true },
);

// indexes (keep only useful ones)
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });

export default mongoose.model("Prescription", prescriptionSchema);
