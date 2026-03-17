import mongoose from "mongoose"

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    message: String,
    response: String
  },
  { timestamps: true }
)

const Chat = mongoose.model("Chat", chatSchema)

export default Chat