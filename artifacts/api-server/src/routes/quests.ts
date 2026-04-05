import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, questsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

type QuestType = "kill_monsters" | "defeat_bosses" | "catch_fish" | "earn_gold" | "sell_items";

interface QuestDef {
  type: QuestType;
  label: string;
  targets: number[];
  rewardTypes: string[];
  rewardAmounts: number[];
}

const QUEST_DEFS: QuestDef[] = [
  { type: "kill_monsters", label: "Monster Slayer", targets: [150, 500, 1500], rewardTypes: ["stones","stones","stones"], rewardAmounts: [5, 12, 30] },
  { type: "defeat_bosses", label: "Boss Hunter",    targets: [5, 20, 50],      rewardTypes: ["stones","stones","stones"], rewardAmounts: [6, 16, 38] },
  { type: "catch_fish",    label: "Fisher",         targets: [20, 75, 200],    rewardTypes: ["gold","gold","gold"],       rewardAmounts: [10000, 40000, 120000] },
  { type: "earn_gold",     label: "Gold Seeker",    targets: [10000, 50000, 200000], rewardTypes: ["stones","stones","stones"], rewardAmounts: [5, 13, 28] },
  { type: "sell_items",    label: "Merchant",       targets: [15, 50, 150],    rewardTypes: ["gold","gold","stones"],     rewardAmounts: [8000, 35000, 25] },
];

function getTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateQuestsForDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const seed = y * 10000 + m * 100 + d;
  const NUM_TYPES = QUEST_DEFS.length;
  return [
    { ...QUEST_DEFS[seed % NUM_TYPES], tier: 0 },
    { ...QUEST_DEFS[(seed + 2) % NUM_TYPES], tier: 1 },
    { ...QUEST_DEFS[(seed + 4) % NUM_TYPES], tier: 2 },
  ].map((q, idx) => ({
    questIndex: idx,
    type: q.type,
    label: q.label,
    target: q.targets[q.tier],
    rewardType: q.rewardTypes[q.tier],
    rewardAmount: q.rewardAmounts[q.tier],
  }));
}

function getPlayerStat(player: any, type: QuestType): number {
  switch (type) {
    case "kill_monsters": return player.monstersDefeated ?? 0;
    case "defeat_bosses": return player.bossesDefeated ?? 0;
    case "catch_fish":    return player.totalFishCaught ?? 0;
    case "earn_gold":     return player.goldEarned ?? 0;
    case "sell_items":    return player.itemsSold ?? 0;
  }
}

router.get("/quests", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const today = getTodayUtc();
    const existing = await db.select().from(questsTable)
      .where(and(eq(questsTable.playerId, player.id), eq(questsTable.questDate, today)));

    let quests = existing;

    if (quests.length < 3) {
      await db.delete(questsTable)
        .where(and(eq(questsTable.playerId, player.id), eq(questsTable.questDate, today)));

      const defs = generateQuestsForDate(today);
      const inserted = await db.insert(questsTable).values(
        defs.map(def => ({
          playerId: player.id,
          questDate: today,
          questIndex: def.questIndex,
          type: def.type,
          label: def.label,
          target: def.target,
          baselineValue: getPlayerStat(player, def.type as QuestType),
          rewardType: def.rewardType,
          rewardAmount: def.rewardAmount,
          completed: false,
          claimed: false,
        }))
      ).returning();
      quests = inserted;
    }

    const result = quests
      .sort((a, b) => a.questIndex - b.questIndex)
      .map(q => {
        const currentStat = getPlayerStat(player, q.type as QuestType);
        const progress = Math.max(0, currentStat - q.baselineValue);
        const pctDone = Math.min(1, progress / q.target);
        const freshCompleted = !q.completed && pctDone >= 1;
        return { ...q, progress, pctDone, freshCompleted };
      });

    await Promise.all(
      result
        .filter(q => q.freshCompleted)
        .map(q => db.update(questsTable).set({ completed: true }).where(eq(questsTable.id, q.id)))
    );

    const nextReset = new Date();
    nextReset.setUTCHours(24, 0, 0, 0);

    res.json({ quests: result.map(q => ({ ...q, freshCompleted: undefined })), nextResetAt: nextReset.toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/quests/:id/claim", async (req, res) => {
  try {
    const questId = parseInt(req.params.id, 10);
    if (!Number.isFinite(questId)) { res.status(400).json({ error: "Invalid quest id" }); return; }

    const player = await getPlayer(req, res);
    if (!player) return;

    const [quest] = await db.select().from(questsTable)
      .where(and(eq(questsTable.id, questId), eq(questsTable.playerId, player.id)));
    if (!quest) { res.status(404).json({ error: "Quest not found" }); return; }
    if (quest.claimed) { res.status(400).json({ error: "Already claimed" }); return; }

    const currentStat = getPlayerStat(player, quest.type as QuestType);
    const progress = Math.max(0, currentStat - quest.baselineValue);
    if (progress < quest.target) {
      res.status(400).json({ error: "Quest not yet complete" }); return;
    }

    await db.update(questsTable).set({ completed: true, claimed: true }).where(eq(questsTable.id, questId));

    if (quest.rewardType === "stones") {
      await db.update(playersTable)
        .set({ enchantingStones: player.enchantingStones + quest.rewardAmount })
        .where(eq(playersTable.id, player.id));
    } else {
      await db.update(playersTable)
        .set({ gold: player.gold + quest.rewardAmount, goldEarned: player.goldEarned + quest.rewardAmount })
        .where(eq(playersTable.id, player.id));
    }

    const [updated] = await db.select().from(playersTable).where(eq(playersTable.id, player.id));
    res.json({ ok: true, rewardType: quest.rewardType, rewardAmount: quest.rewardAmount, player: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
