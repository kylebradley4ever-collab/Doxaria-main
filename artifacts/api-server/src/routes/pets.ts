import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  goldBonus: number;
  xpBonus: number;
  description: string;
  source: string;
}

export const PET_TEMPLATES: Pet[] = [
  { id: "slime_buddy",    name: "Slime Buddy",      emoji: "🟢", rarity: "Common",      atkBonus: 2,   defBonus: 0,   hpBonus: 10,  goldBonus: 0,   xpBonus: 0,  description: "A friendly slime that nips at enemies.", source: "Slime" },
  { id: "goblin_familiar",name: "Goblin Familiar",  emoji: "👺", rarity: "Common",      atkBonus: 3,   defBonus: 0,   hpBonus: 0,   goldBonus: 5,   xpBonus: 0,  description: "Pickpockets gold from your kills.", source: "Goblin" },
  { id: "bone_hound",     name: "Bone Hound",       emoji: "🦴", rarity: "Uncommon",    atkBonus: 5,   defBonus: 3,   hpBonus: 0,   goldBonus: 0,   xpBonus: 0,  description: "Skeletal dog that guards your back.", source: "Skeleton" },
  { id: "shadow_fox",     name: "Shadow Fox",       emoji: "🦊", rarity: "Rare",        atkBonus: 4,   defBonus: 0,   hpBonus: 0,   goldBonus: 0,   xpBonus: 10, description: "Steals knowledge from defeated foes.", source: "Shadow Rogue" },
  { id: "void_sprite",    name: "Void Sprite",      emoji: "✨", rarity: "Epic",        atkBonus: 10,  defBonus: 5,   hpBonus: 50,  goldBonus: 0,   xpBonus: 0,  description: "A fragment of void energy given form.", source: "Void Walker" },
  { id: "lava_lizard",    name: "Lava Lizard",      emoji: "🦎", rarity: "Rare",        atkBonus: 8,   defBonus: 0,   hpBonus: 0,   goldBonus: 10,  xpBonus: 0,  description: "Burns enemies for bonus gold.", source: "Inferno Wyrm" },
  { id: "crystal_golem",  name: "Crystal Golem",    emoji: "💎", rarity: "Epic",        atkBonus: 0,   defBonus: 15,  hpBonus: 100, goldBonus: 0,   xpBonus: 0,  description: "An impervious crystalline guardian.", source: "Stone Golem" },
  { id: "storm_hawk",     name: "Storm Hawk",       emoji: "🦅", rarity: "Legendary",   atkBonus: 15,  defBonus: 0,   hpBonus: 0,   goldBonus: 0,   xpBonus: 20, description: "Swoops in to land critical strikes.", source: "Fallen Angel" },
  { id: "chaos_kitten",   name: "Chaos Kitten",     emoji: "🐱", rarity: "Legendary",   atkBonus: 12,  defBonus: 8,   hpBonus: 75,  goldBonus: 15,  xpBonus: 10, description: "Pure chaos in adorable form.", source: "Chaos Beast" },
  { id: "elder_dragon",   name: "Elder Dragon",     emoji: "🐉", rarity: "Mythic",      atkBonus: 25,  defBonus: 15,  hpBonus: 150, goldBonus: 25,  xpBonus: 25, description: "An ancient dragon bound to your will.", source: "Dragon" },
  { id: "void_serpent",   name: "Void Serpent",     emoji: "🐍", rarity: "Mythic",      atkBonus: 30,  defBonus: 0,   hpBonus: 0,   goldBonus: 0,   xpBonus: 50, description: "Devours XP from the void itself.", source: "Nihil Serpent" },
  { id: "star_phoenix",   name: "Star Phoenix",     emoji: "🔥", rarity: "Divine",      atkBonus: 20,  defBonus: 20,  hpBonus: 200, goldBonus: 30,  xpBonus: 30, description: "Reborn from starfire, grants divine power.", source: "Starfire Drake" },
  { id: "cosmic_wisp",    name: "Cosmic Wisp",      emoji: "🌟", rarity: "Cosmic",      atkBonus: 40,  defBonus: 20,  hpBonus: 0,   goldBonus: 50,  xpBonus: 50, description: "A sentient piece of the cosmos.", source: "Cosmic Horror" },
  { id: "null_shade",     name: "Null Shade",       emoji: "🌑", rarity: "Abyssal",     atkBonus: 50,  defBonus: 0,   hpBonus: 0,   goldBonus: 0,   xpBonus: 75, description: "Absolute nothingness made manifest.", source: "Null Entity" },
  { id: "eternal_flame",  name: "Eternal Flame",    emoji: "💫", rarity: "Eternal",     atkBonus: 50,  defBonus: 30,  hpBonus: 300, goldBonus: 50,  xpBonus: 50, description: "Burns forever. So does your power.", source: "Eternal Sanctum" },
];

