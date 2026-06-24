// app/lib/nodes/search-sources.js
import { TavilySearch } from "@langchain/tavily";

// ✅ Auto-picks TAVILY_API_KEY from env — no explicit param needed
const tavilyEngine = new TavilySearch({});

// ─────────────────────────────────────────────
// DOMAIN TIERS — Priority scoring config
// ─────────────────────────────────────────────
const DOMAIN_TIERS = {
  P1: {
    domains: [
      "arxiv.org", "ieee.org", "sec.gov", "w3.org", "rfc-editor.org",
      "developer.mozilla.org", "docs.microsoft.com", "developer.apple.com",
      "nextjs.org", "react.dev", "v8.dev", "nodejs.org",
    ],
    score: 25,
    label: "P1_Official",
  },
  P2: {
    domains: [
      "mckinsey.com", "gartner.com", "bloomberg.com", "reuters.com",
      "hbr.org", "goldmansachs.com", "forbes.com", "techcrunch.com",
      "ft.com", "cnbc.com", "wired.com", "mit.edu", "stanford.edu",
    ],
    score: 15,
    label: "P2_Research",
  },
};

const ALL_TRUSTED_DOMAINS = [
  ...DOMAIN_TIERS.P1.domains,
  ...DOMAIN_TIERS.P2.domains,
];

// ─────────────────────────────────────────────
// DOMAIN META SCORER
// Pattern-based (.gov/.edu) + exact domain list match
// ─────────────────────────────────────────────
function getDomainMeta(url = "") {
  const lower = url.toLowerCase();

  // Pattern match first — .gov and .edu can't be in includeDomains as patterns
  if (lower.includes(".gov") || lower.includes(".edu")) {
    return { score: 25, label: "P1_Official" };
  }

  for (const [, tier] of Object.entries(DOMAIN_TIERS)) {
    if (tier.domains.some((d) => lower.includes(d))) {
      return { score: tier.score, label: tier.label };
    }
  }

  return { score: 5, label: "P3_Community" };
}

// ─────────────────────────────────────────────
// CORE SEARCH ENGINE
// Strategy: Fire trusted + open web IN PARALLEL for speed
// But process trusted FIRST for quality — open web only fills remaining gap
// ─────────────────────────────────────────────
async function optimizedTargetedSearch(queryObj) {
  const { query, type } = queryObj;
  const isBroad = type === "broad_comprehensive";

  // Broad queries need more depth, factual need quick hits
  const targetCount = isBroad ? 5 : 3;

  // ── PARALLEL FIRE ─────────────────────────
  // Both calls go out simultaneously — zero sequential wait
  // trusted call = high quality, open call = coverage safety net
  const [trustedRaw, openRaw] = await Promise.all([
    tavilyEngine
      .invoke({
        query,
        searchDepth: isBroad ? "advanced" : "basic",
        includeDomains: ALL_TRUSTED_DOMAINS, // Restricts to P1+P2 domains only
      })
      .catch((err) => {
        console.warn(`  [Trusted Pass] Failed: "${query.slice(0, 40)}"`, err.message);
        return null;
      }),

    tavilyEngine
      .invoke({
        query,
        searchDepth: "basic", // Kept basic — speed priority for open web
      })
      .catch((err) => {
        console.warn(`  [Open Pass] Failed: "${query.slice(0, 40)}"`, err.message);
        return null;
      }),
  ]);

  // ── PARSE BOTH RESPONSES ──────────────────
  const trustedItems =
    (trustedRaw
      ? typeof trustedRaw === "string"
        ? JSON.parse(trustedRaw)
        : trustedRaw
      : {}
    )?.results || [];

  const openItems =
    (openRaw
      ? typeof openRaw === "string"
        ? JSON.parse(openRaw)
        : openRaw
      : {}
    )?.results || [];

  // ── PRIORITY PROCESSING ───────────────────
  // Trusted results go in FIRST — these are always P1/P2 quality
  // Open web results fill REMAINING SLOTS ONLY — no quality dilution
  const seenUrls = new Set();
  const trustedResults = [];
  const gapFillResults = [];

  // PASS 1 — Trusted bubble (P1 + P2 sources)
  for (const item of trustedItems) {
    if (!item?.url) continue;
    const cleanUrl = item.url.split("#")[0].trim();
    if (seenUrls.has(cleanUrl)) continue;

    seenUrls.add(cleanUrl);
    trustedResults.push({
      ...item,
      url: cleanUrl,
      ...getDomainMeta(cleanUrl), // score + label attached
    });
  }

  // PASS 2 — Open web gap fill (only if trusted didn't hit target)
  const slotsRemaining = targetCount - trustedResults.length;

  if (slotsRemaining > 0) {
    for (const item of openItems) {
      if (!item?.url) continue;
      const cleanUrl = item.url.split("#")[0].trim();
      if (seenUrls.has(cleanUrl)) continue; // Cross-dedup with trusted results

      seenUrls.add(cleanUrl);
      gapFillResults.push({
        ...item,
        url: cleanUrl,
        ...getDomainMeta(cleanUrl),
      });

      if (gapFillResults.length >= slotsRemaining) break; // Stop once gap is filled
    }
  }

  const finalResults = [...trustedResults, ...gapFillResults];

  console.log(
    `  ✓ "${query.slice(0, 40)}..." → ` +
    `${trustedResults.length} trusted | ${gapFillResults.length} gap fill | ${finalResults.length} total`
  );

  return finalResults;
}

