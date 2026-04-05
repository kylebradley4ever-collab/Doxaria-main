import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, inventoryTable, battlesTable } from "@workspace/db/schema";
import { CreatePlayerBody, CreatePlayerResponse, GetPlayerResponse, AscendPlayerResponse } from "@workspace/api-zod";
import { calcAttack, calcDefense, calcMaxHp, xpToNextLevel, skillXpToNextLevel, ASCEND_MIN_LEVEL, ascensionXpMultiplier, ascensionGoldMultiplier, ATK_TYPES, prestigeHpBonus } from "../lib/gameLogic.js";
import { getPlayer } from "../lib/getPlayer.js";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/player", async (req, res) => {
  try {
    const p = await getPlayer(req, res);
    if (!p) return;
    const data = GetPlayerResponse.parse({
      ...p,
      xpToNextLevel: xpToNextLevel(p.level),
      meleeSkillXpToNext: skillXpToNextLevel(p.meleeSkillLevel),
      defenseSkillXpToNext: skillXpToNextLevel(p.defenseSkillLevel),
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get player");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/player", async (req, res) => {
  try {
    const body = CreatePlayerBody.parse(req.body);
    const token = req.headers["x-player-token"];
    if (!token || typeof token !== "string") {
      res.status(401).json({ error: "Missing player token" });
      return;
    }

    const maxHp = calcMaxHp(1);

    const existingPlayers = await db.select().from(playersTable).where(eq(playersTable.token, token));
    if (existingPlayers.length > 0) {
      const oldId = existingPlayers[0].id;
      await db.delete(inventoryTable).where(eq(inventoryTable.playerId, oldId));
      await db.delete(battlesTable).where(eq(battlesTable.playerId, oldId));
      await db.delete(playersTable).where(eq(playersTable.id, oldId));
    }

    const [player] = await db.insert(playersTable).values({
      name: body.name,
      token,
      level: 1,
      xp: 0,
      hp: maxHp,
      maxHp,
      attack: calcAttack(1),
      defense: calcDefense(1),
      gold: 0,
      monstersDefeated: 0,
    }).returning();

    const data = CreatePlayerResponse.parse({
      ...player,
      xpToNextLevel: xpToNextLevel(1),
      meleeSkillXpToNext: skillXpToNextLevel(1),
      defenseSkillXpToNext: skillXpToNextLevel(1),
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create player");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/player/ascend", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    if (player.level < ASCEND_MIN_LEVEL) {
      res.status(400).json({ error: `Must reach level ${ASCEND_MIN_LEVEL} to ascend. Current level: ${player.level}.` });
      return;
    }

    const activeBattles = await db.select().from(battlesTable)
      .where(and(eq(battlesTable.playerId, player.id), eq(battlesTable.status, "active")))
      .limit(1);
    if (activeBattles.length > 0) {
      res.status(400).json({ error: "Cannot ascend while in battle. Wait for the current fight to end." });
      return;
    }

    const newAscensionLevel = player.ascensionLevel + 1;
    const newMaxHp = calcMaxHp(1) + (player.vitUpgradeLevel ?? 0) * 50 + prestigeHpBonus(player.prestigeLevel ?? 0);

    const baseAttack  = calcAttack(1,  player.meleeSkillLevel);
    const baseDefense = calcDefense(1, player.defenseSkillLevel);

    const equippedItems = await db.select().from(inventoryTable)
      .where(and(eq(inventoryTable.playerId, player.id), eq(inventoryTable.equipped, true)));
    const atkBonus = equippedItems
      .filter(i => ATK_TYPES.includes(i.type as any))
      .reduce((s, i) => s + i.statBonus, 0);
    const defBonus = equippedItems
      .filter(i => !ATK_TYPES.includes(i.type as any))
      .reduce((s, i) => s + i.statBonus, 0);
    const newAttack  = baseAttack  + atkBonus;
    const newDefense = baseDefense + defBonus;

    const [updated] = await db.update(playersTable)
      .set({
        level: 1,
        xp: 0,
        hp: newMaxHp,
        maxHp: newMaxHp,
        attack: newAttack,
        defense: newDefense,
        ascensionLevel: newAscensionLevel,
      })
      .where(eq(playersTable.id, player.id))
      .returning();

    const xpMult = ascensionXpMultiplier(newAscensionLevel);
    const goldMult = ascensionGoldMultiplier(newAscensionLevel);

    const data = AscendPlayerResponse.parse({
      player: {
        ...updated,
        xpToNextLevel: xpToNextLevel(1),
        meleeSkillXpToNext: skillXpToNextLevel(updated.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(updated.defenseSkillLevel),
      },
      message: `You have ascended to tier ${newAscensionLevel}! XP gain: +${Math.round((xpMult - 1) * 100)}% | Gold gain: +${Math.round((goldMult - 1) * 100)}%`,
      ascensionLevel: newAscensionLevel,
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to ascend player");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
