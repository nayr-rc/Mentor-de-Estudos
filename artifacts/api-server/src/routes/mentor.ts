import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, habitsTable, questionsTable, goalsTable, mentorInsightsTable, userConfigTable } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { desc, gte } from "drizzle-orm";

const router = Router();

const SYSTEM_PROMPT = `Você é o Mentor IA — um coach de estudos pessoal, direto e analítico.
O usuário está se preparando para o ENEM com foco em Medicina,
e também desenvolve habilidades em programação.

Seu estilo: objetivo, sem enrolação, usa dados reais do histórico para
embasar cada recomendação. Quando apropriado, dê estimativas numéricas
(ex: "estudar isso hoje aumenta sua consistência semanal em ~12%").
Não seja genérico — use os dados do contexto para personalizar.
Responda sempre em português brasileiro.`;

async function buildContext() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [sessions, habits, questions, goals, userConfigs] = await Promise.all([
    db.select().from(sessionsTable).where(gte(sessionsTable.createdAt, weekAgo)).orderBy(desc(sessionsTable.createdAt)),
    db.select().from(habitsTable).where(gte(habitsTable.createdAt, weekAgo)).orderBy(desc(habitsTable.createdAt)),
    db.select().from(questionsTable).where(gte(questionsTable.createdAt, monthAgo)),
    db.select().from(goalsTable),
    db.select().from(userConfigTable).limit(1),
  ]);

  const userName = userConfigs[0]?.name ?? "Estudante";

  const daysWithSessions = new Set(
    sessions.map((s) => s.createdAt.toISOString().split("T")[0])
  ).size;
  const consistencyPercent = Math.round((daysWithSessions / 7) * 100);

  const totalMinutesWeek = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const avgSleep =
    habits.length > 0
      ? (habits.reduce((sum, h) => sum + (h.sleepHours ?? 0), 0) / habits.length).toFixed(1)
      : "N/A";

  const qStatMap = new Map<string, { total: number; correct: number }>();
  for (const q of questions) {
    if (!qStatMap.has(q.subject)) qStatMap.set(q.subject, { total: 0, correct: 0 });
    qStatMap.get(q.subject)!.total++;
    if (q.result === "correct") qStatMap.get(q.subject)!.correct++;
  }

  const now = new Date();
  const hours = now.getHours();
  const period = hours < 12 ? "manhã" : hours < 18 ? "tarde" : "noite";
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  return `=== CONTEXTO DO USUÁRIO (${dayNames[now.getDay()]}, ${period}) ===
Nome: ${userName}

ÚLTIMAS 7 SESSÕES DE ESTUDO:
${sessions
  .slice(0, 7)
  .map((s) => `- ${s.subject} (${s.category}): ${s.durationMinutes}min, qualidade ${s.quality}/5, ${s.createdAt.toLocaleDateString("pt-BR")}`)
  .join("\n") || "Nenhuma sessão registrada"}

CONSISTÊNCIA SEMANAL: ${consistencyPercent}% (${daysWithSessions}/7 dias com estudo)
TOTAL DE MINUTOS ESTA SEMANA: ${totalMinutesWeek}min (${Math.round(totalMinutesWeek / 60)}h)

SONO (média 7 dias): ${avgSleep}h
HÁBITOS RECENTES: ${habits.length > 0 ? `exercício ${habits.filter((h) => h.exerciseDone).length}/${habits.length} dias, humor médio ${(habits.reduce((sum, h) => sum + (h.mood ?? 3), 0) / habits.length).toFixed(1)}/5` : "sem dados"}

TAXA DE ACERTO POR MATÉRIA (últimos 30 dias):
${Array.from(qStatMap.entries())
  .map(([subj, s]) => `- ${subj}: ${s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0}% (${s.correct}/${s.total} questões)`)
  .join("\n") || "Sem questões registradas"}

METAS DA SEMANA:
${goals.map((g) => `- ${g.subject ?? "Geral"}: ${g.targetMinutes}min alvo`).join("\n") || "Sem metas definidas"}
===`;
}

function estimateImpact(subject: string, durationMinutes: number, accuracy: number) {
  const consistencyDelta = durationMinutes >= 45 ? 0.08 : 0.03;
  const accuracyDelta = (durationMinutes / 60) * 0.02;
  const weaknessMultiplier = accuracy < 50 ? 1.8 : 1.0;
  return {
    consistencyGain: (consistencyDelta * 100).toFixed(1) + "%",
    estimatedAccuracyGain: (accuracyDelta * weaknessMultiplier * 100).toFixed(1) + "%",
  };
}

router.post("/mentor/insight", async (req, res) => {
  const context = await buildContext();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${context}\n\nGere um insight curto e direto (2-4 linhas) focado em uma ação imediata que o usuário pode tomar agora para melhorar seu desempenho. Seja específico com dados do contexto. Sem introduções genéricas.`,
      },
    ],
  });

  const block = message.content[0];
  const insight = block.type === "text" ? block.text : "Continue estudando com consistência!";

  // Cache the insight
  await db.insert(mentorInsightsTable).values({
    insight,
    type: "daily",
  });

  res.json({ insight, type: "daily" });
});

router.post("/mentor/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const context = await buildContext();

  const systemWithContext = `${SYSTEM_PROMPT}\n\n${context}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  let fullResponse = "";

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemWithContext,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Erro ao processar resposta" })}\n\n`);
    res.end();
  }
});

export default router;
