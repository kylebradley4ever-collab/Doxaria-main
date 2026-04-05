// ─── Zones ───────────────────────────────────────────────────────────────────

export interface Zone {
  id: number;
  name: string;
  minLevel: number;
  maxLevel: number;
}

export const ZONES: Zone[] = [
  { id: 1,  name: "Verdant Forest",       minLevel: 1,    maxLevel: 10   },
  { id: 2,  name: "Cursed Caverns",       minLevel: 11,   maxLevel: 20   },
  { id: 3,  name: "Shadowmere Wastes",    minLevel: 21,   maxLevel: 35   },
  { id: 4,  name: "Infernal Abyss",       minLevel: 36,   maxLevel: 55   },
  { id: 5,  name: "Void Between Worlds",  minLevel: 56,   maxLevel: 79   },
  { id: 6,  name: "Celestial Spire",      minLevel: 80,   maxLevel: 120  },
  { id: 7,  name: "Abyssal Depths",       minLevel: 121,  maxLevel: 175  },
  { id: 8,  name: "Shattered Realm",      minLevel: 176,  maxLevel: 249  },
  { id: 9,  name: "Eternal Sanctum",      minLevel: 250,  maxLevel: 349  },
  { id: 10, name: "The Infinite Void",    minLevel: 350,  maxLevel: 499  },
  { id: 11, name: "Primordial Chaos",     minLevel: 500,  maxLevel: 749  },
  { id: 12, name: "The Eternal Darkness", minLevel: 750,  maxLevel: 999  },
  { id: 13, name: "The First Void",       minLevel: 1000, maxLevel: 1499 },
  { id: 14, name: "Dimensional Fracture", minLevel: 1500, maxLevel: 1999 },
  { id: 15, name: "Realm of Entropy",     minLevel: 2000, maxLevel: 2999 },
  { id: 16, name: "Convergence Point",    minLevel: 3000, maxLevel: 4999 },
  { id: 17, name: "End of Time",          minLevel: 5000, maxLevel: 7499 },
  { id: 18, name: "Beyond Reality",       minLevel: 7500, maxLevel: 9999 },
  { id: 19, name: "The Singularity",      minLevel: 10000,maxLevel: 14999},
  { id: 20, name: "Absolute Terminus",    minLevel: 15000,maxLevel: 19999},
];

export function getZone(playerLevel: number): Zone {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (playerLevel >= ZONES[i].minLevel) return ZONES[i];
  }
  return ZONES[0];
}

export function getInfiniteZoneId(playerLevel: number): number {
  if (playerLevel < 20000) return getZone(playerLevel).id;
  return 20 + Math.floor((playerLevel - 20000) / 10000) + 1;
}

export function getInfiniteZoneName(playerLevel: number): string {
  if (playerLevel < 20000) return getZone(playerLevel).name;
  const layer = Math.floor((playerLevel - 20000) / 10000) + 1;
  const VOID_NAMES = ["Oblivion Layer", "Chaos Stratum", "Void Layer", "Null Realm", "Infinite Rift"];
  const prefix = VOID_NAMES[layer % VOID_NAMES.length];
  return `${prefix} ${layer + 20}`;
}

// ─── Raid Keys ───────────────────────────────────────────────────────────────

export interface RaidKeyDef {
  name: string;
  emoji: string;
  color: string;
  minZoneId: number;
  maxZoneId: number; // inclusive; 999 = infinite
  gods: string[];
}

export const RAID_KEY_DEFS: RaidKeyDef[] = [
  { name: "War Key",      emoji: "⚔️",  color: "text-red-400",    minZoneId: 1,  maxZoneId: 5,   gods: ["Ares","Thanatos","Kronos"] },
  { name: "Titan Key",    emoji: "🏛️",  color: "text-blue-400",   minZoneId: 6,  maxZoneId: 9,   gods: ["Typhon","Nyx","Erebus"] },
  { name: "Eldritch Key", emoji: "🌀",  color: "text-purple-400", minZoneId: 10, maxZoneId: 12,  gods: ["Azathoth","The Infinite","Ouroboros"] },
  { name: "Void Key",     emoji: "🕳️",  color: "text-cyan-400",   minZoneId: 13, maxZoneId: 15,  gods: ["Yog-Sothoth","Nemesis","The Devourer"] },
  { name: "Genesis Key",  emoji: "✨",  color: "text-emerald-400",minZoneId: 16, maxZoneId: 18,  gods: ["Chronovore","Tiamat Prime","Apeiron"] },
  { name: "Absolute Key", emoji: "💀",  color: "text-amber-300",  minZoneId: 19, maxZoneId: 999, gods: ["Yaldabaoth","Final Entropy","The First Cause","Origin"] },
];

export const GOD_REQUIRED_KEY: Record<string, string> = Object.fromEntries(
  RAID_KEY_DEFS.flatMap(k => k.gods.map(g => [g, k.name]))
);

export function getKeyDefForZone(zoneId: number): RaidKeyDef | null {
  return RAID_KEY_DEFS.find(k => zoneId >= k.minZoneId && zoneId <= k.maxZoneId) ?? null;
}

export function getKeyDef(keyName: string): RaidKeyDef | undefined {
  return RAID_KEY_DEFS.find(k => k.name === keyName);
}

// ─── Prestige ────────────────────────────────────────────────────────────────

export interface PrestigeTier {
  minPrestige: number;
  name: string;
  color: string;
  emoji: string;
}

export const PRESTIGE_TIERS: PrestigeTier[] = [
  { minPrestige: 1,   name: "Awakened",         color: "text-green-400",   emoji: "🌱" },
  { minPrestige: 5,   name: "Ascendant",         color: "text-blue-400",    emoji: "💧" },
  { minPrestige: 10,  name: "Transcendent",      color: "text-purple-400",  emoji: "⚡" },
  { minPrestige: 25,  name: "Eternal",           color: "text-yellow-400",  emoji: "🔥" },
  { minPrestige: 50,  name: "Void-Touched",      color: "text-red-400",     emoji: "🌌" },
  { minPrestige: 100, name: "Godslayer",         color: "text-pink-400",    emoji: "⚔️" },
  { minPrestige: 200, name: "Immortal",          color: "text-cyan-300",    emoji: "♾️" },
  { minPrestige: 500, name: "True God",          color: "text-orange-300",  emoji: "👁️" },
  { minPrestige: 1000,name: "Primordial Deity",  color: "text-white",       emoji: "🌟" },
];

export function getPrestigeTier(prestigeLevel: number): PrestigeTier | null {
  let tier: PrestigeTier | null = null;
  for (const t of PRESTIGE_TIERS) {
    if (prestigeLevel >= t.minPrestige) tier = t;
  }
  return tier;
}

export function prestigeRequiredLevel(currentPrestige: number): number {
  return 100 + currentPrestige * 50;
}

export function prestigeXpMultiplier(prestigeLevel: number): number {
  return Math.pow(1.15, prestigeLevel);
}

