import { Router } from "express";
import { db } from "@workspace/db";
import { userConfigTable } from "@workspace/db";
import { UpdateUserConfigBody } from "@workspace/api-zod";

const router = Router();

async function getOrCreateConfig() {
  const existing = await db.select().from(userConfigTable).limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(userConfigTable)
    .values({ name: "Estudante", prioritySubjects: "[]" })
    .returning();
  return created;
}

router.get("/user/config", async (req, res) => {
  const config = await getOrCreateConfig();
  res.json({
    id: config.id,
    name: config.name,
    prioritySubjects: JSON.parse(config.prioritySubjects ?? "[]"),
    createdAt: config.createdAt.toISOString(),
  });
});

router.put("/user/config", async (req, res) => {
  const parsed = UpdateUserConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const config = await getOrCreateConfig();
  const [updated] = await db
    .update(userConfigTable)
    .set({
      name: parsed.data.name,
      prioritySubjects: JSON.stringify(parsed.data.prioritySubjects ?? []),
    })
    .returning();

  res.json({
    id: updated.id,
    name: updated.name,
    prioritySubjects: JSON.parse(updated.prioritySubjects ?? "[]"),
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
