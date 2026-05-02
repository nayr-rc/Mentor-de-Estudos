import { Router } from "express";
import { db } from "@workspace/db";
import { trainingExercisesTable } from "@workspace/db";
import { eq, and, like, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// GET /training/exercises
router.get("/training/exercises", async (req, res) => {
  const { category, difficulty, status, search } = req.query as Record<string, string>;

  let query = db.select().from(trainingExercisesTable);

  const conditions = [];
  if (category) conditions.push(eq(trainingExercisesTable.category, category));
  if (difficulty) conditions.push(eq(trainingExercisesTable.difficulty, difficulty));
  if (status) conditions.push(eq(trainingExercisesTable.status, status));

  const rows = await (conditions.length > 0
    ? db.select().from(trainingExercisesTable).where(and(...conditions))
    : db.select().from(trainingExercisesTable));

  const filtered = search
    ? rows.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  res.json(filtered);
});

// PUT /training/exercises/:id/progress — update status/notes/attempts
const progressSchema = z.object({
  status: z.enum(["pending", "in_progress", "solved", "skipped"]).optional(),
  notes: z.string().optional(),
});

router.put("/training/exercises/:id/progress", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }

  const existing = await db.select().from(trainingExercisesTable).where(eq(trainingExercisesTable.id, id));
  if (!existing.length) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Partial<typeof trainingExercisesTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "solved" && !existing[0].solvedAt) {
      updates.solvedAt = new Date();
    }
    // Increment attempts when moving to in_progress or solved
    if (parsed.data.status === "in_progress" || parsed.data.status === "solved") {
      updates.attempts = (existing[0].attempts ?? 0) + 1;
    }
  }

  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes;
  }

  const [updated] = await db
    .update(trainingExercisesTable)
    .set(updates)
    .where(eq(trainingExercisesTable.id, id))
    .returning();

  res.json(updated);
});

// GET /training/stats
router.get("/training/stats", async (_req, res) => {
  const rows = await db.select().from(trainingExercisesTable);
  const total = rows.length;
  const solved = rows.filter(r => r.status === "solved").length;
  const inProgress = rows.filter(r => r.status === "in_progress").length;
  const byCategory: Record<string, { total: number; solved: number }> = {};
  const byDifficulty: Record<string, { total: number; solved: number }> = {};

  for (const r of rows) {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, solved: 0 };
    byCategory[r.category].total++;
    if (r.status === "solved") byCategory[r.category].solved++;

    if (!byDifficulty[r.difficulty]) byDifficulty[r.difficulty] = { total: 0, solved: 0 };
    byDifficulty[r.difficulty].total++;
    if (r.status === "solved") byDifficulty[r.difficulty].solved++;
  }

  res.json({
    total,
    solved,
    inProgress,
    pending: rows.filter(r => r.status === "pending").length,
    byCategory: Object.entries(byCategory).map(([cat, s]) => ({ category: cat, ...s })),
    byDifficulty: Object.entries(byDifficulty).map(([diff, s]) => ({ difficulty: diff, ...s })),
  });
});

export default router;
