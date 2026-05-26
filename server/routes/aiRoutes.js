import express from "express"
import { chatWithAI } from "../controllers/aiController.js"
import { optionalAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

// POST /api/ai/chat
router.post("/chat", optionalAuth, chatWithAI)

export default router