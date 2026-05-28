import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

// Fetch all chats for the logged-in user (only titles and IDs)
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
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

    const chat = await Chat.findOne({ _id: id, userId: req.user._id });
    
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({ success: true, messages: chat.messages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Clear all chat sessions for the logged-in user
export const clearAllChats = async (req, res) => {
  try {
    await Chat.deleteMany({ userId: req.user._id });
    res.status(200).json({ success: true, message: "All chats cleared successfully." });
  } catch (error) {
    console.error("Error clearing chats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch chat usage stats and activity logs for analytics
export const getChatAnalytics = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id });
    
    let totalMessages = 0;
    const tagCounts = {};
    const activityData = {};

    chats.forEach(chat => {
      totalMessages += chat.messages.length;
      
      // Aggregate tags
      const tag = chat.categoryTag || "#General";
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;

      // Group activity by calendar date
      if (chat.createdAt) {
        const dateStr = new Date(chat.createdAt).toISOString().split('T')[0];
        activityData[dateStr] = (activityData[dateStr] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      totalChats: chats.length,
      totalMessages,
      tagAnalytics: Object.keys(tagCounts).map(tag => ({
        tag,
        count: tagCounts[tag]
      })),
      activityLogs: activityData
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};