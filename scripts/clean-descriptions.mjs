#!/usr/bin/env node

/**
 * Clean up game descriptions and add submissionMethod field:
 * 1. Remove "Discovered via HN scraper" suffix
 * 2. Remove "Show HN:" prefix from descriptions
 * 3. Add submissionMethod field (scraped/manual)
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

function determineSubmissionMethod(content, description) {
  // If description mentions scraper, it was scraped
  if (description.includes('Discovered via HN scraper') ||
      description.includes('Discovered via HN archive scraper')) {
    return 'scraped';
  }

  // Check if description starts with "Show HN:" which is typical for scraped content
  if (description.startsWith('Show HN:') && description.split('\n').length === 1) {
    return 'scraped';
  }

  // Otherwise assume manual
  return 'manual';
}

function updateGameFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.warn(`No frontmatter found in ${filePath}`);
    return;
  }

  const frontmatterText = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Parse frontmatter lines
  const lines = frontmatterText.split('\n');
  const frontmatter = {};

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes from description
      if (key === 'description' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      frontmatter[key] = value;
    }
  }

  // Skip if already has submissionMethod
  if (frontmatter.submissionMethod) {
    console.log(`⊘ ${path.basename(filePath)} already has submissionMethod`);
    return;
  }

  // Determine submission method and clean description
  const originalDesc = frontmatter.description || '';
  const submissionMethod = determineSubmissionMethod(content, originalDesc);
  const cleanedDesc = cleanDescription(originalDesc);

  // Skip if no changes needed
  if (cleanedDesc === originalDesc) {
    console.log(`⊘ ${path.basename(filePath)} - no description changes needed, adding submissionMethod: ${submissionMethod}`);
  } else {
    console.log(`✓ ${path.basename(filePath)} - cleaned description, adding submissionMethod: ${submissionMethod}`);
  }

  // Rebuild frontmatter
  const newFrontmatter = [];
  newFrontmatter.push('---');

  for (const line of lines) {
    const match = line.match(/^([^:]+):/);
    if (!match) continue;

    const key = match[1].trim();

    if (key === 'description') {
      newFrontmatter.push(`description: "${cleanedDesc.replace(/"/g, '\\"')}"`);
    } else if (key === 'dateAdded') {
      // Insert submissionMethod right after dateAdded
      newFrontmatter.push(line);
      newFrontmatter.push(`submissionMethod: ${submissionMethod}`);
    } else {
      newFrontmatter.push(line);
    }
  }

  // If dateAdded wasn't found, add submissionMethod at the end
  if (!lines.some(l => l.startsWith('dateAdded:'))) {
    newFrontmatter.push(`submissionMethod: ${submissionMethod}`);
  }

  newFrontmatter.push('---');

  // Clean the About section in the body as well
  let cleanedBody = body;

  // Find and clean the About section
  const aboutMatch = cleanedBody.match(/(## About\s*\n+)([\s\S]+?)(?:\n##|$)/);
  if (aboutMatch) {
    const aboutHeader = aboutMatch[1];
    let aboutContent = aboutMatch[2].trim();
    const cleanedAboutContent = cleanDescription(aboutContent);

    if (cleanedAboutContent !== aboutContent) {
      cleanedBody = cleanedBody.replace(
        aboutMatch[0],
        `${aboutHeader}${cleanedAboutContent}\n`
      );
    }
  }

  // Rebuild the file
  const newContent = newFrontmatter.join('\n') + '\n' + cleanedBody;
  fs.writeFileSync(filePath, newContent);
}

// Get all markdown files in games directory
const files = fs.readdirSync(gamesDir)
  .filter(f => f.endsWith('.md') && f !== '_category_.json')
  .map(f => path.join(gamesDir, f));

console.log(`Processing ${files.length} game files...\n`);

let success = 0;
let errors = 0;

for (const file of files) {
  try {
    updateGameFile(file);
    success++;
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(file)}: ${error.message}`);
    errors++;
  }
}

console.log(`\nDone! ${success} files processed, ${errors} errors.`);
