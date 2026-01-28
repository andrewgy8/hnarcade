---
title: Submit a Game
sidebar_position: 99
---

# Submit a Game

Want to add a game to the directory? Here's how.

## Criteria

The game should have been posted as a **Show HN** on [Hacker News](https://news.ycombinator.com). It can be any genre or platform — browser games, mobile, desktop, open-source, commercial, whatever.

## How to Submit

For now, open a pull request on the [HN Arcade GitHub repo](https://github.com/your-username/hn-arcade) with a new markdown file in `docs/games/`.

### Template

Create a file named `docs/games/your-game-slug.md` using this structure:

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

Longer description of the game — what makes it interesting, how it works, etc.
```

### Tags

Use lowercase tags. Some common ones:

- **Genre**: `puzzle`, `strategy`, `arcade`, `sandbox`, `simulation`, `rpg`, `platformer`
- **Platform**: `browser`, `mobile`, `desktop`
- **Other**: `open-source`, `multiplayer`, `paid`, `free`
