<div align="center">

<img src="static/img/favicon.svg" alt="HN Arcade" width="80">

# The HN Arcade

A curated directory of games discovered from Hacker News Show HN posts, built with [Docusaurus](https://docusaurus.io).

[**Browse Games**](https://hnarcade.com) | [**Submit a Game**](https://github.com/andrewgy8/hnarcade/issues/new?template=submit-game.yml) | [**Newsletter**](https://hnarcade.com/newsletter)

</div>

---

## Features

- Browse and discover indie games shared on Hacker News
- Sort by Most Recent, HN Ranking, A-Z, or Random
- Game screenshots, tags, and HN points
- Weekly newsletter with curated picks
- Automated game discovery via HN scraper (every 12h)
- Submit games via GitHub Issues

## Project Structure

```
docs/games/          # Game markdown files with frontmatter metadata
src/pages/           # Homepage, newsletter page
src/components/      # NewsletterBanner and other components
src/theme/DocCard/   # Swizzled DocCard with screenshot support
static/img/games/    # Game screenshots (<slug>.png)
scripts/             # HN scraper, screenshot, and points scripts
.github/workflows/   # CI/CD: deploy, game PR creation, HN scraper
```

## Adding a Game

### Via GitHub Issue (preferred)

[Open a submission issue](https://github.com/andrewgy8/hnarcade/issues/new?template=submit-game.yml) — a workflow will automatically create a PR from the form fields.

### Manually

Create `docs/games/<slug>.md`:

```markdown
---
title: Game Name
tags: [genre, platform, free]
description: One-line description of the game.
screenshot: /img/games/game-name.png
dateAdded: 2026-01-28
submissionMethod: manual
hnId: XXXXXXX
points: 0
---

# Game Name

| | |
|---|---|
| **Author** | [Author Alias](https://author-website.com) |
| **Play** | [domain.com](https://domain.com) |
| **HN Thread** | [Show HN: Game Name](https://news.ycombinator.com/item?id=XXXXXXX) |
| **Source** | [github.com/user/repo](https://github.com/user/repo) |
| **HN Points** | 0 |
| **Date Added** | 2026-01-28 |
| **Tags** | genre, platform, free |

## About

Longer description of the game.
```

Common tags: `puzzle`, `strategy`, `arcade`, `sandbox`, `simulation`, `rpg`, `platformer`, `browser`, `mobile`, `desktop`, `open-source`, `multiplayer`, `paid`, `free`

## Development

```bash
npm install
npm start          # local dev server
npm run build      # production build
npm run screenshot # take screenshots for all games
npm run scrape     # dry-run HN scraper
npm run update-points # fetch current HN points
```

## Deployment

Pushes to `main` trigger a GitHub Actions build and deploy to [hnarcade.com](https://hnarcade.com) via GitHub Pages.
