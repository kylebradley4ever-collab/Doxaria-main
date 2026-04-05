import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, inventoryTable } from "@workspace/db/schema";
import { GetInventoryResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

router.get("/inventory", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const items = await db.select().from(inventoryTable)
      .where(eq(inventoryTable.playerId, player.id))
      .orderBy(desc(inventoryTable.obtainedAt));

    const data = GetInventoryResponse.parse({
      items: items.map(item => ({
        ...item,
        obtainedAt: item.obtainedAt,
      })),
      totalItems: items.length,
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
