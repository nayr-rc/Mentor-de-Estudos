import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable } from "@workspace/db";
import { CreateQuestionBody, ListQuestionsQueryParams } from "@workspace/api-zod";
import { desc, gte, eq, and, count, sql } from "drizzle-orm";

const router = Router();

router.get("/questions", async (req, res) => {
  const parsed = ListQuestionsQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;
  const subject = parsed.success ? parsed.data.subject : undefined;
  const result = parsed.success ? parsed.data.result : undefined;
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const conditions = [gte(questionsTable.createdAt, since)];
  if (subject) conditions.push(eq(questionsTable.subject, subject));
  if (result) conditions.push(eq(questionsTable.result, result));

  const [{ total }] = await db
    .select({ total: count() })
    .from(questionsTable)
    .where(and(...conditions));

  const questions = await db
    .select()
    .from(questionsTable)
    .where(and(...conditions))
    .orderBy(desc(questionsTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json({
    data: questions.map((q) => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      result: q.result,
      difficulty: q.difficulty,
      source: q.source,
      createdAt: q.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

router.post("/questions", async (req, res) => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db
    .insert(questionsTable)
    .values({
      subject: parsed.data.subject,
      topic: parsed.data.topic ?? null,
      result: parsed.data.result,
      difficulty: parsed.data.difficulty ?? null,
      source: parsed.data.source ?? null,
    })
    .returning();

  res.status(201).json({
    id: question.id,
    subject: question.subject,
    topic: question.topic,
    result: question.result,
    difficulty: question.difficulty,
    source: question.source,
    createdAt: question.createdAt.toISOString(),
  });
});

router.get("/questions/stats", async (req, res) => {
  const allQuestions = await db.select().from(questionsTable);

  const statMap = new Map<string, { total: number; correct: number; wrong: number; skipped: number }>();

  for (const q of allQuestions) {
    if (!statMap.has(q.subject)) {
      statMap.set(q.subject, { total: 0, correct: 0, wrong: 0, skipped: 0 });
    }
    const stat = statMap.get(q.subject)!;
    stat.total++;
    if (q.result === "correct") stat.correct++;
    else if (q.result === "wrong") stat.wrong++;
    else stat.skipped++;
  }

  res.json(
    Array.from(statMap.entries()).map(([subject, stat]) => ({
      subject,
      total: stat.total,
      correct: stat.correct,
      wrong: stat.wrong,
      skipped: stat.skipped,
      accuracyPercent: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }))
  );
});

export default router;
