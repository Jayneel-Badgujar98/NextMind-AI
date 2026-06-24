import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import { redisClient } from "../lib/redis.js";

// Fetch all chats for the logged-in user (only titles and IDs)
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select("_id title updatedAt isPinned")
      .sort({ isPinned: -1, updatedAt: -1 }); // Pinned chats first, then latest chats

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
    const chats = await Chat.find({ userId: req.user._id }).select("_id");
    await Chat.deleteMany({ userId: req.user._id });
    // Clear Redis caches
    for (const chat of chats) {
      await redisClient.del(`chat:${chat._id}`);
    }
    res.status(200).json({ success: true, message: "All chats cleared successfully." });
  } catch (error) {
    console.error("Error clearing chats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Rename a specific chat
export const renameChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    const chat = await Chat.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { title: title.trim() },
      { new: true }
    );
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    // Update Redis cache if exists
    const redisChatKey = `chat:${id}`;
    const cached = await redisClient.get(redisChatKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.title = chat.title;
      await redisClient.set(redisChatKey, JSON.stringify(parsed), { EX: 86400 });
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("Error renaming chat:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a specific chat
export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    // Remove from Redis cache
    await redisClient.del(`chat:${id}`);
    res.status(200).json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Toggle pin status of a specific chat
export const togglePinChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findOne({ _id: id, userId: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    chat.isPinned = !chat.isPinned;
    await chat.save();

    // Update Redis cache if exists
    const redisChatKey = `chat:${id}`;
    const cached = await redisClient.get(redisChatKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.isPinned = chat.isPinned;
      await redisClient.set(redisChatKey, JSON.stringify(parsed), { EX: 86400 });
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};