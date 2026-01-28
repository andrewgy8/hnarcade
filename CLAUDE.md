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
- `.github/ISSUE_TEMPLATE/submit-game.yml` — structured issue form for game submissions

## Adding a game

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
| **Author** | [Author Name](https://author-website.com) |
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

## Deployment

GitHub Pages via GitHub Actions. Pushes to `main` trigger a build and deploy to `https://andrewgy8.github.io/hnarcade/`. The repo Pages setting must use **GitHub Actions** as the source (not "Deploy from a branch").

## Key decisions

- Blog is disabled — the site is purely a game directory
- Docs plugin is repurposed as the game catalog (`routeBasePath: 'games'`)
- Game submissions come in via GitHub Issues using a structured form template
- Tags provide filtering; Docusaurus auto-generates tag index pages at `/games/tags`
