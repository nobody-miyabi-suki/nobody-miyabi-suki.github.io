# HOYOVERSE · FAN HUB

**A FAN-MADE UNIVERSE FOR THE WORLDS OF HOYOVERSE**

[![Status](https://img.shields.io/badge/🚀_Status-Live-00c853?style=for-the-badge&logo=github)](https://miyabi-suki.xyz)
[![GitHub Pages](https://img.shields.io/badge/🌐_Hosted-GitHub_Pages-181717?style=for-the-badge&logo=github)](https://pages.github.com/)
[![Hoyoverse](https://img.shields.io/badge/🎮_Hoyoverse-Fan_Project-red?style=for-the-badge)](https://www.hoyoverse.com/)
[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)]()
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)]()
[![JSON](https://img.shields.io/badge/JSON-Data_Driven-000000?style=for-the-badge&logo=json)]()

> *"In the vast cosmos, every world holds a story."*

Welcome to **Hoyoverse Fan Hub** — a fan-built web project dedicated to the worlds, characters, stories, maps, systems, and lore of:

**Genshin Impact · Honkai: Star Rail · Zenless Zone Zero · Honkai Impact 3rd**

🔮 **Not just a wiki. A growing fan archive.**  
✨ **Built with passion.**  
🌌 **Designed to keep expanding.**

---

## 🌐 Visit the Website

[https://miyabi-suki.xyz](https://miyabi-suki.xyz)

## 📦 GitHub Repository

[https://github.com/nobody-miyabi-suki/nobody-miyabi-suki.github.io](https://github.com/nobody-miyabi-suki/nobody-miyabi-suki.github.io)

---

## Table of Contents

1. [The Worlds We Explore](#the-worlds-we-explore)
2. [Features](#features)
   - [Dual Theme](#dual-theme)
   - [Smart Navigation](#smart-navigation)
   - [Unified Character System](#unified-character-system)
   - [JSON-Driven Data](#json-driven-data)
   - [Character Search & Filters](#character-search--filters)
   - [Character Card & Detail Pages](#character-card--detail-pages)
   - [Shared JavaScript Architecture](#shared-javascript-architecture)
3. [Design System](#design-system)
4. [Tech Stack](#tech-stack)
5. [Why Vanilla JavaScript?](#why-vanilla-javascript)
6. [Authentication](#authentication)
7. [Project Structure](#project-structure)
8. [Deployment](#deployment)
9. [Development Workflow](#development-workflow)
10. [Roadmap](#roadmap)
11. [Planned Features](#planned-features)
12. [Project Philosophy](#project-philosophy)
13. [Adding a New Character](#adding-a-new-character)
14. [Future Direction](#future-direction)
15. [Contribution](#contribution)
16. [Disclaimer](#disclaimer)

---

## The Worlds We Explore

| Game | Status | Main Content |
|---|---|---|
| 🎮 **Genshin Impact** | ✅ Active | Characters · Map · Story · Weapons · Artifacts |
| 🚀 **Honkai: Star Rail** | ✅ Active | Characters · Map · Story · Paths · Relics |
| 🎯 **Zenless Zone Zero** | ✅ Active | Agents · Characters · Map · Story · Bangboo · Live Monitor |
| ⚡ **Honkai Impact 3rd** | 🚧 Expanding | Valkyries · Map · Story · Weapons · Stigmata |

---

## Features

### Dual Theme

The entire website supports two visual themes:

- 🔴 **Crimson Red**
- 🔵 **Cosmic Blue**

The theme system is shared across the website and persists using browser `localStorage`. Changing the theme updates the interface without requiring a page reload.

---

### Smart Navigation

The project includes a reusable multi-level navigation system shared throughout the website. Each game has its own expandable section containing its related content.

Example structure:

```
🎮 Genshin Impact
    ├── 👤 Characters
    │   ├── 🌟 5-Star
    │   ├── ⭐ 4-Star
    │   └── 🗡️ Sword Users
    ├── 🗺️ Map
    ├── 📖 Story
    ├── ⚔️ Weapons
    └── 💎 Artifacts
```

- **Desktop Navigation:** Game sections are displayed horizontally with dropdowns.
- **Mobile Navigation:** Games are hidden behind a compact launcher (`🎮 Games ▼`) that reveals the complete navigation without taking up vertical space.

---

### Unified Character System

The project now uses a shared character architecture instead of completely independent character systems for every game.

**Shared Character List** – available through:

```
/characters.html?game=genshin
/characters.html?game=starrail
/characters.html?game=zzz
/characters.html?game=honkai3rd
```

**Shared Character Detail** – one page for all characters:

```
/character.html?game=genshin&id=diluc
/character.html?game=starrail&id=kafka
/character.html?game=zzz&id=miyabi
/character.html?game=honkai3rd&id=kiana-void
```

**System Architecture:**

```
                    ┌──────────────────────┐
                    │   CHARACTER LIST     │
                    │   characters.html    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      GAME DATA       │
                    │        JSON          │
                    └──────────┬───────────┘
                               │
               ┌───────────────┼────────────────┐
               │               │                │
               ▼               ▼                ▼
          Filter/Search    Game Selector    Character Cards
               │               │                │
               └───────────────┼────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ CHARACTER DETAIL     │
                    │   character.html    │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
      Hero                  Biography               Skills
        │                      │                      │
        ▼                      ▼                      ▼
      Image                  Stats                  Abilities
                               │
                               ▼
                            Gallery
```

---

### JSON-Driven Data

Example character JSON (Miyabi):

```json
{
  "miyabi": {
    "name": "Miyabi",
    "faction": "🏛️ Void Hunters",
    "title": "The Crimson Void Hunter",
    "description": "A legendary warrior from the Void Hunters.",
    "image": "/img/characters/miyabi.jpg",
    "bioImage": "/img/characters/miyabi-bio.jpg",
    "stats": [
      { "label": "Faction", "value": "🏛️ Void Hunters" },
      { "label": "Role", "value": "⚔️ Anomaly" },
      { "label": "Element", "value": "❄️ Ice" },
      { "label": "Rarity", "value": "⭐ S-Rank" }
    ],
    "features": [],
    "bioContent": [],
    "skills": [],
    "gallery": []
  }
}
```

**Game Data Files:**
- `/data/genshin-characters.json`
- `/data/starrail-characters.json`
- `/data/agents.json`
- `/data/honkai3rd-characters.json`

---

### Character Search & Filters

- **Search:** By name, faction, element, weapon, path, role, type, rarity.
- **Dynamic Filters:** Generated automatically from the dataset (e.g., Genshin: Pyro, Hydro, Sword; ZZZ: S-Rank, Attack, Ice; Honkai 3rd: Psychic, Mecha, Bio).
- **Game Switching:** The character page includes a game selector that redirects via `?game=` parameter.

---

### Character Card & Detail Pages

**Character Card** – contains image, rarity, name, element/role, faction, and "View Profile" button.

**Character Detail Page** supports:
- **Hero:** Name, title, faction, description, artwork, navigation.
- **Features:** Custom feature cards.
- **Biography:** Quote, lore, stats, artwork.
- **Skills:** Icons, names, types, descriptions.
- **Gallery:** Image-based and fallback content.

---

### Shared JavaScript Architecture

- **`character-list.js`** – loads data, reads URL, generates filters, searches, renders cards, switches games.
- **`character-detail.js`** – reads game & ID, loads JSON, renders hero, features, biography, stats, skills, and galleries.

---

## Design System

- Uses shared CSS variables (`--bg-primary`, `--text-primary`, `--glow-color`, etc.) for dual themes.
- **Responsive:** Works on desktop, laptop, tablet, and mobile.
- **Glass UI:** Uses `backdrop-filter`, transparency, blur, gradients, and shadows for a cinematic style.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 |
| Styling | CSS3 |
| Logic | Vanilla JavaScript |
| Data | JSON |
| Authentication | Supabase |
| Hosting | GitHub Pages |
| Domain | miyabi-suki.xyz |
| Framework | None |

---

## Why Vanilla JavaScript?

- Lightweight deployment
- No build step
- Simple GitHub Pages hosting
- Easier debugging
- Low dependency overhead

---

## Authentication

Includes Supabase integration via:
- `/auth/login.html`
- `/auth/register.html`
- `/auth/profile.html`
- `/js/supabase.js` and `/js/header-auth.js`

---

## Project Structure

```
nobody-miyabi-suki.github.io/
├── auth/                   # Login, Register, Profile
├── genshin/                # Genshin pages
├── starrail/               # Star Rail pages
├── zzz/                    # ZZZ pages
├── honkai3rd/              # Honkai Impact 3rd pages
├── css/                    # All stylesheets
├── js/                     # All JavaScript
├── data/                   # JSON data files
└── img/                    # Images and assets
```

---

## Deployment

Deployed via GitHub Pages from the `main` branch.

- **Repository:** [https://github.com/nobody-miyabi-suki/nobody-miyabi-suki.github.io](https://github.com/nobody-miyabi-suki/nobody-miyabi-suki.github.io)
- **Live Site:** [https://miyabi-suki.xyz](https://miyabi-suki.xyz)

---

## Development Workflow

1. Edit → 2. Test locally → 3. `git add` → 4. `git commit` → 5. `git push` → 6. Auto-deploy via GitHub Pages.

---

## Roadmap

| Phase | Description | Progress |
|---|---|---|
| ✨ Phase 1 — Foundation | Core structure, navigation, themes | 100% |
| 🃏 Phase 2 — Character System | Shared JSON, list, detail, search | 100% |
| 🌙 Phase 3 — Interactive Systems | Gacha, events, etc. | 70% |
| 🌀 Phase 4 — Community Features | Profiles, favorites, lists | 40% |
| 🌌 Phase 5 — Full Lore Archive | Lore, maps, interactive stories | 30% |

---

## Planned Features

- Character Builder, Comparison, Statistics, Builds
- Warp/Pull Simulator, Gacha Simulation, Event Calendar
- Expanded Profiles, Favorites, User Lists, Global Search

---

## Project Philosophy

A fan archive + learning project + frontend experiment + growing Hoyoverse hub.

---

## Adding a New Character

1. Add JSON data to the appropriate game file.
2. Add images to `/img/characters/`.
3. The shared system handles the rest automatically.

---

## Future Direction

Evolving toward a connected fan universe:

```
HOYOVERSE FAN HUB → CHARACTERS / WORLDS / STORIES → BUILDS / MAPS / LORE → COMMUNITY
```

---

## Contribution

- 🐛 **Bugs:** Open an issue.
- 💡 **Ideas:** Start a discussion.
- ⭐ **Enjoy?** Star the repository.

---

## Disclaimer

This is an independent, non-commercial fan project. Not affiliated with, endorsed by, or sponsored by HoYoverse. All trademarks belong to their respective owners.

---

> 🌠 **THE JOURNEY CONTINUES**  
> *"May the stars guide your path."*

Made with ❤️, code, curiosity, and way too much resin.

© 2026 · Fan Project · Not affiliated with HoYoverse  
Built by [nobody-miyabi-suki](https://github.com/nobody-miyabi-suki)  
*Just a little Vibe Coding help from DeepSeek*

✦ ONE WEBSITE · FOUR WORLDS · ENDLESS STORIES ✦
