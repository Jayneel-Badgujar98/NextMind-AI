// app/lib/nodes/extract-grounding-context-node.js
import * as cheerio from "cheerio";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const MAX_CHARS_PER_DOC = 12000;
const JINA_CONCURRENCY_LIMIT = 2;
const MIN_CONTENT_LENGTH = 150;
const JINA_API_KEY = process.env.JINA_API_KEY || null;

// ─────────────────────────────────────────────────────────────
// BLOCKED DOMAINS
// Sites that consistently return 403/bot blocks
// Jina bhi bypass nahi kar sakta — skip at fetch time
// Tavily already gave us their snippets — that's enough
// ─────────────────────────────────────────────────────────────
const BLOCKED_DOMAINS = [
  "gartner.com",
  "mckinsey.com",
  "goldmansachs.com",
  "hbr.org",
  "ft.com",
  "bloomberg.com",
  "wsj.com",
  "reuters.com/plus",
];

function isDomainBlocked(url = "") {
  const lower = url.toLowerCase();
  return BLOCKED_DOMAINS.some((domain) => lower.includes(domain));
}

// ─────────────────────────────────────────────────────────────
// 403 / ACCESS DENIED DETECTOR
// Jina returns 200 even for blocked pages — content check needed
// ─────────────────────────────────────────────────────────────
const ACCESS_DENIED_SIGNALS = [
  "access denied",
  "403 forbidden",
  "you don't have permission",
  "blocked by",
  "enable javascript",
  "please enable cookies",
  "cloudflare",
  "captcha",
  "robot or human",
  "verify you are human",
  "ddos protection",
  "just a moment",        // Cloudflare waiting page
  "error 403",
  "error 401",
  "login to continue",
  "subscribe to read",
  "sign in to access",
  "paywall",
];

function isBlockedContent(text = "") {
  const lower = text.toLowerCase().substring(0, 1000); // Check first 1000 chars only
  const signalCount = ACCESS_DENIED_SIGNALS.filter((s) => lower.includes(s)).length;
  // 1 signal = might be coincidence, 2+ = definitely blocked
  return signalCount >= 2;
}

// ─────────────────────────────────────────────────────────────
// JINA FETCHER — Primary
// ─────────────────────────────────────────────────────────────
async function fetchViaJina(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

    const headers = {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
      "X-Timeout": "10",
      // Remove bot-detection signals from Jina's request
      "X-No-Cache": "true",
    };

    if (JINA_API_KEY) {
      headers["Authorization"] = `Bearer ${JINA_API_KEY}`;
    }

    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Jina HTTP ${response.status}`);
    }

    const text = await response.text();

    // ✅ Check if Jina returned blocked/403 content disguised as 200
    if (isBlockedContent(text)) {
      throw new Error(`Jina returned blocked content (403/paywall detected)`);
    }

    return { content: text, method: "Jina Reader (Markdown)" };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────────
// CHEERIO FETCHER — Fallback
// ─────────────────────────────────────────────────────────────
async function fetchViaCheerio(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        // Referrer makes it look like organic traffic
        Referer: "https://www.google.com/",
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    // ✅ Check HTML itself for blocked content before parsing
    if (isBlockedContent(html)) {
      throw new Error("Cheerio received blocked/paywall HTML");
    }

    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, iframe, noscript, svg, " +
      "aside, .sidebar, .ads, .advertisement, .comments, .modal, " +
      ".cookie-banner, .newsletter, .popup, .social-share, " +
      "[aria-hidden='true'], .hidden").remove();

    const chunks = [];

    $("article, main, [role='main']").each((_, el) => {
      $(el).find("h1, h2, h3, h4, p, li, table, blockquote, pre, code")
        .each((_, child) => {
          const tag = child.tagName?.toLowerCase() || "";
          const text = $(child).text().replace(/\s+/g, " ").trim();
          if (text.length < 20) return;

          if (tag.match(/^h[1-4]$/)) {
            chunks.push(`\n${"#".repeat(parseInt(tag[1]))} ${text}\n`);
          } else if (tag === "li") {
            chunks.push(`- ${text}`);
          } else if (tag === "pre" || tag === "code") {
            chunks.push(`\`\`\`\n${text}\n\`\`\``);
          } else {
            chunks.push(text);
          }
        });
    });

    // Fallback to body if no semantic elements found
    if (chunks.length === 0) {
      $("p, h1, h2, h3").each((_, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.length > 30) chunks.push(text);
      });
    }

    if (chunks.length === 0) throw new Error("No content extracted by Cheerio");

    return { content: chunks.join("\n"), method: "Cheerio DOM Extractor (Fallback)" };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────────
