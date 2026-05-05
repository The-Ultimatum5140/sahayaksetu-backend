import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import queueRoutes from "./routes/queueRoute.js";
import chatbotRoutes from "./routes/chatbotRoute.js";
import prescriptionRoutes from "./routes/prescriptionRoute.js";

// to do remove side menu for large icons

// app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// initializing end points
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/queue", queueRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/prescription", prescriptionRoutes);

app.get("/", (req, res) => {
  res.send("API working");
});

// start the express app
app.listen(port, () => console.log("Server started...", port));
