import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/AppointmentModel.js";
import razorpay from "razorpay";

// helper → normalize time format everywhere
const normalizeTime = (time) => {
  return new Date(`1970-01-01 ${time}`)
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

// helper → normalize date
const normalizeDate = (dateStr) => {
  const [d, m, y] = dateStr.split("_");
  return `${parseInt(d)}_${parseInt(m)}_${y}`;
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.json({ success: false, message: "Missing details!" });

    if (!validator.isEmail(email))
      return res.json({ success: false, message: "Enter valid email" });

    if (password.length < 8)
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });

    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.json({ success: false, message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
    }).save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user)
      return res.json({ success: false, message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
  try {
    const userData = await userModel.findById(req.userId).select("-password");

    res.json({ success: true, userData });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, dob, gender } = req.body;

    if (!name || !phone || !dob || !gender)
      return res.json({ success: false, message: "Data missing" });

    await userModel.findByIdAndUpdate(req.userId, {
      name,
      phone,
      address: address ? JSON.parse(address) : {},
      dob,
      gender,
    });

    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });

      await userModel.findByIdAndUpdate(req.userId, {
        image: upload.secure_url,
      });
    }

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
};

// ================= BOOK APPOINTMENT =================
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    let { docId, slotDate, slotTime } = req.body;

    if (!docId || !slotDate || !slotTime) {
      return res.json({
        success: false,
        message: "Missing booking details",
      });
    }

    // SAFE DATE NORMALIZATION
    if (slotDate.includes("_")) {
      const [d, m, y] = slotDate.split("_");
      slotDate = `${parseInt(d)}_${parseInt(m)}_${y}`;
    }

    // SAFE TIME NORMALIZATION
    if (typeof slotTime !== "string") {
      return res.json({
        success: false,
        message: "Invalid slot time",
      });
    }

    slotTime = slotTime.trim().toUpperCase();

    // ATOMIC SLOT LOCK
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
      return res.json({
        success: false,
        message: "Slot already booked or doctor unavailable",
      });
    }

    const userData = await userModel.findById(userId).select("-password");

    const appointment = await new appointmentModel({
      userId,
      docId,
      userData,
      docData: {
        name: doctor.name,
        image: doctor.image,
        speciality: doctor.speciality,
        fees: doctor.fees,
      },
      amount: doctor.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    }).save();

    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (err) {
    console.log("BOOK ERROR:", err);
    res.json({
      success: false,
      message: "Booking failed",
    });
  }
};

// ================= LIST APPOINTMENTS =================
const listAppointment = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({ userId: req.userId })
      .sort({ date: -1 });

    res.json({ success: true, appointments });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// ================= CANCEL APPOINTMENT =================
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment)
      return res.json({ success: false, message: "Appointment not found" });

    if (appointment.userId.toString() !== req.userId.toString())
      return res.json({ success: false, message: "Unauthorized" });

    if (appointment.cancelled)
      return res.json({ success: false, message: "Already cancelled" });

    // mark cancelled
    appointment.cancelled = true;
    await appointment.save();

    //  REMOVE SLOT DIRECTLY FROM DB
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
    res.json({ success: false, message: "Cancel failed" });
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
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment cancelled or not found!",
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
      currency: process.env.CURRENCY || "INR",
      receipt: appointmentId,
    };

    const order = await razorPayInstance.orders.create(options);

    res.json({ success: true, order });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// api to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorPayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status === "paid") {
      // then find appointment
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
      });
      res.json({ success: true, message: "Payment Successful!" });
    } else {
      res.json({ success: false, message: "Payment failed" });
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
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
