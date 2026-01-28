# HN Arcade

A directory of games discovered on Hacker News Show HN posts, built with Docusaurus.

## Project structure

- `docs/games/` — each game is a markdown file with frontmatter metadata
- `docs/submit.md` — submission instructions pointing to GitHub Issues
- `src/pages/index.tsx` — homepage with hero and CTAs
- `src/css/custom.css` — HN orange theme overrides
- `docusaurus.config.ts` — site config; docs served at `/games/` via `routeBasePath`
- `sidebars.ts` — auto-generated sidebar from `docs/`
- `.github/workflows/deploy.yml` — deploys to GitHub Pages on push to `main`
- `.github/workflows/create-game-pr.yml` — auto-generates a PR from game submission issues
- `.github/workflows/scrape-hn.yml` — cron job (every 12h) that scrapes HN for game posts and creates issues
- `.github/ISSUE_TEMPLATE/submit-game.yml` — structured issue form for game submissions
- `scripts/scrape-hn.mjs` — HN scraper script; queries Algolia API for "Show HN" game posts

## Available MCPs
- Playwright

## Adding a game

### Automated (preferred)

Submit a game via the [GitHub Issue form](https://github.com/andrewgy8/hnarcade/issues/new?template=submit-game.yml). The `create-game-pr.yml` workflow will automatically:

1. Parse the issue form fields
2. Generate `docs/games/<slug>.md` from the submitted data
3. Open a PR on branch `add-game/<slug>` that closes the issue on merge
4. Comment on the issue with a link to the PR

Review and merge the PR to publish the game.

### HN Scraper (automatic discovery)

The `scrape-hn.yml` workflow runs every 12 hours and uses `scripts/scrape-hn.mjs` to query the HN Algolia API for recent "Show HN" game posts. It deduplicates against existing games (by HN item ID and normalized play URL) and open issues, then creates `game-submission`-labeled issues for new candidates. Those issues feed into the same `create-game-pr.yml` pipeline above. Scraper-created issues should be reviewed — tags default to `browser, free` and descriptions are minimal.

### Manual

Create a new file in `docs/games/<slug>.md`:

```markdown
---
title: Game Name
tags: [genre, platform, other-tag]
description: One-line description of the game.
---

# Game Name

Short intro paragraph.

| | |
|---|---|
| **Author** | [Author Alias](https://author-website.com) |
| **Play** | [domain.com](https://domain.com) |
| **HN Thread** | [Show HN: Game Name](https://news.ycombinator.com/item?id=XXXXXXX) |
| **Source** | [github.com/user/repo](https://github.com/user/repo) |

## About

Longer description of the game.
```

Tags should be lowercase. Common tags: `puzzle`, `strategy`, `arcade`, `sandbox`, `simulation`, `rpg`, `platformer`, `browser`, `mobile`, `desktop`, `open-source`, `multiplayer`, `paid`, `free`.

## Commands

- `npm start` — local dev server
- `npm run build` — production build (output in `build/`)
- `npm run serve` — serve the production build locally
- `npm run scrape` — dry-run HN scraper (add `-- --days=7` for wider window, `-- --create-issues` to create GitHub Issues)

## Deployment

GitHub Pages via GitHub Actions. Pushes to `main` trigger a build and deploy to `https://andrewgy8.github.io/hnarcade/`. The repo Pages setting must use **GitHub Actions** as the source (not "Deploy from a branch").

## Key decisions

- Blog is disabled — the site is purely a game directory
- Docs plugin is repurposed as the game catalog (`routeBasePath: 'games'`)
- Game submissions come in via GitHub Issues using a structured form template; a workflow auto-generates a PR from each submission
- The issue form collects an author alias (not real name)
- Tags provide filtering; Docusaurus auto-generates tag index pages at `/games/tags`
- HN scraper uses the Algolia API (no dependencies beyond Node 20 built-in `fetch`); deduplicates by HN item ID and normalized play URL
- Scraper creates issues (not PRs directly) so every game still gets human review before merging
