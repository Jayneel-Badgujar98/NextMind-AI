// server/AI/Main Agent/tools.js
import { GoogleGenAI } from "@google/genai";
import { ChatGoogle } from "@langchain/google";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { researchGraph } from "../Research Agent/graph.js"; // Tera compiled LangGraph


const searchModel = new ChatGoogle({
  model: "gemini-2.5-flash",
}).bindTools([
  {
    googleSearch: {},
  },
]);

export const webSearchTool = tool(
  async ({ query }) => {
    try {
      console.log(
        `[Main Agent] Triggering Google Search for: "${query}"`
      );

      const res = await searchModel.invoke(query);
      console.log("Web search tool result" , res)

      return res  ;

    } catch (error) {
      console.error(
        "Error inside Google Web Search Tool:",
        error
      );

      return "Failed to perform web search.";
    }
  },
  {
    name: "web_search",
    description:
      "Use this tool for current events, latest news, weather, sports scores, stock prices, and real-time information.",

    schema: z.object({
      query: z
        .string()
        .describe("The search query to look up on Google."),
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
