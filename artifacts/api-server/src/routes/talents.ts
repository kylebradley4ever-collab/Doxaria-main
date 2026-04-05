import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export interface TalentTree {
  atk: number;
  def: number;
  hp: number;
  crit: number;
  speed: number;
  luck: number;
}

export const TALENT_CONFIG = {
  atk:   { label: "Strength",    emoji: "⚔️",  desc: "+3 ATK per point",       color: "red"    },
  def:   { label: "Fortitude",   emoji: "🛡️",  desc: "+2 DEF per point",       color: "blue"   },
  hp:    { label: "Endurance",   emoji: "❤️",  desc: "+25 Max HP per point",    color: "green"  },
  crit:  { label: "Precision",   emoji: "🎯",  desc: "+0.5% Crit Chance/point", color: "yellow" },
  speed: { label: "Swiftness",   emoji: "💨",  desc: "+1% Attack Speed/point",  color: "cyan"   },
  luck:  { label: "Fortune",     emoji: "🍀",  desc: "+1% Loot Luck per point", color: "purple" },
} as const;

export type TalentKey = keyof typeof TALENT_CONFIG;

const TALENT_KEYS: TalentKey[] = ["atk", "def", "hp", "crit", "speed", "luck"];

export function getTalentBonuses(p: { talentAtk: number; talentDef: number; talentHp: number; talentCrit: number; talentSpeed: number; talentLuck: number }) {
  return {
    atkBonus: p.talentAtk * 3,
    defBonus: p.talentDef * 2,
    hpBonus:  p.talentHp  * 25,
    critChance: p.talentCrit * 0.5,
    speedBonus: p.talentSpeed * 1,
    luckBonus:  p.talentLuck  * 1,
  };
}

router.get("/talents", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const bonuses = getTalentBonuses(p);
  res.json({
    talentPoints: p.talentPoints,
    spent: { atk: p.talentAtk, def: p.talentDef, hp: p.talentHp, crit: p.talentCrit, speed: p.talentSpeed, luck: p.talentLuck },
    totalSpent: p.talentAtk + p.talentDef + p.talentHp + p.talentCrit + p.talentSpeed + p.talentLuck,
    bonuses,
  });
});

router.post("/talents/spend", async (req, res) => {
  const { talent } = req.body as { talent: string };
  if (!talent || !TALENT_KEYS.includes(talent as TalentKey)) {
    res.status(400).json({ error: "Invalid talent" }); return;
  }
  const p = await getPlayer(req, res);
  if (!p) return;
  if (p.talentPoints <= 0) { res.status(400).json({ error: "No talent points" }); return; }

  const colMap: Record<TalentKey, keyof typeof p> = {
    atk: "talentAtk", def: "talentDef", hp: "talentHp",
    crit: "talentCrit", speed: "talentSpeed", luck: "talentLuck",
  };
  const col = colMap[talent as TalentKey];
  const current = p[col] as number;
  const update: Record<string, number> = {
    talentPoints: p.talentPoints - 1,
    [col]: current + 1,
  };
  if (talent === "hp") {
    update.maxHp = p.maxHp + 25;
    update.hp = Math.min(p.hp + 25, p.maxHp + 25);
  }
  await db.update(playersTable).set(update).where(eq(playersTable.id, p.id));
  res.json({ success: true, talent, newValue: current + 1, talentPoints: p.talentPoints - 1 });
});

router.post("/talents/reset", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const cost = 10000 * Math.max(1, Math.floor((p.talentAtk + p.talentDef + p.talentHp + p.talentCrit + p.talentSpeed + p.talentLuck) / 5));
  if (p.gold < cost) { res.status(400).json({ error: `Need ${cost.toLocaleString()} gold to reset` }); return; }
  const totalSpent = p.talentAtk + p.talentDef + p.talentHp + p.talentCrit + p.talentSpeed + p.talentLuck;
  const hpToRemove  = p.talentHp  * 25;
  const atkToRemove = p.talentAtk * 3;
  const defToRemove = p.talentDef * 2;
  await db.update(playersTable).set({
    gold: p.gold - cost,
    talentPoints: p.talentPoints + totalSpent,
    talentAtk: 0, talentDef: 0, talentHp: 0,
    talentCrit: 0, talentSpeed: 0, talentLuck: 0,
    attack:  Math.max(1, p.attack  - atkToRemove),
    defense: Math.max(0, p.defense - defToRemove),
    maxHp: Math.max(p.maxHp - hpToRemove, 100),
    hp: Math.min(p.hp, Math.max(p.maxHp - hpToRemove, 100)),
  }).where(eq(playersTable.id, p.id));
  res.json({ success: true, refunded: totalSpent, cost });
});

export default router;
