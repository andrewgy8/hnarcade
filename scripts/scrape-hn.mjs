#!/usr/bin/env node

/**
 * Scrapes Hacker News for "Show HN" game posts and creates GitHub Issues
 * to feed into the existing create-game-pr.yml workflow.
 *
 * Usage:
 *   node scripts/scrape-hn.mjs                        # dry-run, last 24h
 *   node scripts/scrape-hn.mjs --days=7               # dry-run, last 7 days
 *   node scripts/scrape-hn.mjs --create-issues        # create GitHub issues
 *   node scripts/scrape-hn.mjs --min-points=10        # higher quality threshold
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: true },
    "create-issues": { type: "boolean", default: false },
    days: { type: "string", default: "1" },
    "min-points": { type: "string", default: "5" },
  },
  strict: false,
});

const CREATE_ISSUES = flags["create-issues"];
const DRY_RUN = !CREATE_ISSUES;
const DAYS = parseInt(flags["days"], 10);
const MIN_POINTS = parseInt(flags["min-points"], 10);

const GAME_KEYWORDS =
  /\b(game|games|play|puzzle|arcade|chess|rpg|platformer|roguelike|tetris|sudoku|minesweeper|wordle|sokoban)\b/i;

const SEARCH_QUERIES = [
  "game",
  "play",
  "puzzle",
  "arcade",
  "chess",
  "rpg",
];

const GAMES_DIR = join(import.meta.dirname, "..", "docs", "games");

// ---------------------------------------------------------------------------
// 1. Build dedup index from existing game markdown files
// ---------------------------------------------------------------------------

function buildDedupIndex() {
  const hnIds = new Set();
  const playUrls = new Set();

  let files;
  try {
    files = readdirSync(GAMES_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    // No games directory yet — nothing to dedup against
    return { hnIds, playUrls };
  }

  for (const file of files) {
    const content = readFileSync(join(GAMES_DIR, file), "utf-8");

    // Extract HN item IDs  (item?id=XXXXX)
    const hnMatch = content.match(/item\?id=(\d+)/g);
    if (hnMatch) {
      for (const m of hnMatch) {
        hnIds.add(m.match(/(\d+)/)[1]);
      }
    }

    // Extract play URLs from the **Play** table row
    const playMatch = content.match(/\*\*Play\*\*.*?\]\((https?:\/\/[^)]+)\)/);
    if (playMatch) {
      playUrls.add(normalizeUrl(playMatch[1]));
    }
  }

  return { hnIds, playUrls };
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "")).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// 2. Check GitHub issues (open and closed) to avoid duplicates
// ---------------------------------------------------------------------------

function getExistingIssueTitles() {
  if (DRY_RUN) return new Set();

  try {
    const raw = execSync(
      'gh issue list --label game-submission --state all --json title --limit 200',
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const issues = JSON.parse(raw);
    return new Set(issues.map((i) => i.title.toLowerCase()));
  } catch (err) {
    console.warn("Warning: could not fetch issues:", err.message);
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// 3. Query HN Algolia API
// ---------------------------------------------------------------------------

async function searchHN(query, cutoffTimestamp) {
  const results = [];
  let page = 0;
  const maxPages = 3; // safety limit

  while (page < maxPages) {
    const params = new URLSearchParams({
      query: `"show hn" ${query}`,
      tags: "story",
      hitsPerPage: "100",
      page: String(page),
      numericFilters: `created_at_i>${cutoffTimestamp},points>=${MIN_POINTS}`,
    });

    const url = `https://hn.algolia.com/api/v1/search_by_date?${params}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`HN API error (${resp.status}) for query "${query}" page ${page}`);
      break;
    }

    const data = await resp.json();
    results.push(...data.hits);

    if (data.hits.length < 100 || page >= data.nbPages - 1) break;
    page++;
  }

  return results;
}

// ---------------------------------------------------------------------------
// 4. Filter & deduplicate candidates
// ---------------------------------------------------------------------------

function filterCandidates(hits, dedupIndex, existingIssueTitles) {
  const seen = new Set(); // dedup within batch by objectID
  const candidates = [];

  for (const hit of hits) {
    const id = hit.objectID;
    const title = hit.title || "";
    const url = hit.url;

    // Must have a URL
    if (!url) continue;

    // Title must contain a game keyword
    if (!GAME_KEYWORDS.test(title)) continue;

    // Dedup within batch
    if (seen.has(id)) continue;
    seen.add(id);

    // Dedup against existing games by HN ID
    if (dedupIndex.hnIds.has(id)) continue;

    // Dedup against existing games by play URL
    if (dedupIndex.playUrls.has(normalizeUrl(url))) continue;

    // Dedup against existing issue titles (open and closed)
    const gameName = extractGameName(title);
    const issueTitleLower = `[game]: ${gameName}`.toLowerCase();
    if (existingIssueTitles.has(issueTitleLower)) continue;

    candidates.push({
      id,
      title,
      gameName,
      url,
      hnUrl: `https://news.ycombinator.com/item?id=${id}`,
      points: hit.points || 0,
      author: hit.author || "unknown",
    });
  }

  return candidates;
}

function extractGameName(title) {
  // Remove "Show HN: " prefix and any trailing description after " – " or " - "
  let name = title.replace(/^Show HN:\s*/i, "");
  name = name.split(/\s[–—-]\s/)[0].trim();
  return name;
}

