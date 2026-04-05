// All game action handlers - pure localStorage operations, no server required

export function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000)        return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString();
}

import {
  loadSave, writeSave, nextId,
  type Player, type InventoryItem, type BattleState, type FishCatch,
  type RaidState, type QuestRecord, type GameSave, type OwnedRod,
} from "./store";
import {
  spawnMonster, rollLoot, calcDamage, xpToNextLevel, calcMaxHp, calcAttack, calcDefense,
  ascensionXpMultiplier, ascensionGoldMultiplier, prestigeXpMultiplier, prestigeGoldMultiplier,
  prestigeHpBonus, ATK_TYPES, skillXpToNextLevel, MELEE_SKILL_ATK_PER_LEVEL, DEFENSE_SKILL_DEF_PER_LEVEL,
  getPetDropChance, parsePets, getActivePetBonuses, parseIngredients, parseActivePotion, getIngredientDropChance,
  rollFish, fishingLevel, catchesRequiredForLevel, totalCatchesAtLevel, formatWeight, FISHING_RODS, rollRod,
  INGREDIENTS, RECIPES, GOD_BOSSES, getGodByName, scaleGodForPlayer, rollRaidLoot,
  getArenaTier, ARENA_TIERS, simulateArenaBattle, generateOpponentName,
  QUEST_DEFS, getTodayUtc, generateQuestsForDate, LOGIN_REWARDS,
  upgradeCost, UPGRADES, prestigeRequiredLevel, getPrestigeTier, PRESTIGE_TIERS,
  getTalentBonuses, parseCodex, updateCodex, ASCEND_MIN_LEVEL,
  TOWER_MILESTONES, towerMonsterStats, towerFloorReward, towerMonsterName, towerFloorName, parseTowerMilestones,
  getInfiniteZoneName, getKeyDefForZone, GOD_REQUIRED_KEY, getInfiniteZoneId, RAID_KEY_DEFS,
  type LootItem, type FishingRod, type TowerMilestone,
} from "./gameLogic";

// ─── Player ───────────────────────────────────────────────────────────────────

export function getPlayer(): Player | null {
  const save = loadSave();
  if (!save.player) return null;
  return applyRegenToPlayer(save);
}

function applyRegenToPlayer(save: GameSave): Player {
  const p = save.player!;
  if (p.hp >= p.maxHp) return p;
  if (p.regenUpgradeLevel <= 0) return p;

  const regenPerMin = p.regenUpgradeLevel * 5;
  const now = Date.now();
  const lastRegen = (p as any)._lastRegen ?? now;
  const minsElapsed = Math.max(0, (now - lastRegen) / 60000);
  if (minsElapsed < 0.1) return p;

  const healed = Math.floor(minsElapsed * regenPerMin);
  if (healed <= 0) return p;

  const newHp = Math.min(p.maxHp, p.hp + healed);
  const updated = { ...p, hp: newHp, _lastRegen: now };
  save.player = updated as Player;
  writeSave(save);
  return updated as Player;
}

