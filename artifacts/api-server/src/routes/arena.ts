import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq, ne } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export const ARENA_TIERS = [
  { name: "Bronze",      minPoints: 0,    color: "#cd7f32", reward: 100  },
  { name: "Silver",      minPoints: 500,  color: "#c0c0c0", reward: 250  },
  { name: "Gold",        minPoints: 1500, color: "#ffd700", reward: 500  },
  { name: "Platinum",    minPoints: 3000, color: "#e5e4e2", reward: 1000 },
  { name: "Diamond",     minPoints: 6000, color: "#b9f2ff", reward: 2000 },
  { name: "Champion",    minPoints: 10000,color: "#ff77ff", reward: 5000 },
  { name: "Grandmaster", minPoints: 20000,color: "#ffcc44", reward: 10000},
];

function getArenaTier(points: number) {
  for (let i = ARENA_TIERS.length - 1; i >= 0; i--) {
    if (points >= ARENA_TIERS[i].minPoints) return ARENA_TIERS[i];
  }
  return ARENA_TIERS[0];
}

function simulateBattle(attacker: { attack: number; defense: number; maxHp: number }, defender: { attack: number; defense: number; maxHp: number }): boolean {
  let aHp = attacker.maxHp;
  let dHp = defender.maxHp;
  const aDmg = Math.max(1, attacker.attack - defender.defense);
  const dDmg = Math.max(1, defender.attack - attacker.defense);
  let rounds = 0;
  while (aHp > 0 && dHp > 0 && rounds < 500) {
    dHp -= aDmg;
    if (dHp <= 0) break;
    aHp -= dDmg;
    rounds++;
  }
  return aHp > 0;
}

router.get("/arena", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const opponents = await db.select({
    id: playersTable.id, name: playersTable.name,
    level: playersTable.level, attack: playersTable.attack,
    defense: playersTable.defense, maxHp: playersTable.maxHp,
    arenaPoints: playersTable.arenaPoints, prestigeLevel: playersTable.prestigeLevel,
  }).from(playersTable).where(ne(playersTable.id, p.id)).limit(10);

  const tier = getArenaTier(p.arenaPoints);
  const nextTier = ARENA_TIERS.find(t => t.minPoints > p.arenaPoints) || null;

  res.json({
    myStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp, level: p.level },
    arenaPoints: p.arenaPoints,
    arenaWins: p.arenaWins,
    arenaLosses: p.arenaLosses,
    arenaTier: tier,
    nextTier,
    opponents,
  });
});

router.post("/arena/challenge", async (req, res) => {
  const { opponentId } = req.body as { opponentId?: number };
  const p = await getPlayer(req, res);
  if (!p) return;

  let opponent: { id: number; name: string; attack: number; defense: number; maxHp: number; arenaPoints: number } | null = null;

  if (opponentId) {
    const found = await db.select().from(playersTable).where(eq(playersTable.id, opponentId)).limit(1);
    if (found.length) opponent = found[0];
  }

  if (!opponent) {
    opponent = {
      id: 0,
      name: generateOpponentName(p.level),
      attack: Math.floor(p.attack * (0.8 + Math.random() * 0.6)),
      defense: Math.floor(p.defense * (0.8 + Math.random() * 0.6)),
      maxHp: Math.floor(p.maxHp * (0.8 + Math.random() * 0.6)),
      arenaPoints: p.arenaPoints,
    };
  }

  const won = simulateBattle(
    { attack: p.attack, defense: p.defense, maxHp: p.maxHp },
    { attack: opponent.attack, defense: opponent.defense, maxHp: opponent.maxHp }
  );

  const pointsChange = won ? Math.floor(25 + Math.random() * 25) : -Math.floor(10 + Math.random() * 15);
  const goldReward = won ? Math.floor(500 + p.level * 10 + Math.random() * 500) : 0;
  const newPoints = Math.max(0, p.arenaPoints + pointsChange);
  const newWins = p.arenaWins + (won ? 1 : 0);
  const newLosses = p.arenaLosses + (won ? 0 : 1);
  const newTier = ARENA_TIERS.reduce((best, t, i) => t.minPoints <= newPoints ? i : best, 0);

  await db.update(playersTable).set({
    arenaPoints: newPoints,
    arenaWins: newWins,
    arenaLosses: newLosses,
    arenaTier: newTier,
    gold: p.gold + goldReward,
  }).where(eq(playersTable.id, p.id));

  res.json({
    won, pointsChange, goldReward, newPoints,
    newTier: getArenaTier(newPoints),
    opponent: { name: opponent.name, attack: opponent.attack, defense: opponent.defense, maxHp: opponent.maxHp },
    myStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp },
  });
});

function generateOpponentName(level: number): string {
  const prefixes = ["Iron", "Dark", "Grim", "Void", "Storm", "Chaos", "Shadow", "Blood", "Eternal", "Savage"];
  const names = ["Striker", "Guardian", "Slayer", "Knight", "Berserker", "Mage", "Warlord", "Champion", "Destroyer", "Tyrant"];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const n = names[Math.floor(Math.random() * names.length)];
  return `${p} ${n} (Lv.${level + Math.floor(Math.random() * 10) - 5})`;
}

export default router;
