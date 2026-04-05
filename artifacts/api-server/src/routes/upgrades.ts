import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

const UPGRADES = {
  vit:    { label: "Vitality",  baseCost: 500,  costFactor: 1.8 },
  regen:  { label: "Regen",     baseCost: 800,  costFactor: 1.8 },
  xp:     { label: "Wisdom",    baseCost: 1200, costFactor: 1.85 },
  gold:   { label: "Fortune",   baseCost: 1500, costFactor: 1.85 },
  luck:   { label: "Luck",      baseCost: 3000, costFactor: 2.0 },
} as const;

type UpgradeKey = keyof typeof UPGRADES;

function upgradeCost(key: UpgradeKey, currentLevel: number): number {
  const u = UPGRADES[key];
  return Math.floor(u.baseCost * Math.pow(u.costFactor, currentLevel));
}

router.get("/upgrades", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;

  res.json({
    vit:   { level: p.vitUpgradeLevel,   cost: upgradeCost("vit",   p.vitUpgradeLevel)   },
    regen: { level: p.regenUpgradeLevel, cost: upgradeCost("regen", p.regenUpgradeLevel) },
    xp:    { level: p.xpUpgradeLevel,    cost: upgradeCost("xp",    p.xpUpgradeLevel)    },
    gold:  { level: p.goldUpgradeLevel,  cost: upgradeCost("gold",  p.goldUpgradeLevel)  },
    luck:  { level: p.luckUpgradeLevel,  cost: upgradeCost("luck",  p.luckUpgradeLevel)  },
    currentGold: p.gold,
  });
});

router.post("/upgrades/buy", async (req, res) => {
  const { type } = req.body as { type: string };
  if (!type || !(type in UPGRADES)) {
    res.status(400).json({ error: "Invalid upgrade type" });
    return;
  }
  const key = type as UpgradeKey;

  const p = await getPlayer(req, res);
  if (!p) return;

  const currentLevel: number = (p as any)[`${key}UpgradeLevel`] as number;
  const cost = upgradeCost(key, currentLevel);

  if (p.gold < cost) {
    res.status(400).json({ error: "Not enough gold" });
    return;
  }

  const newLevel = currentLevel + 1;
  const colKey = `${key}UpgradeLevel` as keyof typeof p;

  const updateData: Record<string, number> = {
    gold: p.gold - cost,
    [colKey]: newLevel,
  };

  if (key === "vit") {
    updateData.maxHp = p.maxHp + 50;
    updateData.hp = Math.min(p.hp + 50, p.maxHp + 50);
  }

  await db.update(playersTable).set(updateData).where(eq(playersTable.id, p.id));

  res.json({
    success: true,
    type: key,
    newLevel,
    nextCost: upgradeCost(key, newLevel),
    goldSpent: cost,
    remainingGold: p.gold - cost,
  });
});

export default router;