export function createPlayer(name: string): Player {
  const maxHp = calcMaxHp(1);
  const attack = calcAttack(1, 1);
  const defense = calcDefense(1, 1);

  const player: Player = {
    id: 1,
    name: name.trim(),
    level: 1,
    xp: 0,
    xpToNextLevel: xpToNextLevel(1),
    hp: maxHp,
    maxHp,
    attack,
    defense,
    gold: 0,
    monstersDefeated: 0,
    bossesDefeated: 0,
    gearLooted: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    goldEarned: 0,
    itemsSold: 0,
    totalFishCaught: 0,
    arenaPoints: 0,
    arenaWins: 0,
    arenaLosses: 0,
    arenaTier: 0,
    challengeHighScore: 0,
    challengeRunsCompleted: 0,
    enchantingStones: 0,
    loginStreak: 0,
    lastLoginDate: null,
    lastFishCastAt: null,
    alchemyIngredients: "{}",
    activePotionData: null,
    petsData: "[]",
    activePetIndex: -1,
    monsterCodex: "{}",
    vitUpgradeLevel: 0,
    regenUpgradeLevel: 0,
    xpUpgradeLevel: 0,
    goldUpgradeLevel: 0,
    luckUpgradeLevel: 0,
    talentPoints: 0,
    talentAtk: 0,
    talentDef: 0,
    talentHp: 0,
    talentCrit: 0,
    talentSpeed: 0,
    talentLuck: 0,
    prestigeLevel: 0,
    ascensionLevel: 0,
    meleeSkillLevel: 1,
    meleeSkillXp: 0,
    meleeSkillXpToNext: skillXpToNextLevel(1),
    defenseSkillLevel: 1,
    defenseSkillXp: 0,
    defenseSkillXpToNext: skillXpToNextLevel(1),
    arenaDailyUses: 0,
    arenaLastUsedDate: null,
    activeRodId: "",
    towerHighestFloor: 0,
    towerMilestonesClaimed: "[]",
    createdAt: new Date().toISOString(),
  };

  const save = loadSave();
  save.player = player;
  save.inventory = [];
  save.battle = null;
  save.fishCatches = [];
  save.raid = null;
  save.quests = [];
  save.raidCooldowns = {};
  save.nextId = 1;
  writeSave(save);
  return player;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function getInventory(): { items: InventoryItem[]; totalItems: number } {
  const save = loadSave();
  return { items: save.inventory, totalItems: save.inventory.length };
}

function recalcPlayerStats(save: GameSave): void {
  const p = save.player!;
  const baseAttack = calcAttack(p.level, p.meleeSkillLevel) + p.talentAtk * 3;
  const baseDefense = calcDefense(p.level, p.defenseSkillLevel) + p.talentDef * 2;
  const atkItems = save.inventory.filter(i => i.equipped && ATK_TYPES.includes(i.type as any));
  const defItems = save.inventory.filter(i => i.equipped && !ATK_TYPES.includes(i.type as any));
  const atkBonus = atkItems.reduce((s, i) => s + i.statBonus * (1 + (i.enchantLevel ?? 0) * 0.1), 0);
  const defBonus = defItems.reduce((s, i) => s + i.statBonus * (1 + (i.enchantLevel ?? 0) * 0.1), 0);
  const petBonuses = getActivePetBonuses(p.petsData, p.activePetIndex);

  save.player!.attack = Math.floor(baseAttack + atkBonus + (petBonuses.atkBonus ?? 0));
  save.player!.defense = Math.floor(baseDefense + defBonus + (petBonuses.defBonus ?? 0));
}

export function equipItem(itemId: number): { success: boolean; player: Player; item: InventoryItem } {
  const save = loadSave();
  const item = save.inventory.find(i => i.id === itemId);
  if (!item) {
    const ids = save.inventory.map(i => i.id).join(",");
    console.error(`[equipItem] id=${itemId} not found. Inventory ids: [${ids}]`);
    throw new Error(`Item not found (id=${itemId})`);
  }

  // Unequip any existing item in the same slot type
  const slotType = item.type;
  for (const existing of save.inventory) {
    if (existing.equipped && existing.type === slotType && existing.id !== itemId) {
      existing.equipped = false;
      existing.slot = null;
    }
  }

  item.equipped = true;
  item.slot = item.type;
  recalcPlayerStats(save);
  writeSave(save);
  return { success: true, player: save.player!, item };
}

export function unequipItem(itemId: number): { success: boolean; player: Player; item: InventoryItem } {
  const save = loadSave();
  const item = save.inventory.find(i => i.id === itemId);
  if (!item) throw new Error("Item not found");
  item.equipped = false;
  item.slot = null;
  recalcPlayerStats(save);
  writeSave(save);
  return { success: true, player: save.player!, item };
}

export function equipBest(): { equipped: { slot: string; name: string; rarity: string }[]; player: Player } {
  const save = loadSave();
  const SLOT_TYPES = ["weapon", "armor", "boots", "gloves", "amulet", "ring"] as const;
  const equipped: { slot: string; name: string; rarity: string }[] = [];

  for (const slotType of SLOT_TYPES) {
    const candidates = save.inventory.filter(i => i.type === slotType);
    if (candidates.length === 0) continue;
    const best = candidates.reduce((prev, cur) => {
      const prevEff = prev.statBonus * (1 + (prev.enchantLevel ?? 0) * 0.1);
      const curEff  = cur.statBonus  * (1 + (cur.enchantLevel  ?? 0) * 0.1);
      return curEff > prevEff ? cur : prev;
    });
    const currentlyEquipped = save.inventory.find(i => i.type === slotType && i.equipped);
    if (currentlyEquipped?.id === best.id) continue;
    if (currentlyEquipped) { currentlyEquipped.equipped = false; currentlyEquipped.slot = null; }
    best.equipped = true;
    best.slot = slotType;
    equipped.push({ slot: slotType, name: best.name, rarity: best.rarity });
  }

  recalcPlayerStats(save);
  writeSave(save);
  return { equipped, player: save.player! };
}

export function sellItem(itemId: number): { success: boolean; goldGained: number; player: Player } {
  const save = loadSave();
  const idx = save.inventory.findIndex(i => i.id === itemId);
  if (idx < 0) throw new Error("Item not found");
  const item = save.inventory[idx];
  if (item.equipped) throw new Error("Cannot sell equipped item");
  const goldGained = item.goldValue;
  save.inventory.splice(idx, 1);
  save.player!.gold += goldGained;
  save.player!.itemsSold = (save.player!.itemsSold ?? 0) + 1;
  writeSave(save);
  return { success: true, goldGained, player: save.player! };
}

export function sellAllItems(): { success: boolean; goldGained: number; itemsSold: number; player: Player } {
  const save = loadSave();
  const toSell = save.inventory.filter(i => !i.equipped);
  const goldGained = toSell.reduce((s, i) => s + i.goldValue, 0);
  const count = toSell.length;
  save.inventory = save.inventory.filter(i => i.equipped);
  save.player!.gold += goldGained;
  save.player!.itemsSold = (save.player!.itemsSold ?? 0) + count;
  writeSave(save);
  return { success: true, goldGained, itemsSold: count, player: save.player! };
}

export function enchantItem(itemId: number): { success: boolean; newEnchantLevel: number; stonesUsed: number; player: Player; item: InventoryItem } {
  const save = loadSave();
  const p = save.player!;
  const item = save.inventory.find(i => i.id === itemId);
  if (!item) throw new Error("Item not found");

  const enchantLevel = item.enchantLevel ?? 0;
  if (enchantLevel >= 10) throw new Error("Item is already at maximum enchant level");

  const stoneCost = enchantLevel + 1;
  if (p.enchantingStones < stoneCost) throw new Error(`Need ${stoneCost} enchanting stone(s)`);

  item.enchantLevel = enchantLevel + 1;
  p.enchantingStones -= stoneCost;
  recalcPlayerStats(save);
  writeSave(save);
  return { success: true, newEnchantLevel: item.enchantLevel, stonesUsed: stoneCost, player: save.player!, item };
}

// ─── Battle ───────────────────────────────────────────────────────────────────

export function getBattle(): { monster: BattleState["monster"]; player: Player; log: string[]; status: string } | null {
  const save = loadSave();
  if (!save.battle || save.battle.status !== "active") return null;
  return { monster: save.battle.monster, player: save.player!, log: [], status: "active" };
}

export function startBattle(): { monster: BattleState["monster"]; player: Player; log: string[]; status: string } {
  const save = loadSave();
  const p = save.player!;

  // If dead, restore HP
  if (p.hp <= 0) {
    const maxHp = calcMaxHp(p.level) + (p.vitUpgradeLevel ?? 0) * 50 + prestigeHpBonus(p.prestigeLevel ?? 0) + (p.talentHp ?? 0) * 25;
    p.hp = maxHp;
  }

  const lastWasBossDefeat = save.battle?.status === "victory" && save.battle.monster.isBoss;
  save.battle = null;

  const monster = spawnMonster(p.level, { forcedNoBoss: lastWasBossDefeat });
  const battle: BattleState = { monster, status: "active", lastAttackedAt: null };
  save.battle = battle;
  writeSave(save);

  const startMsg = monster.isBoss
    ? `[BOSS] ${monster.name} emerges from the darkness! (Level ${monster.level})`
    : `A wild ${monster.name} appears! (Level ${monster.level})`;

  return { monster, player: save.player!, log: [startMsg], status: "active" };
}

export interface AttackResult {
  monster: BattleState["monster"];
  player: Player;
  log: string[];
  status: string;
  loot?: LootItem | null;
  xpGained?: number;
  goldGained?: number;
  leveledUp?: boolean;
  stoneDropped?: boolean;
  petDropped?: any;
  ingredientDropped?: string | null;
  keyDropped?: string | null;
}

export function performAttack(): AttackResult {
  const save = loadSave();
  const p = save.player!;
  const battle = save.battle;

  if (!battle || battle.status !== "active") throw new Error("No active battle");

  const COOLDOWN_MS = 1300;
  const now = Date.now();
  if (battle.lastAttackedAt && now - new Date(battle.lastAttackedAt).getTime() < COOLDOWN_MS) {
    throw new Error("Attack cooldown");
  }

  battle.lastAttackedAt = new Date().toISOString();

  const activePotion = parseActivePotion(p.activePotionData);
  const potionAtk  = activePotion?.effect?.atkBonus  ?? 0;
  const potionDef  = activePotion?.effect?.defBonus  ?? 0;
  const potionXp   = activePotion?.effect?.xpBonus   ?? 0;
  const potionGold = activePotion?.effect?.goldBonus  ?? 0;

  const effectiveAtk = Math.floor(p.attack * (1 + potionAtk / 100));
  const effectiveDef = Math.floor(p.defense * (1 + potionDef / 100));

  const playerDmg = calcDamage(effectiveAtk, battle.monster.defense);
  const monsterDmg = calcDamage(battle.monster.attack, effectiveDef);

  const log: string[] = [];
  let status: string = "active";
  let loot: LootItem | null = null;
  let xpGained = 0;
  let goldGained = 0;
  let leveledUp = false;
  let stoneDropped = false;
  let petDropped: any = null;
  let ingredientDropped: string | null = null;
  let keyDropped: string | null = null;

  log.push(`You hit ${battle.monster.name} for ${fmtNum(playerDmg)} damage!`);
  battle.monster.hp = Math.max(0, battle.monster.hp - playerDmg);
  p.totalDamageDealt = (p.totalDamageDealt ?? 0) + playerDmg;

  // Melee skill XP
  const meleeXpGain = 1;
  p.meleeSkillXp = (p.meleeSkillXp ?? 0) + meleeXpGain;
  const meleeXpNeeded = skillXpToNextLevel(p.meleeSkillLevel);
  if (p.meleeSkillXp >= meleeXpNeeded) {
    p.meleeSkillXp -= meleeXpNeeded;
    p.meleeSkillLevel += 1;
    p.attack += MELEE_SKILL_ATK_PER_LEVEL;
    log.push(`⚔️ Melee skill up! Now level ${p.meleeSkillLevel}! (+${MELEE_SKILL_ATK_PER_LEVEL} ATK)`);
  }
  p.meleeSkillXpToNext = skillXpToNextLevel(p.meleeSkillLevel);

  if (battle.monster.hp <= 0) {
    // Monster defeated
    battle.monster.hp = 0;
    status = "victory";
    p.monstersDefeated = (p.monstersDefeated ?? 0) + 1;
    if (battle.monster.isBoss) p.bossesDefeated = (p.bossesDefeated ?? 0) + 1;

    const baseXp = Math.floor(battle.monster.level * 15 * (1 + (battle.monster.isBoss ? 2 : 0)));
    const baseGold = Math.floor(battle.monster.level * 5 * (1 + (battle.monster.isBoss ? 1.5 : 0)));
    const xpMult = ascensionXpMultiplier(p.ascensionLevel ?? 0) * prestigeXpMultiplier(p.prestigeLevel ?? 0) * (1 + (p.xpUpgradeLevel ?? 0) * 0.1) * (1 + potionXp / 100);
    const goldMult = ascensionGoldMultiplier(p.ascensionLevel ?? 0) * prestigeGoldMultiplier(p.prestigeLevel ?? 0) * (1 + (p.goldUpgradeLevel ?? 0) * 0.1) * (1 + potionGold / 100);

    xpGained = Math.floor(baseXp * xpMult);
    goldGained = Math.floor(baseGold * goldMult);

    p.xp += xpGained;
    p.gold += goldGained;
    p.goldEarned = (p.goldEarned ?? 0) + goldGained;

    log.push(`${battle.monster.name} defeated! +${xpGained} XP, +${goldGained} gold.`);

    // Level up (loop handles multiple levels from a single high-XP kill)
    let xpNeeded = xpToNextLevel(p.level);
    while (p.xp >= xpNeeded) {
      p.xp -= xpNeeded;
      p.level += 1;
      p.talentPoints = (p.talentPoints ?? 0) + 1;
      leveledUp = true;
      const vitHpBonus = (p.vitUpgradeLevel ?? 0) * 50;
      const presHpBonus = prestigeHpBonus(p.prestigeLevel ?? 0);
      const talentHpBonus = (p.talentHp ?? 0) * 25;
      p.maxHp = calcMaxHp(p.level) + vitHpBonus + presHpBonus + talentHpBonus;
      p.hp = Math.min(p.hp + 20, p.maxHp);
      recalcPlayerStats(save);
      log.push(`Level up! Now level ${p.level}! (+1 Talent Point)`);
      xpNeeded = xpToNextLevel(p.level);
    }
    p.xpToNextLevel = xpToNextLevel(p.level);

    // Loot drop
    const luckBonus = (p.luckUpgradeLevel ?? 0) + (p.talentLuck ?? 0);
    if (Math.random() < Math.min(0.45, 0.18 + luckBonus * 0.015)) {
      const rolled = rollLoot(battle.monster.isBoss, p.level, luckBonus);
      loot = rolled;
      const itemId = save.nextId; save.nextId += 1;
      const invItem = {
        id: itemId, name: rolled.name, type: rolled.type, rarity: rolled.rarity,
        emoji: rolled.emoji, statBonus: rolled.statBonus, goldValue: rolled.goldValue,
        equipped: false, enchantLevel: 0, obtainedAt: new Date().toISOString(), slot: null,
      };
      save.inventory.push(invItem);
      p.gearLooted = (p.gearLooted ?? 0) + 1;
      log.push(`Loot: ${rolled.emoji} ${rolled.name} (${rolled.rarity})`);
    }

    // Stone drop
    stoneDropped = Math.random() < Math.min(0.10, 0.04 + luckBonus * 0.003);
    if (stoneDropped) {
      p.enchantingStones = (p.enchantingStones ?? 0) + 1;
      log.push(`Found an Enchanting Stone! (${p.enchantingStones} total)`);
    }

    // Pet drop
    const pet = getPetDropChance(battle.monster.name, luckBonus);
    if (pet) {
      const pets = parsePets(p.petsData);
      pets.push(pet);
      p.petsData = JSON.stringify(pets);
      petDropped = pet;
      log.push(`Pet found: ${pet.emoji} ${pet.name}!`);
    }

    // Ingredient drop
    const ing = getIngredientDropChance(battle.monster.name);
    if (ing) {
      const ingredients = parseIngredients(p.alchemyIngredients);
      ingredients[ing] = (ingredients[ing] ?? 0) + 1;
      p.alchemyIngredients = JSON.stringify(ingredients);
      ingredientDropped = ing;
    }

    // Codex
    const codex = parseCodex(p.monsterCodex);
    p.monsterCodex = JSON.stringify(updateCodex(codex, battle.monster.name));

    // Raid Key drop — tiered rarity: higher-tier keys are far rarer
    // Base chances:  War 1%, Titan 0.5%, Eldritch 0.25%, Void 0.15%, Genesis 0.08%, Absolute 0.04%
    // Luck adds a small bonus that shrinks at higher tiers
    const zoneId = getInfiniteZoneId(p.level);
    const keyDef = getKeyDefForZone(zoneId);
    if (keyDef) {
      const tierIdx = RAID_KEY_DEFS.indexOf(keyDef);
      const BASE_KEY_CHANCES  = [0.010, 0.005, 0.0025, 0.0015, 0.0008, 0.0004];
      const MAX_KEY_CHANCES   = [0.040, 0.025, 0.0150, 0.0100, 0.0060, 0.0030];
      const base = BASE_KEY_CHANCES[tierIdx] ?? 0.001;
      const cap  = MAX_KEY_CHANCES[tierIdx]  ?? 0.005;
      // luck bonus diminishes steeply at higher tiers
      const luckAdd = luckBonus * (0.0005 / (tierIdx + 1));
      const keyDropChance = Math.min(cap, base + luckAdd);
      if (Math.random() < keyDropChance) {
        keyDropped = keyDef.name;
        save.raidKeys[keyDef.name] = (save.raidKeys[keyDef.name] ?? 0) + 1;
        log.push(`🗝️ Found a ${keyDef.name}! (${save.raidKeys[keyDef.name]} total)`);
      }
    }

  } else {
    // Monster still alive — take damage
    p.hp = Math.max(0, p.hp - monsterDmg);
    p.totalDamageTaken = (p.totalDamageTaken ?? 0) + monsterDmg;
    log.push(`${battle.monster.name} hits you for ${fmtNum(monsterDmg)} damage!`);

    // Defense skill XP
    if (monsterDmg > 0) {
      p.defenseSkillXp = (p.defenseSkillXp ?? 0) + 1;
      const defXpNeeded = skillXpToNextLevel(p.defenseSkillLevel);
      if (p.defenseSkillXp >= defXpNeeded) {
        p.defenseSkillXp -= defXpNeeded;
        p.defenseSkillLevel += 1;
        p.defense += DEFENSE_SKILL_DEF_PER_LEVEL;
        log.push(`🛡️ Defense skill up! Now level ${p.defenseSkillLevel}! (+${DEFENSE_SKILL_DEF_PER_LEVEL} DEF)`);
      }
      p.defenseSkillXpToNext = skillXpToNextLevel(p.defenseSkillLevel);
    }

    if (p.hp <= 0) {
      p.hp = 0;
      status = "defeat";
      battle.status = "defeat";
      log.push(`You have been defeated by ${battle.monster.name}!`);
    }
  }

  battle.status = status as BattleState["status"];
  save.battle = battle;
  writeSave(save);

  return { monster: battle.monster, player: save.player!, log, status, loot, xpGained, goldGained, leveledUp, stoneDropped, petDropped, ingredientDropped, keyDropped };
}

// ─── Fishing ─────────────────────────────────────────────────────────────────

export function getFishingState() {
  const save = loadSave();
  const p = save.player!;
  const catches = save.fishCatches;
  const totalCaught = p.totalFishCaught ?? 0;
  const unsold = catches.filter(f => !f.sold);
  const unsoldGold = unsold.reduce((s, f) => s + f.goldValue, 0);
  const recent = [...catches].reverse().slice(0, 50);
  const rarityCounts: Record<string, number> = {};
  for (const c of catches) rarityCounts[c.rarity] = (rarityCounts[c.rarity] ?? 0) + 1;
  const fishLv = fishingLevel(totalCaught);
  const caughtThisLevel = totalCaught - totalCatchesAtLevel(fishLv);
  const catchesToNext = catchesRequiredForLevel(fishLv) - caughtThisLevel;

  const activeRodId = p.activeRodId || "wooden_stick";
  const activeRod = FISHING_RODS.find(r => r.id === activeRodId) ?? null;
  const ownedRods: OwnedRod[] = save.fishingRods ?? [];

  return {
    fishingLevel: fishingLevel(totalCaught),
    totalCaught,
    catchesToNext,
    currentGold: p.gold ?? 0,
    unsoldCount: unsold.length,
    unsoldGold,
    cooldownMs: 3000,
    recent: recent.map(c => ({
      id: c.id, name: c.fishName, rarity: c.rarity,
      weightGrams: c.weightGrams, weightLabel: c.weightLabel,
      goldValue: c.goldValue, sold: c.sold, caughtAt: c.caughtAt,
    })),
    rarityCounts,
    lastCastAt: p.lastFishCastAt,
    activeRodId,
    activeRod,
    ownedRods,
  };
}

export function castFishing(): {
  fish: { id: number; name: string; rarity: string; weightGrams: number; weightLabel: string; goldValue: number } | null;
  caughtNothing: boolean;
  fishingLevel: number;
  totalCaught: number;
  rodFound: FishingRod | null;
} {
  const save = loadSave();
  const p = save.player!;
  if (!save.fishingRods) save.fishingRods = [];

  const now = Date.now();
  if (p.lastFishCastAt) {
    const elapsed = now - new Date(p.lastFishCastAt).getTime();
    const activeRodId = p.activeRodId || "wooden_stick";
    const activeRod = FISHING_RODS.find(r => r.id === activeRodId);
    const speedBonus = activeRod?.castSpeedBonus ?? 0;
    const cooldown = Math.max(800, 3000 - speedBonus);
    if (elapsed < cooldown) throw new Error("Cast on cooldown");
  }

  p.lastFishCastAt = new Date().toISOString();

  const totalCaught = p.totalFishCaught ?? 0;
  const fishLv = fishingLevel(totalCaught);

  const activeRodId = p.activeRodId || "wooden_stick";
  const activeRod = FISHING_RODS.find(r => r.id === activeRodId) ?? null;
  const luckBonus = activeRod?.luckBonus ?? 0;
  const goldMult = activeRod?.goldMultiplier ?? 1.0;

  // ~25% base chance to catch nothing (better rods reduce this slightly via luck)
  const nothingChance = Math.max(0.08, 0.25 - luckBonus * 0.002);
  if (Math.random() < nothingChance) {
    writeSave(save);
    return { fish: null, caughtNothing: true, fishingLevel: fishingLevel(totalCaught), totalCaught, rodFound: null };
  }

  const fish = rollFish(fishLv, luckBonus);
  const goldValue = Math.ceil(fish.goldValue * goldMult);
  const newTotal = totalCaught + 1;

  const fishId = save.nextId; save.nextId += 1;
  const catchRecord: FishCatch = {
    id: fishId,
    fishName: fish.name,
    rarity: fish.rarity,
    weightGrams: fish.weightGrams,
    weightLabel: formatWeight(fish.weightGrams),
    goldValue,
    sold: false,
    caughtAt: new Date().toISOString(),
  };
  save.fishCatches.push(catchRecord);

  const rodFound = rollRod(fishLv);
  if (rodFound) {
    const rodUid = save.nextId; save.nextId += 1;
    save.fishingRods.push({ uid: rodUid, rodId: rodFound.id, foundAt: new Date().toISOString() });
  }

  p.totalFishCaught = newTotal;
  writeSave(save);

  return {
    fish: { id: fishId, name: fish.name, rarity: fish.rarity, weightGrams: fish.weightGrams, weightLabel: formatWeight(fish.weightGrams), goldValue },
    caughtNothing: false,
    fishingLevel: fishingLevel(newTotal),
    totalCaught: newTotal,
    rodFound,
  };
}

export function setActiveRod(rodId: string): void {
  const save = loadSave();
  const p = save.player!;
  const isOwned = rodId === "wooden_stick" || (save.fishingRods ?? []).some(r => r.rodId === rodId);
  if (!isOwned) throw new Error("Rod not owned");
  p.activeRodId = rodId;
  writeSave(save);
}

export function sellAllFish(): { goldGained: number; fishSold: number; newGold: number } {
  const save = loadSave();
  const p = save.player!;
  const unsold = save.fishCatches.filter(f => !f.sold);
  if (unsold.length === 0) return { goldGained: 0, fishSold: 0, newGold: p.gold };
  const goldGained = unsold.reduce((s, f) => s + f.goldValue, 0);
  save.fishCatches.forEach(f => { f.sold = true; });
  p.gold += goldGained;
  p.goldEarned = (p.goldEarned ?? 0) + goldGained;
  writeSave(save);
  return { goldGained, fishSold: unsold.length, newGold: p.gold };
}

// ─── Raids ───────────────────────────────────────────────────────────────────

export function getRaidState() {
  const save = loadSave();
  return { raid: save.raid, gods: GOD_BOSSES, player: save.player!, raidCooldowns: save.raidCooldowns, raidKeys: save.raidKeys ?? {} };
}

export function startRaid(godName: string): { raid: RaidState; gods: typeof GOD_BOSSES; player: Player } {
  const save = loadSave();
  const p = save.player!;
  const god = getGodByName(godName);
  if (!god) throw new Error("Unknown god");
  if (p.level < god.minLevel) throw new Error(`You must be level ${god.minLevel} to face ${god.name}.`);
  if (save.raid?.status === "active") throw new Error("You already have an active raid.");

  // Require and consume the matching raid key
  const requiredKey = GOD_REQUIRED_KEY[godName];
  if (requiredKey) {
    const held = save.raidKeys?.[requiredKey] ?? 0;
    if (held <= 0) throw new Error(`You need a ${requiredKey} to enter this raid. Farm dungeons in the matching zone to find one.`);
    save.raidKeys[requiredKey] = held - 1;
  }

  const cooldownMs = god.cooldownMinutes * 60 * 1000;
  const lastCompleted = save.raidCooldowns[godName];
  if (lastCompleted) {
    const elapsed = Date.now() - lastCompleted;
    if (elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
      throw new Error(`${god.name} recovers — try again in ${remaining}m.`);
    }
  }

  const scaled = scaleGodForPlayer(god, p.level);
  const raid: RaidState = {
    godName: god.name,
    godHp: scaled.hp,
    godMaxHp: scaled.hp,
    godAttack: scaled.attack,
    godDefense: scaled.defense,
    phase: 1,
    isEnraged: false,
    status: "active",
    lootGranted: false,
    lastAttackedAt: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  save.raid = raid;
  writeSave(save);
  return { raid, gods: GOD_BOSSES, player: p };
}

export function attackRaid(): { raid: RaidState; player: Player; log: string[]; loot: LootItem | null; playerDamage: number; godDamage: number } {
  const save = loadSave();
  const p = save.player!;
  const raid = save.raid;
  if (!raid || raid.status !== "active") throw new Error("No active raid");

  const COOLDOWN_MS = 1300;
  const now = Date.now();
  if (raid.lastAttackedAt && now - new Date(raid.lastAttackedAt).getTime() < COOLDOWN_MS) {
    throw new Error("Attack too fast");
  }

  const god = getGodByName(raid.godName)!;
  const log: string[] = [];
  let loot: LootItem | null = null;

  const activePotion = parseActivePotion(p.activePotionData);
  const potionAtk = activePotion?.effect?.atkBonus ?? 0;
  const potionDef = activePotion?.effect?.defBonus ?? 0;
  const effectiveAtk = Math.floor(p.attack * (1 + potionAtk / 100));
  const effectiveDef = Math.floor(p.defense * (1 + potionDef / 100));

  const playerDmg = calcDamage(effectiveAtk, raid.godDefense);
  const godDmg = calcDamage(raid.godAttack * (raid.isEnraged ? god.enrageMultiplier : 1), effectiveDef);

  log.push(`You strike ${raid.godName} for ${fmtNum(playerDmg)} damage!`);
  raid.godHp = Math.max(0, raid.godHp - playerDmg);

  // Enrage check
  const hpFraction = raid.godHp / raid.godMaxHp;
  if (!raid.isEnraged && hpFraction <= god.enrageThreshold) {
    raid.isEnraged = true;
    raid.phase = 2;
    log.push(god.phaseMessage);
  }

  const newPlayerHp = Math.max(0, p.hp - godDmg);
  log.push(`${raid.godName} strikes you for ${fmtNum(godDmg)} damage!`);

  let status = "active";

  if (raid.godHp <= 0 && !raid.lootGranted) {
    status = "victory";
    log.push(`${raid.godName} falls! VICTORY!`);
    // Raid loot is not guaranteed — stronger gods have rarer drops
    // Drop rates: War 80%, Titan 60%, Eldritch 40%, Void 25%, Genesis 15%, Absolute 8%
    const RAID_LOOT_CHANCES = [0.80, 0.60, 0.40, 0.25, 0.15, 0.08];
    const godKeyName = GOD_REQUIRED_KEY[raid.godName];
    const godTierIdx = RAID_KEY_DEFS.findIndex(k => k.name === godKeyName);
    const raidLootChance = RAID_LOOT_CHANCES[godTierIdx] ?? 0.50;
    if (Math.random() < raidLootChance) {
      loot = rollRaidLoot(raid.godName);
      const itemId = save.nextId; save.nextId += 1;
      save.inventory.push({
        id: itemId, name: loot.name, type: loot.type, rarity: loot.rarity,
        emoji: loot.emoji, statBonus: loot.statBonus, goldValue: loot.goldValue,
        equipped: false, enchantLevel: 0, obtainedAt: new Date().toISOString(), slot: null,
      });
      p.gold += loot.goldValue;
      p.goldEarned = (p.goldEarned ?? 0) + loot.goldValue;
      p.gearLooted = (p.gearLooted ?? 0) + 1;
    } else {
      log.push(`The gods withhold their treasure. No loot this time.`);
    }
    raid.lootGranted = true;
    raid.completedAt = new Date().toISOString();
    save.raidCooldowns[raid.godName] = Date.now();
  } else if (newPlayerHp <= 0) {
    status = "defeated";
    p.hp = Math.floor(p.maxHp * 0.2);
    raid.completedAt = new Date().toISOString();
    log.push(`${raid.godName} has defeated you! You collapse before a god...`);
  } else {
    p.hp = newPlayerHp;
  }

  raid.status = status as RaidState["status"];
  raid.lastAttackedAt = new Date().toISOString();
  save.raid = raid;
  writeSave(save);

  return { raid, player: save.player!, log, loot, playerDamage: playerDmg, godDamage: godDmg };
}

export function fleeRaid(): { ok: boolean } {
  const save = loadSave();
  if (save.raid?.status === "active") {
    save.raid.status = "fled";
    save.raid.completedAt = new Date().toISOString();
    writeSave(save);
  }
  return { ok: true };
}

// ─── Alchemy ─────────────────────────────────────────────────────────────────

export function getAlchemy() {
  const save = loadSave();
  const p = save.player!;
  return {
    ingredients: parseIngredients(p.alchemyIngredients),
    recipes: RECIPES,
    ingredientDefs: INGREDIENTS,
    activePotion: parseActivePotion(p.activePotionData),
  };
}

export function brewPotion(recipeId: string): { success: boolean; potion: any; remainingIngredients: Record<string, number> } {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) throw new Error("Unknown recipe");
  const save = loadSave();
  const p = save.player!;
  const ingredients = parseIngredients(p.alchemyIngredients);
  for (const [ing, needed] of Object.entries(recipe.ingredients)) {
    if ((ingredients[ing] ?? 0) < needed) throw new Error(`Need ${needed}x ${ing.replace(/_/g, " ")}`);
  }
  for (const [ing, needed] of Object.entries(recipe.ingredients)) {
    ingredients[ing] = (ingredients[ing] ?? 0) - needed;
  }
  const potion = {
    recipeId: recipe.id, name: recipe.name, emoji: recipe.emoji,
    effect: recipe.effect, expiresAt: Date.now() + recipe.duration * 1000,
  };
  p.alchemyIngredients = JSON.stringify(ingredients);
  p.activePotionData = JSON.stringify(potion);
  writeSave(save);
  return { success: true, potion, remainingIngredients: ingredients };
}

// ─── Pets ─────────────────────────────────────────────────────────────────────

export function getPets() {
  const save = loadSave();
  const p = save.player!;
  const pets = parsePets(p.petsData);
  const active = p.activePetIndex >= 0 && p.activePetIndex < pets.length ? pets[p.activePetIndex] : null;
  return { pets, activePetIndex: p.activePetIndex, activePet: active, total: 15 };
}

export function equipPet(index: number): { success: boolean; activePetIndex: number } {
  const save = loadSave();
  const p = save.player!;
  const pets = parsePets(p.petsData);
  if (index < -1 || index >= pets.length) throw new Error("Invalid pet index");
  p.activePetIndex = index;
  recalcPlayerStats(save);
  writeSave(save);
  return { success: true, activePetIndex: index };
}

export function releasePet(index: number): { success: boolean; goldEarned: number; remainingPets: number } {
  const save = loadSave();
  const p = save.player!;
  const pets = parsePets(p.petsData);
  if (index < 0 || index >= pets.length) throw new Error("Invalid index");
  pets.splice(index, 1);
  let newActive = p.activePetIndex;
  if (p.activePetIndex === index) newActive = -1;
  else if (p.activePetIndex > index) newActive = p.activePetIndex - 1;
  const reward = 500;
  p.petsData = JSON.stringify(pets);
  p.activePetIndex = newActive;
  p.gold += reward;
  recalcPlayerStats(save);
  writeSave(save);
  return { success: true, goldEarned: reward, remainingPets: pets.length };
}

// ─── Talents ─────────────────────────────────────────────────────────────────

export function getTalents() {
  const save = loadSave();
  const p = save.player!;
  const bonuses = getTalentBonuses(p);
  return {
    talentPoints: p.talentPoints,
    spent: { atk: p.talentAtk, def: p.talentDef, hp: p.talentHp, crit: p.talentCrit, speed: p.talentSpeed, luck: p.talentLuck },
    totalSpent: p.talentAtk + p.talentDef + p.talentHp + p.talentCrit + p.talentSpeed + p.talentLuck,
    bonuses,
  };
}

export function spendTalent(talent: string): { success: boolean; talent: string; newValue: number; talentPoints: number } {
  const TALENT_KEYS = ["atk", "def", "hp", "crit", "speed", "luck"];
  if (!TALENT_KEYS.includes(talent)) throw new Error("Invalid talent");
  const save = loadSave();
  const p = save.player!;
  if (p.talentPoints <= 0) throw new Error("No talent points");

  const colMap: Record<string, keyof Player> = {
    atk: "talentAtk", def: "talentDef", hp: "talentHp",
    crit: "talentCrit", speed: "talentSpeed", luck: "talentLuck",
  };
  const col = colMap[talent];
  const current = p[col] as number;

  (p as any)[col] = current + 1;
  p.talentPoints -= 1;

  if (talent === "hp") {
    p.maxHp += 25;
    p.hp = Math.min(p.hp + 25, p.maxHp);
  }
  if (talent === "atk" || talent === "def") recalcPlayerStats(save);
  writeSave(save);
  return { success: true, talent, newValue: current + 1, talentPoints: p.talentPoints };
}

export function resetTalents(): { success: boolean; refunded: number; cost: number } {
  const save = loadSave();
  const p = save.player!;
  const totalSpent = p.talentAtk + p.talentDef + p.talentHp + p.talentCrit + p.talentSpeed + p.talentLuck;
  const cost = 10000 * Math.max(1, Math.floor(totalSpent / 5));
  if (p.gold < cost) throw new Error(`Need ${cost.toLocaleString()} gold to reset`);

  const hpToRemove = p.talentHp * 25;
  p.gold -= cost;
  p.talentPoints += totalSpent;
  p.talentAtk = 0; p.talentDef = 0; p.talentHp = 0;
  p.talentCrit = 0; p.talentSpeed = 0; p.talentLuck = 0;
  p.maxHp = Math.max(p.maxHp - hpToRemove, 100);
  p.hp = Math.min(p.hp, p.maxHp);
  recalcPlayerStats(save);
  writeSave(save);
  return { success: true, refunded: totalSpent, cost };
}

// ─── Upgrades ────────────────────────────────────────────────────────────────

export function getUpgrades() {
  const save = loadSave();
  const p = save.player!;
  return {
    vit:   { level: p.vitUpgradeLevel,   cost: upgradeCost("vit",   p.vitUpgradeLevel)   },
    regen: { level: p.regenUpgradeLevel, cost: upgradeCost("regen", p.regenUpgradeLevel) },
    xp:    { level: p.xpUpgradeLevel,    cost: upgradeCost("xp",    p.xpUpgradeLevel)    },
    gold:  { level: p.goldUpgradeLevel,  cost: upgradeCost("gold",  p.goldUpgradeLevel)  },
    luck:  { level: p.luckUpgradeLevel,  cost: upgradeCost("luck",  p.luckUpgradeLevel)  },
    currentGold: p.gold,
  };
}

export function buyUpgrade(type: string): { success: boolean; type: string; newLevel: number; nextCost: number; goldSpent: number; remainingGold: number } {
  const VALID = ["vit", "regen", "xp", "gold", "luck"];
  if (!VALID.includes(type)) throw new Error("Invalid upgrade type");
  const key = type as keyof typeof UPGRADES;
  const save = loadSave();
  const p = save.player!;
  const col = `${key}UpgradeLevel` as keyof Player;
  const currentLevel = p[col] as number;
  const cost = upgradeCost(key, currentLevel);
  if (p.gold < cost) throw new Error("Not enough gold");
  const newLevel = currentLevel + 1;
  (p as any)[col] = newLevel;
  p.gold -= cost;
  if (key === "vit") {
    p.maxHp += 50;
    p.hp = Math.min(p.hp + 50, p.maxHp);
  }
  writeSave(save);
  return { success: true, type: key, newLevel, nextCost: upgradeCost(key, newLevel), goldSpent: cost, remainingGold: p.gold };
}

// ─── Prestige ────────────────────────────────────────────────────────────────

export function getPrestige() {
  const save = loadSave();
  const p = save.player!;
  const pl = p.prestigeLevel ?? 0;
  const requiredLevel = prestigeRequiredLevel(pl);
  const tier = getPrestigeTier(pl);
  const nextTier = PRESTIGE_TIERS.find(t => t.minPrestige > pl) ?? null;
  return {
    prestigeLevel: pl,
    currentLevel: p.level,
    requiredLevel,
    canPrestige: p.level >= requiredLevel,
    xpMultiplier: prestigeXpMultiplier(pl),
    goldMultiplier: prestigeGoldMultiplier(pl),
    hpBonus: prestigeHpBonus(pl),
    tier: tier ?? null,
    nextTier: nextTier ?? null,
  };
}

export function performPrestige(): { success: boolean; prestigeLevel: number; tier: any; message: string } {
  const save = loadSave();
  const p = save.player!;
  const pl = p.prestigeLevel ?? 0;
  const requiredLevel = prestigeRequiredLevel(pl);
  if (p.level < requiredLevel) throw new Error(`You need to reach level ${requiredLevel} before prestiging.`);

  const newPrestigeLevel = pl + 1;
  const vitHpBonus = (p.vitUpgradeLevel ?? 0) * 50;
  const newMaxHp = 100 + vitHpBonus + prestigeHpBonus(newPrestigeLevel);
  p.prestigeLevel = newPrestigeLevel;
  p.level = 1;
  p.xp = 0;
  p.hp = newMaxHp;
  p.maxHp = newMaxHp;
  p.xpToNextLevel = xpToNextLevel(1);
  recalcPlayerStats(save);
  save.battle = null;
  writeSave(save);
  const tier = getPrestigeTier(newPrestigeLevel);
  return {
    success: true,
    prestigeLevel: newPrestigeLevel,
    tier: tier ?? null,
    message: `You have achieved Prestige ${newPrestigeLevel}! +${Math.round((prestigeXpMultiplier(newPrestigeLevel) - 1) * 100)}% XP, +${Math.round((prestigeGoldMultiplier(newPrestigeLevel) - 1) * 100)}% Gold.`,
  };
}

// ─── Arena ───────────────────────────────────────────────────────────────────

const ARENA_DAILY_MAX = 20;

function getArenaUsesToday(p: Player): number {
  const today = getTodayUtc();
  if (p.arenaLastUsedDate !== today) return 0;
  return p.arenaDailyUses ?? 0;
}

export function getArena() {
  const save = loadSave();
  const p = save.player!;
  const tier = getArenaTier(p.arenaPoints);
  const nextTier = ARENA_TIERS.find(t => t.minPoints > p.arenaPoints) || null;
  const usesToday = getArenaUsesToday(p);
  // Generate fake opponents
  const opponents = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    name: generateOpponentName(p.level),
    level: p.level + Math.floor(Math.random() * 5) - 2,
    attack: Math.floor(p.attack * (0.8 + Math.random() * 0.6)),
    defense: Math.floor(p.defense * (0.8 + Math.random() * 0.6)),
    maxHp: Math.floor(p.maxHp * (0.8 + Math.random() * 0.6)),
    arenaPoints: Math.max(0, p.arenaPoints + Math.floor(Math.random() * 200) - 100),
    prestigeLevel: p.prestigeLevel,
  }));
  return {
    myStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp, level: p.level },
    arenaPoints: p.arenaPoints,
    arenaWins: p.arenaWins,
    arenaLosses: p.arenaLosses,
    arenaTier: tier,
    nextTier,
    opponents,
    dailyUsesLeft: Math.max(0, ARENA_DAILY_MAX - usesToday),
    dailyUsesMax: ARENA_DAILY_MAX,
  };
}

