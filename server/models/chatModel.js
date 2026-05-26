// models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      default: "New Chat" // Jab chat shuru hogi, title yehi rahega
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"], // Sirf ye do roles allowed hain
          required: true
        },
        content: {
          type: String,
          required: true
        },
        attachments: [
          {
            name: { type: String },
            type: { type: String },
            url: { type: String }
          }
        ],
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;