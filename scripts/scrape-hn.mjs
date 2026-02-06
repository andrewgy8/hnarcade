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
 *
 * Archive mode (find top games from a past month for newsletter "From the Archives"):
 *   node scripts/scrape-hn.mjs --archive              # random month, interactive prompt
 *   node scripts/scrape-hn.mjs --archive --month=2022-03  # specific month
 *   node scripts/scrape-hn.mjs --archive --pick=1,3  # non-interactive: create issues for #1 and #3
 *
 * Reject mode (mark an HN post as not a valid game):
 *   node scripts/scrape-hn.mjs --reject=17509601      # creates closed issue with not-a-game label
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: true },
    "create-issues": { type: "boolean", default: false },
    days: { type: "string", default: "1" },
    "min-points": { type: "string", default: "5" },
    archive: { type: "boolean", default: false },
    month: { type: "string" }, // YYYY-MM format, e.g., "2022-03"
    reject: { type: "string" }, // HN item ID to reject
    pick: { type: "string" }, // comma-separated candidate numbers to create issues for (e.g., "1,3,5")
  },
  strict: false,
});

const CREATE_ISSUES = flags["create-issues"];
const DRY_RUN = !CREATE_ISSUES;
const DAYS = parseInt(flags["days"], 10);
const MIN_POINTS = parseInt(flags["min-points"], 10);
const ARCHIVE_MODE = flags["archive"];
const ARCHIVE_MONTH = flags["month"]; // undefined means random
const REJECT_ID = flags["reject"]; // HN ID to mark as not-a-game
const PICK_CANDIDATES = flags["pick"]; // e.g., "1,3" to pick candidates 1 and 3

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

function getExistingIssueTitles(forceCheck = false) {
  if (DRY_RUN && !forceCheck) return new Set();

  const titles = new Set();

  // Check game-submission labeled issues
  try {
    const raw = execSync(
      'gh issue list --label game-submission --state all --json title --limit 200',
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const issues = JSON.parse(raw);
    for (const i of issues) {
      titles.add(i.title.toLowerCase());
    }
  } catch (err) {
    console.warn("Warning: could not fetch game-submission issues:", err.message);
  }

  // Also check not-a-game labeled issues (rejected games)
  try {
    const raw = execSync(
      'gh issue list --label not-a-game --state all --json title --limit 200',
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const issues = JSON.parse(raw);
    for (const i of issues) {
      titles.add(i.title.toLowerCase());
    }
  } catch (err) {
    console.warn("Warning: could not fetch not-a-game issues:", err.message);
  }

  return titles;
}

// ---------------------------------------------------------------------------
// 2b. Reject an HN item (create closed issue with not-a-game label)
// ---------------------------------------------------------------------------

async function fetchHNItem(hnId) {
  const url = `https://hn.algolia.com/api/v1/items/${hnId}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch HN item ${hnId}: ${resp.status}`);
  }
  return resp.json();
}