export function challengeArena(opponentId?: number): { won: boolean; pointsChange: number; goldReward: number; tierBonus: number; newPoints: number; newTier: any; opponent: any; myStats: any } {
  const save = loadSave();
  const p = save.player!;

  const today = getTodayUtc();
  const usesToday = getArenaUsesToday(p);
  if (usesToday >= ARENA_DAILY_MAX) throw new Error(`Daily arena limit reached (${ARENA_DAILY_MAX}/day). Come back tomorrow!`);

  p.arenaDailyUses = p.arenaLastUsedDate === today ? usesToday + 1 : 1;
  p.arenaLastUsedDate = today;

  const opponent = {
    id: opponentId ?? 0,
    name: generateOpponentName(p.level),
    attack: Math.floor(p.attack * (0.8 + Math.random() * 0.6)),
    defense: Math.floor(p.defense * (0.8 + Math.random() * 0.6)),
    maxHp: Math.floor(p.maxHp * (0.8 + Math.random() * 0.6)),
    arenaPoints: p.arenaPoints,
  };
  const won = simulateArenaBattle(
    { attack: p.attack, defense: p.defense, maxHp: p.maxHp },
    { attack: opponent.attack, defense: opponent.defense, maxHp: opponent.maxHp }
  );
  const pointsChange = won ? Math.floor(25 + Math.random() * 25) : -Math.floor(10 + Math.random() * 15);
  const goldReward = won ? Math.floor(500 + p.level * 10 + Math.random() * 500) : 0;
  const newPoints = Math.max(0, p.arenaPoints + pointsChange);
  const oldTierIdx = ARENA_TIERS.reduce((best, t, i) => t.minPoints <= p.arenaPoints ? i : best, 0);
  p.arenaPoints = newPoints;
  p.arenaWins += won ? 1 : 0;
  p.arenaLosses += won ? 0 : 1;
  const newTierIdx = ARENA_TIERS.reduce((best, t, i) => t.minPoints <= newPoints ? i : best, 0);
  p.arenaTier = newTierIdx;
  // Award milestone gold when reaching a new tier
  const tierBonus = newTierIdx > oldTierIdx ? ARENA_TIERS[newTierIdx].reward : 0;
  const totalGold = goldReward + tierBonus;
  p.gold += totalGold;
  if (totalGold > 0) p.goldEarned = (p.goldEarned ?? 0) + totalGold;
  writeSave(save);
  return { won, pointsChange, goldReward: totalGold, tierBonus, newPoints, newTier: getArenaTier(newPoints), opponent: { name: opponent.name, attack: opponent.attack, defense: opponent.defense, maxHp: opponent.maxHp }, myStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp } };
}