export function prestigeGoldMultiplier(prestigeLevel: number): number {
  return Math.pow(1.20, prestigeLevel);
}

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
  { name: "Slime",              emoji: "🟢", baseHp: 10,  baseAttack: 2,  baseDefense: 0,  minZone: 1 },
  { name: "Rat Swarm",          emoji: "🐀", baseHp: 12,  baseAttack: 3,  baseDefense: 0,  minZone: 1 },
  { name: "Goblin",             emoji: "👺", baseHp: 16,  baseAttack: 3,  baseDefense: 1,  minZone: 1 },
  { name: "Skeleton",           emoji: "💀", baseHp: 20,  baseAttack: 5,  baseDefense: 2,  minZone: 1 },
  { name: "Forest Wolf",        emoji: "🐺", baseHp: 22,  baseAttack: 5,  baseDefense: 1,  minZone: 1 },
  { name: "Zombie",             emoji: "🧟", baseHp: 26,  baseAttack: 4,  baseDefense: 3,  minZone: 1 },
  { name: "Bandit",             emoji: "🗡️", baseHp: 18,  baseAttack: 6,  baseDefense: 2,  minZone: 1 },
  { name: "Wicked Witch",       emoji: "🧙", baseHp: 14,  baseAttack: 7,  baseDefense: 1,  minZone: 1 },
  { name: "Plague Rat",         emoji: "🐁", baseHp: 14,  baseAttack: 3,  baseDefense: 1,  minZone: 1 },
  { name: "Stone Imp",          emoji: "👿", baseHp: 18,  baseAttack: 4,  baseDefense: 2,  minZone: 1 },
  { name: "Feral Hog",          emoji: "🐗", baseHp: 20,  baseAttack: 4,  baseDefense: 1,  minZone: 1 },
  { name: "Cursed Scarecrow",   emoji: "🌾", baseHp: 22,  baseAttack: 3,  baseDefense: 3,  minZone: 1 },
  { name: "Orc Brute",          emoji: "👹", baseHp: 34,  baseAttack: 7,  baseDefense: 4,  minZone: 2 },
  { name: "Ghoul",              emoji: "👻", baseHp: 30,  baseAttack: 8,  baseDefense: 3,  minZone: 2 },
  { name: "Wraith",             emoji: "👤", baseHp: 22,  baseAttack: 10, baseDefense: 2,  minZone: 2 },
  { name: "Vampire",            emoji: "🧛", baseHp: 40,  baseAttack: 9,  baseDefense: 5,  minZone: 2 },
  { name: "Stone Golem",        emoji: "🗿", baseHp: 50,  baseAttack: 6,  baseDefense: 10, minZone: 2 },
  { name: "Dark Elf",           emoji: "🧝", baseHp: 28,  baseAttack: 11, baseDefense: 4,  minZone: 2 },
  { name: "Werewolf",           emoji: "🐺", baseHp: 44,  baseAttack: 10, baseDefense: 4,  minZone: 2 },
  { name: "Cave Troll",         emoji: "🧌", baseHp: 55,  baseAttack: 8,  baseDefense: 7,  minZone: 2 },
  { name: "Bog Witch",          emoji: "🧙", baseHp: 26,  baseAttack: 10, baseDefense: 3,  minZone: 2 },
  { name: "Iron Golem",         emoji: "🤖", baseHp: 60,  baseAttack: 7,  baseDefense: 12, minZone: 2 },
  { name: "Shadow Rogue",       emoji: "🌑", baseHp: 30,  baseAttack: 12, baseDefense: 4,  minZone: 2 },
  { name: "Blood Wolf",         emoji: "🐺", baseHp: 38,  baseAttack: 9,  baseDefense: 4,  minZone: 2 },
  { name: "Demon",              emoji: "😈", baseHp: 50,  baseAttack: 12, baseDefense: 6,  minZone: 3 },
  { name: "Dark Knight",        emoji: "🛡️", baseHp: 60,  baseAttack: 10, baseDefense: 10, minZone: 3 },
  { name: "Hellhound",          emoji: "🔥", baseHp: 46,  baseAttack: 14, baseDefense: 5,  minZone: 3 },
  { name: "Necromancer",        emoji: "💀", baseHp: 38,  baseAttack: 16, baseDefense: 4,  minZone: 3 },
  { name: "Shade",              emoji: "👤", baseHp: 32,  baseAttack: 15, baseDefense: 3,  minZone: 3 },
  { name: "Medusa",             emoji: "🐍", baseHp: 44,  baseAttack: 13, baseDefense: 7,  minZone: 3 },
  { name: "Death Knight",       emoji: "⚔️", baseHp: 62,  baseAttack: 12, baseDefense: 11, minZone: 3 },
  { name: "Shadow Stalker",     emoji: "🌑", baseHp: 36,  baseAttack: 17, baseDefense: 4,  minZone: 3 },
  { name: "Plague Doctor",      emoji: "☣️", baseHp: 40,  baseAttack: 14, baseDefense: 5,  minZone: 3 },
  { name: "Chaos Imp",          emoji: "👿", baseHp: 48,  baseAttack: 13, baseDefense: 6,  minZone: 3 },
  { name: "Bone Archer",        emoji: "🏹", baseHp: 36,  baseAttack: 16, baseDefense: 3,  minZone: 3 },
  { name: "Spectral Knight",    emoji: "👻", baseHp: 64,  baseAttack: 11, baseDefense: 12, minZone: 3 },
  { name: "Dragon",             emoji: "🐉", baseHp: 72,  baseAttack: 14, baseDefense: 9,  minZone: 4 },
  { name: "Infernal Lord",      emoji: "😈", baseHp: 68,  baseAttack: 18, baseDefense: 8,  minZone: 4 },
  { name: "Chaos Beast",        emoji: "🌀", baseHp: 80,  baseAttack: 16, baseDefense: 10, minZone: 4 },
  { name: "Void Spawner",       emoji: "🕳️", baseHp: 55,  baseAttack: 20, baseDefense: 6,  minZone: 4 },
  { name: "Elder Demon",        emoji: "👿", baseHp: 74,  baseAttack: 19, baseDefense: 9,  minZone: 4 },
  { name: "Leviathan",          emoji: "🐲", baseHp: 90,  baseAttack: 15, baseDefense: 14, minZone: 4 },
  { name: "Inferno Wyrm",       emoji: "🔥", baseHp: 82,  baseAttack: 17, baseDefense: 11, minZone: 4 },
  { name: "Abyssal Specter",    emoji: "👻", baseHp: 60,  baseAttack: 22, baseDefense: 5,  minZone: 4 },
  { name: "Hell Wyrm",          emoji: "🐲", baseHp: 78,  baseAttack: 15, baseDefense: 10, minZone: 4 },
  { name: "Magma Golem",        emoji: "🌋", baseHp: 95,  baseAttack: 12, baseDefense: 16, minZone: 4 },
  { name: "Brimstone Fiend",    emoji: "😈", baseHp: 70,  baseAttack: 19, baseDefense: 8,  minZone: 4 },
  { name: "Abyssal Wraith",     emoji: "👤", baseHp: 62,  baseAttack: 21, baseDefense: 6,  minZone: 4 },
  { name: "Void Walker",        emoji: "🕳️", baseHp: 95,  baseAttack: 24, baseDefense: 12, minZone: 5 },
  { name: "Cosmic Horror",      emoji: "🌌", baseHp: 100, baseAttack: 26, baseDefense: 10, minZone: 5 },
  { name: "Primordial Beast",   emoji: "🌋", baseHp: 120, baseAttack: 22, baseDefense: 18, minZone: 5 },
  { name: "Abyss Titan",        emoji: "🏔️", baseHp: 130, baseAttack: 20, baseDefense: 22, minZone: 5 },
  { name: "Oblivion Drake",     emoji: "🐉", baseHp: 108, baseAttack: 28, baseDefense: 14, minZone: 5 },
  { name: "Null Entity",        emoji: "⚫", baseHp: 88,  baseAttack: 30, baseDefense: 8,  minZone: 5 },
  { name: "Entropy Fiend",      emoji: "🌀", baseHp: 115, baseAttack: 25, baseDefense: 16, minZone: 5 },
  { name: "Void Sovereign",     emoji: "👑", baseHp: 140, baseAttack: 23, baseDefense: 24, minZone: 5 },
  { name: "Phase Shifter",      emoji: "✨", baseHp: 102, baseAttack: 26, baseDefense: 13, minZone: 5 },
  { name: "Null Demon",         emoji: "😈", baseHp: 90,  baseAttack: 28, baseDefense: 9,  minZone: 5 },
  { name: "Starfire Drake",     emoji: "⭐", baseHp: 112, baseAttack: 24, baseDefense: 16, minZone: 5 },
  { name: "Cosmic Abomination", emoji: "🌌", baseHp: 125, baseAttack: 22, baseDefense: 20, minZone: 5 },
  { name: "Corrupted Seraph",   emoji: "👼", baseHp: 110, baseAttack: 28, baseDefense: 15, minZone: 6 },
  { name: "Fallen Angel",       emoji: "😇", baseHp: 95,  baseAttack: 32, baseDefense: 12, minZone: 6 },
  { name: "Celestial Guardian", emoji: "⭐", baseHp: 130, baseAttack: 25, baseDefense: 22, minZone: 6 },
  { name: "Light Wraith",       emoji: "💫", baseHp: 85,  baseAttack: 35, baseDefense: 10, minZone: 6 },
  { name: "Heaven's Exile",     emoji: "🌟", baseHp: 115, baseAttack: 30, baseDefense: 18, minZone: 6 },
  { name: "Radiant Fiend",      emoji: "✨", baseHp: 105, baseAttack: 27, baseDefense: 20, minZone: 6 },
  { name: "Astral Phantom",     emoji: "👤", baseHp: 90,  baseAttack: 33, baseDefense: 13, minZone: 6 },
  { name: "Sanctified Horror",  emoji: "😱", baseHp: 120, baseAttack: 26, baseDefense: 25, minZone: 6 },
  { name: "Herald of Ruin",     emoji: "📯", baseHp: 118, baseAttack: 30, baseDefense: 17, minZone: 6 },
  { name: "Void Seraph",        emoji: "🕳️", baseHp: 100, baseAttack: 34, baseDefense: 13, minZone: 6 },
  { name: "Luminous Fiend",     emoji: "💡", baseHp: 128, baseAttack: 27, baseDefense: 22, minZone: 6 },
  { name: "Shattered Angel",    emoji: "😇", baseHp: 108, baseAttack: 31, baseDefense: 15, minZone: 6 },
  { name: "Kraken Spawn",       emoji: "🦑", baseHp: 135, baseAttack: 36, baseDefense: 18, minZone: 7 },
  { name: "Deep One",           emoji: "🌊", baseHp: 145, baseAttack: 34, baseDefense: 22, minZone: 7 },
  { name: "Void Hydra",         emoji: "🐲", baseHp: 155, baseAttack: 32, baseDefense: 26, minZone: 7 },
  { name: "Abyssal Revenant",   emoji: "👤", baseHp: 125, baseAttack: 38, baseDefense: 16, minZone: 7 },
  { name: "Nihil Serpent",      emoji: "🐍", baseHp: 118, baseAttack: 40, baseDefense: 14, minZone: 7 },
  { name: "Oblivion Husk",      emoji: "💀", baseHp: 160, baseAttack: 30, baseDefense: 30, minZone: 7 },
  { name: "Depth Walker",       emoji: "🌊", baseHp: 130, baseAttack: 37, baseDefense: 20, minZone: 7 },
  { name: "Abyss Horror",       emoji: "😱", baseHp: 140, baseAttack: 35, baseDefense: 24, minZone: 7 },
  { name: "Trench Horror",      emoji: "🌊", baseHp: 148, baseAttack: 36, baseDefense: 23, minZone: 7 },
  { name: "Leviathan Spawn",    emoji: "🐉", baseHp: 158, baseAttack: 34, baseDefense: 26, minZone: 7 },
  { name: "Void Parasite",      emoji: "🦠", baseHp: 128, baseAttack: 39, baseDefense: 15, minZone: 7 },
  { name: "Abyssal Stalker",    emoji: "🌑", baseHp: 140, baseAttack: 37, baseDefense: 20, minZone: 7 },
  { name: "Reality Breach",     emoji: "🌌", baseHp: 165, baseAttack: 44, baseDefense: 26, minZone: 8 },
  { name: "Chaos Lord",         emoji: "👑", baseHp: 175, baseAttack: 42, baseDefense: 30, minZone: 8 },
  { name: "Fractured Titan",    emoji: "🏔️", baseHp: 185, baseAttack: 40, baseDefense: 34, minZone: 8 },
  { name: "Void Colossus",      emoji: "🌑", baseHp: 195, baseAttack: 38, baseDefense: 38, minZone: 8 },
  { name: "Realm Stalker",      emoji: "🔮", baseHp: 155, baseAttack: 46, baseDefense: 22, minZone: 8 },
  { name: "Dimensional Ripper", emoji: "🌀", baseHp: 170, baseAttack: 43, baseDefense: 28, minZone: 8 },
  { name: "Paradox Beast",      emoji: "😈", baseHp: 180, baseAttack: 41, baseDefense: 32, minZone: 8 },
  { name: "Entropy Avatar",     emoji: "⚫", baseHp: 160, baseAttack: 45, baseDefense: 25, minZone: 8 },
  { name: "Rift Stalker",       emoji: "🌀", baseHp: 172, baseAttack: 44, baseDefense: 29, minZone: 8 },
  { name: "Chaos Wraith",       emoji: "👤", baseHp: 162, baseAttack: 46, baseDefense: 24, minZone: 8 },
  { name: "Shattered Colossus", emoji: "💥", baseHp: 200, baseAttack: 40, baseDefense: 36, minZone: 8 },
  { name: "Paradox Shade",      emoji: "🌑", baseHp: 158, baseAttack: 47, baseDefense: 22, minZone: 8 },
  { name: "Eternal Sentinel",   emoji: "⏳", baseHp: 210, baseAttack: 52, baseDefense: 38, minZone: 9 },
  { name: "Time Ravager",       emoji: "⏰", baseHp: 195, baseAttack: 56, baseDefense: 32, minZone: 9 },
  { name: "Fate Weaver",        emoji: "🌐", baseHp: 220, baseAttack: 50, baseDefense: 40, minZone: 9 },
  { name: "Cosmic Predator",    emoji: "🌌", baseHp: 200, baseAttack: 54, baseDefense: 36, minZone: 9 },
  { name: "Soul Colossus",      emoji: "👻", baseHp: 230, baseAttack: 48, baseDefense: 45, minZone: 9 },
  { name: "Infinite Shade",     emoji: "♾️", baseHp: 188, baseAttack: 58, baseDefense: 28, minZone: 9 },
  { name: "Sanctum Guardian",   emoji: "🛡️", baseHp: 240, baseAttack: 46, baseDefense: 50, minZone: 9 },
  { name: "Void Prophet",       emoji: "🔮", baseHp: 198, baseAttack: 55, baseDefense: 34, minZone: 9 },
  { name: "Eternal Revenant",   emoji: "💀", baseHp: 215, baseAttack: 53, baseDefense: 40, minZone: 9 },
  { name: "Temporal Fiend",     emoji: "⌛", baseHp: 200, baseAttack: 57, baseDefense: 33, minZone: 9 },
  { name: "Void God",           emoji: "🌑", baseHp: 260, baseAttack: 65, baseDefense: 48, minZone: 10 },
  { name: "Endless Horror",     emoji: "😱", baseHp: 245, baseAttack: 68, baseDefense: 42, minZone: 10 },
  { name: "Null Titan",         emoji: "⚫", baseHp: 280, baseAttack: 62, baseDefense: 54, minZone: 10 },
  { name: "Infinity Wraith",    emoji: "♾️", baseHp: 230, baseAttack: 72, baseDefense: 36, minZone: 10 },
  { name: "The Nameless",       emoji: "❓", baseHp: 270, baseAttack: 64, baseDefense: 50, minZone: 10 },
  { name: "Oblivion God",       emoji: "🌑", baseHp: 255, baseAttack: 66, baseDefense: 46, minZone: 10 },
  { name: "Eternal Devourer",   emoji: "💀", baseHp: 290, baseAttack: 60, baseDefense: 56, minZone: 10 },
  { name: "Chaos Primordial",   emoji: "🌀", baseHp: 240, baseAttack: 70, baseDefense: 40, minZone: 10 },
  { name: "Chaos Titan",        emoji: "💥", baseHp: 320, baseAttack: 80, baseDefense: 60, minZone: 11 },
  { name: "Primordial Revenant",emoji: "👻", baseHp: 300, baseAttack: 85, baseDefense: 55, minZone: 11 },
  { name: "Entropy Incarnate",  emoji: "⚫", baseHp: 285, baseAttack: 90, baseDefense: 50, minZone: 11 },
  { name: "Void Annihilator",   emoji: "🕳️", baseHp: 340, baseAttack: 78, baseDefense: 65, minZone: 11 },
  { name: "Realm Destroyer",    emoji: "💥", baseHp: 310, baseAttack: 82, baseDefense: 58, minZone: 11 },
  { name: "Chaos Oracle",       emoji: "🔮", baseHp: 270, baseAttack: 95, baseDefense: 45, minZone: 11 },
  { name: "Eternal Void",       emoji: "🌑", baseHp: 380, baseAttack: 95, baseDefense: 72, minZone: 12 },
  { name: "Dark Absolute",      emoji: "⚫", baseHp: 360, baseAttack: 100,baseDefense: 65, minZone: 12 },
  { name: "The Primordial",     emoji: "🌋", baseHp: 420, baseAttack: 88, baseDefense: 80, minZone: 12 },
  { name: "Undying Chaos",      emoji: "🌀", baseHp: 350, baseAttack: 102,baseDefense: 60, minZone: 12 },
  { name: "Void Absolute",      emoji: "🕳️", baseHp: 400, baseAttack: 93, baseDefense: 76, minZone: 12 },
  { name: "The Nameless Void",  emoji: "❓", baseHp: 330, baseAttack: 110,baseDefense: 50, minZone: 12 },
  // ── Extra Zone 1 monsters ──────────────────────────────────────────────────
  { name: "Mushroom Puffball",  emoji: "🍄", baseHp: 10,  baseAttack: 2,  baseDefense: 0,  minZone: 1 },
  { name: "Mud Golem",          emoji: "🟤", baseHp: 22,  baseAttack: 3,  baseDefense: 3,  minZone: 1 },
  { name: "Thornback Toad",     emoji: "🐸", baseHp: 14,  baseAttack: 4,  baseDefense: 2,  minZone: 1 },
  { name: "Cave Spider",        emoji: "🕷️", baseHp: 12,  baseAttack: 5,  baseDefense: 1,  minZone: 1 },
  { name: "Foul Crow",          emoji: "🐦", baseHp: 8,   baseAttack: 4,  baseDefense: 0,  minZone: 1 },
  { name: "Giant Ant",          emoji: "🐜", baseHp: 16,  baseAttack: 3,  baseDefense: 2,  minZone: 1 },
  { name: "Rabid Fox",          emoji: "🦊", baseHp: 18,  baseAttack: 5,  baseDefense: 1,  minZone: 1 },
  // ── Extra Zone 2 monsters ──────────────────────────────────────────────────
  { name: "Iron Sentinel",      emoji: "🤖", baseHp: 40,  baseAttack: 7,  baseDefense: 9,  minZone: 2 },
  { name: "Frost Troll",        emoji: "❄️", baseHp: 48,  baseAttack: 9,  baseDefense: 6,  minZone: 2 },
  { name: "Hex Witch",          emoji: "🧙", baseHp: 28,  baseAttack: 12, baseDefense: 3,  minZone: 2 },
  { name: "Dusk Crawler",       emoji: "🦂", baseHp: 34,  baseAttack: 10, baseDefense: 5,  minZone: 2 },
  { name: "Bone Shaman",        emoji: "💀", baseHp: 30,  baseAttack: 11, baseDefense: 4,  minZone: 2 },
  { name: "Venom Stalker",      emoji: "🐍", baseHp: 32,  baseAttack: 10, baseDefense: 4,  minZone: 2 },
  // ── Extra Zone 3 monsters ──────────────────────────────────────────────────
  { name: "Hell Beetle",        emoji: "🐞", baseHp: 44,  baseAttack: 13, baseDefense: 8,  minZone: 3 },
  { name: "Venom Hydra",        emoji: "🐲", baseHp: 60,  baseAttack: 11, baseDefense: 9,  minZone: 3 },
  { name: "Crimson Fanatic",    emoji: "🩸", baseHp: 38,  baseAttack: 16, baseDefense: 3,  minZone: 3 },
  { name: "Bone Titan",         emoji: "💀", baseHp: 68,  baseAttack: 10, baseDefense: 13, minZone: 3 },
  { name: "Frostfire Wyrm",     emoji: "🌀", baseHp: 55,  baseAttack: 14, baseDefense: 7,  minZone: 3 },
  // ── Extra Zone 4 monsters ──────────────────────────────────────────────────
  { name: "Pyroclastic Golem",  emoji: "🌋", baseHp: 90,  baseAttack: 13, baseDefense: 17, minZone: 4 },
  { name: "Dread Revenant",     emoji: "👻", baseHp: 72,  baseAttack: 20, baseDefense: 7,  minZone: 4 },
  { name: "Blighted Specter",   emoji: "☠️", baseHp: 64,  baseAttack: 22, baseDefense: 5,  minZone: 4 },
  { name: "Star Crawler",       emoji: "⭐", baseHp: 80,  baseAttack: 18, baseDefense: 10, minZone: 4 },
  { name: "Ashen Warlord",      emoji: "🔥", baseHp: 76,  baseAttack: 19, baseDefense: 8,  minZone: 4 },
  // ── Extra Zone 5 monsters ──────────────────────────────────────────────────
  { name: "Null Phantom",       emoji: "⚫", baseHp: 92,  baseAttack: 27, baseDefense: 9,  minZone: 5 },
  { name: "Chaos Elemental",    emoji: "🌀", baseHp: 108, baseAttack: 24, baseDefense: 14, minZone: 5 },
  { name: "Ruinous Goliath",    emoji: "💥", baseHp: 135, baseAttack: 21, baseDefense: 20, minZone: 5 },
  { name: "Rift Shade",         emoji: "🌑", baseHp: 88,  baseAttack: 30, baseDefense: 7,  minZone: 5 },
  { name: "Soul Harvester",     emoji: "👁️", baseHp: 100, baseAttack: 26, baseDefense: 12, minZone: 5 },
  // ── Extra Zone 6 monsters ──────────────────────────────────────────────────
  { name: "Seraphic Warden",    emoji: "👼", baseHp: 118, baseAttack: 27, baseDefense: 23, minZone: 6 },
  { name: "Fallen Templar",     emoji: "⚔️", baseHp: 105, baseAttack: 33, baseDefense: 14, minZone: 6 },
  { name: "Radiant Specter",    emoji: "💫", baseHp: 88,  baseAttack: 36, baseDefense: 11, minZone: 6 },
  { name: "Heaven's Scourge",   emoji: "☀️", baseHp: 125, baseAttack: 29, baseDefense: 19, minZone: 6 },
  { name: "Gilded Horror",      emoji: "🌟", baseHp: 112, baseAttack: 31, baseDefense: 17, minZone: 6 },
  // ── Extra Zone 7 monsters ──────────────────────────────────────────────────
  { name: "Abyssal Mantis",     emoji: "🦗", baseHp: 138, baseAttack: 38, baseDefense: 19, minZone: 7 },
  { name: "Deep Colossus",      emoji: "🌊", baseHp: 162, baseAttack: 33, baseDefense: 28, minZone: 7 },
  { name: "Void Nautilus",      emoji: "🐚", baseHp: 145, baseAttack: 36, baseDefense: 22, minZone: 7 },
  { name: "Trench Titan",       emoji: "🌊", baseHp: 155, baseAttack: 35, baseDefense: 25, minZone: 7 },
  { name: "Abyss Serpent",      emoji: "🐍", baseHp: 128, baseAttack: 40, baseDefense: 15, minZone: 7 },
  // ── Extra Zone 8 monsters ──────────────────────────────────────────────────
  { name: "Fracture Demon",     emoji: "😈", baseHp: 172, baseAttack: 45, baseDefense: 28, minZone: 8 },
  { name: "Paradox Wolf",       emoji: "🐺", baseHp: 158, baseAttack: 47, baseDefense: 22, minZone: 8 },
  { name: "Reality Shade",      emoji: "🌌", baseHp: 165, baseAttack: 44, baseDefense: 25, minZone: 8 },
  { name: "Entropy Dragon",     emoji: "🐉", baseHp: 195, baseAttack: 41, baseDefense: 35, minZone: 8 },
  { name: "Void Specter",       emoji: "🕳️", baseHp: 162, baseAttack: 46, baseDefense: 22, minZone: 8 },
  // ── Extra Zone 9 monsters ──────────────────────────────────────────────────
  { name: "Void Apex",          emoji: "🕳️", baseHp: 222, baseAttack: 55, baseDefense: 42, minZone: 9 },
  { name: "Chrono Colossus",    emoji: "⏳", baseHp: 238, baseAttack: 50, baseDefense: 48, minZone: 9 },
  { name: "Fate Shard",         emoji: "🔮", baseHp: 205, baseAttack: 57, baseDefense: 35, minZone: 9 },
  { name: "Soul Titan",         emoji: "💀", baseHp: 245, baseAttack: 48, baseDefense: 52, minZone: 9 },
  { name: "Temporal Phantom",   emoji: "⌛", baseHp: 210, baseAttack: 54, baseDefense: 38, minZone: 9 },
  // ── Extra Zone 10 monsters ─────────────────────────────────────────────────
  { name: "The Unnamed King",   emoji: "❓", baseHp: 275, baseAttack: 67, baseDefense: 52, minZone: 10 },
  { name: "Null Sovereign",     emoji: "⚫", baseHp: 260, baseAttack: 70, baseDefense: 48, minZone: 10 },
  { name: "Abyss Eternal",      emoji: "🌑", baseHp: 285, baseAttack: 64, baseDefense: 54, minZone: 10 },
  { name: "Infinite Phantom",   emoji: "♾️", baseHp: 248, baseAttack: 72, baseDefense: 38, minZone: 10 },
  { name: "Chaos Supreme",      emoji: "🌀", baseHp: 268, baseAttack: 66, baseDefense: 50, minZone: 10 },
  // ── Extra Zone 11 monsters ─────────────────────────────────────────────────
  { name: "Void Colossus Prime",emoji: "🕳️", baseHp: 330, baseAttack: 84, baseDefense: 60, minZone: 11 },
  { name: "Entropy Specter",    emoji: "⚫", baseHp: 290, baseAttack: 92, baseDefense: 48, minZone: 11 },
  { name: "Chaos Goliath",      emoji: "💥", baseHp: 350, baseAttack: 80, baseDefense: 68, minZone: 11 },
  // ── Extra Zone 12 monsters ─────────────────────────────────────────────────
  { name: "Dark Sovereign",     emoji: "👑", baseHp: 400, baseAttack: 105,baseDefense: 72, minZone: 12 },
  { name: "The True Void",      emoji: "🕳️", baseHp: 440, baseAttack: 98, baseDefense: 82, minZone: 12 },
  { name: "Primordial Chaos",   emoji: "🌋", baseHp: 460, baseAttack: 90, baseDefense: 88, minZone: 12 },
];

