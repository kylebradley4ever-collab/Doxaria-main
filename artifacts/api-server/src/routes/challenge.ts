import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export interface ChallengeWave {
  wave: number;
  monsterName: string;
  monsterHp: number;
  monsterAtk: number;
  monsterDef: number;
  goldReward: number;
  xpReward: number;
}

export function generateChallengeWave(wave: number, playerLevel: number): ChallengeWave {
  const scaling = 1 + (wave - 1) * 0.15;
  const baseHp = Math.floor(playerLevel * 8 * scaling);
  const baseAtk = Math.floor(playerLevel * 1.2 * scaling);
  const baseDef = Math.floor(playerLevel * 0.5 * scaling);
  const monsters = [
    "Shadow Sentinel", "Void Guardian", "Chaos Wraith", "Infernal Titan",
    "Abyssal Colossus", "Eternal Revenant", "Cosmic Horror", "Null Devourer",
    "Reality Ender", "Oblivion Knight", "Primordial Fiend", "Void Leviathan",
  ];
  const name = monsters[(wave - 1) % monsters.length];
  return {
    wave,
    monsterName: name + (wave > 10 ? " Ω" : wave > 5 ? " +" : ""),
    monsterHp: baseHp,
    monsterAtk: baseAtk,
    monsterDef: baseDef,
    goldReward: Math.floor(wave * playerLevel * 5),
    xpReward: Math.floor(wave * playerLevel * 3),
  };
}

router.get("/challenge", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const preview = Array.from({ length: 5 }, (_, i) => generateChallengeWave(i + 1, p.level));
  res.json({
    highScore: p.challengeHighScore,
    runsCompleted: p.challengeRunsCompleted,
    preview,
    playerStats: { attack: p.attack, defense: p.defense, maxHp: p.maxHp, level: p.level },
  });
});

router.post("/challenge/run", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;

  let wave = 0;
  let totalGold = 0;
  let totalXp = 0;
  let playerHp = p.maxHp;
  const waveResults: Array<{ wave: number; monsterName: string; survived: boolean; playerHpLeft: number }> = [];

  while (true) {
    wave++;
    const w = generateChallengeWave(wave, p.level);
    let mHp = w.monsterHp;
    let pHp = playerHp;
    const pDmg = Math.max(1, p.attack - w.monsterDef);
    const mDmg = Math.max(1, w.monsterAtk - p.defense);
    let rounds = 0;
    while (pHp > 0 && mHp > 0 && rounds < 1000) {
      mHp -= pDmg;
      if (mHp <= 0) break;
      pHp -= mDmg;
      rounds++;
    }
    const survived = pHp > 0;
    playerHp = Math.max(0, pHp);
    if (survived) {
      totalGold += w.goldReward;
      totalXp += w.xpReward;
    }
    waveResults.push({ wave, monsterName: w.monsterName, survived, playerHpLeft: Math.max(0, playerHp) });
    if (!survived || wave >= 50) break;
  }

  const wavesCleared = waveResults.filter(r => r.survived).length;
  const isNewRecord = wavesCleared > p.challengeHighScore;

  const bonusGold = isNewRecord ? Math.floor(wavesCleared * p.level * 10) : 0;
  const bonusStones = Math.floor(wavesCleared / 5);
  const finalGold = totalGold + bonusGold;

  await db.update(playersTable).set({
    challengeHighScore: Math.max(p.challengeHighScore, wavesCleared),
    challengeRunsCompleted: p.challengeRunsCompleted + 1,
    gold: p.gold + finalGold,
    xp: p.xp + totalXp,
    enchantingStones: p.enchantingStones + bonusStones,
  }).where(eq(playersTable.id, p.id));

  res.json({
    wavesCleared,
    isNewRecord,
    totalGold: finalGold,
    totalXp,
    bonusStones,
    waveResults: waveResults.slice(0, 20),
    highScore: Math.max(p.challengeHighScore, wavesCleared),
  });
});

export default router;
