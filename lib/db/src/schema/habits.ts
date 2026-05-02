import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  sleepHours: real("sleep_hours"),
  exerciseDone: boolean("exercise_done").default(false).notNull(),
  meditationDone: boolean("meditation_done").default(false).notNull(),
  waterLiters: real("water_liters"),
  mood: integer("mood"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHabitSchema = createInsertSchema(habitsTable).omit({ id: true, createdAt: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habitsTable.$inferSelect;
