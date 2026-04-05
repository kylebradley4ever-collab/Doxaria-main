import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  prestigeRequiredLevel,
  prestigeXpMultiplier,
  prestigeGoldMultiplier,
  prestigeHpBonus,
  getPrestigeTier,
  PRESTIGE_TIERS,
} from "../lib/gameLogic.js";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

router.get("/prestige", async (req, res) => {
  const player = await getPlayer(req, res);
  if (!player) return;

  const pl = player.prestigeLevel ?? 0;
  const requiredLevel = prestigeRequiredLevel(pl);
  const tier = getPrestigeTier(pl);
  const nextTier = PRESTIGE_TIERS.find(t => t.minPrestige > pl) ?? null;

  return res.json({
    prestigeLevel: pl,
    currentLevel: player.level,
    requiredLevel,
    canPrestige: player.level >= requiredLevel,
    xpMultiplier: prestigeXpMultiplier(pl),
    goldMultiplier: prestigeGoldMultiplier(pl),
    hpBonus: prestigeHpBonus(pl),
    tier: tier ?? null,
    nextTier: nextTier ?? null,
  });
});

router.post("/prestige", async (req, res) => {
  const player = await getPlayer(req, res);
  if (!player) return;

  const pl = player.prestigeLevel ?? 0;
  const requiredLevel = prestigeRequiredLevel(pl);

  if (player.level < requiredLevel) {
    return res.status(400).json({
      error: `You need to reach level ${requiredLevel} before prestiging.`,
    });
  }

  const newPrestigeLevel = pl + 1;
  const vitHpBonus = (player.vitUpgradeLevel ?? 0) * 50;
  const newMaxHp = 100 + vitHpBonus + prestigeHpBonus(newPrestigeLevel);
  await db.update(playersTable)
    .set({
      prestigeLevel: newPrestigeLevel,
      level: 1,
      xp: 0,
      hp: newMaxHp,
      maxHp: newMaxHp,
    })
    .where(eq(playersTable.id, player.id));

  const tier = getPrestigeTier(newPrestigeLevel);
  return res.json({
    success: true,
    prestigeLevel: newPrestigeLevel,
    tier: tier ?? null,
    message: `You have achieved Prestige ${newPrestigeLevel}! +${Math.round((prestigeXpMultiplier(newPrestigeLevel) - 1) * 100)}% XP, +${Math.round((prestigeGoldMultiplier(newPrestigeLevel) - 1) * 100)}% Gold.`,
  });
});

export default router;
