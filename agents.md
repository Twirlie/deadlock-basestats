# Deadlock Hero Base Stats Tool — Agent Context

This document provides essential context for AI agents working on this project.

---

## Project Overview

A web-based tool for exploring and comparing Deadlock hero base statistics. Users can browse hero data, search by name, compare stats, view ranking tiers, and discover how stats scale with boons (leveling).

**Status**: Foundation complete (project initialized, data pipeline working, basic UI in place). Feature development phase upcoming.

---

## Tech Stack

- **Runtime**: Node.js LTS (v24+) with **pnpm** package manager
- **Language**: TypeScript (src files) + JavaScript (config)
- **Frontend Framework**: Svelte 5 (modern runes API, no legacy mode)
- **Build Tool**: Vite 8 with @sveltejs/vite-plugin-svelte
- **Styling**: Tailwind CSS 4 with PostCSS
- **Data Source**: Static JSON file (`data/heroes-stats.json`) with live API fetch planned

---

## Data Pipeline

### Data Source
- **Primary Input**: `heroes.json` (61 heroes from Deadlock API snapshot)
- **Origin**: Exported from `https://assets.deadlock-api.com/v2/heroes` (fetch not yet implemented)

### Extraction Script
- **File**: `scripts/extract-hero-stats.ts`
- **Language**: TypeScript (executed via `tsx`)
- **Process**:
  1. Read `heroes.json`
  2. Extract per hero: `id`, `name`, `starting_stats` (object with stat keys like `max_move_speed`, `max_health`, etc.)
  3. Write pruned data to `data/heroes-stats.json` (61 heroes × 18+ stats per hero)
- **Execution**: `pnpm extract`
- **Output Schema**:
  ```json
  [
    {
      "id": 1,
      "name": "Infernus",
      "starting_stats": {
        "max_move_speed": { "value": 6.7, "display_stat_name": "EMaxMoveSpeed" },
        "max_health": { "value": 840, "display_stat_name": "EMaxHealth" },
        ...
      }
    },
    ...
  ]
  ```

### Future Enhancement
- Implement live API fetch in `scripts/extract-hero-stats.ts` to pull latest data on each `pnpm extract` run
- Fallback to local `heroes.json` if API unavailable
- Enables staying current with Deadlock patches

---

## Project Structure

```
deadlock-basestats/
├── src/
│   ├── App.svelte                 # Main app component (imports heroes data)
│   ├── types.ts                   # TypeScript interfaces (Hero, StatValue)
│   ├── app.css                    # Global styles + Tailwind imports
│   ├── main.js                    # App entry point
│   └── components/
│       ├── HeroCard.svelte        # Individual hero stat card
│       ├── StatTable.svelte       # Ranked hero table by stat
│       └── HeroList.svelte        # Hero selection grid
├── scripts/
│   └── extract-hero-stats.ts      # Data extraction utility (TypeScript)
├── data/
│   └── heroes-stats.json          # Generated pruned hero data (61 heroes)
├── public/
│   └── [hero portraits to be added]
├── package.json                   # pnpm dependencies & scripts
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS config for Tailwind
├── vite.config.js                 # Vite bundler config
├── svelte.config.js               # Svelte compiler config
├── tsconfig.json                  # TypeScript config
├── AGENTS.md                      # This file (agent context)
├── README.md                      # User-facing documentation
├── plan.md                        # Project roadmap
├── deadlock.md                    # Game mechanics reference
└── heroes.json                    # Original unfiltered hero data snapshot
```

---

## Core Components

### App.svelte (`src/App.svelte`)
- Imports `Hero` type from `src/types.ts`
- Imports pruned hero data from `data/heroes-stats.json`
- Renders grid of HeroCard components
- Current state: Displays all heroes in 2-column grid (md/lg responsive)

### HeroCard.svelte (`src/components/HeroCard.svelte`)
- Takes `hero: Hero` prop
- Displays hero name, ID, and basic stat overview
- Structure ready for portrait image and stat categorization

### Planned Components
The following components are planned for future development:

- **StatTable.svelte** — Ranked hero table by stat (Phase 2: Stat Analysis)
- **HeroList.svelte** — Hero selection grid (Phase 3: Hero Comparison)

### Types (`src/types.ts`)
```typescript
export interface StatValue {
  value: number
  display_stat_name: string
}

export interface Hero {
  id: number
  name: string
  starting_stats: Record<string, StatValue>
}
```

---

## Planned Features

### Phase 1: Search & Discovery
- **Fuzzy search** — Filter HeroCard grid by hero name (real-time)
- **Search state** — Tied to URL or local component state

### Phase 2: Stat Analysis
- **Tierlist view** — Select a stat (e.g., `max_health`) and display ranked heroes
- **Stat selector** — Dropdown or button grid to switch between stats
- **Ranking persistence** — Show hero rank, value, and percentile vs. others

### Phase 3: Hero Comparison
- **Comparison mode** — Select 2 heroes to cross-compare
- **Stat highlighting** — Color-code differences (superior/inferior/equal)
- **Visual diff** — Side-by-side stat panels with % differences calculated

