export type Rarity =
  | "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic"
  | "Divine" | "Abyssal" | "Transcendent" | "Cosmic" | "Eternal"
  | "Primordial" | "Omnipotent";

export type ItemType = "weapon" | "armor" | "boots" | "gloves" | "amulet" | "ring";

export const ATK_TYPES: ItemType[] = ["weapon", "gloves", "ring"];
export const DEF_TYPES: ItemType[] = ["armor", "boots", "amulet"];

export function getStatLabel(type: ItemType): "ATK" | "DEF" {
  return ATK_TYPES.includes(type) ? "ATK" : "DEF";
}

// ─── Zones ───────────────────────────────────────────────────────────────────

export interface Zone {
  id: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  description: string;
}

export const ZONES: Zone[] = [
  { id: 1,  name: "Verdant Forest",        minLevel: 1,   maxLevel: 10,  description: "A once-peaceful wood now twisted by dark magic." },
  { id: 2,  name: "Cursed Caverns",        minLevel: 11,  maxLevel: 20,  description: "Ancient tunnels that swallow light and sanity." },
  { id: 3,  name: "Shadowmere Wastes",     minLevel: 21,  maxLevel: 35,  description: "Blighted plains where the dead outnumber the living." },
  { id: 4,  name: "Infernal Abyss",        minLevel: 36,  maxLevel: 55,  description: "A tear in reality bleeding hellfire and chaos." },
  { id: 5,  name: "Void Between Worlds",   minLevel: 56,  maxLevel: 79,  description: "The end of all things. Only legends survive here." },
  { id: 6,  name: "Celestial Spire",       minLevel: 80,  maxLevel: 120, description: "Heaven's towers, fallen and corrupted beyond salvation." },
  { id: 7,  name: "Abyssal Depths",        minLevel: 121, maxLevel: 175, description: "Lightless trenches where primordial horrors breed endlessly." },
  { id: 8,  name: "Shattered Realm",       minLevel: 176, maxLevel: 249, description: "Reality itself has fractured, bleeding chaos between the cracks." },
  { id: 9,  name: "Eternal Sanctum",       minLevel: 250, maxLevel: 349, description: "A sanctuary built by gods—now their prison and their tomb." },
  { id: 10, name: "The Infinite Void",     minLevel: 350, maxLevel: 499,      description: "Pure nothingness given form. Every step erases the one before it." },
  { id: 11, name: "Primordial Chaos",      minLevel: 500, maxLevel: 749,      description: "The churning heart of creation, where all order dissolves and raw power consumes the mind." },
  { id: 12, name: "The Eternal Darkness",  minLevel: 750, maxLevel: 999, description: "Before time, before gods — only this absolute void persisted. Entering it means being unmade." },
];

const ZONES_REVERSED = [...ZONES].reverse();

// ── Infinite zone generation (zones 13+) ────────────────────────────────────
const INF_ZONE_PREFIXES = [
  "Ancient", "Primordial", "Eternal", "Void", "Cosmic", "Celestial",
  "Divine", "Abyssal", "Shadow", "Chaos", "Shattered", "Forsaken",
  "Twilight", "Ruined", "Forbidden", "Cursed", "Boundless", "Infinite",
  "Transcendent", "Eldritch",
];
const INF_ZONE_TYPES = [
  "Spire", "Abyss", "Throne", "Nexus", "Forge", "Citadel",
  "Sanctum", "Vortex", "Expanse", "Bastion", "Labyrinth", "Rift",
  "Dominion", "Purgatory", "Wasteland", "Fortress", "Maw", "Chasm",
  "Pinnacle", "Maelstrom",
];
const INF_ZONE_DESCS = [
  "A realm where reality dissolves into pure, corrosive power.",
  "The fractured remains of a universe that refused to die.",
  "An endless expanse of condensed malice and ancient fury.",
  "Where even gods go to be forgotten.",
  "Existence here is a privilege — and it can be revoked.",
  "Every heartbeat costs a century of ordinary life.",
  "The fabric of space-time has given up all pretense here.",
  "You are not the first to enter. You may be the last.",
  "The laws of reality are suggestions — and they are wrong.",
  "Something older than darkness waits at the center.",
];

function generateInfiniteZone(zoneId: number): Zone {
  const idx = zoneId - 13;
  const prefix = INF_ZONE_PREFIXES[idx % INF_ZONE_PREFIXES.length];
  const type   = INF_ZONE_TYPES[Math.floor(idx / INF_ZONE_PREFIXES.length) % INF_ZONE_TYPES.length];
  const desc   = INF_ZONE_DESCS[idx % INF_ZONE_DESCS.length];
  const minLevel = 1000 + (zoneId - 13) * 250;
  return {
    id: zoneId,
    name: `${prefix} ${type}`,
    minLevel,
    maxLevel: minLevel + 249,
    description: desc,
  };
}

export function getZone(playerLevel: number): Zone {
  if (playerLevel >= 1000) {
    const zoneId = 13 + Math.floor((playerLevel - 1000) / 250);
    return generateInfiniteZone(zoneId);
  }
  return ZONES_REVERSED.find(z => playerLevel >= z.minLevel) ?? ZONES[0];
}

// ── Prestige system ───────────────────────────────────────────────────────────

export const PRESTIGE_TIERS = [
  { name: "Prestige",           minPrestige: 1,    color: "#cd7f32" }, // bronze
  { name: "Transcendence",      minPrestige: 10,   color: "#c0c0c0" }, // silver
  { name: "Void Ascension",     minPrestige: 25,   color: "#ffd700" }, // gold
  { name: "Eternal Supremacy",  minPrestige: 50,   color: "#b9f2ff" }, // crystal
  { name: "Cosmic Godhood",     minPrestige: 100,  color: "#ff77ff" }, // rainbow
  { name: "Infinite Dominion",  minPrestige: 200,  color: "#ffffff" }, // pure white
  { name: "Reality Shaper",     minPrestige: 500,  color: "#aaffcc" }, // jade
  { name: "The Absolute",       minPrestige: 1000, color: "#ffcc44" }, // sovereign gold
] as const;

export function getPrestigeTier(prestigeLevel: number) {
  for (let i = PRESTIGE_TIERS.length - 1; i >= 0; i--) {
    if (prestigeLevel >= PRESTIGE_TIERS[i].minPrestige) return PRESTIGE_TIERS[i];
  }
  return null;
}

/** Level required to prestige — scales up each time, caps at 100 */
export function prestigeRequiredLevel(currentPrestiges: number): number {
  return Math.min(100, 25 + currentPrestiges * 5);
}

/** XP bonus from prestige: +30% per prestige (multiplicative) */
export function prestigeXpMultiplier(prestigeLevel: number): number {
  return Math.pow(1.30, prestigeLevel);
}

/** Gold bonus from prestige: +20% per prestige (multiplicative) */
export function prestigeGoldMultiplier(prestigeLevel: number): number {
  return Math.pow(1.20, prestigeLevel);
}

/** HP bonus from prestige: +50 max HP per prestige level */
export function prestigeHpBonus(prestigeLevel: number): number {
  return prestigeLevel * 50;
}

// ─── Monsters ────────────────────────────────────────────────────────────────

export interface MonsterTemplate {
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  minZone?: number;
  isBoss?: boolean;
}