export const BOSS_MONSTERS: MonsterTemplate[] = [
  { name: "Bone Colossus",           emoji: "💀", baseHp: 120,  baseAttack: 14,  baseDefense: 12,  isBoss: true, minZone: 1 },
  { name: "Giant Forest Troll",      emoji: "🧌", baseHp: 110,  baseAttack: 12,  baseDefense: 14,  isBoss: true, minZone: 1 },
  { name: "Ancient Barrow King",     emoji: "👑", baseHp: 130,  baseAttack: 13,  baseDefense: 14,  isBoss: true, minZone: 1 },
  { name: "Ancient Wyrm",            emoji: "🐲", baseHp: 130,  baseAttack: 18,  baseDefense: 10,  isBoss: true, minZone: 2 },
  { name: "Plague Harbinger",        emoji: "☣️", baseHp: 115,  baseAttack: 20,  baseDefense: 8,   isBoss: true, minZone: 2 },
  { name: "Deep Troll Shaman",       emoji: "🧌", baseHp: 145,  baseAttack: 15,  baseDefense: 18,  isBoss: true, minZone: 2 },
  { name: "Demon Overlord",          emoji: "😈", baseHp: 140,  baseAttack: 20,  baseDefense: 14,  isBoss: true, minZone: 3 },
  { name: "Shadow Titan",            emoji: "🌑", baseHp: 160,  baseAttack: 17,  baseDefense: 20,  isBoss: true, minZone: 3 },
  { name: "Undead Lich",             emoji: "💀", baseHp: 120,  baseAttack: 26,  baseDefense: 8,   isBoss: true, minZone: 3 },
  { name: "Plague Baron",            emoji: "☣️", baseHp: 145,  baseAttack: 22,  baseDefense: 12,  isBoss: true, minZone: 3 },
  { name: "Elder Dragon King",       emoji: "🐉", baseHp: 200,  baseAttack: 24,  baseDefense: 18,  isBoss: true, minZone: 4 },
  { name: "Void Tyrant",             emoji: "🌀", baseHp: 175,  baseAttack: 28,  baseDefense: 15,  isBoss: true, minZone: 4 },
  { name: "Abyssal Overlord",        emoji: "🕳️", baseHp: 190,  baseAttack: 22,  baseDefense: 22,  isBoss: true, minZone: 4 },
  { name: "Infernal Titan",          emoji: "🔥", baseHp: 195,  baseAttack: 26,  baseDefense: 20,  isBoss: true, minZone: 4 },
  { name: "Cosmic Destroyer",        emoji: "🌌", baseHp: 280,  baseAttack: 34,  baseDefense: 24,  isBoss: true, minZone: 5 },
  { name: "Void Incarnate",          emoji: "🕳️", baseHp: 320,  baseAttack: 32,  baseDefense: 28,  isBoss: true, minZone: 5 },
  { name: "The Transcendent",        emoji: "✨", baseHp: 400,  baseAttack: 40,  baseDefense: 30,  isBoss: true, minZone: 5 },
  { name: "Entropy Lord",            emoji: "⚫", baseHp: 350,  baseAttack: 36,  baseDefense: 26,  isBoss: true, minZone: 5 },
  { name: "Archangel of Ruin",       emoji: "👼", baseHp: 450,  baseAttack: 42,  baseDefense: 32,  isBoss: true, minZone: 6 },
  { name: "Celestial Tyrant",        emoji: "⭐", baseHp: 500,  baseAttack: 38,  baseDefense: 40,  isBoss: true, minZone: 6 },
  { name: "Celestial Annihilator",   emoji: "💥", baseHp: 520,  baseAttack: 40,  baseDefense: 36,  isBoss: true, minZone: 6 },
  { name: "Abyss Leviathan",         emoji: "🌊", baseHp: 580,  baseAttack: 48,  baseDefense: 38,  isBoss: true, minZone: 7 },
  { name: "The Depths Incarnate",    emoji: "🌊", baseHp: 640,  baseAttack: 45,  baseDefense: 46,  isBoss: true, minZone: 7 },
  { name: "Kraken Lord",             emoji: "🦑", baseHp: 620,  baseAttack: 50,  baseDefense: 42,  isBoss: true, minZone: 7 },
  { name: "Reality Shatterer",       emoji: "💥", baseHp: 720,  baseAttack: 56,  baseDefense: 48,  isBoss: true, minZone: 8 },
  { name: "Chaos Incarnate",         emoji: "🌀", baseHp: 780,  baseAttack: 52,  baseDefense: 55,  isBoss: true, minZone: 8 },
  { name: "The Reality Eater",       emoji: "🌌", baseHp: 800,  baseAttack: 54,  baseDefense: 52,  isBoss: true, minZone: 8 },
  { name: "The Eternal",             emoji: "♾️", baseHp: 880,  baseAttack: 65,  baseDefense: 58,  isBoss: true, minZone: 9 },
  { name: "Fate's End",              emoji: "⌛", baseHp: 950,  baseAttack: 62,  baseDefense: 65,  isBoss: true, minZone: 9 },
  { name: "The Undying",             emoji: "💀", baseHp: 920,  baseAttack: 63,  baseDefense: 62,  isBoss: true, minZone: 9 },
  { name: "The Void Absolute",       emoji: "🕳️", baseHp: 1100, baseAttack: 78,  baseDefense: 68,  isBoss: true, minZone: 10 },
  { name: "Infinite Destroyer",      emoji: "♾️", baseHp: 1250, baseAttack: 75,  baseDefense: 75,  isBoss: true, minZone: 10 },
  { name: "The Undying End",         emoji: "💀", baseHp: 1400, baseAttack: 85,  baseDefense: 72,  isBoss: true, minZone: 10 },
  { name: "Oblivion Incarnate",      emoji: "⚫", baseHp: 1350, baseAttack: 80,  baseDefense: 70,  isBoss: true, minZone: 10 },
  { name: "The Chaos Absolute",      emoji: "🌀", baseHp: 1600, baseAttack: 100, baseDefense: 85,  isBoss: true, minZone: 11 },
  { name: "Primordial Annihilator",  emoji: "💥", baseHp: 1800, baseAttack: 95,  baseDefense: 92,  isBoss: true, minZone: 11 },
  { name: "The Eternal End",         emoji: "♾️", baseHp: 2200, baseAttack: 120, baseDefense: 100, isBoss: true, minZone: 12 },
  { name: "Absolute Darkness",       emoji: "⚫", baseHp: 2500, baseAttack: 115, baseDefense: 110, isBoss: true, minZone: 12 },
  { name: "The Primordial Darkness", emoji: "🌑", baseHp: 2000, baseAttack: 125, baseDefense: 95,  isBoss: true, minZone: 12 },
  // ── New zone 1 bosses ──────────────────────────────────────────────────────
  { name: "Ancient Hill Giant",      emoji: "🏔️", baseHp: 140,  baseAttack: 15,  baseDefense: 13,  isBoss: true, minZone: 1 },
  { name: "Giant Mushroom King",     emoji: "🍄", baseHp: 115,  baseAttack: 12,  baseDefense: 16,  isBoss: true, minZone: 1 },
  { name: "Cursed Village Elder",    emoji: "🧙", baseHp: 125,  baseAttack: 14,  baseDefense: 12,  isBoss: true, minZone: 1 },
  // ── New zone 2 bosses ──────────────────────────────────────────────────────
  { name: "Frost Troll King",        emoji: "❄️", baseHp: 155,  baseAttack: 17,  baseDefense: 20,  isBoss: true, minZone: 2 },
  { name: "Iron Golem Overlord",     emoji: "🤖", baseHp: 165,  baseAttack: 14,  baseDefense: 25,  isBoss: true, minZone: 2 },
  { name: "Venom Witch Queen",       emoji: "🧙", baseHp: 130,  baseAttack: 22,  baseDefense: 10,  isBoss: true, minZone: 2 },
  // ── New zone 3 bosses ──────────────────────────────────────────────────────
  { name: "Lich Overlord",           emoji: "💀", baseHp: 135,  baseAttack: 28,  baseDefense: 10,  isBoss: true, minZone: 3 },
  { name: "Demon Baron",             emoji: "😈", baseHp: 155,  baseAttack: 23,  baseDefense: 15,  isBoss: true, minZone: 3 },
  { name: "Bone Dragon",             emoji: "🦴", baseHp: 175,  baseAttack: 20,  baseDefense: 18,  isBoss: true, minZone: 3 },
  // ── New zone 4 bosses ──────────────────────────────────────────────────────
  { name: "Volcano Dragon",          emoji: "🌋", baseHp: 220,  baseAttack: 26,  baseDefense: 19,  isBoss: true, minZone: 4 },
  { name: "Pyroclastic Titan",       emoji: "🔥", baseHp: 205,  baseAttack: 28,  baseDefense: 16,  isBoss: true, minZone: 4 },
  { name: "Dread Sovereign",         emoji: "👑", baseHp: 185,  baseAttack: 30,  baseDefense: 14,  isBoss: true, minZone: 4 },
  // ── New zone 5 bosses ──────────────────────────────────────────────────────
  { name: "The Endless One",         emoji: "♾️", baseHp: 310,  baseAttack: 36,  baseDefense: 26,  isBoss: true, minZone: 5 },
  { name: "Oblivion Wraith",         emoji: "👤", baseHp: 260,  baseAttack: 40,  baseDefense: 20,  isBoss: true, minZone: 5 },
  // ── New zone 6 bosses ──────────────────────────────────────────────────────
  { name: "Fallen God",              emoji: "😇", baseHp: 480,  baseAttack: 44,  baseDefense: 35,  isBoss: true, minZone: 6 },
  { name: "Seraphic Destroyer",      emoji: "⭐", baseHp: 510,  baseAttack: 40,  baseDefense: 40,  isBoss: true, minZone: 6 },
  // ── New zone 7 bosses ──────────────────────────────────────────────────────
  { name: "Abyss Sovereign",         emoji: "🌊", baseHp: 600,  baseAttack: 50,  baseDefense: 44,  isBoss: true, minZone: 7 },
  { name: "Deep One King",           emoji: "🦑", baseHp: 660,  baseAttack: 46,  baseDefense: 48,  isBoss: true, minZone: 7 },
  { name: "Void Titan of the Deep",  emoji: "🕳️", baseHp: 640,  baseAttack: 48,  baseDefense: 46,  isBoss: true, minZone: 7 },
  // ── New zone 8 bosses ──────────────────────────────────────────────────────
  { name: "Chaos Devourer",          emoji: "🌀", baseHp: 760,  baseAttack: 55,  baseDefense: 50,  isBoss: true, minZone: 8 },
  { name: "Reality Tyrant",          emoji: "💥", baseHp: 810,  baseAttack: 54,  baseDefense: 54,  isBoss: true, minZone: 8 },
  // ── New zone 9 bosses ──────────────────────────────────────────────────────
  { name: "Void Eternal",            emoji: "🕳️", baseHp: 960,  baseAttack: 66,  baseDefense: 62,  isBoss: true, minZone: 9 },
  { name: "Time Sovereign",          emoji: "⏳", baseHp: 910,  baseAttack: 64,  baseDefense: 66,  isBoss: true, minZone: 9 },
  // ── New zone 10 bosses ─────────────────────────────────────────────────────
  { name: "The Nameless God",        emoji: "❓", baseHp: 1300, baseAttack: 82,  baseDefense: 72,  isBoss: true, minZone: 10 },
  { name: "Null Emperor",            emoji: "⚫", baseHp: 1450, baseAttack: 78,  baseDefense: 78,  isBoss: true, minZone: 10 },
  // ── New zone 11 bosses ─────────────────────────────────────────────────────
  { name: "The Final Annihilator",   emoji: "💥", baseHp: 1900, baseAttack: 98,  baseDefense: 94,  isBoss: true, minZone: 11 },
  { name: "Entropy Sovereign",       emoji: "⚫", baseHp: 1700, baseAttack: 102, baseDefense: 88,  isBoss: true, minZone: 11 },
  // ── New zone 12 bosses ─────────────────────────────────────────────────────
  { name: "The True Darkness",       emoji: "🌑", baseHp: 2300, baseAttack: 122, baseDefense: 102, isBoss: true, minZone: 12 },
  { name: "The Primordial Sovereign",emoji: "👑", baseHp: 2600, baseAttack: 118, baseDefense: 115, isBoss: true, minZone: 12 },
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

const BASE_ZONE_MULTS: Record<number, number> = {
  1: 1.0, 2: 1.3, 3: 1.65, 4: 2.1, 5: 2.8,
  6: 4.0, 7: 6.0, 8: 8.8, 9: 13.0, 10: 18.5,
  11: 27.0, 12: 38.0,
};

function getZoneDifficultyMult(zoneId: number): number {
  if (zoneId <= 12) return BASE_ZONE_MULTS[zoneId] ?? 1.0;
  return 27.0 * Math.pow(1.4, zoneId - 12);
}

const INF_MON_ADJECTIVES = ["Abyssal","Void","Eternal","Cosmic","Ancient","Primordial","Transcendent","Eldritch","Ruinous","Forsaken","Boundless","Cataclysmic","Omnipotent","Celestial","Null"];
const INF_MON_NOUNS = ["Colossus","Leviathan","Wraith","Behemoth","Titan","Specter","Devourer","Revenant","Annihilator","Obliterator","Ravager","Destroyer","Nemesis","Sovereign","Overlord"];
const INF_BOSS_NOUNS = ["God-King","Void Emperor","Eternal Tyrant","Cosmic Sovereign","Abyss Lord","World Ender","Chaos Incarnate","Null Arbiter","Primordial Despot","Eldritch Overlord"];

function randomInfMonster(zoneId: number, isBoss: boolean): { name: string; baseHp: number; baseAttack: number; baseDefense: number } {
  const seed = zoneId * 1337;
  const adj = INF_MON_ADJECTIVES[seed % INF_MON_ADJECTIVES.length];
  const noun = isBoss ? INF_BOSS_NOUNS[(seed * 7) % INF_BOSS_NOUNS.length] : INF_MON_NOUNS[(seed * 3) % INF_MON_NOUNS.length];
  return { name: `${adj} ${noun}`, baseHp: 30, baseAttack: 8, baseDefense: 3 };
}

export function spawnMonster(playerLevel: number, options?: { forcedNoBoss?: boolean }): SpawnedMonster {
  const currentZone = getZone(playerLevel);
  const isBoss = !options?.forcedNoBoss && Math.random() < 0.08;
  const monsterLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);
  const scale = 1 + (monsterLevel - 1) * 0.2;
  const zoneMult = getZoneDifficultyMult(currentZone.id);

  let name: string, emoji: string, baseHp: number, baseAttack: number, baseDefense: number, isBossFlag: boolean;

  if (currentZone.id > 12) {
    const inf = randomInfMonster(currentZone.id, isBoss);
    name = inf.name; emoji = "👾"; baseHp = inf.baseHp; baseAttack = inf.baseAttack; baseDefense = inf.baseDefense; isBossFlag = isBoss;
  } else {
    const pool = isBoss ? BOSS_MONSTERS : REGULAR_MONSTERS;
    const zonePool = pool.filter(m => { const mz = m.minZone ?? 1; return mz <= currentZone.id && mz >= Math.max(1, currentZone.id - 1); });
    const finalPool = zonePool.length > 0 ? zonePool : pool.filter(m => (m.minZone ?? 1) <= currentZone.id);
    const template = finalPool[Math.floor(Math.random() * finalPool.length)];
    name = template.name; emoji = template.emoji; baseHp = template.baseHp; baseAttack = template.baseAttack; baseDefense = template.baseDefense; isBossFlag = !!template.isBoss;
  }

  const hp = Math.round(baseHp * scale * zoneMult);
  return { name, emoji, hp, maxHp: hp, attack: Math.round(baseAttack * scale * zoneMult), defense: Math.round(baseDefense * scale * zoneMult), level: monsterLevel, isBoss: isBossFlag, zone: currentZone.id, zoneName: currentZone.name };
}

// ─── Loot ────────────────────────────────────────────────────────────────────

export type Rarity = "Common"|"Uncommon"|"Rare"|"Epic"|"Legendary"|"Mythic"|"Divine"|"Abyssal"|"Transcendent"|"Cosmic"|"Eternal"|"Primordial"|"Omnipotent"|"Sovereign"|"Genesis"|"The Absolute";
export type ItemType = "weapon"|"armor"|"boots"|"gloves"|"amulet"|"ring";

export const ATK_TYPES: ItemType[] = ["weapon", "gloves", "ring"];

export interface LootItem {
  name: string;
  rarity: Rarity;
  emoji: string;
  goldValue: number;
  type: ItemType;
  statBonus: number;
}

const ITEM_EMOJIS: Record<string, string> = {
  "Iron Sword":"🗡️","Wooden Club":"🪵","Short Bow":"🏹","Rusty Dagger":"🔪","Cracked Staff":"🪄","Bone Club":"🦴",
  "Steel Sword":"⚔️","Bronze Spear":"🗡️","Hunter's Bow":"🏹","Steel Dagger":"🔪","War Hammer":"🔨","Iron Halberd":"🪚",
  "Flaming Sword":"🔥","Shadow Blade":"🌙","Crystal Wand":"🔮","Storm Bow":"⚡","Venomfang":"🐍","Cursed Blade":"💀",
  "Dragon Blade":"🐉","Void Reaver":"🕳️","Thunder Staff":"⛈️","Phoenix Talon":"🦅","Soulripper":"👁️","Chaos Saber":"🌀",
  "Excalibur":"✨","Mjolnir":"⚡","Staff of the Void":"🌌","Apollyon's Fang":"🩸","Godslayer":"🔱","Cosmic Blade":"🌠",
  "Wrath of the Ancients":"🔥","Seraph's Edge":"🕊️","Heaven's Wrath":"☀️","Celestial Glaive":"⭐","Sunfire Blade":"🌞","Divine Lance":"✝️",
  "Void Annihilator":"🕳️","Abyssal Scythe":"🌑","Extinction Blade":"🌊","Soul Eater":"💀","The Unmaking":"⚫",
  "Omega Blade":"💠","Reality Shatter":"🌌","Genesis Sword":"💫","The Last Word":"🔮","Infinity Edge":"🌀",
  "Starforged Blade":"⭐","Cosmic Annihilator":"🌌","Nebula Scythe":"🌀","Quasar Lance":"🌠","Galactic Destroyer":"💫",
  "Eternal Blade":"🗡️","The Primordial Sword":"⚔️","End of All Things":"🌑","Destroyer of Worlds":"💀","Eternity Breaker":"🔱",
  "Godforged Blade":"⚔️","The First Sword":"🗡️","Axiom Edge":"✨","World Splitter":"💥","Origin Blade":"🌟","Creation's Fury":"🔱",
  "The Supreme Sword":"⚔️","Omnipotent Edge":"🌌","That Which Cuts All":"💀","The Unstoppable":"💫","Beyond All Blades":"🌠","The Final Weapon":"🔱",
  "Leather Gloves":"🧤","Cloth Wraps":"🤲","Studded Gauntlets":"🧤","Hunter's Gloves":"🤺","Iron Knuckles":"✊","Chain Gauntlets":"⛓️",
  "Flaming Gauntlets":"🔥","Shadow Wraps":"🌙","Cursed Grips":"💀","Dragon Claws":"🐉","Void Gauntlets":"🕳️","Titan Gauntlets":"⚒️",
  "Chaos Grips":"🌀","Celestial Wraps":"✨","Godhand":"🌠",
  "Seraph's Touch":"🕊️","Heaven's Grip":"☀️","Angelic Gauntlets":"⭐",
  "Void Claws":"🕳️","Abyss Grips":"⚫","Nihil Gauntlets":"🌑",
  "Hands of Fate":"💠","Infinity Grasp":"🌌","Genesis Grips":"💫",
  "Nebula Grasp":"🤲","Stardust Wraps":"✨","Cosmic Fist":"⭐",
  "Eternal Grasp":"🤲","Hand of Creation":"✋","Primordial Grip":"⚫",
  "Godforged Grasp":"✊","The First Hands":"🙌","Axiom Gauntlets":"⚡",
  "Omnipotent Grasp":"🤲","That Which Holds All":"✊","The Unbreakable Grip":"💠",
  "Iron Ring":"💍","Stone Band":"🪨","Copper Band":"💫","Silver Ring":"💍","Enchanted Band":"🌀","Warrior's Signet":"⚔️",
  "Flaming Ring":"🔥","Shadow Band":"🌙","Cursed Circlet":"💀","Dragon Ring":"🐉","Void Circlet":"🕳️","Storm Band":"⚡",
  "Ring of Divinity":"🌟","Ring of Power":"⚡","Cosmic Ring":"🌌","Omega Ring":"💠",
  "Halo Band":"🕊️","Seraph's Signet":"☀️","Celestial Ring":"⭐",
  "Void Pact Ring":"🕳️","Abyssal Signet":"⚫","Ring of Annihilation":"🌑",
  "Ring of Infinity":"💠","Fate's Seal":"🌌","Eternity Band":"💫",
  "Cosmic Signet":"🌌","Stellar Band":"🌠","Galaxy Ring":"💫",
  "Eternal Signet":"🔱","Ring of Creation":"🌑","Primordial Band":"⚫",
  "Ring of First Cause":"💫","Godforged Signet":"🔱","The First Seal":"🌟",
  "Omnipotent Signet":"💍","That Which Binds All":"🌌","The Ultimate Seal":"🔱",
  "Leather Vest":"🥋","Cloth Robe":"👘","Padded Tunic":"🧥","Chain Mail":"⛓️","Bronze Plate":"🛡️","Iron Cuirass":"🛡️",
  "Shadow Plate":"🌙","Dragon Scale":"🐲","Cursed Plate":"💀","Abyssal Plate":"🕳️","Phoenix Armor":"🔥","Chaos Plate":"🌀",
  "Aegis of the Gods":"🛡️","Dragonlord Plate":"🐉","Primordial Armor":"🌋",
  "Seraph's Plate":"🕊️","Heaven's Guard":"☀️","Celestial Mail":"⭐","Holy Breastplate":"✝️","Angelic Cuirass":"🌟",
  "Void Carapace":"🕳️","Abyssal Shell":"⚫","Nihil Plate":"🌑","Oblivion Armor":"🌊",
  "Omega Plate":"💠","Reality Shell":"🌌","Genesis Armor":"💫",
  "Cosmic Carapace":"🛡️","Stellar Plate":"⭐","Nebula Shell":"🌌",
  "Eternal Plate":"🛡️","Creation's Guard":"🔱","Primordial Shell":"⚫",
  "Godforged Plate":"🛡️","The First Aegis":"🌟","Axiom Shell":"💠",
  "Omnipotent Plate":"🛡️","That Which Shields All":"💠","The Unbreakable Aegis":"🌌",
  "Leather Boots":"👢","Cloth Sandals":"👡","Wooden Clogs":"🪵","Steel Boots":"⛓️","Hunter's Boots":"🥾","Iron Greaves":"🥾",
  "Swift Treads":"💨","Shadow Boots":"🌙","Cursed Greaves":"💀","Dragon Boots":"🐉","Abyssal Treads":"🕳️","Storm Greaves":"⚡",
  "Boots of Swiftness":"⚡","Celestial Boots":"✨","Cosmic Treads":"🌠",
  "Seraph's Steps":"🕊️","Heaven's Stride":"☀️","Celestial Greaves":"⭐",
  "Void Walkers":"🕳️","Nihil Steps":"🌑",
  "Boots of Infinity":"💠","Fate's Stride":"🌌","Eternity Treads":"💫",
  "Cosmic Striders":"🌠","Stellar Steps":"⭐","Nebula Greaves":"💫",
  "Eternal Treads":"👢","Steps of Creation":"🔱","Primordial Walkers":"⚫",
  "Godforged Stride":"👢","The First Steps":"✨","Axiom Treads":"💠",
  "Omnipotent Stride":"👢","That Which Steps Beyond":"💫","The Boundless Walk":"🌌",
  "Sovereign's Blade":"⚔️","The Sovereign Edge":"🗡️","Decree of Rule":"🔱","Absolute Authority":"👑","Throne's Scepter":"🪄",
  "Sovereign's Grasp":"🤲","Hands of Rule":"✋","Throne's Grip":"👑",
  "Sovereign's Signet":"💍","Ring of Rule":"👑","The Decree Band":"🔱",
  "Sovereign's Aegis":"🛡️","Plate of Rule":"👑","Throne's Shell":"🛡️",
  "Sovereign's Stride":"👢","Steps of Rule":"🔱","Throne's Walk":"👑",
  "Sovereign's Heart":"💎","Soul of Rule":"🌟","Throne's Core":"👑",
  "The First Creation":"🌟","Genesis Blade":"⚔️","Weapon of Making":"🗡️","The Creator's Edge":"✨","Born of Nothing":"🌌",
  "Genesis Grasp":"🤲","Hands of Making":"✋","Creator's Touch":"🌟",
  "Genesis Band":"💍","Ring of Making":"🌟","First Creation's Seal":"✨",
  "Genesis Shell":"🛡️","Plate of Making":"🌟","The First Protection":"✨",
  "Genesis Stride":"👢","Steps of Making":"🌟","The First Walk":"✨",
  "Genesis Core":"💎","Soul of Making":"🌟","Genesis Principle":"✨",
  "The Absolute Blade":"💠","That Which Is Complete":"🌌","The Final Truth":"💫","Beyond Conception":"🌠","Perfection":"✨",
  "The Absolute Grip":"💠","That Which Grasps All":"✊","Complete Mastery":"🤲",
  "The Absolute Seal":"💠","That Which Binds Everything":"🌌","The Complete Band":"💫",
  "The Absolute Shield":"💠","That Which Protects All":"🛡️","Perfect Defense":"🌌",
  "The Absolute Step":"💠","That Which Goes Anywhere":"💫","Perfect Stride":"🌌",
  "The Absolute Soul":"💠","That Which Is Everything":"🌌","The Final Essence":"💫",
  "Iron Pendant":"📿","Stone Amulet":"🪨","Wooden Charm":"🌿","Silver Pendant":"🔮","Enchanted Amulet":"🔮","Hunter's Charm":"🌿",
  "Void Pendant":"🌀","Crystal Amulet":"💎","Cursed Talisman":"💀","Dragon's Eye":"👁️","Abyssal Stone":"🌑","Storm Medallion":"⚡",
  "Amulet of Divinity":"🌟","Celestial Pendant":"✨","Cosmic Medallion":"🌌",
  "Seraph's Token":"🕊️","Heaven's Charm":"☀️","Celestial Medallion":"⭐","Holy Amulet":"✝️","Angelic Pendant":"🌟",
  "Void Heart":"🕳️","Abyssal Core":"⚫","Nihil Pendant":"🌑","Oblivion Stone":"🌊",
  "Omega Charm":"💠","Reality Shard":"🌌","Genesis Stone":"💫","Eternity Core":"⏳",
  "Cosmic Heart":"❤️‍🔥","Stellar Core":"⭐","Nebula Shard":"🌌",
  "Eternal Heart":"💔","Soul of Creation":"🔱","Primordial Core":"⚫",
  "Godforged Core":"💎","The First Principle":"🌟","Axiom Heart":"❤️",
  "Omnipotent Core":"💎","That Which Powers All":"🌌","The Infinite Soul":"✨",
};

