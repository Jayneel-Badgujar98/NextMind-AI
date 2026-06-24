import express from "express";
import { getUserChats, getChatMessages, clearAllChats } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getUserChats);
router.delete("/clear", requireAuth, clearAllChats);
router.get("/:id", requireAuth, getChatMessages);

export default router;