import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(),
  emoji: text("emoji").notNull(),
  goldValue: integer("gold_value").notNull().default(0),
  type: text("type").notNull().default("weapon"),
  statBonus: integer("stat_bonus").notNull().default(0),
  equipped: boolean("equipped").notNull().default(false),
  enchantLevel: integer("enchant_level").notNull().default(0),
  obtainedAt: timestamp("obtained_at").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, obtainedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryItem = typeof inventoryTable.$inferSelect;
