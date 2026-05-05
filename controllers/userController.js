import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/AppointmentModel.js";
import razorpay from "razorpay";
import Queue from "../models/QueueModel.js";

// helper → normalize time format everywhere
const normalizeTime = (time) => {
  try {
    if (!time) return "";

    // already formatted (AM/PM present)
    if (/AM|PM/i.test(time)) {
      return time.toUpperCase();
    }

    const date = new Date(`1970-01-01T${time}`);

    if (isNaN(date)) return time; // fallback

    return date
      .toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  } catch {
    return time;
  }
};

// helper → normalize date
const normalizeDate = (dateStr) => {
  try {
    if (!dateStr || typeof dateStr !== "string") return "";

    const parts = dateStr.split("_");
    if (parts.length !== 3) return dateStr;

    let [d, m, y] = parts;

    d = parseInt(d);
    m = parseInt(m);

    if (isNaN(d) || isNaN(m) || !y) return dateStr;

    return `${d}_${m}_${y}`;
  } catch {
    return dateStr;
  }
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing details!",
      });
    }

    //  normalize email
    email = email.toLowerCase().trim();

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter valid email",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // check existing user
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // token with role
    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
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

    //  find user (explicit password if select:false)
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //  compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //  token with role
    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    // validation
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userData = await userModel
      .findById(userId)
      .select("-password")
      .lean();

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      userData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    let { name, phone, address, dob, gender } = req.body;

    // validation
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updateData = {};

    // partial updates allowed
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;

    // safe address parsing
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

    // image upload (if exists)
    if (req.file) {
      try {
        const upload = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
        });
        updateData.image = upload.secure_url;
      } catch {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    //  update user (single DB call)
    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// ================= BOOK APPOINTMENT =================
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    let { docId, slotDate, slotTime } = req.body;

    // validation
    if (!docId || !slotDate || !slotTime) {
      return res.status(400).json({
        success: false,
        message: "Missing booking details",
      });
    }

    // normalize date
    if (slotDate.includes("_")) {
      const [d, m, y] = slotDate.split("_");
      slotDate = `${parseInt(d)}_${parseInt(m)}_${y}`;
    }

    // normalize time
    if (typeof slotTime !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid slot time",
      });
    }
    slotTime = slotTime.trim().toUpperCase();

    // get user
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // atomic slot lock
    const doctor = await doctorModel.findOneAndUpdate(
      {
        _id: docId,
        available: true,
        [`slots_booked.${slotDate}`]: { $ne: slotTime },
      },
      {
        $push: { [`slots_booked.${slotDate}`]: slotTime },
      },
      { new: true },
    );

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "Slot already booked or doctor unavailable",
      });
    }

    //  create appointment
    const appointment = await appointmentModel.create({
      userId,
      docId,
      slotTime,
      slotDate,

      userData: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },

      docData: {
        name: doctor.name,
        image: doctor.image,
        speciality: doctor.speciality,
        fees: doctor.fees,
      },

      amount: doctor.fees,
    });

    //  SAFE token (still not perfect but better)
    const last = await Queue.findOne({ doctorId: docId }).sort({
      tokenNumber: -1,
    });

    const tokenNumber = last ? last.tokenNumber + 1 : 1;

    //  create queue
    const queue = await Queue.create({
      appointmentId: appointment._id,
      patientId: userId,
      doctorId: docId,
      tokenNumber,
    });

    res.status(200).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
      tokenNumber: queue.tokenNumber,
    });
  } catch (err) {
    console.log("BOOK ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Booking failed",
    });
  }
};

// ================= LIST APPOINTMENTS =================
const listAppointment = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const appointments = await appointmentModel
      .find({ userId })
      .populate("docId", "name speciality image")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// ================= CANCEL APPOINTMENT =================
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // validation
    if (!appointmentId) {
      return res.json({
        success: false,
        message: "Appointment ID required",
      });
    }

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found",
      });
    }

    // authorization
    if (appointment.userId.toString() !== req.userId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    // already cancelled
    if (appointment.cancelled) {
      return res.json({
        success: false,
        message: "Already cancelled",
      });
    }

    // mark cancelled
    appointment.cancelled = true;
    await appointment.save();

    // update queue (VERY IMPORTANT)
    await Queue.findOneAndUpdate({ appointmentId }, { status: "cancelled" });

    // remove slot
    await doctorModel.updateOne(
      { _id: appointment.docId },
      {
        $pull: {
          [`slots_booked.${appointment.slotDate}`]:
            appointment.slotTime.toUpperCase(),
        },
      },
    );

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Cancel failed",
    });
  }
};
// ============Razor pay instance test case ===================
const razorPayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_VALUE,
});
// ============ MAKE PAYMENT =======================
const paymentRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.json({
        success: false,
        message: "Appointment ID required",
      });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment cancelled or not found!",
      });
    }

    // ownership check
    if (appointmentData.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (appointmentData.payment) {
      return res.json({
        success: false,
        message: "Already paid",
      });
    }

    const options = {
      amount: appointmentData.amount * 100,
      currency: "INR",
      receipt:appointmentId, // 🔥 unique
    };

    const order = await razorPayInstance.orders.create(options);

    res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

// api to verify payment of razorpay
import crypto from "crypto";

const verifyRazorpay = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId,
    } = req.body;

    const userId = req.userId;

    // validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({
        success: false,
        message: "Missing payment details",
      });
    }

    // verify signature (MOST IMPORTANT)
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_VALUE)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // find appointment
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found",
      });
    }

    // ownership check
    if (appointment.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    // already paid check
    if (appointment.payment) {
      return res.json({
        success: false,
        message: "Already paid",
      });
    }

    //  mark paid
    appointment.payment = true;
    await appointment.save();

    res.json({
      success: true,
      message: "Payment Successful!",
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
};
