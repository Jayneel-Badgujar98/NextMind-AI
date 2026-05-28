import express from "express";
import { 
  register, 
  login, 
  logout, 
  getMe, 
  oauthGoogle, 
  oauthGithub,
  verifyEmail,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  updatePreferences,
  deleteAccount
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.put("/preferences", requireAuth, updatePreferences);
router.delete("/delete-account", requireAuth, deleteAccount);
router.post("/oauth/google", oauthGoogle);
router.post("/oauth/github", oauthGithub);

// Verification and recovery endpoints
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
