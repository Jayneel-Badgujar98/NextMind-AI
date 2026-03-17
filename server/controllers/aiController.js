import { getAIResponse } from "../config/gemini.js"

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      })
    }

    const reply = await getAIResponse(message)

    res.status(200).json({
      success: true,
      reply
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}