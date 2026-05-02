import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, habitsTable, questionsTable, goalsTable, mentorInsightsTable, userConfigTable } from "@workspace/db";
import { desc, gte, eq } from "drizzle-orm";

const router = Router();

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

router.get("/dashboard", async (req, res) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const weekStart = getCurrentWeekStart();

  // Fetch all data in parallel
  const [allSessions, habits, questions, goals, insights, userConfigs] = await Promise.all([
    db.select().from(sessionsTable).where(gte(sessionsTable.createdAt, monthAgo)).orderBy(desc(sessionsTable.createdAt)),
    db.select().from(habitsTable).where(gte(habitsTable.createdAt, weekAgo)).orderBy(desc(habitsTable.createdAt)),
    db.select().from(questionsTable).where(gte(questionsTable.createdAt, monthAgo)),
    db.select().from(goalsTable).where(eq(goalsTable.weekStart, weekStart)),
    db.select().from(mentorInsightsTable).orderBy(desc(mentorInsightsTable.createdAt)).limit(1),
    db.select().from(userConfigTable).limit(1),
  ]);

  const userName = userConfigs[0]?.name ?? "Estudante";

  const totalMinutesToday = allSessions
    .filter((s) => s.createdAt >= today)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const totalMinutesWeek = allSessions
    .filter((s) => s.createdAt >= weekAgo)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

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

  // Subject breakdown
  const subjectMap = new Map<string, { subject: string; category: string; totalMinutes: number }>();
  for (const s of allSessions) {
    if (!subjectMap.has(s.subject)) {
      subjectMap.set(s.subject, { subject: s.subject, category: s.category, totalMinutes: 0 });
    }
    subjectMap.get(s.subject)!.totalMinutes += s.durationMinutes;
  }

  // Last 7 days
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

  // Question stats
  const qStatMap = new Map<string, { total: number; correct: number; wrong: number; skipped: number }>();
  for (const q of questions) {
    if (!qStatMap.has(q.subject)) {
      qStatMap.set(q.subject, { total: 0, correct: 0, wrong: 0, skipped: 0 });
    }
    const stat = qStatMap.get(q.subject)!;
    stat.total++;
    if (q.result === "correct") stat.correct++;
    else if (q.result === "wrong") stat.wrong++;
    else stat.skipped++;
  }

  const questionStats = Array.from(qStatMap.entries()).map(([subject, stat]) => ({
    subject,
    total: stat.total,
    correct: stat.correct,
    wrong: stat.wrong,
    skipped: stat.skipped,
    accuracyPercent: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
  }));

  // Medicine index: average accuracy of ENEM subjects
  const enemSubjects = ["biologia", "quimica", "fisica", "matematica", "redacao", "ch", "lc"];
  const enemStats = questionStats.filter((s) => enemSubjects.some((e) => s.subject.toLowerCase().includes(e)));
  const medicineIndex = enemStats.length > 0
    ? Math.round(enemStats.reduce((sum, s) => sum + s.accuracyPercent, 0) / enemStats.length)
    : 0;

  // Code index: coding hours vs target (60h/month target)
  const codeMinutes = allSessions
    .filter((s) => s.category === "programacao")
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const codeIndex = Math.min(100, Math.round((codeMinutes / (60 * 60)) * 100));

  // Today's habits
  const todayHabit = habits.find((h) => h.date === todayStr);

  // Goals with actual minutes
  const weekStartDate = new Date(weekStart);
  const weekSessions = allSessions.filter((s) => s.createdAt >= weekStartDate);
  const minutesBySubject = new Map<string, number>();
  for (const s of weekSessions) {
    minutesBySubject.set(s.subject, (minutesBySubject.get(s.subject) ?? 0) + s.durationMinutes);
  }

  const goalsWithActual = goals.map((g) => ({
    id: g.id,
    subject: g.subject,
    targetMinutes: g.targetMinutes,
    weekStart: g.weekStart,
    achieved: g.subject ? (minutesBySubject.get(g.subject) ?? 0) >= g.targetMinutes : false,
    actualMinutes: g.subject ? (minutesBySubject.get(g.subject) ?? 0) : 0,
  }));

  const recentSessions = allSessions.slice(0, 5).map((s) => ({
    id: s.id,
    subject: s.subject,
    category: s.category,
    durationMinutes: s.durationMinutes,
    quality: s.quality,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  }));

  res.json({
    sessionStats: {
      totalMinutesToday,
      totalMinutesWeek,
      consistencyPercent,
      streak,
      bySubject: Array.from(subjectMap.values()),
      last7Days: Array.from(dayMap.entries()).map(([date, totalMinutes]) => ({ date, totalMinutes })),
    },
    todayHabits: todayHabit
      ? {
          id: todayHabit.id,
          date: todayHabit.date,
          sleepHours: todayHabit.sleepHours,
          exerciseDone: todayHabit.exerciseDone,
          meditationDone: todayHabit.meditationDone,
          waterLiters: todayHabit.waterLiters,
          mood: todayHabit.mood,
          createdAt: todayHabit.createdAt.toISOString(),
        }
      : null,
    questionStats,
    goals: goalsWithActual,
    recentSessions,
    medicineIndex,
    codeIndex,
    streak,
    userName,
    latestInsight: insights[0]?.insight ?? null,
  });
});

export default router;