export const REGULAR_MONSTERS: MonsterTemplate[] = [
  // Zone 1 — Verdant Forest (levels 1–10)
  { name: "Slime",              emoji: "", baseHp: 10,  baseAttack: 2,  baseDefense: 0,  minZone: 1 },
  { name: "Rat Swarm",          emoji: "", baseHp: 12,  baseAttack: 3,  baseDefense: 0,  minZone: 1 },
  { name: "Goblin",             emoji: "", baseHp: 16,  baseAttack: 3,  baseDefense: 1,  minZone: 1 },
  { name: "Skeleton",           emoji: "", baseHp: 20,  baseAttack: 5,  baseDefense: 2,  minZone: 1 },
  { name: "Forest Wolf",        emoji: "", baseHp: 22,  baseAttack: 5,  baseDefense: 1,  minZone: 1 },
  { name: "Zombie",             emoji: "", baseHp: 26,  baseAttack: 4,  baseDefense: 3,  minZone: 1 },
  { name: "Bandit",             emoji: "", baseHp: 18,  baseAttack: 6,  baseDefense: 2,  minZone: 1 },
  { name: "Wicked Witch",       emoji: "", baseHp: 14,  baseAttack: 7,  baseDefense: 1,  minZone: 1 },
  { name: "Plague Rat",         emoji: "", baseHp: 14,  baseAttack: 3,  baseDefense: 1,  minZone: 1 },
  { name: "Stone Imp",          emoji: "", baseHp: 18,  baseAttack: 4,  baseDefense: 2,  minZone: 1 },
  { name: "Feral Hog",          emoji: "", baseHp: 20,  baseAttack: 4,  baseDefense: 1,  minZone: 1 },
  { name: "Cursed Scarecrow",   emoji: "", baseHp: 22,  baseAttack: 3,  baseDefense: 3,  minZone: 1 },

  // Zone 2 — Cursed Caverns (levels 11–20)
  { name: "Orc Brute",          emoji: "", baseHp: 34,  baseAttack: 7,  baseDefense: 4,  minZone: 2 },
  { name: "Ghoul",              emoji: "", baseHp: 30,  baseAttack: 8,  baseDefense: 3,  minZone: 2 },
  { name: "Wraith",             emoji: "", baseHp: 22,  baseAttack: 10, baseDefense: 2,  minZone: 2 },
  { name: "Vampire",            emoji: "", baseHp: 40,  baseAttack: 9,  baseDefense: 5,  minZone: 2 },
  { name: "Stone Golem",        emoji: "", baseHp: 50,  baseAttack: 6,  baseDefense: 10, minZone: 2 },
  { name: "Dark Elf",           emoji: "", baseHp: 28,  baseAttack: 11, baseDefense: 4,  minZone: 2 },
  { name: "Werewolf",           emoji: "", baseHp: 44,  baseAttack: 10, baseDefense: 4,  minZone: 2 },
  { name: "Cave Troll",         emoji: "", baseHp: 55,  baseAttack: 8,  baseDefense: 7,  minZone: 2 },
  { name: "Bog Witch",          emoji: "", baseHp: 26,  baseAttack: 10, baseDefense: 3,  minZone: 2 },
  { name: "Iron Golem",         emoji: "", baseHp: 60,  baseAttack: 7,  baseDefense: 12, minZone: 2 },
  { name: "Shadow Rogue",       emoji: "", baseHp: 30,  baseAttack: 12, baseDefense: 4,  minZone: 2 },
  { name: "Blood Wolf",         emoji: "", baseHp: 38,  baseAttack: 9,  baseDefense: 4,  minZone: 2 },

  // Zone 3 — Shadowmere Wastes (levels 21–35)
  { name: "Demon",              emoji: "", baseHp: 50,  baseAttack: 12, baseDefense: 6,  minZone: 3 },
  { name: "Dark Knight",        emoji: "", baseHp: 60,  baseAttack: 10, baseDefense: 10, minZone: 3 },
  { name: "Hellhound",          emoji: "", baseHp: 46,  baseAttack: 14, baseDefense: 5,  minZone: 3 },
  { name: "Necromancer",        emoji: "", baseHp: 38,  baseAttack: 16, baseDefense: 4,  minZone: 3 },
  { name: "Shade",              emoji: "", baseHp: 32,  baseAttack: 15, baseDefense: 3,  minZone: 3 },
  { name: "Medusa",             emoji: "", baseHp: 44,  baseAttack: 13, baseDefense: 7,  minZone: 3 },
  { name: "Death Knight",       emoji: "", baseHp: 62,  baseAttack: 12, baseDefense: 11, minZone: 3 },
  { name: "Shadow Stalker",     emoji: "", baseHp: 36,  baseAttack: 17, baseDefense: 4,  minZone: 3 },
  { name: "Plague Doctor",      emoji: "", baseHp: 40,  baseAttack: 14, baseDefense: 5,  minZone: 3 },
  { name: "Chaos Imp",          emoji: "", baseHp: 48,  baseAttack: 13, baseDefense: 6,  minZone: 3 },
  { name: "Bone Archer",        emoji: "", baseHp: 36,  baseAttack: 16, baseDefense: 3,  minZone: 3 },
  { name: "Spectral Knight",    emoji: "", baseHp: 64,  baseAttack: 11, baseDefense: 12, minZone: 3 },

  // Zone 4 — Infernal Abyss (levels 36–55)
  { name: "Dragon",             emoji: "", baseHp: 72,  baseAttack: 14, baseDefense: 9,  minZone: 4 },
  { name: "Infernal Lord",      emoji: "", baseHp: 68,  baseAttack: 18, baseDefense: 8,  minZone: 4 },
  { name: "Chaos Beast",        emoji: "", baseHp: 80,  baseAttack: 16, baseDefense: 10, minZone: 4 },
  { name: "Void Spawner",       emoji: "", baseHp: 55,  baseAttack: 20, baseDefense: 6,  minZone: 4 },
  { name: "Elder Demon",        emoji: "", baseHp: 74,  baseAttack: 19, baseDefense: 9,  minZone: 4 },
  { name: "Leviathan",          emoji: "", baseHp: 90,  baseAttack: 15, baseDefense: 14, minZone: 4 },
  { name: "Inferno Wyrm",       emoji: "", baseHp: 82,  baseAttack: 17, baseDefense: 11, minZone: 4 },
  { name: "Abyssal Specter",    emoji: "", baseHp: 60,  baseAttack: 22, baseDefense: 5,  minZone: 4 },
  { name: "Hell Wyrm",          emoji: "", baseHp: 78,  baseAttack: 15, baseDefense: 10, minZone: 4 },
  { name: "Magma Golem",        emoji: "", baseHp: 95,  baseAttack: 12, baseDefense: 16, minZone: 4 },
  { name: "Brimstone Fiend",    emoji: "", baseHp: 70,  baseAttack: 19, baseDefense: 8,  minZone: 4 },
  { name: "Abyssal Wraith",     emoji: "", baseHp: 62,  baseAttack: 21, baseDefense: 6,  minZone: 4 },

  // Zone 5 — Void Between Worlds (levels 56–79)
  { name: "Void Walker",        emoji: "", baseHp: 95,  baseAttack: 24, baseDefense: 12, minZone: 5 },
  { name: "Cosmic Horror",      emoji: "", baseHp: 100, baseAttack: 26, baseDefense: 10, minZone: 5 },
  { name: "Primordial Beast",   emoji: "", baseHp: 120, baseAttack: 22, baseDefense: 18, minZone: 5 },
  { name: "Abyss Titan",        emoji: "", baseHp: 130, baseAttack: 20, baseDefense: 22, minZone: 5 },
  { name: "Oblivion Drake",     emoji: "", baseHp: 108, baseAttack: 28, baseDefense: 14, minZone: 5 },
  { name: "Null Entity",        emoji: "", baseHp: 88,  baseAttack: 30, baseDefense: 8,  minZone: 5 },
  { name: "Entropy Fiend",      emoji: "", baseHp: 115, baseAttack: 25, baseDefense: 16, minZone: 5 },
  { name: "Void Sovereign",     emoji: "", baseHp: 140, baseAttack: 23, baseDefense: 24, minZone: 5 },
  { name: "Phase Shifter",      emoji: "", baseHp: 102, baseAttack: 26, baseDefense: 13, minZone: 5 },
  { name: "Null Demon",         emoji: "", baseHp: 90,  baseAttack: 28, baseDefense: 9,  minZone: 5 },
  { name: "Starfire Drake",     emoji: "", baseHp: 112, baseAttack: 24, baseDefense: 16, minZone: 5 },
  { name: "Cosmic Abomination", emoji: "", baseHp: 125, baseAttack: 22, baseDefense: 20, minZone: 5 },

  // Zone 6 — Celestial Spire (levels 80–120)
  { name: "Corrupted Seraph",   emoji: "", baseHp: 110, baseAttack: 28, baseDefense: 15, minZone: 6 },
  { name: "Fallen Angel",       emoji: "", baseHp: 95,  baseAttack: 32, baseDefense: 12, minZone: 6 },
  { name: "Celestial Guardian", emoji: "", baseHp: 130, baseAttack: 25, baseDefense: 22, minZone: 6 },
  { name: "Light Wraith",       emoji: "", baseHp: 85,  baseAttack: 35, baseDefense: 10, minZone: 6 },
  { name: "Heaven's Exile",     emoji: "", baseHp: 115, baseAttack: 30, baseDefense: 18, minZone: 6 },
  { name: "Radiant Fiend",      emoji: "", baseHp: 105, baseAttack: 27, baseDefense: 20, minZone: 6 },
  { name: "Astral Phantom",     emoji: "", baseHp: 90,  baseAttack: 33, baseDefense: 13, minZone: 6 },
  { name: "Sanctified Horror",  emoji: "", baseHp: 120, baseAttack: 26, baseDefense: 25, minZone: 6 },
  { name: "Herald of Ruin",     emoji: "", baseHp: 118, baseAttack: 30, baseDefense: 17, minZone: 6 },
  { name: "Void Seraph",        emoji: "", baseHp: 100, baseAttack: 34, baseDefense: 13, minZone: 6 },
  { name: "Luminous Fiend",     emoji: "", baseHp: 128, baseAttack: 27, baseDefense: 22, minZone: 6 },
  { name: "Shattered Angel",    emoji: "", baseHp: 108, baseAttack: 31, baseDefense: 15, minZone: 6 },

  // Zone 7 — Abyssal Depths (levels 121–175)
  { name: "Kraken Spawn",       emoji: "", baseHp: 135, baseAttack: 36, baseDefense: 18, minZone: 7 },
  { name: "Deep One",           emoji: "", baseHp: 145, baseAttack: 34, baseDefense: 22, minZone: 7 },
  { name: "Void Hydra",         emoji: "", baseHp: 155, baseAttack: 32, baseDefense: 26, minZone: 7 },
  { name: "Abyssal Revenant",   emoji: "", baseHp: 125, baseAttack: 38, baseDefense: 16, minZone: 7 },
  { name: "Nihil Serpent",      emoji: "", baseHp: 118, baseAttack: 40, baseDefense: 14, minZone: 7 },
  { name: "Oblivion Husk",      emoji: "", baseHp: 160, baseAttack: 30, baseDefense: 30, minZone: 7 },
  { name: "Depth Walker",       emoji: "", baseHp: 130, baseAttack: 37, baseDefense: 20, minZone: 7 },
  { name: "Abyss Horror",       emoji: "", baseHp: 140, baseAttack: 35, baseDefense: 24, minZone: 7 },
  { name: "Trench Horror",      emoji: "", baseHp: 148, baseAttack: 36, baseDefense: 23, minZone: 7 },
  { name: "Leviathan Spawn",    emoji: "", baseHp: 158, baseAttack: 34, baseDefense: 26, minZone: 7 },
  { name: "Void Parasite",      emoji: "", baseHp: 128, baseAttack: 39, baseDefense: 15, minZone: 7 },
  { name: "Abyssal Stalker",    emoji: "", baseHp: 140, baseAttack: 37, baseDefense: 20, minZone: 7 },

  // Zone 8 — Shattered Realm (levels 176–249)
  { name: "Reality Breach",     emoji: "", baseHp: 165, baseAttack: 44, baseDefense: 26, minZone: 8 },
  { name: "Chaos Lord",         emoji: "", baseHp: 175, baseAttack: 42, baseDefense: 30, minZone: 8 },
  { name: "Fractured Titan",    emoji: "", baseHp: 185, baseAttack: 40, baseDefense: 34, minZone: 8 },
  { name: "Void Colossus",      emoji: "", baseHp: 195, baseAttack: 38, baseDefense: 38, minZone: 8 },
  { name: "Realm Stalker",      emoji: "", baseHp: 155, baseAttack: 46, baseDefense: 22, minZone: 8 },
  { name: "Dimensional Ripper", emoji: "", baseHp: 170, baseAttack: 43, baseDefense: 28, minZone: 8 },
  { name: "Paradox Beast",      emoji: "", baseHp: 180, baseAttack: 41, baseDefense: 32, minZone: 8 },
  { name: "Entropy Avatar",     emoji: "", baseHp: 160, baseAttack: 45, baseDefense: 25, minZone: 8 },
  { name: "Rift Stalker",       emoji: "", baseHp: 172, baseAttack: 44, baseDefense: 29, minZone: 8 },
  { name: "Chaos Wraith",       emoji: "", baseHp: 162, baseAttack: 46, baseDefense: 24, minZone: 8 },
  { name: "Shattered Colossus", emoji: "", baseHp: 200, baseAttack: 40, baseDefense: 36, minZone: 8 },
  { name: "Paradox Shade",      emoji: "", baseHp: 158, baseAttack: 47, baseDefense: 22, minZone: 8 },

  // Zone 9 — Eternal Sanctum (levels 250–349)
  { name: "Eternal Sentinel",   emoji: "", baseHp: 210, baseAttack: 52, baseDefense: 38, minZone: 9 },
  { name: "Time Ravager",       emoji: "", baseHp: 195, baseAttack: 56, baseDefense: 32, minZone: 9 },
  { name: "Fate Weaver",        emoji: "", baseHp: 220, baseAttack: 50, baseDefense: 40, minZone: 9 },
  { name: "Cosmic Predator",    emoji: "", baseHp: 200, baseAttack: 54, baseDefense: 36, minZone: 9 },
  { name: "Soul Colossus",      emoji: "", baseHp: 230, baseAttack: 48, baseDefense: 45, minZone: 9 },
  { name: "Infinite Shade",     emoji: "", baseHp: 188, baseAttack: 58, baseDefense: 28, minZone: 9 },
  { name: "Sanctum Guardian",   emoji: "", baseHp: 240, baseAttack: 46, baseDefense: 50, minZone: 9 },
  { name: "Void Prophet",       emoji: "", baseHp: 198, baseAttack: 55, baseDefense: 34, minZone: 9 },
  { name: "Eternal Revenant",   emoji: "", baseHp: 215, baseAttack: 53, baseDefense: 40, minZone: 9 },
  { name: "Temporal Fiend",     emoji: "", baseHp: 200, baseAttack: 57, baseDefense: 33, minZone: 9 },
  { name: "Void Arbiter",       emoji: "", baseHp: 205, baseAttack: 55, baseDefense: 35, minZone: 9 },
  { name: "Sanctum Horror",     emoji: "", baseHp: 225, baseAttack: 50, baseDefense: 43, minZone: 9 },

  // Zone 10 — The Infinite Void (levels 350–499)
  { name: "Void God",           emoji: "", baseHp: 260, baseAttack: 65, baseDefense: 48, minZone: 10 },
  { name: "Endless Horror",     emoji: "", baseHp: 245, baseAttack: 68, baseDefense: 42, minZone: 10 },
  { name: "Null Titan",         emoji: "", baseHp: 280, baseAttack: 62, baseDefense: 54, minZone: 10 },
  { name: "Infinity Wraith",    emoji: "", baseHp: 230, baseAttack: 72, baseDefense: 36, minZone: 10 },
  { name: "The Nameless",       emoji: "", baseHp: 270, baseAttack: 64, baseDefense: 50, minZone: 10 },
  { name: "Oblivion God",       emoji: "", baseHp: 255, baseAttack: 66, baseDefense: 46, minZone: 10 },
  { name: "Eternal Devourer",   emoji: "", baseHp: 290, baseAttack: 60, baseDefense: 56, minZone: 10 },
  { name: "Chaos Primordial",   emoji: "", baseHp: 240, baseAttack: 70, baseDefense: 40, minZone: 10 },
  { name: "The Formless",       emoji: "", baseHp: 272, baseAttack: 66, baseDefense: 51, minZone: 10 },
  { name: "Primordial Shade",   emoji: "", baseHp: 242, baseAttack: 71, baseDefense: 38, minZone: 10 },
  { name: "Chaos Specter",      emoji: "", baseHp: 235, baseAttack: 73, baseDefense: 37, minZone: 10 },
  { name: "Infinite Abyss",     emoji: "", baseHp: 260, baseAttack: 64, baseDefense: 52, minZone: 10 },

  // Zone 11 — Primordial Chaos (levels 500–749)
  { name: "Chaos Titan",        emoji: "", baseHp: 320, baseAttack: 80, baseDefense: 60, minZone: 11 },
  { name: "Primordial Revenant",emoji: "", baseHp: 300, baseAttack: 85, baseDefense: 55, minZone: 11 },
  { name: "Entropy Incarnate",  emoji: "", baseHp: 285, baseAttack: 90, baseDefense: 50, minZone: 11 },
  { name: "Void Annihilator",   emoji: "", baseHp: 340, baseAttack: 78, baseDefense: 65, minZone: 11 },
  { name: "Realm Destroyer",    emoji: "", baseHp: 310, baseAttack: 82, baseDefense: 58, minZone: 11 },
  { name: "Time Annihilator",   emoji: "", baseHp: 295, baseAttack: 87, baseDefense: 52, minZone: 11 },
  { name: "Chaos Oracle",       emoji: "", baseHp: 270, baseAttack: 95, baseDefense: 45, minZone: 11 },
  { name: "Primordial Fiend",   emoji: "", baseHp: 330, baseAttack: 76, baseDefense: 70, minZone: 11 },

  // Zone 12 — The Eternal Darkness (levels 750+)
  { name: "Eternal Void",       emoji: "", baseHp: 380, baseAttack: 95, baseDefense: 72, minZone: 12 },
  { name: "Dark Absolute",      emoji: "", baseHp: 360, baseAttack: 100,baseDefense: 65, minZone: 12 },
  { name: "The Primordial",     emoji: "", baseHp: 420, baseAttack: 88, baseDefense: 80, minZone: 12 },
  { name: "Undying Chaos",      emoji: "", baseHp: 350, baseAttack: 102,baseDefense: 60, minZone: 12 },
  { name: "Void Absolute",      emoji: "", baseHp: 400, baseAttack: 93, baseDefense: 76, minZone: 12 },
  { name: "Eternal Fiend",      emoji: "", baseHp: 340, baseAttack: 105,baseDefense: 55, minZone: 12 },
  { name: "Dark Primordial",    emoji: "", baseHp: 390, baseAttack: 91, baseDefense: 74, minZone: 12 },
  { name: "The Nameless Void",  emoji: "", baseHp: 330, baseAttack: 110,baseDefense: 50, minZone: 12 },
];

