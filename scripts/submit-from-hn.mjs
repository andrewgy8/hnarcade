#!/usr/bin/env node

/**
 * Creates a game-submission issue from a Hacker News thread URL.
 *
 * Usage:
 *   node scripts/submit-from-hn.mjs              # prompts for URL
 *   node scripts/submit-from-hn.mjs --dry-run    # prompts, but doesn't create issue
 */

import { execSync } from "node:child_process";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
  strict: false,
});

if (flags.help) {
  console.log(`
Usage: submit-from-hn.mjs [options]

Prompts for an HN thread URL and creates a game-submission issue.

Options:
  --dry-run       Print issue details without creating it
  -h, --help      Show this help message
`);
  process.exit(0);
}

const DRY_RUN = flags["dry-run"];

// ---------------------------------------------------------------------------
// Prompt for input
// ---------------------------------------------------------------------------

async function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

// ---------------------------------------------------------------------------
// Parse HN ID from input
// ---------------------------------------------------------------------------

function parseHnId(input) {
  // Direct ID
  if (/^\d+$/.test(input)) {
    return input;
  }

  // URL with item?id=XXX
  const match = input.match(/item\?id=(\d+)/);
  if (match) {
    return match[1];
  }

  throw new Error(`Invalid HN URL or ID: ${input}`);
}

// ---------------------------------------------------------------------------
// Fetch HN item from API
// ---------------------------------------------------------------------------

async function fetchHnItem(id) {
  const url = `https://hn.algolia.com/api/v1/items/${id}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`HN API error: ${resp.status} ${resp.statusText}`);
  }

  return resp.json();
}

// ---------------------------------------------------------------------------
// Extract game name from title
// ---------------------------------------------------------------------------

function extractGameName(title) {
  // Remove "Show HN: " prefix and any trailing description after " – " or " - "
  let name = title.replace(/^Show HN:\s*/i, "");
  name = name.split(/\s[–—-]\s/)[0].trim();
  return name;
}

// ---------------------------------------------------------------------------
// Create GitHub issue
// ---------------------------------------------------------------------------

function shellEscape(s) {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

function createIssue(item) {
  const gameName = extractGameName(item.title);
  const hnUrl = `https://news.ycombinator.com/item?id=${item.id}`;

  const body = [
    `### Game Name`,
    ``,
    gameName,
    ``,
    `### Play URL`,
    ``,
    item.url || "_No URL provided_",
    ``,
    `### Hacker News Thread`,
    ``,
    hnUrl,
    ``,
    `### Author Alias`,
    ``,
    item.author || "unknown",
    ``,
    `### Author Website or Profile`,
    ``,
    `https://news.ycombinator.com/user?id=${item.author}`,
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
    `${item.title}. Discovered via HN.`,
  ].join("\n");

  const issueTitle = `[Game]: ${gameName}`;

  if (DRY_RUN) {
    console.log("=== DRY RUN - Would create issue ===\n");
    console.log(`Title: ${issueTitle}`);
    console.log(`Labels: game-submission`);
    console.log(`\nBody:\n${body}`);
    console.log("\n=== End dry run ===");
    return;
  }

  try {
    const result = execSync(
      `gh issue create --title ${shellEscape(issueTitle)} --label game-submission --body ${shellEscape(body)}`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    console.log(`Created issue: ${result.trim()}`);
  } catch (err) {
    console.error(`Failed to create issue: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const input = await prompt("HN thread URL or ID: ");

  if (!input) {
    console.error("No URL provided.");
    process.exit(1);
  }

  const id = parseHnId(input);

  console.log(`Fetching HN item ${id}...`);
  const item = await fetchHnItem(id);

  console.log(`Title: ${item.title}`);
  console.log(`URL: ${item.url || "(none)"}`);
  console.log(`Author: ${item.author}`);
  console.log(`Points: ${item.points}`);
  console.log();

  if (!item.url) {
    console.warn("Warning: This HN post has no URL. The game may be a text post or Ask HN.");
  }

  createIssue(item);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
