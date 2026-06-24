// server/AI/Main Agent/tools.js
import { GoogleGenAI } from "@google/genai";
import { ChatGoogle } from "@langchain/google";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { researchGraph } from "../Research Agent/graph.js"; // Tera compiled LangGraph


const searchModel = new ChatGoogle({
  model: "gemini-2.5-flash",
  temperature: 0.1,
}).bindTools([{ googleSearch: {} }]);

export const webSearchTool = tool(
  async ({ query }) => {
    try {
      console.log(`[Main Agent] Primary Route: Triggering Google Search Grounding for: "${query}"`);

      // 1. Primary Attempt: Google Search Grounding model ko hit kiya
      const res = await searchModel.invoke(query);
      const primaryResponseText = res?.content || res?.text || "";

      // Refusal detection patterns (Gemini jab haath khade karta hai toh ye bolta hai)
      const refusalKeywords = [
        "unable to access real-time",
        "limited ability to fetch",
        "cannot access real-time",
        "experience issues retrieving",
        "apologize for the inconsistency"
      ];

      // Check karo ki kya primary search fail hui?
      const isRefusal = refusalKeywords.some(keyword => 
        primaryResponseText.toLowerCase().includes(keyword)
      );

      // 2. Fallback Route: Agar refusal detect hua, toh Tavily hit karo!
      if (isRefusal || !primaryResponseText) {
        console.warn(`[Main Agent] ⚠️ Google Grounding Refused/Failed. Initiating Fallback Route via Tavily API...`);

        if (!process.env.TAVILY_API_KEY) {
          console.error("Tavily API key missing in .env file.");
          return primaryResponseText || "Search services are currently limited.";
        }

        const fallbackResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: "basic",
            max_results: 4,
          }),
        });

        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.results && fallbackData.results.length > 0) {
          console.log("[Main Agent] ✅ Fallback Successful! Tavily fetched real-time context.");
          
          // Context clean string format mein balance kiya
          const formattedContext = fallbackData.results
            .map(res => `[Source: ${res.title}] - ${res.content} (URL: ${res.url})`)
            .join("\n\n");

          return `[Live Context Retrieved via Secondary Search]:\n${formattedContext}`;
        }
      }

      // Agar Google Search ne sahi answer diya, toh bina chhede direct vahi return karo
      return primaryResponseText;

    } catch (error) {
      console.error("Error inside Hybrid Web Search Tool:", error);
      return "Failed to execute web search infrastructure loop.";
    }
  },
  {
    name: "web_search",
    description: "Use this tool for current events, latest news, weather, sports scores, stock prices, and real-time information.",
    schema: z.object({
      query: z.string().describe("The clean search query to look up on the live internet."),
    }),
  }
);
/**
 * Tool definition jo Gemini Model ko batayegi ki deep research kab trigger karni hai.
 */
export const deepResearchTool = tool(
    async ({ query }) => {
        try {
            console.log(`[Main Agent] Triggering Google-Powered Deep Research for: "${query}"`);

            // LangGraph sub-graph ko invoke kar rahe hain
            const graphResult = await researchGraph.invoke({
                query: query,
                subQueries: [],
                sources: [],
                facts: [],
                isFactsEnough: false,
                auditCount: 0
            });

            return JSON.stringify({
                success: true,
                researchData: graphResult.facts,
                message: "Deep research completed successfully."
            });
        } catch (error) {
            console.error("Error inside Deep Research Tool:", error);
            return JSON.stringify({
                success: false,
                error: "Failed to execute deep research loop."
            });
        }
    },
    {
        name: "deep_research",
        description: "Use this tool only for complex queries, factual lookups, real-time events, or when the user explicitly asks for detailed research, verification, or deep analysis. Do not use for casual greetings or simple tasks.",
        schema: z.object({
            query: z.string().describe("The refined search query or topic that requires deep web research and fact auditing."),
        }),
    }
);
