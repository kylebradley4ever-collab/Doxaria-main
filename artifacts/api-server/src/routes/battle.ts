import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, battlesTable, inventoryTable } from "@workspace/db/schema";
import { StartBattleResponse, PerformAttackResponse } from "@workspace/api-zod";
import {
  spawnMonster,
  rollLoot,
  calcDamage,
  xpToNextLevel,
  calcMaxHp,
  ascensionXpMultiplier,
  ascensionGoldMultiplier,
  prestigeXpMultiplier,
  prestigeGoldMultiplier,
  prestigeHpBonus,
  calcAttack,
  calcDefense,
  getZone,
  ATK_TYPES,
  skillXpToNextLevel,
  MELEE_SKILL_ATK_PER_LEVEL,
  DEFENSE_SKILL_DEF_PER_LEVEL,
} from "../lib/gameLogic.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { getPetDropChance, parsePets, getActivePetBonuses } from "./pets.js";
import { getIngredientDropChance, parseIngredients, parseActivePotion } from "./alchemy.js";
import { parseCodex, updateCodex } from "./codex.js";
import { getPlayer } from "../lib/getPlayer.js";

// A battle is considered stale if no attack was made in the last 60 seconds.
// This allows the server to recover from a crash without locking the player out.
const STALE_BATTLE_MS = 60_000;
// The minimum milliseconds between attacks (matches client ATTACK_INTERVAL_MS with some slack)
const ATTACK_COOLDOWN_MS = 1_300;

const router: IRouter = Router();

