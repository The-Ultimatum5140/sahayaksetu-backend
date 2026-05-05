import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    image: {
      type: String,
      default:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjciIHZpZXdCb3g9IjAgMCAyNCAyNyIgZmlsbD0ibm9uZSI...",
    },

    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Not Selected"],
      default: "Not Selected",
    },

    dob: {
      type: Date,
    },

    phone: {
      type: String,
      default: "0000000000",
    },
  },
  { timestamps: true },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