// ─────────────────────────────────────────────
// MAIN NODE EXPORT
// Compatible with: state.queryMeta (from subquery node)
//                  state.subQueries (flat array fallback)
//                  state.nextQuery  (single override)
//                  state.question   (last resort)
// ─────────────────────────────────────────────
export async function searchNode(state) {
  // ── QUERY RESOLUTION ──────────────────────
  // Priority: nextQuery > queryMeta > subQueries > question
  let queriesToRun = [];

  if (state.nextQuery) {
    // Single query override — used by loop/retry nodes
    queriesToRun = [{
      query: state.nextQuery,
      type: "broad_comprehensive",
      dimension: "Override",
      rationale: "Direct single query override via nextQuery",
    }];

  } else if (state.queryMeta?.length > 0) {
    // ✅ Full metadata from generateSubqueriesNode — best case
    // Contains: query, type, dimension, rationale per entry
    queriesToRun = state.queryMeta;

  } else if (state.subQueries?.length > 0) {
    // Flat string array fallback — wrap into queryMeta shape
    queriesToRun = state.subQueries.map((q) => ({
      query: q,
      type: "broad_comprehensive",
      dimension: "General",
      rationale: "Flat subQueries array fallback",
    }));

  } else {
    // Last resort — raw question
    queriesToRun = [{
      query: state.question,
      type: "broad_comprehensive",
      dimension: "Root Question",
      rationale: "No subqueries generated — using root question",
    }];
  }

  console.log(`\n[search sources ] Launching ${queriesToRun.length} parallel search pipelines...`);

  // ── ALL QUERIES FIRE IN PARALLEL ──────────
  // Each pipeline internally runs trusted+open concurrently
  // So total concurrency = queriesToRun.length × 2 Tavily calls simultaneously
  const searchPromises = queriesToRun.map(async (queryObj) => {
    try {
      const results = await optimizedTargetedSearch(queryObj);

      // Attach query-level metadata to every result for report compiler
      return results.map((item) => ({
        ...item,
        metaDimension: queryObj.dimension || "General",
        metaRationale: queryObj.rationale || "",
        queryType: queryObj.type || "broad_comprehensive",
        sourceQuery: queryObj.query,
      }));
    } catch (err) {
      console.error(`[search Sources ] Pipeline crashed: "${queryObj.query}"`, err);
      return [];
    }
  });

  const allResultsArrays = await Promise.all(searchPromises);
  const combinedResults = allResultsArrays.flat();

  // ── GLOBAL CROSS-QUERY DEDUPLICATION ──────
  // Same URL from 2 different query pipelines — keep only first occurrence
  // First occurrence = already highest authority (trusted results come first)
  const finalUnique = [];
  const globalSeen = new Set();

  for (const item of combinedResults) {
    const cleanUrl = item.url?.split("#")[0].trim();
    if (!cleanUrl || globalSeen.has(cleanUrl)) continue;
    globalSeen.add(cleanUrl);
    finalUnique.push(item);
  }

  // ── AUTHORITY SORT ─────────────────────────
  // P1 (25) → P2 (15) → P3 (5) — report compiler gets best sources first
  const sortedResults = finalUnique.sort((a, b) => b.score - a.score);

  // ── SPLIT FOR DOWNSTREAM NODES ─────────────
  const broadResults = sortedResults.filter((r) => r.queryType === "broad_comprehensive");
  const factualResults = sortedResults.filter((r) => r.queryType === "factual_short");

  // ── FINAL STATS LOG ────────────────────────
  const p1Count = sortedResults.filter((r) => r.label === "P1_Official").length;
  const p2Count = sortedResults.filter((r) => r.label === "P2_Research").length;
  const p3Count = sortedResults.filter((r) => r.label === "P3_Community").length;

  console.log(
    `\n[SearchNode] ✅ Complete!` +
    `\n  Total unique sources : ${sortedResults.length}` +
    `\n  P1 Official          : ${p1Count}` +
    `\n  P2 Research          : ${p2Count}` +
    `\n  P3 Community         : ${p3Count}` +
    `\n  Broad results        : ${broadResults.length}` +
    `\n  Factual results      : ${factualResults.length}`
  );

  return {
    searchResults: { results: sortedResults },
    broadResults,   // → report compiler: deep analysis context
    factualResults, // → report compiler: quick stats & verification
  };
}