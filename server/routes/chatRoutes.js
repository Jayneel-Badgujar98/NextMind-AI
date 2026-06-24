import express from "express";
import { getUserChats, getChatMessages, clearAllChats, renameChat, deleteChat, togglePinChat } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getUserChats);
router.delete("/clear", requireAuth, clearAllChats);
router.get("/:id", requireAuth, getChatMessages);
router.patch("/:id/rename", requireAuth, renameChat);
router.delete("/:id", requireAuth, deleteChat);
router.patch("/:id/pin", requireAuth, togglePinChat);

export default router;