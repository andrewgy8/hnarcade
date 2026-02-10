#!/usr/bin/env node

/**
 * Clean up About sections in game files:
 * - Remove "Discovered via HN scraper" suffix
 * - Remove "Show HN:" prefix
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gamesDir = path.join(__dirname, '../docs/games');

function cleanDescription(desc) {
  let cleaned = desc;

  // Remove "Discovered via HN scraper" and similar variations
  cleaned = cleaned.replace(/\s*Discovered via HN scraper\.?\s*$/i, '');
  cleaned = cleaned.replace(/\s*Originally posted \d{4}-\d{2}\.\s*Discovered via HN archive scraper for newsletter "From the Archives" section\.?\s*$/i, '');

  // Remove "Show HN:" prefix
  cleaned = cleaned.replace(/^Show HN:\s*/i, '');

  return cleaned.trim();
}

function updateGameFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find and clean the About section
  const aboutMatch = content.match(/(## About\s*\n+)([\s\S]+?)(?:\n##|$)/);
  if (!aboutMatch) {
    console.log(`⊘ ${path.basename(filePath)} - no About section found`);
    return;
  }

  const aboutContent = aboutMatch[2].trim();
  const cleanedAboutContent = cleanDescription(aboutContent);

  if (cleanedAboutContent === aboutContent) {
    console.log(`⊘ ${path.basename(filePath)} - no changes needed`);
    return;
  }

  const newContent = content.replace(
    aboutMatch[0],
    `${aboutMatch[1]}${cleanedAboutContent}\n`
  );

  fs.writeFileSync(filePath, newContent);
  console.log(`✓ ${path.basename(filePath)} - cleaned About section`);
}

// Get all markdown files in games directory
const files = fs.readdirSync(gamesDir)
  .filter(f => f.endsWith('.md') && f !== '_category_.json')
  .map(f => path.join(gamesDir, f));

console.log(`Processing ${files.length} game files...\n`);

let changed = 0;
let unchanged = 0;
let errors = 0;

for (const file of files) {
  try {
    const beforeContent = fs.readFileSync(file, 'utf-8');
    updateGameFile(file);
    const afterContent = fs.readFileSync(file, 'utf-8');

    if (beforeContent !== afterContent) {
      changed++;
    } else {
      unchanged++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(file)}: ${error.message}`);
    errors++;
  }
}

console.log(`\nDone! ${changed} files changed, ${unchanged} unchanged, ${errors} errors.`);
