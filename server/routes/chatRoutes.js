import express from "express";
import { getUserChats, getChatMessages } from "../controllers/chatController.js";

const router = express.Router();

router.get("/", getUserChats);
router.get("/:id", getChatMessages);

export default router;