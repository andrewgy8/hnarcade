#!/usr/bin/env node

/**
 * Save Screenshot Script
 *
 * Downloads a screenshot from a URL and saves it to the static files.
 *
 * Usage:
 *   npm run save-screenshot -- --url=<image-url> --slug=<game-slug>
 *   npm run save-screenshot -- --url=<image-url> --slug=<game-slug> --update-frontmatter
 *
 * Examples:
 *   npm run save-screenshot -- --url=https://example.com/screenshot.png --slug=my-game
 *   npm run save-screenshot -- --url=https://example.com/screenshot.png --slug=my-game --update-frontmatter
 *
 * Options:
 *   --url                 URL of the screenshot image to download (required)
 *   --slug                Game slug for the filename (required)
 *   --update-frontmatter  Update the game's markdown frontmatter with the screenshot path
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

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
  const result = {
    url: null,
    slug: null,
    updateFrontmatter: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--url=")) {
      result.url = arg.slice(6);
    } else if (arg.startsWith("--slug=")) {
      result.slug = arg.slice(7);
    } else if (arg === "--update-frontmatter") {
      result.updateFrontmatter = true;
    }
  }

  return result;
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
    console.log(`  Frontmatter not updated, but screenshot was saved.`);
    return false;
  }

  const content = await readFile(filePath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  frontmatter.screenshot = screenshotPath;

  const newContent = `---\n${serializeFrontmatter(frontmatter)}\n---\n${body}`;
  await writeFile(filePath, newContent, "utf-8");

  console.log(`  Updated frontmatter in ${filePath}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log("Save Screenshot Script");
  console.log("======================\n");

  const { url, slug, updateFrontmatter } = parseArgs();

  // Validate arguments
  if (!url) {
    console.error("Error: --url is required");
    console.error("\nUsage: npm run save-screenshot -- --url=<image-url> --slug=<game-slug>");
    process.exit(1);
  }

  if (!slug) {
    console.error("Error: --slug is required");
    console.error("\nUsage: npm run save-screenshot -- --url=<image-url> --slug=<game-slug>");
    process.exit(1);
  }

  // Validate slug (alphanumeric, hyphens, underscores only)
  if (!/^[a-z0-9_-]+$/i.test(slug)) {
    console.error("Error: Slug must contain only alphanumeric characters, hyphens, and underscores");
    process.exit(1);
  }

  console.log(`URL: ${url}`);
  console.log(`Slug: ${slug}`);
  console.log(`Update frontmatter: ${updateFrontmatter}\n`);

  // Ensure screenshots directory exists
  if (!existsSync(SCREENSHOTS_DIR)) {
    await mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created directory: ${SCREENSHOTS_DIR}`);
  }

  // Download the image
  console.log("Downloading image...");
  let imageBuffer;
  try {
    imageBuffer = await downloadImage(url);
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
    process.exit(1);
  }

  // Save the image
  const outputFilename = `${slug}.png`;
  const outputPath = join(SCREENSHOTS_DIR, outputFilename);
  const frontmatterPath = `/img/games/${outputFilename}`;

  await writeFile(outputPath, imageBuffer);
  console.log(`Saved screenshot to: ${outputPath}`);

  // Update frontmatter if requested
  if (updateFrontmatter) {
    console.log("\nUpdating frontmatter...");
    await updateGameFrontmatter(slug, frontmatterPath);
  }

  console.log("\nDone!");
  console.log(`\nScreenshot path for frontmatter: ${frontmatterPath}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
