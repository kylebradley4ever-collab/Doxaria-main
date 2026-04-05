import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const fishingCatchesTable = pgTable("fishing_catches", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  fishName: text("fish_name").notNull(),
  rarity: text("rarity").notNull(),
  weightGrams: integer("weight_grams").notNull(),
  goldValue: integer("gold_value").notNull(),
  sold: boolean("sold").notNull().default(false),
  caughtAt: timestamp("caught_at").notNull().defaultNow(),
});
