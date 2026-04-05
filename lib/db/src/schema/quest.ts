import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  questDate: text("quest_date").notNull(),
  questIndex: integer("quest_index").notNull(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  target: integer("target").notNull(),
  baselineValue: integer("baseline_value").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  claimed: boolean("claimed").notNull().default(false),
  rewardType: text("reward_type").notNull(),
  rewardAmount: integer("reward_amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
