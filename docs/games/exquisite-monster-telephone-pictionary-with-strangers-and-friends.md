---
title: "Exquisite.Monster – Telephone Pictionary with strangers and friends"
tags: [mobile, browser, desktop, multiplayer, open-source]
description: "If you come to my house for dinner, there is a non-zero chance I will try to get you to play my favorite party game: **Eat Poop, You Cat!** (aka _Telephone Pictionary_ aka _Telestrations_ aka _Broken Picture Phone_)"
screenshot: "https://github.com/JonathanHarford/exquisite.monster/raw/main/static/img/exmo-gallery.png"
dateAdded: 2026-03-03
submissionMethod: scraped
hnId: 47223604
points: 1
sidebar_position: 84
---

# Exquisite.Monster – Telephone Pictionary with strangers and friends

| | |
|---|---|
| **Author** | [Swayworn](https://illegalodors.com/) |
| **Play** | [exquisite.monster](https://exquisite.monster/) |
| **HN Thread** | [Show HN: Exquisite.Monster – Telephone Pictionary with strangers and friends](https://news.ycombinator.com/item?id=47223604) |
| **Source** | [github.com/JonathanHarford/exquisite.monster](https://github.com/JonathanHarford/exquisite.monster) |
| **HN Points** | 1 |
| **Date Added** | 2026-03-03 |
| **Tags** | mobile, browser, desktop, multiplayer, open-source |

## About

If you come to my house for dinner, there is a non-zero chance I will try to get you to play my favorite party game: **Eat Poop, You Cat!** (aka _Telephone Pictionary_ aka _Telestrations_ aka _Broken Picture Phone_)

You've probably played it: The first player comes up with a sentence. The second player draws a picture of the sentence. The third player writes a sentence describing the picture, and so on. After all players have contributed, the full sequence is revealed.

Are there existing online implementations? Of course. But:

- They all expect you to fingerpaint on your phone. _It's hard to make great art that way!_ ExMo does have a drawing tool (it's expected), but players are encouraged to create their art however they like (past media include paper & pen, SculptrVR, collage, diorama, and Procreate) and upload a picture.

- The _best_ way to play is at a party with your friends, with each player writing a starting sentence on a piece of paper and then they all get passed around. Party Mode captures that experience (and is therefore the second-best way).

Stack: SvelteKit/TS, Supabase for database and file storage, Clerk for auth. I was using BullMQ for background jobs, but switched to just leaning on the database for a simpler stack. I used server-side events for notifications, but that meant keeping Vercel running constantly which is unnecessarily expensive; polling does the trick.
