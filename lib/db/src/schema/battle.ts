import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const battlesTable = pgTable("battles", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  monsterName: text("monster_name").notNull(),
  monsterEmoji: text("monster_emoji").notNull(),
  monsterMaxHp: integer("monster_max_hp").notNull(),
  monsterHp: integer("monster_hp").notNull(),
  monsterAttack: integer("monster_attack").notNull(),
  monsterDefense: integer("monster_defense").notNull(),
  monsterLevel: integer("monster_level").notNull(),
  monsterIsBoss: boolean("monster_is_boss").notNull().default(false),
  status: text("status").notNull().default("active"),
  lastAttackedAt: timestamp("last_attacked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBattleSchema = createInsertSchema(battlesTable).omit({ id: true, createdAt: true });
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battlesTable.$inferSelect;
