import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Optional Auth: If JWT cookie exists and is valid, populate req.user, but do not block the request if missing/invalid.
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_key");
    const user = await User.findById(decoded.id).select("-password");
    
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    console.error("optionalAuth Middleware Error:", error.message);
    next(); // Move to next handler anyway since it is optional
  }
};

// Required Auth: Must have a valid JWT cookie, else returns 401 Unauthorized
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required. Please sign in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_key");
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User session not found. Please sign in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("requireAuth Middleware Error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired session. Please sign in again." });
  }
};
