import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import axios from "axios";
import { sendOtpEmail, sendResetPasswordEmail } from "../config/emailService.js";

// Helper to generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "default_jwt_secret_key", {
    expiresIn: "7d",
  });
};

// Helper to set Cookie
const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd, // Secure only in production (HTTPS)
    sameSite: isProd ? "none" : "lax", // "none" required for cross-site cookies in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please enter all fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = String(100000 + Math.floor(Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user (unverified by default)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      isVerified: false,
      otp,
      otpExpiry
    });

    // Send OTP Verification Email
    try {
      await sendOtpEmail(email, name, otp);
    } catch (mailError) {
      console.error("Nodemailer registration email failed:", mailError);
      // Clean up user record so they can try again once they fix their SMTP config
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send verification email. Please verify your GMAIL_USER and GMAIL_PASS environment variables." 
      });
    }

    res.status(201).json({
      success: true,
      requireVerification: true,
      message: "Registration successful. Please enter the 6-digit verification code sent to your email.",
      email: newUser.email
    });
  } catch (error) {
    console.error("Register Controller Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please fill in all credentials." });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // OAuth only users might not have a password
    if (!user.password) {
      return res.status(400).json({ 
        success: false, 
        message: "This email is registered using Google or GitHub. Please sign in via social login." 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // Check email verification status
    if (!user.isVerified) {
      // Re-generate OTP on the fly so they can complete verification easily!
      const otp = String(100000 + Math.floor(Math.random() * 900000));
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      try {
        await sendOtpEmail(user.email, user.name, otp);
      } catch (mailError) {
        console.error("Failed to resend verification OTP on unverified login:", mailError);
      }

      return res.status(401).json({ 
        success: false, 
        requireVerification: true,
        message: "Your email address is not verified. A new 6-digit code has been sent to your email.",
        email: user.email
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Set cookie
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      expires: new Date(0), // Instantly expires cookie
    });

    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Controller Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// @desc    Get current user profile (session check)
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    // req.user has already been loaded by requireAuth middleware without the password field
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("GetMe Controller Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// @desc    Google OAuth sign in / sign up handler
// @route   POST /api/auth/oauth/google
export const oauthGoogle = async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    if (!email || !googleId || !name) {
      return res.status(400).json({ success: false, message: "Missing required Google profile data." });
    }

    // 1. Try to find user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2. If not found, try to find user by email
      user = await User.findOne({ email });

      if (user) {
        // Link Google ID to existing credentials account
        user.googleId = googleId;
        if (!user.avatar) user.avatar = avatar;
        await user.save();
      } else {
        // 3. Create a brand new user
        user = await User.create({
          name,
          email,
          googleId,
          avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        });
      }
    }

    // Generate JWT and set cookie
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("oauthGoogle Controller Error:", error);
    res.status(500).json({ success: false, message: "Google authentication failed." });
  }
};

// @desc    GitHub OAuth sign in / sign up handler
// @route   POST /api/auth/oauth/github
export const oauthGithub = async (req, res) => {
  try {
    const { code } = req.body;

    // If code is not sent, it means the client might still be passing direct profileData (fallback to support mock/direct flows)
    if (!code) {
      const { name, email, githubId, avatar } = req.body;

      if (!email || !githubId || !name) {
        return res.status(400).json({ success: false, message: "Missing required GitHub profile data or code." });
      }

      let user = await User.findOne({ githubId });

      if (!user) {
        user = await User.findOne({ email });

        if (user) {
          user.githubId = githubId;
          if (!user.avatar) user.avatar = avatar;
          await user.save();
        } else {
          user = await User.create({
            name,
            email,
            githubId,
            avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
          });
        }
      }

      const token = generateToken(user._id);
      setAuthCookie(res, token);

      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    }

    // Live Flow: exchange code for access_token on backend using Axios for maximum compatibility
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      console.error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in server/.env");
      return res.status(500).json({ success: false, message: "Server configuration error: GitHub secrets are missing." });
    }

    const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
      client_id,
      client_secret,
      code
    }, {
      headers: {
        "Accept": "application/json"
      }
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error("GitHub access token exchange failed. Response data:", tokenResponse.data);
      return res.status(400).json({ success: false, message: "Invalid authorization code or failed to exchange token." });
    }

    // Fetch GitHub Profile details using Axios
    const profileResponse = await axios.get("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "NextMind-AI-Chatbot"
      }
    });
    const profile = profileResponse.data;

    // Fetch GitHub User Emails (since email can be private/null on standard profile)
    let email = profile.email;
    if (!email) {
      try {
        const emailsResponse = await axios.get("https://api.github.com/user/emails", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "User-Agent": "NextMind-AI-Chatbot"
          }
        });
        const emails = emailsResponse.data;
        if (Array.isArray(emails)) {
          const primaryEmailObj = emails.find(e => e.primary) || emails[0];
          email = primaryEmailObj?.email;
        }
      } catch (err) {
        console.warn("Failed to fetch private emails from GitHub:", err.message);
      }
    }

    if (!email) {
      email = `${profile.login}@github.com`; // Fallback if no email is set/found
    }

    const githubId = `git_${profile.id}`;
    const name = profile.name || profile.login;
    const avatar = profile.avatar_url;

    // Proceed to login or register
    let user = await User.findOne({ githubId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        user.githubId = githubId;
        if (!user.avatar) user.avatar = avatar;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          githubId,
          avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        });
      }
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("oauthGithub Controller Error:", error);
    res.status(500).json({ success: false, message: "GitHub authentication failed." });
  }
};

