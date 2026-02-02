#!/usr/bin/env node

/**
 * Save Screenshot Script
 *
 * Interactive script to download a screenshot from a URL and save it for a game.
 *
 * Usage:
 *   npm run save-screenshot
 *
 * Options:
 *   --no-update-frontmatter  Skip updating the game's markdown frontmatter
 */

import { writeFile, readFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createInterface } from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const GAMES_DIR = join(ROOT_DIR, "docs", "games");
const SCREENSHOTS_DIR = join(ROOT_DIR, "static", "img", "games");

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    updateFrontmatter: !args.includes("--no-update-frontmatter"),
  };
}

/**
 * Get all game slugs and titles from the games directory
 */
async function getGames() {
  const files = await readdir(GAMES_DIR);
  const games = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const slug = file.replace(/\.md$/, "");
    const content = await readFile(join(GAMES_DIR, file), "utf-8");
    const { frontmatter } = parseFrontmatter(content);
    const title = frontmatter.title || slug;

    games.push({ slug, title, file });
  }

  return games.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Filter games by search query (case-insensitive partial match on title or slug)
 */
function filterGames(games, query) {
  const lowerQuery = query.toLowerCase();
  return games.filter(
    (g) =>
      g.title.toLowerCase().includes(lowerQuery) ||
      g.slug.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Create readline interface
 */
function createReadline() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input
 */
function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

/**
 * Interactive game selection
 */
async function selectGame(rl, games) {
  console.log("\nType part of the game name to filter, then enter the number to select:\n");

  let filteredGames = games;
  let selectedGame = null;

  while (!selectedGame) {
    // Show current filtered list (max 10)
    const displayGames = filteredGames.slice(0, 10);
    if (filteredGames.length === 0) {
      console.log("  No games match your search.\n");
    } else {
      displayGames.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.title} (${g.slug})`);
      });
      if (filteredGames.length > 10) {
        console.log(`  ... and ${filteredGames.length - 10} more (type to filter)\n`);
      } else {
        console.log();
      }
    }

    const input = await prompt(rl, "Search or select [1-10]: ");
    const trimmed = input.trim();

    // Check if it's a number selection
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= displayGames.length) {
      selectedGame = displayGames[num - 1];
    } else if (trimmed === "") {
      // Empty input resets filter
      filteredGames = games;
      console.log("\n(Filter reset)\n");
    } else {
      // Filter by input
      filteredGames = filterGames(games, trimmed);
      console.log();
    }
  }

  return selectedGame;
}

/**
 * Download an image from a URL
 */
async function downloadImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    console.warn(`Warning: Content-Type is "${contentType}", expected an image type`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

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

  for (const line of raw.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

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
 * Update the markdown file with the screenshot frontmatter
 */
async function updateGameFrontmatter(slug, screenshotPath) {
  const filePath = join(GAMES_DIR, `${slug}.md`);

  if (!existsSync(filePath)) {
    console.log(`  Note: Game file not found at ${filePath}`);
    return false;
  }

  const content = await readFile(filePath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  frontmatter.screenshot = screenshotPath;

  const newContent = `---\n${serializeFrontmatter(frontmatter)}\n---\n${body}`;
  await writeFile(filePath, newContent, "utf-8");

  console.log(`Updated frontmatter in ${filePath}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log("Save Screenshot Script");
  console.log("======================");

  const { updateFrontmatter } = parseArgs();

  // Load games
  console.log("\nLoading games...");
  const games = await getGames();

  if (games.length === 0) {
    console.error("No games found in docs/games/");
    process.exit(1);
  }

  console.log(`Found ${games.length} games.`);

  const rl = createReadline();

  try {
    // Prompt for URL
    const url = await prompt(rl, "\nScreenshot URL: ");
    if (!url.trim()) {
      console.error("Error: URL is required");
      process.exit(1);
    }

    // Select game
    const game = await selectGame(rl, games);
    console.log(`\nSelected: ${game.title} (${game.slug})`);

    // Ensure screenshots directory exists
    if (!existsSync(SCREENSHOTS_DIR)) {
      await mkdir(SCREENSHOTS_DIR, { recursive: true });
      console.log(`Created directory: ${SCREENSHOTS_DIR}`);
    }

    // Download the image
    console.log("\nDownloading image...");
    let imageBuffer;
    try {
      imageBuffer = await downloadImage(url.trim());
    } catch (error) {
      console.error(`Error downloading image: ${error.message}`);
      process.exit(1);
    }

    // Save the image
    const outputFilename = `${game.slug}.png`;
    const outputPath = join(SCREENSHOTS_DIR, outputFilename);
    const frontmatterPath = `/img/games/${outputFilename}`;

    await writeFile(outputPath, imageBuffer);
    console.log(`Saved screenshot to: ${outputPath}`);

    // Update frontmatter by default
    if (updateFrontmatter) {
      console.log("\nUpdating frontmatter...");
      await updateGameFrontmatter(game.slug, frontmatterPath);
    } else {
      console.log("\nSkipping frontmatter update (--no-update-frontmatter)");
      console.log(`Screenshot path for frontmatter: ${frontmatterPath}`);
    }

    console.log("\nDone!");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
