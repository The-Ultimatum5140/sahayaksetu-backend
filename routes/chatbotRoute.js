import express from "express";
import authUser from "../middlewares/authUser.js";
import { chatbotReply } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/", authUser, chatbotReply);

export default router;