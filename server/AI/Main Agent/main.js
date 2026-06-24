// server/AI/Main Agent/main.js
import { ChatGoogle } from "@langchain/google/node"; // Node.js ke liye custom path
import { deepResearchTool } from "./tools.js";
import { webSearchTool } from "./tools.js";
import { createAgent } from "langchain";

// 1. Raw Base Model configure kiya (Isme bindTools mat chalao)

// 2. Supervisor Agent ke liye System Prompt
const systemPrompt = `You are NextMind AI, an advanced, highly intelligent multi-agent orchestrator powered by Google AI.
Your goal is to answer the user's query with maximum accuracy.
You can answer directly if the user's query is not related to real time info or the deep research.

You have access to:
1. 'web_search' tool: Use this for real time information , current weather , current news and all the real time data .
2. 'deep_research' tool: Use this ONLY for complex queries, comprehensive research reports, or deep verification.

Once the 'deep_research' tool returns the gathered facts, synthesize a beautiful, well-structured response based strictly on the facts provided.`;

// 3. LangGraph prebuilt agent mein tools aur system prompt inject kiya

const model = new ChatGoogle({
  model: "gemini-3.1-flash-lite",
  temperature: 0.2,
});

export const mainAgent = createAgent({
  model,
  tools: [webSearchTool, deepResearchTool],
  prompt: systemPrompt,
});