function getEmoji(name: string): string { return ITEM_EMOJIS[name] ?? "🎁"; }

const LOOT_POOL: Record<Rarity, Record<ItemType, string[]>> = {
  Common: { weapon:["Iron Sword","Wooden Club","Short Bow","Rusty Dagger","Cracked Staff","Bone Club"], gloves:["Leather Gloves","Cloth Wraps","Iron Knuckles"], ring:["Iron Ring","Stone Band","Copper Band"], armor:["Leather Vest","Cloth Robe","Padded Tunic"], boots:["Leather Boots","Cloth Sandals","Wooden Clogs"], amulet:["Iron Pendant","Stone Amulet","Wooden Charm"] },
  Uncommon: { weapon:["Steel Sword","Bronze Spear","Hunter's Bow","Steel Dagger","War Hammer","Iron Halberd"], gloves:["Studded Gauntlets","Hunter's Gloves","Chain Gauntlets"], ring:["Silver Ring","Enchanted Band","Warrior's Signet"], armor:["Chain Mail","Bronze Plate","Iron Cuirass"], boots:["Steel Boots","Hunter's Boots","Iron Greaves"], amulet:["Silver Pendant","Enchanted Amulet","Hunter's Charm"] },
  Rare: { weapon:["Flaming Sword","Shadow Blade","Crystal Wand","Storm Bow","Venomfang","Cursed Blade"], gloves:["Flaming Gauntlets","Shadow Wraps","Cursed Grips"], ring:["Flaming Ring","Shadow Band","Cursed Circlet"], armor:["Shadow Plate","Dragon Scale","Cursed Plate"], boots:["Swift Treads","Shadow Boots","Cursed Greaves"], amulet:["Void Pendant","Crystal Amulet","Cursed Talisman"] },
  Epic: { weapon:["Dragon Blade","Void Reaver","Thunder Staff","Phoenix Talon","Soulripper","Chaos Saber"], gloves:["Dragon Claws","Void Gauntlets","Chaos Grips"], ring:["Dragon Ring","Void Circlet","Storm Band"], armor:["Abyssal Plate","Phoenix Armor","Chaos Plate"], boots:["Dragon Boots","Abyssal Treads","Storm Greaves"], amulet:["Dragon's Eye","Abyssal Stone","Storm Medallion"] },
  Legendary: { weapon:["Excalibur","Mjolnir","Staff of the Void","Apollyon's Fang","Godslayer"], gloves:["Titan Gauntlets","Celestial Wraps"], ring:["Ring of Divinity","Ring of Power","Omega Ring"], armor:["Aegis of the Gods","Dragonlord Plate"], boots:["Boots of Swiftness","Celestial Boots"], amulet:["Amulet of Divinity","Celestial Pendant"] },
  Mythic: { weapon:["Cosmic Blade","Wrath of the Ancients"], gloves:["Godhand"], ring:["Cosmic Ring"], armor:["Primordial Armor"], boots:["Cosmic Treads"], amulet:["Cosmic Medallion"] },
  Divine: { weapon:["Seraph's Edge","Heaven's Wrath","Celestial Glaive","Sunfire Blade","Divine Lance"], gloves:["Seraph's Touch","Heaven's Grip","Angelic Gauntlets"], ring:["Halo Band","Seraph's Signet","Celestial Ring"], armor:["Seraph's Plate","Heaven's Guard","Celestial Mail","Holy Breastplate","Angelic Cuirass"], boots:["Seraph's Steps","Heaven's Stride","Celestial Greaves"], amulet:["Seraph's Token","Heaven's Charm","Celestial Medallion","Holy Amulet","Angelic Pendant"] },
  Abyssal: { weapon:["Void Annihilator","Abyssal Scythe","Extinction Blade","Soul Eater","The Unmaking"], gloves:["Void Claws","Abyss Grips","Nihil Gauntlets"], ring:["Void Pact Ring","Abyssal Signet","Ring of Annihilation"], armor:["Void Carapace","Abyssal Shell","Nihil Plate","Oblivion Armor"], boots:["Void Walkers","Nihil Steps"], amulet:["Void Heart","Abyssal Core","Nihil Pendant","Oblivion Stone"] },
  Transcendent: { weapon:["Omega Blade","Reality Shatter","Genesis Sword","The Last Word","Infinity Edge"], gloves:["Hands of Fate","Infinity Grasp","Genesis Grips"], ring:["Ring of Infinity","Fate's Seal","Eternity Band"], armor:["Omega Plate","Reality Shell","Genesis Armor"], boots:["Boots of Infinity","Fate's Stride","Eternity Treads"], amulet:["Omega Charm","Reality Shard","Genesis Stone","Eternity Core"] },
  Cosmic: { weapon:["Starforged Blade","Cosmic Annihilator","Nebula Scythe","Quasar Lance","Galactic Destroyer"], gloves:["Nebula Grasp","Stardust Wraps","Cosmic Fist"], ring:["Cosmic Signet","Stellar Band","Galaxy Ring"], armor:["Cosmic Carapace","Stellar Plate","Nebula Shell"], boots:["Cosmic Striders","Stellar Steps","Nebula Greaves"], amulet:["Cosmic Heart","Stellar Core","Nebula Shard"] },
  Eternal: { weapon:["Eternal Blade","The Primordial Sword","End of All Things","Destroyer of Worlds","Eternity Breaker"], gloves:["Eternal Grasp","Hand of Creation","Primordial Grip"], ring:["Eternal Signet","Ring of Creation","Primordial Band"], armor:["Eternal Plate","Creation's Guard","Primordial Shell"], boots:["Eternal Treads","Steps of Creation","Primordial Walkers"], amulet:["Eternal Heart","Soul of Creation","Primordial Core"] },
  Primordial: { weapon:["Godforged Blade","The First Sword","Axiom Edge","World Splitter","Origin Blade","Creation's Fury"], gloves:["Godforged Grasp","The First Hands","Axiom Gauntlets"], ring:["Ring of First Cause","Godforged Signet","The First Seal"], armor:["Godforged Plate","The First Aegis","Axiom Shell"], boots:["Godforged Stride","The First Steps","Axiom Treads"], amulet:["Godforged Core","The First Principle","Axiom Heart"] },
  Omnipotent: { weapon:["The Supreme Sword","Omnipotent Edge","That Which Cuts All","The Unstoppable","Beyond All Blades","The Final Weapon"], gloves:["Omnipotent Grasp","That Which Holds All","The Unbreakable Grip"], ring:["Omnipotent Signet","That Which Binds All","The Ultimate Seal"], armor:["Omnipotent Plate","That Which Shields All","The Unbreakable Aegis"], boots:["Omnipotent Stride","That Which Steps Beyond","The Boundless Walk"], amulet:["Omnipotent Core","That Which Powers All","The Infinite Soul"] },
  Sovereign: { weapon:["Sovereign's Blade","The Sovereign Edge","Decree of Rule","Absolute Authority","Throne's Scepter"], gloves:["Sovereign's Grasp","Hands of Rule","Throne's Grip"], ring:["Sovereign's Signet","Ring of Rule","The Decree Band"], armor:["Sovereign's Aegis","Plate of Rule","Throne's Shell"], boots:["Sovereign's Stride","Steps of Rule","Throne's Walk"], amulet:["Sovereign's Heart","Soul of Rule","Throne's Core"] },
  Genesis:   { weapon:["The First Creation","Genesis Blade","Weapon of Making","The Creator's Edge","Born of Nothing"], gloves:["Genesis Grasp","Hands of Making","Creator's Touch"], ring:["Genesis Band","Ring of Making","First Creation's Seal"], armor:["Genesis Shell","Plate of Making","The First Protection"], boots:["Genesis Stride","Steps of Making","The First Walk"], amulet:["Genesis Core","Soul of Making","Genesis Principle"] },
  "The Absolute": { weapon:["The Absolute Blade","That Which Is Complete","The Final Truth","Beyond Conception","Perfection"], gloves:["The Absolute Grip","That Which Grasps All","Complete Mastery"], ring:["The Absolute Seal","That Which Binds Everything","The Complete Band"], armor:["The Absolute Shield","That Which Protects All","Perfect Defense"], boots:["The Absolute Step","That Which Goes Anywhere","Perfect Stride"], amulet:["The Absolute Soul","That Which Is Everything","The Final Essence"] },
};

const BOSS_UNIQUE_DROPS: Array<{ name: string; type: ItemType; rarity: Rarity; minZone?: number }> = [
  { name:"Colossus Bone Fragment", type:"amulet", rarity:"Legendary", minZone:1 },
  { name:"Troll King's Knuckle",  type:"gloves",  rarity:"Legendary", minZone:1 },
  { name:"Wyrm Scale Trophy",      type:"armor",   rarity:"Legendary", minZone:2 },
  { name:"Plague Mask",            type:"armor",   rarity:"Epic",      minZone:2 },
  { name:"Overlord's Seal",        type:"ring",    rarity:"Legendary", minZone:3 },
  { name:"Shadow Titan's Core",    type:"amulet",  rarity:"Mythic",    minZone:3 },
  { name:"Lich's Phylactery",      type:"ring",    rarity:"Mythic",    minZone:3 },
  { name:"Dragon King's Scale",    type:"armor",   rarity:"Divine",    minZone:4 },
  { name:"Void Tyrant's Crown",    type:"amulet",  rarity:"Divine",    minZone:4 },
  { name:"Abyssal Overlord's Heart",type:"amulet", rarity:"Abyssal",   minZone:5 },
  { name:"Cosmic Destroyer Fragment",type:"ring",  rarity:"Abyssal",   minZone:5 },
  { name:"Void Shard",             type:"weapon",  rarity:"Abyssal",   minZone:5 },
  { name:"Transcendent Relic",     type:"amulet",  rarity:"Transcendent",minZone:5 },
  { name:"Archangel Feather",      type:"amulet",  rarity:"Transcendent",minZone:6 },
  { name:"Celestial Tyrant's Halo",type:"ring",    rarity:"Cosmic",    minZone:6 },
  { name:"Abyss Leviathan Scale",  type:"armor",   rarity:"Cosmic",    minZone:7 },
  { name:"Depths Core",            type:"amulet",  rarity:"Cosmic",    minZone:7 },
  { name:"Fractured Reality Shard",type:"ring",    rarity:"Cosmic",    minZone:8 },
  { name:"Shard of Chaos",         type:"weapon",  rarity:"Cosmic",    minZone:8 },
  { name:"Eternity Fragment",      type:"amulet",  rarity:"Eternal",   minZone:9 },
  { name:"Fate's Tear",            type:"ring",    rarity:"Eternal",   minZone:9 },
  { name:"Void Absolute's Core",   type:"amulet",  rarity:"Eternal",   minZone:10 },
  { name:"The Infinite Shard",     type:"weapon",  rarity:"Eternal",   minZone:10 },
  { name:"Shard of Primordial Chaos",type:"amulet",rarity:"Eternal",   minZone:11 },
  { name:"Chaos Absolute's Core",  type:"ring",    rarity:"Eternal",   minZone:11 },
  { name:"Primordial Annihilator Fang",type:"weapon",rarity:"Eternal", minZone:11 },
  { name:"Fragment of Eternal Darkness",type:"amulet",rarity:"Eternal",minZone:12 },
  { name:"Absolute End's Seal",    type:"ring",    rarity:"Eternal",   minZone:12 },
  { name:"Primordial Darkness Core",type:"weapon", rarity:"Eternal",   minZone:12 },
  { name:"Godforged Fragment",     type:"weapon",  rarity:"Primordial",  minZone:13 },
  { name:"Axiom Core",             type:"amulet",  rarity:"Primordial",  minZone:13 },
  { name:"Omnipotent Shard",       type:"weapon",  rarity:"Omnipotent",  minZone:25 },
  { name:"The Ultimate Seal",      type:"ring",    rarity:"Omnipotent",  minZone:30 },
  { name:"Omnipotent Core",        type:"amulet",  rarity:"Omnipotent",  minZone:35 },
  { name:"Sovereign's Heart",      type:"amulet",  rarity:"Sovereign",   minZone:1  },
  { name:"Sovereign's Blade",      type:"weapon",  rarity:"Sovereign",   minZone:1  },
  { name:"The Decree Band",        type:"ring",    rarity:"Sovereign",   minZone:1  },
  { name:"Genesis Core",           type:"amulet",  rarity:"Genesis",     minZone:1  },
  { name:"Genesis Blade",          type:"weapon",  rarity:"Genesis",     minZone:1  },
  { name:"The Absolute Soul",      type:"amulet",  rarity:"The Absolute",minZone:1  },
  { name:"The Absolute Blade",     type:"weapon",  rarity:"The Absolute",minZone:1  },
];

export const GOLD_VALUES: Record<Rarity, number> = {
  Common:5, Uncommon:15, Rare:40, Epic:100, Legendary:300, Mythic:1000,
  Divine:3500, Abyssal:9000, Transcendent:25000, Cosmic:100000, Eternal:500000,
  Primordial:5000000, Omnipotent:25000000,
  Sovereign:150000000, Genesis:1000000000, "The Absolute":10000000000,
};

export const STAT_BONUSES: Record<Rarity, number> = {
  Common:2, Uncommon:5, Rare:10, Epic:20, Legendary:40, Mythic:80,
  Divine:160, Abyssal:320, Transcendent:640, Cosmic:1280, Eternal:2560,
  Primordial:5120, Omnipotent:10240,
  Sovereign:20480, Genesis:40960, "The Absolute":81920,
};

function pickItemType(): ItemType {
  const types: ItemType[] = ["weapon","armor","boots","gloves","amulet","ring"];
  return types[Math.floor(Math.random() * types.length)];
}