// ── GET /battle — current active battle state ────────────────────────────────
router.get("/battle", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const battles = await db.select().from(battlesTable)
      .where(and(eq(battlesTable.playerId, player.id), eq(battlesTable.status, "active")))
      .limit(1);

    if (battles.length === 0) {
      res.status(404).json({ error: "No active battle" });
      return;
    }

    const battle = battles[0];
    const zone = getZone(player.level);

    const data = StartBattleResponse.parse({
      monster: {
        name: battle.monsterName,
        emoji: battle.monsterEmoji,
        hp: battle.monsterHp,
        maxHp: battle.monsterMaxHp,
        attack: battle.monsterAttack,
        defense: battle.monsterDefense,
        level: battle.monsterLevel,
        isBoss: battle.monsterIsBoss,
        zone: zone.id,
        zoneName: zone.name,
      },
      player: {
        ...player,
        xpToNextLevel: xpToNextLevel(player.level),
        meleeSkillXpToNext: skillXpToNextLevel(player.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(player.defenseSkillLevel),
      },
      log: [],
      status: "active",
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get battle state");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/battle/start", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    // Check if the previous battle was a boss defeat — if so, spare the player
    // from facing another boss immediately after respawn.
    const lastBattles = await db.select().from(battlesTable)
      .where(eq(battlesTable.playerId, player.id))
      .orderBy(desc(battlesTable.id))
      .limit(1);

    if (lastBattles.length > 0) {
      const last = lastBattles[0];
      // Prevent mid-fight restart exploit: if the battle is still active AND was attacked recently,
      // reject the start request so players can't dodge tough fights by restarting them.
      if (last.status === "active") {
        const lastHit = last.lastAttackedAt ? last.lastAttackedAt.getTime() : last.createdAt.getTime();
        const isStale = Date.now() - lastHit > STALE_BATTLE_MS;
        if (!isStale) {
          res.status(409).json({ error: "A battle is already in progress." });
          return;
        }
      }
    }

    const lastWasBossDefeat =
      lastBattles.length > 0 &&
      lastBattles[0].status === "defeat" &&
      !!lastBattles[0].monsterIsBoss;

    await db.delete(battlesTable).where(eq(battlesTable.playerId, player.id));

    if (player.hp <= 0) {
      const maxHp = calcMaxHp(player.level) + (player.vitUpgradeLevel ?? 0) * 50 + prestigeHpBonus(player.prestigeLevel ?? 0) + (player.talentHp ?? 0) * 25;
      await db.update(playersTable).set({ hp: maxHp }).where(eq(playersTable.id, player.id));
      player.hp = maxHp;
    }

    const monster = spawnMonster(player.level, { forcedNoBoss: lastWasBossDefeat });

    const [battle] = await db.insert(battlesTable).values({
      playerId: player.id,
      monsterName: monster.name,
      monsterEmoji: monster.emoji,
      monsterMaxHp: monster.maxHp,
      monsterHp: monster.hp,
      monsterAttack: monster.attack,
      monsterDefense: monster.defense,
      monsterLevel: monster.level,
      monsterIsBoss: monster.isBoss,
      status: "active",
    }).returning();

    const updatedPlayer = (await db.select().from(playersTable).where(eq(playersTable.id, player.id)))[0];

    const startMsg = monster.isBoss
      ? `[BOSS] ${monster.name} emerges from the darkness! (Level ${monster.level})`
      : `A wild ${monster.name} appears! (Level ${monster.level})`;

    const startZone = getZone(player.level);
    const data = StartBattleResponse.parse({
      monster: {
        name: battle.monsterName,
        emoji: battle.monsterEmoji,
        hp: battle.monsterHp,
        maxHp: battle.monsterMaxHp,
        attack: battle.monsterAttack,
        defense: battle.monsterDefense,
        level: battle.monsterLevel,
        isBoss: battle.monsterIsBoss,
        zone: startZone.id,
        zoneName: startZone.name,
      },
      player: {
        ...updatedPlayer,
        xpToNextLevel: xpToNextLevel(updatedPlayer.level),
        meleeSkillXpToNext: skillXpToNextLevel(updatedPlayer.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(updatedPlayer.defenseSkillLevel),
      },
      log: [startMsg],
      status: "active",
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to start battle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/battle/attack", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const battles = await db.select().from(battlesTable)
      .where(and(eq(battlesTable.playerId, player.id), eq(battlesTable.status, "active")))
      .limit(1);

    if (battles.length === 0) {
      res.status(400).json({ error: "No active battle. Start a battle first." });
      return;
    }

    const battle = battles[0];

    // ── Atomic attack cooldown stamp ───────────────────────────────────────────
    // The UPDATE only succeeds if the cooldown has elapsed, making this check
    // and stamp atomic. Concurrent requests will both try to stamp, but only
    // the first one succeeds; the second sees 0 rows updated and is rejected.
    const stamped = await db.update(battlesTable)
      .set({ lastAttackedAt: new Date() })
      .where(and(
        eq(battlesTable.id, battle.id),
        eq(battlesTable.status, "active"),
        sql`(${battlesTable.lastAttackedAt} IS NULL OR ${battlesTable.lastAttackedAt} < NOW() - INTERVAL '${sql.raw(String(ATTACK_COOLDOWN_MS))} milliseconds')`,
      ))
      .returning();

    if (stamped.length === 0) {
      res.status(429).json({ error: "Attack too fast — wait for the next turn." });
      return;
    }

    const log: string[] = [];

    // ── Melee skill: +1 XP every time the player attacks ──────────────────────
    let meleeSkillLevel = player.meleeSkillLevel;
    let meleeSkillXp = player.meleeSkillXp + 1;
    const meleeXpNeeded = skillXpToNextLevel(meleeSkillLevel);
    if (meleeSkillXp >= meleeXpNeeded) {
      meleeSkillLevel += 1;
      meleeSkillXp -= meleeXpNeeded;
      log.push(`[Melee] Skill reached Level ${meleeSkillLevel}! ATK +${MELEE_SKILL_ATK_PER_LEVEL}`);
    }

    // ── Active pet & potion bonuses ────────────────────────────────────────────
    const petBonus = getActivePetBonuses(player.petsData, player.activePetIndex);
    const activePotion = parseActivePotion(player.activePotionData);
    const potionAtkPct  = activePotion?.effect?.atkBonus  ?? 0;
    const potionDefPct  = activePotion?.effect?.defBonus  ?? 0;
    const potionXpPct   = activePotion?.effect?.xpBonus   ?? 0;
    const potionGoldPct = activePotion?.effect?.goldBonus ?? 0;

    const effectiveAttack  = player.attack  + petBonus.atkBonus + Math.floor(player.attack  * potionAtkPct  / 100);
    const effectiveDefense = player.defense + petBonus.defBonus + Math.floor(player.defense * potionDefPct  / 100);

    let playerDamage = calcDamage(effectiveAttack, battle.monsterDefense);

    // ── Crit check (talentCrit = 0.5% crit chance per point, 1.5× damage) ─────
    const critChance = (player.talentCrit ?? 0) * 0.005;
    const isCrit = critChance > 0 && Math.random() < critChance;
    if (isCrit) {
      playerDamage = Math.floor(playerDamage * 1.5);
      log.push(`⚡ CRITICAL HIT! You strike the ${battle.monsterName} for ${playerDamage} damage!`);
    } else {
      log.push(`You attack the ${battle.monsterName} for ${playerDamage} damage!`);
    }

    const newMonsterHp = Math.max(0, battle.monsterHp - playerDamage);

    let status = "active";
    let loot = null;
    let xpGained = 0;
    let goldGained = 0;
    let leveledUp = false;
    let stoneDropped = false;

    // Track any attack stat delta from skill level-up
    const meleeSkillAtkDelta = (meleeSkillLevel - player.meleeSkillLevel) * MELEE_SKILL_ATK_PER_LEVEL;

    if (newMonsterHp <= 0) {
      status = "victory";
      log.push(`${battle.monsterName} has been defeated!`);

      // Bosses give 3× XP and gold
      const bossMultiplier = battle.monsterIsBoss ? 3 : 1;
      const xpMult = ascensionXpMultiplier(player.ascensionLevel) * prestigeXpMultiplier(player.prestigeLevel ?? 0);
      const goldMult = ascensionGoldMultiplier(player.ascensionLevel) * prestigeGoldMultiplier(player.prestigeLevel ?? 0);
      const xpUpgradeMult = 1 + (player.xpUpgradeLevel ?? 0) * 0.05;
      const goldUpgradeMult = 1 + (player.goldUpgradeLevel ?? 0) * 0.10;
      const petXpMult   = 1 + (petBonus.xpBonus   + potionXpPct)   / 100;
      const petGoldMult = 1 + (petBonus.goldBonus + potionGoldPct) / 100;
      xpGained = Math.floor(20 * Math.pow(1.2, battle.monsterLevel - 1) * bossMultiplier * xpMult * xpUpgradeMult * petXpMult);
      goldGained = Math.floor((10 * Math.pow(1.1, battle.monsterLevel - 1) + Math.floor(Math.random() * 10)) * bossMultiplier * goldMult * goldUpgradeMult * petGoldMult);
      log.push(`You gained ${xpGained} XP and ${goldGained} gold!`);

      // Loot drops: bosses always drop, regular monsters 35% chance
      const dropsLoot = battle.monsterIsBoss || Math.random() < 0.35;
      if (dropsLoot) {
        loot = rollLoot(battle.monsterIsBoss, player.level, (player.luckUpgradeLevel ?? 0) + (player.talentLuck ?? 0));
        log.push(`Loot obtained: ${loot.name} [${loot.rarity}]!`);
        await db.insert(inventoryTable).values({
          playerId: player.id,
          name: loot.name,
          rarity: loot.rarity,
          emoji: loot.emoji,
          goldValue: loot.goldValue,
          type: loot.type,
          statBonus: loot.statBonus,
          equipped: false,
          enchantLevel: 0,
        });
      }

      // 0.8% chance to drop an Enchanting Stone on any kill
      stoneDropped = Math.random() < 0.008;
      if (stoneDropped) {
        log.push(`Enchanting Stone drops from the ${battle.monsterName}!`);
      }

      // ── Alchemy ingredient drop ──────────────────────────────────────────────
      const ingredientId = getIngredientDropChance(battle.monsterName);
      const existingIngredients = parseIngredients(player.alchemyIngredients);
      if (ingredientId) {
        existingIngredients[ingredientId] = (existingIngredients[ingredientId] || 0) + 1;
        log.push(`🧪 ${ingredientId.replace(/_/g, " ")} collected!`);
      }

      // ── Pet drop ────────────────────────────────────────────────────────────
      const petDrop = getPetDropChance(battle.monsterName, (player.luckUpgradeLevel ?? 0) + (player.talentLuck ?? 0));
      const existingPets = parsePets(player.petsData);
      if (petDrop && !existingPets.find((p: any) => p.id === petDrop.id)) {
        existingPets.push(petDrop);
        log.push(`🐾 New pet found: ${petDrop.emoji} ${petDrop.name} [${petDrop.rarity}]!`);
      }

      // ── Monster codex update ────────────────────────────────────────────────
      const updatedCodex = updateCodex(parseCodex(player.monsterCodex), battle.monsterName);

      const newXp = player.xp + xpGained;
      const neededXp = xpToNextLevel(player.level);
      let newLevel = player.level;
      let newMaxHp = player.maxHp;
      let newAttack = player.attack + meleeSkillAtkDelta;
      let newDefense = player.defense;
      let newXpFinal = newXp;
      let newTalentPoints = player.talentPoints;

      if (newXp >= neededXp) {
        newLevel = player.level + 1;
        newXpFinal = newXp - neededXp;
        newMaxHp = calcMaxHp(newLevel) + (player.vitUpgradeLevel ?? 0) * 50 + prestigeHpBonus(player.prestigeLevel ?? 0) + (player.talentHp ?? 0) * 25;

        // Recalculate base stats for the new level (include current skill levels)
        const baseAttack = calcAttack(newLevel, meleeSkillLevel);
        const baseDefense = calcDefense(newLevel, player.defenseSkillLevel);

        // Re-add bonuses from equipped items so they aren't lost on level-up
        const equippedItems = await db.select().from(inventoryTable)
          .where(and(eq(inventoryTable.playerId, player.id), eq(inventoryTable.equipped, true)));
        const atkBonus = equippedItems
          .filter(i => ATK_TYPES.includes(i.type as any))
          .reduce((s, i) => s + i.statBonus, 0);
        const defBonus = equippedItems
          .filter(i => !ATK_TYPES.includes(i.type as any))
          .reduce((s, i) => s + i.statBonus, 0);

        newAttack = baseAttack + atkBonus + (player.talentAtk ?? 0) * 3;
        newDefense = baseDefense + defBonus + (player.talentDef ?? 0) * 2;
        newTalentPoints = player.talentPoints + 1;
        leveledUp = true;
        log.push(`LEVEL UP! You are now level ${newLevel}! +1 Talent Point!`);
      }

      // Recover HP per kill (base 4% + 1% per regen upgrade level)
      const regenPct = 0.04 + (player.regenUpgradeLevel ?? 0) * 0.01;
      const hpRegen = Math.max(1, Math.round(newMaxHp * regenPct));
      const hpAfterRegen = Math.min(player.hp + hpRegen, newMaxHp);
      log.push(`Recovered ${hpRegen} HP.`);

      await db.update(playersTable).set({
        xp: newXpFinal,
        gold: player.gold + goldGained,
        monstersDefeated: player.monstersDefeated + 1,
        bossesDefeated: player.bossesDefeated + (battle.monsterIsBoss ? 1 : 0),
        gearLooted: player.gearLooted + (loot ? 1 : 0),
        goldEarned: player.goldEarned + goldGained,
        totalDamageDealt: sql`${playersTable.totalDamageDealt} + ${playerDamage}`,
        enchantingStones: player.enchantingStones + (stoneDropped ? 1 : 0),
        level: newLevel,
        maxHp: newMaxHp,
        attack: newAttack,
        defense: newDefense,
        hp: hpAfterRegen,
        meleeSkillLevel,
        meleeSkillXp,
        talentPoints: newTalentPoints,
        alchemyIngredients: JSON.stringify(existingIngredients),
        petsData: JSON.stringify(existingPets),
        monsterCodex: JSON.stringify(updatedCodex),
      }).where(eq(playersTable.id, player.id));

      await db.update(battlesTable).set({ monsterHp: 0, status: "victory" }).where(eq(battlesTable.id, battle.id));
    } else {
      // Monster is still alive — it counter-attacks
      const monsterDamage = calcDamage(battle.monsterAttack, effectiveDefense);
      const newPlayerHp = Math.max(0, player.hp - monsterDamage);
      log.push(`${battle.monsterName} strikes you for ${monsterDamage} damage!`);

      // ── Defense skill: +1 XP every time the player is hit ─────────────────
      let defenseSkillLevel = player.defenseSkillLevel;
      let defenseSkillXp = player.defenseSkillXp + 1;
      const defXpNeeded = skillXpToNextLevel(defenseSkillLevel);
      if (defenseSkillXp >= defXpNeeded) {
        defenseSkillLevel += 1;
        defenseSkillXp -= defXpNeeded;
        log.push(`[Defense] Skill reached Level ${defenseSkillLevel}! DEF +${DEFENSE_SKILL_DEF_PER_LEVEL}`);
      }
      const defSkillDefDelta = (defenseSkillLevel - player.defenseSkillLevel) * DEFENSE_SKILL_DEF_PER_LEVEL;
      const updatedDefense = player.defense + defSkillDefDelta;

      if (newPlayerHp <= 0) {
        status = "defeat";
        log.push(`You have been defeated by ${battle.monsterName}!`);
        const maxHp = calcMaxHp(player.level) + (player.vitUpgradeLevel ?? 0) * 50 + prestigeHpBonus(player.prestigeLevel ?? 0) + (player.talentHp ?? 0) * 25;
        await db.update(playersTable).set({
          hp: maxHp,
          attack: player.attack + meleeSkillAtkDelta,
          defense: updatedDefense,
          meleeSkillLevel,
          meleeSkillXp,
          defenseSkillLevel,
          defenseSkillXp,
          totalDamageDealt: sql`${playersTable.totalDamageDealt} + ${playerDamage}`,
          totalDamageTaken: sql`${playersTable.totalDamageTaken} + ${monsterDamage}`,
        }).where(eq(playersTable.id, player.id));
        await db.update(battlesTable).set({ monsterHp: newMonsterHp, status: "defeat" }).where(eq(battlesTable.id, battle.id));
      } else {
        await db.update(playersTable).set({
          hp: newPlayerHp,
          attack: player.attack + meleeSkillAtkDelta,
          defense: updatedDefense,
          meleeSkillLevel,
          meleeSkillXp,
          defenseSkillLevel,
          defenseSkillXp,
          totalDamageDealt: sql`${playersTable.totalDamageDealt} + ${playerDamage}`,
          totalDamageTaken: sql`${playersTable.totalDamageTaken} + ${monsterDamage}`,
        }).where(eq(playersTable.id, player.id));
        await db.update(battlesTable).set({ monsterHp: newMonsterHp }).where(eq(battlesTable.id, battle.id));
      }
    }

    const [updatedPlayer, updatedBattle] = await Promise.all([
      db.select().from(playersTable).where(eq(playersTable.id, player.id)).then(r => r[0]),
      db.select().from(battlesTable).where(eq(battlesTable.id, battle.id)).then(r => r[0]),
    ]);
    const attackZone = getZone(updatedPlayer.level);

    const data = PerformAttackResponse.parse({
      monster: {
        name: updatedBattle.monsterName,
        emoji: updatedBattle.monsterEmoji,
        hp: updatedBattle.monsterHp,
        maxHp: updatedBattle.monsterMaxHp,
        attack: updatedBattle.monsterAttack,
        defense: updatedBattle.monsterDefense,
        level: updatedBattle.monsterLevel,
        isBoss: updatedBattle.monsterIsBoss,
        zone: attackZone.id,
        zoneName: attackZone.name,
      },
      player: {
        ...updatedPlayer,
        xpToNextLevel: xpToNextLevel(updatedPlayer.level),
        meleeSkillXpToNext: skillXpToNextLevel(updatedPlayer.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(updatedPlayer.defenseSkillLevel),
      },
      log,
      status,
      loot,
      xpGained: xpGained || undefined,
      goldGained: goldGained || undefined,
      leveledUp: leveledUp || undefined,
      stoneDropped: stoneDropped || undefined,
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to perform attack");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
