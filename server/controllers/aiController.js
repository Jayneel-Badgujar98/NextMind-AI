import { getAIResponseStream, generateChatTitle } from "../config/aiService.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import fs from "fs";
import path from "path";
import { cloudinary, isConfigured } from "../config/cloudinary.js";

// Helper function to process raw base64 attachments on-the-fly
const processBase64Attachments = async (messagesArray, reqProtocol, reqHost) => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const msg of messagesArray) {
    if (msg.attachments && Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        if (att.base64) {
          if (isConfigured) {
            // Production Flow: Upload to Cloudinary CDN
            try {
              const uploadResult = await cloudinary.uploader.upload(att.base64, {
                resource_type: "auto", // Automatically handles images, PDFs, etc.
                folder: "nextmind_attachments",
              });
              att.url = uploadResult.secure_url;
              // Keep att.base64 so that getAIResponseStream can use it without downloading
            } catch (cloudinaryError) {
              console.error("Cloudinary upload failed, falling back to local disk storage:", cloudinaryError);
              await saveFileToLocalDisk(att, uploadsDir, reqProtocol, reqHost);
            }
          } else {
            // Development Flow: Save to local disk
            await saveFileToLocalDisk(att, uploadsDir, reqProtocol, reqHost);
          }
        }
      }
    }
  }
};

// Fallback helper to save decoded base64 buffers directly to server's static directory
const saveFileToLocalDisk = async (att, uploadsDir, reqProtocol, reqHost) => {
  const matches = att.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let ext = "bin";
  let bufferData;

  if (matches && matches.length === 3) {
    const mime = matches[1];
    bufferData = Buffer.from(matches[2], "base64");
    ext = mime.split("/")[1] || "bin";
    if (ext === "jpeg") ext = "jpg";
  } else {
    bufferData = Buffer.from(att.base64, "base64");
    ext = att.type ? att.type.split("/")[1] : "bin";
  }

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, bufferData);

  att.url = `${reqProtocol}://${reqHost}/uploads/${fileName}`;
  // Keep att.base64 so that getAIResponseStream can use it without downloading
};

// Helper to strip base64 from messages array when saving to MongoDB
const sanitizeMessagesForDB = (messagesArray) => {
  return messagesArray.map(msg => ({
    role: msg.role,
    content: msg.content,
    attachments: msg.attachments ? msg.attachments.map(att => ({
      name: att.name,
      type: att.type,
      url: att.url
    })) : [],
    timestamp: msg.timestamp || new Date()
  }));
};

// @desc    Chat with NextMind AI (Handles text, images, PDFs, editing, and regenerations)
// @route   POST /api/ai/chat
export const chatWithAI = async (req, res) => {
  try {
    const { messages, chatId, overwriteMessages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required" });
    }

    let currentChat;

    if (req.user) {
      // 1. Process base64 attachments on-the-fly (saves to Cloudinary or disk, and sets url)
      await processBase64Attachments(messages, req.protocol, req.get("host"));

      const lastUserMessage = messages[messages.length - 1];

      if (!chatId) {
        // Create new chat session for authenticated user
        currentChat = await Chat.create({
          userId: req.user._id,
          messages: [{
            role: "user",
            content: lastUserMessage.content,
            attachments: lastUserMessage.attachments ? lastUserMessage.attachments.map(a => ({
              name: a.name,
              type: a.type,
              url: a.url
            })) : []
          }]
        });
        
        // Expose new chatId so client captures it
        res.setHeader("x-chat-id", currentChat._id.toString());
        res.setHeader("Access-Control-Expose-Headers", "x-chat-id");

        // Generate title dynamically in the background
        generateChatTitle(lastUserMessage.content).then(title => {
          Chat.findByIdAndUpdate(currentChat._id, { title }).catch(err => console.error("Title Update Error:", err));
        });
      } else {
        // Subsequent messages in existing chat session
        currentChat = await Chat.findById(chatId);
        if (!currentChat) {
          return res.status(404).json({ success: false, message: "Chat not found" });
        }
        
        // Safety check
        if (currentChat.userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: "Unauthorized access to this chat" });
        }

        if (overwriteMessages) {
          // Truncate/Overwrite messages history (for edit message or regenerate response flows)
          currentChat.messages = sanitizeMessagesForDB(messages);
        } else {
          // Push new user message
          currentChat.messages.push({
            role: "user",
            content: lastUserMessage.content,
            attachments: lastUserMessage.attachments ? lastUserMessage.attachments.map(a => ({
              name: a.name,
              type: a.type,
              url: a.url
            })) : []
          });
        }
        await currentChat.save();
      }
    }

    // Headers for SSE (Server-Sent Events) streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Connection", "keep-alive");

    // Fetch AI response stream from Gemini
    const responseStream = await getAIResponseStream(messages);

    let fullAiResponse = "";

    // Read stream chunks
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullAiResponse += chunkText;
      res.write(chunkText); 
    }

    // Guard against quota/safety blocks yielding empty responses
    if (!fullAiResponse.trim()) {
      throw new Error("AI generated an empty response. This usually indicates an API block or connection failure.");
    }

    // Save final AI response to DB
    if (req.user && currentChat) {
      if (overwriteMessages) {
        // Re-locate chat instance to avoid duplicate race overrides
        currentChat = await Chat.findById(currentChat._id);
        currentChat.messages = sanitizeMessagesForDB(messages);
      }
      currentChat.messages.push({ role: "assistant", content: fullAiResponse });
      await currentChat.save();
    }

    // Terminate response stream cleanly
    res.end();

  } catch (error) {
    console.error("Chat Controller Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.end(); // If stream had already started, just close connection
    }
  }
};