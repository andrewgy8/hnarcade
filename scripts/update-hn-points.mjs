#!/usr/bin/env node

/**
 * Updates HN points for all games by fetching from the HN Algolia API.
 * Also adds hnId to frontmatter if missing.
 *
 * Usage:
 *   node scripts/update-hn-points.mjs                 # update all games
 *   node scripts/update-hn-points.mjs --dry-run       # preview changes without writing
 *   node scripts/update-hn-points.mjs --all           # force update all games (even if they have points)
 *   node scripts/update-hn-points.mjs --recent-days=14 # only update games added in past 14 days
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    all: { type: "boolean", default: false },
    "recent-days": { type: "string" },
  },
  strict: false,
});

const DRY_RUN = flags["dry-run"];
const UPDATE_ALL = flags["all"];
const RECENT_DAYS = flags["recent-days"] ? parseInt(flags["recent-days"], 10) : null;

const GAMES_DIR = join(import.meta.dirname, "..", "docs", "games");

// ---------------------------------------------------------------------------
// HN API
// ---------------------------------------------------------------------------

async function fetchHNItem(hnId) {
  const url = `https://hn.algolia.com/api/v1/items/${hnId}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch HN item ${hnId}: ${resp.status}`);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// Frontmatter parsing & updating
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const [, frontmatterStr, body] = match;
  const frontmatter = {};

  // Simple YAML parsing (handles our use case)
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (keyMatch) {
      const [, key, value] = keyMatch;
      // Handle quoted strings, numbers, booleans, and arrays
      if (value.startsWith("[") && value.endsWith("]")) {
        // Simple array parsing
        frontmatter[key] = value.slice(1, -1).split(",").map((v) => v.trim());
      } else if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[key] = value.slice(1, -1);
      } else if (!isNaN(value) && value !== "") {
        frontmatter[key] = parseFloat(value);
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, body };
}

function serializeFrontmatter(frontmatter) {
  const lines = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(", ")}]`);
    } else if (typeof value === "string" && value.includes(":")) {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

function extractHNId(content) {
  const match = content.match(/item\?id=(\d+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`HN Points Updater — mode: ${DRY_RUN ? "dry-run" : "update"}`);
  if (RECENT_DAYS) {
    console.log(`Only updating games added in the past ${RECENT_DAYS} days`);
  }
  console.log();

  const files = readdirSync(GAMES_DIR).filter((f) => f.endsWith(".md"));

  // Calculate cutoff date if filtering by recent days
  const cutoffDate = RECENT_DAYS
    ? new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000)
    : null;

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = join(GAMES_DIR, file);
    const content = readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter) {
      console.log(`⚠️  ${file}: No frontmatter found, skipping`);
      skipped++;
      continue;
    }

    // Extract HN ID from content if not in frontmatter
    let hnId = frontmatter.hnId;
    if (!hnId) {
      hnId = extractHNId(content);
      if (!hnId) {
        console.log(`⚠️  ${file}: No HN item ID found, skipping`);
        skipped++;
        continue;
      }
    }

    // Skip if filtering by recent days and game is too old
    if (cutoffDate && frontmatter.dateAdded) {
      const gameDate = new Date(frontmatter.dateAdded);
      if (gameDate < cutoffDate) {
        skipped++;
        continue;
      }
    }

    // Skip if already has points and not forcing update
    if (frontmatter.points !== undefined && !UPDATE_ALL) {
      console.log(`⏭️  ${file}: Already has points (${frontmatter.points}), skipping`);
      skipped++;
      continue;
    }

    try {
      // Fetch current points from HN
      const item = await fetchHNItem(hnId);
      const points = item.points || 0;

      const oldPoints = frontmatter.points;
      const pointsChanged = oldPoints !== points;
      const addedHnId = !frontmatter.hnId;

      if (!pointsChanged && !addedHnId) {
        console.log(`⏭️  ${file}: Points unchanged (${points}), skipping`);
        skipped++;
        continue;
      }

      // Update frontmatter
      frontmatter.hnId = hnId;
      frontmatter.points = points;

      // Reconstruct file
      const newContent = `---\n${serializeFrontmatter(frontmatter)}\n---\n${body}`;

      if (DRY_RUN) {
        console.log(`📝 ${file}: Would update`);
        if (addedHnId) console.log(`   + hnId: ${hnId}`);
        if (pointsChanged) console.log(`   ${oldPoints !== undefined ? `${oldPoints} → ${points}` : `+ points: ${points}`}`);
      } else {
        writeFileSync(filePath, newContent, "utf-8");
        console.log(`✅ ${file}: Updated`);
        if (addedHnId) console.log(`   + hnId: ${hnId}`);
        if (pointsChanged) console.log(`   ${oldPoints !== undefined ? `${oldPoints} → ${points}` : `+ points: ${points}`}`);
      }

      updated++;

      // Rate limiting: wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`❌ ${file}: Failed to fetch HN data: ${err.message}`);
      errors++;
    }
  }

  console.log();
  console.log(`Summary: ${updated} updated, ${skipped} skipped, ${errors} errors`);
  if (DRY_RUN) {
    console.log();
    console.log("This was a dry run. Run without --dry-run to apply changes.");
  }
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
