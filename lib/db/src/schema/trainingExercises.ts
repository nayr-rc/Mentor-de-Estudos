import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingExercisesTable = pgTable("training_exercises", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  platform: text("platform").notNull(), // leetcode, beecrowd, codeforces
  platformId: text("platform_id"), // external ID
  url: text("url"),
  category: text("category").notNull(), // arrays, strings, sorting, graphs, dp, etc
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  description: text("description"),
  tags: text("tags").array(),
  status: text("status").notNull().default("pending"), // pending, in_progress, solved, skipped
  notes: text("notes"),
  attempts: integer("attempts").notNull().default(0),
  solvedAt: timestamp("solved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainingExerciseSchema = createInsertSchema(trainingExercisesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrainingExercise = z.infer<typeof insertTrainingExerciseSchema>;
export type TrainingExercise = typeof trainingExercisesTable.$inferSelect;
