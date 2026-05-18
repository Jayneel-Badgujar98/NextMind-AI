import { getAIResponseStream, generateChatTitle } from "../config/gemini.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

export const chatWithAI = async (req, res) => {
  try {
    const { messages, chatId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required" });
    }

    // Temporarily using dummy user until Auth is implemented
    const dummyUser = await User.findOne({ email: "test@example.com" });
    if (!dummyUser) {
        return res.status(500).json({ success: false, message: "Dummy user not found in DB" });
    }

    const lastUserMessage = messages[messages.length - 1];
    let currentChat;

    if (!chatId) {
        // Step 2: First Message - Create new chat
        currentChat = await Chat.create({
            userId: dummyUser._id,
            messages: [{ role: "user", content: lastUserMessage.content }]
        });
        
        // Expose the new chatId to the frontend via headers (crucial for CORS)
        res.setHeader("x-chat-id", currentChat._id.toString());
        res.setHeader("Access-Control-Expose-Headers", "x-chat-id");

        // Step 4: Generate title in the background silently
        generateChatTitle(lastUserMessage.content).then(title => {
            Chat.findByIdAndUpdate(currentChat._id, { title }).catch(err => console.error("Title Update Error:", err));
        });
    } else {
        // Step 3: Subsequent Messages - Update existing chat
        currentChat = await Chat.findById(chatId);
        if (!currentChat) {
             return res.status(404).json({ success: false, message: "Chat not found" });
        }
        currentChat.messages.push({ role: "user", content: lastUserMessage.content });
        await currentChat.save();
    }

    // Streaming ke liye zaroori Headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Connection", "keep-alive");

    // Gemini se stream object liya
    const stream = await getAIResponseStream(messages);

    let fullAiResponse = "";

    // Loop chala kar ek-ek word frontend ko bheja
    for await (const chunk of stream) {
      const chunkText = chunk.text();
      fullAiResponse += chunkText;
      res.write(chunkText); 
    }

    // Jab sab type ho jaye, AI ka response DB mein save karein
    currentChat.messages.push({ role: "assistant", content: fullAiResponse });
    await currentChat.save();

    // Stream band kar do
    res.end();

  } catch (error) {
    console.error("Chat Controller Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.end(); // Agar aadhi stream chali gayi thi, toh pipe band kar do
    }
  }
}