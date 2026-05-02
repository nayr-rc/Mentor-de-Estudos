import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userConfigTable = pgTable("user_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Estudante"),
  prioritySubjects: text("priority_subjects").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserConfigSchema = createInsertSchema(userConfigTable).omit({ id: true, createdAt: true });
export type InsertUserConfig = z.infer<typeof insertUserConfigSchema>;
export type UserConfig = typeof userConfigTable.$inferSelect;