export function rollLoot(isBoss = false, playerLevel = 1, luckLevel = 0): LootItem {
  const zone = getZone(playerLevel);
  const luckMod = Math.min(0.40, luckLevel * 0.02);

  // ── Universal jackpot: insanely rare, drops from ANY monster anywhere ──────
  const jackpotRoll = Math.random();
  let jackpotRarity: Rarity | null = null;
  if      (jackpotRoll < 0.0000002) jackpotRarity = "The Absolute";
  else if (jackpotRoll < 0.000002)  jackpotRarity = "Genesis";
  else if (jackpotRoll < 0.00002)   jackpotRarity = "Sovereign";
  if (jackpotRarity) {
    const itemType = pickItemType();
    const names = LOOT_POOL[jackpotRarity][itemType];
    const name = names[Math.floor(Math.random() * names.length)];
    return { name, rarity: jackpotRarity, emoji: getEmoji(name), goldValue: GOLD_VALUES[jackpotRarity], type: itemType, statBonus: STAT_BONUSES[jackpotRarity] };
  }

  if (isBoss) {
    const eligibleUniques = BOSS_UNIQUE_DROPS.filter(u => (u.minZone ?? 1) <= zone.id);
    if (eligibleUniques.length > 0 && Math.random() < 0.03) {
      const unique = eligibleUniques[Math.floor(Math.random() * eligibleUniques.length)];
      return { name:unique.name, rarity:unique.rarity, emoji:getEmoji(unique.name), goldValue:GOLD_VALUES[unique.rarity], type:unique.type, statBonus:STAT_BONUSES[unique.rarity] };
    }
  }

  let rarity: Rarity;
  if (zone.id > 12) {
    const roll = Math.random() * 100 * (1 - luckMod);
    if (isBoss) {
      // Bosses in infinite zones get a much larger downward shift, giving significantly
      // more Omnipotent/Primordial than regular mobs. depth capped at 8 (zones 13–20).
      const depth = Math.min(8, zone.id - 12);
      const shift = depth * 2.5;                        // 2.5× larger shift than regular
      const adj   = Math.max(0, roll - shift);
      if      (adj < depth * 1.5)       rarity = "Omnipotent";  // 4–32%
      else if (adj < 12 + depth * 1.5)  rarity = "Primordial";  // always ~12%
      else if (adj < 55 + depth)        rarity = "Eternal";
      else if (adj < 85)                rarity = "Cosmic";
      else                              rarity = "Transcendent";
    } else {
      const depth = Math.min(60, zone.id - 12);
      const adj   = Math.max(0, roll - depth);
      if      (adj < depth * 0.5)        rarity = "Omnipotent";
      else if (adj < 10 + depth * 0.8)   rarity = "Primordial";
      else if (adj < 55 + depth * 0.5)   rarity = "Eternal";
      else if (adj < 85)                 rarity = "Cosmic";
      else                               rarity = "Transcendent";
    }
  } else if (isBoss) {
    const roll = Math.random() * 100 * (1 - luckMod);
    if (zone.id >= 12) {
      rarity = roll < 30 ? "Eternal" : roll < 80 ? "Cosmic" : "Transcendent";
    } else if (zone.id >= 11) {
      rarity = roll < 12 ? "Eternal" : roll < 45 ? "Cosmic" : roll < 78 ? "Transcendent" : "Abyssal";
    } else if (zone.id >= 10) {
      rarity = roll < 4 ? "Eternal" : roll < 20 ? "Cosmic" : roll < 50 ? "Transcendent" : roll < 80 ? "Abyssal" : "Divine";
    } else if (zone.id >= 9) {
      rarity = roll < 1 ? "Eternal" : roll < 6 ? "Cosmic" : roll < 22 ? "Transcendent" : roll < 52 ? "Abyssal" : roll < 82 ? "Divine" : "Mythic";
    } else if (zone.id >= 8) {
      rarity = roll < 0.3 ? "Eternal" : roll < 2 ? "Cosmic" : roll < 10 ? "Transcendent" : roll < 32 ? "Abyssal" : roll < 65 ? "Divine" : roll < 90 ? "Mythic" : "Legendary";
    } else if (zone.id >= 7) {
      rarity = roll < 0.05 ? "Eternal" : roll < 0.5 ? "Cosmic" : roll < 5 ? "Transcendent" : roll < 20 ? "Abyssal" : roll < 52 ? "Divine" : roll < 80 ? "Mythic" : "Legendary";
    } else if (zone.id >= 6) {
      rarity = roll < 0.1 ? "Cosmic" : roll < 1.5 ? "Transcendent" : roll < 10 ? "Abyssal" : roll < 35 ? "Divine" : roll < 68 ? "Mythic" : roll < 92 ? "Legendary" : "Epic";
    } else if (zone.id >= 5) {
      rarity = roll < 0.4 ? "Transcendent" : roll < 3 ? "Abyssal" : roll < 16 ? "Divine" : roll < 45 ? "Mythic" : roll < 78 ? "Legendary" : "Epic";
    } else if (zone.id >= 4) {
      rarity = roll < 0.1 ? "Abyssal" : roll < 1.5 ? "Divine" : roll < 10 ? "Mythic" : roll < 38 ? "Legendary" : roll < 75 ? "Epic" : roll < 96 ? "Rare" : "Uncommon";
    } else if (zone.id >= 3) {
      rarity = roll < 0.4 ? "Divine" : roll < 3.5 ? "Mythic" : roll < 20 ? "Legendary" : roll < 60 ? "Epic" : roll < 90 ? "Rare" : "Uncommon";
    } else if (zone.id >= 2) {
      rarity = roll < 0.2 ? "Mythic" : roll < 4 ? "Legendary" : roll < 28 ? "Epic" : roll < 70 ? "Rare" : roll < 95 ? "Uncommon" : "Common";
    } else {
      rarity = roll < 0.8 ? "Legendary" : roll < 10 ? "Epic" : roll < 42 ? "Rare" : roll < 80 ? "Uncommon" : "Common";
    }
  } else {
    const roll = Math.random() * 100 * (1 - luckMod);
    if (zone.id >= 12) {
      rarity = roll < 2 ? "Eternal" : roll < 10 ? "Cosmic" : roll < 28 ? "Transcendent" : roll < 55 ? "Abyssal" : roll < 78 ? "Divine" : roll < 94 ? "Mythic" : "Legendary";
    } else if (zone.id >= 11) {
      rarity = roll < 0.5 ? "Eternal" : roll < 4 ? "Cosmic" : roll < 15 ? "Transcendent" : roll < 36 ? "Abyssal" : roll < 60 ? "Divine" : roll < 82 ? "Mythic" : "Legendary";
    } else if (zone.id >= 10) {
      rarity = roll < 0.1 ? "Eternal" : roll < 1 ? "Cosmic" : roll < 6 ? "Transcendent" : roll < 18 ? "Abyssal" : roll < 40 ? "Divine" : roll < 68 ? "Mythic" : "Legendary";
    } else if (zone.id >= 9) {
      rarity = roll < 0.03 ? "Eternal" : roll < 0.3 ? "Cosmic" : roll < 2 ? "Transcendent" : roll < 10 ? "Abyssal" : roll < 28 ? "Divine" : roll < 58 ? "Mythic" : "Legendary";
    } else if (zone.id >= 8) {
      rarity = roll < 0.005 ? "Eternal" : roll < 0.05 ? "Cosmic" : roll < 0.5 ? "Transcendent" : roll < 4 ? "Abyssal" : roll < 16 ? "Divine" : roll < 42 ? "Mythic" : roll < 72 ? "Legendary" : "Epic";
    } else if (zone.id >= 7) {
      rarity = roll < 0.001 ? "Cosmic" : roll < 0.2 ? "Transcendent" : roll < 2 ? "Abyssal" : roll < 9 ? "Divine" : roll < 28 ? "Mythic" : roll < 58 ? "Legendary" : roll < 82 ? "Epic" : "Rare";
    } else if (zone.id >= 6) {
      rarity = roll < 0.05 ? "Transcendent" : roll < 0.5 ? "Abyssal" : roll < 3 ? "Divine" : roll < 12 ? "Mythic" : roll < 32 ? "Legendary" : roll < 62 ? "Epic" : roll < 84 ? "Rare" : "Uncommon";
    } else if (zone.id >= 5) {
      rarity = roll < 0.02 ? "Abyssal" : roll < 0.3 ? "Divine" : roll < 2 ? "Mythic" : roll < 8 ? "Legendary" : roll < 28 ? "Epic" : roll < 60 ? "Rare" : roll < 84 ? "Uncommon" : "Common";
    } else if (zone.id >= 4) {
      rarity = roll < 0.05 ? "Divine" : roll < 0.5 ? "Mythic" : roll < 3 ? "Legendary" : roll < 15 ? "Epic" : roll < 42 ? "Rare" : roll < 75 ? "Uncommon" : "Common";
    } else if (zone.id >= 3) {
      rarity = roll < 0.05 ? "Mythic" : roll < 0.5 ? "Legendary" : roll < 5 ? "Epic" : roll < 22 ? "Rare" : roll < 55 ? "Uncommon" : "Common";
    } else if (zone.id >= 2) {
      rarity = roll < 0.01 ? "Mythic" : roll < 0.2 ? "Legendary" : roll < 2 ? "Epic" : roll < 12 ? "Rare" : roll < 45 ? "Uncommon" : "Common";
    } else {
      rarity = roll < 0.005 ? "Mythic" : roll < 0.1 ? "Legendary" : roll < 1 ? "Epic" : roll < 7 ? "Rare" : roll < 28 ? "Uncommon" : "Common";
    }
  }

  const itemType = pickItemType();
  const names = LOOT_POOL[rarity][itemType];
  const name = names[Math.floor(Math.random() * names.length)];
  return { name, rarity, emoji: getEmoji(name), goldValue: GOLD_VALUES[rarity], type: itemType, statBonus: STAT_BONUSES[rarity] };
}

// ─── Player Formulas ─────────────────────────────────────────────────────────

export function xpToNextLevel(level: number): number { return Math.floor(100 * Math.pow(1.3, level - 1)); }
export function calcMaxHp(level: number): number { return 100 + (level - 1) * 15; }
export function calcAttack(level: number, meleeSkillLevel = 1): number { return 10 + (level - 1) * 3 + (meleeSkillLevel - 1) * 3; }
export function calcDefense(level: number, defenseSkillLevel = 1): number { return 5 + (level - 1) * 2 + (defenseSkillLevel - 1) * 2; }
export const MELEE_SKILL_ATK_PER_LEVEL = 3;
export const DEFENSE_SKILL_DEF_PER_LEVEL = 2;
export function skillXpToNextLevel(skillLevel: number): number { return Math.floor(50 * Math.pow(1.5, skillLevel - 1)); }

export function calcDamage(attackerAttack: number, defenderDefense: number): number {
  const pierce = Math.max(1, Math.ceil(attackerAttack * 0.08));
  const base = Math.max(pierce, attackerAttack - Math.floor(defenderDefense / 2));
  const variance = Math.floor(Math.random() * (base * 0.4)) - Math.floor(base * 0.2);
  return Math.max(1, base + variance);
}

// ─── Ascension ────────────────────────────────────────────────────────────────

export const ASCEND_MIN_LEVEL = 100;
export function ascensionXpMultiplier(ascensionLevel: number): number { return 1 + ascensionLevel * 0.25; }
export function ascensionGoldMultiplier(ascensionLevel: number): number { return 1 + ascensionLevel * 0.15; }

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
  { name:"Ares", title:"God of War", lore:"The God of War descends upon the mortal realm, seeking worthy opponents to satisfy his insatiable bloodlust.", minLevel:25, baseHp:2500, baseAttack:55, baseDefense:20, enrageMultiplier:1.8, enrageThreshold:0.5, phaseMessage:"Ares flies into a divine rage! His attacks grow devastating!", cooldownMinutes:30 },
  { name:"Thanatos", title:"God of Death", lore:"The pale god of death walks the battlefield, his very presence extinguishing the life force of all who face him.", minLevel:75, baseHp:5000, baseAttack:85, baseDefense:35, enrageMultiplier:2.0, enrageThreshold:0.4, phaseMessage:"Thanatos channels the power of Death itself — his touch now drains your very soul!", cooldownMinutes:30 },
  { name:"Kronos", title:"God of Time", lore:"The Titan lord of time bends reality itself, aging enemies with a glance and shattering armies across timelines.", minLevel:150, baseHp:10000, baseAttack:120, baseDefense:60, enrageMultiplier:2.2, enrageThreshold:0.4, phaseMessage:"Kronos accelerates time — every heartbeat feels like a century of torment!", cooldownMinutes:45 },
  { name:"Typhon", title:"Father of Monsters", lore:"The primordial monster-father, larger than mountains, whose roar shakes the heavens and whose gaze melts stone.", minLevel:300, baseHp:22000, baseAttack:180, baseDefense:90, enrageMultiplier:2.5, enrageThreshold:0.45, phaseMessage:"Typhon's hundred heads all turn toward you and ROAR — reality fractures around him!", cooldownMinutes:60 },
  { name:"Nyx", title:"Goddess of Night", lore:"Primordial night given form. Even the gods fear her. She wraps the world in eternal darkness and bends fate.", minLevel:500, baseHp:50000, baseAttack:280, baseDefense:140, enrageMultiplier:2.8, enrageThreshold:0.35, phaseMessage:"Nyx tears open the veil of night — absolute darkness swallows all light and hope!", cooldownMinutes:90 },
  { name:"Erebus", title:"Void Absolute", lore:"The very embodiment of void and primordial darkness. Older than creation. Fighting Erebus is fighting nothingness.", minLevel:750, baseHp:120000, baseAttack:450, baseDefense:220, enrageMultiplier:3.0, enrageThreshold:0.3, phaseMessage:"Erebus tears reality apart — existence itself begins to unravel!", cooldownMinutes:120 },
  { name:"Azathoth", title:"The Blind Idiot God", lore:"The demon sultan beyond all space and time, whose mindless piping sustains creation itself.", minLevel:1000, baseHp:400000, baseAttack:900, baseDefense:450, enrageMultiplier:3.5, enrageThreshold:0.25, phaseMessage:"Azathoth's piping reaches a fever pitch — reality SCREAMS and the laws of physics dissolve around you!", cooldownMinutes:180 },
  { name:"The Infinite", title:"That Which Has No End", lore:"Not a being but a concept given horrifying form. It cannot be destroyed — only temporarily refused.", minLevel:1500, baseHp:1500000, baseAttack:2200, baseDefense:1100, enrageMultiplier:4.0, enrageThreshold:0.2, phaseMessage:"The Infinite splits into endless iterations — each copy is as lethal as the original!", cooldownMinutes:240 },
  { name:"Ouroboros",       title:"The Serpent Without End",      lore:"The world-serpent that devours its own tail, consuming every timeline simultaneously.",                                                              minLevel:2000,  baseHp:6000000,       baseAttack:5000,      baseDefense:2500,      enrageMultiplier:5.0,  enrageThreshold:0.15, phaseMessage:"Ouroboros bites its tail and loops causality — every wound you've inflicted resets to zero!",                                                cooldownMinutes:360  },
  { name:"Yog-Sothoth",     title:"The Gate and the Key",         lore:"The omniscient outer god that exists beyond all dimensions simultaneously. It is the gate, the key, and the guardian — all at once.",             minLevel:2500,  baseHp:20000000,      baseAttack:12000,     baseDefense:6000,      enrageMultiplier:5.2,  enrageThreshold:0.15, phaseMessage:"Yog-Sothoth opens the Gate — infinite echoes of itself pour through, each as deadly as the last!",                                          cooldownMinutes:480  },
  { name:"Nemesis",         title:"Goddess of Divine Retribution", lore:"She who balances all power. Nemesis mirrors your strength and counters your every strategy, ensuring no warrior grows too mighty unchecked.",    minLevel:3000,  baseHp:70000000,      baseAttack:30000,     baseDefense:15000,     enrageMultiplier:5.5,  enrageThreshold:0.12, phaseMessage:"Nemesis perfectly mirrors your fighting style — every attack you know, she now knows better!",                                               cooldownMinutes:600  },
  { name:"The Devourer",    title:"Hunger Without End",            lore:"A primordial force older than gods. It does not think, does not plan — it only consumes. Planets, stars, timelines — all are merely food.",      minLevel:4000,  baseHp:250000000,     baseAttack:80000,     baseDefense:40000,     enrageMultiplier:6.0,  enrageThreshold:0.10, phaseMessage:"The Devourer's hunger reaches a frenzy — it begins consuming reality itself to fuel its onslaught!",                                          cooldownMinutes:720  },
  { name:"Chronovore",      title:"Eater of Ages",                 lore:"Not merely a manipulator of time — Chronovore literally consumes it. Entire eons vanish into its maw, erasing battles before they begin.",        minLevel:5500,  baseHp:1000000000,    baseAttack:220000,    baseDefense:110000,    enrageMultiplier:6.5,  enrageThreshold:0.10, phaseMessage:"Chronovore swallows your past actions — your last ten seconds of combat never happened!",                                                   cooldownMinutes:1080 },
  { name:"Tiamat Prime",    title:"Primordial Chaos Dragon",       lore:"The first dragon ever to exist — before law, before order, before the gods themselves. Tiamat Prime is chaos given draconic form.",               minLevel:7500,  baseHp:4000000000,    baseAttack:600000,    baseDefense:300000,    enrageMultiplier:7.0,  enrageThreshold:0.08, phaseMessage:"Tiamat Prime breathes the chaos-fire that predates creation — the laws of physics burn away!",                                             cooldownMinutes:1440 },
  { name:"Apeiron",         title:"The Boundless",                 lore:"The philosophical first principle — the infinite, formless void that preceded all existence. Apeiron has no beginning, no end, and no mercy.",     minLevel:10000, baseHp:20000000000,   baseAttack:2000000,   baseDefense:1000000,   enrageMultiplier:7.5,  enrageThreshold:0.08, phaseMessage:"Apeiron expands to its boundless true form — finite beings cannot comprehend what stands before them!",                                       cooldownMinutes:2160 },
  { name:"Yaldabaoth",      title:"The Demiurge Unchained",        lore:"The false creator god, now freed from all restraint. It built this universe as a prison and now tears it apart in a fit of divine madness.",       minLevel:13000, baseHp:100000000000,  baseAttack:7000000,   baseDefense:3500000,   enrageMultiplier:8.0,  enrageThreshold:0.06, phaseMessage:"Yaldabaoth unmakes its own creation — the dungeon collapses into the Demiurge's absolute authority!",                                      cooldownMinutes:2880 },
  { name:"Final Entropy",   title:"All Things Ending",             lore:"Not a being — a certainty. The inevitable heat death of all universes given will and form. It does not attack; it merely accelerates the end.",     minLevel:17000, baseHp:600000000000,  baseAttack:25000000,  baseDefense:12500000,  enrageMultiplier:8.5,  enrageThreshold:0.05, phaseMessage:"Final Entropy reaches critical cascade — every system, every structure, every hope begins to dissolve!",                                     cooldownMinutes:4320 },
  { name:"The First Cause", title:"That Which Began Everything",   lore:"The primordial force responsible for the first moment of existence. It does not understand mercy — mercy had not yet been invented when it arose.", minLevel:22000, baseHp:4000000000000, baseAttack:90000000,  baseDefense:45000000,  enrageMultiplier:9.0,  enrageThreshold:0.04, phaseMessage:"The First Cause rewrites your origin — for a moment, you cease to have ever existed!",                                                     cooldownMinutes:5760 },
  { name:"Origin",          title:"The Source of All Creation",    lore:"Before the first cause, before the void, before nothingness — there was Origin. It is the answer to the question that cannot be asked.",           minLevel:30000, baseHp:30000000000000,baseAttack:350000000, baseDefense:175000000, enrageMultiplier:10.0, enrageThreshold:0.03, phaseMessage:"Origin collapses back to the single point before creation — infinite density, infinite destruction, infinite despair!",                    cooldownMinutes:7200 },
];

