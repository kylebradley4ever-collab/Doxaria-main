import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, fishingCatchesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

const CAST_COOLDOWN_MS = 3000;

export type FishRarity =
  | "Common" | "Uncommon" | "Rare" | "Magical" | "Epic"
  | "Legendary" | "Ancient" | "Mythic" | "Divine" | "Cosmic"
  | "Eternal" | "Transcendent" | "Celestial" | "Primordial" | "Void";

const FISH_RARITY_ORDER: FishRarity[] = [
  "Common", "Uncommon", "Rare", "Magical", "Epic",
  "Legendary", "Ancient", "Mythic", "Divine", "Cosmic",
  "Eternal", "Transcendent", "Celestial", "Primordial", "Void",
];

const FISH_GOLD: Record<FishRarity, number> = {
  Common:       5,     Uncommon:     15,    Rare:         40,
  Magical:      100,   Epic:         250,   Legendary:    600,
  Ancient:      1400,  Mythic:       3000,  Divine:       7500,
  Cosmic:       18000, Eternal:      45000, Transcendent: 110000,
  Celestial:    270000,Primordial:   650000,Void:         2000000,
};

const FISH_WEIGHT: Record<FishRarity, [number, number]> = {
  Common:       [50,    500],    Uncommon:     [200,   1500],
  Rare:         [500,   4000],   Magical:      [1000,  8000],
  Epic:         [2000,  15000],  Legendary:    [5000,  30000],
  Ancient:      [10000, 60000],  Mythic:       [20000, 100000],
  Divine:       [40000, 200000], Cosmic:       [80000, 400000],
  Eternal:      [150000,800000], Transcendent: [300000,1500000],
  Celestial:    [500000,3000000],Primordial:   [1000000,6000000],
  Void:         [5000000,20000000],
};

const FISH_NAMES: Record<FishRarity, string[]> = {
  Common:       ["Minnow","Perch","Carp","Sardine","Herring","Roach","Dace","Bleak","Gudgeon","Sprat"],
  Uncommon:     ["Bass","Pike","Catfish","Bream","Tench","Rudd","Chub","Barbel","Grayling","Whitefish"],
  Rare:         ["Salmon","Walleye","Snapper","Grouper","Mackerel","Zander","Asp","Ide","Vimba","Orfe"],
  Magical:      ["Golden Carp","Silver Trout","Moonfish","Crystal Perch","Starfin Bass","Shimmer Eel","Glowfish","Prism Carp"],
  Epic:         ["Dragon Goby","Shadow Eel","Phantom Barracuda","Abyssal Tuna","Thunder Salmon","Storm Pike","Venom Carp","Wraith Bass"],
  Legendary:    ["Void Marlin","Ancient Coelacanth","Tempest Shark","Leviathan Eel","Titan Catfish","Behemoth Bass"],
  Ancient:      ["Soul Salmon","Time Catfish","Dimensional Trout","Chrono Carp","Echo Perch","Memory Eel","Dream Marlin"],
  Mythic:       ["Aethereal Bass","Celestial Pike","Astral Grouper","Rift Shark","Void Leviathan","Chaos Coelacanth"],
  Divine:       ["God Carp","Sacred Sturgeon","Divine Leviathan","Holy Eel","Blessed Marlin","Radiant Salmon"],
  Cosmic:       ["Cosmic Manta","Galaxy Whale","Nebula Shark","Star Serpent","Pulsar Eel","Quasar Carp"],
  Eternal:      ["Eternal Serpent","Infinity Fish","Ouroboros Eel","Timeless Leviathan","Boundless Carp"],
  Transcendent: ["Transcendent Leviathan","Beyond Bass","Infinite Pike","Absolute Eel","Limitless Marlin"],
  Celestial:    ["The First Fish","Celestial Leviathan","Origin Carp","Genesis Eel","Primeval Shark"],
  Primordial:   ["Chaos Carp","Void Dragon","Creation Eel","Unborn Leviathan","The Dreaming Fish"],
  Void:         ["The Unnamed One","Abyss Incarnate","Null Leviathan","The Formless","That Which Swims"],
};

function fishingLevel(totalCaught: number): number {
  return 1 + Math.floor(totalCaught / 10);
}

function rollFish(fishLv: number): { name: string; rarity: FishRarity; weightGrams: number; goldValue: number } {
  const luckShift = Math.min(40, fishLv * 0.25);
  const roll = Math.random() * 100;
  const adjusted = Math.max(0, roll - luckShift);

  let rarity: FishRarity;
  if      (adjusted < 0.001)  rarity = "Void";
  else if (adjusted < 0.01)   rarity = "Primordial";
  else if (adjusted < 0.05)   rarity = "Celestial";
  else if (adjusted < 0.15)   rarity = "Transcendent";
  else if (adjusted < 0.4)    rarity = "Eternal";
  else if (adjusted < 1.0)    rarity = "Cosmic";
  else if (adjusted < 2.5)    rarity = "Divine";
  else if (adjusted < 5)      rarity = "Mythic";
  else if (adjusted < 9)      rarity = "Ancient";
  else if (adjusted < 15)     rarity = "Legendary";
  else if (adjusted < 24)     rarity = "Epic";
  else if (adjusted < 36)     rarity = "Magical";
  else if (adjusted < 52)     rarity = "Rare";
  else if (adjusted < 72)     rarity = "Uncommon";
  else                         rarity = "Common";

  const names = FISH_NAMES[rarity];
  const name = names[Math.floor(Math.random() * names.length)];
  const [minW, maxW] = FISH_WEIGHT[rarity];
  const weightGrams = minW + Math.floor(Math.random() * (maxW - minW));
  const baseGold = FISH_GOLD[rarity];
  const goldValue = Math.floor(baseGold * (0.8 + Math.random() * 0.4));
  return { name, rarity, weightGrams, goldValue };
}

