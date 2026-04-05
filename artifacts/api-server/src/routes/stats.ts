import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { inventoryTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const [{ value: totalItems }] = await db
      .select({ value: count() })
      .from(inventoryTable)
      .where(eq(inventoryTable.playerId, player.id));

    const daysSinceCreation = Math.floor(
      (Date.now() - player.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    res.json({
      monstersDefeated:  player.monstersDefeated,
      bossesDefeated:    player.bossesDefeated,
      gearLooted:        player.gearLooted,
      totalDamageDealt:  player.totalDamageDealt,
      totalDamageTaken:  player.totalDamageTaken,
      goldEarned:        player.goldEarned,
      itemsSold:         player.itemsSold,
      totalFishCaught:   player.totalFishCaught,
      totalItems,
      daysSinceCreation,
      level:             player.level,
      prestigeLevel:     player.prestigeLevel,
      challengeHighScore: player.challengeHighScore,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
