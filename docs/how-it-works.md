---
title: How It Works
sidebar_position: 98
---

# How It Works

The HN Arcade is a community-driven directory of games discovered from [Hacker News](https://news.ycombinator.com) **Show HN** posts. Here's how games make it into the directory.

## Automatic discovery

A scraper runs every 12 hours and searches Hacker News for new **Show HN** game posts using the [Algolia API](https://hn.algolia.com/api). When it finds a game that isn't already in the directory, it creates a submission issue on GitHub for review.

## Community submissions

Anyone can submit a game by [opening a GitHub Issue](https://github.com/andrewgy8/hnarcade/issues/new?template=submit-game.yml) using the structured submission form. The only requirement is that the game was posted as a **Show HN** on Hacker News.

## Review and publish

Every submission — whether from the scraper or the community — goes through the same pipeline:

1. A GitHub Issue is created with the game details.
2. A workflow automatically generates a pull request with the game's page.
3. A human reviews the PR to make sure everything looks good.
4. Once merged, the game is live on the site.

## Open source

The HN Arcade is fully open source. The site, scraper, and automation are all in the [GitHub repository](https://github.com/andrewgy8/hnarcade). Contributions and feedback are welcome.