// ─── Challenge ───────────────────────────────────────────────────────────────

export function getChallengeData() {
  const save = loadSave();
  const p = save.player!;
  return { highScore: p.challengeHighScore, runsCompleted: p.challengeRunsCompleted, playerLevel: p.level, attack: p.attack, defense: p.defense, maxHp: p.maxHp };
}

export function runChallenge(): { wavesCleared: number; isNewRecord: boolean; totalGold: number; totalXp: number; bonusStones: number; waveResults: any[]; highScore: number } {
  const save = loadSave();
  const p = save.player!;

  let playerHp = p.maxHp;
  let totalGold = 0;
  let totalXp = 0;
  const waveResults: any[] = [];

  for (let wave = 1; wave <= 50; wave++) {
    const monsterLevel = wave * 2;
    const scale = 1 + (monsterLevel - 1) * 0.2;
    const monsterAtk = Math.floor(10 * scale * (1 + wave * 0.05));
    const monsterDef = Math.floor(3 * scale);
    const monsterMaxHp = Math.floor(50 * scale * (1 + wave * 0.1));
    const goldReward = wave * 50;
    const xpReward = wave * 20;
    const monsterName = `Wave ${wave} Elite`;

    let mHp = monsterMaxHp;
    let pHp = playerHp;
    const pDmg = Math.max(1, p.attack - monsterDef);
    const mDmg = Math.max(1, monsterAtk - p.defense);
    let rounds = 0;
    while (pHp > 0 && mHp > 0 && rounds < 1000) {
      mHp -= pDmg;
      if (mHp <= 0) break;
      pHp -= mDmg;
      rounds++;
    }
    const survived = pHp > 0;
    playerHp = Math.max(0, pHp);
    if (survived) { totalGold += goldReward; totalXp += xpReward; }
    waveResults.push({ wave, monsterName, survived, playerHpLeft: Math.max(0, playerHp) });
    if (!survived || wave >= 50) break;
  }

  const wavesCleared = waveResults.filter(r => r.survived).length;
  const isNewRecord = wavesCleared > p.challengeHighScore;
  const bonusGold = isNewRecord ? Math.floor(wavesCleared * p.level * 10) : 0;
  const bonusStones = Math.floor(wavesCleared / 5);
  const finalGold = totalGold + bonusGold;

  p.challengeHighScore = Math.max(p.challengeHighScore, wavesCleared);
  p.challengeRunsCompleted = (p.challengeRunsCompleted ?? 0) + 1;
  p.gold += finalGold;
  p.xp += totalXp;
  p.enchantingStones += bonusStones;

  // Check for level-ups earned from challenge XP
  let xpNeeded = xpToNextLevel(p.level);
  while (p.xp >= xpNeeded) {
    p.xp -= xpNeeded;
    p.level += 1;
    p.talentPoints = (p.talentPoints ?? 0) + 1;
    const vitHpBonus = (p.vitUpgradeLevel ?? 0) * 50;
    const presHpBonus = prestigeHpBonus(p.prestigeLevel ?? 0);
    const talentHpBonus = (p.talentHp ?? 0) * 25;
    p.maxHp = calcMaxHp(p.level) + vitHpBonus + presHpBonus + talentHpBonus;
    p.hp = Math.min(p.hp + 20, p.maxHp);
    recalcPlayerStats(save);
    xpNeeded = xpToNextLevel(p.level);
  }
  p.xpToNextLevel = xpNeeded;

  writeSave(save);
  return { wavesCleared, isNewRecord, totalGold: finalGold, totalXp, bonusStones, waveResults: waveResults.slice(0, 20), highScore: Math.max(p.challengeHighScore, wavesCleared) };
}

