import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: false, // Optional for OAuth users
      minlength: 6
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    avatar: {
      type: String,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: false // Only applies to credentials users; OAuth is auto-verified
    },
    isDev: {
      type: Boolean,
      default: false // Set manually in DB to true to grant developer access
    },
    language: {
      type: String,
      default: "English"
    },
    themePreference: {
      type: String,
      default: "System"
    },
    enterSends: {
      type: Boolean,
      default: true
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    instructionsWho: {
      type: String,
      default: ""
    },
    instructionsHow: {
      type: String,
      default: ""
    },
    otp: {
      type: String,
      default: null
    },
    otpExpiry: {
      type: Date,
      default: null
    },
    resetPasswordOtp: {
      type: String,
      default: null
    },
    resetPasswordOtpExpiry: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

const User = mongoose.model("User", userSchema)

export default User