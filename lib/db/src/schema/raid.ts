import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const raidsTable = pgTable("raids", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  godName: text("god_name").notNull(),
  godHp: integer("god_hp").notNull(),
  godMaxHp: integer("god_max_hp").notNull(),
  godAttack: integer("god_attack").notNull(),
  godDefense: integer("god_defense").notNull(),
  phase: integer("phase").notNull().default(1),
  isEnraged: boolean("is_enraged").notNull().default(false),
  status: text("status").notNull().default("active"),
  lootGranted: boolean("loot_granted").notNull().default(false),
  lastAttackedAt: timestamp("last_attacked_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRaidSchema = createInsertSchema(raidsTable).omit({ id: true, createdAt: true });
export type InsertRaid = z.infer<typeof insertRaidSchema>;
export type Raid = typeof raidsTable.$inferSelect;
