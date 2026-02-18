import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    await mongoose.connect(`${process.env.MONGODB_URI}/SahayakSetu`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // stop server if DB fails
  }
};

export default connectDB;
