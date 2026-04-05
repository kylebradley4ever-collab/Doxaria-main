# Workspace

## Overview

pnpm workspace monorepo using TypeScript — MMO Battle Game with auto-combat, infinite zones, 13 equipment rarities (Common → "The Absolute"), enchanting, skill leveling, ascension, Raids of Gods (9 bosses), Fishing, gold upgrades, and 9 prestige tiers up to "Primordial Deity" at prestige 1000.

**14 Additional Features Added:**
- Talent Tree (6 stats, 1 point per level-up, reset with gold)
- Pet System (15 pets, 1.5% drop from monsters, passive bonuses)
- Alchemy Lab (8 potions brewed from 8 ingredient types dropped in battle)
- PvP Arena (challenge player snapshots, 7 tiers from Bronze → Grandmaster)
- Challenge Mode (endless wave survival, 50 waves, high-score tracking)
- **Infinite Tower** (floor-by-floor climbing, no ceiling, milestone rewards at floors 10/25/50/100/200/500/1000)
- World Map (visual zone progression for all 20 zones + procedural infinite zones, with completion %)
- Monster Codex / Bestiary (per-monster kill tracking with mastery tiers)
- Daily Login Bonus (7-day streak rewards with modal auto-popup)
- Leaderboard (5 categories: Overall, Level, Kills, Arena, Fishing)
- Hub (central navigation page for all features)
- **20 named zones** (extended from 12 to 20, levels 1–19,999) + procedurally generated zones beyond level 20,000
- **9 prestige tiers** (extended with Immortal at 200, True God at 500, Primordial Deity at 1000)

Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (backend kept intact, not used by frontend)
- **Database**: PostgreSQL + Drizzle ORM (backend only)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, React Query, Tailwind CSS, Framer Motion, Lucide React
- **Frontend data layer**: localStorage only (`"mmo-save"` key) — no server calls

> **Note**: The frontend (`artifacts/mmo-battle`) has been converted to a fully static, localStorage-only app. All game state is persisted via `src/lib/store.ts` (GameSave type). The backend files (`artifacts/api-server`, `lib/db`, `lib/api-spec`, etc.) are kept intact but are not used by the frontend.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mmo-battle/         # MMO Battle Game (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## MMO Battle Game

A dark fantasy idle auto-battle RPG with endless progression:

### Systems
- **Player**: level, XP, HP, attack, defense, gold, monsters defeated, enchanting stones
- **Auto-battle**: 1.4s attack interval, 2.4s victory pause, 5s respawn countdown
- **Monster zones**: 10 zones unlocking at levels 1/11/21/36/56/80/121/176/250/350 — Verdant Forest, Cursed Caverns, Shadowmere Wastes, Infernal Abyss, Void Between Worlds, Celestial Spire, Abyssal Depths, Shattered Realm, Eternal Sanctum, The Infinite Void (truly endless scaling)
- **80+ monsters**: 8 themed monsters + 2-3 bosses per zone; bosses (8% chance) give 3× XP/gold and better loot
- **11 rarity tiers**: Common → Uncommon → Rare → Epic → Legendary → Mythic → Divine → Abyssal → Transcendent → Cosmic (1280 stat, 100k gold) → Eternal (2560 stat, 500k gold)
- **Ascension system**: at level 100+ player can ascend — resets level to 1, keeps skills/gold/gear, gains permanent +25% XP and +15% gold per ascension tier (infinite loop)
- **6 equipment slots**: weapon/gloves/ring (ATK), armor/boots/amulet (DEF) — shown in two-column layout
- **120+ unique items** across all rarity tiers
- **Sell system**: sell individual items (two-tap confirm) or sell-all unequipped at once
- **Enchanting system**: 7% stone drop rate; spend stones to raise item stat +1 (max +10); enchanting an equipped item updates live ATK/DEF

### Stat/Gold Values by Rarity
| Rarity       | Stat Bonus | Gold   |
|--------------|-----------|--------|
| Common       | +2        | 5      |
| Uncommon     | +5        | 15     |
| Rare         | +10       | 40     |
| Epic         | +20       | 100    |
| Legendary    | +40       | 300    |
| Mythic       | +80       | 1,000  |
| Divine       | +160      | 3,500  |
| Abyssal      | +320      | 9,000  |
| Transcendent | +640      | 25,000 |

### API Endpoints
- `GET /api/player` — get player info (includes `enchantingStones`)
- `POST /api/player` — create/reset player
- `POST /api/battle/start` — start a new battle (returns monster with `zone`/`zoneName`)
- `POST /api/battle/attack` — attack current monster
- `GET /api/inventory` — get player's collected items (includes `enchantLevel`)
- `POST /api/inventory/:id/equip` — equip item
- `POST /api/inventory/:id/unequip` — unequip item
- `POST /api/inventory/:id/sell` — sell item
- `POST /api/inventory/sell-all` — sell all unequipped items
- `POST /api/inventory/:id/enchant` — enchant item (+1 stat, -1 stone)

### DB Tables
- `players` — stats, gold, level, XP, enchanting_stones
- `battles` — current/past battle state
- `inventory` — collected loot items with `enchant_level`

### Key Files
- `artifacts/api-server/src/lib/gameLogic.ts` — all game formulas, monster/item pools, zone system
- `artifacts/api-server/src/routes/battle.ts` — battle logic, stone drops
- `artifacts/api-server/src/routes/enchant.ts` — enchant endpoint
- `artifacts/api-server/src/routes/sell.ts` — sell endpoints
- `artifacts/mmo-battle/src/pages/Battle.tsx` — battle UI, rarity helpers (getRarityGradient, getRarityGlow)
- `artifacts/mmo-battle/src/pages/Inventory.tsx` — inventory with filter/sort/sell/enchant modes
- `artifacts/mmo-battle/src/pages/Equipment.tsx` — ATK/DEF two-column gear display
- `artifacts/mmo-battle/src/components/PlayerBar.tsx` — HUD with HP, XP, gold, kills, stones

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/player.ts` — players table
- `src/schema/inventory.ts` — inventory table
- `src/schema/battle.ts` — battles table
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