export const BOSS_MONSTERS: MonsterTemplate[] = [
  // Zone 1 bosses
  { name: "Bone Colossus",           emoji: "", baseHp: 120,  baseAttack: 14,  baseDefense: 12,  isBoss: true, minZone: 1 },
  { name: "Giant Forest Troll",      emoji: "", baseHp: 110,  baseAttack: 12,  baseDefense: 14,  isBoss: true, minZone: 1 },
  { name: "Ancient Barrow King",     emoji: "", baseHp: 130,  baseAttack: 13,  baseDefense: 14,  isBoss: true, minZone: 1 },
  // Zone 2 bosses
  { name: "Ancient Wyrm",            emoji: "", baseHp: 130,  baseAttack: 18,  baseDefense: 10,  isBoss: true, minZone: 2 },
  { name: "Plague Harbinger",        emoji: "", baseHp: 115,  baseAttack: 20,  baseDefense: 8,   isBoss: true, minZone: 2 },
  { name: "Deep Troll Shaman",       emoji: "", baseHp: 145,  baseAttack: 15,  baseDefense: 18,  isBoss: true, minZone: 2 },
  // Zone 3 bosses
  { name: "Demon Overlord",          emoji: "", baseHp: 140,  baseAttack: 20,  baseDefense: 14,  isBoss: true, minZone: 3 },
  { name: "Shadow Titan",            emoji: "", baseHp: 160,  baseAttack: 17,  baseDefense: 20,  isBoss: true, minZone: 3 },
  { name: "Undead Lich",             emoji: "", baseHp: 120,  baseAttack: 26,  baseDefense: 8,   isBoss: true, minZone: 3 },
  { name: "Plague Baron",            emoji: "", baseHp: 145,  baseAttack: 22,  baseDefense: 12,  isBoss: true, minZone: 3 },
  // Zone 4 bosses
  { name: "Elder Dragon King",       emoji: "", baseHp: 200,  baseAttack: 24,  baseDefense: 18,  isBoss: true, minZone: 4 },
  { name: "Void Tyrant",             emoji: "", baseHp: 175,  baseAttack: 28,  baseDefense: 15,  isBoss: true, minZone: 4 },
  { name: "Abyssal Overlord",        emoji: "", baseHp: 190,  baseAttack: 22,  baseDefense: 22,  isBoss: true, minZone: 4 },
  { name: "Infernal Titan",          emoji: "", baseHp: 195,  baseAttack: 26,  baseDefense: 20,  isBoss: true, minZone: 4 },
  // Zone 5 bosses
  { name: "Cosmic Destroyer",        emoji: "", baseHp: 280,  baseAttack: 34,  baseDefense: 24,  isBoss: true, minZone: 5 },
  { name: "Void Incarnate",          emoji: "", baseHp: 320,  baseAttack: 32,  baseDefense: 28,  isBoss: true, minZone: 5 },
  { name: "The Transcendent",        emoji: "", baseHp: 400,  baseAttack: 40,  baseDefense: 30,  isBoss: true, minZone: 5 },
  { name: "Entropy Lord",            emoji: "", baseHp: 350,  baseAttack: 36,  baseDefense: 26,  isBoss: true, minZone: 5 },
  // Zone 6 bosses
  { name: "Archangel of Ruin",       emoji: "", baseHp: 450,  baseAttack: 42,  baseDefense: 32,  isBoss: true, minZone: 6 },
  { name: "Celestial Tyrant",        emoji: "", baseHp: 500,  baseAttack: 38,  baseDefense: 40,  isBoss: true, minZone: 6 },
  { name: "Celestial Annihilator",   emoji: "", baseHp: 520,  baseAttack: 40,  baseDefense: 36,  isBoss: true, minZone: 6 },
  // Zone 7 bosses
  { name: "Abyss Leviathan",         emoji: "", baseHp: 580,  baseAttack: 48,  baseDefense: 38,  isBoss: true, minZone: 7 },
  { name: "The Depths Incarnate",    emoji: "", baseHp: 640,  baseAttack: 45,  baseDefense: 46,  isBoss: true, minZone: 7 },
  { name: "Kraken Lord",             emoji: "", baseHp: 620,  baseAttack: 50,  baseDefense: 42,  isBoss: true, minZone: 7 },
  // Zone 8 bosses
  { name: "Reality Shatterer",       emoji: "", baseHp: 720,  baseAttack: 56,  baseDefense: 48,  isBoss: true, minZone: 8 },
  { name: "Chaos Incarnate",         emoji: "", baseHp: 780,  baseAttack: 52,  baseDefense: 55,  isBoss: true, minZone: 8 },
  { name: "The Reality Eater",       emoji: "", baseHp: 800,  baseAttack: 54,  baseDefense: 52,  isBoss: true, minZone: 8 },
  // Zone 9 bosses
  { name: "The Eternal",             emoji: "", baseHp: 880,  baseAttack: 65,  baseDefense: 58,  isBoss: true, minZone: 9 },
  { name: "Fate's End",              emoji: "", baseHp: 950,  baseAttack: 62,  baseDefense: 65,  isBoss: true, minZone: 9 },
  { name: "The Undying",             emoji: "", baseHp: 920,  baseAttack: 63,  baseDefense: 62,  isBoss: true, minZone: 9 },
  // Zone 10 bosses
  { name: "The Void Absolute",       emoji: "", baseHp: 1100, baseAttack: 78,  baseDefense: 68,  isBoss: true, minZone: 10 },
  { name: "Infinite Destroyer",      emoji: "", baseHp: 1250, baseAttack: 75,  baseDefense: 75,  isBoss: true, minZone: 10 },
  { name: "The Undying End",         emoji: "", baseHp: 1400, baseAttack: 85,  baseDefense: 72,  isBoss: true, minZone: 10 },
  { name: "Oblivion Incarnate",      emoji: "", baseHp: 1350, baseAttack: 80,  baseDefense: 70,  isBoss: true, minZone: 10 },
  // Zone 11 bosses
  { name: "The Chaos Absolute",      emoji: "", baseHp: 1600, baseAttack: 100, baseDefense: 85,  isBoss: true, minZone: 11 },
  { name: "Primordial Annihilator",  emoji: "", baseHp: 1800, baseAttack: 95,  baseDefense: 92,  isBoss: true, minZone: 11 },
  // Zone 12 bosses
  { name: "The Eternal End",         emoji: "", baseHp: 2200, baseAttack: 120, baseDefense: 100, isBoss: true, minZone: 12 },
  { name: "Absolute Darkness",       emoji: "", baseHp: 2500, baseAttack: 115, baseDefense: 110, isBoss: true, minZone: 12 },
  { name: "The Primordial Darkness", emoji: "", baseHp: 2000, baseAttack: 125, baseDefense: 95,  isBoss: true, minZone: 12 },
];

