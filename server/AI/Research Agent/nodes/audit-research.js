// app/lib/nodes/audit-research

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

const auditLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.0,
});

const auditSchema = z.object({
  isDataSufficient: z.boolean().describe("true = facts are complete enough. false = critical information gaps exist."),
  coverageSummary: z.string().describe("Summary of what dimensions are well covered."),
  criticalGaps: z.array(z.string()).describe("List of specific missing details."),
  gapClosingQuery: z.string().describe("A single high-density target search query to resolve the missing facts."),
  confidenceScore: z.number().min(0).max(100).describe("Data sufficiency confidence score.")
});

const structuredAuditor = auditLLM.withStructuredOutput(auditSchema, {
  name: "research_gap_auditor",
});

const MAX_LOOP_COUNT = 2; // Reduced to 2 loops maximum for massive speed & token optimization
const MIN_FACTS_THRESHOLD = 8;
const MIN_SOURCE_SCORE = 45;

export async function auditResearchGapsNode(state) {
  const currentLoop = state.loopCount || 0;

  if (currentLoop >= MAX_LOOP_COUNT) {
    console.warn(`[AuditResearchGapsNode] 🛑 Max loop limit reached (${MAX_LOOP_COUNT}). Finalizing flow.`);
    return {
      nextStep: "finalize",
      auditFeedback: `Maximum iterations reached. Finalizing report.`,
      loopCount: currentLoop,
    };
  }

  const facts = state.facts || [];
  const sources = state.sources || [];
  const averageSourceScore = state.averageSourceScore || 0;
  const factsQualityFlag = state.factsQualityFlag || "OK";

  // Dynamic Query Builders to vary iteration search focus
  const variations = [
    "custom silicon acceleration architectural chip specifications",
    "hardware infrastructure benchmarks cloud pricing margin vulnerabilities"
  ];
  const dynamicQuerySuffix = variations[currentLoop % variations.length];

  // ── EARLY EXIT GUARD: Sufficiency Match ─────────────────────
  if (facts.length >= 15 && averageSourceScore >= MIN_SOURCE_SCORE) {
    console.log(`[AuditResearchGapsNode] 🎉 Data abundance reached (${facts.length} facts). Early exiting to finalize.`);
    return {
      nextStep: "finalize",
      auditFeedback: "Data abundance gate met. High density intelligence assured.",
      loopCount: currentLoop
    };
  }

  // ── FAST PATH: Source quality low ───────────────────────────
  if (averageSourceScore > 0 && averageSourceScore < MIN_SOURCE_SCORE) {
    console.warn(`[AuditResearchGapsNode] ⚠️ Quality Index Low (${averageSourceScore}/100). Requesting specialized reports.`);
    return {
      nextStep: "loop_search",
      nextQuery: `${state.question} ${dynamicQuerySuffix} analysis report`,
      auditFeedback: `Curated quality index (${averageSourceScore}) falls below safety threshold. Modifying pipeline depth.`,
      loopCount: currentLoop + 1,
      queryMeta: [],
    };
  }

  console.log(`\n[AuditResearchGapsNode] Launching LLM data sufficiency analysis loop [${currentLoop + 1}/${MAX_LOOP_COUNT}]...`);

  const factsText = facts
    .map((f, i) => `[${i + 1}] [${f.dimension.toUpperCase()}] Source #${f.sourceId}: ${f.fact}`)
    .join("\n");

  const dimensionCoverage = facts.reduce((acc, f) => {
    acc[f.dimension] = (acc[f.dimension] || 0) + 1;
    return acc;
  }, {});

  try {
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(
        `USER BASE QUESTION: "${state.question}"\n\n` +
        `DIMENSION LOGS:\n${JSON.stringify(dimensionCoverage, null, 2)}\n\n` +
        `EXTRACTED DATA LAYER:\n${factsText}\n\n` +
        `CURATED SELECTION SCORE: ${averageSourceScore}/100\n\n` +
        `Audit current metrics and respond.`
      ),
    ];

    const audit = await structuredAuditor.invoke(messages);

    if (!audit.isDataSufficient && audit.gapClosingQuery && facts.length < 25) {
      console.log(`[AuditResearchGapsNode] 🔍 Smart Gap Identified. Running adaptive query: "${audit.gapClosingQuery}"`);
      return {
        nextStep: "loop_search",
        nextQuery: `${audit.gapClosingQuery} 2026 specifications`, // Append current year for relevance
        auditFeedback: audit.coverageSummary,
        auditConfidenceScore: audit.confidenceScore,
        loopCount: currentLoop + 1,
        queryMeta: [],
      };
    }

    return {
      nextStep: "finalize",
      auditFeedback: audit.coverageSummary,
      auditConfidenceScore: audit.confidenceScore,
      loopCount: currentLoop,
    };

  } catch (err) {
    console.error("[AuditResearchGapsNode] ❌ LLM Audit crash fallback:", err.message);

    return {
      nextStep: "loop_search",
      loopCount: (state.loopCount || 0) + 1,   // 🔥 ye line add karo
      auditFeedback: "Bypassing gap auditor via structural exception safeguards.",
      loopCount: currentLoop,
    };
  }
}

const SYSTEM_PROMPT = `You are a Senior Research Quality Auditor. Check the processed facts against the user question.
Ensure the dataset covers technical architecture, specific custom silicon strategies (TPUs, Trainium, Maia), and hardware metrics up to 2026.
If critical components are missing, specify the deficiency and output a razor-sharp, search-engine-optimized gapClosingQuery.`;