#!/usr/bin/env node

/**
 * Shuffles the sidebar order of all games by assigning random sidebar_position values.
 * Run daily via GitHub Actions to give each game equal visibility over time.
 *
 * Usage:
 *   node scripts/shuffle-games.mjs           # shuffle all games
 *   node scripts/shuffle-games.mjs --dry-run # show changes without writing
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
  },
  strict: false,
});

const DRY_RUN = flags["dry-run"];
const GAMES_DIR = join(import.meta.dirname, "..", "docs", "games");

/**
 * Fisher-Yates shuffle
 */
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content, raw: "" };

  const raw = match[1];
  const body = content.slice(match[0].length);
  const frontmatter = {};

  for (const line of raw.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (/^-?\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body, raw };
}

/**
 * Rebuild frontmatter string, preserving original structure
 */
function buildFrontmatter(frontmatter, originalRaw) {
  const lines = [];
  const originalLines = originalRaw.split("\n");
  const processedKeys = new Set();

  // Preserve original line order for existing keys
  for (const line of originalLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    processedKeys.add(key);

    if (key in frontmatter) {
      const value = frontmatter[key];
      if (typeof value === "number") {
        lines.push(`${key}: ${value}`);
      } else if (typeof value === "string" && value.startsWith("[")) {
        lines.push(`${key}: ${value}`);
      } else {
        // Check if original had quotes
        const originalValue = line.slice(colonIndex + 1).trim();
        if (originalValue.startsWith('"')) {
          lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    }
  }

  // Add new keys at the end
  for (const [key, value] of Object.entries(frontmatter)) {
    if (processedKeys.has(key)) continue;

    if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  console.log(`Shuffle Games — mode: ${DRY_RUN ? "dry-run" : "write"}`);
  console.log();

  const files = readdirSync(GAMES_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} game files`);

  // Generate shuffled positions (1 to N)
  const positions = shuffle(files.map((_, i) => i + 1));

  console.log();
  console.log("New order:");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const position = positions[i];
    const filePath = join(GAMES_DIR, file);
    const content = readFileSync(filePath, "utf-8");

    const { frontmatter, body, raw } = parseFrontmatter(content);
    const oldPosition = frontmatter.sidebar_position;

    frontmatter.sidebar_position = position;

    const newFrontmatter = buildFrontmatter(frontmatter, raw);
    const newContent = `---\n${newFrontmatter}\n---${body}`;

    const title = frontmatter.title || file;
    console.log(`  ${position}. ${title}`);

    if (!DRY_RUN) {
      writeFileSync(filePath, newContent);
    }
  }

  console.log();
  console.log(DRY_RUN ? "Dry run complete." : "Shuffle complete!");
}

main().catch((err) => {
  console.error("Shuffle failed:", err);
  process.exit(1);
});