async function rejectHNItem(hnId) {
  console.log(`Fetching HN item ${hnId}...`);
  const item = await fetchHNItem(hnId);

  const title = item.title || "";
  const gameName = extractGameName(title);
  const url = item.url || "";

  console.log(`Rejecting: ${gameName}`);
  console.log(`  URL: ${url}`);
  console.log(`  HN:  https://news.ycombinator.com/item?id=${hnId}`);
  console.log();

  const issueTitle = `[Game]: ${gameName}`;
  const body = [
    `### Rejected Game`,
    ``,
    `This HN post was reviewed and determined to not be a valid game for the arcade.`,
    ``,
    `**Title:** ${title}`,
    `**URL:** ${url}`,
    `**HN Thread:** https://news.ycombinator.com/item?id=${hnId}`,
  ].join("\n");

  try {
    // Create the issue
    const createResult = execSync(
      `gh issue create --title ${shellEscape(issueTitle)} --label not-a-game --body ${shellEscape(body)}`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const issueUrl = createResult.trim();
    console.log(`Created issue: ${issueUrl}`);

    // Close it immediately
    const issueNumber = issueUrl.split("/").pop();
    execSync(`gh issue close ${issueNumber}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log(`Closed issue #${issueNumber}`);
    console.log();
    console.log(`"${gameName}" will be skipped in future scraper runs.`);
  } catch (err) {
    console.error(`Failed to create rejection issue: ${err.message}`);
    process.exit(1);
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
// 3b. Archive mode: search HN for top game from a specific month
// ---------------------------------------------------------------------------

function getRandomArchiveMonth() {
  // Pick a random month between Jan 2010 and 12 months ago
  const startYear = 2010;
  const startMonth = 0; // January
  const now = new Date();
  const endYear = now.getFullYear() - 1;
  const endMonth = now.getMonth();

  const startDate = new Date(startYear, startMonth);
  const endDate = new Date(endYear, endMonth);

  const monthsDiff =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  const randomMonths = Math.floor(Math.random() * monthsDiff);
  const targetDate = new Date(startYear, startMonth + randomMonths);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseArchiveMonth(monthStr) {
  // Parse YYYY-MM format and return start/end timestamps
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month format: ${monthStr}. Use YYYY-MM (e.g., 2022-03)`);
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed

  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0)); // First day of next month

  return {
    startTimestamp: Math.floor(startDate.getTime() / 1000),
    endTimestamp: Math.floor(endDate.getTime() / 1000),
    displayMonth: startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

async function searchHNArchive(monthStr) {
  const { startTimestamp, endTimestamp, displayMonth } = parseArchiveMonth(monthStr);

  console.log(`Searching for top game from ${displayMonth}...`);

  const allHits = [];

  for (const query of SEARCH_QUERIES) {
    const params = new URLSearchParams({
      query: `"show hn" ${query}`,
      tags: "story",
      hitsPerPage: "100",
      numericFilters: `created_at_i>=${startTimestamp},created_at_i<${endTimestamp},points>=5`,
    });

    // Use search (relevance + points) instead of search_by_date
    const url = `https://hn.algolia.com/api/v1/search?${params}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`HN API error (${resp.status}) for query "${query}"`);
      continue;
    }

    const data = await resp.json();
    allHits.push(...data.hits);
  }

  // Deduplicate by objectID and filter for game keywords
  const seen = new Set();
  const candidates = [];

  for (const hit of allHits) {
    const id = hit.objectID;
    const title = hit.title || "";
    const url = hit.url;

    if (!url) continue;
    if (!GAME_KEYWORDS.test(title)) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    candidates.push({
      id,
      title,
      gameName: extractGameName(title),
      url,
      hnUrl: `https://news.ycombinator.com/item?id=${id}`,
      points: hit.points || 0,
      author: hit.author || "unknown",
    });
  }

  // Sort by points descending and return top result
  candidates.sort((a, b) => b.points - a.points);

  return { candidates, displayMonth };
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

function createIssue(c, isArchive = false) {
  const archiveNote = isArchive
    ? ` Originally posted ${c.archiveMonth}. Discovered via HN archive scraper for newsletter "From the Archives" section.`
    : " Discovered via HN scraper.";

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
    `${c.title}.${archiveNote}`,
  ].join("\n");

  const issueTitle = `[Game]: ${c.gameName}`;
  const labels = isArchive ? "game-submission,archive" : "game-submission";

  try {
    const result = execSync(
      `gh issue create --title ${shellEscape(issueTitle)} --label ${shellEscape(labels)} --body ${shellEscape(body)}`,
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

function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function runArchiveMode() {
  const targetMonth = ARCHIVE_MONTH || getRandomArchiveMonth();

  console.log(`The HN Arcade Scraper (Archive Mode)`);
  console.log();

  // Build dedup index to avoid suggesting games we already have
  const dedupIndex = buildDedupIndex();
  console.log(
    `Dedup index: ${dedupIndex.hnIds.size} HN IDs, ${dedupIndex.playUrls.size} play URLs`,
  );

  // Check existing issues (always needed in archive mode to filter out rejected/existing games)
  const existingIssueTitles = getExistingIssueTitles(true);
  if (existingIssueTitles.size > 0) {
    console.log(`Existing issues: ${existingIssueTitles.size}`);
  }
  console.log();

  // Search archive
  const { candidates, displayMonth } = await searchHNArchive(targetMonth);
  console.log(`Found ${candidates.length} game(s) from ${displayMonth}`);
  console.log();

  if (candidates.length === 0) {
    console.log("No games found for this month. Try a different month.");
    return;
  }

  // Filter out games we already have
  const newCandidates = candidates.filter((c) => {
    if (dedupIndex.hnIds.has(c.id)) return false;
    if (dedupIndex.playUrls.has(normalizeUrl(c.url))) return false;
    const issueTitleLower = `[game]: ${c.gameName}`.toLowerCase();
    if (existingIssueTitles.has(issueTitleLower)) return false;
    return true;
  });

  if (newCandidates.length === 0) {
    console.log("All top games from this month are already in the catalog or have open issues.");
    console.log("Top games found (already tracked):");
    for (const c of candidates.slice(0, 5)) {
      console.log(`  - ${c.gameName} (${c.points} points)`);
    }
    return;
  }

  // Show top 5 candidates
  const top5 = newCandidates.slice(0, 5).map((c, i) => ({
    ...c,
    archiveMonth: displayMonth,
    number: i + 1,
  }));

  console.log(`📚 Top ${top5.length} candidates from ${displayMonth}:`);
  console.log();

  for (const c of top5) {
    console.log(`  [${c.number}] ${c.gameName}`);
    console.log(`      URL:    ${c.url}`);
    console.log(`      HN:     ${c.hnUrl} (${c.points} points)`);
    console.log();
  }

  // Get picks from --pick flag or interactive prompt
  let picks = [];

  if (PICK_CANDIDATES) {
    // Non-interactive mode: use --pick flag
    picks = PICK_CANDIDATES.split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => n >= 1 && n <= top5.length);

    if (picks.length === 0) {
      console.log(`Invalid --pick value. Use numbers 1-${top5.length} (e.g., --pick=1,3)`);
      return;
    }
  } else {
    // Interactive mode: prompt user
    const answer = await prompt(
      `Select games to add (e.g., 1,3,5), 'r' to reject, or Enter to skip: `,
    );

    if (!answer) {
      console.log("No selection made. Exiting.");
      return;
    }

    if (answer.toLowerCase() === "r") {
      // Reject mode: prompt for which ones to reject
      const rejectAnswer = await prompt(
        `Enter numbers to reject as not-a-game (e.g., 1,2): `,
      );

      const rejectPicks = rejectAnswer
        .split(",")
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => n >= 1 && n <= top5.length);

      if (rejectPicks.length === 0) {
        console.log("No valid selections. Exiting.");
        return;
      }

      console.log();
      for (const num of rejectPicks) {
        const c = top5[num - 1];
        console.log(`Rejecting: ${c.gameName}`);
        await rejectHNItem(c.id);
      }
      return;
    }

    picks = answer
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => n >= 1 && n <= top5.length);

    if (picks.length === 0) {
      console.log("No valid selections. Exiting.");
      return;
    }
  }

  console.log();
  console.log(`Creating issues for: ${picks.join(", ")}`);
  console.log();

  for (const num of picks) {
    const c = top5[num - 1];
    console.log(`Creating archive issue for: ${c.gameName}`);
    createIssue(c, true);
    console.log();
  }
}

async function runNormalMode() {
  console.log(
    `The HN Arcade Scraper — mode: ${DRY_RUN ? "dry-run" : "create-issues"}, days: ${DAYS}, min-points: ${MIN_POINTS}`,
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
      createIssue(c, false);
      console.log();
    }
  }
}

async function main() {
  if (REJECT_ID) {
    await rejectHNItem(REJECT_ID);
  } else if (ARCHIVE_MODE) {
    await runArchiveMode();
  } else {
    await runNormalMode();
  }
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
