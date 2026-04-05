import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, inventoryTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { xpToNextLevel, ATK_TYPES, skillXpToNextLevel } from "../lib/gameLogic.js";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

const MAX_ENCHANT_LEVEL = 10;

router.post("/inventory/:id/enchant", async (req, res) => {
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

    if (item.enchantLevel >= MAX_ENCHANT_LEVEL) {
      res.status(400).json({ error: `This item is already at maximum enchant level (+${MAX_ENCHANT_LEVEL})` });
      return;
    }

    const stoneCost = item.enchantLevel + 1;

    if (player.enchantingStones < stoneCost) {
      res.status(400).json({
        error: `Need ${stoneCost} stone${stoneCost !== 1 ? "s" : ""} to reach +${item.enchantLevel + 1}. You have ${player.enchantingStones}.`,
      });
      return;
    }

    const [playerAfterStone] = await db.update(playersTable)
      .set({ enchantingStones: sql`${playersTable.enchantingStones} - ${stoneCost}` })
      .where(and(
        eq(playersTable.id, player.id),
        sql`${playersTable.enchantingStones} >= ${stoneCost}`,
      ))
      .returning();

    if (!playerAfterStone) {
      res.status(400).json({
        error: `Need ${stoneCost} stone${stoneCost !== 1 ? "s" : ""} to enchant. Race condition — try again.`,
      });
      return;
    }

    const [updatedItem] = await db.update(inventoryTable)
      .set({
        statBonus: sql`${inventoryTable.statBonus} + 1`,
        enchantLevel: sql`${inventoryTable.enchantLevel} + 1`,
      })
      .where(and(
        eq(inventoryTable.id, itemId),
        sql`${inventoryTable.enchantLevel} < ${MAX_ENCHANT_LEVEL}`,
      ))
      .returning();

    if (!updatedItem) {
      await db.update(playersTable)
        .set({ enchantingStones: sql`${playersTable.enchantingStones} + ${stoneCost}` })
        .where(eq(playersTable.id, player.id));
      res.status(400).json({ error: `This item is already at maximum enchant level (+${MAX_ENCHANT_LEVEL})` });
      return;
    }

    let finalPlayer = playerAfterStone;
    if (item.equipped) {
      const isAtk = ATK_TYPES.includes(item.type as any);
      const [p] = await db.update(playersTable)
        .set(isAtk
          ? { attack: sql`${playersTable.attack} + 1` }
          : { defense: sql`${playersTable.defense} + 1` }
        )
        .where(eq(playersTable.id, player.id))
        .returning();
      finalPlayer = p;
    }

    res.json({
      item: { ...updatedItem, obtainedAt: updatedItem.obtainedAt },
      player: {
        ...finalPlayer,
        xpToNextLevel: xpToNextLevel(finalPlayer.level),
        meleeSkillXpToNext: skillXpToNextLevel(finalPlayer.meleeSkillLevel),
        defenseSkillXpToNext: skillXpToNextLevel(finalPlayer.defenseSkillLevel),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to enchant item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
