// Central localStorage store for all game state

export interface InventoryItem {
  id: number;
  name: string;
  type: string;
  rarity: string;
  emoji: string;
  statBonus: number;
  goldValue: number;
  equipped: boolean;
  enchantLevel: number;
  obtainedAt: string;
  slot: string | null;
}

export interface Monster {
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

export interface BattleState {
  monster: Monster;
  status: "active" | "victory" | "defeat";
  lastAttackedAt: string | null;
}

export interface FishCatch {
  id: number;
  fishName: string;
  rarity: string;
  weightGrams: number;
  weightLabel: string;
  goldValue: number;
  sold: boolean;
  caughtAt: string;
}

export interface RaidState {
  godName: string;
  godHp: number;
  godMaxHp: number;
  godAttack: number;
  godDefense: number;
  phase: number;
  isEnraged: boolean;
  status: "active" | "victory" | "defeated" | "fled";
  lootGranted: boolean;
  lastAttackedAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface QuestRecord {
  id: number;
  questDate: string;
  questIndex: number;
  type: string;
  label: string;
  target: number;
  baselineValue: number;
  rewardType: string;
  rewardAmount: number;
  completed: boolean;
  claimed: boolean;
}

export interface Player {
  id: number;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  gold: number;
  monstersDefeated: number;
  bossesDefeated: number;
  gearLooted: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  goldEarned: number;
  itemsSold: number;
  totalFishCaught: number;
  arenaPoints: number;
  arenaWins: number;
  arenaLosses: number;
  arenaTier: number;
  challengeHighScore: number;
  challengeRunsCompleted: number;
  enchantingStones: number;
  loginStreak: number;
  lastLoginDate: string | null;
  lastFishCastAt: string | null;
  alchemyIngredients: string;
  activePotionData: string | null;
  petsData: string;
  activePetIndex: number;
  monsterCodex: string;
  vitUpgradeLevel: number;
  regenUpgradeLevel: number;
  xpUpgradeLevel: number;
  goldUpgradeLevel: number;
  luckUpgradeLevel: number;
  talentPoints: number;
  talentAtk: number;
  talentDef: number;
  talentHp: number;
  talentCrit: number;
  talentSpeed: number;
  talentLuck: number;
  prestigeLevel: number;
  ascensionLevel: number;
  meleeSkillLevel: number;
  meleeSkillXp: number;
  meleeSkillXpToNext: number;
  defenseSkillLevel: number;
  defenseSkillXp: number;
  defenseSkillXpToNext: number;
  arenaDailyUses: number;
  arenaLastUsedDate: string | null;
  activeRodId: string;
  towerHighestFloor: number;
  towerMilestonesClaimed: string;
  createdAt: string;
}

export interface OwnedRod {
  uid: number;
  rodId: string;
  foundAt: string;
}

export interface GameSave {
  player: Player | null;
  inventory: InventoryItem[];
  battle: BattleState | null;
  fishCatches: FishCatch[];
  fishingRods: OwnedRod[];
  raid: RaidState | null;
  quests: QuestRecord[];
  raidCooldowns: Record<string, number>; // godName -> completedAt ms
  raidKeys: Record<string, number>;       // keyName -> count
  nextId: number;
}

const SAVE_KEY = "mmo-save";

const DEFAULT_SAVE: GameSave = {
  player: null,
  inventory: [],
  battle: null,
  fishCatches: [],
  fishingRods: [],
  raid: null,
  quests: [],
  raidCooldowns: {},
  raidKeys: {},
  nextId: 1,
};

function migrateSave(save: GameSave): GameSave {
  const seenIds = new Set<number>();
  let maxId = save.nextId ?? 1;
  let needsWrite = false;

  for (const item of save.inventory ?? []) {
    if (seenIds.has(item.id)) {
      const newId = maxId++;
      item.id = newId;
      seenIds.add(newId);
      needsWrite = true;
    } else {
      seenIds.add(item.id);
      if (item.id >= maxId) maxId = item.id + 1;
    }
  }

  // Deduplicate fish catch IDs
  for (const fish of save.fishCatches ?? []) {
    if (seenIds.has(fish.id)) {
      const newId = maxId++;
      fish.id = newId;
      seenIds.add(newId);
      needsWrite = true;
    } else {
      seenIds.add(fish.id);
      if (fish.id >= maxId) maxId = fish.id + 1;
    }
  }

  // Ensure fishingRods exists
  if (!save.fishingRods) { save.fishingRods = []; needsWrite = true; }

  // Ensure raidKeys exists
  if (!save.raidKeys) { save.raidKeys = {}; needsWrite = true; }

  // Back-fill player fields added after initial release so old saves don't
  // produce NaN from undefined arithmetic.
  if (save.player) {
    const p = save.player;
    if (p.ascensionLevel == null)        { p.ascensionLevel = 0;   needsWrite = true; }
    if (p.towerHighestFloor == null)     { p.towerHighestFloor = 0; needsWrite = true; }
    if (p.towerMilestonesClaimed == null){ p.towerMilestonesClaimed = "[]"; needsWrite = true; }
    if (p.prestigeLevel == null)         { p.prestigeLevel = 0;    needsWrite = true; }
    if (p.xpUpgradeLevel == null)        { p.xpUpgradeLevel = 0;   needsWrite = true; }
    if (p.goldUpgradeLevel == null)      { p.goldUpgradeLevel = 0; needsWrite = true; }
    if (p.luckUpgradeLevel == null)      { p.luckUpgradeLevel = 0; needsWrite = true; }
    if (p.vitUpgradeLevel == null)       { p.vitUpgradeLevel = 0;  needsWrite = true; }
    if (p.regenUpgradeLevel == null)     { p.regenUpgradeLevel = 0; needsWrite = true; }
    if (p.talentAtk == null)             { p.talentAtk = 0;        needsWrite = true; }
    if (p.talentDef == null)             { p.talentDef = 0;        needsWrite = true; }
    if (p.talentHp == null)              { p.talentHp = 0;         needsWrite = true; }
    if (p.talentCrit == null)            { p.talentCrit = 0;       needsWrite = true; }
    if (p.talentSpeed == null)           { p.talentSpeed = 0;      needsWrite = true; }
    if (p.talentLuck == null)            { p.talentLuck = 0;       needsWrite = true; }
    if (p.talentPoints == null)          { p.talentPoints = 0;     needsWrite = true; }
    if (p.enchantingStones == null)      { p.enchantingStones = 0; needsWrite = true; }
    if (p.alchemyIngredients == null)    { p.alchemyIngredients = "{}"; needsWrite = true; }
    if (p.petsData == null)              { p.petsData = "[]";      needsWrite = true; }
    if (p.activePetIndex == null)        { p.activePetIndex = -1;  needsWrite = true; }
    if (p.monsterCodex == null)          { p.monsterCodex = "{}";  needsWrite = true; }
    if (p.meleeSkillLevel == null)       { p.meleeSkillLevel = 1;  needsWrite = true; }
    if (p.meleeSkillXp == null)          { p.meleeSkillXp = 0;     needsWrite = true; }
    if (p.defenseSkillLevel == null)     { p.defenseSkillLevel = 1; needsWrite = true; }
    if (p.defenseSkillXp == null)        { p.defenseSkillXp = 0;   needsWrite = true; }
  }

  if (needsWrite) {
    save.nextId = maxId;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ }
  }

  return save;
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw) as GameSave;
    const merged = { ...DEFAULT_SAVE, ...parsed };
    return migrateSave(merged);
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function writeSave(save: GameSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.error("Failed to save game state:", e);
  }
}

export function loadPlayer(): Player | null {
  return loadSave().player;
}

export function nextId(): number {
  const save = loadSave();
  const id = save.nextId;
  save.nextId = id + 1;
  writeSave(save);
  return id;
}

export function exportSave(): string {
  return localStorage.getItem(SAVE_KEY) ?? "{}";
}

export function importSave(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as GameSave;
    if (!parsed || typeof parsed !== "object") return false;
    localStorage.setItem(SAVE_KEY, json);
    return true;
  } catch {
    return false;
  }
}