// ---------------------------------------------------------------------------
// 5. Output / Issue creation
// ---------------------------------------------------------------------------

function printCandidate(c) {
  console.log(`  ${c.gameName}`);
  console.log(`    URL:    ${c.url}`);
  console.log(`    HN:     ${c.hnUrl}`);
  console.log(`    Points: ${c.points}  Author: ${c.author}`);
  console.log();
}

function createIssue(c) {
  const body = [
    `### Game Name`,
    ``,
    c.gameName,
    ``,
    `### Play URL`,
    ``,
    c.url,
    ``,
    `### Hacker News Thread`,
    ``,
    c.hnUrl,
    ``,
    `### Author Alias`,
    ``,
    c.author,
    ``,
    `### Author Website or Profile`,
    ``,
    `https://news.ycombinator.com/user?id=${c.author}`,
    ``,
    `### Source Code URL (if open-source)`,
    ``,
    `_No response_`,
    ``,
    `### Tags`,
    ``,
    `browser, free`,
    ``,
    `### Description`,
    ``,
    `${c.title}. Discovered via HN scraper.`,
  ].join("\n");

  const issueTitle = `[Game]: ${c.gameName}`;

  try {
    const result = execSync(
      `gh issue create --title ${shellEscape(issueTitle)} --label game-submission --body ${shellEscape(body)}`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    console.log(`  Created issue: ${result.trim()}`);
  } catch (err) {
    console.error(`  Failed to create issue for "${c.gameName}": ${err.message}`);
  }
}

function shellEscape(s) {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `HN Arcade Scraper — mode: ${DRY_RUN ? "dry-run" : "create-issues"}, days: ${DAYS}, min-points: ${MIN_POINTS}`,
  );
  console.log();

  // Step 1: build dedup index
  const dedupIndex = buildDedupIndex();
  console.log(
    `Dedup index: ${dedupIndex.hnIds.size} HN IDs, ${dedupIndex.playUrls.size} play URLs`,
  );

  // Step 2: check existing issues
  const existingIssueTitles = getExistingIssueTitles();
  if (!DRY_RUN) {
    console.log(`Existing game-submission issues: ${existingIssueTitles.size}`);
  }

  // Step 3: query HN
  const cutoff = Math.floor(Date.now() / 1000) - DAYS * 86400;
  const allHits = [];

  for (const query of SEARCH_QUERIES) {
    const hits = await searchHN(query, cutoff);
    allHits.push(...hits);
  }
  console.log(`Fetched ${allHits.length} total hits from HN API`);

  // Step 4: filter & dedup
  const candidates = filterCandidates(allHits, dedupIndex, existingIssueTitles);
  console.log(`Found ${candidates.length} new candidate(s)`);
  console.log();

  if (candidates.length === 0) {
    console.log("No new games to process.");
    return;
  }

  // Step 5: output
  for (const c of candidates) {
    if (DRY_RUN) {
      printCandidate(c);
    } else {
      console.log(`Creating issue for: ${c.gameName}`);
      createIssue(c);
      console.log();
    }
  }
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