// ─── Quests ───────────────────────────────────────────────────────────────────

function getPlayerStat(p: Player, type: string): number {
  switch (type) {
    case "kill_monsters": return p.monstersDefeated ?? 0;
    case "defeat_bosses": return p.bossesDefeated ?? 0;
    case "catch_fish":    return p.totalFishCaught ?? 0;
    case "earn_gold":     return p.goldEarned ?? 0;
    case "sell_items":    return p.itemsSold ?? 0;
    default: return 0;
  }
}

export function getQuests(): { quests: any[]; nextResetAt: string } {
  const save = loadSave();
  const p = save.player!;
  const today = getTodayUtc();

  // Remove stale quests from previous days
  save.quests = save.quests.filter(q => q.questDate === today);

  if (save.quests.length < 3) {
    const defs = generateQuestsForDate(today);
    const questIdStart = save.nextId; save.nextId += defs.length;
    const newQuests: QuestRecord[] = defs.map((def, idx) => ({
      id: questIdStart + idx,
      questDate: today,
      questIndex: def.questIndex,
      type: def.type,
      label: def.label,
      target: def.target,
      baselineValue: getPlayerStat(p, def.type),
      rewardType: def.rewardType,
      rewardAmount: def.rewardAmount,
      completed: false,
      claimed: false,
    }));
    save.quests = newQuests;
    writeSave(save);
  }

  const quests = save.quests
    .sort((a, b) => a.questIndex - b.questIndex)
    .map(q => {
      const currentStat = getPlayerStat(p, q.type);
      const progress = Math.max(0, currentStat - q.baselineValue);
      const pctDone = Math.min(1, progress / q.target);
      return { ...q, progress, pctDone };
    });

  // Calculate next reset (midnight UTC)
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return { quests, nextResetAt: nextReset.toISOString() };
}

