import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export const LOGIN_REWARDS = [
  { day: 1,  gold: 500,   stones: 0, label: "Day 1" },
  { day: 2,  gold: 1000,  stones: 1, label: "Day 2" },
  { day: 3,  gold: 1500,  stones: 1, label: "Day 3" },
  { day: 4,  gold: 2000,  stones: 2, label: "Day 4" },
  { day: 5,  gold: 3000,  stones: 2, label: "Day 5" },
  { day: 6,  gold: 5000,  stones: 3, label: "Day 6" },
  { day: 7,  gold: 10000, stones: 5, label: "Day 7 ★", special: true },
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

router.get("/login-bonus", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const today = todayString();
  const alreadyClaimed = p.lastLoginDate === today;
  const streak = p.loginStreak;
  const dayIndex = streak % 7;
  const nextReward = LOGIN_REWARDS[dayIndex];
  res.json({
    streak,
    alreadyClaimed,
    nextReward,
    rewards: LOGIN_REWARDS,
    currentDay: dayIndex,
    lastLoginDate: p.lastLoginDate,
  });
});

router.post("/login-bonus/claim", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const today = todayString();
  const yesterday = yesterdayString();
  if (p.lastLoginDate === today) {
    res.status(400).json({ error: "Already claimed today" }); return;
  }
  const newStreak = p.lastLoginDate === yesterday ? p.loginStreak + 1 : 1;
  const dayIndex = (newStreak - 1) % 7;
  const reward = LOGIN_REWARDS[dayIndex];
  await db.update(playersTable).set({
    loginStreak: newStreak,
    lastLoginDate: today,
    gold: p.gold + reward.gold,
    enchantingStones: p.enchantingStones + reward.stones,
  }).where(eq(playersTable.id, p.id));
  res.json({
    success: true,
    reward,
    newStreak,
    goldEarned: reward.gold,
    stonesEarned: reward.stones,
  });
});

export default router;
