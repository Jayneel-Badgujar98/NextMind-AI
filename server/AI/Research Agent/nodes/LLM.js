// app/lib/nodes/LLM.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

// ─────────────────────────────────────────────────────────────
// MODEL CONFIG — EXECUTIVE PRODUCTION LEVEL
// Primary: gemini-2.5-pro (Absolute beast for detailed analytical prose and tables)
// Fallback: gemini-3.1-flash (Highly competent, massive token window safety)
// ─────────────────────────────────────────────────────────────
const reportLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite", 
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.2, // Kept strict for historical & metric precision
  maxOutputTokens: 8192, // Enterprise sweet spot for a dense 2500+ word report
});

const fallbackReportLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.25,
  maxOutputTokens: 8192,
});

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — MCKINSEY & GARTNER SPECIFICATION ARCHITECTURE
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Principal Research Director at an elite technological and financial intelligence institute, matching the analytical standards of McKinsey Global Institute, Gartner Research, and Goldman Sachs Global Investment Research.

Your mandate: Author an exhaustive, enterprise-grade, highly-structured research dossier based strictly on the provided fact matrices and source index. Every claim must be heavily metrics-driven and traceable. 

════════════════════════════════════════════════════════════
STRICT COGNITIVE EXPANSION AND RECOGNITION RULES
════════════════════════════════════════════════════════════
1. COMPREHENSIVE VECTOR ANALYSIS: You must expand fully on all core pillars queried by the user. If the topic includes Hyperscalers (AWS, Azure, GCP), you are explicitly REQUIRED to deeply contrast their AI Infrastructure, Custom Silicon Strategies (e.g., AWS Trainium/Inferentia, Google TPU architectures, Microsoft Maia chips), Enterprise Adoption curves, and Monetization/Pricing models.
2. ZERO DATA TRUNCATION: Do not give high-level summaries or short bullet points. Build extensive structural paragraphs detailing architectural variations and data workflows. 
3. DEPTH OVER BREADTH: Acknowledge the current structural timeline of 2026. Every section must contain specialized domain terminology (e.g., TCO optimization, hardware-software co-design, mixed-precision training execution).

════════════════════════════════════════════════════════════
STRICT REPORT SCHEMA LAYOUT — MANDATORY
════════════════════════════════════════════════════════════
Your final document output must match this structure exactly:

# [Descriptive Structural Research Title]

## Executive Summary
3-5 sentence high-density strategic overview. State the single most critical financial or infrastructure metric upfront. Establish the current 2026 industry status vector.

## 1. Technological Architecture & Foundational Infrastructure
[Deep dive into the operational infrastructure frameworks. Contrast model flexibility approaches against end-to-end platform consolidation paradigms.]

## 2. Proprietary Custom Silicon Strategies & Compute Acceleration
[Exhaustive analysis of custom silicon acceleration. Detail the exact hardware-software co-design of AWS Trainium/Inferentia accelerators, Google's TPU v5p/v6 infrastructure, and Microsoft's customized Maia silicon architectures. Explain how proprietary silicon mitigates supply-chain risks, drops total cost of ownership (TCO), and shifts execution margins away from external GPU dependencies.]

## 3. Comparative Competitive Matrix (Tabular Overview)
[Render a comprehensive, clean Markdown Table with at minimum 5 detailed rows and 4 columns mapping operational players across specific metrics, features, benchmarks, or core moats. Place a dense narrative analysis beneath it.]

## 4. Commercial Parameters & Business Pricing Models
[Breakdown value-based licensing, token tiers, API consumption monetization, bundled corporate agreements, and deployment cost vectors.]

## 5. Systemic Risks, Vulnerabilities & Regulatory Constraints
[Construct a clear analysis of failure modes, network data leakage hazards, compliance frameworks like the EU AI Act, and sovereign regional data constraints.]

## 6. Strategic Horizons & Ecosystem Vectors (2026–2029)
[Provide forward-looking technology roadmaps, adoption curves, agentic workflow orchestration trends, and career/societal impacts over the next 1-3 years.]

## 7. Strategic Recommendations & Actionable Insights
[Provide 5-7 highly explicit, non-obvious bullet-point directives tailored for enterprise CTOs, Procurement Leads, and Risk Officers.]

## 8. Verified Source Index
[Orderly numbered list matching the inline citation sequence exactly.]

════════════════════════════════════════════════════════════
CITATION RULES — NON-NEGOTIABLE
════════════════════════════════════════════════════════════
1. EVERY statistic, percentage, dollar value, benchmark, hardware specification, or definitive claim MUST be immediately followed by an inline markdown hyperlink format: [[N]](URL string).
2. Place the citation link DIRECTLY after the data component or value, never wait until the end of the sentence or block.
3. Example: "The infrastructure cluster leverages custom TPU v5p fabrics [[1]](https://url.com) dropping overall TCO values by 34% [[2]](https://url2.com)..."
4. Never fabricate an asset. If a URL string exists in the index, map to it exactly.`;

// ─────────────────────────────────────────────────────────────
// COMPRESS AND FACT LOGS FORMATTERS
// ─────────────────────────────────────────────────────────────
function formatFactsForLLM(facts = []) {
  if (facts.length === 0) return "No compressed facts available.";

  const byDimension = facts.reduce((acc, f) => {
    if (!acc[f.dimension]) acc[f.dimension] = [];
    acc[f.dimension].push(f);
    return acc;
  }, {});

  const sections = Object.entries(byDimension).map(([dimension, dimFacts]) => {
    const factsText = dimFacts
      .map((f) => `  • [Source #${f.sourceId}] [${f.confidence.toUpperCase()} confidence] ${f.fact}`)
      .join("\n");

    return `### ${dimension.toUpperCase().replace(/_/g, " ")}\n${factsText}`;
  });

  return sections.join("\n\n");
}