export function claimQuest(questId: number): { success: boolean; rewardType: string; rewardAmount: number } {
  const save = loadSave();
  const p = save.player!;
  const quest = save.quests.find(q => q.id === questId);
  if (!quest) throw new Error("Quest not found");
  if (quest.claimed) throw new Error("Already claimed");

  const currentStat = getPlayerStat(p, quest.type);
  const progress = Math.max(0, currentStat - quest.baselineValue);
  if (progress < quest.target) throw new Error("Quest not completed");

  quest.completed = true;
  quest.claimed = true;
  if (quest.rewardType === "gold") {
    p.gold += quest.rewardAmount;
    p.goldEarned = (p.goldEarned ?? 0) + quest.rewardAmount;
  } else if (quest.rewardType === "stones") {
    p.enchantingStones = (p.enchantingStones ?? 0) + quest.rewardAmount;
  }
  writeSave(save);
  return { success: true, rewardType: quest.rewardType, rewardAmount: quest.rewardAmount };
}

// ─── Login Bonus ─────────────────────────────────────────────────────────────

function todayString(): string { return new Date().toISOString().slice(0, 10); }
function yesterdayString(): string { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }

export function getLoginBonus() {
  const save = loadSave();
  const p = save.player!;
  const today = todayString();
  const alreadyClaimed = p.lastLoginDate === today;
  const streak = p.loginStreak ?? 0;
  const dayIndex = streak % 7;
  const nextReward = LOGIN_REWARDS[dayIndex];
  return { streak, alreadyClaimed, nextReward, rewards: LOGIN_REWARDS, currentDay: dayIndex, lastLoginDate: p.lastLoginDate };
}

