import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db";
import { CreateSessionBody, ListSessionsQueryParams, GetSessionStatsQueryParams } from "@workspace/api-zod";
import { desc, gte, eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/sessions", async (req, res) => {
  const parsed = ListSessionsQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 7) : 7;
  const subject = parsed.success ? parsed.data.subject : undefined;
  const category = parsed.success ? parsed.data.category : undefined;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const conditions = [gte(sessionsTable.createdAt, since)];
  if (subject) conditions.push(eq(sessionsTable.subject, subject));
  if (category) conditions.push(eq(sessionsTable.category, category));

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(and(...conditions))
    .orderBy(desc(sessionsTable.createdAt));

  res.json(
    sessions.map((s) => ({
      id: s.id,
      subject: s.subject,
      category: s.category,
      durationMinutes: s.durationMinutes,
      quality: s.quality,
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/sessions", async (req, res) => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(sessionsTable)
    .values({
      subject: parsed.data.subject,
      category: parsed.data.category,
      durationMinutes: parsed.data.durationMinutes,
      quality: parsed.data.quality,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    id: session.id,
    subject: session.subject,
    category: session.category,
    durationMinutes: session.durationMinutes,
    quality: session.quality,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
  });
});

router.get("/sessions/stats", async (req, res) => {
  const parsed = GetSessionStatsQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(gte(sessionsTable.createdAt, since))
    .orderBy(desc(sessionsTable.createdAt));

  const totalMinutesToday = allSessions
    .filter((s) => s.createdAt >= today)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const totalMinutesWeek = allSessions
    .filter((s) => s.createdAt >= weekAgo)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  // Consistency: % of last 7 days with at least one session
  const daysWithSessions = new Set(
    allSessions
      .filter((s) => s.createdAt >= weekAgo)
      .map((s) => s.createdAt.toISOString().split("T")[0])
  ).size;
  const consistencyPercent = Math.round((daysWithSessions / 7) * 100);

  // Streak
  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const hasSession = allSessions.some(
      (s) => s.createdAt.toISOString().split("T")[0] === dateStr
    );
    if (!hasSession) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // By subject
  const subjectMap = new Map<string, { subject: string; category: string; totalMinutes: number }>();
  for (const s of allSessions) {
    const key = s.subject;
    if (!subjectMap.has(key)) {
      subjectMap.set(key, { subject: s.subject, category: s.category, totalMinutes: 0 });
    }
    subjectMap.get(key)!.totalMinutes += s.durationMinutes;
  }

  // Last 7 days breakdown
  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().split("T")[0], 0);
  }
  for (const s of allSessions.filter((s) => s.createdAt >= weekAgo)) {
    const dateStr = s.createdAt.toISOString().split("T")[0];
    if (dayMap.has(dateStr)) {
      dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + s.durationMinutes);
    }
  }

  res.json({
    totalMinutesToday,
    totalMinutesWeek,
    consistencyPercent,
    streak,
    bySubject: Array.from(subjectMap.values()),
    last7Days: Array.from(dayMap.entries()).map(([date, totalMinutes]) => ({ date, totalMinutes })),
  });
});

export default router;
