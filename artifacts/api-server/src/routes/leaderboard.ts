import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

// GET /leaderboard
router.get("/leaderboard", async (_req, res) => {
  const allPlayers = await db.select({
    id: playersTable.id,
    name: playersTable.name,
    level: playersTable.level,
    prestigeLevel: playersTable.prestigeLevel,
    monstersDefeated: playersTable.monstersDefeated,
    bossesDefeated: playersTable.bossesDefeated,
    goldEarned: playersTable.goldEarned,
    arenaPoints: playersTable.arenaPoints,
    arenaWins: playersTable.arenaWins,
    totalFishCaught: playersTable.totalFishCaught,
    challengeHighScore: playersTable.challengeHighScore,
    createdAt: playersTable.createdAt,
  }).from(playersTable).orderBy(desc(playersTable.level)).limit(100);

  const ranked = allPlayers.map((p, i) => ({
    rank: i + 1,
    ...p,
    score: p.level * 100 + p.prestigeLevel * 10000 + p.monstersDefeated,
  })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));

  res.json({ players: ranked, total: ranked.length });
});

export default router;