export function claimLoginBonus(): { success: boolean; reward: any; newStreak: number; goldEarned: number; stonesEarned: number } {
  const save = loadSave();
  const p = save.player!;
  const today = todayString();
  const yesterday = yesterdayString();
  if (p.lastLoginDate === today) throw new Error("Already claimed today");
  const newStreak = p.lastLoginDate === yesterday ? (p.loginStreak ?? 0) + 1 : 1;
  const dayIndex = (newStreak - 1) % 7;
  const reward = LOGIN_REWARDS[dayIndex];
  p.loginStreak = newStreak;
  p.lastLoginDate = today;
  p.gold += reward.gold;
  p.enchantingStones = (p.enchantingStones ?? 0) + reward.stones;
  p.goldEarned = (p.goldEarned ?? 0) + reward.gold;
  writeSave(save);
  return { success: true, reward, newStreak, goldEarned: reward.gold, stonesEarned: reward.stones };
}

// ─── Codex ───────────────────────────────────────────────────────────────────

export function getCodex() {
  const save = loadSave();
  const p = save.player!;
  const codex = parseCodex(p.monsterCodex);
  const entries = Object.entries(codex)
    .map(([name, kills]) => ({ name, kills: kills as number }))
    .sort((a, b) => b.kills - a.kills);
  const totalKills = entries.reduce((s, e) => s + e.kills, 0);
  return { entries, totalDiscovered: entries.length, totalKills };
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getStats() {
  const save = loadSave();
  const p = save.player;
  const now = Date.now();
  if (!p) return {
    monstersDefeated: 0, bossesDefeated: 0, goldEarned: 0, itemsSold: 0,
    totalDamageDealt: 0, totalDamageTaken: 0, gearLooted: 0,
    currentGold: 0, level: 0, ascensionLevel: 0, meleeSkillLevel: 1, defenseSkillLevel: 1,
    createdAt: new Date().toISOString(), daysSinceCreation: 0,
  };
  return {
    monstersDefeated: p.monstersDefeated,
    bossesDefeated: p.bossesDefeated,
    goldEarned: p.goldEarned,
    itemsSold: p.itemsSold,
    totalDamageDealt: p.totalDamageDealt,
    totalDamageTaken: p.totalDamageTaken,
    gearLooted: p.gearLooted,
    currentGold: p.gold,
    level: p.level,
    ascensionLevel: p.ascensionLevel,
    meleeSkillLevel: p.meleeSkillLevel,
    defenseSkillLevel: p.defenseSkillLevel,
    createdAt: p.createdAt,
    daysSinceCreation: Math.floor((now - new Date(p.createdAt).getTime()) / 86400000),
  };
}

// ─── Ascend ───────────────────────────────────────────────────────────────────

// ─── Aliases for backward compatibility ──────────────────────────────────────

export const getRaids = getRaidState;
export const doPrestige = performPrestige;

// ─── Infinite Tower ───────────────────────────────────────────────────────────

export function getTower() {
  const save = loadSave();
  const p = save.player!;
  const highestFloor = p.towerHighestFloor ?? 0;
  const nextFloor = highestFloor + 1;
  const monster = towerMonsterStats(nextFloor);
  const reward = towerFloorReward(nextFloor);
  const claimedIndices = parseTowerMilestones(p.towerMilestonesClaimed);
  const milestones = TOWER_MILESTONES.map((m, i) => ({
    ...m,
    claimed: claimedIndices.includes(i),
    reached: highestFloor >= m.floor,
  }));
  return {
    highestFloor,
    nextFloor,
    floorName: towerFloorName(nextFloor),
    monsterName: towerMonsterName(nextFloor),
    monster,
    reward,
    milestones,
    playerStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp, level: p.level },
  };
}