// @desc    Verify email address using OTP
// @route   POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Please provide email and 6-digit OTP." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    // Check OTP and Expiry
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid verification code. Please check again." });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Log the user in directly!
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// @desc    Resend OTP for email verification
// @route   POST /api/auth/resend-verification
export const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide your email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found with this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    // Generate new OTP
    const otp = String(100000 + Math.floor(Math.random() * 900000));
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send OTP Verification Email
    await sendOtpEmail(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: "A new 6-digit verification code has been successfully sent to your email."
    });
  } catch (error) {
    console.error("Resend Verification OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to resend code. Please try again." });
  }
};

// @desc    Forgot Password - Sends OTP email to user
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide your email address." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "No account found with this email address." });
    }

    // Social login users cannot reset passwords this way
    if (!user.password) {
      return res.status(400).json({ 
        success: false, 
        message: "This account was registered using Google or GitHub. Please sign in via social login." 
      });
    }

    // Generate OTP
    const otp = String(100000 + Math.floor(Math.random() * 900000));
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    // Send Reset Email
    await sendResetPasswordEmail(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: "A 6-digit password recovery code has been sent to your email."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to process recovery request. Please try again." });
  }
};

// @desc    Reset Password - Verifies OTP and updates password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Please enter all fields." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    // Check OTP and Expiry
    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid recovery code. Please check again." });
    }

    if (new Date() > user.resetPasswordOtpExpiry) {
      return res.status(400).json({ success: false, message: "Recovery code has expired. Please request a new one." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save user
    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been successfully reset! You can now log in."
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// @desc    Update user preferences and personalization settings
// @route   PUT /api/auth/preferences
export const updatePreferences = async (req, res) => {
  try {
    const { 
      name, 
      avatar,
      language, 
      themePreference, 
      enterSends, 
      temperature, 
      instructionsWho, 
      instructionsHow 
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (language) user.language = language;
    if (themePreference) user.themePreference = themePreference;
    if (enterSends !== undefined) user.enterSends = enterSends;
    if (temperature !== undefined) user.temperature = temperature;
    if (instructionsWho !== undefined) user.instructionsWho = instructionsWho;
    if (instructionsHow !== undefined) user.instructionsHow = instructionsHow;

    await user.save();

    // Exclude password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("UpdatePreferences Controller Error:", error);
    res.status(500).json({ success: false, message: "Failed to update preferences." });
  }
};

// @desc    Delete user account and all their chats
// @route   DELETE /api/auth/delete-account
export const deleteAccount = async (req, res) => {
  try {
    // Dynamic import to avoid circular dependencies
    const Chat = (await import("../models/chatModel.js")).default;
    
    // Delete all chats for the user
    await Chat.deleteMany({ userId: req.user._id });
    
    // Delete the user
    await User.findByIdAndDelete(req.user._id);

    // Clear JWT cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Account and all associated chats deleted successfully."
    });
  } catch (error) {
    console.error("DeleteAccount Controller Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete account." });
  }
};
