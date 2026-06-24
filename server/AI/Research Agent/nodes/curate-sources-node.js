// app/lib/nodes/curate-sources-node.js

const BLACKLISTED_PATTERNS = [
  "/login", "/signin", "/signup", "/register", "/subscribe",
  "/cart", "/checkout", "search?", "tags/", "category/",
  "/404", "/error", "javascript:void",
];

const MIN_SNIPPET_LENGTH = 80;

const SCRAPE_BUDGET = {
  broad_comprehensive: 5,
  factual_short: 2,
  default: 3,
};

const QUALITY_THRESHOLD = 28; // P3-heavy results ko bhi fair chance do; 
const MIN_SCRAPE_GUARANTEE = 3;

export async function curateSourcesNode(state) {
  const incomingResults = state.searchResults?.results || [];

  if (incomingResults.length === 0) {
    console.warn("[CurateSourcesNode] ⚠️ No results from search node.");
    return {
      searchResults: { results: [] },
      urlsToScrape: [],
      pdfUrls: [],
      httpUrls: [],
      averageSourceScore: 0,
      qualityFlag: "NO_RESULTS",
    };
  }

  const filtered = incomingResults.filter((result) => {
    if (!result?.url) return false;
    const lowerUrl = result.url.toLowerCase();
    const snippet = result.content || "";

    if (BLACKLISTED_PATTERNS.some((p) => lowerUrl.includes(p))) return false;
    if (snippet.length < MIN_SNIPPET_LENGTH) return false;

    return true;
  });

  const sourcePool =
    filtered.length >= MIN_SCRAPE_GUARANTEE
      ? filtered
      : incomingResults
        .filter((r) => r?.url)
        .slice(0, MIN_SCRAPE_GUARANTEE);

  // ── SCORING PASS (TRUE 0-100 SCALE) ───────────────────────
  const scoredResults = sourcePool.map((result) => {
    const snippet = (result.content || "").toLowerCase();
    const url = result.url || "";

    // Step 1: Normalize Authority Scale to 0-100 base
    const rawTierScore = result.score || 5;
    let normalizedAuthority = 30; // P3 default
    if (rawTierScore === 25 || result.sourceTier === "P1_Official") normalizedAuthority = 100;
    else if (rawTierScore === 15 || result.sourceTier === "P2_Research") normalizedAuthority = 70;

    // Step 2: Freshness Score (0-10)
    const pubDate = result.published_date || "";
    let freshnessScore = 4;
    if (pubDate.includes("2026")) freshnessScore = 10;
    else if (pubDate.includes("2025")) freshnessScore = 8;
    else if (pubDate.includes("2024")) freshnessScore = 6;

    // Step 3: Content Density Bonus
    const hasMetrics = /\b\d+(%|\s?bn|\s?mn|\s?billion|\s?million|usd|inr|\s?trillion)\b/.test(snippet);
    const hasResearchSignals = /(study|research|report|whitepaper|findings|published|according to)/i.test(snippet);
    const rawContentBonus = (hasMetrics ? 3 : 0) + (hasResearchSignals ? 2 : 0);
    const normalizedContent = rawContentBonus * 20; // Max 100

    // Weighted Formula: Authority (60%) + Freshness (20%) + Content (20%)
    const finalScore = Number(
      Math.min(
        (normalizedAuthority * 0.40) + (freshnessScore * 1.5) + (normalizedContent * 0.45),
        100
      ).toFixed(1)
    );

    const isPDF = url.toLowerCase().endsWith(".pdf") || snippet.includes("[pdf]");

    return {
      ...result,
      domainScore: normalizedAuthority,
      freshnessScore,
      contentBonus: normalizedContent,
      sourceScore: finalScore,
      isPDF,
      sourceTier: result.sourceTier || "P3_Community",
    };
  });

  scoredResults.sort((a, b) => b.sourceScore - a.sourceScore);

  const broadPool = scoredResults.filter((r) => r.queryType === "broad_comprehensive");
  const factualPool = scoredResults.filter((r) => r.queryType === "factual_short");
  const otherPool = scoredResults.filter(
    (r) => r.queryType !== "broad_comprehensive" && r.queryType !== "factual_short"
  );

  const budgetSelected = [
    ...broadPool.slice(0, SCRAPE_BUDGET.broad_comprehensive),
    ...factualPool.slice(0, SCRAPE_BUDGET.factual_short),
    ...otherPool.slice(0, SCRAPE_BUDGET.default),
  ];

  const seenUrls = new Set();
  const dedupedSelection = budgetSelected.filter((r) => {
    if (seenUrls.has(r.url)) return false;
    seenUrls.add(r.url);
    return true;
  });

  if (dedupedSelection.length < MIN_SCRAPE_GUARANTEE) {
    for (const result of scoredResults) {
      if (dedupedSelection.length >= MIN_SCRAPE_GUARANTEE) break;
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        dedupedSelection.push(result);
      }
    }
  }

  const pdfUrls = dedupedSelection.filter((r) => r.isPDF);
  const httpUrls = dedupedSelection.filter((r) => !r.isPDF);

  // Calculate average source score ONLY from final curated selection
  const averageSourceScore =
    dedupedSelection.length > 0
      ? Number(
        (dedupedSelection.reduce((sum, r) => sum + r.sourceScore, 0) / dedupedSelection.length).toFixed(2)
      )
      : 0;

  let qualityFlag = "OK";
  if (averageSourceScore < QUALITY_THRESHOLD) qualityFlag = "LOW_QUALITY";

  console.log(
    `\n[CurateSourcesNode] ✅ Curation Matrix Active` +
    `\n  Approved scrape: ${dedupedSelection.length} (${pdfUrls.length} PDF | ${httpUrls.length} HTTP)` +
    `\n  Curated Avg Score: ${averageSourceScore}/100 — Quality: ${qualityFlag}`
  );

  return {
    searchResults: { results: scoredResults },
    urlsToScrape: dedupedSelection,
    pdfUrls,
    httpUrls,
    averageSourceScore,
    qualityFlag,
  };
}