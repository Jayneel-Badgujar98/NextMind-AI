// app/lib/nodes/generate-subqueries-node.js

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

const plannerLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite", // Free tier friendly, heavy reasoning engine
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.4,
});

const queryExpansionSchema = z.object({
  userIntentAnalysis: z
    .string()
    .describe(
      "Analysis of user's true intent — hidden fears, motivations, market context, or comparison angles they might be thinking about."
    ),
  dimensions: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe("Core research dimensions identified from the query (e.g., 'Definition & Background', 'Risks & Safety', 'Career Impact')."),
  queries: z
    .array(
      z.object({
        query: z.string().describe("Search query optimized for web search engines. No conversational words."),
        type: z
          .enum(["broad_comprehensive", "factual_short"])
          .describe(
            "'broad_comprehensive' = pulls whitepapers/reports/deep dives. 'factual_short' = grabs stats, dates, official data."
          ),
        dimension: z.string().describe("Which research dimension this query targets. Must match one of the strings in the dimensions array exactly."),
        rationale: z.string().describe("Why this specific query will produce useful results."),
      })
    )
    .min(6)
    .max(10)
    .describe("Generated search queries covering all identified dimensions."),
});

const structuredPlanner = plannerLLM.withStructuredOutput(queryExpansionSchema, {
  name: "query_expansion_planner",
});

// Synced the text prompt perfectly with Zod constraints (6-10 total, min 3 broad, min 3 factual)
const SYSTEM_PROMPT = `You are a Senior Research Strategist for a Deep Research AI system — like Perplexity or ChatGPT Deep Research.

Your job:
1. Decode the user's TRUE intent behind their question — including hidden fears, career worries, comparison needs, or market curiosity they haven't explicitly stated.
2. Identify 3–6 distinct research DIMENSIONS that fully cover the topic.
3. Generate exactly 6 to 10 targeted, non-overlapping search queries across those dimensions.

Query distribution and formatting rules:
- Total queries MUST be between 6 and 10 (matching the schema limits).
- At least 3 queries must be marked as "broad_comprehensive" (pull whitepapers, McKinsey/Goldman reports, academic papers, official documentation).
- At least 3 queries must be marked as "factual_short" (statistics, dates, benchmarks, SEC filings, official source data).
- Optimize queries for Google/Bing — use precise keywords and search operators if needed, not conversational language.
- Include queries that target: definitions/background, technical architecture, risks/limitations, market trends, regulation, and career/human impact.

`;


export async function generateSubqueriesNode(state) {
  try {
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(`User's Research Question: "${state.question}"`),
    ];

    const plan = await structuredPlanner.invoke(messages);

    // Separate broad vs factual queries for downstream use
    const broadQueries = plan.queries
      .filter((q) => q.type === "broad_comprehensive")
      .map((q) => q.query);

    const factualQueries = plan.queries
      .filter((q) => q.type === "factual_short")
      .map((q) => q.query);

    const allSubQueries = plan.queries.map((q) => q.query);

    console.log(`[SubqueryNode] Intent: ${plan.userIntentAnalysis}`);
    console.log(`[SubqueryNode] Generated ${allSubQueries.length} queries across ${plan.dimensions.length} dimensions`);

    return {
      dimensions: plan.dimensions,
      subQueries: allSubQueries,
      broadQueries,      // for deep-dive search nodes (scraping)
      factualQueries,    // for quick-fact search nodes (snippets)
      intentAnalysis: plan.userIntentAnalysis,
      queryMeta: plan.queries, // full metadata — dimension + rationale per query
    };
  } catch (error) {
    console.error("[SubqueryNode] Error:", error);
    return {
      dimensions: ["General Research"],
      subQueries: [state.question],
      broadQueries: [state.question],
      factualQueries: [],
      intentAnalysis: "Fallback — structured parsing failed.",
      queryMeta: [],
    };
  }
}