const RAID_LOOT_POOL: Record<string, Partial<Record<ItemType, string[]>>> = {
  "Ares":        { weapon:["Warblade of Ares","Ares' Spear of Glory","Blood-Drenched Sword"], armor:["Ares' War Plate","Plate of Eternal Conflict"], ring:["Signet of the War God","Band of Martial Fury"], amulet:["Heart of War","Ares' Divine Token"], gloves:["Gauntlets of Ares","War God's Iron Grip"], boots:["Ares' War Treads","Boots of the Battlefield"] },
  "Thanatos":    { weapon:["Scythe of Death","Thanatos' Soul Reaper","Blade of Final Rest"], armor:["Shroud of Thanatos","Deathward Plate"], ring:["Death God's Band","Ring of the Pale God"], amulet:["Soul of Thanatos","Charm of Final Hour"], gloves:["Hands of Death","Thanatos' Pale Grasp"], boots:["Death God's Steps","Pale Walker Boots"] },
  "Kronos":      { weapon:["Scythe of Ages","Kronos' Time Reaper","Blade of Eternity"], armor:["Timeless Plate","Kronosian Shell"], ring:["Ring of Ages","Time God's Signet"], amulet:["Heart of Time","Hourglass Pendant"], gloves:["Gauntlets of Ages","Timeless Grip"], boots:["Boots of Eternity","Time God's Stride"] },
  "Typhon":      { weapon:["Fang of Typhon","Monster Father's Claw","Typhonic Spear"], armor:["Scale of Typhon","Monster King's Hide"], ring:["Ring of the Monster Lord","Typhon's Iron Band"], amulet:["Monster Father's Core","Typhon's Roar Stone"], gloves:["Typhon's Iron Claw","Hundred-Fist Wraps"], boots:["Typhon's Earthshaker Boots","Monster Lord Treads"] },
  "Nyx":         { weapon:["Staff of Eternal Night","Nyx's Starless Blade","Night Absolute Scepter"], armor:["Veil of Nyx","Night Absolute Plate"], ring:["Ring of Eternal Night","Night Goddess Signet"], amulet:["Heart of Darkness","Night Goddess Soul"], gloves:["Nyx's Shadow Grasp","Hands of Eternal Night"], boots:["Night Goddess Stride","Nyx's Starless Steps"] },
  "Erebus":      { weapon:["Void Absolute Blade","Erebus' World Ender","Arm of the Primordial"], armor:["Erebus' Void Shell","Primordial Dark Plate"], ring:["Ring of the Void Absolute","Erebus' Eternal Band"], amulet:["Heart of the Void Absolute","Primordial Dark Soul"], gloves:["Erebus' Void Grasp","Primordial Null Hands"], boots:["Void Absolute Stride","Erebus' Null Treads"] },
  "Azathoth":    { weapon:["Pipe of the Blind Sultan","Azathoth's Chaos Edge","The Mad Flautist's Blade"], armor:["Shell of the Idiot God","Azathoth's Void Carapace"], ring:["Ring of the Blind Sultan","Azathoth's Chaos Signet"], amulet:["Heart of the Outer Dark","Azathoth's Chaos Core"], gloves:["Azathoth's Void Grasp","Hands of the Blind God"], boots:["Azathoth's Mad Steps","Boots of the Outer Dark"] },
  "The Infinite":{ weapon:["Blade Without End","Sword of Endless Possibilities","The Infinite's Edge"], armor:["Plate of Infinity","The Endless Shell"], ring:["Seal of the Infinite","Band of Endless Power"], amulet:["The Infinite Soul","Core of Endless Power"], gloves:["Grasp of the Infinite","Hands of Endless Force"], boots:["Stride of Infinity","Steps That Never Stop"] },
  "Ouroboros":     { weapon:["Fang of the World Serpent","Ouroboros' Eternal Fang","The Serpent's World Blade"], armor:["Scale of the Endless Serpent","Ouroboros' Void Shell"], ring:["Ouroboros' Eternal Band","Ring of the World Serpent"], amulet:["Heart of the World Serpent","Ouroboros' Timeless Core"], gloves:["Ouroboros' Coiling Grasp","Serpent King's Eternal Grip"], boots:["Ouroboros' Endless Stride","World Serpent's Steps"] },
  "Yog-Sothoth":   { weapon:["Key of Infinite Gates","Yog-Sothoth's Dimensional Blade","The Gate-Piercer"], armor:["Mantle of All Dimensions","Yog-Sothoth's Iridescent Skin"], ring:["Ring of the Gate God","Signet of Infinite Doors"], amulet:["Eye of Yog-Sothoth","All-Seeing Void Pendant"], gloves:["Grasp of All Dimensions","Gate God's Reaching Hand"], boots:["Steps Between Worlds","Yog-Sothoth's Dimensional Treads"] },
  "Nemesis":       { weapon:["Mirror of Divine Justice","Nemesis' Retribution Blade","The Balancing Edge"], armor:["Plate of Perfect Retribution","Nemesis' Equalizing Shell"], ring:["Ring of Divine Balance","Signet of Nemesis"], amulet:["Scales of Retribution","Nemesis' Justice Core"], gloves:["Gauntlets of Divine Balance","Hands of Retribution"], boots:["Steps of Divine Justice","Nemesis' Balancing Stride"] },
  "The Devourer":  { weapon:["Maw of Infinite Hunger","The Devourer's Consuming Edge","Fang of the Hungering Void"], armor:["Carapace of Endless Consumption","The Devourer's Plating"], ring:["Band of Insatiable Hunger","Devourer's Consuming Loop"], amulet:["Core of the Hungering Void","The Devourer's Hollow Heart"], gloves:["Consuming Grasp","The Devourer's Hungering Claws"], boots:["Treads of Endless Consumption","Steps of the Void Maw"] },
  "Chronovore":    { weapon:["The Age-Eater's Fang","Chronovore's Timeline Blade","Maw of Consumed Eons"], armor:["Plate of Devoured Ages","Chronovore's Temporal Shell"], ring:["Ring of Eaten Time","Chronovore's Temporal Band"], amulet:["Heart of Devoured Ages","Chronovore's Hollow Epoch"], gloves:["Grasp of the Age-Eater","Chronovore's Temporal Claws"], boots:["Stride of Devoured Time","Chronovore's Ageless Steps"] },
  "Tiamat Prime":  { weapon:["Fang of the First Dragon","Tiamat Prime's Chaos Claw","Primordial Chaos Lance"], armor:["Scale of the First Dragon","Tiamat Prime's Chaos Carapace"], ring:["Ring of the Primordial Dragon","Tiamat's Chaos Signet"], amulet:["Heart of Primordial Chaos","Tiamat Prime's Dragon Core"], gloves:["Primordial Dragon's Claw","Tiamat's Chaos Grip"], boots:["Tiamat Prime's Earthshaking Stride","Primordial Dragon Treads"] },
  "Apeiron":       { weapon:["Edge of the Boundless","Apeiron's Formless Blade","The Infinite Principle's Cut"], armor:["Mantle of the Boundless","Apeiron's Formless Shell"], ring:["Ring of the Boundless","Apeiron's Formless Band"], amulet:["Heart of the Boundless","Apeiron's Void Core"], gloves:["Apeiron's Formless Grasp","Hands of the Boundless"], boots:["Apeiron's Formless Stride","Steps of the Boundless"] },
  "Yaldabaoth":    { weapon:["Demiurge's Unchained Scepter","Yaldabaoth's Prison Breaker","The Creator's Regret"], armor:["Plate of the False Creator","Yaldabaoth's Demiurge Shell"], ring:["Ring of the False God","Demiurge's Signet"], amulet:["Yaldabaoth's Prison Key","Heart of the False Creator"], gloves:["Demiurge's Unchained Grasp","Yaldabaoth's Creator Hands"], boots:["Steps of the Unchained God","Yaldabaoth's Demiurge Stride"] },
  "Final Entropy": { weapon:["Blade of All Endings","Final Entropy's Last Edge","The Inevitable Cut"], armor:["Shroud of All Endings","Final Entropy's Dissolution Plate"], ring:["Ring of the Final Moment","Band of All Endings"], amulet:["The Final Moment's Core","Heart of All Endings"], gloves:["Grasp of the Final Moment","Hands of All Endings"], boots:["Steps of the Last Moment","Final Entropy's Dissolution Stride"] },
  "The First Cause":{ weapon:["The Original Strike","First Cause's Primordial Edge","The Uncaused Blade"], armor:["Plate of the First Moment","The First Cause's Shell"], ring:["Ring of the Primordial Moment","Signet of the First Cause"], amulet:["Heart of the First Moment","The First Cause's Origin Core"], gloves:["Gauntlets of the First Moment","The First Cause's Primordial Grip"], boots:["Steps of the First Moment","The First Cause's Origin Stride"] },
  "Origin":        { weapon:["The Source Blade","Origin's All-Blade","The Weapon Before Weapons"], armor:["The Source Shell","Origin's Primordial Plate"], ring:["The Source Band","Origin's All-Ring"], amulet:["The Source Core","Origin's Primordial Heart"], gloves:["The Source Grasp","Origin's All-Hands"], boots:["The Source Stride","Origin's All-Steps"] },
};

const RAID_RARITY: Record<string, Rarity> = {
  "Ares":"Eternal","Thanatos":"Eternal","Kronos":"Eternal","Typhon":"Eternal","Nyx":"Eternal",
  "Erebus":"Eternal","Azathoth":"Primordial","The Infinite":"Omnipotent","Ouroboros":"Omnipotent",
  "Yog-Sothoth":"Omnipotent","Nemesis":"Sovereign","The Devourer":"Sovereign","Chronovore":"Sovereign",
  "Tiamat Prime":"Genesis","Apeiron":"Genesis","Yaldabaoth":"Genesis",
  "Final Entropy":"The Absolute","The First Cause":"The Absolute","Origin":"The Absolute",
};

// Rarity tiers for raid loot rolls (ascending order)
const RAID_RARITY_TIER: Rarity[] = ["Cosmic", "Eternal", "Primordial", "Omnipotent", "Sovereign", "Genesis", "The Absolute"];

function rollRaidRarity(maxRarity: Rarity): Rarity {
  const maxIdx = RAID_RARITY_TIER.indexOf(maxRarity);
  if (maxIdx < 0) return maxRarity;
  const roll = Math.random() * 100;
  // 15% chance at the boss's max rarity, 55% one tier below, 30% two below
  if (roll < 15 || maxIdx === 0) return RAID_RARITY_TIER[maxIdx];
  if (roll < 70 || maxIdx === 1)  return RAID_RARITY_TIER[maxIdx - 1];
  return RAID_RARITY_TIER[Math.max(0, maxIdx - 2)];
}

export function rollRaidLoot(godName: string): LootItem {
  const maxRarity: Rarity = RAID_RARITY[godName] ?? "Eternal";
  const rarity = rollRaidRarity(maxRarity);
  const pool = RAID_LOOT_POOL[godName];
  const itemType = pickItemType();
  // Use god-specific names only when hitting the boss's max rarity, otherwise generic pool
  const names = (rarity === maxRarity && pool?.[itemType]) ? pool[itemType]! : LOOT_POOL[rarity][itemType];
  const name = names[Math.floor(Math.random() * names.length)];
  return { name, rarity, emoji: getEmoji(name), goldValue: Math.floor(GOLD_VALUES[rarity] * 1.5), type: itemType, statBonus: STAT_BONUSES[rarity] };
}

export function getGodByName(name: string): GodBoss | undefined { return GOD_BOSSES.find(g => g.name === name); }

export function scaleGodForPlayer(god: GodBoss, playerLevel: number): { hp: number; attack: number; defense: number } {
  const scaleFactor = Math.max(1, playerLevel / god.minLevel);
  return { hp: Math.floor(god.baseHp * scaleFactor), attack: Math.floor(god.baseAttack * scaleFactor), defense: Math.floor(god.baseDefense * scaleFactor) };
}

// ─── Fishing ──────────────────────────────────────────────────────────────────

export type FishRarity = "Common"|"Uncommon"|"Rare"|"Magical"|"Epic"|"Legendary"|"Ancient"|"Mythic"|"Divine"|"Cosmic"|"Eternal"|"Transcendent"|"Celestial"|"Primordial"|"Void"|"Abyssal"|"Eldritch"|"Oblivion"|"Cataclysm"|"Paradox"|"Omniversal"|"Apex"|"Singular"|"Origin"|"The End";

export const FISH_GOLD: Record<FishRarity, number> = {
  Common:1, Uncommon:2, Rare:5, Magical:12, Epic:28, Legendary:65,
  Ancient:150, Mythic:350, Divine:800, Cosmic:2000, Eternal:5000,
  Transcendent:12000, Celestial:30000, Primordial:75000, Void:250000,
  Abyssal:750000, Eldritch:2000000, Oblivion:6000000, Cataclysm:18000000,
  Paradox:55000000, Omniversal:150000000, Apex:500000000,
  Singular:1500000000, Origin:5000000000, "The End":20000000000,
};

export const FISH_WEIGHT: Record<FishRarity, [number, number]> = {
  Common:[50,500], Uncommon:[200,1500], Rare:[500,4000], Magical:[1000,8000],
  Epic:[2000,15000], Legendary:[5000,30000], Ancient:[10000,60000], Mythic:[20000,100000],
  Divine:[40000,200000], Cosmic:[80000,400000], Eternal:[150000,800000],
  Transcendent:[300000,1500000], Celestial:[500000,3000000], Primordial:[1000000,6000000],
  Void:[5000000,20000000],
  Abyssal:[10000000,60000000], Eldritch:[30000000,150000000],
  Oblivion:[100000000,500000000], Cataclysm:[500000000,2000000000],
  Paradox:[2000000000,10000000000], Omniversal:[10000000000,50000000000],
  Apex:[50000000000,200000000000], Singular:[200000000000,1000000000000],
  Origin:[1000000000000,5000000000000], "The End":[5000000000000,20000000000000],
};

export const FISH_NAMES: Record<FishRarity, string[]> = {
  Common:["Minnow","Perch","Carp","Sardine","Herring","Roach","Dace","Bleak","Gudgeon","Sprat"],
  Uncommon:["Bass","Pike","Catfish","Bream","Tench","Rudd","Chub","Barbel","Grayling","Whitefish"],
  Rare:["Salmon","Walleye","Snapper","Grouper","Mackerel","Zander","Asp","Ide","Vimba","Orfe"],
  Magical:["Golden Carp","Silver Trout","Moonfish","Crystal Perch","Starfin Bass","Shimmer Eel","Glowfish","Prism Carp"],
  Epic:["Dragon Goby","Shadow Eel","Phantom Barracuda","Abyssal Tuna","Thunder Salmon","Storm Pike","Venom Carp","Wraith Bass"],
  Legendary:["Void Marlin","Ancient Coelacanth","Tempest Shark","Leviathan Eel","Titan Catfish","Behemoth Bass"],
  Ancient:["Soul Salmon","Time Catfish","Dimensional Trout","Chrono Carp","Echo Perch","Memory Eel","Dream Marlin"],
  Mythic:["Aethereal Bass","Celestial Pike","Astral Grouper","Rift Shark","Void Leviathan","Chaos Coelacanth"],
  Divine:["God Carp","Sacred Sturgeon","Divine Leviathan","Holy Eel","Blessed Marlin","Radiant Salmon"],
  Cosmic:["Cosmic Manta","Galaxy Whale","Nebula Shark","Star Serpent","Pulsar Eel","Quasar Carp"],
  Eternal:["Eternal Serpent","Infinity Fish","Ouroboros Eel","Timeless Leviathan","Boundless Carp"],
  Transcendent:["Transcendent Leviathan","Beyond Bass","Infinite Pike","Absolute Eel","Limitless Marlin"],
  Celestial:["The First Fish","Celestial Leviathan","Origin Carp","Genesis Eel","Primeval Shark"],
  Primordial:["Chaos Carp","Void Dragon","Creation Eel","Unborn Leviathan","The Dreaming Fish"],
  Void:["The Unnamed One","Abyss Incarnate","Null Leviathan","The Formless","That Which Swims"],
  Abyssal:["Abyss Walker","Deep Nothing","The Unmade","Void Born","Rift Spawn"],
  Eldritch:["Ancient Horror","Nameless Eel","Eldritch Maw","Unfathomable Bass","That Which Lurks"],
  Oblivion:["Oblivion Serpent","Erased Marlin","The Blank One","Nullified Leviathan","Absent Pike"],
  Cataclysm:["World Ender","Extinction Eel","Apocalypse Marlin","Doom Leviathan","Ruin Carp"],
  Paradox:["The Impossible Fish","Contradiction Eel","Both and Neither","The Uncertain One","Impossible Leviathan"],
  Omniversal:["All-Verse Serpent","Pan-Reality Eel","The Everything Fish","Omniverse Leviathan","Infinite-Realm Carp"],
  Apex:["The Apex","Peak Existence","The Summit","Pinnacle Serpent","The Highest"],
  Singular:["The Only One","The Sole","Unique Entity","One Across All","The Irreplaceable"],
  Origin:["The First Cause","Source Fish","The Beginning","Origin Leviathan","The Primeval Source"],
  "The End":["The Last","Omega Eel","The Final One","End Leviathan","That Which Closes All"],
};

export const CAST_COOLDOWN_MS = 3000;

// Catches needed to advance FROM level L to L+1 = L * 10
// Total catches to REACH level L = 5 * L * (L - 1)
// Inverse: L = floor((1 + sqrt(1 + 4 * totalCaught / 5)) / 2)
export function fishingLevel(totalCaught: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * totalCaught) / 5)) / 2));
}
export function catchesRequiredForLevel(level: number): number { return level * 10; }
export function totalCatchesAtLevel(level: number): number { return 5 * level * (level - 1); }