export interface SpawnedMonster {
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  isBoss: boolean;
  zone: number;
  zoneName: string;
}

// Difficulty multiplier per zone — later zones hit harder and have more HP,
// creating genuine pressure to upgrade gear before pushing to the next area.
const BASE_ZONE_MULTS: Record<number, number> = {
  1: 1.0,  2: 1.3,  3: 1.65, 4: 2.1,  5: 2.8,
  6: 4.0,  7: 6.0,  8: 8.8,  9: 13.0, 10: 18.5,
  11: 27.0, 12: 38.0,
};

/** Difficulty multiplier for any zone (zones 13+ scale by 1.4× per zone) */
function getZoneDifficultyMult(zoneId: number): number {
  if (zoneId <= 12) return BASE_ZONE_MULTS[zoneId] ?? 1.0;
  return 27.0 * Math.pow(1.4, zoneId - 12);
}

// ── Infinite-zone monster name parts ──────────────────────────────────────
const INF_MON_ADJECTIVES = [
  "Abyssal", "Void", "Eternal", "Cosmic", "Ancient", "Primordial",
  "Transcendent", "Eldritch", "Ruinous", "Forsaken", "Boundless",
  "Cataclysmic", "Omnipotent", "Celestial", "Null",
];
const INF_MON_NOUNS = [
  "Colossus", "Leviathan", "Wraith", "Behemoth", "Titan", "Specter",
  "Devourer", "Revenant", "Annihilator", "Obliterator", "Ravager",
  "Destroyer", "Nemesis", "Sovereign", "Overlord",
];
const INF_BOSS_NOUNS = [
  "God-King", "Void Emperor", "Eternal Tyrant", "Cosmic Sovereign",
  "Abyss Lord", "World Ender", "Chaos Incarnate", "Null Arbiter",
  "Primordial Despot", "Eldritch Overlord",
];

function randomInfMonster(zoneId: number, isBoss: boolean): { name: string; baseHp: number; baseAttack: number; baseDefense: number } {
  const seed = zoneId * 1337;
  const adj  = INF_MON_ADJECTIVES[seed % INF_MON_ADJECTIVES.length];
  const noun = isBoss
    ? INF_BOSS_NOUNS[(seed * 7) % INF_BOSS_NOUNS.length]
    : INF_MON_NOUNS[(seed * 3) % INF_MON_NOUNS.length];
  return {
    name: `${adj} ${noun}`,
    baseHp:      30,
    baseAttack:  8,
    baseDefense: 3,
  };
}

export function spawnMonster(playerLevel: number, options?: { forcedNoBoss?: boolean }): SpawnedMonster {
  const currentZone = getZone(playerLevel);
  const isBoss = !options?.forcedNoBoss && Math.random() < 0.08;

  const monsterLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);
  const scale = 1 + (monsterLevel - 1) * 0.2;
  const zoneMult = getZoneDifficultyMult(currentZone.id);

  let name: string, emoji: string, baseHp: number, baseAttack: number, baseDefense: number, isBossFlag: boolean;

  if (currentZone.id > 12) {
    // Infinite zones: use procedurally generated monsters
    const inf = randomInfMonster(currentZone.id, isBoss);
    name = inf.name;
    emoji = "";
    baseHp = inf.baseHp;
    baseAttack = inf.baseAttack;
    baseDefense = inf.baseDefense;
    isBossFlag = isBoss;
  } else {
    // Named zones 1-12: use curated pools
    const pool = isBoss ? BOSS_MONSTERS : REGULAR_MONSTERS;
    const zonePool = pool.filter(m => {
      const mz = m.minZone ?? 1;
      return mz <= currentZone.id && mz >= Math.max(1, currentZone.id - 1);
    });
    const finalPool = zonePool.length > 0 ? zonePool : pool.filter(m => (m.minZone ?? 1) <= currentZone.id);
    const template = finalPool[Math.floor(Math.random() * finalPool.length)];
    name = template.name;
    emoji = template.emoji;
    baseHp = template.baseHp;
    baseAttack = template.baseAttack;
    baseDefense = template.baseDefense;
    isBossFlag = !!template.isBoss;
  }

  const hp = Math.round(baseHp * scale * zoneMult);
  return {
    name,
    emoji,
    hp,
    maxHp: hp,
    attack:  Math.round(baseAttack  * scale * zoneMult),
    defense: Math.round(baseDefense * scale * zoneMult),
    level: monsterLevel,
    isBoss: isBossFlag,
    zone: currentZone.id,
    zoneName: currentZone.name,
  };
}

// ─── Loot ────────────────────────────────────────────────────────────────────

export interface LootItem {
  name: string;
  rarity: Rarity;
  emoji: string;
  goldValue: number;
  type: ItemType;
  statBonus: number;
}