function formatWeight(grams: number): string {
  if (grams >= 1_000_000) return `${(grams / 1_000_000).toFixed(2)} t`;
  if (grams >= 1_000)     return `${(grams / 1_000).toFixed(2)} kg`;
  return `${grams} g`;
}

router.get("/fishing/state", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;

  const recent = await db
    .select()
    .from(fishingCatchesTable)
    .where(eq(fishingCatchesTable.playerId, p.id))
    .orderBy(desc(fishingCatchesTable.caughtAt))
    .limit(40);

  const rarityCounts: Record<string, number> = {};
  for (const r of FISH_RARITY_ORDER) rarityCounts[r] = 0;
  for (const row of recent) {
    if (rarityCounts[row.rarity] !== undefined) rarityCounts[row.rarity]++;
  }

  const unsold = recent.filter(f => !f.sold);
  const unsoldGold = unsold.reduce((s, f) => s + f.goldValue, 0);

  const level = fishingLevel(p.totalFishCaught ?? 0);
  const nextLevelAt = level * 10;
  const catchesToNext = nextLevelAt - (p.totalFishCaught ?? 0);

  let cooldownMs = 0;
  if (p.lastFishCastAt) {
    const elapsed = Date.now() - new Date(p.lastFishCastAt).getTime();
    cooldownMs = Math.max(0, CAST_COOLDOWN_MS - elapsed);
  }

  res.json({
    level,
    totalCaught: p.totalFishCaught ?? 0,
    catchesToNext,
    currentGold: p.gold,
    unsoldCount: unsold.length,
    unsoldGold,
    cooldownMs,
    recent: recent.slice(0, 20).map(f => ({
      id: f.id,
      name: f.fishName,
      rarity: f.rarity,
      weightGrams: f.weightGrams,
      weightLabel: formatWeight(f.weightGrams),
      goldValue: f.goldValue,
      sold: f.sold,
      caughtAt: f.caughtAt,
    })),
    rarityCounts,
  });
});

router.post("/fishing/cast", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;

  if (p.lastFishCastAt) {
    const elapsed = Date.now() - new Date(p.lastFishCastAt).getTime();
    if (elapsed < CAST_COOLDOWN_MS) {
      res.status(429).json({ error: "Too soon — wait before casting again.", remainingMs: CAST_COOLDOWN_MS - elapsed });
      return;
    }
  }

  const level = fishingLevel(p.totalFishCaught ?? 0);
  const fish = rollFish(level);
  const newTotal = (p.totalFishCaught ?? 0) + 1;

  const [inserted] = await db.insert(fishingCatchesTable).values({
    playerId: p.id,
    fishName: fish.name,
    rarity: fish.rarity,
    weightGrams: fish.weightGrams,
    goldValue: fish.goldValue,
    sold: false,
  }).returning();

  await db.update(playersTable).set({
    totalFishCaught: newTotal,
    lastFishCastAt: new Date(),
  }).where(eq(playersTable.id, p.id));

  res.json({
    fish: {
      id: inserted.id,
      name: fish.name,
      rarity: fish.rarity,
      weightGrams: fish.weightGrams,
      weightLabel: formatWeight(fish.weightGrams),
      goldValue: fish.goldValue,
    },
    fishingLevel: fishingLevel(newTotal),
    totalCaught: newTotal,
  });
});

router.post("/fishing/sell-all", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;

  const unsold = await db
    .select()
    .from(fishingCatchesTable)
    .where(and(eq(fishingCatchesTable.playerId, p.id), eq(fishingCatchesTable.sold, false)));

  if (unsold.length === 0) {
    res.json({ goldGained: 0, fishSold: 0, newGold: p.gold });
    return;
  }

  const totalGold = unsold.reduce((s, f) => s + f.goldValue, 0);

  await db.update(fishingCatchesTable)
    .set({ sold: true })
    .where(and(eq(fishingCatchesTable.playerId, p.id), eq(fishingCatchesTable.sold, false)));

  await db.update(playersTable)
    .set({ gold: p.gold + totalGold })
    .where(eq(playersTable.id, p.id));

  res.json({ goldGained: totalGold, fishSold: unsold.length, newGold: p.gold + totalGold });
});

export default router;
