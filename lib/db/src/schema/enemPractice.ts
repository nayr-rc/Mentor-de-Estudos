import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const enemPracticeTable = pgTable("enem_practice", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  questionIndex: integer("question_index").notNull(),
  discipline: text("discipline").notNull(),
  selectedAlternative: text("selected_alternative").notNull(),
  correctAlternative: text("correct_alternative").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEnemPracticeSchema = createInsertSchema(enemPracticeTable).omit({ id: true, createdAt: true });
export type InsertEnemPractice = z.infer<typeof insertEnemPracticeSchema>;
export type EnemPractice = typeof enemPracticeTable.$inferSelect;
