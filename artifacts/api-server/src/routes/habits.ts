import { Router } from "express";
import { db } from "@workspace/db";
import { habitsTable } from "@workspace/db";
import { CreateOrUpdateHabitBody, ListHabitsQueryParams } from "@workspace/api-zod";
import { desc, gte, eq } from "drizzle-orm";

const router = Router();

router.get("/habits", async (req, res) => {
  const parsed = ListHabitsQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const habits = await db
    .select()
    .from(habitsTable)
    .where(gte(habitsTable.createdAt, since))
    .orderBy(desc(habitsTable.createdAt));

  res.json(
    habits.map((h) => ({
      id: h.id,
      date: h.date,
      sleepHours: h.sleepHours,
      exerciseDone: h.exerciseDone,
      meditationDone: h.meditationDone,
      waterLiters: h.waterLiters,
      mood: h.mood,
      createdAt: h.createdAt.toISOString(),
    }))
  );
});

router.post("/habits", async (req, res) => {
  const parsed = CreateOrUpdateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const date = parsed.data.date;

  // Check if entry for this date exists
  const existing = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.date, date))
    .limit(1);

  let habit;
  if (existing.length > 0) {
    [habit] = await db
      .update(habitsTable)
      .set({
        sleepHours: parsed.data.sleepHours ?? null,
        exerciseDone: parsed.data.exerciseDone ?? false,
        meditationDone: parsed.data.meditationDone ?? false,
        waterLiters: parsed.data.waterLiters ?? null,
        mood: parsed.data.mood ?? null,
      })
      .where(eq(habitsTable.date, date))
      .returning();
  } else {
    [habit] = await db
      .insert(habitsTable)
      .values({
        date,
        sleepHours: parsed.data.sleepHours ?? null,
        exerciseDone: parsed.data.exerciseDone ?? false,
        meditationDone: parsed.data.meditationDone ?? false,
        waterLiters: parsed.data.waterLiters ?? null,
        mood: parsed.data.mood ?? null,
      })
      .returning();
  }

  res.json({
    id: habit.id,
    date: habit.date,
    sleepHours: habit.sleepHours,
    exerciseDone: habit.exerciseDone,
    meditationDone: habit.meditationDone,
    waterLiters: habit.waterLiters,
    mood: habit.mood,
    createdAt: habit.createdAt.toISOString(),
  });
});

export default router;
