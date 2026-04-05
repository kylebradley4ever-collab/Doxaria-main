import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, inventoryTable } from "@workspace/db/schema";
import { EquipItemResponse, UnequipItemResponse } from "@workspace/api-zod";
import { eq, and, sql } from "drizzle-orm";
import { xpToNextLevel, ATK_TYPES } from "../lib/gameLogic.js";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

function statDelta(type: string, bonus: number, sign: 1 | -1) {
  const isAtk = ATK_TYPES.includes(type as any);
  return {
    attackDelta:  isAtk ? sign * bonus : 0,
    defenseDelta: isAtk ? 0 : sign * bonus,
  };
}

router.post("/inventory/:id/equip", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
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

    const equippedOfSameType = await db.select().from(inventoryTable)
      .where(and(
        eq(inventoryTable.playerId, player.id),
        eq(inventoryTable.type, item.type),
        eq(inventoryTable.equipped, true)
      ));

    let totalAttackDelta = 0;
    let totalDefenseDelta = 0;

    for (const old of equippedOfSameType) {
      await db.update(inventoryTable).set({ equipped: false }).where(eq(inventoryTable.id, old.id));
      const { attackDelta, defenseDelta } = statDelta(old.type, old.statBonus, -1);
      totalAttackDelta += attackDelta;
      totalDefenseDelta += defenseDelta;
    }

    await db.update(inventoryTable).set({ equipped: true }).where(eq(inventoryTable.id, itemId));
    const { attackDelta, defenseDelta } = statDelta(item.type, item.statBonus, 1);
    totalAttackDelta += attackDelta;
    totalDefenseDelta += defenseDelta;

    const [updatedPlayer] = await db.update(playersTable).set({
      attack:  totalAttackDelta  !== 0 ? sql`${playersTable.attack}  + ${totalAttackDelta}`  : undefined,
      defense: totalDefenseDelta !== 0 ? sql`${playersTable.defense} + ${totalDefenseDelta}` : undefined,
    }).where(eq(playersTable.id, player.id)).returning();

    const [updatedItem] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, itemId));

    const data = EquipItemResponse.parse({
      item: { ...updatedItem, obtainedAt: updatedItem.obtainedAt },
      player: { ...updatedPlayer, xpToNextLevel: xpToNextLevel(updatedPlayer.level) },
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to equip item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inventory/:id/unequip", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
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

    if (!item.equipped) {
      const data = UnequipItemResponse.parse({
        item: { ...item, obtainedAt: item.obtainedAt },
        player: { ...player, xpToNextLevel: xpToNextLevel(player.level) },
      });
      res.json(data);
      return;
    }

    await db.update(inventoryTable).set({ equipped: false }).where(eq(inventoryTable.id, itemId));

    const { attackDelta, defenseDelta } = statDelta(item.type, item.statBonus, -1);

    const [updatedPlayer] = await db.update(playersTable).set({
      attack: player.attack + attackDelta,
      defense: player.defense + defenseDelta,
    }).where(eq(playersTable.id, player.id)).returning();

    const [updatedItem] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, itemId));

    const data = UnequipItemResponse.parse({
      item: { ...updatedItem, obtainedAt: updatedItem.obtainedAt },
      player: { ...updatedPlayer, xpToNextLevel: xpToNextLevel(updatedPlayer.level) },
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to unequip item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