### Phase 4: Progression
- **Boon system** — Display stat scale per boon level (how stats grow with leveling)
- **Boon selector** — Slider to view stats at different boon tiers
- **Dynamic calculations** — Real-time comparison at selected boon level

### Phase 5: Visual Enhancements
- **Stat color coding** — Color stats by category:
  - **Weapon** (red/orange) — Bullet Damage, DPS, Reload Speed, Ammo
  - **Vitality** (green/blue) — Max Health, Regen, Resistances, Move Speed, Stamina
  - **Spirit** (purple) — Spirit Power, Ability effectiveness, duration, range
- **Hero portraits** — Download and include character card images from Deadlock
- **UI polish** — Responsive grid refinement, hover states, animations

---

## Game Mechanics Reference

**See `deadlock.md` for complete details.** Key context for features:

### Stat Categories
Every stat falls into one of three categories:
- **Weapon** — Gun performance (Bullet Damage, Fire Rate, Ammo, DPS, Lifesteal)
- **Vitality** — Survivability (Max Health, Regen, Resistances, Move Speed, Stamina)
- **Spirit** — Ability effectiveness (Spirit Power, Ability duration, range, resource regen)

### Souls & Scaling
- Players collect Souls to increase Base Health, Bullet Damage, and Melee Damage per hero
- Scaling differs per hero; documented in `starting_stats`

### Boons (Ability Upgrades)
- 3 main abilities + 1 ultimate per hero
- Upgrade costs: 1 AP → 2 AP → 5 AP
- Tool will eventually display stat bonuses per boon tier

### Item Slots
- 4 slots per category (Weapon, Vitality, Spirit) + 4 Flex slots = 16 total possible
- Not yet in scope but informs scalability design

---

## Available npm Scripts

```bash
pnpm dev          # Start Vite dev server (http://localhost:5173)
pnpm build        # Build optimized production bundle (dist/)
pnpm preview      # Preview production build locally
pnpm extract      # Run data extraction script (updates data/heroes-stats.json)
```

---

## Key Files for Agents

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/App.svelte` | Main app logic & hero grid | Adding search/filter, stat selector |
| `src/components/*` | Reusable UI components | Building new views (tierlist, comparison) |
| `src/types.ts` | TypeScript interfaces | Extending data model |
| `scripts/extract-hero-stats.ts` | Data extraction | Implementing API fetch, data transformation |
| `data/heroes-stats.json` | Pruned hero data | Generated; don't edit manually |
| `tailwind.config.js` | Tailwind theming | Adding custom colors (Weapon/Vitality/Spirit) |
| `deadlock.md` | Game mechanics | Reference for feature context |

---

## Development Workflow

1. **Feature branch**: Create feature (e.g., `feat/fuzzy-search`)
2. **Develop with hot reload**: `pnpm dev` (Vite HMR live updates components)
3. **Update data** (if needed): `pnpm extract`
4. **Build check**: `pnpm build` must pass (no errors)
5. **Commit & PR**: Include feature description

---

## Common Tasks for Agents

### Adding a Search Filter
1. Add search state to `App.svelte`: `let searchQuery = ''`
2. Filter heroes array: `heroes.filter(h => h.name.toLowerCase().includes(searchQuery))`
3. Bind input to state: `<input bind:value={searchQuery} />`

### Adding a Stat Selector
1. Create stat list from hero data (extract unique keys from `starting_stats`)
2. Add state in `App.svelte`: `let selectedStat = 'max_health'`
3. Pass to StatTable component: `<StatTable {heroes} statName={selectedStat} />`

### Implementing API Fetch
1. Modify `scripts/extract-hero-stats.ts`:
   - Try `fetch('https://assets.deadlock-api.com/v2/heroes')`
   - Catch → fallback to local `heroes.json`
   - Parse, extract, write to `data/heroes-stats.json`
2. Test: `pnpm extract`

### Color-Coding Stats
1. Create stat category map in `types.ts` or config
2. Pass category to component props
3. Apply Tailwind classes: `text-red-500` (Weapon), `text-green-500` (Vitality), `text-purple-500` (Spirit)

---

## Testing & Verification

- **Dev build**: `pnpm dev` should start without errors
- **Production build**: `pnpm build` should complete with no errors
- **Data pipeline**: `pnpm extract` should output `data/heroes-stats.json` with 61 heroes
- **Browser inspection**: Open http://localhost:5173 and verify hero grid renders

---

## Notes for Future Development

- **Svelte 5 Modern**: Using runes API; avoid legacy `onMount`, `beforeUpdate`, etc.
- **Type Safety**: All components should have proper TypeScript props (avoid `any`)
- **Performance**: With 61 heroes × 18 stats, consider memoization/virtualization for large lists
- **Responsive Design**: Tailwind breakpoints are mobile-first (sm, md, lg, xl)
- **Accessibility**: Include aria labels for interactive elements

---

## References

- **Svelte 5 Docs**: https://svelte.dev/docs/svelte
- **Vite Docs**: https://vitejs.dev/
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Deadlock Game Context**: See `deadlock.md` in this repo
