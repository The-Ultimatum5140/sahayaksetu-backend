import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    image: { type: String, required: true },

    speciality: { type: String, required: true },

    degree: { type: String, required: true },

    experience: {
      type: Number, // years
      required: true,
    },

    about: { type: String, required: true },

    available: { type: Boolean, default: true },

    fees: { type: Number, required: true },

    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
    },

    // slots: { "12_5_2026": ["10:00 AM", "11:00 AM"] }
    slots_booked: {
      type: Map,
      of: [String],
      default: {},
    },
  },
  { timestamps: true },
);

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
