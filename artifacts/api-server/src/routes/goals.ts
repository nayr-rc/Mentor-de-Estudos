import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable, sessionsTable } from "@workspace/db";
import { CreateGoalBody } from "@workspace/api-zod";
import { eq, gte, and } from "drizzle-orm";

const router = Router();

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

router.get("/goals", async (req, res) => {
  const weekStart = getCurrentWeekStart();
  const goals = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.weekStart, weekStart));

  // Calculate actual minutes for each goal's subject this week
  const weekStartDate = new Date(weekStart);
  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(gte(sessionsTable.createdAt, weekStartDate));

  const minutesBySubject = new Map<string, number>();
  for (const s of allSessions) {
    minutesBySubject.set(s.subject, (minutesBySubject.get(s.subject) ?? 0) + s.durationMinutes);
  }

  res.json(
    goals.map((g) => {
      const actualMinutes = g.subject ? (minutesBySubject.get(g.subject) ?? 0) : 0;
      return {
        id: g.id,
        subject: g.subject,
        targetMinutes: g.targetMinutes,
        weekStart: g.weekStart,
        achieved: actualMinutes >= g.targetMinutes,
        actualMinutes,
      };
    })
  );
});

router.post("/goals", async (req, res) => {
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [goal] = await db
    .insert(goalsTable)
    .values({
      subject: parsed.data.subject ?? null,
      targetMinutes: parsed.data.targetMinutes,
      weekStart: parsed.data.weekStart,
    })
    .returning();

  res.status(201).json({
    id: goal.id,
    subject: goal.subject,
    targetMinutes: goal.targetMinutes,
    weekStart: goal.weekStart,
    achieved: false,
    actualMinutes: 0,
  });
});

export default router;