// SINGLE URL PROCESSOR
// ─────────────────────────────────────────────────────────────
async function processUrl(result) {
  const url = result.url;
  const isPDF = result.isPDF || url.toLowerCase().endsWith(".pdf");

  // ✅ Skip known bot-protected domains entirely
  // Their Tavily snippets already gave us their key content
  if (isDomainBlocked(url)) {
    console.log(`  [DOMAIN SKIP] Bot-protected domain — using Tavily snippet only: "${url.slice(0, 50)}"`);

    // Use the Tavily snippet as content instead of scraping
    const snippetContent = result.content || result.snippet || "";
    if (snippetContent.length >= MIN_CONTENT_LENGTH) {
      return {
        content:
          `\n${"=".repeat(60)}\n` +
          `SOURCE METADATA\n` +
          `  Title     : ${result.title || "Untitled"}\n` +
          `  URL       : ${url}\n` +
          `  Tier      : ${result.sourceTier === "P1_Official" ? "Official Documentation / Academic / Government" : "Premium Research / Financial / Tech News"}\n` +
          `  Dimension : ${result.metaDimension || "General"}\n` +
          `  Score     : ${result.sourceScore || result.score || "N/A"}\n` +
          `  Extracted : Tavily Search Snippet (Bot-Protected Domain)\n` +
          `  Type      : Web Page (Snippet Only)\n` +
          `${"=".repeat(60)}\n\n` +
          `${snippetContent.substring(0, MAX_CHARS_PER_DOC)}\n` +
          `${"─".repeat(60)}\n`,
        sourceMeta: {
          id: null,
          title: result.title || "Untitled",
          url,
          sourceTier: result.sourceTier || "P2_Research",
          dimension: result.metaDimension || "General",
          score: result.sourceScore || result.score || 0,
          isPDF: false,
          extractedVia: "Tavily Snippet",
          charCount: snippetContent.length,
        },
      };
    }

    console.warn(`  [SNIPPET TOO SHORT] Snippet < ${MIN_CONTENT_LENGTH} chars for: "${url.slice(0, 50)}"`);
    return null;
  }

  let extracted = null;

  // PRIMARY: Jina
  try {
    extracted = await fetchViaJina(url);
  } catch (jinaErr) {
    console.warn(
      `  [Jina FAIL] "${url.slice(0, 50)}" — ${jinaErr.message}` +
      (isPDF ? " (PDF — no Cheerio fallback)" : " — trying Cheerio...")
    );

    if (isPDF) {
      console.error(`  [PDF SKIP] Jina failed on PDF: ${url}`);
      return null;
    }

    // FALLBACK: Cheerio
    try {
      extracted = await fetchViaCheerio(url);
    } catch (cheerioErr) {
      console.error(
        `  [BOTH FAIL] "${url.slice(0, 50)}" — Jina: ${jinaErr.message} | Cheerio: ${cheerioErr.message}`
      );
      return null;
    }
  }

  const cleanContent = extracted.content.trim();

  // ✅ Final content quality gate — catches any remaining blocked content
  if (cleanContent.length < MIN_CONTENT_LENGTH) {
    console.warn(`  [THIN CONTENT] Dropped "${url.slice(0, 50)}" — only ${cleanContent.length} chars`);
    return null;
  }

  if (isBlockedContent(cleanContent)) {
    console.warn(`  [BLOCKED CONTENT] Dropped "${url.slice(0, 50)}" — access denied / paywall detected`);
    return null;
  }

  const tierLabel =
    result.sourceTier === "P1_Official"
      ? "Official Documentation / Academic / Government"
      : result.sourceTier === "P2_Research"
        ? "Premium Research / Financial / Tech News"
        : "Community / Open Source / General Web";

  return {
    content:
      `\n${"=".repeat(60)}\n` +
      `SOURCE METADATA\n` +
      `  Title     : ${result.title || "Untitled"}\n` +
      `  URL       : ${url}\n` +
      `  Tier      : ${tierLabel}\n` +
      `  Dimension : ${result.metaDimension || "General"}\n` +
      `  Score     : ${result.sourceScore || result.score || "N/A"}\n` +
      `  Extracted : ${extracted.method}\n` +
      `  Type      : ${isPDF ? "PDF Document" : "Web Page"}\n` +
      `${"=".repeat(60)}\n\n` +
      `${cleanContent.substring(0, MAX_CHARS_PER_DOC)}\n` +
      `${"─".repeat(60)}\n`,

    sourceMeta: {
      id: null,
      title: result.title || "Untitled",
      url,
      sourceTier: result.sourceTier || "P3_Community",
      dimension: result.metaDimension || "General",
      score: result.sourceScore || result.score || 0,
      isPDF,
      extractedVia: extracted.method,
      charCount: cleanContent.length,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// BATCH PROCESSOR
// ─────────────────────────────────────────────────────────────
async function processBatch(targets, batchSize) {
  const results = [];

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(targets.length / batchSize);

    console.log(`  [Batch ${batchNum}/${totalBatches}] Processing ${batch.length} URLs...`);

    const batchResults = await Promise.all(batch.map((target) => processUrl(target)));
    results.push(...batchResults);

    if (i + batchSize < targets.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────
// MAIN NODE EXPORT
// ─────────────────────────────────────────────────────────────
export async function extractGroundingContext(state) {

  const alreadyExtracted = state.sources || []; // pichle loop ke results
  const extractedUrls = new Set(alreadyExtracted.map(s => s.url));

  const targets = (state.httpUrls?.length ? state.httpUrls : state.urlsToScrape || [])
    .filter(t => !extractedUrls.has(t.url)); // sirf naye URLs scrape karo


  if (targets.length === 0) {
    console.warn("[ExtractGroundingContext] ⚠️ No targets — pipeline has no grounding data.");
    return {
      pageContent: "",
      sources: [],
      fetchStats: { attempted: 0, succeeded: 0, failed: 0 },
    };
  }

  console.log(
    `\n[ExtractGroundingContext] Starting extraction for ${targets.length} URLs` +
    ` | Concurrency: ${JINA_CONCURRENCY_LIMIT}` +
    ` | Jina: ${JINA_API_KEY ? "✅ key set" : "⚠️ no key (20 RPM)"}`
  );

  const rawResults = await processBatch(targets, JINA_CONCURRENCY_LIMIT);
  const successful = rawResults.filter(Boolean);

  if (successful.length === 0) {
    console.error("[ExtractGroundingContext] ❌ All extractions failed.");
    return {
      pageContent: "",
      sources: [],
      fetchStats: { attempted: targets.length, succeeded: 0, failed: targets.length },
    };
  }

  const pageContent = successful.map((item) => item.content).join("\n");
  const sources = successful.map((item, index) => ({ ...item.sourceMeta, id: index + 1 }));

  const fetchStats = {
    attempted: targets.length,
    succeeded: successful.length,
    failed: targets.length - successful.length,
    totalChars: pageContent.length,
    avgCharsPerDoc: Math.round(pageContent.length / successful.length),
  };

  console.log(
    `\n[ExtractGroundingContext] ✅ Complete` +
    `\n  Attempted  : ${fetchStats.attempted}` +
    `\n  Succeeded  : ${fetchStats.succeeded}` +
    `\n  Failed     : ${fetchStats.failed}` +
    `\n  Total chars: ${fetchStats.totalChars.toLocaleString()}` +
    `\n  Avg/doc    : ${fetchStats.avgCharsPerDoc.toLocaleString()} chars`
  );

  return { pageContent, sources, fetchStats };
}