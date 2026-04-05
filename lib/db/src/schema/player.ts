import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  hp: integer("hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  attack: integer("attack").notNull().default(10),
  defense: integer("defense").notNull().default(5),
  gold: integer("gold").notNull().default(0),
  monstersDefeated: integer("monsters_defeated").notNull().default(0),
  enchantingStones: integer("enchanting_stones").notNull().default(0),
  meleeSkillLevel: integer("melee_skill_level").notNull().default(1),
  meleeSkillXp: integer("melee_skill_xp").notNull().default(0),
  defenseSkillLevel: integer("defense_skill_level").notNull().default(1),
  defenseSkillXp: integer("defense_skill_xp").notNull().default(0),
  ascensionLevel: integer("ascension_level").notNull().default(0),
  totalDamageDealt: integer("total_damage_dealt").notNull().default(0),
  totalDamageTaken: integer("total_damage_taken").notNull().default(0),
  gearLooted: integer("gear_looted").notNull().default(0),
  bossesDefeated: integer("bosses_defeated").notNull().default(0),
  goldEarned: integer("gold_earned").notNull().default(0),
  itemsSold: integer("items_sold").notNull().default(0),
  vitUpgradeLevel: integer("vit_upgrade_level").notNull().default(0),
  regenUpgradeLevel: integer("regen_upgrade_level").notNull().default(0),
  xpUpgradeLevel: integer("xp_upgrade_level").notNull().default(0),
  goldUpgradeLevel: integer("gold_upgrade_level").notNull().default(0),
  luckUpgradeLevel: integer("luck_upgrade_level").notNull().default(0),
  totalFishCaught: integer("total_fish_caught").notNull().default(0),
  lastFishCastAt: timestamp("last_fish_cast_at"),
  prestigeLevel: integer("prestige_level").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  talentPoints: integer("talent_points").notNull().default(0),
  talentAtk: integer("talent_atk").notNull().default(0),
  talentDef: integer("talent_def").notNull().default(0),
  talentHp: integer("talent_hp").notNull().default(0),
  talentCrit: integer("talent_crit").notNull().default(0),
  talentSpeed: integer("talent_speed").notNull().default(0),
  talentLuck: integer("talent_luck").notNull().default(0),

  agilitySkillLevel: integer("agility_skill_level").notNull().default(1),
  agilitySkillXp: integer("agility_skill_xp").notNull().default(0),
  sorcerySkillLevel: integer("sorcery_skill_level").notNull().default(1),
  sorcerySkillXp: integer("sorcery_skill_xp").notNull().default(0),

  arenaPoints: integer("arena_points").notNull().default(0),
  arenaWins: integer("arena_wins").notNull().default(0),
  arenaLosses: integer("arena_losses").notNull().default(0),
  arenaTier: integer("arena_tier").notNull().default(0),

  loginStreak: integer("login_streak").notNull().default(0),
  lastLoginDate: text("last_login_date"),

  petsData: text("pets_data"),
  activePetIndex: integer("active_pet_index").notNull().default(-1),

  monsterCodex: text("monster_codex"),

  alchemyIngredients: text("alchemy_ingredients"),
  activePotionData: text("active_potion_data"),

  challengeHighScore: integer("challenge_high_score").notNull().default(0),
  challengeRunsCompleted: integer("challenge_runs_completed").notNull().default(0),

  token: text("token").unique(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