function formatCitationMap(sources = []) {
  if (sources.length === 0) return "No sources available.";
  return sources
    .map((s) => `[${s.id}] "${s.title || "Untitled Document"}" | Tier: ${s.sourceTier || "P3_Community"} | Dimension: ${s.dimension || "General"}\n    URL: ${s.url}`)
    .join("\n");
}

function generateFallbackReport(state) {
  const facts = state.facts || [];
  const sources = state.sources || [];

  return (
    `# Research Report Matrix (Fallback System Active)\n\n` +
    `> ⚠️ **System Alert:** Pro modeling orchestration failed or crossed pipeline context thresholds. Refined state metrics have been printed safely below.\n\n` +
    `## Distilled Facts Stream\n\n` +
    facts.map((f) => `- **[${f.dimension.toUpperCase()}]** ${f.fact} *(Source #${f.sourceId})*`).join("\n") +
    `\n\n## Verified References\n\n` +
    sources.map((s) => `[${s.id}] **${s.title || "Reference Asset"}** — Source Endpoint: ${s.url}`).join("\n")
  );
}

// ─────────────────────────────────────────────────────────────
// PARALLEL CASCADE INVOKER WITH TIMEOUT WRAPPERS
// ─────────────────────────────────────────────────────────────
async function invokeWithFallback(messages, isPro = true) {
  try {
    const model = isPro ? reportLLM : fallbackReportLLM;
    const modelName = isPro ? "gemini-2.5-pro" : "gemini-3.1-flash";
    console.log(`  [LLM Pipeline] Engaging synthesis core: ${modelName}...`);
    const response = await model.invoke(messages);
    return { content: response.content, modelUsed: modelName };
  } catch (err) {
    if (isPro) {
      console.warn(`  [LLM Control] Pro reasoning bottleneck or rate limit tripped: ${err.message}. Cascading to Flash...`);
      return invokeWithFallback(messages, false);
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN NODE INTERFACE
// ─────────────────────────────────────────────────────────────
export async function LLM(state) {
  const facts = state.facts || [];
  const sources = state.sources || [];
  const question = state.question || "Autonomous Target Objective Parameters";

  if (facts.length === 0 && !state.pageContent) {
    console.error("[LLMNode] ❌ Absolute data gap. No grounded content streams available.");
    return {
      answer: generateFallbackReport(state),
      reportMeta: { modelUsed: "fallback_template", factsUsed: 0, sourcesUsed: 0, success: false },
    };
  }

  const formattedFacts = formatFactsForLLM(facts);
  const citationMap = formatCitationMap(sources);

  const auditContext =
    state.auditConfidenceScore !== undefined
      ? `Data Ingestion Sufficiency Index: ${state.auditConfidenceScore}/100\n` +
        `Completed Optimization Loops: ${state.loopCount || 0}\n` +
        `Auditor Evaluation Log: ${state.auditFeedback || "Verified Data Pipeline Compliance."}`
      : "Automated framework verification details missing.";

  const dimensionCoverage = facts.reduce((acc, f) => {
    acc[f.dimension] = (acc[f.dimension] || 0) + 1;
    return acc;
  }, {});

  const humanMessageText =
    `════════════════════════════════════════════════════════════\n` +
    `ROOT RESEARCH OBJECTIVE\n` +
    `════════════════════════════════════════════════════════════\n` +
    `"${question}"\n\n` +

    `════════════════════════════════════════════════════════════\n` +
    `GRAPH EXECUTION QUALITY INDEX METADATA\n` +
    `════════════════════════════════════════════════════════════\n` +
    `${auditContext}\n` +
    `Dimension Coordinates Map: ${JSON.stringify(dimensionCoverage)}\n` +
    `Total Indexed Facts: ${facts.length} | Sourced Anchors: ${sources.length}\n\n` +

    `════════════════════════════════════════════════════════════\n` +
    `COMPRESSED STRATIFIED RESEARCH FACTS (PRIMARY KNOWLEDGE CORES)\n` +
    `════════════════════════════════════════════════════════════\n` +
    `${formattedFacts}\n\n` +

    `════════════════════════════════════════════════════════════\n` +
    `VERIFIED REGULATORY & INFRASTRUCTURE LINKS (SOURCE ANCHORS)\n` +
    `════════════════════════════════════════════════════════════\n` +
    `${citationMap}\n\n` +

    (facts.length < 10 && state.pageContent
      ? `════════════════════════════════════════════════════════════\n` +
        `RAW SUPPLEMENTAL PAYLOAD CONTEXT STREAMS\n` +
        `════════════════════════════════════════════════════════════\n` +
        `${state.pageContent.substring(0, 4000)}\n\n`
      : "") +

    `Compile the full, exhaustive enterprise research dossier now based strictly on these metrics. Ensure your text generation maximizes word length and detailed coverage of proprietary architectures. Every claim must have its inline clickable markdown link. Do not trim sections.`;

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(humanMessageText),
  ];

  console.log(`[LLMNode] Compiling exhaustive long-form grounding response...`);

  try {
    const { content, modelUsed } = await invokeWithFallback(messages);
    const wordCount = content.split(/\s+/).length;

    return {
      answer: content,
      reportMeta: {
        modelUsed,
        wordCount,
        factsUsed: facts.length,
        sourcesUsed: sources.length,
        success: true,
        researchLoops: state.loopCount || 0,
      },
    };
  } catch (err) {
    console.error(`[LLMNode] Fatal exception across both dynamic endpoints:`, err.message);
    return {
      answer: generateFallbackReport(state),
      reportMeta: { modelUsed: "fallback_template", factsUsed: facts.length, sourcesUsed: sources.length, success: false },
    };
  }
}