const ITEM_EMOJIS: Record<string, string> = {
  // ── Weapons ──────────────────────────────────────────────────────────────
  "Iron Sword": "🗡️",      "Wooden Club": "🪵",        "Short Bow": "🏹",
  "Rusty Dagger": "🔪",    "Cracked Staff": "🪄",       "Bone Club": "🦴",
  "Steel Sword": "⚔️",     "Bronze Spear": "🗡️",        "Hunter's Bow": "🏹",
  "Steel Dagger": "🔪",    "War Hammer": "🔨",           "Iron Halberd": "🪚",
  "Flaming Sword": "🔥",   "Shadow Blade": "🌙",         "Crystal Wand": "🔮",
  "Storm Bow": "⚡",        "Venomfang": "🐍",            "Cursed Blade": "💀",
  "Dragon Blade": "🐉",    "Void Reaver": "🕳️",          "Thunder Staff": "⛈️",
  "Phoenix Talon": "🦅",   "Soulripper": "👁️",           "Chaos Saber": "🌀",
  "Excalibur": "✨",        "Mjolnir": "⚡",              "Staff of the Void": "🌌",
  "Apollyon's Fang": "🩸", "Godslayer": "🔱",             "Cosmic Blade": "🌠",
  "Wrath of the Ancients": "🔥",
  // Divine weapons
  "Seraph's Edge": "🕊️",  "Heaven's Wrath": "☀️",      "Celestial Glaive": "⭐",
  "Sunfire Blade": "🌞",   "Divine Lance": "✝️",
  // Abyssal weapons
  "Void Annihilator": "🕳️","Abyssal Scythe": "🌑",      "Extinction Blade": "🌊",
  "Soul Eater": "💀",       "The Unmaking": "⚫",
  // Transcendent weapons
  "Omega Blade": "💠",      "Reality Shatter": "🌌",     "Genesis Sword": "💫",
  "The Last Word": "🔮",    "Infinity Edge": "🌀",

  // ── Gloves ───────────────────────────────────────────────────────────────
  "Leather Gloves": "🧤",  "Cloth Wraps": "🤲",          "Studded Gauntlets": "🧤",
  "Hunter's Gloves": "🤺", "Iron Knuckles": "✊",         "Chain Gauntlets": "⛓️",
  "Flaming Gauntlets": "🔥","Shadow Wraps": "🌙",         "Cursed Grips": "💀",
  "Dragon Claws": "🐉",    "Void Gauntlets": "🕳️",       "Titan Gauntlets": "⚒️",
  "Chaos Grips": "🌀",     "Celestial Wraps": "✨",       "Godhand": "🌠",
  // Divine gloves
  "Seraph's Touch": "🕊️", "Heaven's Grip": "☀️",        "Angelic Gauntlets": "⭐",
  // Abyssal gloves
  "Void Claws": "🕳️",     "Abyss Grips": "⚫",           "Nihil Gauntlets": "🌑",
  // Transcendent gloves
  "Hands of Fate": "💠",   "Infinity Grasp": "🌌",        "Genesis Grips": "💫",

  // ── Rings ────────────────────────────────────────────────────────────────
  "Iron Ring": "💍",        "Stone Band": "🪨",            "Copper Band": "💫",
  "Silver Ring": "💍",      "Enchanted Band": "🌀",        "Warrior's Signet": "⚔️",
  "Flaming Ring": "🔥",     "Shadow Band": "🌙",            "Cursed Circlet": "💀",
  "Dragon Ring": "🐉",      "Void Circlet": "🕳️",          "Storm Band": "⚡",
  "Ring of Divinity": "🌟", "Ring of Power": "⚡",          "Cosmic Ring": "🌌",
  "Omega Ring": "💠",
  // Divine rings
  "Halo Band": "🕊️",       "Seraph's Signet": "☀️",      "Celestial Ring": "⭐",
  // Abyssal rings
  "Void Pact Ring": "🕳️",  "Abyssal Signet": "⚫",        "Ring of Annihilation": "🌑",
  // Transcendent rings
  "Ring of Infinity": "💠", "Fate's Seal": "🌌",           "Eternity Band": "💫",

  // ── Armor ────────────────────────────────────────────────────────────────
  "Leather Vest": "🥋",     "Cloth Robe": "👘",            "Padded Tunic": "🧥",
  "Chain Mail": "⛓️",       "Bronze Plate": "🛡️",          "Iron Cuirass": "🛡️",
  "Shadow Plate": "🌙",     "Dragon Scale": "🐲",           "Cursed Plate": "💀",
  "Abyssal Plate": "🕳️",   "Phoenix Armor": "🔥",          "Chaos Plate": "🌀",
  "Aegis of the Gods": "🛡️","Dragonlord Plate": "🐉",      "Primordial Armor": "🌋",
  // Divine armor
  "Seraph's Plate": "🕊️",  "Heaven's Guard": "☀️",        "Celestial Mail": "⭐",
  "Holy Breastplate": "✝️", "Angelic Cuirass": "🌟",
  // Abyssal armor
  "Void Carapace": "🕳️",   "Abyssal Shell": "⚫",          "Nihil Plate": "🌑",
  "Oblivion Armor": "🌊",
  // Transcendent armor
  "Omega Plate": "💠",      "Reality Shell": "🌌",          "Genesis Armor": "💫",

  // ── Boots ────────────────────────────────────────────────────────────────
  "Leather Boots": "👢",    "Cloth Sandals": "👡",          "Wooden Clogs": "🪵",
  "Steel Boots": "⛓️",      "Hunter's Boots": "🥾",         "Iron Greaves": "🥾",
  "Swift Treads": "💨",     "Shadow Boots": "🌙",            "Cursed Greaves": "💀",
  "Dragon Boots": "🐉",     "Abyssal Treads": "🕳️",         "Storm Greaves": "⚡",
  "Boots of Swiftness": "⚡","Celestial Boots": "✨",         "Cosmic Treads": "🌠",
  // Divine boots
  "Seraph's Steps": "🕊️",  "Heaven's Stride": "☀️",       "Celestial Greaves": "⭐",
  // Abyssal boots
  "Void Walkers": "🕳️",    "Nihil Steps": "🌑",
  // Transcendent boots
  "Boots of Infinity": "💠","Fate's Stride": "🌌",           "Eternity Treads": "💫",

  // ── Amulets ──────────────────────────────────────────────────────────────
  "Iron Pendant": "📿",     "Stone Amulet": "🪨",           "Wooden Charm": "🌿",
  "Silver Pendant": "🔮",   "Enchanted Amulet": "🔮",       "Hunter's Charm": "🌿",
  "Void Pendant": "🌀",     "Crystal Amulet": "💎",         "Cursed Talisman": "💀",
  "Dragon's Eye": "👁️",    "Abyssal Stone": "🌑",           "Storm Medallion": "⚡",
  "Amulet of Divinity": "🌟","Celestial Pendant": "✨",      "Cosmic Medallion": "🌌",
  // Divine amulets
  "Seraph's Token": "🕊️",  "Heaven's Charm": "☀️",        "Celestial Medallion": "⭐",
  "Holy Amulet": "✝️",      "Angelic Pendant": "🌟",
  // Abyssal amulets
  "Void Heart": "🕳️",      "Abyssal Core": "⚫",            "Nihil Pendant": "🌑",
  "Oblivion Stone": "🌊",
  // Transcendent amulets
  "Omega Charm": "💠",      "Reality Shard": "🌌",           "Genesis Stone": "💫",
  "The Absolute": "🌀",

  // ── Cosmic weapons/armor/etc ──────────────────────────────────────────────
  "Starforged Blade": "⭐",      "Cosmic Annihilator": "🌌",   "Nebula Scythe": "🌀",
  "Quasar Lance": "🌠",          "Galactic Destroyer": "💫",
  "Nebula Grasp": "🤲",          "Stardust Wraps": "✨",        "Cosmic Fist": "⭐",
  "Cosmic Signet": "🌌",         "Stellar Band": "🌠",          "Galaxy Ring": "💫",
  "Cosmic Carapace": "🛡️",       "Stellar Plate": "⭐",         "Nebula Shell": "🌌",
  "Cosmic Striders": "🌠",       "Stellar Steps": "⭐",         "Nebula Greaves": "💫",
  "Cosmic Heart": "❤️‍🔥",          "Stellar Core": "⭐",          "Nebula Shard": "🌌",

  // ── Eternal weapons/armor/etc ─────────────────────────────────────────────
  "Eternal Blade": "🗡️",         "The Primordial Sword": "⚔️",  "End of All Things": "🌑",
  "Destroyer of Worlds": "💀",    "Eternity Breaker": "🔱",
  "Eternal Grasp": "🤲",         "Hand of Creation": "✋",       "Primordial Grip": "⚫",
  "Eternal Signet": "🔱",        "Ring of Creation": "🌑",      "Primordial Band": "⚫",
  "Eternal Plate": "🛡️",         "Creation's Guard": "🔱",      "Primordial Shell": "⚫",
  "Eternal Treads": "👢",         "Steps of Creation": "🔱",     "Primordial Walkers": "⚫",
  "Eternal Heart": "💔",          "Soul of Creation": "🔱",      "Primordial Core": "⚫",

  // ── Primordial weapons/armor/etc ──────────────────────────────────────────
  "Godforged Blade": "⚔️",        "The First Sword": "🗡️",       "Axiom Edge": "✨",
  "World Splitter": "💥",         "Origin Blade": "🌟",           "Creation's Fury": "🔱",
  "The Living Blade": "💫",
  "Godforged Grasp": "✊",        "The First Hands": "🙌",        "Axiom Gauntlets": "⚡",
  "Ring of First Cause": "💫",   "Godforged Signet": "🔱",       "The First Seal": "🌟",
  "Godforged Plate": "🛡️",        "The First Aegis": "🌟",        "Axiom Shell": "💠",
  "Godforged Stride": "👢",       "The First Steps": "✨",        "Axiom Treads": "💠",
  "Godforged Core": "💎",         "The First Principle": "🌟",    "Axiom Heart": "❤️",
  "Godforged Fragment": "💎",     "Axiom Core": "💠",

  // ── Omnipotent weapons/armor/etc ──────────────────────────────────────────
  "The Supreme Sword": "⚔️",      "Omnipotent Edge": "🌌",        "That Which Cuts All": "💀",
  "The Unstoppable": "💫",        "Beyond All Blades": "🌠",       "The Final Weapon": "🔱",
  "Infinite Dominion Edge": "💠",
  "Omnipotent Grasp": "🤲",       "That Which Holds All": "✊",   "The Unbreakable Grip": "💠",
  "Omnipotent Signet": "💍",      "That Which Binds All": "🌌",   "The Ultimate Seal": "🔱",
  "Omnipotent Plate": "🛡️",       "That Which Shields All": "💠", "The Unbreakable Aegis": "🌌",
  "Omnipotent Stride": "👢",      "That Which Steps Beyond": "💫","The Boundless Walk": "🌌",
  "Omnipotent Core": "💎",        "That Which Powers All": "🌌",  "The Infinite Soul": "✨",
  "Omnipotent Shard": "💠",

  // ── Zone 11/12 boss drops ────────────────────────────────────────────────
  "Shard of Primordial Chaos": "",     "Chaos Absolute's Core": "",
  "Primordial Annihilator Fang": "",   "Fragment of Eternal Darkness": "",
  "Absolute End's Seal": "",           "Primordial Darkness Core": "",

  // ── Boss unique drops ─────────────────────────────────────────────────────
  "Colossus Bone Fragment": "",         "Wyrm Scale Trophy": "",
  "Overlord's Seal": "👿",              "Shadow Titan's Core": "🌑",
  "Lich's Phylactery": "🔮",            "Troll King's Knuckle": "🧌",
  "Plague Mask": "☣️",                  "Dragon King's Scale": "🐲",
  "Void Tyrant's Crown": "🌀",          "Abyssal Overlord's Heart": "⚫",
  "Cosmic Destroyer Fragment": "💫",    "Void Shard": "🌌",
  "Transcendent Relic": "✨",
  // Zone 6 boss drops
  "Archangel Feather": "🕊️",            "Celestial Tyrant's Halo": "⭐",
  // Zone 7 boss drops
  "Abyss Leviathan Scale": "🌊",        "Depths Core": "🌑",
  // Zone 8 boss drops
  "Fractured Reality Shard": "🌌",      "Shard of Chaos": "🌀",
  // Zone 9 boss drops
  "Eternity Fragment": "🔱",            "Fate's Tear": "⏳",
  // Zone 10 boss drops
  "Void Absolute's Core": "🕳️",         "The Infinite Shard": "💠",
};

function getEmoji(name: string): string {
  return ITEM_EMOJIS[name] ?? "🎁";
}

const LOOT_POOL: Record<Rarity, Record<ItemType, string[]>> = {
  Common: {
    weapon: ["Iron Sword", "Wooden Club", "Short Bow", "Rusty Dagger", "Cracked Staff", "Bone Club"],
    gloves: ["Leather Gloves", "Cloth Wraps", "Iron Knuckles"],
    ring:   ["Iron Ring", "Stone Band", "Copper Band"],
    armor:  ["Leather Vest", "Cloth Robe", "Padded Tunic"],
    boots:  ["Leather Boots", "Cloth Sandals", "Wooden Clogs"],
    amulet: ["Iron Pendant", "Stone Amulet", "Wooden Charm"],
  },
  Uncommon: {
    weapon: ["Steel Sword", "Bronze Spear", "Hunter's Bow", "Steel Dagger", "War Hammer", "Iron Halberd"],
    gloves: ["Studded Gauntlets", "Hunter's Gloves", "Chain Gauntlets"],
    ring:   ["Silver Ring", "Enchanted Band", "Warrior's Signet"],
    armor:  ["Chain Mail", "Bronze Plate", "Iron Cuirass"],
    boots:  ["Steel Boots", "Hunter's Boots", "Iron Greaves"],
    amulet: ["Silver Pendant", "Enchanted Amulet", "Hunter's Charm"],
  },
  Rare: {
    weapon: ["Flaming Sword", "Shadow Blade", "Crystal Wand", "Storm Bow", "Venomfang", "Cursed Blade"],
    gloves: ["Flaming Gauntlets", "Shadow Wraps", "Cursed Grips"],
    ring:   ["Flaming Ring", "Shadow Band", "Cursed Circlet"],
    armor:  ["Shadow Plate", "Dragon Scale", "Cursed Plate"],
    boots:  ["Swift Treads", "Shadow Boots", "Cursed Greaves"],
    amulet: ["Void Pendant", "Crystal Amulet", "Cursed Talisman"],
  },
  Epic: {
    weapon: ["Dragon Blade", "Void Reaver", "Thunder Staff", "Phoenix Talon", "Soulripper", "Chaos Saber"],
    gloves: ["Dragon Claws", "Void Gauntlets", "Chaos Grips"],
    ring:   ["Dragon Ring", "Void Circlet", "Storm Band"],
    armor:  ["Abyssal Plate", "Phoenix Armor", "Chaos Plate"],
    boots:  ["Dragon Boots", "Abyssal Treads", "Storm Greaves"],
    amulet: ["Dragon's Eye", "Abyssal Stone", "Storm Medallion"],
  },
  Legendary: {
    weapon: ["Excalibur", "Mjolnir", "Staff of the Void", "Apollyon's Fang", "Godslayer"],
    gloves: ["Titan Gauntlets", "Celestial Wraps"],
    ring:   ["Ring of Divinity", "Ring of Power", "Omega Ring"],
    armor:  ["Aegis of the Gods", "Dragonlord Plate"],
    boots:  ["Boots of Swiftness", "Celestial Boots"],
    amulet: ["Amulet of Divinity", "Celestial Pendant"],
  },
  Mythic: {
    weapon: ["Cosmic Blade", "Wrath of the Ancients"],
    gloves: ["Godhand"],
    ring:   ["Cosmic Ring"],
    armor:  ["Primordial Armor"],
    boots:  ["Cosmic Treads"],
    amulet: ["Cosmic Medallion"],
  },
  Divine: {
    weapon: ["Seraph's Edge", "Heaven's Wrath", "Celestial Glaive", "Sunfire Blade", "Divine Lance"],
    gloves: ["Seraph's Touch", "Heaven's Grip", "Angelic Gauntlets"],
    ring:   ["Halo Band", "Seraph's Signet", "Celestial Ring"],
    armor:  ["Seraph's Plate", "Heaven's Guard", "Celestial Mail", "Holy Breastplate", "Angelic Cuirass"],
    boots:  ["Seraph's Steps", "Heaven's Stride", "Celestial Greaves"],
    amulet: ["Seraph's Token", "Heaven's Charm", "Celestial Medallion", "Holy Amulet", "Angelic Pendant"],
  },
  Abyssal: {
    weapon: ["Void Annihilator", "Abyssal Scythe", "Extinction Blade", "Soul Eater", "The Unmaking"],
    gloves: ["Void Claws", "Abyss Grips", "Nihil Gauntlets"],
    ring:   ["Void Pact Ring", "Abyssal Signet", "Ring of Annihilation"],
    armor:  ["Void Carapace", "Abyssal Shell", "Nihil Plate", "Oblivion Armor"],
    boots:  ["Void Walkers", "Nihil Steps"],
    amulet: ["Void Heart", "Abyssal Core", "Nihil Pendant", "Oblivion Stone"],
  },
  Transcendent: {
    weapon: ["Omega Blade", "Reality Shatter", "Genesis Sword", "The Last Word", "Infinity Edge"],
    gloves: ["Hands of Fate", "Infinity Grasp", "Genesis Grips"],
    ring:   ["Ring of Infinity", "Fate's Seal", "Eternity Band"],
    armor:  ["Omega Plate", "Reality Shell", "Genesis Armor"],
    boots:  ["Boots of Infinity", "Fate's Stride", "Eternity Treads"],
    amulet: ["Omega Charm", "Reality Shard", "Genesis Stone", "The Absolute"],
  },
  Cosmic: {
    weapon: ["Starforged Blade", "Cosmic Annihilator", "Nebula Scythe", "Quasar Lance", "Galactic Destroyer", "Supernova Blade", "Pulsar Scythe"],
    gloves: ["Nebula Grasp", "Stardust Wraps", "Cosmic Fist", "Void Star Grasp"],
    ring:   ["Cosmic Signet", "Stellar Band", "Galaxy Ring", "Quasar Signet"],
    armor:  ["Cosmic Carapace", "Stellar Plate", "Nebula Shell", "Cosmic Fortress"],
    boots:  ["Cosmic Striders", "Stellar Steps", "Nebula Greaves", "Quasar Stride"],
    amulet: ["Cosmic Heart", "Stellar Core", "Nebula Shard", "Pulsar Core"],
  },
  Eternal: {
    weapon: ["Eternal Blade", "The Primordial Sword", "End of All Things", "Destroyer of Worlds", "Eternity Breaker", "Voidborn Edge", "The Final Reckoning"],
    gloves: ["Eternal Grasp", "Hand of Creation", "Primordial Grip", "Void Emperor's Grasp"],
    ring:   ["Eternal Signet", "Ring of Creation", "Primordial Band", "Ring of Eternal Void"],
    armor:  ["Eternal Plate", "Creation's Guard", "Primordial Shell", "Void Emperor's Plate"],
    boots:  ["Eternal Treads", "Steps of Creation", "Primordial Walkers", "Voidborn Treads"],
    amulet: ["Eternal Heart", "Soul of Creation", "Primordial Core", "Heart of the Abyss"],
  },
  Primordial: {
    weapon: ["Godforged Blade", "The First Sword", "Axiom Edge", "World Splitter", "Origin Blade", "Creation's Fury", "The Living Blade"],
    gloves: ["Godforged Grasp", "The First Hands", "Axiom Gauntlets"],
    ring:   ["Ring of First Cause", "Godforged Signet", "The First Seal"],
    armor:  ["Godforged Plate", "The First Aegis", "Axiom Shell"],
    boots:  ["Godforged Stride", "The First Steps", "Axiom Treads"],
    amulet: ["Godforged Core", "The First Principle", "Axiom Heart"],
  },
  Omnipotent: {
    weapon: ["The Supreme Sword", "Omnipotent Edge", "That Which Cuts All", "The Unstoppable", "Beyond All Blades", "The Final Weapon", "Infinite Dominion Edge"],
    gloves: ["Omnipotent Grasp", "That Which Holds All", "The Unbreakable Grip"],
    ring:   ["Omnipotent Signet", "That Which Binds All", "The Ultimate Seal"],
    armor:  ["Omnipotent Plate", "That Which Shields All", "The Unbreakable Aegis"],
    boots:  ["Omnipotent Stride", "That Which Steps Beyond", "The Boundless Walk"],
    amulet: ["Omnipotent Core", "That Which Powers All", "The Infinite Soul"],
  },
};

