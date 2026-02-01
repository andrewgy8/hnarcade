---
title: "Circuit Artist"
tags: [simulation, desktop, open-source]
description: "A circuit simulator where you draw everything. NANDs and pixels. Build gates, ALUs, CPUs — whatever you want. Watch signals flow, rewind time, optimize your layout. Circuits are just images."
screenshot: "https://private-user-images.githubusercontent.com/509691/530432414-0bb1a7d2-9ee1-4059-b794-561d2809948f.gif?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njk5Mzg4ODksIm5iZiI6MTc2OTkzODU4OSwicGF0aCI6Ii81MDk2OTEvNTMwNDMyNDE0LTBiYjFhN2QyLTllZTEtNDA1OS1iNzk0LTU2MWQyODA5OTQ4Zi5naWY_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMjAxJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDIwMVQwOTM2MjlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00MDAzYzBhMzExZDc0OGM3NmI4YjY3OTVhYTlhZThlNTI2NmI2NTM4OTgyNzcyNTJlNTc2OWNkNzhkODY0OTEzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Z8_hLE7WWnD-kIWHs6SmV20ftHmsif5oigCiR2Esmb4"
---

# Circuit Artist

A circuit simulator where you draw everything. NANDs and pixels. Build gates, ALUs, CPUs — whatever you want. Watch signals flow, rewind time, optimize your layout. Circuits are just images.

| | |
|---|---|
| **Author** | [lets_all_be_stupid_forever](https://github.com/lets-all-be-stupid-forever) |
| **Play** | [store.steampowered.com](https://store.steampowered.com/app/3139580/Circuit_Artist/) |
| **HN Thread** | [Show HN: Circuit Artist](https://news.ycombinator.com/item?id=46445412) |
| **Source** | [github.com/lets-all-be-stupid-forever/circuit-artist](https://github.com/lets-all-be-stupid-forever/circuit-artist) |

![Circuit Artist screenshot](https://private-user-images.githubusercontent.com/509691/530432414-0bb1a7d2-9ee1-4059-b794-561d2809948f.gif?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njk5Mzg4ODksIm5iZiI6MTc2OTkzODU4OSwicGF0aCI6Ii81MDk2OTEvNTMwNDMyNDE0LTBiYjFhN2QyLTllZTEtNDA1OS1iNzk0LTU2MWQyODA5OTQ4Zi5naWY_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMjAxJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDIwMVQwOTM2MjlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00MDAzYzBhMzExZDc0OGM3NmI4YjY3OTVhYTlhZThlNTI2NmI2NTM4OTgyNzcyNTJlNTc2OWNkNzhkODY0OTEzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Z8_hLE7WWnD-kIWHs6SmV20ftHmsif5oigCiR2Esmb4)


## About

A circuit simulator where you draw everything. NANDs and pixels. Build gates, ALUs, CPUs — whatever you want. Watch signals flow, rewind time, optimize your layout. Circuits are just images.

The simulation engine uses a variable-delay event-driven simulation that takes into account the topology of the wires to create a distance/propagation delay map based on Elmore delay calculation for trees. It also considers fanout — the higher the fanout, the higher the delay. Trees propagate differently than "lines," creating a more accurate simulation so players can develop intuition for real circuit design (sort of).
