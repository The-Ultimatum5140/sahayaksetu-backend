import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    tokenNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["waiting", "in-progress", "completed", "cancelled"],
      default: "waiting",
    },

    priority: {
      type: String,
      enum: ["normal", "emergency"],
      default: "normal",
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔥 Important Indexes
queueSchema.index({ appointmentId: 1 }, { unique: true });
queueSchema.index({ doctorId: 1, tokenNumber: 1 }, { unique: true });

export default mongoose.model("Queue", queueSchema);