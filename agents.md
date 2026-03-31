# Deadlock Hero Base Stats Tool — Agent Context

This document provides essential context for AI agents working on this project.

---

## Project Overview

A web-based tool for exploring and comparing Deadlock hero base statistics. Users can browse hero data, search by name, compare stats, view ranking tiers, and discover how stats scale with boons (leveling).

**Status**: Foundation complete (project initialized, data pipeline with live API fetch working, basic UI in place, schema validation enabled). Feature development phase upcoming.

---

## Tech Stack

- **Runtime**: Node.js LTS (v24+) with **pnpm** package manager
- **Language**: TypeScript (src files) + JavaScript (config)
- **Frontend Framework**: Svelte 5 (modern runes API, no legacy mode)
- **Build Tool**: Vite 8 with @sveltejs/vite-plugin-svelte
- **Styling**: Tailwind CSS 4 with PostCSS
- **Data Source**: Live API fetch with local fallback (`heroes.json`), pruned to `data/heroes-stats.json`

---

## Data Pipeline

### Data Source
- **Primary Input**: `heroes.json` (61 heroes from Deadlock API)
- **Origin**: Fetched live from `https://assets.deadlock-api.com/v2/heroes` on each extraction
- **API Fetch**: Automatic on `pnpm extract` with 10s timeout, fallback to local file if unavailable

### Extraction Script
- **File**: `scripts/extract-hero-stats.ts`
- **Generator**: `scripts/generate-schema.ts` (generates JSON schema from types)
- **Language**: TypeScript (executed via `tsx`)
- **Process**:
  1. Generate JSON schema from `src/types.ts` (`HeroData` interface) → `scripts/schema.json`
  2. Fetch heroes from API (or load from `heroes.json` if API unavailable)
  3. Validate raw response against generated schema using ajv
  4. Extract per hero: `id`, `name`, `starting_stats`
  5. Write pruned data to `data/heroes-stats.json` (61 heroes × 18+ stats per hero)
- **Execution**: `pnpm extract` (runs both generate-schema and extraction)
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
│       └── HeroCard.svelte        # Individual hero stat card
├── scripts/
│   ├── extract-hero-stats.ts      # Data extraction utility (TypeScript)
│   ├── generate-schema.ts         # JSON schema generation from types
│   └── schema.json                # Generated schema artifact (HeroData[])
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
**Goal**: Enable users to view all heroes ranked by individual stats, grouped into tiers (S, A, B, C, D).

#### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Stat Selector (Button Grid)                                 │
│ [Max Health] [Max Move Speed] [Spirit Power] [Health Regen] │
│ [Bullet Damage] [Fire Rate] [Reload Speed] [Physical Armor]│
│ [Energy Armor] [Stamina] ...                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────┐
│ HIGH TIER (Upper Outliers)              │
│ ├─ 1. Infernus          840             │
│ ├─ 2. Vindicta          835             │
│ └─ 3. Helix             832             │
│ MID TIER (Baseline Average)             │
│ ├─ 4. Dullahan          720             │
│ ...                                     │
│ LOW TIER (Lower Outliers)               │
│ ...                                     │
└─────────────────────────────────────────┘
```

#### Implementation Components

**StatSelector.svelte**
- Display all available `starting_stats` keys (extracted from heroes data)
- Button Grid: one button per stat with responsive wrapping (Max Health, Max Move Speed, etc.)
- Single select: clicking a stat button triggers hero re-ranking and highlights active button
- Initially selects `max_health` button
- Styling: Active button highlighted (e.g., darker background, border, or accent color)

**StatTierList.svelte** (new component)
- Props: `heroes: Hero[]`, `selectedStat: string`
- Derives: sorted heroes by stat value (descending)
- Tier assignment logic (outlier-based):
  - Calculate mean and standard deviation for the selected stat across all heroes
  - **HIGH TIER**: Heroes > (mean + 1 SD) — upper outliers with notably higher stats
  - **MID TIER**: Heroes between (mean - 1 SD) and (mean + 1 SD) — baseline average heroes
  - **LOW TIER**: Heroes < (mean - 1 SD) — lower outliers with notably lower stats
- Display format per hero: `[Rank]. [Hero Name] [Stat Value]`
  - Example: `1. Infernus 840`
  - Rank is absolute position in sorted list (1, 2, 3, ...)
- Tier header styling (e.g., HIGH TIER in gold, MID TIER in gray, LOW TIER in red)

**Data Processing in App.svelte**
- Extract unique stat keys: `Object.keys(heroes[0].starting_stats)`
- Track `selectedStat` state: `let selectedStat = 'max_health'`
- Pass both to StatTierList: `<StatTierList {heroes} {selectedStat} />`

#### Ranking Formula
```
mean = average of stat values across all heroes
stdDev = standard deviation of stat values
highThreshold = mean + 1 * stdDev
lowThreshold = mean - 1 * stdDev

tier = determine from thresholds:
  if (value > highThreshold) → HIGH TIER
  if (value < lowThreshold) → LOW TIER
  else → MID TIER
```
For 61 heroes (typical distribution):
- HIGH TIER: ~9 heroes (upper outliers, roughly top 15%)
- MID TIER: ~43 heroes (baseline average, roughly middle 70%)
- LOW TIER: ~9 heroes (lower outliers, roughly bottom 15%)

#### Stat Display
- Show exact stat **value** (not `display_stat_name`), e.g., `840` for max_health
- Consider appending unit context (future Phase 5 refinement) after percentile display works
- Alignment: `[Rank]. [Hero Name] .............. [Stat Value]` (right-aligned value with dots/flex space)

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
pnpm dev              # Start Vite dev server (http://localhost:5173)
pnpm build            # Build optimized production bundle (dist/)
pnpm preview          # Preview production build locally
pnpm generate-schema  # Generate JSON schema from TypeScript interfaces
pnpm extract          # Generate schema, then extract/validate data (updates data/heroes-stats.json)
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