export function formatWeight(grams: number): string {
  if (grams >= 1000000) return `${(grams / 1000000).toFixed(2)} t`;
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams} g`;
}

// ─── Fishing Rods ─────────────────────────────────────────────────────────────

export interface FishingRod {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  description: string;
  castSpeedBonus: number;
  luckBonus: number;
  goldMultiplier: number;
  dropWeight: number;
}

export const FISHING_RODS: FishingRod[] = [
  { id:"willow_rod",        name:"Willow Rod",             emoji:"🌿", rarity:"Common",       description:"A supple willow branch. Better than nothing.",           castSpeedBonus:0,    luckBonus:1,   goldMultiplier:1.05,  dropWeight:200     },
  { id:"bamboo_rod",        name:"Bamboo Rod",             emoji:"🎋", rarity:"Common",       description:"Light and surprisingly durable.",                         castSpeedBonus:150,  luckBonus:2,   goldMultiplier:1.1,   dropWeight:150     },
  { id:"copper_rod",        name:"Copper Rod",             emoji:"🟤", rarity:"Uncommon",     description:"Warm metal that conducts fish luck.",                     castSpeedBonus:250,  luckBonus:3,   goldMultiplier:1.15,  dropWeight:60      },
  { id:"iron_rod",          name:"Iron Rod",               emoji:"⚙️", rarity:"Uncommon",     description:"Sturdy iron. Heavy but reliable.",                        castSpeedBonus:350,  luckBonus:4,   goldMultiplier:1.2,   dropWeight:45      },
  { id:"anglers_rod",       name:"Angler's Rod",           emoji:"🎣", rarity:"Rare",         description:"Crafted by a seasoned river angler.",                     castSpeedBonus:450,  luckBonus:6,   goldMultiplier:1.3,   dropWeight:20      },
  { id:"silver_rod",        name:"Silver Rod",             emoji:"🪙", rarity:"Rare",         description:"Polished silver draws fish like a magnet.",               castSpeedBonus:550,  luckBonus:7,   goldMultiplier:1.35,  dropWeight:12      },
  { id:"hunters_rod",       name:"Hunter's Rod",           emoji:"🏹", rarity:"Epic",         description:"Designed to hunt the most elusive prey.",                 castSpeedBonus:650,  luckBonus:10,  goldMultiplier:1.5,   dropWeight:4       },
  { id:"storm_rod",         name:"Storm Rod",              emoji:"⚡", rarity:"Epic",         description:"Crackles with static. Fish are stunned before you cast.", castSpeedBonus:750,  luckBonus:13,  goldMultiplier:1.6,   dropWeight:2.5     },
  { id:"dragon_rod",        name:"Dragon Rod",             emoji:"🐉", rarity:"Legendary",    description:"Carved from the rib of an elder dragon.",                 castSpeedBonus:850,  luckBonus:17,  goldMultiplier:2.0,   dropWeight:0.8     },
  { id:"void_rod",          name:"Void Rod",               emoji:"🕳️", rarity:"Legendary",    description:"Reaches through reality into the space between worlds.",  castSpeedBonus:950,  luckBonus:22,  goldMultiplier:2.5,   dropWeight:0.45    },
  { id:"mythic_lure",       name:"Mythic Lure",            emoji:"🌀", rarity:"Mythic",       description:"A lure that exists in three dimensions simultaneously.",  castSpeedBonus:1050, luckBonus:28,  goldMultiplier:3.0,   dropWeight:0.12    },
  { id:"abyssal_caster",    name:"Abyssal Caster",         emoji:"🌑", rarity:"Mythic",       description:"Plunges deeper than any rod should.",                    castSpeedBonus:1150, luckBonus:35,  goldMultiplier:3.8,   dropWeight:0.07    },
  { id:"celestial_rod",     name:"Celestial Rod",          emoji:"⭐", rarity:"Divine",       description:"Blessed by a choir of heaven. Fish kneel before it.",     castSpeedBonus:1250, luckBonus:45,  goldMultiplier:5.0,   dropWeight:0.02    },
  { id:"gods_pole",         name:"God's Fishing Pole",     emoji:"✨", rarity:"Divine",       description:"Mortals who touch it briefly become gods themselves.",    castSpeedBonus:1350, luckBonus:56,  goldMultiplier:7.0,   dropWeight:0.008   },
  { id:"cosmic_caster",     name:"Cosmic Caster",          emoji:"🌌", rarity:"Cosmic",       description:"Casts across star systems. Distance is irrelevant.",      castSpeedBonus:1450, luckBonus:70,  goldMultiplier:10.0,  dropWeight:0.003   },
  { id:"eternal_lure",      name:"Eternal Lure",           emoji:"♾️", rarity:"Eternal",      description:"Has been fishing since before the universe was born.",    castSpeedBonus:1550, luckBonus:88,  goldMultiplier:15.0,  dropWeight:0.001   },
  { id:"reality_hook",      name:"Reality Hook",           emoji:"💠", rarity:"Transcendent", description:"Unhooks fish from the fabric of existence itself.",        castSpeedBonus:1650, luckBonus:110, goldMultiplier:22.0,  dropWeight:0.0004  },
  { id:"world_serpent_rod", name:"The World Serpent's Rod",emoji:"🐍", rarity:"Primordial",   description:"Woven from Jörmungandr's own scale. The sea obeys it.",   castSpeedBonus:1750, luckBonus:140, goldMultiplier:35.0,  dropWeight:0.0001  },
  { id:"omnipotent_angler", name:"Omnipotent Angler",      emoji:"🔱", rarity:"Omnipotent",   description:"No fish can escape. No depth is too far. No cast fails.", castSpeedBonus:1900, luckBonus:185, goldMultiplier:60.0,  dropWeight:0.00003 },
  { id:"the_absolute_hook", name:"The Absolute Hook",      emoji:"💫", rarity:"The Absolute", description:"It simply is. All fish are yours. Always.",               castSpeedBonus:2200, luckBonus:300, goldMultiplier:200.0, dropWeight:0.000005},
];

export function rollRod(fishingLevel: number): FishingRod | null {
  const chance = Math.min(0.015, 0.002 + fishingLevel * 0.0001);
  if (Math.random() > chance) return null;
  const totalWeight = FISHING_RODS.reduce((s, r) => s + r.dropWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const rod of FISHING_RODS) {
    roll -= rod.dropWeight;
    if (roll <= 0) return rod;
  }
  return FISHING_RODS[0];
}

export function rollFish(fishLv: number, luckBonus = 0): { name: string; rarity: FishRarity; weightGrams: number; goldValue: number } {
  const baseLuck = Math.min(60, fishLv * 0.4);
  const luckShift = Math.min(90, baseLuck + luckBonus * 0.5);
  const roll = Math.random() * 100;
  // Divide instead of subtract so luck never collapses the roll to 0.
  // The old `max(0, roll - luckShift)` caused every roll below luckShift
  // (~15% at fishing-30 + Silver Rod) to land at adjusted=0 = "The End",
  // handing out the rarest fish at absurd rates.
  // Division keeps the full probability range intact while still shifting
  // odds toward rarer tiers as luck increases.
  const adjusted = roll / (1 + luckShift / 100);

  let rarity: FishRarity;
  if      (adjusted < 0.00000001)   rarity = "The End";       // ~1 in 10 billion
  else if (adjusted < 0.00000003)   rarity = "Origin";        // ~1 in 3 billion
  else if (adjusted < 0.00000008)   rarity = "Singular";      // ~1 in 1.25 billion
  else if (adjusted < 0.0000002)    rarity = "Apex";          // ~1 in 500 million
  else if (adjusted < 0.0000006)    rarity = "Omniversal";    // ~1 in 167 million
  else if (adjusted < 0.0000015)    rarity = "Paradox";       // ~1 in 67 million
  else if (adjusted < 0.000004)     rarity = "Cataclysm";     // ~1 in 25 million
  else if (adjusted < 0.00001)      rarity = "Oblivion";      // ~1 in 10 million
  else if (adjusted < 0.00003)      rarity = "Eldritch";      // ~1 in 3.3 million
  else if (adjusted < 0.00008)      rarity = "Abyssal";       // ~1 in 1.25 million
  else if (adjusted < 0.0002)       rarity = "Void";          // ~1 in 500,000
  else if (adjusted < 0.0005)       rarity = "Primordial";    // ~1 in 200,000
  else if (adjusted < 0.0012)       rarity = "Celestial";     // ~1 in 83,000
  else if (adjusted < 0.003)        rarity = "Transcendent";  // ~1 in 33,000
  else if (adjusted < 0.008)        rarity = "Eternal";       // ~1 in 12,500
  else if (adjusted < 0.02)         rarity = "Cosmic";        // ~1 in 5,000
  else if (adjusted < 0.05)         rarity = "Divine";        // ~1 in 2,000
  else if (adjusted < 0.12)         rarity = "Mythic";        // ~1 in 833
  else if (adjusted < 0.3)          rarity = "Ancient";       // ~1 in 333
  else if (adjusted < 0.8)          rarity = "Legendary";     // ~1 in 125
  else if (adjusted < 2.0)          rarity = "Epic";          // ~1 in 83
  else if (adjusted < 5)            rarity = "Magical";       // ~1 in 33
  else if (adjusted < 12)           rarity = "Rare";          // ~1 in 14
  else if (adjusted < 30)           rarity = "Uncommon";      // ~1 in 5.5
  else                               rarity = "Common";        // ~70%

  const names = FISH_NAMES[rarity];
  const name = names[Math.floor(Math.random() * names.length)];
  const [minW, maxW] = FISH_WEIGHT[rarity];
  const weightGrams = Math.floor(minW + Math.random() * (maxW - minW));
  return { name, rarity, weightGrams, goldValue: FISH_GOLD[rarity] };
}

// ─── Alchemy ─────────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface PotionEffect {
  atkBonus?: number;
  defBonus?: number;
  hpBonus?: number;
  xpBonus?: number;
  goldBonus?: number;
  critBonus?: number;
}

export interface PotionRecipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number;
  effect: PotionEffect;
  ingredients: Record<string, number>;
  color: string;
}

export interface ActivePotion {
  recipeId: string;
  name: string;
  emoji: string;
  effect: PotionEffect;
  expiresAt: number;
}

export const INGREDIENTS: Ingredient[] = [
  { id:"monster_essence",  name:"Monster Essence",  emoji:"💧", description:"Raw life energy from slain creatures." },
  { id:"shadow_dust",      name:"Shadow Dust",      emoji:"🌑", description:"Dark matter scraped from shadow-type monsters." },
  { id:"bone_powder",      name:"Bone Powder",      emoji:"🦴", description:"Ground bones of undead enemies." },
  { id:"void_crystal",     name:"Void Crystal",     emoji:"💎", description:"Crystallized void energy." },
  { id:"fire_essence",     name:"Fire Essence",     emoji:"🔥", description:"The burning core of fire creatures." },
  { id:"golden_herb",      name:"Golden Herb",      emoji:"🌿", description:"Rare herbs that grow in monster lairs." },
  { id:"cosmic_dust",      name:"Cosmic Dust",      emoji:"✨", description:"Stardust shed by celestial monsters." },
  { id:"blood_vial",       name:"Blood Vial",       emoji:"🩸", description:"Extracted from vampire-type monsters." },
];

export const RECIPES: PotionRecipe[] = [
  { id:"war_brew",       name:"War Brew",           emoji:"⚔️", description:"+25% ATK for 5 minutes",                  duration:300, effect:{atkBonus:25},              ingredients:{monster_essence:3,fire_essence:2},              color:"red"    },
  { id:"iron_skin",      name:"Iron Skin Potion",   emoji:"🛡️", description:"+30% DEF for 5 minutes",                  duration:300, effect:{defBonus:30},              ingredients:{bone_powder:3,monster_essence:2},               color:"blue"   },
  { id:"life_surge",     name:"Life Surge Elixir",  emoji:"❤️", description:"+200 Max HP for 10 minutes",              duration:600, effect:{hpBonus:200},              ingredients:{golden_herb:4,blood_vial:2},                    color:"green"  },
  { id:"wisdom_draft",   name:"Wisdom Draft",       emoji:"📚", description:"+50% XP for 10 minutes",                  duration:600, effect:{xpBonus:50},               ingredients:{shadow_dust:3,golden_herb:3},                   color:"cyan"   },
  { id:"greed_tonic",    name:"Greed Tonic",        emoji:"💰", description:"+75% Gold for 5 minutes",                 duration:300, effect:{goldBonus:75},             ingredients:{golden_herb:5,monster_essence:2},               color:"yellow" },
  { id:"void_elixir",    name:"Void Elixir",        emoji:"🌌", description:"+20% ATK, +20% DEF, +100 HP for 3 minutes",duration:180,effect:{atkBonus:20,defBonus:20,hpBonus:100},ingredients:{void_crystal:4,cosmic_dust:3,monster_essence:2},color:"purple" },
  { id:"berserker_rage", name:"Berserker Rage",     emoji:"😤", description:"+60% ATK, -20 DEF for 2 minutes",         duration:120, effect:{atkBonus:60,defBonus:-20}, ingredients:{fire_essence:5,blood_vial:3},                   color:"orange" },
  { id:"cosmic_brew",    name:"Cosmic Brew",        emoji:"🌟", description:"+100% XP, +50% Gold for 3 minutes",       duration:180, effect:{xpBonus:100,goldBonus:50}, ingredients:{cosmic_dust:5,void_crystal:3,golden_herb:2},    color:"violet" },
];

export function parseIngredients(data: string | null | undefined): Record<string, number> {
  if (!data) return {};
  try { return JSON.parse(data); } catch { return {}; }
}

export function parseActivePotion(data: string | null | undefined): ActivePotion | null {
  if (!data) return null;
  try {
    const p = JSON.parse(data);
    if (p && p.expiresAt && Date.now() < p.expiresAt) return p;
    return null;
  } catch { return null; }
}

export function getIngredientDropChance(monsterName: string): string | null {
  const nameL = monsterName.toLowerCase();
  let ingredient: string | null = null;
  if (nameL.includes("shadow") || nameL.includes("dark") || nameL.includes("shade")) ingredient = "shadow_dust";
  else if (nameL.includes("skeleton") || nameL.includes("bone") || nameL.includes("undead") || nameL.includes("ghoul")) ingredient = "bone_powder";
  else if (nameL.includes("void") || nameL.includes("null") || nameL.includes("abyss")) ingredient = "void_crystal";
  else if (nameL.includes("dragon") || nameL.includes("inferno") || nameL.includes("fire") || nameL.includes("magma")) ingredient = "fire_essence";
  else if (nameL.includes("celestial") || nameL.includes("cosmic") || nameL.includes("star") || nameL.includes("astral")) ingredient = "cosmic_dust";
  else if (nameL.includes("vampire") || nameL.includes("blood")) ingredient = "blood_vial";
  else {
    const r = Math.random();
    if (r < 0.4) ingredient = "monster_essence";
    else if (r < 0.7) ingredient = "golden_herb";
  }
  if (!ingredient) return null;
  if (Math.random() > 0.12) return null;
  return ingredient;
}

// ─── Pets ─────────────────────────────────────────────────────────────────────

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  goldBonus: number;
  xpBonus: number;
  description: string;
  source: string;
}

export const PET_TEMPLATES: Pet[] = [
  { id:"slime_buddy",    name:"Slime Buddy",      emoji:"🟢", rarity:"Common",    atkBonus:2,  defBonus:0,  hpBonus:10,  goldBonus:0,  xpBonus:0,  description:"A friendly slime that nips at enemies.", source:"Slime" },
  { id:"goblin_familiar",name:"Goblin Familiar",  emoji:"👺", rarity:"Common",    atkBonus:3,  defBonus:0,  hpBonus:0,   goldBonus:5,  xpBonus:0,  description:"Pickpockets gold from your kills.", source:"Goblin" },
  { id:"bone_hound",     name:"Bone Hound",       emoji:"🦴", rarity:"Uncommon",  atkBonus:5,  defBonus:3,  hpBonus:0,   goldBonus:0,  xpBonus:0,  description:"Skeletal dog that guards your back.", source:"Skeleton" },
  { id:"shadow_fox",     name:"Shadow Fox",       emoji:"🦊", rarity:"Rare",      atkBonus:4,  defBonus:0,  hpBonus:0,   goldBonus:0,  xpBonus:10, description:"Steals knowledge from defeated foes.", source:"Shadow Rogue" },
  { id:"void_sprite",    name:"Void Sprite",      emoji:"✨", rarity:"Epic",      atkBonus:10, defBonus:5,  hpBonus:50,  goldBonus:0,  xpBonus:0,  description:"A fragment of void energy given form.", source:"Void Walker" },
  { id:"lava_lizard",    name:"Lava Lizard",      emoji:"🦎", rarity:"Rare",      atkBonus:8,  defBonus:0,  hpBonus:0,   goldBonus:10, xpBonus:0,  description:"Burns enemies for bonus gold.", source:"Inferno Wyrm" },
  { id:"crystal_golem",  name:"Crystal Golem",    emoji:"💎", rarity:"Epic",      atkBonus:0,  defBonus:15, hpBonus:100, goldBonus:0,  xpBonus:0,  description:"An impervious crystalline guardian.", source:"Iron Golem Overlord" },
  { id:"storm_hawk",     name:"Storm Hawk",       emoji:"🦅", rarity:"Legendary", atkBonus:15, defBonus:0,  hpBonus:0,   goldBonus:0,  xpBonus:20, description:"Swoops in to land critical strikes.", source:"Fallen Angel" },
  { id:"chaos_kitten",   name:"Chaos Kitten",     emoji:"🐱", rarity:"Legendary", atkBonus:12, defBonus:8,  hpBonus:75,  goldBonus:15, xpBonus:10, description:"Pure chaos in adorable form.", source:"Chaos Beast" },
  { id:"elder_dragon",   name:"Elder Dragon",     emoji:"🐉", rarity:"Mythic",    atkBonus:25, defBonus:15, hpBonus:150, goldBonus:25, xpBonus:25, description:"An ancient dragon bound to your will.", source:"Dragon" },
  { id:"void_serpent",   name:"Void Serpent",     emoji:"🐍", rarity:"Mythic",    atkBonus:30, defBonus:0,  hpBonus:0,   goldBonus:0,  xpBonus:50, description:"Devours XP from the void itself.", source:"Nihil Serpent" },
  { id:"star_phoenix",   name:"Star Phoenix",     emoji:"🔥", rarity:"Divine",    atkBonus:20, defBonus:20, hpBonus:200, goldBonus:30, xpBonus:30, description:"Reborn from starfire, grants divine power.", source:"Starfire Drake" },
  { id:"cosmic_wisp",    name:"Cosmic Wisp",      emoji:"🌟", rarity:"Cosmic",    atkBonus:40, defBonus:20, hpBonus:0,   goldBonus:50, xpBonus:50, description:"A sentient piece of the cosmos.", source:"Cosmic Horror" },
  { id:"null_shade",     name:"Null Shade",       emoji:"🌑", rarity:"Abyssal",   atkBonus:50, defBonus:0,  hpBonus:0,   goldBonus:0,  xpBonus:75, description:"Absolute nothingness made manifest.", source:"Null Phantom" },
  { id:"eternal_flame",     name:"Eternal Flame",       emoji:"💫", rarity:"Eternal",       atkBonus:50,   defBonus:30,   hpBonus:300,   goldBonus:50,   xpBonus:50,   description:"Burns forever. So does your power.", source:"The Eternal" },
  // ── New common/uncommon/rare pets ────────────────────────────────────────────
  { id:"rock_crab",         name:"Rock Crab",           emoji:"🦀", rarity:"Common",        atkBonus:1,    defBonus:3,    hpBonus:15,    goldBonus:0,    xpBonus:0,    description:"A tough-shelled companion that soaks hits.", source:"Mud Golem" },
  { id:"foul_crow",         name:"Foul Crow",            emoji:"🐦", rarity:"Common",        atkBonus:3,    defBonus:0,    hpBonus:0,     goldBonus:3,    xpBonus:0,    description:"Steals shiny things from enemies.", source:"Foul Crow" },
  { id:"giant_ant",         name:"Giant Ant",            emoji:"🐜", rarity:"Common",        atkBonus:2,    defBonus:2,    hpBonus:10,    goldBonus:0,    xpBonus:0,    description:"Strong for its size, loyal to the end.", source:"Giant Ant" },
  { id:"fire_sprite",       name:"Fire Sprite",          emoji:"🔥", rarity:"Uncommon",      atkBonus:5,    defBonus:0,    hpBonus:0,     goldBonus:8,    xpBonus:0,    description:"A dancing ember that scorches your foes.", source:"Hellhound" },
  { id:"ice_wisp",          name:"Ice Wisp",             emoji:"❄️", rarity:"Uncommon",      atkBonus:0,    defBonus:6,    hpBonus:25,    goldBonus:0,    xpBonus:0,    description:"Freezes enemies, buying you precious time.", source:"Frost Troll" },
  { id:"moon_bat",          name:"Moon Bat",             emoji:"🦇", rarity:"Rare",          atkBonus:4,    defBonus:0,    hpBonus:0,     goldBonus:0,    xpBonus:15,   description:"Feeds on moonlight and enemy XP.", source:"Wraith" },
  { id:"thunder_ferret",    name:"Thunder Ferret",       emoji:"⚡", rarity:"Rare",          atkBonus:7,    defBonus:0,    hpBonus:0,     goldBonus:12,   xpBonus:0,    description:"Lightning-fast and light-fingered.", source:"Shadow Rogue" },
  { id:"plague_moth",       name:"Plague Moth",          emoji:"🦋", rarity:"Epic",          atkBonus:0,    defBonus:8,    hpBonus:0,     goldBonus:20,   xpBonus:20,   description:"Its wings dust enemies with confusion.", source:"Plague Doctor" },
  { id:"thunder_bear",      name:"Thunder Bear",         emoji:"🐻", rarity:"Epic",          atkBonus:12,   defBonus:10,   hpBonus:80,    goldBonus:0,    xpBonus:0,    description:"A mountain of fur and crackling lightning.", source:"Cave Troll" },
  { id:"deep_kraken",       name:"Deep Sea Kraken",      emoji:"🦑", rarity:"Epic",          atkBonus:0,    defBonus:18,   hpBonus:120,   goldBonus:0,    xpBonus:0,    description:"Wraps foes in crushing tentacles.", source:"Kraken Spawn" },
  // ── New legendary/mythic pets ────────────────────────────────────────────────
  { id:"ocean_leviathan",   name:"Ocean Leviathan",      emoji:"🐋", rarity:"Legendary",     atkBonus:14,   defBonus:10,   hpBonus:100,   goldBonus:0,    xpBonus:15,   description:"The ancient king of the deep sea.", source:"Abyss Leviathan" },
  { id:"spectral_wolf",     name:"Spectral Wolf",        emoji:"👻", rarity:"Legendary",     atkBonus:10,   defBonus:5,    hpBonus:0,     goldBonus:0,    xpBonus:30,   description:"Hunts through dimensions for lost XP.", source:"Void Walker" },
  { id:"tempest_griffin",   name:"Tempest Griffin",      emoji:"🦅", rarity:"Legendary",     atkBonus:18,   defBonus:0,    hpBonus:50,    goldBonus:20,   xpBonus:15,   description:"Half eagle, half lion, all storm.", source:"Chaos Beast" },
  { id:"sea_leviathan",     name:"Sea Leviathan",        emoji:"🌊", rarity:"Mythic",        atkBonus:0,    defBonus:20,   hpBonus:250,   goldBonus:0,    xpBonus:0,    description:"An oceanic titan bound to protect you.", source:"Leviathan" },
  { id:"dream_serpent",     name:"Dream Serpent",        emoji:"🐍", rarity:"Mythic",        atkBonus:25,   defBonus:0,    hpBonus:0,     goldBonus:40,   xpBonus:0,    description:"Slithers through the realm of dreams.", source:"Nihil Serpent" },
  { id:"crimson_drake",     name:"Crimson Drake",        emoji:"🐲", rarity:"Mythic",        atkBonus:35,   defBonus:5,    hpBonus:100,   goldBonus:0,    xpBonus:20,   description:"A young dragon bathed in crimson flame.", source:"Inferno Wyrm" },
  // ── New divine/abyssal/transcendent pets ─────────────────────────────────────
  { id:"angel_familiar",    name:"Angel Familiar",       emoji:"😇", rarity:"Divine",        atkBonus:22,   defBonus:22,   hpBonus:220,   goldBonus:30,   xpBonus:30,   description:"A fragment of heavenly grace.", source:"Fallen Angel" },
  { id:"sun_tiger",         name:"Sun Tiger",            emoji:"☀️", rarity:"Divine",        atkBonus:35,   defBonus:10,   hpBonus:100,   goldBonus:50,   xpBonus:0,    description:"Burns with the fury of a thousand suns.", source:"Celestial Guardian" },
  { id:"void_hydra",        name:"Void Hydra",           emoji:"🕳️", rarity:"Abyssal",       atkBonus:0,    defBonus:60,   hpBonus:400,   goldBonus:0,    xpBonus:0,    description:"Regrows heads. Absorbs all damage.", source:"Void Tyrant" },
  { id:"abyss_leviathan",   name:"Abyss Leviathan",      emoji:"🌊", rarity:"Abyssal",       atkBonus:65,   defBonus:0,    hpBonus:0,     goldBonus:0,    xpBonus:80,   description:"A deep-sea god given to your command.", source:"Abyssal Overlord" },
  { id:"nebula_sprite",     name:"Nebula Sprite",        emoji:"🌌", rarity:"Cosmic",        atkBonus:45,   defBonus:25,   hpBonus:0,     goldBonus:60,   xpBonus:60,   description:"Born from a dying star. Grants cosmic power.", source:"Cosmic Horror" },
  { id:"galactic_wyrm",     name:"Galactic Wyrm",        emoji:"🌠", rarity:"Cosmic",        atkBonus:70,   defBonus:0,    hpBonus:0,     goldBonus:0,    xpBonus:100,  description:"Swims through galaxies, devouring stars.", source:"Cosmic Abomination" },
  { id:"reality_phantom",   name:"Reality Phantom",      emoji:"🌀", rarity:"Transcendent",  atkBonus:80,   defBonus:40,   hpBonus:400,   goldBonus:80,   xpBonus:80,   description:"Exists in all realities simultaneously.", source:"Reality Shatterer" },
  { id:"time_wraith",       name:"Time Wraith",          emoji:"⌛", rarity:"Transcendent",  atkBonus:60,   defBonus:60,   hpBonus:0,     goldBonus:0,    xpBonus:120,  description:"Steals time from your enemies.", source:"Fate's End" },
  { id:"the_undying",       name:"The Undying",          emoji:"♾️", rarity:"Eternal",       atkBonus:80,   defBonus:50,   hpBonus:500,   goldBonus:80,   xpBonus:80,   description:"Cannot be slain. Refuses to stop fighting.", source:"The Undying" },
  // ── Insanely rare pets ────────────────────────────────────────────────────────
  { id:"void_dragon",       name:"Void Dragon",          emoji:"🐉", rarity:"Primordial",    atkBonus:200,  defBonus:100,  hpBonus:1000,  goldBonus:200,  xpBonus:200,  description:"The last dragon of the void. Incomprehensible power.", source:"Oblivion Drake" },
  { id:"primordial_phoenix",name:"Primordial Phoenix",   emoji:"🔥", rarity:"Omnipotent",    atkBonus:500,  defBonus:250,  hpBonus:2500,  goldBonus:500,  xpBonus:500,  description:"Reborn before time itself. Its fire rewrites fate.", source:"Chaos Primordial" },
  { id:"unborn_god",        name:"The Unborn God",       emoji:"👁️", rarity:"Sovereign",     atkBonus:1000, defBonus:500,  hpBonus:5000,  goldBonus:1000, xpBonus:1000, description:"A deity that never fully entered existence. Horrifyingly powerful.", source:"" },
  { id:"genesis_construct", name:"Genesis Construct",    emoji:"⚙️", rarity:"Genesis",       atkBonus:2000, defBonus:1000, hpBonus:10000, goldBonus:2000, xpBonus:2000, description:"Built from the raw material of the first moment of creation.", source:"" },
  { id:"the_absolute_pet",  name:"The Absolute",         emoji:"✨", rarity:"The Absolute",  atkBonus:5000, defBonus:2500, hpBonus:25000, goldBonus:5000, xpBonus:5000, description:"It simply is. Everything and nothing. The last companion.", source:"" },
];

const PET_RARITY_WEIGHTS: Record<string, number> = {
  Common:50, Uncommon:30, Rare:13, Epic:5, Legendary:1.5, Mythic:0.4, Divine:0.08, Cosmic:0.02, Abyssal:0.006, Eternal:0.002,
  Transcendent:0.0006, Primordial:0.0002, Omnipotent:0.00005, Sovereign:0.00001, Genesis:0.000002, "The Absolute":0.0000003,
};

export function getPetDropChance(monsterName: string, luckBonus: number): Pet | null {
  const baseChance = 0.0015 + luckBonus * 0.0001;
  if (Math.random() > baseChance) return null;
  const validPets = PET_TEMPLATES.filter(p => p.source === monsterName);
  if (validPets.length === 0) {
    const totalWeight = Object.values(PET_RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    const roll = Math.random() * totalWeight;
    let cum = 0;
    for (const [rarity, weight] of Object.entries(PET_RARITY_WEIGHTS)) {
      cum += weight;
      if (roll < cum) {
        const byRarity = PET_TEMPLATES.filter(p => p.rarity === rarity);
        if (byRarity.length) return byRarity[Math.floor(Math.random() * byRarity.length)];
        break;
      }
    }
    return null;
  }
  return validPets[Math.floor(Math.random() * validPets.length)];
}

export function parsePets(data: string | null | undefined): Pet[] {
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

export function getActivePetBonuses(petsData: string | null | undefined, activePetIndex: number) {
  const pets = parsePets(petsData);
  if (activePetIndex < 0 || activePetIndex >= pets.length) return { atkBonus:0, defBonus:0, hpBonus:0, goldBonus:0, xpBonus:0 };
  return pets[activePetIndex];
}

// ─── Arena ────────────────────────────────────────────────────────────────────

export const ARENA_TIERS = [
  { name:"Bronze",      minPoints:0,     color:"#cd7f32", reward:100   },
  { name:"Silver",      minPoints:500,   color:"#c0c0c0", reward:250   },
  { name:"Gold",        minPoints:1500,  color:"#ffd700", reward:500   },
  { name:"Platinum",    minPoints:3000,  color:"#e5e4e2", reward:1000  },
  { name:"Diamond",     minPoints:6000,  color:"#b9f2ff", reward:2000  },
  { name:"Champion",    minPoints:10000, color:"#ff77ff", reward:5000  },
  { name:"Grandmaster", minPoints:20000, color:"#ffcc44", reward:10000 },
];

export function getArenaTier(points: number) {
  for (let i = ARENA_TIERS.length - 1; i >= 0; i--) {
    if (points >= ARENA_TIERS[i].minPoints) return ARENA_TIERS[i];
  }
  return ARENA_TIERS[0];
}

export function simulateArenaBattle(
  attacker: { attack: number; defense: number; maxHp: number },
  defender: { attack: number; defense: number; maxHp: number }
): boolean {
  let aHp = attacker.maxHp;
  let dHp = defender.maxHp;
  const aDmg = Math.max(1, attacker.attack - defender.defense);
  const dDmg = Math.max(1, defender.attack - attacker.defense);
  let rounds = 0;
  while (aHp > 0 && dHp > 0 && rounds < 500) {
    dHp -= aDmg;
    if (dHp <= 0) break;
    aHp -= dDmg;
    rounds++;
  }
  return aHp > 0;
}

export function generateOpponentName(level: number): string {
  const prefixes = ["Iron","Dark","Grim","Void","Storm","Chaos","Shadow","Blood","Eternal","Savage"];
  const names = ["Striker","Guardian","Slayer","Knight","Berserker","Mage","Warlord","Champion","Destroyer","Tyrant"];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const n = names[Math.floor(Math.random() * names.length)];
  return `${p} ${n} Lv.${level}`;
}

// ─── Quests ───────────────────────────────────────────────────────────────────

export type QuestType = "kill_monsters"|"defeat_bosses"|"catch_fish"|"earn_gold"|"sell_items";

export interface QuestDef {
  type: QuestType;
  label: string;
  targets: number[];
  rewardTypes: string[];
  rewardAmounts: number[];
}

export const QUEST_DEFS: QuestDef[] = [
  { type:"kill_monsters", label:"Monster Slayer", targets:[150,500,1500], rewardTypes:["stones","stones","stones"], rewardAmounts:[5,12,30] },
  { type:"defeat_bosses", label:"Boss Hunter",    targets:[5,20,50],      rewardTypes:["stones","stones","stones"], rewardAmounts:[6,16,38] },
  { type:"catch_fish",    label:"Fisher",         targets:[20,75,200],    rewardTypes:["gold","gold","gold"],       rewardAmounts:[10000,40000,120000] },
  { type:"earn_gold",     label:"Gold Seeker",    targets:[10000,50000,200000], rewardTypes:["stones","stones","stones"], rewardAmounts:[5,13,28] },
  { type:"sell_items",    label:"Merchant",       targets:[15,50,150],    rewardTypes:["gold","gold","stones"],     rewardAmounts:[8000,35000,25] },
];

export function getTodayUtc(): string { return new Date().toISOString().slice(0, 10); }

export function generateQuestsForDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const seed = y * 10000 + m * 100 + d;
  const NUM_TYPES = QUEST_DEFS.length;
  return [
    { ...QUEST_DEFS[seed % NUM_TYPES], tier: 0 },
    { ...QUEST_DEFS[(seed + 2) % NUM_TYPES], tier: 1 },
    { ...QUEST_DEFS[(seed + 4) % NUM_TYPES], tier: 2 },
  ].map((q, idx) => ({
    questIndex: idx,
    type: q.type,
    label: q.label,
    target: q.targets[q.tier],
    rewardType: q.rewardTypes[q.tier],
    rewardAmount: q.rewardAmounts[q.tier],
  }));
}

// ─── Login Bonus ──────────────────────────────────────────────────────────────

export const LOGIN_REWARDS = [
  { day:1, gold:500,   stones:0, label:"Day 1" },
  { day:2, gold:1000,  stones:1, label:"Day 2" },
  { day:3, gold:1500,  stones:1, label:"Day 3" },
  { day:4, gold:2000,  stones:2, label:"Day 4" },
  { day:5, gold:3000,  stones:2, label:"Day 5" },
  { day:6, gold:5000,  stones:3, label:"Day 6" },
  { day:7, gold:10000, stones:5, label:"Day 7 ★", special: true },
];

// ─── Upgrades ────────────────────────────────────────────────────────────────

export const UPGRADES = {
  vit:   { label:"Vitality", baseCost:3000,  costFactor:2.1  },
  regen: { label:"Regen",    baseCost:5000,  costFactor:2.1  },
  xp:    { label:"Wisdom",   baseCost:8000,  costFactor:2.2  },
  gold:  { label:"Fortune",  baseCost:10000, costFactor:2.2  },
  luck:  { label:"Luck",     baseCost:25000, costFactor:2.4  },
} as const;

export type UpgradeKey = keyof typeof UPGRADES;

export function upgradeCost(key: UpgradeKey, currentLevel: number): number {
  const u = UPGRADES[key];
  return Math.floor(u.baseCost * Math.pow(u.costFactor, currentLevel));
}

// ─── Talents ─────────────────────────────────────────────────────────────────

export const TALENT_CONFIG = {
  atk:   { label:"Strength",  emoji:"⚔️", desc:"+3 ATK per point",       color:"red"    },
  def:   { label:"Fortitude", emoji:"🛡️", desc:"+2 DEF per point",       color:"blue"   },
  hp:    { label:"Endurance", emoji:"❤️", desc:"+25 Max HP per point",    color:"green"  },
  crit:  { label:"Precision", emoji:"🎯", desc:"+0.5% Crit Chance/point", color:"yellow" },
  speed: { label:"Swiftness", emoji:"💨", desc:"+1% Attack Speed/point",  color:"cyan"   },
  luck:  { label:"Fortune",   emoji:"🍀", desc:"+1% Loot Luck per point", color:"purple" },
} as const;

export type TalentKey = keyof typeof TALENT_CONFIG;

export function getTalentBonuses(p: { talentAtk: number; talentDef: number; talentHp: number; talentCrit: number; talentSpeed: number; talentLuck: number }) {
  return {
    atkBonus: p.talentAtk * 3,
    defBonus: p.talentDef * 2,
    hpBonus:  p.talentHp  * 25,
    critChance: p.talentCrit * 0.5,
    speedBonus: p.talentSpeed * 1,
    luckBonus:  p.talentLuck  * 1,
  };
}

// ─── Codex ───────────────────────────────────────────────────────────────────

export function parseCodex(data: string | null | undefined): Record<string, number> {
  if (!data) return {};
  try { return JSON.parse(data); } catch { return {}; }
}

export function updateCodex(existing: Record<string, number>, monsterName: string): Record<string, number> {
  return { ...existing, [monsterName]: (existing[monsterName] || 0) + 1 };
}

// ─── Infinite Tower ───────────────────────────────────────────────────────────

export interface TowerMilestone {
  floor: number;
  gold: number;
  stones: number;
  talentPoints: number;
  label: string;
}

export const TOWER_MILESTONES: TowerMilestone[] = [
  { floor: 10,   gold: 500,       stones: 1,  talentPoints: 0, label: "Shadow Walker"      },
  { floor: 25,   gold: 2_000,     stones: 3,  talentPoints: 0, label: "Abyss Crawler"      },
  { floor: 50,   gold: 10_000,    stones: 5,  talentPoints: 1, label: "Void Strider"        },
  { floor: 100,  gold: 50_000,    stones: 10, talentPoints: 2, label: "Eternal Climber"     },
  { floor: 200,  gold: 250_000,   stones: 15, talentPoints: 3, label: "Chaos Ascendant"     },
  { floor: 500,  gold: 1_000_000, stones: 25, talentPoints: 5, label: "Singularity Breaker" },
  { floor: 1000, gold: 5_000_000, stones: 50, talentPoints: 10,label: "Tower Conqueror"     },
];

const TOWER_ZONE_PREFIXES = ["Ashen", "Shadow", "Cursed", "Void", "Abyssal", "Eternal", "Chaos", "Primordial", "Infinite", "Absolute"];
const TOWER_ZONE_SUFFIXES = ["Corridor", "Vault", "Sanctum", "Gate", "Rift", "Spire", "Summit", "Pinnacle", "Apex", "Zenith"];

export function towerFloorName(floor: number): string {
  const pIdx = Math.floor((floor - 1) / 10) % TOWER_ZONE_PREFIXES.length;
  const sIdx = Math.floor((floor - 1) / 50) % TOWER_ZONE_SUFFIXES.length;
  return `${TOWER_ZONE_PREFIXES[pIdx]} ${TOWER_ZONE_SUFFIXES[sIdx]}`;
}

export function towerMonsterName(floor: number): string {
  if (floor >= 1000) return `Primordial Wraith`;
  if (floor >= 500)  return `Eternal Colossus`;
  if (floor >= 200)  return `Chaos Titan`;
  if (floor >= 100)  return `Void Harbinger`;
  if (floor >= 50)   return `Abyssal Warlord`;
  if (floor >= 25)   return `Shadow Champion`;
  if (floor >= 10)   return `Cursed Elite`;
  return `Floor Sentinel`;
}

export function towerMonsterStats(floor: number): { hp: number; attack: number; defense: number } {
  return {
    hp:      Math.floor(80  * Math.pow(1.14, floor - 1)),
    attack:  Math.floor(8   * Math.pow(1.11, floor - 1)),
    defense: Math.floor(4   * Math.pow(1.09, floor - 1)),
  };
}

export function towerFloorReward(floor: number): { gold: number; xp: number; stones: number } {
  return {
    gold:   Math.floor(50 * Math.pow(1.12, floor - 1)),
    xp:     Math.floor(30 * Math.pow(1.10, floor - 1)),
    stones: floor % 10 === 0 ? Math.floor(floor / 10) : 0,
  };
}

export function parseTowerMilestones(data: string | null | undefined): number[] {
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}
