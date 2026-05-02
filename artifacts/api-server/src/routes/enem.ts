import { Router } from "express";
import { db } from "@workspace/db";
import { enemPracticeTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();
const ENEM_API = "https://api.enem.dev/v1";

// GET /enem/exams — list available years
router.get("/enem/exams", async (req, res) => {
  try {
    const resp = await fetch(`${ENEM_API}/exams`);
    if (!resp.ok) throw new Error("ENEM API error");
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(502).json({ error: "Failed to fetch exams" });
  }
});

// GET /enem/exams/:year/questions — proxy questions for a year
router.get("/enem/exams/:year/questions", async (req, res) => {
  const { year } = req.params;
  const { discipline, limit = "10", offset = "0", language } = req.query as Record<string, string>;

  try {
    const params = new URLSearchParams({ limit, offset });
    if (discipline) params.set("discipline", discipline);
    if (language) params.set("language", language);

    const url = `${ENEM_API}/exams/${year}/questions?${params}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("ENEM API error");
    const data = await resp.json();

    // Enrich with user practice status for this question set
    const questions = data.questions ?? [];
    const practiceRecords = await db
      .select()
      .from(enemPracticeTable)
      .where(eq(enemPracticeTable.year, parseInt(year)));

    const practiceMap = new Map(
      practiceRecords.map((r) => [`${r.year}-${r.questionIndex}`, r])
    );

    const enriched = questions.map((q: any) => ({
      ...q,
      practice: practiceMap.get(`${year}-${q.index}`) ?? null,
    }));

    res.json({ ...data, questions: enriched });
  } catch (err) {
    req.log.error(err);
    res.status(502).json({ error: "Failed to fetch questions" });
  }
});

// POST /enem/practice — record an answer
const practiceSchema = z.object({
  year: z.number().int(),
  questionIndex: z.number().int(),
  discipline: z.string(),
  selectedAlternative: z.string().min(1).max(1),
  correctAlternative: z.string().min(1).max(1),
  timeSpentSeconds: z.number().int().optional(),
});

router.post("/enem/practice", async (req, res) => {
  const parsed = practiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { year, questionIndex, discipline, selectedAlternative, correctAlternative, timeSpentSeconds } = parsed.data;
  const isCorrect = selectedAlternative.toUpperCase() === correctAlternative.toUpperCase();

  const [record] = await db
    .insert(enemPracticeTable)
    .values({ year, questionIndex, discipline, selectedAlternative, correctAlternative, isCorrect, timeSpentSeconds: timeSpentSeconds ?? null })
    .returning();

  res.status(201).json(record);
});

// GET /enem/practice/stats — statistics
router.get("/enem/practice/stats", async (_req, res) => {
  const records = await db
    .select()
    .from(enemPracticeTable)
    .orderBy(desc(enemPracticeTable.createdAt));

  const total = records.length;
  const correct = records.filter((r) => r.isCorrect).length;
  const byDiscipline: Record<string, { total: number; correct: number }> = {};

  for (const r of records) {
    if (!byDiscipline[r.discipline]) byDiscipline[r.discipline] = { total: 0, correct: 0 };
    byDiscipline[r.discipline].total++;
    if (r.isCorrect) byDiscipline[r.discipline].correct++;
  }

  const disciplineStats = Object.entries(byDiscipline).map(([discipline, s]) => ({
    discipline,
    total: s.total,
    correct: s.correct,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  res.json({
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    byDiscipline: disciplineStats,
    recentAnswers: records.slice(0, 20),
  });
});

export default router;