const BOSS_UNIQUE_DROPS: Array<{ name: string; type: ItemType; rarity: Rarity; minZone?: number }> = [
  { name: "Colossus Bone Fragment",       type: "amulet",  rarity: "Legendary", minZone: 1 },
  { name: "Troll King's Knuckle",         type: "gloves",  rarity: "Legendary", minZone: 1 },
  { name: "Wyrm Scale Trophy",            type: "armor",   rarity: "Legendary", minZone: 2 },
  { name: "Plague Mask",                  type: "armor",   rarity: "Epic",      minZone: 2 },
  { name: "Overlord's Seal",              type: "ring",    rarity: "Legendary", minZone: 3 },
  { name: "Shadow Titan's Core",          type: "amulet",  rarity: "Mythic",    minZone: 3 },
  { name: "Lich's Phylactery",            type: "ring",    rarity: "Mythic",    minZone: 3 },
  { name: "Dragon King's Scale",          type: "armor",   rarity: "Divine",    minZone: 4 },
  { name: "Void Tyrant's Crown",          type: "amulet",  rarity: "Divine",    minZone: 4 },
  { name: "Abyssal Overlord's Heart",     type: "amulet",  rarity: "Abyssal",      minZone: 5 },
  { name: "Cosmic Destroyer Fragment",    type: "ring",    rarity: "Abyssal",      minZone: 5 },
  { name: "Void Shard",                   type: "weapon",  rarity: "Abyssal",      minZone: 5 },
  { name: "Transcendent Relic",           type: "amulet",  rarity: "Transcendent", minZone: 5 },
  { name: "Archangel Feather",            type: "amulet",  rarity: "Transcendent", minZone: 6 },
  { name: "Celestial Tyrant's Halo",      type: "ring",    rarity: "Cosmic",       minZone: 6 },
  { name: "Abyss Leviathan Scale",        type: "armor",   rarity: "Cosmic",       minZone: 7 },
  { name: "Depths Core",                  type: "amulet",  rarity: "Cosmic",       minZone: 7 },
  { name: "Fractured Reality Shard",      type: "ring",    rarity: "Cosmic",       minZone: 8 },
  { name: "Shard of Chaos",               type: "weapon",  rarity: "Cosmic",       minZone: 8 },
  { name: "Eternity Fragment",            type: "amulet",  rarity: "Eternal",      minZone: 9 },
  { name: "Fate's Tear",                  type: "ring",    rarity: "Eternal",      minZone: 9 },
  { name: "Void Absolute's Core",         type: "amulet",  rarity: "Eternal",      minZone: 10 },
  { name: "The Infinite Shard",           type: "weapon",  rarity: "Eternal",      minZone: 10 },
  // Zone 11 boss drops
  { name: "Shard of Primordial Chaos",    type: "amulet",  rarity: "Eternal",      minZone: 11 },
  { name: "Chaos Absolute's Core",        type: "ring",    rarity: "Eternal",      minZone: 11 },
  { name: "Primordial Annihilator Fang",  type: "weapon",  rarity: "Eternal",      minZone: 11 },
  // Zone 12 boss drops
  { name: "Fragment of Eternal Darkness", type: "amulet",  rarity: "Eternal",      minZone: 12 },
  { name: "Absolute End's Seal",          type: "ring",    rarity: "Eternal",      minZone: 12 },
  { name: "Primordial Darkness Core",     type: "weapon",  rarity: "Eternal",      minZone: 12 },
  // Zone 13+ boss drops — Primordial and Omnipotent tiers
  { name: "Godforged Fragment",           type: "weapon",  rarity: "Primordial",   minZone: 13 },
  { name: "Axiom Core",                   type: "amulet",  rarity: "Primordial",   minZone: 13 },
  { name: "The First Seal",              type: "ring",    rarity: "Primordial",   minZone: 15 },
  { name: "Axiom Shell",                  type: "armor",   rarity: "Primordial",   minZone: 17 },
  { name: "The First Steps",             type: "boots",   rarity: "Primordial",   minZone: 19 },
  { name: "Axiom Gauntlets",              type: "gloves",  rarity: "Primordial",   minZone: 21 },
  { name: "Omnipotent Shard",             type: "weapon",  rarity: "Omnipotent",   minZone: 25 },
  { name: "The Ultimate Seal",           type: "ring",    rarity: "Omnipotent",   minZone: 30 },
  { name: "Omnipotent Core",              type: "amulet",  rarity: "Omnipotent",   minZone: 35 },
  { name: "The Unbreakable Aegis",        type: "armor",   rarity: "Omnipotent",   minZone: 40 },
  { name: "The Unbreakable Grip",         type: "gloves",  rarity: "Omnipotent",   minZone: 45 },
  { name: "The Boundless Walk",           type: "boots",   rarity: "Omnipotent",   minZone: 50 },
];

export const GOLD_VALUES: Record<Rarity, number> = {
  Common: 5, Uncommon: 15, Rare: 40, Epic: 100,
  Legendary: 300, Mythic: 1000,
  Divine: 3500, Abyssal: 9000, Transcendent: 25000,
  Cosmic: 100000, Eternal: 500000,
  Primordial: 5000000, Omnipotent: 25000000,
};

export const STAT_BONUSES: Record<Rarity, number> = {
  Common: 2, Uncommon: 5, Rare: 10, Epic: 20,
  Legendary: 40, Mythic: 80,
  Divine: 160, Abyssal: 320, Transcendent: 640,
  Cosmic: 1280, Eternal: 2560,
  Primordial: 5120, Omnipotent: 10240,
};

function pickItemType(): ItemType {
  const types: ItemType[] = ["weapon", "armor", "boots", "gloves", "amulet", "ring"];
  return types[Math.floor(Math.random() * types.length)];
}