export function runTowerFloor(): {
  won: boolean; floor: number; newHighest: boolean;
  goldEarned: number; xpEarned: number; stonesEarned: number;
  monsterName: string; floorName: string;
  milestoneUnlocked: TowerMilestone | null;
} {
  const save = loadSave();
  const p = save.player!;
  const floor = (p.towerHighestFloor ?? 0) + 1;

  const m = towerMonsterStats(floor);
  const pAtk = p.attack;
  const pDef = p.defense;
  const pHp  = p.maxHp;

  let mHp = m.hp;
  let pH  = pHp;
  while (mHp > 0 && pH > 0) {
    const pDmg = Math.max(1, pAtk - m.defense);
    const mDmg = Math.max(1, m.attack - pDef);
    mHp -= pDmg;
    if (mHp > 0) pH -= mDmg;
  }

  const won = mHp <= 0;
  let goldEarned = 0;
  let xpEarned = 0;
  let stonesEarned = 0;
  let newHighest = false;
  let milestoneUnlocked: TowerMilestone | null = null;

  if (won) {
    const reward = towerFloorReward(floor);
    goldEarned = reward.gold;
    xpEarned = reward.xp;
    stonesEarned = reward.stones;

    const prevHighest = p.towerHighestFloor ?? 0;
    if (floor > prevHighest) {
      p.towerHighestFloor = floor;
      newHighest = true;

      const claimed = parseTowerMilestones(p.towerMilestonesClaimed);
      for (let i = 0; i < TOWER_MILESTONES.length; i++) {
        const ms = TOWER_MILESTONES[i];
        if (floor >= ms.floor && !claimed.includes(i)) {
          claimed.push(i);
          goldEarned += ms.gold;
          stonesEarned += ms.stones;
          p.talentPoints = (p.talentPoints ?? 0) + ms.talentPoints;
          p.towerMilestonesClaimed = JSON.stringify(claimed);
          milestoneUnlocked = ms;
          break;
        }
      }
    }

    p.gold += goldEarned;
    p.goldEarned = (p.goldEarned ?? 0) + goldEarned;
    p.enchantingStones = (p.enchantingStones ?? 0) + stonesEarned;

    const xpMult = ascensionXpMultiplier(p.ascensionLevel ?? 0) * prestigeXpMultiplier(p.prestigeLevel ?? 0);
    const scaledXp = Math.floor(xpEarned * xpMult);
    p.xp += scaledXp;
    xpEarned = scaledXp;
    while (p.xp >= p.xpToNextLevel) {
      p.xp -= p.xpToNextLevel;
      p.level += 1;
      p.talentPoints = (p.talentPoints ?? 0) + 1;
      p.xpToNextLevel = xpToNextLevel(p.level);
    }
    recalcPlayerStats(save);
  }

  writeSave(save);
  return {
    won, floor, newHighest, goldEarned, xpEarned, stonesEarned,
    monsterName: towerMonsterName(floor),
    floorName: towerFloorName(floor),
    milestoneUnlocked,
  };
}

export type { TowerMilestone } from "./gameLogic";

export function getChallenge() {
  const save = loadSave();
  const p = save.player!;
  // Generate a preview of the first 10 waves
  const preview = Array.from({ length: 10 }, (_, i) => {
    const wave = i + 1;
    const monsterLevel = wave * 2;
    const scale = 1 + (monsterLevel - 1) * 0.2;
    return {
      wave,
      monsterName: `Wave ${wave} Elite`,
      monsterHp: Math.floor(50 * scale * (1 + wave * 0.1)),
      monsterAtk: Math.floor(10 * scale * (1 + wave * 0.05)),
      monsterDef: Math.floor(3 * scale),
      goldReward: wave * 50,
      xpReward: wave * 20,
    };
  });
  return {
    highScore: p.challengeHighScore ?? 0,
    runsCompleted: p.challengeRunsCompleted ?? 0,
    preview,
    playerStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp, level: p.level },
  };
}

export function ascendPlayer(): { success: boolean; ascensionLevel: number; message: string; player: Player } {
  const save = loadSave();
  const p = save.player!;
  if (p.level < ASCEND_MIN_LEVEL) throw new Error(`Must reach level ${ASCEND_MIN_LEVEL} to ascend. Current level: ${p.level}.`);
  if (save.battle?.status === "active") throw new Error("Cannot ascend while in battle.");

  const newAscensionLevel = p.ascensionLevel + 1;
  const vitHpBonus = (p.vitUpgradeLevel ?? 0) * 50;
  const newMaxHp = calcMaxHp(1) + vitHpBonus + prestigeHpBonus(p.prestigeLevel ?? 0) + (p.talentHp ?? 0) * 25;

  p.level = 1;
  p.xp = 0;
  p.hp = newMaxHp;
  p.maxHp = newMaxHp;
  p.ascensionLevel = newAscensionLevel;
  p.xpToNextLevel = xpToNextLevel(1);
  save.battle = null;
  recalcPlayerStats(save);
  writeSave(save);

  const xpMult = ascensionXpMultiplier(newAscensionLevel);
  const goldMult = ascensionGoldMultiplier(newAscensionLevel);
  return {
    success: true,
    ascensionLevel: newAscensionLevel,
    message: `You have ascended to tier ${newAscensionLevel}! XP gain: +${Math.round((xpMult - 1) * 100)}% | Gold gain: +${Math.round((goldMult - 1) * 100)}%`,
    player: save.player!,
  };
}
