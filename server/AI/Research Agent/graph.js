// app/lib/docs-graph.js
import { StateGraph } from "@langchain/langgraph";
import { GraphState } from "./graph-state.js";
import { generateSubqueriesNode } from "./nodes/generate-subqueries-node.js"; 
import { searchNode } from "./nodes/search-sources.js";
import { extractGroundingContext } from "./nodes/extract-grounding-context-node.js"; // (extractGroundingContext)
import { curateSourcesNode } from "./nodes/curate-sources-node.js";
import { auditResearchGapsNode } from "./nodes/audit-research.js"; // Your absolute audit node
import { compressFactsNode } from "./nodes/compress-facts-node.js"; 
import { LLM } from "./nodes/LLM.js";

const graph = new StateGraph(GraphState)
  .addNode("generateSubQueries", generateSubqueriesNode)
  .addNode("searchSources", searchNode)
  .addNode("curateSources", curateSourcesNode)
  .addNode("extractGroundingContext", extractGroundingContext)
  .addNode("auditResearchGaps", auditResearchGapsNode) // Added absolute critic node
  .addNode("compressFacts", compressFactsNode)
  .addNode("LLM", LLM);

// ── FIXED STRUCTURAL PIPELINE SEQUENCE ──────────────────────────────
graph.addEdge("__start__", "generateSubQueries");
graph.addEdge("generateSubQueries", "searchSources");
graph.addEdge("searchSources", "curateSources");
graph.addEdge("curateSources", "extractGroundingContext");

// Extract hone ke baad seedha pehle Facts compress honge taaki Auditor facts check kare
graph.addEdge("extractGroundingContext", "compressFacts");
graph.addEdge("compressFacts", "auditResearchGaps");

// ── 🔥 FIXED THE CONDITIONAL ROUTING CRASH HERE ──────────────────────
graph.addConditionalEdges(
  "auditResearchGaps",
  (state) => state.nextStep, // It returns either "loop_search" or "finalize"
  {
    loop_search: "searchSources", // Maps "loop_search" string to "searchSources" node
    finalize: "LLM",              // Maps "finalize" string to "LLM" node
  }
);

graph.addEdge("LLM", "__end__");

export const researchGraph = graph.compile();