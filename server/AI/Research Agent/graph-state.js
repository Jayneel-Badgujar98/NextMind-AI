// app/lib/graph-state.js
import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  // Input
  question: Annotation({ reducer: (a, b) => b ?? a, default: () => "" }),

  // Subquery node outputs
  subQueries: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  queryMeta: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  dimensions: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  intentAnalysis: Annotation({ reducer: (a, b) => b ?? a, default: () => "" }),
  broadQueries: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  factualQueries: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),

  // Search node outputs
  searchResults: Annotation({ reducer: (a, b) => b ?? a, default: () => ({ results: [] }) }),
  broadResults: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  factualResults: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),

  // Curate node outputs
  urlsToScrape: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  httpUrls: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  pdfUrls: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  averageSourceScore: Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  qualityFlag: Annotation({ reducer: (a, b) => b ?? a, default: () => "OK" }),

  // 🔥 ACCUMULATION FIX: Append new text context to old text instead of overwriting
  pageContent: Annotation({ 
    reducer: (a, b) => {
      if (!b) return a;
      if (!a) return b;
      return `${a}\n\n${b}`;
    }, 
    default: () => "" 
  }),

  // 🔥 ACCUMULATION FIX: Safely merge sources lists dynamically
  sources: Annotation({ 
    reducer: (a, b) => {
      if (!b || b.length === 0) return a;
      if (!a || a.length === 0) return b;
      const seenUrls = new Set(a.map(s => s.url));
      const uniqueNew = b.filter(s => !seenUrls.has(s.url));
      return [...a, ...uniqueNew];
    }, 
    default: () => [] 
  }),
  fetchStats: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),

  // 🔥 ACCUMULATION FIX: Keep appending fresh facts found in previous loops
  facts: Annotation({ 
    reducer: (a, b) => {
      if (!b || b.length === 0) return a;
      if (!a || a.length === 0) return b;
      const seenFacts = new Set(a.map(f => f.fact.toLowerCase().trim().substring(0, 50)));
      const uniqueNewFacts = b.filter(f => !seenFacts.has(f.fact.toLowerCase().trim().substring(0, 50)));
      return [...a, ...uniqueNewFacts];
    }, 
    default: () => [] 
  }),
  factsQualityFlag: Annotation({ reducer: (a, b) => b ?? a, default: () => "OK" }),

  // Audit + routing
  nextStep: Annotation({ reducer: (a, b) => b ?? a, default: () => "" }),
  nextQuery: Annotation({ reducer: (a, b) => b ?? a, default: () => "" }),
  auditFeedback: Annotation({ reducer: (a, b) => b ?? a, default: () => "" }),
  auditConfidenceScore: Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),

  // loopCount accumulates
  loopCount: Annotation({ reducer: (a, b) => (b ?? 0), default: () => 0 }),

  // Final output
  answer: Annotation({ reducer: (a, b) => b ?? a, default: () => "" }),
  reportMeta: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
});