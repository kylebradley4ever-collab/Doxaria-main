import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, inventoryTable } from "@workspace/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { xpToNextLevel, skillXpToNextLevel } from "../lib/gameLogic.js";
import { getPlayer } from "../lib/getPlayer.js";

const VALID_RARITIES = [
  "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic",
  "Divine", "Abyssal", "Transcendent", "Cosmic", "Eternal",
] as const;
type Rarity = typeof VALID_RARITIES[number];

const router: IRouter = Router();

router.post("/inventory/:id/sell", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      res.status(400).json({ error: "Invalid item id" });
      return;
    }

    const player = await getPlayer(req, res);
    if (!player) return;

    const items = await db.select().from(inventoryTable)
      .where(and(eq(inventoryTable.id, itemId), eq(inventoryTable.playerId, player.id)));
    if (items.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const item = items[0];

    if (item.equipped) {
      res.status(400).json({ error: "Cannot sell an equipped item — unequip it first" });
      return;
    }

    const deleted = await db.delete(inventoryTable)
      .where(and(eq(inventoryTable.id, itemId), eq(inventoryTable.equipped, false)))
      .returning();

    if (deleted.length === 0) {
      res.status(409).json({ error: "Item was already sold." });
      return;
    }

    const [updatedPlayer] = await db.update(playersTable)
      .set({
        gold: sql`${playersTable.gold} + ${item.goldValue}`,
        goldEarned: sql`${playersTable.goldEarned} + ${item.goldValue}`,
        itemsSold: sql`${playersTable.itemsSold} + 1`,
      })
      .where(eq(playersTable.id, player.id))
      .returning();

    res.json({
      goldGained: item.goldValue,
      player: {
        ...updatedPlayer,
        xpToNextLevel: xpToNextLevel(updatedPlayer.level),
        meleeSkillXpToNext: skillXpToNextLevel(updatedPlayer.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(updatedPlayer.defenseSkillLevel),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to sell item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inventory/sell-all", async (req, res) => {
  try {
    const rawRarity = req.body?.rarity;
    const rarity: Rarity | undefined =
      typeof rawRarity === "string" && VALID_RARITIES.includes(rawRarity as Rarity)
        ? (rawRarity as Rarity)
        : undefined;

    const player = await getPlayer(req, res);
    if (!player) return;

    let candidates = await db.select().from(inventoryTable)
      .where(and(
        eq(inventoryTable.playerId, player.id),
        eq(inventoryTable.equipped, false),
      ));

    if (rarity) {
      candidates = candidates.filter(i => i.rarity === rarity);
    }

    if (candidates.length === 0) {
      res.json({
        count: 0,
        goldGained: 0,
        player: {
          ...player,
          xpToNextLevel: xpToNextLevel(player.level),
          meleeSkillXpToNext: skillXpToNextLevel(player.meleeSkillLevel),
          defenseSkillXpToNext: skillXpToNextLevel(player.defenseSkillLevel),
        },
      });
      return;
    }

    const ids = candidates.map(i => i.id);

    const deleted = await db.delete(inventoryTable)
      .where(and(
        inArray(inventoryTable.id, ids),
        eq(inventoryTable.playerId, player.id),
        eq(inventoryTable.equipped, false),
      ))
      .returning();

    if (deleted.length === 0) {
      res.json({
        count: 0,
        goldGained: 0,
        player: {
          ...player,
          xpToNextLevel: xpToNextLevel(player.level),
          meleeSkillXpToNext: skillXpToNextLevel(player.meleeSkillLevel),
          defenseSkillXpToNext: skillXpToNextLevel(player.defenseSkillLevel),
        },
      });
      return;
    }

    const actualGold = deleted.reduce((sum, i) => sum + i.goldValue, 0);

    const [updatedPlayer] = await db.update(playersTable)
      .set({
        gold: sql`${playersTable.gold} + ${actualGold}`,
        goldEarned: sql`${playersTable.goldEarned} + ${actualGold}`,
        itemsSold: sql`${playersTable.itemsSold} + ${deleted.length}`,
      })
      .where(eq(playersTable.id, player.id))
      .returning();

    res.json({
      count: deleted.length,
      goldGained: actualGold,
      player: {
        ...updatedPlayer,
        xpToNextLevel: xpToNextLevel(updatedPlayer.level),
        meleeSkillXpToNext: skillXpToNextLevel(updatedPlayer.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(updatedPlayer.defenseSkillLevel),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to sell-all items");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
