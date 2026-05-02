import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mentorInsightsTable = pgTable("mentor_insights", {
  id: serial("id").primaryKey(),
  contextHash: text("context_hash"),
  insight: text("insight").notNull(),
  type: text("type").notNull().default("daily"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorInsightSchema = createInsertSchema(mentorInsightsTable).omit({ id: true, createdAt: true });
export type InsertMentorInsight = z.infer<typeof insertMentorInsightSchema>;
export type MentorInsight = typeof mentorInsightsTable.$inferSelect;
