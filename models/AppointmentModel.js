import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },

    userData: {
      name: String,
      email: String,
      phone: String,
    },

    docData: {
      name: String,
      image: String,
      speciality: String,
      fees: Number,
    },

    amount: { type: Number, required: true },

    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ docId: 1 });

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