const PET_RARITY_WEIGHTS: Record<string, number> = {
  Common: 35, Uncommon: 25, Rare: 18, Epic: 10, Legendary: 6, Mythic: 3, Divine: 2, Cosmic: 0.7, Abyssal: 0.2, Eternal: 0.1,
};

export function getPetDropChance(monsterName: string, luckBonus: number): Pet | null {
  const baseChance = 0.015 + luckBonus * 0.001;
  if (Math.random() > baseChance) return null;
  const validPets = PET_TEMPLATES.filter(p => p.source === monsterName);
  if (validPets.length === 0) {
    const roll = Math.random() * 100;
    let cum = 0;
    for (const [rarity, weight] of Object.entries(PET_RARITY_WEIGHTS)) {
      cum += weight;
      if (roll <= cum) {
        const byRarity = PET_TEMPLATES.filter(p => p.rarity === rarity);
        if (byRarity.length) return byRarity[Math.floor(Math.random() * byRarity.length)];
      }
    }
    return PET_TEMPLATES[0];
  }
  return validPets[Math.floor(Math.random() * validPets.length)];
}

export function parsePets(data: string | null | undefined): Pet[] {
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

export function getActivePetBonuses(petsData: string | null | undefined, activePetIndex: number) {
  const pets = parsePets(petsData);
  if (activePetIndex < 0 || activePetIndex >= pets.length) {
    return { atkBonus: 0, defBonus: 0, hpBonus: 0, goldBonus: 0, xpBonus: 0 };
  }
  return pets[activePetIndex];
}

router.get("/pets", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const pets = parsePets(p.petsData);
  const active = p.activePetIndex >= 0 && p.activePetIndex < pets.length ? pets[p.activePetIndex] : null;
  res.json({ pets, activePetIndex: p.activePetIndex, activePet: active, total: PET_TEMPLATES.length });
});

router.post("/pets/equip", async (req, res) => {
  const { index } = req.body as { index: number };
  const p = await getPlayer(req, res);
  if (!p) return;
  const pets = parsePets(p.petsData);
  if (index < -1 || index >= pets.length) { res.status(400).json({ error: "Invalid pet index" }); return; }
  await db.update(playersTable).set({ activePetIndex: index }).where(eq(playersTable.id, p.id));
  res.json({ success: true, activePetIndex: index });
});

router.post("/pets/release", async (req, res) => {
  const { index } = req.body as { index: number };
  const p = await getPlayer(req, res);
  if (!p) return;
  const pets = parsePets(p.petsData);
  if (index < 0 || index >= pets.length) { res.status(400).json({ error: "Invalid index" }); return; }
  pets.splice(index, 1);
  let newActive = p.activePetIndex;
  if (p.activePetIndex === index) newActive = -1;
  else if (p.activePetIndex > index) newActive = p.activePetIndex - 1;
  const reward = 500;
  await db.update(playersTable).set({
    petsData: JSON.stringify(pets),
    activePetIndex: newActive,
    gold: p.gold + reward,
  }).where(eq(playersTable.id, p.id));
  res.json({ success: true, goldEarned: reward, remainingPets: pets.length });
});

export default router;
