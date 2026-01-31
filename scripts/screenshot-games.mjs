#!/usr/bin/env node

/**
 * Screenshot Games Script
 *
 * Takes screenshots of all games in docs/games/ and updates their frontmatter.
 *
 * Usage:
 *   npm run screenshot              # Screenshot all games missing screenshots
 *   npm run screenshot -- --all     # Screenshot all games (overwrite existing)
 *   npm run screenshot -- --dry-run # Show what would be done without doing it
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium } from "playwright";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const GAMES_DIR = join(ROOT_DIR, "docs", "games");
const SCREENSHOTS_DIR = join(ROOT_DIR, "static", "img", "games");

// Configuration
const VIEWPORT = { width: 1280, height: 720 };
const WAIT_TIME = 3000; // 3 seconds
const FORMAT = "png";

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
  const frontmatter = {};

  // Simple YAML parsing for our use case
  for (const line of raw.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Handle quoted strings
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Handle arrays like [tag1, tag2]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim());
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body, raw };
}

/**
 * Serialize frontmatter back to YAML
 */
function serializeFrontmatter(frontmatter) {
  const lines = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(", ")}]`);
    } else if (
      typeof value === "string" &&
      (value.includes(":") || value.includes("#") || value.startsWith('"'))
    ) {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

/**
 * Extract play URL from markdown content
 */
function extractPlayUrl(content) {
  // Look for the Play row in the markdown table
  // Format: | **Play** | [domain](https://url) |
  const playMatch = content.match(
    /\|\s*\*\*Play\*\*\s*\|\s*\[.*?\]\((https?:\/\/[^\s)]+)\)/i
  );
  if (playMatch) {
    return playMatch[1];
  }

  // Alternative format without bold
  const altMatch = content.match(
    /\|\s*Play\s*\|\s*\[.*?\]\((https?:\/\/[^\s)]+)\)/i
  );
  if (altMatch) {
    return altMatch[1];
  }

  return null;
}

/**
 * Generate slug from filename
 */
function getSlug(filename) {
  return basename(filename, ".md");
}

/**
 * Take a screenshot of a URL
 */
async function takeScreenshot(browser, url, outputPath) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    // Navigate to the page
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for additional time to let the page render
    await page.waitForTimeout(WAIT_TIME);

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: FORMAT,
    });

    return true;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return false;
  } finally {
    await context.close();
  }
}

/**
 * Update the markdown file with the screenshot frontmatter
 */
async function updateFrontmatter(filePath, screenshotPath) {
  const content = await readFile(filePath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  // Update screenshot field
  frontmatter.screenshot = screenshotPath;

  // Rebuild the file
  const newContent = `---\n${serializeFrontmatter(frontmatter)}\n---\n${body}`;
  await writeFile(filePath, newContent, "utf-8");
}

/**
 * Main function
 */
async function main() {
  console.log("Screenshot Games Script");
  console.log("=======================\n");

  if (DRY_RUN) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  // Ensure screenshots directory exists
  if (!existsSync(SCREENSHOTS_DIR)) {
    if (!DRY_RUN) {
      await mkdir(SCREENSHOTS_DIR, { recursive: true });
    }
    console.log(`Created directory: ${SCREENSHOTS_DIR}\n`);
  }

  // Get all game files
  const files = await readdir(GAMES_DIR);
  const gameFiles = files.filter((f) => f.endsWith(".md"));

  console.log(`Found ${gameFiles.length} game files\n`);

  // Launch browser
  let browser;
  if (!DRY_RUN) {
    console.log("Launching browser...\n");
    browser = await chromium.launch({
      headless: true,
    });
  }

  const results = {
    success: [],
    skipped: [],
    failed: [],
    noUrl: [],
  };

  try {
    for (const file of gameFiles) {
      const filePath = join(GAMES_DIR, file);
      const slug = getSlug(file);
      const screenshotFilename = `${slug}.${FORMAT}`;
      const screenshotPath = join(SCREENSHOTS_DIR, screenshotFilename);
      const frontmatterPath = `/img/games/${screenshotFilename}`;

      console.log(`Processing: ${file}`);

      // Read file content
      const content = await readFile(filePath, "utf-8");
      const { frontmatter } = parseFrontmatter(content);

      // Check if screenshot already exists (unless --all flag)
      if (!OVERWRITE_ALL && frontmatter.screenshot) {
        console.log(`  Skipping: Already has screenshot\n`);
        results.skipped.push(file);
        continue;
      }

      // Extract play URL
      const playUrl = extractPlayUrl(content);
      if (!playUrl) {
        console.log(`  Skipping: No play URL found\n`);
        results.noUrl.push(file);
        continue;
      }

      console.log(`  URL: ${playUrl}`);
      console.log(`  Screenshot: ${frontmatterPath}`);

      if (DRY_RUN) {
        console.log(`  Would take screenshot and update frontmatter\n`);
        results.success.push(file);
        continue;
      }

      // Take screenshot
      const success = await takeScreenshot(browser, playUrl, screenshotPath);

      if (success) {
        // Update frontmatter
        await updateFrontmatter(filePath, frontmatterPath);
        console.log(`  Success!\n`);
        results.success.push(file);
      } else {
        console.log(`  Failed to take screenshot\n`);
        results.failed.push(file);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log("\n=======================");
  console.log("Summary");
  console.log("=======================");
  console.log(`Total games: ${gameFiles.length}`);
  console.log(`Successful: ${results.success.length}`);
  console.log(`Skipped (already has screenshot): ${results.skipped.length}`);
  console.log(`Skipped (no URL): ${results.noUrl.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("\nFailed games:");
    results.failed.forEach((f) => console.log(`  - ${f}`));
  }

  if (results.noUrl.length > 0) {
    console.log("\nGames without play URL:");
    results.noUrl.forEach((f) => console.log(`  - ${f}`));
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
