import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface PotionRecipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number;
  effect: PotionEffect;
  ingredients: Record<string, number>;
  color: string;
}

export interface PotionEffect {
  atkBonus?: number;
  defBonus?: number;
  hpBonus?: number;
  xpBonus?: number;
  goldBonus?: number;
  critBonus?: number;
}

export interface ActivePotion {
  recipeId: string;
  name: string;
  emoji: string;
  effect: PotionEffect;
  expiresAt: number;
}

export const INGREDIENTS: Ingredient[] = [
  { id: "monster_essence",   name: "Monster Essence",   emoji: "💧", description: "Raw life energy from slain creatures." },
  { id: "shadow_dust",       name: "Shadow Dust",       emoji: "🌑", description: "Dark matter scraped from shadow-type monsters." },
  { id: "bone_powder",       name: "Bone Powder",       emoji: "🦴", description: "Ground bones of undead enemies." },
  { id: "void_crystal",      name: "Void Crystal",      emoji: "💎", description: "Crystallized void energy." },
  { id: "fire_essence",      name: "Fire Essence",      emoji: "🔥", description: "The burning core of fire creatures." },
  { id: "golden_herb",       name: "Golden Herb",       emoji: "🌿", description: "Rare herbs that grow in monster lairs." },
  { id: "cosmic_dust",       name: "Cosmic Dust",       emoji: "✨", description: "Stardust shed by celestial monsters." },
  { id: "blood_vial",        name: "Blood Vial",        emoji: "🩸", description: "Extracted from vampire-type monsters." },
];

export const RECIPES: PotionRecipe[] = [
  { id: "war_brew",       name: "War Brew",           emoji: "⚔️", description: "+25% ATK for 5 minutes",                  duration: 300, effect: { atkBonus: 25 },              ingredients: { monster_essence: 3, fire_essence: 2 },              color: "red"    },
  { id: "iron_skin",      name: "Iron Skin Potion",   emoji: "🛡️", description: "+30% DEF for 5 minutes",                  duration: 300, effect: { defBonus: 30 },              ingredients: { bone_powder: 3, monster_essence: 2 },               color: "blue"   },
  { id: "life_surge",     name: "Life Surge Elixir",  emoji: "❤️", description: "+200 Max HP for 10 minutes",              duration: 600, effect: { hpBonus: 200 },              ingredients: { golden_herb: 4, blood_vial: 2 },                    color: "green"  },
  { id: "wisdom_draft",   name: "Wisdom Draft",       emoji: "📚", description: "+50% XP for 10 minutes",                  duration: 600, effect: { xpBonus: 50 },               ingredients: { shadow_dust: 3, golden_herb: 3 },                   color: "cyan"   },
  { id: "greed_tonic",    name: "Greed Tonic",        emoji: "💰", description: "+75% Gold for 5 minutes",                 duration: 300, effect: { goldBonus: 75 },             ingredients: { golden_herb: 5, monster_essence: 2 },               color: "yellow" },
  { id: "void_elixir",    name: "Void Elixir",        emoji: "🌌", description: "+20% ATK, +20% DEF, +100 HP for 3 minutes",duration: 180,effect: { atkBonus: 20, defBonus: 20, hpBonus: 100 }, ingredients: { void_crystal: 4, cosmic_dust: 3, monster_essence: 2 }, color: "purple" },
  { id: "berserker_rage", name: "Berserker Rage",     emoji: "😤", description: "+60% ATK, -20 DEF for 2 minutes",         duration: 120, effect: { atkBonus: 60, defBonus: -20 },ingredients: { fire_essence: 5, blood_vial: 3 },                   color: "orange" },
  { id: "cosmic_brew",    name: "Cosmic Brew",        emoji: "🌟", description: "+100% XP, +50% Gold for 3 minutes",       duration: 180, effect: { xpBonus: 100, goldBonus: 50 },ingredients: { cosmic_dust: 5, void_crystal: 3, golden_herb: 2 },  color: "violet" },
];

export function parseIngredients(data: string | null | undefined): Record<string, number> {
  if (!data) return {};
  try { return JSON.parse(data); } catch { return {}; }
}

export function parseActivePotion(data: string | null | undefined): ActivePotion | null {
  if (!data) return null;
  try {
    const p = JSON.parse(data);
    if (p && p.expiresAt && Date.now() < p.expiresAt) return p;
    return null;
  } catch { return null; }
}

export function getIngredientDropChance(monsterName: string): string | null {
  const nameL = monsterName.toLowerCase();
  let ingredient: string | null = null;
  if (nameL.includes("shadow") || nameL.includes("dark") || nameL.includes("shade")) ingredient = "shadow_dust";
  else if (nameL.includes("skeleton") || nameL.includes("bone") || nameL.includes("undead") || nameL.includes("ghoul")) ingredient = "bone_powder";
  else if (nameL.includes("void") || nameL.includes("null") || nameL.includes("abyss")) ingredient = "void_crystal";
  else if (nameL.includes("dragon") || nameL.includes("inferno") || nameL.includes("fire") || nameL.includes("magma")) ingredient = "fire_essence";
  else if (nameL.includes("celestial") || nameL.includes("cosmic") || nameL.includes("star") || nameL.includes("astral")) ingredient = "cosmic_dust";
  else if (nameL.includes("vampire") || nameL.includes("blood")) ingredient = "blood_vial";
  else {
    const r = Math.random();
    if (r < 0.4) ingredient = "monster_essence";
    else if (r < 0.7) ingredient = "golden_herb";
  }
  if (!ingredient) return null;
  if (Math.random() > 0.25) return null;
  return ingredient;
}

router.get("/alchemy", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const ingredients = parseIngredients(p.alchemyIngredients);
  const activePotion = parseActivePotion(p.activePotionData);
  res.json({ ingredients, recipes: RECIPES, ingredientDefs: INGREDIENTS, activePotion });
});

router.post("/alchemy/brew", async (req, res) => {
  const { recipeId } = req.body as { recipeId: string };
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) { res.status(400).json({ error: "Unknown recipe" }); return; }
  const p = await getPlayer(req, res);
  if (!p) return;
  const ingredients = parseIngredients(p.alchemyIngredients);
  for (const [ing, needed] of Object.entries(recipe.ingredients)) {
    if ((ingredients[ing] || 0) < needed) {
      res.status(400).json({ error: `Need ${needed}x ${ing.replace(/_/g, " ")}` }); return;
    }
  }
  for (const [ing, needed] of Object.entries(recipe.ingredients)) {
    ingredients[ing] = (ingredients[ing] || 0) - needed;
  }
  const activePotion: ActivePotion = {
    recipeId: recipe.id,
    name: recipe.name,
    emoji: recipe.emoji,
    effect: recipe.effect,
    expiresAt: Date.now() + recipe.duration * 1000,
  };
  await db.update(playersTable).set({
    alchemyIngredients: JSON.stringify(ingredients),
    activePotionData: JSON.stringify(activePotion),
  }).where(eq(playersTable.id, p.id));
  res.json({ success: true, potion: activePotion, remainingIngredients: ingredients });
});

export default router;
