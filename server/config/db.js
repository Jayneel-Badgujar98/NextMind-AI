import mongoose from "mongoose"
import User from "../models/userModel.js"

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL)
    console.log("MongoDB connected")

    // Create a dummy user if none exists for testing purposes
    const existingUser = await User.findOne({ email: "test@example.com" })
    if (!existingUser) {
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "123456" // In a real app, this should be hashed
      })
      console.log("Dummy user created")
    }

  } catch (error) {
    console.error("MongoDB connection failed", error)
    process.exit(1)
  }
}

export default connectDB ;