export function rollLoot(isBoss = false, playerLevel = 1, luckLevel = 0): LootItem {
  const zone = getZone(playerLevel);
  // Luck shifts the rarity roll toward 0 (higher rarities); capped at 40% reduction
  const luckMod = Math.min(0.40, luckLevel * 0.02);

  // Boss loot: chance at unique drops
  if (isBoss) {
    const eligibleUniques = BOSS_UNIQUE_DROPS.filter(u => (u.minZone ?? 1) <= zone.id);
    if (eligibleUniques.length > 0 && Math.random() < 0.35) {
      const unique = eligibleUniques[Math.floor(Math.random() * eligibleUniques.length)];
      return {
        name: unique.name,
        rarity: unique.rarity,
        emoji: getEmoji(unique.name),
        goldValue: GOLD_VALUES[unique.rarity],
        type: unique.type,
        statBonus: STAT_BONUSES[unique.rarity],
      };
    }
  }

  let rarity: Rarity;

  // ── Infinite zones (13+) — Primordial/Omnipotent push in with zone depth ─
  if (zone.id > 12) {
    const roll = Math.random() * 100 * (1 - luckMod);
    // Each zone beyond 12 adds 1% toward top tiers, capped at zone 12+60 (zone 72)
    const depth = Math.min(60, zone.id - 12);
    const adjustedRoll = Math.max(0, roll - depth);
    if      (adjustedRoll < depth * 0.5)          rarity = "Omnipotent";
    else if (adjustedRoll < 10 + depth * 0.8)     rarity = "Primordial";
    else if (adjustedRoll < 55 + depth * 0.5)     rarity = "Eternal";
    else if (adjustedRoll < 85)                   rarity = "Cosmic";
    else                                           rarity = "Transcendent";
  } else if (isBoss) {
    // ── Boss table ── top tier rarer but meaningful when seen ──────────────
    const roll = Math.random() * 100 * (1 - luckMod);
    if (zone.id >= 12) {
      // Zone 12 boss: overwhelmingly Eternal
      if (roll < 85)      rarity = "Eternal";
      else                rarity = "Cosmic";
    } else if (zone.id >= 11) {
      // Zone 11 boss
      if (roll < 60)      rarity = "Eternal";
      else if (roll < 92) rarity = "Cosmic";
      else                rarity = "Transcendent";
    } else if (zone.id >= 10) {
      if (roll < 35)      rarity = "Eternal";
      else if (roll < 72) rarity = "Cosmic";
      else if (roll < 93) rarity = "Transcendent";
      else                rarity = "Abyssal";
    } else if (zone.id >= 9) {
      if (roll < 8)       rarity = "Eternal";
      else if (roll < 28) rarity = "Cosmic";
      else if (roll < 60) rarity = "Transcendent";
      else if (roll < 86) rarity = "Abyssal";
      else                rarity = "Divine";
    } else if (zone.id >= 8) {
      if (roll < 1.5)     rarity = "Eternal";
      else if (roll < 8)  rarity = "Cosmic";
      else if (roll < 28) rarity = "Transcendent";
      else if (roll < 60) rarity = "Abyssal";
      else if (roll < 88) rarity = "Divine";
      else                rarity = "Mythic";
    } else if (zone.id >= 7) {
      if (roll < 0.2)     rarity = "Eternal";
      else if (roll < 2)  rarity = "Cosmic";
      else if (roll < 14) rarity = "Transcendent";
      else if (roll < 42) rarity = "Abyssal";
      else if (roll < 72) rarity = "Divine";
      else if (roll < 92) rarity = "Mythic";
      else                rarity = "Legendary";
    } else if (zone.id >= 6) {
      if (roll < 0.5)     rarity = "Cosmic";
      else if (roll < 6)  rarity = "Transcendent";
      else if (roll < 28) rarity = "Abyssal";
      else if (roll < 58) rarity = "Divine";
      else if (roll < 84) rarity = "Mythic";
      else                rarity = "Legendary";
    } else if (zone.id >= 5) {
      if (roll < 2)       rarity = "Transcendent";
      else if (roll < 12) rarity = "Abyssal";
      else if (roll < 38) rarity = "Divine";
      else if (roll < 68) rarity = "Mythic";
      else if (roll < 90) rarity = "Legendary";
      else                rarity = "Epic";
    } else if (zone.id >= 4) {
      if (roll < 0.5)     rarity = "Abyssal";
      else if (roll < 6)  rarity = "Divine";
      else if (roll < 28) rarity = "Mythic";
      else if (roll < 60) rarity = "Legendary";
      else if (roll < 88) rarity = "Epic";
      else                rarity = "Rare";
    } else if (zone.id >= 3) {
      if (roll < 2)       rarity = "Divine";
      else if (roll < 12) rarity = "Mythic";
      else if (roll < 42) rarity = "Legendary";
      else if (roll < 80) rarity = "Epic";
      else if (roll < 97) rarity = "Rare";
      else                rarity = "Uncommon";
    } else if (zone.id >= 2) {
      if (roll < 1)       rarity = "Mythic";
      else if (roll < 12) rarity = "Legendary";
      else if (roll < 45) rarity = "Epic";
      else if (roll < 82) rarity = "Rare";
      else                rarity = "Uncommon";
    } else {
      // Zone 1 boss
      if (roll < 3)       rarity = "Legendary";
      else if (roll < 22) rarity = "Epic";
      else if (roll < 62) rarity = "Rare";
      else if (roll < 90) rarity = "Uncommon";
      else                rarity = "Common";
    }
  } else {
    // ── Regular kill ── truly rare top tiers, common baseline ─────────────
    const roll = Math.random() * 100 * (1 - luckMod);
    if (zone.id >= 12) {
      if (roll < 2)       rarity = "Eternal";
      else if (roll < 10) rarity = "Cosmic";
      else if (roll < 28) rarity = "Transcendent";
      else if (roll < 55) rarity = "Abyssal";
      else if (roll < 78) rarity = "Divine";
      else if (roll < 94) rarity = "Mythic";
      else                rarity = "Legendary";
    } else if (zone.id >= 11) {
      if (roll < 0.5)     rarity = "Eternal";
      else if (roll < 4)  rarity = "Cosmic";
      else if (roll < 15) rarity = "Transcendent";
      else if (roll < 36) rarity = "Abyssal";
      else if (roll < 60) rarity = "Divine";
      else if (roll < 82) rarity = "Mythic";
      else                rarity = "Legendary";
    } else if (zone.id >= 10) {
      if (roll < 0.1)     rarity = "Eternal";
      else if (roll < 1)  rarity = "Cosmic";
      else if (roll < 6)  rarity = "Transcendent";
      else if (roll < 18) rarity = "Abyssal";
      else if (roll < 40) rarity = "Divine";
      else if (roll < 68) rarity = "Mythic";
      else                rarity = "Legendary";
    } else if (zone.id >= 9) {
      if (roll < 0.03)    rarity = "Eternal";
      else if (roll < 0.3)rarity = "Cosmic";
      else if (roll < 2)  rarity = "Transcendent";
      else if (roll < 10) rarity = "Abyssal";
      else if (roll < 28) rarity = "Divine";
      else if (roll < 58) rarity = "Mythic";
      else                rarity = "Legendary";
    } else if (zone.id >= 8) {
      if (roll < 0.005)   rarity = "Eternal";
      else if (roll < 0.05) rarity = "Cosmic";
      else if (roll < 0.5)rarity = "Transcendent";
      else if (roll < 4)  rarity = "Abyssal";
      else if (roll < 16) rarity = "Divine";
      else if (roll < 42) rarity = "Mythic";
      else if (roll < 72) rarity = "Legendary";
      else                rarity = "Epic";
    } else if (zone.id >= 7) {
      if (roll < 0.001)   rarity = "Cosmic";
      else if (roll < 0.2)rarity = "Transcendent";
      else if (roll < 2)  rarity = "Abyssal";
      else if (roll < 9)  rarity = "Divine";
      else if (roll < 28) rarity = "Mythic";
      else if (roll < 58) rarity = "Legendary";
      else if (roll < 82) rarity = "Epic";
      else                rarity = "Rare";
    } else if (zone.id >= 6) {
      if (roll < 0.05)    rarity = "Transcendent";
      else if (roll < 0.5)rarity = "Abyssal";
      else if (roll < 3)  rarity = "Divine";
      else if (roll < 12) rarity = "Mythic";
      else if (roll < 32) rarity = "Legendary";
      else if (roll < 62) rarity = "Epic";
      else if (roll < 84) rarity = "Rare";
      else                rarity = "Uncommon";
    } else if (zone.id >= 5) {
      if (roll < 0.02)    rarity = "Abyssal";
      else if (roll < 0.3)rarity = "Divine";
      else if (roll < 2)  rarity = "Mythic";
      else if (roll < 8)  rarity = "Legendary";
      else if (roll < 28) rarity = "Epic";
      else if (roll < 60) rarity = "Rare";
      else if (roll < 84) rarity = "Uncommon";
      else                rarity = "Common";
    } else if (zone.id >= 4) {
      if (roll < 0.05)    rarity = "Divine";
      else if (roll < 0.5)rarity = "Mythic";
      else if (roll < 3)  rarity = "Legendary";
      else if (roll < 15) rarity = "Epic";
      else if (roll < 42) rarity = "Rare";
      else if (roll < 75) rarity = "Uncommon";
      else                rarity = "Common";
    } else if (zone.id >= 3) {
      if (roll < 0.05)    rarity = "Mythic";
      else if (roll < 0.5)rarity = "Legendary";
      else if (roll < 5)  rarity = "Epic";
      else if (roll < 22) rarity = "Rare";
      else if (roll < 55) rarity = "Uncommon";
      else                rarity = "Common";
    } else if (zone.id >= 2) {
      if (roll < 0.01)    rarity = "Mythic";
      else if (roll < 0.2)rarity = "Legendary";
      else if (roll < 2)  rarity = "Epic";
      else if (roll < 12) rarity = "Rare";
      else if (roll < 45) rarity = "Uncommon";
      else                rarity = "Common";
    } else {
      // Zone 1 — slow trickle of rarer items to reward progression
      if (roll < 0.005)   rarity = "Mythic";
      else if (roll < 0.1)rarity = "Legendary";
      else if (roll < 1)  rarity = "Epic";
      else if (roll < 7)  rarity = "Rare";
      else if (roll < 28) rarity = "Uncommon";
      else                rarity = "Common";
    }
  }

  const itemType = pickItemType();
  const names = LOOT_POOL[rarity][itemType];
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    name,
    rarity,
    emoji: getEmoji(name),
    goldValue: GOLD_VALUES[rarity],
    type: itemType,
    statBonus: STAT_BONUSES[rarity],
  };
}

// ─── Player Formulas ─────────────────────────────────────────────────────────

export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.3, level - 1));
}

export function calcMaxHp(level: number): number {
  return 100 + (level - 1) * 15;
}

export function calcAttack(level: number, meleeSkillLevel = 1): number {
  return 10 + (level - 1) * 3 + (meleeSkillLevel - 1) * 3;
}

export function calcDefense(level: number, defenseSkillLevel = 1): number {
  return 5 + (level - 1) * 2 + (defenseSkillLevel - 1) * 2;
}

export const MELEE_SKILL_ATK_PER_LEVEL = 3;
export const DEFENSE_SKILL_DEF_PER_LEVEL = 2;

export function skillXpToNextLevel(skillLevel: number): number {
  return Math.floor(50 * Math.pow(1.5, skillLevel - 1));
}

export function calcDamage(attackerAttack: number, defenderDefense: number): number {
  // 8% of raw ATK always pierces regardless of DEF — prevents zero-damage scenarios
  // at high levels where defense would otherwise completely cancel monster attacks.
  const pierce = Math.max(1, Math.ceil(attackerAttack * 0.08));
  const base   = Math.max(pierce, attackerAttack - Math.floor(defenderDefense / 2));
  const variance = Math.floor(Math.random() * (base * 0.4)) - Math.floor(base * 0.2);
  return Math.max(1, base + variance);
}

// ─── Ascension ────────────────────────────────────────────────────────────────

export const ASCEND_MIN_LEVEL = 100;

/** XP multiplier from ascensions — 25% bonus per ascension level */
export function ascensionXpMultiplier(ascensionLevel: number): number {
  return 1 + ascensionLevel * 0.25;
}

/** Gold multiplier from ascensions — 15% bonus per ascension level */
export function ascensionGoldMultiplier(ascensionLevel: number): number {
  return 1 + ascensionLevel * 0.15;
}

// ─── Raids of Gods ────────────────────────────────────────────────────────────

export interface GodBoss {
  name: string;
  title: string;
  lore: string;
  minLevel: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  enrageMultiplier: number;
  enrageThreshold: number;
  phaseMessage: string;
  cooldownMinutes: number;
}

