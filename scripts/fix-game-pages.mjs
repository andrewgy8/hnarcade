#!/usr/bin/env node

/**
 * Fix game detail pages to:
 * 1. Remove intro text before the table
 * 2. Add HN points, dateAdded, and tags to the metadata table
 * 3. Remove duplicate content in the About section
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gamesDir = path.join(__dirname, '../docs/games');

function parseMarkdown(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    throw new Error('No frontmatter found');
  }

  const frontmatterText = frontmatterMatch[1];
  const bodyStart = frontmatterMatch[0].length;
  const body = content.slice(bodyStart);

  // Parse frontmatter
  const frontmatter = {};
  const lines = frontmatterText.split('\n');

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim());
      }

      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

function fixGamePage(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseMarkdown(content);

  // Extract components from the body
  const titleMatch = body.match(/^#\s+(.+)$/m);
  if (!titleMatch) {
    console.warn(`No title found in ${filePath}`);
    return;
  }
  const title = titleMatch[1];

  // Find the table
  const tableMatch = body.match(/\|\s*\|\s*\|\n\|---\|---\|\n((?:\|[^\n]+\|\n?)+)/);
  if (!tableMatch) {
    console.warn(`No table found in ${filePath}`);
    return;
  }

  // Parse existing table rows
  const tableRows = tableMatch[1].trim().split('\n');
  const tableData = {};

  for (const row of tableRows) {
    const match = row.match(/\|\s*\*\*([^*]+)\*\*\s*\|\s*(.+?)\s*\|/);
    if (match) {
      tableData[match[1]] = match[2];
    }
  }

  // Find the About section
  const aboutMatch = body.match(/##\s+About\s*\n+([\s\S]+?)(?:\n##|$)/);
  let aboutContent = '';

  if (aboutMatch) {
    aboutContent = aboutMatch[1].trim();

    // Check if About section duplicates the description
    const descriptionText = frontmatter.description || '';
    if (aboutContent === descriptionText) {
      // If it's just a duplicate, we might want to expand it
      // For now, keep it but we'll note it
      console.log(`${path.basename(filePath)}: About section duplicates description`);
    }
  } else {
    // No About section, create one from description
    aboutContent = frontmatter.description || '';
  }

  // Build the new table with enhanced metadata
  const newTableRows = [];

  // Original rows
  if (tableData.Author) newTableRows.push(`| **Author** | ${tableData.Author} |`);
  if (tableData.Play) newTableRows.push(`| **Play** | ${tableData.Play} |`);
  if (tableData['HN Thread']) newTableRows.push(`| **HN Thread** | ${tableData['HN Thread']} |`);
  if (tableData.Source) newTableRows.push(`| **Source** | ${tableData.Source} |`);

  // Add new metadata rows
  if (frontmatter.points !== undefined) {
    newTableRows.push(`| **HN Points** | ${frontmatter.points} |`);
  }
  if (frontmatter.dateAdded) {
    newTableRows.push(`| **Date Added** | ${frontmatter.dateAdded} |`);
  }
  if (frontmatter.tags) {
    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.join(', ')
      : frontmatter.tags;
    newTableRows.push(`| **Tags** | ${tags} |`);
  }

  // Build the new content
  const newBody = [
    `# ${title}`,
    '',
    '| | |',
    '|---|---|',
    ...newTableRows,
    '',
    '## About',
    '',
    aboutContent,
    ''
  ].join('\n');

  // Reconstruct the full file
  const frontmatterLines = [
    '---',
    `title: ${frontmatter.title}`,
    `tags: [${Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : frontmatter.tags}]`,
    `description: "${frontmatter.description}"`,
  ];

  if (frontmatter.screenshot) {
    frontmatterLines.push(`screenshot: ${frontmatter.screenshot.startsWith('http') ? '"' + frontmatter.screenshot + '"' : frontmatter.screenshot}`);
  }
  if (frontmatter.sidebar_position !== undefined) {
    frontmatterLines.push(`sidebar_position: ${frontmatter.sidebar_position}`);
  }
  if (frontmatter.dateAdded) {
    frontmatterLines.push(`dateAdded: ${frontmatter.dateAdded}`);
  }
  if (frontmatter.hnId !== undefined) {
    frontmatterLines.push(`hnId: ${frontmatter.hnId}`);
  }
  if (frontmatter.points !== undefined) {
    frontmatterLines.push(`points: ${frontmatter.points}`);
  }

  frontmatterLines.push('---', '');

  const newContent = frontmatterLines.join('\n') + newBody;

  fs.writeFileSync(filePath, newContent);
  console.log(`✓ Fixed ${path.basename(filePath)}`);
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
    fixGamePage(file);
    success++;
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(file)}: ${error.message}`);
    errors++;
  }
}

console.log(`\nDone! ${success} files fixed, ${errors} errors.`);
