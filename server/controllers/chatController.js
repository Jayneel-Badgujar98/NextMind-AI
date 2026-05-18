import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

// Fetch all chats for the dummy user (only titles and IDs)
export const getUserChats = async (req, res) => {
  try {
    const dummyUser = await User.findOne({ email: "test@example.com" });
    if (!dummyUser) {
      return res.status(404).json({ success: false, message: "Dummy user not found" });
    }

    const chats = await Chat.find({ userId: dummyUser._id })
      .select("_id title updatedAt")
      .sort({ updatedAt: -1 }); // Latest chats first

    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch a specific chat's messages by ID
export const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dummyUser = await User.findOne({ email: "test@example.com" });
    if (!dummyUser) {
      return res.status(404).json({ success: false, message: "Dummy user not found" });
    }

    const chat = await Chat.findOne({ _id: id, userId: dummyUser._id });
    
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({ success: true, messages: chat.messages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};