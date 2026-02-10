#!/usr/bin/env node

/**
 * Backfill Dates Script
 *
 * Adds dateAdded field to game frontmatter based on git commit history.
 * Uses the date of the first commit that added each game file.
 *
 * Usage:
 *   npm run backfill-dates              # Add dates to all games missing them
 *   npm run backfill-dates -- --all     # Overwrite all dates (re-compute from git)
 *   npm run backfill-dates -- --dry-run # Show what would be done without doing it
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const GAMES_DIR = join(ROOT_DIR, "docs", "games");

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const OVERWRITE_ALL = args.includes("--all");

/**
 * Extract frontmatter and content from a markdown file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content, raw: "" };
  }

  const raw = match[1];
  const body = match[2];

  // Parse YAML-like frontmatter into object
  const frontmatter = {};
  const lines = raw.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays (tags)
    if (value.startsWith("[") && value.endsWith("]")) {
      frontmatter[key] = value;
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body, raw };
}

/**
 * Rebuild frontmatter YAML from object
 */
function buildFrontmatter(frontmatter) {
  const lines = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === "string" && value.startsWith("[")) {
      // Array - keep as is
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "string" && value.includes(":")) {
      // String with colon - wrap in quotes
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

/**
 * Get the date of the first commit that added a file
 */
function getFileCreationDate(filePath) {
  try {
    // Get the first commit date for this file
    const result = execSync(
      `git log --diff-filter=A --follow --format=%aI -1 -- "${filePath}"`,
      { cwd: ROOT_DIR, encoding: "utf8" }
    ).trim();

    if (!result) {
      console.warn(`⚠️  No git history found for ${filePath}`);
      return null;
    }

    // Convert to YYYY-MM-DD format
    const date = new Date(result);
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.warn(`⚠️  Error getting git date for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Process a single game file
 */
async function processGame(filename) {
  const filePath = join(GAMES_DIR, filename);
  const content = await readFile(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(content);

  // Skip if already has dateAdded and not overwriting
  if (frontmatter.dateAdded && !OVERWRITE_ALL) {
    console.log(`⏭️  Skipping ${filename} (already has dateAdded)`);
    return { skipped: true };
  }

  // Get creation date from git
  const dateAdded = getFileCreationDate(filePath);
  if (!dateAdded) {
    console.log(`❌ Skipping ${filename} (no git history)`);
    return { skipped: true };
  }

  // Add dateAdded to frontmatter
  const newFrontmatter = {
    ...frontmatter,
    dateAdded,
  };

  // Rebuild the file
  const newContent = `---\n${buildFrontmatter(newFrontmatter)}\n---\n${body}`;

  if (DRY_RUN) {
    console.log(`✓ Would add dateAdded: ${dateAdded} to ${filename}`);
    return { updated: true, dateAdded };
  }

  await writeFile(filePath, newContent, "utf8");
  console.log(`✓ Added dateAdded: ${dateAdded} to ${filename}`);
  return { updated: true, dateAdded };
}

/**
 * Main function
 */
async function main() {
  console.log("🗓️  Backfilling dates from git history...\n");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No files will be modified\n");
  }

  if (OVERWRITE_ALL) {
    console.log("🔄 OVERWRITE MODE - All dates will be re-computed\n");
  }

  const files = await readdir(GAMES_DIR);
  const gameFiles = files.filter(
    (f) => f.endsWith(".md") && !f.startsWith("_")
  );

  let updated = 0;
  let skipped = 0;

  for (const file of gameFiles) {
    const result = await processGame(file);
    if (result.updated) updated++;
    if (result.skipped) skipped++;
  }

  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${gameFiles.length}`);

  if (DRY_RUN) {
    console.log(`\n💡 Run without --dry-run to apply changes`);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
