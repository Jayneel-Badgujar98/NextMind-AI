// app/lib/nodes/compress-facts-node.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

// Using the standard platform optimized flash-lite engine for structural bulk extraction
const extractionLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite", // Kept updated with optimal inference engines
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.1,
});

const factsSchema = z.object({
  extractedFacts: z
    .array(
      z.object({
        dimension: z
          .enum([
            "background", "market", "technology", "business_model",
            "competition", "financials", "risks", "regulation",
            "future_outlook", "career_impact", "social_impact", "historical_context"
          ])
          .describe("Research dimension this fact belongs to."),
        fact: z
          .string()
          .describe(
            "Single high-density fact. Must contain at least one of: metric, date, percentage, dollar value, or named entity. No filler text."
          ),
        sourceId: z
          // 🔥 FIX: was `.int().positive()`. Zod compiles `.positive()` to JSON Schema
          // `exclusiveMinimum: 0`, which is NOT part of the OpenAPI-3.0 subset Gemini's
          // response_schema accepts. That caused a 400 "Unknown name exclusiveMinimum"
          // on EVERY structured-output call, for EVERY chunk, every single run —
          // which is why facts were always [] / NO_FACTS no matter what. `.min(1)`
          // compiles to plain `minimum: 1` (inclusive), which Gemini does support,
          // and is functionally equivalent here since sourceId is a 1-based index.
          .number()
          .int()
          .min(1)
          .describe(
            "The exact absolute ID integer mapping directly to the Document Asset Profile header index. No guesswork."
          ),
        confidence: z
          .enum(["high", "medium", "low"])
          .describe(
            "high = direct statistics with metrics. medium = paraphrased reference data. low = structural prediction or vague timeline."
          ),
      })
    )
    .describe("Array of compressed, structured research facts."),
});

const structuredExtractor = extractionLLM.withStructuredOutput(factsSchema, {
  name: "compress_facts_extractor",
});

const CHUNK_SIZE_CHARS = 28000;

const SYSTEM_PROMPT = `You are an Expert Research Data Compression Agent.
Your sole responsibility is to ingest raw structured markdown context profiles and filter out noise, corporate narratives, cookie wrappers, UI buttons, and general promotional filler.

Compile a comprehensive fact database following these hard rules:
1. Every entry MUST contain objective data points: explicit metrics, benchmarks, dollar values, historical tracking timestamps, or key industrial regulations.
2. Maintain absolute data integrity. Bind the exact 'sourceId' number extracted from the source document profile metadata header context. Never hallucinate an ID.
3. Map every fact precisely to one of the predefined research dimensions.
4. Keep structural granularity high: write individual standalone entries, do not pool distinct parameters together into a single long string block.`;

// 🔥 FIX: the previous version tried to guess which separator was used
// (`"DOCUMENT ASSET METADATA PROFILE:"` vs a hardcoded 41-char "=" string)
// but extract-grounding-context-node.js actually emits a block of
// `"=".repeat(60)` followed by "SOURCE METADATA". The old check for
// "DOCUMENT ASSET METADATA PROFILE:" never matched anything (dead code),
// and the fallback 41-char string only "worked" because it happened to be
// a substring of the real 60-char separator — fragile, and it left stray
// "=" characters glued onto the next chunk. A regex on a run of "=" chars
// is robust to that formatting changing in either file.
function splitIntoChunks(pageContent, chunkSizeChars) {
  const SEPARATOR_REGEX = /={10,}/;

  const docs = pageContent.split(SEPARATOR_REGEX).filter((d) => d.trim().length > 100);

  const chunks = [];
  let currentChunk = "";

  for (const doc of docs) {
    const docWithSeparator = "\n" + "=".repeat(60) + "\n" + doc;

    if (currentChunk.length + docWithSeparator.length > chunkSizeChars) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
    }
    currentChunk += docWithSeparator;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [pageContent.substring(0, chunkSizeChars)];
}

export async function compressFactsNode(state) {
  const rawContext = state.pageContent || "";

  if (!rawContext || rawContext.trim().length < 200) {
    console.warn("[CompressFactsNode] ⚠️ Ingested state payload context is too small or missing. Bypassing compression filter.");
    return {
      facts: [],
      factsQualityFlag: "NO_CONTENT",
    };
  }

  console.log(`\n[CompressFactsNode] Deploying structural fact distillation filter on ${rawContext.length.toLocaleString()} characters...`);

  const chunks = splitIntoChunks(rawContext, CHUNK_SIZE_CHARS);
  console.log(`  [Data Map] Segmented ingestion into ${chunks.length} processing frames.`);

  const allFacts = [];

  // Sequential generation pass loop to preserve structured token rates safely
  for (let i = 0; i < chunks.length; i++) {
    try {
      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(
          `Deconstruct and index the following target context pool into the requested JSON matrix shape:\n\n${chunks[i]}`
        ),
      ];

      const result = await structuredExtractor.invoke(messages);
      const chunkFacts = result?.extractedFacts || [];

      allFacts.push(...chunkFacts);
    } catch (err) {
      console.error(`  ❌ [Extraction Block Exception] Critical failure on chunk segment index [${i}]:`, err.message);
    }
  }

  // Cross-frame exact duplication string parsing pass
  const seen = new Set();
  const dedupedFacts = allFacts.filter((f) => {
    const cleanKey = f.fact.toLowerCase().replace(/\s+/g, " ").trim().substring(0, 90);
    if (seen.has(cleanKey)) return false;
    seen.add(cleanKey);
    return true;
  });

  // System Quality Metrics Assessment Check
  const highConfidenceCount = dedupedFacts.filter((f) => f.confidence === "high").length;
  const totalFactsCount = dedupedFacts.length;

  let factsQualityFlag = "OK";
  if (totalFactsCount === 0) factsQualityFlag = "NO_FACTS";
  else if (totalFactsCount < 5) factsQualityFlag = "LOW_FACTS";
  else if (highConfidenceCount / totalFactsCount < 0.25) factsQualityFlag = "LOW_CONFIDENCE";

  const byDimension = dedupedFacts.reduce((acc, f) => {
    acc[f.dimension] = (acc[f.dimension] || 0) + 1;
    return acc;
  }, {});

  console.log(
    `\n[CompressFactsNode] ✅ Fact Indexing Synthesis Complete!` +
    ` \n  Sourced Fact Base Size : ${totalFactsCount} high-density insights` +
    ` \n  Verified Clean Nodes  : ${highConfidenceCount} priority items` +
    ` \n  System Quality Vector  : ${factsQualityFlag}` +
    ` \n  Categorized Dimensions : ${JSON.stringify(byDimension)}`
  );

  return {
    // This perfectly seeds into state.facts for the Final Report Compiler LLM block! ✅
    facts: dedupedFacts,
    factsQualityFlag,
  };
}