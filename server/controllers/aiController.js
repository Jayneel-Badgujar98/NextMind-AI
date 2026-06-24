import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { GoogleGenAI } from "@google/genai";
import Chat from "../models/chatModel.js";
import { mainAgent } from "../AI/Main Agent/main.js";
import { cloudinary, isConfigured } from "../config/cloudinary.js";
import axios from "axios";
import { redisClient } from "../lib/redis.js";

// Helper 1: Attachments ko download ya base64 parse karna LangChain standard format ke liye
const getAttachmentData = async (attachment) => {
  if (attachment.base64) return attachment.base64.split(",")[1] || attachment.base64;
  if (attachment.url) {
    try {
      const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary').toString('base64');
    } catch (err) {
      console.error(`Attachment download failed: ${attachment.url}`, err.message);
    }
  }
  return null;
};


// Helper 2: Repetitive Cloudinary upload code ko single loop mein manage karna (Fixes attachments issue)
const processIncomingAttachments = async (attachments) => {
  const processed = [];
  if (!attachments || attachments.length === 0) return processed;

  for (const att of attachments) {
    let finalUrl = att.url || "";
    if (att.base64 && isConfigured) {
      try {
        const uploadRes = await cloudinary.uploader.upload(att.base64, { folder: "nextmind_chats" });
        finalUrl = uploadRes.secure_url;
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }
    processed.push({ name: att.name, type: att.type, url: finalUrl });
  }
  return processed;
};

// Helper 3: Asynchronously generate chat titles
const generateAndSaveTitle = async (chatId, firstMessageContent) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate a very short topic title (max 3-5 words) for: "${firstMessageContent}". Just return clean text without markdown or quotes.`,
    });
    if (response.text) await Chat.findByIdAndUpdate(chatId, { title: response.text.trim() });
  } catch (err) {
    console.error("Title generation failed:", err);
  }
};

// @desc    Chat with NextMind AI agent with live event streaming and dynamic attachments processing
// @route   POST /api/ai/chat
// @desc    Chat with NextMind AI agent (handles history, Redis query/chat caching, and live SSE streams)
// @route   POST /api/ai/chat
export const chatWithAI = async (req, res) => {
  try {
    let { messages, chatId, overwriteMessages } = req.body;

    if (!messages && req.body.query) messages = [{ role: "user", content: req.body.query }];
    if (!messages || messages.length === 0) return res.status(400).json({ success: false, message: "No messages provided." });

    const lastUserMsg = messages[messages.length - 1];
    const lastMsgContent = lastUserMsg?.content || "";

    let chat = null;
    const redisChatKey = chatId ? `chat:${chatId}` : null;

    // 1. 🔥 REDIS CHAT HISTORY CACHING LAYER (MongoDB bypass optimization)
    if (req.user && chatId) {
      // Pehle check karo ki kya is chatId ki poori history Redis mein hai?
      const cachedChatData = await redisClient.get(redisChatKey);
      
      if (cachedChatData) {
        console.log(`[Cache Hit] Retrieved full chat history from Redis for ID: ${chatId}`);
        chat = JSON.parse(cachedChatData);
      } else {
        // Cache miss hua, toh MongoDB se nikal kar Redis mein cache karo
        console.log(`[Cache Miss] Fetching chat from MongoDB for ID: ${chatId}`);
        chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found." });
        
        // Cache it for 24 hours
        await redisClient.set(redisChatKey, JSON.stringify(chat), { EX: 86400 });
      }

      // Ab naye incoming messages ko process aur insert karo (In-memory & DB sync)
      if (overwriteMessages) {
        chat.messages = await Promise.all(messages.map(async (msg) => ({
          role: msg.role,
          content: msg.content,
          attachments: await processIncomingAttachments(msg.attachments),
          timestamp: msg.timestamp || new Date()
        })));
      } else {
        chat.messages.push({
          role: "user",
          content: lastMsgContent,
          attachments: await processIncomingAttachments(lastUserMsg.attachments),
          timestamp: lastUserMsg.timestamp || new Date()
        });
      }

      // Sync modifications to database asynchronously to avoid blocking the thread
      Chat.updateOne({ _id: chat._id }, { $set: { messages: chat.messages } }).catch(e => console.error("DB Async Sync failed:", e));
      // Update the cache instantly with 24 hours expiry
      await redisClient.set(redisChatKey, JSON.stringify(chat), { EX: 86400 });

    } else if (req.user && !chatId) {
      // Naya chat room creation handler (Pehle jaisa hi)
      const attachments = await processIncomingAttachments(lastUserMsg.attachments);
      chat = new Chat({
        userId: req.user._id,
        title: "New Chat",
        messages: [{ role: "user", content: lastMsgContent, attachments, timestamp: new Date() }]
      });
      await chat.save();
      
      // Naye chat ko bhi Redis cache mein push karo
      const newChatKey = `chat:${chat._id}`;
      await redisClient.set(newChatKey, JSON.stringify(chat), { EX: 86400 });
      generateAndSaveTitle(chat._id, lastMsgContent).catch(e => console.error(e));
    }

    // 2. Map conversation logs into LangChain format
    const mappedMessages = [];
    if (req.user && (req.user.instructionsWho || req.user.instructionsHow)) {
      const memory = `User Profile:\n${req.user.instructionsWho || ""}\n\nStyle Rules:\n${req.user.instructionsHow || ""}`;
      mappedMessages.push(new SystemMessage(`Remember these instructions for the conversation:\n${memory}`));
    }

    for (const msg of messages) {
      if (msg.role === "assistant") {
        mappedMessages.push(new AIMessage(msg.content));
      } else {
        if (msg.attachments && msg.attachments.length > 0) {
          const parts = [{ type: "text", text: msg.content || "" }];
          for (const att of msg.attachments) {
            if (att.type?.startsWith("image/")) {
              const base64Data = await getAttachmentData(att);
              if (base64Data) parts.push({ type: "image", mimeType: att.type, data: base64Data });
            }
          }
          mappedMessages.push(new HumanMessage({ contentBlocks: parts }));
        } else {
          mappedMessages.push(new HumanMessage(msg.content));
        }
      }
    }

    // 3. Setup Response Stream Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Expose-Headers", "x-chat-id");
    if (chat) res.setHeader("x-chat-id", chat._id.toString());

    // 4. 🔥 GLOBAL RESPONSE TEXT REDIS CACHE LOOKUP
    if (lastMsgContent) {
      const cachedAiResponse = await redisClient.get(`query:${lastMsgContent}`);
      if (cachedAiResponse) {
        console.log(`[Query Cache Hit] Serving instant result from Redis for: "${lastMsgContent}"`);
        
        if (chat) {
          chat.messages.push({ role: "assistant", content: cachedAiResponse, timestamp: new Date() });
          Chat.updateOne({ _id: chat._id }, { $set: { messages: chat.messages } }).catch(e => console.error(e));
          if (redisChatKey) await redisClient.set(redisChatKey, JSON.stringify(chat), { EX: 86400 });
        }

        res.write(`data: ${JSON.stringify({ type: "text", content: cachedAiResponse })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        return res.end();
      }
    }

    // 5. Trigger streamEvents to fetch agent states if cache missed
    console.log(`[aiController] Extracting events stream for ${mappedMessages.length} messages`);
    const eventStream = await mainAgent.streamEvents({ messages: mappedMessages }, { version: "v2" });

    let fullAIResponseText = "";

    for await (const event of eventStream) {
      const eventType = event.event;
      const eventName = event.name;

      if (eventType === "on_chat_model_stream") {
        const content = event.data.chunk?.content;
        if (content) {
          let textVal = typeof content === "string" ? content : (Array.isArray(content) ? content.map(b => typeof b === "string" ? b : (b?.text || "")).join("") : (content.text || ""));
          if (textVal) {
            fullAIResponseText += textVal;
            res.write(`data: ${JSON.stringify({ type: "text", content: textVal })}\n\n`);
          }
        }
      } 
      else if (eventType === "on_tool_start") {
        const friendlyName = eventName === "web_search" ? "Google Search" : eventName === "deep_research" ? "Deep Research" : eventName;
        res.write(`data: ${JSON.stringify({ type: "status", status: `Running ${friendlyName}...` })}\n\n`);
      }
      else if (eventType === "on_tool_end") {
        const friendlyName = eventName === "web_search" ? "Google Search" : eventName === "deep_research" ? "Deep Research" : eventName;
        res.write(`data: ${JSON.stringify({ type: "status", status: `Finished executing ${friendlyName}.` })}\n\n`);
      }
    }

    // 6. 🔥 Save AI response and update inside both MongoDB and synchronized Redis structures
    if (chat && fullAIResponseText) {
      chat.messages.push({ role: "assistant", content: fullAIResponseText, timestamp: new Date() });
      
      // Update Database and cache records simultaneously
      Chat.updateOne({ _id: chat._id }, { $set: { messages: chat.messages } }).catch(e => console.error(e));
      if (redisChatKey) await redisClient.set(redisChatKey, JSON.stringify(chat), { EX: 86400 });

      if (lastMsgContent) {
        // Save the semantic prompt cache under query namespace to keep things separate
        await redisClient.set(`query:${lastMsgContent}`, fullAIResponseText, { EX: 86400 });
        console.log(`[Cache Sync Completed] Query responses and histories are safely stored in memory.`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();

  } catch (err) {
    console.error("Critical error inside controller layer:", err);
    res.write(`data: ${JSON.stringify({ type: "error", message: "Server encountered runtime errors." })}\n\n`);
    res.end();
  }
};