export const GOD_BOSSES: GodBoss[] = [
  {
    name: "Ares",
    title: "God of War",
    lore: "The God of War descends upon the mortal realm, seeking worthy opponents to satisfy his insatiable bloodlust.",
    minLevel: 25,
    baseHp: 2500,
    baseAttack: 55,
    baseDefense: 20,
    enrageMultiplier: 1.8,
    enrageThreshold: 0.5,
    phaseMessage: "Ares flies into a divine rage! His attacks grow devastating!",
    cooldownMinutes: 30,
  },
  {
    name: "Thanatos",
    title: "God of Death",
    lore: "The pale god of death walks the battlefield, his very presence extinguishing the life force of all who face him.",
    minLevel: 75,
    baseHp: 5000,
    baseAttack: 85,
    baseDefense: 35,
    enrageMultiplier: 2.0,
    enrageThreshold: 0.4,
    phaseMessage: "Thanatos channels the power of Death itself — his touch now drains your very soul!",
    cooldownMinutes: 30,
  },
  {
    name: "Kronos",
    title: "God of Time",
    lore: "The Titan lord of time bends reality itself, aging enemies with a glance and shattering armies across timelines.",
    minLevel: 150,
    baseHp: 10000,
    baseAttack: 120,
    baseDefense: 60,
    enrageMultiplier: 2.2,
    enrageThreshold: 0.4,
    phaseMessage: "Kronos accelerates time — every heartbeat feels like a century of torment!",
    cooldownMinutes: 45,
  },
  {
    name: "Typhon",
    title: "Father of Monsters",
    lore: "The primordial monster-father, larger than mountains, whose roar shakes the heavens and whose gaze melts stone.",
    minLevel: 300,
    baseHp: 22000,
    baseAttack: 180,
    baseDefense: 90,
    enrageMultiplier: 2.5,
    enrageThreshold: 0.45,
    phaseMessage: "Typhon's hundred heads all turn toward you and ROAR — reality fractures around him!",
    cooldownMinutes: 60,
  },
  {
    name: "Nyx",
    title: "Goddess of Night",
    lore: "Primordial night given form. Even the gods fear her. She wraps the world in eternal darkness and bends fate.",
    minLevel: 500,
    baseHp: 50000,
    baseAttack: 280,
    baseDefense: 140,
    enrageMultiplier: 2.8,
    enrageThreshold: 0.35,
    phaseMessage: "Nyx tears open the veil of night — absolute darkness swallows all light and hope!",
    cooldownMinutes: 90,
  },
  {
    name: "Erebus",
    title: "Void Absolute",
    lore: "The very embodiment of void and primordial darkness. Older than creation. Fighting Erebus is fighting nothingness.",
    minLevel: 750,
    baseHp: 120000,
    baseAttack: 450,
    baseDefense: 220,
    enrageMultiplier: 3.0,
    enrageThreshold: 0.3,
    phaseMessage: "Erebus tears reality apart — existence itself begins to unravel!",
    cooldownMinutes: 120,
  },
  {
    name: "Azathoth",
    title: "The Blind Idiot God",
    lore: "The demon sultan beyond all space and time, whose mindless piping sustains creation itself. Its waking would erase every universe simultaneously.",
    minLevel: 1000,
    baseHp: 400000,
    baseAttack: 900,
    baseDefense: 450,
    enrageMultiplier: 3.5,
    enrageThreshold: 0.25,
    phaseMessage: "Azathoth's piping reaches a fever pitch — reality SCREAMS and the laws of physics dissolve around you!",
    cooldownMinutes: 180,
  },
  {
    name: "The Infinite",
    title: "That Which Has No End",
    lore: "Not a being but a concept given horrifying form. It cannot be destroyed — only temporarily refused. It always returns. It already has.",
    minLevel: 1500,
    baseHp: 1500000,
    baseAttack: 2200,
    baseDefense: 1100,
    enrageMultiplier: 4.0,
    enrageThreshold: 0.2,
    phaseMessage: "The Infinite splits into endless iterations — each copy is as lethal as the original and they ALL attack at once!",
    cooldownMinutes: 240,
  },
  {
    name: "Ouroboros",
    title: "The Serpent Without End",
    lore: "The world-serpent that devours its own tail, consuming every timeline simultaneously. Defeating it is meaningless — it already witnessed your victory and made it irrelevant.",
    minLevel: 2000,
    baseHp: 6000000,
    baseAttack: 5000,
    baseDefense: 2500,
    enrageMultiplier: 5.0,
    enrageThreshold: 0.15,
    phaseMessage: "Ouroboros bites its tail and loops causality — every wound you've inflicted resets to zero!",
    cooldownMinutes: 360,
  },
];

export const RAID_COOLDOWN_MS = 30 * 60 * 1000;

const RAID_LOOT_POOL: Record<string, Partial<Record<ItemType, string[]>>> = {
  "Ares": {
    weapon: ["Warblade of Ares", "Ares' Spear of Glory", "Blood-Drenched Sword"],
    armor:  ["Ares' War Plate", "Plate of Eternal Conflict"],
    ring:   ["Signet of the War God", "Band of Martial Fury"],
    amulet: ["Heart of War", "Ares' Divine Token"],
    gloves: ["Gauntlets of Ares", "War God's Iron Grip"],
    boots:  ["Ares' War Treads", "Boots of the Battlefield"],
  },
  "Thanatos": {
    weapon: ["Scythe of Death", "Thanatos' Soul Reaper", "Blade of Final Rest"],
    armor:  ["Shroud of Thanatos", "Deathward Plate"],
    ring:   ["Death God's Band", "Ring of the Pale God"],
    amulet: ["Soul of Thanatos", "Charm of Final Hour"],
    gloves: ["Hands of Death", "Thanatos' Pale Grasp"],
    boots:  ["Death God's Steps", "Pale Walker Boots"],
  },
  "Kronos": {
    weapon: ["Scythe of Ages", "Kronos' Time Reaper", "Blade of Eternity"],
    armor:  ["Timeless Plate", "Kronosian Shell"],
    ring:   ["Ring of Ages", "Time God's Signet"],
    amulet: ["Heart of Time", "Hourglass Pendant"],
    gloves: ["Gauntlets of Ages", "Timeless Grip"],
    boots:  ["Boots of Eternity", "Time God's Stride"],
  },
  "Typhon": {
    weapon: ["Fang of Typhon", "Monster Father's Claw", "Typhonic Spear"],
    armor:  ["Scale of Typhon", "Monster King's Hide"],
    ring:   ["Ring of the Monster Lord", "Typhon's Iron Band"],
    amulet: ["Monster Father's Core", "Typhon's Roar Stone"],
    gloves: ["Typhon's Iron Claw", "Hundred-Fist Wraps"],
    boots:  ["Typhon's Earthshaker Boots", "Monster Lord Treads"],
  },
  "Nyx": {
    weapon: ["Staff of Eternal Night", "Nyx's Starless Blade", "Night Absolute Scepter"],
    armor:  ["Veil of Nyx", "Night Absolute Plate"],
    ring:   ["Ring of Eternal Night", "Night Goddess Signet"],
    amulet: ["Heart of Darkness", "Night Goddess Soul"],
    gloves: ["Nyx's Shadow Grasp", "Hands of Eternal Night"],
    boots:  ["Night Goddess Stride", "Nyx's Starless Steps"],
  },
  "Erebus": {
    weapon: ["Void Absolute Blade", "Erebus' World Ender", "Arm of the Primordial"],
    armor:  ["Erebus' Void Shell", "Primordial Dark Plate"],
    ring:   ["Ring of the Void Absolute", "Erebus' Eternal Band"],
    amulet: ["Heart of the Void Absolute", "Primordial Dark Soul"],
    gloves: ["Erebus' Void Grasp", "Primordial Null Hands"],
    boots:  ["Void Absolute Stride", "Erebus' Null Treads"],
  },
  "Azathoth": {
    weapon: ["Pipe of the Blind Sultan", "Azathoth's Chaos Edge", "The Mad Flautist's Blade"],
    armor:  ["Shell of the Idiot God", "Azathoth's Void Carapace"],
    ring:   ["Ring of the Blind Sultan", "Azathoth's Chaos Signet"],
    amulet: ["Heart of the Outer Dark", "Azathoth's Chaos Core"],
    gloves: ["Azathoth's Void Grasp", "Hands of the Blind God"],
    boots:  ["Azathoth's Mad Steps", "Boots of the Outer Dark"],
  },
  "The Infinite": {
    weapon: ["Blade Without End", "Sword of Endless Possibilities", "The Infinite's Edge"],
    armor:  ["Plate of Infinity", "The Endless Shell"],
    ring:   ["Seal of the Infinite", "Band of Endless Power"],
    amulet: ["The Infinite Soul", "Core of Endless Power"],
    gloves: ["Grasp of the Infinite", "Hands of Endless Force"],
    boots:  ["Stride of Infinity", "Steps That Never Stop"],
  },
  "Ouroboros": {
    weapon: ["Fang of the World Serpent", "Ouroboros' Eternal Fang", "The Serpent's World Blade"],
    armor:  ["Scale of the Endless Serpent", "Ouroboros' Void Shell"],
    ring:   ["Ouroboros' Eternal Band", "Ring of the World Serpent"],
    amulet: ["Heart of the World Serpent", "Ouroboros' Timeless Core"],
    gloves: ["Ouroboros' Coiling Grasp", "Serpent King's Eternal Grip"],
    boots:  ["Ouroboros' Endless Stride", "World Serpent's Steps"],
  },
};

// Raid loot rarity is tiered by god — higher bosses drop rarer tiers
const RAID_RARITY: Record<string, Rarity> = {
  "Ares":        "Eternal",
  "Thanatos":    "Eternal",
  "Kronos":      "Eternal",
  "Typhon":      "Eternal",
  "Nyx":         "Eternal",
  "Erebus":      "Eternal",
  "Azathoth":    "Primordial",
  "The Infinite":"Omnipotent",
  "Ouroboros":   "Omnipotent",
};

export function rollRaidLoot(godName: string): { name: string; rarity: Rarity; emoji: string; goldValue: number; type: ItemType; statBonus: number } {
  const pool = RAID_LOOT_POOL[godName];
  const rarity: Rarity = RAID_RARITY[godName] ?? "Eternal";
  const itemType = pickItemType();
  const names = pool?.[itemType] ?? LOOT_POOL[rarity][itemType];
  const name = names[Math.floor(Math.random() * names.length)];
  return {
    name,
    rarity,
    emoji: "",
    goldValue: GOLD_VALUES[rarity] * 2,
    type: itemType,
    statBonus: STAT_BONUSES[rarity] * 2,
  };
}

export function getGodByName(name: string): GodBoss | undefined {
  return GOD_BOSSES.find(g => g.name === name);
}

export function scaleGodForPlayer(god: GodBoss, playerLevel: number): { hp: number; attack: number; defense: number } {
  const scaleFactor = Math.max(1, playerLevel / god.minLevel);
  return {
    hp: Math.floor(god.baseHp * scaleFactor),
    attack: Math.floor(god.baseAttack * scaleFactor),
    defense: Math.floor(god.baseDefense * scaleFactor),
  };
}
